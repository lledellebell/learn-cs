#!/usr/bin/env node

/**
 * Knowledge Graph 데이터 생성 스크립트
 *
 * private/mcp-servers/knowledge-graph를 사용하여
 * 학습 진행 상황을 추적할 수 있는 데이터를 생성합니다.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');
const GRAPH_SERVER_PATH = path.join(ROOT_DIR, 'private/mcp-servers/knowledge-graph/dist/index.js');
const OUTPUT_FILE = path.join(ROOT_DIR, 'assets/data/knowledge-graph.json');

/**
 * MCP 서버를 호출하여 knowledge graph 데이터를 가져옵니다
 */
async function generateKnowledgeGraph() {
  console.log('🔍 Generating knowledge graph data...');

  try {
    // knowledge-graph 서버가 존재하는지 확인
    if (!fs.existsSync(GRAPH_SERVER_PATH)) {
      console.error('❌ Knowledge graph server not found at:', GRAPH_SERVER_PATH);
      console.log('   Please build the server first: cd private/mcp-servers/knowledge-graph && npm run build');
      process.exit(1);
    }

    // 모든 문서를 스캔하여 그래프 생성
    const graphData = await scanDocumentsAndBuildGraph();

    // 출력 디렉토리 생성
    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // JSON 파일로 저장
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(graphData, null, 2));

    console.log('✅ Knowledge graph generated successfully!');
    console.log(`   Output: ${OUTPUT_FILE}`);
    console.log(`   Nodes: ${graphData.nodes.length}`);
    console.log(`   Edges: ${graphData.edges.length}`);
    console.log(`   Clusters: ${graphData.clusters.length}`);

  } catch (error) {
    console.error('❌ Error generating knowledge graph:', error.message);
    process.exit(1);
  }
}

/**
 * 문서를 스캔하고 그래프를 구축합니다
 */
async function scanDocumentsAndBuildGraph() {
  const nodes = [];
  const edges = [];
  const clusters = new Map();

  // 모든 마크다운 파일 찾기
  const docs = findAllMarkdownFiles(ROOT_DIR);

  console.log(`📚 Found ${docs.length} documents`);

  // 각 문서 파싱
  for (const docPath of docs) {
    const node = parseDocument(docPath);
    if (node) {
      nodes.push(node);

      // 클러스터에 추가
      if (!clusters.has(node.topic)) {
        clusters.set(node.topic, {
          id: node.topic,
          topic: node.topic,
          documents: [],
          keywords: new Set(),
          centrality: 0
        });
      }
      clusters.get(node.topic).documents.push(node.id);
    }
  }

  // 노드 간 관계 생성
  for (const sourceNode of nodes) {
    for (const targetId of sourceNode.links) {
      const targetNode = nodes.find(n => n.id === targetId || n.filePath.includes(targetId));
      if (targetNode) {
        edges.push({
          source: sourceNode.id,
          target: targetNode.id,
          type: 'direct_link',
          strength: 1.0
        });
      }
    }

    // 키워드 유사도 기반 관계
    for (const otherNode of nodes) {
      if (sourceNode.id === otherNode.id) continue;

      const similarity = calculateJaccardSimilarity(
        sourceNode.keywords,
        otherNode.keywords
      );

      if (similarity > 0.3) {
        edges.push({
          source: sourceNode.id,
          target: otherNode.id,
          type: 'keyword_similarity',
          strength: similarity,
          keywords: sourceNode.keywords.filter(k => otherNode.keywords.includes(k))
        });
      }
    }
  }

  // 클러스터 정보 계산
  const clusterArray = Array.from(clusters.values()).map(cluster => {
    // 클러스터의 모든 키워드 수집
    const allKeywords = new Set();
    cluster.documents.forEach(docId => {
      const node = nodes.find(n => n.id === docId);
      if (node) {
        node.keywords.forEach(k => allKeywords.add(k));
      }
    });

    return {
      ...cluster,
      keywords: Array.from(allKeywords).slice(0, 10),
      centrality: cluster.documents.length
    };
  });

  // learning-history 데이터 로드
  const learningHistory = loadLearningHistory();

  // 통계 및 추천 계산
  const statistics = calculateStatistics(nodes, edges, learningHistory);
  const recommendations = generateRecommendations(nodes, edges, learningHistory, statistics);

  return {
    nodes,
    edges,
    clusters: clusterArray,
    statistics,
    recommendations,
    learningHistory,
    generatedAt: new Date().toISOString()
  };
}

/**
 * 모든 마크다운 파일 찾기
 */
function findAllMarkdownFiles(dir, excludeDirs = ['node_modules', '_site', '.git', 'private']) {
  const files = [];

  function scanDir(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (!excludeDirs.includes(item)) {
          scanDir(fullPath);
        }
      } else if (item.endsWith('.md') && !item.startsWith('_')) {
        files.push(fullPath);
      }
    }
  }

  scanDir(dir);
  return files;
}

/**
 * 문서 파싱
 */
function parseDocument(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(ROOT_DIR, filePath);

    // YAML front matter 추출
    const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    let title = path.basename(filePath, '.md');
    let topic = relativePath.split(path.sep)[0];

    if (frontMatterMatch) {
      const frontMatter = frontMatterMatch[1];
      const titleMatch = frontMatter.match(/title:\s*["']?(.+?)["']?\s*$/m);
      const categoryMatch = frontMatter.match(/category:\s*["']?(.+?)["']?\s*$/m);

      if (titleMatch) title = titleMatch[1];
      if (categoryMatch) topic = categoryMatch[1];
    }

    // 링크 추출
    const links = extractLinks(content);

    // 키워드 추출
    const keywords = extractKeywords(content);

    // 개념 추출 (헤더와 강조 텍스트)
    const concepts = extractConcepts(content);

    // 난이도 추정
    const difficulty = estimateDifficulty(content, keywords, concepts);

    return {
      id: relativePath,
      title,
      filePath: relativePath,
      topic,
      links,
      backlinks: [],
      keywords,
      concepts,
      difficulty,
      wordCount: content.split(/\s+/).length
    };
  } catch (error) {
    console.warn(`⚠️  Failed to parse ${filePath}:`, error.message);
    return null;
  }
}

/**
 * 마크다운 링크 추출
 */
function extractLinks(content) {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const links = [];
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    const link = match[2];
    // 내부 링크만 (외부 URL 제외)
    if (!link.startsWith('http') && link.endsWith('.md')) {
      links.push(link.replace(/^\.\//, ''));
    }
  }

  return links;
}

/**
 * 키워드 추출 (간단한 TF-IDF 스타일)
 */
function extractKeywords(content) {
  // 코드 블록 제거
  content = content.replace(/```[\s\S]*?```/g, '');

  // 소문자 변환 및 단어 추출
  const words = content
    .toLowerCase()
    .match(/\b[a-z가-힣]{2,}\b/g) || [];

  // 빈도 계산
  const frequency = new Map();
  words.forEach(word => {
    frequency.set(word, (frequency.get(word) || 0) + 1);
  });

  // 빈도순 정렬 및 상위 15개 반환
  return Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word]) => word);
}

/**
 * 개념 추출 (헤더, 굵은 글씨)
 */
function extractConcepts(content) {
  const concepts = new Set();

  // 헤더에서 추출
  const headers = content.match(/^#+\s+(.+)$/gm) || [];
  headers.forEach(header => {
    const text = header.replace(/^#+\s+/, '').trim();
    concepts.add(text.toLowerCase());
  });

  // 굵은 글씨에서 추출
  const bold = content.match(/\*\*([^*]+)\*\*/g) || [];
  bold.forEach(text => {
    const cleaned = text.replace(/\*\*/g, '').trim();
    if (cleaned.length > 2 && cleaned.length < 50) {
      concepts.add(cleaned.toLowerCase());
    }
  });

  return Array.from(concepts).slice(0, 10);
}

/**
 * 난이도 추정
 */
function estimateDifficulty(content, keywords, concepts) {
  let score = 0;

  // 문서 길이 (긴 문서 = 복잡)
  const wordCount = content.split(/\s+/).length;
  score += Math.min(wordCount / 500, 3);

  // 개념 수 (많은 개념 = 어려움)
  score += concepts.length * 0.2;

  // 코드 블록 수
  const codeBlocks = (content.match(/```/g) || []).length / 2;
  score += codeBlocks * 0.3;

  // 1-5 범위로 정규화
  return Math.min(Math.max(Math.round(score), 1), 5);
}

/**
 * Jaccard 유사도 계산
 */
function calculateJaccardSimilarity(set1, set2) {
  const intersection = set1.filter(x => set2.includes(x)).length;
  const union = new Set([...set1, ...set2]).size;
  return union > 0 ? intersection / union : 0;
}

/**
 * 통계 계산
 */
function calculateStatistics(nodes, edges, learningHistory) {
  // 각 노드의 연결 수 계산
  const connections = new Map();
  nodes.forEach(node => connections.set(node.id, 0));

  edges.forEach(edge => {
    connections.set(edge.source, (connections.get(edge.source) || 0) + 1);
    connections.set(edge.target, (connections.get(edge.target) || 0) + 1);
  });

  // 가장 연결이 많은 문서
  const mostConnected = Array.from(connections.entries())
    .map(([id, count]) => ({
      id,
      title: nodes.find(n => n.id === id)?.title || id,
      connections: count
    }))
    .sort((a, b) => b.connections - a.connections)
    .slice(0, 10);

  // 고립된 문서 (연결이 0개)
  const isolated = Array.from(connections.entries())
    .filter(([, count]) => count === 0)
    .map(([id]) => ({
      id,
      title: nodes.find(n => n.id === id)?.title || id,
      topic: nodes.find(n => n.id === id)?.topic || 'unknown'
    }));

  // 주제별 분포
  const topicDistribution = {};
  nodes.forEach(node => {
    if (!topicDistribution[node.topic]) {
      topicDistribution[node.topic] = 0;
    }
    topicDistribution[node.topic]++;
  });

  // 난이도 분포
  const difficultyDistribution = {
    easy: 0,      // 1-2
    medium: 0,    // 3
    hard: 0       // 4-5
  };
  nodes.forEach(node => {
    if (node.difficulty <= 2) difficultyDistribution.easy++;
    else if (node.difficulty === 3) difficultyDistribution.medium++;
    else difficultyDistribution.hard++;
  });

  // 평균 통계
  const totalWordCount = nodes.reduce((sum, node) => sum + (node.wordCount || 0), 0);
  const avgWordCount = nodes.length > 0 ? Math.round(totalWordCount / nodes.length) : 0;
  const avgDifficulty = nodes.length > 0 ?
    (nodes.reduce((sum, node) => sum + node.difficulty, 0) / nodes.length).toFixed(2) : 0;
  const avgKeywords = nodes.length > 0 ?
    (nodes.reduce((sum, node) => sum + node.keywords.length, 0) / nodes.length).toFixed(1) : 0;

  // 연결 분포
  const connectionDistribution = {
    isolated: isolated.length,
    weaklyConnected: 0,    // 1-3 연결
    moderatelyConnected: 0, // 4-7 연결
    highlyConnected: 0      // 8+ 연결
  };
  Array.from(connections.values()).forEach(count => {
    if (count > 0 && count <= 3) connectionDistribution.weaklyConnected++;
    else if (count >= 4 && count <= 7) connectionDistribution.moderatelyConnected++;
    else if (count >= 8) connectionDistribution.highlyConnected++;
  });

  // 에지 타입별 분포
  const edgeTypeDistribution = {};
  edges.forEach(edge => {
    if (!edgeTypeDistribution[edge.type]) {
      edgeTypeDistribution[edge.type] = 0;
    }
    edgeTypeDistribution[edge.type]++;
  });

  // 학습 진행 통계
  const completedDocs = Object.keys(learningHistory || {});
  const completedCount = completedDocs.length;
  const progressPercent = nodes.length > 0 ?
    parseFloat(((completedCount / nodes.length) * 100).toFixed(2)) : 0;

  // 주제별 진행 상황
  const topicProgress = {};
  Object.keys(topicDistribution).forEach(topic => {
    const topicNodes = nodes.filter(n => n.topic === topic);
    const topicCompleted = topicNodes.filter(n => completedDocs.includes(n.id)).length;

    topicProgress[topic] = {
      total: topicNodes.length,
      completed: topicCompleted,
      inProgress: 0, // 추후 확장 가능
      notStarted: topicNodes.length - topicCompleted,
      progressPercent: topicNodes.length > 0 ?
        parseFloat(((topicCompleted / topicNodes.length) * 100).toFixed(2)) : 0
    };
  });

  // 난이도별 진행 상황
  const difficultyProgress = {
    easy: { total: difficultyDistribution.easy, completed: 0 },
    medium: { total: difficultyDistribution.medium, completed: 0 },
    hard: { total: difficultyDistribution.hard, completed: 0 }
  };

  completedDocs.forEach(docId => {
    const node = nodes.find(n => n.id === docId);
    if (node) {
      if (node.difficulty <= 2) difficultyProgress.easy.completed++;
      else if (node.difficulty === 3) difficultyProgress.medium.completed++;
      else difficultyProgress.hard.completed++;
    }
  });

  // 최근 활동 통계
  const recentActivity = Object.entries(learningHistory || {})
    .map(([id, entry]) => ({
      id,
      date: entry.date || entry.lastStudied,
      ...entry
    }))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 30);

  // 학습 속도 (최근 7일, 30일)
  const now = new Date();
  const last7Days = recentActivity.filter(a => {
    const activityDate = new Date(a.date);
    const daysDiff = (now - activityDate) / (1000 * 60 * 60 * 24);
    return daysDiff <= 7;
  }).length;

  const last30Days = recentActivity.filter(a => {
    const activityDate = new Date(a.date);
    const daysDiff = (now - activityDate) / (1000 * 60 * 60 * 24);
    return daysDiff <= 30;
  }).length;

  return {
    // 기본 통계
    totalDocuments: nodes.length,
    totalEdges: edges.length,
    totalTopics: Object.keys(topicDistribution).length,

    // 연결 통계
    averageConnections: nodes.length > 0 ?
      parseFloat((edges.length * 2 / nodes.length).toFixed(2)) : 0,
    maxConnections: mostConnected.length > 0 ? mostConnected[0].connections : 0,
    minConnections: 0,

    // 분포 통계
    topicDistribution,
    difficultyDistribution,
    connectionDistribution,
    edgeTypeDistribution,

    // 평균 통계
    averageWordCount: avgWordCount,
    averageDifficulty: parseFloat(avgDifficulty),
    averageKeywordsPerDoc: parseFloat(avgKeywords),

    // 상위/하위 문서
    mostConnectedDocs: mostConnected,
    isolatedDocs: isolated,

    // 그래프 밀도
    graphDensity: nodes.length > 1 ?
      parseFloat((edges.length / (nodes.length * (nodes.length - 1) / 2)).toFixed(4)) : 0,

    // 학습 진행 통계
    completedDocuments: completedCount,
    progressPercent,
    topicProgress,
    difficultyProgress,

    // 활동 통계
    recentActivity: {
      last7Days,
      last30Days,
      averagePerWeek: parseFloat((last30Days / 4.3).toFixed(1))
    }
  };
}

/**
 * 학습 추천 생성
 */
function generateRecommendations(nodes, edges, learningHistory, statistics) {
  const completedDocs = new Set(Object.keys(learningHistory || {}));
  const now = new Date();

  // 1. 다음 학습 추천 (미완료 중 쉬운 것부터, 연결된 문서 우선)
  const nextToLearn = nodes
    .filter(node => !completedDocs.has(node.id))
    .filter(node => !node.id.match(/README|TEMPLATE|index\.md|NAVIGATION|JEKYLL/i))
    .map(node => {
      // 연결된 문서 중 완료한 것이 있는지 확인
      const relatedEdges = edges.filter(e => e.source === node.id || e.target === node.id);
      const completedRelated = relatedEdges.filter(e => {
        const otherId = e.source === node.id ? e.target : e.source;
        return completedDocs.has(otherId);
      }).length;

      // 추천 점수 계산
      let score = 0;
      score += (6 - node.difficulty) * 10; // 쉬운 문서 우선
      score += completedRelated * 5; // 연결된 완료 문서가 많으면 우선
      score += relatedEdges.length * 2; // 전체 연결이 많으면 중요

      return {
        id: node.id,
        title: node.title,
        topic: node.topic,
        difficulty: node.difficulty,
        reason: completedRelated > 0
          ? `이미 학습한 ${completedRelated}개 문서와 연결됨`
          : '기초 개념 학습',
        score,
        estimatedTime: estimateReadingTime(node.wordCount)
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  // 2. 복습 추천 (학습한지 오래된 문서)
  const reviewRecommended = Object.entries(learningHistory || {})
    .map(([id, entry]) => {
      const node = nodes.find(n => n.id === id);
      if (!node) return null;

      const lastStudied = new Date(entry.date || entry.lastStudied);
      const daysSince = Math.floor((now - lastStudied) / (1000 * 60 * 60 * 24));

      // 복습 필요도 계산 (어려운 문서, 오래된 문서 우선)
      let reviewScore = 0;
      reviewScore += daysSince; // 오래될수록 높음
      reviewScore += node.difficulty * 5; // 어려울수록 자주 복습

      return {
        id: node.id,
        title: node.title,
        topic: node.topic,
        difficulty: node.difficulty,
        lastStudied: entry.date || entry.lastStudied,
        daysSince,
        reason: daysSince > 30 ? '한 달 이상 지남' : daysSince > 14 ? '2주 이상 지남' : '복습 권장',
        reviewScore
      };
    })
    .filter(Boolean)
    .filter(item => item.daysSince >= 7) // 최소 일주일 지난 것만
    .sort((a, b) => b.reviewScore - a.reviewScore)
    .slice(0, 10);

  // 3. 추천 키워드 (자주 등장하지만 학습하지 않은 문서의 키워드)
  const keywordFrequency = new Map();
  nodes.forEach(node => {
    if (!completedDocs.has(node.id)) {
      node.keywords.forEach(keyword => {
        keywordFrequency.set(keyword, (keywordFrequency.get(keyword) || 0) + 1);
      });
    }
  });

  const suggestedKeywords = Array.from(keywordFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([keyword, frequency]) => ({
      keyword,
      frequency,
      relatedDocs: nodes
        .filter(n => !completedDocs.has(n.id) && n.keywords.includes(keyword))
        .slice(0, 5)
        .map(n => ({ id: n.id, title: n.title }))
    }));

  // 4. 주제별 추천 학습 경로
  const learningPaths = {};
  const mainTopics = ['algorithms', 'languages', 'web-development', 'databases', 'networking'];

  mainTopics.forEach(topic => {
    const topicDocs = nodes.filter(n => n.topic === topic && !completedDocs.has(n.id));
    if (topicDocs.length === 0) return;

    // 난이도순으로 정렬하여 학습 경로 생성
    const path = topicDocs
      .sort((a, b) => a.difficulty - b.difficulty)
      .slice(0, 8)
      .map((node, index) => ({
        step: index + 1,
        id: node.id,
        title: node.title,
        difficulty: node.difficulty,
        estimatedTime: estimateReadingTime(node.wordCount)
      }));

    if (path.length > 0) {
      learningPaths[topic] = {
        topic,
        totalSteps: path.length,
        totalTime: path.reduce((sum, p) => sum + p.estimatedTime, 0),
        path
      };
    }
  });

  // 5. 학습 목표 제안
  const weeklyGoal = {
    recommended: Math.max(3, Math.min(7, Math.floor(statistics.totalDocuments * 0.05))),
    easy: Math.ceil(statistics.difficultyDistribution.easy * 0.1),
    medium: Math.ceil(statistics.difficultyDistribution.medium * 0.05),
    hard: Math.ceil(statistics.difficultyDistribution.hard * 0.02)
  };

  return {
    nextToLearn,
    reviewRecommended,
    suggestedKeywords,
    learningPaths,
    weeklyGoal,
    summary: {
      totalUnread: statistics.totalDocuments - completedDocs.size,
      readyToReview: reviewRecommended.length,
      suggestedDaily: Math.ceil(weeklyGoal.recommended / 7)
    }
  };
}

/**
 * 읽기 시간 추정 (분)
 */
function estimateReadingTime(wordCount) {
  // 평균 읽기 속도: 분당 200단어
  return Math.max(1, Math.ceil(wordCount / 200));
}

/**
 * learning-history 로드
 */
function loadLearningHistory() {
  const historyPath = path.join(ROOT_DIR, '.learning-history.json');

  if (fs.existsSync(historyPath)) {
    try {
      return JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
    } catch (error) {
      console.warn('⚠️  Failed to load learning history:', error.message);
    }
  }

  return {};
}

// 실행
if (require.main === module) {
  generateKnowledgeGraph();
}

module.exports = { generateKnowledgeGraph };
