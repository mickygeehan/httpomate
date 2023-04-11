import { start } from './src/main/httpomate/brain.js';
import { ERROR_MESSAGES, CONSTANTS } from './src/main/httpomate/constants.js';
let latestResults = []
var testDropdown = document.getElementById("testDropdown");
var testTable = document.getElementById("testTable");

document.getElementById('run-tests').addEventListener('click', async () => {
  let userFile = getUserInputtedFile()
  if (validateInitialTestsFile(userFile)) {
    await start(userFile).then((testResults) => {
      updateViewWithResults(testResults);
    })
  }
})

testDropdown.addEventListener("change", function() {
  updateStepTable()
});


function clearTestDropdown() {
  const dropdown = document.getElementById('testDropdown');
  dropdown.innerHTML = '';
}

function updateViewWithResults(results) {
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
        if(stepResults[i].result === CONSTANTS.PASSED) {
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

function validateInitialTestsFile(file) {
  if(file) {
    if (file.name !== CONSTANTS.TESTS_JSON) {
      alert(ERROR_MESSAGES.TESTS_FILE_WRONG_NAME)
      return false
    } else {
      return true
    }
  } else {
    alert(ERROR_MESSAGES.TESTS_FILE_REQUIRED)
  }
}

function getUserInputtedFile() {
  return document.getElementById('file').files[0];
}