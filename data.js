// ========================================
// DATA STORE - Mtshikwana Property Match
// ========================================

let landlords = [];
let tenants = [];
let matches = [];
let appointments = [];

// ========================================
// LOAD DATA
// ========================================
function loadData() {
  const saved = localStorage.getItem('mtshikwana_data');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      landlords = data.landlords || [];
      tenants = data.tenants || [];
      matches = data.matches || [];
      appointments = data.appointments || [];
      // Ensure all items have IDs
      landlords.forEach((l, i) => { if (!l.id) l.id = 'ld_' + Date.now() + '_' + i; });
      tenants.forEach((t, i) => { if (!t.id) t.id = 'tn_' + Date.now() + '_' + i; });
      matches.forEach((m, i) => { if (!m.id) m.id = 'mt_' + Date.now() + '_' + i; });
      appointments.forEach((a, i) => { if (!a.id) a.id = 'ap_' + Date.now() + '_' + i; });
    } catch (e) { console.error('Error loading data:', e); }
  }
}

// ========================================
// SAVE DATA
// ========================================
function saveData() {
  const data = { landlords, tenants, matches, appointments };
  localStorage.setItem('mtshikwana_data', JSON.stringify(data));
  // Dispatch event for cross-tab sync
  window.dispatchEvent(new StorageEvent('storage', {
    key: 'mtshikwana_data',
    newValue: JSON.stringify(data)
  }));
}

// ========================================
// CROSS-TAB SYNC
// ========================================
window.addEventListener('storage', function(e) {
  if (e.key === 'mtshikwana_data' && e.newValue) {
    try {
      const data = JSON.parse(e.newValue);
      landlords = data.landlords || [];
      tenants = data.tenants || [];
      matches = data.matches || [];
      appointments = data.appointments || [];
      // Update UI if visible
      if (document.getElementById('propertyGrid')) {
        renderProperties(landlords.filter(l => l.status === 'online'));
        updatePublicStats();
      }
      if (document.getElementById('adminLandlordList')) {
        loadAdminData();
      }
    } catch (e) {}
  }
});

// ========================================
// INITIALIZE
// ========================================
loadData();
