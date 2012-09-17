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
        Session.set( "priority_queue", new ChangeManager( function(change) { return change.timestamp; } ));

        var docName = document.location.pathname.substring(1);
        Session.set("docName", docName);
        Meteor.flush();
    });

    // Find docId from docName
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
        var Document = getDocument();
        if (Document) {
            console.log("Found Document for change processing: ", Document);
            while (queue && queue.size && queue.size()) {
                var change = queue.pop();
                console.log("Applying change", change);
                Document.applyDeltas([change.data]);
            }
        }
    });
    
    //Watch for changes in document editor
    //Meteor.autosubscribe(function () {
        //if (Session.get("docId")) {
            //var Editor = getEditor();
            //if (Editor) { 
                //console.log("Changing editor into editable field.");
                //Editor.on("change", function(e) {
                    //if (e.data.from_api) {
                        //console.log("Change is from api, ignoring.");
                    //} else {
                        //var change = {timestamp: new Date().getTime(), user: null, uuid: Meteor.uuid(),
                            //data: e.data};
                        //console.log("Recording change ", change);
                        //Session.get("priority_queue").receivedIds[change.uuid] = true;
                        //Docs.update(Session.get("docId"), {$push: {changes: change}});
                    //}
                //});
            //} else {
                ////Other templates haven't finished rendering; come back to this.
                //Meteor.deps.Context.current.invalidate();
            //}
        //}
    //});

    //Watch for changes in document model
    Meteor.autosubscribe(function () {
        console.log("Checking for changes in document model.");
        var doc = Docs.findOne(Session.get("docId"));
        var queue = Session.get("priority_queue");
        console.log("Find queue ", queue, " for changes.");
        if (doc && doc.changes && queue) {
            doc.changes.forEach( function(change) {
                //console.log("Checking change from model: ", change);
                queue.push(change);
            });
        }

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
                console.log("Change is from api, ignoring.");
            } else {
                var change = {timestamp: new Date().getTime(), user: null, uuid: Meteor.uuid(),
                    data: e.data};
                console.log("Recording change ", change);
                Session.get("priority_queue").receivedIds[change.uuid] = true;
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
}
