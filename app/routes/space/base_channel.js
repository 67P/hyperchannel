import Ember from 'ember';

export default Ember.Route.extend({

  model: function(params) {
    var space = this.modelFor('space');
    var channel = space.get('channels').findBy('slug', params.slug);
    if (!channel) {
      channel = this.createChannelOrUserChannel(space, params.slug);
    }
    return channel;
  },

  setupController: function(controller, model) {
    this._super(controller, model);

    Ember.run.scheduleOnce('afterRender', function() {
      Ember.$('input#message-field').focus();
      Ember.$('#channel-content').animate({
        scrollTop: Ember.$('#channel-content ul').height()
      }, '500');
    });
  }

});
