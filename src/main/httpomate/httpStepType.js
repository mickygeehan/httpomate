import { checkFileExists, readFile, writeJsonToFile } from './fileUtil.js';
import { sendRequest } from './httpUtils.js';
import { wait } from './thread.js';
import { isJsonString } from './formatter.js';
import { createBasicStepResponse } from './stepResonse.js';
import { CustomException } from './exception.js';
import { ERROR_MESSAGES, CONSTANTS, STEP_ACTIONS, SUPPORTED_HTTP_METHODS } from './constants.js';

/**
 * Runs the current HTTP step
 * @param {*} currentStep 
 * @param {*} userDefinedVariables 
 * @param {*} testFolder 
 * @param {*} stepResults 
 * @returns stepResult {}
 */
async function runHttpStep(currentStep, userDefinedVariables, testFolder, stepResults) {
    const stepResult = createBasicStepResponse(currentStep.name);
    let nextStep = ""
    try {
        validateStep(currentStep)
        const stepUrl = extractUrl(currentStep.url, userDefinedVariables, stepResult);
        const stepBody = await extractBody(currentStep.method, currentStep.body, userDefinedVariables, testFolder, stepResult);
        const headers = await getHeadersMap(currentStep.headers, testFolder, stepResult);
        await checkPreParams(currentStep);
        const httpResponse = await sendRequest(stepUrl, currentStep.method, stepBody, headers);
        const responseBody = await httpResponse.json();
        const nextStep = await processResponse(httpResponse, currentStep, responseBody, userDefinedVariables, testFolder, stepResult);
        stepResult.result = CONSTANTS.PASSED;
        stepResults.push(stepResult);
        return nextStep;
    } catch(error) {
        stepResult.result = CONSTANTS.FAILED
        stepResult.error = error.message
    }
    stepResults.push(stepResult)
    return nextStep
}

/**
 * Extracts the url from the field. Subs in pre defined params
 * @param {*} url 
 * @param {*} userDefinedVariables 
 * @returns url
 */
function extractUrl(url, userDefinedVariables) {
    if(urlContainsDefinedVariable(url)) {
        const listOfDefinedVariables = getUserDefinedVariablesInString(url, /{([^}]+)}/g)
        listOfDefinedVariables.forEach((userVar) => {
            var startOfVar = url.indexOf(userVar)-2
            var endOfVar = startOfVar + userVar.length+3
            var startUrl = url.substring(0, startOfVar)
            var endUrl = url.substring(endOfVar, url.length)
            if(userDefinedVariables.has(userVar)) {
                url = startUrl+userDefinedVariables.get(userVar)+endUrl
            } else {
                throw new CustomException(userVar + ERROR_MESSAGES.USER_VAR_NOT_DEFINED)
            }
        })
    }
    return url
}

/**
 * Extracts the body, can be within a file or within the text string
 * @param {*} httpMethod 
 * @param {*} userBody 
 * @param {*} userDefinedVariables 
 * @param {*} testFolder 
 * @returns body
 */
async function extractBody(httpMethod, userBody, userDefinedVariables, testFolder) {
    let body = isBodyExternalFile(userBody) ? await readFile(testFolder+extractFileNameFromStepBody(userBody)) : userBody
    if(bodyContainsUserDefinedParams(body)) {
        if(isJsonString(body)) {
            return JSON.stringify(subUserParamsWithValues(body, userDefinedVariables));
        } else {
            throw new CustomException("Body" + ERROR_MESSAGES.INVALID_JSON)
        }
    }
    return body
}  

function validateStep(step) {
    if(!stepHasRequiredAttributes(step)) {
        throw new CustomException(ERROR_MESSAGES.MISSING_HTTP_STEP_REQUIREMENTS)
    } else if(!isValidMethod(step.method)) {
        throw new CustomException(ERROR_MESSAGES.STEP_METHOD_WRONG_TYPE)
    }
}

function urlContainsDefinedVariable(url) {
    return url.includes(CONSTANTS.URL_VARIABLE_PREFIX)
}

/**
 * Returns a list of userDefined variables in a string
 * @param {*} textToSearch 
 * @param {*} regex 
 */
function getUserDefinedVariablesInString(textToSearch, regex) {
    let varsFound = []
    var match;
    while(match = regex.exec(textToSearch)) {
        varsFound.push(match[1])
    }
    return varsFound
}

function stepHasRequiredAttributes(currentStep) {
    return currentStep.method && currentStep.url
}

function isValidMethod(method) {
    return SUPPORTED_HTTP_METHODS.includes(method)
}

async function getHeadersMap(headersFromStep, testFolder, stepResult) {
    let headers = new Map()
    if(!headersFromStep) {
        return headers
    }

    if(isBodyExternalFile(headersFromStep)) {
        var headersFile = extractFileNameFromStepBody(headersFromStep)
        if(checkFileExists(testFolder + headersFile)) {
            headers = await readFile(testFolder + headersFile)
        } else {
            throw new CustomException(CONSTANTS.HEADERS_JSON_FILE + ERROR_MESSAGES.FILE_NOT_FOUND)
        }
    }

    if(isJsonString(headers)) {
        headers = new Map(Object.entries(await JSON.parse(headers)));
    } else {
        throw new CustomException(ERROR_MESSAGES.HEADERS_FILE_NOT_VALID_MAP)
    }

    return headers
}

/**
 *
 * Checks pre-parameters of http request such as wait before running or retry
 *
 * @param step
 * @returns {Promise<void>}
 */
async function checkPreParams(step) {
    if(step.timeToWait) {
        await wait(step.timeToWait)
    }
}

/**
 *
 * Processes the response with given user params
 *
 * @param response
 * @param step
 * @param jsonResponse
 * @param userDefinedVariables
 * @returns {Promise<string>}
 */
async function processResponse(response, step, jsonResponse, userDefinedVariables, testFolder, stepResult) {
    const userDefinedResponseProcessor = getUserDefinedResponse(response.status, step.onResponse)
    let nextStep = userDefinedResponseProcessor.runStep
    const stepAction = userDefinedResponseProcessor.action
    let stepActionCompleted = true

    if(userDefinedResponseProcessor.varsToSave) {
        const savedVars = await extractAndSaveUserDefinedVars(userDefinedResponseProcessor.varsToSave, jsonResponse, userDefinedVariables)
        stepResult.savedVars = savedVars
    }

    if(stepAction) {
        stepActionCompleted = await runAction(stepAction, jsonResponse, userDefinedVariables, step, userDefinedResponseProcessor, testFolder, stepResult)
        if(!stepActionCompleted) {
            if(step.retry) {
                if(!userDefinedVariables.has(step.name+CONSTANTS.RETRY)) {
                    userDefinedVariables.set(step.name+CONSTANTS.RETRY, step.retryAttempts)
                }
                if(userDefinedVariables.get(step.name + CONSTANTS.RETRY) > 0) {
                    userDefinedVariables.set(step.name+CONSTANTS.RETRY, userDefinedVariables.get(step.name+CONSTANTS.RETRY)-1)
                    return step.name
                } else {
                    throw new CustomException(ERROR_MESSAGES.ACTION_FAILED_WITH_RETRY)
                }
            }
            throw new CustomException(ERROR_MESSAGES.ACTION_FAILED)
        }
    }
    return nextStep
}

/**
 * Returns the onResponse object to use
 * @param {*} responseStatusCode 
 * @param {*} userDefinedResponses 
 * @returns 
 */
function getUserDefinedResponse(responseStatusCode, userDefinedResponses) {
    return userDefinedResponses.find(response => response.code === responseStatusCode)
}

async function runAction(stepAction, jsonResponse, userDefinedVariables, step, stepResponse, testFolder, stepResult) {
    stepResult.actionName = stepAction
    if(STEP_ACTIONS.ALL_ACTIONS.includes(stepAction)) {
        if(stepAction === STEP_ACTIONS.SAVE_RESPONSE) {
            return await runSaveResponseAction(jsonResponse, testFolder, step.name, stepResult)
        } else {
            console.log('ss')
            return await runVarEqualityAction(jsonResponse, stepResponse, stepResult)
        }
    } else {
        throw new CustomException(ERROR_MESSAGES.UNSUPPORTED_ACTION)
    }
}

async function runSaveResponseAction(responseToSave, testFolder, stepName, stepResult) {
    const fileToSave = testFolder + "savedData/" + stepName + "response.json"
    try {
        await writeJsonToFile(fileToSave, JSON.stringify(responseToSave))
        stepResult.actionMessage="Saved data here: " + fileToSave
        return true
    } catch(error) {
        stepResult.actionMessage="Error saving data: " + fileToSave
        return false
    }
}

async function runVarEqualityAction(jsonResponse, stepResponse, stepResult) {
    const userDefinedEqualityObject = stepResponse.varEquality
    const httpResponseValueForVar = getUserDefinedParamInResponse(userDefinedEqualityObject.varPathToCheck, jsonResponse)
    var varsAreEqual = httpResponseValueForVar == userDefinedEqualityObject.expectedValue;

    varsAreEqual ? stepResult.actionMessage = "Response value: "+ httpResponseValueForVar + " matches: " + userDefinedEqualityObject.expectedValue :
            stepResult.actionMessage = "Response value: "+ httpResponseValueForVar + " does not match " + userDefinedEqualityObject.expectedValue 

    return varsAreEqual
}

function getUserDefinedParamInResponse(definedParam, responseToSearch) {
    if(definedParam.includes('.')) {
        const pathToParam = definedParam.split('.')
        let currentJsonObject = responseToSearch
        pathToParam.forEach((key) => {
            if(key.includes('[')) {
                var arrayIndex = getArrayIndexFromDefinedParameter(key)
                var userDefinedVarName = key.substring(0, key.indexOf('['))
                currentJsonObject = currentJsonObject[userDefinedVarName][arrayIndex]
            } else {
                currentJsonObject = currentJsonObject[key]
            }
        })
        return currentJsonObject
    } else {
        return responseToSearch[definedParam]
    }

}

function getArrayIndexFromDefinedParameter(userDefinedArrayParam) {
    return userDefinedArrayParam.substring(userDefinedArrayParam.indexOf('[')+1, userDefinedArrayParam.indexOf(']'))
}

async function extractAndSaveUserDefinedVars(varsToSave, jsonResponse, userDefinedVariables) {
    var objToSave = "{"
    varsToSave.forEach((varToSave) => {
        let key = varToSave.varNameToSave
        let path = varToSave.varPath
        let varValue = ""

        if(path.includes('.')) {
            varValue = getUserDefinedParamInResponse(path, jsonResponse)
        } else {
            varValue = jsonResponse[path]
        }
        objToSave += "\"" + key + "\": \""+varValue+"\","
        userDefinedVariables.set(key, varValue)
    })
    objToSave = objToSave.substring(0, objToSave.length - 1);
    objToSave += "}"

    return objToSave
}

function subUserParamsWithValues(body, userDefinedVariables) {
    let bodyJson = JSON.parse(body)
    return getObjects(bodyJson, userDefinedVariables)
}

function getObjects(obj, userDefinedVariables, stepResult) {
    let objects = [];
    for (var i in obj) {
        if (!obj.hasOwnProperty(i)) continue;
        if (typeof obj[i] == 'object') {
            objects = objects.concat(getObjects(obj[i], userDefinedVariables));
        } else {
            if(obj[i]) {
                if (typeof obj[i] === 'string') {
                    if(obj[i].includes(CONSTANTS.REFERENCED_VARIABLE_PREFIX)) {
                        const startIdx = obj[i].indexOf(CONSTANTS.REFERENCED_VARIABLE_PREFIX)
                        const endIndx = obj[i].indexOf('}}')
                        const beforeStr = obj[i].substring(0, startIdx)
                        const endStr = obj[i].substring(endIndx+2, obj[i].length)
                        const userVarToFind = obj[i].substring(startIdx+3, endIndx);
                        if(isPreDefinedLogicVar(userVarToFind)) {
                            obj[i] = beforeStr + predefinedLogic(userVarToFind) + endStr
                        } else {

                            if(userDefinedVariables.has(userVarToFind)) {
                                if(startIdx === 3) {
                                    obj[i] = userDefinedVariables.get(userVarToFind);
                                } else {
                                    obj[i] = beforeStr + userDefinedVariables.get(userVarToFind) + endStr
                                }
                            } else {
                                throw new CustomException(userVarToFind + ERROR_MESSAGES.USER_VAR_NOT_DEFINED)
                            }
                        }
                    }
                }
            }
        }
    }
    return obj;
}

function isPreDefinedLogicVar(userVar) {
    return userVar === CONSTANTS.RANDOM_STRING_FUNCTION || userVar === CONSTANTS.RANDOM_INTEGER_FUNCTION
}

function predefinedLogic(userVar) {
    if(userVar === CONSTANTS.RANDOM_STRING_FUNCTION) {
        return randomString(8)
    } else {
        return Math.random().toFixed(6).split('.')[1];
    }
}

function randomString(len, charSet) {
    charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var randomString = '';
    for (var i = 0; i < len; i++) {
        var randomPoz = Math.floor(Math.random() * charSet.length);
        randomString += charSet.substring(randomPoz,randomPoz+1);
    }
    return randomString;
}

function bodyContainsUserDefinedParams(body) {
    return body.includes(CONSTANTS.REFERENCED_VARIABLE_PREFIX)
}

/**
 *
 * Returns true if body points to an external file
 * @param body
 * @returns {boolean}
 */
function isBodyExternalFile(body) {
    return body.startsWith(CONSTANTS.EXTERNAL_FILE_PREFIX)
}

/**
 *
 * Returns the user inputted fileName within the stepBody attribute
 * @param body
 * @returns {string}
 */
function extractFileNameFromStepBody(body) {
    return body.substring(2, body.length - 1);
}

export { runHttpStep }