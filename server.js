require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Please check your environment variables.');
  console.error('SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.error('SUPABASE_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');
  // Don't exit, allow fallback to localStorage
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ========================================
// DATABASE HELPERS
// ========================================

async function getTableData(tableName) {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error(`Error fetching ${tableName}:`, error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error(`Error in getTableData ${tableName}:`, error);
    return [];
  }
}

async function syncTableData(tableName, records) {
  if (!supabase) return false;
  try {
    // Delete all existing records
    const { error: deleteError } = await supabase
      .from(tableName)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (deleteError) {
      console.error(`Error deleting ${tableName}:`, deleteError);
      return false;
    }
    
    // Insert new records
    if (records && records.length > 0) {
      const { error: insertError } = await supabase
        .from(tableName)
        .insert(records);
      
      if (insertError) {
        console.error(`Error inserting ${tableName}:`, insertError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error(`Error in syncTableData ${tableName}:`, error);
    return false;
  }
}

// ========================================
// API ROUTES
// ========================================

// Health check
app.get('/api/health', async (req, res) => {
  try {
    let supabaseStatus = 'disconnected';
    let dataCounts = { landlords: 0, tenants: 0, matches: 0, appointments: 0 };
    
    if (supabase) {
      try {
        const { data, error } = await supabase.from('landlords').select('count', { count: 'exact', head: true });
        supabaseStatus = error ? 'disconnected' : 'connected';
        dataCounts.landlords = (await getTableData('landlords')).length;
        dataCounts.tenants = (await getTableData('tenants')).length;
        dataCounts.matches = (await getTableData('matches')).length;
        dataCounts.appointments = (await getTableData('appointments')).length;
      } catch (e) {
        supabaseStatus = 'error';
      }
    }
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      supabase: supabaseStatus,
      dataCounts
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get all data
app.get('/api/data', async (req, res) => {
  try {
    if (!supabase) {
      // Return empty data if Supabase not configured
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
    if (!supabase) {
      return res.status(503).json({ 
        success: false, 
        message: 'Supabase not configured. Using localStorage fallback.' 
      });
    }
    
    const { landlords, tenants, matches, appointments } = req.body;
    
    // Sync all tables in parallel
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
app.listen(PORT, () => {
  console.log(`🚀 Mtshikwana Property Match running on port ${PORT}`);
  console.log(`📱 Visit: http://localhost:${PORT}`);
  console.log(`🔐 Admin: http://localhost:${PORT}/admin`);
  console.log(`📊 Supabase: ${supabase ? '✅ Connected' : '❌ Not configured (using localStorage fallback)'}`);
});
