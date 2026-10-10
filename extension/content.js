// AptiQuiz Fair Play Extension - Content Script
// Runs on quiz pages to detect cheating behaviors

interface IntegrityEvent {
  type: string;
  details: Record<string, unknown>;
}

let isQuizActive = false;
let focusLostCount = 0;
let lastFocusTime = Date.now();
let devToolsDetected = false;

function sendEvent(event: IntegrityEvent) {
  window.postMessage({ type: 'APTIQUIZ_INTEGRITY_EVENT', payload: event }, '*');
}

function initQuizMonitoring() {
  if (isQuizActive) return;
  isQuizActive = true;
  focusLostCount = 0;
  lastFocusTime = Date.now();

  // Focus/blur detection
  window.addEventListener('blur', handleBlur);
  window.addEventListener('focus', handleFocus);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // DevTools detection
  startDevToolsDetection();

  // Clipboard access blocking
  blockClipboardAccess();

  // Right-click, copy, paste, select blocking on question content
  blockQuestionInteractions();

  // Watermark
  addWatermark();

  console.log('Fair Play monitoring initialized');
}

function stopQuizMonitoring() {
  if (!isQuizActive) return;
  isQuizActive = false;

  window.removeEventListener('blur', handleBlur);
  window.removeEventListener('focus', handleFocus);
  document.removeEventListener('visibilitychange', handleVisibilityChange);

  stopDevToolsDetection();
  removeWatermark();

  console.log('Fair Play monitoring stopped');
}

function handleBlur() {
  focusLostCount++;
  lastFocusTime = Date.now();
  sendEvent({
    type: 'FOCUS_LOSS',
    details: { count: focusLostCount, timestamp: Date.now() },
  });
}

function handleFocus() {
  sendEvent({
    type: 'FOCUS_RESTORED',
    details: { count: focusLostCount, timestamp: Date.now() },
  });
}

function handleVisibilityChange() {
  if (document.hidden) {
    sendEvent({
      type: 'TAB_HIDDEN',
      details: { timestamp: Date.now() },
    });
  } else {
    sendEvent({
      type: 'TAB_VISIBLE',
      details: { timestamp: Date.now() },
    });
  }
}

let devToolsCheckInterval: number | null = null;

function startDevToolsDetection() {
  const threshold = 160;
  devToolsCheckInterval = window.setInterval(() => {
    const widthDiff = window.outerWidth - window.innerWidth;
    const heightDiff = window.outerHeight - window.innerHeight;
    if (widthDiff > threshold || heightDiff > threshold) {
      if (!devToolsDetected) {
        devToolsDetected = true;
        sendEvent({
          type: 'DEVTOOLS_DETECTED',
          details: { widthDiff, heightDiff, timestamp: Date.now() },
        });
      }
    } else {
      devToolsDetected = false;
    }
  }, 1000);
}

function stopDevToolsDetection() {
  if (devToolsCheckInterval) {
    clearInterval(devToolsCheckInterval);
    devToolsCheckInterval = null;
  }
}

function blockClipboardAccess() {
  document.addEventListener('copy', (e) => {
    if (isQuestionContent(e.target as Element)) {
      e.preventDefault();
      sendEvent({ type: 'CLIPBOARD_ACCESS', details: { action: 'copy', timestamp: Date.now() } });
    }
  }, true);

  document.addEventListener('cut', (e) => {
    if (isQuestionContent(e.target as Element)) {
      e.preventDefault();
      sendEvent({ type: 'CLIPBOARD_ACCESS', details: { action: 'cut', timestamp: Date.now() } });
    }
  }, true);

  document.addEventListener('paste', (e) => {
    if (isQuestionContent(e.target as Element)) {
      e.preventDefault();
      sendEvent({ type: 'CLIPBOARD_ACCESS', details: { action: 'paste', timestamp: Date.now() } });
    }
  }, true);
}

function blockQuestionInteractions() {
  const style = document.createElement('style');
  style.textContent = `
    .question-content, [data-question-content] {
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      user-select: none !important;
      -webkit-touch-callout: none !important;
      -webkit-tap-highlight-color: transparent !important;
    }
    .question-content *::selection,
    [data-question-content] *::selection {
      background: transparent !important;
    }
  `;
  document.head.appendChild(style);

  document.addEventListener('contextmenu', (e) => {
    if (isQuestionContent(e.target as Element)) {
      e.preventDefault();
      sendEvent({ type: 'CONTEXT_MENU_BLOCKED', details: { timestamp: Date.now() } });
    }
  }, true);

  document.addEventListener('dragstart', (e) => {
    if (isQuestionContent(e.target as Element)) {
      e.preventDefault();
    }
  }, true);
}

function isQuestionContent(element: Element | null): boolean {
  if (!element) return false;
  return element.closest('.question-content, [data-question-content]') !== null;
}

function addWatermark() {
  const watermark = document.createElement('div');
  watermark.id = 'aptiquiz-watermark';
  watermark.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 999999;
    opacity: 0.03;
    background-image: repeating-linear-gradient(
      45deg,
      transparent,
      transparent 50px,
      rgba(0,0,0,0.1) 50px,
      rgba(0,0,0,0.1) 100px
    );
    background-size: 200px 200px;
    font-size: 120px;
    font-weight: bold;
    color: rgba(0,0,0,0.05);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    overflow: hidden;
  `;
  watermark.textContent = `APTIQUIZ`;
  document.body.appendChild(watermark);
}

function removeWatermark() {
  const watermark = document.getElementById('aptiquiz-watermark');
  if (watermark) watermark.remove();
}

// Listen for messages from background script
window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  if (event.data.type === 'APTIQUIZ_START_MONITORING') {
    initQuizMonitoring();
  } else if (event.data.type === 'APTIQUIZ_STOP_MONITORING') {
    stopQuizMonitoring();
  }
});

// Expose API for page scripts
(window as any).AptiQuizFairPlay = {
  start: initQuizMonitoring,
  stop: stopQuizMonitoring,
  reportEvent: sendEvent,
};

export {};