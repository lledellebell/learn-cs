/* =========================================
   Learn CS - Main JavaScript
   ========================================= */

(function() {
  'use strict';

  // =========================================
  // Theme Toggle (Dark Mode)
  // =========================================
  const initTheme = () => {
    const themeToggle = document.getElementById('themeToggle');
    const html = document.documentElement;

    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    html.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
      });
    }
  };

  const updateThemeIcon = (theme) => {
    const icon = document.querySelector('#themeToggle i');
    if (icon) {
      icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
  };

  // =========================================
  // Mobile Navigation
  // =========================================
  const initMobileNav = () => {
    const navbarToggle = document.getElementById('navbarToggle');
    const navbarMenu = document.getElementById('navbarMenu');
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');

    if (navbarToggle && navbarMenu) {
      navbarToggle.addEventListener('click', () => {
        navbarMenu.classList.toggle('active');
        navbarToggle.classList.toggle('active');
      });

      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!navbarToggle.contains(e.target) && !navbarMenu.contains(e.target)) {
          navbarMenu.classList.remove('active');
          navbarToggle.classList.remove('active');
        }
      });
    }

    // Mobile dropdown toggles
    dropdownToggles.forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
          e.preventDefault();
          const dropdown = toggle.closest('.nav-dropdown');
          dropdown.classList.toggle('active');
        }
      });
    });
  };

  // =========================================
  // Table of Contents Generation
  // =========================================
  const generateTOC = () => {
    const articleBody = document.querySelector('.article-body');
    const tocContent = document.getElementById('toc-content');
    const mobileTocContent = document.getElementById('mobileTocContent');

    if (!articleBody || (!tocContent && !mobileTocContent)) return;

    const headings = articleBody.querySelectorAll('h1, h2, h3, h4');
    if (headings.length === 0) {
      // Hide TOC if no headings
      const toc = document.getElementById('toc');
      if (toc) toc.style.display = 'none';
      return;
    }

    const tocHTML = generateTOCHTML(headings);

    if (tocContent) {
      tocContent.innerHTML = tocHTML;
    }
    if (mobileTocContent) {
      mobileTocContent.innerHTML = tocHTML;
    }

    // Add smooth scrolling and active state
    addTOCBehavior(headings);
  };

  const generateTOCHTML = (headings) => {
    let tocHTML = '<ul>';
    let currentLevel = 1;

    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      const id = heading.id || `heading-${index}`;
      const text = heading.textContent;

      // Add ID if not present
      if (!heading.id) {
        heading.id = id;
      }

      // Handle nesting
      if (level > currentLevel) {
        tocHTML += '<ul>'.repeat(level - currentLevel);
      } else if (level < currentLevel) {
        tocHTML += '</ul>'.repeat(currentLevel - level);
      }

      tocHTML += `<li><a href="#${id}" class="toc-link">${text}</a></li>`;
      currentLevel = level;
    });

    tocHTML += '</ul>'.repeat(currentLevel - 1);
    return tocHTML;
  };

  const addTOCBehavior = (headings) => {
    const tocLinks = document.querySelectorAll('.toc-link');

    // Smooth scroll
    tocLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        const target = document.getElementById(targetId);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    // Highlight active section
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          tocLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${entry.target.id}`) {
              link.classList.add('active');
            }
          });
        }
      });
    }, { rootMargin: '-100px 0px -80% 0px' });

    headings.forEach(heading => observer.observe(heading));
  };

  // =========================================
  // Search Functionality
  // =========================================
  const initSearch = () => {
    const searchToggle = document.getElementById('searchToggle');
    const searchBox = document.getElementById('searchBox');
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');

    if (!searchToggle || !searchBox) return;

    searchToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      searchBox.classList.toggle('active');
      if (searchBox.classList.contains('active')) {
        searchInput.focus();
      }
    });

    // Close search when clicking outside
    document.addEventListener('click', (e) => {
      if (!searchBox.contains(e.target) && !searchToggle.contains(e.target)) {
        searchBox.classList.remove('active');
      }
    });

    // Search as you type
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      const query = e.target.value.trim();

      if (query.length < 2) {
        searchResults.innerHTML = '';
        return;
      }

      searchTimeout = setTimeout(() => {
        performSearch(query);
      }, 300);
    });
  };

  const performSearch = async (query) => {
    const searchResults = document.getElementById('searchResults');

    try {
      // Simple client-side search through page links
      // In a real implementation, you'd use a search index or API
      const links = Array.from(document.querySelectorAll('.sidebar-link, .category-link'));
      const results = links.filter(link => {
        const text = link.textContent.toLowerCase();
        return text.includes(query.toLowerCase());
      }).slice(0, 10);

      if (results.length === 0) {
        searchResults.innerHTML = '<div class="search-result-item">검색 결과가 없습니다.</div>';
        return;
      }

      const resultsHTML = results.map(link => {
        const title = link.textContent.trim();
        const url = link.getAttribute('href');
        return `
          <div class="search-result-item">
            <a href="${url}" style="display: block; color: inherit; text-decoration: none;">
              <div style="font-weight: 600; margin-bottom: 4px;">${title}</div>
              <div style="font-size: 0.875rem; color: var(--color-text-tertiary);">${url}</div>
            </a>
          </div>
        `;
      }).join('');

      searchResults.innerHTML = resultsHTML;
    } catch (error) {
      console.error('Search error:', error);
      searchResults.innerHTML = '<div class="search-result-item">검색 중 오류가 발생했습니다.</div>';
    }
  };

  // =========================================
  // Code Copy Button
  // =========================================
  const initCodeCopy = () => {
    const codeBlocks = document.querySelectorAll('.article-body pre');

    codeBlocks.forEach(block => {
      const button = document.createElement('button');
      button.className = 'code-copy-btn';
      button.innerHTML = '<i class="fas fa-copy"></i>';
      button.title = '코드 복사';

      button.addEventListener('click', async () => {
        const code = block.querySelector('code')?.textContent || block.textContent;

        try {
          await navigator.clipboard.writeText(code);
          button.innerHTML = '<i class="fas fa-check"></i>';
          button.style.color = 'var(--color-success)';

          setTimeout(() => {
            button.innerHTML = '<i class="fas fa-copy"></i>';
            button.style.color = '';
          }, 2000);
        } catch (error) {
          console.error('Copy failed:', error);
          button.innerHTML = '<i class="fas fa-times"></i>';
          button.style.color = 'var(--color-danger)';

          setTimeout(() => {
            button.innerHTML = '<i class="fas fa-copy"></i>';
            button.style.color = '';
          }, 2000);
        }
      });

      block.style.position = 'relative';
      block.appendChild(button);
    });

    // Add CSS for copy button
    const style = document.createElement('style');
    style.textContent = `
      .code-copy-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        padding: 6px 10px;
        background-color: var(--color-bg-tertiary);
        color: var(--color-text-secondary);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        cursor: pointer;
        font-size: 0.875rem;
        opacity: 0;
        transition: all var(--transition-fast);
      }

      .article-body pre:hover .code-copy-btn {
        opacity: 1;
      }

      .code-copy-btn:hover {
        background-color: var(--color-bg);
        color: var(--color-text);
      }

      .code-copy-btn:active {
        transform: scale(0.95);
      }
    `;
    document.head.appendChild(style);
  };

  // =========================================
  // Back to Top Button
  // =========================================
  const initBackToTop = () => {
    const backToTopBtn = document.getElementById('backToTop');

    if (backToTopBtn) {
      backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Show/hide based on scroll position
    window.addEventListener('scroll', () => {
      if (backToTopBtn) {
        if (window.scrollY > 500) {
          backToTopBtn.style.opacity = '1';
          backToTopBtn.style.pointerEvents = 'auto';
        } else {
          backToTopBtn.style.opacity = '0';
          backToTopBtn.style.pointerEvents = 'none';
        }
      }
    });
  };

  // =========================================
  // External Links
  // =========================================
  const markExternalLinks = () => {
    const links = document.querySelectorAll('.article-body a[href^="http"]');
    links.forEach(link => {
      if (!link.hostname.includes(window.location.hostname)) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
        link.innerHTML += ' <i class="fas fa-external-link-alt" style="font-size: 0.75em; margin-left: 0.25em;"></i>';
      }
    });
  };

  // =========================================
  // Image Zoom
  // =========================================
  const initImageZoom = () => {
    const images = document.querySelectorAll('.article-body img');

    images.forEach(img => {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', () => {
        const modal = createImageModal(img.src, img.alt);
        document.body.appendChild(modal);

        setTimeout(() => modal.classList.add('active'), 10);

        modal.addEventListener('click', () => {
          modal.classList.remove('active');
          setTimeout(() => modal.remove(), 300);
        });
      });
    });
  };

  const createImageModal = (src, alt) => {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      cursor: zoom-out;
      opacity: 0;
      transition: opacity 300ms ease;
    `;

    const img = document.createElement('img');
    img.src = src;
    img.alt = alt;
    img.style.cssText = `
      max-width: 90%;
      max-height: 90%;
      object-fit: contain;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    `;

    modal.appendChild(img);
    modal.classList.add('image-modal');
    modal.style.opacity = '0';

    return modal;
  };

  // Add CSS for active modal
  const addModalStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
      .image-modal.active {
        opacity: 1 !important;
      }
    `;
    document.head.appendChild(style);
  };

  // =========================================
  // Reading Progress Bar
  // =========================================
  const initReadingProgress = () => {
    const article = document.querySelector('.article-body');
    if (!article) return;

    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
      position: fixed;
      top: var(--header-height);
      left: 0;
      width: 0%;
      height: 3px;
      background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
      z-index: 999;
      transition: width 100ms ease;
    `;
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      const scrolled = window.scrollY;
      const progress = (scrolled / documentHeight) * 100;

      progressBar.style.width = `${Math.min(progress, 100)}%`;
    });
  };

  // =========================================
  // Keyboard Shortcuts
  // =========================================
  const initKeyboardShortcuts = () => {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + K: Open search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchToggle = document.getElementById('searchToggle');
        if (searchToggle) searchToggle.click();
      }

      // Ctrl/Cmd + D: Toggle dark mode
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) themeToggle.click();
      }

      // Escape: Close search
      if (e.key === 'Escape') {
        const searchBox = document.getElementById('searchBox');
        if (searchBox) searchBox.classList.remove('active');
      }
    });
  };

  // =========================================
  // Initialize Everything
  // =========================================
  const init = () => {
    initTheme();
    initMobileNav();
    generateTOC();
    initSearch();
    initCodeCopy();
    initBackToTop();
    markExternalLinks();
    initImageZoom();
    addModalStyles();
    initReadingProgress();
    initKeyboardShortcuts();

    console.log('Learn CS: All features initialized ✅');
  };

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
