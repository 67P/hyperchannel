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
    window.localforage = localforage;
    this.stores = {
      userSettings: localforage.createInstance({
        name: 'hyperchannel', storeName: 'userSettings'
      })
    }
  }

  async setDefaultValues () {
    for (const storeName of Object.keys(defaultValues)) {
      const store = this.stores[storeName];

      for (const key of Object.keys(defaultValues[storeName])) {
        const value = await store.getItem(key);
        if (isEmpty(value)) {
          await store.setItem(key, defaultValues[storeName][key]);
        }
      }
    }
  }

}
