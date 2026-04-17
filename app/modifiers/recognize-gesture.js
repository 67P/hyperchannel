import Modifier from 'ember-modifier';
import Hammer from 'hammerjs';

export default class RecognizeGestureModifier extends Modifier {
  manager = null;
  recognizers = [];

  modify (element, positional, named) {
    // positional args are gesture names: ['swipeleft', 'swiperight', 'tap']
    const gestures = positional || [];
    const { domEvents = false, touchAction = 'auto', inputClass } = named;

    // Clean up existing manager if any
    if (this.manager) {
      this.manager.destroy();
    }

    // Create Hammer manager
    const options = {
      domEvents,
      touchAction,
      inputClass
    };

    // Remove undefined options
    Object.keys(options).forEach(key => {
      if (options[key] === undefined) {
        delete options[key];
      }
    });

    this.manager = new Hammer.Manager(element, options);
    this.recognizers = [];

    // Add recognizers for each gesture
    gestures.forEach(gestureName => {
      let recognizer;
      const name = gestureName.toLowerCase();

      if (name === 'swipeleft' || name === 'swiperight') {
        recognizer = new Hammer.Swipe({
          direction: name === 'swipeleft' ? Hammer.DIRECTION_LEFT : Hammer.DIRECTION_RIGHT
        });
      } else if (name === 'tap') {
        recognizer = new Hammer.Tap();
      } else if (name === 'pan') {
        recognizer = new Hammer.Pan();
      } else if (name === 'pinch') {
        recognizer = new Hammer.Pinch();
      } else if (name === 'press') {
        recognizer = new Hammer.Press();
      } else if (name === 'rotate') {
        recognizer = new Hammer.Rotate();
      } else if (name === 'swipe') {
        recognizer = new Hammer.Swipe();
      }

      if (recognizer) {
        this.manager.add(recognizer);
        this.recognizers.push(recognizer);
      }
    });
  }

  willRemove () {
    if (this.manager) {
      this.manager.destroy();
      this.manager = null;
    }
    this.recognizers = [];
  }
}
