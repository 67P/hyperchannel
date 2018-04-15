import Controller, { inject as controller } from '@ember/controller';
import { inject as service } from '@ember/service';
import { notEmpty } from '@ember/object/computed';

export default Controller.extend({

  application: controller(),
  coms: service(),
  storage: service('remotestorage'),

  newSpace: null,
  selectedSpacePreset: null,

  showSpaceSettingModal: notEmpty('selectedSpacePreset'),

  actions: {
    addSpaceFromPreset(preset) {
      this.set('selectedSpacePreset', preset);
    },

    saveSpace(space) {
      this.set('selectedSpacePreset', null);

      this.get('storage').saveSpace(space).then(() => {
        this.get('coms').connectAndAddSpace(space);
      });
    }
  }

});
