import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import moment from 'moment';

export default class DateHeadlineComponent extends Component {

  @tracked headline = null;

  @action
  updateHeadline () {
    const date = moment(this.args.message.date);

    if (date.isSame(moment(), 'day')) {
      this.headline = 'Today';
    } else if (date.isSame(moment().subtract(1, 'day'), 'day')) {
      this.headline = 'Yesterday';
    } else {
      this.headline = this.args.message.date.toLocaleDateString();
    }
  }

}
