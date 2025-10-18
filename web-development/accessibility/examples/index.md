---
title: 접근성 실전 예제
description: 복사해서 바로 쓰는 접근 가능한 컴포넌트 예제. 모달, 탭, 폼, 자동완성, 테이블 등 실전에서 검증된 완전한 코드와 흔한 실수 모음.
date: 2022-07-13
last_modified_at: 2022-07-13
categories: [Web Development, Accessibility, Examples]
tags: [Accessibility Examples, Code Examples, Best Practices]
render_with_liquid: false
layout: page
---

# 접근성 실전 예제

## "이론은 알겠는데, 실제로 어떻게 만들죠?"

ARIA 가이드를 다 읽었습니다. WCAG 체크리스트도 확인했습니다.
그런데 막상 코드를 작성하려니... **어디서부터 시작해야 할지 막막**했습니다.

저는 처음 "접근 가능한 모달"을 만들려고 했을 때, 검색해서 나온 코드를
복사했다가 큰 낭패를 봤습니다. 겉보기엔 괜찮았는데,
실제로 키보드로 탐색해보니 **포커스가 모달 밖으로 빠져나가는** 문제가 있었죠.

이 문서는 그때의 저처럼, **"이론은 알겠는데 실제 코드는?"**라고
고민하시는 분들을 위한 것입니다. 복사해서 바로 사용할 수 있는,
**실전에서 검증된 예제**들을 모았습니다.

---

## 이 문서를 읽는 방법

각 예제는 다음 구조로 되어 있습니다:

```
📖 왜 이게 중요한가?
  → 실제 겪은 문제 상황

✅ 완성된 코드
  → 복사해서 바로 사용 가능

🔍 핵심 포인트 설명
  → 코드의 주요 접근성 기능

⚠️ 흔한 실수
  → 놓치기 쉬운 부분
```

---

## 1. 폼 컴포넌트

### 1.1 접근 가능한 입력 필드 + 실시간 에러 메시지

#### 📖 왜 이게 중요한가?

회원가입 폼을 만들었는데, QA팀에서 피드백이 왔습니다:
"스크린 리더로 에러 메시지가 안 들려요."

확인해보니 에러 메시지가 시각적으로만 표시되고,
스크린 리더 사용자는 **에러가 발생했는지조차 모르는** 상황이었습니다.

#### ✅ 완성된 코드

```html
<div class="form-group">
  <label for="email">
    이메일
    <span class="required" aria-label="필수 입력">*</span>
  </label>

  <input
    type="email"
    id="email"
    name="email"
    required
    aria-required="true"
    aria-invalid="false"
    aria-describedby="email-description email-error"
  >

  <div id="email-description" class="description">
    회사 이메일을 입력해주세요
  </div>

  <div id="email-error" class="error" role="alert" aria-live="assertive">
    <!-- JavaScript로 에러 메시지 삽입 -->
  </div>
</div>

<style>
.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.required {
  color: #d32f2f;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #cbd5e0;
  border-radius: 4px;
  font-size: 1rem;
}

input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

input[aria-invalid="true"] {
  border-color: #d32f2f;
}

input[aria-invalid="true"]:focus {
  box-shadow: 0 0 0 3px rgba(211, 47, 47, 0.1);
}

.description {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #64748b;
}

.error {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #d32f2f;
  min-height: 1.25rem; /* 레이아웃 시프트 방지 */
}
</style>

<script>
const emailInput = document.getElementById('email');
const emailError = document.getElementById('email-error');

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

emailInput.addEventListener('blur', function() {
  const email = this.value.trim();

  if (!email) {
    showError('이메일을 입력해주세요');
  } else if (!validateEmail(email)) {
    showError('올바른 이메일 형식이 아닙니다 (예: user@company.com)');
  } else {
    clearError();
  }
});

// 입력 중에는 에러 메시지 제거
emailInput.addEventListener('input', function() {
  if (emailError.textContent) {
    clearError();
  }
});

function showError(message) {
  emailInput.setAttribute('aria-invalid', 'true');
  emailError.textContent = message;
  // role="alert"와 aria-live="assertive"로 즉시 읽힘
}

function clearError() {
  emailInput.setAttribute('aria-invalid', 'false');
  emailError.textContent = '';
}
</script>
```

#### 🔍 핵심 포인트

1. **`aria-describedby`**: 설명과 에러 메시지를 입력 필드에 연결
   ```
   스크린 리더: "이메일, 편집 가능, 필수, 회사 이메일을 입력해주세요"
   ```

2. **`role="alert"` + `aria-live="assertive"`**: 에러 발생 시 즉시 알림
   ```
   [사용자가 잘못된 이메일 입력 후 blur]
   스크린 리더: "올바른 이메일 형식이 아닙니다"
   ```

3. **`aria-invalid`**: 상태 변화 명시 + CSS 스타일링

4. **`min-height`**: 에러 메시지 영역 예약으로 레이아웃 시프트 방지

#### ⚠️ 흔한 실수

```javascript
// ❌ 잘못된 예: 에러 메시지가 스크린 리더에 안 들림
function showError(message) {
  emailError.textContent = message; // role="alert" 없음
}

// ❌ 잘못된 예: 입력 중에도 계속 에러 표시
emailInput.addEventListener('input', function() {
  validate(); // 너무 공격적
});

// ❌ 잘못된 예: 레이아웃 시프트 발생
.error {
  /* min-height 없음 */
  /* 에러 메시지가 나타날 때 아래 요소들이 밀림 */
}
```

---

### 1.2 다단계 폼 (진행 상황 표시)

#### 📖 왜 이게 중요한가?

3단계 회원가입 폼을 만들었는데, 스크린 리더 사용자는
**"지금 몇 단계인지, 얼마나 남았는지"** 전혀 알 수 없었습니다.

시각적으로는 "1/3, 2/3, 3/3"이 표시되지만,
스크린 리더는 이를 읽지 못했던 거죠.

#### ✅ 완성된 코드

```html
<div class="multi-step-form">
  <!-- 진행 상황 표시 -->
  <nav aria-label="회원가입 진행 단계">
    <ol class="progress-steps">
      <li class="step active" aria-current="step">
        <span class="step-number">1</span>
        <span class="step-label">계정 정보</span>
      </li>
      <li class="step">
        <span class="step-number">2</span>
        <span class="step-label">개인 정보</span>
      </li>
      <li class="step">
        <span class="step-number">3</span>
        <span class="step-label">완료</span>
      </li>
    </ol>
  </nav>

  <!-- 스크린 리더용 라이브 리전 -->
  <div role="status" aria-live="polite" class="sr-only">
    <span id="progress-announcement"></span>
  </div>

  <!-- 1단계: 계정 정보 -->
  <form id="step1" class="step-content active" aria-labelledby="step1-heading">
    <h2 id="step1-heading">계정 정보</h2>
    <!-- 폼 필드들... -->
    <button type="button" onclick="goToStep(2)">다음</button>
  </form>

  <!-- 2단계: 개인 정보 -->
  <form id="step2" class="step-content" aria-labelledby="step2-heading" hidden>
    <h2 id="step2-heading">개인 정보</h2>
    <!-- 폼 필드들... -->
    <button type="button" onclick="goToStep(1)">이전</button>
    <button type="button" onclick="goToStep(3)">다음</button>
  </form>

  <!-- 3단계: 완료 -->
  <div id="step3" class="step-content" aria-labelledby="step3-heading" hidden>
    <h2 id="step3-heading">회원가입 완료</h2>
    <p>환영합니다!</p>
    <button type="button" onclick="goToStep(2)">이전</button>
    <button type="submit">가입 완료</button>
  </div>
</div>

<style>
.progress-steps {
  display: flex;
  justify-content: space-between;
  list-style: none;
  padding: 0;
  margin: 2rem 0;
  counter-reset: step;
}

.step {
  flex: 1;
  text-align: center;
  position: relative;
  color: #94a3b8;
}

.step::before {
  content: '';
  position: absolute;
  top: 20px;
  left: -50%;
  right: 50%;
  height: 2px;
  background: #e2e8f0;
  z-index: -1;
}

.step:first-child::before {
  display: none;
}

.step.active,
.step.completed {
  color: #3b82f6;
}

.step.completed::before {
  background: #3b82f6;
}

.step-number {
  display: inline-block;
  width: 40px;
  height: 40px;
  line-height: 40px;
  border-radius: 50%;
  background: #e2e8f0;
  margin-bottom: 0.5rem;
}

.step.active .step-number {
  background: #3b82f6;
  color: white;
  font-weight: 600;
}

.step.completed .step-number::before {
  content: '✓';
}

.step-label {
  display: block;
  font-size: 0.875rem;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.step-content {
  margin-top: 2rem;
}

.step-content[hidden] {
  display: none;
}
</style>

<script>
let currentStep = 1;
const totalSteps = 3;

function goToStep(stepNumber) {
  // 현재 단계 숨기기
  const currentContent = document.getElementById(`step${currentStep}`);
  currentContent.hidden = true;
  currentContent.classList.remove('active');

  // 이전 단계를 completed로 표시
  const steps = document.querySelectorAll('.step');
  steps.forEach((step, index) => {
    if (index + 1 < stepNumber) {
      step.classList.add('completed');
      step.classList.remove('active');
      step.removeAttribute('aria-current');
    } else if (index + 1 === stepNumber) {
      step.classList.add('active');
      step.classList.remove('completed');
      step.setAttribute('aria-current', 'step');
    } else {
      step.classList.remove('active', 'completed');
      step.removeAttribute('aria-current');
    }
  });

  // 새 단계 보여주기
  const newContent = document.getElementById(`step${stepNumber}`);
  newContent.hidden = false;
  newContent.classList.add('active');

  // 스크린 리더 알림
  const announcement = document.getElementById('progress-announcement');
  announcement.textContent = `${stepNumber}단계: ${newContent.querySelector('h2').textContent}. ${totalSteps}단계 중 ${stepNumber}번째 단계입니다.`;

  // 새 단계의 첫 번째 제목으로 포커스 이동
  newContent.querySelector('h2').focus();

  currentStep = stepNumber;
}
</script>
```

#### 🔍 핵심 포인트

1. **`aria-current="step"`**: 현재 진행 중인 단계 명시
   ```
   스크린 리더: "1단계, 계정 정보, 현재 단계"
   ```

2. **`role="status"` + `aria-live="polite"`**: 단계 변경 시 알림
   ```
   [다음 버튼 클릭]
   스크린 리더: "2단계: 개인 정보. 3단계 중 2번째 단계입니다."
   ```

3. **포커스 관리**: 단계 변경 시 새 단계의 제목으로 포커스 이동

4. **`hidden` 속성**: 안 보이는 단계는 DOM에서 완전히 숨김

#### ⚠️ 흔한 실수

```javascript
// ❌ 잘못된 예: 진행 상황 알림 없음
function goToStep(stepNumber) {
  showStep(stepNumber); // 알림 없이 조용히 변경
}

// ❌ 잘못된 예: 포커스 관리 안 함
// 사용자가 "다음" 버튼을 눌렀는데 포커스가 어디로 갔는지 모름

// ❌ 잘못된 예: display:none으로 숨김
.step-content {
  display: none; /* hidden 속성이 더 시맨틱함 */
}
```

---

## 2. 네비게이션

### 2.1 스킵 링크 (Skip Navigation)

#### 📖 왜 이게 중요한가?

키보드로 사이트를 탐색하다가 깨달았습니다. 매번 페이지를 열 때마다
**30번의 Tab**을 눌러야 메인 콘텐츠에 도달할 수 있었습니다.

로고, 검색, 메뉴 항목들을 하나하나 지나가야 했죠.
스크린 리더 사용자는 매일 이런 경험을 한다고 생각하니... 😓

#### ✅ 완성된 코드

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <style>
    /* 스킵 링크: 기본적으로 숨김, 포커스 시 표시 */
    .skip-link {
      position: absolute;
      top: -40px;
      left: 0;
      background: #3b82f6;
      color: white;
      padding: 0.75rem 1.5rem;
      text-decoration: none;
      font-weight: 600;
      border-radius: 0 0 4px 0;
      z-index: 100;
      transition: top 0.2s;
    }

    .skip-link:focus {
      top: 0;
    }

    /* 메인 콘텐츠 영역 */
    main:focus {
      outline: none; /* 시각적 아웃라인 제거 (포커스는 유지) */
    }
  </style>
</head>
<body>
  <!-- 스킵 링크: 페이지 최상단 -->
  <a href="#main-content" class="skip-link">
    본문으로 바로가기
  </a>

  <header>
    <nav aria-label="주 네비게이션">
      <a href="/">홈</a>
      <a href="/about">소개</a>
      <a href="/services">서비스</a>
      <a href="/blog">블로그</a>
      <a href="/contact">연락처</a>
    </nav>
  </header>

  <!-- tabindex="-1": JavaScript 없이 포커스 가능 -->
  <main id="main-content" tabindex="-1">
    <h1>페이지 제목</h1>
    <p>메인 콘텐츠가 여기서 시작됩니다.</p>
  </main>

  <script>
    // 스킵 링크 클릭 시 포커스 이동
    document.querySelector('.skip-link').addEventListener('click', function(e) {
      e.preventDefault();
      const mainContent = document.getElementById('main-content');
      mainContent.focus();

      // URL 업데이트
      window.location.hash = '#main-content';
    });
  </script>
</body>
</html>
```

#### 🔍 핵심 포인트

1. **화면 밖 배치 + 포커스 시 표시**:
   ```css
   top: -40px;  /* 화면 밖 */
   .skip-link:focus { top: 0; }  /* Tab 누르면 나타남 */
   ```

2. **`tabindex="-1"`**: 일반적으로 포커스 불가능한 요소에 프로그래밍 방식으로 포커스 가능하게 함

3. **페이지 최상단 배치**: 첫 Tab에서 바로 접근 가능

#### ⚠️ 흔한 실수

```css
/* ❌ 잘못된 예: 완전히 숨김 */
.skip-link {
  display: none; /* 키보드 사용자도 못 봄 */
}

/* ❌ 잘못된 예: 색상 대비 부족 */
.skip-link {
  background: #eee;
  color: white; /* 대비율 1.5:1 (최소 4.5:1 필요) */
}
```

```html
<!-- ❌ 잘못된 예: tabindex="-1" 없음 -->
<main id="main-content">
  <!-- Safari에서 포커스가 안 될 수 있음 -->
</main>
```

---

### 2.2 반응형 모바일 메뉴 (햄버거 메뉴)

#### 📖 왜 이게 중요한가?

모바일 메뉴를 만들었는데, 시각적으로는 완벽했습니다.
그런데 스크린 리더로 테스트하니 **"버튼"**이라는 말만 들렸습니다.

"이 버튼이 뭘 하는 버튼인지" 전혀 알 수 없었던 거죠.

#### ✅ 완성된 코드

```html
<header>
  <div class="header-container">
    <a href="/" class="logo">My Site</a>

    <!-- 햄버거 버튼 -->
    <button
      class="menu-toggle"
      aria-label="메인 메뉴"
      aria-expanded="false"
      aria-controls="mobile-menu"
    >
      <span class="hamburger-icon" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </span>
      <span class="sr-only">메뉴 열기</span>
    </button>

    <!-- 모바일 메뉴 -->
    <nav id="mobile-menu" class="mobile-nav" hidden>
      <ul>
        <li><a href="/">홈</a></li>
        <li><a href="/about">소개</a></li>
        <li><a href="/services">서비스</a></li>
        <li><a href="/blog">블로그</a></li>
        <li><a href="/contact">연락처</a></li>
      </ul>
    </nav>
  </div>
</header>

<style>
.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
}

.menu-toggle {
  display: none; /* 기본적으로 숨김 (데스크톱) */
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
}

.menu-toggle:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.hamburger-icon {
  display: block;
  width: 24px;
  height: 18px;
  position: relative;
}

.hamburger-icon span {
  display: block;
  position: absolute;
  height: 2px;
  width: 100%;
  background: #1e293b;
  border-radius: 2px;
  transition: 0.3s;
}

.hamburger-icon span:nth-child(1) { top: 0; }
.hamburger-icon span:nth-child(2) { top: 8px; }
.hamburger-icon span:nth-child(3) { top: 16px; }

/* 메뉴 열림 상태 */
.menu-toggle[aria-expanded="true"] .hamburger-icon span:nth-child(1) {
  transform: rotate(45deg);
  top: 8px;
}

.menu-toggle[aria-expanded="true"] .hamburger-icon span:nth-child(2) {
  opacity: 0;
}

.menu-toggle[aria-expanded="true"] .hamburger-icon span:nth-child(3) {
  transform: rotate(-45deg);
  top: 8px;
}

.mobile-nav {
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  max-height: calc(100vh - 60px);
  overflow-y: auto;
}

.mobile-nav[hidden] {
  display: none;
}

.mobile-nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.mobile-nav li {
  border-bottom: 1px solid #e2e8f0;
}

.mobile-nav a {
  display: block;
  padding: 1rem;
  color: #1e293b;
  text-decoration: none;
}

.mobile-nav a:hover,
.mobile-nav a:focus {
  background: #f1f5f9;
}

@media (max-width: 768px) {
  .menu-toggle {
    display: block;
  }
}
</style>

<script>
const menuToggle = document.querySelector('.menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');
const srText = menuToggle.querySelector('.sr-only');

menuToggle.addEventListener('click', function() {
  const isExpanded = this.getAttribute('aria-expanded') === 'true';

  // 토글
  this.setAttribute('aria-expanded', !isExpanded);
  mobileMenu.hidden = isExpanded;

  // 스크린 리더용 텍스트 업데이트
  srText.textContent = isExpanded ? '메뉴 열기' : '메뉴 닫기';

  // 메뉴가 열리면 첫 번째 링크로 포커스
  if (!isExpanded) {
    const firstLink = mobileMenu.querySelector('a');
    firstLink.focus();
  }
});

// Esc 키로 메뉴 닫기
mobileMenu.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    menuToggle.setAttribute('aria-expanded', 'false');
    mobileMenu.hidden = true;
    srText.textContent = '메뉴 열기';
    menuToggle.focus(); // 버튼으로 포커스 복귀
  }
});

// 메뉴 외부 클릭 시 닫기
document.addEventListener('click', function(e) {
  if (!e.target.closest('.header-container')) {
    menuToggle.setAttribute('aria-expanded', 'false');
    mobileMenu.hidden = true;
    srText.textContent = '메뉴 열기';
  }
});
</script>
```

#### 🔍 핵심 포인트

1. **`aria-label="메인 메뉴"`**: 버튼의 목적 설명
   ```
   스크린 리더: "메인 메뉴, 버튼, 메뉴 열기"
   ```

2. **`aria-expanded`**: 메뉴 열림/닫힘 상태
   ```
   [메뉴 닫힘]: aria-expanded="false"
   [메뉴 열림]: aria-expanded="true"
   ```

3. **`aria-controls`**: 어떤 요소를 제어하는지 명시

4. **포커스 관리**:
   - 메뉴 열림 → 첫 링크로 포커스
   - Esc 키 → 버튼으로 포커스 복귀

5. **`aria-hidden="true"`**: 장식용 햄버거 아이콘 숨김

#### ⚠️ 흔한 실수

```html
<!-- ❌ 잘못된 예: 버튼 대신 div 사용 -->
<div class="menu-toggle" onclick="toggleMenu()">
  <!-- 키보드 접근 불가, 스크린 리더가 버튼으로 인식 못 함 -->
</div>

<!-- ❌ 잘못된 예: aria-label 없음 -->
<button class="menu-toggle">
  <span>☰</span> <!-- "검은색 가로줄 3개" 라고 읽힘 -->
</button>

<!-- ❌ 잘못된 예: aria-expanded 업데이트 안 함 -->
<button aria-expanded="false">
  <!-- 메뉴가 열려도 false로 유지 -->
</button>
```

---

## 3. 모달 & 오버레이

### 3.1 접근 가능한 모달 다이얼로그

#### 📖 왜 이게 중요한가?

제가 만든 첫 모달의 문제점:
1. 모달이 열려도 **뒤쪽 콘텐츠로 Tab이 이동**됨
2. **Esc 키로 안 닫힘**
3. 모달 닫힌 후 **포커스가 사라짐**

키보드 사용자는 모달에 갇히거나, 모달을 닫은 후 어디로 가야 할지 모르는 상황이었습니다.

#### ✅ 완성된 코드

```html
<!-- 모달 트리거 버튼 -->
<button id="open-modal-btn">회원가입</button>

<!-- 모달 (기본적으로 숨김) -->
<div id="modal" class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" hidden>
  <div class="modal-overlay"></div>
  <div class="modal-content">
    <div class="modal-header">
      <h2 id="modal-title">회원가입</h2>
      <button class="modal-close" aria-label="모달 닫기">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
    <div class="modal-body">
      <form>
        <label for="username">사용자명</label>
        <input type="text" id="username" name="username">

        <label for="email">이메일</label>
        <input type="email" id="email" name="email">

        <button type="submit">가입하기</button>
        <button type="button" class="cancel-btn">취소</button>
      </form>
    </div>
  </div>
</div>

<style>
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal[hidden] {
  display: none;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.modal-content {
  position: relative;
  background: white;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-title {
  margin: 0;
  font-size: 1.5rem;
}

.modal-close {
  background: none;
  border: none;
  font-size: 2rem;
  line-height: 1;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  color: #64748b;
}

.modal-close:hover,
.modal-close:focus {
  color: #1e293b;
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.modal-body {
  padding: 1.5rem;
}
</style>

<script>
const openModalBtn = document.getElementById('open-modal-btn');
const modal = document.getElementById('modal');
const modalClose = modal.querySelector('.modal-close');
const cancelBtn = modal.querySelector('.cancel-btn');

let previouslyFocusedElement; // 모달 열기 전 포커스된 요소 저장

// 모달 열기
function openModal() {
  // 현재 포커스된 요소 저장
  previouslyFocusedElement = document.activeElement;

  modal.hidden = false;

  // 첫 번째 포커스 가능한 요소로 포커스
  const focusableElements = getFocusableElements();
  if (focusableElements.length > 0) {
    focusableElements[0].focus();
  }

  // 포커스 트랩 설정
  modal.addEventListener('keydown', handleKeyDown);

  // 배경 스크롤 방지
  document.body.style.overflow = 'hidden';
}

// 모달 닫기
function closeModal() {
  modal.hidden = true;

  // 포커스 트랩 제거
  modal.removeEventListener('keydown', handleKeyDown);

  // 배경 스크롤 복원
  document.body.style.overflow = '';

  // 이전에 포커스된 요소로 복귀
  if (previouslyFocusedElement) {
    previouslyFocusedElement.focus();
  }
}

// 포커스 가능한 요소들 가져오기
function getFocusableElements() {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ];

  return modal.querySelectorAll(focusableSelectors.join(','));
}

// 키보드 이벤트 처리
function handleKeyDown(e) {
  // Esc 키로 닫기
  if (e.key === 'Escape') {
    closeModal();
    return;
  }

  // Tab 키 - 포커스 트랩
  if (e.key === 'Tab') {
    const focusableElements = getFocusableElements();
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) { // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else { // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }
}

// 이벤트 리스너
openModalBtn.addEventListener('click', openModal);
modalClose.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);

// 오버레이 클릭 시 닫기
modal.querySelector('.modal-overlay').addEventListener('click', closeModal);
</script>
```

#### 🔍 핵심 포인트

1. **`role="dialog"` + `aria-modal="true"`**: 모달임을 명시
   ```
   스크린 리더: "다이얼로그, 회원가입"
   aria-modal="true" → 뒤쪽 콘텐츠 무시
   ```

2. **`aria-labelledby`**: 모달 제목 연결

3. **포커스 트랩**: Tab 키로 모달 내부에서만 순환
   ```
   [마지막 요소에서 Tab] → 첫 번째 요소로
   [첫 번째 요소에서 Shift+Tab] → 마지막 요소로
   ```

4. **포커스 복원**: 모달 닫힌 후 원래 위치로 포커스 복귀

5. **Esc 키로 닫기**: 키보드 사용자를 위한 필수 기능

#### ⚠️ 흔한 실수

```javascript
// ❌ 잘못된 예: 포커스 트랩 없음
// 모달이 열려도 Tab으로 뒤쪽 콘텐츠로 이동 가능

// ❌ 잘못된 예: 포커스 복원 안 함
function closeModal() {
  modal.hidden = true;
  // previouslyFocusedElement.focus() 없음
  // 사용자가 어디로 가야 할지 모름
}

// ❌ 잘못된 예: Esc 키 미지원
// 키보드 사용자가 모달을 닫을 방법이 없음

// ❌ 잘못된 예: aria-modal 없음
<div role="dialog"> <!-- aria-modal="true" 없음 -->
  <!-- 스크린 리더가 뒤쪽 콘텐츠도 읽음 -->
</div>
```

---

## 4. 동적 콘텐츠

### 4.1 자동 완성 (Autocomplete / Combobox)

#### 📖 왜 이게 중요한가?

검색 자동완성을 만들었는데, 스크린 리더 사용자는
**"자동완성 목록이 나타났는지, 몇 개 결과가 있는지"** 전혀 알 수 없었습니다.

화살표 키로 선택할 수 있다는 것도 모르고, 그냥 타이핑만 계속하더군요.

#### ✅ 완성된 코드

```html
<div class="autocomplete-wrapper">
  <label for="city-search">도시 검색</label>

  <div class="combobox-container">
    <input
      type="text"
      id="city-search"
      role="combobox"
      aria-autocomplete="list"
      aria-expanded="false"
      aria-controls="city-listbox"
      aria-activedescendant=""
      placeholder="도시 이름을 입력하세요"
    >

    <!-- 스크린 리더 알림 -->
    <div role="status" aria-live="polite" class="sr-only">
      <span id="search-results-status"></span>
    </div>

    <!-- 자동완성 목록 -->
    <ul id="city-listbox" role="listbox" hidden>
      <!-- JavaScript로 동적 생성 -->
    </ul>
  </div>
</div>

<style>
.autocomplete-wrapper {
  position: relative;
  max-width: 400px;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.combobox-container {
  position: relative;
}

input[role="combobox"] {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #cbd5e0;
  border-radius: 4px;
  font-size: 1rem;
}

input[role="combobox"]:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

#city-listbox {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 0.25rem;
  padding: 0;
  list-style: none;
  background: white;
  border: 1px solid #cbd5e0;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

#city-listbox[hidden] {
  display: none;
}

#city-listbox li {
  padding: 0.75rem;
  cursor: pointer;
}

#city-listbox li:hover {
  background: #f1f5f9;
}

#city-listbox li[aria-selected="true"] {
  background: #3b82f6;
  color: white;
}
</style>

<script>
const input = document.getElementById('city-search');
const listbox = document.getElementById('city-listbox');
const statusAnnouncement = document.getElementById('search-results-status');

// 도시 데이터 (실제로는 API에서 가져옴)
const cities = [
  '서울', '부산', '인천', '대구', '대전', '광주', '울산',
  '세종', '수원', '성남', '고양', '용인', '청주', '전주',
  '천안', '안산', '안양', '포항', '창원', '마산', '진주'
];

let selectedIndex = -1;
let filteredCities = [];

// 입력 이벤트
input.addEventListener('input', function() {
  const query = this.value.trim().toLowerCase();

  if (query.length === 0) {
    closeListbox();
    return;
  }

  // 필터링
  filteredCities = cities.filter(city =>
    city.toLowerCase().includes(query)
  );

  if (filteredCities.length > 0) {
    updateListbox();
    openListbox();
    announceResults();
  } else {
    closeListbox();
    announceNoResults();
  }
});

// 키보드 네비게이션
input.addEventListener('keydown', function(e) {
  const isOpen = input.getAttribute('aria-expanded') === 'true';

  if (!isOpen) return;

  switch(e.key) {
    case 'ArrowDown':
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, filteredCities.length - 1);
      updateActiveDescendant();
      break;

    case 'ArrowUp':
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, -1);
      updateActiveDescendant();
      break;

    case 'Enter':
      e.preventDefault();
      if (selectedIndex >= 0) {
        selectCity(filteredCities[selectedIndex]);
      }
      break;

    case 'Escape':
      e.preventDefault();
      closeListbox();
      break;
  }
});

// 목록 업데이트
function updateListbox() {
  listbox.innerHTML = '';

  filteredCities.forEach((city, index) => {
    const li = document.createElement('li');
    li.textContent = city;
    li.role = 'option';
    li.id = `city-option-${index}`;
    li.setAttribute('aria-selected', 'false');

    li.addEventListener('click', function() {
      selectCity(city);
    });

    listbox.appendChild(li);
  });

  selectedIndex = -1;
}

// 목록 열기
function openListbox() {
  listbox.hidden = false;
  input.setAttribute('aria-expanded', 'true');
}

// 목록 닫기
function closeListbox() {
  listbox.hidden = true;
  input.setAttribute('aria-expanded', 'false');
  input.setAttribute('aria-activedescendant', '');
  selectedIndex = -1;
}

// 활성 항목 업데이트
function updateActiveDescendant() {
  const options = listbox.querySelectorAll('[role="option"]');

  options.forEach((option, index) => {
    if (index === selectedIndex) {
      option.setAttribute('aria-selected', 'true');
      input.setAttribute('aria-activedescendant', option.id);

      // 스크롤 조정
      option.scrollIntoView({ block: 'nearest' });
    } else {
      option.setAttribute('aria-selected', 'false');
    }
  });

  // 선택 항목 알림
  if (selectedIndex >= 0) {
    const announcement = `${filteredCities[selectedIndex]}, ${selectedIndex + 1} / ${filteredCities.length}`;
    statusAnnouncement.textContent = announcement;
  }
}

// 도시 선택
function selectCity(city) {
  input.value = city;
  closeListbox();
  statusAnnouncement.textContent = `${city} 선택됨`;
}

// 결과 알림
function announceResults() {
  const count = filteredCities.length;
  statusAnnouncement.textContent = `${count}개의 도시가 검색되었습니다. 화살표 키로 이동하세요.`;
}

function announceNoResults() {
  statusAnnouncement.textContent = '검색 결과가 없습니다.';
}

// 외부 클릭 시 닫기
document.addEventListener('click', function(e) {
  if (!e.target.closest('.autocomplete-wrapper')) {
    closeListbox();
  }
});
</script>
```

#### 🔍 핵심 포인트

1. **`role="combobox"`**: 입력 필드와 목록의 조합
   ```
   스크린 리더: "도시 검색, 콤보박스, 편집 가능"
   ```

2. **`aria-autocomplete="list"`**: 자동완성 타입 명시

3. **`aria-expanded`**: 목록 열림/닫힘 상태
   ```
   [타이핑 전]: aria-expanded="false"
   [결과 표시]: aria-expanded="true"
   ```

4. **`aria-activedescendant`**: 현재 선택된 항목
   ```
   [ArrowDown 누름]
   스크린 리더: "서울, 1 / 5"
   ```

5. **`role="status"` + `aria-live="polite"`**: 검색 결과 수 알림
   ```
   [타이핑 후]
   스크린 리더: "5개의 도시가 검색되었습니다. 화살표 키로 이동하세요."
   ```

6. **키보드 네비게이션**:
   - ArrowDown/ArrowUp: 항목 이동
   - Enter: 선택
   - Escape: 닫기

#### ⚠️ 흔한 실수

```html
<!-- ❌ 잘못된 예: role 없음 -->
<input type="text"> <!-- 일반 입력 필드로만 인식 -->
<ul><!-- 자동완성 목록인지 모름 --></ul>

<!-- ❌ 잘못된 예: aria-expanded 업데이트 안 함 -->
<input role="combobox" aria-expanded="false">
<!-- 목록이 보여도 false로 유지 -->

<!-- ❌ 잘못된 예: 결과 수 알림 없음 -->
<!-- 사용자가 몇 개 결과가 있는지 모름 -->

<!-- ❌ 잘못된 예: 키보드 네비게이션 미지원 -->
<!-- 마우스로만 선택 가능 -->
```

---

### 4.2 라이브 리전 (실시간 알림)

#### 📖 왜 이게 중요한가?

채팅 앱을 만들었는데, 새 메시지가 도착해도
스크린 리더 사용자는 **알림을 전혀 못 받았습니다**.

화면에는 "새 메시지 1개"라고 표시되지만,
스크린 리더는 사용자가 직접 그 영역으로 가기 전까지 읽어주지 않았던 거죠.

#### ✅ 완성된 코드

```html
<div class="notification-demo">
  <h2>실시간 알림 예제</h2>

  <!-- 라이브 리전: 긴급하지 않은 알림 -->
  <div role="status" aria-live="polite" class="sr-only">
    <span id="polite-announcement"></span>
  </div>

  <!-- 라이브 리전: 긴급 알림 -->
  <div role="alert" aria-live="assertive" class="sr-only">
    <span id="assertive-announcement"></span>
  </div>

  <!-- 시각적 알림 영역 -->
  <div id="visual-notifications" class="notifications-container">
    <!-- JavaScript로 동적 생성 -->
  </div>

  <!-- 테스트 버튼들 -->
  <div class="button-group">
    <button onclick="showPoliteNotification()">
      일반 알림 (polite)
    </button>
    <button onclick="showAssertiveNotification()">
      긴급 알림 (assertive)
    </button>
    <button onclick="simulateNewMessage()">
      새 메시지 도착
    </button>
    <button onclick="simulateFormSaved()">
      폼 저장 완료
    </button>
  </div>
</div>

<style>
.notification-demo {
  max-width: 600px;
  margin: 2rem auto;
}

.notifications-container {
  min-height: 200px;
  padding: 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  margin: 1rem 0;
}

.notification {
  padding: 1rem;
  margin-bottom: 0.5rem;
  border-radius: 4px;
  animation: slideIn 0.3s ease-out;
}

.notification.info {
  background: #dbeafe;
  border-left: 4px solid #3b82f6;
}

.notification.success {
  background: #d1fae5;
  border-left: 4px solid #10b981;
}

.notification.warning {
  background: #fef3c7;
  border-left: 4px solid #f59e0b;
}

.notification.error {
  background: #fee2e2;
  border-left: 4px solid #ef4444;
}

@keyframes slideIn {
  from {
    transform: translateX(-20px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.button-group {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.button-group button {
  padding: 0.75rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.button-group button:hover {
  background: #2563eb;
}

.button-group button:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
</style>

<script>
const politeAnnouncement = document.getElementById('polite-announcement');
const assertiveAnnouncement = document.getElementById('assertive-announcement');
const visualNotifications = document.getElementById('visual-notifications');

// 일반 알림 (polite)
// - 현재 읽고 있는 내용이 끝난 후에 읽음
// - 채팅 메시지, 저장 완료, 업데이트 알림 등
function showPoliteNotification() {
  const message = '파일이 성공적으로 업로드되었습니다.';

  // 스크린 리더 알림
  politeAnnouncement.textContent = message;

  // 시각적 알림
  addVisualNotification(message, 'success');

  // 3초 후 알림 제거
  setTimeout(() => {
    politeAnnouncement.textContent = '';
  }, 3000);
}

// 긴급 알림 (assertive)
// - 현재 읽고 있는 내용을 중단하고 즉시 읽음
// - 에러, 중요한 경고, 시스템 알림 등
function showAssertiveNotification() {
  const message = '세션이 곧 만료됩니다. 작업 내용을 저장해주세요.';

  // 스크린 리더 알림 (즉시)
  assertiveAnnouncement.textContent = message;

  // 시각적 알림
  addVisualNotification(message, 'warning');

  // 5초 후 알림 제거
  setTimeout(() => {
    assertiveAnnouncement.textContent = '';
  }, 5000);
}

// 실전 예제: 새 메시지 도착
function simulateNewMessage() {
  const messages = [
    '김철수: 회의 시간이 변경되었습니다.',
    '이영희: 보고서 검토 부탁드립니다.',
    '박지민: 점심 같이 드실래요?'
  ];

  const message = messages[Math.floor(Math.random() * messages.length)];

  // polite: 채팅은 긴급하지 않음
  politeAnnouncement.textContent = `새 메시지: ${message}`;
  addVisualNotification(message, 'info');

  setTimeout(() => {
    politeAnnouncement.textContent = '';
  }, 3000);
}

// 실전 예제: 폼 저장 완료
function simulateFormSaved() {
  const message = '변경사항이 저장되었습니다.';

  // polite: 저장 완료는 긴급하지 않음
  politeAnnouncement.textContent = message;
  addVisualNotification(message, 'success');

  setTimeout(() => {
    politeAnnouncement.textContent = '';
  }, 3000);
}

// 시각적 알림 추가
function addVisualNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;

  visualNotifications.insertBefore(notification, visualNotifications.firstChild);

  // 5초 후 제거
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 5000);
}

// 실전 예제: 에러 발생
function showErrorNotification(message) {
  // assertive: 에러는 즉시 알려야 함
  assertiveAnnouncement.textContent = `오류: ${message}`;
  addVisualNotification(`오류: ${message}`, 'error');

  setTimeout(() => {
    assertiveAnnouncement.textContent = '';
  }, 5000);
}

// 예제: 네트워크 에러 시뮬레이션
setTimeout(() => {
  showErrorNotification('네트워크 연결이 끊어졌습니다.');
}, 10000);
</script>
```

#### 🔍 핵심 포인트

1. **`aria-live="polite"`**: 현재 읽는 내용 끝난 후 알림
   ```
   [사용자가 글을 읽는 중]
   [새 메시지 도착]
   스크린 리더: [현재 문장 끝까지 읽음] → "새 메시지: 김철수..."
   ```

2. **`aria-live="assertive"`**: 즉시 중단하고 알림
   ```
   [사용자가 글을 읽는 중]
   [에러 발생]
   스크린 리더: [즉시 중단] → "오류: 네트워크 연결이 끊어졌습니다."
   ```

3. **`role="status"` vs `role="alert"`**:
   - `status`: polite (일반 알림)
   - `alert`: assertive (긴급 알림)

4. **`.sr-only`**: 시각적으로 숨김, 스크린 리더만 읽음

5. **언제 뭘 사용할까?**:
   ```
   polite (role="status"):
   ✅ 새 메시지 도착
   ✅ 폼 저장 완료
   ✅ 검색 결과 업데이트
   ✅ 진행률 업데이트

   assertive (role="alert"):
   ✅ 에러 메시지
   ✅ 세션 만료 경고
   ✅ 보안 경고
   ✅ 중요한 시스템 알림
   ```

#### ⚠️ 흔한 실수

```html
<!-- ❌ 잘못된 예: aria-live 없음 -->
<div id="notification">
  <!-- 업데이트되어도 스크린 리더가 안 읽음 -->
</div>

<!-- ❌ 잘못된 예: 모든 알림을 assertive로 -->
<div role="alert" aria-live="assertive">
  파일이 저장되었습니다. <!-- 너무 공격적 -->
</div>

<!-- ❌ 잘못된 예: 라이브 리전이 시각적으로 보임 -->
<div role="status" aria-live="polite">
  새 메시지 <!-- 화면에 보이면서 또 읽힘 (중복) -->
</div>
```

```javascript
// ❌ 잘못된 예: 라이브 리전을 매번 새로 생성
function notify(message) {
  const div = document.createElement('div');
  div.setAttribute('aria-live', 'polite');
  div.textContent = message;
  document.body.appendChild(div);
  // 동적으로 생성된 aria-live는 작동 안 할 수 있음
}

// ✅ 올바른 예: 미리 만들어둔 라이브 리전의 내용만 변경
function notify(message) {
  politeAnnouncement.textContent = message;
}
```

---

## 5. 데이터 표시

### 5.1 정렬 가능한 테이블

#### 📖 왜 이게 중요한가?

데이터 테이블에 정렬 기능을 추가했는데,
스크린 리더 사용자는 **"어떤 컬럼으로 정렬되어 있는지, 오름차순인지 내림차순인지"**
전혀 알 수 없었습니다.

#### ✅ 완성된 코드

```html
<table class="sortable-table">
  <caption>사용자 목록 (100명)</caption>
  <thead>
    <tr>
      <th scope="col">
        <button
          class="sort-button"
          aria-label="이름으로 정렬"
          aria-sort="none"
          data-column="name"
        >
          이름
          <span class="sort-icon" aria-hidden="true"></span>
        </button>
      </th>
      <th scope="col">
        <button
          class="sort-button"
          aria-label="나이로 정렬"
          aria-sort="none"
          data-column="age"
        >
          나이
          <span class="sort-icon" aria-hidden="true"></span>
        </button>
      </th>
      <th scope="col">
        <button
          class="sort-button"
          aria-label="가입일로 정렬"
          aria-sort="none"
          data-column="joinDate"
        >
          가입일
          <span class="sort-icon" aria-hidden="true"></span>
        </button>
      </th>
    </tr>
  </thead>
  <tbody>
    <!-- JavaScript로 동적 생성 -->
  </tbody>
</table>

<!-- 스크린 리더 알림 -->
<div role="status" aria-live="polite" class="sr-only">
  <span id="sort-announcement"></span>
</div>

<style>
.sortable-table {
  width: 100%;
  border-collapse: collapse;
  margin: 2rem 0;
}

caption {
  text-align: left;
  font-weight: 600;
  margin-bottom: 0.5rem;
  font-size: 1.125rem;
}

th {
  background: #f8fafc;
  padding: 0;
  text-align: left;
  font-weight: 600;
}

.sort-button {
  width: 100%;
  padding: 0.75rem;
  background: none;
  border: none;
  text-align: left;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sort-button:hover {
  background: #f1f5f9;
}

.sort-button:focus {
  outline: 2px solid #3b82f6;
  outline-offset: -2px;
}

.sort-icon {
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-left: 0.5rem;
}

.sort-icon::after {
  content: '⇅';
  color: #cbd5e0;
}

.sort-button[aria-sort="ascending"] .sort-icon::after {
  content: '↑';
  color: #3b82f6;
}

.sort-button[aria-sort="descending"] .sort-icon::after {
  content: '↓';
  color: #3b82f6;
}

td {
  padding: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
}

tbody tr:hover {
  background: #f8fafc;
}
</style>

<script>
// 샘플 데이터
let users = [
  { name: '김철수', age: 28, joinDate: '2024-01-15' },
  { name: '이영희', age: 35, joinDate: '2023-11-20' },
  { name: '박지민', age: 22, joinDate: '2024-03-05' },
  { name: '최동욱', age: 31, joinDate: '2023-09-10' },
  { name: '정수진', age: 27, joinDate: '2024-02-28' }
];

let currentSort = { column: null, direction: 'none' };

// 테이블 렌더링
function renderTable() {
  const tbody = document.querySelector('.sortable-table tbody');
  tbody.innerHTML = '';

  users.forEach(user => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${user.name}</td>
      <td>${user.age}</td>
      <td>${user.joinDate}</td>
    `;
    tbody.appendChild(tr);
  });
}

// 정렬 버튼 이벤트
document.querySelectorAll('.sort-button').forEach(button => {
  button.addEventListener('click', function() {
    const column = this.dataset.column;
    sortTable(column, this);
  });
});

// 정렬 함수
function sortTable(column, button) {
  const isCurrentColumn = currentSort.column === column;
  let direction;

  if (!isCurrentColumn) {
    direction = 'ascending';
  } else {
    if (currentSort.direction === 'none' || currentSort.direction === 'descending') {
      direction = 'ascending';
    } else {
      direction = 'descending';
    }
  }

  // 데이터 정렬
  users.sort((a, b) => {
    let aValue = a[column];
    let bValue = b[column];

    // 숫자 비교
    if (typeof aValue === 'number') {
      return direction === 'ascending'
        ? aValue - bValue
        : bValue - aValue;
    }

    // 문자열 비교
    return direction === 'ascending'
      ? aValue.localeCompare(bValue)
      : bValue.localeCompare(aValue);
  });

  // aria-sort 업데이트
  document.querySelectorAll('.sort-button').forEach(btn => {
    btn.setAttribute('aria-sort', 'none');
    btn.setAttribute('aria-label', btn.textContent.trim() + '로 정렬');
  });

  button.setAttribute('aria-sort', direction);

  const columnName = button.textContent.trim();
  const directionText = direction === 'ascending' ? '오름차순' : '내림차순';
  button.setAttribute('aria-label', `${columnName}로 정렬, 현재 ${directionText}`);

  // 스크린 리더 알림
  const announcement = document.getElementById('sort-announcement');
  announcement.textContent = `${columnName} 열을 ${directionText}으로 정렬했습니다.`;

  // 테이블 다시 렌더링
  renderTable();

  // 현재 정렬 상태 저장
  currentSort = { column, direction };
}

// 초기 렌더링
renderTable();
</script>
```

#### 🔍 핵심 포인트

1. **`<caption>`**: 테이블 제목 (필수!)
   ```
   스크린 리더: "사용자 목록 (100명), 표"
   ```

2. **`scope="col"`**: 컬럼 헤더 명시
   ```
   스크린 리더: "이름, 컬럼 헤더"
   ```

3. **`aria-sort`**: 정렬 상태
   ```
   none: 정렬 안 됨
   ascending: 오름차순
   descending: 내림차순

   스크린 리더: "이름으로 정렬, 현재 오름차순, 버튼"
   ```

4. **버튼으로 구현**: `<a>` 태그가 아닌 `<button>` 사용
   - 정렬은 페이지 이동이 아닌 동작

5. **정렬 후 알림**: `role="status"`로 변경사항 알림
   ```
   [버튼 클릭]
   스크린 리더: "이름 열을 오름차순으로 정렬했습니다."
   ```

#### ⚠️ 흔한 실수

```html
<!-- ❌ 잘못된 예: caption 없음 -->
<table>
  <!-- 테이블이 무엇에 대한 것인지 모름 -->
</table>

<!-- ❌ 잘못된 예: scope 없음 -->
<th>이름</th> <!-- scope="col" 없음 -->

<!-- ❌ 잘못된 예: 클릭 가능한 th -->
<th onclick="sort('name')">이름</th>
<!-- 키보드 접근 불가, 스크린 리더가 버튼으로 인식 못 함 -->

<!-- ❌ 잘못된 예: aria-sort 업데이트 안 함 -->
<button aria-sort="none">
  <!-- 정렬했는데도 none으로 유지 -->
</button>
```

---

## 6. 흔한 실수 TOP 5

실제 프로젝트에서 가장 자주 발견되는 접근성 문제들입니다.

### 실수 #1: 버튼을 div로 만들기

```html
<!-- ❌ 잘못된 예 -->
<div class="button" onclick="submit()">제출</div>

문제:
- 키보드로 접근 불가 (Tab으로 선택 안 됨)
- 스크린 리더가 버튼으로 인식 못 함
- Enter/Space 키로 작동 안 함

<!-- ✅ 올바른 예 -->
<button type="button" onclick="submit()">제출</button>
```

### 실수 #2: 이미지에 alt 없음 또는 의미 없는 alt

```html
<!-- ❌ 잘못된 예 -->
<img src="product.jpg">
<img src="photo.jpg" alt="image123">
<img src="logo.png" alt="로고 이미지">

<!-- ✅ 올바른 예 -->
<img src="product.jpg" alt="맥북 프로 14인치, 스페이스 그레이">
<img src="decorative.jpg" alt=""> <!-- 장식용은 빈 alt -->
<img src="logo.png" alt="회사명"> <!-- "로고"라는 말 불필요 -->
```

### 실수 #3: 포커스 아웃라인 제거

```css
/* ❌ 잘못된 예 */
*:focus {
  outline: none; /* 키보드 사용자가 현재 위치를 못 봄 */
}

/* ✅ 올바른 예 */
*:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* 또는 더 나은 스타일 */
*:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
```

### 실수 #4: 색상만으로 정보 전달

```html
<!-- ❌ 잘못된 예 -->
<style>
  .required { color: red; }
</style>
<label class="required">이메일</label>

<!-- 색맹 사용자는 필수 필드인지 모름 -->

<!-- ✅ 올바른 예 -->
<label>
  이메일 <span class="required" aria-label="필수 입력">*</span>
</label>
<input required aria-required="true">
```

### 실수 #5: 제목 계층 구조 무시

```html
<!-- ❌ 잘못된 예 -->
<h1>페이지 제목</h1>
<h3>섹션 제목</h3> <!-- h2를 건너뜀 -->
<h2>서브섹션</h2> <!-- 순서가 뒤바뀜 -->

<!-- ✅ 올바른 예 -->
<h1>페이지 제목</h1>
  <h2>섹션 제목</h2>
    <h3>서브섹션</h3>
    <h3>또 다른 서브섹션</h3>
  <h2>다음 섹션</h2>
```

---

## 오늘부터 시작하세요

이 예제들을 복사해서 사용하시되, **반드시 실제로 테스트해보세요**:

### 1. 키보드 테스트 (2분)
```
Tab 키로 모든 요소에 접근 가능한가?
Enter/Space로 버튼이 작동하는가?
Esc로 모달이 닫히는가?
화살표 키로 메뉴를 탐색할 수 있는가?
```

### 2. 스크린 리더 테스트 (5분)
```
Windows: NVDA (무료)
macOS: VoiceOver (내장)

눈을 감고 직접 사용해보세요.
```

### 3. 브라우저 개발자 도구 (1분)
```
Chrome DevTools → Lighthouse → Accessibility
자동으로 기본적인 문제 점검
```

---

## 다음 단계

실전 예제를 익혔다면:

1. **[완전 가이드](/web-development/accessibility/guidelines/complete-guide.md)**
   → WCAG 2.1 원칙과 심화 내용

2. **[ARIA 가이드](/web-development/accessibility/aria/)**
   → ARIA의 5가지 규칙과 고급 패턴

3. **[테스팅 가이드](/web-development/accessibility/testing/)**
   → 체계적인 접근성 테스트 방법

---

**기억하세요**: 접근성은 **"있으면 좋은 것"이 아니라 "필수"**입니다.

여러분의 코드 하나하나가 누군가의 웹 경험을 완전히 바꿀 수 있습니다. 💙
