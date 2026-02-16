/* ================================================================
   Main JavaScript — Theme, Navigation, Blog Loader
   ================================================================ */

(function () {
  'use strict';

  // ── Theme Management ──────────────────────────────────────────
  const THEME_KEY = 'tr-portfolio-theme';

  function getPreferredTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);

    // Sync highlight.js theme sheets on post page
    var hljsLight = document.getElementById('hljs-light');
    var hljsDark = document.getElementById('hljs-dark');
    if (hljsLight && hljsDark) {
      hljsLight.disabled = (theme === 'dark');
      hljsDark.disabled = (theme !== 'dark');
    }
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
  }

  // Apply theme immediately to prevent flash
  setTheme(getPreferredTheme());

  // ── DOM Ready ─────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    initThemeToggle();
    initMobileMenu();
    initActiveNav();
    initPageAnimations();

    // Page-specific initializations
    const page = detectPage();
    if (page === 'blogs') initBlogListing();
    if (page === 'post') initPostViewer();
  });

  // ── Theme Toggle ──────────────────────────────────────────────
  function initThemeToggle() {
    const btn = document.getElementById('themeToggle');
    if (btn) btn.addEventListener('click', toggleTheme);
  }

  // ── Mobile Menu ───────────────────────────────────────────────
  function initMobileMenu() {
    const btn = document.querySelector('.mobile-menu-btn');
    const links = document.querySelector('.nav-links');
    if (!btn || !links) return;

    btn.addEventListener('click', function () {
      btn.classList.toggle('active');
      links.classList.toggle('open');
    });

    // Close on nav link click
    links.querySelectorAll('.nav-link').forEach(function (link) {
      link.addEventListener('click', function () {
        btn.classList.remove('active');
        links.classList.remove('open');
      });
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (!btn.contains(e.target) && !links.contains(e.target)) {
        btn.classList.remove('active');
        links.classList.remove('open');
      }
    });
  }

  // ── Active Navigation ─────────────────────────────────────────
  function initActiveNav() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(function (link) {
      const href = link.getAttribute('href');
      if (href === path || (path === '' && href === 'index.html')) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  // ── Page Detection ────────────────────────────────────────────
  function detectPage() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    if (path === 'blogs.html') return 'blogs';
    if (path === 'post.html') return 'post';
    if (path === 'projects.html') return 'projects';
    return 'about';
  }

  // ── Page Animations ───────────────────────────────────────────
  function initPageAnimations() {
    const els = document.querySelectorAll('[data-animate]');
    if (!els.length) return;

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in-up');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    els.forEach(function (el) {
      el.style.opacity = '0';
      observer.observe(el);
    });
  }

  // ── Blog Listing ──────────────────────────────────────────────
  function initBlogListing() {
    const container = document.getElementById('blogContainer');
    const filtersContainer = document.getElementById('blogFilters');
    if (!container) return;

    fetch('posts/posts.json')
      .then(function (res) { return res.json(); })
      .then(function (posts) {
        if (!posts.length) {
          container.innerHTML = '<div class="blog-empty"><div class="blog-empty-icon">📝</div><p>No blog posts yet. Check back soon!</p></div>';
          return;
        }

        // Sort by date descending
        posts.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });

        // Get unique keywords with counts
        var keywordCounts = {};
        posts.forEach(function (p) {
          var kws = p.keywords || [];
          kws.forEach(function (kw) {
            keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
          });
        });
        var keywords = Object.keys(keywordCounts).sort();

        // Build filter buttons
        if (filtersContainer && keywords.length > 0) {
          var filtersHtml = '<button class="filter-btn active" data-filter="all">All <span class="filter-count">' + posts.length + '</span></button>';
          keywords.forEach(function (kw) {
            filtersHtml += '<button class="filter-btn" data-filter="' + escapeHtml(kw) + '">' + escapeHtml(kw) + ' <span class="filter-count">' + keywordCounts[kw] + '</span></button>';
          });
          filtersContainer.innerHTML = filtersHtml;

          filtersContainer.querySelectorAll('.filter-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
              filtersContainer.querySelectorAll('.filter-btn').forEach(function (b) { b.classList.remove('active'); });
              btn.classList.add('active');
              renderBlogPosts(posts, btn.getAttribute('data-filter'), container);
            });
          });
        }

        renderBlogPosts(posts, 'all', container);
      })
      .catch(function (err) {
        console.error('Failed to load posts:', err);
        container.innerHTML = '<div class="blog-empty"><div class="blog-empty-icon">⚠️</div><p>Failed to load posts. Please try again later.</p></div>';
      });
  }

  function renderBlogPosts(posts, filter, container) {
    var filtered = filter === 'all' ? posts : posts.filter(function (p) {
      var kws = p.keywords || [];
      return kws.indexOf(filter) !== -1;
    });

    if (!filtered.length) {
      container.innerHTML = '<div class="blog-empty"><div class="blog-empty-icon">📭</div><p>No posts with this keyword yet.</p></div>';
      return;
    }

    var html = '<div class="blog-cards">';
    filtered.forEach(function (post) {
      html += '<a href="post.html?id=' + encodeURIComponent(post.id) + '" class="blog-card">';
      html += '<div class="blog-card-date">' + formatDate(post.date) + '</div>';
      html += '<div class="blog-card-title">' + escapeHtml(post.title) + '</div>';
      if (post.description) {
        html += '<div class="blog-card-desc">' + escapeHtml(post.description) + '</div>';
      }
      var kws = post.keywords || [];
      if (kws.length) {
        html += '<div class="blog-card-keywords">';
        kws.forEach(function (kw) {
          html += '<span class="blog-card-context">' + escapeHtml(kw) + '</span>';
        });
        html += '</div>';
      }
      html += '</a>';
    });
    html += '</div>';

    container.innerHTML = html;
  }

  // ── Post Viewer ───────────────────────────────────────────────
  function initPostViewer() {
    var params = new URLSearchParams(window.location.search);
    var postId = params.get('id');

    var titleEl = document.getElementById('postTitle');
    var metaEl = document.getElementById('postMeta');
    var bodyEl = document.getElementById('postBody');
    var headerEl = document.getElementById('postHeader');

    if (!postId || !bodyEl) {
      if (bodyEl) bodyEl.innerHTML = '<div class="blog-empty"><div class="blog-empty-icon">🔍</div><p>Post not found.</p></div>';
      return;
    }

    // Show loading
    bodyEl.innerHTML = '<div class="loading"><div class="loading-spinner"></div></div>';

    fetch('posts/posts.json')
      .then(function (res) { return res.json(); })
      .then(function (posts) {
        var post = posts.find(function (p) { return p.id === postId; });
        if (!post) throw new Error('Post not found');

        // Set page title
        document.title = post.title + ' — Talha Rehman';

        // Render header
        if (titleEl) titleEl.textContent = post.title;
        if (metaEl) {
          var metaHtml = '<span>' + formatDate(post.date) + '</span>';
          var kws = post.keywords || [];
          if (kws.length) {
            metaHtml += '<span class="post-meta-divider"></span>';
            kws.forEach(function (kw) {
              metaHtml += '<span class="post-context-badge">' + escapeHtml(kw) + '</span> ';
            });
          }
          metaEl.innerHTML = metaHtml;
        }

        // Fetch post content
        return fetch('posts/' + post.file);
      })
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to load post content');
        return res.text();
      })
      .then(function (html) {
        bodyEl.innerHTML = html;

        // Initialize syntax highlighting
        if (window.hljs) {
          bodyEl.querySelectorAll('pre code').forEach(function (block) {
            window.hljs.highlightElement(block);
          });
        }

        // Initialize KaTeX auto-render
        if (window.renderMathInElement) {
          window.renderMathInElement(bodyEl, {
            delimiters: [
              { left: '$$', right: '$$', display: true },
              { left: '$', right: '$', display: false },
              { left: '\\(', right: '\\)', display: false },
              { left: '\\[', right: '\\]', display: true }
            ],
            throwOnError: false
          });
        }
      })
      .catch(function (err) {
        console.error('Post load error:', err);
        bodyEl.innerHTML = '<div class="blog-empty"><div class="blog-empty-icon">⚠️</div><p>Failed to load post. Please try again later.</p></div>';
      });
  }

  // ── Utilities ─────────────────────────────────────────────────
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatDate(dateStr) {
    var d = new Date(dateStr + 'T00:00:00');
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  }

})();
