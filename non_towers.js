const state = {
  cards: [],
  lang: "en",
  query: "",
  type: "all",
  dlc: "all",
};

const els = {
  grid: document.getElementById("cardGrid"),
  summary: document.getElementById("summary"),
  langSelect: document.getElementById("langSelect"),
  searchInput: document.getElementById("searchInput"),
  typeSelect: document.getElementById("typeSelect"),
  dlcSelect: document.getElementById("dlcSelect"),
  cardTemplate: document.getElementById("nonTowerCardTemplate"),
};

const LANG_STORAGE_KEY = "tt_codex_lang";

const TYPE_THEME = {
  tower: "#3b3452",
  emblem: "#3a4439",
  enchantment: "#532d12",
  spell: "#173255",
  curse: "#290a2b",
};

const DESCRIPTION_HIGHLIGHTS = [
  { key: "dispel", color: "B482E4", en: ["Dispel"], zh: ["消耗", "驱散", "散逸", "放逐"] },
  { key: "martyr", color: "E77D7B", en: ["Martyr"], zh: ["殉道"] },
  { key: "transcend", color: "7be7b1", en: ["Transcend:"], zh: ["超越：", "超脱：", "飞升："] },
  { key: "wave_start", color: "FF8C00", en: ["Wave start:"], zh: ["波次开始：", "波开始："] },
  { key: "wave_end", color: "FF8C00", en: ["Wave end:"], zh: ["波次结束：", "波结束："] },
  { key: "combat_start", color: "FF69B4", en: ["Combat start:"], zh: ["战斗开始："] },
  { key: "combat_end", color: "FF69B4", en: ["Combat end:"], zh: ["战斗结束："] },
  { key: "round_start", color: "9ACD32", en: ["Round start:"], zh: ["回合开始："] },
  { key: "round_end", color: "9ACD32", en: ["Round end:"], zh: ["回合结束："] },
  { key: "cant_be_moved", color: "D87093", en: ["Can't be moved."], zh: ["不能被移动。", "无法被移动。"] },
  { key: "on_play", color: "FFA07A", en: ["On play:"], zh: ["使用时：", "打出时：", "部署时："] },
  { key: "silence", color: "DAA520", en: ["Silence"], zh: ["沉默"] },
  { key: "cant_level_up", color: "FFB375", en: ["Can't level up."], zh: ["不能提升等级。", "无法升级。"] },
  { key: "overload", color: "575CFF", en: ["Overload"], zh: ["过载"] },
  { key: "rebound", color: "70ffec", en: ["Rebound."], zh: ["回响。", "反弹。"] },
  {
    key: "cant_be_deactivated",
    color: "30fcd7",
    en: ["Can't be deactivated."],
    zh: ["它不能被禁用。", "无法被停用。", "不能被停用。"],
  },
];

const KEYWORD_EXPLANATIONS = {
  dispel: {
    en: "When played, this card disappears until next combat.",
    zh: "这张牌会消失，直到下一次战斗。",
  },
  martyr: {
    en: "Costs one less for each damage taken this combat.",
    zh: "在这场战斗中，每受到1点伤害，费用减少1。",
  },
  transcend: {
    en: "You transcend when you have 20 or more cards in your hand and draw, discard and dispel piles combined.",
    zh: "当你的手牌、抽牌堆、弃牌堆和消耗牌堆加起来有20张或更多的牌时，你就超频了。",
  },
  wave_start: {
    en: "Effect triggers at the start of each wave.",
    zh: "每个波次开始时触发效果。",
  },
  wave_end: {
    en: "Effect triggers at the end of each wave.",
    zh: "每个波次结束时触发效果。",
  },
  combat_start: {
    en: "Effect triggers when combat starts.",
    zh: "战斗开始时触发效果。",
  },
  combat_end: {
    en: "Effect triggers when combat ends.",
    zh: "战斗结束时触发效果。",
  },
  round_start: {
    en: "Effect triggers at the start of each round.",
    zh: "每回合开始时触发效果。",
  },
  round_end: {
    en: "Effect triggers at the end of each round.",
    zh: "每回合结束时触发效果。",
  },
  cant_be_moved: {
    en: "This card cannot be repositioned once placed.",
    zh: "此卡放置后不能被移动。",
  },
  on_play: {
    en: "Effect resolves immediately when the card is played.",
    zh: "打出此卡时立即结算效果。",
  },
  silence: {
    en: "Disable all special abilities an enemy has.",
    zh: "使敌人的所有特殊能力失效。",
  },
  cant_level_up: {
    en: "This card cannot gain levels.",
    zh: "此卡无法升级。",
  },
  overload: {
    en: "Overload applies a temporary downside after a strong effect.",
    zh: "过载会在强力效果后附带短暂负面代价。",
  },
  rebound: {
    en: "When you cast this card, you can cast it again once this wave if you have enough mana.",
    zh: "当你施放这张牌时，如果你有足够的法力，你可以在这一波中再次施放一次。",
  },
  cant_be_deactivated: {
    en: "This card cannot be disabled by effects.",
    zh: "此卡不会被效果停用。",
  },
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
  if (!card.description) return "";
  return card.description[state.lang] || card.description.en || "";
}

function getDescriptionHtml(card) {
  let html = escapeHtml(getDescription(card));
  const lang = state.lang === "zh" ? "zh" : "en";

  DESCRIPTION_HIGHLIGHTS.forEach((entry) => {
    const terms = Array.isArray(entry[lang]) && entry[lang].length ? entry[lang] : entry.en;
    terms.forEach((term) => {
      const safeTerm = escapeHtml(term);
      html = html.split(safeTerm).join(`<span class="desc-keyword" style="--kw-color:#${entry.color};">${safeTerm}</span>`);
    });
  });

  return html;
}

function getKeywordMatches(card) {
  const description = getDescription(card);
  if (!description) return [];

  const lang = state.lang === "zh" ? "zh" : "en";
  const source = lang === "zh" ? description : description.toLowerCase();
  const matches = [];

  DESCRIPTION_HIGHLIGHTS.forEach((entry) => {
    const terms = Array.isArray(entry[lang]) && entry[lang].length ? entry[lang] : entry.en;
    const found = terms.find((term) => {
      if (!term) return false;
      if (lang === "zh") return source.includes(term);
      return source.includes(term.toLowerCase());
    });
    if (!found) return;

    matches.push({
      key: entry.key,
      color: entry.color,
      term: found,
      explanation:
        (KEYWORD_EXPLANATIONS[entry.key] && KEYWORD_EXPLANATIONS[entry.key][lang]) ||
        (KEYWORD_EXPLANATIONS[entry.key] && KEYWORD_EXPLANATIONS[entry.key].en) ||
        "",
    });
  });

  return matches;
}

function renderKeywordRail(card, railEl) {
  const matches = getKeywordMatches(card);
  if (!matches.length) {
    railEl.innerHTML = "";
    return;
  }

  railEl.innerHTML = matches
    .map(
      (m) => `
        <section class="stat-card keyword-card">
          <div class="keyword-title" style="--kw-color:#${escapeHtml(m.color)};">${escapeHtml(m.term)}</div>
          <div class="keyword-text">${escapeHtml(m.explanation)}</div>
        </section>
      `
    )
    .join("");
}

function applyHoverRailSides() {
  const wraps = Array.from(els.grid.querySelectorAll(".tower-card-wrap"));
  if (!wraps.length) return;

  const rows = [];
  wraps.forEach((el) => {
    const top = el.offsetTop;
    const existing = rows.find((r) => Math.abs(r.top - top) <= 2);
    if (existing) {
      existing.items.push(el);
    } else {
      rows.push({ top, items: [el] });
    }
  });

  rows.forEach((row) => {
    row.items.forEach((el, idx) => {
      el.classList.remove("rail-left", "rail-right");
      el.classList.add(idx < 2 ? "rail-right" : "rail-left");
    });
  });
}

function getTypeLabel(type) {
  const labels = {
    spell: state.lang === "zh" ? "法术" : "Spell",
    enchantment: state.lang === "zh" ? "附魔" : "Enchantment",
    curse: state.lang === "zh" ? "诅咒" : "Curse",
    emblem: state.lang === "zh" ? "纹章" : "Emblem",
  };
  return labels[type] || type;
}

function getArt(card) {
  const variants = (card.resources && card.resources.art_variants) || [];
  const first = variants[0];
  return first ? `generated/non_towers/${first.website_path}` : "";
}

function getCardDetailHref(card) {
  return `non_tower_card.html?id=${encodeURIComponent(card.id || "")}`;
}

function populateTypeSelect(cards) {
  const set = new Set(cards.map((c) => c.type));
  const values = ["all", "spell", "enchantment", "curse", "emblem"].filter(
    (v) => v === "all" || set.has(v)
  );

  const labels = {
    all: state.lang === "zh" ? "全部类型" : "All types",
    spell: state.lang === "zh" ? "法术" : "Spell",
    enchantment: state.lang === "zh" ? "附魔" : "Enchantment",
    curse: state.lang === "zh" ? "诅咒" : "Curse",
    emblem: state.lang === "zh" ? "纹章" : "Emblem",
  };

  const prev = state.type;
  els.typeSelect.innerHTML = values.map((v) => `<option value="${v}">${labels[v]}</option>`).join("");
  els.typeSelect.value = values.includes(prev) ? prev : "all";
  state.type = els.typeSelect.value;
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
    if (state.type !== "all" && card.type !== state.type) return false;
    if (state.dlc !== "all" && (card.expansion || "liberation") !== state.dlc) return false;
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
      ? `共 ${state.cards.length} 张，当前显示 ${cards.length} 张`
      : `${cards.length} shown out of ${state.cards.length}`;

  els.grid.innerHTML = "";
  const frag = document.createDocumentFragment();

  cards.forEach((card) => {
    const node = els.cardTemplate.content.firstElementChild.cloneNode(true);
    const cardEl = node.querySelector(".non-tower-card");
    const costEl = node.querySelector(".cost");
    const nameEl = node.querySelector(".name");
    const artEl = node.querySelector(".art");
    const rarityEl = node.querySelector(".rarity");
    const descEl = node.querySelector(".description");
    const typeEl = node.querySelector(".type");
    const railEl = node.querySelector(".stats-rail");
    const detailHref = getCardDetailHref(card);

    const themeColor = TYPE_THEME[card.type] || TYPE_THEME.tower;
    cardEl.style.setProperty("--card-theme", themeColor);

    nameEl.textContent = getName(card);
    descEl.innerHTML = getDescriptionHtml(card);
    typeEl.textContent = getTypeLabel(card.type);

    const art = getArt(card);
    artEl.src = art;
    artEl.alt = getName(card);

    if (card.type === "spell" || card.type === "enchantment") {
      costEl.classList.remove("hidden");
      costEl.textContent = card.cost ?? "-";
    } else {
      costEl.classList.add("hidden");
      costEl.textContent = "";
    }

    if (card.type !== "curse") {
      const rarity = card.rarity || "unknown";
      rarityEl.classList.remove("hidden");
      rarityEl.classList.remove("common", "uncommon", "rare", "mythic", "unknown");
      rarityEl.classList.add(rarity);
      rarityEl.textContent = rarity.toUpperCase();
    } else {
      rarityEl.classList.add("hidden");
      rarityEl.textContent = "";
    }

    renderKeywordRail(card, railEl);

    node.classList.add("card-clickable");
    node.addEventListener("click", () => {
      window.location.href = detailHref;
    });

    frag.appendChild(node);
  });

  els.grid.appendChild(frag);
  applyHoverRailSides();
}

async function init() {
  state.lang = getInitialLanguage();
  els.langSelect.value = state.lang;

  const res = await fetch("generated/non_towers/non_towers.cleaned.json");
  const cards = await res.json();
  state.cards = cards;

  populateTypeSelect(state.cards);
  populateDlcSelect(state.cards);
  render();

  els.langSelect.addEventListener("change", () => {
    state.lang = els.langSelect.value;
    persistLanguage(state.lang);
    populateTypeSelect(state.cards);
    populateDlcSelect(state.cards);
    render();
  });

  els.searchInput.addEventListener("input", () => {
    state.query = els.searchInput.value;
    render();
  });

  els.typeSelect.addEventListener("change", () => {
    state.type = els.typeSelect.value;
    render();
  });

  els.dlcSelect.addEventListener("change", () => {
    state.dlc = els.dlcSelect.value;
    render();
  });
}

init().catch((err) => {
  console.error(err);
  els.summary.textContent = "Failed to load data.";
});
