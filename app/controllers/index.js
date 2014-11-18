import Ember from 'ember';

export default Ember.Controller.extend({

  needs: ['application'],
  chatMessage: null,

  actions: {
    sendMessage: function() {
      this.get('controllers.application').sendMessage(this.get('chatMessage')).then(function() {
        this.set('chatMessage', null);
      }.bind(this));
    }
  }

})

