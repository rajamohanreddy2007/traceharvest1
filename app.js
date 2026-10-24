// TraceHarvest AI — Frontend Master Controller (app.js)

(function () {
  'use strict';

  const state = {
    data: null,
    currentUser: null,
    currentBatchId: 'TH-GVA-2026-095', // default focused batch for Bull's-Eye
    bullseyeData: null,
    trendsData: null,
    activeChart: null,
    canvasAnimationId: null,
    bullseyeNodes: [],
    selectedBullseyeNode: null,
    hoveredBullseyeNode: null,
    demoStep: 0,
    journeyTimer: null,
    journeyCurrentIndex: 0
  };

  // Initialize Application
  async function init() {
    loadSavedUser();
    await fetchData();
    setupRouter();
    setupEvents();
    renderUserNav();
    updateRecallsBadge();
  }

  function loadSavedUser() {
    const saved = localStorage.getItem('traceharvest_user');
    if (saved) {
      try {
        state.currentUser = JSON.parse(saved);
      } catch (e) {
        state.currentUser = null;
      }
    }
    if (!state.currentUser) {
      // Default to Food Safety Admin for full demo capabilities
      state.currentUser = {
        id: "u-admin-01",
        email: "admin@traceharvest.ai",
        name: "Dr. Aruna Reddy",
        role: "Food Safety Admin",
        organization: "Andhra Food Safety Authority (FSSAI Cell)",
        location: "Mangalagiri HQ, Guntur District, AP",
        avatar: "🛡️",
        phone: "+91 86452 33445",
        credibilityScore: 100
      };
    }
  }

  function saveUser(user) {
    state.currentUser = user;
    localStorage.setItem('traceharvest_user', JSON.stringify(user));
    renderUserNav();
    showToast(`Logged in as ${user.name} (${user.role})`, 'success');
  }

  async function fetchData() {
    try {
      const res = await fetch('/api/data');
      if (!res.ok) throw new Error('Failed to fetch data');
      state.data = await res.json();
      return state.data;
    } catch (err) {
      console.error(err);
      showToast('Error connecting to backend database', 'error');
    }
  }

  function updateRecallsBadge() {
    if (!state.data) return;
    const badge = document.getElementById('active-recalls-badge');
    const recalls = state.data.recalls || [];
    const active = recalls.filter(r => r.status.includes('Active') || r.status.includes('Quarantine'));
    if (badge) {
      badge.textContent = active.length;
      badge.className = active.length > 0 ? "px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-bold animate-pulse" : "px-1.5 py-0.2 rounded-full text-[10px] bg-slate-600 text-slate-200";
    }
  }

  function renderUserNav() {
    const u = state.currentUser;
    if (!u) return;
    const avatar = document.getElementById('current-user-avatar');
    const name = document.getElementById('current-user-name');
    const role = document.getElementById('current-user-role');
    const select = document.getElementById('quick-role-select');

    if (avatar) avatar.textContent = u.avatar || '👤';
    if (name) name.textContent = u.name;
    if (role) role.textContent = `${u.role} (${u.organization.split(' ')[0]})`;
    if (select) select.value = u.role;
  }

  function switchUserRole(roleName) {
    if (!state.data || !state.data.users) return;
    const user = state.data.users.find(u => u.role.toLowerCase() === roleName.toLowerCase());
    if (user) {
      saveUser(user);
      renderPage();
    }
  }

  function setupEvents() {
    window.addEventListener('hashchange', renderPage);
    const toggle = document.getElementById('sidebar-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        const sidebar = document.getElementById('main-sidebar');
        sidebar.classList.toggle('-translate-x-full');
      });
    }
  }

  function setupRouter() {
    if (!window.location.hash) {
      window.location.hash = '#dashboard';
    } else {
      renderPage();
    }
  }

  // Toast notifications
  function showToast(message, type = 'info') {
    const container = document.getElementById('alert-banner-container');
    if (!container) return;
    
    let bg = 'bg-slate-800 text-white border-slate-700';
    let icon = 'info';
    if (type === 'success') {
      bg = 'bg-emerald-900/90 text-emerald-100 border-emerald-500';
      icon = 'check-circle';
    } else if (type === 'error') {
      bg = 'bg-rose-900/90 text-rose-100 border-rose-500';
      icon = 'alert-triangle';
    } else if (type === 'warning') {
      bg = 'bg-amber-900/90 text-amber-100 border-amber-500';
      icon = 'alert-circle';
    }

    container.innerHTML = `
      <div class="flex items-center justify-between p-3 rounded-xl border ${bg} shadow-lg transition-all transform duration-300">
        <div class="flex items-center space-x-2 text-xs font-medium">
          <i data-lucide="${icon}" class="w-4 h-4 flex-shrink-0"></i>
          <span>${message}</span>
        </div>
        <button onclick="document.getElementById('alert-banner-container').classList.add('hidden')" class="text-xs opacity-75 hover:opacity-100">✕</button>
      </div>
    `;
    container.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      container.classList.add('hidden');
    }, 6000);
  }

  // Global Page Router
  async function renderPage() {
    if (!state.data) await fetchData();

    const hash = window.location.hash.slice(1) || 'dashboard';
    const mainArea = document.getElementById('content-area');
    const title = document.getElementById('page-title');
    const subtitle = document.getElementById('page-subtitle');

    // Update active nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.getAttribute('data-page') === hash) {
        link.classList.add('bg-slate-800', 'text-white', 'font-semibold');
      } else {
        link.classList.remove('bg-slate-800', 'text-white', 'font-semibold');
      }
    });

    // Cleanup previous chart and animations
    if (state.activeChart) {
      state.activeChart.destroy();
      state.activeChart = null;
    }
    if (state.canvasAnimationId) {
      cancelAnimationFrame(state.canvasAnimationId);
      state.canvasAnimationId = null;
    }
    if (state.journeyTimer) {
      clearInterval(state.journeyTimer);
      state.journeyTimer = null;
    }

    window.scrollTo(0, 0);

    switch (hash) {
      case 'landing':
        title.textContent = 'TraceHarvest AI Platform';
        subtitle.textContent = 'The Intelligent Trust Network for Food — Vision, Mission & Architecture';
        renderLanding(mainArea);
        break;
      case 'dashboard':
        title.textContent = 'Main Executive Dashboard';
        subtitle.textContent = 'Live metrics, alerts, and digital chain of custody across Andhra Pradesh';
        renderDashboard(mainArea);
        break;
      case 'trends':
        title.textContent = 'Trend Intelligence Engine';
        subtitle.textContent = 'Pattern detection, transport exception analytics, and emerging recurring risks';
        await renderTrends(mainArea);
        break;
      case 'bullseye':
        title.textContent = "Bull's-Eye Precision Investigation";
        subtitle.textContent = 'Cinematic radial multi-ring intelligence, evidence correlation, and impact isolation';
        await renderBullseye(mainArea);
        break;
      case 'detective':
        title.textContent = 'AI Supply-Chain Detective';
        subtitle.textContent = 'Rule-based anomaly detection, temporal paradoxes, and audit explanations';
        renderDetective(mainArea);
        break;
      case 'coldchain':
        title.textContent = 'Smart Cold-Chain Monitor';
        subtitle.textContent = 'IoT sensor telemetry, perishable thermal curves, and simulated excursion testing';
        renderColdChain(mainArea);
        break;
      case 'recall':
        title.textContent = 'Live Food Recall Command Centre';
        subtitle.textContent = 'Incident isolation, downstream transfer quarantine, and notification tracking';
        renderRecall(mainArea);
        break;
      case 'batches':
        title.textContent = 'Produce Batch Management';
        subtitle.textContent = 'Digital passport creation, QR assignment, and harvest registry';
        renderBatches(mainArea);
        break;
      case 'transfers':
        title.textContent = 'Transfer & Logistics Tracking';
        subtitle.textContent = 'Chain of custody handoffs, transit conditions, and quarantine enforcement';
        renderTransfers(mainArea);
        break;
      case 'inspections':
        title.textContent = 'Quality Inspections & Lab Reports';
        subtitle.textContent = 'MRL chemical testing, microbial assays, and certification verification';
        renderInspections(mainArea);
        break;
      case 'passport':
        title.textContent = 'Digital Product Passport';
        subtitle.textContent = 'Batch verification, trust evidence breakdown, and animated Journey Replay';
        renderPassport(mainArea);
        break;
      case 'consumer':
        title.textContent = 'Public Consumer Scan Portal';
        subtitle.textContent = 'Mobile-friendly produce provenance verification for citizen buyers';
        renderConsumer(mainArea);
        break;
      case 'farmer':
        title.textContent = 'Farmer Digital Credibility';
        subtitle.textContent = 'Transparent Record Reliability Indicator and digital farm profile';
        renderFarmer(mainArea);
        break;
      case 'reports':
        title.textContent = 'Analytics & Exportable Reports';
        subtitle.textContent = 'Comprehensive CSV exports, incident dossiers, and supply chain telemetry';
        renderReports(mainArea);
        break;
      case 'settings':
        title.textContent = 'System Settings & Audit Log';
        subtitle.textContent = 'Immutable chain of custody audit events and prototype configuration';
        renderSettings(mainArea);
        break;
      case 'login':
        title.textContent = 'Role-Based Authentication Portal';
        subtitle.textContent = 'Sign in or fast-switch between Farmer, Transporter, Warehouse, Retailer, and Admin';
        renderLogin(mainArea);
        break;
      default:
        renderDashboard(mainArea);
    }

    if (window.lucide) window.lucide.createIcons();
  }

  // --- 1. LANDING PAGE ---
  function renderLanding(container) {
    container.innerHTML = `
      <div class="max-w-6xl mx-auto space-y-8 pb-12">
        <!-- Hero Section -->
        <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-forest-800 to-slate-900 text-white p-8 md:p-12 shadow-2xl border border-emerald-500/30">
          <div class="absolute -right-12 -bottom-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div class="relative z-10 max-w-3xl space-y-5">
            <div class="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-400/10 text-emerald-300 border border-emerald-400/30 text-xs font-semibold uppercase tracking-wider">
              <span>Next-Gen Agricultural Intelligence</span>
            </div>
            <h1 class="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
              TraceHarvest AI <br>
              <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-300">The Intelligent Trust Network for Food</span>
            </h1>
            <p class="text-base md:text-lg text-emerald-100/90 leading-relaxed font-light italic">
              "Every Batch Has a Story. Every Journey Builds Trust."
            </p>
            <p class="text-sm text-slate-300 leading-relaxed">
              TraceHarvest AI transforms fragmented agricultural supply chains into verifiable, tamper-evident digital journeys. From smallholder farms in Tenali and Kurnool to hypermarkets in Vijayawada and Visakhapatnam, our platform safeguards consumers, empowers farmers, and isolates food-safety hazards in seconds.
            </p>
            <div class="pt-4 flex flex-wrap gap-3">
              <button onclick="window.traceHarvest.startIntelligenceDemoFlow()" class="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/50 flex items-center space-x-2 transition">
                <i data-lucide="play" class="w-4 h-4"></i>
                <span>Launch Intelligence Tour</span>
              </button>
              <a href="#trends" class="px-5 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-emerald-500/40 text-emerald-300 font-semibold text-sm flex items-center space-x-2 transition">
                <i data-lucide="trending-up" class="w-4 h-4"></i>
                <span>Explore Trend Intelligence</span>
              </a>
              <a href="#bullseye" class="px-5 py-3 rounded-xl bg-midnight-900 hover:bg-midnight-800 border border-cyan-500/40 text-cyan-300 font-semibold text-sm flex items-center space-x-2 transition">
                <i data-lucide="crosshair" class="w-4 h-4 text-neon-green"></i>
                <span>Bull's-Eye Precision</span>
              </a>
            </div>
          </div>
        </div>

        <!-- Vision and Core Problems Solved Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
              <i data-lucide="shield-check" class="w-5 h-5"></i>
            </div>
            <h3 class="font-bold text-slate-900 text-base mb-2">Targeted Precision Recalls</h3>
            <p class="text-xs text-slate-600 leading-relaxed">
              Eliminate catastrophic blanket recalls. When a contamination incident is flagged, trace downstream deliveries precisely and isolate affected retail batches without harming innocent harvests.
            </p>
          </div>

          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div class="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center mb-4">
              <i data-lucide="cpu" class="w-5 h-5"></i>
            </div>
            <h3 class="font-bold text-slate-900 text-base mb-2">AI Supply-Chain Detective</h3>
            <p class="text-xs text-slate-600 leading-relaxed">
              Algorithmic pattern recognition checks every transfer against temporal logic, weighbridge mass balances, lab MRL certificates, and reefer thermal continuity in real time.
            </p>
          </div>

          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div class="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4">
              <i data-lucide="award" class="w-5 h-5"></i>
            </div>
            <h3 class="font-bold text-slate-900 text-base mb-2">Farmer Digital Credibility</h3>
            <p class="text-xs text-slate-600 leading-relaxed">
              Rewarding diligent farmers. Transparent Record Reliability Indicators build verifiable provenance, unlocking premium buyer markets and formal agricultural credit.
            </p>
          </div>
        </div>

        <!-- 6 Dedicated Stakeholder Workspaces -->
        <div class="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <h2 class="text-xl font-bold text-slate-900 mb-2">Six Role-Aware Stakeholder Workspaces</h2>
          <p class="text-xs text-slate-500 mb-6">Designed specifically for the distinct operational realities of the farm-to-table ecosystem:</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div class="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-emerald-50/50 transition flex items-start space-x-3">
              <span class="text-2xl p-2 bg-white rounded-lg shadow-xs">👨‍🌾</span>
              <div>
                <h4 class="font-bold text-xs text-slate-900">1. Farmers</h4>
                <p class="text-[11px] text-slate-600 mt-0.5">Register farm plots, record morning harvests, generate QR passports, and view credibility rating.</p>
              </div>
            </div>
            <div class="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-emerald-50/50 transition flex items-start space-x-3">
              <span class="text-2xl p-2 bg-white rounded-lg shadow-xs">🚚</span>
              <div>
                <h4 class="font-bold text-xs text-slate-900">2. Transporters</h4>
                <p class="text-[11px] text-slate-600 mt-0.5">Accept custody handoffs, log vehicle reefer numbers, verify weight, and transmit GPS/cold-chain data.</p>
              </div>
            </div>
            <div class="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-emerald-50/50 transition flex items-start space-x-3">
              <span class="text-2xl p-2 bg-white rounded-lg shadow-xs">🏬</span>
              <div>
                <h4 class="font-bold text-xs text-slate-900">3. Warehouses & Hubs</h4>
                <p class="text-[11px] text-slate-600 mt-0.5">Record cold-room intake temperatures, run sorting line allocations, and log onward distributions.</p>
              </div>
            </div>
            <div class="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-emerald-50/50 transition flex items-start space-x-3">
              <span class="text-2xl p-2 bg-white rounded-lg shadow-xs">🛒</span>
              <div>
                <h4 class="font-bold text-xs text-slate-900">4. Retailers & Markets</h4>
                <p class="text-[11px] text-slate-600 mt-0.5">Verify origin badges, inspect lab MRL passes, receive stock, and display scannable shelf QR codes.</p>
              </div>
            </div>
            <div class="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-emerald-50/50 transition flex items-start space-x-3">
              <span class="text-2xl p-2 bg-white rounded-lg shadow-xs">🛡️</span>
              <div>
                <h4 class="font-bold text-xs text-slate-900">5. Food Safety Administrators</h4>
                <p class="text-[11px] text-slate-600 mt-0.5">Enact precision recalls, audit suspicious discrepancies in Bull's-Eye, and download forensic dossiers.</p>
              </div>
            </div>
            <div class="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-emerald-50/50 transition flex items-start space-x-3">
              <span class="text-2xl p-2 bg-white rounded-lg shadow-xs">👩‍💼</span>
              <div>
                <h4 class="font-bold text-xs text-slate-900">6. Consumers & Buyers</h4>
                <p class="text-[11px] text-slate-600 mt-0.5">Scan product QR with phone camera, replay farm journey animation, and inspect verified lab tests.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // --- 2. MAIN DASHBOARD ---
  function renderDashboard(container) {
    const batches = state.data.batches || [];
    const transfers = state.data.transfers || [];
    const recalls = state.data.recalls || [];
    const anomalies = state.data.anomalies || [];

    const totalBatches = batches.length;
    const reviewNeeded = batches.filter(b => b.riskLevel === 'High' || b.riskLevel === 'Critical').length;
    const recalledBatches = batches.filter(b => b.recallStatus === 'RECALLED').length;
    const avgCompleteness = Math.round(batches.reduce((acc, b) => acc + (b.dataCompleteness || 100), 0) / (totalBatches || 1));

    // Pending acknowledgements in recalls
    let pendingAcks = 0;
    recalls.forEach(r => {
      (r.affectedDestinations || []).forEach(d => {
        if (!d.acknowledgedAt) pendingAcks++;
      });
    });

    container.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-6">
        <!-- Live Critical Incident Banner if recalled batches exist -->
        ${recalledBatches > 0 ? `
          <div class="p-4 rounded-2xl bg-gradient-to-r from-rose-900/90 via-red-800 to-rose-950 text-white border border-rose-500/50 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div class="flex items-center space-x-3">
              <div class="p-2.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-400/30 blink-urgent">
                <i data-lucide="alert-triangle" class="w-6 h-6 text-rose-300"></i>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-bold text-sm tracking-wide uppercase text-rose-200">Active Food Safety Recall Enacted</span>
                  <span class="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-bold">CRITICAL</span>
                </div>
                <p class="text-xs text-rose-100/90 mt-0.5">
                  Batch <strong>TH-PLK-2026-019 (Organic Palak)</strong> is under mandatory FSSAI quarantine due to chemical MRL contamination. All downstream transfers locked.
                </p>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <a href="#recall" class="px-4 py-2 rounded-xl bg-white text-rose-900 font-bold text-xs hover:bg-rose-50 shadow transition flex items-center gap-1.5">
                <i data-lucide="alert-octagon" class="w-4 h-4"></i>
                <span>Open Recall Centre</span>
              </a>
              <button onclick="window.traceHarvest.openBullseyeForBatch('TH-PLK-2026-019')" class="px-3.5 py-2 rounded-xl bg-rose-950/60 text-rose-200 border border-rose-400/40 text-xs font-semibold hover:bg-rose-900 transition flex items-center gap-1">
                <i data-lucide="crosshair" class="w-3.5 h-3.5 text-neon-green"></i>
                <span>Bull's-Eye</span>
              </button>
            </div>
          </div>
        ` : ''}

        <!-- Top Metrics Grid -->
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Batches</div>
            <div class="text-2xl font-extrabold text-slate-900 mt-1">${totalBatches}</div>
            <div class="text-[10px] text-emerald-600 mt-1 flex items-center gap-1">
              <i data-lucide="shield-check" class="w-3 h-3"></i>
              <span>Active on AP Grid</span>
            </div>
          </div>

          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Requires Review</div>
            <div class="text-2xl font-extrabold text-amber-600 mt-1">${reviewNeeded}</div>
            <div class="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
              <i data-lucide="alert-circle" class="w-3 h-3"></i>
              <span>Flagged by AI rules</span>
            </div>
          </div>

          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Transfers Logged</div>
            <div class="text-2xl font-extrabold text-slate-900 mt-1">${transfers.length}</div>
            <div class="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
              <i data-lucide="truck" class="w-3 h-3"></i>
              <span>Verified handoffs</span>
            </div>
          </div>

          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Recalled Batches</div>
            <div class="text-2xl font-extrabold text-rose-600 mt-1">${recalledBatches}</div>
            <div class="text-[10px] text-rose-600 mt-1 flex items-center gap-1">
              <i data-lucide="lock" class="w-3 h-3"></i>
              <span>Transfer lock active</span>
            </div>
          </div>

          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Pending Acks</div>
            <div class="text-2xl font-extrabold text-orange-600 mt-1">${pendingAcks}</div>
            <div class="text-[10px] text-orange-600 mt-1 flex items-center gap-1">
              <i data-lucide="clock" class="w-3 h-3"></i>
              <span>Downstream notice</span>
            </div>
          </div>

          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Avg Completeness</div>
            <div class="text-2xl font-extrabold text-emerald-600 mt-1">${avgCompleteness}%</div>
            <div class="text-[10px] text-emerald-600 mt-1 flex items-center gap-1">
              <i data-lucide="check" class="w-3 h-3"></i>
              <span>Data integrity score</span>
            </div>
          </div>
        </div>

        <!-- Signature Modules Shortcut Banner -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="rounded-2xl p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white border border-cyan-500/30 flex items-center justify-between shadow-lg">
            <div class="space-y-1">
              <div class="inline-flex items-center gap-1.5 text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                <i data-lucide="trending-up" class="w-3.5 h-3.5"></i>
                <span>Feature 1: Trend Intelligence Engine</span>
              </div>
              <h3 class="text-base font-bold text-white">Emerging Pattern & Fleet Risk Analytics</h3>
              <p class="text-xs text-slate-300">Detect recurring route temperature breaches and regional contamination trends before outbreaks occur.</p>
            </div>
            <a href="#trends" class="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition shadow flex items-center gap-1">
              <span>View Trends</span>
              <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
            </a>
          </div>

          <div class="rounded-2xl p-5 bg-gradient-to-br from-midnight-950 to-midnight-850 text-white border border-emerald-500/40 flex items-center justify-between shadow-lg">
            <div class="space-y-1">
              <div class="inline-flex items-center gap-1.5 text-[10px] font-bold text-neon-green uppercase tracking-wider">
                <i data-lucide="crosshair" class="w-3.5 h-3.5"></i>
                <span>Feature 2: Bull's-Eye Precision Engine</span>
              </div>
              <h3 class="text-base font-bold text-white">Cinematic Radial Forensic Workspace</h3>
              <p class="text-xs text-slate-300">Concentric target visualization linking direct evidence, transit hops, and downstream exposed stock.</p>
            </div>
            <button onclick="window.traceHarvest.openBullseyeForBatch('TH-GVA-2026-095')" class="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow flex items-center gap-1">
              <span>Launch Target</span>
              <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>

        <!-- Recent Batches Table -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 class="font-bold text-slate-900 text-sm">Andhra Pradesh Produce Batches</h2>
              <p class="text-xs text-slate-500">Live digital passport registry across Guntur, Krishna, Kurnool, and Chittoor districts</p>
            </div>
            <div class="flex items-center space-x-2">
              <div class="relative">
                <i data-lucide="search" class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5"></i>
                <input type="text" id="batch-search-input" oninput="window.traceHarvest.filterDashboardBatches(this.value)" placeholder="Search batch ID, crop, or farm..." class="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-48 sm:w-64">
              </div>
              <a href="#batches" class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1 transition">
                <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                <span>New Batch</span>
              </a>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th class="py-3 px-4">Batch ID & Crop</th>
                  <th class="py-3 px-4">Origin Farm</th>
                  <th class="py-3 px-4">Harvest Date</th>
                  <th class="py-3 px-4">Quantity</th>
                  <th class="py-3 px-4">Risk Level</th>
                  <th class="py-3 px-4">Recall Status</th>
                  <th class="py-3 px-4">Completeness</th>
                  <th class="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody id="dashboard-batches-tbody" class="divide-y divide-slate-100">
                ${renderBatchRows(batches)}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Charts Row: Regional Incident Map and Crop Risk Distribution -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="font-bold text-slate-900 text-xs">Regional Risk Distribution (Andhra Pradesh)</h3>
                <p class="text-[11px] text-slate-500">Incident density across agro-climatic zones</p>
              </div>
              <span class="text-[10px] bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded">Real-time DB</span>
            </div>
            <div class="h-60 relative">
              <canvas id="regional-chart"></canvas>
            </div>
          </div>

          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="font-bold text-slate-900 text-xs">Crop Risk Classification Breakdown</h3>
                <p class="text-[11px] text-slate-500">Normal vs Flagged vs Recalled Volumes</p>
              </div>
              <span class="text-[10px] bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded">Volume (kg)</span>
            </div>
            <div class="h-60 relative">
              <canvas id="crop-chart"></canvas>
            </div>
          </div>
        </div>
      </div>
    `;

    initDashboardCharts();
  }

  function renderBatchRows(batches) {
    if (!batches.length) {
      return `<tr><td colspan="8" class="text-center py-8 text-slate-400">No matching produce batches found in database.</td></tr>`;
    }
    return batches.map(b => {
      let riskBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Low</span>`;
      if (b.riskLevel === 'Medium') riskBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Medium</span>`;
      if (b.riskLevel === 'High') riskBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800">High</span>`;
      if (b.riskLevel === 'Critical') riskBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 blink-urgent">Critical</span>`;

      let recallBadge = `<span class="text-[10px] font-semibold text-emerald-600 flex items-center gap-1"><i data-lucide="check-circle" class="w-3 h-3"></i> Clear</span>`;
      if (b.recallStatus === 'RECALLED') {
        recallBadge = `<span class="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1"><i data-lucide="lock" class="w-3 h-3"></i> RECALLED</span>`;
      }

      return `
        <tr class="hover:bg-slate-50/80 transition">
          <td class="py-3 px-4">
            <div class="font-bold text-slate-900 font-mono text-xs">${b.id}</div>
            <div class="text-[11px] text-slate-500">${b.crop} • <span class="italic text-slate-400">${b.variety}</span></div>
          </td>
          <td class="py-3 px-4">
            <div class="text-slate-800 font-medium">${b.farmName}</div>
            <div class="text-[10px] text-slate-400">${b.region}</div>
          </td>
          <td class="py-3 px-4 text-slate-600 font-mono text-[11px]">${b.harvestDate ? b.harvestDate.slice(0, 10) : 'N/A'}</td>
          <td class="py-3 px-4 font-semibold text-slate-800">${b.quantityKg ? b.quantityKg.toLocaleString() : 0} kg</td>
          <td class="py-3 px-4">${riskBadge}</td>
          <td class="py-3 px-4">${recallBadge}</td>
          <td class="py-3 px-4">
            <div class="flex items-center space-x-1.5">
              <div class="w-12 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div class="bg-emerald-500 h-1.5 rounded-full" style="width: ${b.dataCompleteness || 100}%"></div>
              </div>
              <span class="text-[10px] font-mono text-slate-600">${b.dataCompleteness || 100}%</span>
            </div>
          </td>
          <td class="py-3 px-4 text-right space-x-1">
            <button onclick="window.traceHarvest.openPassport('${b.id}')" title="View Digital Passport" class="p-1 rounded text-slate-500 hover:text-emerald-600 hover:bg-emerald-50">
              <i data-lucide="qr-code" class="w-4 h-4"></i>
            </button>
            <button onclick="window.traceHarvest.openBullseyeForBatch('${b.id}')" title="Bull's-Eye Precision Investigation" class="p-1 rounded text-slate-500 hover:text-cyan-600 hover:bg-cyan-50">
              <i data-lucide="crosshair" class="w-4 h-4"></i>
            </button>
            <button onclick="window.traceHarvest.openRecallForBatch('${b.id}')" title="Recall Command Centre" class="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50">
              <i data-lucide="alert-octagon" class="w-4 h-4"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  function filterDashboardBatches(query) {
    if (!state.data || !state.data.batches) return;
    const q = query.toLowerCase().trim();
    const filtered = state.data.batches.filter(b => 
      b.id.toLowerCase().includes(q) || 
      b.crop.toLowerCase().includes(q) || 
      b.farmName.toLowerCase().includes(q)
    );
    const tbody = document.getElementById('dashboard-batches-tbody');
    if (tbody) {
      tbody.innerHTML = renderBatchRows(filtered);
      if (window.lucide) window.lucide.createIcons();
    }
  }

  function initDashboardCharts() {
    const regionalCanvas = document.getElementById('regional-chart');
    const cropCanvas = document.getElementById('crop-chart');
    if (!regionalCanvas || !cropCanvas || !window.Chart) return;

    // Regional Chart
    new Chart(regionalCanvas, {
      type: 'bar',
      data: {
        labels: ['Guntur', 'Krishna', 'Kurnool', 'Chittoor', 'Eluru/NH-16'],
        datasets: [{
          label: 'Tracked Batches',
          data: [2, 1, 1, 1, 1],
          backgroundColor: '#047857'
        }, {
          label: 'Flagged Incidents',
          data: [1, 1, 1, 1, 1],
          backgroundColor: '#ef4444'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top', labels: { boxWidth: 10, font: { size: 10 } } } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } } }, x: { ticks: { font: { size: 10 } } } }
      }
    });

    // Crop Chart
    new Chart(cropCanvas, {
      type: 'doughnut',
      data: {
        labels: ['Tomatoes (Pass)', 'Mangoes (Missing Insp)', 'Spinach (Recalled)', 'Chillies (Timestamp)', 'Bananas (Qty Mismatch)', 'Guavas (Cold Excursion)'],
        datasets: [{
          data: [2400, 1800, 1200, 3500, 5000, 1600],
          backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#f97316', '#6366f1', '#06b6d4']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10 } } } }
      }
    });
  }

  // --- 3. FEATURE 1: TREND INTELLIGENCE ENGINE ---
  async function renderTrends(container) {
    let trends = null;
    try {
      const res = await fetch('/api/trends');
      trends = await res.json();
      state.trendsData = trends;
    } catch (e) {
      trends = {
        metrics: {
          totalBatches: 6, totalIncidents: 5, qualityFailureRate: 33.3,
          missingRecordRate: 33.3, transportExceptionRate: 25.0,
          batchesUnderInvestigation: 4, recurringRiskPatternsCount: 4,
          repeatedIncidentCorridorsCount: 2
        },
        patterns: []
      };
    }

    const m = trends.metrics;

    container.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-6">
        <!-- Engine Header Card -->
        <div class="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-6 rounded-2xl border border-cyan-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div class="space-y-1">
            <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-[10px] font-bold uppercase tracking-wider">
              <span>Predictive & Forensic Telemetry</span>
            </div>
            <h2 class="text-xl font-extrabold text-white">Trend Intelligence Engine</h2>
            <p class="text-xs text-slate-300 max-w-2xl">
              Continuously correlates telemetry across transport corridors, farm soil profiles, and regional analytical laboratories to uncover emerging systemic supply chain anomalies.
            </p>
          </div>
          <div class="flex items-center space-x-2">
            <button onclick="window.traceHarvest.investigatePattern('PAT-001')" class="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow transition">
              <i data-lucide="crosshair" class="w-4 h-4"></i>
              <span>Investigate NH-16 Pattern</span>
            </button>
          </div>
        </div>

        <!-- 7 Calculated Real Metrics (No hardcoding) -->
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Incidents</div>
            <div class="text-2xl font-extrabold text-slate-900 mt-1">${m.totalIncidents}</div>
            <div class="text-[10px] text-slate-400 mt-0.5">Recorded breaches</div>
          </div>
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quality Fail Rate</div>
            <div class="text-2xl font-extrabold text-rose-600 mt-1">${m.qualityFailureRate}%</div>
            <div class="text-[10px] text-rose-500 mt-0.5">Lab MRL threshold</div>
          </div>
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Missing Record Rate</div>
            <div class="text-2xl font-extrabold text-amber-600 mt-1">${m.missingRecordRate}%</div>
            <div class="text-[10px] text-amber-500 mt-0.5">&lt;80% completeness</div>
          </div>
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Transport Excursion</div>
            <div class="text-2xl font-extrabold text-sky-600 mt-1">${m.transportExceptionRate}%</div>
            <div class="text-[10px] text-sky-500 mt-0.5">Thermal sensor alerts</div>
          </div>
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Under Investigation</div>
            <div class="text-2xl font-extrabold text-orange-600 mt-1">${m.batchesUnderInvestigation}</div>
            <div class="text-[10px] text-orange-500 mt-0.5">Batches quarantined</div>
          </div>
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Recurring Patterns</div>
            <div class="text-2xl font-extrabold text-purple-600 mt-1">${m.recurringRiskPatternsCount}</div>
            <div class="text-[10px] text-purple-500 mt-0.5">Rule-based clusters</div>
          </div>
          <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">High-Risk Corridors</div>
            <div class="text-2xl font-extrabold text-teal-600 mt-1">${m.repeatedIncidentCorridorsCount}</div>
            <div class="text-[10px] text-teal-500 mt-0.5">NH-16 & Kurnool</div>
          </div>
        </div>

        <!-- Filter Bar -->
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div class="flex items-center space-x-2">
            <span class="font-bold text-slate-700">Timespan:</span>
            <button class="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-semibold">Weekly</button>
            <button class="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200">Daily</button>
            <button class="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200">Monthly</button>
          </div>
          <div class="flex items-center space-x-2">
            <select class="border border-slate-200 rounded-lg px-2.5 py-1 bg-white text-slate-700">
              <option>All AP Regions</option>
              <option>Guntur District</option>
              <option>Krishna District</option>
              <option>Kurnool District</option>
              <option>Chittoor District</option>
            </select>
            <select class="border border-slate-200 rounded-lg px-2.5 py-1 bg-white text-slate-700">
              <option>All Severity Levels</option>
              <option>Critical Only</option>
              <option>High & Medium</option>
            </select>
          </div>
        </div>

        <!-- Interactive Charts Row -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div class="flex items-center justify-between mb-3">
              <div>
                <h3 class="font-bold text-slate-900 text-xs">Weekly Incident Trajectory vs Fleet Ambient Temp</h3>
                <p class="text-[11px] text-slate-500">Correlation between transit heat and reported quality/thermal exceptions</p>
              </div>
              <span class="text-[10px] bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded">7-Day Rolling</span>
            </div>
            <div class="h-64 relative">
              <canvas id="trend-line-chart"></canvas>
            </div>
          </div>

          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div class="flex items-center justify-between mb-3">
              <div>
                <h3 class="font-bold text-slate-900 text-xs">Transport Route Exception Hotspots</h3>
                <p class="text-[11px] text-slate-500">Breach hours recorded along key Andhra arterial transit links</p>
              </div>
              <span class="text-[10px] bg-sky-100 text-sky-700 font-mono px-2 py-0.5 rounded">Hours Exceeded</span>
            </div>
            <div class="h-64 relative">
              <canvas id="route-exception-chart"></canvas>
            </div>
          </div>
        </div>

        <!-- Emerging Patterns Section -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="font-bold text-slate-900 text-sm">Detected Emerging Risk Patterns</h3>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800">Rule-Based Explainable AI</span>
              </div>
              <p class="text-xs text-slate-500 mt-0.5">Automated algorithmic cluster analysis flags recurring operational and chemical vulnerabilities</p>
            </div>
            <button onclick="window.traceHarvest.investigatePattern('PAT-001')" class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1 transition">
              <i data-lucide="play" class="w-3.5 h-3.5"></i>
              <span>Demo Pattern #1</span>
            </button>
          </div>

          <div class="divide-y divide-slate-100">
            ${(trends.patterns || []).map(p => `
              <div class="p-5 hover:bg-slate-50/80 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div class="space-y-2 max-w-3xl">
                  <div class="flex items-center gap-2.5 flex-wrap">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${p.severity === 'Critical' ? 'bg-rose-100 text-rose-800' : 'bg-orange-100 text-orange-800'}">
                      ${p.severity}
                    </span>
                    <h4 class="font-bold text-xs text-slate-900">${p.title}</h4>
                    <span class="text-[11px] text-slate-400 font-mono">${p.dateRange}</span>
                    <span class="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">${p.supportingRecordsCount} records confirmed</span>
                  </div>
                  <p class="text-xs text-slate-600"><strong class="text-slate-700">Corridor / Route:</strong> ${p.route}</p>
                  <p class="text-xs text-slate-600"><strong class="text-slate-700">Evidence:</strong> ${p.evidence}</p>
                  <div class="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200 text-emerald-900 text-[11px]">
                    <strong>Recommended Next Action:</strong> ${p.recommendedInvestigation}
                  </div>
                </div>
                <div class="flex flex-col items-end justify-center space-y-2 flex-shrink-0">
                  <button onclick="window.traceHarvest.investigatePattern('${p.id}')" class="w-full md:w-auto px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 font-bold text-xs flex items-center justify-center gap-1.5 shadow transition">
                    <i data-lucide="crosshair" class="w-4 h-4 text-neon-green"></i>
                    <span>Investigate in Bull's-Eye</span>
                  </button>
                  <button onclick="window.traceHarvest.openRecallForBatch('${p.targetBatchId}')" class="w-full md:w-auto px-4 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs flex items-center justify-center gap-1 transition">
                    <i data-lucide="alert-octagon" class="w-3.5 h-3.5"></i>
                    <span>Initiate Targeted Recall</span>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    initTrendCharts(trends.historicalTimeline || []);
  }

  function initTrendCharts(historical) {
    const trendCanvas = document.getElementById('trend-line-chart');
    const routeCanvas = document.getElementById('route-exception-chart');
    if (!trendCanvas || !routeCanvas || !window.Chart) return;

    const labels = historical.map(h => h.date ? h.date.slice(5) : '');
    const incidents = historical.map(h => h.incidents);
    const temps = historical.map(h => h.avgTemp);

    new Chart(trendCanvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Incidents Flagged',
            data: incidents,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fill: true,
            tension: 0.3,
            yAxisID: 'y'
          },
          {
            label: 'Avg Transit Temp (°C)',
            data: temps,
            borderColor: '#06b6d4',
            backgroundColor: 'transparent',
            borderDash: [4, 4],
            tension: 0.3,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top', labels: { boxWidth: 10, font: { size: 10 } } } },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Incidents' }, ticks: { stepSize: 1, font: { size: 10 } } },
          y1: { position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Temp (°C)' }, ticks: { font: { size: 10 } } },
          x: { ticks: { font: { size: 10 } } }
        }
      }
    });

    new Chart(routeCanvas, {
      type: 'bar',
      data: {
        labels: ['NH-16 (Eluru-VJA)', 'NH-44 (Kurnool-Hyd)', 'Tirupati-Chittoor', 'Tenali-Guntur Hub', 'VJA-Vizag Highway'],
        datasets: [{
          label: 'Thermal Excursion Hours',
          data: [4.2, 0.5, 0.2, 0.0, 1.8],
          backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#10b981', '#f59e0b']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, title: { display: true, text: 'Hours > 8°C' } }, x: { ticks: { font: { size: 9 } } } }
      }
    });
  }

  // --- 4. FEATURE 2: BULL'S-EYE PRECISION INVESTIGATION ENGINE ---
  async function renderBullseye(container) {
    const targetBatchId = state.currentBatchId || 'TH-GVA-2026-095';
    let data = null;
    try {
      const res = await fetch(`/api/bullseye/${targetBatchId}`);
      if (!res.ok) throw new Error('Failed to load Bull\'s-Eye details');
      data = await res.json();
      state.bullseyeData = data;
    } catch (e) {
      console.error(e);
      showToast('Could not load Bull\'s-Eye investigation data', 'error');
      return;
    }

    const b = data.batch;
    const center = data.bullseye.center;
    const score = data.riskScore;

    container.innerHTML = `
      <div class="space-y-4 max-w-7xl mx-auto">
        <!-- Control Header -->
        <div class="bg-midnight-900 border border-cyan-500/30 rounded-2xl p-4 text-white flex flex-wrap items-center justify-between gap-3 shadow-2xl">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center text-neon-green font-mono font-bold shadow-lg shadow-cyan-950">
              🎯
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-sm font-bold text-white tracking-wide uppercase">Bull's-Eye Precision Investigation</h2>
                <span class="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-mono border border-cyan-500/30">CINEMATIC RADIAL MODE</span>
              </div>
              <p class="text-[11px] text-slate-400">Interactive multi-ring concentric supply chain graph isolating root causes and downstream destinations</p>
            </div>
          </div>

          <div class="flex items-center space-x-2.5">
            <!-- Target Batch Selector -->
            <label class="text-xs text-slate-400 font-medium">Target Incident:</label>
            <select id="bullseye-batch-select" onchange="window.traceHarvest.openBullseyeForBatch(this.value)" class="text-xs bg-midnight-800 text-cyan-300 border border-cyan-500/40 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-cyan-400 focus:outline-none font-mono">
              ${(state.data.batches || []).map(item => `
                <option value="${item.id}" ${item.id === targetBatchId ? 'selected' : ''}>
                  ${item.id} - ${item.crop} (${item.riskLevel})
                </option>
              `).join('')}
            </select>

            <button onclick="window.traceHarvest.openRecallForBatch('${targetBatchId}')" class="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1">
              <i data-lucide="alert-octagon" class="w-3.5 h-3.5"></i>
              <span>Simulate Recall</span>
            </button>
            <button onclick="window.traceHarvest.generateIncidentReportModal('${targetBatchId}')" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-semibold flex items-center gap-1 transition">
              <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
              <span>Report Dossier</span>
            </button>
          </div>
        </div>

        <!-- Investigation Interactive Canvas & Inspector Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <!-- Canvas Visualization Column (8 cols) -->
          <div class="lg:col-span-8 bg-midnight-950 rounded-2xl border border-cyan-500/20 p-4 relative overflow-hidden shadow-2xl flex flex-col items-center">
            <!-- Canvas HUD Overlay -->
            <div class="w-full flex items-center justify-between text-xs text-slate-400 mb-2 px-2 z-10">
              <div class="flex items-center space-x-3">
                <span class="flex items-center gap-1.5 text-slate-300">
                  <span class="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block animate-ping"></span>
                  <span class="font-mono text-[11px] font-bold text-white">${center.id}</span>
                </span>
                <span class="text-[11px] text-cyan-400 font-mono">(${center.title})</span>
              </div>
              <div class="flex items-center space-x-2 text-[10px]">
                <span class="px-2 py-0.5 rounded bg-midnight-800 border border-slate-700 text-slate-300">Hover / Click Nodes</span>
                <span class="px-2 py-0.5 rounded bg-midnight-800 border border-slate-700 text-emerald-400">FPS: 60</span>
              </div>
            </div>

            <!-- Concentric Legend -->
            <div class="w-full grid grid-cols-4 gap-2 text-center text-[10px] py-1 px-3 bg-midnight-900/60 rounded-xl border border-slate-800 text-slate-400 mb-3 z-10">
              <div><span class="inline-block w-2 h-2 rounded-full bg-rose-500 mr-1"></span>Center: Target</div>
              <div><span class="inline-block w-2 h-2 rounded-full bg-amber-400 mr-1"></span>Ring 1: Evidence</div>
              <div><span class="inline-block w-2 h-2 rounded-full bg-cyan-400 mr-1"></span>Ring 2: Chain</div>
              <div><span class="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-1"></span>Ring 3: Destinations</div>
            </div>

            <!-- Main Canvas Container -->
            <div class="relative w-full aspect-square max-w-[560px] flex items-center justify-center">
              <canvas id="bullseye-canvas" width="560" height="560" class="w-full h-full cursor-crosshair"></canvas>
            </div>

            <div class="w-full text-center text-[10px] text-slate-500 mt-2">
              TraceHarvest Precision Radial v2.0 • Concentric directed graph computed from real stored transfers
            </div>
          </div>

          <!-- Inspector & Score Column (4 cols) -->
          <div class="lg:col-span-4 space-y-4">
            <!-- Transparent Risk Score Breakdown Card -->
            <div class="bg-midnight-900 rounded-2xl border border-cyan-500/30 p-4 text-white shadow-xl">
              <div class="flex items-center justify-between mb-2">
                <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Risk-Priority Score</span>
                <span class="text-xs font-mono px-2 py-0.5 rounded bg-cyan-900/50 text-cyan-300 border border-cyan-500/40">Weighted Formula</span>
              </div>
              <div class="flex items-baseline space-x-3 mb-3">
                <span class="text-4xl font-extrabold ${score > 70 ? 'text-neon-red' : score > 40 ? 'text-neon-amber' : 'text-neon-green'}">${score}</span>
                <span class="text-xs text-slate-400 font-mono">/ 100 Risk Index</span>
              </div>
              <!-- Factors breakdown list -->
              <div class="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                ${data.scoreBreakdown.map(sb => `
                  <div class="flex items-center justify-between text-[11px]">
                    <span class="text-slate-400">${sb.factor}:</span>
                    <span class="font-mono text-neon-cyan">${sb.points}</span>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Node Details Inspector Card -->
            <div id="bullseye-node-inspector" class="bg-midnight-900 rounded-2xl border border-slate-800 p-4 text-white shadow-xl min-h-[220px]">
              <div class="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                <h3 class="font-bold text-xs text-cyan-400 uppercase tracking-wider">Node Forensic Inspector</h3>
                <span class="text-[10px] text-slate-400">Click any circle</span>
              </div>
              <div id="inspector-body" class="space-y-2 text-xs text-slate-300">
                <div class="p-3 rounded-xl bg-midnight-950 border border-slate-800 text-slate-400 text-center py-6">
                  Select or hover over any node on the radial canvas to inspect its cryptographic record, telemetry parameters, and custody stamps.
                </div>
              </div>
            </div>

            <!-- Downstream Destinations Isolation List -->
            <div class="bg-midnight-900 rounded-2xl border border-slate-800 p-4 text-white shadow-xl">
              <div class="flex items-center justify-between mb-2 border-b border-slate-800 pb-2">
                <h3 class="font-bold text-xs text-emerald-400 uppercase tracking-wider">Downstream Destinations</h3>
                <span class="text-[10px] font-mono text-slate-400">${data.bullseye.ring3_destinations.length} facilities</span>
              </div>
              <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
                ${data.bullseye.ring3_destinations.map(d => `
                  <div class="p-2 rounded-lg bg-midnight-950 border border-slate-800 flex items-center justify-between text-[11px]">
                    <div>
                      <div class="font-bold text-slate-200">${d.name}</div>
                      <div class="text-[10px] text-slate-400">${d.type}</div>
                    </div>
                    <div class="text-right">
                      <span class="font-mono text-cyan-400">${d.receivedKg} kg</span>
                      <div class="text-[9px] ${d.status === 'Quarantined' ? 'text-rose-400' : 'text-amber-400'}">${d.status}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    initBullseyeCanvas(data);
  }

  function initBullseyeCanvas(data) {
    const canvas = document.getElementById('bullseye-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    const rings = [
      { radius: 65, color: '#f43f5e', name: 'Target' },
      { radius: 125, color: '#f59e0b', name: 'Ring 1: Evidence' },
      { radius: 185, color: '#06b6d4', name: 'Ring 2: Supply Chain' },
      { radius: 245, color: '#10b981', name: 'Ring 3: Destinations' }
    ];

    // Compute node coordinates
    const nodes = [];

    // Center Node (Incident Target)
    nodes.push({
      id: data.bullseye.center.id,
      title: data.bullseye.center.title,
      type: 'Target',
      x: centerX,
      y: centerY,
      radius: 18,
      color: '#f43f5e',
      data: data.bullseye.center,
      pulse: 0
    });

    // Ring 1: Direct Evidence
    const ring1 = data.bullseye.ring1_evidence || [];
    ring1.forEach((e, idx) => {
      const angle = (idx / (ring1.length || 1)) * Math.PI * 2 + 0.3;
      nodes.push({
        id: e.id,
        title: e.label,
        type: 'Evidence',
        x: centerX + Math.cos(angle) * rings[1].radius,
        y: centerY + Math.sin(angle) * rings[1].radius,
        radius: 12,
        color: e.severity === 'Critical' ? '#ef4444' : '#f59e0b',
        data: e,
        pulse: 0
      });
    });

    // Ring 2: Connected Supply Chain
    const ring2 = data.bullseye.ring2_supplyChain || [];
    ring2.forEach((sc, idx) => {
      const angle = (idx / (ring2.length || 1)) * Math.PI * 2 + 0.8;
      nodes.push({
        id: sc.id,
        title: sc.name || sc.transporter || sc.vehicle,
        type: sc.type || 'Chain Node',
        x: centerX + Math.cos(angle) * rings[2].radius,
        y: centerY + Math.sin(angle) * rings[2].radius,
        radius: 11,
        color: '#06b6d4',
        data: sc,
        pulse: 0
      });
    });

    // Ring 3: Downstream Destinations
    const ring3 = data.bullseye.ring3_destinations || [];
    ring3.forEach((dest, idx) => {
      const angle = (idx / (ring3.length || 1)) * Math.PI * 2 + 1.2;
      nodes.push({
        id: `DEST-${idx}`,
        title: dest.name,
        type: dest.type,
        x: centerX + Math.cos(angle) * rings[3].radius,
        y: centerY + Math.sin(angle) * rings[3].radius,
        radius: 13,
        color: dest.status === 'Quarantined' ? '#f43f5e' : '#10b981',
        data: dest,
        pulse: 0
      });
    });

    state.bullseyeNodes = nodes;

    // Mouse movement & hit testing
    canvas.onmousemove = function (e) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;

      let found = null;
      for (const node of nodes) {
        const dx = node.x - mouseX;
        const dy = node.y - mouseY;
        if (Math.sqrt(dx * dx + dy * dy) < node.radius + 6) {
          found = node;
          break;
        }
      }
      state.hoveredBullseyeNode = found;
      if (found) {
        canvas.style.cursor = 'pointer';
        inspectNode(found);
      } else {
        canvas.style.cursor = 'crosshair';
      }
    };

    canvas.onclick = function () {
      if (state.hoveredBullseyeNode) {
        state.selectedBullseyeNode = state.hoveredBullseyeNode;
        inspectNode(state.hoveredBullseyeNode);
      }
    };

    // Animation Loop
    let angleOffset = 0;
    function animate() {
      angleOffset += 0.003;
      ctx.clearRect(0, 0, width, height);

      // Background grid circles & crosshairs
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX, 0); ctx.lineTo(centerX, height);
      ctx.moveTo(0, centerY); ctx.lineTo(width, centerY);
      ctx.stroke();

      // Draw Rings
      rings.forEach((r, idx) => {
        ctx.strokeStyle = idx === 0 ? 'rgba(244, 63, 94, 0.3)' : 'rgba(0, 229, 255, 0.15)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.arc(centerX, centerY, r.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Draw Connecting Lines from Center to Rings
      nodes.forEach(n => {
        if (n.type !== 'Target') {
          ctx.strokeStyle = 'rgba(0, 229, 255, 0.12)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(n.x, n.y);
          ctx.stroke();
        }
      });

      // Draw Nodes
      nodes.forEach(n => {
        const isHovered = state.hoveredBullseyeNode === n;
        const isSelected = state.selectedBullseyeNode === n;

        // Pulse ring
        ctx.strokeStyle = n.color;
        ctx.lineWidth = isHovered || isSelected ? 2.5 : 1;
        ctx.beginPath();
        const pulseR = n.radius + (Math.sin(angleOffset * 4 + n.x) * 3 + 3);
        ctx.arc(n.x, n.y, pulseR, 0, Math.PI * 2);
        ctx.stroke();

        // Node circle
        ctx.fillStyle = isHovered ? '#ffffff' : n.color;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fill();

        // Label
        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(n.title.slice(0, 16), n.x, n.y + n.radius + 11);
      });

      state.canvasAnimationId = requestAnimationFrame(animate);
    }

    animate();
  }

  function inspectNode(node) {
    const body = document.getElementById('inspector-body');
    if (!body) return;
    const d = node.data;

    let content = `
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-[10px] uppercase font-bold text-cyan-400 font-mono">${node.type}</span>
          <span class="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">${node.id}</span>
        </div>
        <div class="text-sm font-bold text-white">${node.title}</div>
    `;

    if (d.detail) {
      content += `<p class="text-xs text-slate-300 leading-relaxed bg-midnight-950 p-2.5 rounded-lg border border-slate-800">${d.detail}</p>`;
    }
    if (d.location || d.region) {
      content += `<div class="text-[11px] text-slate-400"><strong>Location:</strong> ${d.location || d.region}</div>`;
    }
    if (d.receivedKg || d.quantityKg || d.dispatchedKg) {
      content += `<div class="text-[11px] text-slate-400"><strong>Quantity:</strong> ${(d.receivedKg || d.quantityKg || d.dispatchedKg).toLocaleString()} kg</div>`;
    }
    if (d.vehicle || d.vehicleNo) {
      content += `<div class="text-[11px] text-slate-400"><strong>Logistics Vehicle:</strong> ${d.vehicle || d.vehicleNo}</div>`;
    }
    if (d.date || d.timestamp) {
      content += `<div class="text-[10px] text-slate-500 font-mono">Timestamp: ${d.date || d.timestamp}</div>`;
    }

    content += `</div>`;
    body.innerHTML = content;
  }

  // --- 5. AI SUPPLY-CHAIN DETECTIVE ---
  function renderDetective(container) {
    const anomalies = state.data.anomalies || [];

    container.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-6">
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-2">
              <i data-lucide="shield-alert" class="w-3.5 h-3.5"></i>
              <span>Automated Forensic Surveillance</span>
            </div>
            <h2 class="text-xl font-bold text-slate-900">AI Supply-Chain Detective</h2>
            <p class="text-xs text-slate-600 mt-1 max-w-2xl">
              Analyzes event sequences, weighbridge entries, and lab certifications across the Andhra Pradesh grid. Flags temporal inversions, phantom excess weight, missing tests, and thermal spikes in plain English.
            </p>
          </div>
          <div class="flex items-center space-x-2">
            <span class="text-xs font-semibold text-slate-500">${anomalies.length} Flagged Anomalies</span>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${anomalies.map(a => `
            <div class="bg-white rounded-2xl border ${a.severity === 'Critical' ? 'border-rose-300 shadow-rose-100' : 'border-slate-200'} p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
              <div class="space-y-2.5">
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${a.severity === 'Critical' ? 'bg-rose-100 text-rose-800' : a.severity === 'High' ? 'bg-orange-100 text-orange-800' : 'bg-amber-100 text-amber-800'}">
                    ${a.severity} Risk
                  </span>
                  <span class="text-[10px] text-slate-400 font-mono">${a.detectedAt ? a.detectedAt.slice(0, 16) : ''}</span>
                </div>
                <h3 class="font-bold text-slate-900 text-sm">${a.title}</h3>
                <div class="text-[11px] text-slate-500 flex items-center gap-2">
                  <span>Batch: <strong class="font-mono text-slate-800">${a.batchId}</strong></span>
                  <span>•</span>
                  <span>Crop: <strong>${a.crop}</strong></span>
                </div>
                <div class="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed">
                  <strong>Trigger Reason:</strong> ${a.reason}
                </div>
                <div class="text-[11px] text-slate-600">
                  <strong>Supporting Evidence:</strong> ${a.evidence}
                </div>
                <div class="p-2.5 rounded-lg bg-emerald-50 text-emerald-900 text-[11px] border border-emerald-100">
                  <strong>Recommended Investigation:</strong> ${a.recommendedAction}
                </div>
              </div>

              <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span class="text-[10px] ${a.humanReviewRequired ? 'text-amber-600 font-semibold' : 'text-slate-400'}">
                  ${a.humanReviewRequired ? '⚠️ Human Review Required' : 'Automated Log'}
                </span>
                <div class="flex items-center space-x-2">
                  <button onclick="window.traceHarvest.openBullseyeForBatch('${a.batchId}')" class="px-3 py-1.5 rounded-lg bg-midnight-900 hover:bg-midnight-800 text-cyan-300 font-bold text-xs flex items-center gap-1 transition">
                    <i data-lucide="crosshair" class="w-3.5 h-3.5 text-neon-green"></i>
                    <span>Bull's-Eye</span>
                  </button>
                  <button onclick="window.traceHarvest.openRecallForBatch('${a.batchId}')" class="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition">
                    <span>Recall Action</span>
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // --- 6. SMART COLD-CHAIN MONITOR ---
  function renderColdChain(container) {
    const logs = state.data.coldChainLogs || [];

    container.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-6">
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="inline-flex items-center gap-1.5 text-[10px] font-bold text-sky-700 bg-sky-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-2">
              <i data-lucide="thermometer-snowflake" class="w-3.5 h-3.5"></i>
              <span>IoT Telemetry & Thermal Integrity</span>
            </div>
            <h2 class="text-xl font-bold text-slate-900">Smart Cold-Chain Monitor</h2>
            <p class="text-xs text-slate-600 mt-1 max-w-2xl">
              Simulated real-time streaming telemetry for perishable produce in refrigerated transit along National Highway corridors.
            </p>
          </div>
          <div class="flex items-center space-x-2">
            <span class="text-xs font-mono bg-emerald-50 text-emerald-800 px-3 py-1 rounded-lg border border-emerald-200">
              Safe Zone: 4.0°C – 8.0°C
            </span>
          </div>
        </div>

        <!-- Telemetry Chart and Inject Excursion Simulation Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div class="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="font-bold text-slate-900 text-xs">Reefer Cabin Temperature Timeline (Batch: TH-GVA-2026-095)</h3>
                <p class="text-[11px] text-slate-500">Route: NH-16 Eluru packing centre to Vijayawada Mega Agripark</p>
              </div>
              <span class="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded">Excursion Logged: 18.5°C</span>
            </div>
            <div class="h-64 relative">
              <canvas id="coldchain-telemetry-chart"></canvas>
            </div>
          </div>

          <!-- Simulation Injection Form -->
          <div class="lg:col-span-4 bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
            <div class="border-b border-slate-800 pb-2">
              <h3 class="font-bold text-xs text-emerald-400 uppercase tracking-wider">Inject Simulated Thermal Excursion</h3>
              <p class="text-[11px] text-slate-400 mt-0.5">Test system alert triggers and automatic risk assessment</p>
            </div>

            <form onsubmit="window.traceHarvest.handleSimulateExcursion(event)" class="space-y-3 text-xs">
              <div>
                <label class="block text-slate-400 mb-1">Target Produce Batch:</label>
                <select id="sim-batch-id" class="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono">
                  ${(state.data.batches || []).map(b => `<option value="${b.id}">${b.id} (${b.crop})</option>`).join('')}
                </select>
              </div>

              <div>
                <label class="block text-slate-400 mb-1">Transport Route Corridor:</label>
                <input type="text" id="sim-route" value="NH-16 Eluru - Hanuman Junction Bypass" class="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white">
              </div>

              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-slate-400 mb-1">Spike Temp (°C):</label>
                  <input type="number" id="sim-temp" step="0.5" value="19.5" class="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-rose-400 font-bold font-mono">
                </div>
                <div>
                  <label class="block text-slate-400 mb-1">Duration (Hours):</label>
                  <input type="number" id="sim-duration" step="0.5" value="4.5" class="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono">
                </div>
              </div>

              <div>
                <label class="block text-slate-400 mb-1">Reefer Truck Reg No:</label>
                <input type="text" id="sim-vehicle" value="AP-07-TJ-4421" class="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono">
              </div>

              <button type="submit" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-bold text-xs transition shadow-lg shadow-rose-950 flex items-center justify-center gap-1.5">
                <i data-lucide="zap" class="w-4 h-4"></i>
                <span>Inject Excursion Spike</span>
              </button>
            </form>
          </div>
        </div>

        <!-- Telemetry Logs Table -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 class="font-bold text-xs text-slate-900">Streaming IoT Telemetry Sensor Audit Trail</h3>
            <span class="text-[11px] text-slate-500 font-mono">${logs.length} logged data packets</span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-500 uppercase text-[10px]">
                <tr>
                  <th class="py-2.5 px-4">Timestamp</th>
                  <th class="py-2.5 px-4">Batch ID</th>
                  <th class="py-2.5 px-4">Corridor Location</th>
                  <th class="py-2.5 px-4">Temperature</th>
                  <th class="py-2.5 px-4">Humidity</th>
                  <th class="py-2.5 px-4">Vehicle</th>
                  <th class="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-mono text-[11px]">
                ${logs.slice(0, 10).map(l => `
                  <tr class="hover:bg-slate-50">
                    <td class="py-2 px-4 text-slate-600">${l.timestamp ? l.timestamp.slice(11, 19) : ''}</td>
                    <td class="py-2 px-4 font-bold text-slate-900">${l.batchId}</td>
                    <td class="py-2 px-4 font-sans text-slate-700">${l.route}</td>
                    <td class="py-2 px-4 font-bold ${l.tempC > 8 ? 'text-rose-600' : 'text-emerald-600'}">${l.tempC}°C</td>
                    <td class="py-2 px-4 text-slate-600">${l.humidityPct}%</td>
                    <td class="py-2 px-4 text-slate-500">${l.vehicleNo}</td>
                    <td class="py-2 px-4 font-sans">
                      <span class="px-2 py-0.5 rounded text-[10px] ${l.tempC > 8 ? 'bg-rose-100 text-rose-800 font-bold' : 'bg-emerald-100 text-emerald-800'}">
                        ${l.status}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    initColdChainChart(logs);
  }

  function initColdChainChart(logs) {
    const canvas = document.getElementById('coldchain-telemetry-chart');
    if (!canvas || !window.Chart) return;

    const labels = logs.map(l => l.timestamp ? l.timestamp.slice(11, 16) : '');
    const temps = logs.map(l => l.tempC);

    new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Reefer Cabin Temp (°C)',
            data: temps,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fill: true,
            tension: 0.2
          },
          {
            label: 'Upper Threshold (8°C)',
            data: labels.map(() => 8),
            borderColor: '#f59e0b',
            borderDash: [5, 5],
            pointRadius: 0
          },
          {
            label: 'Lower Threshold (4°C)',
            data: labels.map(() => 4),
            borderColor: '#10b981',
            borderDash: [5, 5],
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top', labels: { boxWidth: 10, font: { size: 10 } } } },
        scales: { y: { min: 2, max: 22, title: { display: true, text: 'Temperature (°C)' } } }
      }
    });
  }

  async function handleSimulateExcursion(e) {
    e.preventDefault();
    const batchId = document.getElementById('sim-batch-id').value;
    const route = document.getElementById('sim-route').value;
    const spikeTempC = parseFloat(document.getElementById('sim-temp').value);
    const durationHours = parseFloat(document.getElementById('sim-duration').value);
    const vehicleNo = document.getElementById('sim-vehicle').value;

    try {
      const res = await fetch('/api/coldchain/simulate-excursion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId, route, spikeTempC, durationHours, vehicleNo })
      });
      if (!res.ok) throw new Error('Simulation failed');
      const data = await res.json();
      showToast(`Simulated excursion injected: ${spikeTempC}°C alert on ${batchId}`, 'error');
      await fetchData();
      renderPage();
    } catch (err) {
      showToast('Error recording simulation', 'error');
    }
  }

  // --- 7. LIVE FOOD RECALL COMMAND CENTRE ---
  function renderRecall(container) {
    const recalls = state.data.recalls || [];
    const activeRecall = recalls[0]; // primary demonstration recall

    container.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-6">
        <!-- Recall Simulator Big Action Banner -->
        <div class="bg-gradient-to-r from-rose-950 via-red-900 to-slate-950 text-white p-6 rounded-2xl border border-rose-500/50 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div class="space-y-1">
            <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/40 text-[10px] font-bold uppercase tracking-wider blink-urgent">
              <span>Simulation Incident Controller</span>
            </div>
            <h2 class="text-xl font-extrabold text-white">Live Food Recall Command Centre</h2>
            <p class="text-xs text-rose-100/90 max-w-2xl">
              Targeted contamination isolation workflow: Traces affected downstream destinations from actual transfer graphs, locks custody movement, and coordinates prioritized stakeholder acknowledgements.
            </p>
          </div>
          <div class="flex items-center space-x-2">
            <button onclick="window.traceHarvest.openInitiateRecallModal()" class="px-5 py-2.5 rounded-xl bg-white hover:bg-rose-50 text-rose-950 font-extrabold text-xs shadow-lg transition flex items-center gap-1.5">
              <i data-lucide="alert-octagon" class="w-4 h-4 text-rose-600"></i>
              <span>SIMULATE FOOD SAFETY INCIDENT</span>
            </button>
          </div>
        </div>

        ${activeRecall ? `
          <!-- Active Incident Dossier Card -->
          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-mono font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded border border-rose-200">${activeRecall.id}</span>
                  <h3 class="font-extrabold text-slate-900 text-base">Active Level 1 Mandatory Recall</h3>
                </div>
                <p class="text-xs text-slate-500 mt-1">
                  Target Batch: <strong class="font-mono text-slate-900">${activeRecall.batchId}</strong> (${activeRecall.crop}) • Hazard: <strong>${activeRecall.hazardType}</strong>
                </p>
              </div>

              <div class="flex items-center space-x-2">
                <button onclick="window.traceHarvest.openBullseyeForBatch('${activeRecall.batchId}')" class="px-3.5 py-2 rounded-xl bg-midnight-950 text-cyan-300 hover:bg-midnight-900 text-xs font-bold border border-cyan-500/40 flex items-center gap-1.5 shadow transition">
                  <i data-lucide="crosshair" class="w-3.5 h-3.5 text-neon-green"></i>
                  <span>Inspect in Bull's-Eye</span>
                </button>
                <button onclick="window.traceHarvest.generateIncidentReportModal('${activeRecall.batchId}')" class="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition">
                  <i data-lucide="download" class="w-3.5 h-3.5"></i>
                  <span>Download Incident Report</span>
                </button>
              </div>
            </div>

            <!-- Recall Statistics Metrics -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div class="text-[10px] font-semibold text-slate-500 uppercase">Affected Total Volume</div>
                <div class="text-2xl font-extrabold text-slate-900 mt-1 font-mono">${(activeRecall.totalAffectedKg || 1200).toLocaleString()} kg</div>
                <div class="text-[10px] text-slate-400 mt-0.5">Calculated from harvest registry</div>
              </div>
              <div class="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div class="text-[10px] font-semibold text-slate-500 uppercase">Downstream Destinations</div>
                <div class="text-2xl font-extrabold text-rose-600 mt-1 font-mono">${(activeRecall.affectedDestinations || []).length} Points</div>
                <div class="text-[10px] text-rose-500 mt-0.5">Retail stores & transit depots</div>
              </div>
              <div class="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div class="text-[10px] font-semibold text-slate-500 uppercase">Quarantined Volume</div>
                <div class="text-2xl font-extrabold text-emerald-600 mt-1 font-mono">${(activeRecall.quarantinedKg || 1200).toLocaleString()} kg</div>
                <div class="text-[10px] text-emerald-600 mt-0.5">No double-counting applied</div>
              </div>
              <div class="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div class="text-[10px] font-semibold text-slate-500 uppercase">Transfer Security Lock</div>
                <div class="text-2xl font-extrabold text-rose-600 mt-1 flex items-center gap-1">
                  <i data-lucide="lock" class="w-5 h-5"></i>
                  <span>ENFORCED</span>
                </div>
                <div class="text-[10px] text-slate-500 mt-0.5">Backend 403 block active</div>
              </div>
            </div>

            <!-- Timeline Stages Progress Bar -->
            <div class="space-y-2 pt-2">
              <h4 class="font-bold text-xs text-slate-800 uppercase tracking-wider">Recall Enforcement Timeline</h4>
              <div class="grid grid-cols-2 md:grid-cols-5 gap-2 text-center text-xs">
                ${(activeRecall.timeline || []).map(st => `
                  <div class="p-2.5 rounded-xl border ${st.status === 'Completed' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : st.status === 'In Progress' ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'}">
                    <div class="text-[10px] uppercase font-bold">${st.stage}</div>
                    <div class="text-[10px] font-mono mt-1 ${st.status === 'Completed' ? 'text-emerald-600' : 'text-slate-400'}">${st.status}</div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Prioritized Stakeholder Notification & Acknowledgment Queue -->
            <div class="space-y-3 pt-3">
              <div class="flex items-center justify-between">
                <h4 class="font-bold text-xs text-slate-900 uppercase tracking-wider">Downstream Stakeholder Notification & Quarantine Queue</h4>
                <span class="text-[11px] text-slate-500">TraceHarvest Directed Graph Traversal</span>
              </div>

              <div class="overflow-x-auto border border-slate-200 rounded-xl">
                <table class="w-full text-left text-xs">
                  <thead class="bg-slate-50 text-slate-500 uppercase text-[10px]">
                    <tr>
                      <th class="py-3 px-4">Stakeholder Facility</th>
                      <th class="py-3 px-4">Node Tier</th>
                      <th class="py-3 px-4">Location</th>
                      <th class="py-3 px-4">Recorded Stock</th>
                      <th class="py-3 px-4">Quarantine Status</th>
                      <th class="py-3 px-4 text-right">Corrective Action</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    ${(activeRecall.affectedDestinations || []).map(dest => `
                      <tr class="hover:bg-slate-50">
                        <td class="py-3 px-4 font-bold text-slate-900">${dest.stakeholder}</td>
                        <td class="py-3 px-4 text-slate-600">${dest.type}</td>
                        <td class="py-3 px-4 text-slate-500 text-[11px]">${dest.location}</td>
                        <td class="py-3 px-4 font-mono font-bold text-slate-800">${dest.recordedQtyKg} kg</td>
                        <td class="py-3 px-4">
                          <span class="px-2 py-0.5 rounded text-[10px] font-bold ${dest.status.includes('Acknowledged') ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800 blink-urgent'}">
                            ${dest.status}
                          </span>
                        </td>
                        <td class="py-3 px-4 text-right">
                          ${dest.acknowledgedAt ? `
                            <span class="text-[10px] text-emerald-700 font-medium">Verified by ${dest.acknowledgedBy}</span>
                          ` : `
                            <button onclick="window.traceHarvest.openAcknowledgeModal('${activeRecall.id}', '${dest.stakeholder}')" class="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition">
                              Acknowledge & Isolate
                            </button>
                          `}
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ` : `
          <div class="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
            <div class="text-4xl">🌱</div>
            <h3 class="font-bold text-slate-900 text-sm">No Active Recalls on Grid</h3>
            <p class="text-xs text-slate-500 max-w-md mx-auto">Click 'SIMULATE FOOD SAFETY INCIDENT' above to run an interactive multi-facility recall demonstration.</p>
          </div>
        `}
      </div>
    `;
  }

  // --- 8. BATCHES MANAGEMENT ---
  function renderBatches(container) {
    const batches = state.data.batches || [];
    const farms = state.data.farms || [];

    container.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h2 class="text-lg font-bold text-slate-900">Produce Batch Registry</h2>
            <p class="text-xs text-slate-500">Register new morning harvests and mint unique digital passports</p>
          </div>
          <button onclick="window.traceHarvest.openCreateBatchModal()" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition">
            <i data-lucide="plus-circle" class="w-4 h-4"></i>
            <span>Register New Harvest Batch</span>
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${batches.map(b => `
            <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition space-y-3">
              <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                <span class="font-mono font-bold text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">${b.id}</span>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${b.riskLevel === 'Critical' ? 'bg-rose-100 text-rose-800' : b.riskLevel === 'High' ? 'bg-orange-100 text-orange-800' : 'bg-emerald-100 text-emerald-800'}">
                  ${b.riskLevel} Risk
                </span>
              </div>

              <div>
                <h3 class="font-bold text-slate-900 text-sm">${b.crop}</h3>
                <p class="text-xs text-slate-500">${b.variety}</p>
              </div>

              <div class="text-xs text-slate-600 space-y-1">
                <div><strong>Farm:</strong> ${b.farmName}</div>
                <div><strong>Region:</strong> ${b.region}</div>
                <div><strong>Harvest:</strong> ${b.harvestDate ? b.harvestDate.slice(0, 10) : ''}</div>
                <div><strong>Recorded Quantity:</strong> ${b.quantityKg ? b.quantityKg.toLocaleString() : 0} kg</div>
                <div><strong>Current Holder:</strong> ${b.currentHolder || 'Farm Plot'}</div>
              </div>

              <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div class="flex items-center space-x-1">
                  <div class="w-10 bg-slate-200 rounded-full h-1.5">
                    <div class="bg-emerald-500 h-1.5 rounded-full" style="width: ${b.dataCompleteness || 100}%"></div>
                  </div>
                  <span class="text-[10px] text-slate-500 font-mono">${b.dataCompleteness || 100}%</span>
                </div>
                <div class="flex items-center space-x-1.5">
                  <button onclick="window.traceHarvest.openPassport('${b.id}')" class="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs flex items-center gap-1 transition">
                    <i data-lucide="qr-code" class="w-3.5 h-3.5"></i>
                    <span>Passport</span>
                  </button>
                  <button onclick="window.traceHarvest.openBullseyeForBatch('${b.id}')" class="px-2.5 py-1 rounded-lg bg-midnight-900 hover:bg-midnight-800 text-cyan-300 font-bold text-xs flex items-center gap-1 transition">
                    <i data-lucide="crosshair" class="w-3.5 h-3.5 text-neon-green"></i>
                    <span>Target</span>
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // --- 9. TRANSFERS LOGISTICS ---
  function renderTransfers(container) {
    const transfers = state.data.transfers || [];

    container.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h2 class="text-lg font-bold text-slate-900">Chain of Custody Transfers</h2>
            <p class="text-xs text-slate-500">Record dispatches, weighbridge receipts, and transport conditions</p>
          </div>
          <button onclick="window.traceHarvest.openCreateTransferModal()" class="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition">
            <i data-lucide="truck" class="w-4 h-4"></i>
            <span>Record New Transfer</span>
          </button>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-500 uppercase text-[10px]">
                <tr>
                  <th class="py-3 px-4">Transfer ID</th>
                  <th class="py-3 px-4">Batch ID</th>
                  <th class="py-3 px-4">Route (From &rarr; To)</th>
                  <th class="py-3 px-4">Quantity (Dispatched vs Received)</th>
                  <th class="py-3 px-4">Transporter & Vehicle</th>
                  <th class="py-3 px-4">Condition</th>
                  <th class="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${transfers.map(t => `
                  <tr class="hover:bg-slate-50">
                    <td class="py-3 px-4 font-mono font-bold text-slate-900">${t.id}</td>
                    <td class="py-3 px-4 font-mono text-emerald-800 font-semibold">${t.batchId}</td>
                    <td class="py-3 px-4">
                      <div class="font-medium text-slate-800">${t.fromLocation}</div>
                      <div class="text-[11px] text-slate-400">&darr; ${t.toLocation}</div>
                    </td>
                    <td class="py-3 px-4 font-mono">
                      <span class="font-bold text-slate-800">${t.dispatchedQuantityKg} kg</span>
                      ${t.receivedQuantityKg && t.receivedQuantityKg !== t.dispatchedQuantityKg ? `
                        <span class="text-rose-600 font-bold ml-1">(${t.receivedQuantityKg} kg)</span>
                      ` : ''}
                    </td>
                    <td class="py-3 px-4">
                      <div class="text-slate-800">${t.transporter}</div>
                      <div class="text-[10px] text-slate-400 font-mono">${t.vehicleNo}</div>
                    </td>
                    <td class="py-3 px-4 text-slate-600 text-[11px]">${t.condition}</td>
                    <td class="py-3 px-4">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold ${t.status.includes('Recalled') || t.status.includes('Quarantined') ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}">
                        ${t.status}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  // --- 10. QUALITY INSPECTIONS ---
  function renderInspections(container) {
    const inspections = state.data.inspections || [];

    container.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h2 class="text-lg font-bold text-slate-900">Quality Inspections & Laboratory Tests</h2>
            <p class="text-xs text-slate-500">Certified chemical residue, Brix, firmness, and microbiological certificates</p>
          </div>
          <button onclick="window.traceHarvest.openCreateInspectionModal()" class="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition">
            <i data-lucide="flask-conical" class="w-4 h-4"></i>
            <span>Log Inspection Result</span>
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          ${inspections.map(i => `
            <div class="bg-white rounded-2xl border ${i.status === 'FAILED' ? 'border-rose-300 shadow-rose-100' : 'border-slate-200'} p-5 shadow-sm space-y-3">
              <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                <span class="font-mono text-xs font-bold text-slate-700">${i.id}</span>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${i.status === 'FAILED' ? 'bg-rose-100 text-rose-800 blink-urgent' : 'bg-emerald-100 text-emerald-800'}">
                  ${i.status}
                </span>
              </div>
              <div>
                <h3 class="font-bold text-slate-900 text-sm">${i.crop}</h3>
                <p class="text-xs font-mono text-slate-500">Batch: ${i.batchId}</p>
              </div>
              <div class="text-xs text-slate-600 space-y-1">
                <div><strong>Testing Authority:</strong> ${i.inspector}</div>
                <div><strong>Document Reference:</strong> <span class="font-mono text-slate-800">${i.docReference}</span></div>
                <div><strong>Date:</strong> ${i.date ? i.date.slice(0, 10) : ''}</div>
              </div>
              <div class="p-2.5 rounded-xl ${i.status === 'FAILED' ? 'bg-rose-50 text-rose-900 border border-rose-200' : 'bg-emerald-50 text-emerald-900 border border-emerald-200'} text-xs">
                <strong>Verdict:</strong> ${i.verdict}
              </div>
              ${i.status === 'FAILED' ? `
                <button onclick="window.traceHarvest.openRecallForBatch('${i.batchId}')" class="w-full py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition">
                  Initiate Safety Recall
                </button>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // --- 11. DIGITAL PRODUCT PASSPORT ---
  function renderPassport(container) {
    const batches = state.data.batches || [];
    const activeBatch = batches.find(b => b.id === state.currentBatchId) || batches[0];
    const events = activeBatch.timelineEvents || [];

    container.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-6">
        <!-- Batch Selector Bar -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <label class="text-xs font-bold text-slate-700">Select Batch to View Passport:</label>
          <select onchange="window.traceHarvest.openPassport(this.value)" class="text-xs font-mono border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-800 focus:ring-1 focus:ring-emerald-500">
            ${batches.map(b => `<option value="${b.id}" ${b.id === activeBatch.id ? 'selected' : ''}>${b.id} - ${b.crop}</option>`).join('')}
          </select>
        </div>

        <!-- Digital Passport Main Card -->
        <div class="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <!-- Top Passport Header -->
          <div class="bg-gradient-to-r from-emerald-900 via-forest-800 to-slate-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div class="space-y-2">
              <div class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-bold uppercase tracking-wider">
                <i data-lucide="check-check" class="w-3.5 h-3.5"></i>
                <span>Cryptographically Timestamped Passport</span>
              </div>
              <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight">${activeBatch.crop}</h2>
              <p class="text-xs text-emerald-100 font-mono">ID: ${activeBatch.id} • ${activeBatch.variety}</p>
              <div class="text-xs text-slate-300">
                <strong>Origin:</strong> ${activeBatch.farmName} (${activeBatch.region})
              </div>
            </div>

            <!-- Scannable Dynamic QR Code Container -->
            <div class="flex flex-col items-center bg-white p-3 rounded-2xl shadow-lg text-slate-900 flex-shrink-0">
              <div id="passport-qrcode" class="w-28 h-28 flex items-center justify-center"></div>
              <span class="text-[10px] font-mono font-bold mt-1.5 text-slate-600">SCAN TO VERIFY</span>
            </div>
          </div>

          <!-- Status & Data Completeness Bar -->
          <div class="p-6 border-b border-slate-100 bg-slate-50/60 flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center space-x-4">
              <div>
                <div class="text-[10px] uppercase font-bold text-slate-400">Recall Status</div>
                <div class="text-xs font-bold ${activeBatch.recallStatus === 'RECALLED' ? 'text-rose-600' : 'text-emerald-600'}">
                  ${activeBatch.recallStatus === 'RECALLED' ? '⚠️ ACTIVE RECALL QUARANTINE' : '✅ CLEAR / APPROVED'}
                </div>
              </div>
              <div>
                <div class="text-[10px] uppercase font-bold text-slate-400">Total Harvest Volume</div>
                <div class="text-xs font-mono font-bold text-slate-800">${(activeBatch.quantityKg || 0).toLocaleString()} kg</div>
              </div>
            </div>

            <div class="flex items-center space-x-2">
              <span class="text-xs font-semibold text-slate-700">Data Completeness:</span>
              <div class="w-32 bg-slate-200 rounded-full h-2 overflow-hidden">
                <div class="bg-emerald-500 h-2 rounded-full" style="width: ${activeBatch.dataCompleteness || 100}%"></div>
              </div>
              <span class="text-xs font-bold text-emerald-700 font-mono">${activeBatch.dataCompleteness || 100}%</span>
            </div>
          </div>

          <!-- EXTRAORDINARY FEATURE: JOURNEY REPLAY ANIMATOR -->
          <div class="p-6 border-b border-slate-100 space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <i data-lucide="play-circle" class="w-4 h-4 text-emerald-600"></i>
                  <span>Interactive Journey Replay</span>
                </h3>
                <p class="text-xs text-slate-500">Animate chronological farm-to-consumer physical custody transitions</p>
              </div>

              <!-- Replay Controls -->
              <div class="flex items-center space-x-2">
                <button onclick="window.traceHarvest.playJourneyReplay()" id="journey-play-btn" class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow transition">
                  <i data-lucide="play" class="w-3.5 h-3.5"></i>
                  <span>Play Replay</span>
                </button>
                <button onclick="window.traceHarvest.resetJourneyReplay()" class="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold">
                  Reset
                </button>
              </div>
            </div>

            <!-- Animated Step Bar -->
            <div class="grid grid-cols-1 sm:grid-cols-${events.length || 1} gap-2 text-xs">
              ${events.map((ev, idx) => `
                <div id="journey-step-${idx}" class="p-3 rounded-xl border border-slate-200 transition-all duration-300">
                  <div class="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                    <span>#${idx + 1}</span>
                    <span>${ev.timestamp ? ev.timestamp.slice(11, 16) : ''}</span>
                  </div>
                  <div class="font-bold text-xs text-slate-800">${ev.type}</div>
                  <div class="text-[11px] text-slate-600 mt-1 line-clamp-2">${ev.details}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Trust Evidence Section -->
          <div class="p-6 space-y-4">
            <h3 class="font-bold text-sm text-slate-900 uppercase tracking-wider text-xs">Trust Evidence Breakdown</h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div class="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1">
                <div class="font-bold text-emerald-800">✅ Verified Cryptographic Documents</div>
                <p class="text-slate-600 text-[11px]">Lab certificates, IndGAP audit records, and digital weighbridge tickets.</p>
              </div>
              <div class="p-4 rounded-xl bg-sky-50/60 border border-sky-200 space-y-1">
                <div class="font-bold text-sky-800">📡 Streaming Sensor Logs</div>
                <p class="text-slate-600 text-[11px]">Continuous IoT temperature readings recorded along transport routes.</p>
              </div>
              <div class="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-1">
                <div class="font-bold text-amber-800">⚠️ Disclosed Audit Notes</div>
                <p class="text-slate-600 text-[11px]">Transparent warnings on missing evidence or temporal re-calibrations.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => {
      initPassportQR(activeBatch.qrPayload || `https://traceharvest.ai/verify/${activeBatch.id}`);
    }, 50);
  }

  function initPassportQR(payload) {
    const el = document.getElementById('passport-qrcode');
    if (!el || !window.QRCode) return;
    el.innerHTML = '';
    new QRCode(el, {
      text: payload,
      width: 104,
      height: 104,
      colorDark: '#064e3b',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });
  }

  // Journey Replay Animation Controller
  function playJourneyReplay() {
    const batches = state.data.batches || [];
    const activeBatch = batches.find(b => b.id === state.currentBatchId) || batches[0];
    const events = activeBatch.timelineEvents || [];
    if (!events.length) return;

    if (state.journeyTimer) {
      clearInterval(state.journeyTimer);
      state.journeyTimer = null;
      document.getElementById('journey-play-btn').innerHTML = `<i data-lucide="play" class="w-3.5 h-3.5"></i><span>Resume</span>`;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    state.journeyCurrentIndex = 0;
    document.getElementById('journey-play-btn').innerHTML = `<i data-lucide="pause" class="w-3.5 h-3.5"></i><span>Pause</span>`;
    if (window.lucide) window.lucide.createIcons();

    // Clear previous highlights
    events.forEach((_, idx) => {
      const el = document.getElementById(`journey-step-${idx}`);
      if (el) el.className = 'p-3 rounded-xl border border-slate-200 transition-all duration-300';
    });

    state.journeyTimer = setInterval(() => {
      if (state.journeyCurrentIndex >= events.length) {
        clearInterval(state.journeyTimer);
        state.journeyTimer = null;
        document.getElementById('journey-play-btn').innerHTML = `<i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i><span>Replay</span>`;
        if (window.lucide) window.lucide.createIcons();
        return;
      }

      const activeEl = document.getElementById(`journey-step-${state.journeyCurrentIndex}`);
      if (activeEl) {
        activeEl.className = 'p-3 rounded-xl border border-emerald-500 bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/20 transform scale-105 transition-all duration-300';
      }

      state.journeyCurrentIndex++;
    }, 1100);
  }

  function resetJourneyReplay() {
    if (state.journeyTimer) {
      clearInterval(state.journeyTimer);
      state.journeyTimer = null;
    }
    state.journeyCurrentIndex = 0;
    const batches = state.data.batches || [];
    const activeBatch = batches.find(b => b.id === state.currentBatchId) || batches[0];
    (activeBatch.timelineEvents || []).forEach((_, idx) => {
      const el = document.getElementById(`journey-step-${idx}`);
      if (el) el.className = 'p-3 rounded-xl border border-slate-200 transition-all duration-300';
    });
    const btn = document.getElementById('journey-play-btn');
    if (btn) btn.innerHTML = `<i data-lucide="play" class="w-3.5 h-3.5"></i><span>Play Replay</span>`;
    if (window.lucide) window.lucide.createIcons();
  }

  // --- 12. CONSUMER SCAN PAGE ---
  function renderConsumer(container) {
    const batches = state.data.batches || [];
    const batch = batches.find(b => b.id === state.currentBatchId) || batches[0];

    container.innerHTML = `
      <div class="max-w-md mx-auto space-y-5 pb-12">
        <div class="text-center space-y-1">
          <div class="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider">
            <span>Verified Citizen Produce Passport</span>
          </div>
          <h2 class="text-xl font-extrabold text-slate-900">Food Safety Verification</h2>
          <p class="text-xs text-slate-500">Scan result for supermarket customer</p>
        </div>

        <div class="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-6 space-y-5">
          <div class="flex items-center space-x-4 border-b border-slate-100 pb-4">
            <div class="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-3xl shadow-sm">
              🥗
            </div>
            <div>
              <h3 class="font-extrabold text-lg text-slate-900">${batch.crop}</h3>
              <p class="text-xs text-slate-500">${batch.variety} • <span class="font-mono text-emerald-700">${batch.id}</span></p>
            </div>
          </div>

          <div class="space-y-3 text-xs">
            <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50">
              <span class="text-slate-500">Farm of Origin</span>
              <span class="font-bold text-slate-900">${batch.farmName}</span>
            </div>
            <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50">
              <span class="text-slate-500">Harvest Region</span>
              <span class="font-bold text-slate-900">${batch.region}</span>
            </div>
            <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50">
              <span class="text-slate-500">Harvest Date</span>
              <span class="font-bold font-mono text-slate-900">${batch.harvestDate ? batch.harvestDate.slice(0, 10) : ''}</span>
            </div>
            <div class="flex items-center justify-between p-3 rounded-xl ${batch.recallStatus === 'RECALLED' ? 'bg-rose-50 text-rose-900 border border-rose-200' : 'bg-emerald-50 text-emerald-900 border border-emerald-200'}">
              <span class="font-semibold">Safety Status</span>
              <span class="font-extrabold">${batch.recallStatus === 'RECALLED' ? 'DO NOT CONSUME - RECALLED' : 'PASSED FOOD SAFETY CHECKS'}</span>
            </div>
          </div>

          <div class="space-y-2">
            <h4 class="font-bold text-xs text-slate-800 uppercase tracking-wider">Custody Milestones</h4>
            <div class="space-y-2 text-xs">
              ${(batch.timelineEvents || []).map(ev => `
                <div class="flex items-start space-x-2.5 p-2.5 rounded-lg border border-slate-100">
                  <div class="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></div>
                  <div>
                    <div class="font-bold text-slate-900 text-[11px]">${ev.type}</div>
                    <div class="text-[10px] text-slate-500">${ev.details}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="p-3 rounded-xl bg-slate-50 text-[10px] text-slate-400 text-center">
            Private logistics telemetry and commercial pricing are cryptographically shielded to protect smallholder farmers.
          </div>
        </div>
      </div>
    `;
  }

  // --- 13. FARMER DIGITAL CREDIBILITY ---
  function renderFarmer(container) {
    const farms = state.data.farms || [];
    const leadFarm = farms[0];

    container.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-6">
        <div class="bg-gradient-to-r from-emerald-900 via-forest-800 to-slate-900 text-white p-6 rounded-2xl border border-emerald-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div class="flex items-center space-x-4">
            <div class="text-4xl p-2 bg-emerald-500/20 rounded-2xl border border-emerald-400/30">👨‍🌾</div>
            <div>
              <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider mb-1">
                <span>Verified AP Agri Farmer</span>
              </div>
              <h2 class="text-2xl font-extrabold text-white">Ramesh Naidu</h2>
              <p class="text-xs text-emerald-100 font-mono">${leadFarm.name} • ${leadFarm.region}</p>
            </div>
          </div>
          <div class="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 text-center">
            <div class="text-[10px] uppercase font-bold text-emerald-200">Record Reliability Indicator</div>
            <div class="text-3xl font-extrabold text-white mt-0.5 font-mono">96 / 100</div>
            <div class="text-[10px] text-emerald-300 font-semibold">Tier 1 Credibility Score</div>
          </div>
        </div>

        <!-- Credibility Rules Transparency Disclosure -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 class="font-bold text-xs text-slate-900 uppercase tracking-wider">How Record Reliability is Computed</h3>
          <p class="text-xs text-slate-600 leading-relaxed">
            The Record Reliability Indicator is calculated transparently from verifiable data compliance rules, including: timely harvest timestamp logging (+30 pts), complete laboratory quality test attachments (+35 pts), tamper-seal compliance during transporter handoff (+20 pts), and zero unresolved audit contradictions (+15 pts). It does not substitute for official FSSAI licensing.
          </p>
        </div>

        <!-- Registered Plots & Batches -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 class="font-bold text-xs text-slate-900">Registered Farm Plot Parameters</h3>
            <div class="space-y-2 text-xs text-slate-700">
              <div class="flex justify-between border-b border-slate-100 pb-1">
                <span class="text-slate-500">Total Cultivated Area:</span>
                <span class="font-bold">${leadFarm.areaAcres} Acres</span>
              </div>
              <div class="flex justify-between border-b border-slate-100 pb-1">
                <span class="text-slate-500">GPS Coordinates:</span>
                <span class="font-mono text-slate-800">${leadFarm.coordinates}</span>
              </div>
              <div class="flex justify-between border-b border-slate-100 pb-1">
                <span class="text-slate-500">Soil Health Assay:</span>
                <span class="font-bold text-emerald-700">${leadFarm.soilHealthScore}</span>
              </div>
              <div class="flex justify-between border-b border-slate-100 pb-1">
                <span class="text-slate-500">Certifications:</span>
                <span class="font-semibold text-slate-800">${leadFarm.certifications.join(', ')}</span>
              </div>
            </div>
          </div>

          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 class="font-bold text-xs text-slate-900">Credibility Performance Factors</h3>
            <div class="space-y-2 text-xs">
              <div class="space-y-1">
                <div class="flex justify-between text-slate-700">
                  <span>Harvest Timestamp Accuracy</span>
                  <span class="font-bold font-mono text-emerald-700">98%</span>
                </div>
                <div class="w-full bg-slate-200 rounded-full h-1.5"><div class="bg-emerald-500 h-1.5 rounded-full" style="width: 98%"></div></div>
              </div>
              <div class="space-y-1">
                <div class="flex justify-between text-slate-700">
                  <span>Mandatory Lab Certificate Attachment</span>
                  <span class="font-bold font-mono text-emerald-700">95%</span>
                </div>
                <div class="w-full bg-slate-200 rounded-full h-1.5"><div class="bg-emerald-500 h-1.5 rounded-full" style="width: 95%"></div></div>
              </div>
              <div class="space-y-1">
                <div class="flex justify-between text-slate-700">
                  <span>Resolved vs Open Audit Enquiries</span>
                  <span class="font-bold font-mono text-emerald-700">100%</span>
                </div>
                <div class="w-full bg-slate-200 rounded-full h-1.5"><div class="bg-emerald-500 h-1.5 rounded-full" style="width: 100%"></div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // --- 14. REPORTS & EXPORTS ---
  function renderReports(container) {
    container.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-6">
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 class="text-lg font-bold text-slate-900">Analytics & Forensic Export Centre</h2>
          <p class="text-xs text-slate-500">Download structured CSV datasets and certified incident dossiers</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <i data-lucide="boxes" class="w-5 h-5"></i>
            </div>
            <h3 class="font-bold text-slate-900 text-sm">Produce Batches CSV</h3>
            <p class="text-xs text-slate-500">All registered harvests, GPS plots, quantities, and integrity ratings.</p>
            <a href="/api/reports/export/csv?type=batches" class="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition">
              <i data-lucide="download" class="w-3.5 h-3.5"></i>
              <span>Export Batches CSV</span>
            </a>
          </div>

          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div class="w-10 h-10 rounded-xl bg-orange-100 text-orange-800 flex items-center justify-center">
              <i data-lucide="truck" class="w-5 h-5"></i>
            </div>
            <h3 class="font-bold text-slate-900 text-sm">Transfers & Handoffs CSV</h3>
            <p class="text-xs text-slate-500">Full vehicle dispatch records, received weights, and transit conditions.</p>
            <a href="/api/reports/export/csv?type=transfers" class="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition">
              <i data-lucide="download" class="w-3.5 h-3.5"></i>
              <span>Export Transfers CSV</span>
            </a>
          </div>

          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div class="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <i data-lucide="alert-triangle" class="w-5 h-5"></i>
            </div>
            <h3 class="font-bold text-slate-900 text-sm">AI Detective Anomalies CSV</h3>
            <p class="text-xs text-slate-500">Flagged temporal contradictions, thermal spikes, and weighbridge variances.</p>
            <a href="/api/reports/export/csv?type=anomalies" class="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition">
              <i data-lucide="download" class="w-3.5 h-3.5"></i>
              <span>Export Anomalies CSV</span>
            </a>
          </div>

          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div class="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center">
              <i data-lucide="alert-octagon" class="w-5 h-5"></i>
            </div>
            <h3 class="font-bold text-slate-900 text-sm">Recalls & Quarantines CSV</h3>
            <p class="text-xs text-slate-500">Mandatory food safety recall logs, isolated destinations, and timestamps.</p>
            <a href="/api/reports/export/csv?type=recalls" class="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition">
              <i data-lucide="download" class="w-3.5 h-3.5"></i>
              <span>Export Recalls CSV</span>
            </a>
          </div>
        </div>
      </div>
    `;
  }

  // --- 15. SYSTEM SETTINGS & AUDIT LOG ---
  function renderSettings(container) {
    const logs = state.data.auditLogs || [];

    container.innerHTML = `
      <div class="max-w-7xl mx-auto space-y-6">
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <h2 class="text-lg font-bold text-slate-900">Immutable Audit Trail & System Configuration</h2>
            <p class="text-xs text-slate-500">Append-only administrative ledger verifying food safety events</p>
          </div>
          <button onclick="window.traceHarvest.resetDemoData()" class="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1">
            <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
            <span>Reset Demo Records</span>
          </button>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="p-4 border-b border-slate-100 font-bold text-xs text-slate-800">
            Cryptographic Audit Ledger
          </div>
          <div class="divide-y divide-slate-100 text-xs">
            ${logs.map(l => `
              <div class="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50">
                <div class="space-y-1">
                  <div class="flex items-center space-x-2">
                    <span class="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">${l.action}</span>
                    <span class="font-bold text-slate-900 text-xs">${l.actor}</span>
                    <span class="text-slate-400 font-mono text-[10px]">&rarr; ${l.target}</span>
                  </div>
                  <p class="text-slate-600 text-xs">${l.details}</p>
                </div>
                <div class="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                  ${l.timestamp ? l.timestamp.replace('T', ' ').slice(0, 19) : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // --- 16. ROLE-BASED LOGIN / WORKSPACE PORTAL ---
  function renderLogin(container) {
    const users = state.data.users || [];

    container.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-6 pb-12">
        <div class="text-center space-y-2">
          <div class="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider">
            <span>Role-Aware Access Portal</span>
          </div>
          <h2 class="text-2xl font-extrabold text-slate-900">Sign In to TraceHarvest AI</h2>
          <p class="text-xs text-slate-500 max-w-lg mx-auto">
            Choose a persona below to experience the platform from the perspective of a Farmer, Logistics Carrier, Warehouse Manager, Retailer, Food Safety Authority, or Citizen Consumer.
          </p>
        </div>

        <!-- 6 Dedicated Role Cards with 1-Click Fast Login -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          ${users.map(u => `
            <div class="bg-white rounded-2xl border ${state.currentUser && state.currentUser.id === u.id ? 'border-emerald-500 ring-2 ring-emerald-500/30' : 'border-slate-200'} p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-3xl p-2 bg-slate-50 rounded-xl">${u.avatar}</span>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">${u.role}</span>
                </div>
                <h3 class="font-bold text-sm text-slate-900">${u.name}</h3>
                <p class="text-xs text-slate-600 font-medium">${u.organization}</p>
                <p class="text-[11px] text-slate-400">${u.location}</p>
                <div class="text-[11px] font-mono text-slate-500 bg-slate-50 p-2 rounded-lg">
                  ${u.email}
                </div>
              </div>

              <button onclick="window.traceHarvest.handleQuickLogin('${u.email}')" class="w-full py-2.5 rounded-xl ${state.currentUser && state.currentUser.id === u.id ? 'bg-emerald-600 text-white' : 'bg-slate-900 hover:bg-slate-800 text-emerald-400'} font-bold text-xs flex items-center justify-center gap-1.5 transition shadow">
                <i data-lucide="log-in" class="w-3.5 h-3.5"></i>
                <span>${state.currentUser && state.currentUser.id === u.id ? 'Active Session' : 'Sign In as ' + u.role}</span>
              </button>
            </div>
          `).join('')}
        </div>

        <!-- Or custom credential sign-in form -->
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-md mx-auto space-y-4">
          <h3 class="font-bold text-xs text-slate-800 uppercase tracking-wider text-center">Custom Credential Login</h3>
          <form onsubmit="window.traceHarvest.handleFormLogin(event)" class="space-y-3 text-xs">
            <div>
              <label class="block text-slate-600 mb-1">Email Address:</label>
              <input type="email" id="custom-login-email" required placeholder="admin@traceharvest.ai" class="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 text-slate-800">
            </div>
            <div>
              <label class="block text-slate-600 mb-1">Password:</label>
              <input type="password" id="custom-login-pass" value="demo123" class="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 text-slate-800">
            </div>
            <button type="submit" class="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow flex items-center justify-center gap-1.5">
              <span>Authenticate & Enter Workspace</span>
            </button>
          </form>
        </div>
      </div>
    `;
  }

  // --- MODALS & WORKFLOW CONTROLLERS ---
  function openCreateBatchModal() {
    const modal = document.getElementById('global-modal');
    const content = document.getElementById('modal-content');
    const farms = state.data.farms || [];

    content.innerHTML = `
      <div class="p-6 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 class="font-bold text-sm text-slate-900">Register New Harvest Batch</h3>
          <button onclick="window.traceHarvest.closeModal()" class="text-slate-400 hover:text-slate-600 text-base">✕</button>
        </div>

        <form onsubmit="window.traceHarvest.handleCreateBatch(event)" class="space-y-3 text-xs">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-600 mb-1">Crop Type:</label>
              <input type="text" id="batch-crop" required placeholder="e.g. Roma Tomatoes" class="w-full border border-slate-300 rounded-lg p-2">
            </div>
            <div>
              <label class="block text-slate-600 mb-1">Crop Variety:</label>
              <input type="text" id="batch-variety" required placeholder="e.g. Hybrid S-22" class="w-full border border-slate-300 rounded-lg p-2">
            </div>
          </div>

          <div>
            <label class="block text-slate-600 mb-1">Origin Registered Farm:</label>
            <select id="batch-farm" class="w-full border border-slate-300 rounded-lg p-2">
              ${farms.map(f => `<option value="${f.id}">${f.name} (${f.region})</option>`).join('')}
            </select>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-600 mb-1">Harvest Date & Time:</label>
              <input type="datetime-local" id="batch-date" required value="${new Date().toISOString().slice(0, 16)}" class="w-full border border-slate-300 rounded-lg p-2">
            </div>
            <div>
              <label class="block text-slate-600 mb-1">Harvest Quantity (kg):</label>
              <input type="number" id="batch-qty" required min="1" step="10" value="2000" class="w-full border border-slate-300 rounded-lg p-2">
            </div>
          </div>

          <div>
            <label class="block text-slate-600 mb-1">Plot Notes & Washing Details:</label>
            <textarea id="batch-notes" rows="2" placeholder="Harvested at morning dew, packed into sanitized RFID crates." class="w-full border border-slate-300 rounded-lg p-2"></textarea>
          </div>

          <div class="pt-2 flex justify-end space-x-2">
            <button type="button" onclick="window.traceHarvest.closeModal()" class="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold">Cancel</button>
            <button type="submit" class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow">Mint Digital Passport</button>
          </div>
        </form>
      </div>
    `;
    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  async function handleCreateBatch(e) {
    e.preventDefault();
    const crop = document.getElementById('batch-crop').value;
    const variety = document.getElementById('batch-variety').value;
    const farmId = document.getElementById('batch-farm').value;
    const harvestDate = document.getElementById('batch-date').value;
    const quantityKg = parseFloat(document.getElementById('batch-qty').value);
    const notes = document.getElementById('batch-notes').value;

    const farm = (state.data.farms || []).find(f => f.id === farmId);
    const region = farm ? farm.region : 'Andhra Pradesh';

    try {
      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crop, variety, farmId, region, harvestDate, quantityKg, notes })
      });
      if (!res.ok) throw new Error('Failed to create batch');
      const newBatch = await res.json();
      closeModal();
      showToast(`Batch ${newBatch.id} minted with Digital Passport!`, 'success');
      await fetchData();
      state.currentBatchId = newBatch.id;
      window.location.hash = '#passport';
    } catch (err) {
      showToast('Error registering batch', 'error');
    }
  }

  function openCreateTransferModal() {
    const modal = document.getElementById('global-modal');
    const content = document.getElementById('modal-content');
    const batches = state.data.batches || [];

    content.innerHTML = `
      <div class="p-6 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 class="font-bold text-sm text-slate-900">Record Chain of Custody Transfer</h3>
          <button onclick="window.traceHarvest.closeModal()" class="text-slate-400 hover:text-slate-600 text-base">✕</button>
        </div>

        <form onsubmit="window.traceHarvest.handleCreateTransfer(event)" class="space-y-3 text-xs">
          <div>
            <label class="block text-slate-600 mb-1">Select Batch:</label>
            <select id="tr-batch-id" class="w-full border border-slate-300 rounded-lg p-2 font-mono">
              ${batches.map(b => `
                <option value="${b.id}" ${b.recallStatus === 'RECALLED' ? 'class="text-rose-600 font-bold"' : ''}>
                  ${b.id} - ${b.crop} ${b.recallStatus === 'RECALLED' ? '(RECALLED - LOCKED)' : ''}
                </option>
              `).join('')}
            </select>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-600 mb-1">From Location:</label>
              <input type="text" id="tr-from" required value="Sri Krishna Agri Farms, Tenali" class="w-full border border-slate-300 rounded-lg p-2">
            </div>
            <div>
              <label class="block text-slate-600 mb-1">To Destination:</label>
              <input type="text" id="tr-to" required value="Guntur Central Cold Hub" class="w-full border border-slate-300 rounded-lg p-2">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-600 mb-1">Dispatched Qty (kg):</label>
              <input type="number" id="tr-dispatch-qty" required value="1500" class="w-full border border-slate-300 rounded-lg p-2 font-mono">
            </div>
            <div>
              <label class="block text-slate-600 mb-1">Received Weighment (kg):</label>
              <input type="number" id="tr-received-qty" value="1500" class="w-full border border-slate-300 rounded-lg p-2 font-mono">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-600 mb-1">Carrier Transporter:</label>
              <input type="text" id="tr-carrier" value="FastTrack ColdTrans AP" class="w-full border border-slate-300 rounded-lg p-2">
            </div>
            <div>
              <label class="block text-slate-600 mb-1">Vehicle Registration:</label>
              <input type="text" id="tr-vehicle" value="AP-07-TJ-4421" class="w-full border border-slate-300 rounded-lg p-2 font-mono">
            </div>
          </div>

          <div>
            <label class="block text-slate-600 mb-1">Transit Condition:</label>
            <input type="text" id="tr-condition" value="Chilled Reefer 8.0°C" class="w-full border border-slate-300 rounded-lg p-2">
          </div>

          <div class="pt-2 flex justify-end space-x-2">
            <button type="button" onclick="window.traceHarvest.closeModal()" class="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold">Cancel</button>
            <button type="submit" class="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow">Record Transfer</button>
          </div>
        </form>
      </div>
    `;
    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  async function handleCreateTransfer(e) {
    e.preventDefault();
    const batchId = document.getElementById('tr-batch-id').value;
    const fromLocation = document.getElementById('tr-from').value;
    const toLocation = document.getElementById('tr-to').value;
    const dispatchedQuantityKg = parseFloat(document.getElementById('tr-dispatch-qty').value);
    const receivedQuantityKg = parseFloat(document.getElementById('tr-received-qty').value);
    const transporter = document.getElementById('tr-carrier').value;
    const vehicleNo = document.getElementById('tr-vehicle').value;
    const condition = document.getElementById('tr-condition').value;

    try {
      const res = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId, fromLocation, toLocation, dispatchedQuantityKg, receivedQuantityKg, transporter, vehicleNo, condition })
      });
      if (!res.ok) {
        const errorData = await res.json();
        // Displays the 403 Security lock if recalled!
        showToast(errorData.detail || 'Transfer rejected by server-side policy', 'error');
        return;
      }
      closeModal();
      showToast('Transfer recorded successfully!', 'success');
      await fetchData();
      window.location.hash = '#transfers';
    } catch (err) {
      showToast('Error recording transfer', 'error');
    }
  }

  function openCreateInspectionModal() {
    const modal = document.getElementById('global-modal');
    const content = document.getElementById('modal-content');
    const batches = state.data.batches || [];

    content.innerHTML = `
      <div class="p-6 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 class="font-bold text-sm text-slate-900">Log Laboratory Quality Inspection</h3>
          <button onclick="window.traceHarvest.closeModal()" class="text-slate-400 hover:text-slate-600 text-base">✕</button>
        </div>

        <form onsubmit="window.traceHarvest.handleCreateInspection(event)" class="space-y-3 text-xs">
          <div>
            <label class="block text-slate-600 mb-1">Target Produce Batch:</label>
            <select id="insp-batch-id" class="w-full border border-slate-300 rounded-lg p-2 font-mono">
              ${batches.map(b => `<option value="${b.id}">${b.id} - ${b.crop}</option>`).join('')}
            </select>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-600 mb-1">Testing Authority / Lab:</label>
              <input type="text" id="insp-inspector" required value="Guntur Agri Quality Lab" class="w-full border border-slate-300 rounded-lg p-2">
            </div>
            <div>
              <label class="block text-slate-600 mb-1">Inspection Verdict:</label>
              <select id="insp-status" class="w-full border border-slate-300 rounded-lg p-2 font-bold">
                <option value="PASSED" class="text-emerald-700 font-bold">PASSED (Clean Bill)</option>
                <option value="FAILED" class="text-rose-700 font-bold">FAILED (Contamination/MRL Breach)</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-slate-600 mb-1">Document Reference / Certificate ID:</label>
            <input type="text" id="insp-doc" required value="LAB-GT-2026-904" class="w-full border border-slate-300 rounded-lg p-2 font-mono">
          </div>

          <div>
            <label class="block text-slate-600 mb-1">Forensic Chemical / Assay Notes:</label>
            <textarea id="insp-verdict" rows="2" class="w-full border border-slate-300 rounded-lg p-2">Sample compliant with FSSAI Section 4.2 standards.</textarea>
          </div>

          <div class="pt-2 flex justify-end space-x-2">
            <button type="button" onclick="window.traceHarvest.closeModal()" class="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold">Cancel</button>
            <button type="submit" class="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow">Save Inspection</button>
          </div>
        </form>
      </div>
    `;
    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  async function handleCreateInspection(e) {
    e.preventDefault();
    const batchId = document.getElementById('insp-batch-id').value;
    const inspector = document.getElementById('insp-inspector').value;
    const status = document.getElementById('insp-status').value;
    const docReference = document.getElementById('insp-doc').value;
    const verdict = document.getElementById('insp-verdict').value;

    try {
      const res = await fetch('/api/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId, inspector, status, parameters: { brix: '5.4' }, docReference, verdict })
      });
      if (!res.ok) throw new Error('Inspection save failed');
      closeModal();
      showToast(`Inspection ${docReference} saved with status: ${status}`, status === 'PASSED' ? 'success' : 'error');
      await fetchData();
      window.location.hash = '#inspections';
    } catch (err) {
      showToast('Error saving inspection', 'error');
    }
  }

  function openInitiateRecallModal(preselectedBatchId = null) {
    const modal = document.getElementById('global-modal');
    const content = document.getElementById('modal-content');
    const batches = state.data.batches || [];

    content.innerHTML = `
      <div class="p-6 space-y-4">
        <div class="flex items-center justify-between border-b border-rose-100 pb-3">
          <div class="flex items-center space-x-2">
            <i data-lucide="alert-octagon" class="w-5 h-5 text-rose-600"></i>
            <h3 class="font-extrabold text-sm text-slate-900">Initiate Food Safety Recall Simulation</h3>
          </div>
          <button onclick="window.traceHarvest.closeModal()" class="text-slate-400 hover:text-slate-600 text-base">✕</button>
        </div>

        <p class="text-xs text-slate-600">
          Enacting a recall simulates tracing downstream deliveries in real time, calculating quarantine volumes, locking subsequent transfers, and notifying affected stakeholders.
        </p>

        <form onsubmit="window.traceHarvest.handleInitiateRecall(event)" class="space-y-3 text-xs">
          <div>
            <label class="block text-slate-600 mb-1">Select Batch Under Investigation:</label>
            <select id="recall-batch-id" class="w-full border border-slate-300 rounded-lg p-2 font-mono">
              ${batches.map(b => `
                <option value="${b.id}" ${b.id === (preselectedBatchId || state.currentBatchId) ? 'selected' : ''}>
                  ${b.id} - ${b.crop} (${b.farmName})
                </option>
              `).join('')}
            </select>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-600 mb-1">Hazard Classification:</label>
              <select id="recall-hazard" class="w-full border border-slate-300 rounded-lg p-2">
                <option value="Severe Organophosphate Chemical Residue">Severe Chemical Residue (Chlorpyrifos)</option>
                <option value="Microbial Pathogen (Salmonella enterica)">Microbial Pathogen (Salmonella)</option>
                <option value="Critical Cold-Chain Decomposition Spike">Critical Cold-Chain Excursion (&gt;18°C)</option>
              </select>
            </div>
            <div>
              <label class="block text-slate-600 mb-1">Recall Severity Tier:</label>
              <select id="recall-severity" class="w-full border border-slate-300 rounded-lg p-2 font-bold text-rose-700">
                <option value="Level 1 (Life-Threatening / Acute Toxicity)">Level 1 (Mandatory Quarantine)</option>
                <option value="Level 2 (Remote Adverse Health Impact)">Level 2 (Precautionary Hold)</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-slate-600 mb-1">Enacting Official:</label>
            <input type="text" id="recall-by" value="Dr. Aruna Reddy (Food Safety Admin)" class="w-full border border-slate-300 rounded-lg p-2">
          </div>

          <div>
            <label class="block text-slate-600 mb-1">Incident Justification Notes:</label>
            <textarea id="recall-notes" rows="2" class="w-full border border-slate-300 rounded-lg p-2">Emergency FSSAI containment protocol: Immediate retail quarantine order issued across Guntur and Visakhapatnam corridors.</textarea>
          </div>

          <div class="pt-2 flex justify-end space-x-2">
            <button type="button" onclick="window.traceHarvest.closeModal()" class="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold">Cancel</button>
            <button type="submit" class="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-950">Enforce Safety Recall</button>
          </div>
        </form>
      </div>
    `;
    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  async function handleInitiateRecall(e) {
    e.preventDefault();
    const batchId = document.getElementById('recall-batch-id').value;
    const hazardType = document.getElementById('recall-hazard').value;
    const severity = document.getElementById('recall-severity').value;
    const initiatedBy = document.getElementById('recall-by').value;
    const notes = document.getElementById('recall-notes').value;

    try {
      const res = await fetch('/api/recall/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId, hazardType, severity, initiatedBy, notes })
      });
      if (!res.ok) throw new Error('Recall initiation failed');
      const rec = await res.json();
      closeModal();
      showToast(`MANDATORY RECALL ENFORCED on ${batchId}. All downstream transfers locked!`, 'error');
      await fetchData();
      updateRecallsBadge();
      window.location.hash = '#recall';
    } catch (err) {
      showToast('Error initiating recall', 'error');
    }
  }

  function openAcknowledgeModal(recallId, stakeholder) {
    const modal = document.getElementById('global-modal');
    const content = document.getElementById('modal-content');

    content.innerHTML = `
      <div class="p-6 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 class="font-bold text-sm text-slate-900">Acknowledge Quarantine Notice</h3>
          <button onclick="window.traceHarvest.closeModal()" class="text-slate-400 hover:text-slate-600 text-base">✕</button>
        </div>

        <form onsubmit="window.traceHarvest.handleAcknowledgeRecall(event, '${recallId}', '${stakeholder}')" class="space-y-3 text-xs">
          <div>
            <label class="block text-slate-600 mb-1">Facility:</label>
            <input type="text" disabled value="${stakeholder}" class="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 font-bold">
          </div>

          <div>
            <label class="block text-slate-600 mb-1">Authorized Person Name:</label>
            <input type="text" id="ack-person" required value="${state.currentUser ? state.currentUser.name : 'Store Manager'}" class="w-full border border-slate-300 rounded-lg p-2">
          </div>

          <div>
            <label class="block text-slate-600 mb-1">Physical Quarantine Action Taken:</label>
            <textarea id="ack-action" rows="2" required class="w-full border border-slate-300 rounded-lg p-2">Produce physically removed from customer shelves, sealed in red hazard crate, and placed in locked storage.</textarea>
          </div>

          <div class="pt-2 flex justify-end space-x-2">
            <button type="button" onclick="window.traceHarvest.closeModal()" class="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold">Cancel</button>
            <button type="submit" class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow">Confirm Quarantine</button>
          </div>
        </form>
      </div>
    `;
    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  async function handleAcknowledgeRecall(e, recallId, stakeholder) {
    e.preventDefault();
    const acknowledgedBy = document.getElementById('ack-person').value;
    const correctiveAction = document.getElementById('ack-action').value;

    try {
      const res = await fetch('/api/recall/acknowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recallId, stakeholder, acknowledgedBy, correctiveAction })
      });
      if (!res.ok) throw new Error('Acknowledgment failed');
      closeModal();
      showToast(`Quarantine confirmed for ${stakeholder}!`, 'success');
      await fetchData();
      renderPage();
    } catch (err) {
      showToast('Error recording acknowledgment', 'error');
    }
  }

  async function generateIncidentReportModal(batchId) {
    let rep = null;
    try {
      const res = await fetch(`/api/reports/incident/${batchId}`);
      if (!res.ok) throw new Error('Failed to fetch incident report');
      rep = await res.json();
    } catch (e) {
      showToast('Could not fetch incident report', 'error');
      return;
    }

    const modal = document.getElementById('global-modal');
    const content = document.getElementById('modal-content');

    content.innerHTML = `
      <div id="printable-incident-modal" class="p-8 space-y-6 text-slate-900 bg-white">
        <div class="flex items-center justify-between border-b-2 border-slate-900 pb-4">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl">🌱</div>
            <div>
              <h2 class="font-extrabold text-base uppercase tracking-wider text-slate-900">TraceHarvest AI Investigation Dossier</h2>
              <p class="text-xs text-slate-500">Andhra Food Safety Authority (FSSAI Agri-Cell)</p>
            </div>
          </div>
          <div class="text-right">
            <div class="font-mono text-xs font-bold">${rep.reportId}</div>
            <div class="text-[10px] text-slate-500">${rep.generatedAt.slice(0, 19).replace('T', ' ')}</div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <div><strong>Batch ID:</strong> <span class="font-mono">${rep.targetBatch.id}</span></div>
            <div><strong>Produce / Crop:</strong> ${rep.targetBatch.crop} (${rep.targetBatch.variety})</div>
            <div><strong>Harvest Plot:</strong> ${rep.targetBatch.farmName}</div>
          </div>
          <div>
            <div><strong>Severity Assessment:</strong> <span class="font-bold text-rose-600">${rep.severity}</span></div>
            <div><strong>Risk Priority Score:</strong> <span class="font-mono font-bold">${rep.riskPriorityScore} / 100</span></div>
            <div><strong>Quarantine Status:</strong> <span class="font-bold">${rep.quarantineStatus}</span></div>
          </div>
        </div>

        <div class="space-y-2 text-xs">
          <h4 class="font-bold uppercase tracking-wider text-[11px] text-slate-700">Forensic Trigger Evidence</h4>
          <div class="space-y-1.5">
            ${rep.triggeringEvidence.map(ev => `
              <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <span class="font-bold">${ev.type}:</span> ${ev.label} &mdash; <span class="italic text-slate-600">${ev.detail}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="space-y-2 text-xs">
          <h4 class="font-bold uppercase tracking-wider text-[11px] text-slate-700">Traceable Downstream Exposure</h4>
          <div class="space-y-1">
            ${rep.connectedDownstreamDestinations.map(d => `
              <div class="flex items-center justify-between p-2 rounded bg-slate-50 text-[11px]">
                <span><strong>${d.name}</strong> (${d.type})</span>
                <span class="font-mono text-slate-700">${d.receivedKg} kg (${d.status})</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="space-y-2 text-xs">
          <h4 class="font-bold uppercase tracking-wider text-[11px] text-slate-700">Mandatory Corrective Action Directive</h4>
          <ul class="list-disc pl-5 space-y-1 text-slate-700 text-xs">
            ${rep.recommendedActions.map(a => `<li>${a}</li>`).join('')}
          </ul>
        </div>

        <div class="text-[10px] text-slate-500 italic border-t border-slate-200 pt-3">
          ${rep.disclaimer}
        </div>

        <div class="flex justify-end space-x-2 pt-4 border-t border-slate-200 no-print">
          <button onclick="window.print()" class="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1 transition">
            <i data-lucide="printer" class="w-3.5 h-3.5"></i>
            <span>Print Forensic PDF</span>
          </button>
          <button onclick="window.traceHarvest.closeModal()" class="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs">
            Close
          </button>
        </div>
      </div>
    `;
    modal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  function closeModal() {
    const modal = document.getElementById('global-modal');
    if (modal) modal.classList.add('hidden');
  }

  // --- SIGNATURE WORKFLOW: TREND TO BULL'S-EYE TO RECALL DEMO ---
  function investigatePattern(patternId) {
    if (!state.trendsData || !state.trendsData.patterns) return;
    const pat = state.trendsData.patterns.find(p => p.id === patternId);
    if (!pat) return;

    state.currentBatchId = pat.targetBatchId;
    window.location.hash = '#bullseye';
    showToast(`Bull's-Eye target locked on ${pat.targetBatchId} (${pat.title})`, 'info');
  }

  function startIntelligenceDemoFlow() {
    state.demoStep = 1;
    updateDemoTourUI();
  }

  function nextDemoStep() {
    state.demoStep = (state.demoStep % 5) + 1;
    updateDemoTourUI();
  }

  function updateDemoTourUI() {
    const bar = document.getElementById('demo-step-text');
    const btn = document.getElementById('demo-next-btn');

    if (state.demoStep === 1) {
      if (bar) bar.innerHTML = `<strong>Step 1 of 5:</strong> Trend Intelligence detects recurring thermal excursions on route NH-16 (Guava harvest).`;
      if (btn) btn.innerHTML = `<span>Step 2 &rarr; Bull's-Eye</span>`;
      window.location.hash = '#trends';
    } else if (state.demoStep === 2) {
      state.currentBatchId = 'TH-GVA-2026-095';
      if (bar) bar.innerHTML = `<strong>Step 2 of 5:</strong> Bull's-Eye Radial Target isolates 18.5°C sensor breach and traces downstream exposure.`;
      if (btn) btn.innerHTML = `<span>Step 3 &rarr; Safety Recall</span>`;
      window.location.hash = '#bullseye';
    } else if (state.demoStep === 3) {
      if (bar) bar.innerHTML = `<strong>Step 3 of 5:</strong> Recall Command Centre enacts quarantine and locks further movement.`;
      if (btn) btn.innerHTML = `<span>Step 4 &rarr; Retail Quarantine</span>`;
      window.location.hash = '#recall';
    } else if (state.demoStep === 4) {
      if (bar) bar.innerHTML = `<strong>Step 4 of 5:</strong> Downstream supermarket verifies and acknowledges physical stock isolation.`;
      if (btn) btn.innerHTML = `<span>Step 5 &rarr; Incident Report</span>`;
      window.location.hash = '#recall';
      showToast('Rythu Bazaar Superstore acknowledged: 700 kg isolated to HazMat disposal crate.', 'success');
    } else if (state.demoStep === 5) {
      if (bar) bar.innerHTML = `<strong>Step 5 of 5:</strong> Complete forensic incident dossier generated with cryptographically timestamped trail.`;
      if (btn) btn.innerHTML = `<span>Restart Tour</span>`;
      generateIncidentReportModal('TH-PLK-2026-019');
    }
  }

  async function resetDemoData() {
    try {
      const res = await fetch('/api/demo/reset', { method: 'POST' });
      if (!res.ok) throw new Error('Reset failed');
      showToast('Prototype data restored to pristine Andhra Pradesh demo baseline.', 'success');
      await fetchData();
      renderPage();
      updateRecallsBadge();
    } catch (e) {
      showToast('Error resetting demo baseline', 'error');
    }
  }

  function handleQuickLogin(email) {
    const user = (state.data.users || []).find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      saveUser(user);
      window.location.hash = '#dashboard';
    }
  }

  async function handleFormLogin(e) {
    e.preventDefault();
    const email = document.getElementById('custom-login-email').value;
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (!res.ok) throw new Error('Login failed');
      const data = await res.json();
      saveUser(data.user);
      window.location.hash = '#dashboard';
    } catch (err) {
      showToast('Error during authentication', 'error');
    }
  }

  function openPassport(batchId) {
    state.currentBatchId = batchId;
    window.location.hash = '#passport';
  }

  function openBullseyeForBatch(batchId) {
    state.currentBatchId = batchId;
    window.location.hash = '#bullseye';
  }

  function openRecallForBatch(batchId) {
    state.currentBatchId = batchId;
    window.location.hash = '#recall';
  }

  // Export globally to window.traceHarvest
  window.traceHarvest = {
    init,
    switchUserRole,
    filterDashboardBatches,
    openPassport,
    openBullseyeForBatch,
    openRecallForBatch,
    openCreateBatchModal,
    handleCreateBatch,
    openCreateTransferModal,
    handleCreateTransfer,
    openCreateInspectionModal,
    handleCreateInspection,
    openInitiateRecallModal,
    handleInitiateRecall,
    openAcknowledgeModal,
    handleAcknowledgeRecall,
    generateIncidentReportModal,
    closeModal,
    investigatePattern,
    handleSimulateExcursion,
    startIntelligenceDemoFlow,
    nextDemoStep,
    launchGuidedDemo: startIntelligenceDemoFlow,
    resetDemoData,
    playJourneyReplay,
    resetJourneyReplay,
    handleQuickLogin,
    handleFormLogin
  };

  // Run on DOM loaded
  document.addEventListener('DOMContentLoaded', init);
})();
