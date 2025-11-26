// Read & compile template
let source = document.getElementById("counter-template").innerHTML;
let template = Handlebars.compile(source);

// State
let count = 0;
let undoStack = [];
let redoStack = [];
let minValue = 0;

// Render function
function render() {
    let data = {
        count,
        undo: undoStack,
        redo: redoStack,
        undoLen: undoStack.length,
        redoLen: redoStack.length,
        decDisabled: count <= minValue,
        undoDisabled: undoStack.length === 0,
        redoDisabled: redoStack.length === 0
    };

    // Render template
    document.getElementById("app").innerHTML = template(data);

    // Reattach events
    document.getElementById("increment").addEventListener("click", increment);
    document.getElementById("decrement").addEventListener("click", decrement);
    document.getElementById("undo").addEventListener("click", handleUndo);
    document.getElementById("redo").addEventListener("click", handleRedo);
}

function pushUndo() {
    undoStack.push(count);
}

function increment() {
    pushUndo();
    redoStack = [];   // New action clears redo
    count++;
    render();
}

function decrement() {
    if (count > minValue) {
        pushUndo();
        redoStack = [];
        count--;
        render();
    }
}

function handleUndo() {
    if (undoStack.length === 0) return;

    let prev = undoStack.pop();
    redoStack.push(count);
    count = prev;
    render();
}

function handleRedo() {
    if (redoStack.length === 0) return;

    let next = redoStack.pop();
    undoStack.push(count);
    count = next;
    render();
}

// Initial display
render();
