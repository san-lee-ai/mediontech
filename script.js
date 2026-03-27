(function() {
  const observerOptions = { threshold: 0.08 };
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 60);
        revealObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  function initReveals() {
    document.querySelectorAll('.reveal:not(.visible)').forEach(el => revealObserver.observe(el));
  }

  function initImageHandlers() {
    // ... same as before
    document.addEventListener('error', function(e) {
      if (e.target.tagName === 'IMG' && e.target.closest('.alliance-badge')) {
        e.target.classList.add('img-error');
      }
    }, true);
    
    document.querySelectorAll('.alliance-badge img').forEach(img => {
      if (img.complete && img.naturalWidth === 0) {
        img.classList.add('img-error');
      }
    });
  }

  let mailConfigs = {};
  const DEFAULT_EMAIL = 'info@mediontech.com';

  window.openMail = function(type) {
    const c = mailConfigs[type];
    if (!c) return;
    const subject = encodeURIComponent(c.subject);
    const body = encodeURIComponent(c.body);
    window.location.href = `mailto:${DEFAULT_EMAIL}?subject=${subject}&body=${body}`;
  };

  async function fetchNews(config) {
    const rssUrl = 'https://www.mediontech.com/rss/';
    const rssUrlWithTimestamp = `${rssUrl}?t=${new Date().getTime()}`;
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrlWithTimestamp)}`;
    console.log('Fetching news from:', apiUrl);
    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      if (data.status === 'ok') renderNews(data.items, config);
    } catch (error) {
      console.error('Error fetching news:', error);
      document.getElementById('ticker-content').innerHTML = `<span class="ticker-item">${config.errorMsg}</span>`;
    }
  }

  function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim();
  }

  function renderNews(items, config) {
    if (!items || items.length === 0) return;

    const tickerContainer = document.getElementById('ticker-content');
    const tickerItems = items.slice(0, 10);
    const tickerHtml = tickerItems.map(item => `
      <a href="${item.link}" target="_blank" class="ticker-item">${item.title}</a>
      <span class="ticker-sep">◆</span>
    `).join('');
    tickerContainer.innerHTML = tickerHtml + tickerHtml;

    const featured = items[0];
    const featuredContainer = document.getElementById('featured-news-container');
    if (featuredContainer) {
      const date = new Date(featured.pubDate);
      const dateStr = date.toLocaleDateString(config.locale, { month: 'short', day: 'numeric', year: 'numeric' });
      const categories = featured.categories.length > 0 ? featured.categories.join(' · ') : config.defaultCatFeatured;
      const image = featured.enclosure?.link || featured.thumbnail || '';

      featuredContainer.innerHTML = `
        <div class="news-featured reveal">
          <div class="news-featured-img">
            <img src="${image}" alt="${featured.title}" loading="lazy">
          </div>
          <div class="news-featured-body">
            <div>
              <div class="news-cat">${categories} · ${dateStr}</div>
              <a href="${featured.link}" target="_blank" class="news-featured-title">${featured.title}</a>
              <p class="news-featured-excerpt">${stripHtml(featured.description).slice(0, 260).replace(/\s\S+$/, '') + '…'}</p>
            </div>
            <div class="news-meta">
              <span>${featured.author || 'MediOnTech'}</span>
              <span class="news-meta-dot"></span>
              <span>${config.freeTag}</span>
            </div>
          </div>
        </div>
      `;
    }

    const gridContainer = document.getElementById('news-grid-container');
    if (gridContainer) {
      gridContainer.innerHTML = '';
      items.slice(1, 7).forEach(item => {
        const itemDate = new Date(item.pubDate);
        const itemDateStr = itemDate.toLocaleDateString(config.locale, { month: 'short', day: 'numeric', year: 'numeric' });
        const itemCats = item.categories.length > 0 ? item.categories.join(' · ') : config.defaultCatGrid;
        const itemImg = item.enclosure?.link || item.thumbnail || '';
        gridContainer.insertAdjacentHTML('beforeend', `
          <a href="${item.link}" target="_blank" class="news-card reveal">
            <div class="news-card-img">
              <img src="${itemImg}" alt="${item.title}" loading="lazy">
            </div>
            <div class="news-card-body">
              <div class="news-card-cat">${itemCats}</div>
              <div class="news-card-title">${item.title}</div>
              <div class="news-card-date">${itemDateStr} · ${item.author || 'MediOnTech'}</div>
            </div>
          </a>
        `);
      });
    }

    initReveals();
  }

  // Expose init function
  window.MediOnTech = {
    init: function(config) {
      if (config.mailConfigs) {
        mailConfigs = config.mailConfigs;
      }
      initReveals();
      initImageHandlers();
      fetchNews(config);
    }
  };
})();
