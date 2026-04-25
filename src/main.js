import './style.css';
import { tabs, aspectRatios, resolutions, quickPrompts } from './data/studios.js';
import { createModelCatalog, defaultModel } from './data/modelCatalog.js';
import { loadHistory, loadSettings, saveHistory, saveSettings } from './lib/storage.js';
import { confettiBurst, toast, startParticles } from './lib/effects.js';

const modelCatalog = createModelCatalog();
const app = document.querySelector('#app');

const state = {
  activeTab: 'image',
  prompt: '',
  generating: false,
  progress: 0,
  eta: 0,
  sessionResults: [],
  uploads: [],
  model: defaultModel,
  modelSearch: '',
  localInference: false,
  controls: {
    aspect: aspectRatios[0],
    resolution: resolutions[0],
    quality: 80,
    steps: 28,
    cfg: 6.5,
    duration: 6,
    motion: 55,
  },
  history: loadHistory(),
  historyFilter: {
    studio: 'all',
    model: 'all',
    date: 'all',
  },
  settings: loadSettings(),
};

function getFlatModels() {
  return modelCatalog.flatMap((group) => group.models);
}

function fakeAsset(studio) {
  if (studio === 'video' || studio === 'cinema' || studio === 'lipsync') return '🎞️';
  return '🖼️';
}

function render() {
  app.innerHTML = `
    <canvas id="particles"></canvas>
    <aside class="sidebar glass-panel">
      <div>
        <div class="brand">Open Generative AI</div>
        <div class="sub-brand">Uncensored Creative Studio</div>
      </div>
      <nav class="tab-list">
        ${tabs
          .map(
            (tab) => `<button class="tab-btn ${state.activeTab === tab.id ? 'active' : ''}" data-tab="${tab.id}">
              <span>${tab.icon}</span><span>${tab.label}</span>
            </button>`,
          )
          .join('')}
      </nav>
      <div class="badge">🔴 Uncensored Mode</div>
      <footer class="side-footer">
        <a href="https://discord.com" target="_blank" rel="noreferrer">Discord</a>
        <a href="https://github.com/Anil-matcha/Open-Generative-AI" target="_blank" rel="noreferrer">GitHub</a>
      </footer>
    </aside>

    <main class="main-shell">
      <header class="top-row glass-panel">
        <h1>${tabs.find((tab) => tab.id === state.activeTab)?.label}</h1>
        <div class="top-actions">
          <button id="enhancePrompt" class="ghost-btn">✨ Enhance</button>
          <button id="generateBtn" class="generate-btn ${state.generating ? 'active' : ''}">⚡ Generate</button>
        </div>
      </header>

      <section class="workspace">
        <div class="left-pane glass-panel">
          ${renderStudioPanel()}
        </div>
        <div class="right-pane glass-panel">
          ${renderPreviewPanel()}
        </div>
      </section>
    </main>

    <div id="toast-stack"></div>
  `;

  bindEvents();
  startParticles(document.querySelector('#particles'));
}

function renderStudioPanel() {
  if (state.activeTab === 'history') return renderHistory();
  if (state.activeTab === 'settings') return renderSettings();

  return `
    <section class="field-wrap">
      <label>Prompt</label>
      <textarea id="promptInput" rows="7" placeholder="Describe something dangerously creative...">${state.prompt}</textarea>
      <div class="chip-row">
        ${quickPrompts
          .map((prompt) => `<button class="chip" data-prompt="${prompt}">${prompt}</button>`)
          .join('')}
      </div>
    </section>

    <section class="field-wrap">
      <label>Reference Uploads (${state.uploads.length}/14)</label>
      <input id="uploadInput" type="file" ${state.activeTab === 'lipsync' ? 'accept="image/*,audio/*"' : 'accept="image/*"'} multiple />
      <div class="upload-grid">
        ${state.uploads
          .map((name, idx) => `<div class="upload-chip"><span class="order">${idx + 1}</span>${name}</div>`)
          .join('') || '<small class="muted">No references uploaded yet.</small>'}
      </div>
    </section>

    <section class="field-wrap">
      <label>Model Selector (200+ models)</label>
      <input id="modelSearch" class="text-input" placeholder="Search Flux, SDXL, Kling, Sora..." value="${state.modelSearch}" />
      <select id="modelSelect" class="text-input" size="7">${renderModelOptions()}</select>
      <label class="toggle-row">
        <input id="localInference" type="checkbox" ${state.localInference ? 'checked' : ''} />
        Use Local Inference (sd.cpp placeholder)
      </label>
    </section>

    ${renderDynamicControls()}
  `;
}

function renderModelOptions() {
  const search = state.modelSearch.toLowerCase().trim();
  return modelCatalog
    .map((group) => {
      const filtered = group.models.filter((model) => model.toLowerCase().includes(search));
      if (!filtered.length) return '';
      return `<optgroup label="${group.group}">${filtered
        .map((model) => `<option value="${model}" ${model === state.model ? 'selected' : ''}>${model}</option>`)
        .join('')}</optgroup>`;
    })
    .join('');
}

function renderDynamicControls() {
  if (state.activeTab === 'lipsync') {
    return `
      <section class="field-wrap">
        <label>Lip Sync Controls</label>
        <div class="control-grid">
          <div><small>Portrait Upload</small><div class="pill muted-pill">Drop portrait image</div></div>
          <div><small>Audio Upload</small><div class="pill muted-pill">Drop voice / song file</div></div>
          <div><small>Sync Preview</small><div class="pill">Preview enabled</div></div>
        </div>
      </section>`;
  }

  return `
    <section class="field-wrap">
      <label>Generation Controls</label>
      <div class="control-grid">
        <div>
          <small>Aspect Ratio</small>
          <div class="pill-row">
            ${aspectRatios
              .map((ratio) => `<button class="pill ${state.controls.aspect === ratio ? 'active' : ''}" data-aspect="${ratio}">${ratio}</button>`)
              .join('')}
          </div>
        </div>
        <div>
          <small>Resolution</small>
          <select id="resolutionSelect" class="text-input">${resolutions
            .map((res) => `<option ${res === state.controls.resolution ? 'selected' : ''}>${res}</option>`)
            .join('')}</select>
        </div>
        <div><small>Quality ${state.controls.quality}</small><input id="qualityInput" type="range" min="30" max="100" value="${state.controls.quality}" /></div>
        <div><small>Steps ${state.controls.steps}</small><input id="stepsInput" type="range" min="10" max="70" value="${state.controls.steps}" /></div>
        <div><small>CFG ${state.controls.cfg}</small><input id="cfgInput" type="range" step="0.5" min="1" max="20" value="${state.controls.cfg}" /></div>
        ${
          state.activeTab === 'video' || state.activeTab === 'cinema'
            ? `<div><small>Duration ${state.controls.duration}s</small><input id="durationInput" type="range" min="2" max="20" value="${state.controls.duration}" /></div>
               <div><small>Motion ${state.controls.motion}%</small><input id="motionInput" type="range" min="1" max="100" value="${state.controls.motion}" /></div>
               <div><small>Start Frame</small><div class="pill muted-pill">Upload optional frame</div></div>`
            : ''
        }
      </div>
    </section>
  `;
}

function renderPreviewPanel() {
  return `
    <section class="preview-head">
      <h3>Live Generation Preview</h3>
      <small>${state.generating ? `ETA ${state.eta}s` : 'Ready to generate'}</small>
    </section>
    <div class="progress-bar">
      <span style="width:${state.progress}%"></span>
    </div>
    <div class="result-grid">
      ${state.sessionResults
        .map(
          (item) => `<article class="result-card">
            <div class="result-thumb">${fakeAsset(item.studio)}</div>
            <div class="result-meta">
              <strong>${item.model}</strong>
              <small>${item.studio} • ${new Date(item.createdAt).toLocaleString()}</small>
            </div>
            <div class="result-actions">
              <button data-action="download" data-id="${item.id}">Download</button>
              <button data-action="upscale" data-id="${item.id}">Upscale</button>
              <button data-action="remix" data-id="${item.id}">Remix</button>
              <button data-action="reference" data-id="${item.id}">Use as ref</button>
            </div>
          </article>`,
        )
        .join('') || '<div class="empty">Your generated assets will appear here.</div>'}
    </div>
  `;
}

function renderHistory() {
  const items = state.history.filter((item) => {
    const studioOkay = state.historyFilter.studio === 'all' || item.studio === state.historyFilter.studio;
    const modelOkay = state.historyFilter.model === 'all' || item.model === state.historyFilter.model;
    const dateOkay =
      state.historyFilter.date === 'all' ||
      new Date(item.createdAt).toDateString() === new Date(state.historyFilter.date).toDateString();
    return studioOkay && modelOkay && dateOkay;
  });

  return `
    <section class="field-wrap">
      <label>History Filters</label>
      <div class="history-filters">
        <select id="historyStudio" class="text-input">
          <option value="all">All Studios</option>
          ${tabs
            .filter((tab) => ['image', 'video', 'lipsync', 'cinema', 'workflow'].includes(tab.id))
            .map((tab) => `<option value="${tab.id}" ${state.historyFilter.studio === tab.id ? 'selected' : ''}>${tab.label}</option>`)
            .join('')}
        </select>
        <select id="historyModel" class="text-input">
          <option value="all">All Models</option>
          ${[...new Set(state.history.map((item) => item.model))]
            .map((model) => `<option value="${model}" ${state.historyFilter.model === model ? 'selected' : ''}>${model}</option>`)
            .join('')}
        </select>
        <input id="historyDate" class="text-input" type="date" value="${state.historyFilter.date === 'all' ? '' : state.historyFilter.date}" />
      </div>
      <div class="result-grid">${
        items
          .map(
            (item) => `<article class="result-card"><div class="result-thumb">${fakeAsset(item.studio)}</div><div class="result-meta"><strong>${item.prompt.slice(
              0,
              64,
            )}</strong><small>${item.model} • ${new Date(item.createdAt).toLocaleString()}</small></div></article>`,
          )
          .join('') || '<div class="empty">No history yet. Generate something wild first.</div>'
      }</div>
    </section>`;
}

function renderSettings() {
  return `
    <section class="field-wrap">
      <label>Provider API Keys</label>
      <div class="control-grid">
        <div><small>Muapi.ai</small><input type="password" id="muapiKey" class="text-input" value="${state.settings.apiKeys.muapi}" placeholder="muapi key" /></div>
        <div><small>OpenRouter</small><input type="password" id="openrouterKey" class="text-input" value="${state.settings.apiKeys.openrouter}" placeholder="openrouter key" /></div>
        <div><small>Replicate</small><input type="password" id="replicateKey" class="text-input" value="${state.settings.apiKeys.replicate}" placeholder="replicate key" /></div>
      </div>
      <label class="toggle-row"><input type="checkbox" id="localModelsToggle" ${state.settings.localInference ? 'checked' : ''}/> Enable Local Models (sd.cpp)</label>
      <button id="saveSettings" class="generate-btn">Save Settings</button>
    </section>
  `;
}

function bindEvents() {
  document.querySelectorAll('[data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.activeTab = btn.dataset.tab;
      render();
    });
  });

  const promptInput = document.querySelector('#promptInput');
  if (promptInput) {
    promptInput.addEventListener('input', (event) => {
      state.prompt = event.target.value;
    });
  }

  document.querySelectorAll('[data-prompt]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.prompt = btn.dataset.prompt;
      render();
    });
  });

  const enhance = document.querySelector('#enhancePrompt');
  if (enhance) {
    enhance.addEventListener('click', () => {
      if (!state.prompt.trim()) {
        toast('Add a prompt first so I can enhance it.', 'warn');
        return;
      }
      state.prompt = `${state.prompt.trim()}, ultra detailed, volumetric lighting, trending artstation, cinematic composition`;
      toast('Prompt enhanced with cinematic spellcraft ✨', 'success');
      render();
    });
  }

  const upload = document.querySelector('#uploadInput');
  if (upload) {
    upload.addEventListener('change', (event) => {
      const next = Array.from(event.target.files || []).map((file) => file.name);
      state.uploads = [...state.uploads, ...next].slice(0, 14);
      toast(`${next.length} asset(s) attached`, 'success');
      render();
    });
  }

  const modelSearch = document.querySelector('#modelSearch');
  if (modelSearch) {
    modelSearch.addEventListener('input', (event) => {
      state.modelSearch = event.target.value;
      render();
    });
  }

  const modelSelect = document.querySelector('#modelSelect');
  if (modelSelect) {
    modelSelect.addEventListener('change', (event) => {
      state.model = event.target.value;
    });
  }

  const localInference = document.querySelector('#localInference');
  if (localInference) {
    localInference.addEventListener('change', (event) => {
      state.localInference = event.target.checked;
      toast(state.localInference ? 'Local inference armed.' : 'Cloud providers re-enabled.', 'info');
    });
  }

  bindRange('qualityInput', 'quality');
  bindRange('stepsInput', 'steps');
  bindRange('cfgInput', 'cfg');
  bindRange('durationInput', 'duration');
  bindRange('motionInput', 'motion');

  const resolution = document.querySelector('#resolutionSelect');
  if (resolution) resolution.addEventListener('change', (event) => (state.controls.resolution = event.target.value));

  document.querySelectorAll('[data-aspect]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.controls.aspect = btn.dataset.aspect;
      render();
    });
  });

  const generateBtn = document.querySelector('#generateBtn');
  if (generateBtn) generateBtn.addEventListener('click', generate);

  document.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      toast(`${btn.dataset.action} action queued`, 'info');
    });
  });

  const saveBtn = document.querySelector('#saveSettings');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      state.settings.apiKeys.muapi = document.querySelector('#muapiKey')?.value || '';
      state.settings.apiKeys.openrouter = document.querySelector('#openrouterKey')?.value || '';
      state.settings.apiKeys.replicate = document.querySelector('#replicateKey')?.value || '';
      state.settings.localInference = document.querySelector('#localModelsToggle')?.checked || false;
      saveSettings(state.settings);
      toast('Settings encrypted in browser storage.', 'success');
    });
  }

  const historyStudio = document.querySelector('#historyStudio');
  if (historyStudio) historyStudio.addEventListener('change', (e) => ((state.historyFilter.studio = e.target.value), render()));

  const historyModel = document.querySelector('#historyModel');
  if (historyModel) historyModel.addEventListener('change', (e) => ((state.historyFilter.model = e.target.value), render()));

  const historyDate = document.querySelector('#historyDate');
  if (historyDate)
    historyDate.addEventListener('change', (e) => {
      state.historyFilter.date = e.target.value || 'all';
      render();
    });
}

function bindRange(id, key) {
  const el = document.querySelector(`#${id}`);
  if (!el) return;
  el.addEventListener('input', (event) => {
    state.controls[key] = Number(event.target.value);
    render();
  });
}

function generate() {
  if (state.generating) return;
  if (!state.prompt.trim()) {
    toast('A prompt is required to generate.', 'warn');
    return;
  }

  state.generating = true;
  state.progress = 2;
  state.eta = 12;
  render();

  const interval = setInterval(() => {
    state.progress = Math.min(100, state.progress + Math.ceil(Math.random() * 16));
    state.eta = Math.max(0, state.eta - 1);
    render();

    if (state.progress >= 100) {
      clearInterval(interval);
      const item = {
        id: crypto.randomUUID(),
        studio: state.activeTab,
        prompt: state.prompt,
        model: state.model,
        createdAt: Date.now(),
      };

      state.sessionResults = [item, ...state.sessionResults].slice(0, 24);
      state.history = [item, ...state.history].slice(0, 250);
      saveHistory(state.history);
      confettiBurst(document.body);
      toast('Generation complete. Zero guardrails, maximum creativity.', 'success');

      state.generating = false;
      state.progress = 0;
      state.eta = 0;
      render();
    }
  }, 520);
}

window.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
    event.preventDefault();
    generate();
  }
});

if (!state.settings.theme) state.settings.theme = 'Cyber Neon';
if (typeof state.settings.uncensoredMode !== 'boolean') state.settings.uncensoredMode = true;

// Build and hydrate the full shell.
render();

// Ensure there are always more than 200 available models in the selector.
if (getFlatModels().length < 200) {
  toast('Model catalog failed to load full 200+ list.', 'warn');
}
