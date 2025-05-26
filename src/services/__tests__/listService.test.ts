import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';

// Mock Firebase modules before importing the service
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  addDoc: jest.fn(() => Promise.resolve({ id: 'mock-list-id' })),
  updateDoc: jest.fn(() => Promise.resolve()),
  deleteDoc: jest.fn(() => Promise.resolve()),
  getDoc: jest.fn(() => Promise.resolve({ 
    exists: () => true,
    data: () => ({ name: 'Test List', userId: 'test-user' })
  })),
  getDocs: jest.fn(() => Promise.resolve({
    docs: [],
    forEach: jest.fn(),
    size: 0
  })),
  query: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  startAfter: jest.fn(),
  setDoc: jest.fn(() => Promise.resolve()),
}));

// Mock the authenticate module
jest.mock('../authenticate', () => ({
  auth: {
    currentUser: { uid: 'test-user-id' }
  },
  db: {} // Mock db object
}));

import { 
  createList, 
  updateList, 
  deleteList, 
  getUserLists, 
  addGameToList, 
  removeGameFromList, 
  getGamesInList 
} from '../listService';
import { 
  setupTestEnvironment, 
  teardownTestEnvironment, 
  createTestUser, 
  cleanupTestUser, 
  mockListData, 
  mockGameData 
} from './test-utils';

describe('List Service', () => {
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

  describe('createList', () => {
    test('should create list successfully', async () => {
      // Ensure auth is properly mocked
      const authenticateModule = require('../authenticate');
      authenticateModule.auth = {
        currentUser: { uid: userId }
      };
      authenticateModule.db = {};

      // Mock addDoc to return a proper document reference with id
      const { addDoc } = require('firebase/firestore');
      addDoc.mockResolvedValueOnce({ id: 'mock-list-id' });

      const result = await createList(mockListData);

      expect(result.success).toBe(true);
      expect(result.listId).toBeDefined();
    });

    test('should fail without authentication', async () => {
      // Mock no auth
      const authenticateModule = require('../authenticate');
      authenticateModule.auth = {
        currentUser: null
      };

      const result = await createList(mockListData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('User not authenticated');
    });
  });

  describe('getUserLists', () => {
    test('should get user lists successfully', async () => {
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

      const result = await getUserLists(userId);

      expect(result.lists).toBeInstanceOf(Array);
    });

    test('should handle empty lists', async () => {
      // Mock db
      const authenticateModule = require('../authenticate');
      authenticateModule.db = {};

      // Mock getDocs to return empty snapshot
      const { getDocs } = require('firebase/firestore');
      getDocs.mockResolvedValueOnce({
        docs: [],
        forEach: jest.fn(),
        size: 0,
        empty: true
      });

      const result = await getUserLists(userId);

      expect(result.lists).toBeInstanceOf(Array);
      expect(result.lists.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getGamesInList', () => {
    test('should handle database not initialized', async () => {
      // Mock db as null to test this specific case
      const authenticateModule = require('../authenticate');
      authenticateModule.db = null;

      const result = await getGamesInList(userId, 'non-existent-list');

      expect(result.games).toBeInstanceOf(Array);
      expect(result.error).toContain('Database not initialized');
    });

    test('should return error for non-existent list', async () => {
      // Mock db and getDoc to return non-existent list
      const authenticateModule = require('../authenticate');
      authenticateModule.db = {};

      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValueOnce({
        exists: () => false
      });

      const result = await getGamesInList(userId, 'non-existent-list');

      expect(result.games).toBeInstanceOf(Array);
      expect(result.error).toContain('List not found');
    });
  });
});
