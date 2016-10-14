import Ember   from 'ember';

export default Ember.Controller.extend({

  spaces: Ember.computed.alias('smt.spaces')

});

