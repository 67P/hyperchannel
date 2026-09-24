import Component from '@glimmer/component';
import filterRoomConfigData from 'hyperchannel/utils/filter-room-config-data';

export default class ChannelSettingsXmppComponent extends Component {

  get filteredRoomConfigData () {
    return filterRoomConfigData(this.args.channel?.roomConfigData);
  }

}
