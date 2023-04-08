# httpOmate

This app allows you to automate your http requests and chain them together, along with some other powerful features. This app is still in the works and not all validation is present.
## How it works

The main idea is to define one powerful json file - "tests.json" which will deal with http requests and how they chain together. 

Basic Structure of tests.json (Full object details in Appdix):
```bash
  {
    "tests": [
        {
            "steps": [
                {
                    "onResponse": [
                        {
                            "action": ""
                        }
                    ]
                }
            
            ]
        }
    ]
  }
```
- tests - Array of tests each defiing basic data.
- steps - Each step can be a different http requests, defines the url, body etc.
- onResponse - Defines how to deal with the response for that step, works via the httpCode.
- actions - Actions are a part of onResponse and tell the system what to do with the response.




## Installation

- Clone repo and install the app using following commands
```bash
  ~ npm install
  ~ npm run start
```

Our simple UI should show. Simply select your tests.json file and click run. To run example tests.json navigate to /src/main/test/example

    
## Usage/Examples

Steps are the most important piece of information. In the appendix you will see the whole object but here are some good examples:


#### Save a variable from response of step1 and use it in step2:
```bash
{
    "name": "Step1",
    "description": "description",
    "type": "HTTP",
    "method": "POST",
    "body": "$[./requests/post.json]",
    "headers": "$[./requests/headers.json]",
    "url": "https://localhost:8080/",
    "onResponse": [{
        "code": 200,
        "action": "",
        "varsToSave": [{
            "varNameToSave": "step1ID",
            "varPath": "body.id"
            }
        ],
        "runStep": "Step2"
    }]
},
{
    "name": "Step2",
    "description": "description",
    "type": "HTTP",
    "method": "POST",
    "body": "$[./requests/post.json]",
    "headers": "$[./requests/headers.json]",
    "url": "https://localhost:8080/${step1ID}",
    "onResponse": [{
        "code": 200,
        "action": "saveResponse",
        "runStep": ""
    }]
}
```


#### Reference an external json file in Step Object to use as body:
- You can reference an external file to be used as the body for your http request. **Please note external files must be in the same folder location as your tests.json folder. Future improvements will fix this**
```bash
{
    "name": "Step1",
    "description": "description",
    "type": "HTTP",
    "method": "POST",
    "body": "$[./requests/post.json]",
    "headers": "$[./requests/headers.json]",
    "url": "https://localhost:8080/",
    "onResponse": [{
        "code": 200,
        "action": "",
        "runStep": ""
    }]
}
```
#### Reference a pre-defined variable in an external body json file:
- You can also pre-define variables to use across different requests. Just create a vars.json file in the same directory as the tests.json file. Any external / internal body can then reference these variables like so:
```bash
./requests/postBody.json see above
{
    "data": "data1",
    "description": "{{$descriptionVar}}"  // {{$ means its a user defined variable stored in a seperate file
}

./vars.json
{
    "descriptionVar": "Use this as a description"
}
```

#### Use predefined body functions:
- Sometimes you just need a random string or integer in your request, you can get random strings and ints like so:
```bash
./requests/postBody.json see above
{
    "data": "{{$randomString}}",
    "description": "{{$randomInteger}}"
}
```

#### Check a variable from the response matches a given value:
- Check a variable from the response is as you expect:
```bash
{
    "name": "Step1",
    "description": "description",
    "type": "HTTP",
    "method": "POST",
    "body": "$[./requests/post.json]",
    "headers": "$[./requests/headers.json]",
    "url": "https://localhost:8080/",
    "onResponse": [{
        "action": "varEquality",
        "runStep": "",
        "varEquality": {
            "varPathToCheck": "body.name",
            "expectedValue": "michael"
        }
    }]
}
```

#### Wait 3 seconds before running step, retry if response action failed 5 times:
- Check a variable from the response is as you expect:
```bash
{
    "name": "Step1",
    "description": "description",
    "type": "HTTP",
    "method": "POST",
    "body": "$[./requests/post.json]",
    "headers": "$[./requests/headers.json]",
    "retry": true,
    "retryAttempts": 5,
    "timeToWait": 3, 
    "url": "https://localhost:8080/",
    "onResponse": [{
        "action": "varEquality",
        "runStep": "",
        "varEquality": {
            "varPathToCheck": "body.name",
            "expectedValue": "michael"
        }
    }]
}
```


### List of current actions:
The below actions can be used in the step.onResponse[X].action field:
- saveResponse: Saves the response as a file to the following directory: "./savedData/StepNameResponse.json"
- varEquality: Checks that the response matches a pre defined variable defined in the VarEquality Object.
## Authors

- [@mgeehan](https://www.github.com/)


## Appendix

Full test.json file object information can be found here.

### Test Object:
```bash
    {
        "name": [Required]"String",
        "description": [Optional]"String",
        "steps": [Required][
            {Step Object}
        ]
    }
```

### Step Object:
```bash
    {
        "name": [Required]"String",
        "type": [Required]"String", // can only be HTTP for now
        "method": [Required]"String" // POST, GET etc,
        "body": [Required]"String" // defaulted to null for GET,
        "URL": [Required]"String",
        "retry": [Optional] Boolean, // should retry if step response action doesn't pass
        "retryAttempts": [Required if retry] Integer,
        "timeToWait": [Optional] Integer, // wait this length in seconds until send the request,

        "onResponse": [Required][
            {Response Object}
        ]

    }
```

### Response Object:
```bash
    {
        "code": [Required]"String", // HTTP code to match
        "varsToSave": [Optional] [
            {VarToSaveObject}
        ],
        "varEquality": [Required if action == "varEquality"] {
            VarEquality Object
        }
        "action": [Optional]"String", // Run an action, list of actions in feature
        "runStep": [Optional]"String" // run next step, must point to STep Object name
    }
```

### VarToSaveObject Object:
```bash
    {
        "varNameToSave": [Required] "String",
        "varPath": [Required]"String" // example: body.name
    }
```

### VarEquality Object:
```bash
    {
        "varPathToCheck": [Required]"String", // eg. body.name
        "expectedValue": [Required]"String/Integer"
    }
```