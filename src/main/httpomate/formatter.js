/**
 *
 * Makes the jsonData that is passed in pretty, so it is human-readable when printed.
 *
 * @param uglyJsonData
 * @returns {string}
 */
function prettyJsonData(uglyJsonData) {
    return JSON.stringify(JSON.parse(uglyJsonData), undefined, 4)
}

/**
 * 
 * Tries to convert string to json Object. Returns empty object if wrong
 * 
 * @param {*} text 
 */
function convertStringToJson(text, canBeEmpty) {
    let jsonObj = '{}'

    try {

    } catch(error) {
        if(canBeEmpty) {
            return ''
        }
    }
}

function isJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

export { prettyJsonData, isJsonString }