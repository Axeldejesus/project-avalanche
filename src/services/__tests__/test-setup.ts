// Mock environment variables properly
Object.defineProperty(process.env, 'NODE_ENV', {
  value: 'test',
  writable: true
});

Object.defineProperty(process.env, 'NEXT_PUBLIC_FIREBASE_API_KEY', {
  value: 'test-api-key',
  writable: true
});

Object.defineProperty(process.env, 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', {
  value: 'test-project.firebaseapp.com',
  writable: true
});

Object.defineProperty(process.env, 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', {
  value: 'test-project',
  writable: true
});

// Create mock functions that can be reused
const mockGetDoc = jest.fn(() => Promise.resolve({ 
  exists: () => true,
  data: () => ({
    userId: 'test-user-id',
    username: 'testuser',
    email: 'test@example.com',
    createdAt: new Date().toISOString()
  })
}));

const mockGetDocs = jest.fn(() => Promise.resolve({ 
  docs: [], 
  forEach: jest.fn(),
  size: 0,
  empty: true
}));

const mockAddDoc = jest.fn(() => Promise.resolve({ id: 'mock-doc-id' }));

// Mock Firebase modules at the module level
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
  getApps: jest.fn(() => []),
  deleteApp: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  connectAuthEmulator: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(() => Promise.resolve({
    user: { uid: 'mock-user-id', email: 'test@example.com' }
  })),
  signInWithEmailAndPassword: jest.fn(() => Promise.resolve({
    user: { uid: 'mock-user-id', email: 'test@example.com' }
  })),
  signOut: jest.fn(() => Promise.resolve()),
  onAuthStateChanged: jest.fn(),
  deleteUser: jest.fn(() => Promise.resolve()),
  reauthenticateWithCredential: jest.fn(() => Promise.resolve()),
  EmailAuthProvider: {
    credential: jest.fn(),
  },
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  connectFirestoreEmulator: jest.fn(),
  doc: jest.fn(() => ({ id: 'mock-doc', path: 'mock/path' })),
  collection: jest.fn(() => ({ id: 'mock-collection' })),
  setDoc: jest.fn(() => Promise.resolve()),
  getDoc: mockGetDoc,
  getDocs: mockGetDocs,
  deleteDoc: jest.fn(() => Promise.resolve()),
  updateDoc: jest.fn(() => Promise.resolve()),
  query: jest.fn((collection) => ({ _collection: collection })),
  where: jest.fn(() => ({})),
  orderBy: jest.fn(() => ({})),
  limit: jest.fn(() => ({})),
  startAfter: jest.fn(() => ({})),
  collectionGroup: jest.fn(() => ({})),
  addDoc: mockAddDoc,
}));

// Mock fetch for API calls with proper response structure
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      platform: 'PC',
      platforms: ['PC'],
      genre: 'Action',
      genres: ['Action', 'Adventure']
    })
  })
) as jest.Mock;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock window object
Object.defineProperty(global, 'window', {
  value: {
    location: {
      href: 'http://localhost:3000',
    }
  },
  writable: true
});

// Export the mock functions so tests can access them
export { mockGetDoc, mockGetDocs, mockAddDoc };

// Extend Jest matchers
expect.extend({
  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid email`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid email`,
        pass: false,
      };
    }
  },
});
