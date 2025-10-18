---
title: ARIA (Accessible Rich Internet Applications)
description: 스크린 리더와 대화하는 법. ARIA 역할, 속성, 상태를 이해하고 접근 가능한 동적 웹 컴포넌트를 만드는 실전 가이드. "No ARIA is better than Bad ARIA"의 진짜 의미.
date: 2022-11-07
last_modified_at: 2022-11-07
categories: [Web Development, Accessibility, ARIA]
tags: [ARIA, Screen Reader, Assistive Technology, WAI-ARIA]
render_with_liquid: false
layout: page
---

# ARIA - 스크린 리더와 대화하는 법

## "스크린 리더는 이게 버튼인지 어떻게 알까?"

처음 React로 커스텀 드롭다운을 만들었을 때의 일입니다. `<div>`로 만든 예쁜 드롭다운이었죠. 디자인도 완벽하고, 클릭도 잘 되고, 애니메이션도 부드러웠습니다.

그런데 QA 팀에서 피드백이 왔습니다: **"스크린 리더로 테스트했는데, 이게 드롭다운인지 전혀 모르겠어요. 그냥 '빈 요소'라고만 읽히네요."**

그때 깨달았습니다. 시각적으로 버튼처럼 보인다고 해서 스크린 리더가 버튼이라고 인식하는 건 아니라는 걸요.

**이때 필요한 것이 바로 ARIA입니다.**

## ARIA란 무엇일까요?

**ARIA (Accessible Rich Internet Applications)**는 HTML 요소에 **의미와 상태를 추가하는 속성 세트**입니다. 마치 스크린 리더와 대화하는 언어라고 생각하면 됩니다.

```html
<!-- 시각적으로는 버튼처럼 보이지만... -->
<div class="button" onclick="submit()">
  제출
</div>

스크린 리더: "빈 요소"
사용자: "응? 이게 뭐지?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<!-- ARIA로 의미 부여 -->
<div
  class="button"
  role="button"
  tabindex="0"
  onclick="submit()"
  onkeypress="handleKeyPress()"
>
  제출
</div>

스크린 리더: "제출 버튼"
사용자: "아, 버튼이구나! Enter 누르면 되겠네."
```

하지만 잠깐! ARIA를 배우기 전에 **가장 중요한 원칙**을 먼저 알아야 합니다.

---

## ARIA의 황금률: "No ARIA is better than Bad ARIA"

> **"ARIA를 잘못 사용하느니, 아예 안 쓰는 게 낫다."**

왜 그럴까요?

### 잘못된 ARIA는 오히려 접근성을 해칩니다

```html
❌ ARIA를 잘못 사용한 예:
<button role="heading">제출</button>

스크린 리더: "제목 레벨 2, 제출"
사용자: "어? 이게 제목이야, 버튼이야?"
→ 혼란스러움. 차라리 role을 안 쓰는 게 나음!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ 네이티브 HTML이 답:
<button>제출</button>

스크린 리더: "제출 버튼"
사용자: "명확하다!"
```

**핵심**: HTML로 가능하면 ARIA를 쓰지 마세요.

---

## ARIA의 5가지 필수 규칙

이 규칙들은 **WAI-ARIA 공식 명세**에서 강조하는 핵심입니다.

### 규칙 1: HTML로 가능하면 ARIA를 쓰지 마세요

```html
❌ 불필요한 ARIA:
<div role="button" tabindex="0" onclick="...">클릭</div>
<div role="heading" aria-level="1">제목</div>
<div role="list">
  <div role="listitem">항목</div>
</div>

✅ 네이티브 HTML 사용:
<button onclick="...">클릭</button>
<h1>제목</h1>
<ul>
  <li>항목</li>
</ul>
```

**왜?** 네이티브 HTML은 이미 키보드 지원, 포커스 관리, 스크린 리더 호환성을 모두 갖추고 있습니다.

### 규칙 2: 네이티브 의미를 덮어쓰지 마세요

```html
❌ 의미 충돌:
<h1 role="button">버튼처럼 동작하는 제목?</h1>
<button role="heading">제목처럼 보이는 버튼?</button>

✅ 적절한 요소 사용:
<h1>제목</h1>
<button>버튼</button>
```

**원칙**: 각 요소는 하나의 명확한 역할을 가져야 합니다.

### 규칙 3: 모든 인터랙티브 ARIA 컨트롤은 키보드 사용 가능해야 합니다

```html
❌ 마우스로만 작동:
<div role="button" onclick="submit()">
  제출
</div>
→ Tab으로 포커스 안 됨, Enter/Space로 작동 안 됨

✅ 키보드 접근 가능:
<div
  role="button"
  tabindex="0"
  onclick="submit()"
  onkeydown="handleKeyDown(event)"
>
  제출
</div>

✅ 더 좋은 방법:
<button onclick="submit()">제출</button>
```

**JavaScript로 키보드 이벤트 처리:**

```javascript
function handleKeyDown(event) {
  // Enter 또는 Space로 활성화
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    submit();
  }
}
```

### 규칙 4: 포커스 가능한 요소를 숨기지 마세요

```html
❌ 위험:
<button aria-hidden="true">보이는 버튼</button>
→ 화면에는 보이지만 스크린 리더는 못 찾음

<a href="/page" role="presentation">링크</a>
→ 포커스는 되는데 역할이 없어서 혼란스러움

✅ 올바른 사용:
<!-- 장식용 아이콘 숨기기 -->
<button>
  <svg aria-hidden="true"><!-- 아이콘 --></svg>
  저장
</button>
```

### 규칙 5: 모든 인터랙티브 요소는 이름이 있어야 합니다

```html
❌ 이름 없는 버튼:
<button>
  <svg><!-- 아이콘만 --></svg>
</button>
→ 스크린 리더: "버튼" (무슨 버튼인지 모름)

✅ aria-label 추가:
<button aria-label="저장">
  <svg aria-hidden="true"><!-- 저장 아이콘 --></svg>
</button>
→ 스크린 리더: "저장 버튼"

✅ 대안: 숨겨진 텍스트:
<button>
  <svg aria-hidden="true"><!-- 아이콘 --></svg>
  <span class="sr-only">저장</span>
</button>
```

**`.sr-only` CSS:**

```css
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
```

---

## ARIA 속성의 3가지 유형

ARIA 속성은 크게 3가지로 나뉩니다:

```
1. Roles (역할)
   → 이 요소가 "무엇"인지 정의

2. States (상태)
   → 현재 "어떤 상태"인지 (동적)

3. Properties (속성)
   → 요소의 "특성"이나 "관계" (대부분 정적)
```

### 1. Roles - "이게 뭐야?"

```html
<!-- 랜드마크 역할 (페이지 구조) -->
<div role="navigation">네비게이션</div>
<div role="main">메인 콘텐츠</div>
<div role="complementary">사이드바</div>
<div role="contentinfo">푸터</div>

<!-- 위젯 역할 (UI 컴포넌트) -->
<div role="button">버튼</div>
<div role="tab">탭</div>
<div role="tabpanel">탭 패널</div>
<div role="dialog">다이얼로그</div>
<div role="alert">경고</div>

<!-- 문서 구조 역할 -->
<div role="article">기사</div>
<div role="list">목록</div>
<div role="listitem">목록 항목</div>
```

**하지만 기억하세요!** 대부분은 네이티브 HTML로 가능합니다:

```html
✅ 이게 더 좋습니다:
<nav>네비게이션</nav>
<main>메인 콘텐츠</main>
<aside>사이드바</aside>
<footer>푸터</footer>

<button>버튼</button>
<article>기사</article>
<ul>
  <li>목록 항목</li>
</ul>
```

### 2. States - "지금 어떤 상태야?"

상태는 **동적으로 변경**됩니다. JavaScript로 업데이트하세요.

```html
<!-- 확장/축소 -->
<button aria-expanded="false" onclick="toggleMenu()">
  메뉴
</button>

<script>
function toggleMenu() {
  const button = event.target;
  const isExpanded = button.getAttribute('aria-expanded') === 'true';
  button.setAttribute('aria-expanded', !isExpanded);
}
</script>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<!-- 선택 상태 -->
<div role="option" aria-selected="false">옵션 1</div>
<div role="option" aria-selected="true">옵션 2</div>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<!-- 체크 상태 -->
<div role="checkbox" aria-checked="false">동의</div>
<div role="checkbox" aria-checked="true">동의</div>
<div role="checkbox" aria-checked="mixed">일부 동의</div>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<!-- 눌림 상태 (토글 버튼) -->
<button aria-pressed="false">구독</button>
<button aria-pressed="true">구독 중</button>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<!-- 비활성화 -->
<button aria-disabled="true">비활성 버튼</button>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<!-- 숨김 -->
<div aria-hidden="true">스크린 리더에서 숨김</div>
```

### 3. Properties - "어떤 특성이 있어?"

속성은 **대부분 정적**이며, 요소의 특성이나 관계를 설명합니다.

```html
<!-- 레이블 -->
<button aria-label="닫기">×</button>
<input aria-labelledby="label-id">
<span id="label-id">이메일</span>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<!-- 설명 -->
<input
  type="password"
  aria-describedby="password-hint"
>
<div id="password-hint">
  영문, 숫자 8자 이상
</div>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<!-- 필수 입력 -->
<input aria-required="true">

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<!-- 관계 (무엇을 제어하는지) -->
<button aria-controls="panel-id">
  패널 열기
</button>
<div id="panel-id">패널 내용</div>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<!-- 현재 항목 -->
<a href="/about" aria-current="page">
  소개
</a>
```

---

## 실전 패턴: 자주 사용하는 컴포넌트

### 1. 모달 다이얼로그 - 포커스를 잡아두기

```html
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-desc"
>
  <h2 id="dialog-title">정말 삭제하시겠습니까?</h2>
  <p id="dialog-desc">
    이 작업은 되돌릴 수 없습니다.
  </p>

  <button onclick="cancel()">취소</button>
  <button onclick="confirm()">삭제</button>
</div>
```

**JavaScript로 포커스 트랩 구현:**

```javascript
// 모달이 열릴 때
function openModal() {
  const modal = document.querySelector('[role="dialog"]');
  const focusableElements = modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  // 첫 번째 요소에 포커스
  firstElement.focus();

  // Tab 키 순환
  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
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

    // Esc로 닫기
    if (e.key === 'Escape') {
      closeModal();
    }
  });
}
```

### 2. 탭 인터페이스 - 화살표 키로 탐색

```html
<div role="tablist" aria-label="설정 카테고리">
  <button
    role="tab"
    aria-selected="true"
    aria-controls="panel-general"
    id="tab-general"
  >
    일반
  </button>
  <button
    role="tab"
    aria-selected="false"
    aria-controls="panel-security"
    id="tab-security"
  >
    보안
  </button>
</div>

<div
  role="tabpanel"
  id="panel-general"
  aria-labelledby="tab-general"
>
  일반 설정 내용
</div>

<div
  role="tabpanel"
  id="panel-security"
  aria-labelledby="tab-security"
  hidden
>
  보안 설정 내용
</div>
```

**키보드 네비게이션:**

```javascript
const tabs = document.querySelectorAll('[role="tab"]');

tabs.forEach((tab, index) => {
  tab.addEventListener('keydown', (e) => {
    let newIndex;

    if (e.key === 'ArrowRight') {
      newIndex = (index + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      newIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      newIndex = 0;
    } else if (e.key === 'End') {
      newIndex = tabs.length - 1;
    } else {
      return;
    }

    tabs[newIndex].click();
    tabs[newIndex].focus();
  });
});
```

### 3. 아코디언 - 확장/축소 상태

```html
<div class="accordion">
  <h3>
    <button
      aria-expanded="false"
      aria-controls="section-1"
      id="accordion-1"
    >
      <svg aria-hidden="true"><!-- 화살표 --></svg>
      질문 1: ARIA가 뭔가요?
    </button>
  </h3>
  <div
    id="section-1"
    role="region"
    aria-labelledby="accordion-1"
    hidden
  >
    <p>ARIA는 접근성을 위한 HTML 속성입니다...</p>
  </div>
</div>
```

**토글 로직:**

```javascript
function toggleAccordion(button) {
  const isExpanded = button.getAttribute('aria-expanded') === 'true';
  const content = document.getElementById(
    button.getAttribute('aria-controls')
  );

  button.setAttribute('aria-expanded', !isExpanded);
  content.hidden = isExpanded;
}
```

### 4. Live Regions - 동적 콘텐츠 알림

```html
<!-- 중요하지 않은 알림 (현재 읽기가 끝난 후) -->
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  <!-- JavaScript로 업데이트 -->
</div>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<!-- 중요한 알림 (즉시 읽음) -->
<div
  role="alert"
  aria-live="assertive"
  aria-atomic="true"
>
  <!-- JavaScript로 업데이트 -->
</div>
```

**JavaScript로 알림 표시:**

```javascript
function showNotification(message, type = 'status') {
  // 기존 알림 영역 찾기 또는 생성
  let liveRegion = document.querySelector(`[role="${type}"]`);

  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.setAttribute('role', type);
    liveRegion.setAttribute('aria-live', type === 'alert' ? 'assertive' : 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only'; // 화면에 안 보이게
    document.body.appendChild(liveRegion);
  }

  // 메시지 업데이트
  liveRegion.textContent = message;

  // 3초 후 제거
  setTimeout(() => {
    liveRegion.textContent = '';
  }, 3000);
}

// 사용 예:
showNotification('저장되었습니다', 'status');
showNotification('오류가 발생했습니다!', 'alert');
```

### 5. 자동 완성 - Combobox 패턴

```html
<label for="search">검색</label>
<input
  id="search"
  type="text"
  role="combobox"
  aria-expanded="false"
  aria-autocomplete="list"
  aria-controls="suggestions"
  aria-activedescendant=""
>

<ul id="suggestions" role="listbox" hidden>
  <li role="option" id="option-1">React</li>
  <li role="option" id="option-2">Vue</li>
  <li role="option" id="option-3">Svelte</li>
</ul>
```

**키보드 네비게이션:**

```javascript
const input = document.getElementById('search');
const listbox = document.getElementById('suggestions');
const options = listbox.querySelectorAll('[role="option"]');
let currentIndex = -1;

input.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    currentIndex = Math.min(currentIndex + 1, options.length - 1);
    updateActiveDescendant();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    currentIndex = Math.max(currentIndex - 1, -1);
    updateActiveDescendant();
  } else if (e.key === 'Enter' && currentIndex >= 0) {
    selectOption(options[currentIndex]);
  } else if (e.key === 'Escape') {
    closeListbox();
  }
});

function updateActiveDescendant() {
  if (currentIndex >= 0) {
    input.setAttribute('aria-activedescendant', options[currentIndex].id);
    // 시각적 하이라이트
    options.forEach((opt, idx) => {
      opt.classList.toggle('highlighted', idx === currentIndex);
    });
  } else {
    input.removeAttribute('aria-activedescendant');
  }
}
```

---

## Live Regions 심화 - 동적 콘텐츠의 핵심

Live Regions는 **페이지 새로고침 없이 변경되는 콘텐츠**를 스크린 리더에 알립니다.

### aria-live의 3가지 값

```html
<!-- off: 알리지 않음 (기본값) -->
<div aria-live="off">
  조용히 업데이트
</div>

<!-- polite: 현재 읽기가 끝난 후 알림 -->
<div aria-live="polite">
  1개의 새 메시지가 있습니다
</div>
→ 스크린 리더: (현재 문장을 다 읽은 후) "1개의 새 메시지가 있습니다"

<!-- assertive: 즉시 알림 (현재 읽기 중단) -->
<div aria-live="assertive">
  세션이 1분 후에 만료됩니다!
</div>
→ 스크린 리더: (즉시 중단하고) "세션이 1분 후에 만료됩니다!"
```

**사용 가이드:**
- `polite`: 상태 업데이트, 알림, 진행률
- `assertive`: 오류, 경고, 긴급 알림 (남용 금지!)

### aria-atomic

```html
<!-- false: 변경된 부분만 읽음 -->
<div aria-live="polite" aria-atomic="false">
  <span>장바구니:</span>
  <span id="count">3개</span>
</div>
→ count가 "5개"로 변경되면: "5개"만 읽음

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<!-- true: 전체 영역 읽음 -->
<div aria-live="polite" aria-atomic="true">
  <span>장바구니:</span>
  <span id="count">3개</span>
</div>
→ count가 "5개"로 변경되면: "장바구니: 5개" 전체 읽음
```

**팁**: 짧은 메시지는 `aria-atomic="true"`, 긴 콘텐츠는 `false`

---

## 흔한 실수와 함정

### ❌ 함정 1: 중복된 역할

```html
❌ 불필요한 중복:
<button role="button">클릭</button>
<nav role="navigation">메뉴</nav>
<ul role="list">
  <li role="listitem">항목</li>
</ul>

✅ 간결하게:
<button>클릭</button>
<nav>메뉴</nav>
<ul>
  <li>항목</li>
</ul>
```

**왜 문제일까?** 불필요한 코드가 많아지고, 가끔 충돌 발생.

### ❌ 함정 2: aria-label 남용

```html
❌ 보이는 텍스트와 다름:
<button aria-label="submit">전송</button>
→ 화면: "전송"
→ 스크린 리더: "submit"
→ 음성 제어 사용자: "전송 클릭"이라고 해도 작동 안 함!

✅ 텍스트 그대로:
<button>전송</button>

✅ 아이콘만 있을 때만 사용:
<button aria-label="전송">
  <svg aria-hidden="true"><!-- 아이콘 --></svg>
</button>
```

**원칙**: 보이는 텍스트와 스크린 리더가 읽는 텍스트는 동일해야 합니다.

### ❌ 함정 3: 숨겨진 필수 정보

```html
❌ 레이블 숨김:
<label aria-hidden="true">이름</label>
<input type="text">
→ 스크린 리더: "텍스트 입력" (무슨 입력인지 모름)

✅ 올바른 연결:
<label for="name">이름</label>
<input id="name" type="text">
→ 스크린 리더: "이름, 텍스트 입력"
```

### ❌ 함정 4: 잘못된 역할 조합

```html
❌ 의미 충돌:
<ul role="navigation">
  <li><a href="/">홈</a></li>
</ul>
→ ul은 list, navigation은 랜드마크. 충돌!

✅ 올바른 구조:
<nav>
  <ul>
    <li><a href="/">홈</a></li>
  </ul>
</nav>
```

---

## 테스팅: ARIA가 제대로 작동하는지 확인하기

### 1. 스크린 리더로 직접 테스트

**Windows (NVDA - 무료):**
```
Insert + Down Arrow: 다음 요소로 이동
Insert + F7: 요소 목록 (헤딩, 링크, 폼 등)
Insert + F3: ARIA 랜드마크 목록
```

**Mac (VoiceOver - 내장):**
```
Cmd + F5: VoiceOver 켜기/끄기
VO + A: 웹 로터 (모든 요소 목록)
VO + U: 랜드마크, 헤딩, 링크 목록
VO + 스페이스바: 클릭
```

### 2. 브라우저 개발자 도구

**Chrome DevTools:**
1. 요소 검사 (F12)
2. Elements 탭 → Accessibility 패널
3. "Computed Properties" 섹션에서 ARIA 속성 확인

**Firefox DevTools:**
1. 요소 검사
2. Accessibility Inspector
3. "Properties" 탭에서 ARIA 트리 확인

### 3. 자동화 도구

```bash
# axe-core
npm install --save-dev @axe-core/cli
npx axe https://yoursite.com --rules aria-*

# Pa11y
npm install --save-dev pa11y
npx pa11y --runner axe https://yoursite.com
```

---

## 체크리스트: ARIA를 올바르게 사용했나요?

```markdown
[ ] HTML로 가능한 건 HTML로 했나요?
[ ] role을 중복으로 선언하지 않았나요?
[ ] 모든 인터랙티브 요소가 키보드로 작동하나요?
[ ] aria-label과 실제 텍스트가 일치하나요?
[ ] 포커스 가능한 요소를 aria-hidden으로 숨기지 않았나요?
[ ] live region을 적절하게 사용했나요? (polite vs assertive)
[ ] 상태 변경 시 aria-* 속성을 업데이트하나요?
[ ] 스크린 리더로 직접 테스트했나요?
```

---

## 마치며

ARIA를 처음 배울 때는 복잡해 보일 수 있습니다. 하지만 핵심 원칙은 간단합니다:

> **"스크린 리더 사용자에게 시각적으로 보이는 것과 동일한 정보를 제공하라."**

저도 처음에는 "ARIA를 많이 쓰면 접근성이 좋아진다"고 생각했습니다. 하지만 경험을 통해 배운 진실은:

**"가장 좋은 ARIA는 필요할 때만 쓰는 ARIA입니다."**

작은 것부터 시작하세요:
1. 먼저 시맨틱 HTML을 사용하세요
2. 정말 필요한 곳에만 ARIA를 추가하세요
3. 스크린 리더로 테스트하세요

**하나씩 배우고 적용하다 보면, 어느새 ARIA와 친구가 되어 있을 겁니다!** 🎉

---

## 참고 자료

### 공식 문서
- [WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/) - 패턴과 예제
- [ARIA in HTML](https://www.w3.org/TR/html-aria/) - HTML 요소별 ARIA 사용 규칙
- [Using ARIA - MDN](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA) - 상세한 가이드

### 패턴 라이브러리
- [A11y Style Guide](https://a11y-style-guide.com/style-guide/) - 접근 가능한 컴포넌트 패턴
- [Inclusive Components](https://inclusive-components.design/) - 실전 예제
- [ARIA Examples](https://www.w3.org/WAI/ARIA/apg/patterns/) - 공식 예제 모음

### 테스팅 도구
- [NVDA](https://www.nvaccess.org/) - 무료 스크린 리더
- [axe DevTools](https://www.deque.com/axe/devtools/) - ARIA 검증 도구
- [Accessibility Insights](https://accessibilityinsights.io/) - 종합 테스팅 도구

---

## 관련 문서

- 📖 [완전 가이드](/web-development/accessibility/guidelines/complete-guide) - 접근성 기초
- 🧪 [접근성 테스팅](/web-development/accessibility/testing/) - 테스트 방법
- 💡 [실전 예제](/web-development/accessibility/examples/) - 컴포넌트 구현

**ARIA를 마스터하는 여정, 함께 시작해볼까요?** 🚀
