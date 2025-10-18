/* =========================================
   Learn CS
   ========================================= */

(function() {
  'use strict';

  // =========================================
  // 설정
  // =========================================
  const CONFIG = {
    DEBUG: false, // 디버그 모드
    MOBILE_BREAKPOINT: 768,
    SCROLL_THRESHOLD: 300,
    READING_SPEED_WPM: 200,
    DEBOUNCE_DELAY: 500,
    CAROUSEL_DURATION: 30000
  };

  // =========================================
  // 유틸리티 함수
  // =========================================
  const utils = {
    /**
     * 디버그 로그 출력
     */
    log: (...args) => {
      if (CONFIG.DEBUG) {
        console.log('[Learn CS]', ...args);
      }
    },

    /**
     * 모바일 여부 확인
     */
    isMobile: () => window.innerWidth <= CONFIG.MOBILE_BREAKPOINT,

    /**
     * 요소가 존재하는지 확인
     */
    exists: (selector) => document.querySelector(selector) !== null,

    /**
     * 여러 요소가 모두 존재하는지 확인
     */
    allExist: (...selectors) => selectors.every(utils.exists),

    /**
     * 모달 닫기 헬퍼
     */
    createModalCloser: (modal, triggerBtn) => {
      return () => {
        modal.classList.remove('flex');
        modal.setAttribute('aria-hidden', 'true');
        triggerBtn?.focus();
      };
    }
  };

  // =========================================
  // 테마 관리
  // =========================================
  const theme = {
    icons: {
      light: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />',
      dark: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />'
    },

    updateIcon(toggle, currentTheme) {
      const svg = toggle.querySelector('svg');
      if (!svg) return;

      const ariaLabel = currentTheme === 'dark' ? 'Light mode로 전환' : 'Dark mode로 전환';
      toggle.setAttribute('aria-label', ariaLabel);
      svg.innerHTML = currentTheme === 'dark' ? this.icons.dark : this.icons.light;
    },

    init() {
      const toggle = document.getElementById('themeToggle');
      if (!toggle) return;

      const html = document.documentElement;
      const savedTheme = localStorage.getItem('theme') || 'light';

      html.setAttribute('data-theme', savedTheme);
      this.updateIcon(toggle, savedTheme);

      toggle.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateIcon(toggle, newTheme);
      });

      utils.log('Theme initialized:', savedTheme);
    }
  };

  // =========================================
  // 모바일 네비게이션
  // =========================================
  const mobileNav = {
    toggle(menuToggle, navList, state) {
      menuToggle.setAttribute('aria-expanded', state);
      navList.setAttribute('aria-hidden', !state);
    },

    init() {
      const menuToggle = document.getElementById('menuToggle');
      const navList = document.getElementById('navList');

      if (!menuToggle || !navList) return;

      menuToggle.addEventListener('click', () => {
        const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
        this.toggle(menuToggle, navList, !isExpanded);
      });

      // 외부 클릭 시 닫기
      document.addEventListener('click', (e) => {
        if (!menuToggle.contains(e.target) && !navList.contains(e.target)) {
          this.toggle(menuToggle, navList, false);
        }
      });

      // Escape 키로 닫기
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.toggle(menuToggle, navList, false);
        }
      });

      utils.log('Mobile navigation initialized');
    }
  };

  // =========================================
  // 목차 (Table of Contents)
  // =========================================
  const toc = {
    generateHTML(headings) {
      return Array.from(headings).map((heading, index) => {
        const level = parseInt(heading.tagName.charAt(1));
        const id = heading.id || `heading-${index}`;
        const text = heading.textContent;

        if (!heading.id) heading.id = id;

        const indent = level === 2 ? '' : level === 3 ? 'padding-left: 1rem;' : 'padding-left: 2rem;';
        return `<li style="${indent}"><a href="#${id}" data-target="${id}">${text}</a></li>`;
      }).join('');
    },

    attachClickHandlers(tocList) {
      tocList.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const targetId = link.getAttribute('href').substring(1);
          const target = document.getElementById(targetId);

          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            target.focus();

            // 모바일에서 목차 닫기
            if (utils.isMobile()) {
              const tocToggle = document.getElementById('tocToggle');
              const tocContainer = document.getElementById('toc');
              if (tocToggle && tocContainer) {
                tocContainer.classList.remove('expanded');
                tocToggle.setAttribute('aria-expanded', 'false');
              }
            }
          }
        });
      });
    },

    initHighlight(headings) {
      const tocLinks = document.querySelectorAll('#tocList a');
      const readSections = new Set();

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const id = entry.target.id;
          const tocLink = document.querySelector(`#tocList a[data-target="${id}"]`);
          const tocItem = tocLink?.closest('li');

          if (tocLink && entry.isIntersecting) {
            readSections.add(id);
            tocLinks.forEach(link => link.classList.remove('active'));
            tocLink.classList.add('active');

            if (!utils.isMobile() && tocItem) {
              tocItem.classList.add('read');
            }
          }
        });
      }, {
        rootMargin: '-100px 0px -66%',
        threshold: 0
      });

      headings.forEach(heading => observer.observe(heading));
    },

    initMobileToggle() {
      const tocToggle = document.getElementById('tocToggle');
      const tocContainer = document.getElementById('toc');

      if (!tocToggle || !tocContainer) return;

      tocToggle.addEventListener('click', () => {
        const isExpanded = tocToggle.getAttribute('aria-expanded') === 'true';
        tocToggle.setAttribute('aria-expanded', !isExpanded);
        tocContainer.classList.toggle('expanded', !isExpanded);
      });

      document.addEventListener('click', (e) => {
        if (utils.isMobile() && !tocContainer.contains(e.target) && tocContainer.classList.contains('expanded')) {
          tocContainer.classList.remove('expanded');
          tocToggle.setAttribute('aria-expanded', 'false');
        }
      });
    },

    init() {
      const articleBody = document.querySelector('.article-body');
      const tocList = document.getElementById('tocList');
      const tocContainer = document.getElementById('toc');

      if (!articleBody || !tocList) return;

      const headings = articleBody.querySelectorAll('h2, h3, h4');

      if (headings.length === 0) {
        if (tocContainer) tocContainer.style.display = 'none';
        return;
      }

      tocList.innerHTML = this.generateHTML(headings);
      this.attachClickHandlers(tocList);
      this.initHighlight(headings);
      this.initMobileToggle();

      utils.log('TOC initialized with', headings.length, 'headings');
    }
  };

  // =========================================
  // 코드 블록
  // =========================================
  const codeBlocks = {
    detectLanguage(block) {
      const codeElement = block.querySelector('code');
      if (codeElement) {
        for (const className of codeElement.classList) {
          if (className.startsWith('language-')) {
            return className.replace('language-', '');
          }
        }
      }

      let parent = block.parentElement;
      while (parent && parent !== document.body) {
        for (const className of parent.classList) {
          if (className.startsWith('language-')) {
            return className.replace('language-', '');
          }
        }
        parent = parent.parentElement;
      }

      for (const className of block.classList) {
        if (className.startsWith('language-')) {
          return className.replace('language-', '');
        }
      }

      return 'code';
    },

    initLanguageLabels() {
      const blocks = document.querySelectorAll('.article-body pre');
      blocks.forEach(block => {
        block.setAttribute('data-language', this.detectLanguage(block));
      });
      utils.log('Language labels initialized for', blocks.length, 'code blocks');
    },

    async copyToClipboard(text) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (error) {
        utils.log('Copy failed:', error);
        return false;
      }
    },

    initCopyButtons() {
      const blocks = document.querySelectorAll('.article-body pre');

      blocks.forEach(block => {
        const button = document.createElement('button');
        button.className = 'code-copy-btn';
        button.textContent = 'Copy';
        button.setAttribute('type', 'button');
        button.setAttribute('aria-label', '코드를 클립보드에 복사');

        button.addEventListener('click', async () => {
          const code = block.querySelector('code')?.textContent || block.textContent;
          const watermark = `\n\n// 출처: ${document.title}\n// ${window.location.href}`;
          const success = await this.copyToClipboard(code + watermark);

          button.textContent = success ? 'Copied!' : 'Failed';
          button.setAttribute('aria-label', success ? '코드가 클립보드에 복사됨' : '복사 실패');

          setTimeout(() => {
            button.textContent = 'Copy';
            button.setAttribute('aria-label', '코드를 클립보드에 복사');
          }, 2000);
        });

        block.appendChild(button);
      });

      utils.log('Copy buttons initialized for', blocks.length, 'code blocks');
    },

    init() {
      this.initLanguageLabels();
      this.initCopyButtons();
    }
  };

  // =========================================
  // 링크 처리
  // =========================================
  const links = {
    markExternal() {
      const externalLinks = document.querySelectorAll('.article-body a[href^="http"]');

      externalLinks.forEach(link => {
        try {
          const url = new URL(link.href);
          if (url.hostname !== window.location.hostname) {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');

            const srText = document.createElement('span');
            srText.className = 'visually-hidden';
            srText.textContent = ' (새 창에서 열림)';
            link.appendChild(srText);
          }
        } catch (e) {
          utils.log('Invalid URL:', link.href);
        }
      });

      utils.log('Marked', externalLinks.length, 'external links');
    },

    init() {
      this.markExternal();
    }
  };

  // =========================================
  // 복사 워터마크
  // =========================================
  const copyWatermark = {
    init() {
      document.addEventListener('copy', (e) => {
        const selection = window.getSelection();
        const selectedText = selection.toString();

        if (!selectedText || selectedText.length < 10) return;

        const watermark = `\n\n━━━━━━━━━━━━━━━━━━━━━━\n출처: ${document.title}\n${window.location.href}`;
        e.preventDefault();
        e.clipboardData.setData('text/plain', selectedText + watermark);
      });

      utils.log('Copy watermark initialized');
    }
  };

  // =========================================
  // 키보드 단축키
  // =========================================
  const shortcuts = {
    handlers: {
      'd': () => document.getElementById('themeToggle')?.click(),
      'm': () => document.getElementById('menuToggle')?.click()
    },

    init() {
      document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && this.handlers[e.key]) {
          e.preventDefault();
          this.handlers[e.key]();
        }
      });

      utils.log('Keyboard shortcuts initialized');
    }
  };

  // =========================================
  // 읽기 시간 계산
  // =========================================
  const readingTime = {
    calculate() {
      const element = document.getElementById('readingTimeText');
      const articleBody = document.querySelector('.article-body');

      if (!element || !articleBody) return;

      const text = articleBody.textContent || '';
      const wordCount = text.trim().split(/\s+/).length;
      const minutes = Math.ceil(wordCount / CONFIG.READING_SPEED_WPM);

      element.textContent = `${minutes}분 읽기`;
      utils.log('Reading time:', minutes, 'minutes');
    },

    init() {
      this.calculate();
    }
  };

  // =========================================
  // 인쇄 기능
  // =========================================
  const print = {
    init() {
      const printBtn = document.getElementById('printBtn');
      if (!printBtn) return;

      printBtn.addEventListener('click', () => window.print());
      utils.log('Print button initialized');
    }
  };

  // =========================================
  // 공유 기능
  // =========================================
  const share = {
    platforms: {
      twitter: (url, title) => `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
      linkedin: (url) => `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      facebook: (url) => `https://www.facebook.com/sharer/sharer.php?u=${url}`
    },

    openWindow(url) {
      window.open(url, '_blank', 'width=550,height=420');
    },

    async copyLink(option) {
      try {
        await navigator.clipboard.writeText(window.location.href);
        const originalHTML = option.innerHTML;
        option.innerHTML = '<svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/></svg> 복사됨!';
        setTimeout(() => option.innerHTML = originalHTML, 2000);
      } catch (err) {
        utils.log('Link copy failed:', err);
      }
    },

    handleShare(type, closeModal, target) {
      const url = encodeURIComponent(window.location.href);
      const title = encodeURIComponent(document.title);

      if (type === 'copy') {
        this.copyLink(target);
      } else if (this.platforms[type]) {
        this.openWindow(this.platforms[type](url, title));
        closeModal();
      }
    },

    init() {
      const shareBtn = document.getElementById('shareBtn');
      const modal = document.getElementById('shareModal');
      const closeBtn = modal?.querySelector('.modal-close');
      const shareOptions = document.querySelectorAll('.share-option');

      if (!shareBtn || !modal) return;

      const closeModal = utils.createModalCloser(modal, shareBtn);

      shareBtn.addEventListener('click', () => {
        modal.classList.add('flex');
        modal.setAttribute('aria-hidden', 'false');
        modal.querySelector('.share-option')?.focus();
      });

      closeBtn?.addEventListener('click', closeModal);
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'block') {
          closeModal();
        }
      });

      shareOptions.forEach(option => {
        option.addEventListener('click', (e) => {
          const type = option.getAttribute('data-share');
          this.handleShare(type, closeModal, e.target);
        });
      });

      utils.log('Share initialized');
    }
  };

  // =========================================
  // 북마크
  // =========================================
  const bookmark = {
    icons: {
      filled: '<path fill-rule="evenodd" d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.74.439L8 13.069l-5.26 2.87A.5.5 0 0 1 2 15.5V2z"/>',
      outline: '<path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.777.416L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5V2zm2-1a1 1 0 0 0-1 1v12.566l4.723-2.482a.5.5 0 0 1 .554 0L13 14.566V2a1 1 0 0 0-1-1H4z"/>'
    },

    getBookmarks() {
      return JSON.parse(localStorage.getItem('bookmarks') || '{}');
    },

    saveBookmarks(bookmarks) {
      localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    },

    updateUI(bookmarkBtn, bookmarkIcon, bookmarkText, pageUrl, bookmarks) {
      const isBookmarked = !!bookmarks[pageUrl];
      bookmarkIcon.innerHTML = isBookmarked ? this.icons.filled : this.icons.outline;
      bookmarkText.textContent = isBookmarked ? '북마크됨' : '북마크';
      bookmarkBtn.setAttribute('aria-pressed', isBookmarked);
    },

    init() {
      const bookmarkBtn = document.getElementById('bookmarkBtn');
      const bookmarkIcon = document.getElementById('bookmarkIcon');
      const bookmarkText = document.getElementById('bookmarkText');

      if (!bookmarkBtn) return;

      const pageUrl = window.location.pathname;
      const bookmarks = this.getBookmarks();

      this.updateUI(bookmarkBtn, bookmarkIcon, bookmarkText, pageUrl, bookmarks);

      bookmarkBtn.addEventListener('click', () => {
        if (bookmarks[pageUrl]) {
          delete bookmarks[pageUrl];
        } else {
          bookmarks[pageUrl] = {
            title: document.title,
            timestamp: new Date().toISOString(),
            scrollPosition: window.scrollY
          };
        }
        this.saveBookmarks(bookmarks);
        this.updateUI(bookmarkBtn, bookmarkIcon, bookmarkText, pageUrl, bookmarks);
      });

      // 스크롤 위치 저장 (디바운스)
      let scrollTimeout;
      window.addEventListener('scroll', () => {
        if (bookmarks[pageUrl]) {
          clearTimeout(scrollTimeout);
          scrollTimeout = setTimeout(() => {
            bookmarks[pageUrl].scrollPosition = window.scrollY;
            this.saveBookmarks(bookmarks);
          }, CONFIG.DEBOUNCE_DELAY);
        }
      });

      // 페이지 로드 시 스크롤 위치 복원
      if (bookmarks[pageUrl]?.scrollPosition) {
        window.scrollTo(0, bookmarks[pageUrl].scrollPosition);
      }

      utils.log('Bookmark initialized');
    }
  };

  // =========================================
  // 읽기 진행률
  // =========================================
  const readingProgress = {
    update(progressBar) {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      const scrolled = window.scrollY;
      const progress = (scrolled / documentHeight) * 100;

      progressBar.style.width = `${Math.min(progress, 100)}%`;
    },

    init() {
      const progressBar = document.getElementById('readingProgress');
      if (!progressBar) return;

      window.addEventListener('scroll', () => this.update(progressBar));
      this.update(progressBar);

      utils.log('Reading progress initialized');
    }
  };

  // =========================================
  // 문서 수정
  // =========================================
  const edit = {
    createIssueUrl(pageTitle, pagePath, pageUrl) {
      const issueTitle = encodeURIComponent(`[문서 수정] ${pageTitle}`);
      const issueBody = encodeURIComponent(`## 수정 대상 문서
**문서 제목:** ${pageTitle}
**문서 경로:** \`${pagePath}\`
**문서 URL:** ${pageUrl}

## 수정 유형
<!-- 해당하는 항목에 [x]를 표시해주세요 -->
- [ ] 오타/맞춤법 수정
- [ ] 기술적 오류 수정
- [ ] 내용 추가/보완
- [ ] 예제 코드 개선
- [ ] 링크 수정
- [ ] 기타

## 현재 내용
<!-- 수정이 필요한 현재 내용을 적어주세요 -->
\`\`\`
수정 전 내용을 여기에 붙여넣으세요
\`\`\`

## 제안하는 수정 내용
<!-- 어떻게 수정하면 좋을지 구체적으로 적어주세요 -->
\`\`\`
수정 후 내용을 여기에 작성해주세요
\`\`\`

## 수정 이유
<!-- 왜 이런 수정이 필요한지 설명해주세요 -->


## 추가 정보
<!-- 참고 링크나 추가 설명이 있다면 작성해주세요 -->
`);
      return `https://github.com/lledellebell/learn-cs/issues/new?title=${issueTitle}&body=${issueBody}&labels=documentation,content-suggestion`;
    },

    init() {
      const editBtn = document.getElementById('editBtn');
      if (!editBtn) return;

      const environment = editBtn.getAttribute('data-env') || 'development';
      const pageTitle = editBtn.getAttribute('data-page-title');
      const pagePath = editBtn.getAttribute('data-page-path');
      const pageUrl = editBtn.getAttribute('data-page-url');

      const issueUrl = this.createIssueUrl(pageTitle, pagePath, pageUrl);

      // 프로덕션: 바로 이슈 페이지로
      if (environment === 'production') {
        editBtn.addEventListener('click', () => window.open(issueUrl, '_blank'));
        return;
      }

      // 개발: 모달 표시
      const editModal = document.getElementById('editModal');
      if (!editModal) return;

      const closeBtn = editModal.querySelector('.modal-close');
      const suggestEditBtn = document.getElementById('suggestEdit');
      const directEditBtn = document.getElementById('directEdit');

      const closeModal = utils.createModalCloser(editModal, editBtn);

      editBtn.addEventListener('click', () => {
        editModal.classList.add('flex');
        editModal.setAttribute('aria-hidden', 'false');
        suggestEditBtn?.focus();
      });

      closeBtn?.addEventListener('click', closeModal);
      editModal.addEventListener('click', (e) => {
        if (e.target === editModal) closeModal();
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && editModal.classList.contains('flex')) {
          closeModal();
        }
      });

      suggestEditBtn?.addEventListener('click', () => {
        window.open(issueUrl, '_blank');
        closeModal();
      });

      directEditBtn?.addEventListener('click', () => {
        const editUrl = `https://github.com/lledellebell/learn-cs/edit/master/${pagePath}`;
        window.open(editUrl, '_blank');
        closeModal();
      });

      utils.log('Edit initialized');
    }
  };

  // =========================================
  // Hero Canvas
  // =========================================
  const heroCanvas = {
    Particle: class {
      constructor(x, y, delay) {
        this.x = x;
        this.y = y;
        this.baseX = x;
        this.baseY = y;
        this.size = 2;
        this.density = (Math.random() * 30) + 10;
        this.opacity = 0;
        this.scale = 0;
        this.delay = delay;
        this.animationProgress = 0;
        this.initialOffsetX = (Math.random() - 0.5) * 100;
        this.initialOffsetY = (Math.random() - 0.5) * 100;
      }

      easeOutBack(t) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
      }

      easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
      }

      draw(ctx, mouse) {
        if (this.animationProgress < 1) {
          this.animationProgress += 0.015;
          const progress = Math.max(0, this.animationProgress - this.delay);
          const eased = this.easeOutBack(progress);
          this.opacity = Math.min(1, eased);
          this.scale = eased;

          const positionEased = this.easeOutCubic(progress);
          this.x = this.baseX + this.initialOffsetX * (1 - positionEased);
          this.y = this.baseY + this.initialOffsetY * (1 - positionEased);
        } else {
          this.x = this.baseX;
          this.y = this.baseY;
        }

        const theme = document.documentElement.getAttribute('data-theme');
        const baseOpacity = theme === 'dark' ? 0.15 : 0.08;
        let color = theme === 'dark' ? 'rgba(255, 255, 255, ' : 'rgba(0, 0, 0, ';

        if (mouse.x !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            const mouseOpacity = 1 - (distance / 150);
            color = `rgba(255, 35, 10, ${mouseOpacity * 0.6 * this.opacity})`;
          } else {
            color += `${baseOpacity * this.opacity})`;
          }
        } else {
          color += `${baseOpacity * this.opacity})`;
        }

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * this.scale, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
      }

      update(mouse) {
        if (this.animationProgress < 1) return;

        if (mouse.x === null) {
          if (this.x !== this.baseX) {
            this.x -= (this.x - this.baseX) / 10;
          }
          if (this.y !== this.baseY) {
            this.y -= (this.y - this.baseY) / 10;
          }
          return;
        }

        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const forceDirectionX = dx / distance;
        const forceDirectionY = dy / distance;
        const maxDistance = 150;
        const force = (maxDistance - distance) / maxDistance;
        const directionX = forceDirectionX * force * this.density;
        const directionY = forceDirectionY * force * this.density;

        if (distance < maxDistance) {
          this.x -= directionX;
          this.y -= directionY;
        } else {
          if (this.x !== this.baseX) {
            this.x -= (this.x - this.baseX) / 10;
          }
          if (this.y !== this.baseY) {
            this.y -= (this.y - this.baseY) / 10;
          }
        }
      }
    },

    init() {
      const canvas = document.getElementById('heroCanvas');
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      let particles = [];
      const mouse = { x: null, y: null };
      let animationId;

      const setCanvasSize = () => {
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
      };

      const initParticles = () => {
        particles = [];
        const spacing = 25;
        const cols = Math.ceil(canvas.width / spacing);
        const rows = Math.ceil(canvas.height / spacing);

        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            const posX = x * spacing + spacing / 2;
            const posY = y * spacing + spacing / 2;
            const delay = (x + y) * 0.025;
            particles.push(new this.Particle(posX, posY, delay));
          }
        }
      };

      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(particle => {
          particle.update(mouse);
          particle.draw(ctx, mouse);
        });
        animationId = requestAnimationFrame(animate);
      };

      setCanvasSize();
      initParticles();

      window.addEventListener('resize', () => {
        setCanvasSize();
        initParticles();
      });

      canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
      });

      canvas.addEventListener('mouseleave', () => {
        mouse.x = null;
        mouse.y = null;
      });

      animate();

      const observer = new MutationObserver(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      });

      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
      });

      utils.log('Hero canvas initialized');

      return () => {
        cancelAnimationFrame(animationId);
        observer.disconnect();
      };
    }
  };

  // =========================================
  // 뉴스 캐러셀
  // =========================================
  const newsCarousel = {
    init() {
      const wrapper = document.querySelector('.home-news-wrapper');
      if (!wrapper) return;

      const prevBtn = wrapper.querySelector('.home-news-nav-prev');
      const nextBtn = wrapper.querySelector('.home-news-nav-next');
      const track = wrapper.querySelector('.home-news-track');

      if (!prevBtn || !nextBtn || !track) return;

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        utils.log('Auto-rolling disabled (prefers-reduced-motion)');
        return;
      }

      let currentPosition = 0;
      let isPaused = false;
      let animationId = null;
      let resumeTimeout = null;
      let startTime = Date.now();

      const getScrollDistance = () => {
        const card = track.querySelector('.home-news-item');
        if (!card) return 0;
        const cardWidth = card.offsetWidth;
        const gap = parseInt(getComputedStyle(track).gap) || 0;
        return cardWidth + gap;
      };

      const autoScroll = () => {
        if (isPaused) {
          animationId = requestAnimationFrame(autoScroll);
          return;
        }

        const elapsed = Date.now() - startTime;
        const trackWidth = track.scrollWidth;
        const loopWidth = trackWidth / 5;
        const progress = (elapsed % CONFIG.CAROUSEL_DURATION) / CONFIG.CAROUSEL_DURATION;
        currentPosition = -(loopWidth * progress);

        if (Math.abs(currentPosition) >= loopWidth) {
          currentPosition = 0;
          startTime = Date.now();
        }

        track.style.transform = `translateX(${currentPosition}px)`;
        animationId = requestAnimationFrame(autoScroll);
      };

      const startAnimation = () => {
        if (!animationId) {
          startTime = Date.now();
          animationId = requestAnimationFrame(autoScroll);
        }
      };

      const pauseAnimation = () => { isPaused = true; };
      const resumeAnimation = () => {
        isPaused = false;
        startTime = Date.now() - ((Math.abs(currentPosition) / (track.scrollWidth / 5)) * CONFIG.CAROUSEL_DURATION);
      };

      const stopAnimation = () => {
        if (animationId) {
          cancelAnimationFrame(animationId);
          animationId = null;
        }
      };

      const smoothScroll = (targetX) => {
        stopAnimation();
        track.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        track.style.transform = `translateX(${targetX}px)`;
        currentPosition = targetX;
        setTimeout(() => track.style.transition = '', 500);
      };

      prevBtn.addEventListener('click', () => {
        pauseAnimation();
        const scrollDistance = getScrollDistance();
        const targetX = Math.min(currentPosition + scrollDistance, 0);
        smoothScroll(targetX);
      });

      nextBtn.addEventListener('click', () => {
        pauseAnimation();
        const scrollDistance = getScrollDistance();
        const minX = -(track.scrollWidth / 5);
        const targetX = Math.max(currentPosition - scrollDistance, minX);
        smoothScroll(targetX);
      });

      wrapper.addEventListener('mouseenter', () => {
        clearTimeout(resumeTimeout);
        pauseAnimation();
      });

      wrapper.addEventListener('mouseleave', () => {
        clearTimeout(resumeTimeout);
        resumeTimeout = setTimeout(() => {
          resumeAnimation();
          startAnimation();
        }, 3000);
      });

      startAnimation();

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          stopAnimation();
        } else if (!isPaused) {
          startAnimation();
        }
      });

      utils.log('News carousel initialized');
    }
  };

  // =========================================
  // Back to Top
  // =========================================
  const backToTop = {
    toggle(button) {
      const shouldShow = window.scrollY > CONFIG.SCROLL_THRESHOLD;
      button.classList.toggle('visible', shouldShow);
    },

    init() {
      const button = document.getElementById('backToTop');
      if (!button) return;

      window.addEventListener('scroll', () => this.toggle(button));
      this.toggle(button);

      button.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      utils.log('Back to top initialized');
    }
  };

  // =========================================
  // 포커스 모드
  // =========================================
  const focusMode = {
    highlightVisibleElement(articleBody, isFocusMode, currentFocusedElement) {
      if (!isFocusMode) return currentFocusedElement;

      const elements = articleBody.querySelectorAll(':scope > p, :scope > .highlighter-rouge, :scope > blockquote, :scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6, :scope > ul, :scope > ol, :scope > li, :scope > table');
      const viewportHeight = window.innerHeight;
      const scrollTop = window.scrollY;
      const centerY = scrollTop + viewportHeight / 2;

      let closestElement = null;
      let closestDistance = Infinity;

      elements.forEach(element => {
        const rect = element.getBoundingClientRect();
        const elementCenter = scrollTop + rect.top + rect.height / 2;
        const distance = Math.abs(centerY - elementCenter);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestElement = element;
        }
      });

      if (closestElement === currentFocusedElement) {
        return currentFocusedElement;
      }

      elements.forEach(el => el.classList.remove('focused'));
      if (closestElement) {
        closestElement.classList.add('focused');
      }

      return closestElement;
    },

    init() {
      const focusModeToggle = document.getElementById('focusModeToggle');
      const articleBody = document.querySelector('.article-body');

      if (!focusModeToggle || !articleBody) return;

      let isFocusMode = false;
      let currentFocusedElement = null;
      let ticking = false;

      const toggleFocusMode = () => {
        isFocusMode = !isFocusMode;
        document.body.classList.toggle('focus-mode', isFocusMode);
        focusModeToggle.classList.toggle('active', isFocusMode);
        focusModeToggle.setAttribute('aria-pressed', isFocusMode);
        focusModeToggle.setAttribute('data-tooltip', isFocusMode ? '포커스 모드 ON' : '포커스 모드 OFF');
        localStorage.setItem('focusMode', isFocusMode);

        if (isFocusMode) {
          currentFocusedElement = this.highlightVisibleElement(articleBody, isFocusMode, currentFocusedElement);

          if (utils.isMobile()) {
            const tocContainer = document.getElementById('toc');
            const tocToggle = document.getElementById('tocToggle');
            if (tocContainer?.classList.contains('expanded')) {
              tocContainer.classList.remove('expanded');
              tocToggle?.setAttribute('aria-expanded', 'false');
            }
          }
        }
      };

      // 저장된 상태 복원
      const savedFocusMode = localStorage.getItem('focusMode') === 'true';
      if (savedFocusMode) {
        isFocusMode = true;
        document.body.classList.add('focus-mode');
        focusModeToggle.classList.add('active');
        focusModeToggle.setAttribute('aria-pressed', 'true');
        focusModeToggle.setAttribute('data-tooltip', '포커스 모드 ON');
      }

      focusModeToggle.addEventListener('click', toggleFocusMode);

      // 키보드 단축키
      document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'f' && !e.shiftKey) {
          if (articleBody.contains(document.activeElement)) {
            e.preventDefault();
            toggleFocusMode();
          }
        }
      });

      // 스크롤 시 요소 강조
      window.addEventListener('scroll', () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            currentFocusedElement = this.highlightVisibleElement(articleBody, isFocusMode, currentFocusedElement);
            ticking = false;
          });
          ticking = true;
        }
      });

      // 모바일 터치
      if (utils.isMobile()) {
        let touchTimeout;
        articleBody.addEventListener('touchstart', (e) => {
          if (!isFocusMode) return;

          let target = e.target;
          while (target && target !== articleBody) {
            if (target.parentElement === articleBody) {
              const tagName = target.tagName.toLowerCase();
              const hasClass = target.classList.contains('highlighter-rouge');
              if (['p', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'table'].includes(tagName) || hasClass) {
                break;
              }
            }
            target = target.parentElement;
          }

          if (!target || target === articleBody) return;

          articleBody.querySelectorAll('.focused').forEach(el => el.classList.remove('focused'));
          target.classList.add('focused');

          clearTimeout(touchTimeout);
          touchTimeout = setTimeout(() => {
            currentFocusedElement = this.highlightVisibleElement(articleBody, isFocusMode, currentFocusedElement);
          }, 3000);
        });
      }

      utils.log('Focus mode initialized');
    }
  };

  // =========================================
  // 스크롤 헤더 (모바일)
  // =========================================
  const scrollHeader = {
    init() {
      if (!utils.isMobile()) return;

      const header = document.querySelector('.site-header');
      if (!header) return;

      let lastScrollY = window.scrollY;
      let ticking = false;

      const updateHeader = () => {
        const currentScrollY = window.scrollY;

        if (currentScrollY < 100) {
          header.classList.remove('header-hidden');
          header.classList.add('header-visible');
          lastScrollY = currentScrollY;
          ticking = false;
          return;
        }

        if (Math.abs(currentScrollY - lastScrollY) < 10) {
          ticking = false;
          return;
        }

        if (currentScrollY > lastScrollY) {
          header.classList.add('header-hidden');
          header.classList.remove('header-visible');
        } else {
          header.classList.remove('header-hidden');
          header.classList.add('header-visible');
        }

        lastScrollY = currentScrollY;
        ticking = false;
      };

      window.addEventListener('scroll', () => {
        if (!ticking) {
          window.requestAnimationFrame(updateHeader);
          ticking = true;
        }
      });

      window.addEventListener('resize', () => {
        if (!utils.isMobile()) {
          header.classList.remove('header-hidden', 'header-visible');
        }
      });

      utils.log('Scroll header initialized');
    }
  };

  // =========================================
  // 메인 초기화
  // =========================================
  const init = () => {
    if (CONFIG.DEBUG) {
      console.log('🚀 Learn CS 초기화 시작...');
    }

    // 순서대로 초기화
    theme.init();
    mobileNav.init();
    scrollHeader.init();
    heroCanvas.init();
    newsCarousel.init();
    toc.init();
    codeBlocks.init();
    links.init();
    copyWatermark.init();
    shortcuts.init();
    readingTime.init();
    print.init();
    share.init();
    bookmark.init();
    readingProgress.init();
    backToTop.init();
    focusMode.init();
    edit.init();

    if (CONFIG.DEBUG) {
      console.log('✅ Learn CS 초기화 완료');
    } else {
      console.log('✅ Learn CS 초기화 완료');
    }
  };

  // DOM 준비 완료 시 실행
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
