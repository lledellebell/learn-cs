/**
 * GitHub Issues Reactions 통합
 * GitHub issue의 reactions를 가져와서 표시하고 자동 업데이트
 */

(function() {
  'use strict';

  const REPO_OWNER = 'lledellebell';
  const REPO_NAME = 'learn-cs';
  const GITHUB_API_BASE = 'https://api.github.com';

  // 고정 이모지 목록 (GitHub API reaction 타입과 매핑됨)
  const EMOJI_OPTIONS = {
    '+1': { emoji: '👍', label: '좋아요' },
    'heart': { emoji: '❤️', label: '사랑해요' },
    'laugh': { emoji: '😊', label: '웃겨요' },
    'hooray': { emoji: '🎉', label: '축하해요' },
    'rocket': { emoji: '🚀', label: '대단해요' },
    'eyes': { emoji: '👀', label: '눈여겨봐요' }
  };

  let issueNumber = null;
  let issueUrl = null;
  let updateInterval = null;
  const UPDATE_INTERVAL_MS = 30000; // 30초마다 업데이트

  /**
   * GitHub Issues API에서 issue 번호 찾기
   */
  async function findIssueNumber() {
    const pathname = window.location.pathname;

    try {
      // pathname으로 issue 검색
      const searchQuery = encodeURIComponent(`repo:${REPO_OWNER}/${REPO_NAME} "${pathname}" in:title label:"💬 comment"`);
      const searchUrl = `${GITHUB_API_BASE}/search/issues?q=${searchQuery}`;

      const response = await fetch(searchUrl);
      if (!response.ok) {
        throw new Error('Issue 검색 실패');
      }

      const data = await response.json();

      if (data.items && data.items.length > 0) {
        // 정확히 일치하는 issue 찾기
        const issue = data.items.find(item =>
          item.title === pathname ||
          item.body?.includes(pathname)
        );

        if (issue) {
          return {
            number: issue.number,
            url: issue.html_url
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Issue 찾기 오류:', error);
      return null;
    }
  }

  /**
   * GitHub API에서 reactions 가져오기
   */
  async function fetchReactions(issueNum) {
    try {
      const url = `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/issues/${issueNum}/reactions`;
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/vnd.github.squirrel-girl-preview+json'
        }
      });

      if (!response.ok) {
        throw new Error('Reactions 가져오기 실패');
      }

      const reactions = await response.json();
      return reactions;
    } catch (error) {
      console.error('Reactions 가져오기 오류:', error);
      return [];
    }
  }

  /**
   * Reactions를 타입별로 카운트
   */
  function countReactions(reactions) {
    const counts = {
      '+1': 0,
      'heart': 0,
      'laugh': 0,
      'hooray': 0,
      'rocket': 0,
      'eyes': 0
    };

    reactions.forEach(reaction => {
      if (counts.hasOwnProperty(reaction.content)) {
        counts[reaction.content]++;
      }
    });

    return counts;
  }

  /**
   * UI 업데이트 (reaction 카운트 표시)
   */
  function updateUI(reactionCounts) {
    const buttons = document.querySelectorAll('.reaction-btn');
    let totalCount = 0;

    buttons.forEach(btn => {
      const reactionType = btn.getAttribute('data-reaction');
      const count = reactionCounts[reactionType] || 0;
      const countEl = btn.querySelector('.reaction-count');

      if (countEl) {
        countEl.textContent = count;
      }

      totalCount += count;

      // GitHub으로 이동한다는 것을 툴팁에 표시
      const label = EMOJI_OPTIONS[reactionType]?.label || '';
      btn.title = `${label} (GitHub에서 반응하기)`;
    });

    // 총 반응 수를 제목에 표시
    const totalText = document.getElementById('reactionsTotalText');
    if (totalText) {
      if (totalCount > 0) {
        totalText.textContent = `반응 ${totalCount}개`;
      } else {
        totalText.textContent = '반응';
      }
    }

    // 로딩 완료 후 섹션 표시
    const reactionsSection = document.getElementById('reactionsSection');
    if (reactionsSection) {
      reactionsSection.style.opacity = '1';
    }
  }

  /**
   * Reaction 버튼 클릭 핸들러
   */
  function handleReactionClick(event) {
    event.preventDefault();

    if (!issueUrl) {
      alert('아직 GitHub 이슈가 생성되지 않았습니다. 먼저 댓글을 작성해주세요!');
      // 댓글 섹션으로 스크롤
      const commentsSection = document.querySelector('.comments-section');
      if (commentsSection) {
        commentsSection.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    // GitHub issue를 새 탭에서 열기
    window.open(issueUrl, '_blank', 'noopener,noreferrer');
  }

  /**
   * Reaction 버튼 렌더링
   */
  function renderReactionButtons() {
    const container = document.getElementById('reactionsContainer');
    if (!container) return;

    container.innerHTML = '';

    Object.entries(EMOJI_OPTIONS).forEach(([reactionType, option]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'reaction-btn';
      button.setAttribute('data-reaction', reactionType);
      button.setAttribute('aria-label', option.label);
      button.title = option.label;

      button.innerHTML = `
        <span class="reaction-emoji">${option.emoji}</span>
        <span class="reaction-count">0</span>
      `;

      button.addEventListener('click', handleReactionClick);
      container.appendChild(button);
    });
  }

  /**
   * 설명 텍스트 추가
   */
  function addExplanation() {
    const reactionsSection = document.getElementById('reactionsSection');
    if (!reactionsSection) return;

    const explanation = document.createElement('p');
    explanation.className = 'reactions-explanation';
    explanation.innerHTML = '<svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16" style="vertical-align: text-bottom; margin-right: 4px;"><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/></svg>' +
                           '반응을 클릭하면 GitHub 이슈로 이동하여 직접 반응할 수 있습니다.';

    const container = reactionsSection.querySelector('.reactions-container');
    if (container) {
      reactionsSection.insertBefore(explanation, container);
    }
  }

  /**
   * Reactions 데이터 업데이트
   */
  async function updateReactions() {
    if (!issueNumber) {
      // Issue를 다시 찾기 시도 (방금 생성된 경우)
      const issueInfo = await findIssueNumber();
      if (issueInfo) {
        issueNumber = issueInfo.number;
        issueUrl = issueInfo.url;
      } else {
        return; // 아직 issue가 없음
      }
    }

    // Reactions 가져오기 및 표시
    const reactions = await fetchReactions(issueNumber);
    const reactionCounts = countReactions(reactions);
    updateUI(reactionCounts);
  }

  /**
   * 자동 업데이트 시작
   */
  function startAutoUpdate() {
    // 기존 interval 제거
    if (updateInterval) {
      clearInterval(updateInterval);
    }

    // 새 interval 설정
    updateInterval = setInterval(async () => {
      await updateReactions();
    }, UPDATE_INTERVAL_MS);

    console.log(`자동 업데이트 시작: ${UPDATE_INTERVAL_MS / 1000}초마다 갱신`);
  }

  /**
   * 자동 업데이트 중지
   */
  function stopAutoUpdate() {
    if (updateInterval) {
      clearInterval(updateInterval);
      updateInterval = null;
      console.log('자동 업데이트 중지');
    }
  }

  /**
   * 페이지 가시성 변경 핸들러
   */
  function handleVisibilityChange() {
    if (document.hidden) {
      // 페이지가 숨겨짐 - 업데이트 중지
      stopAutoUpdate();
    } else {
      // 페이지가 보임 - 업데이트 재개 및 즉시 갱신
      updateReactions();
      startAutoUpdate();
    }
  }

  /**
   * 초기화
   */
  async function init() {
    // DOM 준비 대기
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    const reactionsSection = document.getElementById('reactionsSection');
    if (!reactionsSection) {
      return;
    }

    // 초기 로딩 상태
    reactionsSection.style.opacity = '0.5';

    // UI 요소 추가
    addExplanation();
    renderReactionButtons();

    // Issue 찾기 시도
    const issueInfo = await findIssueNumber();

    if (issueInfo) {
      issueNumber = issueInfo.number;
      issueUrl = issueInfo.url;

      // Reactions 가져오기 및 표시
      const reactions = await fetchReactions(issueNumber);
      const reactionCounts = countReactions(reactions);
      updateUI(reactionCounts);

      // 자동 업데이트 시작
      startAutoUpdate();
    } else {
      // 아직 issue가 없음
      console.log('아직 GitHub issue가 없습니다. 댓글 작성 후 반응이 표시됩니다.');
      updateUI({});

      // Issue가 생성될 수 있으니 계속 시도
      startAutoUpdate();
    }

    // 페이지 가시성 변경 감지
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 페이지 언로드 시 정리
    window.addEventListener('beforeunload', stopAutoUpdate);
  }

  // 초기화 실행
  init();
})();
