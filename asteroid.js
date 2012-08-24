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



Docs = new Meteor.Collection("documents");

if (Meteor.is_client) {

  Meteor.startup(function () {
  });

  Template.container.has_selected = function () {
      return !Session.equals("selected_doc", undefined);
  };


  Template.docs.documents = Docs.find();
  
  Template.doc.events = {
    'click': function () {
      console.log("Selecting doc " + this._id);
      Session.set("selected_doc", this._id);
    }
  };

  Template.edit.docId = function () {
      return Session.get("selected_doc");
  };

  Template.edit.title = function () {
      var aDoc = Docs.findOne(Session.get("selected_doc"));
      return aDoc && aDoc.title;
  };

  Template.edit.editString = function () {
    var aDoc = Docs.findOne(Session.get("selected_doc"));
    return aDoc && aDoc.body;
  };

  Template.edit.events = {
    'click input' : function () {
      // template data, if any, is available in 'this'
      var aDoc = Docs.findOne(Session.get("selected_doc"));
      if (aDoc) {
      aDoc.title += "!";
      console.log("You pressed the button. title is now " + aDoc.title);
      Docs.update(Session.get("selected_doc"), {$set: {title: aDoc.title}});
      console.log("Database title is: " +  Docs.findOne(Session.get("selected_doc")).title );
      console.log("Database doc is: " + dump(Docs.findOne(Session.get("selected_doc"))) );
      } else {
          console.log("Unable for find document for id " + Sesssion.get("selected_doc") + " in DB of size " + Docs.find().count());
      }
    }
  };

  $(function() {
      $(document).keyup(function() {
          var newBody = $('#editArea').val();
          console.log("Setting doc body to :" + newBody);
          Docs.update(Session.get("selected_doc"), {$set: {body:newBody}}); 
          console.log("Database body is: " +  Docs.findOne(Session.get("selected_doc")).body );
      });
  });

}

if (Meteor.is_server) {
  Meteor.startup(function () {
    if (Docs.find().count() === 0) {
        Docs.insert({title:"My Doc", body:"Some Text"});
    }
  });
}
