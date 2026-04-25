const KEYS = {
  history: 'oga_history_v2',
  settings: 'oga_settings_v2',
};

function safeRead(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function loadHistory() {
  return safeRead(KEYS.history, []);
}

export function saveHistory(history) {
  localStorage.setItem(KEYS.history, JSON.stringify(history));
}

export function loadSettings() {
  return safeRead(KEYS.settings, {
    apiKeys: {
      muapi: '',
      openrouter: '',
      replicate: '',
    },
    localInference: false,
    theme: 'Cyber Neon',
    uncensoredMode: true,
  });
}

export function saveSettings(settings) {
  localStorage.setItem(KEYS.settings, JSON.stringify(settings));
}
