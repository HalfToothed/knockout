let title = "";
let text = "";
let date = "";

let allData = []

function submitButton() {
  title = document.getElementById("title").value;
  text = document.getElementById("text").value;
  date = document.getElementById("date").value;

  let person = {
    Title : title,
    Des: text,
    Date: date
  }

  allData.push(person);

  console.log(allData);
}

