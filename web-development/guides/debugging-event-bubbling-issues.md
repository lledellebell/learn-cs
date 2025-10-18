---
layout: page
title: "링크가 안 눌려요!" - 이벤트 버블링으로 인한 링크 클릭 문제 해결하기
date: 2025-01-18
categories: [web-development, guides]
tags: [javascript, debugging, event-bubbling, dom, troubleshooting]
description: querySelectorAll로 요소를 선택할 때 발생할 수 있는 이벤트 버블링 문제와 해결 방법. 실제 디버깅 과정을 따라가며 배우는 DOM 이벤트의 이해
---

# "링크가 안 눌려요!" - 이벤트 버블링으로 인한 링크 클릭 문제 해결하기

여러분도 이런 경험 있으신가요? 코드를 작성하고 테스트를 해보는데, 분명히 링크를 클릭했는데 아무 일도 일어나지 않는 상황. 콘솔에는 에러도 없고, `preventDefault()`를 호출한 기억도 없는데 말이죠.

저도 최근에 Jekyll 사이트의 카테고리 페이지를 구현하다가 정확히 이 문제를 만났습니다. 탭 필터링은 완벽하게 작동하는데, 정작 문서 링크는 클릭해도 페이지 이동이 되지 않는 거예요. 마치 링크가 "죽은" 것처럼요.

**이 가이드에서는 제가 이 문제를 어떻게 해결했는지, 그리고 여러분이 비슷한 상황에서 어떻게 디버깅할 수 있는지 실제 과정을 따라가보겠습니다.**

---

## 문제 상황: "링크가 클릭되지 않아요"

### 증상

사용자가 보고한 문제는 이랬습니다:

1. ❌ 링크를 클릭하면 클릭 이벤트는 감지됨
2. ❌ `preventDefault()`가 호출되지 않았음에도 페이지 이동 안 됨
3. ❌ 링크 클릭 직후 필터링이 다시 실행됨
4. ❌ 콘솔에 `Category selected: guides` 같은 로그가 출력됨

"클릭은 되는데 링크는 안 된다"는 게 말이 되나요? 네, JavaScript의 이벤트 버블링을 이해하면 완벽하게 말이 됩니다.

### HTML 구조 살펴보기

먼저 문제가 발생한 HTML 구조를 봅시다:

```html
<!-- 카테고리 탭 -->
<div class="category-tabs">
  <button class="category-tab active" data-category="all">전체</button>
  <button class="category-tab" data-category="guides">가이드</button>
  <button class="category-tab" data-category="react">React</button>
</div>

<!-- 문서 목록 -->
<ul class="category-posts-list">
  <li class="category-post-item" data-category="guides">
    <a href="/guides/seo.html" class="category-post-link">
      <div class="category-post-main">
        <h4>SEO 최적화 가이드</h4>
      </div>
      <div class="category-post-meta">
        <time>2025.01.18</time>
      </div>
    </a>
  </li>
  <li class="category-post-item" data-category="react">
    <a href="/react/hooks.html" class="category-post-link">
      <div class="category-post-main">
        <h4>React Hooks 완벽 가이드</h4>
      </div>
      <div class="category-post-meta">
        <time>2025.01.15</time>
      </div>
    </a>
  </li>
</ul>
```

여기서 주목할 점:
- 탭 버튼들은 `data-category` 속성을 가지고 있습니다
- **리스트 아이템(`<li>`)도 `data-category` 속성을 가지고 있습니다!** 👈 여기가 함정!

### 문제가 있던 JavaScript 코드

```javascript
const initElements = () => {
  // ❌ 문제: 모든 [data-category] 요소를 선택
  elements.categoryTabs = document.querySelectorAll('[data-category]');
  elements.subcategoryTabs = document.querySelectorAll('[data-subcategory]');
};

const tabs = {
  initCategoryTabs: () => {
    elements.categoryTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();  // 👈 기본 동작 차단!
        const category = tab.getAttribute('data-category');
        tabs.selectCategory(category);
      });
    });
  }
};
```

코드만 봐서는 문제가 없어 보입니다. "모든 카테고리 탭에 클릭 이벤트 리스너를 등록한다" - 완벽하지 않나요?

**아니요! 여기에 숨겨진 버그가 있습니다.**

---

## 원인 분석: 이벤트 버블링의 함정

### 1. 과도한 요소 선택 문제

`querySelectorAll('[data-category]')`는 **모든** `data-category` 속성을 가진 요소를 선택합니다:

```javascript
// 선택되는 요소들:
const selectedElements = [
  <button class="category-tab" data-category="all">전체</button>,     // ✅ 의도한 대상
  <button class="category-tab" data-category="guides">가이드</button>, // ✅ 의도한 대상
  <button class="category-tab" data-category="react">React</button>,   // ✅ 의도한 대상
  <li class="category-post-item" data-category="guides">...</li>,     // ❌ 의도하지 않은 대상!
  <li class="category-post-item" data-category="react">...</li>,      // ❌ 의도하지 않은 대상!
  <li class="category-post-item" data-category="guides">...</li>,     // ❌ 의도하지 않은 대상!
  // ... 수십 개의 리스트 아이템들
];
```

### 2. 이벤트 버블링이란?

이벤트 버블링을 이해하려면, DOM을 거품이 올라오는 물컵으로 생각해보세요.

```
물컵의 바닥 (가장 안쪽 요소)
    ↓
   <a>
    ↓
   <div>
    ↓
   <li>  👈 여기에 이벤트 리스너가 걸려있음!
    ↓
   <ul>
    ↓
   <body>
    ↓
   <html>
    ↓
물컵의 위 (가장 바깥 요소)
```

링크를 클릭하면 이벤트는 다음과 같이 전파됩니다:

```
사용자가 <a> 태그 클릭
    ↓
1. <a> 요소에서 클릭 이벤트 발생
    ↓
2. <div> 요소로 버블링 (거품이 올라감)
    ↓
3. <li class="category-post-item" data-category="guides">로 버블링
    ↓
    ⚠️  이 <li>에 클릭 이벤트 리스너가 등록되어 있음!
    ↓
4. 리스너 실행:
   - e.preventDefault() 호출 → 링크 이동 차단! ❌
   - tabs.selectCategory('guides') 실행 → 필터링 재실행
    ↓
5. <ul>로 계속 버블링...
```

**이제 이해가 되시나요?**

링크를 클릭했지만, 이벤트가 버블링되면서 부모 요소인 `<li>`에 걸린 이벤트 리스너가 실행되고, 그 리스너가 `preventDefault()`를 호출해서 링크 이동을 막아버린 것입니다!

### 3. 디버깅 과정: 탐정처럼 추적하기

처음에는 이 문제의 원인을 몰랐습니다. 그래서 단서를 찾기 위해 디버깅 로그를 추가했습니다.

#### 1단계: 링크 클릭이 감지되는지 확인

```javascript
// 캡처링 단계에서 링크 클릭 감지
document.addEventListener('click', (e) => {
  const link = e.target.closest('.category-post-link');
  if (link) {
    console.log('🔗 링크 클릭됨!', {
      href: link.href,
      target: e.target,
      defaultPrevented: e.defaultPrevented  // preventDefault 호출 여부
    });
  }
}, true);  // true = 캡처링 단계에서 실행
```

**콘솔 출력:**
```
🔗 링크 클릭됨! {
  href: 'http://localhost:4000/guides/seo.html',
  target: div.category-post-meta,
  defaultPrevented: false  // ✅ 아직 preventDefault 안 됨
}

[Category Pagination] Category selected: guides  // ❌ 탭이 선택됨!
[Category Pagination] Filtered items: 5 / 32   // ❌ 필터링 재실행!
```

"링크는 클릭되는데, 왜 탭 선택 로직이 실행되지?" 🤔

#### 2단계: 선택된 탭 요소 확인

```javascript
// 실제로 선택된 탭 요소들을 확인
const tabs = document.querySelectorAll('[data-category]');
console.log('선택된 탭 개수:', tabs.length);
console.log('선택된 요소들:', tabs);
```

**콘솔 출력:**
```
선택된 탭 개수: 40  // ❌ 버튼만 있어야 하는데 너무 많음!

선택된 요소들: NodeList(40) [
  button.category-tab,
  button.category-tab,
  button.category-tab,
  li.category-post-item,  // ❌ 리스트 아이템이 섞여있음!
  li.category-post-item,
  li.category-post-item,
  ...
]
```

**바로 이거였습니다!**

리스트 아이템에도 클릭 이벤트 리스너가 등록되어 있었고, 이벤트 버블링으로 인해 링크 클릭이 리스트 아이템의 리스너에게 전달된 것입니다.

#### 3단계: 이벤트 경로 추적

```javascript
// 이벤트가 어떤 경로로 전파되는지 확인
document.addEventListener('click', (e) => {
  console.log('이벤트 경로:', e.composedPath());
}, true);
```

**콘솔 출력:**
```
이벤트 경로: [
  div.category-post-meta,     // 클릭한 요소
  a.category-post-link,       // 링크
  div.category-post-content,  // 컨테이너
  li.category-post-item,      // 👈 여기에 리스너가 걸려있음!
  ul.category-posts-list,
  div.category-posts,
  main,
  body,
  html,
  document,
  Window
]
```

이제 완벽하게 이해가 됩니다!

---

## 해결 방법: 정확한 선택자 사용

### ✅ 올바른 코드

```javascript
const initElements = () => {
  // ✅ 해결: .category-tab 클래스가 있는 요소만 선택
  elements.categoryTabs = document.querySelectorAll('.category-tab[data-category]');
  elements.subcategoryTabs = document.querySelectorAll('.category-tab[data-subcategory]');
};
```

### 선택자 비교: Before & After

| 선택자 | 선택되는 요소 | 개수 | 문제점 |
|--------|--------------|------|--------|
| `[data-category]` | 모든 `data-category` 속성을 가진 요소 | 40개 | ❌ 탭 버튼 + 포스트 아이템 모두 선택 |
| `.category-tab[data-category]` | `category-tab` 클래스를 가진 요소 중 `data-category`가 있는 것 | 3개 | ✅ 탭 버튼만 선택 |

### 왜 이렇게 해야 할까요?

CSS 선택자는 **구체적일수록 좋습니다**. 마치 주소를 적을 때 "서울시"만 적으면 너무 넓지만, "서울시 강남구 테헤란로 123" 같이 구체적으로 적으면 정확한 위치를 찾을 수 있는 것처럼요.

```javascript
// ❌ 너무 포괄적 (서울시에 사는 모든 사람)
const elements = document.querySelectorAll('[data-category]');

// ✅ 충분히 구체적 (서울시 강남구 테헤란로에 사는 사람)
const elements = document.querySelectorAll('.category-tab[data-category]');
```

---

## 예방 방법: 다시는 이런 실수 하지 않기

### 1. 명확한 선택자 작성 원칙

```javascript
// ❌ 나쁜 예: 속성만으로 선택
const buttons = document.querySelectorAll('[data-action]');
// 문제: data-action을 가진 모든 요소 선택 (button, div, span, li 등)

// ✅ 좋은 예: 클래스 + 속성 조합
const buttons = document.querySelectorAll('.action-btn[data-action]');
// 장점: action-btn 클래스를 가진 요소만 선택

// ✅ 좋은 예: 특정 컨테이너 내에서만 선택
const buttons = document.querySelectorAll('.toolbar [data-action]');
// 장점: toolbar 내부의 요소만 선택

// ✅ 좋은 예: 태그 + 클래스 + 속성
const buttons = document.querySelectorAll('button.action-btn[data-action]');
// 장점: 가장 구체적 (하지만 과도하게 구체적일 필요는 없음)
```

### 2. 선택된 요소 검증하기

개발 중에는 항상 선택된 요소를 검증하는 습관을 들이세요:

```javascript
const initElements = () => {
  elements.categoryTabs = document.querySelectorAll('.category-tab[data-category]');

  // 디버그 모드에서 검증
  if (CONFIG.DEBUG) {
    console.group('📋 Elements Initialized');
    console.log('탭 개수:', elements.categoryTabs.length);

    // 각 요소 확인
    elements.categoryTabs.forEach((tab, index) => {
      console.log(`Tab ${index}:`, {
        className: tab.className,
        tagName: tab.tagName,
        dataset: tab.dataset
      });
    });

    console.groupEnd();
  }
};
```

**콘솔 출력 (올바른 경우):**
```
📋 Elements Initialized
  탭 개수: 3
  Tab 0: {className: 'category-tab active', tagName: 'BUTTON', dataset: {category: 'all'}}
  Tab 1: {className: 'category-tab', tagName: 'BUTTON', dataset: {category: 'guides'}}
  Tab 2: {className: 'category-tab', tagName: 'BUTTON', dataset: {category: 'react'}}
```

### 3. 이벤트 위임 패턴 사용 (대안)

이벤트 위임을 사용하면 정확한 요소에만 반응하도록 할 수 있습니다:

```javascript
// ❌ 기존 방식: 각 요소에 리스너 등록
elements.categoryTabs.forEach(tab => {
  tab.addEventListener('click', handleTabClick);
});

// ✅ 이벤트 위임: 컨테이너에 하나의 리스너만 등록
document.querySelector('.category-tabs').addEventListener('click', (e) => {
  // 정확히 버튼 클릭만 처리
  const tab = e.target.closest('.category-tab');
  if (!tab) return;  // 버튼이 아니면 무시

  e.preventDefault();
  const category = tab.getAttribute('data-category');
  tabs.selectCategory(category);
});
```

**이벤트 위임의 장점:**
- 메모리 효율적 (리스너 1개만 등록)
- 동적으로 추가된 요소도 자동으로 처리
- 정확한 요소만 선택하기 쉬움

**이벤트 위임의 작동 원리:**

```
사용자가 버튼 클릭
    ↓
<button class="category-tab">
    ↓ 이벤트 버블링
<div class="category-tabs">  👈 여기에 리스너가 걸려있음
    ↓
리스너 실행:
  - e.target.closest('.category-tab')로 버튼 찾기
  - 버튼이 아니면 무시
  - 버튼이면 처리
```

### 4. TypeScript로 타입 안전성 확보

TypeScript를 사용하면 컴파일 시점에 타입 오류를 잡을 수 있습니다:

```typescript
// ❌ JavaScript: 런타임에만 타입 확인 가능
const tabs = document.querySelectorAll('[data-category]');
tabs.forEach(tab => {
  // tab이 HTMLButtonElement인지 보장되지 않음
  tab.classList.add('active');
});

// ✅ TypeScript: 컴파일 시점에 타입 확인
const tabs = document.querySelectorAll<HTMLButtonElement>('.category-tab[data-category]');
tabs.forEach(tab => {
  // tab이 HTMLButtonElement임이 보장됨
  tab.classList.add('active');
  tab.disabled = false;  // HTMLButtonElement만 가진 속성
});
```

---

## 디버깅 팁: 비슷한 문제를 만났을 때

### 1. 이벤트 경로 확인하기

```javascript
// 캡처링 단계에서 이벤트 경로 확인
document.addEventListener('click', (e) => {
  console.log('이벤트 경로:', e.composedPath().map(el => {
    if (el.tagName) {
      return `<${el.tagName.toLowerCase()}${el.className ? '.' + el.className.split(' ').join('.') : ''}>`;
    }
    return el;
  }));
}, true);
```

**콘솔 출력:**
```
이벤트 경로: [
  "<div.category-post-meta>",
  "<a.category-post-link>",
  "<div.category-post-content>",
  "<li.category-post-item>",  // 👈 여기서 이벤트가 차단됨!
  "<ul.category-posts-list>",
  ...
]
```

### 2. 실제 클릭된 요소와 현재 핸들러의 요소 비교

```javascript
document.addEventListener('click', (e) => {
  console.log('클릭된 요소 (target):', e.target);
  console.log('현재 핸들러의 요소 (currentTarget):', e.currentTarget);
  console.log('preventDefault 호출됨?', e.defaultPrevented);
}, true);
```

**차이점:**
- `e.target`: 실제로 클릭한 요소
- `e.currentTarget`: 이벤트 리스너가 등록된 요소

```javascript
// 예시
<div class="container">  👈 currentTarget (리스너가 여기 등록됨)
  <button>
    <span>클릭</span>  👈 target (실제로 클릭한 요소)
  </button>
</div>
```

### 3. 선택자 테스트하기

브라우저 콘솔에서 직접 테스트해보세요:

```javascript
// 콘솔에서 직접 실행
const tabs1 = document.querySelectorAll('[data-category]');
const tabs2 = document.querySelectorAll('.category-tab[data-category]');

console.log('모든 data-category:', tabs1.length);
console.log('탭 버튼만:', tabs2.length);

// 차이점 확인
console.log('차이:', tabs1.length - tabs2.length, '개');

// 각 요소 확인
console.group('tabs1 (모든 요소)');
tabs1.forEach(el => console.log(el.className, el.tagName));
console.groupEnd();

console.group('tabs2 (버튼만)');
tabs2.forEach(el => console.log(el.className, el.tagName));
console.groupEnd();
```

### 4. Chrome DevTools 활용

Chrome DevTools의 **Event Listeners** 패널을 활용하세요:

1. 요소를 검사 (F12)
2. **Event Listeners** 탭 클릭
3. 어떤 이벤트 리스너가 등록되어 있는지 확인
4. `Remove` 버튼으로 리스너 제거 후 동작 확인

```
Event Listeners
  ├─ click
  │   ├─ listener (category-pagination.js:123)  👈 이게 문제!
  │   └─ useCapture: false
  └─ mouseenter
      └─ listener (main.js:45)
```

---

## 실전 체크리스트

이벤트 리스너를 등록할 때 다음을 확인하세요:

- [ ] **선택자가 충분히 구체적인가?**
  - 속성만 사용하지 말고 클래스나 태그와 조합

- [ ] **선택된 요소가 의도한 것들만 포함하는가?**
  - 개발 중에는 `console.log`로 확인

- [ ] **이벤트 버블링을 고려했는가?**
  - 부모 요소에 리스너가 없는지 확인

- [ ] **`preventDefault()`를 신중하게 사용했는가?**
  - 정말 필요한 경우에만 사용

- [ ] **이벤트 위임 패턴을 고려했는가?**
  - 여러 요소에 같은 리스너를 등록할 때는 위임 고려

- [ ] **디버그 로그를 추가했는가?**
  - 개발 중에는 선택된 요소와 이벤트 흐름을 로그로 확인

---

## 시각화: 이벤트 버블링 vs 이벤트 캡처링

```
HTML 구조:
<html>
  <body>
    <div class="container">
      <ul>
        <li data-category="guides">
          <a href="/guides/seo.html">
            <div>
              <h4>SEO 가이드</h4>  👈 사용자가 여기를 클릭
            </div>
          </a>
        </li>
      </ul>
    </div>
  </body>
</html>

이벤트 전파 순서:

1. 캡처링 단계 (위에서 아래로) - useCapture: true
   html → body → div → ul → li → a → div → h4

2. 타겟 단계
   h4 (실제 클릭한 요소)

3. 버블링 단계 (아래에서 위로) - useCapture: false (기본값)
   h4 → div → a → li 👈 여기서 이벤트 차단! → ul → div → body → html
```

대부분의 이벤트 리스너는 **버블링 단계**에서 실행됩니다. 따라서 자식 요소를 클릭하면 부모 요소의 리스너도 실행됩니다.

**버블링을 막고 싶다면:**

```javascript
// 이벤트 버블링 중지
element.addEventListener('click', (e) => {
  e.stopPropagation();  // 부모로 버블링되지 않음
  // 처리 로직
});
```

**하지만 주의!** `stopPropagation()`을 남용하면 다른 리스너가 작동하지 않을 수 있습니다.

---

## 교훈과 베스트 프랙티스

### 1. 속성 선택자만 사용하지 말 것

```javascript
// ❌ 위험: 너무 포괄적
const buttons = document.querySelectorAll('[data-action]');

// ✅ 안전: 클래스와 조합
const buttons = document.querySelectorAll('.btn[data-action]');
```

### 2. 클래스와 속성을 조합하라

```javascript
// ❌ 약함
const tabs = document.querySelectorAll('[data-category]');

// ✅ 강함
const tabs = document.querySelectorAll('.category-tab[data-category]');

// ✅ 매우 강함 (필요시)
const tabs = document.querySelectorAll('.tabs-container > .category-tab[data-category]');
```

### 3. 선택된 요소를 검증하라

```javascript
const initElements = () => {
  elements.tabs = document.querySelectorAll('.category-tab[data-category]');

  // 프로덕션에서도 간단한 검증
  if (elements.tabs.length === 0) {
    console.warn('⚠️  경고: 카테고리 탭을 찾을 수 없습니다.');
  }

  // 개발 중에는 상세 검증
  if (CONFIG.DEBUG) {
    console.log('탭 개수:', elements.tabs.length);
    elements.tabs.forEach((tab, i) => {
      console.log(`Tab ${i}:`, tab.className, tab.tagName);
    });
  }
};
```

### 4. 이벤트 버블링을 이해하고 활용하라

이벤트 버블링은 **버그가 아니라 기능**입니다. 올바르게 이해하고 사용하면 강력한 도구가 됩니다.

```javascript
// 이벤트 위임으로 활용하기
document.querySelector('.category-tabs').addEventListener('click', (e) => {
  const tab = e.target.closest('.category-tab');
  if (!tab) return;

  // 버튼만 처리
  handleTabClick(tab);
});
```

### 5. 디버깅 로그를 아끼지 말라

문제가 발생하면 로그를 추가하세요. 추측하지 말고 확인하세요.

```javascript
// 디버깅을 위한 헬퍼 함수
const debugEventPath = (e) => {
  console.group('🔍 Event Debug');
  console.log('Target:', e.target);
  console.log('CurrentTarget:', e.currentTarget);
  console.log('DefaultPrevented:', e.defaultPrevented);
  console.log('Path:', e.composedPath().slice(0, 5));
  console.groupEnd();
};

// 사용
element.addEventListener('click', (e) => {
  if (CONFIG.DEBUG) debugEventPath(e);
  // 처리 로직
});
```

---

## 마무리하며

이 디버깅 경험을 통해 배운 가장 중요한 교훈은:

> **"모든 것이 예상대로 작동한다고 가정하지 말고, 확인하라."**

CSS 선택자는 강력하지만, 강력한 만큼 조심해서 사용해야 합니다. `[data-*]` 같은 속성 선택자는 편리하지만, 의도하지 않은 요소까지 선택할 수 있다는 것을 항상 기억하세요.

그리고 이벤트 버블링은 JavaScript의 핵심 개념 중 하나입니다. 이를 이해하면 더 효율적인 코드를 작성할 수 있고, 이런 버그를 미리 예방할 수 있습니다.

**다음에 비슷한 문제를 만나면:**
1. 콘솔에서 선택자를 테스트해보세요
2. 이벤트 경로를 로그로 확인하세요
3. Chrome DevTools의 Event Listeners를 활용하세요
4. 이벤트 위임 패턴을 고려하세요

여러분도 이런 문제를 만나신 적 있나요? 어떻게 해결하셨는지 궁금합니다!

---

## 관련 자료

### 공식 문서
- [MDN: Event bubbling and capturing](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#event_bubbling_and_capture) - 이벤트 버블링과 캡처링의 기초
- [MDN: querySelectorAll](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelectorAll) - CSS 선택자 활용법
- [MDN: CSS attribute selectors](https://developer.mozilla.org/en-US/docs/Web/CSS/Attribute_selectors) - 속성 선택자 문법
- [MDN: Event.composedPath()](https://developer.mozilla.org/en-US/docs/Web/API/Event/composedPath) - 이벤트 경로 추적

### 심화 학습
- [JavaScript.info: Event delegation](https://javascript.info/event-delegation) - 이벤트 위임 패턴 마스터하기
- [JavaScript.info: Bubbling and capturing](https://javascript.info/bubbling-and-capturing) - 버블링과 캡처링 심화
- [Chrome DevTools: Inspect event listeners](https://developer.chrome.com/docs/devtools/console/live-expressions/) - DevTools로 이벤트 디버깅하기

### 더 알아보기
- [Event order in DOM](https://www.quirksmode.org/js/events_order.html) - 이벤트 순서에 대한 상세 설명
- [You Don't Need jQuery](https://github.com/nefe/You-Dont-Need-jQuery#selectors) - 순수 JavaScript로 요소 선택하기

---

**이 가이드가 도움이 되셨나요?** 비슷한 문제를 겪고 계신다면, 위의 디버깅 단계를 따라해보세요. 그래도 해결이 안 된다면 이벤트 경로와 선택된 요소를 공유해주시면 함께 살펴볼 수 있습니다.

Happy debugging! 🐛🔍
