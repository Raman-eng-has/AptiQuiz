// AptiQuiz Fair Play Extension - Background Service Worker
// Manifest V3

interface QuizSession {
  roomId: string;
  playerId: string;
  serverUrl: string;
  startedAt: number;
  heartbeatInterval: number;
  tabId: number;
}

let currentSession: QuizSession | null = null;
let heartbeatTimer: number | null = null;
let tabChangeListener: ((tabId: number) => void) | null = null;
let windowListener: ((windowId: number) => void) | null = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'START_SESSION':
      startSession(message.payload);
      sendResponse({ success: true });
      break;
    case 'END_SESSION':
      endSession();
      sendResponse({ success: true });
      break;
    case 'GET_SESSION':
      sendResponse({ session: currentSession });
      break;
    case 'HEARTBEAT':
      sendHeartbeat();
      sendResponse({ success: true });
      break;
  }
  return true;
});

async function startSession(payload: { roomId: string; playerId: string; serverUrl: string }) {
  if (currentSession) {
    await endSession();
  }

  currentSession = {
    roomId: payload.roomId,
    playerId: payload.playerId,
    serverUrl: payload.serverUrl,
    startedAt: Date.now(),
    heartbeatInterval: 5000,
    tabId: sender.tab?.id || 0,
  };

  // Monitor tab changes
  tabChangeListener = async (tabId: number) => {
    if (tabId !== currentSession?.tabId) {
      await reportIntegrityEvent('TAB_SWITCH', { fromTab: currentSession.tabId, toTab: tabId });
    }
  };
  chrome.tabs.onActivated.addListener(tabChangeListener);

  // Monitor window creation
  windowListener = async (windowId: number) => {
    const windows = await chrome.windows.getAll({ populate: true });
    if (windows.length > 1) {
      await reportIntegrityEvent('TAB_SWITCH', { windowCount: windows.length });
    }
  };
  chrome.windows.onCreated.addListener(windowListener);

  // Start heartbeat
  heartbeatTimer = window.setInterval(sendHeartbeat, currentSession.heartbeatInterval);

  // Inject content script for additional monitoring
  if (currentSession.tabId) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: currentSession.tabId },
        files: ['injected.js'],
      });
    } catch (e) {
      console.warn('Failed to inject script:', e);
    }
  }

  console.log('Fair Play session started:', currentSession);
}

async function endSession() {
  if (tabChangeListener) {
    chrome.tabs.onActivated.removeListener(tabChangeListener);
    tabChangeListener = null;
  }
  if (windowListener) {
    chrome.windows.onCreated.removeListener(windowListener);
    windowListener = null;
  }
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  currentSession = null;
  console.log('Fair Play session ended');
}

async function sendHeartbeat() {
  if (!currentSession) return;

  try {
    const response = await fetch(`${currentSession.serverUrl}/api/fair-play/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: currentSession.roomId,
        playerId: currentSession.playerId,
        timestamp: Date.now(),
        tabId: currentSession.tabId,
        url: window.location.href,
      }),
    });

    if (!response.ok) {
      console.warn('Heartbeat failed:', response.status);
      await reportIntegrityEvent('EXTENSION_MISSING', { reason: 'heartbeat_failed' });
    }
  } catch (error) {
    console.warn('Heartbeat error:', error);
  }
}

async function reportIntegrityEvent(type: string, details: Record<string, unknown>) {
  if (!currentSession) return;

  try {
    await fetch(`${currentSession.serverUrl}/api/fair-play/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: currentSession.roomId,
        playerId: currentSession.playerId,
        type,
        severity: type === 'EXTENSION_MISSING' || type === 'TAB_SWITCH' ? 'MEDIUM' : 'LOW',
        details,
        timestamp: Date.now(),
      }),
    });
  } catch (error) {
    console.warn('Failed to report integrity event:', error);
  }
}

// Detect if extension is disabled during quiz
chrome.runtime.onSuspend.addListener(() => {
  if (currentSession) {
    reportIntegrityEvent('EXTENSION_MISSING', { reason: 'extension_suspended' });
  }
});

export {};