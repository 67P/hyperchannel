import Ember from 'ember';

const {
  Controller,
  computed: {
    alias
  },
  inject: {
    service
  }
} = Ember;

export default Controller.extend({

  coms: service(),
  spaces: alias('coms.spaces'),

  showGlobalMenu: false,
  showChannelMenu: false

});
