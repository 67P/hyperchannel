import loadConfigFromMeta from '@embroider/config-meta-loader';
import { assert } from '@ember/debug';

const config = loadConfigFromMeta('hyperchannel');

// In development the build-time config sets `sockethubURL` to the sentinel
// "auto". Resolve it from the host serving the app, so the browser connects to
// Sockethub on the same machine it loaded the app from — localhost during
// local development, or the dev machine's address when accessed remotely
// (LAN/VPN). Test and production configs use explicit URLs.
if (config.sockethubURL === 'auto' && typeof window !== 'undefined') {
  config.sockethubURL = `${window.location.protocol}//${window.location.hostname}:10550`;
}

assert(
  'config is not an object',
  typeof config === 'object' && config !== null,
);
assert(
  'modulePrefix was not detected on your config',
  'modulePrefix' in config && typeof config.modulePrefix === 'string',
);
assert(
  'locationType was not detected on your config',
  'locationType' in config && typeof config.locationType === 'string',
);
assert(
  'rootURL was not detected on your config',
  'rootURL' in config && typeof config.rootURL === 'string',
);
assert(
  'APP was not detected on your config',
  'APP' in config && typeof config.APP === 'object',
);

export default config;
