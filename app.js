// ========================================
// PUBLIC APP - Mtshikwana Property Match
// ========================================

// ========================================
// DOM FUNCTIONS
// ========================================
function toggleMobileNav() {
  document.getElementById('navLinks').classList.toggle('open');
}

function showSection(section) {
  document.querySelectorAll('.topbar .nav-links a').forEach(a => a.classList.remove('active'));
  document.querySelector(`.topbar .nav-links a[onclick*="${section}"]`)?.classList.add('active');
  document.getElementById('navLinks').classList.remove('open');
  const el = document.getElementById(section + 'Section');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

function openModal(id) {
  document.getElementById(id).classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  document.getElementById(id).classList.remove('show');
  document.body.style.overflow = '';
}

// Close modals on outside click
document.querySelectorAll('.modal-overlay').forEach(el => {
  el.addEventListener('click', function(e) {
    if (e.target === this) {
      this.classList.remove('show');
      document.body.style.overflow = '';
    }
  });
});

// ========================================
// SEARCH PROPERTIES
// ========================================
function searchProperties() {
  const area = document.getElementById('searchArea').value;
  const budget = parseFloat(document.getElementById('searchBudget').value) || Infinity;
  
  const results = landlords.filter(l => {
    if (l.status !== 'online') return false;
    if (area && l.area !== area) return false;
    const rent = parseFloat(l.rent) || 0;
    if (budget && rent > budget) return false;
    return true;
  });
  
  renderProperties(results);
  if (results.length === 0) {
    document.getElementById('propertyGrid').innerHTML = `
      <div class="empty" style="grid-column:1/-1;">
        🔍 No properties found matching your criteria.
        <br><span style="font-size:13px;">Try adjusting your search or <a href="https://www.vusaniikhayaproperties.co.za" target="_blank" style="color:#b8860b;">view all rooms on VUSANI IKHAYA PROPERTIES</a></span>
      </div>
    `;
  }
}

// ========================================
// RENDER PROPERTIES
// ========================================
function renderProperties(list) {
  const grid = document.getElementById('propertyGrid');
  if (!list || list.length === 0) {
    grid.innerHTML = `
      <div class="empty" style="grid-column:1/-1;">
        🏠 No properties available right now.
        <br><span style="font-size:13px;">Check back soon or <a href="https://www.vusaniikhayaproperties.co.za" target="_blank" style="color:#b8860b;">view all rooms on VUSANI IKHAYA PROPERTIES</a></span>
      </div>
    `;
    return;
  }
  let html = '';
  list.forEach(l => {
    html += `
      <div class="property-card">
        <div class="image">🏠<span class="status-badge">🟢 Available</span></div>
        <div class="body">
          <div class="title">${l.property || l.name}</div>
          <div class="location">📍 ${l.area || 'Unknown'} | 👤 ${l.name}</div>
          <div class="price">R${l.rent || 0} <span>/ month</span></div>
          <div class="details">
            <span><i class="fas fa-bed"></i> ${l.roomType || 'Any'}</span>
            <span><i class="fas fa-car"></i> ${l.parking || 'No'}</span>
            <span><i class="fas fa-bath"></i> ${l.bathroom || 'Shared'}</span>
            <span><i class="fas fa-child"></i> ${l.childFriendly || 'No'}</span>
          </div>
          ${l.notes ? `<div style="font-size:13px;color:#637268;margin-bottom:12px;">📝 ${l.notes}</div>` : ''}
          <a href="https://wa.me/${(l.whatsapp || l.contact || '').replace(/[^0-9]/g, '')}?text=Hi%2C%20I'm%20interested%20in%20your%20room%20at%20${encodeURIComponent(l.area || '')}%20for%20R${l.rent}%20per%20month." target="_blank" class="btn-details">💬 Contact Landlord</a>
        </div>
      </div>
    `;
  });
  grid.innerHTML = html;
}

// ========================================
// UPDATE PUBLIC STATS
// ========================================
function updatePublicStats() {
  const online = landlords.filter(l => l.status === 'online').length;
  const totalRooms = landlords.filter(l => l.status === 'online').reduce((sum, l) => sum + (parseInt(l.rooms) || 0), 0);
  document.getElementById('statTotalRooms').textContent = totalRooms;
  document.getElementById('statTotalLandlords').textContent = online;
  document.getElementById('statTotalTenants').textContent = tenants.length;
  document.getElementById('statMatches').textContent = matches.length;
}

// ========================================
// FORM HANDLING
// ========================================
document.getElementById('tenantRegisterForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const data = {
    id: 'tn_' + Date.now(),
    name: document.getElementById('regTenantName').value,
    whatsapp: document.getElementById('regTenantWhatsApp').value,
    location: document.getElementById('regTenantLocation').value,
    budget: document.getElementById('regTenantBudget').value,
    minBudget: document.getElementById('regTenantMinBudget').value,
    roomType: document.getElementById('regTenantRoomType').value,
    moveIn: document.getElementById('regTenantMoveIn').value,
    parking: document.getElementById('regTenantParking').value,
    privateBathroom: document.getElementById('regTenantPrivateBathroom').value,
    childFriendly: document.getElementById('regTenantChildFriendly').value,
    notes: document.getElementById('regTenantNotes').value,
    createdAt: new Date().toISOString()
  };
  tenants.push(data);
  saveData();
  closeModal('tenantModal');
  this.reset();
  alert('✅ Registration successful! We\'ll match you with available properties.');
  updatePublicStats();
});

document.getElementById('landlordRegisterForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const data = {
    id: 'ld_' + Date.now(),
    name: document.getElementById('regLandlordName').value,
    whatsapp: document.getElementById('regLandlordWhatsApp').value,
    contact: document.getElementById('regLandlordContact').value,
    property: document.getElementById('regLandlordProperty').value,
    area: document.getElementById('regLandlordArea').value,
    roomType: document.getElementById('regLandlordRoomType').value,
    rent: document.getElementById('regLandlordRent').value,
    deposit: document.getElementById('regLandlordDeposit').value,
    available: document.getElementById('regLandlordAvailable').value,
    rooms: document.getElementById('regLandlordRooms').value,
    parking: document.getElementById('regLandlordParking').value,
    bathroom: document.getElementById('regLandlordBathroom').value,
    childFriendly: document.getElementById('regLandlordChildFriendly').value,
    notes: document.getElementById('regLandlordNotes').value,
    status: 'online',
    createdAt: new Date().toISOString()
  };
  landlords.push(data);
  saveData();
  closeModal('landlordModal');
  this.reset();
  alert('✅ Property listed successfully! Tenants will now see your listing.');
  updatePublicStats();
  renderProperties(landlords.filter(l => l.status === 'online'));
});

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', function() {
  loadData();
  updatePublicStats();
  renderProperties(landlords.filter(l => l.status === 'online'));
});
