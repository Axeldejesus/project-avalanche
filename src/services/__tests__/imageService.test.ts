import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';

// Mock Firebase and other dependencies before importing
jest.mock('../authenticate', () => ({
  ensureFirestore: jest.fn(() => ({})),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  updateDoc: jest.fn(() => Promise.resolve()),
}));

import { getProfileImageUrl } from '../imageService';
import { setupTestEnvironment, teardownTestEnvironment } from './test-utils';

describe('Image Service', () => {
  beforeAll(() => {
    setupTestEnvironment();
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  describe('getProfileImageUrl', () => {
    test('should return placeholder for undefined imageUrl', () => {
      const result = getProfileImageUrl(undefined);
      expect(result).toBe('/placeholder-avatar.png');
    });

    test('should return placeholder for empty string', () => {
      const result = getProfileImageUrl('');
      expect(result).toBe('/placeholder-avatar.png');
    });

    test('should return same URL for absolute URLs', () => {
      const absoluteUrl = 'https://example.com/image.jpg';
      const result = getProfileImageUrl(absoluteUrl);
      expect(result).toBe(absoluteUrl);
    });

    test('should return relative path as is', () => {
      const relativePath = '/images/profile-pictures/user-123.jpg';
      const result = getProfileImageUrl(relativePath);
      expect(result).toBe(relativePath);
    });

    test('should handle null input gracefully', () => {
      // Cast to string to avoid TypeScript error but test the runtime behavior
      const result = getProfileImageUrl(null as unknown as string);
      expect(result).toBe('/placeholder-avatar.png');
    });
  });
});
