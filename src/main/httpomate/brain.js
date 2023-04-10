import { readFile, checkFileExists } from './fileUtil.js';
import { isJsonString } from './formatter.js';
import { runTests } from './testRunner.js';
import { ERROR_MESSAGES, CONSTANTS } from './constants.js';


/**
 * Starts the main initializer.
 * @param {Object} testFile - The test file object.
 * @returns {Promise<void>}
 */
async function start(testFile) {
  return await initializer(testFile);
}

/**
 * Grabs the tests, grabs the userDefinedVars and kicks off testRunner.
 * @param {Object} testFile - The test file object.
 * @returns {Promise} A Promise that resolves to an array of test results.
 */
async function initializer(testFile) {
  const testFilePath = testFile.path;
  const testFolder = testFilePath.substring(0, testFilePath.indexOf(CONSTANTS.TESTS_JSON));
  const testsFileExists = await checkFileExists(testFilePath);
  
  if (!testsFileExists) {
    throw new Error(ERROR_MESSAGES.TESTS_FILE_NOT_FOUND);
  }
  
  const testsFileResponse = await readFile(testFilePath);
  
  if (!isJsonString(testsFileResponse)) {
    throw new Error(CONSTANTS.TESTS_JSON + ERROR_MESSAGES.INVALID_JSON);
  }
  
  const finalValidatedTests = JSON.parse(testsFileResponse).tests;
  const userDefinedVarsFile = testFolder + CONSTANTS.USER_DEFINED_VARS_FILE
  let userDefinedVars = new Map();
  const userDefinedVarsExist = await checkFileExists(userDefinedVarsFile);

  if (userDefinedVarsExist) {
    const userDefinedVarsResponse = await readFile(userDefinedVarsFile);
    if (isJsonString(userDefinedVarsResponse)) {
      userDefinedVars = new Map(Object.entries(JSON.parse(userDefinedVarsResponse)));
    } else {
      alert(CONSTANTS.USER_DEFINED_VARS_FILE + ERROR_MESSAGES.INVALID_JSON)
      return
    }
  }
  return await runTests(finalValidatedTests, userDefinedVars, testFolder);
}

export { start };
