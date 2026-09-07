require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;
let db = null;
let client = null;

async function connectToMongoDB() {
  try {
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI is not set in environment variables');
      return false;
    }
    
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(process.env.DB_NAME || 'mtshikwana_property_match');
    console.log('✅ Connected to MongoDB');
    
    // Create collections if they don't exist
    const collections = ['landlords', 'tenants', 'matches', 'appointments'];
    for (const collection of collections) {
      const colls = await db.listCollections({ name: collection }).toArray();
      if (colls.length === 0) {
        await db.createCollection(collection);
        console.log(`📁 Created collection: ${collection}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    return false;
  }
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ========================================
// DATABASE HELPERS
// ========================================

async function getTableData(collectionName) {
  if (!db) return [];
  try {
    const collection = db.collection(collectionName);
    const data = await collection.find({}).sort({ created_at: -1 }).toArray();
    return data;
  } catch (error) {
    console.error(`Error fetching ${collectionName}:`, error);
    return [];
  }
}

async function syncTableData(collectionName, records) {
  if (!db) return false;
  try {
    const collection = db.collection(collectionName);
    
    // Delete all existing records
    await collection.deleteMany({});
    
    // Insert new records
    if (records && records.length > 0) {
      // Ensure no _id conflicts
      const recordsToInsert = records.map(record => {
        const { _id, ...rest } = record;
        return rest;
      });
      await collection.insertMany(recordsToInsert);
    }
    
    return true;
  } catch (error) {
    console.error(`Error syncing ${collectionName}:`, error);
    return false;
  }
}

// ========================================
// API ROUTES
// ========================================

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = db ? 'connected' : 'disconnected';
    let dataCounts = { landlords: 0, tenants: 0, matches: 0, appointments: 0 };
    
    if (db) {
      dataCounts.landlords = await db.collection('landlords').countDocuments();
      dataCounts.tenants = await db.collection('tenants').countDocuments();
      dataCounts.matches = await db.collection('matches').countDocuments();
      dataCounts.appointments = await db.collection('appointments').countDocuments();
    }
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      mongodb: dbStatus,
      dataCounts
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get all data
app.get('/api/data', async (req, res) => {
  try {
    if (!db) {
      return res.json({ landlords: [], tenants: [], matches: [], appointments: [] });
    }
    
    const [landlords, tenants, matches, appointments] = await Promise.all([
      getTableData('landlords'),
      getTableData('tenants'),
      getTableData('matches'),
      getTableData('appointments')
    ]);
    
    res.json({
      landlords,
      tenants,
      matches,
      appointments
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sync data from client
app.post('/api/sync', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ 
        success: false, 
        message: 'MongoDB not connected. Using localStorage fallback.' 
      });
    }
    
    const { landlords, tenants, matches, appointments } = req.body;
    
    // Sync all collections in parallel
    const results = await Promise.all([
      syncTableData('landlords', landlords || []),
      syncTableData('tenants', tenants || []),
      syncTableData('matches', matches || []),
      syncTableData('appointments', appointments || [])
    ]);
    
    const allSuccess = results.every(r => r === true);
    
    if (allSuccess) {
      res.json({ success: true, message: 'All data synced successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Some data failed to sync' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || 'Khanya0901@2';
  
  if (password === adminPassword) {
    res.json({
      success: true,
      token: 'admin-token-' + Date.now(),
      message: 'Login successful'
    });
  } else {
    res.status(401).json({
      success: false,
      error: 'Invalid password'
    });
  }
});

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve admin.html
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Mtshikwana Property Match running on port ${PORT}`);
  console.log(`📱 Visit: http://localhost:${PORT}`);
  console.log(`🔐 Admin: http://localhost:${PORT}/admin`);
  
  // Connect to MongoDB
  const connected = await connectToMongoDB();
  console.log(`📊 MongoDB: ${connected ? '✅ Connected' : '❌ Not connected (using localStorage fallback)'}`);
});
