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

  // 통계 계산
  const statistics = calculateStatistics(nodes, edges);

  // learning-history 데이터 로드
  const learningHistory = loadLearningHistory();

  return {
    nodes,
    edges,
    clusters: clusterArray,
    statistics,
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
function calculateStatistics(nodes, edges) {
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
    .map(([id]) => id);

  return {
    totalNodes: nodes.length,
    totalEdges: edges.length,
    averageConnections: nodes.length > 0 ?
      (edges.length * 2 / nodes.length).toFixed(2) : 0,
    mostConnectedDocs: mostConnected,
    isolatedDocs: isolated
  };
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

  return [];
}

// 실행
if (require.main === module) {
  generateKnowledgeGraph();
}

module.exports = { generateKnowledgeGraph };
