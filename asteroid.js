var editString = "";

if (Meteor.is_client) {
  Template.hello.greeting = function () {
    return "Welcome to asteroid.";
  };

  Template.hello.editString = editString;

  Template.hello.events = {
    'click input' : function () {
      // template data, if any, is available in 'this'
      if (typeof console !== 'undefined')
        console.log("You pressed the button");
    }
  };

  $('#editArea').keyup(function() {
      editString = Template.hello.editString.value;
  });
}

if (Meteor.is_server) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
