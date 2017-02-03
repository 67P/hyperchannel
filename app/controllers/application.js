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

  smt: service(),
  spaces: alias('smt.spaces'),

  showGlobalMenu: false,
  showChannelMenu: false

});
