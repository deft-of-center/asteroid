/*
 doc = {name: string, changes: array of change: {timestamp, user, ace_change_data} }
 */

Docs = new Meteor.Collection("documents");

if (Meteor.is_client) {

    function getEditor() {
        var editBoxes = $('#editor');
        if (editBoxes.length) {
            return ace.edit(editBoxes[0]);
        }
        return null;
    }

    function getDocument() {
        var Editor = getEditor();
        return Editor && Editor.getSession().getDocument();
    }

    Meteor.startup(function () {
        var changeComparator = function(change) {
            return change.timestamp;
        };
        Session.set("priority_queue", new ChangeManager(changeComparator));

        var docName = document.location.pathname.substring(1);
        Session.set("docName", docName);
    });

    Template.container.hasDoc = function() {
        return !Session.equals("docId", undefined);
    };

    Template.container.events = {
        'click input' : function () {
            var docId = Docs.insert({name:Session.get("docName")});
            Session.set("docId", docId); 
        }
    };

    Meteor.autosubscribe(function () {
        var doc = Docs.findOne({name:Session.get("docName")});
        if (doc) Session.set("docId", doc._id);
    });

    // Process change queue
    Meteor.autosubscribe(function () {
        console.log("Starting processingContext with id:",  Meteor.deps.Context.current.id);
        var queue = Session.get("priority_queue");
        if (queue) {
            queue.processingContext = Meteor.deps.Context.current;
            console.log("Setting processingContext id to: ", Meteor.deps.Context.current);
        }
        console.log("Found queue", queue);
        while (queue && queue.size && queue.size()) {
            var Document = getDocument();
            console.log("Found Document for change processing: ", Document);
            if (Document) {
                var change = queue.pop();
                console.log("Applying change", change);
                Document.applyDeltas([change.data]);
            }
        }
    });
    
    //Watch for changes in document editor
    Meteor.autosubscribe(function () {
        var docId = Session.get("docId");
        console.log('Autosubscribe: ' + docId );
        setTimeout(function() {
            console.log("Changing editor into editable field.");
            var Editor = getEditor();
            if (Editor) {
                Editor.on("change", function(e) {
                    if (e.data.from_api) {
                        console.log("Change is from api, ignoring.");
                    } else {
                        console.log("Received change", e);
                        var change = {timestamp: new Date().getTime(), user: null, uuid: guidGenerator(),
                            data: e.data};
                        console.log("Recording change ", change);
                        Session.get("priority_queue").receivedIds[change.uuid] = true;
                        Docs.update(docId, {$push: {changes: change}});
                    }
                });
            }
        },
        500);
    });

  //Watch for changes in document model
  Meteor.autosubscribe(function () {
      var doc = Docs.findOne(Session.get("docId"));
      if (doc && doc.changes) {
          var Document = getDocument();
          if (Document) {
              doc.changes.forEach( function(change) {
                  console.log("Checking change from model: ", change);
                  Session.get("priority_queue").push(change);
              });
          }
      }

  });

  Template.editor.debug = function () {
      console.log("Rerendering.");
  };

  Template.editor.docName = function () {
      return Session.get("docName");
  };
}

if (Meteor.is_server) {
  Meteor.startup(function () {
  });
}
