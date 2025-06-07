// Jest setup file

// Polyfill for Web APIs in Node.js environment
global.Request = class Request {
  constructor(input, init) {
    this.url = input;
    this.method = init?.method || 'GET';
    this.headers = new Map();
    if (init?.headers) {
      Object.entries(init.headers).forEach(([key, value]) => {
        this.headers.set(key, value);
      });
    }
    this.body = init?.body;
  }
  
  json() {
    return Promise.resolve(JSON.parse(this.body || '{}'));
  }
  
  text() {
    return Promise.resolve(this.body || '');
  }
  
  formData() {
    return Promise.resolve(new FormData());
  }
};

global.Response = class Response {
  constructor(body, init) {
    this.body = body;
    this.status = init?.status || 200;
    this.statusText = init?.statusText || 'OK';
    this.headers = new Map();
    if (init?.headers) {
      Object.entries(init.headers).forEach(([key, value]) => {
        this.headers.set(key, value);
      });
    }
  }
  
  json() {
    return Promise.resolve(typeof this.body === 'string' ? JSON.parse(this.body) : this.body);
  }
  
  text() {
    return Promise.resolve(typeof this.body === 'string' ? this.body : JSON.stringify(this.body));
  }
};

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
    this.data.set(key, value);
  }
  
  get(key) {
    return this.data.get(key);
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

// Mock Prisma client
jest.mock('@/lib/db', () => {
  const mockPrismaClient = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn((callback) => callback(mockPrismaClient)),
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    question: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    answer: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    mediaFile: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    notification: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      updateMany: jest.fn(),
    },
    invitation: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  return mockPrismaClient;
});

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
}); 