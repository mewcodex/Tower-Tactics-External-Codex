const state = {
  decks: [],
  cards: new Map(),
  trinkets: new Map(),
  lang: "en",
  query: "",
  dlc: "all",
  difficulty: "all",
};

const els = {
  list: document.getElementById("decksList"),
  summary: document.getElementById("summary"),
  langSelect: document.getElementById("langSelect"),
  searchInput: document.getElementById("searchInput"),
  dlcSelect: document.getElementById("dlcSelect"),
  difficultySelect: document.getElementById("difficultySelect"),
};

const LANG_STORAGE_KEY = "tt_codex_lang";

const TYPE_THEME = {
  tower: "#3b3452",
  emblem: "#3a4439",
  enchantment: "#532d12",
  spell: "#173255",
  curse: "#290a2b",
  random_tower: "#3b3452",
};

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

function getDeckName(deck) {
  return (deck.title && deck.title[state.lang]) || (deck.title && deck.title.en) || deck.name;
}

function getCardName(card) {
  return (card.name && card.name[state.lang]) || (card.name && card.name.en) || card.id;
}

function getCardDescription(card) {
  return (card.description && (card.description[state.lang] || card.description.en)) || "";
}

function getTrinketName(trinket) {
  return (trinket.name && trinket.name[state.lang]) || (trinket.name && trinket.name.en) || trinket.id;
}

function getTrinketDescription(trinket) {
  return (trinket.description && (trinket.description[state.lang] || trinket.description.en)) || "";
}

function getTrinketArtPath(trinket) {
  const art = trinket.resources && trinket.resources.art;
  const websitePath = (art && art.website_path) || "";
  if (!websitePath) return "";
  return `generated/relics/${websitePath}`;
}

function getCardDescriptionHtml(card) {
  let html = escapeHtml(getCardDescription(card));
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
  const description = getCardDescription(card);
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

function renderKeywordRail(card) {
  const matches = getKeywordMatches(card)
    .map(
      (m) => `
        <section class="stat-card keyword-card">
          <div class="keyword-title" style="--kw-color:#${escapeHtml(m.color)};">${escapeHtml(m.term)}</div>
          <div class="keyword-text">${escapeHtml(m.explanation)}</div>
        </section>
      `
    )
    .join("");

  const stats = getHoverStatsRailHtml(card);
  const content = `${stats}${matches}`;
  if (!content) return "";

  return `<aside class="stats-rail deck-hover-rail">${content}</aside>`;
}

function hoverStatLabel(raw) {
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

  EXTRA_STAT_ORDER.forEach((k) => {
    if (keys.includes(k) && isNonZeroStatValue(stats[k]) && !result.includes(k)) {
      result.push(k);
    }
  });

  keys.forEach((k) => {
    if (!result.includes(k) && isNonZeroStatValue(stats[k])) {
      result.push(k);
    }
  });

  return result;
}

function getHoverStatsRailHtml(card) {
  const hover = (card.stats && card.stats.hover) || {};
  const levels = ["1", "2", "3"];

  return levels
    .map((lv) => {
      const stats = hover[lv] || {};
      const keys = getDisplayStatKeys(stats);
      if (!keys.length) return "";

      const iconKeys = keys.filter((k) => !!STAT_ICON_MAP[k]);
      const noIconKeys = keys.filter((k) => !STAT_ICON_MAP[k]);
      const orderedKeys = [...iconKeys, ...noIconKeys];

      const rows = orderedKeys
        .map((k) => {
          const label = hoverStatLabel(k);
          const icon = STAT_ICON_MAP[k];
          if (icon) {
            return `
              <div class="stat-item" title="${escapeHtml(label)}">
                <img class="stat-icon" src="${escapeHtml(icon)}" alt="${escapeHtml(label)}" loading="lazy" />
                <span class="stat-value">${escapeHtml(stats[k])}</span>
              </div>
            `;
          }
          return `
            <div class="stat-item no-icon" title="${escapeHtml(label)}">
              <span class="stat-fallback-label">${escapeHtml(label)}</span>
              <span class="stat-value">${escapeHtml(stats[k])}</span>
            </div>
          `;
        })
        .join("");

      return `
        <section class="stat-card">
          <h3>${state.lang === "zh" ? `等级 ${lv}` : `Level ${lv}`}</h3>
          <div class="stat-grid">${rows}</div>
        </section>
      `;
    })
    .join("");
}

function getCardTypeLabel(type) {
  const labels = {
    tower: state.lang === "zh" ? "防御塔" : "Tower",
    spell: state.lang === "zh" ? "法术" : "Spell",
    enchantment: state.lang === "zh" ? "附魔" : "Enchantment",
    curse: state.lang === "zh" ? "诅咒" : "Curse",
    emblem: state.lang === "zh" ? "纹章" : "Emblem",
    random_tower: state.lang === "zh" ? "随机塔" : "Random Tower",
  };
  return labels[type] || type;
}

function getArtPath(card) {
  const variants = (card.resources && card.resources.art_variants) || [];
  const first = variants[0];
  if (!first || !first.website_path) return "";
  if (card.classification === "towers") return `generated/towers/${first.website_path}`;
  return `generated/non_towers/${first.website_path}`;
}

function populateDlcSelect() {
  const set = new Set(state.decks.map((d) => d.expansion || "liberation"));
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

function populateDifficultySelect() {
  const set = new Set(state.decks.map((d) => d.difficulty).filter(Boolean));
  const values = ["all", "easy", "normal", "hard", "extreme"].filter((v) => v === "all" || set.has(v));

  const labels = {
    all: state.lang === "zh" ? "全部难度" : "All difficulties",
    easy: state.lang === "zh" ? "简单" : "Easy",
    normal: state.lang === "zh" ? "普通" : "Normal",
    hard: state.lang === "zh" ? "困难" : "Hard",
    extreme: state.lang === "zh" ? "极难" : "Extreme",
  };

  const prev = state.difficulty;
  els.difficultySelect.innerHTML = values.map((v) => `<option value="${v}">${labels[v] || v}</option>`).join("");
  els.difficultySelect.value = values.includes(prev) ? prev : "all";
  state.difficulty = els.difficultySelect.value;
}

function statLabel(key) {
  const labels = {
    max_health: state.lang === "zh" ? "生命" : "Max Health",
    regen: state.lang === "zh" ? "每回合回复" : "Regen",
    gold: state.lang === "zh" ? "水晶" : "Crystals",
    gold_multiplier: state.lang === "zh" ? "水晶倍率" : "Crystal Mult.",
    mana: state.lang === "zh" ? "初始法力" : "Starting Mana",
    luck: state.lang === "zh" ? "幸运" : "Luck",
    armor_pen_flat: state.lang === "zh" ? "物穿" : "Armor Pen.",
    magic_pen_flat: state.lang === "zh" ? "法穿" : "Magic Pen.",
    range_multiplier: state.lang === "zh" ? "射程%" : "Range %",
    fire_rate_multiplier: state.lang === "zh" ? "攻速%" : "Fire Rate %",
    shield_loss: state.lang === "zh" ? "护盾损失%" : "Shield Loss %",
  };
  return labels[key] || key;
}

const DECK_STAT_ICON_MAP = {
  max_health: "assets/icons/heart.png",
  regen: "assets/icons/regen.png",
  gold: "assets/icons/coin.png",
  gold_multiplier: "assets/icons/coin_multiplier.png",
  mana: "assets/icons/mana.png",
  luck: "assets/icons/luck.png",
  armor_pen_flat: "assets/icons/armor penetration.png",
  magic_pen_flat: "assets/icons/magic penetration.png",
  range_multiplier: "assets/icons/range.png",
  fire_rate_multiplier: "assets/icons/attack speed.png",
  shield_loss: "assets/icons/shield.png",
};

function formatStatValue(key, value) {
  if (["gold_multiplier", "range_multiplier", "fire_rate_multiplier", "shield_loss"].includes(key)) {
    const num = Number(value);
    if (Number.isFinite(num)) {
      return `${num >= 0 ? "+" : ""}${num}%`;
    }
    return `${String(value).startsWith("-") ? "" : "+"}${value}%`;
  }
  return String(value);
}

function formatDeckStatRangeValue(key, minValue, maxValue) {
  if (["gold_multiplier", "range_multiplier", "fire_rate_multiplier", "shield_loss"].includes(key)) {
    const minNum = Number(minValue);
    const maxNum = Number(maxValue);
    const minText = Number.isFinite(minNum) ? `${minNum}%` : `${String(minValue).replace(/^\+/, "")}%`;
    const maxText = Number.isFinite(maxNum) ? `${maxNum}%` : `${String(maxValue).replace(/^\+/, "")}%`;
    return `${minText} - ${maxText}`;
  }
  return `${formatStatValue(key, minValue)} - ${formatStatValue(key, maxValue)}`;
}

function isDefaultDeckStat(key, value) {
  const baseline = {
    regen: 0,
    gold: 30,
    gold_multiplier: 0,
    mana: 3,
    luck: 0,
    armor_pen_flat: 0,
    magic_pen_flat: 0,
    range_multiplier: 0,
    fire_rate_multiplier: 0,
    shield_loss: 0,
  };

  if (!(key in baseline)) return false;
  const num = Number(value);
  return Number.isFinite(num) && num === baseline[key];
}

function getDeckStatDeltaClass(key, value) {
  const baseline = {
    regen: 0,
    gold: 30,
    gold_multiplier: 0,
    mana: 3,
    luck: 0,
    armor_pen_flat: 0,
    magic_pen_flat: 0,
    range_multiplier: 0,
    fire_rate_multiplier: 0,
    shield_loss: 0,
  };

  if (!(key in baseline)) return "";
  if (key === "max_health") return "";

  const num = Number(value);
  if (!Number.isFinite(num)) return "";
  if (num > baseline[key]) return "deck-stat-up";
  if (num < baseline[key]) return "deck-stat-down";
  return "";
}

function getDeckStatRangeDeltaClass(key, minValue, maxValue) {
  const baseline = {
    regen: 0,
    gold: 30,
    gold_multiplier: 0,
    mana: 3,
    luck: 0,
    armor_pen_flat: 0,
    magic_pen_flat: 0,
    range_multiplier: 0,
    fire_rate_multiplier: 0,
    shield_loss: 0,
  };

  if (!(key in baseline)) return "";
  if (key === "max_health") return "";

  const minNum = Number(minValue);
  const maxNum = Number(maxValue);
  if (!Number.isFinite(minNum) || !Number.isFinite(maxNum)) return "";

  if (minNum > baseline[key] && maxNum > baseline[key]) return "deck-stat-up";
  if (minNum < baseline[key] && maxNum < baseline[key]) return "deck-stat-down";
  return "";
}

function buildCardItem(cardRef) {
  const count = Number(cardRef.count || 1);
  const isPlaceholder = cardRef.id === "__RANDOM_TOWER__" || cardRef.placeholder === "random_tower";

  if (isPlaceholder) {
    return {
      id: "__RANDOM_TOWER__",
      type: "random_tower",
      rarity: "unknown",
      cost: null,
      name: { en: "Random Tower", zh: "随机塔" },
      description: { en: "A random tower is added at start.", zh: "开局加入一张随机塔。" },
      resources: { art_variants: [] },
      classification: "placeholder",
      count,
    };
  }

  const card = state.cards.get(cardRef.id);
  if (!card) {
    return {
      id: cardRef.id,
      type: "tower",
      rarity: "unknown",
      cost: null,
      name: { en: cardRef.id, zh: cardRef.id },
      description: { en: "", zh: "" },
      resources: { art_variants: [] },
      classification: "unknown",
      count,
    };
  }

  const normalizedType = String(card.type || "tower").toLowerCase();

  return {
    ...card,
    type: normalizedType,
    cost: card.cost ?? card.mana_cost ?? null,
    count,
  };
}

function buildDeckTrinketRefs(trinketRefs) {
  const order = [];
  const counts = new Map();

  (trinketRefs || []).forEach((ref) => {
    const id = typeof ref === "string" ? ref : ref?.id;
    if (!id) return;

    const rawCount = typeof ref === "object" && ref ? Number(ref.count) : 1;
    const count = Number.isFinite(rawCount) && rawCount > 0 ? rawCount : 1;

    if (!counts.has(id)) {
      order.push(id);
      counts.set(id, 0);
    }
    counts.set(id, counts.get(id) + count);
  });

  return order.map((id) => ({ id, count: counts.get(id) || 1 }));
}

function buildTrinketItem(trinketRef) {
  const trinketId = typeof trinketRef === "string" ? trinketRef : trinketRef?.id;
  const rawCount = typeof trinketRef === "object" && trinketRef ? Number(trinketRef.count) : 1;
  const count = Number.isFinite(rawCount) && rawCount > 0 ? rawCount : 1;

  if (trinketId === "__RANDOM_COMMON_TRINKET__") {
    return {
      id: "__RANDOM_COMMON_TRINKET__",
      rarity: "common",
      placeholder: "random_common_trinket",
      name: { en: "Random Common Trinket", zh: "随机普通遗物" },
      description: {
        en: "A random common trinket is added at start.",
        zh: "开局加入一个随机普通遗物。",
      },
      resources: { art: { website_path: "" } },
      count,
    };
  }

  if (trinketId === "__RANDOM_TRINKET__") {
    return {
      id: "__RANDOM_TRINKET__",
      rarity: "unknown",
      placeholder: "random_trinket",
      name: { en: "Random Trinket", zh: "随机遗物" },
      description: {
        en: "A random trinket is added at start.",
        zh: "开局加入一个随机遗物。",
      },
      resources: { art: { website_path: "" } },
      count,
    };
  }

  const trinket = state.trinkets.get(trinketId);
  if (!trinket) {
    return {
      id: trinketId,
      rarity: "unknown",
      name: { en: trinketId, zh: trinketId },
      description: { en: "", zh: "" },
      resources: { art: { website_path: "" } },
      count,
    };
  }
  return {
    ...trinket,
    count,
  };
}

function applyHoverRailSides() {
  const grids = Array.from(document.querySelectorAll(".deck-card-grid"));
  grids.forEach((grid) => {
    const wraps = Array.from(grid.querySelectorAll(".tower-card-wrap"));
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
  });
}

function filteredDecks() {
  const q = state.query.trim().toLowerCase();
  return state.decks.filter((deck) => {
    if (state.dlc !== "all" && (deck.expansion || "liberation") !== state.dlc) return false;
    if (state.difficulty !== "all" && (deck.difficulty || "") !== state.difficulty) return false;
    if (!q) return true;

    const deckName = getDeckName(deck).toLowerCase();
    if (deckName.includes(q) || deck.name.toLowerCase().includes(q)) return true;

    return (deck.cards || []).some((c) => {
      const card = state.cards.get(c.id);
      if (!card) return false;
      const name = getCardName(card).toLowerCase();
      return name.includes(q) || card.id.toLowerCase().includes(q);
    }) ||
      (deck.trinkets || []).some((id) => {
        const trinket = state.trinkets.get(id);
        if (!trinket) return id.toLowerCase().includes(q);
        const name = getTrinketName(trinket).toLowerCase();
        return name.includes(q) || id.toLowerCase().includes(q);
      });
  });
}

function renderDeckCard(card) {
  const isPlaceholder = card.id === "__RANDOM_TOWER__";
  const type = card.type || "tower";
  const isBasicTower = type === "tower" && !!card.is_basic;
  const theme = TYPE_THEME[type] || TYPE_THEME.tower;
  const rarity = (card.rarity || "unknown").toLowerCase();
  const art = getArtPath(card);

  const costVisible = type === "tower" || type === "spell" || type === "enchantment";
  const rarityVisible = type !== "curse" && !isBasicTower;
  const typeLabel = isPlaceholder ? "tower" : isBasicTower ? "basic" : getCardTypeLabel(type);
  const typeLabelUpper = String(typeLabel).toUpperCase();

  const keywordRail = renderKeywordRail(card);

  return `
    <article class="tower-card-wrap deck-card-wrap">
      <div class="deck-card" style="--card-theme:${theme};">
        <div class="cost ${costVisible ? "" : "hidden"}">${costVisible ? escapeHtml(card.cost ?? "-") : ""}</div>
        ${
          isPlaceholder
            ? `<div class="deck-random-art">${state.lang === "zh" ? "随机塔" : "RANDOM"}</div>`
            : `<img class="art" src="${escapeHtml(art)}" alt="${escapeHtml(getCardName(card))}" loading="lazy" />`
        }
        <h3 class="name">${escapeHtml(getCardName(card))}</h3>
        <div class="rarity ${rarityVisible ? "" : "hidden"} ${escapeHtml(rarity)}">${rarityVisible ? escapeHtml(rarity.toUpperCase()) : ""}</div>
        <p class="description">${getCardDescriptionHtml(card)}</p>
        <div class="type">${escapeHtml(typeLabelUpper)}</div>
        <div class="stack-badge">x${escapeHtml(card.count)}</div>
      </div>
      ${keywordRail}
    </article>
  `;
}

function renderDeckTrinket(trinket) {
  const rarity = (trinket.rarity || "unknown").toLowerCase();
  const art = getTrinketArtPath(trinket);
  const isPlaceholder =
    trinket.id === "__RANDOM_COMMON_TRINKET__" ||
    trinket.placeholder === "random_common_trinket" ||
    trinket.id === "__RANDOM_TRINKET__" ||
    trinket.placeholder === "random_trinket";

  return `
    <article class="tower-card-wrap deck-trinket-wrap">
      <div class="tower-card relic-card deck-trinket-card">
        ${
          art && !isPlaceholder
            ? `<img class="art" src="${escapeHtml(art)}" alt="${escapeHtml(getTrinketName(trinket))}" loading="lazy" />`
            : `<div class="deck-random-art">${state.lang === "zh" ? "随机遗物" : "RANDOM TRINKET"}</div>`
        }
        <h3 class="name">${escapeHtml(getTrinketName(trinket))}</h3>
        <div class="rarity ${escapeHtml(rarity)}">${escapeHtml(rarity.toUpperCase())}</div>
        <p class="description">${escapeHtml(getTrinketDescription(trinket))}</p>
        <div class="stack-badge ${trinket.count > 1 ? "" : "hidden"}">x${escapeHtml(trinket.count)}</div>
      </div>
    </article>
  `;
}

function render() {
  const decks = filteredDecks();
  els.summary.textContent =
    state.lang === "zh"
      ? `共 ${state.decks.length} 个卡组，当前显示 ${decks.length} 个`
      : `${decks.length} shown out of ${state.decks.length} decks`;

  els.list.innerHTML = decks
    .map((deck) => {
      const stats = deck.stats || {};
      const statRanges = deck.stat_ranges || {};
      const statRows = Object.keys(stats)
        .map((k) => {
          const range = statRanges[k];
          const hasRange =
            !!range &&
            range.min !== undefined &&
            range.max !== undefined &&
            Number(range.min) !== Number(range.max);
          const isDefault = isDefaultDeckStat(k, stats[k]);
          const deltaClass = getDeckStatDeltaClass(k, stats[k]);
          const rangeDeltaClass = hasRange ? getDeckStatRangeDeltaClass(k, range.min, range.max) : "";
          const icon = DECK_STAT_ICON_MAP[k] || "assets/icons/luck.png";
          return `
            <span class="deck-stat ${!hasRange && isDefault ? "deck-stat-default" : ""} ${hasRange ? rangeDeltaClass : deltaClass}">
              <img class="deck-stat-icon" src="${escapeHtml(icon)}" alt="${escapeHtml(statLabel(k))}" loading="lazy" />
              <span class="deck-stat-label">${escapeHtml(statLabel(k))}</span>
              <span class="deck-stat-value">${escapeHtml(
                hasRange ? formatDeckStatRangeValue(k, range.min, range.max) : formatStatValue(k, stats[k])
              )}</span>
            </span>
          `;
        })
        .join("");

      const difficulty = deck.difficulty || "-";
      const difficultyClass = String(difficulty || "").toLowerCase();
      const cards = (deck.cards || []).map(buildCardItem);
      const cardRows = cards.map(renderDeckCard).join("");
      const trinkets = buildDeckTrinketRefs(deck.trinkets || []).map(buildTrinketItem);
      const trinketRows = trinkets.map(renderDeckTrinket).join("");

      const cardsTitle = state.lang === "zh" ? "初始卡牌" : "Starting Cards";
      const trinketsTitle = state.lang === "zh" ? "初始遗物" : "Starting Trinkets";

      return `
        <section class="deck-section">
          <div class="deck-head">
            <h2>${escapeHtml(getDeckName(deck))}</h2>
            <div class="deck-meta">
              <span class="deck-pill">${escapeHtml((deck.expansion || "liberation").toUpperCase())}</span>
              <span class="deck-pill difficulty-pill difficulty-${escapeHtml(difficultyClass)}">${escapeHtml(difficulty.toUpperCase())}</span>
            </div>
          </div>
          <div class="deck-stats">${statRows}</div>
          ${trinkets.length ? `<h3 class="deck-subtitle">${escapeHtml(trinketsTitle)}</h3><div class="deck-trinket-grid">${trinketRows}</div>` : ""}
          <h3 class="deck-subtitle">${escapeHtml(cardsTitle)}</h3>
          <div class="deck-card-grid">${cardRows}</div>
        </section>
      `;
    })
    .join("");

  applyHoverRailSides();
}

async function init() {
  state.lang = getInitialLanguage();
  els.langSelect.value = state.lang;

  const [decksRes, towersRes, nonTowersRes, trinketsRes] = await Promise.all([
    fetch("generated/decks/decks.cleaned.json"),
    fetch("generated/towers/towers.cleaned.json"),
    fetch("generated/non_towers/non_towers.cleaned.json"),
    fetch("generated/relics/relics.cleaned.json"),
  ]);

  state.decks = await decksRes.json();
  const towers = await towersRes.json();
  const nonTowers = await nonTowersRes.json();
  const trinkets = await trinketsRes.json();

  [...towers, ...nonTowers].forEach((c) => state.cards.set(c.id, c));
  trinkets.forEach((t) => state.trinkets.set(t.id, t));

  populateDlcSelect();
  populateDifficultySelect();
  render();

  els.langSelect.addEventListener("change", () => {
    state.lang = els.langSelect.value;
    persistLanguage(state.lang);
    populateDlcSelect();
    populateDifficultySelect();
    render();
  });

  els.searchInput.addEventListener("input", () => {
    state.query = els.searchInput.value;
    render();
  });

  els.dlcSelect.addEventListener("change", () => {
    state.dlc = els.dlcSelect.value;
    render();
  });

  els.difficultySelect.addEventListener("change", () => {
    state.difficulty = els.difficultySelect.value;
    render();
  });

  window.addEventListener("resize", applyHoverRailSides);
}

init().catch((err) => {
  console.error(err);
  els.summary.textContent = "Failed to load decks data.";
});
