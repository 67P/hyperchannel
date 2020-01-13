import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class ModalTargetComponent extends Component {

  modalAnimation () {
    return this.lookup('explode').call(this, {
      pick: '.modal-background',
      use: ['fade', { maxOpacity: 0.5, duration: 200 }]
    }, {
      pick: '.modal-dialog',
      use: ['scale', { duration: 200 }]
    });
  }

  @action
  outsideClick (modal) {
    if (modal && modal.onOutsideClick) {
      modal.onOutsideClick();
    }
  }

}
