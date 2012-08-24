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



Docs = new Meteor.Collection("documents", null);
console.log("Docs has count " + Docs.find().count());
var docId;
if (Docs.find().count() === 0) {
  docId = Docs.insert({title:"My Doc", body:"A Test"});
  console.log("Adding doc with id " + docId);
} else {
  docId = Docs.findOne()._id;
  console.log("Found doc with id " + docId);
}


if (Meteor.is_client) {

  var doc = Docs.findOne(docId);
  Template.hello.title = function () {
      var aDoc = Docs.findOne(docId);
      return aDoc.title;
  };
  Template.hello.greeting = function () {
    var aDoc = Docs.findOne(docId);
    return "Welcome to " + aDoc.title;
  };

  Template.hello.editString = function () {
    var aDoc = Docs.findOne(docId);
    return aDoc.body;
  };

  Template.hello.events = {
    'click input' : function () {
      // template data, if any, is available in 'this'
      doc.title += "!";
      console.log("You pressed the button. title is now " + doc.title);
      Docs.update(docId, doc);
      console.log("Database title is: " +  Docs.findOne(docId).title );
      console.log("Database doc is: " + dump(Docs.findOne(docId)) );
    }
  };

  $(function() {
      $(document).keyup(function() {
          doc.body = $('#editArea').val();
          console.log("Setting doc body to :" + doc.body);
          Docs.update(docId, doc); 
          console.log("Database body is: " +  Docs.findOne(docId).body );
      });
  });
}

if (Meteor.is_server) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
