---
title: Chrome User Agent Override 가이드
date: 2025-10-02
layout: page
---
# Chrome User Agent Override 가이드

## User Agent String 이해하기

### User Agent String이란?

**User Agent String**은 웹 브라우저가 웹 서버에게 자신의 정체성을 알려주는 문자열입니다. 이 문자열에는 브라우저 종류, 버전, 운영체제, 렌더링 엔진 등의 정보가 포함됩니다.

### 일반적인 User Agent String 예시

```
// Chrome (Windows)
Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36

// Chrome (macOS)
Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36

// Safari (iOS)
Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1

// Firefox (Windows)
Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/120.0
```

### User Agent String 구성 요소

| 구성 요소 | 설명 | 예시 |
|-----------|------|------|
| **Mozilla/5.0** | 역사적 호환성을 위한 식별자 | `Mozilla/5.0` |
| **플랫폼 정보** | 운영체제와 아키텍처 | `(Windows NT 10.0; Win64; x64)` |
| **렌더링 엔진** | 브라우저가 사용하는 렌더링 엔진 | `AppleWebKit/537.36` |
| **브라우저 정보** | 브라우저 이름과 버전 | `Chrome/120.0.0.0` |
| **추가 정보** | 기타 호환성 정보 | `Safari/537.36` |

## Chrome에서 User Agent Override 방법

### 1. Developer Tools를 통한 방법

#### 단계별 가이드

<div align="center">
<img src="https://developer.chrome.com/static/docs/devtools/device-mode/override-user-agent/image/network-disable-default_1440.png" >
이미지 출처: [Chrome DevTools Documentation](https://developer.chrome.com/docs/devtools/device-mode/override-user-agent)
</div>

1. **User Agent 설정**
   - Device Toolbar에서 "Responsive" 드롭다운 클릭
   - 원하는 디바이스 선택 (iPhone, iPad, Android 등)
   - 또는 "Edit..." 선택하여 커스텀 디바이스 추가

2. **수동 User Agent 설정**
   - Developer Tools → ⋮ (더보기) → More tools → Network conditions
   - "Use browser default" 체크 해제
   - Custom User Agent 입력

### 2. Console을 통한 확인

```js
// 현재 User Agent 확인
console.log(navigator.userAgent);

// User Agent 변경 후 확인
console.log('User Agent:', navigator.userAgent);
console.log('Platform:', navigator.platform);
console.log('App Version:', navigator.appVersion);
```

### 3. 명령줄 플래그를 통한 방법

Chrome을 시작할 때 User Agent를 지정할 수 있습니다.

```bash
# Windows
chrome.exe --user-agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15"

# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --user-agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15"

# Linux
google-chrome --user-agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15"
```

## 활용 예시

### 1. 모바일 웹 개발 테스트

```js
// 모바일 디바이스 시뮬레이션
const mobileUserAgents = {
  iPhone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  Android: 'Mozilla/5.0 (Linux; Android 13; SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
  iPad: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
};

// 반응형 디자인 테스트
function testResponsiveDesign() {
  // User Agent 변경 후 레이아웃 확인
  console.log('Testing mobile layout...');
  // 모바일 특화 기능 테스트
}
```

### 2. 브라우저 호환성 테스트

```js
// 다양한 브라우저 시뮬레이션
const browserUserAgents = {
  chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/120.0',
  safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
};

// 브라우저별 기능 테스트
function detectBrowser(userAgent) {
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Unknown';
}
```

### 3. 검색 엔진 크롤러 시뮬레이션

```js
// 검색 엔진 봇 User Agent
const crawlerUserAgents = {
  googlebot: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  bingbot: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
  facebookbot: 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'
};

// SEO 테스트
function testSEORendering() {
  // 크롤러 관점에서 페이지 확인
  console.log('Testing SEO rendering...');
}
```

## User Agent Override의 한계

### 1. 완전한 시뮬레이션이 아님

```js
// User Agent만 변경되고 실제 브라우저 기능은 그대로
console.log(navigator.userAgent); // 변경됨
console.log(window.innerWidth);   // Chrome의 실제 값
console.log(screen.width);        // Chrome의 실제 값

// JavaScript API는 여전히 Chrome 기준
const isTouch = 'ontouchstart' in window; // Chrome 기준
```

### 2. 하드웨어 특성 미반영

```js
// 실제 모바일 디바이스의 특성은 시뮬레이션되지 않음
console.log(navigator.hardwareConcurrency); // 데스크톱 CPU 코어 수
console.log(navigator.deviceMemory);        // 데스크톱 메모리
console.log(navigator.connection);          // 데스크톱 네트워크
```

### 3. 서버 사이드 감지 한계

```js
// 서버에서는 User Agent만으로 판단
// 실제 디바이스 특성은 알 수 없음
fetch('/api/device-info', {
  headers: {
    'User-Agent': 'iPhone User Agent'
  }
});
```

## 주의

### 1. 프로그래밍적 User Agent 변경

```js
// Chrome Extension을 통한 동적 변경
chrome.webRequest.onBeforeSendHeaders.addListener(
  function(details) {
    const headers = details.requestHeaders;
    headers.forEach(header => {
      if (header.name.toLowerCase() === 'user-agent') {
        header.value = 'Custom User Agent String';
      }
    });
    return { requestHeaders: headers };
  },
  { urls: ['<all_urls>'] },
  ['blocking', 'requestHeaders']
);
```

### 2. 조건부 User Agent 설정

```js
// 특정 조건에 따른 User Agent 변경
function setConditionalUserAgent() {
  const currentHour = new Date().getHours();
  
  if (currentHour >= 9 && currentHour <= 17) {
    // 업무 시간: 데스크톱 시뮬레이션
    return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
  } else {
    // 업무 외 시간: 모바일 시뮬레이션
    return 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15';
  }
}
```

### 3. A/B 테스트를 위한 User Agent 활용

```js
// 랜덤 User Agent 선택
function getRandomUserAgent() {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
  ];
  
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}
```

## 보안 및 윤리적 고려사항

### 1. 웹사이트 정책 준수

```js
// robots.txt 확인
fetch('/robots.txt')
  .then(response => response.text())
  .then(robotsTxt => {
    console.log('Robots.txt:', robotsTxt);
    // User-agent별 정책 확인
  });
```

### 2. 과도한 요청 방지

```js
// Rate limiting 구현
class RateLimiter {
  constructor(maxRequests, timeWindow) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
    this.requests = [];
  }
  
  canMakeRequest() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }
    return false;
  }
}

const limiter = new RateLimiter(10, 60000); // 1분에 10회
```

### 3. 투명성 유지

```js
// 테스트 목적임을 명시
const testUserAgent = 'Mozilla/5.0 (TestBot/1.0; +https://example.com/testbot)';

// 실제 사용자 행동 시뮬레이션
function simulateUserBehavior() {
  // 자연스러운 간격으로 요청
  setTimeout(() => {
    // 페이지 탐색
  }, Math.random() * 3000 + 1000);
}
```

## 디버깅 및 문제 해결

### 1. User Agent 감지 확인

```js
// 서버 응답 확인
fetch('/api/user-agent-test')
  .then(response => response.json())
  .then(data => {
    console.log('Server detected:', data.userAgent);
    console.log('Client sent:', navigator.userAgent);
  });
```

### 2. 네트워크 탭에서 확인

```js
// Network 탭에서 Request Headers 확인
// User-Agent 헤더가 올바르게 설정되었는지 검증

// 프로그래밍적 확인
function checkUserAgentHeaders() {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', '/test-endpoint');
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      console.log('Response headers:', xhr.getAllResponseHeaders());
    }
  };
  xhr.send();
}
```

### 3. 일반적인 문제 해결

```js
// 문제 1: User Agent가 적용되지 않음
// 해결: 페이지 새로고침 또는 캐시 클리어

// 문제 2: 일부 사이트에서 감지됨
// 해결: 더 정확한 User Agent 문자열 사용

// 문제 3: JavaScript 기능 차이
// 해결: Feature Detection 사용
function supportsFeature() {
  return 'serviceWorker' in navigator;
}
```

## 자동화 도구와의 연동

### 1. Selenium과 함께 사용

```python
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

# Chrome 옵션 설정
chrome_options = Options()
chrome_options.add_argument("--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")

driver = webdriver.Chrome(options=chrome_options)
driver.get("https://example.com")

# User Agent 확인
user_agent = driver.execute_script("return navigator.userAgent;")
print(f"User Agent: {user_agent}")
```

### 2. Puppeteer와 함께 사용

```js
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // User Agent 설정
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15');
  
  await page.goto('https://example.com');
  
  // User Agent 확인
  const userAgent = await page.evaluate(() => navigator.userAgent);
  console.log('User Agent:', userAgent);
  
  await browser.close();
})();
```

### 3. Playwright와 함께 사용

```js
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
  });
  
  const page = await context.newPage();
  await page.goto('https://example.com');
  
  // User Agent 확인
  const userAgent = await page.evaluate(() => navigator.userAgent);
  console.log('User Agent:', userAgent);
  
  await browser.close();
})();
```

## 모범 사례

### 1. 테스트 시나리오 작성

```js
// 체계적인 테스트 접근법
const testScenarios = [
  {
    name: 'Desktop Chrome',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    expectedBehavior: 'Full desktop layout'
  },
  {
    name: 'Mobile Safari',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    expectedBehavior: 'Mobile responsive layout'
  },
  {
    name: 'Tablet iPad',
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    expectedBehavior: 'Tablet optimized layout'
  }
];

// 각 시나리오 테스트 실행
testScenarios.forEach(scenario => {
  console.log(`Testing: ${scenario.name}`);
  // User Agent 설정 및 테스트 실행
});
```

### 2. 문서화

```js
/**
 * User Agent Override 테스트 가이드
 * 
 * 1. 목적: 다양한 디바이스/브라우저 환경에서의 웹사이트 동작 확인
 * 2. 범위: 레이아웃, 기능, 성능 테스트
 * 3. 제한사항: 실제 하드웨어 특성은 시뮬레이션되지 않음
 * 4. 주의사항: 웹사이트 정책 및 윤리적 가이드라인 준수
 */

const TEST_CONFIG = {
  userAgents: {
    // 모바일 디바이스
    mobile: [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      'Mozilla/5.0 (Linux; Android 13; SM-S908B) AppleWebKit/537.36'
    ],
    // 데스크톱 브라우저
    desktop: [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    ]
  },
  testUrls: [
    'https://example.com',
    'https://example.com/mobile',
    'https://example.com/api/test'
  ]
};
```

### 3. 결과 분석

```js
// 테스트 결과 수집 및 분석
class UserAgentTestAnalyzer {
  constructor() {
    this.results = [];
  }
  
  addResult(userAgent, url, metrics) {
    this.results.push({
      userAgent,
      url,
      timestamp: new Date(),
      metrics
    });
  }
  
  generateReport() {
    const report = {
      totalTests: this.results.length,
      successRate: this.calculateSuccessRate(),
      performanceMetrics: this.aggregatePerformance(),
      issues: this.identifyIssues()
    };
    
    return report;
  }
  
  calculateSuccessRate() {
    const successful = this.results.filter(r => r.metrics.success);
    return (successful.length / this.results.length) * 100;
  }
}
```

## 참고 자료

### 공식 문서
- [Chrome DevTools Documentation](https://developer.chrome.com/docs/devtools/) - Chrome 개발자 도구 공식 가이드
- [User-Agent Client Hints](https://web.dev/user-agent-client-hints/) - 차세대 User Agent 정보 전달 방식
- [MDN - Navigator.userAgent](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/userAgent) - User Agent API 문서

### User Agent 데이터베이스
- [WhatIsMyBrowser.com](https://www.whatismybrowser.com/guides/the-latest-user-agent/) - 최신 User Agent 문자열 모음
- [UserAgentString.com](http://www.useragentstring.com/) - User Agent 문자열 데이터베이스
- [51Degrees Device Detection](https://51degrees.com/resources/user-agent-tester) - User Agent 분석 도구

### 테스트 도구
- [BrowserStack](https://www.browserstack.com/) - 실제 디바이스에서의 브라우저 테스트
- [Sauce Labs](https://saucelabs.com/) - 클라우드 기반 브라우저 테스트
- [LambdaTest](https://www.lambdatest.com/) - 크로스 브라우저 테스트 플랫폼

### 자동화 라이브러리
- [Puppeteer](https://pptr.dev/) - Chrome/Chromium 제어를 위한 Node.js 라이브러리
- [Playwright](https://playwright.dev/) - 크로스 브라우저 자동화 라이브러리
- [Selenium WebDriver](https://selenium-python.readthedocs.io/) - 웹 브라우저 자동화 프레임워크

### 모바일 테스트
- [Chrome Mobile Emulation](https://developer.chrome.com/docs/devtools/device-mode/) - Chrome의 모바일 에뮬레이션 기능
- [Responsive Design Mode](https://firefox-source-docs.mozilla.org/devtools-user/responsive_design_mode/) - Firefox의 반응형 디자인 모드
- [Safari Web Inspector](https://webkit.org/web-inspector/) - Safari 개발자 도구

### 보안 및 윤리
- [Robots.txt Specification](https://www.robotstxt.org/) - 웹 크롤링 정책 표준
- [Web Scraping Ethics](https://blog.apify.com/what-is-ethical-web-scraping-and-how-do-you-do-it/) - 웹 스크래핑 윤리 가이드

### 성능 모니터링
- [WebPageTest](https://www.webpagetest.org/) - 웹 성능 테스트 도구
- [Google PageSpeed Insights](https://pagespeed.web.dev/) - 페이지 속도 분석 도구
- [GTmetrix](https://gtmetrix.com/) - 웹사이트 성능 분석

### 블로그 및 아티클
- [User Agent Strings Explained](https://www.howtogeek.com/114937/htg-explains-whats-a-browser-user-agent/) - User Agent 문자열 설명
- [The History of the User-Agent String](https://webaim.org/blog/user-agent-string-history/) - User Agent의 역사
- [Modern User Agent Detection](https://developer.mozilla.org/en-US/docs/Web/HTTP/Browser_detection_using_the_user_agent) - 현대적인 User Agent 감지 방법
