import { db, ref, set, push, serverTimestamp } from '../firebase-config.js';

export function getSessionId() {
  let sid = sessionStorage.getItem('ep_session_id');
  if (!sid) {
    sid = 'sess_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
    sessionStorage.setItem('ep_session_id', sid);
  }
  return sid;
}

export function logAnalyticsEvent(eventType, eventData = {}) {
  const dateStr = new Date().toISOString().split('T')[0];
  const hourStr = new Date().getHours().toString().padStart(2, '0');
  const sessionId = getSessionId();

  const payload = {
    eventType,
    sessionId,
    timestamp: Date.now(),
    url: window.location.href,
    referrer: document.referrer || 'direct',
    ...eventData
  };

  // Push individual raw event stream
  const eventRef = push(ref(db, `analytics/events/${dateStr}`));
  set(eventRef, payload);

  // Update aggregated statistics
  const aggRef = ref(db, `analytics/daily/${dateStr}/summary/${eventType}`);
  // Incremented on server side or through transactional counters
}

export function initHeartbeat(geoData) {
  const sessionId = getSessionId();
  const heartbeatRef = ref(db, `analytics/realtime/${sessionId}`);

  const sendPulse = () => {
    set(heartbeatRef, {
      lastSeen: Date.now(),
      city: geoData.city || 'Unknown',
      country: geoData.countryCode || 'Unknown',
      userAgent: navigator.userAgent
    });
  };

  sendPulse();
  const interval = setInterval(sendPulse, 25000);

  window.addEventListener('beforeunload', () => {
    clearInterval(interval);
  });
}
