/* =========================================
   Learn CS
   ========================================= */

(function() {
  'use strict';

  // =========================================
  // 테마 전환 (다크 모드)
  // =========================================
  const initTheme = () => {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;

    const html = document.documentElement;

    // 저장된 테마 불러오기
    const savedTheme = localStorage.getItem('theme') || 'light';
    html.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    // 클릭 시 테마 전환
    themeToggle.addEventListener('click', () => {
      const currentTheme = html.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

      html.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      updateThemeIcon(newTheme);
    });
  };

  const updateThemeIcon = (theme) => {
    const toggle = document.getElementById('themeToggle');
    if (!toggle) return;

    // 접근성을 위한 aria-label 업데이트
    toggle.setAttribute('aria-label', theme === 'dark' ? 'Light mode로 전환' : 'Dark mode로 전환');

    // 아이콘 업데이트
    const svg = toggle.querySelector('svg');
    if (svg) {
      if (theme === 'dark') {
        // 라이트 모드용 태양 아이콘
        svg.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />';
      } else {
        // 다크 모드용 달 아이콘
        svg.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />';
      }
    }
  };

  // =========================================
  // 모바일 네비게이션
  // =========================================
  const initMobileNav = () => {
    const menuToggle = document.getElementById('menuToggle');
    const navList = document.getElementById('navList');

    if (!menuToggle || !navList) return;

    // 버튼 클릭 시 메뉴 토글
    menuToggle.addEventListener('click', () => {
      const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
      const newState = !isExpanded;

      menuToggle.setAttribute('aria-expanded', newState);
      navList.setAttribute('aria-hidden', !newState);
    });

    // 외부 클릭 시 메뉴 닫기
    document.addEventListener('click', (e) => {
      if (!menuToggle.contains(e.target) && !navList.contains(e.target)) {
        menuToggle.setAttribute('aria-expanded', 'false');
        navList.setAttribute('aria-hidden', 'true');
      }
    });

    // Escape 키로 메뉴 닫기
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        menuToggle.setAttribute('aria-expanded', 'false');
        navList.setAttribute('aria-hidden', 'true');
      }
    });
  };

  // =========================================
  // 목차 자동 생성 + 스크롤 하이라이트
  // =========================================
  const generateTOC = () => {
    const articleBody = document.querySelector('.article-body');
    const tocList = document.getElementById('tocList');
    const tocContainer = document.getElementById('toc');

    if (!articleBody || !tocList) return;

    // 모든 제목 태그 가져오기 (h2, h3, h4)
    const headings = articleBody.querySelectorAll('h2, h3, h4');

    if (headings.length === 0) {
      // 제목이 없으면 목차 숨기기
      if (tocContainer) {
        tocContainer.style.display = 'none';
      }
      return;
    }

    // 목차 HTML 생성
    let tocHTML = '';
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      const id = heading.id || `heading-${index}`;
      const text = heading.textContent;

      // ID가 없으면 추가
      if (!heading.id) {
        heading.id = id;
      }

      const indent = level === 2 ? '' : level === 3 ? 'padding-left: 1rem;' : 'padding-left: 2rem;';

      tocHTML += `<li style="${indent}">
        <a href="#${id}" data-target="${id}">${text}</a>
      </li>`;
    });

    tocList.innerHTML = tocHTML;

    // 부드러운 스크롤 추가
    tocList.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        const target = document.getElementById(targetId);

        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // 접근성을 위한 포커스
          target.focus();

          // 모바일에서 목차 닫기
          if (window.innerWidth <= 768) {
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

    // 스크롤 시 현재 섹션 하이라이트
    initTOCHighlight(headings);

    // 모바일 TOC 토글 기능 초기화
    initMobileTOC();
  };

  // =========================================
  // 모바일 TOC 토글
  // =========================================
  const initMobileTOC = () => {
    const tocToggle = document.getElementById('tocToggle');
    const tocContainer = document.getElementById('toc');

    if (!tocToggle || !tocContainer) return;

    tocToggle.addEventListener('click', () => {
      const isExpanded = tocToggle.getAttribute('aria-expanded') === 'true';
      const newState = !isExpanded;

      tocToggle.setAttribute('aria-expanded', newState);

      if (newState) {
        tocContainer.classList.add('expanded');
      } else {
        tocContainer.classList.remove('expanded');
      }
    });

    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768) {
        if (!tocContainer.contains(e.target) && tocContainer.classList.contains('expanded')) {
          tocContainer.classList.remove('expanded');
          tocToggle.setAttribute('aria-expanded', 'false');
        }
      }
    });
  };

  // =========================================
  // 목차 하이라이트
  // =========================================
  const initTOCHighlight = (headings) => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const id = entry.target.id;
        const tocLink = document.querySelector(`#tocList a[data-target="${id}"]`);

        if (tocLink) {
          if (entry.isIntersecting) {
            // 모든 링크의 active 제거
            document.querySelectorAll('#tocList a').forEach(link => {
              link.classList.remove('active');
            });
            // 현재 링크에 active 추가
            tocLink.classList.add('active');
          }
        }
      });
    }, {
      rootMargin: '-100px 0px -66%',
      threshold: 0
    });

    headings.forEach(heading => {
      observer.observe(heading);
    });
  };

  // =========================================
  // 코드 언어 감지 및 라벨 표시
  // =========================================
  const initCodeLanguageLabels = () => {
    const codeBlocks = document.querySelectorAll('.article-body pre');

    codeBlocks.forEach(block => {
      let language = '';

      const codeElement = block.querySelector('code');
      if (codeElement) {
        const classList = Array.from(codeElement.classList);
        for (const className of classList) {
          if (className.startsWith('language-')) {
            language = className.replace('language-', '');
            break;
          }
        }
      }

      if (!language) {
        let parent = block.parentElement;
        while (parent && parent !== document.body) {
          const parentClasses = Array.from(parent.classList);
          for (const className of parentClasses) {
            if (className.startsWith('language-')) {
              language = className.replace('language-', '');
              break;
            }
          }
          if (language) break;
          parent = parent.parentElement;
        }
      }

      if (!language) {
        const preClasses = Array.from(block.classList);
        for (const className of preClasses) {
          if (className.startsWith('language-')) {
            language = className.replace('language-', '');
            break;
          }
        }
      }

      if (language) {
        block.setAttribute('data-language', language);
      } else {
        block.setAttribute('data-language', 'code');
      }
    });
  };

  // =========================================
  // 코드 복사 버튼
  // =========================================
  const initCodeCopy = () => {
    const codeBlocks = document.querySelectorAll('.article-body pre');

    codeBlocks.forEach(block => {
      const button = document.createElement('button');
      button.className = 'code-copy-btn';
      button.textContent = 'Copy';
      button.setAttribute('type', 'button');
      button.setAttribute('aria-label', '코드를 클립보드에 복사');

      button.addEventListener('click', async () => {
        const code = block.querySelector('code')?.textContent || block.textContent;

        // 워터마크 추가
        const watermark = `\n\n// 출처: ${document.title}\n// ${window.location.href}`;
        const textWithWatermark = code + watermark;

        try {
          await navigator.clipboard.writeText(textWithWatermark);
          button.textContent = 'Copied!';
          button.setAttribute('aria-label', '코드가 클립보드에 복사됨');

          setTimeout(() => {
            button.textContent = 'Copy';
            button.setAttribute('aria-label', '코드를 클립보드에 복사');
          }, 2000);
        } catch (error) {
          console.error('코드 복사 실패:', error);
          button.textContent = 'Failed';

          setTimeout(() => {
            button.textContent = 'Copy';
          }, 2000);
        }
      });

      block.appendChild(button);
    });
  };

  // =========================================
  // 외부 링크 표시
  // =========================================
  const markExternalLinks = () => {
    const links = document.querySelectorAll('.article-body a[href^="http"]');

    links.forEach(link => {
      const url = new URL(link.href);
      if (url.hostname !== window.location.hostname) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');

        // 스크린 리더용 숨김 텍스트 추가
        const srText = document.createElement('span');
        srText.className = 'visually-hidden';
        srText.textContent = ' (새 창에서 열림)';
        link.appendChild(srText);
      }
    });
  };

  // =========================================
  // 텍스트 복사 시 워터마크 추가
  // =========================================
  const initCopyWatermark = () => {
    document.addEventListener('copy', (e) => {
      // 선택된 텍스트 가져오기
      const selection = window.getSelection();
      const selectedText = selection.toString();

      // 텍스트가 선택되지 않았거나 너무 짧으면 워터마크 추가 안 함
      if (!selectedText || selectedText.length < 10) {
        return;
      }

      // 워터마크 생성
      const pageTitle = document.title;
      const pageUrl = window.location.href;
      const watermark = `\n\n━━━━━━━━━━━━━━━━━━━━━━\n출처: ${pageTitle}\n${pageUrl}`;

      // 클립보드에 워터마크가 포함된 텍스트 복사
      e.preventDefault();
      e.clipboardData.setData('text/plain', selectedText + watermark);
    });
  };

  // =========================================
  // 키보드 단축키
  // =========================================
  const initKeyboardShortcuts = () => {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + D: 다크 모드 전환
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
          themeToggle.click();
        }
      }

      // Ctrl/Cmd + M: 모바일 메뉴 토글
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        const menuToggle = document.getElementById('menuToggle');
        if (menuToggle) {
          menuToggle.click();
        }
      }
    });
  };

  // =========================================
  // 읽는 시간 계산
  // =========================================
  const calculateReadingTime = () => {
    const readingTimeElement = document.getElementById('readingTimeText');
    if (!readingTimeElement) return;

    const articleBody = document.querySelector('.article-body');
    if (!articleBody) return;

    // 텍스트 추출 (코드 블록 제외)
    const text = articleBody.textContent || '';
    const wordsPerMinute = 200; // 평균 읽기 속도
    const wordCount = text.trim().split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / wordsPerMinute);

    readingTimeElement.textContent = `${readingTime}분 읽기`;
  };

  // =========================================
  // 인쇄 최적화
  // =========================================
  const initPrint = () => {
    const printBtn = document.getElementById('printBtn');
    if (!printBtn) return;

    printBtn.addEventListener('click', () => {
      window.print();
    });
  };

  // =========================================
  // 공유 기능
  // =========================================
  const initShare = () => {
    const shareBtn = document.getElementById('shareBtn');
    const modal = document.getElementById('shareModal');
    const closeBtn = modal?.querySelector('.modal-close');
    const shareOptions = document.querySelectorAll('.share-option');

    if (!shareBtn || !modal) return;

    // 모달 열기
    shareBtn.addEventListener('click', () => {
      modal.classList.add('flex');
      modal.setAttribute('aria-hidden', 'false');
      // 첫 번째 버튼에 포커스
      modal.querySelector('.share-option')?.focus();
    });

    // 모달 닫기
    const closeModal = () => {
      modal.classList.remove('flex');
      modal.setAttribute('aria-hidden', 'true');
      shareBtn.focus();
    };

    closeBtn?.addEventListener('click', closeModal);

    // 외부 클릭 시 닫기
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    // ESC 키로 닫기
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.style.display === 'block') {
        closeModal();
      }
    });

    // 공유 옵션 처리
    shareOptions.forEach(option => {
      option.addEventListener('click', () => {
        const shareType = option.getAttribute('data-share');
        const url = encodeURIComponent(window.location.href);
        const title = encodeURIComponent(document.title);

        let shareUrl = '';

        switch (shareType) {
          case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
            window.open(shareUrl, '_blank', 'width=550,height=420');
            break;
          case 'linkedin':
            shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
            window.open(shareUrl, '_blank', 'width=550,height=420');
            break;
          case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
            window.open(shareUrl, '_blank', 'width=550,height=420');
            break;
          case 'copy':
            navigator.clipboard.writeText(window.location.href).then(() => {
              const originalText = option.innerHTML;
              option.innerHTML = '<svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16"><path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/></svg> 복사됨!';
              setTimeout(() => {
                option.innerHTML = originalText;
              }, 2000);
            }).catch(err => {
              console.error('링크 복사 실패:', err);
            });
            break;
        }

        if (shareType !== 'copy') {
          closeModal();
        }
      });
    });
  };

  // =========================================
  // 북마크/읽기 진행률 저장
  // =========================================
  const initBookmark = () => {
    const bookmarkBtn = document.getElementById('bookmarkBtn');
    const bookmarkIcon = document.getElementById('bookmarkIcon');
    const bookmarkText = document.getElementById('bookmarkText');

    if (!bookmarkBtn) return;

    const pageUrl = window.location.pathname;
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '{}');

    // 북마크 상태 확인
    const updateBookmarkUI = () => {
      if (bookmarks[pageUrl]) {
        bookmarkIcon.innerHTML = '<path fill-rule="evenodd" d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.74.439L8 13.069l-5.26 2.87A.5.5 0 0 1 2 15.5V2z"/>';
        bookmarkText.textContent = '북마크됨';
        bookmarkBtn.setAttribute('aria-pressed', 'true');
      } else {
        bookmarkIcon.innerHTML = '<path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.777.416L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5V2zm2-1a1 1 0 0 0-1 1v12.566l4.723-2.482a.5.5 0 0 1 .554 0L13 14.566V2a1 1 0 0 0-1-1H4z"/>';
        bookmarkText.textContent = '북마크';
        bookmarkBtn.setAttribute('aria-pressed', 'false');
      }
    };

    updateBookmarkUI();

    // 북마크 토글
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

      localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
      updateBookmarkUI();
    });

    // 스크롤 위치 저장 (디바운스)
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      if (bookmarks[pageUrl]) {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          bookmarks[pageUrl].scrollPosition = window.scrollY;
          localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
        }, 500);
      }
    });

    // 페이지 로드 시 스크롤 위치 복원
    if (bookmarks[pageUrl]?.scrollPosition) {
      window.scrollTo(0, bookmarks[pageUrl].scrollPosition);
    }
  };

  // =========================================
  // 읽기 진행률 표시
  // =========================================
  const initReadingProgress = () => {
    const progressBar = document.getElementById('readingProgress');
    if (!progressBar) return;

    const updateProgress = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      const scrolled = window.scrollY;
      const progress = (scrolled / documentHeight) * 100;

      progressBar.style.width = `${Math.min(progress, 100)}%`;
    };

    window.addEventListener('scroll', updateProgress);
    updateProgress();
  };

  // =========================================
  // 문서 수정 기능
  // =========================================
  const initEdit = () => {
    const editBtn = document.getElementById('editBtn');
    const editModal = document.getElementById('editModal');
    const closeBtn = editModal?.querySelector('.modal-close');
    const suggestEditBtn = document.getElementById('suggestEdit');
    const directEditBtn = document.getElementById('directEdit');

    if (!editBtn) return;

    const environment = editBtn.getAttribute('data-env') || 'development';
    const pageTitle = editBtn.getAttribute('data-page-title');
    const pagePath = editBtn.getAttribute('data-page-path');
    const pageUrl = editBtn.getAttribute('data-page-url');

    // 이슈 생성 URL 생성 함수
    const createIssueUrl = () => {
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
    };

    // 프로덕션 환경: 바로 이슈 페이지로 이동
    if (environment === 'production') {
      editBtn.addEventListener('click', () => {
        window.open(createIssueUrl(), '_blank');
      });
      return;
    }

    // 개발 환경: 모달 표시
    if (!editModal) return;

    // 모달 열기
    editBtn.addEventListener('click', () => {
      editModal.classList.add('flex');
      editModal.setAttribute('aria-hidden', 'false');
      suggestEditBtn?.focus();
    });

    // 모달 닫기
    const closeModal = () => {
      editModal.classList.remove('flex');
      editModal.setAttribute('aria-hidden', 'true');
      editBtn.focus();
    };

    closeBtn?.addEventListener('click', closeModal);

    // 외부 클릭 시 닫기
    editModal.addEventListener('click', (e) => {
      if (e.target === editModal) {
        closeModal();
      }
    });

    // ESC 키로 닫기
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && editModal.classList.contains('flex')) {
        closeModal();
      }
    });

    // 수정 제안하기 (이슈 생성)
    suggestEditBtn?.addEventListener('click', () => {
      window.open(createIssueUrl(), '_blank');
      closeModal();
    });

    // 직접 수정하기 (GitHub edit)
    directEditBtn?.addEventListener('click', () => {
      const editUrl = `https://github.com/lledellebell/learn-cs/edit/master/${pagePath}`;
      window.open(editUrl, '_blank');
      closeModal();
    });
  };

  // =========================================
  // Hero Canvas 인터랙티브
  // =========================================
  const initHeroCanvas = () => {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let mouse = { x: null, y: null };
    let animationId;

    const setCanvasSize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    setCanvasSize();
    window.addEventListener('resize', () => {
      setCanvasSize();
      initParticles();
    });

    class Particle {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.baseX = x;
        this.baseY = y;
        this.size = 2;
        this.density = (Math.random() * 30) + 10;
      }

      draw() {
        const theme = document.documentElement.getAttribute('data-theme');
        let color = theme === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)';

        if (mouse.x !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            const opacity = 1 - (distance / 150);
            color = `rgba(255, 35, 10, ${opacity * 0.6})`;
          }
        }

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
      }

      update() {
        if (mouse.x === null) {
          if (this.x !== this.baseX) {
            const dx = this.x - this.baseX;
            this.x -= dx / 10;
          }
          if (this.y !== this.baseY) {
            const dy = this.y - this.baseY;
            this.y -= dy / 10;
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
          // 원래 위치로 복귀
          if (this.x !== this.baseX) {
            const dx = this.x - this.baseX;
            this.x -= dx / 10;
          }
          if (this.y !== this.baseY) {
            const dy = this.y - this.baseY;
            this.y -= dy / 10;
          }
        }
      }
    }

    const drawConnections = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      const maxDistance = 100;

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < maxDistance) {
            const opacity = 1 - (distance / maxDistance);
            ctx.strokeStyle = theme === 'dark'
              ? `rgba(255, 255, 255, ${opacity * 0.1})`
              : `rgba(0, 0, 0, ${opacity * 0.05})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    };

    const initParticles = () => {
      particles = [];
      const spacing = 40;
      const cols = Math.ceil(canvas.width / spacing);
      const rows = Math.ceil(canvas.height / spacing);

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const posX = x * spacing + spacing / 2;
          const posY = y * spacing + spacing / 2;
          particles.push(new Particle(posX, posY));
        }
      }
    };

    initParticles();

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });

    canvas.addEventListener('mouseleave', () => {
      mouse.x = null;
      mouse.y = null;
    });

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drawConnections();

      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    const observer = new MutationObserver(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
    };
  };

  // =========================================
  // 초기화
  // =========================================
  const init = () => {
    initTheme();
    initMobileNav();
    initHeroCanvas();
    generateTOC();
    initCodeLanguageLabels();
    initCodeCopy();
    markExternalLinks();
    initCopyWatermark();
    initKeyboardShortcuts();
    calculateReadingTime();
    initPrint();
    initShare();
    initBookmark();
    initReadingProgress();
    initEdit();

    console.log('✅ Learn CS 초기화 완료');
  };

  // DOM 준비 완료 시 실행
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
