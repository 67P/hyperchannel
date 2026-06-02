import type SockethubClient from '@sockethub/client';
import type { ManagerOptions, Socket, SocketOptions } from 'socket.io-client';

// Both socket.io and the sockethub client bundle are loaded at runtime from the
// server (sockethub.js service, _loadSockethubLibs) so that the versions always
// match the running server. These declarations give the editor correct types for
// window.io and window.SockethubClient using the npm packages as type sources only.
declare global {
  interface Window {
    io: (url: string, opts?: Partial<ManagerOptions & SocketOptions>) => Socket;
    SockethubClient: typeof SockethubClient;
  }
}
