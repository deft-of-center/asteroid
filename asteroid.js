
/*
 doc = {title: string, changes: array of change: {timestamp, user, ace_change_data} }
 */


Docs = new Meteor.Collection("documents");

if (Meteor.is_client) {

    Meteor.startup(function () {
        Session.set("applied_changes", []);

        var docName = document.location.pathname;
        Session.set("docName", docName);
        var doc = Docs.findOne({name:docName});
        var docId;
        if (doc) {
            docId = doc._id;
        } else {
            docId = Docs.insert({name:docName});
        }
        Session.set("docId", docId); 
    });

    //Watch for changes in document editor
    Meteor.autosubscribe(function () {
        var docId = Session.get("docId");
        console.log('Autosubscribe: ' + docId );
        setTimeout(function() {
            console.log("Changing editor" + docId + " into editable field.");
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
                        Docs.update(docId, {$push: {changes: change}});
                    }
                });
            }
        },
        500);
    });

  //Watch for changes in document model
  Meteor.autosubscribe(function () {
      var changes = [];
      var docId = Session.get("docId");
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

      if (changes && Session.get('docId')) {
          setTimeout(function() {
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

  Template.editor.title = function () {
      return Session.get("docName");
  };
}

if (Meteor.is_server) {
  Meteor.startup(function () {
  });
}
