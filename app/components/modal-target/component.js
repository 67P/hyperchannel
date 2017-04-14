import Ember from 'ember';

export default Ember.Component.extend({

  actions: {
    outsideClick(modal) {
      if (modal && modal.onOutsideClick) {
        modal.onOutsideClick();
      }
    }
  }

});

