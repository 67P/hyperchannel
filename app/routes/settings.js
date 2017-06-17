import Ember from 'ember';
import Space from 'hyperchannel/models/space';
import config from 'hyperchannel/config/environment';

const {
  Route,
  inject: {
    service
  },
  isEmpty,
  Logger,
  RSVP
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
          col.push(Space.create(res[id]));
        });
        return col;
      },
      e => {
        Logger.error(e);
      }
    );

    return RSVP.hash({
      spaces: spaces,
      spacePresets: config.spacePresets.map((preset) => Space.create(preset))
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
