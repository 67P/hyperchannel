export function initialize(application) {
  const storage = application.lookup('service:remotestorage');
  const remoteStorage = storage.rs;

  // Add to window global for debugging/development
  window.remoteStorage = remoteStorage;

  const rsEvents = [
    'ready',
    'not-connected',
    'connected',
    'disconnected',
    'error',
    'features-loaded',
    'connecting',
    'authing',
    'wire-busy',
    'wire-done',
    'network-offline',
    'network-online',
  ];

  remoteStorage.on('ready', () => {
    storage.rsReady = true;
  });

  rsEvents.forEach((evt) => {
    remoteStorage.on(evt, () =>
      console.debug(`[remotestorage] RS event: ${evt}`)
    );
  });
}

export default {
  name: 'remotestorage',
  initialize,
};
