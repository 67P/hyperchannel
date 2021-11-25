import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class JoinChannelIrcComponent extends Component {
  @service router;
  @service coms;

  @tracked channelName = '';

  @action joinChannel(e) {
    e.preventDefault();

    if (!this.channelName.match(/^#/)) {
      this.channelName = `#${this.channelName}`;
    }

    const channel = this.coms.createChannel(
      this.args.account,
      this.channelName,
      { saveConfig: true }
    );

    // TODO wait for join success before transitioning
    this.router.transitionTo('channel', channel);

    this.args.closeModal();
  }
}
