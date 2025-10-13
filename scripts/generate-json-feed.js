#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const NavigationGenerator = require('./generate-navigation');

/**
 * JSON Feed 1.1 생성기
 * 학습 문서들을 JSON Feed 형식으로 발행합니다.
 * 스펙: https://www.jsonfeed.org/version/1.1/
 */

class JSONFeedGenerator {
  constructor(config = {}) {
    this.config = {
      title: config.title || 'CS 학습 노트',
      description: config.description || '컴퓨터 과학 개념과 기술을 학습하고 기록하는 공간',
      homePageUrl: config.homePageUrl || 'https://github.com/lledellebell/learn-cs',
      feedUrl: config.feedUrl || 'https://lledellebell.github.io/learn-cs/feed.json',
      icon: config.icon || 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDFtbXJsZXJtMGdkZXZpbmVoNnRtdGNnNjJvZHVxdGVvZnRqcTNvZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/f3iwJFOVOwuy7K6FFw/giphy.gif',
      favicon: config.favicon || 'https://github.githubassets.com/favicons/favicon.png',
      author: {
        name: config.authorName || 'deep',
        url: config.authorUrl || 'https://github.com/lledellebell'
      },
      language: config.language || 'ko',
      userComment: config.userComment || '이 피드는 JSON Feed 1.1 포맷을 사용하며, 최근 학습한 CS 개념과 기술 문서를 제공합니다.',
      maxItems: config.maxItems || 50
    };
  }

  /**
   * 카테고리 표시명 반환
   */
  getCategoryDisplayName(category) {
    const categoryMap = {
      'algorithms': '알고리즘',
      'data-structures': '자료구조',
      'languages': '프로그래밍 언어',
      'networking': '네트워킹',
      'operating-systems': '운영체제',
      'databases': '데이터베이스',
      'web-development': '웹 개발',
      'security': '보안',
      'misc': '기타'
    };
    return categoryMap[category] || category;
  }

  /**
   * JSON Feed 아이템 생성
   */
  generateItem(doc) {
    const url = `${this.config.homePageUrl}/blob/master/${doc.path.replace(/\\/g, '/')}`;
    const category = this.getCategoryDisplayName(doc.category);

    // 평문 콘텐츠
    const contentText = doc.description || `${doc.title}에 대한 학습 노트`;

    // HTML 형식의 콘텐츠
    const contentHtml = `<p>${this.escapeHtml(contentText)}</p>`;

    // 요약 (description이 있으면 사용)
    const summary = doc.description || `${doc.title}에 대한 내용`;

    return {
      id: url,
      url: url,
      title: doc.title,
      content_html: contentHtml,
      content_text: contentText,
      summary: summary,
      date_published: new Date(doc.createdDate).toISOString(),
      date_modified: new Date(doc.lastModified).toISOString(),
      tags: [category],
      authors: [this.config.author]
    };
  }

  /**
   * HTML 특수문자 이스케이프
   */
  escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * JSON Feed 생성
   */
  generate(documents) {
    // 최근 수정된 문서 순으로 정렬
    const sortedDocs = [...documents]
      .sort((a, b) => b.lastModified - a.lastModified)
      .slice(0, this.config.maxItems);

    const items = sortedDocs.map(doc => this.generateItem(doc));

    const feed = {
      version: 'https://jsonfeed.org/version/1.1',
      title: this.config.title,
      home_page_url: this.config.homePageUrl,
      feed_url: this.config.feedUrl,
      description: this.config.description,
      user_comment: this.config.userComment,
      icon: this.config.icon,
      favicon: this.config.favicon,
      language: this.config.language,
      authors: [this.config.author],
      items: items
    };

    return JSON.stringify(feed, null, 2);
  }
}

// 스크립트 실행
if (require.main === module) {
  const rootDir = path.join(__dirname, '..');

  console.log('📡 JSON Feed 생성 중...');

  // 문서 정보 수집
  const navGenerator = new NavigationGenerator(rootDir);
  navGenerator.scanDocuments();

  console.log(`✅ ${navGenerator.documents.length}개의 문서를 발견했습니다.`);

  // JSON Feed 생성
  const jsonFeedGenerator = new JSONFeedGenerator({
    title: 'CS 학습 노트',
    description: '컴퓨터 과학 개념과 기술을 학습하고 기록하는 공간',
    homePageUrl: 'https://github.com/lledellebell/learn-cs',
    feedUrl: 'https://lledellebell.github.io/learn-cs/feed.json',
    authorName: 'lledellebell',
    authorUrl: 'https://github.com/lledellebell'
  });

  const jsonFeed = jsonFeedGenerator.generate(navGenerator.documents);

  // 파일로 저장
  const outputPath = path.join(rootDir, 'feed.json');
  fs.writeFileSync(outputPath, jsonFeed, 'utf8');

  console.log(`✅ JSON Feed가 ${outputPath}에 생성되었습니다.`);
  console.log(`📝 총 ${Math.min(navGenerator.documents.length, jsonFeedGenerator.config.maxItems)}개의 아이템이 포함되었습니다.`);
}

module.exports = JSONFeedGenerator;
