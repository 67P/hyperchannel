import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import Space from 'hyperchannel/models/space';

export default class SpaceSettingModal extends Component {

  @tracked space = null;

  constructor () {
    super(...arguments);

    // create a clone of the settings that we can operate on
    this.space = new Space(this.args.settings.serialize());
  }

  @action
  save(event) {
    event.preventDefault();
    this.args.onSave(this.space);
  }

  @action
  cancel() {
    this.args.onCancel();
  }

}
