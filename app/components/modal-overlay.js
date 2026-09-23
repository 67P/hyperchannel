import Component from '@glimmer/component';

export default class ModalOverlayComponent extends Component {

  constructor () {
    super(...arguments);
    document.addEventListener('keydown', this.handleKeydown);
  }

  willDestroy () {
    super.willDestroy(...arguments);
    document.removeEventListener('keydown', this.handleKeydown);
  }

  handleKeydown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.args.onClose();
    }
  };

}
