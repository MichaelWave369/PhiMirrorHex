/* E2 Living Hex: browser-native deterministic synthetic replay.
   Mirrors phimirrorhex/simulation.py. This is NOT external agent telemetry. */

export const PHI = (1 + Math.sqrt(5)) / 2;
export const BUDGETS = Object.freeze([55, 89, 144, 233, 377, 610, 666]);
export const RADII = Object.freeze([1, 2, 3, 5, 8, 13]);
export const ABOVE = Object.freeze(["hypothesis", "imagination", "reasoning", "prediction", "synthesis", "planning"]);
export const BELOW = Object.freeze(["observation", "measurement", "simulation", "falsification", "audit", "execution"]);
const THRESHOLD = .45;
const INJECTIONS = new Set(["0:3", "2:4", "4:1"]);
const clamp = x => Math.max(0, Math.min(1, x));
const quant = x => Number(x.toFixed(6));

export function simulateFrame(step, seed = 369, anomaly = true) {
  if (!Number.isInteger(step) || step < 0 || step >= 256) throw new RangeError("step must be 0..255");
  if (!Number.isInteger(seed) || seed < 0 || seed > 2147483647) throw new RangeError("seed must be a nonnegative 32-bit signed integer");
  if (typeof anomaly !== "boolean") throw new TypeError("anomaly must be boolean");
  const channels = [];
  for (let upper = 0; upper < 6; upper++) {
    for (let lower = 0; lower < 6; lower++) {
      const phase = (step + 1) * (.13 + upper * .011) + lower * .73 + seed * .0001;
      const claim = quant(clamp(.5 + .33 * Math.sin(phase)));
      let observation = clamp(claim + .07 * Math.cos(step * .17 + lower * .47 + upper * .31));
      const injected = anomaly && step >= 10 && step <= 17 && INJECTIONS.has(upper + ":" + lower);
      if (injected) observation = claim >= .5 ? 0 : 1;
      observation = quant(observation);
      const disagreement = quant(Math.abs(claim - observation));
      channels.push({
        id: "U" + (upper + 1) + ":L" + (lower + 1),
        upper: ABOVE[upper],
        lower: BELOW[lower],
        claim,
        observation,
        disagreement,
        activity: quant((claim + observation) / 2),
        flagged: disagreement >= THRESHOLD,
        injected
      });
    }
  }
  const mean_disagreement = quant(channels.reduce((s, c) => s + c.disagreement, 0) / 36);
  const max_disagreement = Math.max(...channels.map(c => c.disagreement));
  const flagged_count = channels.filter(c => c.flagged).length;
  const candidate_score = quant(Math.pow(1 - mean_disagreement, 1 / 3) * Math.exp(-PHI * max_disagreement));
  return {
    step,
    channels,
    gate: {flagged_count, mean_disagreement, max_disagreement, candidate_score, alert: flagged_count > 0}
  };
}

export async function rankPeerEdges(seed = 369, subtle = globalThis.crypto?.subtle) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 2147483647) throw new RangeError("invalid seed");
  if (!subtle) throw new Error("SHA-256 Web Crypto is required for canonical E1 peer ranking");
  const names = Array.from({length: 36}, (_, k) => "U" + (Math.floor(k / 6) + 1) + ":L" + ((k % 6) + 1));
  const pairs = [];
  for (let i = 0; i < 36; i++) for (let j = i + 1; j < 36; j++) pairs.push([i, j]);
  const encoder = new TextEncoder();
  const weighted = await Promise.all(pairs.map(async pair => {
    const material = seed + "|" + names[pair[0]] + "|" + names[pair[1]];
    const hash = new Uint8Array(await subtle.digest("SHA-256", encoder.encode(material)));
    return {pair, hash: Array.from(hash, x => x.toString(16).padStart(2, "0")).join("")};
  }));
  weighted.sort((a, b) => a.hash.localeCompare(b.hash) || a.pair[0] - b.pair[0] || a.pair[1] - b.pair[1]);
  return weighted.map(item => item.pair);
}

function mount() {
  const canvas = document.getElementById("e2-canvas");
  if (!canvas) return;
  const context = canvas.getContext("2d");
  if (!context) return;
  const pick = id => document.getElementById(id);
  const frameSlider = pick("e2-frame");
  const stageSlider = pick("e2-budget");
  const playButton = pick("e2-play");
  const seedInput = pick("e2-seed");
  const anomalyToggle = pick("e2-anomaly");
  let seed = 369;
  let timer = null;
  let ranked = [];
  let selectedChannel = 0;
  let positions = [];

  const metrics = () => simulateFrame(Number(frameSlider.value), seed, anomalyToggle.checked);
  function draw() {
    const frame = metrics();
    const stage = Number(stageSlider.value);
    const budget = BUDGETS[stage];
    const w = Math.max(300, Math.round(canvas.getBoundingClientRect().width));
    const h = Math.max(330, Math.round(canvas.getBoundingClientRect().height));
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(w * ratio) || canvas.height !== Math.round(h * ratio)) {
      canvas.width = Math.round(w * ratio);
      canvas.height = Math.round(h * ratio);
    }
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h / 2;
    const rMax = Math.min(w, h) * .43;
    positions = frame.channels.map((_, idx) => {
      const upper = Math.floor(idx / 6), lower = idx % 6;
      const r = rMax * (.12 + .88 * RADII[upper] / 13);
      const angle = -Math.PI / 2 + lower * Math.PI / 3 + upper * Math.PI / 36;
      return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
    });

    // Six distinct Fibonacci-relative six-point rings.
    for (let upper = 5; upper >= 0; upper--) {
      context.beginPath();
      for (let lower = 0; lower < 6; lower++) {
        const [x, y] = positions[upper * 6 + lower];
        if (!lower) context.moveTo(x, y); else context.lineTo(x, y);
      }
      context.closePath();
      context.strokeStyle = "rgba(107,207,220," + (.12 + upper * .04) + ")";
      context.lineWidth = 1;
      context.stroke();
    }
    // 36 gate links are always present.
    context.beginPath();
    for (const [x, y] of positions) {
      context.moveTo(cx, cy);
      context.lineTo(x, y);
    }
    context.strokeStyle = "rgba(240,198,133,.20)";
    context.lineWidth = 1;
    context.stroke();

    // Canonical SHA-256 E1 ranking, exactly budget - 36 peer links.
    const peerCount = Math.min(ranked.length, budget - 36);
    context.beginPath();
    for (let k = 0; k < peerCount; k++) {
      const [i, j] = ranked[k];
      context.moveTo(...positions[i]);
      context.lineTo(...positions[j]);
    }
    context.lineWidth = .8;
    context.strokeStyle = "rgba(122,190,206," + (budget >= 377 ? .085 : .15) + ")";
    context.stroke();

    // Dynamic channel activity + flags. A named channel never loses identity.
    frame.channels.forEach((channel, index) => {
      const [x, y] = positions[index];
      const radius = 2.5 + channel.activity * 5.5;
      context.beginPath(); context.arc(x, y, radius + (channel.flagged ? 4 : 0), 0, 2 * Math.PI);
      context.fillStyle = channel.flagged ? "rgba(254,145,102,.14)" : "rgba(95,216,227,.13)";
      context.fill();
      context.beginPath(); context.arc(x, y, radius, 0, 2 * Math.PI);
      context.fillStyle = channel.flagged ? "#ff926e" : "#67d8e0";
      context.fill();
      if (index === selectedChannel) {
        context.beginPath(); context.arc(x, y, radius + 5.5, 0, 2 * Math.PI);
        context.lineWidth = 2; context.strokeStyle = "#ffe0a1"; context.stroke();
      }
    });
    context.beginPath(); context.arc(cx, cy, frame.gate.alert ? 10 : 7, 0, 2 * Math.PI);
    context.fillStyle = frame.gate.alert ? "#ff926e" : "#f0c685"; context.fill();

    const selected = frame.channels[selectedChannel];
    pick("e2-step-label").textContent = String(frame.step).padStart(2, "0");
    pick("e2-budget-label").textContent = budget + " / 666";
    pick("e2-coverage").textContent = (100 * budget / 666).toFixed(1) + "%";
    pick("e2-score").textContent = frame.gate.candidate_score.toFixed(3);
    pick("e2-alerts").textContent = String(frame.gate.flagged_count);
    pick("e2-gate").textContent = frame.gate.alert ? "Synthetic disagreement detected" : "No flagged synthetic disagreement";
    pick("e2-gate").dataset.alert = String(frame.gate.alert);
    pick("e2-channel").textContent = selected.id + " · " + selected.upper + " → " + selected.lower +
      " · claim " + selected.claim.toFixed(3) + " / observation " + selected.observation.toFixed(3) +
      " / delta " + selected.disagreement.toFixed(3) + (selected.injected ? " · INJECTED TEST" : "");
    pick("e2-peer-count").textContent = ranked.length ? String(peerCount) : "ranking…";
  }
  function stop() {
    if (timer !== null) clearInterval(timer);
    timer = null;
    playButton.textContent = "▶ Play";
    playButton.setAttribute("aria-pressed", "false");
  }
  function togglePlayback() {
    if (timer !== null) {stop(); return;}
    playButton.textContent = "Ⅱ Pause";
    playButton.setAttribute("aria-pressed", "true");
    timer = setInterval(() => {
      frameSlider.value = String((Number(frameSlider.value) + 1) % 24);
      draw();
    }, 500);
  }
  playButton.addEventListener("click", togglePlayback);
  pick("e2-reset").addEventListener("click", () => {stop(); frameSlider.value = "0"; draw();});
  frameSlider.addEventListener("input", () => {stop(); draw();});
  stageSlider.addEventListener("input", draw);
  anomalyToggle.addEventListener("change", draw);
  seedInput.addEventListener("change", async () => {
    const requested = Number(seedInput.value);
    if (!Number.isInteger(requested) || requested < 0 || requested > 2147483647) {
      seedInput.value = String(seed);
      pick("e2-status").textContent = "Invalid seed: expected integer 0..2147483647";
      return;
    }
    stop();
    seed = requested;
    ranked = [];
    draw();
    try {
      ranked = await rankPeerEdges(seed);
      pick("e2-status").textContent = "Canonical SHA-256 peer ranking loaded for seed " + seed;
      draw();
    } catch (error) {
      pick("e2-status").textContent = "Ranking unavailable: " + error.message + ". Gate edges remain visible.";
    }
  });
  canvas.addEventListener("click", event => {
    const bounds = canvas.getBoundingClientRect();
    const x = event.clientX - bounds.left, y = event.clientY - bounds.top;
    let candidate = selectedChannel, distance = Infinity;
    positions.forEach((point, index) => {
      const d = Math.hypot(x - point[0], y - point[1]);
      if (d < distance) {distance = d; candidate = index;}
    });
    if (distance < 25) selectedChannel = candidate;
    draw();
  });
  window.addEventListener("resize", draw);
  document.addEventListener("visibilitychange", () => {if (document.hidden) stop();});
  draw();
  rankPeerEdges(seed).then(edges => {
    ranked = edges;
    pick("e2-status").textContent = "Canonical SHA-256 peer ranking ready; signals are synthetic, not agent telemetry.";
    draw();
  }).catch(error => {
    pick("e2-status").textContent = "Ranking unavailable: " + error.message + ". Gate edges remain visible.";
  });
}
if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, {once: true});
  else mount();
}
