import Component from '@glimmer/component';
import { later } from '@ember/runloop';
import moment from 'moment';
import config from '../../config/environment';

export default class DateHeadlineComponent extends Component {

  updateInterval = 120000; // 2 minutes

  get headline () {
    const date = moment(this.args.message.date);

    const scheduleUpdate = () => {
      // don't schedule updates during testing, because it makes the tests time out
      if (!config.environment === 'testing') {
        later(() => {
          // invalidate the date field to re-compute the headline property
          let messageDate = this.args.message.date;
          this.args.message.date = messageDate;
          // this.notifyPropertyChange('message.date');
        }, this.updateInterval);
      }
    };

    if (date.isSame(moment(), 'day')) {
      scheduleUpdate();
      return 'Today';
    }

    if (date.isSame(moment().subtract(1, 'day'), 'day')) {
      scheduleUpdate();
      return 'Yesterday';
    }

    return this.args.message.date.toLocaleDateString();
  }

}
