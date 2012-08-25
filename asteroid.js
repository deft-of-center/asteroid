
/*
 doc = {title: string, changes: array of change: {timestamp, user, ace_change_data} }
 */


Docs = new Meteor.Collection("documents");

if (Meteor.is_client) {

  Meteor.startup(function () {
      if (Session.equals("applied_changes", undefined)) {
          Session.set("applied_changes", []);
      }
  });

  //Watch for changes in selected_doc
  Meteor.autosubscribe(function () {
      if (Session.get('selected_doc')) {
          console.log('Autosubscribe: ' + Session.get('selected_doc') );
          setTimeout(function() {
              var Editor = ace.edit("editor");
              Editor.on("change", function(e) {
                  console.log("Received change", e);
                  var change = {timestamp: new Date().getTime(), user: null, uuid: guidGenerator(),
                      data: e.data};
                  console.log("Recording change ", change);
                  Session.get("applied_changes").push(change.uuid);
                  Docs.update(Session.get("selected_doc"), {$push: {changes: change}});
              });
          },
          500);
      }
  });

  //Watch for changes in the document
  Meteor.autosubscribe(function () {
      var changes = [];
      var doc = Docs.findOne( Session.get("selected_doc"));
      if (doc && doc.changes) {
          doc.changes.forEach( function(change) {
              console.log("Checking change", change);
              if (!_.include(Session.get("applied_changes"), change.uuid)) {
                  //Not already applied
                  changes.push(change);
              }
          });
      }

      console.log("Notified of changes: ", changes);

      if (changes && Session.get('selected_doc')) {
          setTimeout(function() {
              var Editor = ace.edit("editor");
              var EditSession = Editor.getSession();
              var Document = EditSession.getDocument();
              console.log('Found Document ', Document);
              _.each(changes, function(change){
                  console.log("Applying change", change);
                  Document.applyDeltas([change.data]);
                  Session.get("applied_changes").push(change.uuid);
              });
          },
          500);
      }

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
      //console.log("Database title is: " +  Docs.findOne(Session.get("selected_doc")).title );
      //console.log("Database doc is: " + dump(Docs.findOne(Session.get("selected_doc"))) );
      } else {
          console.log("Unable for find document for id " + Sesssion.get("selected_doc") + " in DB of size " + Docs.find().count());
      }
    }
  };

/*
  $(function() {
      $(document).keyup(function() {
          var newBody = $('#editArea').val();
          console.log("Setting doc body to :" + newBody);
          Docs.update(Session.get("selected_doc"), {$set: {body:newBody}}); 
          console.log("Database body is: " +  Docs.findOne(Session.get("selected_doc")).body );
      });
  });
*/
}


if (Meteor.is_server) {
  Meteor.startup(function () {
    if (Docs.find().count() === 0) {
        Docs.insert({title:"My Doc", body:"Some Text"});
    }
  });
}
