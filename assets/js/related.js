/* ============================================================
   Putera Gani — Related Articles Engine
   related.js — dynamically renders related article cards
   from articles.json, with correct slugs & clickable links.

   Usage (on any article page):
     <div id="related-articles" data-current-slug="the-future-of-artificial-intelligence"></div>
     <script src="../../assets/js/related.js"></script>
   ============================================================ */

(async function RelatedArticlesEngine() {

  /* ── Find the container ── */
  const container = document.getElementById('related-articles');
  if (!container) return;

  const currentSlug = container.dataset.currentSlug || '';

  /* ── Category colour map ── */
  const CATEGORY_STYLES = {
    Technology: { bg: 'var(--accent-pale)',  color: 'var(--accent-dark)', border: 'rgba(200,151,58,0.25)' },
    Design:     { bg: '#f0f7ff',             color: '#2563eb',            border: 'rgba(37,99,235,0.2)'   },
    Science:    { bg: '#f0fdf4',             color: '#16a34a',            border: 'rgba(22,163,74,0.2)'   },
    Culture:    { bg: '#fdf4ff',             color: '#9333ea',            border: 'rgba(147,51,234,0.2)'  },
    Business:   { bg: '#fff7ed',             color: '#ea580c',            border: 'rgba(234,88,12,0.2)'   },
    Health:     { bg: '#fef2f2',             color: '#dc2626',            border: 'rgba(220,38,38,0.2)'   },
  };

  /*
   * ── Path helpers ──
   *
   * Article pages always live at:  /articles/[slug]/index.html
   * That is 2 directories deep from the site root.
   * So we always need exactly ../../ as the prefix.
   *
   * We detect depth by counting non-empty path segments, then
   * subtract 1 (for the filename "index.html" or trailing slash).
   */
  function getSiteRoot() {
    const parts = window.location.pathname
      .replace(/\/index\.html$/, '')   // strip filename
      .replace(/\/$/, '')              // strip trailing slash
      .split('/')
      .filter(Boolean);
    // parts.length = number of directory levels below root
    return parts.length > 0 ? '../'.repeat(parts.length) : './';
  }

  const ROOT = getSiteRoot();

  function dataPath()       { return `${ROOT}data/articles.json`; }
  function articleUrl(slug) { return `${ROOT}articles/${slug}/index.html`; }

  /* ── Render one related card ── */
  function renderRelatedCard(article) {
    const s   = CATEGORY_STYLES[article.category] || CATEGORY_STYLES.Technology;
    const url = articleUrl(article.slug);
    return `
      <article class="article-card related-card" style="cursor:pointer;" onclick="window.location.href='${url}'">
        <a href="${url}" style="text-decoration:none;" tabindex="-1" aria-hidden="true">
          <div class="card-thumb">
            <img
              src="${article.image}"
              alt="${article.title}"
              loading="lazy"
              width="400" height="250"
              onerror="this.src='https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&q=70'"
            />
            <div class="card-thumb-overlay"></div>
          </div>
        </a>
        <div class="card-body">
          <span class="category-badge" style="background:${s.bg};color:${s.color};border-color:${s.border};">
            ${article.category}
          </span>
          <h3 class="card-title" style="font-size:0.9rem;">
            <a href="${url}" style="text-decoration:none;color:inherit;">${article.title}</a>
          </h3>
          <div class="card-meta">
            <span>${article.readTime} read</span>
          </div>
        </div>
      </article>`;
  }

  /* ── Pick related: same category first, then others; exclude current ── */
  function pickRelated(articles, slug, count = 3) {
    const current    = articles.find(a => a.slug === slug);
    const currentCat = current?.category;
    const sameCategory = articles.filter(a => a.slug !== slug && a.category === currentCat);
    const others       = articles.filter(a => a.slug !== slug && a.category !== currentCat);
    return [...sameCategory, ...others].slice(0, count);
  }

  /* ── Skeleton loader ── */
  function showSkeleton() {
    const card = `
      <div class="article-card" style="pointer-events:none;" aria-hidden="true">
        <div style="aspect-ratio:16/10;background:linear-gradient(90deg,#f0ede8 25%,#e8e4df 50%,#f0ede8 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;"></div>
        <div class="card-body">
          <div style="height:16px;background:#f0ede8;border-radius:4px;width:35%;margin-bottom:10px;animation:shimmer 1.4s infinite;"></div>
          <div style="height:20px;background:#f0ede8;border-radius:4px;width:90%;margin-bottom:6px;animation:shimmer 1.4s infinite;"></div>
          <div style="height:14px;background:#f0ede8;border-radius:4px;width:40%;animation:shimmer 1.4s infinite;"></div>
        </div>
      </div>`;
    container.innerHTML = Array(3).fill(card).join('');
  }

  /* ── Inject styles once ── */
  function injectStyles() {
    if (document.getElementById('related-styles')) return;
    const style = document.createElement('style');
    style.id = 'related-styles';
    style.textContent = `
      @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      .related-card {
        cursor: pointer;
        transition: transform 0.28s cubic-bezier(0.4,0,0.2,1), box-shadow 0.28s cubic-bezier(0.4,0,0.2,1);
      }
      .related-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 20px 60px rgba(0,0,0,0.14);
      }
      .related-card:hover .card-title a { color: var(--accent-dark) !important; }
      .related-card .card-thumb img { transition: transform 0.5s ease; }
      .related-card:hover .card-thumb img { transform: scale(1.05); }
    `;
    document.head.appendChild(style);
  }

  /* ── Main ── */
  injectStyles();
  showSkeleton();

  try {
    const res = await fetch(dataPath(), { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data    = await res.json();
    const related = pickRelated(data.articles || [], currentSlug, 3);

    if (!related.length) {
      container.innerHTML = '<p style="color:var(--ink-muted);font-size:0.875rem;">No related articles found.</p>';
      return;
    }

    container.innerHTML = related.map(renderRelatedCard).join('');

    /* Animate cards in */
    container.querySelectorAll('.related-card').forEach((card, i) => {
      card.style.opacity   = '0';
      card.style.transform = 'translateY(16px)';
      setTimeout(() => {
        card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        card.style.opacity    = '1';
        card.style.transform  = 'translateY(0)';
      }, i * 80);
    });

  } catch (err) {
    console.error('[RelatedArticles] Failed to load:', err);
    container.innerHTML = `
      <p style="color:var(--ink-muted);font-size:0.875rem;grid-column:1/-1;">
        Could not load related articles.
      </p>`;
  }

})();
