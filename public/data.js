// ========================================
// DATA STORE - Mtshikwana Property Match
// With MongoDB Integration
// ========================================

let landlords = [];
let tenants = [];
let matches = [];
let appointments = [];

// ========================================
// API FUNCTIONS
// ========================================

async function loadDataFromServer() {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) throw new Error('Failed to load data');
    const data = await response.json();
    landlords = data.landlords || [];
    tenants = data.tenants || [];
    matches = data.matches || [];
    appointments = data.appointments || [];
    console.log('✅ Data loaded from MongoDB');
    return true;
  } catch (error) {
    console.error('❌ Error loading data:', error);
    // Fallback to localStorage if server fails
    loadFromLocalStorage();
    return false;
  }
}

async function saveDataToServer() {
  try {
    // Ensure all items have IDs and timestamps
    landlords.forEach((l) => { 
      if (!l.id) l.id = 'ld_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      if (!l.created_at) l.created_at = new Date().toISOString();
    });
    tenants.forEach((t) => { 
      if (!t.id) t.id = 'tn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      if (!t.created_at) t.created_at = new Date().toISOString();
    });
    matches.forEach((m) => { 
      if (!m.id) m.id = 'mt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      if (!m.created_at) m.created_at = new Date().toISOString();
    });
    appointments.forEach((a) => { 
      if (!a.id) a.id = 'ap_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      if (!a.created_at) a.created_at = new Date().toISOString();
    });

    const data = { landlords, tenants, matches, appointments };
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to save data');
    }
    
    const result = await response.json();
    console.log('✅ Data saved to MongoDB:', result.message);
    
    // Also save to localStorage as backup
    saveToLocalStorage();
    return true;
  } catch (error) {
    console.error('❌ Error saving data:', error);
    // Fallback to localStorage if server fails
    saveToLocalStorage();
    return false;
  }
}

// ========================================
// LOCAL STORAGE FALLBACK
// ========================================

function loadFromLocalStorage() {
  const saved = localStorage.getItem('mtshikwana_data');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      landlords = data.landlords || [];
      tenants = data.tenants || [];
      matches = data.matches || [];
      appointments = data.appointments || [];
      console.log('📦 Data loaded from localStorage (fallback)');
    } catch (e) {
      console.error('Error loading from localStorage:', e);
    }
  }
}

function saveToLocalStorage() {
  const data = { landlords, tenants, matches, appointments };
  localStorage.setItem('mtshikwana_data', JSON.stringify(data));
}

// ========================================
// LOAD DATA - Try server first, fallback to localStorage
// ========================================

async function loadData() {
  const loaded = await loadDataFromServer();
  if (!loaded) {
    loadFromLocalStorage();
    // Try to sync localStorage data to server
    if (landlords.length > 0 || tenants.length > 0) {
      await saveDataToServer();
    }
  }
  // Dispatch event for UI updates
  window.dispatchEvent(new CustomEvent('dataLoaded'));
}

// ========================================
// SAVE DATA - Try server first, fallback to localStorage
// ========================================

function saveData() {
  // Save to server
  saveDataToServer().then(success => {
    if (!success) {
      console.log('⚠️ Using localStorage fallback');
    }
  });
  
  // Also save to localStorage immediately for quick access
  saveToLocalStorage();
}

// ========================================
// CHECK MONGODB CONNECTION
// ========================================

async function checkMongoDBConnection() {
  try {
    const response = await fetch('/api/health');
    if (!response.ok) throw new Error('Health check failed');
    const data = await response.json();
    return data.mongodb === 'connected';
  } catch (error) {
    console.error('❌ MongoDB connection check failed:', error);
    return false;
  }
}

// ========================================
// INITIALIZE
// ========================================

// Load data when the page loads
document.addEventListener('DOMContentLoaded', function() {
  loadData().then(() => {
    // Check connection status
    checkMongoDBConnection().then(connected => {
      console.log(`🔗 MongoDB: ${connected ? '✅ Connected' : '❌ Disconnected (using fallback)'}`);
    });
    // Dispatch event for other scripts
    window.dispatchEvent(new CustomEvent('dataReady'));
  });
});

// Export for use in other scripts
window.loadData = loadData;
window.saveData = saveData;
window.landlords = landlords;
window.tenants = tenants;
window.matches = matches;
window.appointments = appointments;
window.checkMongoDBConnection = checkMongoDBConnection;
