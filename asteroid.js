/*
 doc = {name: string, changes: array of change: {timestamp, user, ace_change_data} }
 */

Docs = new Meteor.Collection("documents");

if (Meteor.is_client) {

    var changeQueue = new Meteor.Collection(null);

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
        Session.set("receivedIds", {});

        var docName = document.location.pathname.substring(1);
        Session.set("docName", docName);
        Meteor.flush();
    });

    // Find docId from docName
    Meteor.autosubscribe(function () {
        var doc = Docs.findOne({name:Session.get("docName")});
        console.log("Found document:", doc);
        if (doc) Session.set("docId", doc._id);
    });

    //Watch for changes in document model
    Meteor.autosubscribe(function () {
        console.log("Checking for changes in document model.");
        var doc = Docs.findOne(Session.get("docId"));
        if (doc && doc.changes) {
            doc.changes.forEach( function(change) {
                //console.log("Checking change " + change.uuid + " from model: ", change);
                if ( !(change.uuid in Session.get("receivedIds")) ) {
                    //console.log("Change " + change.uuid + " being inserted into the changeQueue.");
                    Session.get("receivedIds")[change.uuid] = true;
                    changeQueue.insert(change);
                }
            });
        }

    });
    
    //Process changes in changeQueue
    Meteor.autosubscribe(function () {
        //console.log("changeQueue now has " + changeQueue.find().count() + " entries.");
        var Document = getDocument();
        if (Document) {
            console.log("Found Document for change processing: ", Document);
            var change = changeQueue.findOne({}, {sort: {timestamp: 1}});
            if (change) {
                //console.log("Applying change", change);
                Document.applyDeltas([change.data]);
                //console.log("Removing change with timestamp " + change.timestamp);
                changeQueue.remove(change._id);
            }
        }

    });
    
    Template.navbar.account = function() {
        return Session.get("user");
    };

    Template.navbar.events({
        'click #logoutButton' : function (event) {
            event.preventDefault();
            event.stopPropagation();
            Session.set('user', null);
        }
    });

    Template.signinModal.events({
        'click #signInButton' : function (event) {
            event.preventDefault();
            event.stopPropagation();
            $('#myModal').modal('hide');
            //TODO: Sign in to github.
            var paramArray = $('#signInForm').serializeArray();
            var username = null;
            for (var i in paramArray) {
                var field = paramArray[i];
                if (field['name'] == 'username') {
                    username = field['value'];
                    break;
                }
            }
            if (username) {
                console.log("Found username " + username);
                Session.set("user", {username:username});
            }
        }
    });

    Template.container.hasDoc = function() {
        return !Session.equals("docId", undefined);
    };

    Template.container.events({
        'click input#createDocumentButton' : function (event) {
          console.log("Inserting document for", Session.get("docName"));
          var docId = Docs.insert({name:Session.get("docName")}, function(err){
            if (err) console.log("Error inserting " + Session.get("docName"), err);
          });
          console.log("Inserted doc with id", docId);
          Session.set("docId", docId);
          event.stopPropagation();
        }
    });

    Template.editor.debug = function () {
        console.log("Rerendering.");
    };

    Template.editor.docName = function () {
        return Session.get("docName");
    };

    Template.editor.rendered = function () {
        console.log("Calling editor.rendered");
        var editor = getEditor();
        if (!editor) {
            console.error("ERROR: Can't find editor after rendering.");
            return;
        }
        console.log("Changing editor into editable field.");
        editor.on("change", function(e) {
            if (e.data.from_api) {
                //console.log("Change is from api, ignoring.");
                0; //Hack to hide syntax warning.
            } else {
                var change = {timestamp: new Date().getTime(), user: null, uuid: Meteor.uuid(),
                    data: e.data};
                console.log("Recording change ", change);
                //Session.get("priority_queue").receivedIds[change.uuid] = true;
                Session.get("receivedIds")[change.uuid] = true;
                Docs.update(Session.get("docId"), {$push: {changes: change}});
            }
        });
        //editor.setTheme("ace/theme/twilight");
        var extensions = /\.(\w*?)$/.exec(Session.get("docName"));
        if (extensions) {
            var extension = extensions[1];
            var mode = null;
            switch (extension) {
                case "html":
                case "htm":
                    mode = "html";
                    break;
                case "js":
                    mode = "javascript";
                    break;
                default:
                    mode = null;
                    break;
            }
            console.log("Found mode " + mode + " from extension " + extension);
            if (mode) {
                editor.session.setMode("ace/mode/" + mode);
            }
        }
    };


}

if (Meteor.is_server) {
  Meteor.startup(function () {
  });

  Docs.allow({
    insert: function(userId, doc) { return true; },
    update: function(userId, docs, fields, modifier) { return true; },
    remove: function(userId, docs) { return true; }
  });

}
