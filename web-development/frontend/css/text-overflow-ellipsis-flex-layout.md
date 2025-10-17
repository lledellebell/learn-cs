---
title: Flex 레이아웃에서 텍스트 말줄임이 안 될 때 - min-width의 비밀
description: text-overflow ellipsis를 설정했는데도 텍스트가 영역을 넘어가는 이슈, 경험해보셨나요? Flex 레이아웃에서 min-width auto의 함정과 해결 방법을 실전 예제로 알아봅니다.
date: 2025-10-17
categories: [Web Development, CSS]
tags: [CSS, Flexbox, Text Overflow, Ellipsis, Layout, min-width, Debugging]
render_with_liquid: false
layout: page
---

# Flex 레이아웃에서 텍스트 말줄임이 안 될 때

## 이런 경험 있으시죠?

```css
.description {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

분명 말줄임 처리를 위한 CSS 3종 세트를 다 적었는데, 텍스트가 부모 영역을 뚫고 나가는 현상. 저도 매번 겪었고, 매번 "왜 안 되지?"라고 당황했습니다.

특히 **Flex 레이아웃**을 사용할 때 이런 일이 자주 일어나는데요, 오늘은 그 원인과 해결 방법을 정리해봅니다.

## 실제 사례: 카테고리 페이지의 설명 텍스트

제가 최근 겪었던 실제 사례입니다. 카테고리 페이지에서 글 설명이 한 줄 말줄임 처리가 안 되는 문제였어요.

### HTML 구조

```html
<ul class="category-posts-list">
  <li class="category-post-item">
    <a href="/post" class="category-post-link">
      <div class="category-post-main">
        <h4 class="category-post-title">글 제목</h4>
        <p class="category-post-description">
          아주 긴 설명 텍스트가 여기 들어가는데 이게 한 줄로 잘리지 않고 계속 이어집니다...
        </p>
      </div>
      <div class="category-post-meta">
        <time>2025.10.17</time>
      </div>
    </a>
  </li>
</ul>
```

### 처음 시도한 CSS (실패)

```css
.category-post-description {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

**결과**: 여전히 텍스트가 영역을 벗어남 😰

## 왜 안 될까? Flex의 min-width 함정

문제는 **Flex item의 기본 `min-width` 값**에 있습니다.

### Flex item의 기본 동작

```text
Flex item의 기본값:
- min-width: auto (명시적 값이 없을 때)
- 이는 "자식 요소의 최소 콘텐츠 크기만큼은 보장한다"는 의미
```

즉, 아무리 `overflow: hidden`을 설정해도, **Flex item은 자식의 콘텐츠를 다 보여주려고** 늘어나버립니다.

### 시각적 이해

```text
❌ min-width: auto (기본값)

부모 Container (width: 300px)
  │
  └─ Flex item (.category-post-link)
      │  min-width: auto
      │  → 자식 콘텐츠 크기에 맞춰 늘어남
      │
      └─ 자식 (.category-post-description)
          "아주아주 긴 텍스트가 계속 이어집니다..." (400px)

결과: Flex item이 400px로 늘어나서 부모를 벗어남!


✅ min-width: 0 (명시적 설정)

부모 Container (width: 300px)
  │
  └─ Flex item (.category-post-link)
      │  min-width: 0
      │  → 부모 크기를 넘지 않음
      │
      └─ 자식 (.category-post-description)
          overflow: hidden
          text-overflow: ellipsis

결과: 300px에서 말줄임 처리됨! ✨
```

## 해결 방법: 모든 Flex 단계에 min-width: 0

핵심은 **텍스트가 있는 요소부터 최상위 Flex container까지 모든 단계**에 `min-width: 0`을 설정하는 것입니다.

### 단계별 적용

```css
/* 1. 최상위 리스트 아이템 */
.category-post-item {
  margin: 0;
  min-width: 0;  /* ✅ 추가 */
}

/* 2. Flex container인 링크 요소 */
.category-post-link {
  display: flex;
  flex-direction: column;
  /* ... */
  width: 100%;      /* ✅ 추가 */
  min-width: 0;     /* ✅ 추가 */
}

/* 3. 중간 wrapper */
.category-post-main {
  flex: 1;
  min-width: 0;     /* ✅ 추가 */
}

/* 4. 최종 텍스트 요소 */
.category-post-description {
  /* 기본 말줄임 3종 세트 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  /* Flex 대응 */
  min-width: 0;     /* ✅ 추가 */
  max-width: 100%;  /* ✅ 추가 */
}
```

### 왜 모든 단계에 필요할까?

```text
Flex 레이아웃의 크기 계산 흐름:

부모 Flex container
  ↓ "자식의 min-width만큼은 보장해야지"
자식 Flex item
  ↓ "내 자식의 min-width만큼은 보장해야지"
손자 Flex item
  ↓ "내 자식(텍스트)의 콘텐츠 크기만큼은..."
텍스트

각 단계마다 min-width: auto가 연쇄적으로 작용!
→ 모든 단계에서 min-width: 0으로 끊어줘야 함
```

## 실전 예제 모음

### 예제 1: 카드 레이아웃

```html
<div class="card">
  <div class="card-body">
    <h3 class="card-title">제목</h3>
    <p class="card-description">긴 설명...</p>
  </div>
</div>
```

```css
.card {
  display: flex;
  flex-direction: column;
  width: 300px;
}

.card-body {
  flex: 1;
  min-width: 0;  /* ✅ */
}

.card-description {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;  /* ✅ */
}
```

### 예제 2: 가로 레이아웃 (이미지 + 텍스트)

```html
<div class="item">
  <img src="thumb.jpg" class="item-image">
  <div class="item-content">
    <h4 class="item-title">제목</h4>
    <p class="item-description">긴 설명...</p>
  </div>
</div>
```

```css
.item {
  display: flex;
  gap: 16px;
  width: 400px;
}

.item-image {
  flex-shrink: 0;
  width: 80px;
  height: 80px;
}

.item-content {
  flex: 1;
  min-width: 0;  /* ✅ 필수! */
}

.item-description {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;  /* ✅ */
}
```

**주의**: `flex: 1`을 쓴 요소에는 **반드시** `min-width: 0`을 함께 써야 합니다!

### 예제 3: 중첩 Flex (더 복잡한 경우)

```html
<div class="container">
  <div class="sidebar">사이드바</div>
  <div class="main">
    <div class="content">
      <h2 class="content-title">제목</h2>
      <p class="content-text">긴 텍스트...</p>
    </div>
  </div>
</div>
```

```css
.container {
  display: flex;
  width: 100%;
}

.sidebar {
  flex-shrink: 0;
  width: 200px;
}

.main {
  flex: 1;
  min-width: 0;  /* ✅ 1단계 */
}

.content {
  /* 또 다른 Flex container라면 */
  display: flex;
  flex-direction: column;
  min-width: 0;  /* ✅ 2단계 */
}

.content-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;  /* ✅ 3단계 */
}
```

## 디버깅 체크리스트

말줄임이 안 될 때 순서대로 확인해보세요.

```markdown
### 1단계: 기본 설정 확인
- [ ] overflow: hidden
- [ ] text-overflow: ellipsis
- [ ] white-space: nowrap

### 2단계: Flex 관련 확인
- [ ] 부모가 Flex container인가?
- [ ] 텍스트 요소에 min-width: 0 있나?
- [ ] max-width: 100% 있나?

### 3단계: 상위 요소 확인
- [ ] 모든 상위 Flex item에 min-width: 0 있나?
- [ ] flex: 1을 쓴 요소에 min-width: 0 있나?

### 4단계: width 확인
- [ ] Flex container에 명시적 width가 있나?
- [ ] 또는 부모로부터 width를 상속받나?
```

### 개발자 도구로 확인하기

```text
Chrome DevTools에서:

1. 요소 검사로 텍스트 요소 선택
2. Computed 탭에서 확인:
   - min-width: auto → ❌ 문제!
   - min-width: 0px → ✅ 정상

3. 부모 요소도 확인:
   - 상위 Flex item들의 min-width 값 확인
   - flex: 1이 있으면 min-width도 있는지 확인
```

## 브라우저 호환성

`min-width: 0`은 CSS 표준이므로 모든 모던 브라우저에서 동작합니다.

```css
/* 모든 브라우저에서 동작 */
.flex-item {
  min-width: 0;
}

/* IE11도 지원 필요하다면 */
.flex-item {
  min-width: 0;
  flex-basis: 0;  /* IE11 fallback */
}
```

## Grid 레이아웃에서는?

Grid도 비슷한 문제가 있습니다!

```css
/* Grid item도 min-width: 0 필요 */
.grid-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.grid-item {
  min-width: 0;  /* ✅ Grid에서도 필요 */
}

.grid-item-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;  /* ✅ */
}
```

## 여러 줄 말줄임은?

한 줄이 아니라 여러 줄 말줄임이 필요하다면 `-webkit-line-clamp`를 사용합니다.

```css
.multi-line-ellipsis {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;  /* 2줄까지 표시 */
  overflow: hidden;

  /* Flex에서는 여전히 필요 */
  min-width: 0;
}
```

**주의**: 여러 줄 말줄임에서는 `white-space: nowrap`을 **빼야** 합니다!

## 실무 팁

### 1. 유틸리티 클래스 만들기

```css
/* 한 줄 말줄임 유틸리티 */
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  max-width: 100%;
}

/* Flex item 유틸리티 */
.flex-truncate {
  min-width: 0;
}

/* 사용 */
.item-content {
  flex: 1;
  /* 항상 같이 쓰기 */
}
```

```html
<div class="item-content flex-truncate">
  <p class="truncate">긴 텍스트...</p>
</div>
```

### 2. Tailwind CSS 사용 시

```html
<!-- Tailwind에서는 min-w-0 유틸리티 제공 -->
<div class="flex">
  <div class="flex-1 min-w-0">
    <p class="truncate">긴 텍스트...</p>
  </div>
</div>
```

### 3. CSS-in-JS에서 패턴화

```jsx
// React + styled-components
const TruncatedText = styled.p`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  max-width: 100%;
`;

const FlexItem = styled.div`
  flex: 1;
  min-width: 0;
`;

function Component() {
  return (
    <FlexContainer>
      <FlexItem>
        <TruncatedText>긴 텍스트...</TruncatedText>
      </FlexItem>
    </FlexContainer>
  );
}
```

## 비교표: 각 속성의 역할

| 속성 | 역할 | 필수 여부 | 적용 대상 |
|------|------|-----------|-----------|
| `overflow: hidden` | 넘치는 콘텐츠 숨김 | 필수 | 텍스트 요소 |
| `text-overflow: ellipsis` | `...` 표시 | 필수 | 텍스트 요소 |
| `white-space: nowrap` | 줄바꿈 방지 | 필수 (한 줄) | 텍스트 요소 |
| `min-width: 0` | Flex 크기 제한 해제 | Flex 사용 시 필수 | **모든 상위 Flex item** |
| `max-width: 100%` | 부모 초과 방지 | 권장 | 텍스트 요소 |
| `width: 100%` | 명시적 너비 | Flex container 시 권장 | Flex container |

## 정리

### 핵심 원칙

```text
Flex 레이아웃에서 텍스트 말줄임:

1. 기본 3종 세트 (텍스트 요소)
   - overflow: hidden
   - text-overflow: ellipsis
   - white-space: nowrap

2. Flex 대응 (모든 Flex item)
   - min-width: 0

3. 안전장치
   - max-width: 100%
   - width: 100% (container)
```

### 빠른 해결 템플릿

```css
/* Flex container */
.container {
  display: flex;
  width: 100%;  /* 또는 고정값 */
}

/* 중간 Flex item (있다면) */
.flex-item {
  flex: 1;
  min-width: 0;  /* 🔑 핵심! */
}

/* 텍스트 요소 */
.text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;      /* 🔑 핵심! */
  max-width: 100%;
}
```

### 기억할 것

> **"Flex에서는 min-width: 0을 잊지 말자!"**

- Flex item은 기본적으로 `min-width: auto`
- 이는 자식 콘텐츠 크기를 보장하려고 함
- 텍스트 말줄임을 원하면 `min-width: 0`으로 해제
- **모든 상위 Flex item에도 적용** 필요

## 관련 이슈

비슷한 문제를 겪는 다른 상황들:

```css
/* 1. 긴 URL이 레이아웃을 깨뜨릴 때 */
.url {
  overflow-wrap: break-word;
  word-break: break-all;
  min-width: 0;
}

/* 2. 긴 코드 블록이 넘칠 때 */
.code-block {
  overflow-x: auto;
  min-width: 0;
}

/* 3. 표 안에서 말줄임 */
td {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

## 참고 자료

- [MDN: min-width](https://developer.mozilla.org/en-US/docs/Web/CSS/min-width)
- [MDN: text-overflow](https://developer.mozilla.org/en-US/docs/Web/CSS/text-overflow)
- [CSS Tricks: Flexbox](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)
- [W3C Flexbox Spec](https://www.w3.org/TR/css-flexbox-1/#min-size-auto)

---

다음에 텍스트 말줄임이 안 될 때, "아, min-width: 0!"이라고 바로 떠올리시면 성공입니다! 😊
