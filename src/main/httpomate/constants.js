const ERROR_MESSAGES = {
    TESTS_FILE_NOT_FOUND: "tests.json is not found",
    TESTS_FILE_REQUIRED: "tests.json file is required",
    TESTS_FILE_WRONG_NAME: "Initial file must be called tests.json",
    INVALID_JSON: " cannot be parsed, Invalid JSON",
    INVALID_STEP_TYPE: "Step type is invalid or null",
    MISSING_HTTP_STEP_REQUIREMENTS: "URL / method type is missing",
    STEP_METHOD_WRONG_TYPE: "Step method must be of type POST, GET, DELETE, PUT, PATCH",
    USER_VAR_NOT_DEFINED: " is not defined in vars.json"
}

const CONSTANTS = {
    TESTS_JSON: "tests.json",
    USER_DEFINED_VARS_FILE: "vars.json",
    FAILED: "FAILED",
    PASSED: "PASSED",
    URL_VARIABLE_PREFIX: "${",
    EXTERNAL_FILE_PREFIX: "$[",
    REFERENCED_VARIABLE_PREFIX: "{{$",
    RANDOM_STRING_FUNCTION: "randomString",
    RANDOM_INTEGER_FUNCTION: "randomInteger"
}

export { ERROR_MESSAGES, CONSTANTS }