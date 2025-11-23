let counter = document.getElementById("count");
let count = 0

function increment(){
    count = count + 1
    counter.innerHTML = count
}

function decrement(){
    if (count > 0){
        count = count -1
        counter.innerHTML = count
    }
    
}