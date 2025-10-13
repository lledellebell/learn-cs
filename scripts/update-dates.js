#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Front Matter 날짜 자동 업데이트 스크립트
 * NAVIGATION.md의 날짜 정보를 기반으로 date와 last_modified_at을 자동으로 설정합니다.
 */

class DateUpdater {
  constructor(rootDir) {
    this.rootDir = rootDir;
    this.updatedFiles = [];
    this.skippedFiles = [];
    this.navigationData = null;
  }

  /**
   * NAVIGATION.md 파싱하여 날짜 정보 추출
   */
  parseNavigationFile() {
    const navigationPath = path.join(this.rootDir, 'NAVIGATION.md');

    if (!fs.existsSync(navigationPath)) {
      throw new Error('NAVIGATION.md 파일을 찾을 수 없습니다.');
    }

    const content = fs.readFileSync(navigationPath, 'utf8');
    const dateMap = new Map();

    // 마크다운 테이블에서 파일 정보 추출
    // 형식: | [제목](/path/to/file.md) | 2025년 10월 2일 | 2025년 10월 13일 | ![상태](...) |
    const tableRowRegex = /\|\s*\[.*?\]\((\/.*?\.md)\)\s*\|\s*(\d{4}년 \d{1,2}월 \d{1,2}일)\s*\|\s*(\d{4}년 \d{1,2}월 \d{1,2}일)\s*\|/g;

    let match;
    while ((match = tableRowRegex.exec(content)) !== null) {
      const [, filePath, creationDate, modificationDate] = match;

      // 파일 경로 정규화 (앞의 / 제거)
      const normalizedPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;

      dateMap.set(normalizedPath, {
        creation: this.parseKoreanDate(creationDate),
        modification: this.parseKoreanDate(modificationDate)
      });
    }

    this.navigationData = dateMap;
    console.log(`📋 NAVIGATION.md에서 ${dateMap.size}개 파일의 날짜 정보를 찾았습니다.\n`);
    return dateMap;
  }

  /**
   * 한국어 날짜 형식을 Date 객체로 변환
   * 예: "2025년 10월 2일" -> Date(2025, 9, 2)
   */
  parseKoreanDate(koreanDate) {
    const match = koreanDate.match(/(\d{4})년 (\d{1,2})월 (\d{1,2})일/);
    if (!match) return null;

    const [, year, month, day] = match;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  /**
   * NAVIGATION.md에서 파일의 날짜 정보 가져오기
   */
  getFileDatesFromNavigation(filePath) {
    if (!this.navigationData) {
      this.parseNavigationFile();
    }

    // 상대 경로로 변환
    const relativePath = path.relative(this.rootDir, filePath);
    return this.navigationData.get(relativePath) || null;
  }

  /**
   * Front matter 파싱
   */
  parseFrontMatter(content) {
    const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
    const match = content.match(frontMatterRegex);

    if (!match) {
      return null;
    }

    const frontMatterText = match[1];
    const frontMatter = {};

    // YAML 파싱 (간단한 key: value 형태)
    const lines = frontMatterText.split('\n');
    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();
        frontMatter[key] = value;
      }
    }

    return {
      frontMatter,
      fullMatch: match[0],
      contentWithoutFrontMatter: content.substring(match[0].length)
    };
  }

  /**
   * Front matter를 문자열로 변환
   */
  stringifyFrontMatter(frontMatter) {
    let result = '---\n';

    // 순서 유지: title, date, last_modified_at, 나머지
    const orderedKeys = ['title', 'date', 'last_modified_at'];
    const remainingKeys = Object.keys(frontMatter).filter(
      key => !orderedKeys.includes(key)
    );

    for (const key of [...orderedKeys, ...remainingKeys]) {
      if (frontMatter[key]) {
        result += `${key}: ${frontMatter[key]}\n`;
      }
    }

    result += '---\n';
    return result;
  }

  /**
   * 날짜를 YYYY-MM-DD 형식으로 변환
   */
  formatDate(date) {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * 마크다운에서 첫 번째 제목 추출
   */
  extractTitle(content) {
    // Front matter 제거 후 첫 번째 # 제목 찾기
    const withoutFrontMatter = content.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '');
    const titleMatch = withoutFrontMatter.match(/^#\s+(.+)$/m);
    return titleMatch ? titleMatch[1].trim() : null;
  }

  /**
   * 마크다운 파일의 날짜 업데이트
   */
  updateFileDate(filePath) {
    const relativePath = path.relative(this.rootDir, filePath);

    // NAVIGATION.md에서 날짜 정보 가져오기
    const dates = this.getFileDatesFromNavigation(filePath);

    if (!dates) {
      this.skippedFiles.push({
        path: relativePath,
        reason: 'NAVIGATION.md에 날짜 정보 없음'
      });
      return false;
    }

    // 파일 읽기
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = this.parseFrontMatter(content);

    let frontMatter;
    let contentWithoutFrontMatter;
    let updated = false;

    if (!parsed) {
      // Front matter가 없는 경우 새로 생성
      const title = this.extractTitle(content);

      frontMatter = {
        title: title || 'Untitled',
        layout: 'page'
      };
      contentWithoutFrontMatter = content;
      updated = true;
    } else {
      frontMatter = parsed.frontMatter;
      contentWithoutFrontMatter = parsed.contentWithoutFrontMatter;
    }

    const formattedCreationDate = this.formatDate(dates.creation);
    const formattedModificationDate = this.formatDate(dates.modification);

    // date 업데이트
    if (frontMatter.date !== formattedCreationDate) {
      frontMatter.date = formattedCreationDate;
      updated = true;
    }

    // last_modified_at 업데이트 (생성일과 다른 경우에만)
    if (formattedModificationDate !== formattedCreationDate) {
      if (frontMatter.last_modified_at !== formattedModificationDate) {
        frontMatter.last_modified_at = formattedModificationDate;
        updated = true;
      }
    } else {
      // 생성일과 수정일이 같으면 last_modified_at 제거
      if (frontMatter.last_modified_at) {
        delete frontMatter.last_modified_at;
        updated = true;
      }
    }

    if (updated) {
      const newContent = this.stringifyFrontMatter(frontMatter) + contentWithoutFrontMatter;
      fs.writeFileSync(filePath, newContent, 'utf8');

      this.updatedFiles.push({
        path: relativePath,
        date: frontMatter.date,
        lastModified: frontMatter.last_modified_at
      });

      return true;
    }

    return false;
  }

  /**
   * 모든 마크다운 파일 찾기
   */
  findMarkdownFiles(dir = this.rootDir) {
    const files = [];
    const excludeDirs = ['node_modules', '.git', '_site', 'vendor'];
    const excludeFiles = ['README.md', 'NAVIGATION.md'];

    const walk = (currentDir) => {
      const items = fs.readdirSync(currentDir);

      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          if (!excludeDirs.includes(item) && !item.startsWith('.')) {
            walk(fullPath);
          }
        } else if (item.endsWith('.md') && !excludeFiles.includes(item)) {
          files.push(fullPath);
        }
      }
    };

    walk(dir);
    return files;
  }

  /**
   * 모든 파일 업데이트
   */
  updateAll() {
    console.log('🔍 NAVIGATION.md 파싱 중...\n');
    this.parseNavigationFile();

    console.log('🔍 마크다운 파일 검색 중...\n');
    const files = this.findMarkdownFiles();
    console.log(`📝 ${files.length}개의 마크다운 파일을 찾았습니다.\n`);

    console.log('📅 날짜 정보 업데이트 중...\n');

    for (const file of files) {
      this.updateFileDate(file);
    }

    return {
      total: files.length,
      updated: this.updatedFiles.length,
      skipped: this.skippedFiles.length
    };
  }

  /**
   * 결과 출력
   */
  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('✅ 업데이트 완료!\n');

    console.log(`📊 통계:`);
    console.log(`  - 총 파일: ${this.updatedFiles.length + this.skippedFiles.length}개`);
    console.log(`  - 업데이트됨: ${this.updatedFiles.length}개`);
    console.log(`  - 건너뜀: ${this.skippedFiles.length}개\n`);

    if (this.updatedFiles.length > 0) {
      console.log('📝 업데이트된 파일:');
      for (const file of this.updatedFiles.slice(0, 10)) {
        console.log(`  ✓ ${file.path}`);
        console.log(`    - date: ${file.date}`);
        if (file.lastModified) {
          console.log(`    - last_modified_at: ${file.lastModified}`);
        }
      }

      if (this.updatedFiles.length > 10) {
        console.log(`  ... 외 ${this.updatedFiles.length - 10}개 파일\n`);
      }
    }

    if (this.skippedFiles.length > 0) {
      console.log('\n⏭️  건너뛴 파일:');
      const displayCount = Math.min(this.skippedFiles.length, 10);
      for (const file of this.skippedFiles.slice(0, displayCount)) {
        console.log(`  - ${file.path} (${file.reason})`);
      }
      if (this.skippedFiles.length > 10) {
        console.log(`  ... 외 ${this.skippedFiles.length - 10}개 파일\n`);
      }
    }

    console.log('='.repeat(60));
  }
}

// 스크립트 실행
if (require.main === module) {
  const rootDir = path.join(__dirname, '..');
  const updater = new DateUpdater(rootDir);

  try {
    const result = updater.updateAll();
    updater.printResults();

    process.exit(0);
  } catch (error) {
    console.error('\n❌ 오류 발생:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

module.exports = DateUpdater;
