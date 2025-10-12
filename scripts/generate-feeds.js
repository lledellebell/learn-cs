#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const NavigationGenerator = require('./generate-navigation');
const RSSFeedGenerator = require('./generate-rss');
const JSONFeedGenerator = require('./generate-json-feed');

/**
 * 통합 피드 생성기
 * RSS와 JSON Feed를 한 번에 생성합니다.
 */

class FeedGenerator {
  constructor(rootDir, config = {}) {
    this.rootDir = rootDir;
    this.config = {
      title: config.title || 'CS 학습 노트',
      description: config.description || '컴퓨터 과학 개념과 기술을 학습하고 기록하는 공간',
      homePageUrl: config.homePageUrl || 'https://github.com/lledellebell/learn-cs',
      rssUrl: config.rssUrl || 'https://lledellebell.github.io/learn-cs/feed.xml',
      jsonUrl: config.jsonUrl || 'https://lledellebell.github.io/learn-cs/feed.json',
      icon: config.icon || 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDFtbXJsZXJtMGdkZXZpbmVoNnRtdGNnNjJvZHVxdGVvZnRqcTNvZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/f3iwJFOVOwuy7K6FFw/giphy.gif',
      authorName: config.authorName || 'lledellebell',
      authorUrl: config.authorUrl || 'https://github.com/lledellebell',
      language: config.language || 'ko',
      maxItems: config.maxItems || 50
    };
  }

  /**
   * 모든 피드 생성
   */
  generateAll() {
    console.log('📡 피드 생성 시작...\n');

    // 1. 문서 정보 수집
    console.log('📄 문서 스캔 중...');
    const navGenerator = new NavigationGenerator(this.rootDir);
    navGenerator.scanDocuments();
    console.log(`✅ ${navGenerator.documents.length}개의 문서를 발견했습니다.\n`);

    const documents = navGenerator.documents;

    // 2. RSS 피드 생성
    console.log('📡 RSS 피드 생성 중...');
    const rssGenerator = new RSSFeedGenerator({
      title: this.config.title,
      description: this.config.description,
      link: this.config.homePageUrl,
      feedUrl: this.config.rssUrl,
      imageUrl: this.config.icon,
      author: this.config.authorName,
      language: this.config.language,
      maxItems: this.config.maxItems
    });

    const rss = rssGenerator.generate(documents);
    const rssPath = path.join(this.rootDir, 'feed.xml');
    fs.writeFileSync(rssPath, rss, 'utf8');
    console.log(`✅ RSS 피드: ${rssPath}\n`);

    // 3. JSON Feed 생성
    console.log('📡 JSON Feed 생성 중...');
    const jsonFeedGenerator = new JSONFeedGenerator({
      title: this.config.title,
      description: this.config.description,
      homePageUrl: this.config.homePageUrl,
      feedUrl: this.config.jsonUrl,
      icon: this.config.icon,
      authorName: this.config.authorName,
      authorUrl: this.config.authorUrl,
      language: this.config.language,
      maxItems: this.config.maxItems
    });

    const jsonFeed = jsonFeedGenerator.generate(documents);
    const jsonPath = path.join(this.rootDir, 'feed.json');
    fs.writeFileSync(jsonPath, jsonFeed, 'utf8');
    console.log(`✅ JSON Feed: ${jsonPath}\n`);

    // 4. 통계 출력
    console.log('📊 피드 생성 완료!');
    console.log(`   총 문서: ${documents.length}개`);
    console.log(`   포함된 아이템: ${Math.min(documents.length, this.config.maxItems)}개`);

    // 5. 카테고리별 통계
    const categoryCount = {};
    documents.forEach(doc => {
      categoryCount[doc.category] = (categoryCount[doc.category] || 0) + 1;
    });

    console.log('\n📁 카테고리별 문서:');
    Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        const displayName = rssGenerator.getCategoryDisplayName(category);
        console.log(`   ${displayName}: ${count}개`);
      });

    console.log('\n🔗 피드 URL:');
    console.log(`   RSS: ${this.config.rssUrl}`);
    console.log(`   JSON: ${this.config.jsonUrl}`);

    return {
      rssPath,
      jsonPath,
      totalDocs: documents.length,
      includedItems: Math.min(documents.length, this.config.maxItems)
    };
  }
}

// 스크립트 실행
if (require.main === module) {
  const rootDir = path.join(__dirname, '..');

  const generator = new FeedGenerator(rootDir, {
    title: 'CS 학습 노트',
    description: '컴퓨터 과학 개념과 기술을 학습하고 기록하는 공간',
    homePageUrl: 'https://github.com/lledellebell/learn-cs',
    rssUrl: 'https://lledellebell.github.io/learn-cs/feed.xml',
    jsonUrl: 'https://lledellebell.github.io/learn-cs/feed.json',
    authorName: 'lledellebell',
    authorUrl: 'https://github.com/lledellebell'
  });

  generator.generateAll();
}

module.exports = FeedGenerator;
