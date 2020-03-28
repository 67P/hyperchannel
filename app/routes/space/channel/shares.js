import Route from '@ember/routing/route';

export default class SpaceChannelSharesRoute extends Route {

  activate () {
    if (window.innerWidth < 900) {
      this.controllerFor('application').showChannelMenu = true;
    }
  }

}
