import { start } from './src/main/httpomate/brain.js';
const fileInput = document.getElementById('file');

let latestResults = []

document.getElementById('run-tests').addEventListener('click', () => {

  // Get the selected file
  const testFile = fileInput.files[0];
  if (testFile.name === "tests.json") {
    start(testFile)
  } else {
    console.log('Test file must be called: tests.json')
    alert('Test file must be called: tests.json')
  }

  //   // Create a new FileReader object
  //   const reader = new FileReader();

  //     // Get the selected file
  //     // Get the file name
  //     const fileName = file.name;

  //     // Log the file name to the console
  //     console.log('File name:', file);

  //   reader.addEventListener('load', () => {
  //     // Get the file contents as text
  //     const fileContents = reader.result;

  //     // Do something with the file contents (e.g. run tests)
  //     console.log('File contents:', fileContents);

  //     console.log(reader)
  //   });

  //   // Read the selected file as text
  //   reader.readAsText(file);
  // start()
})

var testDropdown = document.getElementById("testDropdown");
var testTable = document.getElementById("testTable");

function clearTestDropdown() {
  const dropdown = document.getElementById('testDropdown');
  dropdown.innerHTML = '';
}


function updateView(results) {
  console.log(results)
  latestResults = results

  clearTestDropdown()

  for(var i=0; i < results.length; i++) {
    var option = document.createElement("option");
    option.text = results[i].testName;
    option.value = results[i].testName;
    testDropdown.add(option);
  }

  updateStepTable()
}

testDropdown.addEventListener("change", function() {

  updateStepTable()
  
});

function updateStepTable() {
  var selectedTest = testDropdown.value;

  for(var i=0; i < latestResults.length; i++) {
    if(latestResults[i].testName === selectedTest) {

      let stepResults = latestResults[i].stepResults
      var tableHTML = "<table style='border-collapse: collapse; width: 100%;'>";
      tableHTML += "<tr style='border-bottom: 1px solid #ddd;'><th style=' text-align: left;padding: 8px;'>Step</th><th style='text-align: left;padding: 8px;'>Result</th><th style='text-align: left;padding: 8px;'>Action</th><th style=' text-align: left;padding: 8px;'>Action Message</th><th style=' text-align: left;padding: 8px;'>Error message</th></tr>";
      for(var i=0; i < stepResults.length; i++) {
        if(!stepResults[i].error) {
          stepResults[i].error = ""
        }
        if(stepResults[i].result === "Pass") {
          tableHTML += "<tr style='border-bottom: 1px solid #ddd;'><td style='text-align: left;padding: 8px;'>"+stepResults[i].name+"</td><td style='text-align: left;padding: 8px;background-color: #4CAF50;'>"+stepResults[i].result+"</td><td style='text-align: left;padding: 8px;'>"+stepResults[i].actionName+"</td><td style='text-align: left;padding: 8px;'>"+stepResults[i].actionMessage+"</td><td style='text-align: left;padding: 8px;'>"+stepResults[i].error+"</td></tr>";
        } else {
          tableHTML += "<tr style='border-bottom: 1px solid #ddd;'><td style='text-align: left;padding: 8px;'>"+stepResults[i].name+"</td><td style='text-align: left;padding: 8px;background-color: #ff0000;'>"+stepResults[i].result+"</td><td style='text-align: left;padding: 8px;'>"+stepResults[i].error+"</td><td style='text-align: left;padding: 8px;'>"+stepResults[i].actionMessage+"</td><td style='text-align: left;padding: 8px;'>"+stepResults[i].error+"</td></tr>";
        }
      }
      tableHTML += "</table>";
      testTable.innerHTML = tableHTML;
    }
  }
}


export { updateView }