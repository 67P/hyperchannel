import Component from '@glimmer/component';
import { inject as service } from '@ember/service';

export default class AddChatAccountIrcComponent extends Component {

  @service coms;
  @service('sockethub-irc') irc;
  @service('remotestorage') storage;

}
