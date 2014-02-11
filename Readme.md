# tk-email-templates
Simple email template system for node.js.

### Installation instructions.
#### Install via npm.
    npm install git+ssh://git@github.com:talkative/tk-email-templates.git [--save]

#### Initialize.

```javascript

var emailtemplates = require('tk-email-templates')("path/to/template/files", ".txt");
//First argument in constructor is path to where the template files are stored, the second is the file type that the templates use.
```

#### Create template/s.
The templates use { brackets } for parameters and includes.  
There are currently two possible types of usage:  

    {param}                     // Single param, will be replaced with the object parameter passed in to the 'get' function that match.
    {include|othertemplate}     // Includes another template file. The included file will be included before the params are set, so params will change in that one too.


#### Fetch a template.
The emailtemplates objects `get` function is used to fetch the email templates.
```javascript
emailtemplates.get("test", params, function(formattedEmail, error){}); 
// Where first parameter is the template name (without file type), second is the parameter object and third is a callback function.
// error parameter will only be set if there is an error, else it will be undefined. in case of error, formatted email will be empty.
``` 

#### Example.
    
```
// test.txt
This test email is sent from {username}.
{include|_footer}
```

```
// _footer.txt
This is the footer {anotherparam}.
```

```javascript
emailtemplates = require('tk-email-templates')(path, ".txt");
emailtemplates.get("test", {
    "username": "MyName"
  , "anotherparam": "Have a nice day"
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
```
