import { Peer, type DataConnection } from "peerjs";

export const CHUNK_SIZE = 16384; // 16 KB standard SCTP packet size

export type TransferStatus = "connecting" | "connected" | "disconnected" | "error";

export type TransferMessage =
  | { type: "PING" }
  | { type: "PONG" }
  | {
      type: "FILE_START";
      transferId: string;
      name: string;
      mimeType: string;
      totalBytes: number;
      totalChunks: number;
    }
  | {
      type: "FILE_CHUNK";
      transferId: string;
      chunkIndex: number;
      data: ArrayBuffer;
    }
  | {
      type: "FILE_END";
      transferId: string;
    }
  | {
      type: "FILE_ACK";
      transferId: string;
      name: string;
    }
  | {
      type: "FILE";
      name?: string;
      mimeType?: string;
      buffer?: ArrayBuffer;
    }
  | {
      type: "ACK";
      name?: string;
    };

export const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun.cloudflare.com:3478" },
  {
    urls: "turn:openrelay.metered.ca:80",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443?transport=tcp",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

export function getSafePeerId(sessionId: string): string {
  const clean = sessionId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 32);
  return `fold-sess-${clean}`;
}

export function getChannelName(sessionId: string): string {
  return `fold-transfer-${sessionId}`;
}

interface PendingTransfer {
  transferId: string;
  name: string;
  mimeType: string;
  totalBytes: number;
  totalChunks: number;
  receivedChunks: Map<number, ArrayBuffer>;
  receivedBytes: number;
  timeoutId: ReturnType<typeof setTimeout>;
}

export class MobileTransferHost {
  private peer: Peer | null = null;
  private channel: BroadcastChannel | null = null;
  private connections = new Set<DataConnection>();
  private pendingTransfers = new Map<string, PendingTransfer>();
  private connectionChangeListeners = new Set<(connected: boolean) => void>();
  private transferStateListeners = new Set<(isReceiving: boolean) => void>();
  private closed = false;
  private isDeviceConnected = false;
  private reinitTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private sessionId: string,
    private onFileReceived: (file: File) => void | Promise<void>,
  ) {
    this.init();
  }

  private init() {
    if (typeof BroadcastChannel !== "undefined") {
      try {
        this.channel = new BroadcastChannel(getChannelName(this.sessionId));
        this.channel.onmessage = (event) => {
          this.handlePayload(event.data);
        };
      } catch {
        // BroadcastChannel unavailable
      }
    }

    this.initPeer();
  }

  private initPeer() {
    if (this.closed) return;

    try {
      const peerId = getSafePeerId(this.sessionId);
      this.peer = new Peer(peerId, {
        debug: 0,
        config: { iceServers: DEFAULT_ICE_SERVERS },
      });

      this.peer.on("open", () => {});

      this.peer.on("connection", (conn) => {
        this.connections.add(conn);

        const handleOpen = () => {
          this.setDeviceConnected(true);
          try {
            conn.send({ type: "PONG" });
          } catch {}
        };

        if (conn.open) {
          handleOpen();
        } else {
          conn.on("open", handleOpen);
        }

        conn.on("data", (data) => {
          this.handlePayload(data as TransferMessage, conn);
        });

        conn.on("close", () => {
          this.connections.delete(conn);
          if (this.connections.size === 0) {
            this.setDeviceConnected(false);
          }
        });

        conn.on("error", () => {
          this.connections.delete(conn);
          if (this.connections.size === 0) {
            this.setDeviceConnected(false);
          }
        });
      });

      this.peer.on("disconnected", () => {
        if (!this.closed) {
          try {
            this.peer?.reconnect();
          } catch {}
        }
      });

      this.peer.on("error", (err: { type?: string }) => {
        if (err?.type === "unavailable-id" && !this.closed) {
          if (this.reinitTimer) clearTimeout(this.reinitTimer);
          this.reinitTimer = setTimeout(() => {
            if (!this.closed && (!this.peer || !this.peer.open)) {
              this.initPeer();
            }
          }, 1500);
        }
      });
    } catch {
      // PeerJS initialization failed
    }
  }

  private setDeviceConnected(connected: boolean) {
    if (this.isDeviceConnected === connected) return;
    this.isDeviceConnected = connected;
    for (const listener of this.connectionChangeListeners) {
      try {
        listener(connected);
      } catch {}
    }
  }

  private notifyTransferState() {
    const isReceiving = this.pendingTransfers.size > 0;
    for (const listener of this.transferStateListeners) {
      try {
        listener(isReceiving);
      } catch {}
    }
  }

  private handlePayload(payload: TransferMessage, conn?: DataConnection) {
    if (!payload || this.closed) return;

    if (payload.type === "PING") {
      this.setDeviceConnected(true);
      const pong: TransferMessage = { type: "PONG" };
      if (conn && conn.open) {
        try {
          conn.send(pong);
        } catch {}
      }
      if (this.channel) {
        try {
          this.channel.postMessage(pong);
        } catch {}
      }
      return;
    }

    if (payload.type === "FILE_START") {
      const pending: PendingTransfer = {
        transferId: payload.transferId,
        name: payload.name || `mobile-upload-${Date.now()}.jpg`,
        mimeType: payload.mimeType || "image/jpeg",
        totalBytes: payload.totalBytes,
        totalChunks: payload.totalChunks,
        receivedChunks: new Map(),
        receivedBytes: 0,
        timeoutId: setTimeout(() => {
          this.pendingTransfers.delete(payload.transferId);
          this.notifyTransferState();
        }, 60000),
      };
      this.pendingTransfers.set(payload.transferId, pending);
      this.notifyTransferState();
      return;
    }

    if (payload.type === "FILE_CHUNK") {
      const pending = this.pendingTransfers.get(payload.transferId);
      if (!pending) return;

      pending.receivedChunks.set(payload.chunkIndex, payload.data);
      pending.receivedBytes += payload.data.byteLength;
      return;
    }

    if (payload.type === "FILE_END") {
      const pending = this.pendingTransfers.get(payload.transferId);
      if (!pending) return;

      clearTimeout(pending.timeoutId);
      this.pendingTransfers.delete(payload.transferId);
      this.notifyTransferState();

      if (pending.receivedChunks.size === pending.totalChunks) {
        const parts: ArrayBuffer[] = [];
        for (let i = 0; i < pending.totalChunks; i++) {
          const chunk = pending.receivedChunks.get(i);
          if (chunk) parts.push(chunk);
        }

        const file = new File(parts, pending.name, {
          type: pending.mimeType,
        });

        void this.onFileReceived(file);

        const ack: TransferMessage = {
          type: "FILE_ACK",
          transferId: pending.transferId,
          name: pending.name,
        };

        if (conn && conn.open) {
          try {
            conn.send(ack);
          } catch {}
        }
        if (this.channel) {
          try {
            this.channel.postMessage(ack);
          } catch {}
        }
      }
      return;
    }

    // Legacy unchunked fallback
    if (payload.type === "FILE" && payload.buffer) {
      const filename = payload.name || `mobile-upload-${Date.now()}.jpg`;
      const mimeType = payload.mimeType || "image/jpeg";
      const file = new File([payload.buffer], filename, { type: mimeType });

      void this.onFileReceived(file);

      const ack: TransferMessage = { type: "ACK", name: filename };
      if (conn && conn.open) {
        try {
          conn.send(ack);
        } catch {}
      }
      if (this.channel) {
        try {
          this.channel.postMessage(ack);
        } catch {}
      }
    }
  }

  public onConnectionChange(callback: (connected: boolean) => void): () => void {
    this.connectionChangeListeners.add(callback);
    callback(this.isDeviceConnected);
    return () => {
      this.connectionChangeListeners.delete(callback);
    };
  }

  public isConnected(): boolean {
    return this.isDeviceConnected;
  }

  public onTransferStateChange(callback: (isReceiving: boolean) => void): () => void {
    this.transferStateListeners.add(callback);
    callback(this.pendingTransfers.size > 0);
    return () => {
      this.transferStateListeners.delete(callback);
    };
  }

  public isReceiving(): boolean {
    return this.pendingTransfers.size > 0;
  }

  public close() {
    this.closed = true;

    if (this.reinitTimer) {
      clearTimeout(this.reinitTimer);
      this.reinitTimer = null;
    }

    for (const pending of this.pendingTransfers.values()) {
      clearTimeout(pending.timeoutId);
    }
    this.pendingTransfers.clear();
    this.notifyTransferState();

    for (const conn of this.connections) {
      try {
        conn.close();
      } catch {}
    }
    this.connections.clear();
    this.connectionChangeListeners.clear();
    this.transferStateListeners.clear();

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
  private status: TransferStatus = "connecting";
  private statusListeners = new Set<(status: TransferStatus) => void>();
  private fileAckResolvers = new Map<string, () => void>();
  private legacyAckResolvers = new Map<string, () => void>();
  private closed = false;
  private connectAttempts = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private sessionId: string) {
    this.init();
  }

  private init() {
    if (typeof BroadcastChannel !== "undefined") {
      try {
        this.channel = new BroadcastChannel(getChannelName(this.sessionId));
        this.channel.onmessage = (event) => {
          this.handlePayload(event.data);
        };
        this.channel.postMessage({ type: "PING" });
      } catch {}
    }

    try {
      this.peer = new Peer({
        debug: 0,
        config: { iceServers: DEFAULT_ICE_SERVERS },
      });

      this.peer.on("open", () => {
        this.connectToHost();
      });

      this.peer.on("disconnected", () => {
        if (!this.closed) {
          try {
            this.peer?.reconnect();
          } catch {}
        }
      });

      this.peer.on("error", (err: { type?: string }) => {
        if (err?.type !== "browser-incompatible") {
          console.warn("[MobileTransferClient] Peer error:", err?.type || err);
        }
        if (!this.closed && this.connectAttempts < 30) {
          this.scheduleRetry(1500);
        }
      });
    } catch {
      this.setStatus("error");
    }
  }

  private connectToHost() {
    if (this.closed || !this.peer || this.peer.destroyed) return;
    this.connectAttempts++;
    const hostId = getSafePeerId(this.sessionId);

    try {
      const conn = this.peer.connect(hostId, { reliable: true });
      this.conn = conn;

      const handleOpen = () => {
        this.conn = conn;
        this.setStatus("connected");
        try {
          conn.send({ type: "PING" });
        } catch {}
      };

      if (conn.open) {
        handleOpen();
      } else {
        conn.on("open", handleOpen);
      }

      conn.on("data", (data) => {
        this.handlePayload(data as TransferMessage);
      });

      conn.on("close", () => {
        if (this.conn === conn) {
          this.conn = null;
        }
        if (!this.closed) {
          this.setStatus("disconnected");
          this.scheduleRetry(1500);
        }
      });

      conn.on("error", (err) => {
        console.warn("[MobileTransferClient] Connection error:", err);
        if (this.conn === conn) {
          this.conn = null;
        }
        if (!this.closed) {
          this.setStatus("disconnected");
          this.scheduleRetry(1500);
        }
      });
    } catch {
      this.scheduleRetry(2000);
    }
  }

  private scheduleRetry(delayMs: number) {
    if (this.closed || (this.conn && this.conn.open)) return;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(() => {
      if (!this.closed && (!this.conn || !this.conn.open)) {
        this.connectToHost();
      }
    }, delayMs);
  }

  private handlePayload(payload: TransferMessage) {
    if (!payload || this.closed) return;

    if (payload.type === "PONG") {
      this.setStatus("connected");
      return;
    }

    if (payload.type === "FILE_ACK" && payload.transferId) {
      const resolver = this.fileAckResolvers.get(payload.transferId);
      if (resolver) {
        resolver();
        this.fileAckResolvers.delete(payload.transferId);
      }
      return;
    }

    if (payload.type === "ACK" && payload.name) {
      const resolver = this.legacyAckResolvers.get(payload.name);
      if (resolver) {
        resolver();
        this.legacyAckResolvers.delete(payload.name);
      }
    }
  }

  private setStatus(status: TransferStatus) {
    if (this.status === status) return;
    this.status = status;
    for (const cb of this.statusListeners) {
      try {
        cb(status);
      } catch {}
    }
  }

  public getStatus(): TransferStatus {
    return this.status;
  }

  public onStatusChange(callback: (status: TransferStatus) => void): () => void {
    this.statusListeners.add(callback);
    callback(this.status);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  public isConnected(): boolean {
    return this.status === "connected" || Boolean(this.conn && this.conn.open);
  }

  public async waitForConnection(timeoutMs = 15000): Promise<boolean> {
    if (this.isConnected()) return true;

    if (this.peer && this.peer.open && (!this.conn || !this.conn.open)) {
      this.connectToHost();
    }

    return new Promise<boolean>((resolve) => {
      let resolved = false;

      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          this.statusListeners.delete(onStatus);
          resolve(this.isConnected());
        }
      }, timeoutMs);

      const onStatus = (status: TransferStatus) => {
        if (status === "connected" && !resolved) {
          resolved = true;
          clearTimeout(timer);
          this.statusListeners.delete(onStatus);
          resolve(true);
        }
      };

      this.statusListeners.add(onStatus);
    });
  }

  private async waitForBufferDrain(dc?: RTCDataChannel) {
    if (!dc) return;
    while (dc.bufferedAmount > 64 * 1024) {
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  }

  private sendRaw(msg: TransferMessage) {
    if (this.conn && this.conn.open) {
      try {
        this.conn.send(msg);
      } catch {}
    }
    if (this.channel) {
      try {
        this.channel.postMessage(msg);
      } catch {}
    }
  }

  public async sendFile(file: File, onProgress?: (percent: number) => void): Promise<boolean> {
    const isReady = await this.waitForConnection(8000);
    if (!isReady && !this.channel) {
      return false;
    }

    const buffer = await file.arrayBuffer();
    const totalBytes = buffer.byteLength;
    const totalChunks = Math.ceil(totalBytes / CHUNK_SIZE);
    const transferId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const ackPromise = new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => {
        this.fileAckResolvers.delete(transferId);
        resolve(false);
      }, 30000);

      this.fileAckResolvers.set(transferId, () => {
        clearTimeout(timeout);
        resolve(true);
      });
    });

    const startMsg: TransferMessage = {
      type: "FILE_START",
      transferId,
      name: file.name,
      mimeType: file.type || "image/jpeg",
      totalBytes,
      totalChunks,
    };
    this.sendRaw(startMsg);

    const dc = (this.conn as unknown as { dataChannel?: RTCDataChannel })?.dataChannel;

    for (let i = 0; i < totalChunks; i++) {
      if (this.closed) return false;

      await this.waitForBufferDrain(dc);

      const startByte = i * CHUNK_SIZE;
      const endByte = Math.min(startByte + CHUNK_SIZE, totalBytes);
      const chunk = buffer.slice(startByte, endByte);

      const chunkMsg: TransferMessage = {
        type: "FILE_CHUNK",
        transferId,
        chunkIndex: i,
        data: chunk,
      };
      this.sendRaw(chunkMsg);

      if (onProgress) {
        onProgress(Math.round(((i + 1) / totalChunks) * 100));
      }
    }

    const endMsg: TransferMessage = {
      type: "FILE_END",
      transferId,
    };
    this.sendRaw(endMsg);

    return ackPromise;
  }

  public close() {
    this.closed = true;
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    this.fileAckResolvers.clear();
    this.legacyAckResolvers.clear();
    this.statusListeners.clear();

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
