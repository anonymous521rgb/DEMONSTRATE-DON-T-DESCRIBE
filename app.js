let catalog = [];

const groups = {
  style: ["classical", "country", "electronic", "jazz"],
  instrument: ["remove", "add", "replace"],
};
const groupTitles = {
  add: "Instrument addition",
  remove: "Instrument removal",
  replace: "Instrument replacement",
};
const titleCase = (value) => value.charAt(0).toUpperCase() + value.slice(1);
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[char]);

function audioBlock(label, url, modifier = "") {
  return `<div class="audio-block ${modifier}"><div class="audio-label">${label}</div><audio controls preload="none" src="${escapeHTML(url)}" aria-label="${label}"></audio></div>`;
}

function card(item, position) {
  return `<article class="sample-card">
    <div class="sample-top">
      <div class="sample-index">${String(position).padStart(2, "0")}</div>
      <div class="sample-ident">
        <h3>${escapeHTML(item.title)}</h3>
      </div>
    </div>
    <div class="listening-columns">
      <div class="pair demonstration">
        <div class="pair-heading"><span class="pair-icon">↗</span><span>Demonstration pair</span></div>
        ${audioBlock("Before", item.audio.demo_before)}
        ${audioBlock("After", item.audio.demo_after)}
      </div>
      <div class="pair transfer">
        <div class="pair-heading"><span class="pair-icon">↗</span><span>Transferred edit</span></div>
        ${audioBlock("Source", item.audio.query_before)}
        ${audioBlock("Our output", item.audio.query_after, "outcome")}
      </div>
    </div>
  </article>`;
}

function renderDomain(domain) {
  const items = catalog.filter((item) => item.domain === domain);
  let position = 0;
  const markup = groups[domain].map((group) => {
    const members = items.filter((item) => item.subcategory === group);
    if (!members.length) return "";
    const title = domain === "style" ? `${titleCase(group)} source` : groupTitles[group];
    return `<div class="subgroup" aria-label="${escapeHTML(title)}">
      <h3 class="subgroup-title">${escapeHTML(title)} · ${members.length}</h3>
      ${members.map((item) => card(item, ++position)).join("")}
    </div>`;
  }).join("");
  document.querySelector(`#${domain}-gallery`).innerHTML = markup || `<p class="empty">No examples in this category.</p>`;
}

async function init() {
  try {
    const data = window.DEMO_CATALOG;
    if (!data) throw new Error("The demo catalog could not be loaded.");
    if (data.count !== 15) throw new Error("The demo catalog is incomplete.");
    catalog = data.items;
    renderDomain("style");
    renderDomain("instrument");
  } catch (error) {
    for (const domain of Object.keys(groups)) {
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
