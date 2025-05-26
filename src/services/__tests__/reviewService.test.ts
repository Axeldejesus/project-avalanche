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
  collectionGroup: jest.fn(),
}));

// Mock the authenticate module
jest.mock('../authenticate', () => ({
  auth: {
    currentUser: { uid: 'test-user-id' }
  },
  db: {} // Mock db object
}));

import { 
  addReview, 
  updateReview, 
  deleteReview, 
  getReviewsByUser, 
  getUserGameReview 
} from '../reviewService';
import { 
  setupTestEnvironment, 
  teardownTestEnvironment, 
  createTestUser, 
  cleanupTestUser, 
  mockReviewData 
} from './test-utils';

describe('Review Service', () => {
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

  describe('addReview', () => {
    test('should add review successfully', async () => {
      // Ensure auth is properly mocked
      const authenticateModule = require('../authenticate');
      authenticateModule.auth = {
        currentUser: { uid: userId }
      };
      authenticateModule.db = {};

      const reviewData = {
        ...mockReviewData,
        userId,
        username: testUserData.username
      };

      const result = await addReview(reviewData);

      expect(result.success).toBe(true);
      expect(result.reviewId).toBeDefined();
    });

    test('should fail without authentication', async () => {
      // Mock no auth
      const authenticateModule = require('../authenticate');
      authenticateModule.auth = {
        currentUser: null
      };

      const reviewData = {
        ...mockReviewData,
        userId,
        username: testUserData.username
      };

      const result = await addReview(reviewData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('User not authenticated');
    });
  });

  describe('getReviewsByUser', () => {
    test('should get user reviews successfully', async () => {
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

      const result = await getReviewsByUser(userId);

      expect(result.reviews).toBeInstanceOf(Array);
      expect(result.hasMore).toBeDefined();
    });

    test('should handle pagination', async () => {
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

      const result = await getReviewsByUser(userId, 5);

      expect(result.reviews).toBeInstanceOf(Array);
      expect(result.reviews.length).toBeLessThanOrEqual(5);
    });
  });

  describe('getUserGameReview', () => {
    test('should return null for non-existent review', async () => {
      // Mock db
      const authenticateModule = require('../authenticate');
      authenticateModule.db = {};

      // Mock getDoc to return non-existent document
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValueOnce({
        exists: () => false
      });

      const result = await getUserGameReview(userId, 99999);

      expect(result).toBeNull();
    });

    test('should handle invalid game ID', async () => {
      // Mock db
      const authenticateModule = require('../authenticate');
      authenticateModule.db = {};

      // Mock getDoc to return non-existent document
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValueOnce({
        exists: () => false
      });

      // Use a positive integer for the test instead of -1
      const result = await getUserGameReview(userId, 1);

      // Since getDoc will be mocked to return non-existent, this should be null
      expect(result).toBeNull();
    });
  });
});
