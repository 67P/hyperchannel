import Ember from 'ember';

export default Ember.Component.extend({

  tagName: 'ul',

  actions: {

    joinChannel(space) {
      this.sendAction('joinChannel', space.get('id'));
    }

  }

});
