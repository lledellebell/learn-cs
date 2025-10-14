/**
 * 홈 페이지 학습 진행 상황
 * 홈 페이지에 진행률 개요와 차트를 표시합니다
 */

(function() {
  'use strict';

  // 상태 관리
  let graphData = null;
  let historyData = null;

  /**
   * 홈 진행 상황 섹션 초기화
   */
  async function init() {
    try {
      // 데이터 로드
      await Promise.all([
        loadGraphData(),
        loadHistoryData()
      ]);

      // UI 업데이트
      updateProgressCards();
      renderTopicProgressChart();
      renderActivityChart();
      updateQuickStats();
    } catch (error) {
      console.error('홈 진행 상황 초기화 실패:', error);
    }
  }

  /**
   * 지식 그래프 데이터 로드
   */
  async function loadGraphData() {
    try {
      const baseUrl = document.querySelector('base')?.href || window.location.origin;
      const dataUrl = new URL('/learn-cs/assets/data/knowledge-graph.json', baseUrl).href;
      const response = await fetch(dataUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      graphData = await response.json();
    } catch (error) {
      console.error('그래프 데이터 로드 실패:', error);
      graphData = { nodes: [], edges: [], statistics: {}, learningHistory: {} };
    }
  }

  /**
   * 학습 히스토리 데이터 로드
   */
  async function loadHistoryData() {
    try {
      const baseUrl = document.querySelector('base')?.href || window.location.origin;
      const dataUrl = new URL('/learn-cs/.learning-history.json', baseUrl).href;
      const response = await fetch(dataUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      historyData = await response.json();
    } catch (error) {
      console.error('히스토리 데이터 로드 실패:', error);
      historyData = {};
    }
  }

  /**
   * 진행률 개요 카드 업데이트
   */
  function updateProgressCards() {
    if (!graphData || !graphData.statistics) return;

    const stats = graphData.statistics;
    const totalDocs = stats.totalDocuments || 0;
    const completedDocs = stats.completedDocuments || Object.keys(historyData || {}).length;
    const progressPercent = stats.progressPercent || 0;
    const activeDays = calculateActiveDays();

    // 값 업데이트
    updateElement('homeProgressPercent', `${progressPercent}%`);
    updateElement('homeCompletedDocs', completedDocs);
    updateElement('homeActiveDays', activeDays);
  }

  /**
   * 활성 학습 일수 계산
   */
  function calculateActiveDays() {
    if (!historyData) return 0;

    const dates = new Set();
    Object.values(historyData).forEach(entry => {
      if (entry.date) {
        dates.add(entry.date.split('T')[0]);
      }
    });

    return dates.size;
  }

  /**
   * 주제별 진행률 차트 렌더링 (바 차트)
   */
  function renderTopicProgressChart() {
    const container = document.getElementById('homeTopicProgressChart');
    if (!container || !graphData || !graphData.statistics) return;

    const topicProgress = graphData.statistics.topicProgress || {};
    const topicEntries = Object.entries(topicProgress)
      .map(([topic, data]) => ({
        topic,
        total: data.total || 0,
        completed: data.completed || 0,
        progressPercent: data.progressPercent || 0
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);

    if (topicEntries.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: #666;">데이터가 없습니다</p>';
      return;
    }

    const margin = { top: 10, right: 50, bottom: 40, left: 100 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 230 - margin.top - margin.bottom;

    // 컨테이너 초기화
    container.innerHTML = '';

    // SVG 생성
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // 스케일 설정
    const x = d3.scaleLinear()
      .domain([0, 100])
      .range([0, width]);

    const y = d3.scaleBand()
      .domain(topicEntries.map(d => d.topic))
      .range([0, height])
      .padding(0.3);

    // 배경 바 (회색)
    svg.selectAll('.bg-bar')
      .data(topicEntries)
      .enter()
      .append('rect')
      .attr('class', 'bg-bar')
      .attr('x', 0)
      .attr('y', d => y(d.topic))
      .attr('width', width)
      .attr('height', y.bandwidth())
      .attr('fill', '#f3f4f6')
      .attr('rx', 4);

    // 진행률 바
    svg.selectAll('.progress-bar')
      .data(topicEntries)
      .enter()
      .append('rect')
      .attr('class', 'progress-bar')
      .attr('x', 0)
      .attr('y', d => y(d.topic))
      .attr('width', d => x(d.progressPercent))
      .attr('height', y.bandwidth())
      .attr('fill', 'var(--color-primary)')
      .attr('rx', 4);

    // 진행률 텍스트
    svg.selectAll('.progress-text')
      .data(topicEntries)
      .enter()
      .append('text')
      .attr('class', 'progress-text')
      .attr('x', width + 5)
      .attr('y', d => y(d.topic) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('font-size', '11px')
      .attr('fill', '#666')
      .text(d => `${d.completed}/${d.total}`);

    // Y축 추가
    svg.append('g')
      .call(d3.axisLeft(y))
      .selectAll('text')
      .attr('font-size', '12px')
      .attr('fill', '#333');

    // 도메인 라인 제거
    svg.select('.domain').remove();
    svg.selectAll('.tick line').remove();
  }

  /**
   * 최근 7일 활동 차트 렌더링 (라인 차트)
   */
  function renderActivityChart() {
    const container = document.getElementById('homeActivityChart');
    if (!container || !historyData) return;

    // 최근 7일 활동 가져오기
    const activityByDate = {};
    Object.values(historyData).forEach(entry => {
      if (entry.date) {
        const date = entry.date.split('T')[0];
        activityByDate[date] = (activityByDate[date] || 0) + 1;
      }
    });

    // 최근 7일 날짜 생성
    const today = new Date();
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      last7Days.push({
        date: dateStr,
        count: activityByDate[dateStr] || 0,
        label: date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
      });
    }

    const maxCount = Math.max(...last7Days.map(d => d.count), 1);
    const margin = { top: 10, right: 10, bottom: 30, left: 30 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 230 - margin.top - margin.bottom;

    // 컨테이너 초기화
    container.innerHTML = '';

    // SVG 생성
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // 스케일 설정
    const x = d3.scalePoint()
      .domain(last7Days.map(d => d.label))
      .range([0, width])
      .padding(0.5);

    const y = d3.scaleLinear()
      .domain([0, maxCount])
      .range([height, 0]);

    // 라인 생성기
    const line = d3.line()
      .x(d => x(d.label))
      .y(d => y(d.count))
      .curve(d3.curveMonotoneX);

    // 영역 생성기
    const area = d3.area()
      .x(d => x(d.label))
      .y0(height)
      .y1(d => y(d.count))
      .curve(d3.curveMonotoneX);

    // 영역 추가
    svg.append('path')
      .datum(last7Days)
      .attr('fill', 'var(--color-primary)')
      .attr('fill-opacity', 0.1)
      .attr('d', area);

    // 라인 추가
    svg.append('path')
      .datum(last7Days)
      .attr('fill', 'none')
      .attr('stroke', 'var(--color-primary)')
      .attr('stroke-width', 2)
      .attr('d', line);

    // 점 추가
    svg.selectAll('.dot')
      .data(last7Days)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', d => x(d.label))
      .attr('cy', d => y(d.count))
      .attr('r', 4)
      .attr('fill', 'var(--color-primary)');

    // X축 추가
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('font-size', '10px')
      .attr('fill', '#666');

    // Y축 추가
    svg.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .selectAll('text')
      .attr('font-size', '10px')
      .attr('fill', '#666');

    // 도메인 라인 제거
    svg.selectAll('.domain').remove();
    svg.selectAll('.tick line').attr('stroke', '#e5e5e5');
  }

  /**
   * 퀵 통계 업데이트
   */
  function updateQuickStats() {
    // 연속 학습 일수 계산
    const streak = calculateStreak();
    updateElement('homeStreak', `${streak}일`);

    // 전체 문서 수
    const totalDocs = graphData?.statistics?.totalDocuments || 0;
    updateElement('homeTotalDocs', totalDocs);

    // 평균 학습 시간 (추정)
    const avgTime = calculateAverageTime();
    updateElement('homeAvgTime', avgTime);

    // 주간 목표 (최근 7일 활동 / 권장 목표)
    const weeklyGoal = calculateWeeklyGoal();
    updateElement('homeWeeklyGoal', weeklyGoal);
  }

  /**
   * 학습 연속 일수 계산
   */
  function calculateStreak() {
    if (!historyData) return 0;

    const dates = Object.values(historyData)
      .map(entry => entry.date ? entry.date.split('T')[0] : null)
      .filter(Boolean)
      .sort()
      .reverse();

    if (dates.length === 0) return 0;

    const uniqueDates = [...new Set(dates)];

    let streak = 0;
    let checkDate = new Date();

    for (let i = 0; i < 365; i++) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (uniqueDates.includes(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * 평균 학습 시간 계산
   */
  function calculateAverageTime() {
    if (!historyData || Object.keys(historyData).length === 0) return '-';

    // 완료된 문서 기반 추정
    const completedCount = Object.keys(historyData).length;
    const avgMinutes = completedCount > 0 ? Math.round((completedCount * 15) / completedCount) : 0;

    return `${avgMinutes}분`;
  }

  /**
   * 주간 목표 진행 상황 계산
   */
  function calculateWeeklyGoal() {
    if (!historyData) return '0/7';

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];

    const thisWeekCount = Object.values(historyData).filter(entry => {
      if (!entry.date) return false;
      const entryDate = entry.date.split('T')[0];
      return entryDate >= weekAgoStr;
    }).length;

    return `${thisWeekCount}/7`;
  }

  /**
   * 엘리먼트 텍스트 내용 업데이트
   */
  function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  }

  // DOM 준비되면 초기화
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
