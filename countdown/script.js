let title = "";
let text = "";
let date = "";
let list = "";

let allData = []
let id = 0

function submitButton() {
  title = document.getElementById("title").value;
  text = document.getElementById("text").value;
  date = document.getElementById("date").value;
  id += 1

  let person = {
    Id : id,
    Title : title,
    Des: text,
    Date: date
  }

  allData.push(person);

  list = document.getElementById("list")

  let obj = ""
  
  for(var i in allData){
    obj += `<li id=${allData[i].Id}>
                <span>${allData[i].Title}</span>
                <button onClick="Remove(${allData[i].Id})">Remove</button>
            </li>`    
  }

  list.innerHTML = obj

  console.log(allData)

}

function Remove(num){
    let l = document.getElementById(num)
    list.removeChild(l);

    let ind = allData.findIndex(v => v.Id === num);
    allData.splice(ind, 1);
}
