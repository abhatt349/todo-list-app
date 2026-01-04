// Jest setup file
// Polyfill TextEncoder/TextDecoder for jsdom
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock crypto.subtle for hashPassword tests
const mockDigest = jest.fn().mockImplementation(async (algorithm, data) => {
  // Return a mock hash buffer
  const mockHash = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    mockHash[i] = i;
  }
  return mockHash.buffer;
});

Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: mockDigest,
    },
  },
});

// Mock Notification API
global.Notification = {
  permission: 'default',
  requestPermission: jest.fn().mockResolvedValue('granted'),
};

// Mock Intl.DateTimeFormat for timezone tests
const originalDateTimeFormat = Intl.DateTimeFormat;
global.Intl.DateTimeFormat = class extends originalDateTimeFormat {
  constructor(locale, options) {
    super(locale, options);
    this._options = options;
  }
  resolvedOptions() {
    return {
      ...super.resolvedOptions(),
      timeZone: this._options?.timeZone || 'America/New_York',
    };
  }
};

// Silence console errors during tests unless needed
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};
