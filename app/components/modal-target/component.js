import Component from '@ember/component';

export default Component.extend({

  modalAnimation() {
    return this.lookup('explode').call(this, {
      pick: '.modal-background',
      use: ['fade', { maxOpacity: 0.5 }]
    }, {
      pick: '.modal-dialog',
      use: 'scale'
    });
  },

  actions: {
    outsideClick(modal) {
      if (modal && modal.onOutsideClick) {
        modal.onOutsideClick();
      }
    }
  }

});

