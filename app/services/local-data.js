import Service from '@ember/service';
import { isEmpty } from '@ember/utils';
import * as localforage from 'localforage';
// import config from 'hyperchannel/config/environment';

const defaultValues = {
  userSettings: {
    // nickname: null
  }
};

export default class LocalDataService extends Service {

  constructor () {
    super(...arguments);
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
