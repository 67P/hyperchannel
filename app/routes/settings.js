import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { isEmpty } from '@ember/utils';
import RSVP from 'rsvp';
import Ember from 'ember';
import Space from 'hyperchannel/models/space';
import config from 'hyperchannel/config/environment';

const {
  Logger
} = Ember;

export default Route.extend({

  storage: service('remotestorage'),
  coms: service(),

  model() {
    let rsKosmos = this.get('storage.rs').kosmos;

    let spaces = rsKosmos.spaces.getAll().then(
      res => {
        let col = [];
        if (isEmpty(res)) { return col; }
        Object.keys(res).forEach(id => {
          const space = Space.create();
          space.setProperties(res[id]);
          col.push(space);
        });
        return col;
      },
      e => {
        Logger.error(e);
      }
    );

    return RSVP.hash({
      spaces: spaces,
      spacePresets: config.spacePresets.map((preset) => {
        const space = Space.create();
        space.setProperties(preset);
        return space;
      })
    });
  },

  setupController(controller) {
    this._super(...arguments);
    controller.set('newSpace', Space.create());
  },

  actions: {

    addSpace() {
      let newSpace = this.controller.get('newSpace');
      newSpace.set('id', newSpace.get('name').dasherize());

      this.get('storage').saveSpace(newSpace)
        .then(() => {
            this.get('coms').connectAndAddSpace(newSpace);
            this.modelFor('settings').spaces.pushObject(newSpace);
          }, e => {
            Logger.error('error saving in RS', newSpace, e);
          }
        );
    },

    removeSpace(space) {
      this.get('storage').removeSpace(space)
        .then(() => {
            this.modelFor('settings').spaces.removeObject(space);
          }, e => {
            Logger.error('error deleting from RS', space, e);
          }
        );
    }

  }

});
