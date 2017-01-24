import Ember from 'ember';
import RemoteStorage from 'npm:remotestoragejs';

export default Ember.Service.extend({

  rsInstance: null,

  rs: function() {
    return this.get('rsInstance') || new RemoteStorage({logging: true});
  }.property('rs')

});
