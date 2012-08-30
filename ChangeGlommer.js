
console.log("Loading ChangeGlommer");
//Default chunking period of changes, in ms
var GLOMMER_DEFAULT_REASONABLE_PAUSE = 400;

var INSERT = 'insertText';


ChangeGlommer = function(reasonable_pause_ms, callbacks) { 
    this.reasonable_pause_ms = reasonable_pause_ms || GLOMMER_DEFAULT_REASONABLE_PAUSE;
    this.callbacks = callbacks || [];
    this.pending_queue = [];
    this.glommed_queue = [];
    this.timeout_id = null;
};

ChangeGlommer.prototype = {
    push: function(change) {
        this.pending_queue.push(change);
        if (this.timeout_id) clearTimeout(this.timeout_id);
        var self = this;
        this.timeout_id = setTimeout(function() {
            console.log("Calling glom.");
           self.glom(); 
        }, GLOMMER_DEFAULT_REASONABLE_PAUSE);
    },

    shift: function() {
        return this.glommed_queue.shift();
    },

    //Combine any number of changes
    glom: function() {
        var change = null;
        while (this.pending_queue.length > 0) {
            if (!change) {
                change = this.pending_queue.shift();
            } else {
                //Combine next change with previous, "glommed" changes
                var next_change = this.pending_queue.shift();
                if ( this.should_combine(change, next_change) ) {

                    change = this.combine_changes(change, next_change);
                } else {
                    console.log("Pushing glommed change " + JSON.stringify(change));
                    this.glommed_queue.push(change);
                    change = next_change;
                }
            }
        }
        if (change) this.glommed_queue.push(change);
        console.log("Finished glomming with glommed_queue: " + JSON.stringify(this.glommed_queue));
        if (this.glommed_queue.length > 0) {
            for (var i in this.callbacks) {
                console.log("Calling callback: " + this.callbacks[i]);
                this.callbacks[i]();
            }
        }
    },

    should_combine: function(change1, change2) {
        //console.log("Checking should_combined for change1: " + JSON.stringify(change1) +
                //" and change2: " + JSON.stringify(change2));
        if (!change2) {
            console.log("No change2, returning false.");
            return false;
        }
        if ( change1.user != change2.user ) {
            console.log("Users are not equal, returning false.");
            return false;
        }
        if ( (change2.timestamp - change1.timestamp) > this.reasonable_pause_ms ) {
            console.log("Timestamps are too far apart, returning false.");
            return false;
        }

        console.log("Returning true from should_combine.");
        return true;
    },

    combine_changes: function(change1, change2) {
        //TODO: Stub out Meteor.uuid().
        //var new_change = {uuid:Meteor.uuid(), user:change1.user, timestamp:change1.timestamp, data:{}};
        var new_change = {uuid:Math.random() + "", user:change1.user, timestamp:change1.timestamp, data:{}};
        if (change1.data.action == INSERT && change2.data.action == INSERT) {
            console.log("Combining change with action " + change1.data.action + " and action2: " + change2.data.action);
            new_change.data.action = INSERT;
            new_change.data.text = change1.data.text + change2.data.text;
            new_change.data.range = {start:change1.data.range.start, end:change2.data.range.end};
        }
        console.log("Returning combined change: " + JSON.stringify(new_change));
        return new_change;
    }

          
};


