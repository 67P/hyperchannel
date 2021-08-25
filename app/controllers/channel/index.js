import Controller, { inject as controller } from '@ember/controller';

export default class ChannelIndexController extends Controller {
  @controller('channel') channel;

  get allowUserChannels () {
    // FIXME allow when fixed for IRC
    // TODO implement channel DMs for XMPP
    return false;
  }
}
