import requests
import subprocess
import sys
import json
import os
from typing import Optional, Dict

class TerminalAssistant:
    def __init__(self, ollama_url: str = "http://localhost:11434", model: str = "llama3.1"):
        self.ollama_url = ollama_url
        self.model = model
        self.os_info = self._get_os_info()
    
    def _get_os_info(self) -> str:
        """Detect operating system for context"""
        if sys.platform == "win32":
            return "Windows PowerShell"
        elif sys.platform == "darwin":
            return "macOS/Unix"
        else:
            return "Linux/Unix"
    
    def generate_command(self, natural_language: str) -> Dict:
        """Convert natural language to shell command"""
        prompt = f"""You are a {self.os_info} command line expert. Convert this natural language request into a shell command.

User request: {natural_language}

Respond ONLY with a JSON object in this exact format:
{{
    "command": "the actual command to run",
    "explanation": "brief explanation of what the command does",
    "safety": "safe" or "dangerous"
}}

Important:
- For Windows, use PowerShell commands
- For Linux/macOS, use bash commands
- Mark commands that delete/modify files as "dangerous"
- Keep commands simple and practical
- Only output the JSON, nothing else"""

        try:
            response = requests.post(
                f"{self.ollama_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False
                },
                timeout=60
            )
            
            if response.status_code != 200:
                return {"error": f"Ollama API error: {response.status_code}"}
            
            result = response.json()
            response_text = result.get("response", "").strip()
            
            # Try to extract JSON from response
            response_text = response_text.replace("```json", "").replace("```", "").strip()
            
            try:
                parsed = json.loads(response_text)
                return parsed
            except json.JSONDecodeError:
                # If JSON parsing fails, try to extract command from text
                return {
                    "command": response_text.split("\n")[0],
                    "explanation": "Generated command",
                    "safety": "unknown"
                }
                
        except requests.exceptions.RequestException as e:
            return {"error": f"Connection error: {str(e)}"}
        except Exception as e:
            return {"error": f"Unexpected error: {str(e)}"}
    
    def explain_error(self, command: str, error_output: str) -> str:
        """Explain command errors and suggest fixes"""
        prompt = f"""A command failed with an error. Explain what went wrong and suggest a fix.

Command: {command}
Error: {error_output}

Provide:
1. What the error means
2. Why it happened
3. How to fix it

Keep it concise and practical."""

        try:
            response = requests.post(
                f"{self.ollama_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False
                },
                timeout=30
            )
            
            return response.json().get("response", "Could not generate explanation")
        except Exception as e:
            return f"Error getting explanation: {str(e)}"
    
    def execute_command(self, command: str) -> tuple[int, str, str]:
        """Execute shell command and return exit code, stdout, stderr"""
        try:
            if sys.platform == "win32":
                result = subprocess.run(
                    ["powershell", "-Command", command],
                    capture_output=True,
                    text=True,
                    timeout=30
                )
            else:
                result = subprocess.run(
                    command,
                    shell=True,
                    capture_output=True,
                    text=True,
                    timeout=30
                )
            
            return result.returncode, result.stdout, result.stderr
        except subprocess.TimeoutExpired:
            return -1, "", "Command timed out after 30 seconds"
        except Exception as e:
            return -1, "", str(e)

def print_colored(text: str, color: str):
    """Print colored text (basic ANSI colors)"""
    colors = {
        "red": "\033[91m",
        "green": "\033[92m",
        "yellow": "\033[93m",
        "blue": "\033[94m",
        "cyan": "\033[96m",
        "reset": "\033[0m"
    }
    print(f"{colors.get(color, '')}{text}{colors['reset']}")

def main():
    if len(sys.argv) < 2:
        print("Smart Terminal Assistant")
        print("\nUsage:")
        print("  python smart_terminal.py <natural language command>")
        print("\nExamples:")
        print('  python smart_terminal.py "find all python files"')
        print('  python smart_terminal.py "show disk usage"')
        print('  python smart_terminal.py "list processes using port 8080"')
        print("\nOptions:")
        print("  --explain <command> : Explain what a command does")
        sys.exit(0)
    
    assistant = TerminalAssistant()
    
    # Handle explain mode
    if sys.argv[1] == "--explain" and len(sys.argv) > 2:
        command = " ".join(sys.argv[2:])
        print_colored(f"\n🤔 Analyzing command: {command}", "cyan")
        explanation = assistant.explain_error(command, "")
        print_colored(f"\n{explanation}", "blue")
        sys.exit(0)
    
    # Get natural language input
    user_input = " ".join(sys.argv[1:])
    
    print_colored(f"\n🤖 Understanding: {user_input}", "cyan")
    
    # Generate command
    result = assistant.generate_command(user_input)
    
    if "error" in result:
        print_colored(f"\n❌ Error: {result['error']}", "red")
        sys.exit(1)
    
    command = result.get("command", "")
    explanation = result.get("explanation", "")
    safety = result.get("safety", "unknown")
    
    # Display generated command
    print_colored(f"\n💡 Generated command:", "green")
    print(f"   {command}")
    print_colored(f"\n📝 Explanation:", "blue")
    print(f"   {explanation}")
    
    # Safety warning
    if safety == "dangerous":
        print_colored(f"\n⚠️  Warning: This command may modify or delete files!", "yellow")
    
    # Ask for confirmation
    try:
        response = input("\n❓ Execute this command? (y/n/e for explain): ").lower().strip()
    except KeyboardInterrupt:
        print("\n\nCancelled.")
        sys.exit(0)
    
    if response == 'e':
        print_colored("\n🔍 Getting detailed explanation...", "cyan")
        detailed = assistant.explain_error(command, "")
        print_colored(f"\n{detailed}", "blue")
        
        response = input("\n❓ Execute now? (y/n): ").lower().strip()
    
    if response != 'y':
        print("Cancelled.")
        sys.exit(0)
    
    # Execute command
    print_colored("\n⚡ Executing...", "cyan")
    exit_code, stdout, stderr = assistant.execute_command(command)
    
    # Display results
    if exit_code == 0:
        print_colored("\n✅ Success!", "green")
        if stdout:
            print(stdout)
    else:
        print_colored(f"\n❌ Command failed (exit code: {exit_code})", "red")
        if stderr:
            print_colored(f"\nError output:", "red")
            print(stderr)
        
        # Offer to explain the error
        explain = input("\n❓ Would you like an explanation? (y/n): ").lower().strip()
        if explain == 'y':
            print_colored("\n🔍 Analyzing error...", "cyan")
            explanation = assistant.explain_error(command, stderr)
            print_colored(f"\n{explanation}", "blue")

if __name__ == "__main__":
    main()