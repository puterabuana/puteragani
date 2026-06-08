/* ============================================================
   Putera Gani — JSON-Driven Article Engine
   articles.js — rendering, search, filter, load-more
   ============================================================
   HOW TO ADD NEW ARTICLES:
   1. Open /data/articles.json
   2. Add a new object to the "articles" array
   3. Save — the homepage updates automatically.
   ============================================================ */

const ArticleEngine = (() => {

  /* ── State ── */
  const STATE = {
    all:            [],
    filtered:       [],
    displayed:      0,
    INITIAL:        6,
    PER_LOAD:       3,
    activeCategory: 'All',
    searchQuery:    '',
    isSearchActive: false,
  };

  /* ── Category colour map ── */
  const CATEGORY_STYLES = {
    Technology: { bg: 'var(--accent-pale)',  color: 'var(--accent-dark)', border: 'rgba(200,151,58,0.25)' },
    Design:     { bg: '#f0f7ff',             color: '#2563eb',            border: 'rgba(37,99,235,0.2)'   },
    Science:    { bg: '#f0fdf4',             color: '#16a34a',            border: 'rgba(22,163,74,0.2)'   },
    Culture:    { bg: '#fdf4ff',             color: '#9333ea',            border: 'rgba(147,51,234,0.2)'  },
    Business:   { bg: '#fff7ed',             color: '#ea580c',            border: 'rgba(234,88,12,0.2)'   },
    Health:     { bg: '#fef2f2',             color: '#dc2626',            border: 'rgba(220,38,38,0.2)'   },
  };

  function parseArticleDate(articleOrDate, maybeTime) {
    const dateValue = typeof articleOrDate === 'object' && articleOrDate !== null
      ? articleOrDate.date
      : articleOrDate;
    const timeValue = typeof articleOrDate === 'object' && articleOrDate !== null
      ? articleOrDate.time
      : maybeTime;

    if (!dateValue) return new Date('1970-01-01T00:00:00');
    const rawDate = String(dateValue);
    const dateStr = rawDate.includes('T')
      ? rawDate
      : rawDate + 'T' + (timeValue || '00:00') + ':00';
    return new Date(dateStr);
  }

  function formatDate(articleOrDate, maybeTime) {
    const date = parseArticleDate(articleOrDate, maybeTime);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  function categoryBadge(cat) {
    const s = CATEGORY_STYLES[cat] || CATEGORY_STYLES.Technology;
    return `<span class="category-badge" style="background:${s.bg}; color:${s.color}; border-color:${s.border};">${escapeHtml(cat)}</span>`;
  }

  /* ════════════════════════════════════════════════════════════
     SMART SEARCH ENGINE
     ════════════════════════════════════════════════════════════ */

  /**
   * Convert article date + optional time field into a sortable timestamp.
   * Supports: { date: "2026-05-09", time: "14:30" }
   * Falls back gracefully if time is missing.
   */
  function toDateTime(article) {
    return parseArticleDate(article);
  }

  /**
   * Compute relevance score for an article against a search query.
   * Tier weights:
   *   40 — title match          (highest)
   *   20 — tag / category match
   *   10 — excerpt match
   *    1 — body content match   (lowest)
   */
  function scoreArticle(article, query) {
    const q = query.trim().toLowerCase();
    if (!q) return 0;
    let score = 0;

    const titleLower = (article.title || '').toLowerCase();
    if (titleLower.includes(q)) {
      score += 40;
      if (titleLower.startsWith(q)) score += 20; // bonus for leading match
    }

    const tags = (article.tags || []).map(t => t.toLowerCase());
    if (tags.some(t => t.includes(q)) || (article.category || '').toLowerCase().includes(q)) {
      score += 20;
    }

    if ((article.excerpt || '').toLowerCase().includes(q)) {
      score += 10;
    }

    if ((article.content || '').toLowerCase().includes(q)) {
      score += 1;
    }

    return score;
  }

  /* Escape HTML entities */
  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* Escape special regex characters */
  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Highlight all occurrences of `query` in `text`.
   * Returns HTML with <mark class="search-highlight"> around matches.
   */
  function highlightKeyword(text, query) {
    if (!query || !text) return escapeHtml(text || '');
    const safeText  = escapeHtml(text);
    const safeQuery = escapeHtml(query.trim());
    if (!safeQuery) return safeText;
    const regex = new RegExp('(' + escapeRegex(safeQuery) + ')', 'gi');
    return safeText.replace(regex, '<mark class="search-highlight">$1</mark>');
  }

  /**
   * Extract the most relevant ~160-char snippet from `text`
   * centred on the first occurrence of `query`.
   */
  function extractSnippet(text, query, maxLen) {
    maxLen = maxLen || 160;
    if (!text || !query) return text || '';
    const q   = query.trim().toLowerCase();
    const idx = text.toLowerCase().indexOf(q);

    if (idx === -1) {
      return text.length > maxLen ? text.slice(0, maxLen).trimEnd() + '\u2026' : text;
    }

    const half = Math.floor(maxLen / 2);
    let start  = Math.max(0, idx - half);
    let end    = Math.min(text.length, idx + q.length + half);

    // Expand to fill maxLen
    if (end - start < maxLen) {
      if (start === 0) end = Math.min(text.length, maxLen);
      else             start = Math.max(0, end - maxLen);
    }

    // Snap to word boundaries
    if (start > 0) {
      const sp = text.indexOf(' ', start);
      if (sp !== -1 && sp < idx) start = sp + 1;
    }
    if (end < text.length) {
      const sp = text.lastIndexOf(' ', end);
      if (sp > idx + q.length) end = sp;
    }

    const snippet = text.slice(start, end).trim();
    return (start > 0 ? '\u2026' : '') + snippet + (end < text.length ? '\u2026' : '');
  }

  /**
   * Choose the best snippet for a search result card:
   * 1. Excerpt (if keyword appears there) — cleanest
   * 2. Body content snippet (if keyword in content)
   * 3. Plain excerpt as fallback
   */
  function getBestSnippet(article, query) {
    if (!query) return article.excerpt || '';
    const q = query.trim().toLowerCase();

    if ((article.excerpt || '').toLowerCase().includes(q)) {
      return extractSnippet(article.excerpt, query);
    }
    if ((article.content || '').toLowerCase().includes(q)) {
      return extractSnippet(article.content, query);
    }
    return article.excerpt || '';
  }

  /* ── Standard article card (homepage, no search context) ── */
  function renderCard(article) {
    const date = formatDate(article);
    const url  = article.slug ? 'articles/' + article.slug + '/index.html' : (article.url || '#');
    return '\n      <article class="article-card" data-id="' + escapeHtml(article.id) + '" data-category="' + escapeHtml(article.category) + '">\n        <a href="' + url + '" style="text-decoration:none;" aria-label="Read: ' + escapeHtml(article.title) + '">\n          <div class="card-thumb">\n            <img src="' + escapeHtml(article.image) + '" alt="' + escapeHtml(article.title) + '" loading="lazy" width="600" height="375"\n              onerror="this.src=\'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600&q=75\'" />\n            <div class="card-thumb-overlay"></div>\n          </div>\n        </a>\n        <div class="card-body">\n          ' + categoryBadge(article.category) + '\n          <h2 class="card-title">\n            <a href="' + url + '" style="text-decoration:none; color:inherit;">' + escapeHtml(article.title) + '</a>\n          </h2>\n          <p class="card-desc">' + escapeHtml(article.excerpt) + '</p>\n          <div class="card-meta">\n            <span>' + date + '</span>\n            <span class="card-meta-dot"></span>\n            <span>' + escapeHtml(article.readTime) + ' read</span>\n          </div>\n          <a href="' + url + '" class="btn-primary mt-4" style="width:fit-content; font-size:0.75rem; padding:0.5rem 1.1rem;">\n            Read More\n            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">\n              <path d="M5 12h14M12 5l7 7-7 7"/>\n            </svg>\n          </a>\n        </div>\n      </article>';
  }

  /* ── Search result card — highlighted title + dynamic snippet ── */
  function renderSearchCard(article, query) {
    const date              = formatDate(article);
    const url               = article.slug ? 'articles/' + article.slug + '/index.html' : (article.url || '#');
    const snippet           = getBestSnippet(article, query);
    const highlightedTitle  = highlightKeyword(article.title, query);
    const highlightedSnippet = highlightKeyword(snippet, query);

    return '\n      <article class="article-card" data-id="' + escapeHtml(article.id) + '" data-category="' + escapeHtml(article.category) + '">\n        <a href="' + url + '" style="text-decoration:none;" aria-label="Read: ' + escapeHtml(article.title) + '">\n          <div class="card-thumb">\n            <img src="' + escapeHtml(article.image) + '" alt="' + escapeHtml(article.title) + '" loading="lazy" width="600" height="375"\n              onerror="this.src=\'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600&q=75\'" />\n            <div class="card-thumb-overlay"></div>\n          </div>\n        </a>\n        <div class="card-body">\n          ' + categoryBadge(article.category) + '\n          <h2 class="card-title">\n            <a href="' + url + '" style="text-decoration:none; color:inherit;">' + highlightedTitle + '</a>\n          </h2>\n          <p class="card-desc">' + highlightedSnippet + '</p>\n          <div class="card-meta">\n            <span>' + date + '</span>\n            <span class="card-meta-dot"></span>\n            <span>' + escapeHtml(article.readTime) + ' read</span>\n          </div>\n          <a href="' + url + '" class="btn-primary mt-4" style="width:fit-content; font-size:0.75rem; padding:0.5rem 1.1rem;">\n            Read More\n            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">\n              <path d="M5 12h14M12 5l7 7-7 7"/>\n            </svg>\n          </a>\n        </div>\n      </article>';
  }

  /* ── Render featured hero ── */
  function renderFeatured(articles) {
    const heroSection = document.getElementById('featured-section');
    if (!heroSection) return;
    const featured = articles.find(function(a) { return a.featured; }) || articles[0];
    if (!featured) { heroSection.style.display = 'none'; return; }
    const url = featured.slug ? 'articles/' + featured.slug + '/index.html' : (featured.url || '#');
    heroSection.innerHTML = '\n      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">\n        <div class="grid lg:grid-cols-2 gap-12 items-center">\n          <div class="animate-fade-up">\n            <div class="hero-tag mb-5">\n              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor">\n                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>\n              </svg>\n              Featured Story\n            </div>\n            <h1 class="font-display text-white mb-5 leading-tight" style="font-size:clamp(2rem,4vw,3rem); font-weight:700; letter-spacing:-0.02em;">' + escapeHtml(featured.title) + '</h1>\n            <p class="text-base mb-8" style="color:rgba(255,255,255,0.65); line-height:1.75; max-width:520px;">' + escapeHtml(featured.excerpt) + '</p>\n            <div class="flex flex-wrap items-center gap-4">\n              <a href="' + url + '" class="btn-accent">\n                Read Story\n                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>\n              </a>\n              <div class="flex items-center gap-3" style="color:rgba(255,255,255,0.45); font-size:0.8125rem;">\n                <span>' + escapeHtml(featured.readTime) + ' read</span>\n                <span style="width:3px;height:3px;border-radius:50%;background:rgba(255,255,255,0.3);"></span>\n                <span>' + escapeHtml(featured.category) + '</span>\n              </div>\n            </div>\n          </div>\n          <div class="hero-img-wrap animate-fade-up delay-200" style="height:420px;">\n            <img src="' + escapeHtml(featured.imageLarge || featured.image) + '" alt="' + escapeHtml(featured.title) + '" loading="eager"\n              onerror="this.src=\'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&q=80\'" />\n            <div class="hero-img-overlay"></div>\n          </div>\n        </div>\n      </div>';
  }

  /* ── Render trending sidebar ── */
  function renderTrending(articles) {
    const trendingList = document.getElementById('trending-list');
    if (!trendingList) return;
    const trending = articles.filter(function(a) { return a.trending; }).slice(0, 5);
    if (!trending.length) { var w = trendingList.closest('.trending-widget'); if(w) w.remove(); return; }
    trendingList.innerHTML = trending.map(function(a, i) {
      const url = a.slug ? 'articles/' + a.slug + '/index.html' : (a.url || '#');
      return '\n        <a href="' + url + '" class="trending-item" style="text-decoration:none;">\n          <span class="trending-num">' + String(i+1).padStart(2,'0') + '</span>\n          <div>\n            <div class="trending-title">' + escapeHtml(a.title) + '</div>\n            <div style="font-size:0.7rem; color:var(--ink-muted); margin-top:3px;">' + escapeHtml(a.category) + ' · ' + escapeHtml(a.readTime) + '</div>\n          </div>\n        </a>';
    }).join('');
  }

  /* ── Render category filter chips ── */
  function renderCategoryFilter(articles) {
    const filterWrap = document.getElementById('category-filter');
    if (!filterWrap) return;
    const categories = ['All'].concat([...new Set(articles.map(function(a){ return a.category; }))].sort());
    filterWrap.innerHTML = categories.map(function(cat) {
      const s = cat === 'All'
        ? { bg: 'var(--ink)', color: 'var(--paper)', border: 'var(--ink)' }
        : (CATEGORY_STYLES[cat] || { bg: 'var(--accent-pale)', color: 'var(--accent-dark)', border: 'rgba(200,151,58,0.25)' });
      const isActive = cat === STATE.activeCategory;
      return '<button class="category-filter-btn' + (isActive?' active':'') + '" data-category="' + cat + '" style="display:inline-flex;align-items:center;padding:5px 14px;border-radius:50px;font-size:0.6875rem;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;border:1px solid;background:' + (isActive?s.bg:'transparent') + ';color:' + (isActive?s.color:'var(--ink-soft)') + ';border-color:' + (isActive?s.border:'var(--rule)') + ';transition:all 0.22s ease;">' + escapeHtml(cat) + '</button>';
    }).join('');

    filterWrap.querySelectorAll('.category-filter-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        STATE.activeCategory = btn.dataset.category;
        filterWrap.querySelectorAll('.category-filter-btn').forEach(function(b) {
          const cat = b.dataset.category;
          const s = cat === 'All'
            ? { bg: 'var(--ink)', color: 'var(--paper)', border: 'var(--ink)' }
            : (CATEGORY_STYLES[cat] || { bg: 'var(--accent-pale)', color: 'var(--accent-dark)', border: 'rgba(200,151,58,0.25)' });
          const active = b.dataset.category === STATE.activeCategory;
          b.style.background  = active ? s.bg    : 'transparent';
          b.style.color       = active ? s.color : 'var(--ink-soft)';
          b.style.borderColor = active ? s.border : 'var(--rule)';
        });
        applyFilters();
      });
    });
  }

  /* ── Render sidebar categories ── */
  function renderSidebarCategories(articles) {
    const sidebarCats = document.getElementById('sidebar-categories');
    if (!sidebarCats) return;
    const categoryPageMap = { Technology:'technology.html', Design:'design.html', Science:'science.html', Culture:'culture.html', Business:'category/business/index.html', Health:'category/health/index.html' };
    const categories = [...new Set(articles.map(function(a){ return a.category; }))].sort();
    sidebarCats.innerHTML = categories.map(function(cat) {
      const s    = CATEGORY_STYLES[cat] || CATEGORY_STYLES.Technology;
      const href = categoryPageMap[cat] || 'category/' + cat.toLowerCase() + '/index.html';
      return '<a href="' + href + '" class="category-badge" style="text-decoration:none;background:' + s.bg + ';color:' + s.color + ';border-color:' + s.border + ';">' + escapeHtml(cat) + '</a>';
    }).join('');
  }

  /* ════════════════════════════════════════════════════════════
     SEARCH OVERLAY
     ════════════════════════════════════════════════════════════ */

  const homepageContent    = document.getElementById('homepage-content');
  const searchOverlay      = document.getElementById('search-overlay');
  const searchResultsGrid  = document.getElementById('search-results-grid');
  const searchNoResults    = document.getElementById('search-no-results');
  const searchNoResultsMsg = document.getElementById('search-no-results-msg');
  const searchOverlayTitle = document.getElementById('search-overlay-title');
  const searchOverlayCount = document.getElementById('search-overlay-count');
  const searchOverlayClose = document.getElementById('search-overlay-close');

  function showSearchOverlay(query, results) {
    if (searchOverlayTitle) searchOverlayTitle.textContent = '"' + query + '"';
    if (searchOverlayCount) {
      searchOverlayCount.textContent = results.length === 0
        ? 'No articles match your search'
        : results.length + ' article' + (results.length !== 1 ? 's' : '') + ' found';
    }

    if (searchResultsGrid) {
      searchResultsGrid.innerHTML = '';
      searchResultsGrid.style.display = '';
    }

    if (results.length === 0) {
      if (searchResultsGrid) searchResultsGrid.style.display = 'none';
      if (searchNoResults) {
        searchNoResults.style.display = '';
        if (searchNoResultsMsg) searchNoResultsMsg.textContent = 'No articles found for "' + query + '". Try different keywords.';
      }
    } else {
      if (searchNoResults) searchNoResults.style.display = 'none';
      if (searchResultsGrid) {
        results.forEach(function(article, i) {
          const div = document.createElement('div');
          div.innerHTML = renderSearchCard(article, query).trim();
          const card = div.firstChild;
          card.style.opacity = '0';
          card.style.transform = 'translateY(16px)';
          card.style.transition = 'opacity 0.35s ease ' + (i * 0.06) + 's, transform 0.35s ease ' + (i * 0.06) + 's';
          searchResultsGrid.appendChild(card);
          requestAnimationFrame(function() { requestAnimationFrame(function() {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }); });
        });
      }
    }

    if (!STATE.isSearchActive) {
      STATE.isSearchActive = true;
      if (homepageContent) homepageContent.classList.add('search-active');
      if (searchOverlay)   searchOverlay.classList.add('search-active');
    }
  }

  function hideSearchOverlay() {
    STATE.isSearchActive = false;
    if (homepageContent) homepageContent.classList.remove('search-active');
    if (searchOverlay)   searchOverlay.classList.remove('search-active');
    if (searchResultsGrid) searchResultsGrid.innerHTML = '';
  }

  if (searchOverlayClose) {
    searchOverlayClose.addEventListener('click', function() {
      clearAllSearchInputs();
      hideSearchOverlay();
    });
  }

  function clearAllSearchInputs() {
    STATE.searchQuery = '';
    document.querySelectorAll('#search-input, #mobile-search-input').forEach(function(i) { i.value = ''; });
    document.querySelectorAll('#search-clear-btn, #mobile-search-clear').forEach(function(b) { b.style.display = 'none'; });
  }

  /* ── Smart full-text search with relevance ranking ── */
  function applyFilters() {
    const q  = STATE.searchQuery.trim();
    const ql = q.toLowerCase();

    if (!q) {
      hideSearchOverlay();
      // Apply category filter even without a search query
      STATE.filtered = STATE.all
        .filter(function(a) {
          if (STATE.activeCategory !== 'All' && a.category !== STATE.activeCategory) return false;
          return true;
        })
        .sort(function(a, b) { return toDateTime(b) - toDateTime(a); });
      renderGrid(true);
      updateLoadMore();
      return;
    }

    const results = STATE.all
      .filter(function(a) {
        if (STATE.activeCategory !== 'All' && a.category !== STATE.activeCategory) return false;
        return (
          (a.title    || '').toLowerCase().includes(ql) ||
          (a.category || '').toLowerCase().includes(ql) ||
          (a.excerpt  || '').toLowerCase().includes(ql) ||
          (a.content  || '').toLowerCase().includes(ql) ||
          (a.tags || []).some(function(t) { return t.toLowerCase().includes(ql); })
        );
      })
      .sort(function(a, b) {
        const diff = scoreArticle(b, q) - scoreArticle(a, q);
        return diff !== 0 ? diff : toDateTime(b) - toDateTime(a);
      });

    showSearchOverlay(q, results);
  }

  /* ── Render the homepage article grid ── */
  function renderGrid(reset) {
    const grid = document.getElementById('article-grid');
    if (!grid) return;

    if (reset) {
      grid.innerHTML = '';
      STATE.displayed = 0;
    }

    const batchSize = (reset && STATE.displayed === 0) ? STATE.INITIAL : STATE.PER_LOAD;
    const slice = STATE.filtered.slice(STATE.displayed, STATE.displayed + batchSize);
    if (!slice.length && STATE.displayed === 0) {
      grid.innerHTML = '<div class="col-span-full" style="padding:3rem 0; text-align:center; color:var(--ink-muted);"><svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin:0 auto 1rem; opacity:0.4; display:block;"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg><p style="font-size:1rem; font-weight:500;">No articles found</p><p style="font-size:0.875rem; margin-top:0.25rem; opacity:0.6;">Try a different category.</p></div>';
      return;
    }

    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry, i) {
        if (entry.isIntersecting) {
          entry.target.style.animationDelay = (i * 0.07) + 's';
          entry.target.classList.add('animate-fade-up');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    slice.forEach(function(article) {
      const div = document.createElement('div');
      div.innerHTML = renderCard(article).trim();
      const card = div.firstChild;
      card.style.opacity = '0';
      grid.appendChild(card);
      observer.observe(card);
    });

    STATE.displayed += slice.length;
  }

  function updateLoadMore() {
    const btn = document.getElementById('load-more-btn');
    if (!btn) return;
    btn.style.display = (STATE.filtered.length - STATE.displayed) > 0 ? '' : 'none';
  }

  /* ── Loading skeleton ── */
  function showSkeleton() {
    const grid = document.getElementById('article-grid');
    if (!grid) return;
    const skeletonCard = '<div class="article-card" style="pointer-events:none;"><div style="aspect-ratio:16/10; background:linear-gradient(90deg,#f0ede8 25%,#e8e4df 50%,#f0ede8 75%); background-size:200% 100%; animation:shimmer 1.4s infinite;"></div><div class="card-body"><div style="height:18px; background:#f0ede8; border-radius:4px; width:30%; margin-bottom:12px; animation:shimmer 1.4s infinite;"></div><div style="height:22px; background:#f0ede8; border-radius:4px; width:90%; margin-bottom:8px; animation:shimmer 1.4s infinite;"></div><div style="height:22px; background:#f0ede8; border-radius:4px; width:75%; margin-bottom:16px; animation:shimmer 1.4s infinite;"></div><div style="height:14px; background:#f0ede8; border-radius:4px; width:60%; animation:shimmer 1.4s infinite;"></div></div></div>';
    grid.innerHTML = Array(6).fill(skeletonCard).join('');
  }

  function showError(msg) {
    const grid = document.getElementById('article-grid');
    if (grid) {
      grid.innerHTML = '<div class="col-span-full" style="padding:3rem; text-align:center; color:var(--ink-muted);"><svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin:0 auto 1rem; opacity:0.4; display:block;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><p style="font-size:1rem; font-weight:500; margin-bottom:0.5rem;">Couldn\'t load articles</p><p style="font-size:0.8125rem; opacity:0.6;">' + escapeHtml(msg) + '</p><button onclick="ArticleEngine.init()" style="margin-top:1.25rem; padding:0.5rem 1.25rem; background:var(--ink); color:#fff; border:none; border-radius:50px; font-size:0.8125rem; cursor:pointer;">Try Again</button></div>';
    }
    const fs = document.getElementById('featured-section');
    if (fs) fs.style.display = 'none';
    const lm = document.getElementById('load-more-btn');
    if (lm) lm.style.display = 'none';
  }

  async function fetchArticles() {
    const res = await fetch('data/articles.json');
    if (!res.ok) throw new Error('HTTP ' + res.status + ': ' + res.statusText);
    const data = await res.json();
    if (!data.articles || !Array.isArray(data.articles)) throw new Error('Invalid data format in articles.json');
    return data.articles;
  }

  /* ── Wire up all search inputs ── */
  function initSearch() {
    const inputs = document.querySelectorAll('#search-input, #mobile-search-input');
    let debounceTimer;

    inputs.forEach(function(input) {
      input.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function() {
          STATE.searchQuery = input.value;
          inputs.forEach(function(i) { if (i !== input) i.value = input.value; });
          applyFilters();
        }, 160);
      });

      input.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
          clearAllSearchInputs();
          hideSearchOverlay();
          input.blur();
          const mobileBar = document.getElementById('mobile-search-bar');
          const mobileBtn = document.getElementById('mobile-search-btn');
          if (mobileBar) mobileBar.classList.remove('open');
          if (mobileBtn) { mobileBtn.classList.remove('active'); mobileBtn.setAttribute('aria-expanded', 'false'); }
        }
      });
    });
  }

  function initLoadMore() {
    const btn = document.getElementById('load-more-btn');
    if (!btn) return;
    btn.addEventListener('click', function() { renderGrid(false); updateLoadMore(); });
  }

  /* ── Public init ── */
  async function init() {
    showSkeleton();
    try {
      const articles = await fetchArticles();
      STATE.all      = articles;
      STATE.filtered = [...articles].sort(function(a, b) { return toDateTime(b) - toDateTime(a); });

      renderFeatured(articles);
      renderTrending(articles);
      renderCategoryFilter(articles);
      renderSidebarCategories(articles);

      const grid = document.getElementById('article-grid');
      if (grid) grid.innerHTML = '';
      STATE.displayed = 0;

      const initialSlice = STATE.filtered.slice(0, STATE.INITIAL);
      const observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry, i) {
          if (entry.isIntersecting) {
            entry.target.style.animationDelay = (i * 0.07) + 's';
            entry.target.classList.add('animate-fade-up');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });

      initialSlice.forEach(function(article) {
        const div = document.createElement('div');
        div.innerHTML = renderCard(article).trim();
        const card = div.firstChild;
        card.style.opacity = '0';
        grid.appendChild(card);
        observer.observe(card);
      });
      STATE.displayed = initialSlice.length;

      updateLoadMore();
      initSearch();
      initLoadMore();

    } catch (err) {
      console.error('[ArticleEngine] Failed to load articles:', err);
      showError(err.message || 'An unexpected error occurred.');
    }
  }

  return { init: init };

})();

/* ── Shimmer animation ── */
const shimmerStyle = document.createElement('style');
shimmerStyle.textContent = '@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }';
document.head.appendChild(shimmerStyle);

/* ── Boot ── */
document.addEventListener('DOMContentLoaded', function() { ArticleEngine.init(); });
