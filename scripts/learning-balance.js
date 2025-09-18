#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * TODO: 스케쥴 및 상세 내용 변경, 이모티콘 단일화
 * 학습 균형 관리 시스템
 * - 카테고리별 학습 진도 분석
 * - 편중된 학습 영역 감지
 * - 스마트 주제 추천
 * - 학습 스케줄 제안
 */

class LearningBalanceManager {
  constructor(rootDir) {
    this.rootDir = rootDir;
    this.documents = [];
    this.learningHistory = this.loadLearningHistory();
    
    // 카테고리별 가중치 (중요도)
    this.categoryWeights = {
      'algorithms': 0.25,        // 알고리즘 25%
      'languages': 0.20,         // 프로그래밍 언어 20%
      'web-development': 0.25,   // 웹 개발 25%
      'networking': 0.15,        // 네트워킹 15%
      'databases': 0.10,         // 데이터베이스 10%
      'security': 0.05          // 보안 5%
    };
    
    // 학습 목표 (이상적인 분포)
    this.targetDistribution = {
      'algorithms': 0.25,
      'languages': 0.20,
      'web-development': 0.25,
      'networking': 0.15,
      'databases': 0.10,
      'security': 0.05
    };
  }

  // 학습 기록 로드
  loadLearningHistory() {
    const historyPath = path.join(this.rootDir, '.learning-history.json');
    try {
      if (fs.existsSync(historyPath)) {
        return JSON.parse(fs.readFileSync(historyPath, 'utf8'));
      }
    } catch (error) {
      console.log('📝 새로운 학습 기록을 시작합니다.');
    }
    
    return {
      sessions: [],
      totalStudyTime: 0,
      categoryProgress: {},
      lastUpdated: new Date().toISOString()
    };
  }

  // 학습 기록 저장
  saveLearningHistory() {
    const historyPath = path.join(this.rootDir, '.learning-history.json');
    this.learningHistory.lastUpdated = new Date().toISOString();
    fs.writeFileSync(historyPath, JSON.stringify(this.learningHistory, null, 2));
  }

  // 문서 스캔
  scanDocuments(dir = this.rootDir, relativePath = '') {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const itemRelativePath = path.join(relativePath, item);
      
      // 제외 경로
      if (['node_modules', '.git', '.github', 'scripts', 'private'].some(exclude => 
        itemRelativePath.startsWith(exclude))) {
        continue;
      }
      
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        this.scanDocuments(fullPath, itemRelativePath);
      } else if (item.endsWith('.md')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const titleMatch = content.match(/^#\s+(.+)$/m);
        
        this.documents.push({
          path: itemRelativePath,
          fullPath: fullPath,
          name: item.replace('.md', ''),
          title: titleMatch ? titleMatch[1].trim() : item.replace('.md', ''),
          content: content,
          category: itemRelativePath.split(path.sep)[0],
          wordCount: content.split(/\s+/).length,
          complexity: this.calculateComplexity(content),
          lastModified: stat.mtime,
          created: stat.birthtime
        });
      }
    }
  }

  // 문서 복잡도 계산
  calculateComplexity(content) {
    let score = 0;
    
    // 코드 블록 수
    const codeBlocks = (content.match(/```/g) || []).length / 2;
    score += codeBlocks * 10;
    
    // 링크 수
    const links = (content.match(/\[.*?\]\(.*?\)/g) || []).length;
    score += links * 2;
    
    // 헤더 수 (구조화 정도)
    const headers = (content.match(/^#+\s/gm) || []).length;
    score += headers * 3;
    
    // 단어 수 기반
    const wordCount = content.split(/\s+/).length;
    score += Math.log(wordCount) * 5;
    
    return Math.round(score);
  }

  // 현재 학습 균형 분석
  analyzeCurrentBalance() {
    console.log('📊 학습 균형 분석 중...');
    this.scanDocuments();
    
    const categoryStats = {};
    let totalDocuments = 0;
    let totalComplexity = 0;
    let totalWords = 0;
    
    // 카테고리별 통계 계산
    for (const doc of this.documents) {
      const category = doc.category;
      
      if (!categoryStats[category]) {
        categoryStats[category] = {
          count: 0,
          totalWords: 0,
          totalComplexity: 0,
          avgComplexity: 0,
          recentActivity: 0,
          lastModified: null
        };
      }
      
      categoryStats[category].count++;
      categoryStats[category].totalWords += doc.wordCount;
      categoryStats[category].totalComplexity += doc.complexity;
      totalDocuments++;
      totalComplexity += doc.complexity;
      totalWords += doc.wordCount;
      
      // 최근 활동 점수 (30일 기준)
      const daysSinceModified = (Date.now() - doc.lastModified.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceModified <= 30) {
        categoryStats[category].recentActivity += Math.max(0, 30 - daysSinceModified) / 30;
      }
      
      if (!categoryStats[category].lastModified || doc.lastModified > categoryStats[category].lastModified) {
        categoryStats[category].lastModified = doc.lastModified;
      }
    }
    
    // 평균 복잡도 계산
    for (const category in categoryStats) {
      const stats = categoryStats[category];
      stats.avgComplexity = stats.totalComplexity / stats.count;
      stats.documentRatio = stats.count / totalDocuments;
      stats.complexityRatio = stats.totalComplexity / totalComplexity;
      stats.wordRatio = stats.totalWords / totalWords;
    }
    
    return {
      categoryStats,
      totalDocuments,
      totalComplexity,
      totalWords,
      analysisDate: new Date()
    };
  }

  // 학습 불균형 감지
  detectImbalances(analysis) {
    const imbalances = [];
    const { categoryStats } = analysis;
    
    for (const [category, target] of Object.entries(this.targetDistribution)) {
      const current = categoryStats[category];
      
      if (!current) {
        imbalances.push({
          category,
          type: 'missing',
          severity: 'high',
          message: `${this.getCategoryDisplayName(category)} 영역이 완전히 비어있습니다.`,
          recommendation: `${this.getCategoryDisplayName(category)} 기초 문서부터 시작해보세요.`
        });
        continue;
      }
      
      const actualRatio = current.documentRatio;
      const difference = Math.abs(actualRatio - target);
      
      if (difference > 0.1) { // 10% 이상 차이
        const severity = difference > 0.2 ? 'high' : 'medium';
        const isUnder = actualRatio < target;
        
        imbalances.push({
          category,
          type: isUnder ? 'under' : 'over',
          severity,
          difference: difference,
          current: actualRatio,
          target: target,
          message: isUnder ? 
            `${this.getCategoryDisplayName(category)} 영역이 ${(difference * 100).toFixed(1)}% 부족합니다.` :
            `${this.getCategoryDisplayName(category)} 영역이 ${(difference * 100).toFixed(1)}% 과도합니다.`,
          recommendation: isUnder ?
            `${this.getCategoryDisplayName(category)} 관련 학습을 늘려보세요.` :
            `다른 영역도 균형있게 학습해보세요.`
        });
      }
      
      // 최근 활동 부족 체크
      if (current.recentActivity < 0.3) { // 30% 미만의 최근 활동
        imbalances.push({
          category,
          type: 'stale',
          severity: 'medium',
          message: `${this.getCategoryDisplayName(category)} 영역의 최근 학습이 부족합니다.`,
          recommendation: `${this.getCategoryDisplayName(category)} 내용을 복습하거나 새로운 주제를 추가해보세요.`
        });
      }
    }
    
    return imbalances.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  // 스마트 주제 추천
  generateRecommendations(analysis, imbalances) {
    const recommendations = [];
    
    // 1. 불균형 해결 우선 추천
    const underCategories = imbalances.filter(i => i.type === 'under' || i.type === 'missing');
    
    for (const imbalance of underCategories.slice(0, 3)) { // 상위 3개
      const topics = this.getTopicsForCategory(imbalance.category);
      recommendations.push({
        type: 'balance',
        priority: imbalance.severity === 'high' ? 1 : 2,
        category: imbalance.category,
        title: `${this.getCategoryDisplayName(imbalance.category)} 균형 맞추기`,
        description: imbalance.message,
        suggestedTopics: topics,
        estimatedTime: '1-2주',
        reason: 'learning_balance'
      });
    }
    
    // 2. 연관 주제 추천
    const recentCategories = this.getRecentlyStudiedCategories(analysis);
    for (const category of recentCategories) {
      const relatedTopics = this.getRelatedTopics(category);
      if (relatedTopics.length > 0) {
        recommendations.push({
          type: 'related',
          priority: 3,
          category: category,
          title: `${this.getCategoryDisplayName(category)} 심화 학습`,
          description: `최근 ${this.getCategoryDisplayName(category)} 학습을 기반으로 한 연관 주제`,
          suggestedTopics: relatedTopics,
          estimatedTime: '3-5일',
          reason: 'knowledge_expansion'
        });
      }
    }
    
    // 3. 트렌드 기반 추천
    const trendingTopics = this.getTrendingTopics();
    recommendations.push({
      type: 'trending',
      priority: 4,
      category: 'general',
      title: '최신 기술 트렌드',
      description: '현재 주목받고 있는 기술 주제들',
      suggestedTopics: trendingTopics,
      estimatedTime: '1주',
      reason: 'industry_trends'
    });
    
    return recommendations.sort((a, b) => a.priority - b.priority);
  }

  // 카테고리별 추천 주제
  getTopicsForCategory(category) {
    const topicMap = {
      'algorithms': [
        '정렬 알고리즘 (버블, 퀵, 머지)',
        '탐색 알고리즘 (이진 탐색, DFS, BFS)',
        '동적 프로그래밍',
        '그래프 알고리즘',
        '해시 테이블과 해시 함수',
        '시간/공간 복잡도 분석'
      ],
      'languages': [
        'JavaScript ES6+ 문법',
        'TypeScript 타입 시스템',
        'Python 고급 기능',
        'Java 객체지향 프로그래밍',
        '함수형 프로그래밍 개념',
        '메모리 관리와 가비지 컬렉션'
      ],
      'web-development': [
        'React Hooks와 상태 관리',
        'Node.js와 Express.js',
        'RESTful API 설계',
        'GraphQL 기초',
        '웹 성능 최적화',
        '반응형 웹 디자인'
      ],
      'networking': [
        'HTTP/HTTPS 프로토콜',
        'TCP/IP 네트워크 기초',
        'DNS와 도메인 시스템',
        'CDN과 캐싱 전략',
        '웹소켓과 실시간 통신',
        '네트워크 보안 기초'
      ],
      'databases': [
        'SQL 쿼리 최적화',
        'NoSQL 데이터베이스 (MongoDB)',
        '데이터베이스 설계 원칙',
        '인덱싱과 성능 튜닝',
        '트랜잭션과 ACID',
        '데이터 모델링'
      ],
      'security': [
        '웹 애플리케이션 보안',
        'OWASP Top 10',
        '암호화와 해싱',
        '인증과 권한 관리',
        'HTTPS와 SSL/TLS',
        '보안 코딩 가이드라인'
      ]
    };
    
    return topicMap[category] || [];
  }

  // 최근 학습한 카테고리 추출
  getRecentlyStudiedCategories(analysis) {
    const { categoryStats } = analysis;
    
    return Object.entries(categoryStats)
      .filter(([_, stats]) => stats.recentActivity > 0.5)
      .sort((a, b) => b[1].recentActivity - a[1].recentActivity)
      .slice(0, 2)
      .map(([category, _]) => category);
  }

  // 연관 주제 추천
  getRelatedTopics(category) {
    const relatedMap = {
      'algorithms': ['자료구조 심화', '코딩 테스트 문제 해결', '알고리즘 최적화 기법'],
      'languages': ['디자인 패턴', '코드 리팩토링', '테스트 주도 개발'],
      'web-development': ['마이크로서비스 아키텍처', '서버리스 컴퓨팅', '웹 접근성'],
      'networking': ['클라우드 네트워킹', '로드 밸런싱', '네트워크 모니터링'],
      'databases': ['빅데이터 처리', '데이터 웨어하우스', '실시간 데이터 처리'],
      'security': ['DevSecOps', '침투 테스트', '보안 감사']
    };
    
    return relatedMap[category] || [];
  }

  // 트렌딩 주제
  getTrendingTopics() {
    return [
      'AI/ML 기초와 활용',
      '컨테이너와 Docker',
      'Kubernetes 오케스트레이션',
      '서버리스 아키텍처',
      'JAMstack 개발',
      'Web3와 블록체인 기초'
    ];
  }

  // 학습 스케줄 생성
  generateLearningSchedule(recommendations, weeks = 4) {
    const schedule = [];
    const daysPerWeek = 5; // 주 5일 학습
    const totalDays = weeks * daysPerWeek;
    
    // 우선순위별로 추천사항 분배
    const highPriority = recommendations.filter(r => r.priority <= 2);
    const mediumPriority = recommendations.filter(r => r.priority === 3);
    const lowPriority = recommendations.filter(r => r.priority >= 4);
    
    let dayIndex = 0;
    
    // 고우선순위 (60% 시간 할당)
    const highPriorityDays = Math.floor(totalDays * 0.6);
    for (let i = 0; i < highPriorityDays && highPriority.length > 0; i++) {
      const rec = highPriority[i % highPriority.length];
      const topics = rec.suggestedTopics.slice(0, 2); // 하루 2개 주제
      
      schedule.push({
        day: dayIndex + 1,
        week: Math.floor(dayIndex / daysPerWeek) + 1,
        category: rec.category,
        title: `${this.getCategoryDisplayName(rec.category)} 학습`,
        topics: topics,
        priority: rec.priority,
        estimatedHours: 2,
        type: rec.type
      });
      dayIndex++;
    }
    
    // 중간우선순위 (30% 시간 할당)
    const mediumPriorityDays = Math.floor(totalDays * 0.3);
    for (let i = 0; i < mediumPriorityDays && mediumPriority.length > 0; i++) {
      const rec = mediumPriority[i % mediumPriority.length];
      const topics = rec.suggestedTopics.slice(0, 1); // 하루 1개 주제
      
      schedule.push({
        day: dayIndex + 1,
        week: Math.floor(dayIndex / daysPerWeek) + 1,
        category: rec.category,
        title: `${this.getCategoryDisplayName(rec.category)} 심화`,
        topics: topics,
        priority: rec.priority,
        estimatedHours: 1.5,
        type: rec.type
      });
      dayIndex++;
    }
    
    // 낮은우선순위 (10% 시간 할당)
    while (dayIndex < totalDays && lowPriority.length > 0) {
      const rec = lowPriority[dayIndex % lowPriority.length];
      const topics = rec.suggestedTopics.slice(0, 1);
      
      schedule.push({
        day: dayIndex + 1,
        week: Math.floor(dayIndex / daysPerWeek) + 1,
        category: rec.category,
        title: `${rec.title}`,
        topics: topics,
        priority: rec.priority,
        estimatedHours: 1,
        type: rec.type
      });
      dayIndex++;
    }
    
    return schedule.sort((a, b) => a.day - b.day);
  }

  // 카테고리 표시명 변환
  getCategoryDisplayName(category) {
    const categoryMap = {
      'algorithms': '알고리즘',
      'languages': '프로그래밍 언어',
      'web-development': '웹 개발',
      'networking': '네트워킹',
      'databases': '데이터베이스',
      'security': '보안',
      'operating-systems': '운영체제'
    };
    
    return categoryMap[category] || category;
  }

  // 학습 진행률 시각화
  displayProgressDashboard(analysis, imbalances, recommendations) {
    console.log('\n🎯 학습 균형 대시보드');
    console.log('='.repeat(50));
    
    // 전체 현황
    console.log(`📚 총 문서 수: ${analysis.totalDocuments}개`);
    console.log(`📝 총 단어 수: ${analysis.totalWords.toLocaleString()}개`);
    console.log(`🧠 평균 복잡도: ${Math.round(analysis.totalComplexity / analysis.totalDocuments)}`);
    console.log();
    
    // 카테고리별 현황
    console.log('📊 카테고리별 학습 현황');
    console.log('-'.repeat(50));
    
    const { categoryStats } = analysis;
    for (const [category, stats] of Object.entries(categoryStats)) {
      const target = this.targetDistribution[category] || 0;
      const current = stats.documentRatio;
      const status = Math.abs(current - target) <= 0.05 ? '✅' : 
                    current < target ? '📈' : '📉';
      
      console.log(`${status} ${this.getCategoryDisplayName(category)}`);
      console.log(`   📄 문서: ${stats.count}개 (${(current * 100).toFixed(1)}% / 목표: ${(target * 100).toFixed(1)}%)`);
      console.log(`   🔥 최근 활동: ${(stats.recentActivity * 100).toFixed(0)}%`);
      console.log(`   🧠 평균 복잡도: ${Math.round(stats.avgComplexity)}`);
      
      if (stats.lastModified) {
        const daysSince = Math.floor((Date.now() - stats.lastModified.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`   📅 마지막 수정: ${daysSince}일 전`);
      }
      console.log();
    }
    
    // 불균형 경고
    if (imbalances.length > 0) {
      console.log('⚠️  학습 불균형 감지');
      console.log('-'.repeat(50));
      
      imbalances.slice(0, 5).forEach((imbalance, index) => {
        const icon = imbalance.severity === 'high' ? '🔴' : 
                    imbalance.severity === 'medium' ? '🟡' : '🟢';
        console.log(`${icon} ${imbalance.message}`);
        console.log(`   💡 ${imbalance.recommendation}`);
        console.log();
      });
    }
    
    // 추천사항
    console.log('🎯 맞춤 학습 추천');
    console.log('-'.repeat(50));
    
    recommendations.slice(0, 3).forEach((rec, index) => {
      const priorityIcon = rec.priority <= 2 ? '🔥' : rec.priority === 3 ? '⭐' : '💡';
      console.log(`${priorityIcon} ${rec.title}`);
      console.log(`   📝 ${rec.description}`);
      console.log(`   ⏱️  예상 시간: ${rec.estimatedTime}`);
      console.log(`   📚 추천 주제: ${rec.suggestedTopics.slice(0, 3).join(', ')}`);
      console.log();
    });
  }

  // 학습 스케줄 출력
  displayLearningSchedule(schedule) {
    console.log('\n📅 4주 학습 스케줄');
    console.log('='.repeat(50));
    
    let currentWeek = 0;
    
    for (const item of schedule) {
      if (item.week !== currentWeek) {
        currentWeek = item.week;
        console.log(`\n📆 ${currentWeek}주차`);
        console.log('-'.repeat(30));
      }
      
      const priorityIcon = item.priority <= 2 ? '🔥' : item.priority === 3 ? '⭐' : '💡';
      console.log(`${priorityIcon} Day ${item.day}: ${item.title} (${item.estimatedHours}시간)`);
      
      item.topics.forEach(topic => {
        console.log(`   • ${topic}`);
      });
      console.log();
    }
    
    // 주간 요약
    const weeklyStats = {};
    schedule.forEach(item => {
      if (!weeklyStats[item.week]) {
        weeklyStats[item.week] = { hours: 0, categories: new Set() };
      }
      weeklyStats[item.week].hours += item.estimatedHours;
      weeklyStats[item.week].categories.add(item.category);
    });
    
    console.log('\n📈 주간 학습량 요약');
    console.log('-'.repeat(30));
    Object.entries(weeklyStats).forEach(([week, stats]) => {
      console.log(`${week}주차: ${stats.hours}시간, ${stats.categories.size}개 영역`);
    });
  }

  // 메인 실행 함수
  run() {
    console.log('🎯 학습 균형 관리 시스템');
    console.log('='.repeat(50));
    
    // 1. 현재 상태 분석
    const analysis = this.analyzeCurrentBalance();
    
    // 2. 불균형 감지
    const imbalances = this.detectImbalances(analysis);
    
    // 3. 추천사항 생성
    const recommendations = this.generateRecommendations(analysis, imbalances);
    
    // 4. 학습 스케줄 생성
    const schedule = this.generateLearningSchedule(recommendations);
    
    // 5. 결과 출력
    this.displayProgressDashboard(analysis, imbalances, recommendations);
    this.displayLearningSchedule(schedule);
    
    // 6. 학습 기록 업데이트
    this.learningHistory.lastAnalysis = {
      date: new Date().toISOString(),
      totalDocuments: analysis.totalDocuments,
      imbalanceCount: imbalances.length,
      recommendationCount: recommendations.length
    };
    this.saveLearningHistory();
    
    console.log('\n💾 학습 기록이 업데이트되었습니다.');
    console.log('📊 정기적으로 균형을 체크하여 효과적인 학습을 유지하세요!');
  }
}

// CLI 실행
if (require.main === module) {
  const manager = new LearningBalanceManager(process.cwd());
  manager.run();
}

module.exports = LearningBalanceManager;
