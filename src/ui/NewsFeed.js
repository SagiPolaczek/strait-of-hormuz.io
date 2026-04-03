const RSS_URL = 'https://news.google.com/rss/search?q=%22strait+of+hormuz%22&hl=en-US&gl=US&ceid=US:en';
const PROXY_URL = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(RSS_URL)}`;
const CACHE_KEY = 'hormuz_news_cache';
const MAX_ITEMS = 8;

/** Escape HTML to prevent injection */
function esc(str) {
  const el = document.createElement('span');
  el.textContent = String(str);
  return el.innerHTML;
}

/** Format date as "2d ago", "5h ago", etc. */
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export class NewsFeed {
  constructor() {
    this._items = null;
    this._error = false;
    this._fetchNews();
  }

  _fetchNews() {
    // Check sessionStorage cache first
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        this._items = JSON.parse(cached);
        return;
      } catch { /* ignore bad cache */ }
    }

    fetch(PROXY_URL)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'ok' && data.items?.length) {
          this._items = data.items.slice(0, MAX_ITEMS).map(item => ({
            title: item.title,
            link: item.link,
            date: item.pubDate,
            source: item.author || extractSource(item.title),
          }));
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(this._items));
        } else {
          this._error = true;
        }
        this._rerender();
      })
      .catch(() => {
        this._error = true;
        this._rerender();
      });
  }

  _rerender() {
    const container = document.getElementById('news-feed-container');
    if (container) this.render(container);
  }

  render(container) {
    if (!container) return;

    // Curated awareness header (always shown)
    let html = `
      <div style="margin-bottom: 14px;">
        <div style="font-size: 10px; color: #ffb300; letter-spacing: 2px; margin-bottom: 8px;">◆ STRAIT OF HORMUZ</div>
        <div style="font-size: 12px; color: #90CAF9; line-height: 1.6; margin-bottom: 10px;">
          One of the world's most critical chokepoints. ~21% of global oil passes through daily.
        </div>
      </div>
    `;

    // Live news section
    html += `<div style="font-size: 10px; color: #33ff66; letter-spacing: 2px; margin-bottom: 8px; animation: slow-blink 2.5s ease-in-out infinite;">◆ LIVE INTEL</div>`;

    if (this._items) {
      this._items.forEach(item => {
        const ago = timeAgo(item.date);
        html += `
          <a href="${esc(item.link)}" target="_blank" rel="noopener" style="
            display: block; text-decoration: none; padding: 8px 0;
            border-bottom: 1px solid rgba(51, 255, 102, 0.08);
          ">
            <div style="font-size: 12px; color: #cfd8dc; line-height: 1.4; margin-bottom: 3px;">
              ${esc(item.title)}
            </div>
            <div style="font-size: 10px; color: #555; display: flex; justify-content: space-between;">
              <span>${esc(item.source)}</span>
              <span>${esc(ago)}</span>
            </div>
          </a>
        `;
      });
    } else if (this._error) {
      html += `<div style="font-size: 11px; color: #555; text-align: center; padding: 12px 0;">
        Signal lost — intel unavailable
      </div>`;
    } else {
      html += `<div style="font-size: 11px; color: #555; text-align: center; padding: 12px 0;">
        <span style="animation: blink 1s step-end infinite;">Decrypting feed...</span>
      </div>`;
    }

    container.innerHTML = html;
  }
}

/** Extract source name from Google News title format "Headline - Source" */
function extractSource(title) {
  const parts = title.split(' - ');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}
