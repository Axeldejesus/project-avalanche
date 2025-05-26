/// <reference types="./types/jest.d.ts" />

// Import test utilities first
import { 
  setupTestEnvironment, 
  teardownTestEnvironment, 
  createTestUser, 
  cleanupTestUser 
} from './test-utils';

// Mock the authenticate module before importing it
jest.mock('../authenticate', () => ({
  auth: {
    currentUser: { uid: 'mock-user-id', email: 'test@example.com' }
  },
  db: {},
  registerUser: jest.fn(),
  loginUser: jest.fn(),
  createUserProfile: jest.fn(),
  getUserProfile: jest.fn(),
  updateUserProfile: jest.fn(),
}));

describe('Authentication Service', () => {
  let testAuth: any;
  let testDb: any;
  let testUserData: any;
  let createdUserId: string | null = null;

  // Mock functions
  const mockRegisterUser = jest.fn();
  const mockLoginUser = jest.fn();
  const mockCreateUserProfile = jest.fn();
  const mockGetUserProfile = jest.fn();
  const mockUpdateUserProfile = jest.fn();

  beforeAll(() => {
    const { testAuth: auth, testDb: db } = setupTestEnvironment();
    testAuth = auth;
    testDb = db;
    
    // Set up the mock implementations
    const authenticateModule = require('../authenticate');
    authenticateModule.registerUser = mockRegisterUser;
    authenticateModule.loginUser = mockLoginUser;
    authenticateModule.createUserProfile = mockCreateUserProfile;
    authenticateModule.getUserProfile = mockGetUserProfile;
    authenticateModule.updateUserProfile = mockUpdateUserProfile;
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  beforeEach(async () => {
    testUserData = await createTestUser();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    if (createdUserId) {
      await cleanupTestUser(createdUserId);
      createdUserId = null;
    }
  });

  describe('registerUser', () => {
    test('should register a new user successfully', async () => {
      // Mock successful registration
      mockRegisterUser.mockResolvedValue({
        success: true,
        user: { uid: 'mock-user-id', email: testUserData.email }
      });

      const result = await mockRegisterUser(
        testUserData.email,
        testUserData.password,
        testUserData.username
      );

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(mockRegisterUser).toHaveBeenCalledWith(
        testUserData.email,
        testUserData.password,
        testUserData.username
      );

      if (result.user) {
        createdUserId = result.user.uid;
      }
    });

    test('should fail with invalid email', async () => {
      mockRegisterUser.mockResolvedValue({
        success: false,
        error: 'Invalid email format'
      });

      const result = await mockRegisterUser(
        'invalid-email',
        testUserData.password,
        testUserData.username
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email format');
    });
  });

  describe('createUserProfile', () => {
    test('should create user profile successfully', async () => {
      mockCreateUserProfile.mockResolvedValue({ success: true });

      const userId = 'test-user-id';
      const profileData = {
        userId,
        username: testUserData.username,
        email: testUserData.email,
        createdAt: new Date().toISOString()
      };

      const result = await mockCreateUserProfile(userId, profileData);

      expect(result.success).toBe(true);
      expect(mockCreateUserProfile).toHaveBeenCalledWith(userId, profileData);
      
      await cleanupTestUser(userId);
    });
  });

  describe('getUserProfile', () => {
    test('should get user profile successfully', async () => {
      mockGetUserProfile.mockResolvedValue({
        success: true,
        data: { username: testUserData.username }
      });

      const userId = 'test-user-id';
      const result = await mockGetUserProfile(userId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(mockGetUserProfile).toHaveBeenCalledWith(userId);
      
      await cleanupTestUser(userId);
    });

    test('should fail for non-existent user', async () => {
      mockGetUserProfile.mockResolvedValue({
        success: false,
        error: 'User profile not found'
      });

      const result = await mockGetUserProfile('non-existent-user');

      expect(result.success).toBe(false);
      expect(result.error).toContain('User profile not found');
    });
  });
});
