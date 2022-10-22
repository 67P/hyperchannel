import Service, { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import config from 'hyperchannel/config/environment';

export default class SockethubService extends Service {
  @service logger;

  @tracked client = null;

  async initialize (/* baseURL */) {
    return this.loadSockethubLibs(config.sockethubURL).then(() => {
      this.client = new window.SockethubClient(
        window.io(config.sockethubURL, { path: '/sockethub' })
      );
      this.client.socket.on('connect', () => {
        this.logger.log('sockethub', 'connected');
        this.client.socket.removeAllListeners();
      });
      this.client.socket.on('disconnect', () => {
        this.logger.log('sockethub', 'disconnected');
        this.client.socket.removeAllListeners();
      });
    });
  }

  async loadSockethubLibs (baseURL) {
    try {
      await this.loadExternalScript(baseURL + '/socket.io.js');
      await this.loadExternalScript(baseURL + '/sockethub-client.js');
    } catch(e) {
      const msg = `Could not load Sockethub client library from ${e.target.src}`;
      console.warn(msg);
      throw(msg);
    }
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
