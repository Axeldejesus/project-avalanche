import express from 'express';
import { db, testConnection } from './firebase.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Test Firebase connection on server startup
testConnection()
  .then(connected => {
    if (connected) {
      console.log('Firebase connection test passed!');
    } else {
      console.log('Firebase connection test failed!');
    }
  });

// Basic route
app.get('/', (req, res) => {
  res.send('Server is running');
});

// Add a route to test Firebase
app.get('/api/test-firebase', async (req, res) => {
  const connected = await testConnection();
  res.json({
    connected,
    message: connected ? 'Firebase connection successful' : 'Firebase connection failed',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to see the server`);
  console.log(`Visit http://localhost:${PORT}/api/test-firebase to test Firebase connection`);
});
