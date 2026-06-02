import Component from '@glimmer/component';

export default class LoadingSpinnerComponent extends Component {
  get classNames () {
    let out = 'border-neutral-300 border-t-current animate-spin rounded-full';

    switch (this.args.size) {
      case 'large':
        out += ' h-6 w-6 border-2';
        break;
      case 'medium':
      default:
        out += ' h-4 w-4 border-2';
        break;
    }

    switch (this.args.position) {
      case 'left':
        out += ' mr-3';
        break;
      case 'right':
        out += ' ml-3';
        break;
      case 'none':
        break;
      default:
        out += ' mr-3';
        break;
    }

    return out;
  }
}
