/* =========================================
   Category Page Pagination with Hierarchical Tabs
   ========================================= */

(function() {
  'use strict';

  // =========================================
  // 설정
  // =========================================
  const CONFIG = {
    ITEMS_PER_PAGE: 5,
    MAX_PAGES_TO_SHOW: 7,
    MAX_PAGES_TO_SHOW_MOBILE: 3,  // 모바일에서는 3개만 표시 (1 ... 5 형태)
    MOBILE_BREAKPOINT: 768,
    SCROLL_BEHAVIOR: 'smooth',
    DEBUG: false  // 디버깅 활성화
  };

  // 디버그 모드 초기 로그
  if (CONFIG.DEBUG) {
    console.log('🚀 category-pagination.js 파일이 로드되었습니다!');
    console.log('📦 Category Pagination IIFE 실행 시작');
  }

  // =========================================
  // 상태 관리
  // =========================================
  const state = {
    currentPage: 1,
    totalPages: 1,
    allItems: [],
    filteredItems: [],
    currentCategory: 'all',      // 상위 카테고리 (예: 'react', 'accessibility')
    currentSubcategory: 'all',   // 하위 카테고리 (예: 'patterns', 'hooks')
    isInitialized: false
  };

  // =========================================
  // DOM 요소 캐싱
  // =========================================
  const elements = {
    postsList: null,
    paginationNav: null,
    pagesContainer: null,
    prevBtn: null,
    nextBtn: null,
    categoryTabs: null,
    subcategoryTabs: null
  };

  // =========================================
  // 유틸리티 함수
  // =========================================
  const utils = {
    log: (...args) => {
      if (CONFIG.DEBUG) {
        console.log('[Category Pagination]', ...args);
      }
    },

    debounce: (func, wait) => {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },

    isMobile: () => window.innerWidth <= CONFIG.MOBILE_BREAKPOINT,

    getUrlParam: (param) => {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get(param);
    },

    updateUrl: (params) => {
      const newUrl = new URL(window.location);
      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          newUrl.searchParams.set(key, value);
        } else {
          newUrl.searchParams.delete(key);
        }
      });
      window.history.replaceState({}, '', newUrl);
    },

    scrollToElement: (element) => {
      if (!element) return;

      const yOffset = -20; // 상단 여백
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;

      window.scrollTo({
        top: y,
        behavior: CONFIG.SCROLL_BEHAVIOR
      });
    }
  };

  // =========================================
  // DOM 요소 초기화
  // =========================================
  const initElements = () => {
    elements.postsList = document.getElementById('categoryPostsList');
    elements.paginationNav = document.getElementById('paginationNav');
    elements.pagesContainer = document.getElementById('paginationPages');
    elements.prevBtn = document.getElementById('paginationPrev');
    elements.nextBtn = document.getElementById('paginationNext');
    // 탭 버튼만 선택 (category-tab 클래스가 있는 것만)
    elements.categoryTabs = document.querySelectorAll('.category-tab[data-category]');
    elements.subcategoryTabs = document.querySelectorAll('.category-tab[data-subcategory]');

    utils.log('DOM elements initialized', elements);
  };

  // =========================================
  // 계층적 탭 시스템
  // =========================================
  const tabs = {
    // 상위 카테고리 탭 초기화 (React, 접근성 등)
    initCategoryTabs: () => {
      if (elements.categoryTabs.length === 0) return;

      elements.categoryTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
          e.preventDefault();
          const category = tab.getAttribute('data-category');
          tabs.selectCategory(category);
        });

        // 키보드 접근성
        tab.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            tab.click();
          }
        });
      });

      utils.log('Category tabs initialized:', elements.categoryTabs.length);
    },

    // 하위 카테고리 탭 초기화 (패턴, Hooks 등)
    initSubcategoryTabs: () => {
      if (elements.subcategoryTabs.length === 0) return;

      elements.subcategoryTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
          e.preventDefault();
          const subcategory = tab.getAttribute('data-subcategory');
          const parentCategory = tab.getAttribute('data-parent-category') || 'all';
          tabs.selectSubcategory(subcategory, parentCategory);
        });

        // 키보드 접근성
        tab.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            tab.click();
          }
        });
      });

      utils.log('Subcategory tabs initialized:', elements.subcategoryTabs.length);
    },

    // 상위 카테고리 선택
    selectCategory: (category) => {
      state.currentCategory = category;
      state.currentSubcategory = 'all'; // 서브카테고리 리셋
      state.currentPage = 1;

      // 탭 활성화 상태 업데이트
      tabs.updateActiveState('category', category);
      tabs.updateActiveState('subcategory', 'all');

      // 관련 서브카테고리 탭 표시/숨김
      tabs.toggleSubcategoryTabs(category);

      // 필터링 및 페이지네이션 업데이트
      filter.apply();

      utils.log('Category selected:', category);
    },

    // 하위 카테고리 선택
    selectSubcategory: (subcategory, parentCategory) => {
      // 상위 카테고리가 다르면 먼저 변경
      if (state.currentCategory !== parentCategory) {
        state.currentCategory = parentCategory;
        tabs.updateActiveState('category', parentCategory);
      }

      state.currentSubcategory = subcategory;
      state.currentPage = 1;

      // 탭 활성화 상태 업데이트
      tabs.updateActiveState('subcategory', subcategory);

      // 필터링 및 페이지네이션 업데이트
      filter.apply();

      utils.log('Subcategory selected:', subcategory);
    },

    // 탭 활성화 상태 업데이트
    updateActiveState: (type, value) => {
      const attribute = type === 'category' ? 'data-category' : 'data-subcategory';
      const tabs = document.querySelectorAll(`[${attribute}]`);

      tabs.forEach(tab => {
        const isActive = tab.getAttribute(attribute) === value;
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-selected', isActive);
        tab.setAttribute('tabindex', isActive ? '0' : '-1');
      });
    },

    // 서브카테고리 탭 표시/숨김
    toggleSubcategoryTabs: (category) => {
      elements.subcategoryTabs.forEach(tab => {
        const subcategory = tab.getAttribute('data-subcategory');
        const parentCategory = tab.getAttribute('data-parent-category');

        // "전체" 버튼은 항상 표시
        if (subcategory === 'all') {
          tab.style.display = '';
          tab.removeAttribute('aria-hidden');
          return;
        }

        // 상위 카테고리가 'all'이거나 일치하는 경우에만 표시
        if (category === 'all' || parentCategory === category) {
          tab.style.display = '';
          tab.removeAttribute('aria-hidden');
        } else {
          tab.style.display = 'none';
          tab.setAttribute('aria-hidden', 'true');
        }
      });
    }
  };

  // =========================================
  // 필터링 시스템
  // =========================================
  const filter = {
    // 필터 적용
    apply: () => {
      if (state.currentCategory === 'all' && state.currentSubcategory === 'all') {
        state.filteredItems = state.allItems;
      } else {
        state.filteredItems = state.allItems.filter(item => {
          const itemCategory = item.getAttribute('data-category');
          const itemSubcategory = item.getAttribute('data-subcategory');

          // 카테고리 매칭
          const categoryMatch = state.currentCategory === 'all' || itemCategory === state.currentCategory;

          // 서브카테고리 매칭
          let subcategoryMatch;
          if (state.currentSubcategory === 'all') {
            // 'all'을 선택한 경우 모든 아이템 표시
            subcategoryMatch = true;
          } else {
            // 특정 서브카테고리를 선택한 경우, 정확히 일치해야 함
            subcategoryMatch = itemSubcategory === state.currentSubcategory;
          }

          return categoryMatch && subcategoryMatch;
        });
      }

      utils.log('Filtered items:', state.filteredItems.length, '/', state.allItems.length);
      utils.log('Current filters:', {
        category: state.currentCategory,
        subcategory: state.currentSubcategory
      });

      // 페이지네이션 업데이트
      pagination.update();
    }
  };

  // =========================================
  // 페이지네이션 시스템
  // =========================================
  const pagination = {
    // 페이지네이션 초기화
    init: () => {
      if (!elements.postsList || !elements.paginationNav) {
        utils.log('Required elements not found');
        return;
      }

      // 모든 아이템 가져오기
      state.allItems = Array.from(elements.postsList.querySelectorAll('.category-post-item'));
      state.filteredItems = state.allItems;

      if (state.allItems.length === 0) {
        elements.paginationNav.style.display = 'none';
        utils.log('No items found');
        return;
      }

      // URL에서 초기 상태 복원
      pagination.restoreStateFromUrl();

      // 탭 초기화
      tabs.initCategoryTabs();
      tabs.initSubcategoryTabs();

      // 초기 하위 탭 표시/숨김 처리
      tabs.toggleSubcategoryTabs(state.currentCategory);

      // 초기 필터 적용
      filter.apply();

      // 이벤트 리스너 추가
      pagination.attachEventListeners();

      state.isInitialized = true;
      utils.log('Pagination initialized:', {
        totalItems: state.allItems.length,
        totalPages: state.totalPages,
        currentPage: state.currentPage
      });
    },

    // URL에서 상태 복원
    restoreStateFromUrl: () => {
      const pageFromUrl = parseInt(utils.getUrlParam('page')) || 1;
      const categoryFromUrl = utils.getUrlParam('category') || 'all';
      const subcategoryFromUrl = utils.getUrlParam('subcategory') || 'all';

      state.currentPage = pageFromUrl;
      state.currentCategory = categoryFromUrl;
      state.currentSubcategory = subcategoryFromUrl;

      // 탭 상태 복원
      if (categoryFromUrl !== 'all') {
        tabs.updateActiveState('category', categoryFromUrl);
        tabs.toggleSubcategoryTabs(categoryFromUrl);
      }
      if (subcategoryFromUrl !== 'all') {
        tabs.updateActiveState('subcategory', subcategoryFromUrl);
      }
    },

    // 페이지네이션 업데이트
    update: () => {
      // 총 페이지 수 재계산
      state.totalPages = Math.max(1, Math.ceil(state.filteredItems.length / CONFIG.ITEMS_PER_PAGE));

      // 현재 페이지가 범위를 벗어나면 조정
      if (state.currentPage > state.totalPages) {
        state.currentPage = state.totalPages;
      }

      // 페이지네이션 표시/숨김
      if (state.totalPages <= 1) {
        elements.paginationNav.style.display = 'none';
      } else {
        elements.paginationNav.style.display = '';
      }

      // 현재 페이지 표시
      pagination.showPage(state.currentPage);
    },

    // 페이지 표시
    showPage: (page) => {
      state.currentPage = Math.max(1, Math.min(page, state.totalPages));

      // 모든 아이템 숨기기
      state.allItems.forEach(item => {
        item.style.display = 'none';
        item.setAttribute('aria-hidden', 'true');
      });

      // 현재 페이지의 필터링된 아이템만 표시
      const startIndex = (state.currentPage - 1) * CONFIG.ITEMS_PER_PAGE;
      const endIndex = Math.min(startIndex + CONFIG.ITEMS_PER_PAGE, state.filteredItems.length);

      utils.log(`📄 페이지 ${state.currentPage}에 표시할 아이템: ${startIndex} ~ ${endIndex-1}`);

      for (let i = startIndex; i < endIndex; i++) {
        if (state.filteredItems[i]) {
          state.filteredItems[i].style.display = '';
          state.filteredItems[i].removeAttribute('aria-hidden');

          const link = state.filteredItems[i].querySelector('.category-post-link');
          if (link) {
            utils.log(`  ✅ 아이템 ${i} 표시됨:`, link.href);
          }
        }
      }

      // UI 업데이트
      pagination.updateButtons();
      pagination.renderPageNumbers();

      // URL 업데이트
      utils.updateUrl({
        page: state.currentPage > 1 ? state.currentPage : null,
        category: state.currentCategory !== 'all' ? state.currentCategory : null,
        subcategory: state.currentSubcategory !== 'all' ? state.currentSubcategory : null
      });

      // 스크롤
      utils.scrollToElement(elements.postsList);

      utils.log('Page shown:', state.currentPage, '/', state.totalPages);
    },

    // 버튼 상태 업데이트
    updateButtons: () => {
      if (elements.prevBtn) {
        elements.prevBtn.disabled = state.currentPage === 1;
        elements.prevBtn.setAttribute('aria-disabled', state.currentPage === 1);
      }

      if (elements.nextBtn) {
        elements.nextBtn.disabled = state.currentPage === state.totalPages;
        elements.nextBtn.setAttribute('aria-disabled', state.currentPage === state.totalPages);
      }
    },

    // 페이지 번호 렌더링
    renderPageNumbers: () => {
      if (!elements.pagesContainer) return;

      elements.pagesContainer.innerHTML = '';

      const pageNumbers = pagination.getPageNumbers();

      pageNumbers.forEach(pageNum => {
        if (pageNum === '...') {
          const ellipsis = document.createElement('span');
          ellipsis.className = 'pagination-ellipsis';
          ellipsis.textContent = '...';
          ellipsis.setAttribute('aria-hidden', 'true');
          elements.pagesContainer.appendChild(ellipsis);
        } else {
          const button = document.createElement('button');
          button.className = 'pagination-page';
          button.textContent = pageNum;
          button.setAttribute('aria-label', `${pageNum} 페이지로 이동`);
          button.setAttribute('type', 'button');

          if (pageNum === state.currentPage) {
            button.classList.add('active');
            button.setAttribute('aria-current', 'page');
            button.disabled = true;
          }

          button.addEventListener('click', () => {
            pagination.showPage(pageNum);
          });

          elements.pagesContainer.appendChild(button);
        }
      });
    },

    // 표시할 페이지 번호 계산
    getPageNumbers: () => {
      const pages = [];
      const isMobile = utils.isMobile();
      const maxPagesToShow = isMobile ? CONFIG.MAX_PAGES_TO_SHOW_MOBILE : CONFIG.MAX_PAGES_TO_SHOW;

      // 전체 페이지가 maxPagesToShow 이하면 모두 표시
      if (state.totalPages <= maxPagesToShow) {
        for (let i = 1; i <= state.totalPages; i++) {
          pages.push(i);
        }
        return pages;
      }

      // 모바일: 현재 페이지만 중간에 표시 (1 ... 5 ... 10)
      if (isMobile) {
        pages.push(1);

        // 현재 페이지가 1도 아니고 마지막도 아닌 경우
        if (state.currentPage > 1 && state.currentPage < state.totalPages) {
          if (state.currentPage > 2) {
            pages.push('...');
          }
          pages.push(state.currentPage);
          if (state.currentPage < state.totalPages - 1) {
            pages.push('...');
          }
        } else if (state.currentPage === 1 && state.totalPages > 2) {
          pages.push('...');
        }

        if (state.totalPages > 1) {
          pages.push(state.totalPages);
        }
      }
      // 데스크톱: 기존 로직 (현재 페이지 전후 표시)
      else {
        pages.push(1);

        const startPage = Math.max(2, state.currentPage - 1);
        const endPage = Math.min(state.totalPages - 1, state.currentPage + 1);

        if (startPage > 2) {
          pages.push('...');
        }

        for (let i = startPage; i <= endPage; i++) {
          pages.push(i);
        }

        if (endPage < state.totalPages - 1) {
          pages.push('...');
        }

        pages.push(state.totalPages);
      }

      return pages;
    },

    // 이벤트 리스너 추가
    attachEventListeners: () => {
      // 이전/다음 버튼
      if (elements.prevBtn) {
        elements.prevBtn.addEventListener('click', () => {
          if (state.currentPage > 1) {
            pagination.showPage(state.currentPage - 1);
          }
        });
      }

      if (elements.nextBtn) {
        elements.nextBtn.addEventListener('click', () => {
          if (state.currentPage < state.totalPages) {
            pagination.showPage(state.currentPage + 1);
          }
        });
      }

      // 리사이즈 시 페이지네이션 다시 렌더링 (모바일 ↔ 데스크톱 전환)
      let resizeTimer;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          pagination.renderPageNumbers();
        }, 150);
      });

      // 키보드 네비게이션
      document.addEventListener('keydown', (e) => {
        // 입력 요소에서는 비활성화
        const activeElement = document.activeElement;
        if (activeElement &&
            (activeElement.tagName === 'INPUT' ||
             activeElement.tagName === 'TEXTAREA' ||
             activeElement.isContentEditable)) {
          return;
        }

        switch(e.key) {
          case 'ArrowLeft':
            if (state.currentPage > 1) {
              e.preventDefault();
              pagination.showPage(state.currentPage - 1);
            }
            break;
          case 'ArrowRight':
            if (state.currentPage < state.totalPages) {
              e.preventDefault();
              pagination.showPage(state.currentPage + 1);
            }
            break;
          case 'Home':
            if (state.totalPages > 1) {
              e.preventDefault();
              pagination.showPage(1);
            }
            break;
          case 'End':
            if (state.totalPages > 1) {
              e.preventDefault();
              pagination.showPage(state.totalPages);
            }
            break;
        }
      });
    }
  };

  // =========================================
  // 링크 클릭 디버깅
  // =========================================
  const debugLinkClicks = () => {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('.category-post-link');
      if (link) {
        console.log('🔗 링크 클릭됨!', {
          href: link.href,
          target: e.target,
          currentTarget: e.currentTarget,
          defaultPrevented: e.defaultPrevented
        });

        // 링크가 제대로 작동하는지 확인
        if (!e.defaultPrevented) {
          console.log('✅ 링크 이동 가능 (preventDefault 안 됨)');
        } else {
          console.log('❌ 링크 이동 차단됨 (preventDefault 됨)');
        }
      }
    }, true); // capture phase에서 먼저 잡기
  };

  // =========================================
  // 초기화
  // =========================================
  const init = () => {
    if (CONFIG.DEBUG) {
      console.log('✨ Category Pagination init() 호출됨');
      console.log('📍 document.readyState:', document.readyState);
    }

    if (CONFIG.DEBUG) {
      debugLinkClicks();
    }

    initElements();
    pagination.init();
  };

  // DOM 준비 완료 시 실행
  if (document.readyState === 'loading') {
    if (CONFIG.DEBUG) {
      console.log('⏳ DOMContentLoaded 이벤트 대기 중...');
    }
    document.addEventListener('DOMContentLoaded', init);
  } else {
    if (CONFIG.DEBUG) {
      console.log('✅ DOM이 이미 준비됨 - 즉시 초기화');
    }
    init();
  }

  // 디버그 모드용 전역 접근
  if (CONFIG.DEBUG) {
    window.categoryPagination = {
      state,
      elements,
      utils,
      tabs,
      filter,
      pagination
    };
  }
})();
