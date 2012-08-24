function dump(arr,level) {
	var dumped_text = "";
	if(!level) level = 0;
	
	//The padding given at the beginning of the line.
	var level_padding = "";
	for(var j=0;j<level+1;j++) level_padding += "    ";
	
	if(typeof(arr) == 'object') { //Array/Hashes/Objects 
		for(var item in arr) {
			var value = arr[item];
			
			if(typeof(value) == 'object') { //If it is an array,
				dumped_text += level_padding + "'" + item + "' ...\n";
				dumped_text += dump(value,level+1);
			} else {
				dumped_text += level_padding + "'" + item + "' => \"" + value + "\"\n";
			}
		}
	} else { //Stings/Chars/Numbers etc.
		dumped_text = "===>"+arr+"<===("+typeof(arr)+")";
	}
	return dumped_text;
}



var Docs = new Meteor.Collection("documents", null);
//Temporary code.  Eventually each REST endpoint will be an Id.
var docId = 1;
Docs.insert({id:docId, title:"My Doc", body:"A Test"});


if (Meteor.is_client) {

  doc = Docs.findOne({id:docId});
  Template.hello.title = doc.title;
  Template.hello.greeting = function () {
    return "Welcome to asteroid.";
  };

  Template.hello.editString = doc.body;

  Template.hello.events = {
    'click input' : function () {
      // template data, if any, is available in 'this'
      if (typeof console !== 'undefined')
        console.log("You pressed the button");
    }
  };

  $('#editArea').keyup(function() {
      doc.body = Template.hello.editString.value;
      Docs.update({id:doc.id}, {body:doc.body}); 
  });
}

if (Meteor.is_server) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
