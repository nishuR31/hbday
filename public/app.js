/**
 * HBday Frontend Client Application
 * Features Lucide SVG icons, responsive layout, stackable animated toasts, and celebration particles.
 */

// Immediate Hard-Reset of any lingering Developer Mode flag in browser storage
try {
  localStorage.removeItem('hbday_dev_mode');
  sessionStorage.removeItem('hbday_dev_mode');
  if (document.body) {
    document.body.classList.remove('dev-mode-active');
  }
} catch (e) {}

// Global State
const state = {
  contacts: [],
  todayBirthdays: [],
  logs: [],
  stats: null,
  activeTab: 'upcoming',
  searchTerm: '',
  zodiacFilter: 'all',
  editingContactId: null,
};

// API Base URL
const API_BASE = '/api/v1';

// DOM Elements
const els = {
  // Stat values
  valTotal: document.getElementById('val-total-contacts'),
  valToday: document.getElementById('val-today-birthdays'),
  valUpcoming: document.getElementById('val-upcoming-birthdays'),
  valLogs: document.getElementById('val-emails-dispatched'),
  valQueueStatus: document.getElementById('val-queue-status'),
  valDatabaseStatus: document.getElementById('val-database-status'),
  subToday: document.getElementById('sub-today-status'),
  subMailer: document.getElementById('sub-mailer-status'),
  subQueueDetail: document.getElementById('sub-queue-detail'),
  subDatabaseDetail: document.getElementById('sub-database-detail'),
  allCountBadge: document.getElementById('all-count-badge'),
  logsCountBadge: document.getElementById('logs-count-badge'),
  serverStatusPill: document.getElementById('server-status-pill'),
  serverStatusText: document.getElementById('server-status-text'),
  queueStatusPill: document.getElementById('queue-status-pill'),
  queueStatusText: document.getElementById('queue-status-text'),
  quotaStatusPill: document.getElementById('quota-status-pill'),
  quotaStatusText: document.getElementById('quota-status-text'),

  // Today Banner
  todayBanner: document.getElementById('today-celebration-banner'),
  todayBannerNames: document.getElementById('today-banner-names'),
  btnCelebrateBurst: document.getElementById('btn-celebrate-burst'),

  // Tabs
  tabBtns: document.querySelectorAll('.tab-btn'),
  tabPanels: document.querySelectorAll('.tab-panel'),

  // Containers
  upcomingList: document.getElementById('upcoming-list'),
  contactsTableBody: document.getElementById('contacts-table-body'),
  logsTableBody: document.getElementById('logs-table-body'),

  // Toolbar
  inputSearch: document.getElementById('input-search'),
  selectZodiacFilter: document.getElementById('select-zodiac-filter'),
  btnRefresh: document.getElementById('btn-refresh'),

  // Modals
  modalBirthday: document.getElementById('modal-birthday'),
  modalTestMail: document.getElementById('modal-test-mail'),
  formBirthday: document.getElementById('form-birthday'),
  formTestMail: document.getElementById('form-test-mail'),
  btnOpenAdd: document.getElementById('btn-open-add'),
  btnCloseModal: document.getElementById('btn-close-modal'),
  btnCancelModal: document.getElementById('btn-cancel-modal'),
  modalBirthdayTitle: document.getElementById('modal-birthday-title'),
  inputContactId: document.getElementById('input-contact-id'),
  inputName: document.getElementById('input-name'),
  inputEmail: document.getElementById('input-email'),
  inputDob: document.getElementById('input-dob'),
  inputUntilYear: document.getElementById('input-until-year'),
  errName: document.getElementById('err-name'),
  errEmail: document.getElementById('err-email'),
  errDob: document.getElementById('err-dob'),
  errUntilYear: document.getElementById('err-until-year'),
  modalQuotaNotice: document.getElementById('modal-quota-notice'),
  modalQuotaText: document.getElementById('modal-quota-text'),
  btnSaveContact: document.getElementById('btn-save-contact'),

  // Quick Action Buttons
  btnQuickTest: document.getElementById('btn-quick-test'),
  btnCloseTestModal: document.getElementById('btn-close-test-modal'),
  btnCancelTestModal: document.getElementById('btn-cancel-test-modal'),
  inputTestName: document.getElementById('input-test-name'),
  inputTestEmail: document.getElementById('input-test-email'),
  errTestEmail: document.getElementById('err-test-email'),
  btnTriggerCheck: document.getElementById('btn-trigger-check'),
  btnClearLogs: document.getElementById('btn-clear-logs'),

  // Direct Header Passkey Input & Controls
  headerPasskeyInput: document.getElementById('header-passkey-input'),
  btnApplyHeaderPasskey: document.getElementById('btn-apply-header-passkey'),
  btnHeaderNewPasskey: document.getElementById('btn-header-new-passkey'),

  // Passkey & Identity Elements
  btnCopyPasskey: document.getElementById('btn-copy-passkey'),
  btnOpenPasskey: document.getElementById('btn-open-passkey'),
  modalPasskey: document.getElementById('modal-passkey'),
  btnClosePasskeyModal: document.getElementById('btn-close-passkey-modal'),
  btnClosePasskeyBtn: document.getElementById('btn-close-passkey-btn'),
  inputCurrentPasskey: document.getElementById('input-current-passkey'),
  btnModalCopyPasskey: document.getElementById('btn-modal-copy-passkey'),
  inputRestorePasskey: document.getElementById('input-restore-passkey'),
  errRestorePasskey: document.getElementById('err-restore-passkey'),
  btnApplyPasskey: document.getElementById('btn-apply-passkey'),
  btnGenerateNewPasskey: document.getElementById('btn-generate-new-passkey'),

  // Privacy & Disclaimer Elements
  btnOpenPrivacy: document.getElementById('btn-open-privacy'),
  modalPrivacyTerms: document.getElementById('modal-privacy-terms'),
  btnClosePrivacyModal: document.getElementById('btn-close-privacy-modal'),
  btnAcknowledgePrivacy: document.getElementById('btn-acknowledge-privacy'),

  // Studio Elements
  previewName: document.getElementById('preview-name'),
  previewEmail: document.getElementById('preview-email'),
  previewAge: document.getElementById('preview-age'),
  previewMessage: document.getElementById('preview-message'),
  btnSendPreviewTest: document.getElementById('btn-send-preview-test'),
  btnShuffleQuote: document.getElementById('btn-shuffle-quote'),
  emailPreviewFrame: document.getElementById('email-preview-frame'),

  // Sender Profile Elements
  btnOpenProfile: document.getElementById('btn-open-profile'),
  navProfileName: document.getElementById('nav-profile-name'),
  modalProfile: document.getElementById('modal-profile'),
  formSenderProfile: document.getElementById('form-sender-profile'),
  btnCloseProfileModal: document.getElementById('btn-close-profile-modal'),
  btnCancelProfileModal: document.getElementById('btn-cancel-profile-modal'),
  inputProfileSenderName: document.getElementById('input-profile-sender-name'),
  inputProfileSenderEmail: document.getElementById('input-profile-sender-email'),

  // DOB Live Preview
  dobCalcPreview: document.getElementById('dob-calc-preview'),

  // TOTP Elements
  btnToggleTotp: document.getElementById('btn-toggle-totp'),
  totpSecretDetails: document.getElementById('totp-secret-details'),
  inputTotpSecret: document.getElementById('input-totp-secret'),
  btnCopyTotpSecret: document.getElementById('btn-copy-totp-secret'),
  totpLiveCode: document.getElementById('totp-live-code'),

  // Toasts & Canvas
  toastContainer: document.getElementById('toast-container'),
  canvas: document.getElementById('confetti-canvas'),
};

/**
 * Safely refresh Lucide icons whenever DOM elements are injected
 */
const refreshIcons = () => {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
};

/* ==========================================================================
   PASSKEY & TOTP IDENTITY (ACCOUNT-LESS PRIVACY ISOLATION)
   ========================================================================== */
const PASSKEY_STORAGE_KEY = 'hbday_user_passkey';
const TOTP_SECRET_KEY = 'hbday_totp_secret';

const generatePasskey = () => {
  // Generate a clean, memorable 6-digit PIN so users don't have to remember long UIDs
  const randNum = Math.floor(100000 + Math.random() * 900000);
  return String(randNum);
};

const getOrInitPasskey = () => {
  let key = localStorage.getItem(PASSKEY_STORAGE_KEY);
  if (!key || typeof key !== 'string' || key.trim().length < 4) {
    key = generatePasskey();
    localStorage.setItem(PASSKEY_STORAGE_KEY, key);
  }
  return key;
};

let currentPasskey = getOrInitPasskey();

// Base32 & RFC 6238 TOTP Generator
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

const generateBase32Secret = (length = 16) => {
  let result = '';
  const randomBytes = crypto.getRandomValues(new Uint8Array(length));
  for (let i = 0; i < length; i++) {
    result += BASE32_CHARS[randomBytes[i] % 32];
  }
  return result;
};

const getOrInitTotpSecret = () => {
  let secret = localStorage.getItem(TOTP_SECRET_KEY);
  if (!secret || secret.length < 16) {
    secret = generateBase32Secret(16);
    localStorage.setItem(TOTP_SECRET_KEY, secret);
  }
  return secret;
};

const base32ToBytes = (base32) => {
  const clean = base32.toUpperCase().replace(/=+$/, '').replace(/[^A-Z2-7]/g, '');
  let bits = '';
  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_CHARS.indexOf(clean[i]);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return new Uint8Array(bytes);
};

const generateTOTPCode = async (base32Secret) => {
  try {
    const epoch = Math.floor(Date.now() / 1000);
    const counter = Math.floor(epoch / 30);
    const counterBuffer = new ArrayBuffer(8);
    const counterView = new DataView(counterBuffer);
    counterView.setUint32(4, counter, false); // big-endian 64-bit integer lower half

    const keyBytes = base32ToBytes(base32Secret);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'HMAC', hash: { name: 'SHA-1' } },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, counterBuffer);
    const sigBytes = new Uint8Array(signature);
    const offset = sigBytes[sigBytes.length - 1] & 0x0f;
    const binary =
      ((sigBytes[offset] & 0x7f) << 24) |
      ((sigBytes[offset + 1] & 0xff) << 16) |
      ((sigBytes[offset + 2] & 0xff) << 8) |
      (sigBytes[offset + 3] & 0xff);
    const otp = binary % 1000000;
    return String(otp).padStart(6, '0');
  } catch (e) {
    return '000000';
  }
};

let totpIntervalTimer = null;

const startTotpLiveTicker = () => {
  if (totpIntervalTimer) clearInterval(totpIntervalTimer);
  const secret = getOrInitTotpSecret();
  if (els.inputTotpSecret) els.inputTotpSecret.value = secret;

  const updateCode = async () => {
    const code = await generateTOTPCode(secret);
    if (els.totpLiveCode) {
      els.totpLiveCode.textContent = code;
    }
  };
  updateCode();
  totpIntervalTimer = setInterval(updateCode, 1000);
};

const updatePasskeyUI = () => {
  if (els.headerPasskeyInput) {
    els.headerPasskeyInput.value = currentPasskey;
  }
  if (els.inputCurrentPasskey) {
    els.inputCurrentPasskey.value = currentPasskey;
  }
};

/* ==========================================================================
   SENDER PROFILE (PERSONAL DISPLAY NAME & SENDER IDENTITY)
   ========================================================================== */
const SENDER_PROFILE_STORAGE_KEY = 'hbday_sender_profile';

const getSenderProfile = () => {
  try {
    const raw = localStorage.getItem(SENDER_PROFILE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveSenderProfile = (name, email) => {
  const profile = {
    name: (name || '').trim(),
    email: (email || '').trim()
  };
  localStorage.setItem(SENDER_PROFILE_STORAGE_KEY, JSON.stringify(profile));
  updateSenderProfileUI();
  return profile;
};

const updateSenderProfileUI = () => {
  const profile = getSenderProfile();
  if (els.navProfileName) {
    els.navProfileName.textContent = profile?.name ? profile.name : 'Sender Profile';
  }
  if (els.inputProfileSenderName && profile?.name) {
    els.inputProfileSenderName.value = profile.name;
  }
  if (els.inputProfileSenderEmail && profile?.email) {
    els.inputProfileSenderEmail.value = profile.email;
  }
};

const openProfileModal = () => {
  if (els.modalProfile) {
    const profile = getSenderProfile();
    if (els.inputProfileSenderName) {
      els.inputProfileSenderName.value = profile?.name || '';
    }
    if (els.inputProfileSenderEmail) {
      els.inputProfileSenderEmail.value = profile?.email || '';
    }
    const err = document.getElementById('err-profile-sender-name');
    if (err) err.textContent = '';
    if (typeof els.modalProfile.showModal === 'function') {
      els.modalProfile.showModal();
    } else {
      els.modalProfile.setAttribute('open', '');
    }
    refreshIcons();
  }
};

const closeProfileModal = () => {
  if (els.modalProfile) {
    if (typeof els.modalProfile.close === 'function') {
      els.modalProfile.close();
    } else {
      els.modalProfile.removeAttribute('open');
    }
  }
};

const applyHeaderPasskey = async () => {
  const entered = (els.headerPasskeyInput?.value || '').trim();
  if (!entered) {
    showToast('Please enter a passkey or PIN.', 'warning', 2500);
    return;
  }
  if (entered.length < 4) {
    showToast('Passkey must be at least 4 characters.', 'error', 3000);
    return;
  }
  if (entered === currentPasskey) {
    showToast('This passkey is already active.', 'info', 2000);
    return;
  }
  currentPasskey = entered;
  localStorage.setItem(PASSKEY_STORAGE_KEY, currentPasskey);
  updatePasskeyUI();
  showToast(`Switched passkey! Loading birthdays...`, 'success', 3000);
  await loadAllData();
};

const copyPasskeyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(currentPasskey);
    showToast('Passkey copied to clipboard! Keep it safe.', 'success', 3000);
  } catch {
    const tmp = document.createElement('input');
    tmp.value = currentPasskey;
    document.body.appendChild(tmp);
    tmp.select();
    document.execCommand('copy');
    document.body.removeChild(tmp);
    showToast('Passkey copied to clipboard!', 'success', 3000);
  }
};

const openPasskeyModal = () => {
  if (els.modalPasskey) {
    if (els.inputRestorePasskey) els.inputRestorePasskey.value = '';
    if (els.errRestorePasskey) els.errRestorePasskey.textContent = '';
    updatePasskeyUI();
    startTotpLiveTicker();
    if (typeof els.modalPasskey.showModal === 'function') {
      els.modalPasskey.showModal();
    } else {
      els.modalPasskey.setAttribute('open', '');
    }
    refreshIcons();
  }
};

const closePasskeyModal = () => {
  if (els.modalPasskey) {
    if (totpIntervalTimer) {
      clearInterval(totpIntervalTimer);
      totpIntervalTimer = null;
    }
    if (typeof els.modalPasskey.close === 'function') {
      els.modalPasskey.close();
    } else {
      els.modalPasskey.removeAttribute('open');
    }
  }
};

const handleApplyPasskey = async () => {
  const entered = (els.inputRestorePasskey?.value || '').trim();
  if (!entered) {
    if (els.errRestorePasskey) els.errRestorePasskey.textContent = 'Please enter a passkey or PIN.';
    return;
  }
  if (entered.length < 4) {
    if (els.errRestorePasskey) els.errRestorePasskey.textContent = 'Passkey must be at least 4 characters.';
    return;
  }
  currentPasskey = entered;
  localStorage.setItem(PASSKEY_STORAGE_KEY, currentPasskey);
  updatePasskeyUI();
  closePasskeyModal();
  showToast('Switched passkey! Loading birthdays...', 'success', 3500);
  await loadAllData();
};

const handleGenerateNewPasskey = async () => {
  if (confirm('Generate a brand new 6-digit PIN? Your active birthdays are isolated to your current passkey. Copy your current key first if you wish to restore them later.')) {
    currentPasskey = generatePasskey();
    localStorage.setItem(PASSKEY_STORAGE_KEY, currentPasskey);
    updatePasskeyUI();
    closePasskeyModal();
    showToast(`New 6-digit PIN activated (${currentPasskey})!`, 'info', 3500);
    await loadAllData();
  }
};

const openPrivacyModal = () => {
  if (els.modalPrivacyTerms) {
    if (typeof els.modalPrivacyTerms.showModal === 'function') {
      els.modalPrivacyTerms.showModal();
    } else {
      els.modalPrivacyTerms.setAttribute('open', '');
    }
    refreshIcons();
  }
};

const closePrivacyModal = () => {
  if (els.modalPrivacyTerms) {
    if (typeof els.modalPrivacyTerms.close === 'function') {
      els.modalPrivacyTerms.close();
    } else {
      els.modalPrivacyTerms.removeAttribute('open');
    }
  }
};

/**
 * Universal API fetch helper attaching client Passkey and Sender Profile header
 */
const apiFetch = async (url, options = {}) => {
  const profile = getSenderProfile();
  const headers = {
    'x-passkey': currentPasskey,
    ...(profile?.name ? { 'x-sender-name': profile.name } : {}),
    ...(options.headers || {}),
  };
  if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  return fetch(url, { ...options, headers });
};

/* ==========================================================================
   MODAL HELPERS (Modern Web Guidance: <dialog closedby="any" with fallback>)
   ========================================================================== */
const setupDialogBackdropFallback = (dialog) => {
  if (!dialog) return;
  if (!('closedBy' in HTMLDialogElement.prototype)) {
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const isDialogContent =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;
      if (!isDialogContent) {
        dialog.close();
      }
    });
  }
};

setupDialogBackdropFallback(els.modalBirthday);
setupDialogBackdropFallback(els.modalTestMail);
setupDialogBackdropFallback(els.modalPasskey);
setupDialogBackdropFallback(els.modalPrivacyTerms);
setupDialogBackdropFallback(els.modalProfile);

const updateDobLiveCalculation = () => {
  if (!els.inputDob || !els.dobCalcPreview) return;
  const val = (els.inputDob.value || '').trim();
  if (!val) {
    els.dobCalcPreview.innerHTML = '';
    return;
  }
  const parts = val.split('-');
  if (parts.length < 3) {
    els.dobCalcPreview.innerHTML = '';
    return;
  }
  const birthYear = parseInt(parts[0], 10);
  const birthMonth = parseInt(parts[1], 10);
  const birthDay = parseInt(parts[2], 10);
  if (isNaN(birthYear) || isNaN(birthMonth) || isNaN(birthDay)) {
    els.dobCalcPreview.innerHTML = '';
    return;
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  let currentAge = currentYear - birthYear;
  const hasHadBirthday =
    currentMonth > birthMonth ||
    (currentMonth === birthMonth && currentDay >= birthDay);
  if (!hasHadBirthday) currentAge -= 1;

  const turningAge = hasHadBirthday ? (currentYear + 1 - birthYear) : (currentYear - birthYear);

  els.dobCalcPreview.innerHTML = `
    <span class="dob-calc-chip" style="display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; color: #c084fc; background: rgba(192, 132, 252, 0.1); padding: 4px 10px; border-radius: 999px; border: 1px solid rgba(192, 132, 252, 0.25);">
      <i data-lucide="gift" style="width: 13px; height: 13px;"></i>
      Calculated: <strong>${currentAge >= 0 ? currentAge : 0} yrs old</strong> &rarr; turning <strong>${turningAge}</strong> on next birthday!
    </span>
  `;
  refreshIcons();
};

const openAddModal = (contact = null) => {
  els.formBirthday.reset();
  els.errName.textContent = '';
  els.errEmail.textContent = '';
  els.errDob.textContent = '';
  if (els.errUntilYear) els.errUntilYear.textContent = '';

  if (contact) {
    state.editingContactId = contact.id;
    els.modalBirthdayTitle.textContent = 'Edit Birthday Contact';
    els.inputContactId.value = contact.id;
    els.inputName.value = contact.name;
    els.inputEmail.value = contact.email;
    els.inputDob.value = contact.dob;
    if (els.inputUntilYear) els.inputUntilYear.value = contact.untilYear || '';
    if (els.btnSaveContact) els.btnSaveContact.disabled = false;
    updateDobLiveCalculation();
  } else {
    state.editingContactId = null;
    els.modalBirthdayTitle.textContent = 'Add Birthday Contact';
    els.inputContactId.value = '';
    els.inputDob.max = new Date().toISOString().split('T')[0];
    if (els.inputUntilYear) els.inputUntilYear.value = '';
    if (els.dobCalcPreview) els.dobCalcPreview.innerHTML = '';
    updateQuotaUI(state.quota);
  }

  els.modalBirthday.showModal();
  refreshIcons();
};

const closeAddModal = () => {
  els.modalBirthday.close();
};

let currentTestTurningAge = null;
let currentTestCustomMessage = null;

const openTestMailModal = (defaultEmail = '', defaultName = '', turningAge = null, customMessage = null) => {
  els.formTestMail.reset();
  els.errTestEmail.textContent = '';
  currentTestTurningAge = turningAge ? parseInt(turningAge, 10) : null;
  currentTestCustomMessage = customMessage || null;
  if (defaultEmail) els.inputTestEmail.value = defaultEmail;
  if (defaultName) els.inputTestName.value = defaultName;
  els.modalTestMail.showModal();
  refreshIcons();
};

const closeTestMailModal = () => {
  els.modalTestMail.close();
};

/* ==========================================================================
   PREMIUM STACKABLE TOAST ENGINE (Icons, Progress Bar, Auto-dismiss)
   ========================================================================== */
const showToast = (message, type = 'info', duration = 3800, title = '') => {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const iconName = type === 'success' ? 'check-circle-2' : type === 'error' ? 'alert-triangle' : 'info';
  const defaultTitle = type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Notification';
  const displayTitle = title || defaultTitle;

  toast.innerHTML = `
    <div class="toast-icon-circle">
      <i data-lucide="${iconName}" class="toast-svg"></i>
    </div>
    <div class="toast-body">
      <div class="toast-title">${escapeHtml(displayTitle)}</div>
      <div class="toast-msg">${escapeHtml(message)}</div>
    </div>
    <button type="button" class="toast-close-btn" aria-label="Dismiss notification">
      <i data-lucide="x" class="toast-close-svg"></i>
    </button>
    <div class="toast-progress" style="animation-duration: ${duration}ms;"></div>
  `;

  els.toastContainer.appendChild(toast);
  refreshIcons();

  const dismiss = () => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 250);
  };

  const closeBtn = toast.querySelector('.toast-close-btn');
  if (closeBtn) closeBtn.addEventListener('click', dismiss);

  const autoDismiss = setTimeout(dismiss, duration);
  toast.addEventListener('mouseenter', () => clearTimeout(autoDismiss));
};

/* ==========================================================================
   AUDIO SYNTHESIZER CHIME (Celebration Sound)
   ========================================================================== */
const playCelebrationChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);

      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + idx * 0.12 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.12);
      osc.stop(ctx.currentTime + idx * 0.12 + 0.65);
    });
  } catch {}
};

/* ==========================================================================
   CANVAS CONFETTI ENGINE (High performance particle physics)
   ========================================================================== */
let confettiParticles = [];
let confettiAnimationId = null;

const burstConfetti = () => {
  playCelebrationChime();
  const canvas = els.canvas;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#9333ea', '#ec4899', '#f59e0b', '#06b6d4', '#10b981', '#f43f5e', '#a855f7'];
  const particleCount = 140;

  for (let i = 0; i < particleCount; i++) {
    confettiParticles.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 220,
      y: canvas.height * 0.38 + (Math.random() - 0.5) * 100,
      vx: (Math.random() - 0.5) * 18,
      vy: -Math.random() * 14 - 4,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      gravity: 0.38,
      drag: 0.96,
      opacity: 1,
    });
  }

  if (!confettiAnimationId) {
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      confettiParticles.forEach((p, index) => {
        p.vx *= p.drag;
        p.vy *= p.drag;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.opacity -= 0.008;

        if (p.opacity <= 0 || p.y > canvas.height + 20) {
          confettiParticles.splice(index, 1);
          return;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
        ctx.restore();
      });

      if (confettiParticles.length > 0) {
        confettiAnimationId = requestAnimationFrame(render);
      } else {
        cancelAnimationFrame(confettiAnimationId);
        confettiAnimationId = null;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    render();
  }
};

/* ==========================================================================
   API DATA FETCHING
   ========================================================================== */
const fetchStats = async () => {
  try {
    const res = await apiFetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    const data = await res.json();
    state.stats = data;

    els.valTotal.textContent = data.totalUsers;
    els.valToday.textContent = data.todayBirthdays;
    els.valUpcoming.textContent = data.upcomingIn30Days;
    els.valLogs.textContent = data.emailsDispatched;

    els.subToday.textContent =
      data.todayBirthdays > 0
        ? `${data.todayBirthdays} celebration active today`
        : 'None today';

    els.subMailer.textContent = data.mailerConfigured
      ? 'EmailJS SDK (Live)'
      : 'Simulation Mode (Safe)';

    // BullMQ & Redis Queue metrics
    if (data.queue) {
      if (data.queue.active) {
        if (els.valQueueStatus) {
          els.valQueueStatus.textContent = `${data.queue.delayed || 0} Scheduled`;
          els.valQueueStatus.style.color = '#34d399';
        }
        if (els.subQueueDetail) {
          els.subQueueDetail.textContent = `Target: 23:59:55 Eve (5s threshold) • Zero Polling`;
        }
        if (els.queueStatusText) {
          els.queueStatusText.textContent = `5s Eve Scheduler (${data.queue.delayed || 0})`;
        }
        if (els.queueStatusPill) {
          els.queueStatusPill.style.color = '#34d399';
        }
      } else {
        if (els.valQueueStatus) {
          els.valQueueStatus.textContent = data.queue.configured ? 'Standby' : 'Direct';
          els.valQueueStatus.style.color = '#fbbf24';
        }
        if (els.subQueueDetail) {
          els.subQueueDetail.textContent = data.queue.status || 'Direct Dispatch';
        }
        if (els.queueStatusText) {
          els.queueStatusText.textContent = data.queue.configured ? 'BullMQ Standby' : 'Direct Mode';
        }
      }
    }

    // Database Storage indicator
    if (els.valDatabaseStatus) {
      els.valDatabaseStatus.textContent = data.databaseConnected ? 'PostgreSQL' : 'JSON Storage';
      els.valDatabaseStatus.style.color = data.databaseConnected ? '#60a5fa' : '#94a3b8';
    }
    if (els.subDatabaseDetail) {
      els.subDatabaseDetail.textContent = data.databaseConnected
        ? 'Relational SQL & Passkey Isolated'
        : 'Local Mirror · Offline Safe';
    }

    els.serverStatusPill.querySelector('.status-dot').classList.remove('offline');
    els.serverStatusText.textContent = 'Worker Active';
  } catch (err) {
    console.error(err);
    els.serverStatusPill.querySelector('.status-dot').classList.add('offline');
    els.serverStatusText.textContent = 'Disconnected';
  }
};

const updateQuotaUI = (quota) => {
  if (!quota) return;
  if (els.quotaStatusText) {
    els.quotaStatusText.textContent = `Quota: ${quota.dailyRemaining}/${quota.dailyLimit} today`;
    if (quota.dailyRemaining === 0) {
      els.quotaStatusPill?.classList.add('warning');
    } else {
      els.quotaStatusPill?.classList.remove('warning');
    }
  }
  if (els.modalQuotaNotice) {
    if (quota.dailyRemaining === 0) {
      els.modalQuotaNotice.classList.add('limit-reached');
      els.modalQuotaText.textContent = `Daily limit reached (0/${quota.dailyLimit}). Quota resets at ${new Date(quota.dailyReset).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;
      if (els.btnSaveContact && !state.editingContactId) {
        els.btnSaveContact.disabled = true;
      }
    } else {
      els.modalQuotaNotice.classList.remove('limit-reached');
      els.modalQuotaText.textContent = `Addition Quota: ${quota.dailyRemaining}/${quota.dailyLimit} remaining today (${quota.weeklyRemaining}/${quota.weeklyLimit} weekly).`;
      if (els.btnSaveContact) {
        els.btnSaveContact.disabled = false;
      }
    }
  }
};

const fetchQuota = async () => {
  try {
    const res = await apiFetch(`${API_BASE}/quota`);
    if (res.ok) {
      const data = await res.json();
      if (data.quota) {
        state.quota = data.quota;
        updateQuotaUI(data.quota);
      }
    }
  } catch (err) {
    // Non-fatal
  }
};

const fetchTodayBirthdays = async () => {
  try {
    const res = await apiFetch(`${API_BASE}/birthdays/today`);
    if (!res.ok) throw new Error('Failed to fetch today birthdays');
    state.todayBirthdays = await res.json();

    if (state.todayBirthdays.length > 0) {
      els.todayBanner.classList.remove('hidden');
      const names = state.todayBirthdays.map((u) => u.name).join(', ');
      els.todayBannerNames.textContent = `Happy Birthday to ${names}!`;
    } else {
      els.todayBanner.classList.add('hidden');
    }
  } catch (err) {
    console.error(err);
  }
};

const fetchUpcomingContacts = async () => {
  try {
    const res = await apiFetch(`${API_BASE}/birthdays/upcoming`);
    if (!res.ok) throw new Error('Failed to fetch contacts');
    state.contacts = await res.json();
    els.allCountBadge.textContent = state.contacts.length;
    renderContacts();
  } catch (err) {
    console.error(err);
    els.upcomingList.innerHTML = `<div class="loading-state">Error loading birthdays: ${err.message}</div>`;
  }
};

const fetchLogs = async () => {
  try {
    const res = await apiFetch(`${API_BASE}/logs`);
    if (!res.ok) throw new Error('Failed to fetch logs');
    state.logs = await res.json();
    els.logsCountBadge.textContent = state.logs.length;
    renderLogs();
  } catch (err) {
    console.error(err);
    els.logsTableBody.innerHTML = `<tr><td colspan="5" class="loading-cell">Failed to load logs</td></tr>`;
  }
};

const loadAllData = async () => {
  await Promise.all([fetchStats(), fetchTodayBirthdays(), fetchUpcomingContacts(), fetchLogs(), fetchQuota()]);
  refreshIcons();
};

/* ==========================================================================
   RENDERERS (WITH LUCIDE ICONS)
   ========================================================================== */
const getFilteredContacts = () => {
  let list = [...state.contacts];

  if (state.searchTerm.trim()) {
    const q = state.searchTerm.toLowerCase();
    list = list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.zodiac && c.zodiac.name.toLowerCase().includes(q))
    );
  }

  if (state.zodiacFilter !== 'all') {
    list = list.filter((c) => c.zodiac && c.zodiac.name === state.zodiacFilter);
  }

  return list;
};

const getAvatarGradient = (name = "") => {
  const gradients = [
    "linear-gradient(135deg, #4f46e5, #06b6d4)",
    "linear-gradient(135deg, #2563eb, #38bdf8)",
    "linear-gradient(135deg, #059669, #10b981)",
    "linear-gradient(135deg, #7c3aed, #a855f7)",
    "linear-gradient(135deg, #d97706, #f59e0b)",
    "linear-gradient(135deg, #0284c7, #6366f1)"
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
};

const renderContacts = () => {
  const filtered = getFilteredContacts();

  // 1. Render Cards Grid (Upcoming Timeline)
  if (filtered.length === 0) {
    els.upcomingList.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 50px 20px; color: var(--text-dim);">
        <i data-lucide="cake" style="width: 44px; height: 44px; margin-bottom: 12px; color: #6366f1;"></i>
        <p style="font-size: 16px; font-weight: 600; color: #f8fafc;">No matching birthdays found</p>
        <p style="font-size: 13px; margin-top: 4px;">Click "+ Add Birthday" to track friends and family.</p>
      </div>
    `;
  } else {
    els.upcomingList.innerHTML = filtered
      .map((c) => {
        const isToday = c.isToday;
        const days = c.daysLeft;
        let badgeClass = 'later';
        let badgeIcon = '<i data-lucide="calendar" class="badge-svg"></i>';
        let badgeText = `in ${days} days`;

        if (isToday) {
          badgeClass = 'today';
          badgeIcon = '<i data-lucide="gift" class="badge-svg"></i>';
          badgeText = 'TODAY';
        } else if (days === 1) {
          badgeClass = 'soon';
          badgeIcon = '<i data-lucide="bell" class="badge-svg"></i>';
          badgeText = 'Tomorrow';
        } else if (days <= 7) {
          badgeClass = 'soon';
          badgeIcon = '<i data-lucide="clock" class="badge-svg"></i>';
          badgeText = `in ${days} days`;
        }

        const zodiacHtml = c.zodiac
          ? `<span class="meta-pill zodiac-badge" title="${c.zodiac.element} Sign"><i data-lucide="compass" class="pill-svg"></i> ${c.zodiac.name}</span>`
          : '';

        const repeatBadge = c.untilYear
          ? `<span class="meta-pill repeat-badge" title="Repeats until year ${c.untilYear}"><i data-lucide="repeat" class="pill-svg"></i> Until ${c.untilYear}</span>`
          : `<span class="meta-pill repeat-badge" title="Repeats yearly forever"><i data-lucide="repeat" class="pill-svg"></i> Yearly</span>`;

        const avatarBg = getAvatarGradient(c.name || 'Friend');
        const initial = (c.name || 'F').charAt(0).toUpperCase();

        return `
          <article class="birthday-card ${isToday ? 'is-today' : ''}" data-id="${c.id}">
            ${isToday ? `<div class="card-today-ribbon"><i data-lucide="gift" class="ribbon-icon"></i> Celebrating Today</div>` : ''}
            <div class="card-header-row">
              <div class="card-identity">
                <div class="user-avatar" style="background: ${avatarBg};">${initial}</div>
                <div class="card-identity-text">
                  <h3 class="card-name" title="${escapeHtml(c.name)}">${escapeHtml(c.name)}</h3>
                  <span class="card-email" title="${escapeHtml(c.email)}">${escapeHtml(c.email)}</span>
                </div>
              </div>
              <div class="card-status-wrapper">
                <span class="countdown-badge ${badgeClass}">${badgeIcon} ${badgeText}</span>
              </div>
            </div>

            <div class="card-badges-row">
              ${zodiacHtml}
              ${repeatBadge}
              ${c.readableDOB ? `<span class="meta-pill date-pill"><i data-lucide="calendar" class="pill-svg"></i> Born ${c.readableDOB}</span>` : ''}
            </div>

            <div class="card-meta-grid">
              <div class="meta-item">
                <span class="meta-label">Turning</span>
                <span class="meta-val highlight">${c.turningAge ? `${c.turningAge} yrs` : '--'}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Next Date</span>
                <span class="meta-val">${c.nextBirthday || '--'}</span>
              </div>
            </div>

            <div class="card-actions">
              <button class="action-btn test-mail" title="Send test email now" onclick="handleSendTestToContact('${c.id}')" aria-label="Send test email to ${escapeHtml(c.name)}">
                <i data-lucide="send" class="action-icon"></i>
                <span class="action-text">Send Test</span>
              </button>
              <div class="action-group-right">
                <button class="action-btn icon-only" title="Edit contact" onclick="handleEditContact('${c.id}')" aria-label="Edit contact ${escapeHtml(c.name)}">
                  <i data-lucide="edit-3" class="action-icon"></i>
                </button>
                <button class="action-btn icon-only delete" title="Delete contact" onclick="handleDeleteContact('${c.id}', '${escapeHtml(c.name)}')" aria-label="Delete contact ${escapeHtml(c.name)}">
                  <i data-lucide="trash-2" class="action-icon"></i>
                </button>
              </div>
            </div>
          </article>
        `;
      })
      .join('');
  }

  // 2. Render Table View (All Contacts)
  if (filtered.length === 0) {
    els.contactsTableBody.innerHTML = `<tr><td colspan="7" class="loading-cell">No contacts recorded yet.</td></tr>`;
  } else {
    els.contactsTableBody.innerHTML = filtered
      .map((c) => {
        const isToday = c.isToday;
        const countdownLabel = isToday
          ? `<span class="countdown-badge today">Today</span>`
          : `<span class="countdown-badge ${c.daysLeft <= 7 ? 'soon' : 'later'}">${c.daysLeft} days</span>`;

        return `
          <tr>
            <td>
              <strong style="color: #fff;">${escapeHtml(c.name)}</strong><br>
              <span style="font-size: 11.5px; color: var(--text-dim);">${escapeHtml(c.email)}</span>
              ${c.untilYear ? `<br><span style="font-size: 10px; color: #fcd34d;">(Repeats until ${c.untilYear})</span>` : ''}
            </td>
            <td>${c.readableDOB || c.dob}</td>
            <td>${c.zodiac ? escapeHtml(c.zodiac.name) : '--'}</td>
            <td>${c.currentAge !== null ? `${c.currentAge} yrs` : '--'}</td>
            <td><strong style="color: #c084fc;">${c.turningAge !== null ? `${c.turningAge} yrs` : '--'}</strong></td>
            <td>${countdownLabel}</td>
            <td class="text-right">
              <button class="action-btn" title="Send test email" onclick="handleSendTestToContact('${c.id}')" aria-label="Send test email to ${escapeHtml(c.name)}">
                <i data-lucide="send" class="action-icon"></i>
              </button>
              <button class="action-btn" title="Edit contact" onclick="handleEditContact('${c.id}')" aria-label="Edit contact ${escapeHtml(c.name)}">
                <i data-lucide="edit-3" class="action-icon"></i>
              </button>
              <button class="action-btn delete" title="Delete contact" onclick="handleDeleteContact('${c.id}', '${escapeHtml(c.name)}')" aria-label="Delete contact ${escapeHtml(c.name)}">
                <i data-lucide="trash-2" class="action-icon"></i>
              </button>
            </td>
          </tr>
        `;
      })
      .join('');
  }

  refreshIcons();
};

const renderLogs = () => {
  if (state.logs.length === 0) {
    els.logsTableBody.innerHTML = `<tr><td colspan="5" class="loading-cell">No emails dispatched yet.</td></tr>`;
    return;
  }

  els.logsTableBody.innerHTML = state.logs
    .map((log) => {
      const dateStr = log.date || log.timestamp || '';
      let formattedTime = dateStr;
      try {
        formattedTime = new Date(dateStr).toLocaleString();
      } catch {}

      const status = log.status || 'sent';
      const statusClass = status.toLowerCase();
      const message = log.error ? `<span style="color: #f87171;">${escapeHtml(log.error)}</span>` : log.messageId || 'Success';

      return `
        <tr>
          <td style="font-family: monospace; font-size: 11.5px; color: var(--text-dim);">${formattedTime}</td>
          <td>
            <strong>${escapeHtml(log.name || 'Friend')}</strong><br>
            <span style="font-size: 11px; color: var(--text-dim);">${escapeHtml(log.email || '')}</span>
          </td>
          <td><span style="text-transform: capitalize; font-size: 12px;">${log.type || 'automatic'}</span></td>
          <td><span class="status-pill ${statusClass}">${status}</span></td>
          <td style="font-family: monospace; font-size: 11.5px; color: var(--text-muted);">${message}</td>
        </tr>
      `;
    })
    .join('');

  refreshIcons();
};

/* ==========================================================================
   CARD STUDIO & LIVE PREVIEW
   ========================================================================== */
let previewDebounceTimer = null;

const updateEmailPreview = () => {
  clearTimeout(previewDebounceTimer);
  previewDebounceTimer = setTimeout(() => {
    const name = encodeURIComponent(els.previewName.value || 'Valued Friend');
    const email = encodeURIComponent(els.previewEmail.value || 'friend@example.com');
    const age = encodeURIComponent(els.previewAge.value || 22);
    const message = encodeURIComponent(els.previewMessage.value || '');
    const profile = getSenderProfile();
    const senderParam = profile?.name ? `&senderName=${encodeURIComponent(profile.name)}` : '';

    const url = `${API_BASE}/template-preview?name=${name}&email=${email}&turningAge=${age}&message=${message}${senderParam}`;
    els.emailPreviewFrame.src = url;
  }, 180);
};

// Studio Random Quotes
const BIRTHDAY_QUOTES = [
  "“Wishing you a day as radiant, joyful, and inspiring as you are! May this new year of your life bring you great health, genuine happiness, and exciting achievements. Cheers to celebrating you today and all the incredible things ahead!”",
  "“Another year wiser, stronger, and more wonderful! I hope your birthday is filled with laughter, love, and all the moments that bring you true joy. May this upcoming chapter be your most rewarding yet.”",
  "“Sending you my warmest thoughts and heartfelt wishes on your special day! Thank you for bringing so much light into the lives around you. Here's to health, happiness, and another fantastic year ahead.”",
  "“On your birthday, I wanted to take a moment to celebrate the wonderful person you are. May your year ahead be packed with fulfilling moments, daring dreams realized, and peace at every step.”",
  "“Happy Birthday! Today is all about honoring you and the positive energy you bring wherever you go. Wishing you a year filled with warmth, effortless laughter, and everything your heart desires.”",
  "“May your journey ahead be blessed with good fortune, deep joy, and true triumphs. Wear your wisdom with pride and know that I am rooting for your happiness every single day.”",
  "“Every year is a new summit to conquer and a blank canvas to paint with purpose. Step boldly into this year with confidence and excitement for what is to come!”",
  "“Another year is not just time added — it is strength gained, wisdom earned, and a future shaped with intention. Keep shining bright and rising higher!”"
];

if (els.btnShuffleQuote) {
  els.btnShuffleQuote.addEventListener('click', () => {
    const current = els.previewMessage.value.trim();
    let nextQuote = BIRTHDAY_QUOTES[Math.floor(Math.random() * BIRTHDAY_QUOTES.length)];
    while (BIRTHDAY_QUOTES.length > 1 && nextQuote === current) {
      nextQuote = BIRTHDAY_QUOTES[Math.floor(Math.random() * BIRTHDAY_QUOTES.length)];
    }
    els.previewMessage.value = nextQuote;
    updateEmailPreview();
    showToast('Quote randomized', 'info', 1500);
  });
}

/* ==========================================================================
   USER ACTIONS & FORM HANDLERS
   ========================================================================== */
window.handleEditContact = (id) => {
  const contact = state.contacts.find((c) => c.id === id);
  if (contact) {
    openAddModal(contact);
  }
};

window.handleDeleteContact = async (id, name) => {
  if (!confirm(`Are you sure you want to remove ${name} from birthday tracking?`)) return;

  try {
    const res = await apiFetch(`${API_BASE}/birthdays/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete');

    showToast(`Removed ${name} from contacts`, 'success');
    await loadAllData();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.handleSendTestToContact = (id) => {
  const contact = state.contacts.find((c) => c.id === id);
  if (contact) {
    openTestMailModal(contact.email, contact.name, contact.turningAge);
  }
};

// Form: Save (Add or Update)
els.formBirthday.addEventListener('submit', async (e) => {
  e.preventDefault();
  els.errName.textContent = '';
  els.errEmail.textContent = '';
  els.errDob.textContent = '';

  const name = els.inputName.value.trim();
  const email = els.inputEmail.value.trim();
  const dob = els.inputDob.value.trim();
  const untilYearRaw = els.inputUntilYear ? els.inputUntilYear.value.trim() : '';

  let hasError = false;
  if (!name) {
    els.errName.textContent = 'Name is required.';
    hasError = true;
  }
  if (!email || !email.includes('@')) {
    els.errEmail.textContent = 'A valid email is required.';
    hasError = true;
  }
  if (!dob) {
    els.errDob.textContent = 'Date of birth is required.';
    hasError = true;
  }

  if (hasError) return;

  const payload = {
    name,
    email,
    dob,
    untilYear: untilYearRaw ? parseInt(untilYearRaw, 10) : null
  };

  try {
    let res;
    if (state.editingContactId) {
      res = await apiFetch(`${API_BASE}/birthdays/${state.editingContactId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    } else {
      res = await apiFetch(`${API_BASE}/add-dob`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }

    const data = await res.json();
    if (!res.ok) {
      if (res.status === 429) {
        if (data.quota) {
          state.quota = data.quota;
          updateQuotaUI(data.quota);
        }
        showToast(data.message || 'Daily addition limit reached!', 'warning', 6000);
        return;
      }
      throw new Error(data.error || 'Failed to save birthday');
    }

    if (data.quota) {
      state.quota = data.quota;
      updateQuotaUI(data.quota);
    }

    showToast(state.editingContactId ? 'Contact updated successfully!' : `Added ${name} to tracking!`, 'success');
    closeAddModal();
    await loadAllData();
  } catch (err) {
    showToast(err.message, 'error');
  }
});

// Form: Quick Test Email Submit
els.formTestMail.addEventListener('submit', async (e) => {
  e.preventDefault();
  els.errTestEmail.textContent = '';

  const name = els.inputTestName.value.trim() || 'Valued Friend';
  const email = els.inputTestEmail.value.trim();

  if (!email || !email.includes('@')) {
    els.errTestEmail.textContent = 'A valid email address is required.';
    return;
  }

  const btn = document.getElementById('btn-submit-test-mail');
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner" style="width: 14px; height: 14px; border-width: 2px;"></span> Dispatching...`;

  try {
    const senderProfile = getSenderProfile();
    const payload = {
      name,
      email,
      ...(currentTestTurningAge ? { turningAge: currentTestTurningAge } : {}),
      ...(currentTestCustomMessage ? { customMessage: currentTestCustomMessage } : {}),
      ...(senderProfile?.name ? { senderName: senderProfile.name } : {}),
    };

    const res = await apiFetch(`${API_BASE}/send-test-mail`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send test email');

    if (data.simulated) {
      showToast(`Simulation logged for ${email} (Check logs)`, 'info', 4500, 'Simulated Dispatch');
    } else {
      showToast(`Celebration email delivered to ${email}!`, 'success', 4500, 'Email Delivered');
    }

    closeTestMailModal();
    await loadAllData();
  } catch (err) {
    showToast(err.message, 'error', 4500);
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i data-lucide="send" class="btn-icon"></i> <span>Send Test Email</span>`;
    refreshIcons();
  }
});

// Studio: Send Custom Test from Preview
els.btnSendPreviewTest.addEventListener('click', () => {
  openTestMailModal(
    els.previewEmail.value,
    els.previewName.value,
    parseInt(els.previewAge.value, 10) || 22,
    els.previewMessage.value
  );
});

// Manual Run Trigger
els.btnTriggerCheck.addEventListener('click', async () => {
  els.btnTriggerCheck.disabled = true;
  els.btnTriggerCheck.innerHTML = `<span class="spinner" style="width: 14px; height: 14px; border-width: 2px;"></span> Processing...`;

  try {
    const res = await apiFetch(`${API_BASE}/trigger-check`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Trigger failed');

    const sum = data.summary;
    const msg = `Found ${sum.totalFound} today • ${sum.sentCount + sum.simulatedCount} dispatched • ${sum.skippedAlreadySent} skipped.`;
    showToast(msg, 'success', 5000, 'Daily Check Complete');

    if (sum.sentCount > 0 || sum.simulatedCount > 0) {
      burstConfetti();
    }

    await loadAllData();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    els.btnTriggerCheck.disabled = false;
    els.btnTriggerCheck.innerHTML = `<i data-lucide="zap" class="btn-icon"></i> <span class="btn-text">Run Check</span>`;
    refreshIcons();
  }
});

// Clear Logs
els.btnClearLogs.addEventListener('click', async () => {
  if (!confirm('Clear all email delivery history logs?')) return;
  try {
    const res = await apiFetch(`${API_BASE}/logs`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to clear logs');
    showToast('Delivery logs cleared', 'info');
    await fetchLogs();
    await fetchStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
});

/* ==========================================================================
   EVENT LISTENERS & TAB CONTROLS
   ========================================================================== */
els.btnOpenAdd.addEventListener('click', () => openAddModal());
els.btnCloseModal.addEventListener('click', closeAddModal);
els.btnCancelModal.addEventListener('click', closeAddModal);

els.btnQuickTest.addEventListener('click', () => openTestMailModal());
els.btnCloseTestModal.addEventListener('click', closeTestMailModal);
els.btnCancelTestModal.addEventListener('click', closeTestMailModal);

els.btnRefresh.addEventListener('click', async () => {
  showToast('Refreshing birthdays...', 'info', 1500);
  await loadAllData();
});

els.btnCelebrateBurst.addEventListener('click', burstConfetti);

// Header Direct Passkey Event Listeners
if (els.headerPasskeyInput) {
  els.headerPasskeyInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyHeaderPasskey();
    }
  });
}
if (els.btnApplyHeaderPasskey) {
  els.btnApplyHeaderPasskey.addEventListener('click', applyHeaderPasskey);
}
if (els.btnHeaderNewPasskey) {
  els.btnHeaderNewPasskey.addEventListener('click', handleGenerateNewPasskey);
}

// Passkey Identity Event Listeners
if (els.btnCopyPasskey) {
  els.btnCopyPasskey.addEventListener('click', (e) => {
    e.stopPropagation();
    copyPasskeyToClipboard();
  });
}
if (els.btnOpenPasskey) {
  els.btnOpenPasskey.addEventListener('click', openPasskeyModal);
}
if (els.btnClosePasskeyModal) {
  els.btnClosePasskeyModal.addEventListener('click', closePasskeyModal);
}
if (els.btnClosePasskeyBtn) {
  els.btnClosePasskeyBtn.addEventListener('click', closePasskeyModal);
}
if (els.btnModalCopyPasskey) {
  els.btnModalCopyPasskey.addEventListener('click', copyPasskeyToClipboard);
}
if (els.btnApplyPasskey) {
  els.btnApplyPasskey.addEventListener('click', handleApplyPasskey);
}
if (els.btnGenerateNewPasskey) {
  els.btnGenerateNewPasskey.addEventListener('click', handleGenerateNewPasskey);
}

// TOTP Event Listeners
if (els.btnToggleTotp && els.totpSecretDetails) {
  els.btnToggleTotp.addEventListener('click', () => {
    const isHidden = els.totpSecretDetails.style.display === 'none';
    els.totpSecretDetails.style.display = isHidden ? 'block' : 'none';
    els.btnToggleTotp.textContent = isHidden ? 'Hide TOTP Key' : 'Show TOTP Key';
    if (isHidden) startTotpLiveTicker();
  });
}
if (els.btnCopyTotpSecret) {
  els.btnCopyTotpSecret.addEventListener('click', async () => {
    const sec = els.inputTotpSecret?.value || getOrInitTotpSecret();
    try {
      await navigator.clipboard.writeText(sec);
      showToast('TOTP secret copied to clipboard! Paste into Google / Microsoft Authenticator.', 'success', 3500);
    } catch {
      showToast('Secret: ' + sec, 'info', 4000);
    }
  });
}

// Sender Profile Event Listeners
if (els.btnOpenProfile) {
  els.btnOpenProfile.addEventListener('click', openProfileModal);
}
if (els.btnCloseProfileModal) {
  els.btnCloseProfileModal.addEventListener('click', closeProfileModal);
}
if (els.btnCancelProfileModal) {
  els.btnCancelProfileModal.addEventListener('click', closeProfileModal);
}
if (els.formSenderProfile) {
  els.formSenderProfile.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameVal = (els.inputProfileSenderName?.value || '').trim();
    const emailVal = (els.inputProfileSenderEmail?.value || '').trim();
    const errEl = document.getElementById('err-profile-sender-name');
    if (!nameVal) {
      if (errEl) errEl.textContent = 'Please provide your display name (e.g. Mom, Nishan).';
      return;
    }
    saveSenderProfile(nameVal, emailVal);
    closeProfileModal();
    updateEmailPreview();
    showToast(`Sender profile saved as "${nameVal}"! All emails will be signed by you.`, 'success', 3500);
  });
}

// DOB Live Preview Calculation Listeners
if (els.inputDob) {
  els.inputDob.addEventListener('input', updateDobLiveCalculation);
  els.inputDob.addEventListener('change', updateDobLiveCalculation);
}

// Privacy Terms & Disclaimer Event Listeners
if (els.btnOpenPrivacy) {
  els.btnOpenPrivacy.addEventListener('click', openPrivacyModal);
}
if (els.btnClosePrivacyModal) {
  els.btnClosePrivacyModal.addEventListener('click', closePrivacyModal);
}
if (els.btnAcknowledgePrivacy) {
  els.btnAcknowledgePrivacy.addEventListener('click', closePrivacyModal);
}

// Tab switching
els.tabBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const targetTab = btn.getAttribute('data-tab');
    state.activeTab = targetTab;

    els.tabBtns.forEach((b) => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');

    els.tabPanels.forEach((p) => p.classList.remove('active'));
    document.getElementById(`panel-${targetTab}`).classList.add('active');

    if (targetTab === 'preview') {
      updateEmailPreview();
    }
    refreshIcons();
  });
});

// Search & Filter
els.inputSearch.addEventListener('input', (e) => {
  state.searchTerm = e.target.value;
  renderContacts();
});

els.selectZodiacFilter.addEventListener('change', (e) => {
  state.zodiacFilter = e.target.value;
  renderContacts();
});

// Studio live preview inputs
[els.previewName, els.previewEmail, els.previewAge, els.previewMessage].forEach((input) => {
  input.addEventListener('input', updateEmailPreview);
});

// Utilities
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ==========================================================================
   DEVELOPER OPTIONS (Strictly Hidden by Default - 7 Taps on Brand Logo)
   ========================================================================== */
let devTapCount = 0;
let devTapResetTimer = null;

const initDeveloperMode = () => {
  // Clear any persistent flag so normal users always see a clean, developer-free UI
  localStorage.removeItem('hbday_dev_mode');
  sessionStorage.removeItem('hbday_dev_mode');
  document.body.classList.remove('dev-mode-active');

  const hideAllDev = () => {
    document.querySelectorAll('.dev-only').forEach((el) => {
      el.setAttribute('hidden', '');
      el.style.setProperty('display', 'none', 'important');
    });
  };

  const showAllDev = () => {
    document.querySelectorAll('.dev-only').forEach((el) => {
      el.removeAttribute('hidden');
      el.style.removeProperty('display');
    });
  };

  hideAllDev();

  const urlParams = new URLSearchParams(window.location.search);
  const isDevParam = urlParams.get('dev') === '1' || urlParams.get('dev') === 'true';
  if (isDevParam) {
    document.body.classList.add('dev-mode-active');
    showAllDev();
  }

  const brandLogo = document.getElementById('brand-logo');
  const btnDisableDev = document.getElementById('btn-disable-dev');

  if (brandLogo) {
    const handleLogoTap = () => {
      const isAlreadyDev = document.body.classList.contains('dev-mode-active');

      if (isAlreadyDev) {
        showToast('Developer options are already active.', 'info', 2000);
        return;
      }

      devTapCount++;

      if (devTapResetTimer) clearTimeout(devTapResetTimer);
      devTapResetTimer = setTimeout(() => {
        devTapCount = 0;
      }, 3500);

      const stepsRemaining = 7 - devTapCount;

      if (stepsRemaining > 0 && stepsRemaining <= 4) {
        showToast(`You are now ${stepsRemaining} step${stepsRemaining === 1 ? '' : 's'} away from developer options.`, 'info', 1800);
      } else if (stepsRemaining <= 0) {
        devTapCount = 0;
        if (devTapResetTimer) clearTimeout(devTapResetTimer);
        document.body.classList.add('dev-mode-active');
        showAllDev();
        showToast('Developer options unlocked for this session.', 'success', 3500);
        refreshIcons();
      }
    };

    brandLogo.addEventListener('click', handleLogoTap);
  }

  if (btnDisableDev) {
    btnDisableDev.addEventListener('click', () => {
      document.body.classList.remove('dev-mode-active');
      hideAllDev();
      devTapCount = 0;
      showToast('Developer options hidden.', 'info', 2200);
    });
  }
};

/* ==========================================================================
   INITIALIZATION
   ========================================================================== */
window.addEventListener('DOMContentLoaded', async () => {
  initDeveloperMode();
  updatePasskeyUI();
  updateSenderProfileUI();
  refreshIcons();
  await loadAllData();
  updateEmailPreview();

  if (state.todayBirthdays && state.todayBirthdays.length > 0) {
    setTimeout(() => {
      burstConfetti();
    }, 600);
  }
});
