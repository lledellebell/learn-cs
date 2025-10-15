---
title: Chrome User Agent Override 가이드
date: 2025-10-02
categories: [Web Development, Tools]
tags: [HTTP, Authentication, Security, SEO, Jekyll, Schema.org]
layout: page
---
# Chrome DevTools로 User Agent를 마스터하는 완벽 가이드

"모바일에서만 레이아웃이 깨진다는데, 제 iPhone에서는 멀쩡하게 보이는데요?"

이런 버그 리포트를 받아본 적 있나요? 저도 처음에는 "제 폰에서는 잘 되는데..."라며 버그를 닫으려 했습니다. 하지만 실제로 확인해보니 **특정 Android 기기에서만 발생하는 치명적인 레이아웃 버그**였습니다. 문제는 User Agent 기반 분기 처리에서 발생했고, 이를 발견하기까지 3일이 걸렸습니다.

실제 기기가 없어도 다양한 환경을 테스트할 수 있다면 얼마나 좋을까요? Chrome DevTools의 User Agent Override가 바로 그 해답입니다.

## 왜 User Agent를 이해해야 할까요?

상상해보세요. 여러분이 만든 웹사이트에 하루 만 명의 사용자가 접속합니다. 이 중 3,000명은 iPhone에서, 2,000명은 Android에서, 나머지는 다양한 데스크톱 브라우저에서 접속합니다. 각각의 환경에서 여러분의 사이트가 제대로 작동하는지 어떻게 확인하시겠습니까?

### User Agent가 실제로 해결하는 문제들

#### 1. 크로스 브라우저 이슈 디버깅

```js
// 실제로 마주친 버그 사례
// Safari에서만 날짜 파싱이 실패하는 이슈
const dateString = "2024-01-15 10:30:00";
const date = new Date(dateString);
console.log(date);
// Chrome: Mon Jan 15 2024 10:30:00
// Safari: Invalid Date ❌
```

Safari는 ISO 8601 형식이 아닌 날짜 문자열을 파싱하지 못합니다. 하지만 Safari를 실제로 실행하지 않고도 Chrome DevTools에서 User Agent를 Safari로 변경하면 이런 문제를 미리 발견할 수 있습니다.

#### 2. 반응형 디자인 검증

모바일 기기마다 화면 크기뿐만 아니라 브라우저 렌더링 방식도 다릅니다:

```
데스크톱 Chrome (1920x1080)
┌────────────────────────────────────────┐
│ [메뉴] [로고]  [검색]  [로그인] [회원가입] │ ← 한 줄에 모두 표시
│                                        │
│        ┌──────────┐  ┌──────────┐    │
│        │ 카드 1    │  │ 카드 2    │    │ ← 3열 그리드
│        └──────────┘  └──────────┘    │
└────────────────────────────────────────┘

iPhone 13 (390x844)
┌──────────────┐
│ [☰] [로고] [🔍]│ ← 축약된 메뉴
│              │
│ ┌──────────┐ │
│ │ 카드 1    │ │ ← 1열 스택
│ └──────────┘ │
│ ┌──────────┐ │
│ │ 카드 2    │ │
│ └──────────┘ │
└──────────────┘
```

단순히 화면을 줄이는 것만으로는 실제 모바일 환경을 재현할 수 없습니다. User Agent를 변경해야 서버가 모바일 최적화된 리소스를 제공하는지 확인할 수 있습니다.

#### 3. SEO와 봇 크롤러 시뮬레이션

```js
// 실제 검색 엔진 봇이 보는 것
// User Agent: Googlebot/2.1
fetch('/api/content')
  .then(response => response.text())
  .then(html => {
    // Googlebot은 JavaScript를 실행하지만
    // 클라이언트 사이드 렌더링된 콘텐츠를 놓칠 수 있음
    console.log('Bot sees:', html);
  });
```

Google Search Console에서 "색인이 생성되지 않음" 오류를 받았을 때, Googlebot User Agent로 테스트하면 원인을 빠르게 파악할 수 있습니다.

### 저도 처음에는 잘못 알고 있었습니다

User Agent를 처음 접했을 때, 저는 이렇게 생각했습니다:
- ❌ "그냥 브라우저 창 크기만 줄이면 되지 않나?"
- ❌ "User Agent 변경하면 완벽한 시뮬레이션이 되겠지?"
- ❌ "프로덕션에서 User Agent로 기기를 판별하면 되겠다!"

하지만 실제로는:
- ✅ 화면 크기 변경 ≠ 실제 모바일 환경
- ✅ User Agent는 시뮬레이션 도구일 뿐, 실제 기기 테스트를 대체할 수 없음
- ✅ Feature Detection이 User Agent Sniffing보다 훨씬 안전함

이제 차근차근 제대로 배워보겠습니다.

## 기본 개념: User Agent String 완벽 해부

### User Agent String이란?

브라우저가 서버에 보내는 자기소개서입니다. "저는 Chrome 120 버전이고, Windows 10에서 실행되고 있습니다"라고 알려주는 것이죠.

```js
// 현재 브라우저의 User Agent 확인
console.log(navigator.userAgent);

// 출력 예시 (Chrome on macOS):
// Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)
// AppleWebKit/537.36 (KHTML, like Gecko)
// Chrome/120.0.0.0 Safari/537.36
```

### User Agent String 구조 분석

실제 User Agent를 파헤쳐봅시다:

```
Chrome (Windows) User Agent:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Mozilla/5.0 (Windows NT 10.0; Win64; x64)
AppleWebKit/537.36 (KHTML, like Gecko)
Chrome/120.0.0.0 Safari/537.36

📍 Mozilla/5.0
   → 역사적 호환성 (모든 브라우저가 사용)

📍 (Windows NT 10.0; Win64; x64)
   → 운영체제 정보
   → NT 10.0 = Windows 10
   → Win64 = 64비트 운영체제
   → x64 = 64비트 프로세서

📍 AppleWebKit/537.36
   → 렌더링 엔진 (Blink는 WebKit 기반)

📍 (KHTML, like Gecko)
   → 또 다른 호환성 표시

📍 Chrome/120.0.0.0
   → 실제 브라우저와 버전

📍 Safari/537.36
   → 추가 호환성 정보
```

### 다양한 User Agent 예시

```js
// iOS Safari (iPhone)
const iPhoneUA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) ' +
  'AppleWebKit/605.1.15 (KHTML, like Gecko) ' +
  'Version/17.0 Mobile/15E148 Safari/604.1';

// Android Chrome
const androidUA =
  'Mozilla/5.0 (Linux; Android 13; SM-S908B) ' +
  'AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/112.0.0.0 Mobile Safari/537.36';

// iPad Safari
const iPadUA =
  'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) ' +
  'AppleWebKit/605.1.15 (KHTML, like Gecko) ' +
  'Version/17.0 Mobile/15E148 Safari/604.1';

// Firefox (Windows)
const firefoxUA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) ' +
  'Gecko/20100101 Firefox/120.0';

// Edge (Windows)
const edgeUA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
  'AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0';

// Googlebot
const googlebotUA =
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
```

주목할 점: **모든 User Agent가 "Mozilla/5.0"으로 시작합니다.** 이는 1990년대 브라우저 전쟁의 유산입니다. 당시 많은 웹사이트가 "Mozilla"가 아니면 접속을 차단했기 때문에, 모든 브라우저가 Mozilla인 척하기 시작했습니다.

## Chrome DevTools에서 User Agent 변경하기

### 방법 1: Device Toolbar (가장 쉬운 방법)

Chrome DevTools를 열면 가장 먼저 시도할 수 있는 방법입니다:

```
Chrome DevTools 상단
┌─────────────────────────────────────────────┐
│ [📱] ← 이 버튼을 클릭하거나 Cmd+Shift+M      │
└─────────────────────────────────────────────┘

Device Toolbar 활성화 후
┌─────────────────────────────────────────────┐
│ [ Responsive ▼ ] [ 100% ▼ ] [⋮]            │ ← 여기서 디바이스 선택
└─────────────────────────────────────────────┘
│ ┌─────────────────────────────────────────┐ │
│ │  웹페이지 (선택한 디바이스로 렌더링)      │ │
│ └─────────────────────────────────────────┘ │
└───────────────────────────────────────────────┘
```

**단계별 가이드:**

1. Chrome DevTools 열기 (F12 또는 Cmd+Option+I)
2. Device Toolbar 활성화 (Cmd+Shift+M 또는 상단의 📱 아이콘)
3. Responsive 드롭다운 클릭
4. 원하는 디바이스 선택:
   - iPhone 14 Pro
   - iPhone SE
   - Samsung Galaxy S20
   - iPad Air
   - Surface Pro 7
   - 또는 "Edit..." 클릭하여 커스텀 디바이스 추가

### 방법 2: Network Conditions (세밀한 제어)

더 정교한 제어가 필요할 때 사용합니다:

```
1. DevTools 열기
2. Command Palette 열기
   - Windows/Linux: Ctrl+Shift+P
   - macOS: Cmd+Shift+P

3. "Show Network conditions" 입력하고 Enter

Network conditions 패널
┌─────────────────────────────────────────────┐
│ Network conditions                      [×]  │
├─────────────────────────────────────────────┤
│ ☐ Use browser default                       │ ← 체크 해제!
│                                             │
│ Custom:                                     │
│ ┌─────────────────────────────────────────┐│
│ │Mozilla/5.0 (iPhone; CPU iPhone OS...)   ││ ← 직접 입력
│ └─────────────────────────────────────────┘│
│                                             │
│ 또는 드롭다운에서 선택:                       │
│ [ Chrome - Mac ▼ ]                          │
└─────────────────────────────────────────────┘
```

**이 방법의 장점:**
- 정확한 User Agent 문자열을 직접 입력할 수 있음
- 네트워크 조건(3G, 4G, Offline)도 함께 시뮬레이션 가능
- 테스트 시나리오를 더 정밀하게 재현

### 방법 3: 명령줄 플래그 (자동화에 유용)

Chrome을 시작할 때부터 User Agent를 고정하고 싶을 때:

```bash
# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --user-agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15"

# Windows
"C:\Program Files\Google\Chrome\Application\chrome.exe" \
  --user-agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15"

# Linux
google-chrome \
  --user-agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15"
```

**주의사항:**
- 새 Chrome 인스턴스가 시작됩니다 (기존 창과 별도)
- 모든 탭이 같은 User Agent를 사용합니다
- 자동화 테스트 스크립트에 적합합니다

## 실전 예제: 다양한 시나리오별 활용법

### 예제 1: 모바일 레이아웃 버그 디버깅

```js
// 문제 상황: 모바일에서 햄버거 메뉴가 작동하지 않음
// index.html
<nav id="main-nav">
  <button id="menu-toggle" onclick="toggleMenu()">☰</button>
  <ul id="menu">
    <li><a href="/">홈</a></li>
    <li><a href="/about">소개</a></li>
  </ul>
</nav>

<script>
function toggleMenu() {
  const menu = document.getElementById('menu');

  // ❌ 나쁜 예: User Agent로 모바일 감지
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes('mobile')) {
    menu.classList.toggle('show');
  } else {
    // 데스크톱에서는 아무것도 안 함 (잘못된 로직!)
    console.log('Desktop view - menu toggle disabled');
  }
}
</script>
```

**문제 발견 과정:**

1. Chrome DevTools에서 iPhone 13 Pro로 설정
2. 햄버거 메뉴 클릭
3. Console 확인: "Desktop view - menu toggle disabled" 출력
4. 원인 파악: User Agent 감지가 제대로 작동하지 않음

**올바른 해결책:**

```js
// ✅ 좋은 예: 화면 크기와 CSS 미디어 쿼리 활용
function toggleMenu() {
  const menu = document.getElementById('menu');
  menu.classList.toggle('show');
}

// CSS에서 처리
/* style.css */
@media (min-width: 768px) {
  #menu {
    display: flex !important; /* 데스크톱에서 항상 표시 */
  }

  #menu-toggle {
    display: none; /* 햄버거 버튼 숨김 */
  }
}

@media (max-width: 767px) {
  #menu {
    display: none; /* 기본적으로 숨김 */
  }

  #menu.show {
    display: block; /* 토글 시 표시 */
  }
}
```

### 예제 2: 서버 응답 확인 (A/B 테스팅)

서버가 User Agent에 따라 다른 콘텐츠를 제공하는지 확인:

```js
// server.js (Node.js/Express 예시)
app.get('/api/content', (req, res) => {
  const userAgent = req.headers['user-agent'];

  // 모바일 사용자에게 간소화된 콘텐츠 제공
  if (/mobile/i.test(userAgent)) {
    res.json({
      layout: 'mobile',
      articles: getArticles({ limit: 5, summary: true })
    });
  } else {
    res.json({
      layout: 'desktop',
      articles: getArticles({ limit: 20, summary: false })
    });
  }
});
```

**DevTools에서 테스트:**

```js
// 1. Desktop User Agent로 테스트
// Network conditions에서 "Chrome - Mac" 선택
fetch('/api/content')
  .then(r => r.json())
  .then(data => {
    console.log('Desktop response:', data);
    // { layout: 'desktop', articles: [20개 전체 기사] }
  });

// 2. Mobile User Agent로 테스트
// "iPhone 13 Pro" 선택
fetch('/api/content')
  .then(r => r.json())
  .then(data => {
    console.log('Mobile response:', data);
    // { layout: 'mobile', articles: [5개 요약 기사] }
  });

// 3. Network 탭에서 실제 헤더 확인
/*
Request Headers:
  User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 17_0...)

Response:
  Content-Type: application/json
  X-Layout-Type: mobile
*/
```

### 예제 3: 크로스 브라우저 JavaScript API 차이

```js
// 문제 상황: Safari에서 날짜 관련 버그
function formatDate(dateString) {
  // ❌ Chrome에서만 작동하는 코드
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR');
}

// 테스트
console.log(formatDate('2024-01-15 10:30:00'));
// Chrome: "2024. 1. 15."
// Safari: "Invalid Date" ❌

// ✅ 해결책: ISO 8601 형식 사용 또는 수동 파싱
function formatDateSafe(dateString) {
  // ISO 8601 형식으로 변환
  const isoString = dateString.replace(' ', 'T');
  const date = new Date(isoString);

  // 유효성 검사
  if (isNaN(date.getTime())) {
    // 수동 파싱
    const [datePart, timePart] = dateString.split(' ');
    const [year, month, day] = datePart.split('-');
    const [hour, minute, second] = timePart.split(':');
    return new Date(year, month - 1, day, hour, minute, second);
  }

  return date;
}

// DevTools에서 Safari User Agent로 테스트
// Network conditions → Custom → Safari 15.4 - Mac 선택
```

### 예제 4: 검색 엔진 봇 크롤링 시뮬레이션

```js
// SEO 최적화 확인
// Googlebot User Agent로 변경:
// Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)

// 1. JavaScript 렌더링 확인
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded');

  // 동적 콘텐츠 로드
  fetch('/api/posts')
    .then(r => r.json())
    .then(posts => {
      const container = document.getElementById('posts');
      posts.forEach(post => {
        const article = document.createElement('article');
        article.innerHTML = `
          <h2>${post.title}</h2>
          <p>${post.excerpt}</p>
        `;
        container.appendChild(article);
      });

      console.log('Content rendered');
    });
});

// 2. Googlebot이 볼 수 있는지 확인
// Console에서 실행:
console.log('Title:', document.title);
console.log('Meta description:',
  document.querySelector('meta[name="description"]')?.content
);
console.log('Rendered content:',
  document.getElementById('posts')?.innerText
);
```

### 예제 5: Feature Detection vs User Agent Sniffing

```js
// ❌ 나쁜 예: User Agent로 기능 추측
function setupVideoPlayer() {
  const ua = navigator.userAgent;

  if (ua.includes('Safari') && !ua.includes('Chrome')) {
    // Safari는 HLS를 네이티브로 지원한다고 가정
    video.src = 'video.m3u8';
  } else {
    // 다른 브라우저는 MP4만 지원한다고 가정
    video.src = 'video.mp4';
  }
}

// ✅ 좋은 예: 실제 기능 감지
function setupVideoPlayerCorrect() {
  const video = document.createElement('video');

  // HLS 지원 확인
  if (video.canPlayType('application/vnd.apple.mpegurl') !== '') {
    video.src = 'video.m3u8';
    console.log('Using HLS');
  }
  // MP4 지원 확인
  else if (video.canPlayType('video/mp4') !== '') {
    video.src = 'video.mp4';
    console.log('Using MP4');
  }
  // WebM 지원 확인
  else if (video.canPlayType('video/webm') !== '') {
    video.src = 'video.webm';
    console.log('Using WebM');
  }

  return video;
}

// Touch 이벤트 감지
function isTouchDevice() {
  // ❌ 나쁜 예
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('mobile') || ua.includes('tablet');

  // ✅ 좋은 예
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
}
```

### 예제 6: 다양한 봇 User Agent 테스트

```js
// 봇 감지 및 처리 테스트
const BOT_USER_AGENTS = {
  googlebot: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  bingbot: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
  facebookbot: 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  twitterbot: 'Twitterbot/1.0',
  linkedinbot: 'LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)'
};

// 봇 감지 함수
function detectBot(userAgent) {
  const ua = userAgent.toLowerCase();

  const bots = [
    { name: 'Googlebot', pattern: 'googlebot' },
    { name: 'Bingbot', pattern: 'bingbot' },
    { name: 'FacebookBot', pattern: 'facebookexternalhit' },
    { name: 'TwitterBot', pattern: 'twitterbot' },
    { name: 'LinkedInBot', pattern: 'linkedinbot' }
  ];

  for (const bot of bots) {
    if (ua.includes(bot.pattern)) {
      return bot.name;
    }
  }

  return null;
}

// 서버 사이드 처리 (Node.js)
app.use((req, res, next) => {
  const botName = detectBot(req.headers['user-agent']);

  if (botName) {
    console.log(`${botName} detected`);

    // 봇에게 서버 사이드 렌더링된 페이지 제공
    res.locals.isBot = true;
    res.locals.botName = botName;
  }

  next();
});

// DevTools에서 각 봇으로 테스트하며 로그 확인
```

## 좋은 예 vs 나쁜 예: 실전 비교

### 비교 1: 모바일 감지

```js
// ❌ 나쁜 예: User Agent만 의존
function isMobile() {
  const ua = navigator.userAgent;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
}

if (isMobile()) {
  // 모바일 전용 스크립트 로드
  loadScript('mobile-app.js');
} else {
  // 데스크톱 전용 스크립트 로드
  loadScript('desktop-app.js');
}

// 문제점:
// 1. User Agent는 쉽게 조작 가능
// 2. 새로운 기기가 나오면 패턴 업데이트 필요
// 3. 태블릿은 어떻게 처리?
// 4. 데스크톱 Chrome에서 모바일 UA를 사용하면?
```

```js
// ✅ 좋은 예: 다양한 지표 조합
function getDeviceType() {
  // 1. 화면 크기 확인
  const width = window.innerWidth;

  // 2. Touch 지원 확인
  const hasTouch = (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0
  );

  // 3. 디바이스 픽셀 비율
  const dpr = window.devicePixelRatio || 1;

  // 4. Orientation 지원 확인
  const hasOrientation = 'orientation' in window;

  // 종합 판단
  if (width < 768 && hasTouch) {
    return 'mobile';
  } else if (width < 1024 && hasTouch && hasOrientation) {
    return 'tablet';
  } else {
    return 'desktop';
  }
}

// 미디어 쿼리와 함께 사용
const mediaQuery = window.matchMedia('(max-width: 768px)');
mediaQuery.addEventListener('change', (e) => {
  if (e.matches) {
    console.log('Mobile view activated');
  }
});
```

### 비교 2: 브라우저별 스타일 적용

```js
// ❌ 나쁜 예: JavaScript로 브라우저 감지 후 스타일 추가
function applyBrowserStyles() {
  const ua = navigator.userAgent;
  const body = document.body;

  if (ua.includes('Chrome')) {
    body.classList.add('chrome');
  } else if (ua.includes('Safari')) {
    body.classList.add('safari');
  } else if (ua.includes('Firefox')) {
    body.classList.add('firefox');
  }
}

// CSS
.chrome .button {
  border-radius: 4px;
}
.safari .button {
  border-radius: 6px;
}
```

```js
// ✅ 좋은 예: CSS Feature Queries 사용
/* CSS에서 직접 처리 */
.button {
  border-radius: 4px;
}

/* backdrop-filter를 지원하는 브라우저에서만 */
@supports (backdrop-filter: blur(10px)) {
  .glass-effect {
    backdrop-filter: blur(10px);
    background: rgba(255, 255, 255, 0.8);
  }
}

/* grid를 지원하지 않는 브라우저를 위한 폴백 */
.layout {
  display: flex; /* 폴백 */
}

@supports (display: grid) {
  .layout {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### 비교 3: 서버 응답 분기

```js
// ❌ 나쁜 예: User Agent로만 판단
app.get('/home', (req, res) => {
  const ua = req.headers['user-agent'];

  if (ua.includes('Mobile')) {
    res.render('mobile-home');
  } else {
    res.render('desktop-home');
  }
});

// 문제점:
// - 태블릿은?
// - User Agent 스푸핑하면?
// - 같은 콘텐츠를 두 번 관리해야 함
```

```js
// ✅ 좋은 예: 반응형 디자인 + Client Hints
app.get('/home', (req, res) => {
  // Client Hints API 사용 (신규 표준)
  const viewport = req.headers['sec-ch-viewport-width'];
  const mobile = req.headers['sec-ch-ua-mobile'] === '?1';

  // 하나의 템플릿, 다양한 데이터
  res.render('home', {
    isMobile: mobile,
    viewport: viewport,
    // 반응형 디자인으로 처리
    layoutClass: mobile ? 'mobile-layout' : 'desktop-layout'
  });
});

// Client Hints 활성화 (HTML)
<meta http-equiv="Accept-CH" content="Viewport-Width, DPR, Width">
```

### 비교 4: 기능 분기 처리

```js
// ❌ 나쁜 예: 브라우저별 하드코딩
function setupNotifications() {
  const ua = navigator.userAgent;

  if (ua.includes('Chrome')) {
    // Chrome은 Web Push를 지원한다고 가정
    registerServiceWorker();
    requestNotificationPermission();
  } else if (ua.includes('Safari')) {
    // Safari는 지원하지 않는다고 가정
    showInAppNotifications();
  } else {
    // 나머지는 모름
    showError('Notifications not supported');
  }
}
```

```js
// ✅ 좋은 예: 실제 API 지원 확인
async function setupNotifications() {
  // Service Worker 지원 확인
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker not supported');
    showInAppNotifications();
    return;
  }

  // Push API 지원 확인
  if (!('PushManager' in window)) {
    console.log('Push API not supported');
    showInAppNotifications();
    return;
  }

  // Notification API 지원 확인
  if (!('Notification' in window)) {
    console.log('Notification API not supported');
    showInAppNotifications();
    return;
  }

  // 모든 API를 지원하는 경우에만 실행
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY
      });

      console.log('Notifications enabled', subscription);
    }
  } catch (error) {
    console.error('Notification setup failed', error);
    showInAppNotifications();
  }
}
```

## 고급 활용: 자동화와 통합

### Puppeteer로 자동화된 User Agent 테스트

```js
const puppeteer = require('puppeteer');

// 다양한 User Agent로 자동 테스트
async function testMultipleUserAgents() {
  const userAgents = [
    {
      name: 'iPhone 13 Pro',
      ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
      viewport: { width: 390, height: 844 }
    },
    {
      name: 'Samsung Galaxy S21',
      ua: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Mobile Safari/537.36',
      viewport: { width: 360, height: 800 }
    },
    {
      name: 'Desktop Chrome',
      ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 }
    }
  ];

  const browser = await puppeteer.launch();

  for (const device of userAgents) {
    console.log(`\nTesting with ${device.name}`);

    const page = await browser.newPage();

    // User Agent 설정
    await page.setUserAgent(device.ua);

    // Viewport 설정
    await page.setViewport(device.viewport);

    // 테스트 실행
    await page.goto('https://example.com');

    // 스크린샷 캡처
    await page.screenshot({
      path: `screenshots/${device.name.replace(/\s+/g, '-')}.png`,
      fullPage: true
    });

    // Console 로그 수집
    page.on('console', msg => {
      console.log(`  ${msg.type()}: ${msg.text()}`);
    });

    // 서버가 올바른 콘텐츠를 제공하는지 확인
    const userAgentDetected = await page.evaluate(() => {
      return navigator.userAgent;
    });

    console.log(`  Detected UA: ${userAgentDetected.substring(0, 50)}...`);

    // 특정 요소가 있는지 확인
    const isMobileLayout = await page.evaluate(() => {
      const hamburger = document.querySelector('.hamburger-menu');
      const desktopNav = document.querySelector('.desktop-nav');
      return hamburger !== null && desktopNav === null;
    });

    console.log(`  Mobile layout: ${isMobileLayout}`);

    await page.close();
  }

  await browser.close();
}

testMultipleUserAgents();
```

### Playwright로 크로스 브라우저 테스트

```js
const { chromium, firefox, webkit } = require('playwright');

// 여러 브라우저에서 동시 테스트
async function crossBrowserTest() {
  const browsers = [
    { type: chromium, name: 'Chrome' },
    { type: firefox, name: 'Firefox' },
    { type: webkit, name: 'Safari' }
  ];

  const results = [];

  for (const { type, name } of browsers) {
    console.log(`\nTesting with ${name}`);

    const browser = await type.launch();
    const context = await browser.newContext({
      // 모바일 시뮬레이션
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true
    });

    const page = await context.newPage();

    // 성능 측정
    const startTime = Date.now();
    await page.goto('https://example.com');
    const loadTime = Date.now() - startTime;

    // 레이아웃 검증
    const layoutTest = await page.evaluate(() => {
      const issues = [];

      // 가로 스크롤 확인
      if (document.documentElement.scrollWidth > window.innerWidth) {
        issues.push('Horizontal scroll detected');
      }

      // 텍스트 가독성 확인
      const elements = document.querySelectorAll('p, span, div');
      for (const el of elements) {
        const fontSize = parseFloat(window.getComputedStyle(el).fontSize);
        if (fontSize < 12) {
          issues.push(`Small font detected: ${fontSize}px`);
          break;
        }
      }

      // 터치 타겟 크기 확인
      const buttons = document.querySelectorAll('button, a');
      for (const btn of buttons) {
        const rect = btn.getBoundingClientRect();
        if (rect.width < 44 || rect.height < 44) {
          issues.push(`Small touch target: ${rect.width}x${rect.height}`);
          break;
        }
      }

      return issues;
    });

    results.push({
      browser: name,
      loadTime,
      issues: layoutTest
    });

    console.log(`  Load time: ${loadTime}ms`);
    console.log(`  Issues: ${layoutTest.length}`);
    layoutTest.forEach(issue => console.log(`    - ${issue}`));

    await browser.close();
  }

  // 결과 요약
  console.log('\n=== Test Summary ===');
  results.forEach(result => {
    console.log(`${result.browser}:`);
    console.log(`  Load time: ${result.loadTime}ms`);
    console.log(`  Issues: ${result.issues.length}`);
  });
}

crossBrowserTest();
```

### Selenium으로 다양한 환경 테스트

```python
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import time

def test_user_agents():
    """다양한 User Agent로 자동화 테스트"""

    user_agents = [
        {
            'name': 'iPhone 13',
            'ua': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
            'width': 390,
            'height': 844
        },
        {
            'name': 'Android',
            'ua': 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36',
            'width': 360,
            'height': 800
        },
        {
            'name': 'Desktop',
            'ua': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'width': 1920,
            'height': 1080
        }
    ]

    for device in user_agents:
        print(f"\nTesting {device['name']}")

        # Chrome 옵션 설정
        chrome_options = Options()
        chrome_options.add_argument(f"--user-agent={device['ua']}")
        chrome_options.add_argument(f"--window-size={device['width']},{device['height']}")

        # WebDriver 시작
        driver = webdriver.Chrome(options=chrome_options)

        try:
            # 페이지 로드
            driver.get('https://example.com')

            # User Agent 확인
            detected_ua = driver.execute_script('return navigator.userAgent;')
            print(f"  Detected UA: {detected_ua[:50]}...")

            # 레이아웃 검증
            is_mobile = driver.execute_script("""
                const hamburger = document.querySelector('.mobile-menu');
                const desktop = document.querySelector('.desktop-menu');
                return hamburger !== null && desktop === null;
            """)
            print(f"  Mobile layout: {is_mobile}")

            # 스크린샷 저장
            driver.save_screenshot(f"screenshots/{device['name']}.png")

            # 성능 메트릭 수집
            performance = driver.execute_script("""
                const perfData = window.performance.timing;
                return {
                    loadTime: perfData.loadEventEnd - perfData.navigationStart,
                    domReady: perfData.domContentLoadedEventEnd - perfData.navigationStart
                };
            """)
            print(f"  Load time: {performance['loadTime']}ms")
            print(f"  DOM ready: {performance['domReady']}ms")

        finally:
            driver.quit()
            time.sleep(2)

if __name__ == '__main__':
    test_user_agents()
```

## 함정과 주의사항: 피해야 할 실수들

### 함정 1: User Agent만 변경하고 Viewport는 그대로

```js
// ❌ 흔한 실수
// DevTools에서 User Agent만 "iPhone 13 Pro"로 변경
// 하지만 화면 크기는 데스크톱 그대로 (1920x1080)

// 결과:
console.log(navigator.userAgent); // iPhone UA ✓
console.log(window.innerWidth);   // 1920 (iPhone은 390!) ❌

// 미디어 쿼리가 제대로 작동하지 않음
@media (max-width: 768px) {
  /* 이 스타일이 적용되지 않음! */
  .mobile-menu { display: block; }
}
```

```js
// ✅ 올바른 방법
// User Agent와 Viewport를 모두 설정
// DevTools → Device Toolbar (Cmd+Shift+M)
// → "iPhone 13 Pro" 선택

// 또는 Puppeteer에서:
await page.setUserAgent('Mozilla/5.0 (iPhone...)');
await page.setViewport({ width: 390, height: 844 });
await page.setGeolocation({ latitude: 37.5665, longitude: 126.9780 });
```

### 함정 2: User Agent Override가 완벽한 시뮬레이션이라고 믿기

```js
// User Agent를 변경해도 바뀌지 않는 것들:

// 1. JavaScript 엔진은 여전히 Chrome
console.log(navigator.userAgent); // iPhone UA
// 하지만 V8 엔진의 동작은 그대로

// 2. 하드웨어 특성
console.log(navigator.hardwareConcurrency); // 데스크톱 CPU 코어 수
console.log(navigator.deviceMemory);        // 데스크톱 RAM
console.log(navigator.connection.type);     // 데스크톱 네트워크

// 3. 실제 센서는 시뮬레이션되지 않음
window.addEventListener('deviceorientation', (e) => {
  // 실제 모바일에서는 작동하지만
  // DevTools 시뮬레이션에서는 제한적
  console.log(e.alpha, e.beta, e.gamma);
});

// 4. 터치 이벤트의 세밀한 차이
element.addEventListener('touchstart', (e) => {
  // 마우스로 시뮬레이션된 터치는
  // 실제 손가락 터치와 다름
  console.log(e.touches[0].force); // 실제 기기에서만 정확
});
```

**교훈: User Agent Override는 개발 단계의 빠른 확인 도구입니다. 최종 테스트는 반드시 실제 기기에서 해야 합니다!**

### 함정 3: User Agent Sniffing에 과도하게 의존

```js
// ❌ 위험한 패턴
function initApp() {
  const ua = navigator.userAgent;

  // iOS 가정 → Safari만 고려
  if (/iPhone|iPad/.test(ua)) {
    // Safari에만 최적화된 코드
    setupSafariSpecificFeatures();
  }
  // Android 가정 → Chrome만 고려
  else if (/Android/.test(ua)) {
    // Chrome에만 최적화된 코드
    setupChromeSpecificFeatures();
  }
}

// 실제 문제:
// - iOS에서 Chrome을 사용하면?
// - Android에서 Samsung Browser를 사용하면?
// - iPad에서 Desktop mode를 켜면?
```

```js
// ✅ 안전한 패턴
function initApp() {
  // 필요한 기능을 직접 확인
  const features = {
    serviceWorker: 'serviceWorker' in navigator,
    pushNotifications: 'PushManager' in window,
    webGL: (() => {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    })(),
    webRTC: 'RTCPeerConnection' in window,
    geolocation: 'geolocation' in navigator
  };

  // 기능별로 초기화
  if (features.serviceWorker && features.pushNotifications) {
    setupNotifications();
  }

  if (features.webGL) {
    setup3DGraphics();
  }

  if (features.webRTC) {
    setupVideoChat();
  }
}
```

### 함정 4: 캐시 문제 간과

```js
// 문제 상황:
// 1. Desktop UA로 페이지 로드
// 2. User Agent를 Mobile로 변경
// 3. 새로고침
// 4. 여전히 Desktop 버전이 보임 ❌

// 원인: 서버 응답이 캐시됨
// Cache-Control: max-age=3600
// Vary 헤더가 User-Agent를 포함하지 않음

// ✅ 해결책 1: 서버 설정 수정
// server.js
app.use((req, res, next) => {
  // User Agent에 따라 다른 응답을 제공한다면
  // Vary 헤더에 명시
  res.set('Vary', 'User-Agent');
  next();
});

// ✅ 해결책 2: DevTools에서 캐시 비활성화
// DevTools → Network 탭 → "Disable cache" 체크

// ✅ 해결책 3: Hard Refresh
// Windows/Linux: Ctrl+Shift+R
// macOS: Cmd+Shift+R
```

### 함정 5: 봇 User Agent 테스트 시 IP 체크 간과

```js
// Googlebot User Agent로 변경 후 테스트
// Network conditions → Custom:
// Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)

// 문제: 서버가 IP 주소도 확인할 수 있음
app.get('/api/content', async (req, res) => {
  const ua = req.headers['user-agent'];
  const ip = req.ip;

  // Googlebot이라고 주장하지만...
  if (ua.includes('Googlebot')) {
    // IP가 실제로 Google 소유인지 확인
    const isGoogleIP = await verifyGoogleBotIP(ip);

    if (!isGoogleIP) {
      // 가짜 Googlebot!
      console.log(`Fake Googlebot from ${ip}`);
      return res.status(403).send('Forbidden');
    }
  }

  res.json({ content: '...' });
});

// ✅ 올바른 테스트 방법
// 1. robots.txt 확인
// 2. Google Search Console의 "URL 검사" 도구 사용
// 3. 또는 개발 서버에서 IP 검증 비활성화
```

### 함정 6: 새로운 User Agent 형식 무시

```js
// ❌ 구식 User Agent 파싱
function getBrowser(ua) {
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Firefox')) return 'Firefox';
  // Edge는? Brave는? Arc는?
}

// 문제: User Agent Reduction 정책
// Chrome은 User Agent를 단순화하고 있음
// 기존: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36...
// 향후: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36

// ✅ 미래 지향적 접근: Client Hints API
// index.html
<meta http-equiv="Accept-CH" content="
  Sec-CH-UA,
  Sec-CH-UA-Mobile,
  Sec-CH-UA-Platform,
  Sec-CH-UA-Platform-Version
">

// JavaScript
navigator.userAgentData.getHighEntropyValues([
  'platform',
  'platformVersion',
  'model',
  'uaFullVersion'
]).then(data => {
  console.log(data);
  // {
  //   platform: "macOS",
  //   platformVersion: "13.0.0",
  //   uaFullVersion: "110.0.5481.100"
  // }
});
```

### 함정 7: A11y (접근성) 테스트 부족

```js
// User Agent 테스트 시 놓치기 쉬운 것:
// 스크린 리더가 콘텐츠를 제대로 읽는가?

// ❌ 모바일 User Agent로만 테스트
// DevTools → iPhone 13 Pro 선택
// → 레이아웃만 확인

// ✅ 접근성도 함께 확인
// DevTools → Lighthouse 탭
// → "Accessibility" 체크 후 "Generate report"

// 또는 스크린 리더 시뮬레이션
// macOS: VoiceOver (Cmd+F5)
// Windows: NVDA (무료) 또는 JAWS

// 코드에서 확인할 항목:
const a11yChecklist = {
  // 1. 모든 이미지에 alt 텍스트
  images: document.querySelectorAll('img:not([alt])'),

  // 2. 버튼에 적절한 레이블
  buttons: Array.from(document.querySelectorAll('button')).filter(btn => {
    const label = btn.textContent.trim() ||
                  btn.getAttribute('aria-label') ||
                  btn.getAttribute('title');
    return !label;
  }),

  // 3. 폼 필드에 레이블 연결
  inputs: Array.from(document.querySelectorAll('input')).filter(input => {
    const id = input.id;
    const label = document.querySelector(`label[for="${id}"]`);
    return !label && input.type !== 'hidden';
  }),

  // 4. 적절한 헤딩 구조
  headings: (() => {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const levels = headings.map(h => parseInt(h.tagName[1]));
    // 레벨이 건너뛰어지는지 확인 (h1 → h3는 잘못됨)
    for (let i = 1; i < levels.length; i++) {
      if (levels[i] - levels[i-1] > 1) {
        return { error: `Heading level skipped at index ${i}` };
      }
    }
    return { ok: true };
  })()
};

console.log('A11y Issues:', a11yChecklist);
```

## 실전 활용: 팀에서 효과적으로 사용하기

### 활용 1: 테스트 체크리스트 만들기

```js
// test-checklist.js
// 모든 팀원이 동일한 환경으로 테스트하도록

const TEST_MATRIX = [
  // 모바일 디바이스
  {
    category: 'Mobile - iOS',
    devices: [
      {
        name: 'iPhone SE (2022)',
        ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Mobile/15E148 Safari/604.1',
        viewport: { width: 375, height: 667 },
        tests: ['반응형 레이아웃', '터치 인터랙션', 'Safari 호환성']
      },
      {
        name: 'iPhone 14 Pro',
        ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        viewport: { width: 393, height: 852 },
        tests: ['Dynamic Island 대응', '고해상도 이미지', 'PWA 설치']
      }
    ]
  },
  {
    category: 'Mobile - Android',
    devices: [
      {
        name: 'Samsung Galaxy S21',
        ua: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Mobile Safari/537.36',
        viewport: { width: 360, height: 800 },
        tests: ['Chrome 호환성', 'Material Design', '뒤로가기 버튼']
      },
      {
        name: 'Google Pixel 6',
        ua: 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.104 Mobile Safari/537.36',
        viewport: { width: 412, height: 915 },
        tests: ['최신 Android', 'PWA 기능', 'Notification']
      }
    ]
  },
  {
    category: 'Tablet',
    devices: [
      {
        name: 'iPad Air',
        ua: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
        viewport: { width: 820, height: 1180 },
        tests: ['태블릿 레이아웃', '가로/세로 모드', 'Split View']
      }
    ]
  },
  {
    category: 'Desktop',
    devices: [
      {
        name: 'Chrome (Windows)',
        ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        tests: ['전체 기능', '키보드 네비게이션', '성능']
      },
      {
        name: 'Safari (macOS)',
        ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        viewport: { width: 1440, height: 900 },
        tests: ['Safari 특수 기능', 'macOS 통합', '폰트 렌더링']
      }
    ]
  },
  {
    category: 'Bots',
    devices: [
      {
        name: 'Googlebot',
        ua: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        viewport: { width: 1920, height: 1080 },
        tests: ['SEO 메타태그', '크롤링 가능한 콘텐츠', 'robots.txt']
      }
    ]
  }
];

// 테스트 실행 함수
async function runTestMatrix(url) {
  console.log(`Testing ${url}\n`);

  for (const category of TEST_MATRIX) {
    console.log(`\n=== ${category.category} ===\n`);

    for (const device of category.devices) {
      console.log(`Testing ${device.name}:`);

      // 여기서 실제 테스트 수행 (Puppeteer/Playwright)
      // await testDevice(url, device);

      console.log(`  Tests: ${device.tests.join(', ')}`);
      console.log(`  ✓ Completed\n`);
    }
  }
}

// CI/CD에서 자동 실행
if (require.main === module) {
  const url = process.argv[2] || 'http://localhost:3000';
  runTestMatrix(url);
}
```

### 활용 2: 버그 리포트 템플릿

```markdown
# 버그 리포트: [간단한 제목]

## 재현 환경
- **User Agent**: `[DevTools에서 복사한 전체 UA 문자열]`
- **Viewport**: `[너비 x 높이]`
- **Device**: `[DevTools에서 선택한 디바이스 또는 실제 기기]`
- **Network**: `[Fast 3G / Slow 3G / Offline]`
- **Cache**: `[Enabled / Disabled]`

## 재현 단계
1. Chrome DevTools 열기 (F12)
2. Device Toolbar 활성화 (Cmd+Shift+M)
3. [디바이스명] 선택
4. [URL] 접속
5. [구체적인 액션]

## 실제 결과
[스크린샷 첨부]
[Console 에러 로그]

## 예상 결과
[설명]

## 추가 정보
- [ ] 실제 기기에서도 재현됨
- [ ] 다른 User Agent에서도 발생
- [ ] Desktop에서는 정상 작동
```

### 활용 3: 성능 벤치마크

```js
// performance-test.js
// 다양한 User Agent 환경에서 성능 측정

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

async function runPerformanceTest(url, userAgent, device) {
  const chrome = await chromeLauncher.launch({
    chromeFlags: [
      '--headless',
      `--user-agent=${userAgent}`
    ]
  });

  const options = {
    logLevel: 'info',
    output: 'json',
    onlyCategories: ['performance', 'accessibility'],
    port: chrome.port,
    emulatedFormFactor: device.formFactor,
    screenEmulation: {
      width: device.viewport.width,
      height: device.viewport.height,
      deviceScaleFactor: device.dpr || 1
    }
  };

  const runnerResult = await lighthouse(url, options);

  await chrome.kill();

  return {
    device: device.name,
    performance: runnerResult.lhr.categories.performance.score * 100,
    accessibility: runnerResult.lhr.categories.accessibility.score * 100,
    metrics: {
      fcp: runnerResult.lhr.audits['first-contentful-paint'].numericValue,
      lcp: runnerResult.lhr.audits['largest-contentful-paint'].numericValue,
      tti: runnerResult.lhr.audits['interactive'].numericValue,
      cls: runnerResult.lhr.audits['cumulative-layout-shift'].numericValue
    }
  };
}

// 여러 디바이스에서 테스트
async function benchmarkSuite(url) {
  const devices = [
    {
      name: 'Mobile (3G)',
      formFactor: 'mobile',
      viewport: { width: 375, height: 667 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0...'
    },
    {
      name: 'Desktop',
      formFactor: 'desktop',
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0...'
    }
  ];

  console.log(`Benchmarking ${url}\n`);

  for (const device of devices) {
    const result = await runPerformanceTest(url, device.userAgent, device);

    console.log(`\n${result.device}:`);
    console.log(`  Performance: ${result.performance.toFixed(1)}`);
    console.log(`  Accessibility: ${result.accessibility.toFixed(1)}`);
    console.log(`  FCP: ${(result.metrics.fcp / 1000).toFixed(2)}s`);
    console.log(`  LCP: ${(result.metrics.lcp / 1000).toFixed(2)}s`);
    console.log(`  TTI: ${(result.metrics.tti / 1000).toFixed(2)}s`);
    console.log(`  CLS: ${result.metrics.cls.toFixed(3)}`);
  }
}

benchmarkSuite('https://example.com');
```

## 현대적인 대안: User Agent Client Hints

User Agent 문자열은 점점 덜 신뢰할 수 있게 되고 있습니다. 대안으로 **Client Hints API**를 사용하세요:

```html
<!-- HTML에서 요청할 정보 지정 -->
<meta http-equiv="Accept-CH" content="
  Sec-CH-UA,
  Sec-CH-UA-Mobile,
  Sec-CH-UA-Platform,
  Sec-CH-UA-Arch,
  Sec-CH-UA-Model,
  Sec-CH-UA-Platform-Version,
  Sec-CH-UA-Full-Version-List
">
```

```js
// JavaScript에서 사용
if (navigator.userAgentData) {
  // 기본 정보 (즉시 사용 가능)
  console.log('Mobile:', navigator.userAgentData.mobile);
  console.log('Platform:', navigator.userAgentData.platform);
  console.log('Brands:', navigator.userAgentData.brands);
  // [
  //   { brand: "Google Chrome", version: "110" },
  //   { brand: "Chromium", version: "110" }
  // ]

  // 고급 정보 (권한 필요)
  navigator.userAgentData.getHighEntropyValues([
    'architecture',
    'model',
    'platformVersion',
    'uaFullVersion',
    'fullVersionList'
  ]).then(data => {
    console.log('Architecture:', data.architecture); // "arm" or "x86"
    console.log('Model:', data.model); // "iPhone 13 Pro"
    console.log('Platform Version:', data.platformVersion); // "13.0.0"
    console.log('Full Version:', data.uaFullVersion); // "110.0.5481.100"
  });
}
```

```js
// 서버에서 Client Hints 헤더 읽기
// Node.js/Express
app.get('/api/content', (req, res) => {
  const isMobile = req.headers['sec-ch-ua-mobile'] === '?1';
  const platform = req.headers['sec-ch-ua-platform'];
  const model = req.headers['sec-ch-ua-model'];

  console.log('Mobile:', isMobile);
  console.log('Platform:', platform); // "macOS", "Windows", "Android"
  console.log('Model:', model); // "Pixel 6", "iPhone 14 Pro"

  // 디바이스별 최적화된 응답
  if (isMobile) {
    res.json({
      imageQuality: 'medium',
      articleLimit: 10,
      enableInfiniteScroll: true
    });
  } else {
    res.json({
      imageQuality: 'high',
      articleLimit: 30,
      enableInfiniteScroll: false
    });
  }
});
```

**User Agent vs Client Hints 비교:**

```
User Agent (레거시):
❌ 거대한 문자열 파싱 필요
❌ 개인정보 침해 우려 (지문 채취)
❌ 표준화되지 않음 (브라우저마다 다름)
❌ 쉽게 스푸핑됨

Client Hints (현대):
✅ 구조화된 데이터
✅ 필요한 정보만 요청 (개인정보 보호)
✅ W3C 표준
✅ 점진적 개선 가능 (폴백 지원)
```

## 디버깅 체크리스트

User Agent 관련 이슈를 디버깅할 때 확인할 항목:

```js
// 1. User Agent 확인
console.log('UA:', navigator.userAgent);

// 2. Viewport 크기
console.log('Viewport:', {
  width: window.innerWidth,
  height: window.innerHeight,
  devicePixelRatio: window.devicePixelRatio
});

// 3. Touch 지원
console.log('Touch:', {
  touchStart: 'ontouchstart' in window,
  maxTouchPoints: navigator.maxTouchPoints,
  pointerEnabled: 'PointerEvent' in window
});

// 4. 네트워크 정보
if (navigator.connection) {
  console.log('Network:', {
    effectiveType: navigator.connection.effectiveType,
    downlink: navigator.connection.downlink,
    rtt: navigator.connection.rtt,
    saveData: navigator.connection.saveData
  });
}

// 5. 미디어 쿼리 상태
const queries = {
  mobile: window.matchMedia('(max-width: 767px)'),
  tablet: window.matchMedia('(min-width: 768px) and (max-width: 1023px)'),
  desktop: window.matchMedia('(min-width: 1024px)'),
  touch: window.matchMedia('(hover: none) and (pointer: coarse)'),
  retina: window.matchMedia('(-webkit-min-device-pixel-ratio: 2)')
};

Object.entries(queries).forEach(([name, mq]) => {
  console.log(`${name}:`, mq.matches);
});

// 6. 서버 응답 헤더 확인
fetch(window.location.href)
  .then(response => {
    console.log('Server Headers:', {
      vary: response.headers.get('vary'),
      cacheControl: response.headers.get('cache-control'),
      contentType: response.headers.get('content-type')
    });
  });

// 7. Layout Shift 감지
let cls = 0;
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (!entry.hadRecentInput) {
      cls += entry.value;
      console.log('CLS:', cls);
    }
  }
}).observe({ type: 'layout-shift', buffered: true });
```

## 참고 자료

### 공식 문서
- [Chrome DevTools - Network Conditions](https://developer.chrome.com/docs/devtools/network/reference/#conditions) - User Agent 설정 방법
- [Chrome DevTools - Device Mode](https://developer.chrome.com/docs/devtools/device-mode/) - 모바일 시뮬레이션 완벽 가이드
- [MDN - User-Agent Header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent) - User Agent 헤더 명세
- [MDN - Navigator.userAgent](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/userAgent) - JavaScript API 문서
- [User-Agent Client Hints](https://web.dev/user-agent-client-hints/) - 차세대 User Agent 정보 전달 방식

### User Agent 데이터베이스
- [WhatIsMyBrowser](https://www.whatismybrowser.com/guides/the-latest-user-agent/) - 최신 User Agent 문자열 모음
- [UserAgentString.com](http://www.useragentstring.com/) - User Agent 문자열 데이터베이스
- [51Degrees Device Detection](https://51degrees.com/resources/user-agent-tester) - User Agent 분석 도구

### 테스트 도구
- [BrowserStack](https://www.browserstack.com/) - 실제 디바이스에서 브라우저 테스트
- [LambdaTest](https://www.lambdatest.com/) - 크로스 브라우저 테스트 플랫폼
- [Sauce Labs](https://saucelabs.com/) - 클라우드 기반 자동화 테스트

### 자동화 라이브러리
- [Puppeteer](https://pptr.dev/) - Chrome/Chromium 제어를 위한 Node.js 라이브러리
- [Playwright](https://playwright.dev/) - 크로스 브라우저 자동화 (Chrome, Firefox, Safari)
- [Selenium WebDriver](https://www.selenium.dev/documentation/) - 웹 브라우저 자동화 표준

### 학습 자료
- [Browser Detection Using the User Agent](https://developer.mozilla.org/en-US/docs/Web/HTTP/Browser_detection_using_the_user_agent) - MDN 가이드
- [History of the User-Agent String](https://webaim.org/blog/user-agent-string-history/) - User Agent의 역사
- [Improving User Agent Security](https://www.chromium.org/updates/ua-reduction/) - Chrome의 User Agent Reduction 정책
