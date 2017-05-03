import Ember from 'ember';
import Space from 'hyperchannel/models/space';
import config from 'hyperchannel/config/environment';

export default Ember.Route.extend({

  storage: Ember.inject.service('remotestorage'),

  model() {
    let rsKosmos = this.get('storage.rs').kosmos;

    let spaces = rsKosmos.spaces.getAll().then(
      res => {
        let col = [];
        if (Ember.isEmpty(res)) { return col; }
        Object.keys(res).forEach(id => {
          col.push(Space.create(res[id]));
        });
        return col;
      },
      e => {
        console.error(e);
      }
    );

    return Ember.RSVP.hash({
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

      this.get('storage').saveSpace(newSpace)
        .then(() => {
            this.modelFor('settings').spaces.pushObject(newSpace);
          }, e => {
            Ember.Logger.error('error saving in RS', newSpace, e);
          }
        );
    },

    removeSpace(space) {
      this.get('storage').removeSpace(space)
        .then(() => {
            this.modelFor('settings').spaces.removeObject(space);
          }, e => {
            Ember.Logger.error('error deleting from RS', space, e);
          }
        );
    }

  }

});
