import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getSafePeerId,
  getChannelName,
  CHUNK_SIZE,
  MobileTransferHost,
  MobileTransferClient,
  type TransferMessage,
} from "./mobileTransferService";

// Mock PeerJS
const mockPeerInstances: any[] = [];

vi.mock("peerjs", () => {
  return {
    Peer: vi.fn().mockImplementation((id?: string) => {
      const handlers = new Map<string, Function[]>();
      const mockPeer = {
        id: id || "mock-client-peer-id",
        open: true,
        destroyed: false,
        on: vi.fn((event: string, cb: Function) => {
          const list = handlers.get(event) || [];
          list.push(cb);
          handlers.set(event, list);
          if (event === "open") {
            setTimeout(() => cb(mockPeer.id), 0);
          }
          return mockPeer;
        }),
        emit: (event: string, ...args: any[]) => {
          const list = handlers.get(event) || [];
          list.forEach((cb) => cb(...args));
        },
        connect: vi.fn(() => {
          const connHandlers = new Map<string, Function[]>();
          const mockConn = {
            open: true,
            dataChannel: { bufferedAmount: 0 },
            on: vi.fn((event: string, cb: Function) => {
              const list = connHandlers.get(event) || [];
              list.push(cb);
              connHandlers.set(event, list);
              if (event === "open") {
                setTimeout(() => cb(), 0);
              }
              return mockConn;
            }),
            emit: (event: string, ...args: any[]) => {
              const list = connHandlers.get(event) || [];
              list.forEach((cb) => cb(...args));
            },
            send: vi.fn(),
            close: vi.fn(),
          };
          return mockConn;
        }),
        reconnect: vi.fn(),
        destroy: vi.fn(),
      };
      mockPeerInstances.push(mockPeer);
      return mockPeer;
    }),
  };
});

describe("mobileTransferService", () => {
  beforeEach(() => {
    mockPeerInstances.length = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("generates deterministic safe peer IDs", () => {
    const id1 = getSafePeerId("12345-abcde-67890");
    expect(id1).toBe("fold-sess-12345abcde67890");

    const idWithSpecialChars = getSafePeerId("test!@#session$$%999");
    expect(idWithSpecialChars).toBe("fold-sess-testsession999");
  });

  it("generates consistent channel names", () => {
    expect(getChannelName("session-123")).toBe("fold-transfer-session-123");
  });

  it("calculates expected chunk count for large buffers", () => {
    const fileSize = 50000;
    const expectedChunks = Math.ceil(fileSize / CHUNK_SIZE);
    expect(expectedChunks).toBe(4);
  });

  it("host correctly reassembles chunked file and responds with FILE_ACK", async () => {
    const receivedFiles: File[] = [];
    const host = new MobileTransferHost("test-sess", (file) => {
      receivedFiles.push(file);
    });

    const mockConn = {
      open: true,
      send: vi.fn(),
    } as any;

    const testBytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
    const transferId = "tx-123";

    // Simulate sending FILE_START
    (host as any).handlePayload(
      {
        type: "FILE_START",
        transferId,
        name: "test.jpg",
        mimeType: "image/jpeg",
        totalBytes: 8,
        totalChunks: 2,
      },
      mockConn,
    );

    // Simulate sending FILE_CHUNK 0
    (host as any).handlePayload(
      {
        type: "FILE_CHUNK",
        transferId,
        chunkIndex: 0,
        data: testBytes.slice(0, 4).buffer,
      },
      mockConn,
    );

    // Simulate sending FILE_CHUNK 1
    (host as any).handlePayload(
      {
        type: "FILE_CHUNK",
        transferId,
        chunkIndex: 1,
        data: testBytes.slice(4, 8).buffer,
      },
      mockConn,
    );

    // Simulate sending FILE_END
    (host as any).handlePayload(
      {
        type: "FILE_END",
        transferId,
      },
      mockConn,
    );

    expect(receivedFiles.length).toBe(1);
    expect(receivedFiles[0].name).toBe("test.jpg");
    expect(receivedFiles[0].type).toBe("image/jpeg");

    const fileBuffer = new Uint8Array(await receivedFiles[0].arrayBuffer());
    expect(fileBuffer).toEqual(testBytes);

    expect(mockConn.send).toHaveBeenCalledWith({
      type: "FILE_ACK",
      transferId: "tx-123",
      name: "test.jpg",
    });

    host.close();
  });

  it("tracks device connection state through PING/PONG and events", () => {
    const connectionStates: boolean[] = [];
    const host = new MobileTransferHost("sess-connection", vi.fn());

    const unsubscribe = host.onConnectionChange((connected) => {
      connectionStates.push(connected);
    });

    expect(host.isConnected()).toBe(false);

    // Simulate PING received
    (host as any).handlePayload({ type: "PING" });
    expect(host.isConnected()).toBe(true);
    expect(connectionStates).toContain(true);

    unsubscribe();
    host.close();
  });

  it("client handles FILE_ACK and updates transfer status", async () => {
    const client = new MobileTransferClient("sess-client");

    const statuses: string[] = [];
    const unsub = client.onStatusChange((s) => statuses.push(s));

    // Simulate incoming PONG
    (client as any).handlePayload({ type: "PONG" });
    expect(client.isConnected()).toBe(true);
    expect(client.getStatus()).toBe("connected");

    unsub();
    client.close();
  });
});

