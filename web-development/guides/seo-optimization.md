---
title: Jekyll SEO 최적화 가이드
description: Jekyll 기반 정적 사이트의 SEO를 개선하기 위한 실전 가이드
date: 2025-10-15
last_modified_at: 2025-10-15
categories: [Web Development, SEO]
tags: [SEO, Jekyll, Schema.org, Open Graph, Meta Tags]
layout: page
---

# Jekyll SEO 최적화 가이드

## 개요

검색 엔진 최적화(Search Engine Optimization, SEO)는 웹사이트가 검색 결과에서 더 잘 보이도록 만드는 과정입니다. Jekyll 정적 사이트에서 SEO를 효과적으로 구현하는 방법을 알아봅니다.

이 가이드는 실제 Learn CS 프로젝트에 적용된 SEO 최적화 사례를 바탕으로 작성되었습니다.

## 왜 SEO가 중요한가?

### 사용자 발견성
아무리 훌륭한 콘텐츠를 작성해도, 검색 엔진에서 찾을 수 없다면 의미가 없습니다. 대부분의 사용자는 Google과 같은 검색 엔진을 통해 정보를 찾습니다.

### 소셜 미디어 공유
올바른 메타 태그가 있으면 링크를 공유할 때 썸네일, 제목, 설명이 자동으로 표시됩니다.

### 신뢰도 향상
구조화된 데이터는 검색 결과에 추가 정보(저자, 날짜 등)를 표시하여 콘텐츠의 신뢰도를 높입니다.

## Jekyll SEO의 핵심 요소

### 1. 구조화 데이터 (Structured Data)

구조화 데이터는 검색 엔진이 콘텐츠를 이해하도록 돕는 JSON-LD 형식의 메타데이터입니다.

#### 왜 필요한가?
검색 엔진은 HTML을 읽을 수 있지만, 페이지의 *의미*를 완전히 이해하기는 어렵습니다. 구조화 데이터는 "이것은 기사입니다", "작성자는 누구입니다", "이 페이지는 이 카테고리에 속합니다" 같은 정보를 명시적으로 알려줍니다.

#### Schema.org 스키마 타입

**WebSite 스키마**
사이트 전체에 대한 정보를 제공합니다.

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://example.com/#website",
  "url": "https://example.com/",
  "name": "Learn CS",
  "description": "Computer Science learning materials",
  "inLanguage": "ko-KR"
}
```

**Article 스키마**
개별 문서/기사 페이지에 적용됩니다.

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "@id": "https://example.com/post#article",
  "headline": "Jekyll SEO 최적화 가이드",
  "description": "Jekyll 기반 사이트의 SEO 개선 방법",
  "datePublished": "2025-10-15T10:00:00+09:00",
  "dateModified": "2025-10-15T15:30:00+09:00",
  "author": {
    "@type": "Person",
    "name": "Learn CS"
  },
  "articleSection": ["Web Development", "SEO"],
  "keywords": ["SEO", "Jekyll", "Schema.org"]
}
```

**BreadcrumbList 스키마**
사이트 내비게이션 구조를 알려줍니다.

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "홈",
      "item": "https://example.com/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Web Development",
      "item": "https://example.com/web-development/"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "SEO 가이드",
      "item": "https://example.com/web-development/guides/seo-optimization"
    }
  ]
}
```

#### Jekyll에서 구현하기

`_includes/head-seo.html` 파일에 다음과 같이 작성합니다:

```liquid
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "{{ site.url }}{{ site.baseurl }}/#website",
      "url": "{{ site.url }}{{ site.baseurl }}/",
      "name": "{{ site.title | escape }}",
      "description": "{{ site.description | escape }}",
      "inLanguage": "ko-KR"
    }{% if page.layout == 'page' %},
    {
      "@type": "Article",
      "@id": "{{ page.url | absolute_url }}#article",
      "headline": "{{ page.title | escape }}",
      "datePublished": "{{ page.date | date_to_xmlschema }}",
      "dateModified": "{{ page.last_modified_at | date_to_xmlschema }}",
      "author": {
        "@type": "Person",
        "name": "{{ page.author | default: site.author | escape }}"
      }
    }{% endif %}
  ]
}
</script>
```

### 2. 메타 태그 (Meta Tags)

메타 태그는 페이지에 대한 메타데이터를 제공합니다.

#### 기본 메타 태그

```html
<!-- 페이지 설명 (검색 결과에 표시) -->
<meta name="description" content="{{ page.description | default: site.description }}">

<!-- 검색 키워드 -->
<meta name="keywords" content="{{ page.tags | join: ', ' }}">

<!-- 저자 정보 -->
<meta name="author" content="{{ page.author | default: site.author }}">
```

#### Open Graph 메타 태그

Facebook, LinkedIn 등 소셜 미디어에서 링크 미리보기를 제공합니다.

```html
<!-- 제목 -->
<meta property="og:title" content="{{ page.title | default: site.title }}">

<!-- 설명 -->
<meta property="og:description" content="{{ page.description | default: site.description }}">

<!-- URL -->
<meta property="og:url" content="{{ page.url | absolute_url }}">

<!-- 타입 (website 또는 article) -->
<meta property="og:type" content="{% if page.layout == 'page' %}article{% else %}website{% endif %}">

<!-- 이미지 (소셜 공유 썸네일) -->
<meta property="og:image" content="{{ page.image | default: site.logo | absolute_url }}">

<!-- 사이트 이름 -->
<meta property="og:site_name" content="{{ site.title }}">

<!-- 언어 -->
<meta property="og:locale" content="ko_KR">
```

**Article 전용 메타 태그:**
```html
<!-- 발행일 -->
<meta property="article:published_time" content="{{ page.date | date_to_xmlschema }}">

<!-- 수정일 -->
<meta property="article:modified_time" content="{{ page.last_modified_at | date_to_xmlschema }}">

<!-- 카테고리 -->
{% for category in page.categories %}
<meta property="article:section" content="{{ category }}">
{% endfor %}

<!-- 태그 -->
{% for tag in page.tags %}
<meta property="article:tag" content="{{ tag }}">
{% endfor %}
```

#### Twitter Card 메타 태그

Twitter에서 링크 미리보기를 제공합니다.

```html
<!-- 카드 타입 (summary 또는 summary_large_image) -->
<meta name="twitter:card" content="summary_large_image">

<!-- 제목 -->
<meta name="twitter:title" content="{{ page.title | default: site.title }}">

<!-- 설명 -->
<meta name="twitter:description" content="{{ page.description | default: site.description }}">

<!-- 이미지 -->
<meta name="twitter:image" content="{{ page.image | default: site.logo | absolute_url }}">
```

### 3. robots.txt

검색 엔진 크롤러에게 어떤 페이지를 크롤링할지 알려줍니다.

#### robots.txt 생성

Jekyll에서 `robots.txt` 파일을 동적으로 생성하려면 frontmatter를 추가해야 합니다:

```yaml
---
layout: null
permalink: /robots.txt
---
# robots.txt for Learn CS

User-agent: *
Allow: /

# Disallow specific paths
Disallow: /assets/
Disallow: /private/

# Sitemap location
Sitemap: {{ site.url }}{{ site.baseurl }}/sitemap.xml
```

#### 주요 디렉티브

- `User-agent: *` - 모든 검색 엔진에 적용
- `Allow: /` - 모든 경로 크롤링 허용
- `Disallow: /path/` - 특정 경로 크롤링 금지
- `Sitemap: URL` - Sitemap 위치 명시

### 4. Sitemap 설정

Sitemap은 사이트의 모든 페이지 목록을 XML 형식으로 제공합니다.

#### Jekyll Sitemap 플러그인

`_config.yml`에 플러그인을 추가합니다:

```yaml
plugins:
  - jekyll-sitemap

# Sitemap 설정
sitemap:
  priority: 0.7
  changefreq: weekly
```

#### 개별 페이지 제어

Frontmatter에서 sitemap 설정을 제어할 수 있습니다:

```yaml
---
title: My Page
sitemap:
  priority: 0.9
  changefreq: daily
  lastmod: 2025-10-15
---
```

특정 페이지를 sitemap에서 제외:
```yaml
---
title: Private Page
sitemap: false
---
```

### 5. Canonical URL

중복 콘텐츠 문제를 방지하기 위해 canonical URL을 지정합니다.

```html
<link rel="canonical" href="{{ page.url | absolute_url }}">
```

#### 왜 필요한가?
같은 콘텐츠가 여러 URL에서 접근 가능하면 (예: `/page`와 `/page/`), 검색 엔진은 이를 중복 콘텐츠로 간주할 수 있습니다. Canonical URL은 "이것이 원본입니다"라고 명시합니다.

## _config.yml SEO 설정

### 기본 설정

```yaml
# 사이트 정보
title: Learn CS
description: Computer Science learning materials
url: "https://example.com"
baseurl: "/learn-cs"
author: Learn CS

# SEO 설정
lang: ko_KR
timezone: Asia/Seoul

# 소셜 이미지 (선택사항)
logo: /assets/images/logo.png

# 소셜 링크 (선택사항)
social:
  name: Learn CS
  links:
    - https://github.com/username/repo
```

### 플러그인 설정

```yaml
plugins:
  - jekyll-feed          # RSS/Atom 피드
  - jekyll-sitemap       # Sitemap 생성
  - jekyll-seo-tag       # SEO 메타 태그 자동 생성
  - jekyll-last-modified-at  # 마지막 수정일 추적
```

## 페이지별 메타데이터 작성

각 마크다운 파일의 frontmatter에 SEO 정보를 추가합니다.

### 필수 필드

```yaml
---
title: 페이지 제목
description: 페이지에 대한 간단한 설명 (150-160자 권장)
layout: page
---
```

### 권장 필드

```yaml
---
title: Jekyll SEO 최적화 가이드
description: Jekyll 기반 정적 사이트의 SEO를 개선하기 위한 실전 가이드
date: 2025-10-15
last_modified_at: 2025-10-15
categories: [Web Development, SEO]
tags: [SEO, Jekyll, Schema.org, Open Graph]
image: /assets/images/seo-guide-banner.jpg
author: Learn CS
layout: page
---
```

### 필드 설명

- `title` - 페이지 제목 (60자 이내 권장)
- `description` - 검색 결과에 표시되는 설명 (150-160자)
- `date` - 최초 발행일
- `last_modified_at` - 마지막 수정일
- `categories` - 카테고리 (배열)
- `tags` - 태그 (배열)
- `image` - 소셜 미디어 공유 이미지
- `author` - 저자

## 실전 체크리스트

### ✅ 필수 사항

- [ ] 모든 페이지에 `<title>` 태그 있음
- [ ] 모든 페이지에 `description` 메타 태그 있음
- [ ] `robots.txt` 파일 생성
- [ ] `sitemap.xml` 생성 (jekyll-sitemap 플러그인)
- [ ] Canonical URL 설정
- [ ] Open Graph 기본 태그 (title, description, url, type)

### ⭐ 권장 사항

- [ ] 구조화 데이터 (JSON-LD) 추가
- [ ] Twitter Card 메타 태그
- [ ] Open Graph 이미지 설정
- [ ] BreadcrumbList 스키마
- [ ] Article 스키마 (블로그/문서 페이지)
- [ ] 페이지별 키워드 설정
- [ ] 마지막 수정일 추적 (jekyll-last-modified-at)

### 🚀 추가 최적화

- [ ] 이미지 alt 속성 작성
- [ ] 내부 링크 구조 최적화
- [ ] 페이지 로딩 속도 최적화
- [ ] 모바일 친화적 디자인
- [ ] HTTPS 사용
- [ ] Google Search Console 등록

## 검증 방법

### 1. 구조화 데이터 검증

Google의 [Rich Results Test](https://search.google.com/test/rich-results)에서 확인:

```
https://search.google.com/test/rich-results?url=YOUR_PAGE_URL
```

### 2. Open Graph 검증

Facebook의 [Sharing Debugger](https://developers.facebook.com/tools/debug/):

```
https://developers.facebook.com/tools/debug/?q=YOUR_PAGE_URL
```

### 3. Twitter Card 검증

Twitter의 [Card Validator](https://cards-dev.twitter.com/validator):

```
https://cards-dev.twitter.com/validator
```

### 4. Google Search Console

1. [Google Search Console](https://search.google.com/search-console)에 사이트 등록
2. Sitemap 제출: `https://your-site.com/sitemap.xml`
3. 색인 생성 요청
4. 검색 성능 모니터링

## 흔한 실수

### ❌ 잘못된 예: 모든 페이지에 같은 description

```yaml
# _config.yml
description: My awesome site

# 모든 페이지가 같은 description 사용
<meta name="description" content="{{ site.description }}">
```

### ✅ 올바른 예: 페이지별 description

```liquid
<meta name="description" content="{{ page.description | default: site.description }}">
```

각 페이지 frontmatter에 고유한 description 작성:
```yaml
---
title: SEO Guide
description: Learn how to optimize your Jekyll site for search engines
---
```

### ❌ 잘못된 예: 구조화 데이터 없음

단순히 HTML만 작성하면 검색 엔진이 의미를 파악하기 어렵습니다.

```html
<h1>My Blog Post</h1>
<p>Published on October 15, 2025</p>
```

### ✅ 올바른 예: Article 스키마 추가

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "My Blog Post",
  "datePublished": "2025-10-15T10:00:00+09:00"
}
</script>
```

### ❌ 잘못된 예: 소셜 이미지 누락

```html
<meta property="og:title" content="My Post">
<meta property="og:description" content="Description">
<!-- og:image 없음 -->
```

링크 공유 시 썸네일이 표시되지 않습니다.

### ✅ 올바른 예: 이미지 추가

```html
<meta property="og:image" content="https://example.com/image.jpg">
```

## 성능 측정

### Google Lighthouse

Chrome DevTools의 Lighthouse를 사용하여 SEO 점수 확인:

1. Chrome 개발자 도구 열기 (F12)
2. Lighthouse 탭 선택
3. "SEO" 카테고리 체크
4. "Generate report" 실행

### 주요 지표

- **Performance** - 페이지 로딩 속도
- **SEO** - SEO 최적화 점수
- **Accessibility** - 접근성
- **Best Practices** - 웹 표준 준수

## 추가 리소스

### 공식 문서
- [Schema.org Documentation](https://schema.org/docs/documents.html)
- [Open Graph Protocol](https://ogp.me/)
- [Google Search Central](https://developers.google.com/search)
- [Jekyll SEO Tag Plugin](https://github.com/jekyll/jekyll-seo-tag)

### 도구
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [JSON-LD Validator](https://validator.schema.org/)

### 학습 자료
- [Google SEO Starter Guide](https://developers.google.com/search/docs/beginner/seo-starter-guide)
- [Moz Beginner's Guide to SEO](https://moz.com/beginners-guide-to-seo)

## 요약

Jekyll 사이트의 SEO 최적화는 다음 핵심 요소로 구성됩니다:

1. **구조화 데이터** - Schema.org JSON-LD로 콘텐츠 의미 명시
2. **메타 태그** - Open Graph, Twitter Card로 소셜 공유 최적화
3. **robots.txt** - 검색 엔진 크롤링 제어
4. **Sitemap** - 모든 페이지 목록 제공
5. **Canonical URL** - 중복 콘텐츠 방지
6. **페이지별 메타데이터** - 고유한 title, description, keywords

이러한 요소들을 적절히 구현하면 검색 엔진에서의 가시성이 크게 향상됩니다.

## References

- [Schema.org](https://schema.org/)
- [Open Graph Protocol](https://ogp.me/)
- [Google Search Central - Structured Data](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
- [Jekyll Documentation](https://jekyllrb.com/docs/)
