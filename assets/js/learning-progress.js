/* =========================================
   Learning Progress Visualization with D3.js
   ========================================= */

(function() {
  'use strict';

  // =========================================
  // 학습 진행 상황 시각화
  // =========================================
  const initLearningProgressChart = async () => {
    const chartContainer = document.getElementById('learningProgressChart');
    if (!chartContainer) return;

    try {
      // MCP 서버 데이터 로드 시도
      const response = await fetch('/.learning-history.json');

      if (!response.ok) {
        showEmptyState(chartContainer);
        return;
      }

      const data = await response.json();

      if (!data || !data.statistics || !data.statistics.topicProgress) {
        showEmptyState(chartContainer);
        return;
      }

      renderProgressChart(chartContainer, data);
      renderTopicBreakdown(data);
      renderRecentActivity(data);
    } catch (error) {
      console.error('학습 진행 상황 로드 실패:', error);
      showEmptyState(chartContainer);
    }
  };

  // =========================================
  // 빈 상태 표시
  // =========================================
  const showEmptyState = (container) => {
    container.innerHTML = `
      <div class="learning-progress-empty">
        <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p>학습 진행 데이터가 없습니다</p>
        <small>학습을 시작하면 여기에 진행 상황이 표시됩니다</small>
      </div>
    `;
  };

  // =========================================
  // D3.js로 진행률 차트 렌더링
  // =========================================
  const renderProgressChart = (container, data) => {
    const { topicProgress } = data.statistics;
    const progressData = Object.values(topicProgress)
      .filter(topic => topic.total > 0)
      .map(topic => ({
        topic: topic.topic,
        total: topic.total,
        completed: topic.completed,
        inProgress: topic.inProgress,
        notStarted: topic.notStarted,
        percentage: Math.round((topic.completed / topic.total) * 100)
      }))
      .sort((a, b) => b.percentage - a.percentage);

    if (progressData.length === 0) {
      showEmptyState(container);
      return;
    }

    // 컨테이너 초기화
    container.innerHTML = '';

    // SVG 크기 설정
    const margin = { top: 20, right: 30, bottom: 40, left: 120 };
    const width = Math.min(container.clientWidth, 800);
    const height = progressData.length * 60 + margin.top + margin.bottom;

    // D3.js SVG 생성
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'learning-progress-svg');

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // 스케일 설정
    const x = d3.scaleLinear()
      .domain([0, 100])
      .range([0, width - margin.left - margin.right]);

    const y = d3.scaleBand()
      .domain(progressData.map(d => d.topic))
      .range([0, height - margin.top - margin.bottom])
      .padding(0.3);

    // 색상 스케일
    const colorScale = d3.scaleSequential()
      .domain([0, 100])
      .interpolator(d3.interpolateRgb('#e5e7eb', '#10b981'));

    // 배경 바 (전체)
    g.selectAll('.bar-background')
      .data(progressData)
      .enter()
      .append('rect')
      .attr('class', 'bar-background')
      .attr('x', 0)
      .attr('y', d => y(d.topic))
      .attr('width', x(100))
      .attr('height', y.bandwidth())
      .attr('rx', 6)
      .attr('fill', 'var(--color-border)');

    // 진행률 바 (완료)
    g.selectAll('.bar-progress')
      .data(progressData)
      .enter()
      .append('rect')
      .attr('class', 'bar-progress')
      .attr('x', 0)
      .attr('y', d => y(d.topic))
      .attr('width', 0)
      .attr('height', y.bandwidth())
      .attr('rx', 6)
      .attr('fill', d => colorScale(d.percentage))
      .transition()
      .duration(1000)
      .ease(d3.easeCubicOut)
      .attr('width', d => x(d.percentage));

    // 주제 레이블
    g.selectAll('.label-topic')
      .data(progressData)
      .enter()
      .append('text')
      .attr('class', 'label-topic')
      .attr('x', -10)
      .attr('y', d => y(d.topic) + y.bandwidth() / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .style('font-size', '14px')
      .style('font-weight', '600')
      .style('fill', 'var(--color-text)')
      .text(d => d.topic);

    // 진행률 텍스트
    g.selectAll('.label-percentage')
      .data(progressData)
      .enter()
      .append('text')
      .attr('class', 'label-percentage')
      .attr('x', d => x(d.percentage) + 10)
      .attr('y', d => y(d.topic) + y.bandwidth() / 2)
      .attr('dominant-baseline', 'middle')
      .style('font-size', '13px')
      .style('font-weight', '600')
      .style('fill', 'var(--color-text-secondary)')
      .text(d => `${d.percentage}% (${d.completed}/${d.total})`);

    // 툴팁 추가
    const tooltip = d3.select(container)
      .append('div')
      .attr('class', 'learning-progress-tooltip')
      .style('opacity', 0);

    g.selectAll('.bar-progress')
      .on('mouseover', function(event, d) {
        d3.select(this).attr('opacity', 0.8);
        tooltip.transition()
          .duration(200)
          .style('opacity', 1);
        tooltip.html(`
          <strong>${d.topic}</strong><br/>
          완료: ${d.completed}개<br/>
          진행 중: ${d.inProgress}개<br/>
          미시작: ${d.notStarted}개<br/>
          전체: ${d.total}개
        `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 1);
        tooltip.transition()
          .duration(500)
          .style('opacity', 0);
      });
  };

  // =========================================
  // 주제별 분류 카드
  // =========================================
  const renderTopicBreakdown = (data) => {
    const container = document.getElementById('topicBreakdown');
    if (!container) return;

    const { topicProgress, totalDocuments, completedDocuments } = data.statistics;
    const overallPercentage = totalDocuments > 0
      ? Math.round((completedDocuments / totalDocuments) * 100)
      : 0;

    // 전체 통계 카드
    const overallCard = `
      <div class="topic-card overall">
        <div class="topic-card-header">
          <h4>전체 진행률</h4>
          <span class="topic-card-percentage">${overallPercentage}%</span>
        </div>
        <div class="topic-card-body">
          <div class="topic-card-stat">
            <span class="stat-label">전체 문서</span>
            <span class="stat-value">${totalDocuments}개</span>
          </div>
          <div class="topic-card-stat">
            <span class="stat-label">완료</span>
            <span class="stat-value">${completedDocuments}개</span>
          </div>
        </div>
        <div class="topic-card-progress">
          <div class="progress-bar" style="width: ${overallPercentage}%"></div>
        </div>
      </div>
    `;

    // 주제별 카드
    const topicCards = Object.values(topicProgress)
      .filter(topic => topic.total > 0)
      .sort((a, b) => (b.completed / b.total) - (a.completed / a.total))
      .map(topic => {
        const percentage = Math.round((topic.completed / topic.total) * 100);
        return `
          <div class="topic-card">
            <div class="topic-card-header">
              <h4>${topic.topic}</h4>
              <span class="topic-card-percentage">${percentage}%</span>
            </div>
            <div class="topic-card-body">
              <div class="topic-card-stat">
                <span class="stat-label">완료</span>
                <span class="stat-value">${topic.completed}개</span>
              </div>
              <div class="topic-card-stat">
                <span class="stat-label">진행 중</span>
                <span class="stat-value">${topic.inProgress}개</span>
              </div>
              <div class="topic-card-stat">
                <span class="stat-label">미시작</span>
                <span class="stat-value">${topic.notStarted}개</span>
              </div>
            </div>
            <div class="topic-card-progress">
              <div class="progress-bar" style="width: ${percentage}%"></div>
            </div>
          </div>
        `;
      }).join('');

    container.innerHTML = overallCard + topicCards;
  };

  // =========================================
  // 최근 활동 표시
  // =========================================
  const renderRecentActivity = (data) => {
    const container = document.getElementById('recentActivity');
    if (!container) return;

    const recentItems = data.items
      .filter(item => item.completedAt || item.lastReviewedAt)
      .sort((a, b) => {
        const dateA = new Date(a.completedAt || a.lastReviewedAt).getTime();
        const dateB = new Date(b.completedAt || b.lastReviewedAt).getTime();
        return dateB - dateA;
      })
      .slice(0, 5);

    if (recentItems.length === 0) {
      container.innerHTML = '<p class="recent-activity-empty">최근 활동이 없습니다</p>';
      return;
    }

    const activityHTML = recentItems.map(item => {
      const date = new Date(item.completedAt || item.lastReviewedAt);
      const formattedDate = date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      const statusBadge = item.completedAt ?
        '<span class="status-badge completed">완료</span>' :
        '<span class="status-badge reviewed">복습</span>';

      return `
        <div class="recent-activity-item">
          <div class="recent-activity-main">
            <h5>${item.title}</h5>
            <span class="recent-activity-topic">${item.topic}</span>
          </div>
          <div class="recent-activity-meta">
            ${statusBadge}
            <span class="recent-activity-date">${formattedDate}</span>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = activityHTML;
  };

  // =========================================
  // D3.js 동적 로드
  // =========================================
  const loadD3 = () => {
    return new Promise((resolve, reject) => {
      if (window.d3) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://d3js.org/d3.v7.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  // =========================================
  // 초기화
  // =========================================
  const init = async () => {
    const chartContainer = document.getElementById('learningProgressChart');
    if (!chartContainer) return;

    try {
      await loadD3();
      await initLearningProgressChart();
      console.log('✅ 학습 진행 상황 시각화 초기화 완료');
    } catch (error) {
      console.error('학습 진행 상황 시각화 초기화 실패:', error);
      showEmptyState(chartContainer);
    }
  };

  // DOM 준비 완료 시 실행
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  } 
})();
