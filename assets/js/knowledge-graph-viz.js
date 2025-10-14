/**
 * Knowledge Graph Visualization
 *
 * private/mcp-servers/knowledge-graph의 데이터를 활용한
 * 학습 진행 상황 시각화
 */

(function() {
  'use strict';

  let graphData = null;
  let currentView = 'force';
  let currentTopic = 'all';

  // 데이터 로드
  async function loadGraphData() {
    try {
      const baseUrl = document.querySelector('base')?.href || window.location.origin;
      const dataUrl = new URL('/learn-cs/assets/data/knowledge-graph.json', baseUrl).href;
      const response = await fetch(dataUrl);
      if (!response.ok) {
        throw new Error('Knowledge graph data not found');
      }
      graphData = await response.json();
      initializePage();
    } catch (error) {
      console.error('Failed to load knowledge graph data:', error);
      showError('지식 그래프 데이터를 불러오지 못했습니다. 스크립트를 실행해주세요: npm run graph:generate');
    }
  }

  // 페이지 초기화
  function initializePage() {
    updateOverviewCards();
    populateFilters();
    renderKnowledgeGraph();
    renderTopicClusters();
    renderHubDocuments();
    renderIsolatedDocuments();
    renderRecentActivity();
    setupEventListeners();
  }

  // 개요 카드 업데이트
  function updateOverviewCards() {
    const { statistics, learningHistory, nodes } = graphData;

    // 학습 완료된 문서 수
    const completedDocs = learningHistory ? learningHistory.length : 0;
    const totalDocs = nodes.length;
    const progressPercent = totalDocs > 0 ? Math.round((completedDocs / totalDocs) * 100) : 0;

    setElementText('totalDocs', totalDocs);
    setElementText('completedDocs', completedDocs);
    setElementText('progressPercent', `${progressPercent}%`);
    setElementText('avgConnections', statistics.averageConnections);
  }

  // 필터 옵션 채우기
  function populateFilters() {
    const { clusters, nodes } = graphData;

    // 주제 필터
    const topicFilter = document.getElementById('topicFilter');
    if (topicFilter) {
      clusters.forEach(cluster => {
        const option = document.createElement('option');
        option.value = cluster.id;
        option.textContent = `${cluster.topic} (${cluster.documents.length})`;
        topicFilter.appendChild(option);
      });
    }

    // 문서 선택 옵션
    const startDoc = document.getElementById('startDoc');
    const endDoc = document.getElementById('endDoc');

    if (startDoc && endDoc) {
      nodes.forEach(node => {
        const option1 = document.createElement('option');
        option1.value = node.id;
        option1.textContent = node.title;
        startDoc.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = node.id;
        option2.textContent = node.title;
        endDoc.appendChild(option2);
      });
    }
  }

  // 지식 그래프 시각화
  function renderKnowledgeGraph() {
    const container = document.getElementById('knowledgeGraphViz');
    if (!container) return;

    container.innerHTML = '';

    const { nodes, edges } = getFilteredData();

    const width = container.clientWidth || 800;
    const height = 600;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    // 줌 설정
    const g = svg.append('g');
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    svg.call(zoom);

    // 시뮬레이션 설정
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(edges)
        .id(d => d.id)
        .distance(d => 100 / (d.strength || 0.5)))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    // 링크 그리기
    const link = g.append('g')
      .selectAll('line')
      .data(edges)
      .join('line')
      .attr('stroke', d => getLinkColor(d.type))
      .attr('stroke-width', d => Math.sqrt(d.strength) * 2)
      .attr('stroke-opacity', 0.6);

    // 노드 그리기
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(drag(simulation));

    // 노드 원
    node.append('circle')
      .attr('r', d => 5 + (d.difficulty || 1) * 2)
      .attr('fill', d => getNodeColor(d.topic))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // 노드 라벨
    node.append('text')
      .text(d => d.title)
      .attr('x', 10)
      .attr('y', 3)
      .attr('font-size', '10px')
      .attr('fill', '#333');

    // 툴팁
    node.append('title')
      .text(d => `${d.title}\n난이도: ${d.difficulty || 1}/5\n단어 수: ${d.wordCount}`);

    // 시뮬레이션 업데이트
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });
  }

  // 드래그 핸들러
  function drag(simulation) {
    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);
  }

  // 필터링된 데이터 가져오기
  function getFilteredData() {
    let { nodes, edges } = graphData;

    if (currentTopic !== 'all') {
      nodes = nodes.filter(n => n.topic === currentTopic);
      const nodeIds = new Set(nodes.map(n => n.id));
      edges = edges.filter(e => nodeIds.has(e.source.id || e.source) && nodeIds.has(e.target.id || e.target));
    }

    return { nodes: nodes.map(n => ({ ...n })), edges: edges.map(e => ({ ...e })) };
  }

  // 주제별 클러스터 렌더링
  function renderTopicClusters() {
    const container = document.getElementById('topicClusters');
    if (!container) return;

    const { clusters, learningHistory } = graphData;

    container.innerHTML = clusters.map(cluster => {
      const completed = cluster.documents.filter(docId =>
        learningHistory && learningHistory.some(h => h.filePath === docId)
      ).length;
      const progress = Math.round((completed / cluster.documents.length) * 100);

      return `
        <div class="cluster-card">
          <h3 class="cluster-title">${cluster.topic}</h3>
          <div class="cluster-stats">
            <div class="stat">
              <span class="stat-label">문서</span>
              <span class="stat-value">${cluster.documents.length}</span>
            </div>
            <div class="stat">
              <span class="stat-label">완료</span>
              <span class="stat-value">${completed}</span>
            </div>
          </div>
          <div class="cluster-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            <span class="progress-text">${progress}%</span>
          </div>
          <div class="cluster-keywords">
            ${cluster.keywords.slice(0, 5).map(k => `<span class="keyword-tag">${k}</span>`).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  // 핵심 문서 렌더링
  function renderHubDocuments() {
    const container = document.getElementById('hubDocuments');
    if (!container) return;

    const { statistics } = graphData;

    container.innerHTML = statistics.mostConnectedDocs
      .slice(0, 10)
      .map((doc, index) => `
        <div class="hub-item">
          <div class="hub-rank">#${index + 1}</div>
          <div class="hub-content">
            <a href="/${doc.id}" class="hub-title">${doc.title}</a>
            <div class="hub-connections">${doc.connections}개의 연결</div>
          </div>
        </div>
      `).join('');
  }

  // 고립된 문서 렌더링
  function renderIsolatedDocuments() {
    const container = document.getElementById('isolatedDocuments');
    if (!container) return;

    const { statistics, nodes } = graphData;

    if (statistics.isolatedDocs.length === 0) {
      container.innerHTML = '<p class="empty-message">모든 문서가 다른 문서와 연결되어 있습니다! 🎉</p>';
      return;
    }

    container.innerHTML = statistics.isolatedDocs
      .slice(0, 10)
      .map(docId => {
        const node = nodes.find(n => n.id === docId);
        return `
          <div class="isolated-item">
            <a href="/${docId}" class="isolated-title">${node?.title || docId}</a>
            <span class="isolated-topic">${node?.topic || ''}</span>
          </div>
        `;
      }).join('');
  }

  // 최근 활동 렌더링
  function renderRecentActivity() {
    const container = document.getElementById('recentActivity');
    if (!container) return;

    const { learningHistory } = graphData;

    if (!learningHistory || learningHistory.length === 0) {
      container.innerHTML = '<p class="empty-message">아직 학습 기록이 없습니다.</p>';
      return;
    }

    const recent = learningHistory
      .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified))
      .slice(0, 10);

    container.innerHTML = recent.map(item => {
      const date = new Date(item.lastModified);
      const relativeTime = getRelativeTime(date);

      return `
        <div class="activity-item">
          <div class="activity-icon">📝</div>
          <div class="activity-content">
            <a href="/${item.filePath}" class="activity-title">${item.title || item.filePath}</a>
            <div class="activity-time">${relativeTime}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  // 학습 경로 찾기
  async function findLearningPath() {
    const startId = document.getElementById('startDoc').value;
    const endId = document.getElementById('endDoc').value;
    const resultContainer = document.getElementById('learningPathResult');

    if (!startId || !endId) {
      resultContainer.innerHTML = '<p class="error-message">시작 문서와 목표 문서를 모두 선택해주세요.</p>';
      return;
    }

    if (startId === endId) {
      resultContainer.innerHTML = '<p class="error-message">시작 문서와 목표 문서가 같습니다.</p>';
      return;
    }

    const path = findShortestPath(startId, endId);

    if (!path) {
      resultContainer.innerHTML = '<p class="error-message">두 문서를 연결하는 경로를 찾을 수 없습니다.</p>';
      return;
    }

    resultContainer.innerHTML = `
      <div class="path-summary">
        <div class="path-stat">
          <span class="path-stat-label">총 단계:</span>
          <span class="path-stat-value">${path.length}단계</span>
        </div>
        <div class="path-stat">
          <span class="path-stat-label">예상 소요 시간:</span>
          <span class="path-stat-value">${estimateTime(path)}</span>
        </div>
      </div>
      <div class="path-steps">
        ${path.map((nodeId, index) => {
          const node = graphData.nodes.find(n => n.id === nodeId);
          return `
            <div class="path-step">
              <div class="step-number">${index + 1}</div>
              <div class="step-content">
                <a href="/${nodeId}" class="step-title">${node?.title || nodeId}</a>
                <div class="step-difficulty">난이도: ${'⭐'.repeat(node?.difficulty || 1)}</div>
              </div>
              ${index < path.length - 1 ? '<div class="step-arrow">↓</div>' : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // 최단 경로 찾기 (BFS)
  function findShortestPath(startId, endId) {
    const { edges, nodes } = graphData;

    // 인접 리스트 생성
    const adjacency = new Map();
    nodes.forEach(node => adjacency.set(node.id, []));
    edges.forEach(edge => {
      const sourceId = edge.source.id || edge.source;
      const targetId = edge.target.id || edge.target;
      if (!adjacency.get(sourceId).includes(targetId)) {
        adjacency.get(sourceId).push(targetId);
      }
      if (!adjacency.get(targetId).includes(sourceId)) {
        adjacency.get(targetId).push(sourceId);
      }
    });

    // BFS
    const queue = [[startId]];
    const visited = new Set([startId]);

    while (queue.length > 0) {
      const path = queue.shift();
      const node = path[path.length - 1];

      if (node === endId) {
        return path;
      }

      const neighbors = adjacency.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([...path, neighbor]);
        }
      }
    }

    return null;
  }

  // 헬퍼 함수들
  function getNodeColor(topic) {
    const colors = {
      'languages': '#FF6B6B',
      'algorithms': '#4ECDC4',
      'data-structures': '#45B7D1',
      'web-development': '#FFA07A',
      'database': '#98D8C8',
      'system-design': '#C7CEEA'
    };
    return colors[topic] || '#95A5A6';
  }

  function getLinkColor(type) {
    const colors = {
      'direct_link': '#2C3E50',
      'keyword_similarity': '#7F8C8D',
      'concept_relation': '#BDC3C7',
      'prerequisite': '#E74C3C'
    };
    return colors[type] || '#95A5A6';
  }

  function getRelativeTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '어제';
    if (diffDays < 7) return `${diffDays}일 전`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
    return `${Math.floor(diffDays / 30)}개월 전`;
  }

  function estimateTime(path) {
    const { nodes } = graphData;
    let totalMinutes = 0;

    path.forEach(nodeId => {
      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        // 난이도와 단어 수 기반 예상 시간
        totalMinutes += (node.difficulty || 1) * 10 + node.wordCount / 200;
      }
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);

    if (hours > 0) {
      return `약 ${hours}시간 ${minutes}분`;
    }
    return `약 ${minutes}분`;
  }

  function setElementText(id, text) {
    const element = document.getElementById(id);
    if (element) element.textContent = text;
  }

  function showError(message) {
    const container = document.querySelector('.learning-progress-page');
    if (!container) return;

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-banner';
    errorDiv.textContent = message;
    container.prepend(errorDiv);
  }

  // 이벤트 리스너 설정
  function setupEventListeners() {
    const topicFilter = document.getElementById('topicFilter');
    if (topicFilter) {
      topicFilter.addEventListener('change', (e) => {
        currentTopic = e.target.value;
        renderKnowledgeGraph();
      });
    }

    const viewMode = document.getElementById('viewMode');
    if (viewMode) {
      viewMode.addEventListener('change', (e) => {
        currentView = e.target.value;
        renderKnowledgeGraph();
      });
    }

    const findPathBtn = document.getElementById('findPathBtn');
    if (findPathBtn) {
      findPathBtn.addEventListener('click', findLearningPath);
    }
  }

  // 페이지 로드 시 실행
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadGraphData);
  } else {
    loadGraphData();
  }
})();
