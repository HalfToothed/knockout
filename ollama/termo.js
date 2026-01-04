#!/usr/bin/env node

const https = require('http');
const { exec } = require('child_process');
const readline = require('readline');
const os = require('os');

class TerminalAssistant {
  constructor(ollamaUrl = 'http://localhost:11434', model = 'llama3.1') {
    this.ollamaUrl = ollamaUrl;
    this.model = model;
    this.osInfo = this.getOsInfo();
  }

  getOsInfo() {
    const platform = os.platform();
    if (platform === 'win32') return 'Windows PowerShell';
    if (platform === 'darwin') return 'macOS/Unix';
    return 'Linux/Unix';
  }

  async generateCommand(naturalLanguage) {
    const prompt = `You are a ${this.osInfo} command line expert. Convert this natural language request into a shell command.

User request: ${naturalLanguage}

Respond ONLY with a JSON object in this exact format:
{
    "command": "the actual command to run",
    "explanation": "brief explanation of what the command does",
    "safety": "safe" or "dangerous"
}

Important:
- For Windows, use PowerShell commands
- For Linux/macOS, use bash commands
- Mark commands that delete/modify files as "dangerous"
- Keep commands simple and practical
- Only output the JSON, nothing else`;

    try {
      const response = await this.callOllama(prompt);
      
      // Clean up response and try to parse JSON
      let cleanResponse = response.trim()
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      
      try {
        return JSON.parse(cleanResponse);
      } catch (e) {
        // Fallback if JSON parsing fails
        return {
          command: cleanResponse.split('\n')[0],
          explanation: 'Generated command',
          safety: 'unknown'
        };
      }
    } catch (error) {
      return { error: error.message };
    }
  }

  async explainError(command, errorOutput) {
    const prompt = `A command failed with an error. Explain what went wrong and suggest a fix.

Command: ${command}
Error: ${errorOutput}

Provide:
1. What the error means
2. Why it happened
3. How to fix it

Keep it concise and practical.`;

    try {
      return await this.callOllama(prompt);
    } catch (error) {
      return `Error getting explanation: ${error.message}`;
    }
  }

  async callOllama(prompt) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        model: this.model,
        prompt: prompt,
        stream: false
      });

      const options = {
        hostname: 'localhost',
        port: 11434,
        path: '/api/generate',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        },
        timeout: 30000
      };

      const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseData);
            resolve(parsed.response || '');
          } catch (e) {
            reject(new Error('Failed to parse Ollama response'));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timed out'));
      });

      req.write(data);
      req.end();
    });
  }

  async executeCommand(command) {
    return new Promise((resolve) => {
      const isWindows = os.platform() === 'win32';
      const cmd = isWindows ? `powershell -Command "${command}"` : command;
      
      exec(cmd, { timeout: 30000 }, (error, stdout, stderr) => {
        if (error) {
          resolve({
            exitCode: error.code || 1,
            stdout: stdout || '',
            stderr: stderr || error.message
          });
        } else {
          resolve({
            exitCode: 0,
            stdout: stdout || '',
            stderr: stderr || ''
          });
        }
      });
    });
  }
}

// Color utilities
const colors = {
  red: '\x1b[91m',
  green: '\x1b[92m',
  yellow: '\x1b[93m',
  blue: '\x1b[94m',
  cyan: '\x1b[96m',
  reset: '\x1b[0m'
};

function printColored(text, color) {
  console.log(`${colors[color] || ''}${text}${colors.reset}`);
}

// Readline utility for user input
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Smart Terminal Assistant\n');
    console.log('Usage:');
    console.log('  node smart_terminal.js <natural language command>');
    console.log('\nExamples:');
    console.log('  node smart_terminal.js "find all javascript files"');
    console.log('  node smart_terminal.js "show disk usage"');
    console.log('  node smart_terminal.js "list processes using port 8080"');
    console.log('\nOptions:');
    console.log('  --explain <command> : Explain what a command does');
    process.exit(0);
  }

  const assistant = new TerminalAssistant();

  // Handle explain mode
  if (args[0] === '--explain' && args.length > 1) {
    const command = args.slice(1).join(' ');
    printColored(`\n🤔 Analyzing command: ${command}`, 'cyan');
    const explanation = await assistant.explainError(command, '');
    printColored(`\n${explanation}`, 'blue');
    process.exit(0);
  }

  // Get natural language input
  const userInput = args.join(' ');

  printColored(`\n🤖 Understanding: ${userInput}`, 'cyan');

  // Generate command
  const result = await assistant.generateCommand(userInput);

  if (result.error) {
    printColored(`\n❌ Error: ${result.error}`, 'red');
    process.exit(1);
  }

  const { command, explanation, safety } = result;

  // Display generated command
  printColored('\n💡 Generated command:', 'green');
  console.log(`   ${command}`);
  printColored('\n📝 Explanation:', 'blue');
  console.log(`   ${explanation}`);

  // Safety warning
  if (safety === 'dangerous') {
    printColored('\n⚠️  Warning: This command may modify or delete files!', 'yellow');
  }

  // Ask for confirmation
  let response = await askQuestion('\n❓ Execute this command? (y/n/e for explain): ');
  response = response.toLowerCase().trim();

  if (response === 'e') {
    printColored('\n🔍 Getting detailed explanation...', 'cyan');
    const detailed = await assistant.explainError(command, '');
    printColored(`\n${detailed}`, 'blue');

    response = await askQuestion('\n❓ Execute now? (y/n): ');
    response = response.toLowerCase().trim();
  }

  if (response !== 'y') {
    console.log('Cancelled.');
    process.exit(0);
  }

  // Execute command
  printColored('\n⚡ Executing...', 'cyan');
  const execResult = await assistant.executeCommand(command);

  // Display results
  if (execResult.exitCode === 0) {
    printColored('\n✅ Success!', 'green');
    if (execResult.stdout) {
      console.log(execResult.stdout);
    }
  } else {
    printColored(`\n❌ Command failed (exit code: ${execResult.exitCode})`, 'red');
    if (execResult.stderr) {
      printColored('\nError output:', 'red');
      console.log(execResult.stderr);
    }

    // Offer to explain the error
    const explain = await askQuestion('\n❓ Would you like an explanation? (y/n): ');
    if (explain.toLowerCase().trim() === 'y') {
      printColored('\n🔍 Analyzing error...', 'cyan');
      const explanation = await assistant.explainError(command, execResult.stderr);
      printColored(`\n${explanation}`, 'blue');
    }
  }
}

// Run main function
main().catch((error) => {
  printColored(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});