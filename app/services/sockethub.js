import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';
import config from 'hyperchannel/config/environment';

export default class SockethubService extends Service {
  @tracked client = null;

  async initialize (/* baseURL */) {
    return this.loadSockethubLibs(config.sockethubURL).then(() => {
      this.client = new window.SockethubClient(
        window.io(config.sockethubURL, { path: '/sockethub' })
      );
    });
  }

  async loadSockethubLibs (baseURL) {
    await this.loadExternalScript(baseURL + '/socket.io.js');
    await this.loadExternalScript(baseURL + '/sockethub-client.js');
  }

  async loadExternalScript (url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      document.body.appendChild(script);
      script.onload = resolve;
      script.onerror = reject;
      script.async = true;
      script.src = url;
    });
  }
}
