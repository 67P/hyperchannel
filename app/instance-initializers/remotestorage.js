export function initialize(appInstance) {
  let storage = appInstance.lookup('service:remotestorage');
  let remoteStorage = storage.get('rs');

  // Add to window global for debugging/development
  window.remoteStorage = remoteStorage;

  let rsEvents = [
    'ready', 'not-connected', 'connected', 'disconnected', 'error',
    'features-loaded', 'connecting', 'authing', 'wire-busy', 'wire-done',
    'network-offline', 'network-online'
  ];

  rsEvents.forEach(evt => {
    remoteStorage.on(evt, () => console.debug(`[remotestorage] RS event: ${evt}`));
  });
}

export default {
  name: 'remotestorage',
  initialize
};
