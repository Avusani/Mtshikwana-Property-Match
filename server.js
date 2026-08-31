const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// In-memory data store (for Railway deployment)
let appData = {
  landlords: [],
  tenants: [],
  matches: [],
  appointments: []
};

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve admin.html
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// API Routes
app.post('/api/sync', (req, res) => {
  try {
    const data = req.body;
    if (data.landlords) appData.landlords = data.landlords;
    if (data.tenants) appData.tenants = data.tenants;
    if (data.matches) appData.matches = data.matches;
    if (data.appointments) appData.appointments = data.appointments;
    res.json({ success: true, message: 'Data synced successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/data', (req, res) => {
  try {
    res.json(appData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin login endpoint
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === 'Khanya0901@2') {
    res.json({ 
      success: true, 
      token: 'admin-token-2026',
      message: 'Login successful'
    });
  } else {
    res.status(401).json({ 
      success: false, 
      error: 'Invalid password' 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Mtshikwana Property Match running on port ${PORT}`);
  console.log(`📱 Visit: http://localhost:${PORT}`);
  console.log(`🔐 Admin: http://localhost:${PORT}/admin`);
});
