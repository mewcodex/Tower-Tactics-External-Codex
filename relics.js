const state = {
  cards: [],
  lang: "en",
  query: "",
  rarity: "all",
  dlc: "all",
};

const els = {
  grid: document.getElementById("cardGrid"),
  summary: document.getElementById("summary"),
  langSelect: document.getElementById("langSelect"),
  searchInput: document.getElementById("searchInput"),
  raritySelect: document.getElementById("raritySelect"),
  dlcSelect: document.getElementById("dlcSelect"),
  cardTemplate: document.getElementById("relicCardTemplate"),
};

const LANG_STORAGE_KEY = "tt_codex_lang";
const RARITY_ORDER = ["common", "uncommon", "rare", "mythic", "boss", "initial", "unknown"];

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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getName(card) {
  return (card.name && card.name[state.lang]) || (card.name && card.name.en) || card.id;
}

function getDescription(card) {
  return (card.description && (card.description[state.lang] || card.description.en)) || "";
}

function getArtPath(card) {
  const art = card.resources && card.resources.art;
  const websitePath = (art && art.website_path) || "";
  if (!websitePath) return "";
  return `generated/relics/${websitePath}`;
}

function populateRaritySelect(cards) {
  const set = new Set(cards.map((c) => c.rarity || "unknown"));
  const values = ["all", ...RARITY_ORDER.filter((r) => set.has(r))];

  const labels = {
    all: state.lang === "zh" ? "全部稀有度" : "All rarities",
    common: state.lang === "zh" ? "普通" : "Common",
    uncommon: state.lang === "zh" ? "罕见" : "Uncommon",
    rare: state.lang === "zh" ? "稀有" : "Rare",
    mythic: state.lang === "zh" ? "神话" : "Mythic",
    boss: state.lang === "zh" ? "首领" : "Boss",
    initial: state.lang === "zh" ? "初始" : "Initial",
    unknown: state.lang === "zh" ? "未知" : "Unknown",
  };

  const prev = state.rarity;
  els.raritySelect.innerHTML = values.map((v) => `<option value="${v}">${labels[v] || v}</option>`).join("");
  els.raritySelect.value = values.includes(prev) ? prev : "all";
  state.rarity = els.raritySelect.value;
}

function populateDlcSelect(cards) {
  const set = new Set(cards.map((c) => c.expansion || "liberation"));
  const values = ["all", "liberation", "astral_siege", "celestial_dawn"].filter(
    (v) => v === "all" || set.has(v)
  );

  const labels = {
    all: state.lang === "zh" ? "全部 DLC" : "All DLC",
    liberation: state.lang === "zh" ? "本体" : "Base",
    astral_siege: state.lang === "zh" ? "Astral Siege" : "Astral Siege",
    celestial_dawn: state.lang === "zh" ? "Celestial Dawn" : "Celestial Dawn",
  };

  const prev = state.dlc;
  els.dlcSelect.innerHTML = values.map((v) => `<option value="${v}">${labels[v] || v}</option>`).join("");
  els.dlcSelect.value = values.includes(prev) ? prev : "all";
  state.dlc = els.dlcSelect.value;
}

function filteredCards() {
  const q = state.query.trim().toLowerCase();
  return state.cards.filter((card) => {
    const rarity = card.rarity || "unknown";
    const expansion = card.expansion || "liberation";

    if (state.rarity !== "all" && rarity !== state.rarity) return false;
    if (state.dlc !== "all" && expansion !== state.dlc) return false;
    if (!q) return true;

    const name = getName(card).toLowerCase();
    const desc = getDescription(card).toLowerCase();
    return name.includes(q) || desc.includes(q) || card.id.toLowerCase().includes(q);
  });
}

function render() {
  const cards = filteredCards();

  els.summary.textContent =
    state.lang === "zh"
      ? `共 ${state.cards.length} 个遗物，当前显示 ${cards.length} 个`
      : `${cards.length} shown out of ${state.cards.length} trinkets`;

  els.grid.innerHTML = "";
  const frag = document.createDocumentFragment();

  cards.forEach((card) => {
    const node = els.cardTemplate.content.firstElementChild.cloneNode(true);
    const nameEl = node.querySelector(".name");
    const artEl = node.querySelector(".art");
    const rarityEl = node.querySelector(".rarity");
    const descEl = node.querySelector(".description");

    nameEl.textContent = getName(card);
    descEl.textContent = getDescription(card);

    const art = getArtPath(card);
    if (art) {
      artEl.src = art;
      artEl.removeAttribute("data-missing");
    } else {
      artEl.removeAttribute("src");
      artEl.setAttribute("data-missing", "1");
    }
    artEl.alt = getName(card);

    const rarity = (card.rarity || "unknown").toLowerCase();
    rarityEl.classList.remove("common", "uncommon", "rare", "mythic", "boss", "initial", "unknown");
    rarityEl.classList.add(rarity);
    rarityEl.textContent = rarity.toUpperCase();

    frag.appendChild(node);
  });

  els.grid.appendChild(frag);
}

async function init() {
  state.lang = getInitialLanguage();
  els.langSelect.value = state.lang;

  const res = await fetch("generated/relics/relics.cleaned.json");
  const cards = await res.json();
  state.cards = cards;

  populateRaritySelect(state.cards);
  populateDlcSelect(state.cards);
  render();

  els.langSelect.addEventListener("change", () => {
    state.lang = els.langSelect.value;
    persistLanguage(state.lang);
    populateRaritySelect(state.cards);
    populateDlcSelect(state.cards);
    render();
  });

  els.searchInput.addEventListener("input", () => {
    state.query = els.searchInput.value;
    render();
  });

  els.raritySelect.addEventListener("change", () => {
    state.rarity = els.raritySelect.value;
    render();
  });

  els.dlcSelect.addEventListener("change", () => {
    state.dlc = els.dlcSelect.value;
    render();
  });
}

init().catch((err) => {
  console.error(err);
  els.summary.textContent = "Failed to load trinkets data.";
});
