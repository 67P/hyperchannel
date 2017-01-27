import Ember from 'ember';
import Space from 'hyperchannel/models/space';

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
      // TODO use space models
      spaces: spaces
    });
  },

  setupController(controller) {
    this._super(...arguments);
    controller.set('newSpace', Space.create());
  },

  actions: {

    addSpace() {
      let newSpace = this.controller.get('newSpace');
      let params   = newSpace.serialize();

      this.get('storage.rs').kosmos.spaces.store(params)
        .then((/*d*/) => {
            this.modelFor('settings').spaces.pushObject(newSpace);
          }, e => {
            console.log('error saving in RS', e, params);
          }
        );
    },

    removeSpace(space) {
      // TODO this is buggy in the current rs.js beta branch
      this.get('storage.rs').kosmos.spaces.remove(space.get('id'))
        .then((/*d*/) => {
            this.modelFor('settings').spaces.removeObject(space);
          }, e => {
            Ember.Logger.debug('error deleting from RS', space);
            console.error(e);
          }
        );
    }

  }

});
