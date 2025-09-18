#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * 목차 자동 생성 스크립트
 * 프로젝트 내 모든 마크다운 문서를 스캔하여 카테고리별로 정리된 목차을 생성합니다.
 */

class NavigationGenerator {
  constructor(rootDir) {
    this.rootDir = rootDir;
    this.documents = [];
    this.excludePaths = [
      'node_modules',
      '.git',
      '.github',
      'private', // private 폴더는 제외
      'scripts'
    ];
  }

  // 마크다운 파일 스캔
  scanDocuments(dir = this.rootDir, relativePath = '') {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const itemRelativePath = path.join(relativePath, item);
      
      // 제외 경로 확인
      if (this.excludePaths.some(exclude => itemRelativePath.startsWith(exclude))) {
        continue;
      }
      
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        this.scanDocuments(fullPath, itemRelativePath);
      } else if (item.endsWith('.md') && item !== 'README.md' && item !== 'NAVIGATION.md') {
        // 중복 방지를 위해 경로 기준으로 확인
        const existingDoc = this.documents.find(doc => doc.path === itemRelativePath);
        if (!existingDoc) {
          const stat = fs.statSync(fullPath);
          this.documents.push({
            path: itemRelativePath,
            fullPath: fullPath,
            name: item.replace('.md', ''),
            category: this.categorizeDocument(itemRelativePath),
            title: this.extractTitle(fullPath),
            description: this.extractDescription(fullPath),
            lastModified: stat.mtime,
            createdDate: stat.birthtime || stat.ctime
          });
        }
      }
    }
  }

  // 문서 카테고리 분류
  categorizeDocument(filePath) {
    const parts = filePath.split(path.sep);
    
    if (parts.includes('algorithms')) return 'algorithms';
    if (parts.includes('data-structures')) return 'data-structures';
    if (parts.includes('languages')) return 'languages';
    if (parts.includes('networking')) return 'networking';
    if (parts.includes('operating-systems')) return 'operating-systems';
    if (parts.includes('databases')) return 'databases';
    if (parts.includes('web-development')) return 'web-development';
    if (parts.includes('security')) return 'security';
    
    return 'misc';
  }

  // 문서 제목 추출
  extractTitle(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const titleMatch = content.match(/^#\s+(.+)$/m);
      return titleMatch ? titleMatch[1].trim() : path.basename(filePath, '.md');
    } catch (error) {
      return path.basename(filePath, '.md');
    }
  }

  // 문서 설명 추출
  extractDescription(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      // 첫 번째 헤더 이후의 첫 번째 문단을 찾기
      let foundTitle = false;
      for (const line of lines) {
        if (line.startsWith('#') && !foundTitle) {
          foundTitle = true;
          continue;
        }
        
        if (foundTitle && line.trim() && !line.startsWith('#') && !line.startsWith('```')) {
          return line.trim().substring(0, 100) + (line.length > 100 ? '...' : '');
        }
      }
      
      return '';
    } catch (error) {
      return '';
    }
  }

  // 카테고리별로 문서 그룹화
  groupByCategory() {
    const categories = {
      'algorithms': {
        title: '알고리즘 (Algorithms)',
        description: '알고리즘 설계, 분석 및 구현',
        documents: []
      },
      'data-structures': {
        title: '자료구조 (Data Structures)',
        description: '기본 및 고급 자료구조',
        documents: []
      },
      'languages': {
        title: '프로그래밍 언어 (Languages)',
        description: '언어별 핵심 개념과 패러다임',
        documents: []
      },
      'networking': {
        title: '네트워킹 (Networking)',
        description: '네트워크 프로토콜, HTTP, TCP/IP 등',
        documents: []
      },
      'operating-systems': {
        title: '운영체제 (Operating Systems)',
        description: 'OS 개념, 프로세스, 스레드, 메모리 관리',
        documents: []
      },
      'databases': {
        title: '데이터베이스 (Databases)',
        description: 'SQL, NoSQL, 데이터 모델링, 쿼리 최적화',
        documents: []
      },
      'web-development': {
        title: '웹 개발 (Web Development)',
        description: '프론트엔드, 백엔드, 툴',
        documents: []
      },
      'security': {
        title: '보안 (Security)',
        description: '암호화, 인증, 권한 부여, 웹 보안',
        documents: []
      },
      'misc': {
        title: '기타 (Miscellaneous)',
        description: '기타 학습 자료',
        documents: []
      }
    };

    for (const doc of this.documents) {
      categories[doc.category].documents.push(doc);
    }

    // 빈 카테고리 제거
    Object.keys(categories).forEach(key => {
      if (categories[key].documents.length === 0) {
        delete categories[key];
      }
    });

    return categories;
  }

  // 날짜 포맷팅 유틸리티
  formatDate(date) {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatDateTime(date) {
    return new Date(date).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // NEW 배지 확인 (3일 이내)
  isNewDocument(date) {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));
    return new Date(date) > threeDaysAgo;
  }

  // 목차 마크다운 생성
  generateNavigationMarkdown() {
    const categories = this.groupByCategory();
    const totalDocs = this.documents.length;
    const now = new Date();
    
    // 최근 수정된 문서 찾기
    const mostRecentDoc = this.documents.reduce((latest, doc) => 
      doc.lastModified > latest.lastModified ? doc : latest
    );
    
    let markdown = `## 목차\n\n`;
    markdown += `> **총 ${totalDocs}개의 문서**(마지막 업데이트 정보: ${this.formatDateTime(now)})\n\n`;
    markdown += `> 최근 수정된 문서:\n>- **${mostRecentDoc.title}** (${this.formatDate(mostRecentDoc.lastModified)})\n\n`;
    
    // 카테고리별 문서 목록 (테이블 형식)
    for (const [categoryKey, category] of Object.entries(categories)) {
      markdown += `### ${category.title}\n\n`;
      markdown += `${category.description}\n\n`;
      
      // 서브카테고리별로 그룹화 (웹 개발의 경우)
      if (categoryKey === 'web-development') {
        const subCategories = this.groupWebDevDocuments(category.documents);
        
        for (const [subKey, subCategory] of Object.entries(subCategories)) {
          if (subCategory.documents.length > 0) {
            markdown += `#### ${subCategory.title}\n\n`;
            markdown += this.generateDocumentTable(subCategory.documents);
            markdown += '\n';
          }
        }
      } else if (categoryKey === 'languages') {
        const langCategories = this.groupLanguageDocuments(category.documents);
        
        for (const [langKey, langCategory] of Object.entries(langCategories)) {
          if (langCategory.documents.length > 0) {
            markdown += `#### ${langCategory.title}\n\n`;
            markdown += this.generateDocumentTable(langCategory.documents);
            markdown += '\n';
          }
        }
      } else {
        // 일반 카테고리
        markdown += this.generateDocumentTable(category.documents);
        markdown += '\n';
      }
    }
    
    // 통계 및 추가 정보 섹션
    markdown += `---\n\n`;
    markdown += `### 통계\n\n`;
    
    // 카테고리별 통계
    const categoryStats = Object.entries(categories).map(([key, category]) => ({
      name: category.title,
      count: category.documents.length
    })).sort((a, b) => b.count - a.count);
    
    markdown += `| 카테고리 | 문서 수 |\n`;
    markdown += `|----------|--------|\n`;
    for (const stat of categoryStats) {
      markdown += `| ${stat.name} | ${stat.count}개 |\n`;
    }
    markdown += `\n`;
    
    // 최근 수정된 문서 목록 (상위 5개)
    const recentDocs = [...this.documents]
      .sort((a, b) => b.lastModified - a.lastModified)
      .slice(0, 5);
    
    markdown += `### 최근 수정된 문서\n\n`;
    for (const doc of recentDocs) {
      const relativePath = doc.path.replace(/\\/g, '/');
      markdown += `1. **[${doc.title}](/${relativePath})** - ${this.formatDate(doc.lastModified)}\n`;
    }
    markdown += `\n`;
    
    return markdown;
  }

  // 문서 테이블 생성
  generateDocumentTable(documents) {
    if (documents.length === 0) return '';
    
    // 문서를 최신 수정일 기준으로 정렬
    const sortedDocs = [...documents].sort((a, b) => b.lastModified - a.lastModified);
    
    let table = `| 제목 | 최초 생성 | 마지막 수정 | 상태 |\n`;
    table += `|------|----------|------------|------|\n`;
    
    for (const doc of sortedDocs) {
      const relativePath = doc.path.replace(/\\/g, '/');
      const title = `[${doc.title}](/${relativePath})`;
      const created = this.formatDate(doc.createdDate);
      const modified = this.formatDate(doc.lastModified);
      
      // shields.io 배지로 상태 표시
      let status = '';
      if (this.isNewDocument(doc.lastModified)) {
        status = '![NEW](https://img.shields.io/badge/NEW-red?style=flat-square)';
      } else if (this.isNewDocument(doc.createdDate)) {
        status = '![최근생성](https://img.shields.io/badge/최근생성-orange?style=flat-square)';
      } else {
        // 수정된 지 7일 이내면 업데이트 표시
        const weekAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));
        if (new Date(doc.lastModified) > weekAgo) {
          status = '![업데이트](https://img.shields.io/badge/업데이트-blue?style=flat-square)';
        } else {
          status = '![완료](https://img.shields.io/badge/완료-green?style=flat-square)';
        }
      }
      
      table += `| ${title} | ${created} | ${modified} | ${status} |\n`;
    }
    
    return table;
  }

  // 웹 개발 문서 서브카테고리 그룹화
  groupWebDevDocuments(documents) {
    const subCategories = {
      'frontend': { title: '프론트엔드', documents: [] },
      'backend': { title: '백엔드', documents: [] },
      'tools': { title: '도구 및 툴', documents: [] }
    };

    for (const doc of documents) {
      if (doc.path.includes('frontend')) {
        subCategories.frontend.documents.push(doc);
      } else if (doc.path.includes('backend')) {
        subCategories.backend.documents.push(doc);
      } else if (doc.path.includes('tools')) {
        subCategories.tools.documents.push(doc);
      } else {
        subCategories.frontend.documents.push(doc); // 기본값
      }
    }

    return subCategories;
  }

  // 언어별 문서 그룹화
  groupLanguageDocuments(documents) {
    const langCategories = {
      'javascript': { title: 'JavaScript', documents: [] },
      'typescript': { title: 'TypeScript', documents: [] },
      'python': { title: 'Python', documents: [] },
      'java': { title: 'Java', documents: [] }
    };

    for (const doc of documents) {
      if (doc.path.includes('javascript')) {
        langCategories.javascript.documents.push(doc);
      } else if (doc.path.includes('typescript')) {
        langCategories.typescript.documents.push(doc);
      } else if (doc.path.includes('python')) {
        langCategories.python.documents.push(doc);
      } else if (doc.path.includes('java')) {
        langCategories.java.documents.push(doc);
      }
    }

    return langCategories;
  }

  // 통계 정보 생성
  generateStats() {
    const categories = this.groupByCategory();
    const stats = {
      totalDocuments: this.documents.length,
      categories: Object.keys(categories).length,
      byCategory: {}
    };

    for (const [key, category] of Object.entries(categories)) {
      stats.byCategory[key] = {
        title: category.title,
        count: category.documents.length
      };
    }

    return stats;
  }

  // 실행
  run() {
    console.log('📄 문서 스캔 중...');
    this.scanDocuments();
    
    console.log(`✅ ${this.documents.length}개의 문서를 발견했습니다.`);
    
    const navigation = this.generateNavigationMarkdown();
    const stats = this.generateStats();
    
    return { navigation, stats };
  }
}

// 스크립트 실행
if (require.main === module) {
  const rootDir = path.join(__dirname, '..');
  const generator = new NavigationGenerator(rootDir);
  const { navigation, stats } = generator.run();
  
  console.log('\n통계:');
  console.log(`총 문서: ${stats.totalDocuments}개`);
  console.log(`카테고리: ${stats.categories}개`);
  
  console.log('\n카테고리별 문서 수:');
  for (const [key, category] of Object.entries(stats.byCategory)) {
    console.log(`  ${category.title}: ${category.count}개`);
  }
  
  // 목차을 파일로 저장
  const outputPath = path.join(__dirname, '..', 'NAVIGATION.md');
  fs.writeFileSync(outputPath, navigation);
  console.log(`\n✅ 목차가 ${outputPath}에 생성되었습니다.`);
  
  // README.md 업데이트도 제공
  console.log('\n📄 README.md 업데이트를 위해 다음 명령어를 실행하세요:');
  console.log('node scripts/update-readme.js');
}

module.exports = NavigationGenerator;
