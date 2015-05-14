import Ember from 'ember';
import config from './config/environment';

var Router = Ember.Router.extend({
  location: config.locationType
});

Router.map(function() {
  this.resource('space', {path: '/:id'}, function(){
    this.route('channel', {path: '/:slug'});
  });

  this.route('settings');
});

export default Router;
