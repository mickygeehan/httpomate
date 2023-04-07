import { readFile, checkFileExists } from './fileUtil.js';
import { isJsonString } from './formatter.js';
import { runTests } from './testRunner.js';
import { updateView } from '../../../renderer.js';

/**
 * Starts the main initializer.
 * @param {Object} testFile - The test file object.
 * @returns {Promise<void>}
 */
async function start(testFile) {
  const results = await initializer(testFile);
  updateView(results);
}

/**
 * Grabs the tests, grabs the userDefinedVars and kicks off testRunner.
 * @param {Object} testFile - The test file object.
 * @returns {Promise} A Promise that resolves to an array of test results.
 */
async function initializer(testFile) {
  const testFilePath = testFile.path;
  const testFolder = testFilePath.substring(0, testFilePath.indexOf('tests.json'));
  const testsFileExists = await checkFileExists(testFilePath);
  
  if (!testsFileExists) {
    throw new Error('Tests file cannot be found');
  }
  
  const testsFileResponse = await readFile(testFilePath);
  
  if (!isJsonString(testsFileResponse)) {
    throw new Error('Tests file contains invalid JSON');
  }
  
  const finalValidatedTests = JSON.parse(testsFileResponse).tests;

  // User defined vars
  let userDefinedVars = new Map();
  const userDefinedVarsExist = await checkFileExists(`${testFolder}vars.json`);
  
  if (userDefinedVarsExist) {
    const userDefinedVarsResponse = await readFile(`${testFolder}vars.json`);
    if (isJsonString(userDefinedVarsResponse)) {
      userDefinedVars = new Map(Object.entries(JSON.parse(userDefinedVarsResponse)));
    }
  }

  return await runTests(finalValidatedTests, userDefinedVars, testFolder);
}

export { start };
