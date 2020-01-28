import Controller, { inject as controller } from '@ember/controller';

export default class SpaceChannelIndexController extends Controller {

  @controller space;
  @controller('space.channel') channel;

}
