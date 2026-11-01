import { Peer, type DataConnection } from "peerjs";

export interface TransferPayload {
  type: "PING" | "PONG" | "FILE" | "ACK";
  name?: string;
  mimeType?: string;
  buffer?: ArrayBuffer;
}

function getSafePeerId(sessionId: string): string {
  const clean = sessionId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 32);
  return `fold-sess-${clean}`;
}

function getChannelName(sessionId: string): string {
  return `fold-transfer-${sessionId}`;
}

export class MobileTransferHost {
  private peer: Peer | null = null;
  private channel: BroadcastChannel | null = null;
  private connections = new Set<DataConnection>();
  private closed = false;

  constructor(
    private sessionId: string,
    private onFileReceived: (file: File) => void | Promise<void>,
  ) {
    this.init();
  }

  private init() {
    // 1. BroadcastChannel for instant same-browser / multi-tab transfer
    if (typeof BroadcastChannel !== "undefined") {
      try {
        this.channel = new BroadcastChannel(getChannelName(this.sessionId));
        this.channel.onmessage = (event) => {
          this.handlePayload(event.data);
        };
      } catch {
        // BroadcastChannel unavailable in this environment
      }
    }

    // 2. PeerJS WebRTC DataChannel for cross-device P2P transfer
    try {
      const peerId = getSafePeerId(this.sessionId);
      this.peer = new Peer(peerId, {
        debug: 0,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:global.stun.twilio.com:3478" },
          ],
        },
      });

      this.peer.on("connection", (conn) => {
        this.connections.add(conn);

        conn.on("open", () => {
          conn.send({ type: "PONG" });
        });

        conn.on("data", (data) => {
          this.handlePayload(data as TransferPayload, conn);
        });

        conn.on("close", () => {
          this.connections.delete(conn);
        });

        conn.on("error", () => {
          this.connections.delete(conn);
        });
      });

      this.peer.on("error", () => {
        // Peer error handled silently
      });
    } catch {
      // PeerJS unavailable or WebRTC disabled
    }
  }

  private handlePayload(payload: TransferPayload, conn?: DataConnection) {
    if (!payload || this.closed) return;

    if (payload.type === "PING") {
      const pong: TransferPayload = { type: "PONG" };
      if (conn && conn.open) {
        conn.send(pong);
      }
      if (this.channel) {
        try {
          this.channel.postMessage(pong);
        } catch {}
      }
      return;
    }

    if (payload.type === "FILE" && payload.buffer) {
      const filename = payload.name || `mobile-upload-${Date.now()}.jpg`;
      const mimeType = payload.mimeType || "image/jpeg";
      const file = new File([payload.buffer], filename, { type: mimeType });

      void this.onFileReceived(file);

      const ack: TransferPayload = { type: "ACK", name: filename };
      if (conn && conn.open) {
        conn.send(ack);
      }
      if (this.channel) {
        try {
          this.channel.postMessage(ack);
        } catch {}
      }
    }
  }

  public close() {
    this.closed = true;
    for (const conn of this.connections) {
      try {
        conn.close();
      } catch {}
    }
    this.connections.clear();

    if (this.channel) {
      try {
        this.channel.close();
      } catch {}
      this.channel = null;
    }

    if (this.peer) {
      try {
        this.peer.destroy();
      } catch {}
      this.peer = null;
    }
  }
}

export class MobileTransferClient {
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  private channel: BroadcastChannel | null = null;
  private onConnectedCallbacks = new Set<() => void>();
  private ackResolvers = new Map<string, () => void>();
  private isReady = false;
  private closed = false;

  constructor(private sessionId: string) {
    this.init();
  }

  private init() {
    // 1. BroadcastChannel
    if (typeof BroadcastChannel !== "undefined") {
      try {
        this.channel = new BroadcastChannel(getChannelName(this.sessionId));
        this.channel.onmessage = (event) => {
          this.handlePayload(event.data);
        };
      } catch {}
    }

    // 2. PeerJS
    try {
      this.peer = new Peer({
        debug: 0,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:global.stun.twilio.com:3478" },
          ],
        },
      });

      this.peer.on("open", () => {
        if (this.closed || !this.peer) return;
        const hostId = getSafePeerId(this.sessionId);
        const connection = this.peer.connect(hostId, { reliable: true });

        connection.on("open", () => {
          this.conn = connection;
          this.setConnected();
        });

        connection.on("data", (data) => {
          this.handlePayload(data as TransferPayload);
        });

        connection.on("close", () => {
          if (this.conn === connection) this.conn = null;
        });
      });

      this.peer.on("error", () => {
        // Fallback remains active
      });
    } catch {}

    // Same-device ping via BroadcastChannel
    if (this.channel) {
      try {
        this.channel.postMessage({ type: "PING" });
      } catch {}
    }
  }

  private handlePayload(payload: TransferPayload) {
    if (!payload || this.closed) return;

    if (payload.type === "PONG") {
      this.setConnected();
      return;
    }

    if (payload.type === "ACK" && payload.name) {
      const resolver = this.ackResolvers.get(payload.name);
      if (resolver) {
        resolver();
        this.ackResolvers.delete(payload.name);
      }
    }
  }

  private setConnected() {
    if (this.isReady) return;
    this.isReady = true;
    for (const cb of this.onConnectedCallbacks) {
      try {
        cb();
      } catch {}
    }
    this.onConnectedCallbacks.clear();
  }

  public onConnected(callback: () => void) {
    if (this.isReady) {
      callback();
    } else {
      this.onConnectedCallbacks.add(callback);
    }
  }

  public isConnected(): boolean {
    return this.isReady || (this.conn !== null && this.conn.open);
  }

  public async sendFile(file: File): Promise<boolean> {
    const buffer = await file.arrayBuffer();
    const payload: TransferPayload = {
      type: "FILE",
      name: file.name,
      mimeType: file.type,
      buffer,
    };

    let delivered = false;

    // Send across WebRTC DataConnection
    if (this.conn && this.conn.open) {
      try {
        this.conn.send(payload);
        delivered = true;
      } catch {}
    }

    // Send across BroadcastChannel
    if (this.channel) {
      try {
        this.channel.postMessage(payload);
        delivered = true;
      } catch {}
    }

    if (delivered) {
      // Wait briefly for ACK, or consider sent after delay
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(resolve, 800);
        this.ackResolvers.set(file.name, () => {
          clearTimeout(timeout);
          resolve();
        });
      });
      return true;
    }

    return false;
  }

  public close() {
    this.closed = true;
    this.ackResolvers.clear();
    this.onConnectedCallbacks.clear();

    if (this.conn) {
      try {
        this.conn.close();
      } catch {}
      this.conn = null;
    }

    if (this.channel) {
      try {
        this.channel.close();
      } catch {}
      this.channel = null;
    }

    if (this.peer) {
      try {
        this.peer.destroy();
      } catch {}
      this.peer = null;
    }
  }
}

export const mobileTransferService = {
  host(sessionId: string, onFileReceived: (file: File) => void | Promise<void>): MobileTransferHost {
    return new MobileTransferHost(sessionId, onFileReceived);
  },

  connect(sessionId: string): MobileTransferClient {
    return new MobileTransferClient(sessionId);
  },
};

