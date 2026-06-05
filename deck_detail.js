const state = {
  deck: null,
  towers: [],
  nonTowers: [],
  lang: "en",
};

const els = {
  root: document.getElementById("deckDetailRoot"),
  langSelect: document.getElementById("langSelect"),
};

const LANG_STORAGE_KEY = "tt_codex_lang";

const FULL_POOL_WHEN_MISSING_DECK_KEYS = new Set([
  "shield_master",
  "nuketown",
  "fading_consciousness",
  "illusionist",
]);

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

function getCardArt(card) {
  const variants = (card.resources && card.resources.art_variants) || [];
  const first = variants[0];
  if (!first || !first.website_path) return "";
  if (card.classification === "towers") return `generated/towers/${first.website_path}`;
  return `generated/non_towers/${first.website_path}`;
}

function getPoolEntryForDeck(card, deckKey) {
  const entries = (card.deck_pool && card.deck_pool.by_deck) || [];
  return entries.find((e) => String(e.deck_key || "") === String(deckKey || "")) || null;
}

function getEffectivePoolState(entry, deckKey) {
  const hasRawPoolData = typeof (entry && entry.pool_count) === "number";
  if (hasRawPoolData) {
    return {
      hasPoolData: true,
      inPool: Number(entry.pool_count || 0) > 0,
      inferredFullPool: false,
    };
  }
  // Deck detail uses exclusion semantics: missing pool data means not excluded (included).
  return {
    hasPoolData: true,
    inPool: true,
    inferredFullPool: true,
  };
}

function getInitialCountInDeck(deck, cardId) {
  const refs = Array.isArray(deck.cards) ? deck.cards : [];
  const found = refs.find((r) => String((r && r.id) || "") === String(cardId || ""));
  if (!found) return 0;
  const count = Number(found.count || 0);
  return Number.isFinite(count) && count > 0 ? count : 0;
}

function getCardDetailHref(card) {
  if (card.classification === "towers" || card.type === "tower") {
    return `index.html#card=${encodeURIComponent(card.id)}`;
  }
  return `non_tower_card.html?id=${encodeURIComponent(card.id)}`;
}

function getExpansionOrder(card) {
  const expansion = String((card && card.expansion) || "liberation").toLowerCase();
  if (expansion === "liberation") return 0;
  if (expansion === "celestial_dawn") return 1;
  if (expansion === "astral_siege") return 2;
  return 3;
}

function getExpansionLabel(order) {
  if (order === 0) return state.lang === "zh" ? "本体" : "Base";
  if (order === 1) return "CD";
  if (order === 2) return "AS";
  return state.lang === "zh" ? "其他" : "Other";
}

function getDefaultOverviewSortKey(card) {
  const cost = Number(card && card.cost);
  return {
    cost: Number.isFinite(cost) ? cost : 999,
    id: String((card && card.id) || ""),
  };
}

function compareByOverviewOrder(a, b) {
  const ka = getDefaultOverviewSortKey(a);
  const kb = getDefaultOverviewSortKey(b);
  if (ka.cost !== kb.cost) return ka.cost - kb.cost;
  return ka.id.localeCompare(kb.id);
}

function renderCardStatusSection(cards, sectionTitle) {
  const deckKey = state.deck.key;
  const items = cards
    .map((card) => {
      const poolEntry = getPoolEntryForDeck(card, deckKey);
      const poolState = getEffectivePoolState(poolEntry, deckKey);
      const initialCount = getInitialCountInDeck(state.deck, card.id);
      const statusClass = poolState.inPool ? "is-active" : "is-inactive";
      const statusText = poolState.inPool
        ? state.lang === "zh"
          ? "卡池有"
          : "In Pool"
        : state.lang === "zh"
          ? "卡池无"
          : "Excluded";
      const art = getCardArt(card);
      const link = getCardDetailHref(card);
      const isTower = card.classification === "towers" || card.type === "tower";

      return {
        card,
        expansionOrder: getExpansionOrder(card),
        includeOrder: poolState.inPool ? (initialCount > 0 ? 0 : 1) : 2,
        typeOrder: isTower ? 0 : 1,
        html: `
          <article class="deck-status-item ${statusClass}">
            <a class="deck-status-link" href="${escapeHtml(link)}">
              ${art ? `<img class="deck-status-art" src="${escapeHtml(art)}" alt="${escapeHtml(getCardName(card))}" loading="lazy" />` : ""}
              <div class="deck-status-main">
                <h4>${escapeHtml(getCardName(card))}</h4>
                <p>${escapeHtml(statusText)}</p>
              </div>
              <span class="deck-status-count ${initialCount > 0 ? "" : "hidden"}">x${escapeHtml(initialCount)}</span>
            </a>
          </article>
        `,
      };
    })
    .sort((a, b) => {
      if (a.expansionOrder !== b.expansionOrder) return a.expansionOrder - b.expansionOrder;
      if (a.includeOrder !== b.includeOrder) return a.includeOrder - b.includeOrder;
      if (a.typeOrder !== b.typeOrder) return a.typeOrder - b.typeOrder;
      return compareByOverviewOrder(a.card, b.card);
    });

  const grouped = [0, 1, 2]
    .map((order) => {
      const partItems = items.filter((item) => item.expansionOrder === order);
      if (!partItems.length) return "";
      return `
        <section class="deck-expansion-group">
          <div class="deck-expansion-title">${escapeHtml(getExpansionLabel(order))}</div>
          <div class="deck-status-grid">${partItems.map((x) => x.html).join("")}</div>
        </section>
      `;
    })
    .filter(Boolean)
    .join('<hr class="deck-expansion-sep" />');

  return `
    <section class="detail-panel">
      <h3>${escapeHtml(sectionTitle)}</h3>
      ${grouped}
    </section>
  `;
}

function render() {
  if (!state.deck) {
    els.root.innerHTML = `<section class="detail-panel"><p>${state.lang === "zh" ? "未找到该卡组。" : "Deck not found."}</p></section>`;
    return;
  }

  const stats = state.deck.stats || {};
  const statRows = Object.keys(stats)
    .map((k) => `<span class="deck-pill">${escapeHtml(k)}: ${escapeHtml(stats[k])}</span>`)
    .join("");

  const poolSectionTitle = state.lang === "zh" ? "卡池卡牌状态" : "Pool Card Status";

  els.root.innerHTML = `
    <section class="deck-section">
      <div class="deck-head">
        <h2>${escapeHtml(getDeckName(state.deck))}</h2>
        <div class="deck-meta">
          <span class="deck-pill">${escapeHtml((state.deck.expansion || "liberation").toUpperCase())}</span>
          <span class="deck-pill">${escapeHtml((state.deck.difficulty || "-").toUpperCase())}</span>
        </div>
      </div>
      <div class="deck-stats">${statRows}</div>
    </section>
    ${renderCardStatusSection([...state.towers, ...state.nonTowers], poolSectionTitle)}
  `;
}

async function init() {
  state.lang = getInitialLanguage();
  els.langSelect.value = state.lang;

  const deckKey = new URLSearchParams(window.location.search).get("deck") || "";
  const [decksRes, towersRes, nonTowersRes] = await Promise.all([
    fetch("generated/decks/decks.cleaned.json"),
    fetch("generated/towers/towers.cleaned.json"),
    fetch("generated/non_towers/non_towers.cleaned.json"),
  ]);

  const decks = await decksRes.json();
  state.towers = await towersRes.json();
  state.nonTowers = await nonTowersRes.json();

  state.deck =
    decks.find((d) => String(d.key) === String(deckKey)) ||
    decks.find((d) => String(d.name) === String(deckKey)) ||
    null;

  render();

  els.langSelect.addEventListener("change", () => {
    state.lang = els.langSelect.value;
    persistLanguage(state.lang);
    render();
  });
}

init().catch((err) => {
  console.error(err);
  els.root.innerHTML = `<section class="detail-panel"><p>Failed to load deck data.</p></section>`;
});
