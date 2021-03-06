import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { isEmpty } from '@ember/utils';
import RSVP from 'rsvp';
import Space from 'hyperchannel/models/space';
import config from 'hyperchannel/config/environment';

export default class SettingsRoute extends Route {

  @service('remotestorage') storage;
  @service() coms;

  model () {
    let rsKosmos = this.storage.rs.kosmos;

    let spaces = rsKosmos.spaces.getAll().then(
      res => {
        let col = [];
        if (isEmpty(res)) { return col; }
        Object.keys(res).forEach(id => {
          const space = new Space(res[id]);
          col.push(space);
        });
        return col;
      },
      e => {
        console.error(e);
      }
    );

    return RSVP.hash({
      spaces: spaces,
      spacePresets: config.spacePresets.map((preset) => {
        const space = new Space(preset);
        return space;
      })
    });
  }

  setupController(controller) {
    super.setupController(...arguments);
    controller.newSpace = new Space();
  }

}
