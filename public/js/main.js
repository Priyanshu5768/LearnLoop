const API_BASE = '/api';

async function api(method, endpoint, body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API_BASE + endpoint, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function el(sel) { return document.querySelector(sel); }
function els(sel) { return document.querySelectorAll(sel); }

function showAlert(msg, type = 'error') {
  const old = el('.alert-glass');
  if (old) old.remove();
  const div = document.createElement('div');
  div.className = `alert-glass ${type} mt-3`;
  div.textContent = msg;
  const form = el('form');
  if (form) form.before(div);
}

function getUser() {
  const data = sessionStorage.getItem('user');
  return data ? JSON.parse(data) : null;
}

function setUser(user) {
  if (user) sessionStorage.setItem('user', JSON.stringify(user));
  else sessionStorage.removeItem('user');
}

function isLoggedIn() {
  const user = getUser();
  if (!user) {
    if (!location.pathname.endsWith('login.html') && 
        !location.pathname.endsWith('register.html')) {
      location.href = 'login.html';
    }
    return false;
  }
  return true;
}

function initNav() {
  const user = getUser();
  const authLinks = el('.auth-links');
  const userLinks = el('.user-links');
  const userName = el('.user-name');
  if (!authLinks || !userLinks) return;
  
  if (user) {
    authLinks.classList.add('d-none');
    userLinks.classList.remove('d-none');
    if (userName) userName.textContent = user.name;
  } else {
    authLinks.classList.remove('d-none');
    userLinks.classList.add('d-none');
  }
}

async function logout() {
  try {
    await api('POST', '/auth/logout');
  } catch (e) {}
  setUser(null);
  location.href = 'login.html';
}

function avatarInitials(name, gender = 'other') {
  const colors = {
    male: 'linear-gradient(45deg, #4a90d9, #357abd)',
    female: 'linear-gradient(45deg, #e91e8c, #c2185b)',
    other: 'linear-gradient(45deg, #9c27b0, #7b1fa2)'
  };
  const icons = {
    male: '<i class="bi bi-gender-male"></i>',
    female: '<i class="bi bi-gender-female"></i>',
    other: '<i class="bi bi-person-fill"></i>'
  };
  return `<div class="profile-avatar-sm" style="background: ${colors[gender] || colors.other};">${icons[gender] || icons.other}</div>`;
}

function miniAvatar(name, gender = 'other') {
  const colors = {
    male: 'background: linear-gradient(45deg,#4a90d9,#357abd);',
    female: 'background: linear-gradient(45deg,#e91e8c,#c2185b);',
    other: 'background: linear-gradient(45deg,#9c27b0,#7b1fa2);'
  };
  const icons = {
    male: '👨',
    female: '👩',
    other: '👤'
  };
  return `<div class="mini-avatar" style="${colors[gender] || colors.other}">${icons[gender] || icons.other}</div>`;
}

function skillBadge(type) {
  const cls = type === 'teach' ? 'badge-teach' : 'badge-learn';
  const label = type === 'teach' ? 'Teach' : 'Learn';
  return `<span class="badge ${cls}">${label}</span>`;
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function renderSkillCard(skill) {
  return `
    <div class="col-md-6 col-lg-4">
      <div class="glass-card skill-card p-4 h-100">
        <div class="d-flex align-items-start gap-3 mb-3">
          ${avatarInitials(skill.user_name, skill.gender)}
          <div>
            <h5 class="mb-1 fw-bold">${skill.skill_name}</h5>
            <p class="mb-1 text-white-75 small">by ${skill.user_name}</p>
            ${skillBadge(skill.skill_type)}
          </div>
        </div>
        <p class="text-white-75 small mb-3">${skill.description || 'No description provided.'}</p>
        <div class="d-flex justify-content-between align-items-center">
          <span class="badge-section">${skill.category}</span>
          <button class="btn btn-sm btn-gradient request-btn" data-skill='${JSON.stringify(skill)}'>
            Request
          </button>
        </div>
      </div>
    </div>`;
}

function renderMySkillCard(skill) {
  return `
    <div class="col-md-6 col-lg-4">
      <div class="glass-card skill-card p-4 h-100">
        <div class="d-flex justify-content-between align-items-start mb-3">
          <div>
            <h5 class="mb-1 fw-bold">${skill.skill_name}</h5>
            ${skillBadge(skill.skill_type)}
          </div>
          <button class="btn btn-sm btn-glass delete-skill-btn" data-id="${skill.id}">
            <i class="bi bi-trash"></i>
          </button>
        </div>
        <p class="text-white-75 small">${skill.description || 'No description provided.'}</p>
        <span class="badge-section">${skill.category}</span>
      </div>
    </div>`;
}

async function loadSkills(filters = {}) {
  const container = el('#skills-grid');
  if (!container) return;
  
  container.innerHTML = '<div class="col-12 loading-spinner"><div class="spinner-border text-light"></div></div>';
  
  try {
    const params = new URLSearchParams(filters).toString();
    const data = await api('GET', '/skills' + (params ? '?' + params : ''));
    
    if (!data.skills || data.skills.length === 0) {
      container.innerHTML = `
        <div class="col-12 empty-state">
          <span class="empty-icon">🔍</span>
          <p>No skills found. Try adjusting your filters.</p>
        </div>`;
      return;
    }
    
    container.innerHTML = data.skills.map(renderSkillCard).join('');
    
    els('.request-btn').forEach(btn => {
      btn.addEventListener('click', () => openRequestModal(JSON.parse(btn.dataset.skill)));
    });
  } catch (err) {
    container.innerHTML = `<div class="col-12"><div class="alert-glass error">${err.message}</div></div>`;
  }
}

async function loadMySkills() {
  const container = el('#my-skills-grid');
  if (!container) return;
  
  container.innerHTML = '<div class="col-12 loading-spinner"><div class="spinner-border text-light"></div></div>';
  
  try {
    const data = await api('GET', '/skills/my');
    
    if (!data.skills || data.skills.length === 0) {
      container.innerHTML = `
        <div class="col-12 empty-state">
          <span class="empty-icon">📝</span>
          <p>You haven't added any skills yet. <a href="add-skill.html" class="text-white fw-bold">Add one now!</a></p>
        </div>`;
      return;
    }
    
    container.innerHTML = data.skills.map(renderMySkillCard).join('');
    
    els('.delete-skill-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this skill?')) return;
        try {
          await api('DELETE', `/skills/${btn.dataset.id}`);
          btn.closest('.col-md-6').remove();
        } catch (err) { showAlert(err.message); }
      });
    });
  } catch (err) {
    container.innerHTML = `<div class="col-12"><div class="alert-glass error">${err.message}</div></div>`;
  }
}

async function loadExchanges() {
  const sentContainer = el('#sent-requests');
  const receivedContainer = el('#received-requests');
  if (!sentContainer || !receivedContainer) return;
  
  const showLoading = () => {
    sentContainer.innerHTML = receivedContainer.innerHTML = '<div class="col-12 loading-spinner"><div class="spinner-border text-light"></div></div>';
  };
  showLoading();
  
  try {
    const data = await api('GET', '/exchange/my');
    
    const renderSent = (req) => {
      const myCompleted = req.completed_by_requester;
      const otherCompleted = req.completed_by_provider;
      const isFullyComplete = myCompleted && otherCompleted;
      const waitingText = myCompleted ? '<span class="text-warning small"><i class="bi bi-hourglass-split me-1"></i>Waiting for provider</span>' : '';
      return `
      <div class="glass-card request-card ${'request-' + req.status} p-3 mb-3">
        <div class="d-flex justify-content-between align-items-start">
          <div class="d-flex gap-2 align-items-start">
            ${avatarInitials(req.provider_name, req.provider_gender)}
            <div>
              <h6 class="fw-bold mb-1">${req.skill_name}</h6>
              <p class="text-white-75 small mb-1">To: ${req.provider_name}</p>
              <p class="text-white-50 small">${req.message || 'No message'}</p>
            </div>
          </div>
          <span class="status-badge-${req.status}">${req.status}</span>
        </div>
        ${waitingText}
        ${req.status === 'accepted' && !isFullyComplete ? `
          <div class="mt-2 d-flex gap-2">
            <a href="chat.html" class="btn btn-sm btn-glass"><i class="bi bi-chat-dots me-1"></i>Message</a>
            <button class="btn btn-sm btn-success complete-req-btn" data-id="${req.id}"><i class="bi bi-check-circle me-1"></i>${myCompleted ? 'Approved' : 'Complete'}</button>
            <button class="btn btn-sm btn-gradient review-btn" data-exchange="${req.id}" data-user="${req.provider_id}" data-name="${req.provider_name}"><i class="bi bi-star me-1"></i>Review</button>
          </div>` : ''}
        ${isFullyComplete ? `
          <div class="mt-2 d-flex gap-2">
            <span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>Completed</span>
            <button class="btn btn-sm btn-gradient review-btn" data-exchange="${req.id}" data-user="${req.provider_id}" data-name="${req.provider_name}"><i class="bi bi-star me-1"></i>Review</button>
          </div>` : ''}
        <small class="text-white-50 d-block mt-2">${timeAgo(req.created_at)}</small>
      </div>`;
    };
    
    const renderReceived = (req) => {
      const myCompleted = req.completed_by_provider;
      const otherCompleted = req.completed_by_requester;
      const isFullyComplete = myCompleted && otherCompleted;
      const waitingText = myCompleted ? '<span class="text-warning small"><i class="bi bi-hourglass-split me-1"></i>Waiting for requester</span>' : '';
      return `
      <div class="glass-card request-card ${'request-' + req.status} p-3 mb-3">
        <div class="d-flex justify-content-between align-items-start">
          <div class="d-flex gap-2 align-items-start">
            ${avatarInitials(req.requester_name, req.requester_gender)}
            <div>
              <h6 class="fw-bold mb-1">${req.skill_name}</h6>
              <p class="text-white-75 small mb-1">From: ${req.requester_name}</p>
              <p class="text-white-50 small">${req.message || 'No message'}</p>
            </div>
          </div>
          <span class="status-badge-${req.status}">${req.status}</span>
        </div>
        ${waitingText}
        ${req.status === 'pending' ? `
          <div class="mt-2 d-flex gap-2">
            <button class="btn btn-sm btn-glass accept-req-btn" data-id="${req.id}">Accept</button>
            <button class="btn btn-sm btn-glass reject-req-btn" data-id="${req.id}">Reject</button>
          </div>` : ''}
        ${req.status === 'accepted' && !isFullyComplete ? `
          <div class="mt-2 d-flex gap-2">
            <a href="chat.html" class="btn btn-sm btn-glass"><i class="bi bi-chat-dots me-1"></i>Message</a>
            <button class="btn btn-sm btn-success complete-req-btn" data-id="${req.id}"><i class="bi bi-check-circle me-1"></i>${myCompleted ? 'Approved' : 'Complete'}</button>
            <button class="btn btn-sm btn-gradient review-btn" data-exchange="${req.id}" data-user="${req.requester_id}" data-name="${req.requester_name}"><i class="bi bi-star me-1"></i>Review</button>
          </div>` : ''}
        ${isFullyComplete ? `
          <div class="mt-2 d-flex gap-2">
            <span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>Completed</span>
            <button class="btn btn-sm btn-gradient review-btn" data-exchange="${req.id}" data-user="${req.requester_id}" data-name="${req.requester_name}"><i class="bi bi-star me-1"></i>Review</button>
          </div>` : ''}
        <small class="text-white-50 d-block mt-2">${timeAgo(req.created_at)}</small>
      </div>`;
    };
    
    sentContainer.innerHTML = data.sent && data.sent.length
      ? data.sent.map(renderSent).join('')
      : '<div class="empty-state"><span class="empty-icon">📤</span><p>No sent requests yet.</p></div>';
    
    receivedContainer.innerHTML = data.received && data.received.length
      ? data.received.map(renderReceived).join('')
      : '<div class="empty-state"><span class="empty-icon">📥</span><p>No received requests yet.</p></div>';
    
    els('.accept-req-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          await api('PUT', `/exchange/${btn.dataset.id}/accept`);
          loadExchanges();
        } catch (err) { showAlert(err.message); }
      });
    });
    
    els('.reject-req-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          await api('PUT', `/exchange/${btn.dataset.id}/reject`);
          loadExchanges();
        } catch (err) { showAlert(err.message); }
      });
    });
    
    els('.complete-req-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Approve this exchange as complete? Both users must approve.')) return;
        try {
          const data = await api('PUT', `/exchange/${btn.dataset.id}/complete`);
          if (data.bothCompleted) {
            showAlert('Exchange fully completed! Both users approved.', 'success');
          } else if (data.completed) {
            showAlert('You have approved! Waiting for the other user.', 'success');
          }
          loadExchanges();
        } catch (err) { showAlert(err.message); }
      });
    });
    
    els('.review-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        document.getElementById('review-exchange-id').value = this.dataset.exchange;
        document.getElementById('review-reviewee-id').value = this.dataset.user;
        document.getElementById('review-user-name').textContent = this.dataset.name;
        document.getElementById('review-rating-value').value = '';
        document.getElementById('review-comment').value = '';
        selectedRating = 0;
        document.querySelectorAll('#star-rating i').forEach(s => s.style.color = '#555');
        document.getElementById('rating-text').textContent = 'Click to rate';
        new bootstrap.Modal(document.getElementById('reviewModal')).show();
      });
    });
  } catch (err) {
    sentContainer.innerHTML = receivedContainer.innerHTML = `<div class="col-12"><div class="alert-glass error">${err.message}</div></div>`;
  }
}

function openRequestModal(skill) {
  if (!isLoggedIn()) { location.href = 'login.html'; return; }
  
  const modal = new bootstrap.Modal(el('#requestModal'));
  el('#req-skill-name').textContent = skill.skill_name;
  el('#req-provider').textContent = skill.user_name;
  el('#request-skill-id').value = skill.id;
  el('#request-provider-id').value = skill.user_id;
  el('#request-message').value = '';
  modal.show();
}

async function submitRequest(e) {
  e.preventDefault();
  const skill_id = el('#request-skill-id').value;
  const provider_id = el('#request-provider-id').value;
  const message = el('#request-message').value;
  
  try {
    await api('POST', '/exchange/request', { provider_id, skill_id, message });
    bootstrap.Modal.getInstance(el('#requestModal')).hide();
    showAlert('Exchange request sent!', 'success');
  } catch (err) { showAlert(err.message); }
}

function initDashboard() {
  loadMySkills();
  loadExchanges();
  
  el('#logout-btn')?.addEventListener('click', logout);
}

function initBrowse() {
  loadSkills();
  
  el('#search-input')?.addEventListener('input', debounce(() => {
    loadSkills({ q: el('#search-input').value, category: el('#category-filter')?.value, type: el('#type-filter')?.value });
  }, 400));
  
  el('#category-filter')?.addEventListener('change', () => {
    loadSkills({ q: el('#search-input')?.value, category: el('#category-filter').value, type: el('#type-filter')?.value });
  });
  
  el('#type-filter')?.addEventListener('change', () => {
    loadSkills({ q: el('#search-input')?.value, category: el('#category-filter')?.value, type: el('#type-filter').value });
  });
  
  el('#request-form')?.addEventListener('submit', submitRequest);
}

function initProfile() {
  loadMyProfile();
  loadMySkills();
  
  el('#logout-btn')?.addEventListener('click', logout);
  
  el('#profile-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = el('#profile-name').value;
    const bio = el('#profile-bio').value;
    const gender = document.querySelector('input[name="gender"]:checked')?.value || 'other';
    
    try {
      await api('PUT', '/auth/profile', { name, bio, gender });
      setUser({ ...getUser(), name, gender });
      initNav();
      showAlert('Profile updated!', 'success');
    } catch (err) { showAlert(err.message); }
  });
}

async function loadMyProfile() {
  try {
    const data = await api('GET', '/auth/me');
    const user = data.user;
    
    if (el('#profile-avatar-display')) {
      el('#profile-avatar-display').innerHTML = `<div class="profile-avatar mx-auto" style="background: ${user.gender === 'male' ? 'linear-gradient(45deg, #4a90d9, #357abd)' : user.gender === 'female' ? 'linear-gradient(45deg, #e91e8c, #c2185b)' : 'linear-gradient(45deg, #9c27b0, #7b1fa2)'};"><i class="bi bi-${user.gender === 'male' ? 'gender-male' : user.gender === 'female' ? 'gender-female' : 'person-fill'}"></i></div>`;
    }
    if (el('#profile-name-display')) el('#profile-name-display').textContent = user.name;
    if (el('#profile-email-display')) el('#profile-email-display').textContent = user.email;
    if (el('#profile-name')) el('#profile-name').value = user.name;
    if (el('#profile-email')) el('#profile-email').value = user.email;
    if (el('#profile-bio')) el('#profile-bio').value = user.bio || '';
    if (el('#profile-joined')) el('#profile-joined').textContent = new Date(user.created_at).toLocaleDateString();
    if (user.gender) {
      const genderRadio = el(`#gender-${user.gender}`);
      if (genderRadio) genderRadio.checked = true;
    }
    
    loadGamificationStats();
  } catch (err) {
    console.error('Profile load error:', err);
    if (!location.pathname.endsWith('login.html') && !location.pathname.endsWith('register.html')) {
      location.href = 'login.html';
    }
  }
}

async function loadGamificationStats() {
  try {
    const data = await api('GET', '/gamify/stats');
    
    if (el('#profile-points')) el('#profile-points').textContent = data.points || 0;
    if (el('#profile-checkins')) el('#profile-checkins').textContent = data.totalCheckins || 0;
    
    const badges = data.badges || [];
    const badgeIcons = {
      'First Steps': '🌱',
      'Active Learner': '📚',
      'Knowledge Seeker': '🔍',
      'Skill Master': '🏆'
    };
    
    if (el('#badges-display')) {
      if (badges.length === 0) {
        el('#badges-display').innerHTML = '<span class="text-white-50 small">No badges yet</span>';
      } else {
        el('#badges-display').innerHTML = badges.map(b => 
          `<span class="badge me-1 mb-1" style="background: rgba(255,255,255,0.2);">${badgeIcons[b] || '🏅'} ${b}</span>`
        ).join('');
      }
    }
  } catch (err) {
    console.error(err);
  }
}

function initAddSkill() {
  el('#add-skill-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const skill_name = el('#skill-name').value;
    const category = el('#skill-category').value;
    const skill_type = el('#skill-type').value;
    const description = el('#skill-description').value;
    
    try {
      await api('POST', '/skills', { skill_name, category, skill_type, description });
      showAlert('Skill added successfully!', 'success');
      setTimeout(() => location.href = 'dashboard.html', 1200);
    } catch (err) { showAlert(err.message); }
  });
}

function initExchange() {
  loadExchanges();
  el('#logout-btn')?.addEventListener('click', logout);
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  
  const path = location.pathname;
  if (path.includes('dashboard.html')) initDashboard();
  else if (path.includes('browse.html')) initBrowse();
  else if (path.includes('profile.html')) initProfile();
  else if (path.includes('add-skill.html')) initAddSkill();
  else if (path.includes('exchange.html')) initExchange();
  
  els('.fade-in').forEach(el => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    obs.observe(el);
  });
});
