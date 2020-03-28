import Controller, { inject as controller } from '@ember/controller';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { notEmpty } from '@ember/object/computed';
import { tracked } from '@glimmer/tracking';

export default class SettingsController extends Controller {

  @controller application;
  @service coms;
  @service('remotestorage') storage;

  @tracked newSpace = null;
  @tracked selectedSpacePreset = null;

  @notEmpty('selectedSpacePreset') showSpaceSettingModal;

  @action
  addSpaceFromPreset (preset) {
    this.selectedSpacePreset = preset;
  }

  @action
  saveSpace (space) {
    this.selectedSpacePreset = null;

    this.storage.saveSpace(space).then(() => {
      this.coms.connectAndAddSpace(space);
    });
  }

  @action
  addSpace() {
    const newSpace = this.controller.newSpace;
    newSpace.id = newSpace.name.dasherize();

    this.storage.saveSpace(newSpace)
      .then(() => {
          this.coms.connectAndAddSpace(newSpace);
          this.model.spaces.pushObject(newSpace);
        })
      .catch(e => console.error('Could not store space in RS', newSpace, e));
  }

  @action
  removeSpace (space) {
    this.storage.removeSpace(space)
      .then(() => this.model.spaces.removeObject(space))
      .catch(e => console.error('Could not delete space from RS', space, e));
  }

}
