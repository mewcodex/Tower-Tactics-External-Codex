const state = {
  cards: [],
  rows: [],
  lang: "en",
  level: "1",
  sortKey: "effectiveDamagePerCost",
  sortType: "number",
  sortDir: "desc",
};

const LANG_STORAGE_KEY = "tt_codex_lang";

const els = {
  tableBody: document.getElementById("codexTableBody"),
  table: document.getElementById("codexTable"),
  langSelect: document.getElementById("tableLangSelect"),
  levelSelect: document.getElementById("tableLevelSelect"),
};

function getInitialLanguage() {
  const urlLang = new URLSearchParams(window.location.search).get("lang");
  if (urlLang === "en" || urlLang === "zh") return urlLang;
  const stored = localStorage.getItem(LANG_STORAGE_KEY);
  if (stored === "en" || stored === "zh") return stored;
  return "en";
}

function persistLanguage(lang) {
  localStorage.setItem(LANG_STORAGE_KEY, lang);
}

function getName(card) {
  return (card.name && card.name[state.lang]) || (card.name && card.name.en) || card.id;
}

function getArt(card) {
  const variants = (card.resources && card.resources.art_variants) || [];
  const target = variants.find((v) => String(v.level) === state.level) || variants[0];
  return target ? `generated/towers/${target.website_path}` : "";
}

function dlcSup(card) {
  const expansion = card.expansion || "liberation";
  if (expansion === "astral_siege") return "A";
  if (expansion === "celestial_dawn") return "C";
  return "";
}

function formatNumber(value, digits = 2) {
  if (value == null || Number.isNaN(value) || !Number.isFinite(value)) return "-";
  return Number(value).toFixed(digits).replace(/\.00$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
}

function getStat(card, key, fallback = 0) {
  const hover = (card.stats && card.stats.hover && card.stats.hover[state.level]) || {};
  const raw = hover[key];
  return typeof raw === "number" ? raw : fallback;
}

function buildRow(card) {
  const p = getStat(card, "damage", 0);
  const m = getStat(card, "magic_damage", 0);
  const fireRate = getStat(card, "fire_rate", 0);
  const range = getStat(card, "range_radius", 0);
  const cost = typeof card.cost === "number" ? card.cost : 0;

  const damageCombined = p + m;
  const dps0Armor = damageCombined * fireRate;
  const dpsPerCost = cost > 0 ? dps0Armor / cost : null;
  const effectiveDamage = dps0Armor * range;
  const effectiveDamagePerCost = cost > 0 ? effectiveDamage / cost : null;

  return {
    id: card.id,
    name: getName(card),
    rarity: card.rarity || "unknown",
    expansion: card.expansion || "liberation",
    art: getArt(card),
    damageCombined,
    fireRate,
    range,
    dps0Armor,
    dpsPerCost,
    effectiveDamage,
    effectiveDamagePerCost,
    p,
    m,
  };
}

function compareRows(a, b, key, type, dir) {
  const av = a[key];
  const bv = b[key];
  const factor = dir === "asc" ? 1 : -1;

  if (type === "number") {
    const an = av == null ? Number.NEGATIVE_INFINITY : Number(av);
    const bn = bv == null ? Number.NEGATIVE_INFINITY : Number(bv);
    if (an < bn) return -1 * factor;
    if (an > bn) return 1 * factor;
    return a.id.localeCompare(b.id);
  }

  const as = String(av || "").toLowerCase();
  const bs = String(bv || "").toLowerCase();
  if (as < bs) return -1 * factor;
  if (as > bs) return 1 * factor;
  return a.id.localeCompare(b.id);
}

function renderTable() {
  state.rows = state.cards.map(buildRow);
  state.rows.sort((a, b) => compareRows(a, b, state.sortKey, state.sortType, state.sortDir));

  const html = state.rows
    .map((row) => {
      const sup = dlcSup(row);
      const supHtml = sup ? `<sup class="dlc-sup">${sup}</sup>` : "";
      const pAndM = `${formatNumber(row.p, 0)} / ${formatNumber(row.m, 0)}`;
      const detailLink = `index.html#card=${encodeURIComponent(row.id)}`;

      return `
        <tr>
          <td>
            <a class="card-link-cell" href="${detailLink}" title="Open detail page">
              <img class="table-card-art" src="${row.art}" alt="${row.name}" loading="lazy" />
              <span class="table-card-name ${row.rarity}">${row.name}${supHtml}</span>
            </a>
            <div class="table-subline">P/M: ${pAndM}</div>
          </td>
          <td>${formatNumber(row.damageCombined, 2)}</td>
          <td>${formatNumber(row.fireRate, 2)}</td>
          <td>${formatNumber(row.range, 0)}</td>
          <td>${formatNumber(row.dps0Armor, 2)}</td>
          <td>${formatNumber(row.dpsPerCost, 2)}</td>
          <td>${formatNumber(row.effectiveDamage, 2)}</td>
          <td>${formatNumber(row.effectiveDamagePerCost, 2)}</td>
        </tr>
      `;
    })
    .join("");

  els.tableBody.innerHTML = html;

  els.table.querySelectorAll("th[data-key]").forEach((th) => {
    th.classList.remove("sorted-asc", "sorted-desc");
    if (th.dataset.key === state.sortKey) {
      th.classList.add(state.sortDir === "asc" ? "sorted-asc" : "sorted-desc");
    }
  });
}

function bindSorting() {
  els.table.querySelectorAll("th[data-key]").forEach((th) => {
    th.addEventListener("click", () => {
      const key = th.dataset.key;
      const type = th.dataset.type || "number";

      if (state.sortKey === key) {
        state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
      } else {
        state.sortKey = key;
        state.sortType = type;
        state.sortDir = type === "string" ? "asc" : "desc";
      }
      renderTable();
    });
  });
}

async function init() {
  state.lang = getInitialLanguage();
  els.langSelect.value = state.lang;

  const res = await fetch("generated/towers/towers.cleaned.json");
  const cards = await res.json();
  state.cards = cards;

  bindSorting();
  renderTable();

  els.langSelect.addEventListener("change", () => {
    state.lang = els.langSelect.value;
    persistLanguage(state.lang);
    renderTable();
  });

  els.levelSelect.addEventListener("change", () => {
    state.level = els.levelSelect.value;
    renderTable();
  });
}

init().catch((err) => {
  console.error(err);
  els.tableBody.innerHTML = '<tr><td colspan="8">Failed to load table data.</td></tr>';
});