/* =========================================
   Category Page Pagination
   ========================================= */

(function() {
  'use strict';

  // =========================================
  // 페이지네이션 설정
  // =========================================
  const ITEMS_PER_PAGE = 5;
  let currentPage = 1;
  let totalPages = 1;
  let allItems = [];
  let filteredItems = [];
  let currentSubcategory = 'all';

  // =========================================
  // 탭 초기화
  // =========================================
  const initTabs = () => {
    const tabs = document.querySelectorAll('.category-tab');

    if (tabs.length === 0) return;

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const subcategory = tab.getAttribute('data-subcategory');

        // 탭 활성화 상태 변경
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // 서브카테고리 필터링
        filterBySubcategory(subcategory);
      });
    });
  };

  // =========================================
  // 서브카테고리별 필터링
  // =========================================
  const filterBySubcategory = (subcategory) => {
    currentSubcategory = subcategory;
    currentPage = 1; // 필터링 시 첫 페이지로 이동

    if (subcategory === 'all') {
      filteredItems = allItems;
    } else {
      filteredItems = allItems.filter(item => {
        return item.getAttribute('data-subcategory') === subcategory;
      });
    }

    // 페이지네이션 재계산
    updatePagination();
  };

  // =========================================
  // 페이지네이션 업데이트
  // =========================================
  const updatePagination = () => {
    const paginationNav = document.getElementById('paginationNav');

    if (!paginationNav) return;

    // 총 페이지 수 재계산
    totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);

    // 페이지가 1개 이하면 페이지네이션 숨기기
    if (totalPages <= 1) {
      paginationNav.style.display = 'none';
    } else {
      paginationNav.style.display = '';
    }

    // 현재 페이지 표시
    showPage(currentPage);
  };

  // =========================================
  // 페이지네이션 초기화
  // =========================================
  const initPagination = () => {
    const postsList = document.getElementById('categoryPostsList');
    const paginationNav = document.getElementById('paginationNav');

    if (!postsList || !paginationNav) return;

    // 모든 아이템 가져오기
    allItems = Array.from(postsList.querySelectorAll('.category-post-item'));
    filteredItems = allItems; // 초기에는 전체 표시

    if (allItems.length === 0) {
      paginationNav.style.display = 'none';
      return;
    }

    // 탭 초기화
    initTabs();

    // 총 페이지 수 계산
    totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);

    // 페이지가 1개면 페이지네이션 숨기기
    if (totalPages <= 1) {
      paginationNav.style.display = 'none';
      return;
    }

    // URL에서 페이지 번호 가져오기
    const urlParams = new URLSearchParams(window.location.search);
    const pageFromUrl = parseInt(urlParams.get('page')) || 1;
    currentPage = Math.max(1, Math.min(pageFromUrl, totalPages));

    // 페이지네이션 렌더링
    renderPagination();
    showPage(currentPage);

    // 이벤트 리스너 추가
    attachEventListeners();

    console.log(`✅ 페이지네이션 초기화 완료 (${allItems.length}개 항목, ${totalPages} 페이지)`);
  };

  // =========================================
  // 페이지 표시
  // =========================================
  const showPage = (page) => {
    currentPage = page;

    // 모든 아이템 숨기기
    allItems.forEach(item => {
      item.style.display = 'none';
    });

    // 현재 페이지의 필터링된 아이템만 표시
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredItems.length);

    for (let i = startIndex; i < endIndex; i++) {
      if (filteredItems[i]) {
        filteredItems[i].style.display = '';
      }
    }

    // 페이지네이션 버튼 업데이트
    updatePaginationButtons();

    // URL 업데이트 (히스토리에 추가하지 않음)
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('page', page);
    window.history.replaceState({}, '', newUrl);

    // 페이지 상단으로 부드럽게 스크롤
    const postsList = document.getElementById('categoryPostsList');
    if (postsList) {
      postsList.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // =========================================
  // 페이지네이션 렌더링
  // =========================================
  const renderPagination = () => {
    const pagesContainer = document.getElementById('paginationPages');
    if (!pagesContainer) return;

    pagesContainer.innerHTML = '';

    // 표시할 페이지 번호 계산
    const pageNumbers = getPageNumbers();

    pageNumbers.forEach((pageNum, index) => {
      if (pageNum === '...') {
        // 생략 기호
        const ellipsis = document.createElement('span');
        ellipsis.className = 'pagination-ellipsis';
        ellipsis.textContent = '...';
        pagesContainer.appendChild(ellipsis);
      } else {
        // 페이지 버튼
        const button = document.createElement('button');
        button.className = 'pagination-page';
        button.textContent = pageNum;
        button.setAttribute('aria-label', `${pageNum} 페이지로 이동`);

        if (pageNum === currentPage) {
          button.classList.add('active');
          button.setAttribute('aria-current', 'page');
        }

        button.addEventListener('click', () => {
          showPage(pageNum);
        });

        pagesContainer.appendChild(button);
      }
    });
  };

  // =========================================
  // 표시할 페이지 번호 계산
  // =========================================
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 7; // 최대 표시 페이지 수

    if (totalPages <= maxPagesToShow) {
      // 총 페이지가 적으면 모두 표시
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 현재 페이지 주변만 표시
      pages.push(1); // 항상 첫 페이지 표시

      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      // 왼쪽 생략 기호
      if (startPage > 2) {
        pages.push('...');
      }

      // 중간 페이지들
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // 오른쪽 생략 기호
      if (endPage < totalPages - 1) {
        pages.push('...');
      }

      pages.push(totalPages); // 항상 마지막 페이지 표시
    }

    return pages;
  };

  // =========================================
  // 페이지네이션 버튼 업데이트
  // =========================================
  const updatePaginationButtons = () => {
    const prevBtn = document.getElementById('paginationPrev');
    const nextBtn = document.getElementById('paginationNext');

    if (prevBtn) {
      prevBtn.disabled = currentPage === 1;
    }

    if (nextBtn) {
      nextBtn.disabled = currentPage === totalPages;
    }

    // 페이지 번호 버튼 업데이트
    renderPagination();
  };

  // =========================================
  // 이벤트 리스너 추가
  // =========================================
  const attachEventListeners = () => {
    const prevBtn = document.getElementById('paginationPrev');
    const nextBtn = document.getElementById('paginationNext');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
          showPage(currentPage - 1);
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
          showPage(currentPage + 1);
        }
      });
    }

    // 키보드 네비게이션
    document.addEventListener('keydown', (e) => {
      // 입력 필드에서는 키보드 네비게이션 비활성화
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // 왼쪽 화살표: 이전 페이지
      if (e.key === 'ArrowLeft' && currentPage > 1) {
        e.preventDefault();
        showPage(currentPage - 1);
      }

      // 오른쪽 화살표: 다음 페이지
      if (e.key === 'ArrowRight' && currentPage < totalPages) {
        e.preventDefault();
        showPage(currentPage + 1);
      }

      // Home: 첫 페이지
      if (e.key === 'Home') {
        e.preventDefault();
        showPage(1);
      }

      // End: 마지막 페이지
      if (e.key === 'End') {
        e.preventDefault();
        showPage(totalPages);
      }
    });
  };

  // =========================================
  // 초기화
  // =========================================
  const init = () => {
    initPagination();
  };

  // DOM 준비 완료 시 실행
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
