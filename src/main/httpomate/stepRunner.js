import { runHttpStep } from './httpStepType.js';

/**

Runs the steps recursively in the given test.
@param {string} stepNameToUse - The name of the current step to run.
@param {Map} stepsInTest - A map of all the steps in the current test.
@param {Object} userDefinedVariables - An object containing user-defined variables.
@param {string} testFolder - The folder path of the current test.
@param {Array} stepResults - An array to store the results of each step.
@returns {Promise<Array>} - An array containing the results of each step.
*/
async function runSteps(stepNameToUse, stepsInTest, userDefinedVariables, testFolder, stepResults) {
    const currentStep = stepsInTest.get(stepNameToUse);
    const currentStepType = currentStep.type;
    if (!currentStepType) {
        console.log("Step type is not defined");
        return stepResults;
    }

    switch (currentStepType.toUpperCase()) {
        case "HTTP":
            const nextStepName = await runHttpStep(currentStep, userDefinedVariables, testFolder, stepResults);
            return nextStepName ? runSteps(nextStepName, stepsInTest, userDefinedVariables, testFolder, stepResults) : stepResults;
        default:
            console.log("Step type '${currentStepType}' is not supported, skipping test");
        return stepResults;
    }
}

export { runSteps };