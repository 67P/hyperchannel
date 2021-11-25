import { A } from '@ember/array';

// class Server {
//   @tracked hostname = null;
//   @tracked port = 7000;
//   @tracked secure = true;
//   @tracked nickServ = {
//     password: null
//   };
// }

export default class Space {
  // Keep a list of all old sockethubPersonIds, because there might
  // still be coming events from Sockethub for those.
  previousSockethubPersonIds = A([]);

  // FIXME adapt to new accounts/channels
  updateUsername(username) {
    // keep track of old name for later reference
    this.previousSockethubPersonIds.pushObject(this.sockethubPersonId);

    switch (this.protocol) {
      case 'IRC':
        this.nickname = username;
        break;
      case 'XMPP':
        this.username = username;
        break;
    }
  }
}
