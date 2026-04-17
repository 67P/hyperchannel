import Component from '@glimmer/component';

export default class LoadingSpinnerComponent extends Component {
  get classNames () {
    let out = "border-neutral-300 border-t-current animate-spin rounded-full";

    switch(this.args.size) {
      case "medium":
        out += " h-4 w-4 border-2"
        break;
      default:
        out += " h-4 w-4 border-2"
        break;
    }

    switch(this.args.position) {
      case "left":
        out += " mr-3";
        break;
      case "right":
        out += " ml-3";
        break;
      default:
        out += " mr-3";
        break;
    }

    return out;
  }
}
