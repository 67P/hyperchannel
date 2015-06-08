import Ember from 'ember';

export default Ember.TextField.extend({

  keyUp: function(ev) {
    // console.debug('keyUp', ev);

    if (ev.altKey) {
      switch (ev.key) {
        case 'k':
          this._insertAtCaret('\u0003');
          break;
      }
    }
  },

  _insertAtCaret: function(myValue) {
    let el = this.$().get(0);

    if (document.selection) {
      el.focus();
      el = document.selection.createRange();
      el.text = myValue;
      el.focus();
    }
    else if (el.selectionStart || el.selectionStart === '0') {
      const startPos = el.selectionStart;
      const endPos = el.selectionEnd;
      const scrollTop = el.scrollTop;
      el.value = el.value.substring(0, startPos)+myValue+el.value.substring(endPos,el.value.length);
      el.focus();
      el.selectionStart = startPos + myValue.length;
      el.selectionEnd = startPos + myValue.length;
      el.scrollTop = scrollTop;
    } else {
      el.value += myValue;
      el.focus();
    }
  }

});
