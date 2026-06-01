import Controller, { inject as controller } from '@ember/controller';

export default class ChannelSettingsController extends Controller {
  @controller('channel') channel;

  // Configuration keys to hide from the room config list
  hiddenConfigKeys = ['roomname'];

  get filteredRoomConfigData () {
    const configData = this.channel?.model?.roomConfigData;
    if (!configData) {
      return null;
    }

    const filtered = {};
    let hasKeys = false;
    for (const [key, value] of Object.entries(configData)) {
      if (!this.hiddenConfigKeys.includes(key)) {
        filtered[key] = value;
        hasKeys = true;
      }
    }
    return hasKeys ? filtered : null;
  }
}
