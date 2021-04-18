import Service from '@ember/service';
import { isEmpty } from '@ember/utils';
import config from 'hyperchannel/config/environment';
import * as localforage from 'localforage';

const defaultValues = {
  userSettings: {
    nickname: null,
    currentSpace: config.defaultSpaceId,
    currentChannel: 'kosmos'
  }
};

export default class LocalDataService extends Service {

  constructor () {
    super(...arguments);
    this.stores = {
      userSettings: localforage.createInstance({ name: `hyperchannel:user-settings` })
    }
    this.setDefaultValues();
  }

  async setDefaultValues () {
    Object.keys(defaultValues).forEach(async storeName => {
      const store = this.stores[storeName];

      Object.keys(defaultValues[storeName]).forEach(async key => {
        const value = await store.getItem(key);
        const defaultValue = defaultValues[storeName][key];
        if (isEmpty(value)) { await store.setItem(key, defaultValue); }
      });
    });
  }

}
