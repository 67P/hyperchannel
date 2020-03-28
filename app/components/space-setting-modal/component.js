import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import Space from 'hyperchannel/models/space';

export default class SpaceSettingModal extends Component {

  @tracked space = null;

  constructor () {
    super(...arguments);

    // create a clone of the settings that we can operate on
    const space = Space.create();
    space.setProperties(this.args.settings.serialize());
    this.space = space;
  }

  @action
  save() {
    this.onSave(this.space);
  }

  @action
  cancel() {
    this.onCancel();
  }

}
