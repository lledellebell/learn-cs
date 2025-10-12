#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const NavigationGenerator = require('./generate-navigation');

/**
 * RSS 2.0 피드 생성기
 * 학습 문서들을 RSS 형식으로 발행합니다.
 */

class RSSFeedGenerator {
  constructor(config = {}) {
    this.config = {
      title: config.title || 'CS 학습 노트',
      description: config.description || '컴퓨터 과학 개념과 기술을 학습하고 기록하는 공간',
      link: config.link || 'https://github.com/lledellebell/learn-cs',
      language: config.language || 'ko',
      author: config.author || 'lledellebell',
      feedUrl: config.feedUrl || 'https://lledellebell.github.io/learn-cs/feed.xml',
      imageUrl: config.imageUrl || 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDFtbXJsZXJtMGdkZXZpbmVoNnRtdGNnNjJvZHVxdGVvZnRqcTNvZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/f3iwJFOVOwuy7K6FFw/giphy.gif',
      maxItems: config.maxItems || 50
    };
  }

  /**
   * XML 특수문자 이스케이프
   */
  escapeXml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * RFC 822 날짜 형식으로 변환
   */
  toRFC822Date(date) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const d = new Date(date);
    const day = days[d.getDay()];
    const date_num = d.getDate().toString().padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const seconds = d.getSeconds().toString().padStart(2, '0');

    return `${day}, ${date_num} ${month} ${year} ${hours}:${minutes}:${seconds} +0000`;
  }

  /**
   * RSS 아이템 생성
   */
  generateItem(doc) {
    const link = `${this.config.link}/blob/master/${doc.path.replace(/\\/g, '/')}`;
    const guid = link;

    // 카테고리 정보
    const category = this.getCategoryDisplayName(doc.category);

    // 설명 생성 (description이 없으면 제목 사용)
    const description = doc.description || `${doc.title}에 대한 학습 노트`;

    return `
    <item>
      <title>${this.escapeXml(doc.title)}</title>
      <link>${this.escapeXml(link)}</link>
      <guid isPermaLink="true">${this.escapeXml(guid)}</guid>
      <pubDate>${this.toRFC822Date(doc.createdDate)}</pubDate>
      <category>${this.escapeXml(category)}</category>
      <description>${this.escapeXml(description)}</description>
      <author>${this.config.author}</author>
    </item>`;
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
   * RSS 피드 생성
   */
  generate(documents) {
    // 최근 수정된 문서 순으로 정렬
    const sortedDocs = [...documents]
      .sort((a, b) => b.lastModified - a.lastModified)
      .slice(0, this.config.maxItems);

    const lastBuildDate = sortedDocs.length > 0
      ? this.toRFC822Date(sortedDocs[0].lastModified)
      : this.toRFC822Date(new Date());

    const items = sortedDocs.map(doc => this.generateItem(doc)).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${this.escapeXml(this.config.title)}</title>
    <link>${this.escapeXml(this.config.link)}</link>
    <description>${this.escapeXml(this.config.description)}</description>
    <language>${this.config.language}</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${this.escapeXml(this.config.feedUrl)}" rel="self" type="application/rss+xml"/>
    <image>
      <url>${this.escapeXml(this.config.imageUrl)}</url>
      <title>${this.escapeXml(this.config.title)}</title>
      <link>${this.escapeXml(this.config.link)}</link>
    </image>
${items}
  </channel>
</rss>`;
  }
}

// 스크립트 실행
if (require.main === module) {
  const rootDir = path.join(__dirname, '..');

  console.log('📡 RSS 피드 생성 중...');

  // 문서 정보 수집
  const navGenerator = new NavigationGenerator(rootDir);
  navGenerator.scanDocuments();

  console.log(`✅ ${navGenerator.documents.length}개의 문서를 발견했습니다.`);

  // RSS 생성
  const rssGenerator = new RSSFeedGenerator({
    title: 'CS 학습 노트',
    description: '컴퓨터 과학 개념과 기술을 학습하고 기록하는 공간',
    link: 'https://github.com/lledellebell/learn-cs',
    feedUrl: 'https://lledellebell.github.io/learn-cs/feed.xml',
    author: 'lledellebell'
  });

  const rss = rssGenerator.generate(navGenerator.documents);

  // 파일로 저장
  const outputPath = path.join(rootDir, 'feed.xml');
  fs.writeFileSync(outputPath, rss, 'utf8');

  console.log(`✅ RSS 피드가 ${outputPath}에 생성되었습니다.`);
  console.log(`📝 총 ${Math.min(navGenerator.documents.length, rssGenerator.config.maxItems)}개의 아이템이 포함되었습니다.`);
}

module.exports = RSSFeedGenerator;
