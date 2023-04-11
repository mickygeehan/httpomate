const ERROR_MESSAGES = {
    TESTS_FILE_NOT_FOUND: "tests.json is not found",
    TESTS_FILE_REQUIRED: "tests.json file is required",
    TESTS_FILE_WRONG_NAME: "Initial file must be called tests.json",
    INVALID_JSON: " cannot be parsed, Invalid JSON",
    INVALID_STEP_TYPE: "Step type is invalid or null",
    MISSING_HTTP_STEP_REQUIREMENTS: "URL / method type is missing",
    STEP_METHOD_WRONG_TYPE: "Step method must be of type POST, GET, DELETE, PUT, PATCH",
    USER_VAR_NOT_DEFINED: " is not defined in vars.json",
    FILE_NOT_FOUND: " is not found.",
    HEADERS_FILE_NOT_VALID_MAP: "headers.json cannot be parsed to a map, please check your json",
    ACTION_FAILED_WITH_RETRY: "Action has failed. Max retry attempts achieved.",
    ACTION_FAILED: "The action has failed",
    UNSUPPORTED_ACTION: "The defined action is unsupported"
}

const CONSTANTS = {
    TESTS_JSON: "tests.json",
    HEADERS_JSON_FILE: "headers.json",
    USER_DEFINED_VARS_FILE: "vars.json",
    FAILED: "FAILED",
    PASSED: "PASSED",
    URL_VARIABLE_PREFIX: "${",
    EXTERNAL_FILE_PREFIX: "$[",
    REFERENCED_VARIABLE_PREFIX: "{{$",
    RANDOM_STRING_FUNCTION: "randomString",
    RANDOM_INTEGER_FUNCTION: "randomInteger",
    RETRY: "retry"
}

const STEP_ACTIONS = {
    SAVE_RESPONSE: "saveResponse",
    VAR_EQUALITY: "varEquality",
    ALL_ACTIONS: ["varEquality", "saveResponse"]
}

const SUPPORTED_HTTP_METHODS = [
    "POST",
    "GET",
    "PUT",
    "PATCH",
    "DELETE"
]
    

export { ERROR_MESSAGES, CONSTANTS, STEP_ACTIONS, SUPPORTED_HTTP_METHODS }