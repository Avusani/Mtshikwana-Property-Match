// ========================================
// ADMIN - Mtshikwana Property Match
// ========================================

const ADMIN_PASSWORD = "Khanya0901@2";
const SESSION_KEY = "mtshikwanaAdminSession";

let adminToken = null;
let currentFilter = 'all';
let currentCalendarMonth = new Date().getMonth();
let currentCalendarYear = new Date().getFullYear();

// ========================================
// ADMIN LOGIN
// ========================================
document.getElementById('adminLoginForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const password = document.getElementById('adminPassword').value;
  const errorEl = document.getElementById('adminLoginError');
  
  try {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      adminToken = data.token;
      sessionStorage.setItem(SESSION_KEY, 'yes');
      document.getElementById('adminLoginScreen').style.display = 'none';
      document.getElementById('adminContent').style.display = 'block';
      document.getElementById('adminUser').textContent = '👤 Admin';
      loadAdminData();
      errorEl.style.display = 'none';
    } else {
      errorEl.textContent = '❌ ' + (data.error || 'Incorrect admin password.');
      errorEl.style.display = 'block';
    }
  } catch (error) {
    errorEl.textContent = '❌ Error connecting to server. Please try again.';
    errorEl.style.display = 'block';
  }
});

// ========================================
// ADMIN FUNCTIONS
// ========================================
function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  adminToken = null;
  document.getElementById('adminLoginScreen').style.display = 'block';
  document.getElementById('adminContent').style.display = 'none';
  document.getElementById('adminUser').textContent = '';
  document.getElementById('adminPassword').value = '';
  document.getElementById('adminLoginError').style.display = 'none';
}

function switchAdminTab(tab) {
  document.querySelectorAll('.admin-tabs button').forEach(t => t.classList.remove('active'));
  document.querySelector(`.admin-tabs button[onclick*="${tab}"]`).classList.add('active');
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  document.getElementById('admin' + tab.charAt(0).toUpperCase() + tab.slice(1) + 'Section').classList.add('active');
  if (tab === 'appointments') renderCalendar();
}

function loadAdminData() {
  updateAdminStats();
  renderAdminLandlords();
  renderAdminTenants();
  renderAdminMatches();
  renderAdminAppointments();
  renderCalendar();
}

function updateAdminStats() {
  const online = landlords.filter(l => l.status === 'online').length;
  const pending = appointments.filter(a => a.status === 'pending').length;
  const today = appointments.filter(a => a.date === new Date().toISOString().slice(0,10)).length;
  const completed = appointments.filter(a => a.status === 'completed').length;

  document.getElementById('adminStatTenants').textContent = tenants.length;
  document.getElementById('adminStatLandlords').textContent = landlords.length;
  document.getElementById('adminStatOnline').textContent = online;
  document.getElementById('adminStatMatches').textContent = matches.length;
  document.getElementById('adminStatAppointments').textContent = appointments.length;
  document.getElementById('adminCountLandlords').textContent = landlords.length;
  document.getElementById('adminCountTenants').textContent = tenants.length;
  document.getElementById('adminCountMatches').textContent = matches.length;
  document.getElementById('adminCountAppointments').textContent = appointments.length;
  document.getElementById('dashPendingAppts').textContent = pending;
  document.getElementById('dashTodayAppts').textContent = today;
  document.getElementById('dashCompleted').textContent = completed;
}

// ========================================
// ADMIN LANDLORDS
// ========================================
function renderAdminLandlords() {
  const list = document.getElementById('adminLandlordList');
  if (landlords.length === 0) {
    list.innerHTML = '<div class="empty">🏠 No landlords registered yet</div>';
    return;
  }
  let html = '';
  landlords.forEach((l, i) => {
    html += `
      <div class="list-item" style="border-left-color:${l.status === 'online' ? '#4caf8a' : '#b8493b'};">
        <div class="info">
          <div class="name">${l.property || l.name} <span class="status-badge ${l.status === 'online' ? 'confirmed' : 'cancelled'}">${l.status === 'online' ? '🟢 Online' : '🔴 Offline'}</span></div>
          <div class="sub">📍 ${l.area || 'Unknown'} | 💰 R${l.rent || 0} | 🏠 ${l.roomType || 'Any'} | 🛏️ ${l.rooms || 0} rooms</div>
          <div class="sub">👤 ${l.name} | 📞 ${l.whatsapp || l.contact || 'No contact'}</div>
        </div>
        <div class="actions">
          <button class="${l.status === 'online' ? 'btn-danger' : 'btn-success'}" onclick="toggleLandlordStatus('${l.id}')">
            ${l.status === 'online' ? '🔴 Set Offline' : '🟢 Set Online'}
          </button>
          <button class="btn-danger" onclick="deleteLandlord('${l.id}')">🗑️</button>
        </div>
      </div>
    `;
  });
  list.innerHTML = html;
}

async function toggleLandlordStatus(id) {
  const l = landlords.find(ld => ld.id === id);
  if (!l) return;
  l.status = l.status === 'online' ? 'offline' : 'online';
  await saveData();
  renderAdminLandlords();
  updateAdminStats();
  renderProperties(landlords.filter(ld => ld.status === 'online'));
  updatePublicStats();
}

async function deleteLandlord(id) {
  if (!confirm('⚠️ Delete this landlord permanently?')) return;
  landlords = landlords.filter(l => l.id !== id);
  await saveData();
  renderAdminLandlords();
  updateAdminStats();
  renderProperties(landlords.filter(l => l.status === 'online'));
  updatePublicStats();
}

// ========================================
// ADMIN TENANTS
// ========================================
function renderAdminTenants() {
  const list = document.getElementById('adminTenantList');
  if (tenants.length === 0) {
    list.innerHTML = '<div class="empty">👥 No tenants registered yet</div>';
    return;
  }
  let html = '';
  tenants.forEach((t, i) => {
    html += `
      <div class="list-item">
        <div class="info">
          <div class="name">${t.name}</div>
          <div class="sub">📍 ${t.location || 'Any'} | 💰 R${t.minBudget || 0} - R${t.budget || 0} | 🏠 ${t.roomType || 'Any'}</div>
          <div class="sub">📞 ${t.whatsapp || 'No contact'} | 📅 ${t.moveIn ? new Date(t.moveIn).toLocaleDateString() : 'Anytime'}</div>
        </div>
        <div class="actions">
          <button class="btn-danger" onclick="deleteTenant('${t.id}')">🗑️</button>
          <button class="btn-success" onclick="matchTenantFromAdmin('${t.id}')">🔎 Match Rooms</button>
        </div>
      </div>
    `;
  });
  list.innerHTML = html;
}

async function deleteTenant(id) {
  if (!confirm('⚠️ Delete this tenant permanently?')) return;
  tenants = tenants.filter(t => t.id !== id);
  await saveData();
  renderAdminTenants();
  updateAdminStats();
  updatePublicStats();
}

// ========================================
// ADMIN MATCHES
// ========================================
async function generateMatches() {
  matches = [];
  const onlineLandlords = landlords.filter(l => l.status === 'online' && parseInt(l.rooms) > 0);
  tenants.forEach(t => {
    onlineLandlords.forEach(l => {
      let score = 0;
      if (t.location === 'Any' || t.location === l.area) score += 50;
      else if (t.location && l.area && t.location.toLowerCase().includes(l.area.toLowerCase())) score += 40;
      else score += 10;
      const rent = parseFloat(l.rent) || 0;
      const budget = parseFloat(t.budget) || Infinity;
      const minBudget = parseFloat(t.minBudget) || 0;
      if (rent <= budget && rent >= minBudget) {
        const budgetScore = 25 * (1 - (rent - minBudget) / (budget - minBudget || 1));
        score += Math.max(0, Math.min(25, budgetScore));
      } else if (rent <= budget) score += 15;
      if (t.roomType === 'Any' || t.roomType === l.roomType) score += 10;
      if (t.moveIn && l.available) {
        const moveIn = new Date(t.moveIn);
        const available = new Date(l.available);
        if (moveIn >= available) score += 5;
      } else score += 3;
      if (t.parking === 'Yes' && l.parking && l.parking !== 'No') score += 5;
      else if (t.parking !== 'Yes') score += 5;
      if (t.privateBathroom === 'Yes' && l.bathroom === 'Private') score += 3;
      else if (t.privateBathroom !== 'Yes') score += 3;
      if (t.childFriendly === 'Yes' && l.childFriendly === 'Yes') score += 2;
      else if (t.childFriendly !== 'Yes') score += 2;
      if (score > 50) {
        matches.push({
          id: 'mt_' + Date.now() + '_' + matches.length,
          tenantId: t.id,
          landlordId: l.id,
          tenantName: t.name,
          landlordName: l.name,
          property: l.property,
          area: l.area,
          rent: l.rent,
          score: Math.round(score),
          created_at: new Date().toISOString()
        });
      }
    });
  });
  matches.sort((a, b) => b.score - a.score);
  await saveData();
  renderAdminMatches();
  updateAdminStats();
  updatePublicStats();
}

function renderAdminMatches() {
  const list = document.getElementById('adminMatchList');
  if (matches.length === 0) {
    list.innerHTML = '<div class="empty">🤝 No matches generated yet. Click "Generate Matches" to start matching.</div>';
    return;
  }
  let html = '';
  matches.slice(0, 30).forEach((m, i) => {
    html += `
      <div class="list-item" style="border-left-color:${m.score >= 80 ? '#4caf8a' : m.score >= 60 ? '#e5a638' : '#b8493b'};">
        <div class="info">
          <div class="name">${m.tenantName} ↔ ${m.property || m.landlordName} <span style="background:#4caf8a;color:#fff;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:
