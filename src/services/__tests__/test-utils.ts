// Test configuration - simplified since we're mocking Firebase
export const setupTestEnvironment = () => {
  // Return mock objects since Firebase is mocked
  return { 
    testApp: {}, 
    testAuth: {}, 
    testDb: {} 
  };
};

export const teardownTestEnvironment = async () => {
  // No-op since Firebase is mocked
};

// Test user factory
export const createTestUser = async (email?: string, password?: string, username?: string) => {
  const testEmail = email || `test-${Date.now()}@example.com`;
  const testPassword = password || 'testpassword123';
  const testUsername = username || `testuser-${Date.now()}`;
  
  return {
    email: testEmail,
    password: testPassword,
    username: testUsername
  };
};

// Cleanup test data - simplified since Firebase is mocked
export const cleanupTestUser = async (userId: string) => {
  // No-op since Firebase is mocked
  console.log(`Mock cleanup for user: ${userId}`);
};

// Mock game data
export const mockGameData = {
  id: 12345,
  name: "Test Game",
  cover: "https://example.com/cover.jpg",
  rating: 4.5,
  genres: ["Action", "Adventure"]
};

export const mockReviewData = {
  gameId: 12345,
  gameName: "Test Game",
  gameCover: "https://example.com/cover.jpg",
  rating: 4,
  comment: "Great game!"
};

export const mockCollectionData = {
  gameId: 12345,
  gameName: "Test Game",
  gameCover: "https://example.com/cover.jpg",
  status: "playing" as const,
  notes: "Really enjoying this game"
};

export const mockListData = {
  name: "Test List",
  description: "A test list for games",
  icon: "star",
  color: "#ff0000"
};
