// AptiQuiz Fair Play Extension - Injected Script
// Runs in page context to detect more sophisticated cheating

(() => {
  let originalConsole = { ...console };
  let eventListeners: Map<string, Set<EventListener>> = new Map();

  // Override console to detect debugging
  const originalLog = console.log;
  console.log = (...args) => {
    if (args.some(arg => typeof arg === 'string' && arg.includes('cheat'))) {
      reportEvent('CONSOLE_CHEAT_DETECTED', { args: args.map(String) });
    }
    originalLog.apply(console, args);
  };

  // Detect common cheating tools
  function detectCheatingTools() {
    const cheatPatterns = [
      'cheat', 'hack', 'bot', 'auto', 'script', 'tamper',
      'monkey', 'grease', 'violent', 'inject', 'hook'
    ];

    // Check window properties
    for (const prop of Object.getOwnPropertyNames(window)) {
      for (const pattern of cheatPatterns) {
        if (prop.toLowerCase().includes(pattern)) {
          reportEvent('SUSPICIOUS_WINDOW_PROP', { property: prop });
        }
      }
    }

    // Check for known cheating extensions
    const knownExtensions = [
      'cheat', 'hack', 'auto_answer', 'quiz_bot', 'exam_helper'
    ];
  }

  // Monitor for dynamic script injection
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as Element;
          if (el.tagName === 'SCRIPT' && !el.hasAttribute('data-aptiquiz-allowed')) {
            reportEvent('SCRIPT_INJECTED', { src: (el as HTMLScriptElement).src, innerHTML: el.innerHTML?.slice(0, 200) });
          }
        }
      }
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });

  // Detect keyboard shortcuts for dev tools
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.shiftKey) && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
      reportEvent('DEVTOOLS_SHORTCUT', { key: e.key, ctrlKey: e.ctrlKey, metaKey: e.metaKey, shiftKey: e.shiftKey });
    }
    if (e.key === 'F12') {
      reportEvent('DEVTOOLS_SHORTCUT', { key: 'F12' });
    }
  }, true);

  // Detect right-click on question
  document.addEventListener('contextmenu', (e) => {
    if (isQuestionElement(e.target as Element)) {
      reportEvent('RIGHT_CLICK_QUESTION', { tag: e.target.tagName });
    }
  }, true);

  // Detect text selection on question
  document.addEventListener('selectstart', (e) => {
    if (isQuestionElement(e.target as Element)) {
      reportEvent('TEXT_SELECTION_QUESTION', { tag: e.target.tagName });
    }
  }, true);

  function isQuestionElement(el: Element): boolean {
    return !!el.closest('[data-question-content], .question-content, .question-text, [data-testid="question"]');
  }

  function reportEvent(type: string, details: Record<string, unknown>) {
    window.postMessage({ type: 'APTIQUIZ_INTEGRITY_EVENT', payload: { type, details, timestamp: Date.now() } }, '*');
  }

  // Listen for commands from content script
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (event.data.type === 'APTIQUIZ_START_MONITORING') {
      detectCheatingTools();
    }
  });

  // Expose cleanup
  (window as any).AptiQuizInjectedCleanup = () => {
    observer.disconnect();
    console.log = originalLog;
  };
})();