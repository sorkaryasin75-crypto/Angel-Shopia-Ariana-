import { 
  auth, db, ref, get, set, update, push, onValue,
  signInWithEmailAndPassword, signOut, onAuthStateChanged 
} from '../../shared/firebase-config.js';

let currentAdminUser = null;
let adminPermissions = [];

// Audit logger helper
async function recordAuditLog(action, target, metadata = {}) {
  if (!currentAdminUser) return;
  const logRef = push(ref(db, 'auditLogs'));
  await set(logRef, {
    uid: currentAdminUser.uid,
    email: currentAdminUser.email,
    action,
    target,
    timestamp: Date.now(),
    metadata
  });
}

// UID Authorization Check
async function authorizeAdmin(uid) {
  const adminSnap = await get(ref(db, `admins/${uid}`));
  if (!adminSnap.exists()) return false;
  const data = adminSnap.val();
  if (data.enabled !== true) return false;
  
  adminPermissions = data.permissions || [];
  return true;
}

// View Router
function navigateToView(viewId) {
  document.querySelectorAll('.admin-view').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active', 'bg-twilight-800', 'text-twilight-accent'));

  const target = document.getElementById(`view-${viewId}`);
  if (target) {
    target.classList.remove('hidden');
  }

  const navLink = document.querySelector(`a[href="#${viewId}"]`);
  if (navLink) {
    navLink.classList.add('active', 'bg-twilight-800', 'text-twilight-accent');
  }
}

// Load Realtime Dashboard Analytics
function initAnalyticsDashboard() {
  onValue(ref(db, 'analytics/realtime'), (snapshot) => {
    if (!snapshot.exists()) {
      document.getElementById('metric-live').textContent = '0';
      return;
    }
    const sessions = snapshot.val();
    const now = Date.now();
    const active = Object.values(sessions).filter(s => (now - s.lastSeen) < 60000).length;
    document.getElementById('metric-live').textContent = active.toString();
  });

  const todayStr = new Date().toISOString().split('T')[0];
  onValue(ref(db, `analytics/events/${todayStr}`), (snapshot) => {
    if (!snapshot.exists()) return;
    const events = Object.values(snapshot.val());
    const views = events.filter(e => e.eventType === 'page_view').length;
    const clicks = events.filter(e => e.eventType === 'offer_click' || e.eventType === 'cta_click').length;
    
    document.getElementById('metric-views').textContent = views.toString();
    document.getElementById('metric-clicks').textContent = clicks.toString();
    const ctr = views > 0 ? ((clicks / views) * 100).toFixed(1) : '0';
    document.getElementById('metric-ctr').textContent = `${ctr}%`;
  });
}

// Manage Offers View
async function loadAdminOffers() {
  const tableBody = document.getElementById('offers-table-body');
  const snapshot = await get(ref(db, 'offers'));
  tableBody.innerHTML = '';

  if (!snapshot.exists()) {
    tableBody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-500">No offers found.</td></tr>`;
    return;
  }

  const offers = snapshot.val();
  Object.keys(offers).forEach(id => {
    const o = offers[id];
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="p-4 font-bold text-white">${o.title}</td>
      <td class="p-4"><span class="bg-slate-800 px-2 py-1 rounded">${o.targetCountry || 'GLOBAL'}</span></td>
      <td class="p-4">${o.badge || '-'}</td>
      <td class="p-4">${o.active ? '<span class="text-green-400">Active</span>' : '<span class="text-red-400">Inactive</span>'}</td>
      <td class="p-4 text-right">
        <button data-id="${id}" class="btn-toggle-offer text-twilight-accent hover:underline mr-2">Toggle</button>
      </td>
    `;
    tableBody.appendChild(row);
  });

  document.querySelectorAll('.btn-toggle-offer').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const offerId = e.target.getAttribute('data-id');
      const currentVal = offers[offerId].active;
      await update(ref(db, `offers/${offerId}`), { active: !currentVal });
      recordAuditLog('OFFER_TOGGLED', offerId, { newState: !currentVal });
      loadAdminOffers();
    });
  });
}

// AI Upgrade Capabilities
async function loadAICapabilities() {
  const container = document.getElementById('ai-capabilities-registry');
  const snapshot = await get(ref(db, 'system/capabilities'));
  container.innerHTML = '';

  const capabilities = snapshot.exists() ? snapshot.val() : {
    "landing.hero": { version: "1.0.0", status: "active", description: "Dynamic geo-tokenization hero module." },
    "offers.cpa": { version: "1.2.0", status: "active", description: "Country and language targeted CPA routing." },
    "analytics.aggregated": { version: "2.0.0", status: "active", description: "Realtime session pulse heartbeat." }
  };

  Object.keys(capabilities).forEach(key => {
    const cap = capabilities[key];
    const item = document.createElement('div');
    item.className = "p-4 bg-twilight-800 border border-twilight-700/60 rounded-xl flex items-center justify-between";
    item.innerHTML = `
      <div>
        <div class="font-bold text-sm">${key} <span class="text-xs font-mono text-twilight-accent">v${cap.version}</span></div>
        <div class="text-xs text-slate-400">${cap.description}</div>
      </div>
      <span class="text-xs bg-green-500/10 text-green-400 px-2.5 py-1 rounded-full font-semibold">Active</span>
    `;
    container.appendChild(item);
  });
}

// Load Audit Logs
async function loadAuditLogs() {
  const container = document.getElementById('audit-log-list');
  const snapshot = await get(ref(db, 'auditLogs'));
  container.innerHTML = '';

  if (!snapshot.exists()) {
    container.innerHTML = '<div>No audit logs recorded.</div>';
    return;
  }

  const logs = Object.values(snapshot.val()).reverse().slice(0, 30);
  logs.forEach(log => {
    const entry = document.createElement('div');
    entry.className = "border-b border-twilight-800 py-1.5 flex justify-between";
    entry.innerHTML = `
      <span>[${new Date(log.timestamp).toLocaleTimeString()}] <strong class="text-twilight-accent">${log.action}</strong> by ${log.email}</span>
      <span class="text-slate-500">${log.target}</span>
    `;
    container.appendChild(entry);
  });
}

// Main Admin Auth & Setup Listener
document.addEventListener('DOMContentLoaded', () => {
  const authOverlay = document.getElementById('admin-auth-overlay');
  const workspace = document.getElementById('admin-workspace');
  const loginForm = document.getElementById('admin-login-form');
  const loginError = document.getElementById('login-error');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.classList.add('hidden');
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      loginError.textContent = err.message;
      loginError.classList.remove('hidden');
    }
  });

  document.getElementById('btn-logout').addEventListener('click', () => {
    signOut(auth);
  });

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const isAuthorized = await authorizeAdmin(user.uid);
      if (isAuthorized) {
        currentAdminUser = user;
        authOverlay.classList.add('hidden');
        workspace.classList.remove('hidden');
        document.getElementById('admin-user-display').textContent = `Admin: ${user.email}`;

        initAnalyticsDashboard();
        loadAdminOffers();
        loadAICapabilities();
        loadAuditLogs();
      } else {
        await signOut(auth);
        loginError.textContent = "ACCESS DENIED: Your UID is not authorized as an active Administrator.";
        loginError.classList.remove('hidden');
        authOverlay.classList.remove('hidden');
        workspace.classList.add('hidden');
      }
    } else {
      currentAdminUser = null;
      authOverlay.classList.remove('hidden');
      workspace.classList.add('hidden');
    }
  });

  // Navigation Click Handler
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    navigateToView(hash);
  });

  // Settings Form Submit
  document.getElementById('form-landing-settings').addEventListener('submit', async (e) => {
    e.preventDefault();
    const brandName = document.getElementById('setting-brand-name').value;
    const heroCtaUrl = document.getElementById('setting-hero-url').value;

    await update(ref(db, 'app/settings'), {
      brandName,
      heroCtaUrl,
      updatedAt: Date.now()
    });

    recordAuditLog('SETTINGS_UPDATED', 'app/settings', { brandName, heroCtaUrl });
    alert('Landing Page configuration successfully published to Firebase.');
  });
});
