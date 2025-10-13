/* =========================================
   Learn CS - 메인 JavaScript
   Semantic, Accessible, Minimal
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
  // 목차 자동 생성
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
        <a href="#${id}">${text}</a>
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
        }
      });
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

        try {
          await navigator.clipboard.writeText(code);
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
  // 초기화
  // =========================================
  const init = () => {
    initTheme();
    initMobileNav();
    generateTOC();
    initCodeCopy();
    markExternalLinks();
    initKeyboardShortcuts();

    console.log('✅ Learn CS 초기화 완료');
  };

  // DOM 준비 완료 시 실행
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
