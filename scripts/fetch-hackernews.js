#!/usr/bin/env node

/**
 * HackerNews Top Stories 가져오기 및 번역 스크립트
 *
 * 이 스크립트는:
 * 1. HackerNews API에서 Top Stories를 가져옵니다
 * 2. 상위 10개 뉴스를 선택합니다
 * 3. 각 뉴스의 제목, URL, 점수, 댓글 수를 수집합니다
 * 4. tech-news/ 디렉토리에 날짜별 마크다운 파일로 저장합니다
 * 5. 번역 API를 사용해서 한글로 번역합니다
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// 설정
const CONFIG = {
  baseUrl: 'https://hacker-news.firebaseio.com/v0',
  topStoriesCount: 10,
  outputDir: path.join(__dirname, '../tech-news'),
  translationEnabled: process.env.ENABLE_TRANSLATION === 'true',
  translateApiKey: process.env.TRANSLATE_API_KEY || '',
  summaryEnabled: process.env.ENABLE_SUMMARY !== 'false', // 기본값: true
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-pro', // gemini-pro
};

/**
 * HTTPS GET 요청 헬퍼 (JSON)
 */
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

/**
 * HTTPS GET 요청 헬퍼 (텍스트)
 */
function httpsGetText(url) {
  return new Promise((resolve, reject) => {
    // URL 파싱
    const urlObj = new URL(url);

    https.get({
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HackerNewsBot/1.0)',
      },
      timeout: 10000, // 10초 타임아웃
    }, (res) => {
      // 리다이렉트 처리
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return httpsGetText(res.headers.location).then(resolve).catch(reject);
      }

      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
    }).on('error', reject).on('timeout', () => {
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * HTML을 텍스트로 변환
 */
function htmlToText(html) {
  // script, style 태그 제거
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // HTML 태그 제거
  text = text.replace(/<[^>]+>/g, ' ');

  // HTML 엔티티 디코딩
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");

  // 여러 공백을 하나로
  text = text.replace(/\s+/g, ' ');

  // 앞뒤 공백 제거
  return text.trim();
}

/**
 * Gemini API로 요약 생성
 */
async function generateSummaryWithAI(url, text) {
  if (!CONFIG.geminiApiKey) {
    console.warn(`⚠️  Gemini API 키가 없습니다. 요약을 건너뜁니다: ${url}`);
    return null;
  }

  try {
    // 텍스트가 너무 길면 자르기 (Gemini Pro는 30,720 토큰 제한)
    const maxLength = 15000; // 약 3750 토큰
    const truncatedText = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;

    const prompt = `다음 웹페이지의 내용을 2-3문장으로 한국어로 요약해주세요. 기술적인 내용이므로 정확하고 구체적으로 설명해주세요. 요약만 출력하고 다른 설명은 하지 마세요:\n\n${truncatedText}`;

    const postData = JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 300,
      },
    });

    const response = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/${CONFIG.geminiModel}:generateContent?key=${CONFIG.geminiApiKey}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
        timeout: 30000, // 30초 타임아웃
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      req.write(postData);
      req.end();
    });

    if (response.candidates && response.candidates[0] &&
        response.candidates[0].content && response.candidates[0].content.parts &&
        response.candidates[0].content.parts[0]) {
      return response.candidates[0].content.parts[0].text.trim();
    }

    return null;
  } catch (error) {
    console.warn(`⚠️  요약 생성 실패 (${url}): ${error.message}`);
    return null;
  }
}

/**
 * 웹페이지에서 요약 가져오기
 */
async function fetchPageSummary(url) {
  try {
    console.log(`  📄 페이지 가져오는 중: ${url.substring(0, 50)}...`);

    const html = await httpsGetText(url);
    const text = htmlToText(html);

    if (!text || text.length < 100) {
      console.warn(`  ⚠️  내용이 너무 짧습니다: ${url}`);
      return null;
    }

    console.log(`  🤖 AI 요약 생성 중...`);
    const summary = await generateSummaryWithAI(url, text);

    if (summary) {
      console.log(`  ✅ 요약 완료`);
    }

    return summary;
  } catch (error) {
    console.warn(`  ⚠️  페이지 가져오기 실패 (${url}): ${error.message}`);
    return null;
  }
}

/**
 * HackerNews API에서 Top Stories ID 목록 가져오기
 */
async function getTopStoryIds() {
  console.log('📰 HackerNews Top Stories ID 가져오는 중...');
  const url = `${CONFIG.baseUrl}/topstories.json`;
  const ids = await httpsGet(url);
  return ids.slice(0, CONFIG.topStoriesCount);
}

/**
 * Story ID로 상세 정보 가져오기
 */
async function getStoryDetails(id) {
  const url = `${CONFIG.baseUrl}/item/${id}.json`;
  return await httpsGet(url);
}

/**
 * 여러 스토리 동시에 가져오기
 */
async function fetchStories(ids) {
  console.log(`📥 ${ids.length}개 스토리 상세 정보 가져오는 중...`);
  const promises = ids.map((id) => getStoryDetails(id));
  const stories = await Promise.all(promises);
  return stories.filter((story) => story && story.title); // null 제거
}

/**
 * 간단한 번역 함수 (Google Translate API 사용)
 * API 키가 없으면 원문 그대로 반환
 */
async function translateText(text) {
  // 번역이 비활성화되어 있거나 API 키가 없으면 원문 반환
  if (!CONFIG.translationEnabled || !CONFIG.translateApiKey) {
    return null; // 번역 없음
  }

  try {
    // Google Cloud Translation API 사용
    const url = `https://translation.googleapis.com/language/translate/v2?key=${CONFIG.translateApiKey}`;
    const response = await new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        q: text,
        source: 'en',
        target: 'ko',
        format: 'text',
      });

      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const req = https.request(url, options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    if (response.data && response.data.translations) {
      return response.data.translations[0].translatedText;
    }
    return null;
  } catch (error) {
    console.warn(`⚠️  번역 실패: ${text.slice(0, 50)}...`);
    return null;
  }
}

/**
 * 마크다운 파일 생성
 */
async function generateMarkdown(stories) {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
  const displayDate = today.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  console.log('📝 마크다운 파일 생성 중...');

  // 번역 및 요약 처리
  const processedStories = [];

  for (const story of stories) {
    let translatedTitle = null;
    let summary = null;
    const url = story.url || `https://news.ycombinator.com/item?id=${story.id}`;

    // 제목 번역
    if (CONFIG.translationEnabled && CONFIG.translateApiKey) {
      console.log(`\n🌐 번역 중: ${story.title}`);
      translatedTitle = await translateText(story.title);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // 요약 생성 (URL이 있는 경우만)
    if (CONFIG.summaryEnabled && story.url) {
      console.log(`\n📝 요약 생성 중: ${story.title}`);
      summary = await fetchPageSummary(story.url);
      // API 호출 제한을 위한 지연
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    processedStories.push({
      ...story,
      translatedTitle,
      summary,
    });
  }

  console.log('\n📄 마크다운 작성 중...');

  // 마크다운 생성
  let markdown = `---
layout: default
title: "HackerNews 오늘의 IT 뉴스"
date: ${dateStr}
last_modified_at: ${today.toISOString()}
category: tech-news
---

# HackerNews 오늘의 IT 뉴스

**${displayDate}** 기준 HackerNews Top ${CONFIG.topStoriesCount} 이야기

---

`;

  processedStories.forEach((story, index) => {
    const rank = index + 1;
    const title = story.translatedTitle || story.title;
    const url = story.url || `https://news.ycombinator.com/item?id=${story.id}`;

    markdown += `
## ${rank}. ${title}

`;

    // 요약이 있으면 요약 표시
    if (story.summary) {
      markdown += `${story.summary}\n\n`;
    }

    // 원문 링크
    markdown += `**원문:** [${url}](${url})\n\n`;

    markdown += `---

`;
  });

  markdown += `
## 정보

- **출처:** [HackerNews](https://news.ycombinator.com/)
- **업데이트:** 이 뉴스는 매일 자동으로 업데이트됩니다
- **API:** [HackerNews API](https://github.com/HackerNews/API)

${CONFIG.summaryEnabled && CONFIG.geminiApiKey ? '\n**요약:** Google Gemini API 사용\n' : ''}
`;

  return { markdown, dateStr };
}

/**
 * 파일 저장
 */
function saveMarkdown(markdown, dateStr) {
  // 디렉토리 생성
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }

  const filename = `${dateStr}-hackernews-top-stories.md`;
  const filepath = path.join(CONFIG.outputDir, filename);

  fs.writeFileSync(filepath, markdown, 'utf-8');
  console.log(`✅ 파일 저장 완료: ${filepath}`);

  return filepath;
}

/**
 * 최신 뉴스 파일에 대한 심볼릭 링크 생성
 */
function createLatestLink(filepath) {
  const latestPath = path.join(CONFIG.outputDir, 'latest.md');

  // 기존 심볼릭 링크 제거
  if (fs.existsSync(latestPath)) {
    fs.unlinkSync(latestPath);
  }

  // 새 심볼릭 링크 생성 (상대 경로 사용)
  const relativePath = path.basename(filepath);
  try {
    fs.symlinkSync(relativePath, latestPath);
    console.log(`🔗 최신 뉴스 링크 생성: ${latestPath}`);
  } catch (error) {
    // Windows에서는 심볼릭 링크 생성이 실패할 수 있으므로 복사
    fs.copyFileSync(filepath, latestPath);
    console.log(`📋 최신 뉴스 복사: ${latestPath}`);
  }
}

/**
 * 메인 함수
 */
async function main() {
  console.log('🚀 HackerNews Top Stories 수집 시작\n');
  console.log(`설정:`);
  console.log(`  - 가져올 뉴스 개수: ${CONFIG.topStoriesCount}`);
  console.log(`  - 출력 디렉토리: ${CONFIG.outputDir}`);
  console.log(`  - 번역 활성화: ${CONFIG.translationEnabled}`);
  console.log(`  - 요약 생성: ${CONFIG.summaryEnabled ? (CONFIG.geminiApiKey ? '예 (Gemini)' : '아니오 (API 키 없음)') : '아니오'}`);
  console.log();

  try {
    // 1. Top Story IDs 가져오기
    const storyIds = await getTopStoryIds();
    console.log(`✅ Top ${storyIds.length}개 스토리 ID 가져오기 완료\n`);

    // 2. 각 스토리 상세 정보 가져오기
    const stories = await fetchStories(storyIds);
    console.log(`✅ ${stories.length}개 스토리 상세 정보 가져오기 완료\n`);

    // 3. 마크다운 생성 (번역 및 요약 포함)
    const { markdown, dateStr } = await generateMarkdown(stories);
    console.log(`\n✅ 마크다운 생성 완료\n`);

    // 4. 파일 저장
    const filepath = saveMarkdown(markdown, dateStr);

    // 5. 최신 뉴스 링크 생성
    createLatestLink(filepath);

    console.log('\n🎉 모든 작업 완료!\n');
    console.log('📊 요약:');
    console.log(`  - 수집한 뉴스: ${stories.length}개`);
    console.log(`  - 저장된 파일: ${filepath}`);
    console.log(`  - 번역 여부: ${CONFIG.translationEnabled ? '예' : '아니오'}`);
    console.log(`  - 요약 생성: ${CONFIG.summaryEnabled && CONFIG.geminiApiKey ? '예' : '아니오'}`);
  } catch (error) {
    console.error('❌ 에러 발생:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  main();
}

module.exports = { main, getTopStoryIds, fetchStories, generateMarkdown };
