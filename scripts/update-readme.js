#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const NavigationGenerator = require('./generate-navigation');

/**
 * README.md 자동 업데이트 스크립트
 * 목차 섹션을 자동으로 생성하고 README.md에 삽입합니다.
 */

class ReadmeUpdater {
  constructor(rootDir) {
    this.rootDir = rootDir;
    this.readmePath = path.join(rootDir, 'README.md');
    this.generator = new NavigationGenerator(rootDir);
  }

  // 현재 README.md 읽기
  readCurrentReadme() {
    if (!fs.existsSync(this.readmePath)) {
      throw new Error('README.md 파일을 찾을 수 없습니다.');
    }
    return fs.readFileSync(this.readmePath, 'utf8');
  }

  // 목차 섹션 생성
  generateNavigationSection() {
    const { navigation, stats } = this.generator.run();
    
    // 간소화된 목차 (README용)
    const categories = this.generator.groupByCategory();
    let quickNav = `## 목차\n\n`;
    quickNav += `> **총 ${stats.totalDocuments}개의 문서** | 마지막 업데이트: ${new Date().toLocaleDateString('ko-KR')}\n\n`;
    
    // 카테고리
    quickNav += `### 카테고리\n\n`;
    for (const [categoryKey, category] of Object.entries(categories)) {
      const count = category.documents.length;
      quickNav += `- **[${category.title}](#${categoryKey.replace(/-/g, '')})** (${count}개 문서)\n`;
    }
    quickNav += `\n`;
    
    // 최근 추가된 문서 (상위 5개)
    const recentDocs = this.getRecentDocuments(5);
    if (recentDocs.length > 0) {
      quickNav += `### 최근 추가된 문서\n\n`;
      for (const doc of recentDocs) {
        const relativePath = doc.path.replace(/\\/g, '/');
        quickNav += `- **[${doc.title}](/${relativePath})**\n`;
      }
      quickNav += `\n`;
    }
    
    // 전체 목차 링크
    quickNav += `### 전체 목차\n\n`;
    quickNav += `모든 문서의 상세한 목록과 설명은 <u><b>[NAVIGATION.md](./NAVIGATION.md)</b></u>에서 확인하실 수 있습니다.\n\n`;
    
    // 카테고리별 간단한 목록
    for (const [categoryKey, category] of Object.entries(categories)) {
      quickNav += `<details>\n<summary><strong>${category.title}</strong> (${category.documents.length}개)</summary>\n\n`;
      
      // 최대 10개까지만 표시
      const displayDocs = category.documents.slice(0, 10);
      for (const doc of displayDocs) {
        const relativePath = doc.path.replace(/\\/g, '/');
        quickNav += `- [${doc.title}](/${relativePath})\n`;
      }
      
      if (category.documents.length > 10) {
        quickNav += `- ... 그 외 ${category.documents.length - 10}개 문서\n`;
      }
      
      quickNav += `\n</details>\n\n`;
    }
    
    return quickNav;
  }

  // 최근 문서 가져오기 (파일 수정 시간 기준)
  getRecentDocuments(limit = 5) {
    try {
      const docsWithStats = this.generator.documents.map(doc => {
        const stat = fs.statSync(doc.fullPath);
        return {
          ...doc,
          mtime: stat.mtime
        };
      });
      
      return docsWithStats
        .sort((a, b) => b.mtime - a.mtime)
        .slice(0, limit);
    } catch (error) {
      return [];
    }
  }

  // README.md 업데이트
  updateReadme() {
    const currentContent = this.readCurrentReadme();
    const navigationSection = this.generateNavigationSection();
    
    // 목차 섹션 마커
    const startMarker = '<!-- NAVIGATION_START -->';
    const endMarker = '<!-- NAVIGATION_END -->';
    
    // 기존 목차 섹션이 있는지 확인
    const startIndex = currentContent.indexOf(startMarker);
    const endIndex = currentContent.indexOf(endMarker);
    
    let newContent;
    
    if (startIndex !== -1 && endIndex !== -1) {
      // 기존 섹션 교체
      newContent = currentContent.substring(0, startIndex + startMarker.length) +
                  '\n\n' + navigationSection +
                  currentContent.substring(endIndex);
    } else {
      // 목차 섹션 뒤에 목차 추가
      const tocEndPattern = /## 목차[\s\S]*?(?=\n## )/;
      const match = currentContent.match(tocEndPattern);
      
      if (match) {
        const insertPoint = currentContent.indexOf(match[0]) + match[0].length;
        newContent = currentContent.substring(0, insertPoint) +
                    '\n\n' + startMarker + '\n\n' + navigationSection + endMarker + '\n' +
                    currentContent.substring(insertPoint);
      } else {
        // 목차를 찾을 수 없으면 끝에 추가
        newContent = currentContent + '\n\n' + startMarker + '\n\n' + navigationSection + endMarker + '\n';
      }
    }
    
    // 파일 저장
    fs.writeFileSync(this.readmePath, newContent);
    
    return {
      updated: true,
      documentCount: this.generator.documents.length,
      categoryCount: Object.keys(this.generator.groupByCategory()).length
    };
  }

  // 통계 업데이트 (배지 업데이트)
  updateBadges() {
    let content = this.readCurrentReadme();
    const stats = this.generator.generateStats();
    
    // 문서 수 배지 업데이트
    const topicsBadgePattern = /!\[Topics\]\(https:\/\/img\.shields\.io\/badge\/주제-\d+개-brightgreen\)/;
    const newTopicsBadge = `![Topics](https://img.shields.io/badge/주제-${stats.categories}개-brightgreen)`;
    content = content.replace(topicsBadgePattern, newTopicsBadge);
    
    // 마지막 업데이트 날짜
    const today = new Date().toISOString().split('T')[0];
    const updateBadgePattern = /!\[Last Updated\]\(https:\/\/img\.shields\.io\/badge\/최종%20업데이트-[\d\-]+-blue\)/;
    const newUpdateBadge = `![Last Updated](https://img.shields.io/badge/최종%20업데이트-${today}-blue)`;
    content = content.replace(updateBadgePattern, newUpdateBadge);
    
    fs.writeFileSync(this.readmePath, content);
  }
}

// 스크립트 실행
if (require.main === module) {
  const rootDir = path.join(__dirname, '..');
  const updater = new ReadmeUpdater(rootDir);
  
  try {
    console.log('📄 README.md 업데이트 중...');
    
    const result = updater.updateReadme();
    updater.updateBadges();
    
    console.log('✅ README.md가 성공적으로 업데이트되었습니다!');
    console.log(`📊 총 ${result.documentCount}개 문서, ${result.categoryCount}개 카테고리`);
    
    // NAVIGATION.md도 생성
    const navigationPath = path.join(__dirname, '..', 'NAVIGATION.md');
    const { navigation } = updater.generator.run();
    fs.writeFileSync(navigationPath, navigation);
    console.log('📄 NAVIGATION.md도 함께 생성되었습니다.');
    
  } catch (error) {
    console.error('❌ 업데이트 중 오류 발생:', error.message);
    process.exit(1);
  }
}

module.exports = ReadmeUpdater;
