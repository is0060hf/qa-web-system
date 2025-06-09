// Jest setup file

// Polyfill for TextDecoder/TextEncoder in Node.js environment
global.TextDecoder = class TextDecoder {
  constructor(encoding = 'utf-8') {
    this.encoding = encoding;
  }
  
  decode(input) {
    if (input === undefined) return '';
    if (typeof input === 'string') return input;
    // Simple implementation for test purposes
    return Buffer.from(input).toString(this.encoding);
  }
};

global.TextEncoder = class TextEncoder {
  constructor() {
    this.encoding = 'utf-8';
  }
  
  encode(input) {
    return Buffer.from(input, this.encoding);
  }
};

// Improved NextRequest mock to avoid getter/setter conflicts
class MockNextRequest {
  constructor(url, init = {}) {
    // Store internal values
    this._url = url;
    this._nextUrl = new URL(url);
    this._geo = {};
    this._ip = '127.0.0.1';
    this._cookies = new Map();
    
    this.method = init.method || 'GET';
    this.headers = new Map();
    if (init.headers) {
      Object.entries(init.headers).forEach(([key, value]) => {
        this.headers.set(key.toLowerCase(), value);
      });
    }
    this._body = init.body;
    
    // Define all problematic properties as getters to avoid conflicts
    Object.defineProperty(this, 'url', {
      get: () => this._url,
      enumerable: true,
      configurable: true
    });
    
    Object.defineProperty(this, 'nextUrl', {
      get: () => this._nextUrl,
      enumerable: true,
      configurable: true
    });
    
    Object.defineProperty(this, 'geo', {
      get: () => this._geo,
      enumerable: true,
      configurable: true
    });
    
    Object.defineProperty(this, 'ip', {
      get: () => this._ip,
      enumerable: true,
      configurable: true
    });
    
    Object.defineProperty(this, 'cookies', {
      get: () => this._cookies,
      enumerable: true,
      configurable: true
    });
  }
  
  async json() {
    return Promise.resolve(JSON.parse(this._body || '{}'));
  }
  
  async text() {
    return Promise.resolve(this._body || '');
  }
  
  async formData() {
    return Promise.resolve(new FormData());
  }
  
  clone() {
    return new MockNextRequest(this._url, {
      method: this.method,
      headers: Object.fromEntries(this.headers),
      body: this._body
    });
  }
}

// Mock NextResponse
class MockNextResponse {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.statusText = init.statusText || 'OK';
    this.headers = new Map();
    if (init.headers) {
      Object.entries(init.headers).forEach(([key, value]) => {
        this.headers.set(key, value);
      });
    }
  }
  
  async json() {
    return Promise.resolve(typeof this.body === 'string' ? JSON.parse(this.body) : this.body);
  }
  
  async text() {
    return Promise.resolve(typeof this.body === 'string' ? this.body : JSON.stringify(this.body));
  }
  
  static json(data, init = {}) {
    return new MockNextResponse(JSON.stringify(data), {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...init.headers
      }
    });
  }
  
  static redirect(url, status = 302) {
    return new MockNextResponse(null, {
      status,
      headers: {
        location: url
      }
    });
  }
}

// Replace global Request with our mock
global.Request = MockNextRequest;
global.Response = MockNextResponse;

global.Headers = class Headers extends Map {
  constructor(init) {
    super();
    if (init) {
      Object.entries(init).forEach(([key, value]) => {
        this.set(key, value);
      });
    }
  }
};

global.FormData = class FormData {
  constructor() {
    this.data = new Map();
  }
  
  append(key, value) {
    const existing = this.data.get(key);
    if (existing) {
      if (Array.isArray(existing)) {
        existing.push(value);
      } else {
        this.data.set(key, [existing, value]);
      }
    } else {
      this.data.set(key, value);
    }
  }
  
  get(key) {
    const value = this.data.get(key);
    return Array.isArray(value) ? value[0] : value;
  }
  
  getAll(key) {
    const value = this.data.get(key);
    return Array.isArray(value) ? value : value ? [value] : [];
  }
  
  set(key, value) {
    this.data.set(key, value);
  }
  
  has(key) {
    return this.data.has(key);
  }
  
  delete(key) {
    this.data.delete(key);
  }
  
  keys() {
    return this.data.keys();
  }
  
  values() {
    return this.data.values();
  }
  
  entries() {
    return this.data.entries();
  }
  
  forEach(callback) {
    this.data.forEach(callback);
  }
};

// Mock navigator object
global.navigator = {
  onLine: true,
  userAgent: 'jest-test-agent',
};

// Set up environment variables for testing
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.CRON_API_KEY = 'test-cron-api-key';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test-db';
process.env.VERCEL_BLOB_API_URL = 'https://test-blob-api.vercel.com';

// Automatically mock these modules
jest.mock('@vercel/blob', () => ({
  put: jest.fn().mockImplementation((path, content, options) => {
    if (options && options.handleUploadUrl) {
      return Promise.resolve({
        url: `https://test-blob-storage.vercel.app/${path}`,
        uploadUrl: `https://test-upload-url.vercel.app/${path}`,
      });
    }
    return Promise.resolve({
      url: `https://test-blob-storage.vercel.app/${path}`,
    });
  }),
  del: jest.fn().mockResolvedValue(true),
  list: jest.fn().mockImplementation(({ prefix }) => {
    return Promise.resolve({
      blobs: [
        {
          url: `https://test-blob-storage.vercel.app/${prefix}/test-file1.pdf`,
          pathname: `${prefix}/test-file1.pdf`,
          contentType: 'application/pdf',
          size: 12345,
          uploadedAt: new Date(),
        },
        {
          url: `https://test-blob-storage.vercel.app/${prefix}/test-file2.jpg`,
          pathname: `${prefix}/test-file2.jpg`,
          contentType: 'image/jpeg',
          size: 54321,
          uploadedAt: new Date(),
        },
      ],
      cursor: null,
    });
  }),
}));

// Expanded Prisma client mock with all required models
jest.mock('@/lib/db', () => {
  const createMockModelMethods = () => ({
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
    upsert: jest.fn(),
  });

  const mockPrismaClient = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn((callback) => callback(mockPrismaClient)),
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
    
    // Core models
    user: createMockModelMethods(),
    project: createMockModelMethods(),
    question: createMockModelMethods(),
    answer: createMockModelMethods(),
    mediaFile: createMockModelMethods(),
    notification: createMockModelMethods(),
    invitation: createMockModelMethods(),
    
    // Additional models that were missing
    projectTag: createMockModelMethods(),
    projectMember: createMockModelMethods(),
    passwordResetToken: createMockModelMethods(),
    thread: createMockModelMethods(),
    
    // Any additional models can be added here as needed
  };

  // Return both named export and default export
  return {
    prisma: mockPrismaClient,
    default: mockPrismaClient,
  };
});

// Mock NextRequest and NextResponse from Next.js completely
jest.mock('next/server', () => ({
  NextRequest: MockNextRequest,
  NextResponse: MockNextResponse,
  userAgent: jest.fn(() => ({ isBot: false })),
}));

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
}); 