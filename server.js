const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Data file path for persistence
const DATA_FILE = path.join(__dirname, 'data.json');

// Initialize data store
let appData = {
  landlords: [],
  tenants: [],
  matches: [],
  appointments: []
};

// Load data from file if exists
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const data = JSON.parse(raw);
      appData.landlords = data.landlords || [];
      appData.tenants = data.tenants || [];
      appData.matches = data.matches || [];
      appData.appointments = data.appointments || [];
      console.log('📂 Data loaded from file');
    } else {
      console.log('📄 No data file found, starting fresh');
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

// Save data to file
function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(appData, null, 2), 'utf8');
    console.log('💾 Data saved to file');
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

// Load data on startup
loadData();

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve admin.html
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// API Routes

// Get all data
app.get('/api/data', (req, res) => {
  try {
    res.json(appData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sync data from client
app.post('/api/sync', (req, res) => {
  try {
    const data = req.body;
    if (data.landlords) appData.landlords = data.landlords;
    if (data.tenants) appData.tenants = data.tenants;
    if (data.matches) appData.matches = data.matches;
    if (data.appointments) appData.appointments = data.appointments;
    saveData();
    res.json({ success: true, message: 'Data synced successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin login
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    dataCount: {
      landlords: appData.landlords.length,
      tenants: appData.tenants.length,
      matches: appData.matches.length,
      appointments: appData.appointments.length
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Mtshikwana Property Match running on port ${PORT}`);
  console.log(`📱 Visit: http://localhost:${PORT}`);
  console.log(`🔐 Admin: http://localhost:${PORT}/admin`);
});
