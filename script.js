const initialTracks = [
  { id: 1, name: "Kick", type: "kick", color: "#ff7b2c", steps: [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0] },
  { id: 2, name: "Snare", type: "snare", color: "#5ad2ff", steps: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0] },
  { id: 3, name: "Hat", type: "hihat", color: "#ffd166", steps: [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0] },
  { id: 4, name: "Bass", type: "bass", color: "#7ce7a9", steps: [1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1] }
];

const state = {
  tracks: [...initialTracks],
  currentStep: 0,
  bpm: 110,
  isPlaying: false,
  timer: null
};

const trackListEl = document.getElementById("trackList");
const patternGridEl = document.getElementById("patternGrid");
const mixerEl = document.getElementById("mixer");
const tempoInput = document.getElementById("tempo");
const tempoValue = document.getElementById("tempoValue");
const playBtn = document.getElementById("playBtn");
const stopBtn = document.getElementById("stopBtn");
const addTrackBtn = document.getElementById("addTrackBtn");
const randomBtn = document.getElementById("randomBtn");
const clearBtn = document.getElementById("clearBtn");
const trackNameInput = document.getElementById("trackName");
const trackTypeInput = document.getElementById("trackType");
const trackColorInput = document.getElementById("trackColor");

function renderTrackList() {
  trackListEl.innerHTML = "";

  state.tracks.forEach((track) => {
    const item = document.createElement("div");
    item.className = "track-item";

    item.innerHTML = `
      <div class="track-meta">
        <span class="dot" style="background:${track.color}; box-shadow: 0 0 14px ${track.color};"></span>
        <span>${track.name}</span>
      </div>
      <button class="remove" aria-label="Remover faixa">×</button>
    `;

    const removeBtn = item.querySelector(".remove");
    removeBtn.addEventListener("click", () => {
      state.tracks = state.tracks.filter(t => t.id !== track.id);
      renderAll();
    });

    trackListEl.appendChild(item);
  });
}

function renderPatternGrid() {
  patternGridEl.innerHTML = "";

  const firstCell = document.createElement("div");
  firstCell.className = "grid-header";
  firstCell.textContent = "Faixa";
  patternGridEl.appendChild(firstCell);

  for (let i = 1; i <= 16; i++) {
    const header = document.createElement("div");
    header.className = "grid-header";
    header.textContent = i;
    patternGridEl.appendChild(header);
  }

  state.tracks.forEach((track) => {
    const label = document.createElement("div");
    label.className = "grid-label";
    label.innerHTML = `
      <span>${track.name}</span>
      <span class="dot" style="background:${track.color}; box-shadow: 0 0 14px ${track.color};"></span>
    `;
    patternGridEl.appendChild(label);

    track.steps.forEach((step, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "step" + (step ? " on" : "") + (index === state.currentStep ? " current" : "");
      btn.title = `${track.name} - passo ${index + 1}`;
      btn.addEventListener("click", () => {
        track.steps[index] = track.steps[index] ? 0 : 1;
        renderPatternGrid();
      });
      patternGridEl.appendChild(btn);
    });
  });
}

function renderMixer() {
  mixerEl.innerHTML = "";

  state.tracks.forEach((track) => {
    const channel = document.createElement("div");
    channel.className = "mixer-channel";

    channel.innerHTML = `
      <div class="name">${track.name}</div>
      <input class="mixer-slider" type="range" min="0" max="100" value="68" />
      <div class="meter"><span></span></div>
    `;

    mixerEl.appendChild(channel);
  });
}

function renderAll() {
  renderTrackList();
  renderPatternGrid();
  renderMixer();
}

function triggerSound(track) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!window.__audioCtx) {
    window.__audioCtx = new AudioCtx();
  }
  const ctx = window.__audioCtx;

  if (ctx.state === "suspended") {
    ctx.resume();
  }

  const now = ctx.currentTime;

  if (track.type === "kick") {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.18);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.5, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);

    return;
  }

  if (track.type === "snare") {
    const bufferSize = ctx.sampleRate * 0.18;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }

    const noise = ctx.createBufferSource();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    filter.type = "highpass";
    filter.frequency.value = 1500;

    noise.buffer = buffer;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.36, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.18);

    return;
  }

  if (track.type === "hihat") {
    const bufferSize = ctx.sampleRate * 0.08;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.8);
    }

    const noise = ctx.createBufferSource();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    filter.type = "highpass";
    filter.frequency.value = 7000;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

    noise.buffer = buffer;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.08);

    return;
  }

  if (track.type === "bass") {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(55, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.24);

    return;
  }

  if (track.type === "lead") {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(220, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);

    return;
  }

  if (track.type === "pad") {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(130.81, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  }
}

function playPattern() {
  state.tracks.forEach((track) => {
    if (track.steps[state.currentStep]) {
      triggerSound(track);
    }
  });

  renderPatternGrid();
  state.currentStep = (state.currentStep + 1) % 16;
}

function startPlayback() {
  stopPlayback(false);

  const stepIntervalMs = (60 / state.bpm / 2) * 1000;
  state.isPlaying = true;

  state.timer = setInterval(() => {
    playPattern();
  }, stepIntervalMs);
}

function stopPlayback(reset = true) {
  if (state.timer) {
    clearInterval(state.timer);
    state.timer = null;
  }

  state.isPlaying = false;

  if (reset) {
    state.currentStep = 0;
    renderPatternGrid();
  }
}

function addTrack() {
  const name = document.getElementById("trackName").value.trim() || "Nova faixa";
  const type = document.getElementById("trackType").value;
  const color = document.getElementById("trackColor").value || "#ff7b2c";

  state.tracks.push({
    id: Date.now() + Math.random(),
    name,
    type,
    color,
    steps: Array(16).fill(0)
  });

  document.getElementById("trackName").value = "";
  renderAll();
}

function randomizeTracks() {
  state.tracks.forEach((track) => {
    track.steps = Array.from({ length: 16 }, () => (Math.random() > 0.65 ? 1 : 0));
  });
  renderPatternGrid();
}

function clearTracks() {
  state.tracks.forEach((track) => {
    track.steps = Array(16).fill(0);
  });
  renderPatternGrid();
}

tempoInput.addEventListener("input", () => {
  state.bpm = Number(tempoInput.value);
  tempoValue.textContent = `${state.bpm} BPM`;

  if (state.isPlaying) {
    startPlayback();
  }
});

playBtn.addEventListener("click", () => {
  if (!state.isPlaying) {
    startPlayback();
  }
});

stopBtn.addEventListener("click", () => {
  stopPlayback();
});

addTrackBtn.addEventListener("click", addTrack);
randomBtn.addEventListener("click", randomizeTracks);
clearBtn.addEventListener("click", clearTracks);

tempoValue.textContent = `${state.bpm} BPM`;
renderAll();
