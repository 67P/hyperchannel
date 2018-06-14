import StorageObject from 'ember-local-storage/local/object';
import config from 'hyperchannel/config/environment';

const Storage = StorageObject.extend();

Storage.reopenClass({
  initialState() {
    return {
      nickname: null,
      currentSpace: config.defaultSpaceId,
      currentChannel: 'kosmos'
    };
  }
});

export default Storage;
