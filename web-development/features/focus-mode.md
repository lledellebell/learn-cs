---
layout: page
title: "포커스 모드 (Focus Mode)"
description: "산만한 콘텐트는 가리고, 지금 읽는 부분에만 집중하세요"
category: features
tags: [ux, reading, focus, accessibility]
date: 2025-10-17
---

# 포커스 모드 (Focus Mode)

긴 기술 문서를 읽다 보면, 화면에 너무 많은 정보가 한 번에 보여서 집중이 어려웠던 경험 있으신가요?

저도 처음 이 사이트에 긴 글을 작성하고 나서, "이 글 읽기 참 피곤하다"는 생각을 했습니다. 수많은 문단과 코드 블록이 동시에 눈에 들어오면서, **정작 지금 읽어야 할 부분에 집중하기 어려웠죠.**

그래서 만든 것이 **포커스 모드**입니다.

## 포커스 모드란?

포커스 모드는 현재 읽고 있는 문단만 선명하게 보여주고, 나머지 콘텐트는 흐릿하게 처리하는 기능입니다.

마치 책을 읽을 때 손으로 한 줄을 짚어가며 읽는 것처럼, **시선이 자연스럽게 집중되도록 돕습니다.**

### Before (일반 모드)

```
문단 1: 완전히 선명
문단 2: 완전히 선명
문단 3: 완전히 선명  ← 지금 읽고 있는 부분
문단 4: 완전히 선명
문단 5: 완전히 선명
```

모든 문단이 동일한 밝기로 보이기 때문에, 어디를 읽고 있는지 놓치기 쉽습니다.

### After (포커스 모드)

```
문단 1: 흐릿함 (opacity: 0.3)
문단 2: 흐릿함 (opacity: 0.3)
문단 3: 선명함 (opacity: 1.0)  ← 지금 읽고 있는 부분
문단 4: 흐릿함 (opacity: 0.3)
문단 5: 흐릿함 (opacity: 0.3)
```

현재 읽는 부분만 선명하게 보이므로, **자연스럽게 시선이 집중**됩니다.

## 어떻게 사용하나요?

### 1. 버튼으로 활성화

화면 왼쪽 하단에 있는 **눈 모양 아이콘(👁️)**을 클릭하면 포커스 모드가 켜집니다.

```
┌─────────────────────────────────┐
│                                 │
│  ← 네비게이션 바                   │
│                                 │
│  문서 콘텐트                       │
│                                 │
│                                 │
│                                 │
│                                 │
│                                 │
│  👁️ (좌측 하단)       ⬆ (우측 하단) │
└─────────────────────────────────┘
```

버튼을 다시 클릭하면 포커스 모드가 꺼집니다.

### 2. 키보드 단축키

문서를 읽는 중에 **`Ctrl + Shift + F`** (맥: `Cmd + Shift + F`)를 누르면 포커스 모드가 토글됩니다.

> ⚠️ **주의**: 입력 필드(input, textarea)에서는 동작하지 않습니다. 브라우저의 기본 검색 기능과 충돌을 방지하기 위해 Shift 키를 함께 사용합니다.

## 어떻게 동작하나요?

### 데스크톱: 스크롤 기반 강조

스크롤을 내리면, **뷰포트 중앙에 가장 가까운 요소**를 자동으로 강조합니다.

```javascript
// 핵심 로직 (간소화)
const highlightVisibleElement = () => {
  const elements = articleBody.querySelectorAll(':scope > p, :scope > .highlighter-rouge, ...');
  const centerY = scrollTop + viewportHeight / 2;

  let closestElement = null;
  let closestDistance = Infinity;

  elements.forEach(element => {
    const elementCenter = scrollTop + rect.top + rect.height / 2;
    const distance = Math.abs(centerY - elementCenter);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestElement = element;
    }
  });

  closestElement.classList.add('focused');
};
```

**왜 이렇게 동작하나요?**

사람의 시선은 자연스럽게 화면 중앙에 머물기 때문입니다. 스크롤을 하면서 중앙에 오는 요소를 강조하면, **읽는 흐름이 끊기지 않습니다.**

### 모바일: 터치 기반 강조 + 스크롤 시 버튼 숨김

모바일에서는 스크롤로 강조하는 것 외에도, **직접 터치한 요소를 강조**할 수 있습니다.

또한, 모바일에서 **스크롤 방향에 따라 포커스 모드 버튼과 맨위로 버튼이 자동으로 숨겨지거나 표시**됩니다:

- **아래로 스크롤**: 버튼이 화면 아래로 숨겨집니다 (콘텐츠 읽기에 집중)
- **위로 스크롤**: 버튼이 다시 나타납니다 (필요할 때 접근 가능)
- **상단 근처**: 항상 버튼이 표시됩니다

이를 통해 iOS와 같은 모바일 기기에서 작은 화면을 더 효율적으로 활용할 수 있습니다.

```javascript
articleBody.addEventListener('touchstart', (e) => {
  if (!isFocusMode) return;

  // 터치한 요소 찾기
  let target = e.target;
  while (target && target !== articleBody) {
    if (target.parentElement === articleBody) {
      // p, .highlighter-rouge, blockquote, h1-h6, ul, ol, table 등
      break;
    }
    target = target.parentElement;
  }

  // 기존 강조 제거
  articleBody.querySelectorAll('.focused').forEach(el => el.classList.remove('focused'));

  // 터치한 요소 강조
  target.classList.add('focused');

  // 3초 후 스크롤 기반 강조로 복귀
  setTimeout(() => {
    highlightVisibleElement();
  }, 3000);
});
```

**왜 모바일에서는 터치도 지원하나요?**

모바일에서는 스크롤 속도가 빠르고, 손가락으로 특정 부분을 가리키는 행동이 자연스럽기 때문입니다. **직접 터치한 부분을 강조하면 더 직관적**입니다.

## 시각적 피드백

### 버튼 상태 변화

포커스 모드가 켜지면, 버튼의 배경색이 바뀝니다.

```css
/* 일반 상태 */
.focus-mode-toggle {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.1);
}

/* 활성 상태 */
.focus-mode-toggle.active {
  background: rgba(116, 251, 132, 0.95); /* 라이트 그린 */
  border-color: rgba(116, 251, 132, 0.3);
}

/* 다크 모드 활성 상태 */
[data-theme="dark"] .focus-mode-toggle.active {
  background: rgba(244, 255, 125, 0.95); /* 옐로우 그린 */
  border-color: rgba(244, 255, 125, 0.3);
}
```

초록/노란색 계열을 사용한 이유는, **"집중"과 "활성화"를 시각적으로 잘 나타내는 색상**이기 때문입니다.

### 목차(TOC)와 연동

포커스 모드에서는 목차에도 시각적 변화가 생깁니다.

```css
/* 읽은 섹션 표시 */
.focus-mode .toc-list li::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-border);
}

/* 읽은 섹션 (초록 점) */
.focus-mode .toc-list li.read::before {
  background: rgba(116, 251, 132, 0.4);
  box-shadow: 0 0 8px rgba(116, 251, 132, 0.6);
}

/* 현재 읽는 섹션 (더 밝은 초록 점) */
.focus-mode .toc-list a.active ~ li::before {
  background: rgba(116, 251, 132, 0.8);
  transform: scale(1.2);
}
```

목차를 보면 **어디까지 읽었는지 한눈에 파악**할 수 있습니다.

## 접근성 (Accessibility)

포커스 모드는 접근성을 고려하여 설계되었습니다.

### ARIA 속성

```html
<button
  type="button"
  id="focusModeToggle"
  class="focus-mode-toggle"
  aria-label="포커스 모드 전환"
  aria-pressed="false"
  data-tooltip="포커스 모드">
  <!-- 아이콘 -->
</button>
```

- **`aria-label`**: 스크린 리더가 "포커스 모드 전환 버튼"이라고 읽어줍니다
- **`aria-pressed`**: 버튼이 눌린 상태인지 알려줍니다 (true/false)
- **`data-tooltip`**: 마우스를 올렸을 때 툴팁 표시

### 키보드 지원

- **`Ctrl + Shift + F` / `Cmd + Shift + F`**: 포커스 모드 토글
- **`Tab`**: 버튼으로 이동 가능
- **`Enter` / `Space`**: 버튼 클릭

### 상태 저장

포커스 모드 상태는 로컬 스토리지에 저장됩니다.

```javascript
// 포커스 모드 활성화 시
localStorage.setItem('focusMode', true);

// 페이지 로드 시
const savedFocusMode = localStorage.getItem('focusMode') === 'true';
if (savedFocusMode) {
  // 포커스 모드 자동 활성화
}
```

한 번 켜두면 **다른 페이지에서도 계속 유지**됩니다.

## 성능 최적화

### 1. requestAnimationFrame 사용

스크롤 이벤트는 매우 빈번하게 발생하므로, **throttling**을 적용했습니다.

```javascript
let ticking = false;

window.addEventListener('scroll', () => {
  if (!ticking) {
    window.requestAnimationFrame(() => {
      highlightVisibleElement();
      ticking = false;
    });
    ticking = true;
  }
});
```

**왜 이렇게 하나요?**

스크롤 이벤트는 1초에 수십 번 발생할 수 있습니다. 매번 DOM을 업데이트하면 성능이 떨어지므로, **브라우저의 다음 리페인트 시점에 한 번만 실행**하도록 합니다.

### 2. 중복 업데이트 방지

동일한 요소를 다시 강조하지 않도록 체크합니다.

```javascript
let currentFocusedElement = null;

const highlightVisibleElement = () => {
  // ...요소 찾기 로직

  // 동일한 요소면 업데이트하지 않음 (깜빡임 방지)
  if (closestElement === currentFocusedElement) {
    return;
  }

  currentFocusedElement = closestElement;
  // 강조 업데이트...
};
```

**왜 필요한가요?**

DOM 조작은 비용이 큽니다. 이미 강조된 요소를 다시 강조하면, **불필요한 리플로우가 발생**합니다.

### 3. will-change 사용

CSS에서 `will-change` 속성을 사용해 브라우저에게 최적화 힌트를 줍니다.

```css
body.focus-mode .article-body > * {
  opacity: 0.3;
  transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: opacity; /* GPU 가속 활성화 */
}
```

**왜 사용하나요?**

`will-change`를 사용하면 브라우저가 해당 속성의 변경을 미리 예측하고, **GPU 레이어를 생성하여 애니메이션을 부드럽게** 만듭니다.

## 함정과 주의사항

### ❌ 실수 1: 모든 요소에 포커스 모드 적용

```javascript
// ❌ 나쁜 예
const elements = document.querySelectorAll('*');
```

**문제점**: 페이지의 모든 요소를 선택하면 성능이 떨어집니다. 또한 헤더, 푸터, 사이드바까지 흐려지면 오히려 사용자 경험이 나빠집니다.

```javascript
// ✅ 좋은 예
const elements = articleBody.querySelectorAll(':scope > p, :scope > .highlighter-rouge, ...');
```

**해결책**: article-body의 직접 자식 요소만 선택합니다. `:scope >`를 사용하면 정확히 **1단계 자식만** 선택할 수 있습니다.

### ❌ 실수 2: CSS transition 없이 opacity 변경

```css
/* ❌ 나쁜 예 */
body.focus-mode .article-body > * {
  opacity: 0.3;
  /* transition 없음 */
}
```

**문제점**: 스크롤할 때마다 요소가 즉시 밝아졌다 어두워지면서, **눈이 피로**해집니다.

```css
/* ✅ 좋은 예 */
body.focus-mode .article-body > * {
  opacity: 0.3;
  transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
```

**해결책**: 부드러운 easing 함수를 사용해 자연스럽게 전환합니다.

### ❌ 실수 3: 브라우저 기본 검색(Ctrl+F)을 막기

```javascript
// ❌ 나쁨
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
    e.preventDefault(); // 항상 막음
    toggleFocusMode();
  }
});
```

**문제점**: 사용자가 검색 기능을 사용하려 해도 막히기 때문에 불편합니다.

```javascript
// ✅ 좋은 예
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'f' && e.shiftKey) {
    // 입력 필드가 아닐 때만 포커스 모드 토글
    const isInputField = document.activeElement.tagName === 'INPUT' ||
                        document.activeElement.tagName === 'TEXTAREA' ||
                        document.activeElement.isContentEditable;

    if (!isInputField) {
      e.preventDefault();
      toggleFocusMode();
    }
  }
});
```

**해결책**: Shift 키를 조합키로 추가하고 (Ctrl+Shift+F), 입력 필드가 아닐 때만 동작하도록 합니다.

## 실전 활용 팁

### 1. 긴 튜토리얼 읽을 때

긴 코드 예제가 많은 튜토리얼을 읽을 때 포커스 모드를 켜면, **현재 읽는 코드 블록만 선명하게** 보입니다.

```javascript
// 이 코드를 읽고 있을 때, 다른 코드는 흐릿하게 보임
function example() {
  console.log('Focus!');
}
```

### 2. 스크롤 속도 조절

포커스 모드는 **천천히 스크롤**할 때 가장 효과적입니다. 빠르게 스크롤하면 강조가 계속 바뀌어서 오히려 산만할 수 있습니다.

### 3. 모바일에서 터치로 읽기 순서 표시

모바일에서 읽다가 잠시 다른 곳을 보고 돌아왔을 때, **어디까지 읽었는지 모르겠다면** 마지막으로 읽은 부분을 터치하세요. 그 부분이 강조됩니다.

### 4. 목차와 함께 사용

포커스 모드는 목차와 함께 사용하면 더욱 효과적입니다. 목차를 보면 **전체 구조를 파악하고, 포커스 모드로 현재 위치를 확인**할 수 있습니다.

## 브라우저 지원

포커스 모드는 다음 브라우저를 지원합니다:

| 브라우저 | 최소 버전 | 비고 |
|---------|---------|------|
| Chrome  | 88+     | ✅ 완벽 지원 |
| Firefox | 87+     | ✅ 완벽 지원 |
| Safari  | 14+     | ✅ 완벽 지원 (backdrop-filter 포함) |
| Edge    | 88+     | ✅ 완벽 지원 |
| Opera   | 74+     | ✅ 완벽 지원 |

> ⚠️ **IE 11**: 지원하지 않습니다. (IntersectionObserver, CSS variables 미지원)

## 코드 구현

전체 코드는 다음 파일에서 확인할 수 있습니다:

- **JavaScript (포커스 모드)**: [`assets/js/main.js:1093-1259`](/Users/b/personal/learn-cs/assets/js/main.js#L1093-L1259)
- **JavaScript (모바일 버튼 스크롤)**: [`assets/js/main.js:1325-1406`](/Users/b/personal/learn-cs/assets/js/main.js#L1325-L1406)
- **CSS**: [`assets/css/custom.css:2202-2406`](/Users/b/personal/learn-cs/assets/css/custom.css#L2202-L2406)
- **HTML**: [`_layouts/page.html:14-20`](/Users/b/personal/learn-cs/_layouts/page.html#L14-L20)

### 핵심 코드 흐름

```
1. 페이지 로드
   ↓
2. initFocusMode() 호출
   ↓
3. localStorage에서 상태 불러오기
   ↓
4. 버튼 클릭 또는 단축키 감지
   ↓
5. toggleFocusMode()
   ↓
6. body에 .focus-mode 클래스 추가
   ↓
7. 스크롤 이벤트 리스너 등록
   ↓
8. highlightVisibleElement() 호출
   ↓
9. 뷰포트 중앙 요소 찾기
   ↓
10. .focused 클래스 추가
```

## 마치며

포커스 모드는 **긴 글을 읽을 때 집중력을 높이기 위한 작은 실험**에서 시작되었습니다.

실제로 사용해보니, 단순히 흐릿하게 만드는 것만으로도 **읽는 속도가 빨라지고, 놓치는 부분이 줄어드는** 효과를 느꼈습니다.

여러분도 긴 문서를 읽을 때 포커스 모드를 켜보세요. 집중력이 확실히 달라질 거예요! 👁️

---

## 참고 자료

- [IntersectionObserver API - MDN](https://developer.mozilla.org/ko/docs/Web/API/Intersection_Observer_API)
- [requestAnimationFrame - MDN](https://developer.mozilla.org/ko/docs/Web/API/window/requestAnimationFrame)
- [will-change - MDN](https://developer.mozilla.org/ko/docs/Web/CSS/will-change)
- [ARIA: button role - MDN](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/button_role)

## 다음에 읽을 글

- [다크 모드 구현하기](../features/dark-mode.md)
- [목차 자동 생성](../features/table-of-contents.md)
- [스크롤 진행률 표시](../features/reading-progress.md)
