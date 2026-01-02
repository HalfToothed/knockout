let intervalId = "";
let title = "";
let text = "";
let date = "";
let list = "";
let appDiv = document.getElementById("app");
let countdownDiv = document.getElementById("countdown");
countdownDiv.style.display = "none";

// Retrieving the string
let retString = localStorage.getItem("key")

let allData = JSON.parse(retString) || [];

let id = 0;

const input = document.getElementById("date");

const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, "0");
const day = String(today.getDate() + 1).padStart(2, "0");

input.min = `${year}-${month}-${day}`;

function submitButton() {
  title = document.getElementById("title").value;
  text = document.getElementById("text").value;
  date = document.getElementById("date").value;

  id = new Date().getTime();

  let person = {
    Id: id,
    Title: title,
    Des: text,
    Date: date,
  };

  
  allData.push(person);
  let newData = JSON.stringify(allData)
  localStorage.clear();
  localStorage.setItem('key', newData);


  list = document.getElementById("list");

  let obj = "";

  for (var i in allData) {
    obj += `<li id=${allData[i].Id} onClick="OpenCountdown(${allData[i].Id})">
                <span>${allData[i].Title}</span>
                <button onClick="Remove(${allData[i].Id}); event.stopPropagation();">Remove</button>
            </li>`;
  }

  list.innerHTML = obj;
}

function Remove(num) {
  let l = document.getElementById(num);
  list.removeChild(l);

  let ind = allData.findIndex((v) => v.Id === num);
  allData.splice(ind, 1);
}

function OpenCountdown(id) {
  var result = allData.find((obj) => obj.Id === id);

  appDiv.style.display = "none";
  countdownDiv.style.display = "";
  
  let parsedDate = parseLocalDate(result.Date);

  let mil = 0;

  var timer = function(){
    
    let now = Date.now();
    mil = parsedDate - now;

    if(mil == 0){
      clearInterval(intervalId)
    }

    let time = convertMiliseconds(mil);
    
    let d = time.days
    if(d < 10){
      d = "0"+d
    }

    let h = time.hours
    if(h < 10){
      h = "0"+h
    }
    
    let m = time.minutes
    if(m < 10){
      m = "0"+m
    }

    let s = time.seconds
    if(s < 10){
      s = "0"+s
    }

    countdownDiv.innerHTML = `<h3>${result.Title}</h3> <br/><br/>
                            <h1>${d}:${h}:${m}:${s}</h1>
                            <button onClick="Back()">Back</button>`;
  }

  intervalId = setInterval(timer,1000);

}

function Back(){  
  countdownDiv.style.display = 'none'
  appDiv.style.display = '';
  clearInterval(intervalId)
}

function convertMiliseconds(ms) {
  let day = Math.floor(ms / (24 * 3600000));
  ms %= 24 * 3600000;
  let hour = Math.floor(ms / 3600000);
  ms %= 3600000;
  let min = Math.floor(ms / 60000);
  ms %= 60000;
  let sec = Math.floor(ms / 1000);

  return {
    days: day,
    hours: hour,
    minutes: min,
    seconds: sec,
  };
}

function parseLocalDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day, 0, 0, 0); // Local midnight
}
