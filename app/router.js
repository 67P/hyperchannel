import EmberRouter from '@ember/routing/router';
import config from 'hyperchannel/config/environment';

export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function() {
  this.route('space', { path: '/:id' }, function() {
    this.route('channel', { path: '/channel/:slug' }, function() {
      this.route('settings');
      this.route('shares');
    });
    this.route('user-channel', { path: '/user/:slug' });
  });

  this.route('settings');
});
