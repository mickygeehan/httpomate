import { prettyJsonData } from './formatter.js';

// TODO change so returns JSON from file

/**
 *
 * Writes jsonData to a file with the given name.
 *
 * @param {string} fileName
 * @param {object} jsonData
 * @returns {Promise<void>}
 */
async function writeJsonToFile(fileName, jsonData) {
  await window.fileWriter.fs({
    name: fileName,
    data: prettyJsonData(jsonData),
  });
}

/**
 * Reads a JSON object from a file.
 *
 * @param {string} fileName
 * @returns {Promise<object>} The JSON object
 */
async function readFile(fileName) {
  return fetch(fileName)
    .then((response) => response.text())
    .catch((error) => {
      console.error(`Error reading file: ${error}`);
      return 'ERROR'
    });
}

/**
 * Checks if a file exists and can be read.
 *
 * @param {string} fileName
 * @returns {Promise<boolean>} Whether the file exists and can be read.
 */
async function checkFileExists(fileName) {
  try {
    await fetch(fileName);
    return true;
  } catch (error) {
    console.error(`Error checking file existence: ${error}`);
    return false;
  }
}

export { readFile, writeJsonToFile, checkFileExists };
