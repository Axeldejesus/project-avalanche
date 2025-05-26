import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';

// Mock Firebase modules before importing the service
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(() => Promise.resolve()),
  updateDoc: jest.fn(() => Promise.resolve()),
  deleteDoc: jest.fn(() => Promise.resolve()),
  getDoc: jest.fn(() => Promise.resolve({ 
    exists: () => false,
    data: () => null
  })),
  getDocs: jest.fn(() => Promise.resolve({
    docs: [],
    forEach: jest.fn(),
    size: 0
  })),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  startAfter: jest.fn(),
}));

// Mock the authenticate module
jest.mock('../authenticate', () => ({
  auth: {
    currentUser: { uid: 'test-user-id' }
  },
  db: {} // Mock db object
}));

// Mock fetch for game details
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

import { 
  addToCollection, 
  updateCollection, 
  removeFromCollection, 
  getUserCollection, 
  getUserGameInCollection, 
  getUserCollectionStats 
} from '../collectionService';
import { 
  setupTestEnvironment, 
  teardownTestEnvironment, 
  createTestUser, 
  cleanupTestUser, 
  mockCollectionData 
} from './test-utils';

describe('Collection Service', () => {
  let testAuth: any;
  let testDb: any;
  let testUserData: any;
  let userId: string;

  beforeAll(() => {
    const { testAuth: auth, testDb: db } = setupTestEnvironment();
    testAuth = auth;
    testDb = db;
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  beforeEach(async () => {
    testUserData = await createTestUser();
    userId = `test-user-${Date.now()}`;
    
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(async () => {
    if (userId) {
      await cleanupTestUser(userId);
    }
  });

  describe('addToCollection', () => {
    test('should add game to collection successfully', async () => {
      // Ensure auth is properly mocked
      const authenticateModule = require('../authenticate');
      authenticateModule.auth = {
        currentUser: { uid: userId }
      };
      authenticateModule.db = {};

      // Mock getDoc to return non-existent document (so it creates new)
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValueOnce({
        exists: () => false
      });

      // Mock fetch to return proper response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          platform: 'PC',
          platforms: ['PC'],
          genre: 'Action',
          genres: ['Action', 'Adventure']
        })
      });

      const collectionData = {
        ...mockCollectionData,
        userId
      };

      const result = await addToCollection(collectionData);

      expect(result.success).toBe(true);
      expect(result.collectionId).toBeDefined();
    });

    test('should fail without authentication', async () => {
      // Mock no auth
      const authenticateModule = require('../authenticate');
      authenticateModule.auth = {
        currentUser: null
      };

      const collectionData = {
        ...mockCollectionData,
        userId
      };

      const result = await addToCollection(collectionData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('User not authenticated');
    });
  });

  describe('getUserCollection', () => {
    test('should get user collection successfully', async () => {
      // Mock db
      const authenticateModule = require('../authenticate');
      authenticateModule.db = {};

      // Mock getDocs to return proper snapshot
      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValueOnce({
        docs: [],
        forEach: jest.fn(),
        size: 0,
        empty: true
      });

      const result = await getUserCollection(userId);

      expect(result.items).toBeInstanceOf(Array);
      expect(result.hasMore).toBeDefined();
    });

    test('should filter by status', async () => {
      // Mock db
      const authenticateModule = require('../authenticate');
      authenticateModule.db = {};

      // Mock getDocs to return empty snapshot for filtered query
      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValueOnce({
        docs: [],
        forEach: jest.fn(),
        size: 0,
        empty: true
      });

      const result = await getUserCollection(userId, 'playing');

      expect(result.items).toBeInstanceOf(Array);
    });
  });

  describe('getUserCollectionStats', () => {
    test('should get collection stats successfully', async () => {
      // Mock db
      const authenticateModule = require('../authenticate');
      authenticateModule.db = {};

      // Mock getDocs to return proper snapshot
      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValueOnce({
        docs: [],
        forEach: jest.fn(),
        size: 0,
        empty: true
      });

      const result = await getUserCollectionStats(userId);

      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.completed).toBeGreaterThanOrEqual(0);
      expect(result.playing).toBeGreaterThanOrEqual(0);
      expect(result.toPlay).toBeGreaterThanOrEqual(0);
      expect(result.abandoned).toBeGreaterThanOrEqual(0);
      expect(result.wishlist).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getUserGameInCollection', () => {
    test('should return null for non-existent game', async () => {
      // Mock db
      const authenticateModule = require('../authenticate');
      authenticateModule.db = {};

      // Mock getDoc to return non-existent document
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValueOnce({
        exists: () => false
      });

      const result = await getUserGameInCollection(userId, 99999);

      expect(result).toBeNull();
    });
  });
});
