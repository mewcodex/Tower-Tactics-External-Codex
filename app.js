const state = {
  cards: [],
  lang: "en",
  query: "",
  rarity: "all",
  dlc: "all",
  activeCardId: null,
};

const els = {
  grid: document.getElementById("cardGrid"),
  summary: document.getElementById("summary"),
  detailView: document.getElementById("detailView"),
  langSelect: document.getElementById("langSelect"),
  searchInput: document.getElementById("searchInput"),
  raritySelect: document.getElementById("raritySelect"),
  dlcSelect: document.getElementById("dlcSelect"),
  cardTemplate: document.getElementById("towerCardTemplate"),
};

let railSideResizeBound = false;

const rarityOrder = ["common", "uncommon", "rare", "mythic", "unknown"];

const PRIMARY_STAT_ORDER = [
  "damage",
  "fire_rate",
  "magic_damage",
  "range_radius",
  "armor_pen",
  "magic_pen",
];

const EXTRA_STAT_ORDER = [
  "shot_speed",
  "stun",
  "slow",
  "permanent_slow",
  "piercing",
  "execute",
  "crit_chance",
  "health_damage",
];

const STAT_ICON_MAP = {
  damage: "assets/icons/attack damage.png",
  fire_rate: "assets/icons/attack speed.png",
  magic_damage: "assets/icons/magic damage.png",
  range_radius: "assets/icons/range.png",
  armor_pen: "assets/icons/armor penetration.png",
  magic_pen: "assets/icons/magic penetration.png",
  shot_speed: "assets/icons/speed.png",
  stun: "assets/icons/stun.png",
  slow: "assets/icons/slow.png",
  permanent_slow: "assets/icons/slow.png",
  piercing: "assets/icons/sword.png",
  execute: "assets/icons/skull-and-crossbones.png",
  crit_chance: "assets/icons/luck.png",
  health_damage: "assets/icons/heart.png",
};

const DESCRIPTION_HIGHLIGHTS = [
  {
    key: "dispel",
    color: "B482E4",
    en: ["Dispel"],
    zh: ["消耗", "驱散", "散逸", "放逐"],
  },
  {
    key: "martyr",
    color: "E77D7B",
    en: ["Martyr"],
    zh: ["殉道"],
  },
  {
    key: "transcend",
    color: "7be7b1",
    en: ["Transcend:"],
    zh: ["超越：", "超脱：", "飞升："],
  },
  {
    key: "wave_start",
    color: "FF8C00",
    en: ["Wave start:"],
    zh: ["波次开始：", "波开始："],
  },
  {
    key: "wave_end",
    color: "FF8C00",
    en: ["Wave end:"],
    zh: ["波次结束：", "波结束："],
  },
  {
    key: "combat_start",
    color: "FF69B4",
    en: ["Combat start:"],
    zh: ["战斗开始："],
  },
  {
    key: "combat_end",
    color: "FF69B4",
    en: ["Combat end:"],
    zh: ["战斗结束："],
  },
  {
    key: "round_start",
    color: "9ACD32",
    en: ["Round start:"],
    zh: ["回合开始："],
  },
  {
    key: "round_end",
    color: "9ACD32",
    en: ["Round end:"],
    zh: ["回合结束："],
  },
  {
    key: "cant_be_moved",
    color: "D87093",
    en: ["Can't be moved."],
    zh: ["不能被移动。", "无法被移动。"],
  },
  {
    key: "on_play",
    color: "FFA07A",
    en: ["On play:"],
    zh: ["使用时：", "打出时：", "部署时："],
  },
  {
    key: "silence",
    color: "DAA520",
    en: ["Silence"],
    zh: ["沉默"],
  },
  {
    key: "cant_level_up",
    color: "FFB375",
    en: ["Can't level up."],
    zh: ["不能提升等级。", "无法升级。"],
  },
  {
    key: "overload",
    color: "575CFF",
    en: ["Overload"],
    zh: ["过载"],
  },
  {
    key: "rebound",
    color: "70ffec",
    en: ["Rebound."],
    zh: ["回响。", "反弹。"],
  },
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

const LANG_STORAGE_KEY = "tt_codex_lang";

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
      if (!term) return;
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
  if (!matches.length) return;

  matches.forEach((m) => {
    const node = document.createElement("section");
    node.className = "stat-card keyword-card";
    node.innerHTML = `
      <div class="keyword-title" style="--kw-color:#${escapeHtml(m.color)};">${escapeHtml(m.term)}</div>
      <div class="keyword-text">${escapeHtml(m.explanation)}</div>
    `;
    railEl.appendChild(node);
  });
}

function getArt(card) {
  const variants = (card.resources && card.resources.art_variants) || [];
  const lv1 = variants.find((v) => String(v.level) === "1") || variants[0];
  return lv1 ? `generated/towers/${lv1.website_path}` : "";
}

function statLabel(raw) {
  const labels = {
    range_radius: state.lang === "zh" ? "射程" : "Range",
    fire_rate: state.lang === "zh" ? "攻速" : "Fire Rate",
    damage: state.lang === "zh" ? "物伤" : "Damage",
    magic_damage: state.lang === "zh" ? "法伤" : "Magic Dmg",
    armor_pen: state.lang === "zh" ? "穿甲" : "Armor Pen",
    magic_pen: state.lang === "zh" ? "法穿" : "Magic Pen",
    shot_speed: state.lang === "zh" ? "弹速" : "Shot Speed",
    stun: state.lang === "zh" ? "眩晕" : "Stun",
    slow: state.lang === "zh" ? "减速" : "Slow",
    piercing: state.lang === "zh" ? "穿透" : "Piercing",
    execute: state.lang === "zh" ? "斩杀" : "Execute",
    crit_chance: state.lang === "zh" ? "暴击" : "Crit",
    permanent_slow: state.lang === "zh" ? "永久减速" : "Perm Slow",
    health_damage: state.lang === "zh" ? "生命伤害" : "Health Dmg",
  };
  return labels[raw] || raw;
}

function isNonZeroStatValue(value) {
  if (typeof value === "number") return value !== 0;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.trim() !== "";
  return false;
}

function getDisplayStatKeys(stats) {
  const keys = Object.keys(stats);
  const result = [];

  // Follow in-game Tower card rows (AD/AP/AS) visibility logic first.
  const adRowVisible = Number(stats.damage || 0) !== 0;
  const apRowVisible = Number(stats.magic_damage || 0) !== 0;
  const asRowVisible = Number(stats.fire_rate || 0) !== 0 || Number(stats.range_radius || 0) !== 0;

  if (adRowVisible) {
    if (keys.includes("damage")) result.push("damage");
    if (keys.includes("armor_pen")) result.push("armor_pen");
  }
  if (apRowVisible) {
    if (keys.includes("magic_damage")) result.push("magic_damage");
    if (keys.includes("magic_pen")) result.push("magic_pen");
  }
  if (asRowVisible) {
    if (keys.includes("fire_rate")) result.push("fire_rate");
    if (keys.includes("range_radius")) result.push("range_radius");
  }

  // Add common extra combat stats if present.
  EXTRA_STAT_ORDER.forEach((k) => {
    if (keys.includes(k) && isNonZeroStatValue(stats[k]) && !result.includes(k)) {
      result.push(k);
    }
  });

  // Add any remaining non-zero values as fallback.
  keys.forEach((k) => {
    if (!result.includes(k) && isNonZeroStatValue(stats[k])) {
      result.push(k);
    }
  });

  return result;
}

function getAllNonZeroStatKeys(stats) {
  const keys = Object.keys(stats);
  const ordered = [];

  [...PRIMARY_STAT_ORDER, ...EXTRA_STAT_ORDER].forEach((k) => {
    if (keys.includes(k) && isNonZeroStatValue(stats[k]) && !ordered.includes(k)) {
      ordered.push(k);
    }
  });

  keys.forEach((k) => {
    if (!ordered.includes(k) && isNonZeroStatValue(stats[k])) {
      ordered.push(k);
    }
  });

  return ordered;
}

function getCardById(id) {
  return state.cards.find((c) => c.id === id) || null;
}

function getCardIdFromHash() {
  const hash = window.location.hash || "";
  const m = hash.match(/^#card=(.+)$/);
  if (!m) return null;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return null;
  }
}

function openCardDetail(cardId) {
  window.location.hash = `card=${encodeURIComponent(cardId)}`;
}

function closeCardDetail() {
  if (window.location.hash) {
    history.pushState("", document.title, window.location.pathname + window.location.search);
  }
  state.activeCardId = null;
  render();
}

function syncRouteFromHash() {
  const id = getCardIdFromHash();
  if (!id) {
    state.activeCardId = null;
    return;
  }
  const card = getCardById(id);
  state.activeCardId = card ? card.id : null;
}

function populateRaritySelect(cards) {
  const set = new Set(cards.map((c) => c.rarity || "unknown"));
  const values = ["all", ...rarityOrder.filter((r) => set.has(r))];
  const text = {
    all: state.lang === "zh" ? "全部稀有度" : "All rarities",
    common: state.lang === "zh" ? "普通" : "Common",
    uncommon: state.lang === "zh" ? "罕见" : "Uncommon",
    rare: state.lang === "zh" ? "稀有" : "Rare",
    mythic: state.lang === "zh" ? "神话" : "Mythic",
    unknown: state.lang === "zh" ? "未知" : "Unknown",
  };

  const prev = state.rarity;
  els.raritySelect.innerHTML = values
    .map((v) => `<option value="${v}">${text[v] || v}</option>`)
    .join("");
  els.raritySelect.value = values.includes(prev) ? prev : "all";
  state.rarity = els.raritySelect.value;
}

function populateDlcSelect(cards) {
  const set = new Set(cards.map((c) => c.expansion || "liberation"));
  const values = ["all", "liberation", "astral_siege", "celestial_dawn"].filter(
    (v) => v === "all" || set.has(v)
  );
  const text = {
    all: state.lang === "zh" ? "全部 DLC" : "All DLC",
    liberation: state.lang === "zh" ? "本体" : "Base",
    astral_siege: state.lang === "zh" ? "Astral Siege" : "Astral Siege",
    celestial_dawn: state.lang === "zh" ? "Celestial Dawn" : "Celestial Dawn",
  };

  const prev = state.dlc;
  els.dlcSelect.innerHTML = values.map((v) => `<option value="${v}">${text[v] || v}</option>`).join("");
  els.dlcSelect.value = values.includes(prev) ? prev : "all";
  state.dlc = els.dlcSelect.value;
}

function filteredCards() {
  const q = state.query.trim().toLowerCase();
  return state.cards.filter((card) => {
    if (state.rarity !== "all" && (card.rarity || "unknown") !== state.rarity) {
      return false;
    }
    if (state.dlc !== "all" && (card.expansion || "liberation") !== state.dlc) {
      return false;
    }
    if (!q) return true;
    const name = getName(card).toLowerCase();
    const desc = getDescription(card).toLowerCase();
    return name.includes(q) || desc.includes(q) || card.id.toLowerCase().includes(q);
  });
}

function getTowerLevels(card) {
  if (card && card.can_level_up === false) {
    return ["1"];
  }
  return ["1", "2", "3"];
}

function renderStatsRail(card, railEl) {
  const hover = (card.stats && card.stats.hover) || {};
  const levels = getTowerLevels(card);
  railEl.innerHTML = "";

  levels.forEach((lv) => {
    const stats = hover[lv] || {};
    const keys = getDisplayStatKeys(stats);
    const iconKeys = keys.filter((k) => !!STAT_ICON_MAP[k]);
    const noIconKeys = keys.filter((k) => !STAT_ICON_MAP[k]);
    const orderedKeys = [...iconKeys, ...noIconKeys];

    const statRows = orderedKeys
      .map((k) => {
        const label = statLabel(k);
        const icon = STAT_ICON_MAP[k];
        if (icon) {
          return `
            <div class="stat-item" title="${label}">
              <img class="stat-icon" src="${icon}" alt="${label}" loading="lazy" />
              <span class="stat-value">${stats[k]}</span>
            </div>
          `;
        }
        return `
          <div class="stat-item no-icon" title="${label}">
            <span class="stat-fallback-label">${label}</span>
            <span class="stat-value">${stats[k]}</span>
          </div>
        `;
      })
      .join("");

    const node = document.createElement("section");
    node.className = "stat-card";
    node.innerHTML = `
      <h3>${state.lang === "zh" ? `等级 ${lv}` : `Level ${lv}`}</h3>
      <div class="stat-grid">${statRows}</div>
    `;
    railEl.appendChild(node);
  });

  renderKeywordRail(card, railEl);
}

function renderDetail(card) {
  const hover = (card.stats && card.stats.hover) || {};
  const levels = getTowerLevels(card);
  const pools = ((card.deck_pool && card.deck_pool.by_deck) || []).slice();

  const art = getArt(card);
  const statSections = levels
    .map((lv) => {
      const stats = hover[lv] || {};
      const keys = getAllNonZeroStatKeys(stats);
      const rows = keys.length
        ? keys
            .map((k) => {
              const label = statLabel(k);
              const icon = STAT_ICON_MAP[k];
              return `
                <div class="detail-stat-item" title="${escapeHtml(label)}">
                  ${
                    icon
                      ? `<img class="detail-stat-icon" src="${escapeHtml(icon)}" alt="${escapeHtml(label)}" loading="lazy" />`
                      : ""
                  }
                  <span class="detail-stat-name">${escapeHtml(label)}</span>
                  <span class="detail-stat-value">${escapeHtml(stats[k])}</span>
                </div>
              `;
            })
            .join("")
        : `<div class="detail-empty">${state.lang === "zh" ? "无非零属性" : "No non-zero stats"}</div>`;

      return `
        <section class="detail-panel">
          <h3>${state.lang === "zh" ? `等级 ${lv}` : `Level ${lv}`}</h3>
          <div class="detail-stat-grid">${rows}</div>
        </section>
      `;
    })
    .join("");

  const poolRows = pools
    .map((d) => {
      const inPoolText = d.in_pool ? (state.lang === "zh" ? "有" : "Yes") : state.lang === "zh" ? "无" : "No";
      return `
        <tr>
          <td>${escapeHtml(d.deck_label || d.deck_name || d.deck_key || "-")}</td>
          <td>${escapeHtml(d.initial_count ?? 0)}</td>
          <td>${escapeHtml(inPoolText)}</td>
          <td>${escapeHtml(d.pool_count ?? 0)}</td>
        </tr>
      `;
    })
    .join("");

  const deckSummary = card.deck_pool
    ? state.lang === "zh"
      ? `卡池中出现于 ${card.deck_pool.in_pool_decks} / ${pools.length} 个卡组，初始牌组携带于 ${card.deck_pool.initial_decks} 个卡组`
      : `In pool: ${card.deck_pool.in_pool_decks} / ${pools.length} decks, initially carried by ${card.deck_pool.initial_decks} decks`
    : state.lang === "zh"
      ? "无卡池数据"
      : "No pool data";

  els.detailView.innerHTML = `
    <div class="detail-head">
      <button class="back-btn" type="button">${state.lang === "zh" ? "返回列表" : "Back to list"}</button>
      <div class="detail-title">${escapeHtml(getName(card))}</div>
    </div>
    <div class="detail-layout">
      <aside class="detail-left">
        <article class="tower-card detail-card">
          <div class="cost">${escapeHtml(card.cost)}</div>
          <img class="art" src="${escapeHtml(art)}" alt="${escapeHtml(getName(card))}" loading="lazy" />
          <h2 class="name">${escapeHtml(getName(card))}</h2>
          <div class="rarity ${(card.rarity || "unknown")}">${escapeHtml((card.rarity || "unknown").toUpperCase())}</div>
          <p class="description">${getDescriptionHtml(card)}</p>
          <div class="type">TOWER</div>
        </article>
      </aside>
      <section class="detail-right">
        <section class="detail-panel">
          <h3>${state.lang === "zh" ? "全部非零属性" : "All Non-Zero Stats"}</h3>
          <div class="detail-levels">${statSections}</div>
        </section>

        <section class="detail-panel">
          <h3>${state.lang === "zh" ? "卡池情况" : "Deck & Pool Presence"}</h3>
          <p class="detail-note">${escapeHtml(deckSummary)}</p>
          <div class="detail-table-wrap">
            <table class="detail-table">
              <thead>
                <tr>
                  <th>${state.lang === "zh" ? "卡组" : "Deck"}</th>
                  <th>${state.lang === "zh" ? "初始携带" : "Initial"}</th>
                  <th>${state.lang === "zh" ? "在卡池" : "In Pool"}</th>
                  <th>${state.lang === "zh" ? "卡池值" : "Pool Count"}</th>
                </tr>
              </thead>
              <tbody>${poolRows}</tbody>
            </table>
          </div>
        </section>
      </section>
    </div>
  `;

  const backBtn = els.detailView.querySelector(".back-btn");
  if (backBtn) {
    backBtn.addEventListener("click", closeCardDetail);
  }
}

function renderList() {
  const cards = filteredCards();

  els.summary.textContent =
    state.lang === "zh"
      ? `共 ${state.cards.length} 张，当前显示 ${cards.length} 张`
      : `${cards.length} shown out of ${state.cards.length}`;

  els.grid.innerHTML = "";
  const frag = document.createDocumentFragment();

  cards.forEach((card) => {
    const node = els.cardTemplate.content.firstElementChild.cloneNode(true);
    const costEl = node.querySelector(".cost");
    const nameEl = node.querySelector(".name");
    const artEl = node.querySelector(".art");
    const rarityEl = node.querySelector(".rarity");
    const descEl = node.querySelector(".description");
    const railEl = node.querySelector(".stats-rail");

    costEl.textContent = card.cost;
    nameEl.textContent = getName(card);
    descEl.innerHTML = getDescriptionHtml(card);

    const art = getArt(card);
    artEl.src = art;
    artEl.alt = getName(card);

    rarityEl.textContent = (card.rarity || "unknown").toUpperCase();
    rarityEl.classList.add(card.rarity || "unknown");

    renderStatsRail(card, railEl);
    node.classList.add("card-clickable");
    node.classList.add("rail-left");
    node.addEventListener("click", () => openCardDetail(card.id));
    frag.appendChild(node);
  });

  els.grid.appendChild(frag);
  applyStatsRailSides();
}

function applyStatsRailSides() {
  const wraps = Array.from(els.grid.querySelectorAll(".tower-card-wrap"));
  if (!wraps.length) return;

  // Group cards by visual row using their top offset, then mark first two as right-rail.
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

function render() {
  const detailCard = state.activeCardId ? getCardById(state.activeCardId) : null;
  const inDetail = !!detailCard;

  els.grid.classList.toggle("hidden", inDetail);
  els.detailView.classList.toggle("hidden", !inDetail);
  els.summary.classList.toggle("hidden", inDetail);

  if (inDetail) {
    renderDetail(detailCard);
    return;
  }

  renderList();
}

async function init() {
  state.lang = getInitialLanguage();
  els.langSelect.value = state.lang;

  const res = await fetch("generated/towers/towers.cleaned.json");
  const cards = await res.json();
  state.cards = cards.sort((a, b) => (a.cost - b.cost) || a.id.localeCompare(b.id));

  populateRaritySelect(state.cards);
  populateDlcSelect(state.cards);
  syncRouteFromHash();
  render();

  window.addEventListener("hashchange", () => {
    syncRouteFromHash();
    render();
  });

  if (!railSideResizeBound) {
    railSideResizeBound = true;
    window.addEventListener("resize", () => {
      if (!state.activeCardId) {
        applyStatsRailSides();
      }
    });
  }

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
  els.summary.textContent = "Failed to load data.";
});
