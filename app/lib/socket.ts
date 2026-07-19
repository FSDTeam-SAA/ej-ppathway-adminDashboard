"use client";

import { io, type Socket } from "socket.io-client";
import { API_BASE, getAccessToken } from "./api";

/**
 * The Socket.io server runs at the backend ORIGIN, i.e. the API base URL
 * WITHOUT the trailing `/api/v1`.
 * NEXT_PUBLIC_SOCKET_ORIGIN can override the derived origin when Socket.io is
 * hosted separately from the API.
 */
function deriveSocketOrigin(): string {
  const origin =
    process.env.NEXT_PUBLIC_SOCKET_ORIGIN ||
    API_BASE
      // Strip a trailing `/api/v1` (with or without trailing slash) and any
      // remaining trailing slashes so io() receives a bare origin.
      .replace(/\/api\/v1\/?$/, "")
      .replace(/\/+$/, "");
  return /^https?:\/\//i.test(origin) ? origin : "";
}

export const SOCKET_ORIGIN = deriveSocketOrigin();

let socket: Socket | null = null;

/**
 * Returns a shared Socket.io connection authenticated with the admin access
 * token. The connection is created lazily and reused across pages so we only
 * ever hold a single socket. Pass the latest token so reconnects use a fresh
 * credential.
 */
export function getSocket(): Socket | null {
  if (typeof window === "undefined") return null;
  const token = getAccessToken();
  if (!token || !SOCKET_ORIGIN) return null;

  if (socket) {
    // Keep auth in sync in case the token rotated since the socket was made.
    socket.auth = { token };
    if (!socket.connected) socket.connect();
    return socket;
  }

  socket = io(SOCKET_ORIGIN, {
    auth: { token },
    transports: ["websocket", "polling"],
    autoConnect: true,
  });
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
