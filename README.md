

<p align="center"><a target="_blank" rel="noopener noreferrer"><img width="400" src="https://user-images.githubusercontent.com/25685957/230743877-6434f94e-382f-446e-832e-2a2bbae7ce34.png" alt="httpOmate logo"></a></p>

httpomate is a powerful developer~testing tool that allows you to easily automate/chain any http requests all through the power of one tests.json file. It is developed using the Electron framework.

<br><br>

## How it works

The main idea of this app is to easily chain http requests through one json file (tests.json). Here is the structure of the tests.json file (See [Appendix](#appendix) for full object details, required attributes etc.):
```bash
  {
    "tests": [  // Contains a list of tests - Contains basic information
        {
            "steps": [ // steps are the most powerful objects within this app.
                {
                    "onResponse": [ // the onResponse objects tells the system how to deal with the respnse of the http request. onResponse works via the httpCode of the response
                        {
                            "action": "", // system defined actions on what to do with response
                            "varsToSave": [] // system can save vars from the response to use in the following steps
                        }
                    ]
                }
            
            ]
        }
    ]
  }
```
- tests
  - Contains a list of tests with basic information such as name description.
  - Tests will run sequentially
- steps 
  - Each step can be a different http requests. The step defines the url, body, type etc.
- onResponse 
  - Each step has an onResponse object that can deal with the httpResponse. This works via the httpcode.
  - Each onResponse has a runStep attribute that will run the next step via its name
- action 
  - Actions are a part of onResponse and tell the system what to do with the response. This can be a saveResponse to file or check a response attribute == a pre defined var

For a full working example tests.json file please see some examples in the repo. These can be ran through the UI.

<br>

## Installation

- Clone repo and install the app using following commands
```bash
  ~ npm install
  ~ npm run start
```

After this our simple Electron UI will show (It's basic at the minute future features can be found below). It is recommended to run the example tests.json files found in the repo (src/main/tests). They are pre-working json files that will teach you the basics of how the app works.
    
<br>


## Usage/Examples

The Step object is the main bulk of this project as it defines the http request and what to do on response. Here are some of the main examples of how to chain requests and use variables between steps:

<br>

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

<br>

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
<br>

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

<br>

#### Use predefined body functions:
- Sometimes you just need a random string or integer in your request, you can get random strings and ints like so:
```bash
./requests/postBody.json see above
{
    "data": "{{$randomString}}",
    "description": "{{$randomInteger}}"
}
```

<br>

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

<br>

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

<br>

### Full list of features:
- Retry logic for requests.
- Wait logic before sending request.
- Read body / headers file from external .json files.
- Reference pre-defined / saved variables in URL.
- Reference pre-defined / saved variables in external json files.
- Pre defined functions for randomString / randomIntegers.
- Save responses to file.
- Check response variables equal to expected values.
- Deal with different responses.
- Basic UI that wil show errors.

<br>

## Issues / Upcoming features

### Issues
- Not all file validation is there
- Folder needs to be in a specified format
- lots more I guess :D 

### Upcoming features
- More Actions
- UI can create a tests.json file
- lots more


<br>


## Authors

- [@mgeehan](https://github.com/mickygeehan)

<br>

## Appendix
(#appendix)

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
