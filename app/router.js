import EmberRouter from '@ember/routing/router';
import config from './config/environment';

const Router = EmberRouter.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {
  this.route('space', { path: '/:id' }, function() {
    this.route('channel', { path: '/channel/:slug' });
    this.route('user-channel', { path: '/user/:slug' });
  });

  this.route('settings');
});

export default Router;
