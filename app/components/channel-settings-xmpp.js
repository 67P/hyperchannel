import Component from '@glimmer/component';

export default class ChannelSettingsXmppComponent extends Component {
  // Configuration keys to hide from the room config list
  hiddenConfigKeys = ['roomname'];

  get filteredRoomConfigData () {
    const configData = this.args.channel?.roomConfigData;
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
