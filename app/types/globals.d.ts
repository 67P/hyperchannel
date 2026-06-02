import type SockethubClient from '@sockethub/client';

// The sockethub client bundle is loaded at runtime from the server
// (sockethub.js service, _loadClientScript) so that the client-side
// schema validation always matches the running server's version.
// This declaration gives the editor the correct type for window.SockethubClient
// using the npm package as a type source only.
declare global {
  interface Window {
    SockethubClient: typeof SockethubClient;
  }
}
