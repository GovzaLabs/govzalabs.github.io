// Firebase Analytics. Loaded as an async module so it never delays the page.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js';
import { getAnalytics, logEvent } from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-analytics.js';

const app = initializeApp({
  apiKey: 'AIzaSyDGbTm0oZOhUtfwTf_G97amgvoA3CJbPg0',
  authDomain: 'avocadoappswebsite.firebaseapp.com',
  projectId: 'avocadoappswebsite',
  storageBucket: 'avocadoappswebsite.firebasestorage.app',
  messagingSenderId: '805026130598',
  appId: '1:805026130598:web:86d8d53a1ed3cd6b5f6267',
  measurementId: 'G-2QNNH7FLBJ',
});
const analytics = getAnalytics(app);

window.firebaseAnalytics = analytics;
window.logEvent = logEvent;

// Send events that were tracked before Firebase finished loading.
(window.glAnalyticsQueue || []).forEach(([name, params]) => logEvent(analytics, name, params));
window.glAnalyticsQueue = [];

// Track all link clicks, plus store clicks separately.
document.addEventListener('click', (event) => {
  const link = event.target.closest('a');
  if (!link) return;
  const url = link.href;
  const text = link.innerText || link.textContent || link.getAttribute('aria-label') || 'no_text';

  logEvent(analytics, 'link_click', {
    link_url: url,
    link_text: text.trim().substring(0, 100),
  });

  if (url.includes('apps.apple.com')) {
    logEvent(analytics, 'app_store_click', { platform: 'ios' });
  } else if (url.includes('play.google.com')) {
    logEvent(analytics, 'google_play_click', { platform: 'android' });
  }
});
