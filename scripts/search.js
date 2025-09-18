#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * 문서 검색 도구
 * - 제목, 내용에서 키워드 검색
 * - 카테고리별 필터링
 * - 간단한 CLI 인터페이스
 */

class DocumentSearch {
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
        const titleMatch = content.match(/^#\s+(.+)$/m);
        
        this.documents.push({
          path: itemRelativePath,
          fullPath: fullPath,
          name: item.replace('.md', ''),
          title: titleMatch ? titleMatch[1].trim() : item.replace('.md', ''),
          content: content,
          category: itemRelativePath.split(path.sep)[0]
        });
      }
    }
  }

  // 검색 실행
  search(query, options = {}) {
    const { category, titleOnly = false } = options;
    const searchTerm = query.toLowerCase().trim();
    
    if (!searchTerm) return [];
    
    let results = this.documents.filter(doc => {
      // 카테고리 필터
      if (category && doc.category !== category) {
        return false;
      }
      
      const titleLower = doc.title.toLowerCase();
      const contentLower = doc.content.toLowerCase();
      const pathLower = doc.path.toLowerCase();
      
      // 카테고리 기반 검색 개선
      if (this.isCategorySearch(searchTerm)) {
        return this.searchByCategory(doc, searchTerm);
      }
      
      // 검색 범위
      if (titleOnly) {
        return titleLower.includes(searchTerm);
      } else {
        return titleLower.includes(searchTerm) || 
               contentLower.includes(searchTerm) ||
               pathLower.includes(searchTerm);
      }
    });
    
    // 관련도 점수 계산
    results = results.map(doc => {
      let score = 0;
      const titleLower = doc.title.toLowerCase();
      const contentLower = doc.content.toLowerCase();
      
      // 제목 매치 점수
      if (titleLower === searchTerm) {
        score += 100; // 정확한 제목 매치
      } else if (titleLower.includes(searchTerm)) {
        score += 50; // 부분 제목 매치
      }
      
      // 내용 매치 점수 (첫 번째 문단에서 더 높은 점수)
      const firstParagraph = contentLower.split('\n\n')[0] || '';
      const firstMatches = (firstParagraph.match(new RegExp(searchTerm, 'g')) || []).length;
      const totalMatches = (contentLower.match(new RegExp(searchTerm, 'g')) || []).length;
      
      score += firstMatches * 10; // 첫 문단 매치
      score += (totalMatches - firstMatches) * 2; // 나머지 매치
      
      return { ...doc, score };
    });
    
    // 점수순 정렬
    results.sort((a, b) => b.score - a.score);
    
    return results;
  }

  // 카테고리 검색인지 판단
  isCategorySearch(searchTerm) {
    const categoryTerms = ['프론트엔드', '백엔드', '알고리즘', '언어', '네트워킹', '웹개발', 'frontend', 'backend'];
    return categoryTerms.includes(searchTerm);
  }

  // 카테고리별 검색 로직
  searchByCategory(doc, searchTerm) {
    const pathLower = doc.path.toLowerCase();
    const categoryLower = doc.category.toLowerCase();
    
    switch (searchTerm) {
      case '프론트엔드':
      case 'frontend':
        return pathLower.includes('frontend') || pathLower.includes('react') || pathLower.includes('css');
      
      case '백엔드':
      case 'backend':
        return pathLower.includes('backend') || categoryLower === 'databases';
      
      case '알고리즘':
        return categoryLower === 'algorithms';
      
      case '언어':
      case 'languages':
        return categoryLower === 'languages';
      
      case '네트워킹':
      case 'networking':
        return categoryLower === 'networking';
      
      case '웹개발':
      case 'web-development':
        return categoryLower === 'web-development';
      
      default:
        return false;
    }
  }

  // 검색 결과 출력
  displayResults(results, query) {
    // 시스템 파일 필터링
    const filteredResults = results.filter(doc => 
      doc.name !== 'NAVIGATION' && doc.name !== 'README'
    );
    
    if (filteredResults.length === 0) {
      console.log(`❌ "${query}"에 대한 검색 결과가 없습니다.`);
      return;
    }
    
    console.log(`\n🔍 "${query}" 검색 결과: ${filteredResults.length}개\n`);
    
    filteredResults.slice(0, 10).forEach((doc, index) => { // 상위 10개만 표시
      
      const categoryName = this.getCategoryDisplayName(doc.category);
      
      console.log(`${index + 1}. 📖 ${doc.title}`);
      console.log(`   🏷️  ${categoryName}`);
      
      // 내용 미리보기 (검색어 주변 텍스트)
      const preview = this.getPreview(doc.content, query);
      if (preview && preview.length > 20) {
        console.log(`   📝 ${preview}`);
      }
      
      console.log(`   📂 ${doc.path}`);
      
      // 디버그 정보 (개발 환경에서만)
      if (process.env.NODE_ENV === 'development' && doc.score) {
        console.log(`   🎯 점수: ${doc.score}`);
      }
      
      console.log();
    });
    
    if (results.length > 10) {
      console.log(`💡 더 많은 결과가 있습니다. 검색어를 더 구체적으로 입력해보세요.`);
    }
  }

  // CLI 실행
  run() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      console.log('사용법: node scripts/search.js <검색어> [옵션]');
      console.log('');
      console.log('옵션:');
      console.log('  --category <카테고리>  특정 카테고리에서만 검색');
      console.log('  --title-only          제목에서만 검색');
      console.log('');
      console.log('예시:');
      console.log('  node scripts/search.js "React"');
      console.log('  node scripts/search.js "알고리즘" --category algorithms');
      console.log('  node scripts/search.js "패턴" --title-only');
      return;
    }
    
    const query = args[0];
    const options = {};
    
    // 옵션 파싱
    for (let i = 1; i < args.length; i++) {
      if (args[i] === '--category' && args[i + 1]) {
        options.category = args[i + 1];
        i++;
      } else if (args[i] === '--title-only') {
        options.titleOnly = true;
      }
    }
    
    console.log('📄 문서 스캔 중...');
    this.scanDocuments();
    console.log(`✅ ${this.documents.length}개 문서 스캔 완료`);
    console.log();
    
    const results = this.search(query, options);
    this.displayResults(results, query);
  }

  // 카테고리 표시명 변환
  getCategoryDisplayName(category) {
    const categoryMap = {
      'algorithms': '알고리즘',
      'languages': '프로그래밍 언어',
      'networking': '네트워킹',
      'web-development': '웹 개발',
      'databases': '데이터베이스',
      'operating-systems': '운영체제',
      'security': '보안'
    };
    return categoryMap[category] || category;
  }

  // 검색어 주변 텍스트 미리보기
  getPreview(content, query, maxLength = 80) {
    const searchTerm = query.toLowerCase();
    const contentLower = content.toLowerCase();
    
    // 마크다운 헤더, 링크, 코드 블록 제거
    let cleanContent = content
      .replace(/#{1,6}\s+/g, '') // 헤더 제거
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 링크 텍스트만 남기기
      .replace(/```[\s\S]*?```/g, '') // 코드 블록 제거
      .replace(/`([^`]+)`/g, '$1') // 인라인 코드 제거
      .replace(/\|[^\n]*\|/g, '') // 테이블 제거
      .replace(/\n+/g, ' ') // 줄바꿈을 공백으로
      .replace(/\s+/g, ' ') // 연속 공백 정리
      .trim();
    
    const cleanContentLower = cleanContent.toLowerCase();
    const index = cleanContentLower.indexOf(searchTerm);
    
    if (index === -1) return null;
    
    // 문장 단위로 자르기
    const sentences = cleanContent.split(/[.!?]\s+/);
    let targetSentence = '';
    
    for (const sentence of sentences) {
      if (sentence.toLowerCase().includes(searchTerm)) {
        targetSentence = sentence.trim();
        break;
      }
    }
    
    if (!targetSentence) {
      // 문장을 찾지 못하면 기존 방식 사용
      const start = Math.max(0, index - 40);
      const end = Math.min(cleanContent.length, index + searchTerm.length + 40);
      targetSentence = cleanContent.substring(start, end).trim();
    }
    
    // 길이 제한
    if (targetSentence.length > maxLength) {
      targetSentence = targetSentence.substring(0, maxLength) + '...';
    }
    
    return targetSentence;
  }
}

// 스크립트 실행
if (require.main === module) {
  const rootDir = path.join(__dirname, '..');
  const search = new DocumentSearch(rootDir);
  search.run();
}

module.exports = DocumentSearch;
