# tk-email-templates
Simple template system for node.js.  
Originaly designed for email templating but can be used for any type of text templates.  
  
#### Install via npm.
    npm install git+ssh://git@github.com:talkative/tk-email-templates.git [--save]

#### Initialize.

```javascript

var templates = require('tk-email-templates')("path/to/template/files", ".txt");
//First argument in constructor is path to where the template files are stored, the second is the file type that the templates use.
```

#### Create template/s.
The templates use { brackets } for parameters and includes.  
Possible types of usage:  

    {param}                     // Single param, will be replaced with the object parameter passed in to the 'get' function that match.
    {param.property}            // Object property param, will be replaced with the object parameter passed in to the 'get' function that match.
    {include|othertemplate}     // Includes another template file. The included file will be included before the params are set, so params will change in that one too.


#### Fetch a template.
The `templates` objects `get` function is used to fetch the email templates.
```javascript
templates.get("test", params, function(formattedText, error){}); 
// Where first parameter is the template name (without file type), second is the parameter object and third is a callback function.
// error parameter will only be set if there is an error, else it will be undefined. in case of error, formatted email will be empty.
``` 

#### Example.
*(For a more up-to-date example check the 'example' directory in the repo).*
    
```
// test.txt
This test email is sent from {username}.
{include|_footer}
```

```
// _footer.txt
This is the footer {anotherparam}.
Or even a {obj.parameter}!
```

```javascript
templates = require('tk-email-templates')(path, ".txt");
templates.get("test", {
    "username": "MyName"
  , "anotherparam": "Have a nice day"
  , "obj": {
      "parameter": "Object-parameter"
    }
}, function(formattedEmail, error){
  if(error !== undefined){
    util.error("Failed to format email.\nError:\n" + error);
  } else {
    util.debug("Email fetched successfully!");
    sendEmail(email);
  }
});
```

In the above example the email output would be:  
  
```
This test email is sent from MyName.
This is the footer Have a nice day.
Or even a Object-parameter!
```
