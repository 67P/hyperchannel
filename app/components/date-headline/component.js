import Component from '@glimmer/component';
import { later } from '@ember/runloop';
import { tracked } from '@glimmer/tracking';
import moment from 'moment';
import config from '../../config/environment';
import { action } from '@ember/object';

export default class DateHeadlineComponent extends Component {

  @tracked headline = null;

  updateInterval = 120000; // 2 minutes

  setHeadline (messageDate) {
    const date = moment(messageDate);

    if (date.isSame(moment(), 'day')) {
      this.headline = 'Today';
    } else if (date.isSame(moment().subtract(1, 'day'), 'day')) {
      this.headline = 'Yesterday';
    } else {
      this.headline = messageDate.toLocaleDateString();
    }
  }

  @action
  scheduleUpdate () {
    this.setHeadline(this.args.message.date);

    // don't schedule updates during testing, because it makes the tests time out
    if (config.environment === 'test') return;

    if (this.headline === 'Today' || this.headline === 'Yesterday') {
      later(this.scheduleUpdate, this.updateInterval);
    }
  }

}
