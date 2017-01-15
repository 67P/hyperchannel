import Ember from 'ember';

export default Ember.Route.extend({

  smt: Ember.inject.service(),

  model(params) {
    var space = this.modelFor('space');
    var channel = space.get('channels').findBy('slug', params.slug);

    if (!channel) {
      channel = this.createChannelOrUserChannel(space, params.slug);
    }

    return channel;
  },

  setupController(controller, model) {
    this._super(controller, model);

    Ember.run.scheduleOnce('afterRender', function() {
      Ember.$('input#message-field').focus();
      Ember.$('#channel-content').animate({
        scrollTop: Ember.$('#channel-content ul').height()
      }, '500');
    });
  },

  actions: {

    didTransition() {
      let space = this.modelFor('space');
      let channel = this.controller.get('model');

      // Mark channel as active/visible
      space.get('channels').setEach('visible', false);
      channel.set('visible', true);

      // Mark unread messages as read
      channel.set('unreadMessages', false);
      channel.set('unreadMentions', false);
    }

  }

});
