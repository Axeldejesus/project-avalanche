import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';

// Mock Firebase modules before importing the service
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(() => Promise.resolve({
    exists: () => true,
    data: () => ({
      userId: 'test-user-id',
      username: 'testuser',
      email: 'test@example.com',
      createdAt: new Date().toISOString()
    })
  })),
  setDoc: jest.fn(() => Promise.resolve()),
}));

// Mock the authenticate module
jest.mock('../authenticate', () => ({
  db: {} // Mock db object
}));

import { getUserProfile } from '../userProfileService';
import { createUserProfile } from '../authenticate';
import {
  setupTestEnvironment,
  teardownTestEnvironment,
  createTestUser,
  cleanupTestUser
} from './test-utils';

describe('User Profile Service', () => {
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

  describe('getUserProfile', () => {
    test('should get user profile successfully', async () => {
      // Mock db
      const authenticateModule = require('../authenticate');
      authenticateModule.db = {};

      // Ensure getDoc returns a proper mock
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          userId: userId,
          username: 'testuser',
          email: 'test@example.com',
          createdAt: new Date().toISOString()
        })
      });

      const result = await getUserProfile(userId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    test('should fail for non-existent user', async () => {
      // Mock getDoc to return non-existent user
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValueOnce({
        exists: () => false
      });

      // Mock db
      const authenticateModule = require('../authenticate');
      authenticateModule.db = {};

      const result = await getUserProfile('non-existent-user');

      expect(result.success).toBe(false);
      expect(result.error).toContain('User profile not found');
    });

    test('should handle database not initialized', async () => {
      // Mock db as null
      const authenticateModule = require('../authenticate');
      authenticateModule.db = null;

      const result = await getUserProfile(userId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database not initialized');
    });
  });
});
