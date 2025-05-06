// Jest setup file

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