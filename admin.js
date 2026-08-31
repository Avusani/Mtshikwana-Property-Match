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
document.getElementById('adminLoginForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const password = document.getElementById('adminPassword').value;
  const errorEl = document.getElementById('adminLoginError');
  if (password === ADMIN_PASSWORD) {
    adminToken = 'admin-session-token';
    sessionStorage.setItem(SESSION_KEY, 'yes');
    document.getElementById('adminLoginScreen').style.display = 'none';
    document.getElementById('adminContent').style.display = 'block';
    document.getElementById('adminUser').textContent = '👤 Admin';
    loadAdminData();
    errorEl.style.display = 'none';
  } else {
    errorEl.textContent = '❌ Incorrect admin password.';
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

function toggleLandlordStatus(id) {
  const l = landlords.find(ld => ld.id === id);
  if (!l) return;
  l.status = l.status === 'online' ? 'offline' : 'online';
  saveData();
  renderAdminLandlords();
  updateAdminStats();
  renderProperties(landlords.filter(ld => ld.status === 'online'));
  updatePublicStats();
}

function deleteLandlord(id) {
  if (!confirm('⚠️ Delete this landlord permanently?')) return;
  landlords = landlords.filter(l => l.id !== id);
  saveData();
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

function deleteTenant(id) {
  if (!confirm('⚠️ Delete this tenant permanently?')) return;
  tenants = tenants.filter(t => t.id !== id);
  saveData();
  renderAdminTenants();
  updateAdminStats();
  updatePublicStats();
}

// ========================================
// ADMIN MATCHES
// ========================================
function generateMatches() {
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
          createdAt: new Date().toISOString()
        });
      }
    });
  });
  matches.sort((a, b) => b.score - a.score);
  saveData();
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
          <div class="name">${m.tenantName} ↔ ${m.property || m.landlordName} <span style="background:#4caf8a;color:#fff;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;">${m.score}%</span></div>
          <div class="sub">📍 ${m.area || 'Unknown'} | 💰 R${m.rent || 0}</div>
        </div>
        <div class="actions">
          <button class="btn-success" onclick="scheduleAppointment('${m.id}')">📅 Schedule</button>
          <a href="https://wa.me/${(tenants.find(t => t.id === m.tenantId)?.whatsapp || '').replace(/[^0-9]/g, '')}?text=Hi%2C%20we%20found%20a%20room%20for%20you%20in%20${encodeURIComponent(m.area || '')}%20for%20R${m.rent}%20per%20month." target="_blank" class="btn-whatsapp" style="padding:4px 14px;border:none;border-radius:6px;font-weight:600;font-size:12px;cursor:pointer;text-decoration:none;display:inline-block;background:#25D366;color:#fff;">💬 Tenant</a>
          <a href="https://wa.me/${(landlords.find(l => l.id === m.landlordId)?.whatsapp || '').replace(/[^0-9]/g, '')}?text=Hi%2C%20we%20have%20a%20tenant%20interested%20in%20your%20room." target="_blank" class="btn-whatsapp" style="padding:4px 14px;border:none;border-radius:6px;font-weight:600;font-size:12px;cursor:pointer;text-decoration:none;display:inline-block;background:#25D366;color:#fff;">💬 Landlord</a>
        </div>
      </div>
    `;
  });
  list.innerHTML = html;
}

function matchTenantFromAdmin(id) {
  const tenant = tenants.find(t => t.id === id);
  if (!tenant) return;
  const results = [];
  const onlineLandlords = landlords.filter(l => l.status === 'online' && parseInt(l.rooms) > 0);
  onlineLandlords.forEach(l => {
    let score = 0;
    if (tenant.location === 'Any' || tenant.location === l.area) score += 50;
    else if (tenant.location && l.area && tenant.location.toLowerCase().includes(l.area.toLowerCase())) score += 40;
    else score += 10;
    const rent = parseFloat(l.rent) || 0;
    const budget = parseFloat(tenant.budget) || Infinity;
    const minBudget = parseFloat(tenant.minBudget) || 0;
    if (rent <= budget && rent >= minBudget) {
      const budgetScore = 25 * (1 - (rent - minBudget) / (budget - minBudget || 1));
      score += Math.max(0, Math.min(25, budgetScore));
    } else if (rent <= budget) score += 15;
    if (tenant.roomType === 'Any' || tenant.roomType === l.roomType) score += 10;
    if (tenant.moveIn && l.available) {
      const moveIn = new Date(tenant.moveIn);
      const available = new Date(l.available);
      if (moveIn >= available) score += 5;
    } else score += 3;
    if (tenant.parking === 'Yes' && l.parking && l.parking !== 'No') score += 5;
    else if (tenant.parking !== 'Yes') score += 5;
    if (tenant.privateBathroom === 'Yes' && l.bathroom === 'Private') score += 3;
    else if (tenant.privateBathroom !== 'Yes') score += 3;
    if (tenant.childFriendly === 'Yes' && l.childFriendly === 'Yes') score += 2;
    else if (tenant.childFriendly !== 'Yes') score += 2;
    if (score > 50) results.push({ landlord: l, score: Math.round(score) });
  });
  results.sort((a, b) => b.score - a.score);
  let html = `<div style="margin-bottom:12px;"><strong>🏠 Matches for ${tenant.name}</strong> (${results.length} found)</div>`;
  results.slice(0, 10).forEach(r => {
    html += `
      <div class="list-item" style="border-left-color:#4caf8a;">
        <div class="info">
          <div class="name">${r.landlord.property || r.landlord.name} <span style="background:#4caf8a;color:#fff;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;">${r.score}%</span></div>
          <div class="sub">📍 ${r.landlord.area} | 💰 R${r.landlord.rent}</div>
        </div>
        <div class="actions">
          <a href="https://wa.me/${(r.landlord.whatsapp || '').replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(r.landlord.name)}%2C%20we%20have%20a%20tenant%20interested%20in%20your%20room." target="_blank" class="btn-whatsapp" style="padding:4px 14px;border:none;border-radius:6px;font-weight:600;font-size:12px;cursor:pointer;text-decoration:none;display:inline-block;background:#25D366;color:#fff;">💬 Contact</a>
        </div>
      </div>
    `;
  });
  if (results.length === 0) html += '<div style="color:#637268;">No matches found for this tenant.</div>';
  switchAdminTab('matches');
  document.getElementById('adminMatchList').innerHTML = html;
}

// ========================================
// APPOINTMENTS
// ========================================
function scheduleAppointment(matchId) {
  const match = matches.find(m => m.id === matchId);
  if (!match) return;
  const tenant = tenants.find(t => t.id === match.tenantId);
  const landlord = landlords.find(l => l.id === match.landlordId);
  if (!tenant || !landlord) return;

  document.getElementById('apptTenant').value = tenant.name;
  document.getElementById('apptLandlord').value = landlord.name;
  document.getElementById('apptProperty').value = match.property || landlord.property;
  document.getElementById('apptArea').value = match.area || landlord.area;
  document.getElementById('apptRent').value = match.rent || landlord.rent;
  document.getElementById('apptTenantId').value = tenant.id;
  document.getElementById('apptLandlordId').value = landlord.id;
  document.getElementById('apptMatchId').value = match.id;
  document.getElementById('apptDate').value = new Date().toISOString().slice(0,10);
  document.getElementById('apptTime').value = '14:00';
  document.getElementById('apptNotes').value = '';

  document.getElementById('appointmentModal').classList.add('show');
}

document.getElementById('appointmentForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const data = {
    id: 'ap_' + Date.now(),
    tenantId: document.getElementById('apptTenantId').value,
    landlordId: document.getElementById('apptLandlordId').value,
    tenantName: document.getElementById('apptTenant').value,
    landlordName: document.getElementById('apptLandlord').value,
    property: document.getElementById('apptProperty').value,
    area: document.getElementById('apptArea').value,
    rent: document.getElementById('apptRent').value,
    date: document.getElementById('apptDate').value,
    time: document.getElementById('apptTime').value,
    type: document.getElementById('apptType').value,
    notes: document.getElementById('apptNotes').value,
    status: 'pending',
    matchId: document.getElementById('apptMatchId').value,
    createdAt: new Date().toISOString()
  };
  appointments.push(data);
  saveData();
  document.getElementById('appointmentModal').classList.remove('show');
  this.reset();
  alert('✅ Appointment scheduled! Status: Pending Confirmation.');
  loadAdminData();
});

function renderAdminAppointments() {
  const list = document.getElementById('adminAppointmentList');
  let filtered = appointments;
  if (currentFilter !== 'all') {
    filtered = appointments.filter(a => a.status === currentFilter);
  }
  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty">📅 No ${currentFilter !== 'all' ? currentFilter : ''} appointments</div>`;
    return;
  }
  let html = '';
  filtered.forEach((a, i) => {
    const statusClass = a.status === 'confirmed' ? 'confirmed' : a.status === 'completed' ? 'completed' : a.status === 'cancelled' ? 'cancelled' : 'pending';
    const tenant = tenants.find(t => t.id === a.tenantId);
    const landlord = landlords.find(l => l.id === a.landlordId);
    html += `
      <div class="list-item" style="border-left-color:${a.status === 'confirmed' ? '#4caf8a' : a.status === 'completed' ? '#1e40af' : a.status === 'cancelled' ? '#b8493b' : '#e5a638'};">
        <div class="info">
          <div class="name">${a.tenantName} ↔ ${a.property} <span class="status-badge ${statusClass}">${a.status.toUpperCase()}</span></div>
          <div class="sub">📅 ${new Date(a.date).toLocaleDateString()} at ${a.time} | 📍 ${a.area} | 💰 R${a.rent}</div>
          <div class="sub">👤 Landlord: ${a.landlordName} ${a.notes ? '| 📝 ' + a.notes : ''}</div>
        </div>
        <div class="actions">
          ${a.status === 'pending' ? `<button class="btn-success" onclick="updateAppointmentStatus('${a.id}','confirmed')">✅ Confirm</button>` : ''}
          ${a.status === 'confirmed' ? `<button class="btn-success" onclick="updateAppointmentStatus('${a.id}','completed')">✅ Complete</button>` : ''}
          ${a.status === 'pending' || a.status === 'confirmed' ? `<button class="btn-danger" onclick="updateAppointmentStatus('${a.id}','cancelled')">❌ Cancel</button>` : ''}
          ${tenant ? `<a href="https://wa.me/${tenant.whatsapp.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(tenant.name)}%2C%20your%20room%20viewing%20appointment%20has%20been%20scheduled%20for%20${new Date(a.date).toLocaleDateString()}%20at%20${a.time}%20in%20${encodeURIComponent(a.area)}.%20Please%20confirm%20your%20attendance." target="_blank" class="btn-whatsapp" style="padding:4px 14px;border:none;border-radius:6px;font-weight:600;font-size:12px;cursor:pointer;text-decoration:none;display:inline-block;background:#25D366;color:#fff;">💬 Tenant</a>` : ''}
          ${landlord ? `<a href="https://wa.me/${landlord.whatsapp.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(landlord.name)}%2C%20a%20tenant%20has%20been%20scheduled%20to%20view%20your%20room%20on%20${new Date(a.date).toLocaleDateString()}%20at%20${a.time}.%20Please%20confirm%20the%20appointment." target="_blank" class="btn-whatsapp" style="padding:4px 14px;border:none;border-radius:6px;font-weight:600;font-size:12px;cursor:pointer;text-decoration:none;display:inline-block;background:#25D366;color:#fff;">💬 Landlord</a>` : ''}
        </div>
      </div>
    `;
  });
  list.innerHTML = html;
}

function updateAppointmentStatus(id, status) {
  const appt = appointments.find(a => a.id === id);
  if (!appt) return;
  appt.status = status;
  saveData();
  renderAdminAppointments();
  updateAdminStats();
  renderCalendar();
}

function filterAppointments(filter) {
  currentFilter = filter;
  renderAdminAppointments();
}

// ========================================
// CALENDAR
// ========================================
function renderCalendar() {
  const container = document.getElementById('calendarContainer');
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const today = new Date();
  const currentDate = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const firstDay = new Date(currentCalendarYear, currentCalendarMonth, 1).getDay();
  const daysInMonth = new Date(currentCalendarYear, currentCalendarMonth + 1, 0).getDate();

  let html = `
    <div class="calendar-nav">
      <button onclick="changeMonth(-1)">◀</button>
      <span class="month-label">${months[currentCalendarMonth]} ${currentCalendarYear}</span>
      <button onclick="changeMonth(1)">▶</button>
    </div>
    <div class="calendar-grid">
  `;

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  dayNames.forEach(d => {
    html += `<div class="cal-header">${d}</div>`;
  });

  for (let i = 0; i < firstDay; i++) {
    html += `<div class="cal-day empty"></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentCalendarYear}-${String(currentCalendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const hasAppt = appointments.some(a => a.date === dateStr);
    const isToday = d === currentDate && currentCalendarMonth === currentMonth && currentCalendarYear === currentYear;
    const clickable = hasAppt ? `onclick="showAppointmentsForDate('${dateStr}')"` : '';
    html += `
      <div class="cal-day ${isToday ? 'today' : ''} ${hasAppt ? 'has-appointment' : ''}" ${clickable}>
        ${d}
        ${hasAppt ? '<div class="appt-indicator"></div>' : ''}
      </div>
    `;
  }

  html += '</div>';
  container.innerHTML = html;
}

function changeMonth(delta) {
  currentCalendarMonth += delta;
  if (currentCalendarMonth > 11) {
    currentCalendarMonth = 0;
    currentCalendarYear++;
  } else if (currentCalendarMonth < 0) {
    currentCalendarMonth = 11;
    currentCalendarYear--;
  }
  renderCalendar();
}

function showAppointmentsForDate(date) {
  const dayAppts = appointments.filter(a => a.date === date);
  if (dayAppts.length === 0) return;
  let msg = `📅 Appointments for ${new Date(date).toLocaleDateString()}:\n\n`;
  dayAppts.forEach(a => {
    msg += `${a.time} - ${a.tenantName} ↔ ${a.property} (${a.status})\n`;
  });
  alert(msg);
}

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', function() {
  loadData();
  if (sessionStorage.getItem(SESSION_KEY) === 'yes') {
    adminToken = 'admin-session-token';
    document.getElementById('adminLoginScreen').style.display = 'none';
    document.getElementById('adminContent').style.display = 'block';
    document.getElementById('adminUser').textContent = '👤 Admin';
    loadAdminData();
  }
});
