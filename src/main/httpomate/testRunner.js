import { runSteps } from './stepRunner.js';

/**
*

Runs each test in the given tests list.
@param {Array} tests
@param {Object} userDefinedVars
@param {String} testFolder
@returns {Promise<Array>}
*/
async function runTests(tests, userDefinedVars, testFolder) {
    const testResults = [];
    for (const test of tests) {
        const testResult = await runTest(test, userDefinedVars, testFolder);
        testResults.push(testResult);
    }
    return testResults;
}
/**
*

Run the given individual test. Kicks off the StepRunner
@param {Object} test
@param {Object} userDefinedVars
@param {String} testFolder
@returns {Promise<Object>}
*/
async function runTest(test, userDefinedVars, testFolder) {
    const allTestSteps = new Map(test.steps.map(step => [step.name, step]));
    const [firstKey] = allTestSteps.keys();
    const stepResults = await runSteps(firstKey, allTestSteps, userDefinedVars, testFolder, []);
    return {
        testName: test.name,
        stepResults
    };
}
export { runTests };