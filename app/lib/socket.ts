"use client";

import { io, type Socket } from "socket.io-client";
import { getAccessToken } from "./api";

/**
 * The Socket.io server runs at the backend ORIGIN, i.e. the API base URL
 * WITHOUT the trailing `/api/v1`. Derive it from NEXT_PUBLIC_API_BASE_URL.
 */
function deriveSocketOrigin(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  // Strip a trailing `/api/v1` (with or without trailing slash) and any
  // remaining trailing slashes so io() receives a bare origin.
  return base
    .replace(/\/api\/v1\/?$/, "")
    .replace(/\/+$/, "");
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
  if (!token) return null;

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
