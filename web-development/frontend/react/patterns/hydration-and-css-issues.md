---
title: React 하이드레이션과 CSS 재적용 문제
date: 2025-10-13
categories: [Web Development]
tags: [this, Context, Scope, Callback, Async, Functions]
render_with_liquid: false
layout: page
---
{% raw %}
# React 하이드레이션과 CSS 재적용 문제

이런 에러 메시지를 본 적 있나요?

```
Warning: Text content did not match. Server: "..." Client: "..."
Warning: Expected server HTML to contain a matching <div> in <div>.
Hydration failed because the initial UI does not match what was rendered on the server.
```

처음 이 에러를 봤을 때 저는 당황했습니다. "분명히 같은 React 컴포넌트인데, 왜 서버와 클라이언트가 다르다는 거지?" 더 혼란스러웠던 것은, 화면에는 잘 보이는데도 콘솔에는 빨간 에러가 가득했다는 것입니다. 심지어 가끔은 화면이 깜빡이면서 스타일이 다시 적용되는 이상한 현상도 발생했죠.

하이드레이션(Hydration)은 React의 서버 사이드 렌더링(SSR)에서 가장 헷갈리는 개념 중 하나입니다. 동시에 FOUC(Flash of Unstyled Content), CSS 재적용, 레이아웃 깜빡임 같은 성가신 문제들의 원인이기도 합니다. 이 문서에서는 하이드레이션이 무엇인지, 왜 문제가 생기는지, 그리고 실전에서 어떻게 해결하는지 제 경험을 바탕으로 자세히 설명하겠습니다.

## Hydration이란? 왜 필요할까요?

### 하이드레이션의 본질

하이드레이션을 이해하려면, SSR이 왜 필요한지부터 생각해봐야 합니다.

전통적인 CSR(Client-Side Rendering) 방식을 떠올려보세요:

```html
<!-- 서버가 보내는 HTML (거의 비어있음) -->
<!DOCTYPE html>
<html>
  <head>
    <title>My App</title>
    <script src="bundle.js"></script>
  </head>
  <body>
    <div id="root"></div>
    <!-- JavaScript가 여기에 모든 것을 렌더링 -->
  </body>
</html>
```

**CSR의 문제점:**
1. 사용자가 빈 화면을 먼저 봅니다
2. JavaScript가 다운로드되고 실행될 때까지 아무것도 보이지 않습니다
3. SEO에 불리합니다 (검색 엔진이 빈 페이지를 크롤링)
4. 초기 로딩이 느립니다

SSR은 이 문제를 해결합니다:

```html
<!-- 서버가 보내는 HTML (완성된 내용) -->
<!DOCTYPE html>
<html>
  <head>
    <title>My App</title>
    <script src="bundle.js" defer></script>
  </head>
  <body>
    <div id="root">
      <!-- 서버에서 미리 렌더링된 완성된 HTML -->
      <div class="app">
        <header>
          <h1>환영합니다</h1>
          <button>로그인</button>
        </header>
        <main>
          <p>이것은 서버에서 렌더링된 내용입니다.</p>
        </main>
      </div>
    </div>
  </body>
</html>
```

**SSR의 장점:**
1. 사용자가 즉시 콘텐츠를 봅니다
2. SEO에 유리합니다
3. 첫 화면 표시가 빠릅니다

**하지만 여기에 문제가 있습니다.** 서버에서 렌더링된 HTML은 **정적**입니다. 버튼을 클릭해도 아무 일도 일어나지 않습니다. 이벤트 리스너가 없기 때문이죠.

```html
<!-- 서버가 만든 HTML -->
<button>로그인</button>
<!-- onClick 이벤트가 없음! -->
```

이것이 바로 하이드레이션이 필요한 이유입니다. **하이드레이션은 이미 렌더링된 정적 HTML에 "생명을 불어넣는" 과정**입니다.

### 하이드레이션 과정 상세히 들여다보기

전체 과정을 단계별로 살펴봅시다:

```
1️⃣ 사용자가 /products 페이지 요청
   ↓
2️⃣ 서버에서 React 컴포넌트 실행
   ReactDOMServer.renderToString(<App />)
   → HTML 문자열 생성
   ↓
3️⃣ 생성된 HTML + CSS + JS 번들을 브라우저로 전송
   <!DOCTYPE html>
   <html>
     <head>
       <link rel="stylesheet" href="styles.css">
     </head>
     <body>
       <div id="root">
         [완성된 HTML 내용]
       </div>
       <script src="bundle.js"></script>
     </body>
   </html>
   ↓
4️⃣ 브라우저가 HTML을 파싱하고 화면에 표시
   ✅ 사용자는 이미 콘텐츠를 볼 수 있음!
   ❌ 하지만 버튼을 클릭해도 아무 일도 안 일어남
   ↓
5️⃣ JavaScript 번들 다운로드 시작
   bundle.js (300KB) 다운로드 중...
   ↓
6️⃣ JavaScript 파싱 및 실행
   React 코드가 메모리에 로드됨
   ↓
7️⃣ React가 하이드레이션 시작
   ReactDOM.hydrateRoot(document.getElementById('root'), <App />)

   React가 하는 일:
   - 가상 DOM 트리 생성
   - 기존 DOM과 비교
   - 이벤트 리스너 연결
   - 상태 관리 설정
   ↓
8️⃣ 하이드레이션 완료
   ✅ 이제 완전히 인터랙티브한 애플리케이션!
   버튼 클릭, 폼 제출, 애니메이션 등 모두 동작
```

실제 코드로 보면 이렇습니다:

```jsx
// 서버 사이드 (server.js)
import { renderToString } from 'react-dom/server';
import App from './App';

app.get('*', (req, res) => {
  // 1. React 컴포넌트를 HTML 문자열로 변환
  const html = renderToString(<App url={req.url} />);

  // 2. 완성된 HTML 전송
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body>
        <div id="root">${html}</div>
        <script src="/bundle.js"></script>
      </body>
    </html>
  `);
});

// 클라이언트 사이드 (client.js)
import { hydrateRoot } from 'react-dom/client';
import App from './App';

// 3. 기존 HTML에 React를 "하이드레이트"
const root = document.getElementById('root');
hydrateRoot(root, <App />);
```

### Next.js에서의 하이드레이션

Next.js는 이 복잡한 과정을 자동으로 처리해줍니다:

```jsx
// pages/products.js
export default function ProductsPage({ products, timestamp }) {
  const [clientTime, setClientTime] = useState(null);

  useEffect(() => {
    // ⚠️ 이 코드는 클라이언트에서만 실행됨!
    setClientTime(new Date().toISOString());
  }, []);

  return (
    <div>
      <h1>상품 목록</h1>
      <p>서버 시간: {timestamp}</p>
      <p>클라이언트 시간: {clientTime || '하이드레이션 대기 중...'}</p>

      <div className="products">
        {products.map(product => (
          <div key={product.id} className="product-card">
            <h2>{product.name}</h2>
            <p>{product.price}원</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// 이 함수는 서버에서만 실행됨
export async function getServerSideProps() {
  const products = await fetchProducts();

  return {
    props: {
      products,
      timestamp: new Date().toISOString()
    }
  };
}
```

**타임라인:**
```
T=0ms   서버: getServerSideProps 실행 → products 가져옴
T=50ms  서버: HTML 렌더링 (timestamp 포함)
T=100ms 브라우저: HTML 수신 및 표시
        화면에 표시됨:
        ✅ "서버 시간: 2024-01-15T10:30:00.000Z"
        ✅ "클라이언트 시간: 하이드레이션 대기 중..."
        ✅ 상품 목록 (하지만 클릭 안 됨)

T=300ms 브라우저: JavaScript 다운로드 완료
T=350ms 브라우저: React 하이드레이션 시작
T=400ms 브라우저: useEffect 실행
        화면 업데이트:
        "클라이언트 시간: 2024-01-15T10:30:00.400Z"
T=400ms 하이드레이션 완료 ✅
```

## Hydration Mismatch - 왜 에러가 발생할까?

하이드레이션의 핵심 원칙은 이것입니다:

> **서버에서 렌더링된 HTML과 클라이언트에서 첫 렌더링의 결과가 완전히 동일해야 한다.**

React는 하이드레이션 시 다음과 같이 동작합니다:

```jsx
// React의 하이드레이션 로직 (단순화)
function hydrate(element, container) {
  // 1. 가상 DOM 생성
  const virtualDOM = createVirtualDOM(element);

  // 2. 기존 DOM과 비교
  const existingDOM = container.firstChild;

  if (!matches(virtualDOM, existingDOM)) {
    // ⚠️ 불일치 발견!
    console.error('Hydration mismatch!');
    // 전체를 다시 렌더링 (느림, 깜빡임 발생)
    container.innerHTML = '';
    render(element, container);
  } else {
    // ✅ 일치함
    // 이벤트 리스너만 연결 (빠름, 깜빡임 없음)
    attachEventListeners(existingDOM, virtualDOM);
  }
}
```

불일치가 발생하면 React는:
1. 경고를 출력합니다
2. 기존 HTML을 버리고 다시 렌더링합니다
3. 이 과정에서 화면이 깜빡이고, 포커스가 사라지고, 스크롤이 리셋될 수 있습니다

### Mismatch 예제 1: 난수 사용

저도 초반에 자주 했던 실수입니다:

```jsx
// ❌ 문제가 되는 코드
function ProductCard({ product }) {
  // 매번 다른 값이 생성됨!
  const randomDiscount = Math.random() * 100;

  return (
    <div>
      <h2>{product.name}</h2>
      <p>원가: {product.price}원</p>
      <p>할인: {randomDiscount.toFixed(0)}% OFF</p>
    </div>
  );
}
```

**왜 문제가 될까요?**

```
서버 렌더링:
Math.random() → 0.743 → "할인: 74% OFF"
생성된 HTML: <p>할인: 74% OFF</p>

브라우저 하이드레이션:
Math.random() → 0.312 → "할인: 31% OFF"
예상 HTML: <p>할인: 31% OFF</p>

❌ Mismatch! 74 ≠ 31
```

**해결 방법 1: 서버에서 값 생성**

```jsx
// ✅ 서버에서 미리 계산
export async function getServerSideProps() {
  const product = await fetchProduct();

  return {
    props: {
      product,
      discount: Math.random() * 100 // 서버에서 한 번만 계산
    }
  };
}

function ProductCard({ product, discount }) {
  return (
    <div>
      <h2>{product.name}</h2>
      <p>원가: {product.price}원</p>
      <p>할인: {discount.toFixed(0)}% OFF</p>
    </div>
  );
}
```

**해결 방법 2: 클라이언트에서만 렌더링**

```jsx
// ✅ useEffect로 클라이언트에서만 표시
function ProductCard({ product }) {
  const [discount, setDiscount] = useState(null);

  useEffect(() => {
    setDiscount(Math.random() * 100);
  }, []);

  return (
    <div>
      <h2>{product.name}</h2>
      <p>원가: {product.price}원</p>
      {discount !== null && (
        <p>할인: {discount.toFixed(0)}% OFF</p>
      )}
    </div>
  );
}
```

### Mismatch 예제 2: Date.now()와 시간

이것도 정말 흔한 실수입니다:

```jsx
// ❌ 문제가 되는 코드
function Post({ content }) {
  const timestamp = new Date().toISOString();

  return (
    <article>
      <p>{content}</p>
      <time>{timestamp}</time>
    </article>
  );
}
```

**왜 문제일까요?**

```
서버 렌더링 (T=0ms):
new Date() → "2024-01-15T10:30:00.000Z"

브라우저 하이드레이션 (T=500ms):
new Date() → "2024-01-15T10:30:00.500Z"

❌ Mismatch! 시간이 다름
```

저는 처음에 이 문제를 마주했을 때 "고작 500ms 차이인데 왜?"라고 생각했습니다. 하지만 React는 단 한 글자의 차이도 용납하지 않습니다.

**해결 방법:**

```jsx
// ✅ 방법 1: 서버에서 props로 전달
export async function getServerSideProps() {
  return {
    props: {
      timestamp: new Date().toISOString()
    }
  };
}

function Post({ content, timestamp }) {
  return (
    <article>
      <p>{content}</p>
      <time>{timestamp}</time>
    </article>
  );
}

// ✅ 방법 2: suppressHydrationWarning 사용 (최후의 수단)
function Post({ content }) {
  const timestamp = new Date().toISOString();

  return (
    <article>
      <p>{content}</p>
      {/* 이 요소만 하이드레이션 체크 건너뛰기 */}
      <time suppressHydrationWarning>
        {timestamp}
      </time>
    </article>
  );
}
```

### Mismatch 예제 3: localStorage/sessionStorage

브라우저 API는 서버에 존재하지 않습니다:

```jsx
// ❌ 문제가 되는 코드
function UserGreeting() {
  // 서버에는 localStorage가 없음!
  const username = localStorage.getItem('username');

  return <h1>안녕하세요, {username}님!</h1>;
}
```

**왜 문제일까요?**

```
서버 렌더링:
localStorage → undefined (서버에는 localStorage가 없음!)
에러 발생: "ReferenceError: localStorage is not defined"
```

실제로는 코드가 아예 실행되지 않고 서버가 크래시됩니다.

**해결 방법 1: typeof 체크**

```jsx
// ✅ 서버 환경 체크
function UserGreeting() {
  const username = typeof window !== 'undefined'
    ? localStorage.getItem('username')
    : null;

  return (
    <h1>
      안녕하세요, {username || '게스트'}님!
    </h1>
  );
}
```

**하지만 이것도 Mismatch를 일으킵니다!**

```
서버: "안녕하세요, 게스트님!"
클라이언트: "안녕하세요, 홍길동님!"
❌ Mismatch!
```

**해결 방법 2: useEffect로 클라이언트 전용 렌더링**

```jsx
// ✅ 제대로 된 해결책
function UserGreeting() {
  const [username, setUsername] = useState(null);

  useEffect(() => {
    // 클라이언트에서만 실행
    const stored = localStorage.getItem('username');
    setUsername(stored);
  }, []);

  return (
    <h1>
      안녕하세요, {username || '게스트'}님!
    </h1>
  );
}
```

**렌더링 과정:**
```
서버: "안녕하세요, 게스트님!"
클라이언트 첫 렌더: "안녕하세요, 게스트님!" (일치 ✅)
useEffect 실행 후: "안녕하세요, 홍길동님!" (업데이트)
```

### Mismatch 예제 4: 조건부 렌더링

이것은 정말 미묘한 버그를 만듭니다:

```jsx
// ❌ 문제가 되는 코드
function AdBanner() {
  const [showAd, setShowAd] = useState(true);

  useEffect(() => {
    // 광고 차단 감지
    const adBlockDetected = detectAdBlock();
    setShowAd(!adBlockDetected);
  }, []);

  // 초기 렌더에는 항상 광고가 표시됨
  return showAd ? <div className="ad">광고</div> : null;
}
```

**타임라인:**
```
서버: showAd = true → <div className="ad">광고</div>
클라이언트 첫 렌더: showAd = true → <div className="ad">광고</div> ✅
useEffect: adBlockDetected = true → setShowAd(false)
클라이언트 재렌더: showAd = false → null
→ 광고가 깜빡이며 사라짐! (나쁜 UX)
```

**해결 방법:**

```jsx
// ✅ 개선된 코드
function AdBanner() {
  const [showAd, setShowAd] = useState(null); // null로 시작

  useEffect(() => {
    const adBlockDetected = detectAdBlock();
    setShowAd(!adBlockDetected);
  }, []);

  // 하이드레이션 전에는 아무것도 렌더링 안 함
  if (showAd === null) {
    return <div className="ad-placeholder" style={{ height: 90 }} />;
  }

  return showAd ? <div className="ad">광고</div> : null;
}
```

### Mismatch 예제 5: User Agent 감지

모바일/데스크톱 감지도 위험합니다:

```jsx
// ❌ 문제가 되는 코드
function ResponsiveNav() {
  const isMobile = /Mobile/.test(navigator.userAgent);

  return isMobile ? <MobileNav /> : <DesktopNav />;
}
```

**왜 문제일까요?**

서버는 User Agent를 모릅니다. 또는 요청 헤더의 User Agent와 실제 클라이언트가 다를 수 있습니다.

**해결 방법 1: CSS 미디어 쿼리**

```jsx
// ✅ CSS로 해결 (가장 좋음)
function ResponsiveNav() {
  return (
    <>
      <nav className="mobile-nav">
        {/* 모바일 메뉴 */}
      </nav>
      <nav className="desktop-nav">
        {/* 데스크톱 메뉴 */}
      </nav>
    </>
  );
}
```

```css
/* CSS로 표시/숨김 */
.mobile-nav {
  display: block;
}
.desktop-nav {
  display: none;
}

@media (min-width: 768px) {
  .mobile-nav {
    display: none;
  }
  .desktop-nav {
    display: block;
  }
}
```

**해결 방법 2: 서버에서 User Agent 전달**

```jsx
// ✅ 서버에서 감지
export async function getServerSideProps({ req }) {
  const userAgent = req.headers['user-agent'] || '';
  const isMobile = /Mobile/.test(userAgent);

  return {
    props: { isMobile }
  };
}

function ResponsiveNav({ isMobile }) {
  return isMobile ? <MobileNav /> : <DesktopNav />;
}
```

### Mismatch 예제 6: 외부 스크립트

Google Analytics, 광고 스크립트 등:

```jsx
// ❌ 문제가 되는 코드
function Page() {
  useEffect(() => {
    // Google Tag Manager 같은 스크립트가 DOM을 수정함
    const script = document.createElement('script');
    script.src = 'https://www.googletagmanager.com/gtag/js';
    document.head.appendChild(script);
  }, []);

  return (
    <div id="content">
      {/* GTM이 여기에 뭔가를 추가할 수 있음 */}
      <h1>페이지 제목</h1>
    </div>
  );
}
```

**문제:**
- 외부 스크립트가 DOM을 직접 수정하면 React가 추적할 수 없음
- Hydration mismatch 또는 이상한 버그 발생

**해결 방법:**

```jsx
// ✅ Next.js Script 컴포넌트 사용
import Script from 'next/script';

function Page() {
  return (
    <>
      <Script
        src="https://www.googletagmanager.com/gtag/js"
        strategy="afterInteractive" // 하이드레이션 후 로드
      />

      <div id="content">
        <h1>페이지 제목</h1>
      </div>
    </>
  );
}
```

## CSS 재적용 문제와 FOUC(Flash of Unstyled Content)

하이드레이션과 관련된 또 다른 큰 문제는 CSS입니다. 화면이 깜빡이거나 스타일이 다시 적용되는 것을 본 적 있나요?

### FOUC가 발생하는 이유

FOUC의 일반적인 타임라인:

```
T=0ms   브라우저: HTML 수신
T=10ms  브라우저: HTML 파싱 시작
T=50ms  브라우저: <link rel="stylesheet" href="styles.css"> 발견
        → CSS 다운로드 시작
T=100ms 브라우저: HTML 파싱 완료
        → 화면에 표시 (스타일 없음!) ⚠️
T=300ms 브라우저: CSS 다운로드 완료
        → 스타일 적용 (화면 변경!) ⚠️
```

사용자가 보는 것:
```
T=100ms: 스타일 없는 텍스트 (검은색, 기본 폰트)
T=300ms: 갑자기 스타일 적용됨 (색상, 레이아웃 변경)
```

이게 바로 "Flash of Unstyled Content"입니다.

### 원인 1: CSS 번들 분할과 지연 로딩

```html
<!-- ❌ 문제가 되는 상황 -->
<html>
<head>
  <!-- CSS가 너무 크고 느림 -->
  <link rel="stylesheet" href="huge-bundle.css"> <!-- 5MB, 3초 소요 -->
</head>
<body>
  <div class="hero-section">
    <!-- CSS 로딩 전까지 스타일 없음 -->
    <h1>환영합니다</h1>
  </div>
</body>
</html>
```

**실제 사례:** 제가 작업했던 프로젝트에서 CSS 번들이 4MB였습니다. 느린 3G 환경에서 테스트했을 때, 사용자는 6초 동안 스타일 없는 페이지를 봐야 했습니다. 완전히 깨진 것처럼 보였죠.

**해결 방법: 크리티컬 CSS 인라인화**

```html
<!-- ✅ 개선된 방법 -->
<html>
<head>
  <!-- 중요한 스타일은 인라인으로 -->
  <style>
    /* 크리티컬 CSS - 즉시 적용 */
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    .hero-section {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .hero-section h1 {
      color: white;
      font-size: 3rem;
      font-weight: 700;
    }

    /* 로딩 상태 */
    .loading {
      opacity: 0;
      transition: opacity 0.3s;
    }

    .loaded {
      opacity: 1;
    }
  </style>

  <!-- 나머지 CSS는 비동기 로딩 -->
  <link rel="preload" href="main.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="main.css"></noscript>
</head>
<body>
  <div class="hero-section">
    <h1>환영합니다</h1>
  </div>
</body>
</html>
```

**크리티컬 CSS 추출 도구:**
```bash
# Critters (Next.js에 내장됨)
npm install critters

# Critical
npm install critical
```

```js
// next.config.js
module.exports = {
  experimental: {
    optimizeCss: true, // Critters 사용
  },
};
```

### 원인 2: CSS-in-JS 하이드레이션

styled-components, Emotion 같은 CSS-in-JS 라이브러리는 특별한 문제가 있습니다:

```jsx
// ❌ 문제가 되는 코드
import styled from 'styled-components';

const Button = styled.button`
  background: blue;
  color: white;
  padding: 10px 20px;
`;

function Page() {
  return <Button>클릭하세요</Button>;
}
```

**타임라인:**
```
서버 렌더링:
- styled-components가 스타일 생성
- <style> 태그에 넣음
- HTML과 함께 전송

브라우저:
- HTML 표시 (스타일 적용됨 ✅)
- JavaScript 로딩...
- React 하이드레이션...
- styled-components 하이드레이션...
- 클래스 이름 재생성 (hash가 다를 수 있음!)
- 스타일 재적용 ⚠️ (깜빡임 발생!)
```

**왜 깜빡일까요?**

styled-components는 스타일에 해시 기반 클래스 이름을 생성합니다:
```css
/* 서버에서 생성 */
.sc-bdVaJa { background: blue; }

/* 클라이언트에서 재생성 (해시가 다를 수 있음) */
.sc-gsTCUz { background: blue; }
```

해시가 다르면:
1. 기존 스타일이 사라짐 (스타일 없는 버튼)
2. 새 스타일이 적용됨 (스타일 있는 버튼)
3. 깜빡임!

**해결 방법: Server-Side Rendering 설정**

```jsx
// ✅ styled-components SSR 설정
// pages/_document.js (Next.js)
import Document, { Html, Head, Main, NextScript } from 'next/document';
import { ServerStyleSheet } from 'styled-components';

export default class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const sheet = new ServerStyleSheet();
    const originalRenderPage = ctx.renderPage;

    try {
      // 렌더링 과정에서 스타일 수집
      ctx.renderPage = () =>
        originalRenderPage({
          enhanceApp: (App) => (props) =>
            sheet.collectStyles(<App {...props} />),
        });

      const initialProps = await Document.getInitialProps(ctx);

      return {
        ...initialProps,
        styles: (
          <>
            {initialProps.styles}
            {/* 수집된 스타일을 HTML에 주입 */}
            {sheet.getStyleElement()}
          </>
        ),
      };
    } finally {
      sheet.seal();
    }
  }

  render() {
    return (
      <Html>
        <Head />
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
```

이제 생성되는 HTML:
```html
<html>
<head>
  <!-- 서버에서 생성한 스타일 -->
  <style data-styled="active" data-styled-version="5.3.11">
    .sc-bdVaJa { background: blue; color: white; padding: 10px 20px; }
  </style>
</head>
<body>
  <button class="sc-bdVaJa">클릭하세요</button>
</body>
</html>
```

클라이언트는 이 스타일을 재사용하므로 깜빡임이 없습니다!

### 원인 3: 동적 스타일 적용

```jsx
// ❌ 문제가 되는 코드
function ThemeToggle() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    // localStorage에서 테마 읽기
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  return (
    <div
      style={{
        background: theme === 'dark' ? '#000' : '#fff',
        color: theme === 'dark' ? '#fff' : '#000',
      }}
    >
      컨텐츠
    </div>
  );
}
```

**타임라인:**
```
서버: theme = 'light' → 흰 배경
클라이언트 첫 렌더: theme = 'light' → 흰 배경 ✅
useEffect: localStorage.getItem('theme') = 'dark' → setTheme('dark')
클라이언트 재렌더: theme = 'dark' → 검은 배경
→ 배경색이 바뀜! (깜빡임)
```

사용자가 보는 것:
```
T=0ms:   흰 배경 (서버 렌더링)
T=100ms: 하이드레이션 완료
T=101ms: useEffect 실행
T=102ms: 검은 배경으로 바뀜 ⚠️
```

이것은 정말 거슬립니다. 다크 모드를 선택한 사용자가 페이지를 열 때마다 흰색 화면이 번쩍이는 것을 보게 됩니다.

**해결 방법 1: 쿠키 사용**

```jsx
// ✅ 서버에서 테마 읽기
export async function getServerSideProps({ req }) {
  const theme = req.cookies.theme || 'light';

  return {
    props: { theme }
  };
}

function ThemeToggle({ theme: initialTheme }) {
  const [theme, setTheme] = useState(initialTheme);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);

    // 쿠키에 저장
    document.cookie = `theme=${newTheme}; path=/; max-age=31536000`;
  };

  return (
    <div
      style={{
        background: theme === 'dark' ? '#000' : '#fff',
        color: theme === 'dark' ? '#fff' : '#000',
      }}
    >
      <button onClick={toggleTheme}>
        테마 변경
      </button>
      컨텐츠
    </div>
  );
}
```

**해결 방법 2: Blocking Script**

```html
<!-- ✅ HTML에 직접 스크립트 삽입 -->
<html>
<head>
  <!-- 렌더링 전에 테마 설정 -->
  <script>
    // 이 스크립트는 HTML 파싱 중 즉시 실행됨
    (function() {
      const theme = localStorage.getItem('theme') || 'light';

      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      }
    })();
  </script>

  <style>
    /* 기본 라이트 테마 */
    :root {
      --bg: #fff;
      --text: #000;
    }

    /* 다크 테마 */
    .dark {
      --bg: #000;
      --text: #fff;
    }

    body {
      background: var(--bg);
      color: var(--text);
      transition: background 0.3s, color 0.3s;
    }
  </style>
</head>
<body>
  <div id="root">...</div>
</body>
</html>
```

Next.js에서:
```jsx
// pages/_document.js
export default function Document() {
  return (
    <Html>
      <Head>
        {/* 하이드레이션 전에 실행 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme') || 'light';
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
```

이제 깜빡임이 없습니다! 테마가 HTML 렌더링 전에 적용되기 때문입니다.

## Remix의 Route-based CSS 로딩

Remix는 독특한 CSS 로딩 방식을 사용합니다. 각 라우트마다 필요한 CSS만 동적으로 로드합니다.

### 기본 개념

```tsx
// app/routes/dashboard.tsx
import type { LinksFunction } from "@remix-run/node";
import dashboardStyles from "~/styles/dashboard.css";

// 이 라우트가 렌더링될 때 필요한 CSS 선언
export const links: LinksFunction = () => [
  { rel: "stylesheet", href: dashboardStyles }
];

export default function Dashboard() {
  return (
    <div className="dashboard">
      <h1>대시보드</h1>
    </div>
  );
}
```

### 동작 과정

```
사용자가 / 페이지에 있음:
- home.css 로드됨 ✅
- dashboard.css 로드 안 됨

사용자가 /dashboard로 이동:
1. Remix가 dashboard.tsx의 links 함수 실행
2. dashboard.css를 <link> 태그로 추가
3. CSS 다운로드 및 적용
4. home.css는 유지 (또는 제거)
```

**문제점:**
```
사용자가 /dashboard 클릭
→ 페이지 전환 시작
→ dashboard.css 다운로드 시작 (500ms 소요)
→ 스타일 없는 대시보드 표시 ⚠️
→ CSS 다운로드 완료
→ 스타일 적용 (깜빡임!)
```

### 해결 방법 1: CSS 프리로딩

```tsx
// app/routes/index.tsx
export default function HomePage() {
  return (
    <div>
      <h1>홈페이지</h1>

      {/* 다음 페이지 CSS 미리 로드 */}
      <Link
        to="/dashboard"
        prefetch="intent" // 마우스 오버 시 프리로드
      >
        대시보드로 이동
      </Link>
    </div>
  );
}
```

Remix의 prefetch 옵션:
```tsx
<Link to="/dashboard" prefetch="none">
  {/* 프리로드 안 함 */}
</Link>

<Link to="/dashboard" prefetch="intent">
  {/* 마우스 오버 또는 포커스 시 프리로드 */}
</Link>

<Link to="/dashboard" prefetch="render">
  {/* 링크가 렌더링될 때 즉시 프리로드 */}
</Link>

<Link to="/dashboard" prefetch="viewport">
  {/* 뷰포트에 들어올 때 프리로드 */}
</Link>
```

### 해결 방법 2: 크리티컬 CSS를 글로벌로

```tsx
// app/root.tsx
import type { LinksFunction } from "@remix-run/node";
import globalStyles from "~/styles/global.css";
import criticalStyles from "~/styles/critical.css";

// 모든 페이지에서 로드되는 CSS
export const links: LinksFunction = () => [
  { rel: "stylesheet", href: globalStyles },
  { rel: "stylesheet", href: criticalStyles },
];

export default function App() {
  return (
    <html>
      <head>
        {/* 인라인 크리티컬 CSS */}
        <style dangerouslySetInnerHTML={{
          __html: `
            /* 즉시 필요한 스타일 */
            body {
              margin: 0;
              font-family: system-ui, sans-serif;
            }

            .loading {
              opacity: 0;
            }

            .loaded {
              opacity: 1;
              transition: opacity 0.2s;
            }
          `
        }} />

        <Links /> {/* Remix가 필요한 <link> 태그 삽입 */}
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
```

### 해결 방법 3: Transition 중 로딩 표시

```tsx
// app/routes/dashboard.tsx
import { useNavigation } from "@remix-run/react";

export default function Dashboard() {
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  return (
    <div className={isLoading ? 'loading' : 'loaded'}>
      {isLoading ? (
        <div className="skeleton">
          {/* 스켈레톤 UI */}
          <div className="skeleton-header" />
          <div className="skeleton-content" />
        </div>
      ) : (
        <div className="dashboard">
          <h1>대시보드</h1>
          {/* 실제 콘텐츠 */}
        </div>
      )}
    </div>
  );
}
```

## 성능 최적화 전략

### 1. Selective Hydration (React 18)

React 18의 킬러 기능입니다. 페이지의 일부만 먼저 하이드레이트하고, 나머지는 나중에 처리합니다.

```jsx
import { Suspense } from 'react';

function App() {
  return (
    <div>
      {/* 즉시 하이드레이션 */}
      <Header />

      {/* 지연 하이드레이션 */}
      <Suspense fallback={<LoadingSpinner />}>
        <HeavyComponent /> {/* 큰 번들, 복잡한 로직 */}
      </Suspense>

      <Suspense fallback={<CommentsPlaceholder />}>
        <Comments /> {/* 데이터 페칭이 필요함 */}
      </Suspense>

      {/* 즉시 하이드레이션 */}
      <Footer />
    </div>
  );
}
```

**동작 방식:**
```
T=0ms   서버: 모든 컴포넌트 렌더링
T=100ms 브라우저: HTML 표시
T=200ms 브라우저: JavaScript 로딩 완료
T=201ms React: Header 하이드레이션 시작
T=202ms React: Header 하이드레이션 완료 ✅
        → 사용자가 Header와 상호작용 가능
T=203ms React: Footer 하이드레이션 시작
T=204ms React: Footer 하이드레이션 완료 ✅
T=300ms React: HeavyComponent 하이드레이션 시작
T=500ms React: HeavyComponent 하이드레이션 완료 ✅
T=600ms React: Comments 데이터 로딩...
T=1000ms React: Comments 하이드레이션 완료 ✅
```

**장점:**
- 중요한 부분(Header, Footer)이 먼저 인터랙티브해짐
- 무거운 컴포넌트가 전체 페이지를 블록하지 않음
- 사용자가 더 빨리 페이지와 상호작용 가능

**실제 예시:**

```jsx
// ✅ 블로그 포스트 페이지
function BlogPost({ post }) {
  return (
    <article>
      {/* 핵심 콘텐츠 - 즉시 하이드레이션 */}
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />

      {/* 관련 포스트 - 지연 하이드레이션 */}
      <Suspense fallback={<div>관련 포스트 로딩 중...</div>}>
        <RelatedPosts postId={post.id} />
      </Suspense>

      {/* 댓글 - 지연 하이드레이션 */}
      <Suspense fallback={<div>댓글 로딩 중...</div>}>
        <Comments postId={post.id} />
      </Suspense>

      {/* 광고 - 지연 하이드레이션 */}
      <Suspense fallback={<div className="ad-placeholder" />}>
        <AdBanner />
      </Suspense>
    </article>
  );
}
```

### 2. 점진적 하이드레이션 (Progressive Hydration)

뷰포트에 보이는 것만 하이드레이트하는 기법입니다:

```jsx
// ✅ 커스텀 훅
function useInViewportHydration() {
  const [shouldHydrate, setShouldHydrate] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldHydrate(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px', // 뷰포트 100px 전에 미리 로드
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return [ref, shouldHydrate];
}

// 사용 예시
function LazySection({ children }) {
  const [ref, shouldHydrate] = useInViewportHydration();

  return (
    <div ref={ref}>
      {shouldHydrate ? children : <div>로딩중...</div>}
    </div>
  );
}

// 페이지에서
function LongPage() {
  return (
    <div>
      <HeroSection /> {/* 즉시 하이드레이션 */}

      <LazySection>
        <FeatureSection /> {/* 스크롤 시 하이드레이션 */}
      </LazySection>

      <LazySection>
        <TestimonialsSection /> {/* 스크롤 시 하이드레이션 */}
      </LazySection>

      <LazySection>
        <ContactForm /> {/* 스크롤 시 하이드레이션 */}
      </LazySection>
    </div>
  );
}
```

**측정 결과 (실제 프로젝트):**
```
Before:
- Total Blocking Time: 2,300ms
- Time to Interactive: 4,500ms

After (점진적 하이드레이션):
- Total Blocking Time: 800ms ⬇️ 65% 감소
- Time to Interactive: 1,200ms ⬇️ 73% 감소
```

### 3. 하이드레이션 상태 관리

```jsx
// ✅ 커스텀 훅으로 하이드레이션 상태 추적
function useHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}

// 사용 예시 1: 조건부 렌더링
function InteractiveWidget() {
  const hydrated = useHydrated();

  if (!hydrated) {
    // 서버 렌더링 + 하이드레이션 전
    return <StaticPlaceholder />;
  }

  // 하이드레이션 후 - 완전히 인터랙티브
  return <ComplexInteractiveWidget />;
}

// 사용 예시 2: 브라우저 API 사용
function GeolocationWidget() {
  const hydrated = useHydrated();
  const [location, setLocation] = useState(null);

  useEffect(() => {
    if (hydrated && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation(pos.coords)
      );
    }
  }, [hydrated]);

  if (!location) {
    return <div>위치 확인 중...</div>;
  }

  return (
    <div>
      현재 위치: {location.latitude}, {location.longitude}
    </div>
  );
}

// 사용 예시 3: 애니메이션
function AnimatedComponent() {
  const hydrated = useHydrated();

  return (
    <div
      className={hydrated ? 'fade-in' : ''}
      // 하이드레이션 전에는 애니메이션 안 함
    >
      컨텐츠
    </div>
  );
}
```

### 4. 데이터 프리페칭

```jsx
// ✅ Next.js에서 데이터 프리페칭
export async function getServerSideProps() {
  // 서버에서 데이터 가져오기
  const initialData = await fetchData();

  return {
    props: {
      initialData,
      // 추가로 필요할 수 있는 데이터의 ID만 전달
      relatedIds: initialData.related.map(item => item.id)
    }
  };
}

function Page({ initialData, relatedIds }) {
  // 초기 데이터는 즉시 표시
  const [data, setData] = useState(initialData);

  useEffect(() => {
    // 관련 데이터는 백그라운드에서 로딩
    fetchRelatedData(relatedIds).then(related => {
      setData(prev => ({ ...prev, related }));
    });
  }, [relatedIds]);

  return (
    <div>
      <h1>{data.title}</h1>
      <p>{data.content}</p>

      {data.related ? (
        <RelatedItems items={data.related} />
      ) : (
        <div>관련 항목 로딩 중...</div>
      )}
    </div>
  );
}
```

## 함정과 주의사항

### 함정 1: suppressHydrationWarning 남용

```jsx
// ❌ 나쁜 예
function Component() {
  return (
    <div suppressHydrationWarning>
      {/* 경고를 숨기기 위해 남발 */}
      {Math.random()}
    </div>
  );
}
```

**왜 나쁜가?**
- 근본 원인을 해결하지 않음
- 실제 버그를 숨길 수 있음
- 하이드레이션이 실패해도 알 수 없음

**올바른 사용:**
```jsx
// ✅ 정말 불가피한 경우에만
function TimeAgo({ timestamp }) {
  return (
    <time suppressHydrationWarning>
      {/* 서버와 클라이언트의 시간대가 다를 수 있음 */}
      {formatTimeAgo(timestamp)}
    </time>
  );
}
```

### 함정 2: useEffect로 모든 것 해결

```jsx
// ❌ 나쁜 예
function Component() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // 서버에서 아무것도 렌더링 안 함

  return <div>컨텐츠</div>;
}
```

**문제:**
- SEO에 불리함 (검색 엔진이 컨텐츠를 못 봄)
- 초기 로딩이 느려짐
- Cumulative Layout Shift(CLS) 증가

**더 나은 방법:**
```jsx
// ✅ 좋은 예
function Component() {
  const [clientOnlyData, setClientOnlyData] = useState(null);

  useEffect(() => {
    // 클라이언트 전용 데이터만 나중에 로딩
    setClientOnlyData(getClientData());
  }, []);

  return (
    <div>
      {/* 서버에서도 렌더링 */}
      <h1>제목</h1>
      <p>설명</p>

      {/* 클라이언트 전용 */}
      {clientOnlyData && <ClientWidget data={clientOnlyData} />}
    </div>
  );
}
```

### 함정 3: 하이드레이션 경고 무시

```jsx
// ❌ 개발 중 이런 경고를 본다면
Warning: Text content did not match. Server: "0" Client: "5"
```

"뭐, 화면에는 잘 나오니까 괜찮겠지" 하고 넘어가면 안 됩니다!

**실제로 발생할 수 있는 문제:**
1. **성능 저하**: React가 전체 트리를 재렌더링
2. **메모리 누수**: 이벤트 리스너 중복 연결
3. **포커스 손실**: 입력 필드의 포커스가 사라짐
4. **스크롤 리셋**: 페이지가 맨 위로 스크롤됨
5. **상태 손실**: 컴포넌트 상태가 리셋됨

**실제 사례:**
```jsx
// ❌ 문제가 되는 코드
function SearchInput() {
  const [query, setQuery] = useState('');
  const randomId = Math.random(); // 하이드레이션 mismatch!

  return (
    <input
      id={randomId}
      value={query}
      onChange={e => setQuery(e.target.value)}
    />
  );
}
```

**사용자 경험:**
```
1. 사용자가 검색어 입력 시작
2. "Re" 입력함
3. 하이드레이션 발생 (랜덤 ID 변경)
4. 입력 필드가 재생성됨
5. 포커스 손실 ⚠️
6. 사용자: "?? 왜 입력이 안 돼?"
```

### 함정 4: 외부 스크립트와의 충돌

```jsx
// ❌ 문제가 되는 상황
function Page() {
  useEffect(() => {
    // Google Translate 위젯
    new google.translate.TranslateElement({
      pageLanguage: 'ko'
    }, 'google_translate');
  }, []);

  return (
    <div>
      <div id="google_translate"></div>
      <p>번역할 텍스트</p>
    </div>
  );
}
```

**문제:**
- Google Translate가 DOM을 직접 수정
- React가 이를 감지하지 못함
- 재렌더링 시 충돌 발생

**해결 방법:**
```jsx
// ✅ Portal 사용
function Page() {
  const translateRef = useRef(null);

  useEffect(() => {
    if (translateRef.current) {
      // DOM을 React 외부로 분리
      new google.translate.TranslateElement({
        pageLanguage: 'ko'
      }, translateRef.current);
    }
  }, []);

  return (
    <div>
      {/* 이 div는 React가 관리하지 않음 */}
      <div ref={translateRef} suppressHydrationWarning />

      <p>번역할 텍스트</p>
    </div>
  );
}
```

## 디버깅 기법

### 1. Hydration 에러 추적

```jsx
// ✅ 개발 환경에서 자동 추적
if (process.env.NODE_ENV === 'development') {
  const originalError = console.error;

  console.error = function(...args) {
    // 하이드레이션 에러 감지
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Hydration')
    ) {
      console.group('🔥 하이드레이션 에러 발생!');
      console.trace('에러 위치:');
      console.log('전체 메시지:', ...args);
      console.groupEnd();
    }

    originalError.apply(console, args);
  };
}
```

### 2. 서버/클라이언트 차이 시각화

```jsx
// ✅ 디버깅 컴포넌트
function HydrationDebug({ children, label }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return children;
  }

  return (
    <div
      style={{
        border: `2px solid ${isClient ? 'green' : 'red'}`,
        padding: '10px',
        position: 'relative'
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -10,
          left: 10,
          background: isClient ? 'green' : 'red',
          color: 'white',
          padding: '2px 8px',
          fontSize: '12px'
        }}
      >
        {label} - {isClient ? 'CLIENT' : 'SERVER'}
      </div>
      {children}
    </div>
  );
}

// 사용
function Page() {
  return (
    <div>
      <HydrationDebug label="Header">
        <Header />
      </HydrationDebug>

      <HydrationDebug label="Content">
        <Content />
      </HydrationDebug>
    </div>
  );
}
```

### 3. React DevTools Profiler

```jsx
// ✅ 하이드레이션 성능 측정
import { Profiler } from 'react';

function onRenderCallback(
  id,
  phase, // "mount" 또는 "update"
  actualDuration, // 렌더링 시간
  baseDuration,
  startTime,
  commitTime
) {
  if (phase === 'mount') {
    console.log(`${id} 하이드레이션 소요 시간: ${actualDuration}ms`);

    if (actualDuration > 100) {
      console.warn(`⚠️ ${id}의 하이드레이션이 너무 느립니다!`);
    }
  }
}

function App() {
  return (
    <Profiler id="App" onRender={onRenderCallback}>
      <Header />
      <Main />
      <Footer />
    </Profiler>
  );
}
```

### 4. Next.js Hydration 디버깅

```jsx
// next.config.js
module.exports = {
  // 하이드레이션 에러를 더 자세히 표시
  reactStrictMode: true,

  compiler: {
    // 개발 중 상세한 에러 메시지
    removeConsole: false,
  },

  // 실험적 기능: 하이드레이션 에러 오버레이
  experimental: {
    scrollRestoration: true,
  }
};
```

## 모범 사례 요약

### ✅ 해야 할 것

#### 1. 서버와 클라이언트 렌더링 결과를 동일하게 유지

```jsx
// ✅ 좋은 예
export async function getServerSideProps() {
  const timestamp = Date.now();

  return {
    props: { timestamp }
  };
}

function Page({ timestamp }) {
  return <div>시간: {timestamp}</div>;
}
```

#### 2. 크리티컬 CSS 인라인화

```html
<!-- ✅ 중요한 스타일은 HTML에 포함 -->
<style>
  /* Above-the-fold 스타일 */
  .hero { ... }
  .header { ... }
</style>
```

#### 3. 점진적 향상 (Progressive Enhancement)

```jsx
// ✅ 기본 기능 먼저, 향상된 기능은 나중에
function Form() {
  const [clientReady, setClientReady] = useState(false);

  useEffect(() => {
    setClientReady(true);
  }, []);

  return (
    <form>
      <input type="text" name="email" />

      {/* 기본 제출 버튼 - 항상 작동 */}
      <button type="submit">제출</button>

      {/* 향상된 기능 - 클라이언트에서만 */}
      {clientReady && (
        <button type="button" onClick={saveAsDraft}>
          임시 저장
        </button>
      )}
    </form>
  );
}
```

#### 4. 스켈레톤 UI 활용

```jsx
// ✅ 로딩 상태를 우아하게 처리
function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts().then(data => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <ProductListSkeleton />;
  }

  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

#### 5. CSS 프리로딩

```jsx
// ✅ 다음 페이지 CSS 미리 로드
function HomePage() {
  return (
    <div>
      <Link
        href="/dashboard"
        onMouseEnter={() => {
          // 마우스 오버 시 CSS 프리로드
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.href = '/dashboard.css';
          document.head.appendChild(link);
        }}
      >
        대시보드
      </Link>
    </div>
  );
}
```

### ❌ 하지 말아야 할 것

#### 1. 하이드레이션 불일치 방치

```jsx
// ❌ 절대 하지 마세요
function Component() {
  return <div>{Math.random()}</div>;
}
```

#### 2. suppressHydrationWarning 남용

```jsx
// ❌ 임시방편으로만 사용
<div suppressHydrationWarning>
  {/* 근본 원인을 해결하세요! */}
</div>
```

#### 3. CSS 의존성 무시

```jsx
// ❌ CSS 로딩을 기다리지 않음
useEffect(() => {
  // CSS가 로드되기 전에 렌더링됨!
  setMounted(true);
}, []);
```

#### 4. 과도한 동적 스타일

```jsx
// ❌ 하이드레이션 시 스타일이 크게 바뀜
function Component() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    setTheme(localStorage.getItem('theme') || 'light');
  }, []);

  return (
    <div style={{
      background: theme === 'dark' ? '#000' : '#fff',
      // 깜빡임 발생!
    }}>
      컨텐츠
    </div>
  );
}
```

## 실전 체크리스트

새 페이지를 만들 때 이 체크리스트를 확인하세요:

### SSR 페이지 체크리스트

- [ ] **서버/클라이언트 일관성**: 첫 렌더링 결과가 동일한가?
- [ ] **브라우저 API 체크**: typeof window !== 'undefined' 사용했나?
- [ ] **난수/시간 사용**: 서버에서 props로 전달했나?
- [ ] **localStorage 사용**: useEffect로 감쌌나?
- [ ] **조건부 렌더링**: 하이드레이션 전후로 구조가 바뀌지 않나?
- [ ] **외부 스크립트**: suppressHydrationWarning 또는 Portal 사용했나?

### CSS 체크리스트

- [ ] **크리티컬 CSS**: 중요한 스타일을 인라인화했나?
- [ ] **CSS-in-JS**: SSR 설정을 올바르게 했나?
- [ ] **로딩 상태**: 스켈레톤 UI를 제공하나?
- [ ] **FOUC 방지**: 기본 스타일이 먼저 로드되나?
- [ ] **테마 전환**: 깜빡임 없이 동작하나?

### 성능 체크리스트

- [ ] **Selective Hydration**: Suspense를 활용했나?
- [ ] **점진적 하이드레이션**: 뷰포트 밖 컴포넌트를 지연 로딩하나?
- [ ] **프리페칭**: 다음 페이지 리소스를 미리 로드하나?
- [ ] **번들 크기**: JavaScript 번들이 너무 크지 않나?
- [ ] **Profiling**: React DevTools로 성능을 측정했나?

## 참고 자료

### 공식 문서
- **[React 18 - Hydration](https://react.dev/reference/react-dom/client/hydrateRoot)** - React 공식 하이드레이션 가이드
- **[Next.js - Server-Side Rendering](https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering)** - Next.js SSR 완벽 가이드
- **[Remix - Route Module API](https://remix.run/docs/en/main/route/links)** - Remix route-based CSS 로딩
- **[React - Server Components](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023#react-server-components)** - 차세대 서버 렌더링

### 심화 학습 자료
- **[Web.dev - Optimize Cumulative Layout Shift](https://web.dev/optimize-cls/)** - CLS 최적화와 CSS 로딩 전략
- **[MDN - Critical Rendering Path](https://developer.mozilla.org/en-US/docs/Web/Performance/Critical_rendering_path)** - 브라우저 렌더링 과정 이해
- **[React 18 - Concurrent Features](https://react.dev/blog/2022/03/29/react-v18#what-is-concurrent-react)** - Selective Hydration 깊이 이해하기
- **[web.dev - First Contentful Paint](https://web.dev/fcp/)** - 초기 렌더링 최적화

### 실무 가이드
- **[Kent C. Dodds - Fix the "not wrapped in act()" warning](https://kentcdodds.com/blog/fix-the-not-wrapped-in-act-warning)** - 하이드레이션 테스트
- **[Josh W. Comeau - The Perils of Rehydration](https://www.joshwcomeau.com/react/the-perils-of-rehydration/)** - 하이드레이션 문제 해결 실무 가이드 (강력 추천!)
- **[Vercel - Loading Third-Party JavaScript](https://nextjs.org/docs/pages/building-your-application/optimizing/third-party-libraries)** - 서드파티 스크립트 최적화
- **[Google Developers - Optimize CSS](https://developers.google.com/speed/docs/insights/OptimizeCSSDelivery)** - CSS 로딩 최적화

### 도구 및 라이브러리
- **[React DevTools Profiler](https://react.dev/learn/react-developer-tools)** - 하이드레이션 성능 분석
- **[Lighthouse](https://developers.google.com/web/tools/lighthouse)** - 웹 성능 측정 (CLS, FCP, TTI)
- **[webpack-bundle-analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)** - JavaScript 번들 크기 분석
- **[Critters](https://github.com/GoogleChromeLabs/critters)** - 크리티컬 CSS 자동 추출
- **[Critical](https://github.com/addyosmani/critical)** - 크리티컬 CSS 생성 도구

### 블로그 포스트
- **[Patterns.dev - Server-Side Rendering](https://www.patterns.dev/posts/server-side-rendering/)** - SSR 패턴과 하이드레이션 전략
- **[Smashing Magazine - A Deep Dive Into Next.js Static Generation](https://www.smashingmagazine.com/2021/04/incremental-static-regeneration-nextjs/)** - Next.js 렌더링 전략 비교
- **[CSS-Tricks - Critical CSS](https://css-tricks.com/how-do-you-determine-what-your-critical-css-is/)** - 크리티컬 CSS 식별 및 최적화
- **[Jake Archibald - Rendering on the Web](https://web.dev/rendering-on-the-web/)** - CSR vs SSR vs SSG 비교

### 비디오 자료
- **[React Conf 2021 - Server Components](https://www.youtube.com/watch?v=TQQPAU21ZUw)** - React Server Components 소개
- **[Lydia Hallie - SSR vs SSG](https://www.youtube.com/watch?v=f1rF9YKm1Ms)** - 렌더링 전략 비교
- **[Lee Robinson - Next.js Hydration](https://www.youtube.com/watch?v=MqrSccKP7Fo)** - Next.js 하이드레이션 최적화
{% endraw %}
