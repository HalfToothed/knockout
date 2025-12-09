let intervalId = "";
let title = "";
let text = "";
let date = "";
let list = "";
let appDiv = document.getElementById("app");
let countdownDiv = document.getElementById("countdown");

let allData = [];
let id = 0;

function submitButton() {
  title = document.getElementById("title").value;
  text = document.getElementById("text").value;
  date = document.getElementById("date").value;
  id += 1;

  let person = {
    Id: id,
    Title: title,
    Des: text,
    Date: date,
  };

  allData.push(person);

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

  let d = parseLocalDate(result.Date);

  let mil = 0;
  debugger;

  var timer = function(){
    
    let now = Date.now();
    mil = d - now;

    if(mil == 0){
      clearInterval(intervalId)
    }

    let time = convertMiliseconds(mil);

    countdownDiv.innerHTML = `<h3>${result.Title}</h3> <br/><br/>
                            <h1>${time.days}:${time.hours}:${time.minutes}:${time.seconds}</h1>
                            <button>Back</button>`;
  }

  intervalId = setInterval(timer,1000);

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
