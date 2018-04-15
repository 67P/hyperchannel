import Controller from '@ember/controller';
import { alias } from '@ember/object/computed';
import { inject as service } from '@ember/service';

export default Controller.extend({

  coms: service(),
  spaces: alias('coms.spaces'),

  showGlobalMenu: false,
  showChannelMenu: false

});
