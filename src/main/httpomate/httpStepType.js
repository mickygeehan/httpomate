import { readFile, writeJsonToFile } from './fileUtil.js';
import { sendRequest } from './httpUtils.js';
import { wait } from './thread.js';
import { isJsonString } from './formatter.js';
import { createBasicStepResponse } from './stepResonse.js';
import { CustomException } from './exception.js';

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
        stepResult.result = "Pass";
        stepResults.push(stepResult);
        return nextStep;
    } catch(error) {
        stepResult.result = "Fail"
        stepResult.error = error.message
    }
    stepResults.push(stepResult)
    return nextStep
  }
  

async function extractBody(httpMethod, userBody, userDefinedVariables, testFolder) {
    let body = isBodyExternalFile(userBody) ? await readFile(testFolder+extractFileNameFromStepBody(userBody)) : userBody
    if(bodyContainsUserDefinedParams(body)) {
        if(isJsonString(body)) {
            return JSON.stringify(subUserParamsWithValues(body, userDefinedVariables));
        } else {
            throw new CustomException("Body is not a Json string")
        }
    }
    return body
}  

/**
 *
 * @param stepBody
 * @returns {Promise<string|*>}
 */
 async function validateExtractBody(stepBody, userDefinedVariables, testFolder, stepResult) {
    let body = isBodyExternalFile(stepBody) ? await readFile(testFolder+extractFileNameFromStepBody(stepBody)) : stepBody
    if(bodyContainsUserDefinedParams(body)) {
        return JSON.stringify(subUserParamsWithValues(body, userDefinedVariables));
    }
    return body
}

function validateStep(step) {
    if(!stepHasRequiredAttributes(step)) {
        throw new CustomException('URL / method is missing')
    } else if(!isValidMethod(step.method)) {
        throw new CustomException('Method is not of type POST, GET etc.')
    }
}

function extractUrl(url, userDefinedVariables) {
    if(urlContainsDefinedVariable(url)) {
        const foundDefinedParamsInUrl = getUserDefinedVariablesInString(url, /{([^}]+)}/g)
        foundDefinedParamsInUrl.forEach((userVar) => {
            var startOfVar = url.indexOf(userVar)-2
            var endOfVar = startOfVar + userVar.length+3
            var startUrl = url.substring(0, startOfVar)
            var endUrl = url.substring(endOfVar, url.length)
            if(userDefinedVariables.has(userVar)) {
                url = startUrl+userDefinedVariables.get(userVar)+endUrl
            } else {
                throw new CustomException(userVar + " is not defined in vars,json")
            }
        })
    }
    return url
}

function urlContainsDefinedVariable(url) {
    return url.includes('${')
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

/**
 * Needs to be refactored only works with 1
 *
 * @param stepUrl
 * @returns {Promise<void>}
 */
 function validateExtractUrl(stepUrl, userDefinedVariables) {
    if(stepUrl.includes('${')) {
        let found = [],
            regex = /{([^}]+)}/g,
            curMatch;

        while(curMatch = regex.exec(stepUrl)) {
            found.push(curMatch[1])
        }

        found.forEach((userVar) => {
            var start = stepUrl.indexOf(userVar)-2
            var end = start + (userVar.length+3)
            var newURL = stepUrl.substring(0, start)
            var last = stepUrl.substring(end, stepUrl.length)
            
            if(userDefinedVariables.has(userVar)) {
                stepUrl = newURL+userDefinedVariables.get(found[0])+last
            } else {
                stepUrl = ""
            }
        })
    }
    return stepUrl
}

function stepHasRequiredAttributes(currentStep) {
    return currentStep.method && currentStep.url
}

function isValidMethod(method) {
    return method === "POST" || method === "GET" || method === "PUT" || method === "PATCH" || method === "DELETE"
}

async function getHeadersMap (headersFromStep, testFolder, stepResult) {
    let headers = new Map()
    if(!headersFromStep) {
        return headers
    }

    if(isBodyExternalFile(headersFromStep)) {
        var headersFile = extractFileNameFromStepBody(headersFromStep)
        headers = await readFile(testFolder + headersFile)
        if(headers === "ERROR") {
            stepResult.result = "Fail"
            stepResult.error = "Cannot read the headers file"
            return
        } 
    }

    if(isJsonString(headers)) {
        headers = new Map(Object.entries(await JSON.parse(headers)));
    } else {
        stepResult.result = "Fail"
        stepResult.error = "Headers is not a valid JSON string"
        return
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
    const userDefinedResponse = getUserDefinedResponse(response.status, step.onResponse)
    
    //Save vars
    if(userDefinedResponse.varsToSave) {
        const userDefinedVarsToSave = userDefinedResponse.varsToSave
        const savedVars = await extractAndSaveUserDefinedVars(userDefinedVarsToSave, jsonResponse, userDefinedVariables)
        stepResult.savedVars = savedVars
    }

    //find action
    const stepAction = userDefinedResponse.action
    const nextStep = userDefinedResponse.runStep
    let actionCompleted = true

    if(stepAction) {
        actionCompleted = await runAction(stepAction, jsonResponse, userDefinedVariables, step, userDefinedResponse, testFolder, stepResult)
    }

    if(!actionCompleted) {
        if(step.retry) {
            if(!userDefinedVariables.has(step.name+"retry")) {
                userDefinedVariables.set(step.name+"retry", step.retryAttempts)
            }
            if(userDefinedVariables.get(step.name + "retry") > 0) {
                userDefinedVariables.set(step.name+"retry", userDefinedVariables.get(step.name+"retry")-1)
                return step.name
            } else {
                throw new CustomException('Action with retry failed')
                return ""
            }
        }
        throw new CustomException('Action failed')
        console.log('Action failed')
    } else {
        await writeJsonToFile(testFolder + 'savedSystemVars.json', JSON.stringify(Object.fromEntries(userDefinedVariables)))
        return nextStep
    }
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
    if(stepAction === "saveResponse") {
        const fileName = testFolder + "savedData/" + step.name + "response.json"
        await writeJsonToFile(fileName, JSON.stringify(jsonResponse))
        stepResult.actionMessage="Saved data here: " + fileName
        return true
    } else if(stepAction === "varEquality") {
        return await checkVarEquality(jsonResponse, stepResponse, step, userDefinedVariables, stepResult)
    }
}

async function checkVarEquality(jsonResponse, stepResponse, step, userDefinedVariables, stepResult) {
    const userDefinedEquality = stepResponse.varEquality
    const httpResponseValueForVar = await userDefinedNestedVar(userDefinedEquality.varPathToCheck, jsonResponse)
    var equal = httpResponseValueForVar == userDefinedEquality.expectedValue;

    equal ? stepResult.actionMessage = "Response value: "+ httpResponseValueForVar + " matches: " + userDefinedEquality.expectedValue :
            stepResult.actionMessage = "Response value: "+ httpResponseValueForVar + " does not match " + userDefinedEquality.expectedValue 

    return equal
}

async function extractAndSaveUserDefinedVars(varsToSave, jsonResponse, userDefinedVariables) {
    var objToSave = "{"
    varsToSave.forEach((varToSave) => {
        let key = varToSave.varNameToSave
        let path = varToSave.varPath
        let varValue = ""

        if(path.includes('.')) {
            varValue = userDefinedNestedVar(path, jsonResponse)
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

function userDefinedNestedVar(userDefined, json) {

    if(userDefined.includes('.')) {
        const u = userDefined.substring(0, userDefined.indexOf('.'))
        
        // means its an array and to find int number
        if(u.includes('[')) {
            var num = u.substring(u.indexOf('[')+1, u.indexOf(']'))
            var userParam = u.substring(0, u.indexOf('['))
            var sendBack = u.substring(u.indexOf(']'), u.length)
            json = json[userParam][num]
            var nameToSend = userDefined.substring(userDefined.indexOf('.')+1, userDefined.length)
            return userDefinedNestedVar(nameToSend,json)
            

        } else {
            const sendBack = userDefined.substring(userDefined.indexOf('.')+1, userDefined.length)
            json = json[u]
            return userDefinedNestedVar(sendBack, json)
        }
    }

    if(userDefined) {
        return json[userDefined]
    }
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
                    if(obj[i].includes('{{$')) {
                        const startIdx = obj[i].indexOf('{{$')
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
                                stepResult.error = userVarToFind + "defined in body has not been defined in vars.json"
                                stepResult.result = "Fail"
                                return ""
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
    return userVar === "randomString" || userVar === "randomInteger"
}

function predefinedLogic(userVar) {
    if(userVar === "randomString") {
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
    return body.includes('{{$')
}

/**
 *
 * Returns true if body points to an external file
 * @param body
 * @returns {boolean}
 */
function isBodyExternalFile(body) {
    return body.startsWith("$[")
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