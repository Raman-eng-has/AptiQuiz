// AptiQuiz Fair Play Extension - Popup Script

let updateInterval: number | null = null;

document.addEventListener('DOMContentLoaded', async () => {
  await loadSession();
  updateInterval = window.setInterval(loadSession, 2000);

  document.getElementById('toggleBtn')?.addEventListener('click', async () => {
    const btn = document.getElementById('toggleBtn') as HTMLButtonElement;
    if (btn.textContent === 'Start Monitoring') {
      await startMonitoring();
    } else {
      await stopMonitoring();
    }
  });
});

async function loadSession() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_SESSION' });
    const session = response.session;
    updateUI(session);
  } catch (e) {
    console.warn('Failed to load session:', e);
  }
}

function updateUI(session: any) {
  const statusEl = document.getElementById('status');
  const detailsEl = document.getElementById('details');
  const toggleBtn = document.getElementById('toggleBtn') as HTMLButtonElement;
  const warningEl = document.getElementById('warning');

  if (session) {
    statusEl.className = 'status active';
    statusEl.innerHTML = '<div class="dot active"></div><span>Monitoring Active</span>';
    detailsEl.style.display = 'block';
    (document.getElementById('roomId') as HTMLElement).textContent = session.roomId?.slice(0, 8) || '-';
    (document.getElementById('playerId') as HTMLElement).textContent = session.playerId?.slice(0, 8) || '-';
    (document.getElementById('eventCount') as HTMLElement).textContent = session.eventCount?.toString() || '0';
    const uptime = Math.floor((Date.now() - (session.startedAt || Date.now())) / 1000);
    (document.getElementById('uptime') as HTMLElement).textContent = `${uptime}s`;
    toggleBtn.textContent = 'Stop Monitoring';
    toggleBtn.className = 'btn btn-primary';
    toggleBtn.disabled = false;
    warningEl.style.display = 'none';
  } else {
    statusEl.className = 'status inactive';
    statusEl.innerHTML = '<div class="dot inactive"></div><span>Not in a quiz</span>';
    detailsEl.style.display = 'none';
    toggleBtn.textContent = 'Start Monitoring';
    toggleBtn.className = 'btn btn-secondary';
    toggleBtn.disabled = true;
    warningEl.style.display = 'none';
  }
}

async function startMonitoring() {
  // This would be called when joining a quiz that requires Fair Play mode
  // The actual session start is triggered by the web app
  alert('Fair Play monitoring starts automatically when you join a quiz that requires it.');
}

async function stopMonitoring() {
  await chrome.runtime.sendMessage({ type: 'END_SESSION' });
  updateUI(null);
}

window.addEventListener('beforeunload', () => {
  if (updateInterval) clearInterval(updateInterval);
});