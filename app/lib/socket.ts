"use client";

import { io, type Socket } from "socket.io-client";
import { getAccessToken } from "./api";

/**
 * The Socket.io server runs at the backend ORIGIN, i.e. the API base URL
 * WITHOUT the trailing `/api/v1`.
 *
 * On Vercel the REST API is reached through a same-origin `/proxy-api/*` rewrite
 * (HTTP backend behind an HTTPS proxy). That trick does NOT work for Socket.io:
 * Vercel rewrites can't proxy WebSocket upgrades, so a relative/derived origin
 * can never reach the backend. Real-time features therefore need the backend on
 * a real wss:// origin — set NEXT_PUBLIC_SOCKET_ORIGIN to that when available.
 * Falls back to deriving from the API base (works in local dev where the API
 * base is an absolute http://localhost URL). Returns "" when no absolute
 * http(s) origin is available, which disables the socket.
 */
function deriveSocketOrigin(): string {
  const origin =
    process.env.NEXT_PUBLIC_SOCKET_ORIGIN ||
    (process.env.NEXT_PUBLIC_API_BASE_URL || "")
      // Strip a trailing `/api/v1` (with or without trailing slash) and any
      // remaining trailing slashes so io() receives a bare origin.
      .replace(/\/api\/v1\/?$/, "")
      .replace(/\/+$/, "");
  // Socket.io treats a relative string like `/proxy-api` as a *namespace* on the
  // current page origin, never the backend. Only an absolute URL can connect.
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
