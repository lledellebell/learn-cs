#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * 프로젝트 통계 생성 스크립트
 * - 문서 수, 카테고리별 통계
 * - 최근 활동 분석
 * - 학습 진행도 추적
 */

class ProjectStats {
  constructor(rootDir) {
    this.rootDir = rootDir;
    this.documents = [];
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
        this.documents.push({
          path: itemRelativePath,
          fullPath: fullPath,
          name: item.replace('.md', ''),
          content: content,
          wordCount: content.split(/\s+/).length,
          lineCount: content.split('\n').length,
          created: stat.birthtime,
          modified: stat.mtime,
          size: stat.size
        });
      }
    }
  }

  // 카테고리별 분류
  categorizeDocuments() {
    const categories = {
      algorithms: { title: '알고리즘', docs: [] },
      languages: { title: '프로그래밍 언어', docs: [] },
      networking: { title: '네트워킹', docs: [] },
      'web-development': { title: '웹 개발', docs: [] },
      databases: { title: '데이터베이스', docs: [] },
      'operating-systems': { title: '운영체제', docs: [] },
      security: { title: '보안', docs: [] },
      other: { title: '기타', docs: [] }
    };

    for (const doc of this.documents) {
      const pathParts = doc.path.split(path.sep);
      const category = pathParts[0];
      
      if (categories[category]) {
        categories[category].docs.push(doc);
      } else {
        categories.other.docs.push(doc);
      }
    }

    return categories;
  }

  // 통계 생성
  generateStats() {    
    this.scanDocuments();
    const categories = this.categorizeDocuments();
    
    const totalDocs = this.documents.length;
    
    // 최근 활동
    const recentDocs = [...this.documents]
      .sort((a, b) => b.modified - a.modified)
      .slice(0, 5);

    console.log(`\n📂 카테고리별 통계(총 ${totalDocs}개)`);
    console.log('-'.repeat(30));
    for (const [key, category] of Object.entries(categories)) {
      if (category.docs.length > 0) {
        console.log(`${category.title}: ${category.docs.length}개`);
      }
    }
    console.log('-'.repeat(30));

    
    console.log(`\n🕒 최근 수정된 문서(총 ${recentDocs.length}개)`);
    console.log('-'.repeat(30));
    recentDocs.forEach((doc, index) => {
      const date = doc.modified.toLocaleDateString('ko-KR');
      console.log(`${index + 1}. ${doc.name} (${date})`);
    });
    console.log('-'.repeat(30));




    
    return {
      totalDocs,
      categories,
      recentDocs
    };
  }
}

// 스크립트 실행
if (require.main === module) {
  const rootDir = path.join(__dirname, '..');
  const stats = new ProjectStats(rootDir);
  
  stats.generateStats();
}

module.exports = ProjectStats;
