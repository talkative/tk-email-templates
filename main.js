/**
* tk-email-template
* Email tempalate system written by Johannes Tegnér @ Talkative Labs 2014-02-10
* Usage example:
* Template file (path/to/files/text.txt):
* 	This is a email {0} testing testing {0} {1}
* 	{1}
* Javascript to load system and template:
*		var emailtemplatesystem = require('../path/system.js')(".txt", "path/to/files");
*		emailtemplatesystem.get("test", ["hej", 5], function(email){
* 		console.log(email);
* 	});
* Result:
*		This is a email hej testing testing hej 5
*		5
*/

//Load required node modules.
var utilities = require('util');
var fs = require('fs');

/**
* Email template system.
* @param {string} templatesPath Path to template files.
* @param {string} fileType Template files file type.
*/
module.exports = function(templatesPath, fileType){
	if(templatesPath === undefined || templatesPath === null){
		utilities.error("tk-email-template - Failed to initialize: Path to templates is undefined.");
		return null;
	}
	if(fileType === undefined || fileType === null){
		utilities.error("tk-email-template - Failed to initialize: Templates file type is undefined.");
		return null;
	}
	if(fileType.indexOf('.') === -1){
		utilities.debug("tk-email-template - The file type argument did not contain a '.' character.\n" +
									 "This notice is printed cuase it is expecting a file type formated as: .txt, .json or similar.\n" +
									 "Its possible that your template files do not use a file type, in that case ignore this info.\n" +
									 "Else this will produce an error when the system tries to fetch the templates.");
	}

	/**
	* File type of the template files.
	*/
	var _templateFileType = fileType;
	/**
	* Path to template files.
	*/
	var _templateFilePath =  templatesPath;

	/**
	* Storage for loaded files.
	* Used to make the system only load a template once then reuse it.
	*/
	var _loadedFiles = {};

	/**
	* Fetch template file.
	* @param {string} type Type of template (file name should match this + fileType).
	* @param {cb} callback Callback to fire on done. email template on success else empty and error param set: function(email, error).
	*/
	function getFile(type, cb){
		if(_loadedFiles[type] !== undefined){
			cb(_loadedFiles[type]);
		} else {
			var path = _templateFilePath + type + _templateFileType;
			fs.readFile(path, function(error, data){
				if(error){
					cb("", utilities.format("Failed to load file. Does the template file exist? (%s)", path));
				} else {
					_loadedFiles[type] = data.toString();
					getFile(type, cb);
				}
			});
		}
	}

	/**
	*	Fetch template file syncroniously.
	* Will block execution til done.
	* @param {string} type Type of template (file name should match this + fileType).
	* @returns {string|null} File as string if found and possible to parse, else null.
	*/
	function getFileSync(type){
		if(_loadedFiles[type] !== undefined){
			return _loadedFiles[type];
		} else {
			var path = _templateFilePath + type + _templateFileType;
			if(fs.existsSync(path)){
				var data = fs.readFileSync(path);
				if(data !== null){
					return data.toString();
				} else {
					utilities.error("Failed to parse the data read from file.");
				}
			} else {
				utilities.error(utilities.format("Failed to find requested file in getFileSync function. (%s)", path));
			}
			return null;
		}
	}


	/**
	* Get a formated email template.
	* @param {string} type Type of template (file name should match this param).
	* @param {array} args Argument list to replace template parameters ( {0}, {1} etc ). Number should match the param number in the template.
	* @param {callback} cb Callback on done. Formated email template on success else empty string and error param set: function(email, error).
	*/
	this.get = function(type, args, cb) {
		getFile(type, function(data, error){
			if(error){
				cb("", error);
			} else {
				var text = data;
				//Includes should be fixed before replacing params, this cause the include files params should also be changed if any.
				if(text.indexOf('{include') !== -1){
					var regex1 = new RegExp("\\{include\\|(.+)\\}", 'g');
					var match = null;
					while(match = regex1.exec(text)){
						var includedFile = getFileSync(match[1]);
						if(includedFile !== null){
							var replaceInclude = new RegExp("\\{include\\|" + match[1] + "}", 'g');
							text = text.replace(replaceInclude, includedFile);
						}
					}
				}
				//Param replace.
				for(var key in args){
					if(!args.hasOwnProperty(key)){
						continue;
					}
					var regex = new RegExp("\\{" + key + "\\}", 'g');
					text = text.replace(regex, args[key]);
				}
				//Done, fire callback with the formated text.
				cb(text);
			}
		});
	}
	return this;
}
