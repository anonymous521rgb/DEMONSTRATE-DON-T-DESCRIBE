let catalog = [];

const groups = {
  style: ["classical", "country", "electronic", "jazz", "pop", "rock"],
  instrument: ["remove", "add", "replace"],
  partial: ["partial"],
};
const groupTitles = {
  add: "Instrument addition",
  remove: "Instrument removal",
  replace: "Instrument replacement",
};
const metrics = [
  ["ET", "Edit Transfer", "Whether the output applies the same edit demonstrated by the exemplar pair to the query audio."],
  ["SP", "Source Preservation", "How well the output preserves content in the query audio unrelated to the target edit."],
  ["TEA", "Target Edit Audibility", "How easy it is to hear the demonstrated change in the output compared with the original query audio."],
  ["AQ", "Audio Quality", "How natural and clear the output sounds, including whether it contains audible noise, distortion, or other artifacts."],
];
// Illustrative totals on a six-rating scale, in ET/SP/TEA/AQ order.
const scoreTotals = {
  N07: [24, 7, 25, 23],
  N03: [17, 8, 19, 18],
  N04: [25, 13, 23, 24],
  N05: [29, 23, 24, 25],
  N06: [24, 25, 11, 23],
  N08: [24, 15, 24, 24],
};
const titleCase = (value) => value.charAt(0).toUpperCase() + value.slice(1);
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[char]);

function audioBlock(label, url, modifier = "") {
  return `<div class="audio-block ${modifier}"><div class="audio-label">${label}</div><audio controls preload="none" src="${escapeHTML(url)}" aria-label="${label}"></audio></div>`;
}

function renderDrumsComparison(position) {
  document.querySelector("#drums-comparison").innerHTML = `<article class="sample-card">
    <div class="sample-top sample-top-new">
      <span class="new-badge">New</span>
      <div class="sample-index">${String(position).padStart(2, "0")}</div>
      <div class="sample-ident"><h3 id="drums-title">Add Drums · Listening comparison</h3></div>
    </div>
    <div class="drums-scroll" role="region" aria-labelledby="drums-title" tabindex="0">
      <table class="drums-table">
        <thead><tr>
          <th scope="col">Demonstration references <span class="drums-instruments">X = drums</span></th>
          <th scope="col">Query B <span class="drums-instruments">Piano + acoustic guitar</span>${audioBlock("Query B source", "audio/new-1-source.flac")}</th>
          <th scope="col">Query C <span class="drums-instruments">Piano + electric guitar + bass</span>${audioBlock("Query C source", "audio/new-2-source.flac")}</th>
        </tr></thead>
        <tbody>
          <tr>
            <th scope="row">A → A + X <span class="drums-instruments">Piano + acoustic guitar + bass → same instruments + drums</span>
              ${audioBlock("A · Before", "audio/drums-a-before.flac")}
              ${audioBlock("A + X · After", "audio/drums-a-after.flac")}
            </th>
            <td>${audioBlock("Edited output", "audio/drums-a-b.flac", "outcome")}</td>
            <td>${audioBlock("Edited output", "audio/new-2-output.flac", "outcome")}</td>
          </tr>
          <tr>
            <th scope="row">D → D + X <span class="drums-instruments">Bass → bass + drums</span>
              ${audioBlock("D · Before", "audio/drums-d-before.flac")}
              ${audioBlock("D + X · After", "audio/drums-d-after.flac")}
            </th>
            <td>${audioBlock("Edited output", "audio/new-1-output.flac", "outcome")}</td>
            <td>${audioBlock("Edited output", "audio/drums-d-c.flac", "outcome")}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </article>`;
}

function scorePanel(totals) {
  return `<aside class="pair score-panel" aria-label="Illustrative scores">
    <div class="pair-heading">Illustrative scores <span class="score-scale">/ 5</span></div>
    <dl class="score-grid">${metrics.map(([key, name], i) =>
      `<div><dt><abbr title="${name}">${key}</abbr></dt><dd>${(totals[i] / 6).toFixed(2)}</dd></div>`
    ).join("")}</dl>
    <details class="metric-guide">
      <summary>Metric definitions</summary>
      <dl>${metrics.map(([key, name, description]) =>
        `<dt>${key} · ${name}</dt><dd>${description}</dd>`
      ).join("")}</dl>
    </details>
  </aside>`;
}

function card(item, position) {
  const hasDemo = item.audio.demo_before && item.audio.demo_after;
  const totals = item.isNew && scoreTotals[item.id];
  return `<article class="sample-card">
    <div class="sample-top${item.isNew ? ' sample-top-new' : ''}">
      ${item.isNew ? '<span class="new-badge">New</span>' : ''}
      <div class="sample-index">${String(position).padStart(2, "0")}</div>
      <div class="sample-ident">
        <h3>${escapeHTML(item.title)}</h3>
      </div>
    </div>
    <div class="listening-columns${hasDemo ? '' : ' single-pair'}${totals ? ' with-scores' : ''}">
      ${hasDemo ? `<div class="pair demonstration">
        <div class="pair-heading"><span class="pair-icon">↗</span><span>${item.separateExemplars ? "Demonstration references" : "Demonstration pair"}</span></div>
        ${audioBlock(item.separateExemplars ? "Before · different exemplar" : "Before", item.audio.demo_before)}
        ${audioBlock("After", item.audio.demo_after)}
      </div>` : ''}
      <div class="pair transfer">
        <div class="pair-heading"><span class="pair-icon">↗</span><span>Transferred edit</span></div>
        ${audioBlock("Source", item.audio.query_before)}
        ${audioBlock(item.outputLabel || "Our output", item.audio.query_after, "outcome")}
        ${item.audio.native_text ? audioBlock(item.comparisonLabel || "MelodyFlow text editing", item.audio.native_text) : ''}
        ${item.audio.native_text && item.nativePrompt ? `<details class="metric-guide text-prompt">
          <summary>${escapeHTML(item.promptLabel || "Text prompt")}</summary>
          <p>${escapeHTML(item.nativePrompt)}</p>
        </details>` : ''}
      </div>
      ${totals ? scorePanel(totals) : ''}
    </div>
  </article>`;
}

function renderDomain(nextPosition, domain, showNew = false, target = domain) {
  const items = catalog.filter((item) => item.domain === domain);
  if (["partial", "rare", "compound"].includes(domain)) {
    document.querySelector(`#${target}-gallery`).innerHTML = items.map((item) => card(item, nextPosition())).join("");
    return;
  }
  const markup = groups[domain].map((group) => {
    const members = items.filter((item) => item.subcategory === group && Boolean(item.isNew) === showNew);
    if (!members.length) return "";
    const title = domain === "style" ? `${titleCase(group)} source` : groupTitles[group];
    return `<div class="subgroup" aria-label="${escapeHTML(title)}">
      <h3 class="subgroup-title">${escapeHTML(title)} · ${members.length}</h3>
      ${members.map((item) => card(item, nextPosition())).join("")}
    </div>`;
  }).join("");
  document.querySelector(`#${target}-gallery`).innerHTML = markup || `<p class="empty">No examples in this category.</p>`;
}

async function init() {
  try {
    const data = window.DEMO_CATALOG;
    if (!data) throw new Error("The demo catalog could not be loaded.");
    if (data.count !== data.items.length) throw new Error("The demo catalog is incomplete.");
    catalog = data.items;
    let position = 0;
    const nextPosition = () => ++position;
    renderDrumsComparison(nextPosition());
    renderDomain(nextPosition, "instrument", true, "new");
    renderDomain(nextPosition, "style", true, "new-style");
    renderDomain(nextPosition, "partial");
    renderDomain(nextPosition, "rare");
    renderDomain(nextPosition, "compound");
    renderDomain(nextPosition, "instrument");
    renderDomain(nextPosition, "style");
  } catch (error) {
    document.querySelector("#drums-comparison").innerHTML = `<p class="error">${escapeHTML(error.message)}</p>`;
    for (const domain of ["new", "new-style", "rare", "compound", ...Object.keys(groups)]) {
      document.querySelector(`#${domain}-gallery`).innerHTML = `<p class="error">${escapeHTML(error.message)}</p>`;
    }
  }
}

document.addEventListener("play", (event) => {
  if (event.target.tagName !== "AUDIO") return;
  document.querySelectorAll("audio").forEach((audio) => {
    if (audio !== event.target) audio.pause();
  });
}, true);
init();
