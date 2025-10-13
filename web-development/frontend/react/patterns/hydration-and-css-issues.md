# React 하이드레이션과 CSS 재적용 문제

React의 서버 사이드 렌더링(SSR)에서 하이드레이션은 핵심적인 개념이지만, 동시에 CSS 재적용과 FOUC(Flash of Unstyled Content) 문제를 야기할 수 있습니다. 이 글에서는 하이드레이션의 원리부터 실무에서 마주하는 문제들을 다룹니다.

## 하이드레이션(Hydration)이란?

하이드레이션은 서버에서 렌더링된 정적 HTML을 클라이언트에서 인터랙티브하게 만드는 과정입니다.

### 기본 원리



```jsx
// 서버에서 렌더링된 HTML (정적)
<div id="root">
  <button>클릭하세요</button> <!-- 이벤트 리스너 없음 -->
</div>

// 클라이언트에서 하이드레이션 후 (동적)
<div id="root">
  <button onClick={handleClick}>클릭하세요</button> <!-- 이벤트 리스너 연결됨 -->
</div>
```



### 하이드레이션 과정

1. **서버**: React 컴포넌트를 HTML 문자열로 변환 (`renderToString()`)
2. **브라우저**: 완성된 HTML을 받아 즉시 화면에 표시
3. **JavaScript 로딩**: React 번들 다운로드 및 파싱
4. **하이드레이션**: 기존 DOM에 이벤트 리스너와 상태 연결
5. **완료**: 완전히 인터랙티브한 애플리케이션

## SSR 렌더링 과정과 순서

### 전체 타임라인

```
1. 사용자 페이지 요청
   ↓
2. 서버에서 React 컴포넌트 실행 → HTML 생성
   ↓  
3. HTML + CSS + JS 번들을 브라우저로 전송
   ↓
4. 브라우저가 HTML 파싱 → 화면 표시 (정적, 이벤트 없음)
   ↓
5. JavaScript 번들 다운로드 완료
   ↓
6. React 하이드레이션 시작 → 이벤트 리스너 연결
   ↓
7. 완전히 인터랙티브한 페이지 완성
```

### Next.js 예시



```jsx
// pages/index.js
export default function HomePage({ serverTime }) {
  const [clientTime, setClientTime] = useState(null);

  useEffect(() => {
    // 클라이언트에서만 실행
    setClientTime(new Date().toISOString());
  }, []);

  return (
    <div>
      <h1>서버 시간: {serverTime}</h1>
      <h2>클라이언트 시간: {clientTime || '로딩중...'}</h2>
    </div>
  );
}

// 서버에서만 실행
export async function getServerSideProps() {
  return {
    props: {
      serverTime: new Date().toISOString()
    }
  };
}
```



**렌더링 결과:**
1. **서버 렌더링**: `serverTime`이 포함된 HTML 생성
2. **브라우저 표시**: "클라이언트 시간: 로딩중..." 표시  
3. **하이드레이션**: `useEffect` 실행되어 실제 클라이언트 시간 표시

## CSS 재적용 문제와 FOUC(Flash of Unstyled Content) 원인

### 주요 원인들

#### 1. CSS 번들 분할과 지연 로딩

```html
<!-- ❌ 문제가 되는 상황 - CSS 번들이 크고 느림 -->
<html>
<head>
  <link rel="stylesheet" href="huge-bundle.css"> <!-- 5MB 크기, 로딩 지연 -->
</head>
<body>
  <div class="hero-section">중요한 첫 화면 컨텐츠</div>
  <!-- CSS 로딩 완료 전까지 스타일 없음 → FOUC 발생 -->
</body>
</html>

<!-- ✅ 개선된 방법 - 크리티컬 CSS 분리 -->
<html>
<head>
  <style>
    /* 인라인 크리티컬 CSS - 즉시 적용 */
    .hero-section { font-family: Arial; color: #333; }
  </style>
  <!-- preload로 다운로드 → onload에서 stylesheet로 변경하여 적용 -->
  <link rel="preload" href="main.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="main.css"></noscript>
</head>
<body>
  <div class="hero-section">중요한 첫 화면 컨텐츠</div>
</body>
</html>
```

#### 2. 서버-클라이언트 스타일 불일치



```jsx
// ❌ 문제가 되는 코드
function ProblematicComponent() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // 클라이언트에서만 true
  }, []);

  return (
    <div style={{
      backgroundColor: isClient ? 'blue' : 'red' // 색상 변경됨
    }}>
      컨텐츠
    </div>
  );
}
```



#### 3. 동적 스타일 적용



```jsx
function Component() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className={mounted ? 'client-style' : 'server-style'}
      // 하이드레이션 시 클래스가 변경됨
    >
      컨텐츠
    </div>
  );
}
```



## Remix의 Route-based CSS 로딩

Remix는 각 라우트마다 필요한 CSS만 동적으로 로드하는 독특한 방식을 사용합니다.

### 기본 구조



```tsx
// app/routes/dashboard.tsx
import type { LinksFunction } from "@remix-run/node";
import dashboardStyles from "~/styles/dashboard.css";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: dashboardStyles }
];

export default function Dashboard() {
  return <div className="dashboard">대시보드</div>;
}
```



### 동작 과정

```
사용자가 /dashboard로 이동
↓
dashboard.tsx의 links 함수 실행  
↓
dashboard.css 동적 로드
↓
이전 페이지의 CSS 언로드 (선택적)
```

### 중첩 라우트에서의 CSS 상속



```tsx
// app/routes/dashboard.tsx (부모)
export const links: LinksFunction = () => [
  { rel: "stylesheet", href: "/styles/dashboard-layout.css" }
];

// app/routes/dashboard.analytics.tsx (자식)
export const links: LinksFunction = () => [
  { rel: "stylesheet", href: "/styles/analytics.css" }
];

// 결과: dashboard-layout.css + analytics.css 모두 로드
```



### 해결책과 최적화 방법

#### 1. CSS 우선 로딩

```html
<html>
<head>
  <link rel="stylesheet" href="critical.css">
  <style>
    /* 인라인 크리티컬 CSS */
    .loading { opacity: 0; }
    .loaded { opacity: 1; transition: opacity 0.3s; }
  </style>
</head>
<body>
  <div class="loading">컨텐츠</div>
</body>
</html>
```

#### 2. CSS-in-JS 서버 사이드 렌더링



```jsx
// styled-components 예시
import { ServerStyleSheet } from 'styled-components';

// 서버에서
const sheet = new ServerStyleSheet();
const html = renderToString(
  sheet.collectStyles(<App />)
);
const styleTags = sheet.getStyleTags();

// HTML에 스타일 포함
const fullHtml = `
  <html>
    <head>${styleTags}</head>
    <body><div id="root">${html}</div></body>
  </html>
`;
```



#### 3. 조건부 렌더링 최적화



```jsx
// ✅ 개선된 코드
function ImprovedComponent() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div
      className="base-style" // 기본 스타일 유지
      data-hydrated={isClient} // CSS에서 처리
    >
      컨텐츠
    </div>
  );
}
```



```css
/* CSS에서 부드러운 전환 */
.base-style {
  background-color: red;
  transition: background-color 0.3s ease;
}

.base-style[data-hydrated="true"] {
  background-color: blue;
}
```

#### 4. Remix 대응 방법

#### 글로벌 CSS 우선 로딩



```tsx
// app/root.tsx
import type { LinksFunction } from "@remix-run/node";
import globalStyles from "~/styles/global.css";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: globalStyles },
];
```



#### 인라인 크리티컬 CSS



```tsx
// app/root.tsx
export default function App() {
  return (
    <html>
      <head>
        <style dangerouslySetInnerHTML={{
          __html: `
            /* 크리티컬 CSS 인라인 */
            body { margin: 0; font-family: system-ui; }
            .loading { opacity: 0; }
            .loaded { opacity: 1; transition: opacity 0.2s; }
          `
        }} />
        <Links />
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}
```



#### CSS 프리로딩


```tsx
// 다음 페이지 CSS 미리 로드
export default function HomePage() {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = "/styles/dashboard.css";
    document.head.appendChild(link);
  }, []);

  return <div>홈페이지</div>;
}
```



### 5. 스켈레톤 UI 활용



```jsx
function ComponentWithSkeleton() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100);
  }, []);

  if (!loaded) {
    return <SkeletonLoader />; // 스켈레톤 표시
  }

  return <ActualContent />; // 실제 컨텐츠
}
```



### 6. 하이드레이션 디버깅



```jsx
// 개발 환경에서 하이드레이션 문제 감지
if (process.env.NODE_ENV === 'development') {
  const originalError = console.error;
  console.error = (...args) => {
    if (args[0]?.includes?.('Hydration')) {
      console.trace('하이드레이션 에러 발생 위치:');
    }
    originalError(...args);
  };
}
```



## 성능 최적화 전략

### 1. Selective Hydration (React 18)



```jsx
import { Suspense } from 'react';

function App() {
  return (
    <div>
      <Header /> {/* 즉시 하이드레이션 */}

      <Suspense fallback={<div>로딩중...</div>}>
        <HeavyComponent /> {/* 지연 하이드레이션 */}
      </Suspense>

      <Footer /> {/* 즉시 하이드레이션 */}
    </div>
  );
}
```



### 2. 점진적 하이드레이션



```jsx
// 뷰포트에 들어올 때만 하이드레이션
function LazyHydratedComponent({ children }) {
  const [shouldHydrate, setShouldHydrate] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setShouldHydrate(true);
        observer.disconnect();
      }
    });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {shouldHydrate ? children : <div>로딩중...</div>}
    </div>
  );
}
```



### 3. 하이드레이션 상태 관리



```jsx
// 커스텀 훅으로 하이드레이션 상태 관리
function useHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}

function MyComponent() {
  const hydrated = useHydrated();

  return (
    <div>
      {hydrated ? (
        <InteractiveWidget />
      ) : (
        <StaticPlaceholder />
      )}
    </div>
  );
}
```



## 모범 사례 요약

### ✅ 해야 할 것

1. **크리티컬 CSS 인라인화**: 중요한 스타일은 HTML에 직접 포함
2. **서버-클라이언트 일관성**: 초기 렌더링 결과를 동일하게 유지
3. **점진적 향상**: 기본 기능을 먼저 제공하고 점진적으로 개선
4. **적절한 로딩 상태**: 스켈레톤 UI나 로딩 인디케이터 활용
5. **CSS 프리로딩**: 다음에 필요할 스타일을 미리 로드

### ❌ 하지 말아야 할 것

1. **하이드레이션 불일치**: 서버와 클라이언트 렌더링 결과가 다르면 안됨
2. **과도한 동적 스타일**: 하이드레이션 시점에 스타일이 크게 변경되면 안됨
3. **CSS 의존성 무시**: 필요한 CSS가 로드되기 전에 컴포넌트 렌더링하면 안됨
4. **suppressHydrationWarning 남용**: 임시방편으로만 사용하고 근본 원인 해결 필요

## 참고 자료

### 공식 문서
- **[React 18 - Hydration](https://react.dev/reference/react-dom/client/hydrateRoot)** - React 공식 하이드레이션 가이드
- **[Next.js - Server-Side Rendering](https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering)** - Next.js SSR 공식 문서
- **[Remix - Route Module API](https://remix.run/docs/en/main/route/links)** - Remix route-based CSS 로딩 가이드

### 심화 학습 자료
- **[Web.dev - Optimize Cumulative Layout Shift](https://web.dev/optimize-cls/)** - CLS 최적화와 CSS 로딩 전략
- **[MDN - Critical Rendering Path](https://developer.mozilla.org/en-US/docs/Web/Performance/Critical_rendering_path)** - 크리티컬 렌더링 패스 이해
- **[React 18 - Concurrent Features](https://react.dev/blog/2022/03/29/react-v18#what-is-concurrent-react)** - React 18의 동시성 기능과 Selective Hydration

### 실무 가이드
- **[Kent C. Dodds - Fix the "not wrapped in act()" warning](https://kentcdodds.com/blog/fix-the-not-wrapped-in-act-warning)** - 하이드레이션 테스트 가이드
- **[Josh W. Comeau - The Perils of Rehydration](https://www.joshwcomeau.com/react/the-perils-of-rehydration/)** - 하이드레이션 문제 해결 실무 가이드
- **[Vercel - Loading Third-Party JavaScript](https://nextjs.org/docs/pages/building-your-application/optimizing/third-party-libraries)** - 서드파티 라이브러리와 하이드레이션

### 도구 및 라이브러리
- **[React DevTools Profiler](https://react.dev/learn/react-developer-tools)** - 하이드레이션 성능 분석
- **[Lighthouse](https://developers.google.com/web/tools/lighthouse)** - 웹 성능 측정 및 CLS 분석
- **[webpack-bundle-analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)** - 번들 크기 분석 및 최적화

### 블로그 포스트
- **[Patterns.dev - Server-Side Rendering](https://www.patterns.dev/posts/server-side-rendering/)** - SSR 패턴과 하이드레이션 전략
- **[Smashing Magazine - A Deep Dive Into Next.js Static Generation](https://www.smashingmagazine.com/2021/04/incremental-static-regeneration-nextjs/)** - Next.js 렌더링 전략 비교
- **[CSS-Tricks - Critical CSS](https://css-tricks.com/how-do-you-determine-what-your-critical-css-is/)** - 크리티컬 CSS 식별 및 최적화
