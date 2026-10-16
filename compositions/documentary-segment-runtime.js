(() => {
  const script = document.currentScript;
  const rootId = script instanceof HTMLScriptElement ? script.dataset.segmentRootId : "";
  const root = rootId
    ? document.getElementById(rootId)
    : document.querySelector("[data-segment-root]");
  if (!root || typeof gsap === "undefined") return;

  const segmentId = root.dataset.compositionId;
  const duration = Number(root.dataset.duration || 120);
  const accent = root.dataset.accent || "#c6472d";
  const beats = JSON.parse(root.dataset.beats || "[]");
  const timeline = gsap.timeline({ paused: true });

  window.__timelines = window.__timelines || {};
  window.__timelines[segmentId] = timeline;

  root.style.setProperty("--accent", accent);
  root.style.setProperty("--duration", `${duration}s`);
  root.innerHTML = `
    <div class="seg-bg clip" data-start="0" data-duration="${duration}" data-track-index="2">
      <div class="grid"></div><div class="paper-noise"></div><div class="vignette"></div>
    </div>
    <div class="seg-dust clip" data-start="0" data-duration="${duration}" data-track-index="3">
      <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
    </div>
    <div class="seg-content clip" data-start="0" data-duration="${duration}" data-track-index="4"></div>
    <div class="seg-chart clip" data-start="0" data-duration="${duration}" data-track-index="5"></div>
    <div class="seg-type clip" data-start="0" data-duration="${duration}" data-track-index="6">
      <div class="eyebrow"></div><h1></h1><p></p><div class="source"></div>
    </div>
    <div class="seg-caption clip" data-start="0" data-duration="${duration}" data-track-index="7"></div>
  `;

  const content = root.querySelector(".seg-content");
  const type = root.querySelector(".seg-type");
  const eyebrow = type.querySelector(".eyebrow");
  const headline = type.querySelector("h1");
  const dek = type.querySelector("p");
  const source = type.querySelector(".source");
  const caption = root.querySelector(".seg-caption");
  const dust = root.querySelectorAll(".seg-dust i");
  const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));

  dust.forEach((particle, index) => {
    particle.style.left = `${8 + index * 13}%`;
    particle.style.top = `${16 + (index * 19) % 70}%`;
    particle.style.width = `${2 + index % 3}px`;
    particle.style.height = `${2 + (index + 1) % 4}px`;
  });

  const renderBeat = (beat, index) => {
    const start = Number(beat.start);
    const end = Number(beat.end);
    const id = `${segmentId}-beat-${index}`;
    const accentColor = beat.accent || accent;
    const layout = beat.layout || "statement";
    const labels = (beat.labels || []).map((label) => `<span>${esc(label)}</span>`).join("");
    const cards = (beat.cards || []).map((card, cardIndex) => `
      <div class="evidence-card" id="${id}-card-${cardIndex}" style="--card-accent:${card.accent || accentColor}">
        <small>${esc(card.kicker || "DOCUMENT")}</small><strong>${esc(card.title)}</strong>
        <em>${esc(card.detail || "")}</em>
      </div>`).join("");
    const values = (beat.values || []).map((value, valueIndex) => `
      <div class="metric" id="${id}-metric-${valueIndex}">
        <b data-count="${Number(value.value || 0)}" data-prefix="${esc(value.prefix || "")}" data-suffix="${esc(value.suffix || "")}">${esc(value.prefix || "")}0${esc(value.suffix || "")}</b>
        <span>${esc(value.label || "")}</span>
      </div>`).join("");
    const chartMarkup = beat.chart ? `
      <svg class="chart-svg" viewBox="0 0 900 360" role="img" aria-label="${esc(beat.chart.label || "Data visualization")}">
        <path class="chart-axis" d="M60 30V310H860" />
        <path class="chart-line" d="${esc(beat.chart.path)}" pathLength="1" />
        ${(beat.chart.points || []).map((point) => `<circle cx="${point[0]}" cy="${point[1]}" r="8" />`).join("")}
      </svg>` : "";

    const panel = document.createElement("div");
    panel.className = `beat-panel ${layout}`;
    panel.id = id;
    panel.dataset.start = start;
    panel.dataset.duration = end - start;
    panel.dataset.trackIndex = "4";
    panel.innerHTML = `
      <div class="beat-rule" style="background:${accentColor}"></div>
      <div class="beat-label">${esc(beat.label || `CASE FILE ${index + 1}`)}</div>
      <div class="beat-copy">${esc(beat.copy || "")}</div>
      <div class="beat-labels">${labels}</div>${cards}${values}${chartMarkup}
    `;
    content.appendChild(panel);

    const scene = gsap.timeline();
    scene.set(panel, { autoAlpha: 0, x: 230, y: 18, scale: 0.98 });
    scene.to(panel, { autoAlpha: 1, x: 0, y: 0, scale: 1, duration: 0.55, ease: "power4.out" }, start);
    scene.to(panel, { x: -230, autoAlpha: 0, duration: 0.34, ease: "power4.in" }, end - 0.34);
    if (beat.chart) {
      const line = panel.querySelector(".chart-line");
      scene.set(line, { strokeDashoffset: 1 }, start + 0.25);
      scene.to(line, { strokeDashoffset: 0, duration: Math.min(2.2, end - start - 0.5), ease: "power2.out" }, start + 0.25);
      scene.fromTo(panel.querySelectorAll("circle"), { scale: 0, transformOrigin: "center" }, { scale: 1, stagger: 0.12, duration: 0.28, ease: "back.out(1.5)" }, start + 0.8);
    }
    const evidenceCards = panel.querySelectorAll(".evidence-card");
    if (evidenceCards.length > 0) {
      scene.fromTo(evidenceCards, { y: 55, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.16, duration: 0.4, ease: "power4.out" }, start + 0.35);
    }
    const metrics = panel.querySelectorAll(".metric");
    if (metrics.length > 0) {
      scene.fromTo(metrics, { y: 32, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.12, duration: 0.4, ease: "power4.out" }, start + 0.35);
    }
    panel.querySelectorAll("[data-count]").forEach((counter) => {
      const target = Number(counter.dataset.count);
      const precision = Number.isInteger(target) ? 0 : (String(target).split(".")[1] || "").length;
      const state = { value: 0 };
      scene.to(state, {
        value: target,
        duration: Math.min(1.4, end - start - 0.4),
        ease: "power2.out",
        onUpdate: () => {
          counter.textContent = `${counter.dataset.prefix}${state.value.toFixed(precision)}${counter.dataset.suffix}`;
        }
      }, start + 0.45);
    });
    timeline.add(scene, 0);
  };

  beats.forEach(renderBeat);

  const updateType = (time) => {
    const beat = beats.find((item) => time >= item.start && time < item.end) || beats[beats.length - 1] || {};
    eyebrow.textContent = beat.eyebrow || root.dataset.title || "THE GREAT AI JOB APOCALYPSE";
    headline.textContent = beat.headline || "";
    dek.textContent = beat.dek || "";
    source.textContent = beat.source || "";
    caption.textContent = beat.caption || "";
    caption.style.borderColor = beat.accent || accent;
  };

  timeline.eventCallback("onUpdate", () => updateType(timeline.time()));
  timeline.set([type, caption], { autoAlpha: 0 });
  beats.forEach((beat) => {
    const start = Number(beat.start);
    const end = Number(beat.end);
    timeline.to([type, caption], { autoAlpha: 1, duration: 0.2 }, start);
    timeline.to(type, { x: 0, duration: 0.35, ease: "power4.out" }, start);
    timeline.to(type, { x: -90, autoAlpha: 0, duration: 0.26, ease: "power4.in" }, end - 0.26);
    timeline.to(caption, { autoAlpha: 0, duration: 0.18 }, end - 0.2);
  });
  const grid = root.querySelector(".seg-bg .grid");
  const dustLayer = root.querySelector(".seg-dust");
  timeline.set(grid, { x: 0, y: 0 });
  timeline.to(grid, { x: -160, y: -90, duration, ease: "none" }, 0);
  timeline.to(dustLayer, { x: -110, y: 60, duration, ease: "none" }, 0);
  timeline.seek(0);
})();
