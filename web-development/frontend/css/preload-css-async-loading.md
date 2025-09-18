# CSS 비동기 로딩: `preload`와 `onload`를 활용한 성능 최적화

CSS 파일의 로딩은 웹 페이지 렌더링을 블로킹하는 주요 원인 중 하나입니다. 
`preload`와 `onload`를 조합한 비동기 CSS 로딩 기법은 이 문제를 해결하는 효과적인 방법입니다.

## 기본 개념

### 일반적인 CSS 로딩의 문제점

```html
<!-- ❌ 렌더링 블로킹 CSS -->
<html>
<head>
  <link rel="stylesheet" href="large-styles.css"> <!-- 5MB 파일 -->
</head>
<body>
  <div>컨텐츠</div> <!-- CSS 로딩 완료까지 렌더링 대기 -->
</body>
</html>
```

**문제점:**
- CSS 파일이 완전히 로드될 때까지 페이지 렌더링이 차단됨
- 큰 CSS 번들이나 느린 네트워크에서 긴 지연 시간 발생
- 사용자가 빈 화면을 오래 보게 됨

### `preload` + `onload`를 활용한 비동기 CSS 로딩

```html
<!-- ✅ 비동기 CSS 로딩 -->
<html>
<head>
  <style>
    /* 크리티컬 CSS 인라인 */
    body { font-family: Arial; margin: 0; }
    .hero { color: #333; }
  </style>
  <link rel="preload" href="styles.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="styles.css"></noscript>
</head>
<body>
  <div class="hero">즉시 표시되는 컨텐츠</div>
</body>
</html>
```

## 기술적 동작 원리

### 브라우저 처리 과정

```
1. HTML 파싱 시작
   ↓
2. <link rel="preload"> 발견
   ↓
3. CSS 파일 다운로드 시작 (백그라운드)
   ↓
4. HTML 파싱 계속 (블로킹 없음)
   ↓
5. 페이지 렌더링 시작 (인라인 CSS 적용)
   ↓
6. CSS 다운로드 완료 → onload 이벤트 발생
   ↓
7. rel="stylesheet"로 변경 → 추가 스타일 적용
```

### 코드 분석

```html
<link rel="preload" href="styles.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
```

**각 속성의 역할:**
- `rel="preload"`: 리소스를 미리 다운로드 (적용하지 않음)
- `as="style"`: 브라우저에게 CSS 파일임을 알림
- `onload="..."`: 다운로드 완료 시 실행할 JavaScript
- `this.onload=null`: 이벤트 핸들러 정리 (메모리 누수 방지)
- `this.rel='stylesheet'`: preload를 stylesheet로 변경하여 적용

## 다양한 CSS 로딩 전략

### 1. 크리티컬 CSS 분리

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>비동기 CSS 로딩 예시</title>
  
  <!-- 
    크리티컬 CSS 인라인 (성능 최적화를 위한 예외적 사용)
    ㄴ 일반적으로 인라인 스타일은 지양하지만, 크리티컬 CSS는 성능상 이유로 예외
    ㄴ Above-the-fold 영역의 필수 스타일만 최소한으로 포함 (보통 10KB 이하)
    ㄴ 첫 화면 렌더링 속도를 위해 HTTP 요청 없이 즉시 적용
    ㄴ 나머지 모든 CSS는 외부 파일로 분리하여 비동기 로드
   -->

  <style>
    /* Above-the-fold 스타일 */
    body { 
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      margin: 0;
      line-height: 1.6;
    }
    .header { 
      background: #007bff;
      color: white;
      padding: 1rem;
    }
    .loading { 
      opacity: 0.7;
      transition: opacity 0.3s;
    }
  </style>
  
  <!-- 비동기 CSS 로딩 -->
  <link rel="preload" href="/css/main.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
  <link rel="preload" href="/css/components.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
  
  <!-- JavaScript 비활성화 시 폴백 -->
  <noscript>
    <link rel="stylesheet" href="/css/main.css">
    <link rel="stylesheet" href="/css/components.css">
  </noscript>
</head>
<body class="loading">
  <header class="header">
    <h1>웹사이트 제목</h1>
  </header>
  <main>
    <p>중요한 첫 화면 컨텐츠</p>
  </main>
</body>
</html>
```

### 2. JavaScript를 활용한 동적 로딩

**실제로 자주 사용되는 케이스:**

- (기능별 지연 로딩) 모달, 차트 라이브러리, 코드 에디터 등 특정 기능 활성화 시에만 CSS 로드
- (조건부 스타일링) 다크모드, 반응형 디자인에서 환경에 따른 CSS 분기
- (사용자 설정) 테마 변경, 접근성 설정 등 개인화 기능
- (A/B 테스트) 실험군별 다른 디자인 적용

**실제로는 많이 사용하지 않는 이유:**

- 대부분의 경우 CSS 미디어 쿼리나 CSS 변수로 해결 가능
- 빌드 타임에 조건부 CSS 번들링으로 처리
- 프레임워크(React, Vue 등)의 조건부 스타일링 기능 활용

```js
// 유틸리티 함수
function loadCSS(href, before, media) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.media = media || 'all';
  
  // 로딩 완료 처리
  link.onload = function() {
    this.onload = null;
    console.log(`CSS 로딩 완료: ${href}`);
  };
  
  // 에러 처리
  link.onerror = function() {
    console.error(`CSS 로딩 실패: ${href}`);
  };
  
  // DOM에 추가
  const target = before || document.head.lastChild;
  target.parentNode.insertBefore(link, target.nextSibling);
  
  return link;
}

// 예시

// 1. 기능별 지연 로딩 - 모달 열 때만 CSS 로드
function openModal() {
  if (!document.querySelector('link[href="/css/modal.css"]')) {
    loadCSS('/css/modal.css').then(() => {
      showModalDialog(); // CSS 로드 완료 후 모달 표시
    });
  } else {
    showModalDialog();
  }
}

// 2. 조건부 스타일링 - 환경에 따른 CSS 로드
function loadConditionalCSS() {
  const isDesktop = window.innerWidth > 768;
  const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (isDesktop) {
    loadCSS('/css/desktop.css');
  } else {
    loadCSS('/css/mobile.css');
  }
  
  if (isDarkMode) {
    loadCSS('/css/dark-theme.css');
  }
}

// 3. 사용자 설정에 따른 테마 변경
function changeTheme(themeName) {
  // 기존 테마 CSS 제거
  const existingTheme = document.querySelector('link[data-theme]');
  if (existingTheme) {
    existingTheme.remove();
  }
  
  // 새 테마 CSS 로드
  const themeLink = loadCSS(`/css/themes/${themeName}.css`);
  themeLink.setAttribute('data-theme', themeName);
}

// 4. A/B 테스트 - 실험군에 따른 스타일 적용
function loadExperimentCSS() {
  const experimentGroup = getExperimentGroup(); // 'A' 또는 'B'
  loadCSS(`/css/experiment-${experimentGroup}.css`);
}

document.addEventListener('DOMContentLoaded', loadConditionalCSS);
```

### 3. `React`/`Next.js`에서의 활용

```jsx
// components/AsyncCSS.jsx
import { useEffect } from 'react';

export function AsyncCSS({ href, media = 'all' }) {
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    link.media = media;
    
    link.onload = function() {
      this.onload = null;
      this.rel = 'stylesheet';
    };
    
    document.head.appendChild(link);
    
    return () => {
      // 컴포넌트 언마운트 시 정리 (선택적)
      // CSS는 전역 리소스이므로 보통 정리하지 않음
      // 하지만 동적 테마나 조건부 스타일의 경우 정리 필요
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, [href, media]);
  
  return null;
}
```


실제로는 대부분의 CSS는 정리하지 않는 것이 일반적입니다. 
CSS는 전역 리소스이고, 브라우저가 캐시하므로 굳이 제거할 필요가 없기 때문입니다.


```tsx
// pages/_document.js (Next.js)
import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          {/* 크리티컬 CSS */}
          <style dangerouslySetInnerHTML={{
            __html: `
              body { margin: 0; font-family: system-ui; }
              .loading { opacity: 0.8; }
            `
          }} />
          
          {/* 비동기 CSS 로딩 */}
          <link
            rel="preload"
            href="/css/main.css"
            as="style"
            onLoad="this.onload=null;this.rel='stylesheet'"
          />
          <noscript>
            <link rel="stylesheet" href="/css/main.css" />
          </noscript>
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
```

## 성능 최적화 효과

### 측정 가능한 지표

```js
// 성능 측정 코드
function measureCSSLoadingPerformance() {
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.name.includes('.css')) {
        console.log(`CSS 로딩 시간: ${entry.name}`, {
          duration: `${entry.duration.toFixed(2)}ms`,
          startTime: `${entry.startTime.toFixed(2)}ms`,
          transferSize: `${entry.transferSize} bytes`
        });
      }
    });
  });
  
  observer.observe({ entryTypes: ['resource'] });
  
  // First Contentful Paint 측정
  new PerformanceObserver((list) => {
    const fcp = list.getEntries()[0];
    console.log(`First Contentful Paint: ${fcp.startTime.toFixed(2)}ms`);
  }).observe({ entryTypes: ['paint'] });
}

// 페이지 로드 시 측정 시작
window.addEventListener('load', measureCSSLoadingPerformance);
```

### 실제 성능 개선 사례

```
일반적인 CSS 로딩:
- First Contentful Paint: 2.3초
- Largest Contentful Paint: 3.1초
- 사용자가 빈 화면을 보는 시간: 2.3초

preload + onload 비동기 로딩:
- First Contentful Paint: 0.8초 (65% 개선)
- Largest Contentful Paint: 1.2초 (61% 개선)
- 사용자가 빈 화면을 보는 시간: 0초
```

## 브라우저 호환성과 폴백 전략

### 브라우저 지원 현황

```js
// preload 지원 여부 확인
function supportsPreload() {
  const link = document.createElement('link');
  return link.relList && link.relList.supports && link.relList.supports('preload');
}

// 폴백 구현
function loadCSSWithFallback(href) {
  if (supportsPreload()) {
    // preload 지원 브라우저
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    link.onload = function() {
      this.onload = null;
      this.rel = 'stylesheet';
    };
    document.head.appendChild(link);
  } else {
    // 구형 브라우저 폴백
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }
}
```

### 폴백 전략

```html
<head>
  <link rel="preload" href="styles.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
  
  <!-- JavaScript 비활성화 시 -->
  <noscript><link rel="stylesheet" href="styles.css"></noscript>
  
  <!-- 구형 브라우저 감지 및 폴백 -->
  <script>
    // preload 미지원 브라우저 감지
    if (!('onload' in document.createElement('link'))) {
      document.write('<link rel="stylesheet" href="styles.css">');
    }
  </script>
</head>
```

## 다른 방법

### 1. 미디어 쿼리와 조건부 로딩

```html
<!-- 화면 크기별 조건부 로딩 -->
<link rel="preload" href="mobile.css" as="style" media="(max-width: 768px)" 
      onload="this.onload=null;this.rel='stylesheet'">
<link rel="preload" href="desktop.css" as="style" media="(min-width: 769px)" 
      onload="this.onload=null;this.rel='stylesheet'">

<!-- 다크모드 지원 -->
<link rel="preload" href="dark.css" as="style" media="(prefers-color-scheme: dark)" 
      onload="this.onload=null;this.rel='stylesheet'">
```

### 2. 우선순위 기반 로딩

```js
// CSS 파일 우선순위 정의
const cssFiles = [
  { href: '/css/critical.css', priority: 'high' },
  { href: '/css/layout.css', priority: 'medium' },
  { href: '/css/components.css', priority: 'medium' },
  { href: '/css/animations.css', priority: 'low' }
];

// 우선순위별 순차 로딩
async function loadCSSByPriority() {
  const priorities = ['high', 'medium', 'low'];
  
  for (const priority of priorities) {
    const files = cssFiles.filter(file => file.priority === priority);
    
    // 같은 우선순위는 병렬 로딩
    await Promise.all(files.map(file => loadCSSAsync(file.href)));
    
    // 다음 우선순위 로딩 전 잠시 대기 (렌더링 최적화)
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}

function loadCSSAsync(href) {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    
    link.onload = function() {
      this.onload = null;
      this.rel = 'stylesheet';
      resolve();
    };
    
    link.onerror = reject;
    document.head.appendChild(link);
  });
}
```

### 3. 서비스 워커와 연동

**왜 사용하는가?**
- **캐싱 최적화**: CSS 파일을 더 효율적으로 캐시 관리
- **오프라인 지원**: 네트워크 없이도 CSS 파일 제공
- **버전 관리**: CSS 파일 업데이트 시 캐시 무효화 제어
- **로딩 전략**: 네트워크 상태에 따른 다른 로딩 전략 적용

**실제로는 복잡도 대비 효과가 크지 않아 많이 사용되지 않음**

서비스 워커와 CSS 연동은 이론적으로는 좋지만 실무에서는 오버엔지니어링인 경우가 많습니다.

**서비스 워커 연동의 실제 문제점**

- (복잡성 증가) 서비스 워커 설정, 캐시 전략, 업데이트 로직 등 관리 포인트 증가
- (브라우저 캐시로 충분) 대부분의 경우 브라우저 기본 캐시만으로도 충분한 성능
- (디버깅 어려움) 캐시 관련 문제 발생 시 원인 파악이 복잡
- (PWA가 아닌 경우 불필요) 오프라인 지원이 필요 없는 일반 웹사이트에서는 과도함

**실제로 필요한 경우:**

- PWA(Progressive Web App)에서 오프라인 지원이 필수인 경우
- 매우 큰 CSS 파일을 자주 업데이트하는 경우
- 네트워크가 불안정한 환경을 타겟으로 하는 경우
- 대부분의 웹사이트에서는 preload + onload 기본 기법만으로도 충분한 성능 향상을 얻을 수 있고, 서비스 워커는 정말 필요한 경우에만 고려하는 것이 좋습니다.

```js
// service-worker.js
self.addEventListener('fetch', (event) => {
  if (event.request.destination === 'style') {
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) {
          // 캐시된 CSS 반환
          return response;
        }
        
        // 네트워크에서 가져와서 캐시
        return fetch(event.request).then((response) => {
          const responseClone = response.clone();
          caches.open('css-cache-v1').then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        });
      })
    );
  }
});

// main.js - 서비스 워커와 연동된 CSS 로딩
function loadCSSWithSW(href) {
  if ('serviceWorker' in navigator) {
    // 서비스 워커가 있으면 캐시 활용
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    link.onload = function() {
      this.onload = null;
      this.rel = 'stylesheet';
    };
    document.head.appendChild(link);
  } else {
    // 폴백
    loadCSSWithFallback(href);
  }
}
```

## 모범 사례

### ✅ 권장사항

1. **크리티컬 CSS 인라인화**: Above-the-fold 스타일은 HTML에 직접 포함
2. **적절한 파일 분할**: 기능별로 CSS 파일을 분리하여 필요한 것만 로드
3. **폴백 제공**: `<noscript>` 태그로 JavaScript 비활성화 환경 대응
4. **성능 모니터링**: 실제 로딩 시간과 사용자 경험 지표 측정
5. **점진적 향상**: 기본 스타일을 먼저 제공하고 점진적으로 개선

### ❌ 주의사항

1. **과도한 분할 금지**: 너무 많은 작은 CSS 파일은 HTTP 요청 증가
2. **중복 로딩 방지**: 같은 CSS 파일을 여러 번 로드하지 않도록 관리
3. **메모리 누수 주의**: `onload` 이벤트 핸들러를 적절히 정리
4. **SEO 고려**: 중요한 스타일이 누락되지 않도록 주의

## 참고 자료

### 공식 문서 및 표준
- **[MDN - Link types: preload](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/preload)** - `rel="preload"`의 공식 명세와 사용법
- **[W3C - Resource Hints: Preload](https://www.w3.org/TR/preload/)** - W3C preload 명세서
- **[WHATWG - HTML Living Standard: Link types](https://html.spec.whatwg.org/multipage/links.html#link-type-preload)** - HTML 표준의 preload 정의
- **[MDN - HTMLLinkElement.onload](https://developer.mozilla.org/en-US/docs/Web/API/HTMLLinkElement/load_event)** - `<link>` 요소의 `onload` 이벤트

### 성능 최적화 가이드
- **[Google Web.dev - Preload critical assets](https://web.dev/preload-critical-assets/)** - 크리티컬 리소스 프리로딩 가이드
- **[Google Web.dev - Eliminate render-blocking resources](https://web.dev/render-blocking-resources/)** - 렌더링 블로킹 리소스 제거 방법
- **[Google Web.dev - Optimize Cumulative Layout Shift](https://web.dev/optimize-cls/)** - CLS 최적화와 CSS 로딩 전략

### 실무 구현 가이드
- **[Filament Group - The Simplest Way to Load CSS Asynchronously](https://www.filamentgroup.com/lab/load-css-simpler/)** - 비동기 CSS 로딩의 원조 기법
- **[CSS-Tricks - The Critical Request](https://css-tricks.com/the-critical-request/)** - 크리티컬 리소스 최적화 전략
- **[Smashing Magazine - Critical CSS and Webpack](https://www.smashingmagazine.com/2015/08/understanding-critical-css/)** - 크리티컬 CSS 추출 및 적용

### 도구 및 측정
- **[Can I Use - Preload](https://caniuse.com/link-rel-preload)** - 브라우저 호환성 정보
- **[Lighthouse](https://developers.google.com/web/tools/lighthouse)** - 웹 성능 측정 및 CSS 최적화 분석
- **[WebPageTest](https://www.webpagetest.org/)** - 상세한 로딩 성능 분석
- **[Critical](https://github.com/addyosmani/critical)** - 크리티컬 CSS 자동 추출 도구

### 프레임워크별 구현
- **[Next.js - Optimizing Fonts](https://nextjs.org/docs/pages/building-your-application/optimizing/fonts)** - Next.js에서의 리소스 최적화
- **[Nuxt.js - Loading](https://nuxtjs.org/docs/features/loading/)** - Nuxt.js 로딩 최적화
- **[Gatsby - Performance](https://www.gatsbyjs.com/docs/how-to/performance/)** - Gatsby 성능 최적화 가이드
