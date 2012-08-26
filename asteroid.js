
/*
 doc = {title: string, changes: array of change: {timestamp, user, ace_change_data} }
 */


Docs = new Meteor.Collection("documents");

if (Meteor.is_client) {

  Meteor.startup(function () {
      if (Session.equals("selected_doc", undefined)) {
          Session.set("selected_doc", "3e5d0d06-2ec6-4245-ab8a-fe813e2e6341");
      }
      //if (Session.equals("applied_changes", undefined)) {
          Session.set("applied_changes", []);
      //}
  });

  //Watch for changes in document editor
  Meteor.autosubscribe(function () {
      if (Session.get('selected_doc')) {
          var docId = Session.get('selected_doc'); 
          console.log('Autosubscribe: ' + docId );
          setTimeout(function() {
              console.log("Changing editor" + docId + " into editable field.");
              //var editBoxes = $('#' + Session.get('selected_doc') + ' .editor');
              var editBoxes = $('#editor');
              if (editBoxes.length) {
                  var Editor = ace.edit(editBoxes[0]);
                  Editor.on("change", function(e) {
                      if (e.data.from_api) {
                          console.log("Change is from api, ignoring.");
                      } else {
                          console.log("Received change", e);
                          var change = {timestamp: new Date().getTime(), user: null, uuid: guidGenerator(),
                              data: e.data};
                          console.log("Recording change ", change);
                          Session.get("applied_changes").push(change.uuid);
                          Docs.update(Session.get("selected_doc"), {$push: {changes: change}});
                      }
                  });
              }
          },
          500);
      }
  });

  //Watch for changes in document model
  Meteor.autosubscribe(function () {
      var changes = [];
      var docId = Session.get("selected_doc");
      var doc = Docs.findOne(docId);
      if (doc && doc.changes) {
          doc.changes.forEach( function(change) {
              console.log("Checking change from model: ", change);
              if (!_.include(Session.get("applied_changes"), change.uuid)) {
                  //Not already applied
                  changes.push(change);
              }
          });
      }

      console.log("Notified of changes: ", changes);

      if (changes && Session.get('selected_doc')) {
          setTimeout(function() {
              //var editBoxes = $('#' + Session.get('selected_doc') + ' .editor');
              var editBoxes = $('#editor');
              if (editBoxes.length) {
                  var Editor = ace.edit(editBoxes[0]);
                  var EditSession = Editor.getSession();
                  var Document = EditSession.getDocument();
                  console.log('Found Document ', Document);
                  _.each(changes, function(change){
                      console.log("Applying change", change);
                      Session.get("applied_changes").push(change.uuid);
                      Document.applyDeltas([change.data]);
                  });
              }
          },
          500);
      }

  });

  Template.editor.debug = function () {
      console.log("Rerendering.");
  };

  Template.container.has_selected = function () {
      return !Session.equals("selected_doc", undefined);
  };


  Template.container.documents = Docs.find();
  
  Template.doc.events = {
    'click': function () {
      console.log("Selecting doc ", this._id);
      Session.set("selected_doc", this._id);
    }
  };

  Template.editor.display = function () {
      console.log("Checking for visiblity", Session.get("selected_doc"), this._id);
      var isVisible = Session.equals("selected_doc", this._id);
      return isVisible ? "block" : "none";
  };

}

if (Meteor.is_server) {
  Meteor.startup(function () {
    if (Docs.find().count() === 0) {
        Docs.insert({title:"My Doc", body:"Some Text"});
    }
  });
}
