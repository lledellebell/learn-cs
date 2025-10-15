---
title: JSON Feed 사양
date: 2025-10-13
categories: [Web Development, SEO]
tags: [this, Context, Scope, HTTP, Authentication, Security]
layout: page
---
# JSON Feed 사양

## 개요

JSON Feed는 RSS/Atom과 같은 콘텐츠 신디케이션(syndication) 포맷으로, XML 대신 JSON을 사용합니다. 2017년에 발표된 오픈 사양으로, JSON 표준만 이해하면 별도의 XML 파서 없이도 피드를 생성하고 파싱할 수 있습니다.

## 왜 JSON Feed인가?

### 기존 RSS/Atom의 문제점

#### 1. XML 파싱의 복잡성

RSS/Atom은 XML 기반이므로 파싱하기 위해 별도의 XML 파서가 필요하고, 엣지 케이스 처리가 복잡합니다.

**RSS XML 파싱 예시:**
```javascript
// XML 파싱 - RSS
const parseRSS = require('rss-parser');
const parser = new parseRSS();

try {
  const feed = await parser.parseURL('https://example.com/feed.xml');
  // XML 구조를 탐색해야 함
  const items = feed.items.map(item => ({
    title: item.title,
    link: item.link,
    description: item.contentSnippet || item.description
  }));
} catch (error) {
  // XML 파싱 에러 처리
}
```

**JSON Feed 파싱 예시:**
```javascript
// JSON 파싱 - JSON Feed
const response = await fetch('https://example.com/feed.json');
const feed = await response.json();

// 바로 사용 가능
const items = feed.items.map(item => ({
  title: item.title,
  link: item.url,
  description: item.content_text
}));
```

JSON은 `JSON.parse()` 하나로 즉시 JavaScript 객체로 변환되지만, XML은 별도의 파서 라이브러리가 필요합니다.

#### 2. 네임스페이스 충돌 문제

RSS와 Atom은 확장 기능을 추가할 때 XML 네임스페이스를 사용하는데, 이것이 복잡성을 크게 증가시킵니다.

**네임스페이스가 포함된 RSS 예시:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:media="http://search.yahoo.com/mrss/"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>My Blog</title>
    <item>
      <title>Post Title</title>
      <dc:creator>John Doe</dc:creator>
      <content:encoded><![CDATA[<p>HTML content</p>]]></content:encoded>
      <media:thumbnail url="https://example.com/image.jpg"/>
    </item>
  </channel>
</rss>
```

위 예시에서:
- `dc:creator`, `content:encoded`, `media:thumbnail` 등 여러 네임스페이스가 섞여 있음
- 각 네임스페이스를 별도로 선언하고 처리해야 함
- 파서가 네임스페이스를 지원하지 않으면 정보를 읽을 수 없음

**JSON Feed의 간단한 대안:**
```json
{
  "version": "https://jsonfeed.org/version/1.1",
  "title": "My Blog",
  "items": [
    {
      "title": "Post Title",
      "authors": [{"name": "John Doe"}],
      "content_html": "<p>HTML content</p>",
      "image": "https://example.com/image.jpg"
    }
  ]
}
```

네임스페이스 없이 명확한 필드명으로 모든 정보를 표현합니다.

#### 3. 상대적으로 장황한 문법

XML은 여는 태그와 닫는 태그를 모두 작성해야 하므로 동일한 정보를 표현하는 데 더 많은 문자가 필요합니다.

**RSS 2.0 예시:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>My Blog</title>
    <link>https://example.com</link>
    <description>A blog about programming</description>
    <language>ko</language>
    <item>
      <title>First Post</title>
      <link>https://example.com/posts/first</link>
      <guid isPermaLink="true">https://example.com/posts/first</guid>
      <description><![CDATA[<p>This is my first post</p>]]></description>
      <pubDate>Mon, 13 Oct 2025 10:00:00 +0900</pubDate>
      <category>JavaScript</category>
      <category>Web</category>
    </item>
  </channel>
</rss>
```

**동일한 내용의 JSON Feed:**
```json
{
  "version": "https://jsonfeed.org/version/1.1",
  "title": "My Blog",
  "home_page_url": "https://example.com",
  "description": "A blog about programming",
  "language": "ko",
  "items": [
    {
      "id": "https://example.com/posts/first",
      "url": "https://example.com/posts/first",
      "title": "First Post",
      "content_html": "<p>This is my first post</p>",
      "date_published": "2025-10-13T10:00:00+09:00",
      "tags": ["JavaScript", "Web"]
    }
  ]
}
```

위 두 예시를 비교하면:
- **문자 수**: RSS는 약 450자, JSON Feed는 약 320자 (약 30% 감소)
- **중복**: RSS는 여는/닫는 태그 쌍 필요 (예: `<item>...</item>`), JSON은 단순 객체
- **특수 문법**: RSS는 `CDATA` 섹션 필요, JSON은 불필요
- **배열 표현**: RSS는 동일 태그 반복 (`<category>` 2번), JSON은 배열 `[]` 사용

### JSON Feed의 장점

#### 1. JavaScript 객체 표기법 활용

JSON은 JavaScript 객체 표기법을 그대로 사용하므로, JavaScript로 작업하는 웹 개발자에게 별도 학습이 필요 없습니다. 키-값 쌍 구조로 데이터를 표현합니다.

```json
{
  "title": "My Blog",
  "items": [
    {
      "id": "1",
      "title": "Hello World",
      "content_text": "This is my first post"
    }
  ]
}
```

#### 2. 대부분의 프로그래밍 언어에서 기본 지원

JSON은 사실상 모든 현대 프로그래밍 언어에서 표준 라이브러리로 지원됩니다.

**JavaScript:**
```javascript
const feed = JSON.parse(jsonString);
console.log(feed.title);
```

**Python:**
```python
import json
feed = json.loads(json_string)
print(feed['title'])
```

**Go:**
```go
var feed Feed
json.Unmarshal([]byte(jsonString), &feed)
fmt.Println(feed.Title)
```

**Ruby:**
```ruby
require 'json'
feed = JSON.parse(json_string)
puts feed['title']
```

별도의 써드파티 라이브러리 설치 없이 바로 사용 가능합니다.

#### 3. 내장 함수만으로 파싱과 생성 가능

**피드 생성하기:**
```javascript
// JSON Feed 생성
const feed = {
  version: 'https://jsonfeed.org/version/1.1',
  title: 'My Blog',
  items: posts.map(post => ({
    id: post.id,
    title: post.title,
    content_html: post.content
  }))
};

// 문자열로 변환
const feedString = JSON.stringify(feed, null, 2);
```

RSS/Atom에서는 XML 빌더 라이브러리나 템플릿 엔진이 필요하지만, JSON Feed는 일반 객체를 만들고 `JSON.stringify()`만 호출하면 됩니다.

#### 4. 네임스페이스 없이 확장 가능

JSON Feed는 커스텀 필드를 추가할 때 `_` 접두사를 붙인 속성을 추가하기만 하면 됩니다. 별도의 네임스페이스 선언이 필요 없습니다.

```json
{
  "version": "https://jsonfeed.org/version/1.1",
  "title": "My Blog",
  "_custom_analytics": {
    "tracking_id": "GA-12345",
    "category": "tech-blog"
  },
  "items": [
    {
      "id": "1",
      "title": "Post",
      "_reading_time": 5,
      "_view_count": 1234,
      "_custom_metadata": {
        "featured": true,
        "premium": false
      }
    }
  ]
}
```

RSS/Atom에서는 별도의 XML 네임스페이스를 정의하고 선언해야 하지만, JSON Feed는 필드를 추가하기만 하면 됩니다. 기존 파서들은 알 수 없는 필드를 자동으로 무시하므로 하위 호환성이 유지됩니다.

## 기본 구조

JSON Feed는 크게 두 부분으로 구성됩니다.
1. **최상위 피드 메타데이터**: 피드 자체에 대한 정보
2. **아이템 배열**: 개별 콘텐츠 항목들

### 최소 필수 구조

```json
{
  "version": "https://jsonfeed.org/version/1.1",
  "title": "My Example Feed",
  "items": [
    {
      "id": "1",
      "content_text": "Hello, World!"
    }
  ]
}
```

## 최상위 피드 필드

### 필수 필드

#### `version` (문자열, 필수)
- 사용하는 JSON Feed 포맷 버전의 URL
- 현재 버전: `"https://jsonfeed.org/version/1.1"`

```json
{
  "version": "https://jsonfeed.org/version/1.1"
}
```

#### `title` (문자열, 필수)
- 피드의 이름
- 평문(plain text)으로 작성

```json
{
  "title": "개발 블로그"
}
```

### 강력 권장 필드

>  **왜 "필수"가 아니라 "강력 권장"인가?**
> 
>  기술적으로 피드는 이 필드들 없이도 작동하지만, 실용성이 크게 떨어집니다.
>
>  - home_page_url 없으면 → 사용자가 원본 사이트를 찾을
>  방법이 없음
>  - feed_url 없으면 → 피드 리더가 구독을 제대로 관리하기
>   어려움

#### `home_page_url` (문자열, 강력 권장)
- 피드가 설명하는 리소스(웹사이트, 블로그 등)의 URL
- 피드 리더가 사용자를 원본 사이트로 안내할 때 사용

```json
{
  "home_page_url": "https://example.com"
}
```

#### `feed_url` (문자열, 강력 권장)
- 피드 자체의 URL
- 피드의 고유 식별자 역할
- 자기 참조(self-referencing) URL

```json
{
  "feed_url": "https://example.com/feed.json"
}
```

### 선택적 필드

#### `description` (문자열)
- 피드에 대한 설명
- 평문 또는 HTML 사용 가능

```json
{
  "description": "웹 개발과 프로그래밍에 관한 블로그입니다."
}
```

#### `user_comment` (문자열)
- 피드를 보는 사람에게 전달하는 설명이나 메시지
- 주로 피드 사용 방법이나 목적을 설명

```json
{
  "user_comment": "이 피드는 JSON Feed 포맷을 사용합니다."
}
```

#### `next_url` (문자열)
- 페이지네이션을 위한 다음 페이지 URL
- 피드 아이템이 많을 때 사용

```json
{
  "next_url": "https://example.com/feed.json?page=2"
}
```

#### `icon` (문자열)
- 피드의 아이콘 이미지 URL
- 정사각형 이미지 권장
- 큰 이미지 (512x512 이상)

```json
{
  "icon": "https://example.com/icon-512.png"
}
```

#### `favicon` (문자열)
- 피드의 파비콘 URL
- 작은 이미지 (64x64 이하)

```json
{
  "favicon": "https://example.com/favicon.ico"
}
```

#### `authors` (배열)
- 피드 전체의 저자 정보
- 각 저자는 `name`, `url`, `avatar` 필드를 가질 수 있음

```json
{
  "authors": [
    {
      "name": "홍길동",
      "url": "https://example.com/about",
      "avatar": "https://example.com/avatar.jpg"
    }
  ]
}
```

#### `language` (문자열)
- 피드의 주 언어
- BCP 47 언어 태그 사용 (예: `ko`, `en-US`)

```json
{
  "language": "ko"
}
```

#### `expired` (불리언)
- 피드가 더 이상 업데이트되지 않음을 나타냄
- `true`일 경우 피드 리더가 구독 해제를 권장할 수 있음

```json
{
  "expired": false
}
```

#### `hubs` (배열)
- WebSub(구 PubSubHubbub) 허브 정보
- 실시간 업데이트를 위한 설정

```json
{
  "hubs": [
    {
      "type": "WebSub",
      "url": "https://pubsubhubbub.appspot.com/"
    }
  ]
}
```

## 아이템 필드

`items` 배열의 각 객체는 개별 콘텐츠 항목을 나타냅니다.

### 필수 필드

#### `id` (문자열, 필수)
- 아이템의 고유 식별자
- 피드 내에서 영구적이고 고유해야 함
- URL이나 UUID 등 사용 가능

```json
{
  "id": "https://example.com/posts/1234"
}
```

또는

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### 권장 필드

#### `url` (문자열)
- 아이템의 퍼머링크(permalink)
- 사용자가 전체 콘텐츠를 볼 수 있는 URL

```json
{
  "url": "https://example.com/posts/hello-world"
}
```

#### `content_html` 또는 `content_text` (문자열, 둘 중 하나 필수)
- `content_html`: HTML 형식의 콘텐츠
- `content_text`: 평문 콘텐츠
- 둘 중 하나는 반드시 제공해야 함
- 두 개를 모두 제공할 수도 있음

```json
{
  "content_html": "<p>안녕하세요, 이것은 <strong>HTML</strong> 콘텐츠입니다.</p>"
}
```

또는

```json
{
  "content_text": "안녕하세요, 이것은 평문 콘텐츠입니다."
}
```

### 선택적 필드

#### `external_url` (문자열)
- 외부 링크 (예: 링크 블로그의 경우)
- `url`과는 다른, 참조하는 외부 리소스의 URL

```json
{
  "external_url": "https://other-site.com/article"
}
```

#### `title` (문자열)
- 아이템의 제목
- 평문 사용

```json
{
  "title": "JSON Feed 소개"
}
```

#### `summary` (문자열)
- 아이템의 요약
- 평문 사용
- 전체 콘텐츠가 아닌 짧은 설명

```json
{
  "summary": "JSON Feed에 대한 기본 개념과 사용법을 소개합니다."
}
```

#### `image` (문자열)
- 아이템의 대표 이미지 URL
- 배너 이미지나 썸네일로 사용

```json
{
  "image": "https://example.com/images/post-banner.jpg"
}
```

#### `banner_image` (문자열)
- 아이템의 배너 이미지 URL
- `image`보다 더 큰, 와이드 형식의 이미지

```json
{
  "banner_image": "https://example.com/images/wide-banner.jpg"
}
```

#### `date_published` (문자열)
- 아이템이 처음 게시된 날짜와 시간
- RFC 3339 포맷 사용

```json
{
  "date_published": "2025-10-13T10:30:00+09:00"
}
```

#### `date_modified` (문자열)
- 아이템이 마지막으로 수정된 날짜와 시간
- RFC 3339 포맷 사용

```json
{
  "date_modified": "2025-10-13T15:45:00+09:00"
}
```

#### `authors` (배열)
- 아이템의 저자 정보
- 피드 레벨 `authors`와 동일한 구조

```json
{
  "authors": [
    {
      "name": "김철수",
      "url": "https://example.com/authors/kim"
    }
  ]
}
```

#### `tags` (배열)
- 아이템과 관련된 태그들
- 문자열 배열

```json
{
  "tags": ["javascript", "web-development", "json"]
}
```

#### `language` (문자열)
- 아이템의 언어
- 피드의 기본 언어와 다른 경우 사용

```json
{
  "language": "en"
}
```

#### `attachments` (배열)
- 아이템에 첨부된 파일들
- 팟캐스트 오디오, 비디오 등

```json
{
  "attachments": [
    {
      "url": "https://example.com/podcast-episode-1.mp3",
      "mime_type": "audio/mpeg",
      "size_in_bytes": 24986239,
      "duration_in_seconds": 1234,
      "title": "에피소드 1"
    }
  ]
}
```

## 실전 예제

### 블로그 피드 예제

```json
{
  "version": "https://jsonfeed.org/version/1.1",
  "title": "개발 블로그",
  "home_page_url": "https://blog.example.com",
  "feed_url": "https://blog.example.com/feed.json",
  "description": "웹 개발과 프로그래밍에 관한 블로그",
  "icon": "https://blog.example.com/icon-512.png",
  "favicon": "https://blog.example.com/favicon.ico",
  "language": "ko",
  "authors": [
    {
      "name": "홍길동",
      "url": "https://blog.example.com/about",
      "avatar": "https://blog.example.com/avatar.jpg"
    }
  ],
  "items": [
    {
      "id": "https://blog.example.com/posts/2025/json-feed-intro",
      "url": "https://blog.example.com/posts/2025/json-feed-intro",
      "title": "JSON Feed 소개",
      "content_html": "<p>JSON Feed는 RSS를 대체할 수 있는 현대적인 신디케이션 포맷입니다...</p>",
      "summary": "JSON Feed의 기본 개념과 사용법",
      "date_published": "2025-10-13T10:00:00+09:00",
      "date_modified": "2025-10-13T10:30:00+09:00",
      "image": "https://blog.example.com/images/json-feed-intro.jpg",
      "tags": ["json", "web-development", "rss"],
      "authors": [
        {
          "name": "홍길동"
        }
      ]
    },
    {
      "id": "https://blog.example.com/posts/2025/react-hooks",
      "url": "https://blog.example.com/posts/2025/react-hooks",
      "title": "React Hooks 완전 정복",
      "content_html": "<p>React Hooks는 함수형 컴포넌트에서 상태와 생명주기를 다루는 방법입니다...</p>",
      "date_published": "2025-10-12T09:00:00+09:00",
      "tags": ["react", "javascript", "hooks"]
    }
  ]
}
```

### 마이크로블로그 피드 예제

마이크로블로그(트위터 스타일)의 경우 `title`이 없고 `content_text`만 사용할 수 있습니다.

```json
{
  "version": "https://jsonfeed.org/version/1.1",
  "title": "홍길동의 마이크로블로그",
  "home_page_url": "https://microblog.example.com",
  "feed_url": "https://microblog.example.com/feed.json",
  "items": [
    {
      "id": "12345",
      "content_text": "오늘 JSON Feed에 대해 배웠습니다. 정말 간단하고 직관적이네요!",
      "url": "https://microblog.example.com/posts/12345",
      "date_published": "2025-10-13T14:30:00+09:00"
    },
    {
      "id": "12344",
      "content_text": "개발자라면 JSON Feed를 써보는 것도 좋을 것 같아요.",
      "url": "https://microblog.example.com/posts/12344",
      "date_published": "2025-10-13T12:15:00+09:00"
    }
  ]
}
```

### 팟캐스트 피드 예제

```json
{
  "version": "https://jsonfeed.org/version/1.1",
  "title": "개발자 팟캐스트",
  "home_page_url": "https://podcast.example.com",
  "feed_url": "https://podcast.example.com/feed.json",
  "description": "개발자들을 위한 기술 토크쇼",
  "icon": "https://podcast.example.com/artwork-3000.jpg",
  "items": [
    {
      "id": "ep-001",
      "url": "https://podcast.example.com/episodes/1",
      "title": "에피소드 1: JSON Feed 소개",
      "content_html": "<p>첫 번째 에피소드에서는 JSON Feed에 대해 이야기합니다.</p>",
      "summary": "JSON Feed의 기본 개념과 활용법",
      "date_published": "2025-10-13T00:00:00+09:00",
      "attachments": [
        {
          "url": "https://podcast.example.com/episodes/1/audio.mp3",
          "mime_type": "audio/mpeg",
          "size_in_bytes": 52428800,
          "duration_in_seconds": 3600,
          "title": "에피소드 1"
        }
      ]
    }
  ]
}
```

## 확장 (Extensions)

JSON Feed는 커스텀 확장을 지원합니다. 확장은 최상위 레벨이나 아이템 레벨에서 `_`로 시작하는 키를 사용합니다.

### 확장 예제

```json
{
  "version": "https://jsonfeed.org/version/1.1",
  "title": "My Feed",
  "_custom_extension": {
    "reading_time_minutes": 5,
    "difficulty": "intermediate"
  },
  "items": [
    {
      "id": "1",
      "content_text": "Hello!",
      "_my_custom_data": {
        "views": 1234,
        "likes": 56
      }
    }
  ]
}
```

### 표준 확장

일부 확장은 커뮤니티에서 표준화되었습니다.
- `_blue_shed`: 팟캐스트 메타데이터
- `_microblog`: Micro.blog 관련 정보

## 구현 가이드

### 1. JSON Feed 생성하기

Node.js 예제:

```javascript
const fs = require('fs');

const feed = {
  version: 'https://jsonfeed.org/version/1.1',
  title: '내 블로그',
  home_page_url: 'https://myblog.com',
  feed_url: 'https://myblog.com/feed.json',
  items: posts.map(post => ({
    id: post.id,
    url: post.url,
    title: post.title,
    content_html: post.contentHtml,
    date_published: post.publishedAt.toISOString(),
    tags: post.tags
  }))
};

fs.writeFileSync('feed.json', JSON.stringify(feed, null, 2));
```

### 2. JSON Feed 제공하기

HTML `<head>`에 피드 링크 추가:

```html
<link
  rel="alternate"
  type="application/feed+json"
  title="내 블로그 피드"
  href="https://myblog.com/feed.json"
/>
```

### 3. Content-Type 설정

웹 서버에서 올바른 Content-Type 설정:

```
Content-Type: application/feed+json; charset=utf-8
```

### 4. CORS 설정

크로스 오리진 요청을 허용하려면 CORS 헤더 설정:

```
Access-Control-Allow-Origin: *
```

## JSON Feed vs RSS/Atom

| 특성 | JSON Feed | RSS/Atom |
|------|-----------|----------|
| 포맷 | JSON | XML |
| 파싱 방법 | `JSON.parse()` (내장) | XML 파서 라이브러리 필요 |
| 문자 수 | 상대적으로 적음 | 상대적으로 많음 (태그 중복) |
| 확장 방법 | `_` 접두사 필드 추가 | XML 네임스페이스 선언 |
| 브라우저 지원 | 추가 도구 필요 | 기본 렌더링 |
| 언어 지원 | 대부분 표준 라이브러리 | 대부분 표준 라이브러리 |
| 생태계 | 성장 중 (2017년 출시) | 성숙함 (1999년 출시) |

## 모범 사례 (Best Practices)

### 1. 필수 필드 제공
- `version`, `title`, `items`는 반드시 포함
- `feed_url`, `home_page_url`도 가능한 제공

### 2. 고유한 ID 사용
- 각 아이템의 `id`는 영구적이고 고유해야 함
- URL이나 UUID 사용 권장

### 3. 날짜 포맷 준수
- RFC 3339 포맷 사용
- 타임존 정보 포함 권장

### 4. 콘텐츠 제공
- `content_html` 또는 `content_text` 중 하나는 반드시 제공
- 가능하면 두 가지 모두 제공 (호환성 향상)

### 5. 이미지 최적화
- `icon`은 512x512 이상
- `favicon`은 64x64 이하
- 적절한 압축 적용

### 6. 페이지네이션
- 아이템이 많을 경우 `next_url` 사용
- 한 페이지당 20-50개 아이템 권장

### 7. 캐싱 고려
- 적절한 HTTP 캐싱 헤더 설정
- ETags 사용 권장

### 8. 유효성 검사
- JSON 문법 오류 확인
- 필수 필드 누락 확인
- URL 형식 검증

## 유효성 검사 도구

온라인 검증 도구:
- [JSON Feed Validator](https://validator.jsonfeed.org/)
- JSON 문법 검사: [JSONLint](https://jsonlint.com/)

## 피드 리더 지원

JSON Feed를 지원하는 주요 피드 리더:
- NetNewsWire (iOS, macOS)
- Feedbin
- Feedly (일부 지원)
- Inoreader
- NewsBlur

## 마이그레이션 가이드

### RSS에서 JSON Feed로 전환

RSS 필드 매핑:

| RSS | JSON Feed |
|-----|-----------|
| `<title>` (channel) | `title` |
| `<link>` (channel) | `home_page_url` |
| `<description>` (channel) | `description` |
| `<item>` | `items` |
| `<guid>` | `id` |
| `<link>` (item) | `url` |
| `<description>` (item) | `content_html` |
| `<pubDate>` | `date_published` |
| `<author>` | `authors` |
| `<category>` | `tags` |

### 두 포맷 동시 제공

사용자 선택권을 위해 RSS와 JSON Feed를 모두 제공하는 것이 좋습니다.

```html
<!-- RSS -->
<link
  rel="alternate"
  type="application/rss+xml"
  title="RSS Feed"
  href="/feed.xml"
/>

<!-- JSON Feed -->
<link
  rel="alternate"
  type="application/feed+json"
  title="JSON Feed"
  href="/feed.json"
/>
```

## 자주 묻는 질문 (FAQ)

### Q: JSON Feed가 RSS를 완전히 대체하나요?
A: 아직은 아닙니다. JSON Feed는 RSS의 현대적인 대안이지만, RSS의 생태계가 더 크고 성숙합니다. 두 포맷을 모두 제공하는 것이 좋습니다.

### Q: `content_html`과 `content_text` 중 무엇을 써야 하나요?
A: 콘텐츠에 따라 다릅니다. HTML 마크업이 필요하면 `content_html`, 평문이면 `content_text`를 사용하세요. 두 가지 모두 제공하면 더 좋습니다.

### Q: 아이템 개수 제한이 있나요?
A: 사양상 제한은 없지만, 실용적으로 20-50개 정도가 적당합니다. 더 많은 아이템은 `next_url`로 페이지네이션하세요.

### Q: 이미지는 Base64로 인코딩해야 하나요?
A: 아니요. 이미지 URL만 제공하면 됩니다. Base64 인코딩은 피드 크기를 불필요하게 증가시킵니다.

### Q: JSON Feed를 어떻게 홍보하나요?
A: HTML의 `<head>`에 `<link>` 태그를 추가하고, 사이트에 "JSON Feed 구독" 링크를 제공하세요.

## 버전 히스토리

- **Version 1.1** (2020년 3월)
  - `authors` 배열 추가 (개별 `author` 객체 대체)
  - `language` 필드 추가
  - `_` 접두사를 사용한 확장 공식화

- **Version 1.0** (2017년 5월)
  - 초기 사양 릴리스

## 관련 자료

- [JSON Feed 공식 사이트](https://jsonfeed.org/)
- [JSON Feed 깃허브](https://github.com/brentsimmons/JSONFeed)
- [RFC 3339 (날짜/시간 포맷)](https://tools.ietf.org/html/rfc3339)
- [BCP 47 (언어 태그)](https://tools.ietf.org/html/bcp47)
- [WebSub 사양](https://www.w3.org/TR/websub/)

## References

- [JSON Feed Version 1.1 Specification](https://jsonfeed.org/version/1.1)
