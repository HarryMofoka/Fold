import "@testing-library/jest-dom";
import { vi } from "vitest";
import i18n from "i18next";
import { installFailOnConsole } from "@app/tests/failOnConsole";

// jsdom is missing the same APIs WebKit is, so tests must agree with the
// browser. Same module `src/index.tsx` installs.
import "@app/utils/engineShims";

// Modules outside React call i18n.t directly; no resources means the English defaults render.
void i18n.init({
  lng: "en-US",
  resources: {},
  initAsync: false,
  interpolation: { escapeValue: false },
});

installFailOnConsole();

// Mock BroadcastChannel to avoid Node 22 native Event vs jsdom Event mismatch in tests
if (typeof BroadcastChannel !== "undefined") {
  class MockBroadcastChannel extends EventTarget {
    name: string;
    onmessage: ((event: MessageEvent) => void) | null = null;
    onmessageerror: ((event: MessageEvent) => void) | null = null;
    constructor(name: string) {
      super();
      this.name = name;
    }
    postMessage(_message: unknown): void {}
    close(): void {}
  }
  globalThis.BroadcastChannel = MockBroadcastChannel;
  if (typeof window !== "undefined") {
    window.BroadcastChannel = MockBroadcastChannel;
  }
}

// Mock localStorage for tests
class LocalStorageMock implements Storage {
  private store: Record<string, string> = {};

  get length(): number {
    return Object.keys(this.store).length;
  }

  clear(): void {
    this.store = {};
  }

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  key(index: number): string | null {
    return Object.keys(this.store)[index] ?? null;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }
}

Object.defineProperty(window, "localStorage", {
  value: new LocalStorageMock(),
  writable: true,
});

// Mock i18next for tests
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: vi.fn(),
    },
  }),
  initReactI18next: {
    type: "3rdParty",
    init: vi.fn(),
  },
  I18nextProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock i18next-http-backend
vi.mock("i18next-http-backend", () => ({
  default: {
    type: "backend",
    init: vi.fn(),
    read: vi.fn(),
    save: vi.fn(),
  },
}));

// Mock window.URL.createObjectURL and revokeObjectURL for tests
global.URL.createObjectURL = vi.fn(() => "mocked-url");
global.URL.revokeObjectURL = vi.fn();

// Mock File and Blob API methods that aren't available in jsdom
if (!globalThis.Blob.prototype.arrayBuffer) {
  globalThis.Blob.prototype.arrayBuffer = function () {
    if (typeof FileReader !== "undefined") {
      return new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(this);
      });
    }
    const buffer = new ArrayBuffer(8);
    const view = new Uint8Array(buffer);
    view.set([1, 2, 3, 4, 5, 6, 7, 8]);
    return Promise.resolve(buffer);
  };
}

if (!globalThis.File.prototype.arrayBuffer) {
  globalThis.File.prototype.arrayBuffer = globalThis.Blob.prototype.arrayBuffer;
}

// Mock crypto.subtle for hashing in tests - force override even if exists
const mockHashBuffer = new ArrayBuffer(32);
const mockHashView = new Uint8Array(mockHashBuffer);
// Fill with predictable mock hash data
for (let i = 0; i < 32; i++) {
  mockHashView[i] = i;
}

// Force override crypto.subtle to avoid Node.js native implementation
Object.defineProperty(globalThis, "crypto", {
  value: {
    subtle: {
      digest: vi
        .fn()
        .mockImplementation(async (_algorithm: string, _data: BufferSource) => {
          // Always return the mock hash buffer regardless of input
          return mockHashBuffer.slice();
        }),
    },
    getRandomValues: vi.fn().mockImplementation((array: Uint8Array) => {
      // Mock getRandomValues if needed
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    }),
  },
  writable: true,
  configurable: true,
});

// Mock Worker for tests (Web Workers not available in test environment)
global.Worker = vi.fn().mockImplementation(() => ({
  postMessage: vi.fn(),
  terminate: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  onmessage: null,
  onerror: null,
}));

// Mock ResizeObserver for Mantine components
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver for components that might use it
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia for responsive components
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Provide a minimal DOMMatrix implementation for pdf.js in the test environment
if (typeof globalThis.DOMMatrix === "undefined") {
  class DOMMatrixStub {
    a = 1;
    b = 0;
    c = 0;
    d = 1;
    e = 0;
    f = 0;

    constructor(init?: string | number[]) {
      if (Array.isArray(init) && init.length === 6) {
        [this.a, this.b, this.c, this.d, this.e, this.f] = init as [
          number,
          number,
          number,
          number,
          number,
          number,
        ];
      }
    }

    multiplySelf(): this {
      return this;
    }

    translateSelf(): this {
      return this;
    }

    scaleSelf(): this {
      return this;
    }

    rotateSelf(): this {
      return this;
    }

    inverse(): this {
      return this;
    }
  }

  Object.defineProperty(globalThis, "DOMMatrix", {
    value: DOMMatrixStub,
    writable: false,
    configurable: true,
  });
}

// Set up pdf.js worker in node/vitest environment
import { GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";

try {
  const req = createRequire(import.meta.url);
  const workerPath = req.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");
  GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;
} catch {}

// Set global test timeout to prevent hangs
vi.setConfig({ testTimeout: 10000, hookTimeout: 10000 });
