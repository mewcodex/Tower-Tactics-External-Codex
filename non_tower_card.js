const state = {
  card: null,
  decks: [],
  lang: "en",
};

const els = {
  root: document.getElementById("cardDetailRoot"),
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

function getName(card) {
  return (card.name && card.name[state.lang]) || (card.name && card.name.en) || card.id;
}

function getDescription(card) {
  if (!card || !card.description) return "";
  return card.description[state.lang] || card.description.en || "";
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
  if (!first || !first.website_path) return "";
  return `generated/non_towers/${first.website_path}`;
}

function getDeckByEntry(entry) {
  const rawKey = entry && entry.deck_key != null ? String(entry.deck_key) : "";
  if (rawKey) {
    const byKey = state.decks.find((d) => String(d.key) === rawKey);
    if (byKey) return byKey;
  }
  const rawName = String((entry && (entry.deck_name || entry.deck_label)) || "").toLowerCase();
  return state.decks.find((d) => String(d.name || "").toLowerCase() === rawName) || null;
}

function getDeckIcon(deck) {
  const icon = deck && deck.resources && deck.resources.icon;
  const websitePath = icon && icon.website_path;
  if (websitePath) return `generated/decks/${websitePath}`;
  return "";
}

function getEffectivePoolState(entry) {
  const hasRawPoolData = typeof (entry && entry.pool_count) === "number";
  if (hasRawPoolData) {
    return {
      hasPoolData: true,
      inPool: Number(entry.pool_count || 0) > 0,
      inferredFullPool: false,
    };
  }
  // Card pages follow exclusion semantics: missing pool data means included.
  return {
    hasPoolData: true,
    inPool: true,
    inferredFullPool: true,
  };
}

function render() {
  const card = state.card;
  if (!card) {
    els.root.innerHTML = `<section class="detail-panel"><p>${state.lang === "zh" ? "未找到该卡牌。" : "Card not found."}</p></section>`;
    return;
  }

  const art = getArt(card);
  const rarity = (card.rarity || "unknown").toLowerCase();
  const rarityVisible = card.type !== "curse";
  const rawEntries = (card.deck_pool && card.deck_pool.by_deck) || [];
  const entries = rawEntries.length
    ? rawEntries
    : state.decks.map((deck) => ({
        deck_key: deck.key,
        deck_name: deck.name,
        deck_label: (deck.title && deck.title.en) || deck.name,
        initial_count: 0,
        pool_count: null,
      }));

  const poolRows = entries
    .map((entry) => {
      const deck = getDeckByEntry(entry);
      const deckName =
        (deck && ((deck.title && deck.title[state.lang]) || (deck.title && deck.title.en) || deck.name)) ||
        entry.deck_label ||
        entry.deck_name ||
        entry.deck_key ||
        "-";
      const deckHref = deck ? `deck_detail.html?deck=${encodeURIComponent(deck.key)}` : "";
      const icon = deck ? getDeckIcon(deck) : "";
      const poolState = getEffectivePoolState(entry);
      const stateClass = poolState.inPool ? "is-active" : "is-inactive";
      const initialCount = Number(entry.initial_count || 0);
      const statusText = poolState.inPool
        ? state.lang === "zh"
          ? "有"
          : "Yes"
        : state.lang === "zh"
          ? "无"
          : "No";
      const iconMarkup = icon
        ? `<img class="pool-icon-art" src="${escapeHtml(icon)}" alt="${escapeHtml(deckName)}" loading="lazy" />`
        : `<div class="pool-icon-art pool-icon-art-placeholder">${escapeHtml(deckName)}</div>`;

      const body = `
        <article class="pool-icon-item ${stateClass}" title="${escapeHtml(deckName)} | ${escapeHtml(statusText)}">
          ${iconMarkup}
          <span class="pool-initial-badge ${initialCount > 0 ? "" : "hidden"}">x${escapeHtml(initialCount)}</span>
        </article>
      `;

      if (!deckHref) return body;
      return `<a class="plain-link" href="${escapeHtml(deckHref)}">${body}</a>`;
    })
    .join("");

  const effectiveInPool = entries.reduce((sum, entry) => {
    const p = getEffectivePoolState(entry);
    return sum + (p.inPool ? 1 : 0);
  }, 0);

  const totalDecks = entries.length;
  const summary =
    state.lang === "zh"
      ? `卡池中出现于 ${effectiveInPool} / ${totalDecks} 个卡组，初始牌组携带于 ${(card.deck_pool && card.deck_pool.initial_decks) || 0} 个卡组`
      : `In pool: ${effectiveInPool} / ${totalDecks} decks, initially carried by ${(card.deck_pool && card.deck_pool.initial_decks) || 0} decks`;

  els.root.innerHTML = `
    <section class="detail-layout">
      <aside class="detail-left">
        <article class="tower-card non-tower-card detail-card" style="--card-theme:#3b3452;">
          <div class="cost ${(card.type === "spell" || card.type === "enchantment") ? "" : "hidden"}">${escapeHtml(card.cost ?? "-")}</div>
          ${art ? `<img class="art" src="${escapeHtml(art)}" alt="${escapeHtml(getName(card))}" loading="lazy" />` : ""}
          <h2 class="name">${escapeHtml(getName(card))}</h2>
          <div class="rarity ${escapeHtml(rarity)} ${rarityVisible ? "" : "hidden"}">${rarityVisible ? escapeHtml(rarity.toUpperCase()) : ""}</div>
          <p class="description">${escapeHtml(getDescription(card))}</p>
          <div class="type">${escapeHtml(getTypeLabel(card.type).toUpperCase())}</div>
        </article>
      </aside>
      <section class="detail-right">
        <section class="detail-panel">
          <h3>${state.lang === "zh" ? "卡池情况" : "Deck & Pool Presence"}</h3>
          <p class="detail-note">${escapeHtml(summary)}</p>
          <div class="pool-icons-grid">${poolRows}</div>
        </section>
      </section>
    </section>
  `;
}

async function init() {
  state.lang = getInitialLanguage();
  els.langSelect.value = state.lang;

  const cardId = new URLSearchParams(window.location.search).get("id") || "";
  const [cardsRes, decksRes] = await Promise.all([
    fetch("generated/non_towers/non_towers.cleaned.json"),
    fetch("generated/decks/decks.cleaned.json"),
  ]);

  const cards = await cardsRes.json();
  state.decks = await decksRes.json();
  state.card = cards.find((c) => c.id === cardId) || null;

  render();

  els.langSelect.addEventListener("change", () => {
    state.lang = els.langSelect.value;
    persistLanguage(state.lang);
    render();
  });
}

init().catch((err) => {
  console.error(err);
  els.root.innerHTML = `<section class="detail-panel"><p>Failed to load card data.</p></section>`;
});
