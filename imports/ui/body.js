import { Template } from 'meteor/templating';
import { HTTP } from 'meteor/http'
import { Accounts } from 'meteor/accounts-base'
import { Mongo } from 'meteor/mongo';
import { dat } from '../api/dat.js';
import { col } from '../api/dat.js';
import { permList } from '../api/dat.js';
import './body.html';

Template.curr_user.helpers({
  getID: function() {
    var user = Meteor.user();
    return user._id;
  },
  update: function() {
    console.log('Calendar Redraw');
    var user = Meteor.user();
    $('#calendar').fullCalendar('removeEvents')
    if (user) {
      var id_list = permList.find({"id" : user._id}).fetch();
      var code_list = [user._id];
      for (var i=0; i < id_list.length; i++) {
        code_list.push(id_list[i].access);
      }
      var cur = dat.find({"id" : {$in: code_list}});
      cur.forEach(function render(event) {
        var n_event = {
          title: event.title,
          start: event.start,
          end: event.end,
          id: event._id,
          color: event.color
        };
        $('#calendar').fullCalendar('renderEvent', n_event, true);
      });
    };
    $('#calendar').fullCalendar('refresh');
  },
  firstName: function(){
    var user = Meteor.user();
    if (user) {
      return user.services.google.given_name;
    }
  },
  photoURL: function(){
    var user = Meteor.user();
    if (user) {
      return user.services.google.picture;
    }
  },
})

Template.body.events({
  'click .newCol'(event){
    // code goes here
    var randomColor = require('randomcolor'); // import the script
    var color_n = randomColor(); // a hex code for an attractive color
    var user = Meteor.user();
    col.remove({"_id" : user._id});
    col.insert({
      "_id" : user._id,
      "color" : color_n,
    });
  },
  'submit .new-perm'(event) {
    // Prevent default browser form submit
    event.preventDefault();

    // Get value from form element
    const target = event.target;
    const text = target.text.value;
    var user = Meteor.user();
    // Insert a task into the collection
    time = new Date();
    if (confirm('Are you sure you want to allow this user to view your caledar?')) {
      permList.insert({
        "id" : user._id,
        "access": text,
        "dateAdded": time,
      });
      // Clear form
      alert('User '+text+' has been added to the list of allowed users. Timestamp: '+time);
      target.text.value = '';
    } else {}
  },
})

Template.perms.helpers({
  getpermList: function() {
    console.log('Function Call');
    var user = Meteor.user()
    //console.log(user);
    if (user) {
      //console.log(permList.find({"id": user._id}).fetch());
      return permList.find({"id": user._id}).fetch();
    } else {}
  },
})

Template.disp_perms.helpers({
  time: function() {
    console.log('Function Time Call: ' + this.dateAdded);
    return 'Added on ' + this.dateAdded;
  },
  id: function() {
    console.log('Function ID Call: '+this.access);
    return this.access;
  },
})

Template.perms.events({
  'click .delete'() {
    permList.remove(this._id);
  },
});


$(document).ready(function(){
  function getCol() {
    var user = Meteor.user();
    var t = col.find({"_id": {$eq: user._id}})
    if (t.count() == 0) {
      var randomColor = require('randomcolor'); // import the script
      var color = randomColor(); // a hex code for an attractive color
      console.log('zero event trigger');
      col.insert({
        "_id" : user._id,
        "color" : color,
      });
      return color;
    } else {
      console.log('non-zero event trigger');
      var colour = 0;
      t.forEach(function ret_col(item) {
        //console.log(item.color);
        colour = item.color;
      });
      return colour;
    }
  }
  function newEvent(start,end) {
    console.log('Creation of New Event!');
    var user = Meteor.user();
    var col = getCol();
    console.log(col);
    dat.insert({
      "id" : user._id,
      "title": user.services.google.given_name,
      "start": start,
      "end": end,
      "color": col,
    });
  };
  $('#calendar').fullCalendar({
    selectable: true,
    unselectAuto: true,
    selectHelper: true,
    defaultView: 'agendaWeek',
    nowIndicator: true,
    slotEventOverlap: false,
    allDaySlot: false,
    select: function(startDate, endDate) {
      newEvent(startDate.format(),endDate.format());
      $('#calendar').fullCalendar('unselect');
      //alert('selected ' + startDate.format() + ' to ' + endDate.format());
    },
    eventClick: function(event, jsEvent, view) {
      if (confirm('Are you sure you want to delete this event?')) {
        dat.remove({"_id":event.id});
      } else {}
    }
  });
});
