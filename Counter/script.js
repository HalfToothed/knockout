document.getElementById("increment").addEventListener("click", increment);
document.getElementById("decrement").addEventListener("click", decrement);
document.getElementById("undo").addEventListener("click", handleUndo);
document.getElementById("redo").addEventListener("click", handleRedo);

let counter = document.getElementById("count");
let count = 0
let undoStack = []
let redoStack = []

function increment(){
    undoStack.push(count)
    count = count + 1   
    counter.innerHTML = count
}

function decrement(){
    undoStack.push(count)
    if (count > 0){
        count = count -1
        counter.innerHTML = count
    }
}

function handleUndo(){
    let value = undoStack.pop()
    if(value != undefined) 
    {
        redoStack.push(count)
        counter.innerHTML = value
        count = value
    }   
}

function handleRedo(){
    let value = redoStack.pop()
    if(value != undefined){

        undoStack.push(count)
        counter.innerHTML = value
        count = value
    }
}
