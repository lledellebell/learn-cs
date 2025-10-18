---
layout: page
title: "웹 접근성 가이드 - 모두를 위한 웹사이트 만들기"
description: "WCAG 기준을 따라 접근성 높은 웹사이트를 만드는 실전 가이드"
category: guides
tags: [accessibility, a11y, wcag, aria, semantic-html]
date: 2019-09-27
last_modified_at: 2023-02-01
---

# 웹 접근성 가이드 - 모두를 위한 웹사이트 만들기

웹사이트를 만들고 나서 키보드로 탐색해본 적 있으신가요?

저는 처음 만든 포트폴리오 사이트를 친구에게 자랑하다가 충격을 받은 적이 있습니다. 친구가 "Tab 키를 눌러봐"라고 하더군요. 눌러보니... **어디에 포커스가 있는지 전혀 보이지 않았습니다.** 마우스 없이는 아무것도 할 수 없는 사이트였던 거죠.

그때 깨달았습니다. "멋지게 보이는 것"과 "모두가 사용할 수 있는 것"은 다르다는 걸요.

**웹 접근성(Web Accessibility)은 장애가 있는 사람을 포함한 모든 사람이 웹사이트를 이용할 수 있도록 만드는 것**입니다. 이는 단순히 법적 요구사항을 넘어, **더 많은 사용자에게 다가갈 수 있는 방법**입니다.

## 왜 접근성이 중요한가요?

### 1. 더 많은 사용자에게 도달

전 세계 인구의 **약 15%가 어떤 형태로든 장애**를 가지고 있습니다. 이는:

- 시각 장애 (맹인, 저시력, 색맹)
- 청각 장애 (청각 손실)
- 운동 장애 (키보드만 사용, 음성 제어 필요)
- 인지 장애 (난독증, ADHD, 자폐 스펙트럼)

하지만 접근성은 장애인만을 위한 것이 아닙니다:

- 노트북에서 마우스가 고장났을 때
- 밝은 햇빛 아래에서 화면을 볼 때
- 시끄러운 카페에서 비디오를 볼 때
- 한 손으로 휴대폰을 들고 있을 때

**우리 모두가 때때로 "일시적인 장애"를 경험**합니다.

### 2. 더 나은 SEO

검색 엔진도 웹사이트를 "읽는" 사용자입니다. 접근성이 좋은 사이트는:

- 시맨틱 HTML로 구조가 명확함
- 이미지에 대체 텍스트가 있음
- 콘텐츠 계층이 명확함

즉, **접근성 개선 = SEO 개선**입니다.

### 3. 법적 준수

많은 국가에서 웹 접근성이 법적 요구사항입니다:

- 한국: 장애인차별금지법
- 미국: ADA (Americans with Disabilities Act)
- EU: European Accessibility Act

## WCAG란 무엇인가요?

**WCAG (Web Content Accessibility Guidelines)**는 W3C에서 만든 웹 접근성 국제 표준입니다.

### WCAG의 4가지 원칙 (POUR)

```
1. Perceivable (인지 가능)
   → 사용자가 콘텐츠를 인지할 수 있어야 합니다

2. Operable (운용 가능)
   → 사용자가 인터페이스를 조작할 수 있어야 합니다

3. Understandable (이해 가능)
   → 콘텐츠와 조작법을 이해할 수 있어야 합니다

4. Robust (견고함)
   → 다양한 기술(보조 기술 포함)에서 작동해야 합니다
```

### 적합성 레벨

- **Level A**: 최소 요구사항
- **Level AA**: 권장 수준 (대부분의 법률 준수)
- **Level AAA**: 가장 높은 수준 (모든 사이트에 필요하진 않음)

**이 가이드는 Level AA를 목표**로 합니다.

## 실전 접근성 체크리스트

### 1. 키보드 접근성 ⌨️

**모든 기능이 키보드만으로 사용 가능해야 합니다.**

#### ✅ 해야 할 것

```html
<!-- 모든 interactive 요소는 포커스 가능 -->
<button type="button">클릭</button>
<a href="/page">링크</a>

<!-- 포커스 순서 논리적으로 -->
<nav>
  <a href="#main">본문으로 건너뛰기</a> <!-- 첫 번째 -->
</nav>
<main id="main">
  <!-- 메인 콘텐츠 -->
</main>
```

#### ❌ 하지 말아야 할 것

```html
<!-- ❌ div에 클릭 이벤트 (키보드 접근 불가) -->
<div onclick="handleClick()">클릭하세요</div>

<!-- ❌ 포커스 불가능한 요소 -->
<span onclick="doSomething()">버튼처럼 보임</span>
```

#### CSS: 포커스 표시

```css
/* ✅ 좋은 예: 명확한 포커스 표시 */
:focus-visible {
  outline: 3px solid #ff230a;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(255, 35, 10, 0.4);
}

/* ❌ 나쁜 예: 포커스 제거 */
:focus {
  outline: none; /* 절대 이렇게 하지 마세요! */
}
```

**왜 `outline: none`이 문제일까요?**

키보드 사용자는 포커스가 어디에 있는지 알 수 없어서 사이트를 탐색할 수 없습니다.

### 2. 시맨틱 HTML 🏗️

**올바른 HTML 태그를 사용하면 의미가 명확**해집니다.

#### ✅ 좋은 예

```html
<header>
  <nav aria-label="Main navigation">
    <ul>
      <li><a href="/">홈</a></li>
      <li><a href="/about">소개</a></li>
    </ul>
  </nav>
</header>

<main>
  <article>
    <h1>제목</h1>
    <p>내용...</p>
  </article>
</main>

<footer>
  <p>&copy; 2025 회사명</p>
</footer>
```

#### ❌ 나쁜 예

```html
<!-- ❌ 모든 게 div -->
<div class="header">
  <div class="nav">
    <div class="link">홈</div>
    <div class="link">소개</div>
  </div>
</div>

<div class="content">
  <div class="title">제목</div>
  <div class="text">내용...</div>
</div>
```

**왜 시맨틱 HTML이 중요할까요?**

스크린 리더는 HTML 태그로 페이지 구조를 파악합니다. `<nav>`를 만나면 "내비게이션 영역"이라고 읽어주고, `<main>`을 만나면 "메인 콘텐츠"라고 알려줍니다.

### 3. Heading 계층 🗂️

**제목 태그는 순서대로 사용**해야 합니다.

#### ✅ 좋은 예

```html
<h1>페이지 제목</h1>
  <h2>섹션 1</h2>
    <h3>섹션 1.1</h3>
    <h3>섹션 1.2</h3>
  <h2>섹션 2</h2>
    <h3>섹션 2.1</h3>
```

#### ❌ 나쁜 예

```html
<!-- ❌ 계층 건너뛰기 -->
<h1>페이지 제목</h1>
<h3>섹션 제목</h3>  <!-- h2를 건너뜀! -->
<h2>다음 섹션</h2>  <!-- 순서가 뒤바뀜! -->
```

**시각적으로만 크게 만들고 싶다면 CSS를 사용하세요:**

```css
/* h3를 h2처럼 보이게 */
h3.large {
  font-size: 2rem;
  font-weight: 600;
}
```

### 4. 이미지 대체 텍스트 🖼️

**모든 의미 있는 이미지에 `alt` 속성을 추가**하세요.

#### ✅ 좋은 예

```html
<!-- 의미 있는 이미지 -->
<img src="chart.png" alt="2025년 매출 증가 그래프: 1분기 30%, 2분기 45% 증가">

<!-- 장식용 이미지 -->
<img src="decoration.png" alt="" role="presentation">

<!-- 링크 안의 이미지 -->
<a href="/profile">
  <img src="avatar.png" alt="김철수 프로필">
</a>
```

#### ❌ 나쁜 예

```html
<!-- ❌ alt 없음 -->
<img src="chart.png">

<!-- ❌ 의미 없는 alt -->
<img src="chart.png" alt="이미지">
<img src="graph.png" alt="graph.png">

<!-- ❌ 너무 긴 alt -->
<img src="product.png" alt="이 제품은 매우 훌륭한 제품으로서 우리 회사의 최신 기술을 활용하여...">
```

**alt 텍스트 작성 팁:**

- **간결하게**: 125자 이내
- **맥락 고려**: 주변 텍스트와 중복 피하기
- **키워드 채우기 금지**: SEO를 위해 키워드만 나열하지 마세요

### 5. 색상 대비 🎨

**텍스트와 배경 간 충분한 대비**가 필요합니다.

#### WCAG 색상 대비 기준

- **일반 텍스트**: 최소 4.5:1
- **큰 텍스트 (18pt+ 또는 14pt+ bold)**: 최소 3:1
- **UI 요소**: 최소 3:1

#### ✅ 좋은 예

```css
/* 대비 비율: 7.1:1 (충분함) */
.text {
  color: #000000;
  background: #ffffff;
}

/* 대비 비율: 12.6:1 (매우 좋음) */
[data-theme="dark"] .text {
  color: #ffffff;
  background: #000000;
}
```

#### ❌ 나쁜 예

```css
/* ❌ 대비 비율: 1.9:1 (불충분) */
.text {
  color: #cccccc;
  background: #ffffff;
}

/* ❌ 대비 비율: 2.1:1 (불충분) */
.text {
  color: #ff6b6b;
  background: #ffffff;
}
```

**대비 확인 도구:**
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Chrome DevTools의 Contrast Ratio 표시
- [Colour Contrast Analyser](https://www.tpgi.com/color-contrast-checker/)

**색상만으로 정보 전달하지 마세요:**

```html
<!-- ❌ 색상만 사용 -->
<p style="color: red;">오류가 발생했습니다</p>

<!-- ✅ 아이콘과 텍스트 함께 -->
<p>
  <svg aria-hidden="true"><!-- 오류 아이콘 --></svg>
  <span class="error-text">오류가 발생했습니다</span>
</p>
```

### 6. ARIA 속성 🏷️

**ARIA (Accessible Rich Internet Applications)**는 HTML만으로 표현하기 어려운 의미를 추가합니다.

#### ARIA의 5가지 원칙

1. **No ARIA is better than Bad ARIA**: 잘못 사용하느니 안 쓰는게 나음
2. **Native HTML First**: HTML로 가능하면 ARIA 불필요
3. **Keyboard Accessible**: ARIA만으로 키보드 접근성 해결 안 됨
4. **No Override**: 네이티브 의미를 덮어쓰지 마세요
5. **Interactive Elements**: 모든 interactive 요소는 role과 name 필요

#### 자주 사용하는 ARIA 속성

```html
<!-- 버튼 상태 -->
<button aria-pressed="false">구독</button>
<button aria-pressed="true">구독 중</button>

<!-- 확장 가능한 영역 -->
<button aria-expanded="false" aria-controls="menu">
  메뉴
</button>
<div id="menu" hidden>
  <!-- 메뉴 내용 -->
</div>

<!-- 탭 UI -->
<div role="tablist">
  <button role="tab" aria-selected="true" aria-controls="panel1">
    탭 1
  </button>
  <button role="tab" aria-selected="false" aria-controls="panel2">
    탭 2
  </button>
</div>
<div role="tabpanel" id="panel1">내용 1</div>
<div role="tabpanel" id="panel2" hidden>내용 2</div>

<!-- 라이브 리전 (동적 콘텐츠) -->
<div aria-live="polite" aria-atomic="true">
  <p>3개의 새 메시지가 있습니다</p>
</div>

<!-- 로딩 상태 -->
<button aria-busy="true">
  저장 중...
</button>

<!-- 레이블 연결 -->
<button aria-label="닫기">
  <svg><!-- X 아이콘 --></svg>
</button>

<!-- 설명 추가 -->
<input
  type="email"
  aria-describedby="email-hint"
>
<span id="email-hint">
  example@email.com 형식으로 입력하세요
</span>
```

#### ❌ ARIA 남용 사례

```html
<!-- ❌ 네이티브 버튼을 div로 만들지 마세요 -->
<div role="button" tabindex="0" onclick="...">
  클릭
</div>

<!-- ✅ 그냥 button 사용 -->
<button type="button">클릭</button>

<!-- ❌ 불필요한 role -->
<nav role="navigation">  <!-- nav는 이미 navigation role -->
  <ul role="list">  <!-- ul은 이미 list role -->
    <li role="listitem">  <!-- li는 이미 listitem role -->
      항목
    </li>
  </ul>
</nav>

<!-- ✅ 간결하게 -->
<nav aria-label="Main navigation">
  <ul>
    <li>항목</li>
  </ul>
</nav>
```

### 7. 폼 접근성 📝

**폼은 가장 중요한 인터랙션 지점**입니다.

#### ✅ 좋은 예

```html
<!-- 명확한 레이블 -->
<label for="email">이메일</label>
<input
  type="email"
  id="email"
  name="email"
  required
  aria-required="true"
  aria-describedby="email-hint"
>
<span id="email-hint">
  example@email.com 형식으로 입력하세요
</span>

<!-- 오류 표시 -->
<label for="password">비밀번호</label>
<input
  type="password"
  id="password"
  aria-invalid="true"
  aria-describedby="password-error"
>
<span id="password-error" role="alert">
  비밀번호는 최소 8자 이상이어야 합니다
</span>

<!-- 그룹화 -->
<fieldset>
  <legend>배송 방법</legend>
  <label>
    <input type="radio" name="shipping" value="standard">
    일반 배송
  </label>
  <label>
    <input type="radio" name="shipping" value="express">
    빠른 배송
  </label>
</fieldset>
```

#### ❌ 나쁜 예

```html
<!-- ❌ 레이블 없음 -->
<input type="text" placeholder="이름 입력">

<!-- ❌ 레이블과 연결 안 됨 -->
<label>이메일</label>
<input type="email">

<!-- ❌ 오류 표시가 명확하지 않음 -->
<input type="password" style="border-color: red;">
```

### 8. 동적 콘텐츠 🔄

**JavaScript로 콘텐츠가 변경될 때 스크린 리더에 알려야** 합니다.

#### ARIA Live Regions

```html
<!-- 중요하지 않은 업데이트 -->
<div aria-live="polite">
  <p>10초 전에 업데이트됨</p>
</div>

<!-- 중요한 업데이트 (즉시 알림) -->
<div aria-live="assertive">
  <p>오류: 파일을 저장할 수 없습니다</p>
</div>

<!-- 상태 메시지 -->
<div role="status" aria-live="polite">
  <p>저장되었습니다</p>
</div>

<!-- 경고 메시지 -->
<div role="alert" aria-live="assertive">
  <p>연결이 끊어졌습니다</p>
</div>
```

#### JavaScript로 동적 콘텐츠 추가

```javascript
// ✅ 좋은 예: 스크린 리더에 알림
function showNotification(message) {
  const notification = document.createElement('div');
  notification.setAttribute('role', 'status');
  notification.setAttribute('aria-live', 'polite');
  notification.textContent = message;

  document.body.appendChild(notification);

  // 3초 후 제거
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// ❌ 나쁜 예: 스크린 리더가 모름
function showNotificationBad(message) {
  const notification = document.createElement('div');
  notification.textContent = message;
  document.body.appendChild(notification);
}
```

### 9. 모션과 애니메이션 🎬

**일부 사용자는 애니메이션에 어지러움**을 느낍니다.

#### prefers-reduced-motion

```css
/* 기본 애니메이션 */
.element {
  transition: transform 0.3s ease;
}

.element:hover {
  transform: scale(1.1);
}

/* 모션 줄이기 선호 시 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

#### JavaScript에서 확인

```javascript
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

if (!prefersReducedMotion) {
  // 애니메이션 적용
  element.classList.add('animated');
}
```

### 10. 터치 타겟 크기 📱

**터치 타겟은 충분히 커야** 합니다.

#### WCAG 권장 사항

- **최소 크기**: 44 x 44 픽셀
- **권장 크기**: 48 x 48 픽셀

```css
/* ✅ 모바일 터치 타겟 */
@media (max-width: 768px) {
  button,
  a,
  input[type="button"],
  input[type="submit"] {
    min-height: 44px;
    min-width: 44px;
    padding: var(--space-3) var(--space-4);
  }
}

/* ✅ 클릭 영역 확장 (실제 크기는 작게) */
.icon-button {
  position: relative;
  width: 24px;
  height: 24px;
}

.icon-button::before {
  content: '';
  position: absolute;
  top: -12px;
  left: -12px;
  right: -12px;
  bottom: -12px;
}
```

## 접근성 테스트 방법 🧪

### 1. 키보드 테스트

1. **Tab 키**로 모든 interactive 요소 탐색
2. **Enter/Space**로 버튼 클릭
3. **화살표 키**로 라디오 버튼, 드롭다운 탐색
4. **Esc**로 모달 닫기

**체크리스트:**
- [ ] 모든 interactive 요소에 도달 가능?
- [ ] 포커스가 명확하게 보이는가?
- [ ] 포커스 순서가 논리적인가?
- [ ] 포커스 트랩이 없는가?

### 2. 스크린 리더 테스트

**무료 스크린 리더:**
- **Windows**: NVDA (무료, 오픈소스)
- **Mac**: VoiceOver (내장)
- **iOS**: VoiceOver (내장)
- **Android**: TalkBack (내장)

**기본 명령어 (NVDA):**
- `Ctrl`: 읽기 중지
- `Insert + ↓`: 모두 읽기
- `H`: 다음 제목으로 이동
- `Tab`: 다음 링크/버튼으로 이동

### 3. 자동화 도구

```bash
# Lighthouse (Chrome DevTools)
npm install -g lighthouse
lighthouse https://yoursite.com --only-categories=accessibility

# axe DevTools (Chrome Extension 설치)
# https://www.deque.com/axe/devtools/

# Pa11y
npm install -g pa11y
pa11y https://yoursite.com
```

### 4. 브라우저 개발자 도구

**Chrome DevTools:**
1. Elements 탭 → Accessibility 패널
2. Lighthouse 탭 → Accessibility 감사
3. Rendering 탭 → Emulate vision deficiencies

**Firefox DevTools:**
1. Accessibility Inspector
2. 색맹 시뮬레이션

## 실전 체크리스트 ✅

### 페이지 레벨

- [ ] 모든 페이지에 고유한 `<title>`
- [ ] `<html lang="ko">` 설정
- [ ] "본문으로 건너뛰기" 링크
- [ ] Landmark 역할 (`<header>`, `<nav>`, `<main>`, `<footer>`)
- [ ] Heading 계층 (H1 → H2 → H3)

### 콘텐츠

- [ ] 모든 이미지에 `alt` 속성
- [ ] 비디오에 자막/대본
- [ ] 색상만으로 정보 전달하지 않음
- [ ] 텍스트 대비 최소 4.5:1
- [ ] 텍스트 크기 조절 가능 (200%까지)

### 인터랙션

- [ ] 모든 기능 키보드로 사용 가능
- [ ] 포커스 표시 명확
- [ ] 터치 타겟 최소 44x44px
- [ ] 타임아웃 경고 및 연장 옵션
- [ ] 오류 메시지 명확

### 폼

- [ ] 모든 입력 필드에 `<label>`
- [ ] 필수 필드 표시 (`required`, `aria-required`)
- [ ] 오류 메시지 (`aria-invalid`, `aria-describedby`)
- [ ] 도움말 텍스트 연결
- [ ] Submit 후 성공/실패 피드백

### 동적 콘텐츠

- [ ] ARIA live regions
- [ ] 로딩 상태 표시 (`aria-busy`)
- [ ] 모달 포커스 트랩
- [ ] 모달 닫기 가능 (Esc, X 버튼)

## 함정과 주의사항 ⚠️

### ❌ 함정 1: div/span 남용

```html
<!-- ❌ div를 버튼처럼 사용 -->
<div class="button" onclick="submit()">
  제출
</div>

<!-- ✅ 네이티브 button 사용 -->
<button type="button" onclick="submit()">
  제출
</button>
```

**왜 문제일까요?**
- 키보드로 포커스 불가
- 스크린 리더가 버튼으로 인식 못함
- Enter/Space로 작동 안 함

### ❌ 함정 2: placeholder를 label 대신 사용

```html
<!-- ❌ placeholder만 사용 -->
<input type="text" placeholder="이름">

<!-- ✅ label 사용 -->
<label for="name">이름</label>
<input type="text" id="name" placeholder="홍길동">
```

**왜 문제일까요?**
- Placeholder는 입력 시 사라짐
- 스크린 리더가 읽지 못하는 경우 있음
- 대비가 낮아 읽기 어려움

### ❌ 함정 3: 아이콘만 사용

```html
<!-- ❌ 아이콘만 -->
<button>
  <svg><!-- X 아이콘 --></svg>
</button>

<!-- ✅ aria-label 추가 -->
<button aria-label="닫기">
  <svg aria-hidden="true"><!-- X 아이콘 --></svg>
</button>
```

### ❌ 함정 4: 자동 재생 미디어

```html
<!-- ❌ 자동 재생 -->
<video autoplay>
  <source src="video.mp4">
</video>

<!-- ✅ 사용자 제어 -->
<video controls>
  <source src="video.mp4">
  <track kind="captions" src="captions.vtt" srclang="ko" label="한국어">
</video>
```

## 마치며

접근성은 "한 번에 완벽하게"가 아니라 **지속적인 개선 과정**입니다.

저도 처음에는 "접근성은 복잡하고 어렵다"고 생각했습니다. 하지만 하나씩 적용하다 보니, **대부분은 간단한 습관**이더군요:

- `<button>` 대신 `<div>` 쓰지 않기
- 이미지에 `alt` 추가하기
- 색상 대비 확인하기
- 키보드로 테스트하기

작은 것부터 시작하세요. **오늘 하나만 고쳐도** 누군가에겐 큰 차이가 됩니다.

---

## 참고 자료

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Web Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM Resources](https://webaim.org/resources/)
- [The A11Y Project](https://www.a11yproject.com/)
- [Inclusive Components](https://inclusive-components.design/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)

## 도구 및 확장 프로그램

### 브라우저 확장
- [axe DevTools](https://www.deque.com/axe/devtools/) - 자동 접근성 테스트
- [WAVE](https://wave.webaim.org/extension/) - 시각적 접근성 평가
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Chrome 내장

### 디자인 도구
- [Stark](https://www.getstark.co/) - Figma/Sketch 접근성 플러그인
- [Contrast](https://usecontrast.com/) - 색상 대비 체커

### 테스트 도구
- [NVDA](https://www.nvaccess.org/) - 무료 스크린 리더
- [Pa11y](https://pa11y.org/) - 자동화 테스트
- [aXe CLI](https://github.com/dequelabs/axe-core-npm) - 커맨드라인 테스트

## 다음에 읽을 글

- [ARIA 패턴 가이드](./aria-patterns-guide.md)
- [스크린 리더 테스트 가이드](./screen-reader-testing.md)
- [색상 접근성 가이드](./color-accessibility.md)
