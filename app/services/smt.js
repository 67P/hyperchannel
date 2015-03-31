import Ember from 'ember';
import Space   from 'hyperchannel/models/space';
import Channel from 'hyperchannel/models/channel';
// import User    from 'hyperchannel/models/channel';

// TODO Use Ember.Service when upgrading to latest version
export default Ember.Object.extend({

  spaces: null,
  // users:  null,

  loadFixtures: function() {
    this.instantiateSpaces();
    this.instantiateChannels();
  },

  instantiateSpaces: function() {
    this.set('spaces', []);

    Object.keys(this.get('spaceFixtures')).forEach(function(spaceName){
      this.get('spaces').pushObject(
        Space.create({name: spaceName})
      );
    }.bind(this));
  },

  instantiateChannels: function() {
    this.get('spaces').forEach(function(space) {
      space.set('channels', []);

      var channel;
      this.get('spaceFixtures')[space.get('name')].forEach(function(fixture){
        channel = Channel.create({name: fixture.name});
        channel.set('userList', fixture.userList);
        space.get('channels').pushObject(channel);
      });
    }.bind(this));
  },

  spaceFixtures: function() {
    var usernames = this.get('userFixtures').mapBy('username');

    return {
      'Freenode': [
        { name: '#67p', userList: usernames.concat(['bacilla','gillisig']) },
        { name: '#kosmos', userList: usernames.concat(['bacilla']) },
        { name: '#kosmos-dev', userList: usernames.concat(['melvster','timbl']) },
        { name: '#sockethub', userList: usernames.concat(['melvster']) }
      ],
      'Enterprise': [
        { name: '#10forward', userList: usernames.concat(['ryker','gainan']) },
        { name: '#bridge', userList: usernames.concat(['jlpicard']) },
        { name: '#holodeck', userList: usernames.concat(['jordielaforge']) }
      ],
    };
  }.property('userFixtures'),

  userFixtures: function() {
    return [
      { username: 'bkero' },
      { username: 'derbumi' },
      { username: 'galfert' },
      { username: 'gregkare' },
      { username: 'jaaan' },
      { username: 'LSA232' },
      { username: 'raucao' },
      { username: 'slvrbckt' }
    ];
  }.property(),

});
