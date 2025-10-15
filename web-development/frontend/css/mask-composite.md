---
title: CSS Mask Composite
date: 2025-10-02
last_modified_at: 2025-10-13
categories: [Web Development]
tags: [HTTP, Authentication, Security, Chrome DevTools, User Agent, Testing]
layout: page
---
# CSS로 매직 같은 이미지 합성 효과 만들기: mask-composite 완벽 가이드

웹사이트를 둘러보다가 이런 멋진 효과를 본 적 있나요? 텍스트 안에 비디오가 재생되거나, 이미지가 복잡한 도형으로 잘려 나가거나, 여러 이미지가 마치 포토샵에서 레이어 블렌딩을 한 것처럼 합성되는 효과요. "이거 분명 복잡한 이미지 편집 프로그램으로 만들었겠지"라고 생각했다면, 놀라운 소식이 있습니다. CSS의 `mask-composite` 속성 하나면 이 모든 것이 가능합니다.

저도 처음에는 마스킹이라고 하면 단순히 이미지를 동그랗게 자르거나 특정 모양으로 자르는 정도로만 생각했습니다. 하지만 `mask-composite`를 알게 된 후로는 웹에서 할 수 있는 시각적 표현의 한계가 완전히 달라졌습니다. 이제는 디자이너가 요청하는 복잡한 효과를 "이건 CSS로는 안 돼요" 대신 "30분만 주세요"라고 말할 수 있게 되었죠.

## 왜 mask-composite를 배워야 할까요?

### 1. 복잡한 비주얼 효과를 코드로 구현

상상해보세요. 마케팅 팀에서 히어로 섹션에 "두 개의 원이 겹치는 부분에만 이미지가 보이는" 효과를 원한다고 합니다. 예전 같았으면:

1. 디자이너에게 요청해서 정확한 크기의 마스크 이미지를 만들고
2. 반응형으로 만들려면 여러 사이즈를 준비하고
3. 위치나 크기를 조정하려면 다시 이미지를 만들어야 하고
4. 애니메이션을 넣으려면... 포기하거나 Canvas를 쓰거나

하지만 `mask-composite`를 사용하면:

```css
.hero-image {
  mask-image:
    radial-gradient(circle at 30% 50%, black 150px, transparent 150px),
    radial-gradient(circle at 70% 50%, black 150px, transparent 150px);
  mask-composite: intersect;
  -webkit-mask-composite: source-in;
}
```

이게 전부입니다. 크기 조정? `150px`만 바꾸면 됩니다. 위치 조정? `30%`, `70%`만 수정하면 됩니다. 애니메이션? `@keyframes`로 자유롭게 가능합니다.

### 2. 퍼포먼스와 유연성의 균형

이미지 파일을 사용하는 대신 CSS로 마스킹 효과를 만들면:

- **파일 용량 절감**: 복잡한 PNG 마스크 이미지가 필요 없습니다
- **HTTP 요청 감소**: 추가 이미지를 다운로드할 필요가 없습니다
- **반응형 자동 대응**: CSS로 모든 화면 크기에 대응합니다
- **동적 변경 가능**: JavaScript로 실시간으로 효과를 변경할 수 있습니다
- **애니메이션 성능**: GPU 가속을 받아 부드럽게 동작합니다

### 3. 창의적인 디자인의 무한한 가능성

`mask-composite`는 단순히 이미지를 자르는 것을 넘어서:

- **텍스트 속 비디오**: 텍스트 안에서 비디오가 재생되는 효과
- **홀로그램 효과**: 여러 레이어를 겹쳐 미래지향적인 UI
- **아티스틱 이미지 전환**: 페이지 전환 시 창의적인 reveal 효과
- **인터랙티브 호버**: 마우스를 따라다니는 복잡한 마스크 효과
- **데이터 시각화**: 차트나 그래프를 더 시각적으로 표현

경험해본 적 있나요? 사용자가 "이거 어떻게 만든 거예요?"라고 물어보는 순간의 뿌듯함을요.

## 기본 개념: 마스킹이란?

마스킹을 이해하려면 먼저 "마스크"가 무엇인지 알아야 합니다. 포토샵이나 일러스트레이터를 사용해봤다면 익숙한 개념일 텐데요.

### 마스크의 원리

```
원본 이미지               마스크 이미지              결과
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│             │         │   ████████  │         │             │
│    고양이    │    +    │   ████████  │    =    │    ██고양█   │
│    사진      │         │   ██████    │         │    ██이██    │
│             │         │             │         │             │
└─────────────┘         └─────────────┘         └─────────────┘
```

- **검은색 부분**: 이미지가 보입니다
- **투명한 부분**: 이미지가 숨겨집니다
- **회색 부분**: 이미지가 반투명으로 보입니다

CSS에서는 이런 마스크를 여러 가지 방법으로 만들 수 있습니다:

```css
/* 1. 그라디언트를 마스크로 */
.element {
  mask-image: linear-gradient(to right, black, transparent);
}

/* 2. SVG를 마스크로 */
.element {
  mask-image: url('mask.svg');
}

/* 3. PNG 이미지를 마스크로 */
.element {
  mask-image: url('mask.png');
}

/* 4. 여러 마스크를 동시에 */
.element {
  mask-image:
    linear-gradient(black, black),
    radial-gradient(circle, black, transparent);
}
```

### mask-composite가 필요한 순간

하나의 마스크만 사용할 때는 간단합니다. 하지만 **여러 마스크를 동시에 사용**할 때 문제가 생깁니다:

```css
.complex-effect {
  mask-image:
    radial-gradient(circle at 50% 50%, black 100px, transparent 100px),
    radial-gradient(circle at 60% 60%, black 80px, transparent 80px);
  /* 이 두 원을 어떻게 합성할까? */
}
```

- 두 원이 **겹치는 부분만** 보여줄까요? (교집합)
- 두 원 중 **하나라도 덮는 부분**을 보여줄까요? (합집합)
- 첫 번째 원에서 **두 번째 원을 뺀 부분**만 보여줄까요? (차집합)
- 두 원이 **겹치지 않는 부분만** 보여줄까요? (배타적 OR)

바로 이걸 결정하는 것이 `mask-composite`입니다!

## mask-composite 연산: 네 가지 마법

`mask-composite`는 네 가지 합성 연산을 제공합니다. 각각의 효과를 실제 코드와 함께 자세히 살펴보겠습니다.

### 1. add (합집합)

두 마스크 중 **하나라도 검은색인 부분**에서 이미지가 보입니다.

```
마스크 1    마스크 2    add 결과
  ███       ███        ███████
  ███        ███       ███████
  ███         ███      ███████
```

```css
.mask-add {
  mask-image:
    radial-gradient(circle at 30% 50%, black 100px, transparent 100px),
    radial-gradient(circle at 70% 50%, black 100px, transparent 100px);
  mask-composite: add;
  -webkit-mask-composite: source-over;
}
```

**실전 활용**: 여러 영역을 동시에 보여주고 싶을 때

```html
<style>
.spotlight-multiple {
  width: 600px;
  height: 400px;
  background: url('city-night.jpg') center/cover;
  mask-image:
    radial-gradient(circle at 25% 50%, black 80px, transparent 80px),
    radial-gradient(circle at 50% 50%, black 80px, transparent 80px),
    radial-gradient(circle at 75% 50%, black 80px, transparent 80px);
  mask-composite: add;
  -webkit-mask-composite: source-over;
}
</style>

<div class="spotlight-multiple"></div>
```

**결과**: 세 개의 스포트라이트가 동시에 이미지를 비추는 효과

### 2. subtract (차집합)

첫 번째 마스크에서 **두 번째 마스크를 뺀 부분**만 보입니다.

```
마스크 1    마스크 2    subtract 결과
  ███       ███        ██
  ███        ███       ██
  ███         ███      ██
```

```css
.mask-subtract {
  mask-image:
    linear-gradient(black, black),
    radial-gradient(circle at center, black 100px, transparent 100px);
  mask-composite: subtract;
  -webkit-mask-composite: source-out;
}
```

**실전 활용**: 도넛 모양이나 프레임 효과

```html
<style>
.donut-frame {
  width: 300px;
  height: 300px;
  background: url('profile.jpg') center/cover;
  /* 전체에서 중앙 원을 뺌 */
  mask-image:
    linear-gradient(black, black),
    radial-gradient(circle at center, black 80px, transparent 80px);
  mask-composite: subtract;
  -webkit-mask-composite: source-out;
}

.ring-text {
  width: 400px;
  height: 200px;
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
  /* 외부 타원에서 내부 타원을 뺌 */
  mask-image:
    radial-gradient(ellipse 200px 100px at center, black 100%, transparent 100%),
    radial-gradient(ellipse 160px 80px at center, black 100%, transparent 100%);
  mask-composite: subtract;
  -webkit-mask-composite: source-out;
}
</style>

<div class="donut-frame"></div>
<div class="ring-text">
  <p style="text-align: center; line-height: 200px; color: white;">
    링 안의 텍스트는 보이지 않음
  </p>
</div>
```

**결과**: 테두리만 남은 프레임 효과

### 3. intersect (교집합)

두 마스크가 **모두 검은색인 부분**만 보입니다.

```
마스크 1    마스크 2    intersect 결과
  ███       ███          ██
  ███        ███         ██
  ███         ███        ██
```

```css
.mask-intersect {
  mask-image:
    radial-gradient(circle at 30% 50%, black 150px, transparent 150px),
    radial-gradient(circle at 70% 50%, black 150px, transparent 150px);
  mask-composite: intersect;
  -webkit-mask-composite: source-in;
}
```

**실전 활용**: 렌즈 오버랩, 벤 다이어그램 교집합 효과

```html
<style>
.venn-overlap {
  width: 500px;
  height: 300px;
  background: url('abstract-art.jpg') center/cover;
  mask-image:
    radial-gradient(circle at 35% 50%, black 120px, transparent 120px),
    radial-gradient(circle at 65% 50%, black 120px, transparent 120px);
  mask-composite: intersect;
  -webkit-mask-composite: source-in;
  transition: mask-position 0.3s;
}

.venn-overlap:hover {
  mask-position: 10px 0, -10px 0;
}
</style>

<div class="venn-overlap"></div>
```

**결과**: 두 원이 겹치는 렌즈 모양 부분만 이미지가 보임

### 4. exclude (배타적 OR)

두 마스크가 **겹치지 않는 부분**만 보입니다. 겹치는 부분은 숨겨집니다.

```
마스크 1    마스크 2    exclude 결과
  ███       ███        ██  ███
  ███        ███       ██  ███
  ███         ███      ██  ███
```

```css
.mask-exclude {
  mask-image:
    radial-gradient(circle at 30% 50%, black 100px, transparent 100px),
    radial-gradient(circle at 70% 50%, black 100px, transparent 100px);
  mask-composite: exclude;
  -webkit-mask-composite: xor;
}
```

**실전 활용**: 오버랩을 강조하는 디자인, 크리에이티브 로고

```html
<style>
.creative-cutout {
  width: 500px;
  height: 300px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  mask-image:
    radial-gradient(circle at 40% 50%, black 130px, transparent 130px),
    radial-gradient(circle at 60% 50%, black 130px, transparent 130px);
  mask-composite: exclude;
  -webkit-mask-composite: xor;
}

.text-cutout-exclude {
  width: 600px;
  height: 200px;
  background: url('sunset.jpg') center/cover;
  /* 텍스트를 제외한 부분만 보이기 */
  mask-image:
    linear-gradient(black, black),
    url('text-mask.svg');
  mask-composite: exclude;
  -webkit-mask-composite: xor;
}
</style>

<div class="creative-cutout"></div>
```

**결과**: 두 원 모양은 보이지만 겹치는 중앙 부분은 투명

### 브라우저 호환성 주의사항

여기서 중요한 포인트! WebKit 브라우저(Safari, 구버전 Chrome)는 다른 값을 사용합니다:

| 표준 (Firefox, 최신 Chrome) | WebKit (Safari) | 동작 |
|------------------------|----------------|-----|
| `add` | `source-over` | 합집합 |
| `subtract` | `source-out` | 차집합 |
| `intersect` | `source-in` | 교집합 |
| `exclude` | `xor` | 배타적 OR |

**따라서 항상 두 가지를 함께 써야 합니다:**

```css
.cross-browser {
  mask-composite: intersect;           /* 표준 */
  -webkit-mask-composite: source-in;   /* Safari */
}
```

## 실전 예제: 6가지 실용적인 활용법

### 예제 1: 텍스트 컷아웃 효과 (비디오가 보이는 텍스트)

```html
<style>
.video-text {
  position: relative;
  width: 100%;
  height: 400px;
  background: #000;
}

.video-text video {
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: cover;
  /* 텍스트 모양으로 마스킹 */
  mask-image: linear-gradient(black, black);
  mask-composite: source-in;
  -webkit-mask-composite: source-in;
}

.video-text::before {
  content: 'FUTURE';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 150px;
  font-weight: 900;
  color: white;
  /* 이 텍스트를 마스크로 사용 */
  mix-blend-mode: multiply;
}
</style>

<div class="video-text">
  <video autoplay loop muted>
    <source src="tech-background.mp4" type="video/mp4">
  </video>
</div>
```

**더 나은 방법 (SVG 마스크 사용):**

```html
<style>
.text-video-mask {
  width: 800px;
  height: 300px;
  background: url('tech-video.mp4') center/cover;
  mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 300"><text x="50%" y="50%" text-anchor="middle" dy=".35em" font-size="120" font-weight="bold" fill="black">INNOVATION</text></svg>');
  mask-size: cover;
}
</style>

<div class="text-video-mask"></div>
```

### 예제 2: 인터랙티브 스포트라이트 효과

```html
<style>
.spotlight-container {
  position: relative;
  width: 100%;
  height: 600px;
  background: #000;
  cursor: none;
}

.spotlight-image {
  width: 100%;
  height: 100%;
  background: url('dark-scene.jpg') center/cover;
  mask-image: radial-gradient(circle at 50% 50%, black 150px, transparent 150px);
  transition: mask-position 0.1s ease-out;
}
</style>

<script>
const spotlight = document.querySelector('.spotlight-image');
const container = document.querySelector('.spotlight-container');

container.addEventListener('mousemove', (e) => {
  const rect = container.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const percentX = (x / rect.width) * 100;
  const percentY = (y / rect.height) * 100;

  spotlight.style.maskImage = `radial-gradient(circle at ${percentX}% ${percentY}%, black 150px, transparent 150px)`;
});
</script>

<div class="spotlight-container">
  <div class="spotlight-image"></div>
</div>
```

### 예제 3: 그라데이션 페이드 갤러리

```html
<style>
.fade-gallery {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  padding: 40px;
}

.fade-item {
  height: 300px;
  background-size: cover;
  background-position: center;
  transition: mask-image 0.5s;
}

/* 기본: 하단이 페이드아웃 */
.fade-item {
  mask-image: linear-gradient(to bottom, black 70%, transparent 100%);
}

/* 호버: 완전히 보이기 */
.fade-item:hover {
  mask-image: linear-gradient(to bottom, black 100%, black 100%);
}

/* 다양한 페이드 방향 */
.fade-left {
  mask-image: linear-gradient(to right, transparent, black 30%);
}

.fade-right {
  mask-image: linear-gradient(to left, transparent, black 30%);
}

.fade-radial {
  mask-image: radial-gradient(ellipse at center, black 50%, transparent 80%);
}
</style>

<div class="fade-gallery">
  <div class="fade-item" style="background-image: url('photo1.jpg')"></div>
  <div class="fade-item fade-left" style="background-image: url('photo2.jpg')"></div>
  <div class="fade-item fade-radial" style="background-image: url('photo3.jpg')"></div>
</div>
```

### 예제 4: 복잡한 기하학 패턴 마스크

```html
<style>
.geometric-mask {
  width: 500px;
  height: 500px;
  background: url('colorful-abstract.jpg') center/cover;
  /* 여러 개의 원을 배치 */
  mask-image:
    radial-gradient(circle at 25% 25%, black 80px, transparent 80px),
    radial-gradient(circle at 75% 25%, black 80px, transparent 80px),
    radial-gradient(circle at 25% 75%, black 80px, transparent 80px),
    radial-gradient(circle at 75% 75%, black 80px, transparent 80px),
    radial-gradient(circle at 50% 50%, black 100px, transparent 100px);
  mask-composite: add;
  -webkit-mask-composite: source-over;
  animation: pulse 3s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    mask-size: 100% 100%;
  }
  50% {
    mask-size: 110% 110%;
  }
}
</style>

<div class="geometric-mask"></div>
```

### 예제 5: 카드 호버 리빌 효과

```html
<style>
.card-reveal {
  width: 350px;
  height: 500px;
  position: relative;
  overflow: hidden;
  border-radius: 20px;
}

.card-background {
  width: 100%;
  height: 100%;
  background: url('product.jpg') center/cover;
  transition: all 0.6s ease;
}

.card-reveal:hover .card-background {
  /* 상단에서 하단으로 리빌 */
  mask-image: linear-gradient(
    to bottom,
    black 0%,
    black 100%
  );
}

.card-background {
  /* 초기: 하단만 조금 보임 */
  mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    transparent 70%,
    black 80%,
    black 100%
  );
}

.card-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 30px;
  background: linear-gradient(to top, rgba(0,0,0,0.9), transparent);
  color: white;
  transform: translateY(0);
  transition: transform 0.6s ease;
}

.card-reveal:hover .card-info {
  transform: translateY(100%);
}
</style>

<div class="card-reveal">
  <div class="card-background"></div>
  <div class="card-info">
    <h3>프리미엄 헤드폰</h3>
    <p>최고의 음질을 경험하세요</p>
  </div>
</div>
```

### 예제 6: 애니메이션 로딩 스켈레톤

```html
<style>
.skeleton-card {
  width: 300px;
  padding: 20px;
  background: #f0f0f0;
  border-radius: 12px;
}

.skeleton-shimmer {
  height: 200px;
  background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  animation: shimmer 2s infinite;

  /* 특정 영역만 보이도록 마스킹 */
  mask-image:
    linear-gradient(black, black),
    linear-gradient(black, black),
    linear-gradient(black, black);
  mask-size:
    100% 40px,
    60% 20px,
    80% 20px;
  mask-position:
    0 0,
    0 60px,
    0 90px;
  mask-repeat: no-repeat;
  mask-composite: add;
  -webkit-mask-composite: source-over;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
</style>

<div class="skeleton-card">
  <div class="skeleton-shimmer"></div>
</div>
```

## 좋은 예 vs 나쁜 예

### ❌ 나쁜 예 1: 불필요하게 복잡한 이미지 파일 사용

```css
/* 나쁜 예: 간단한 도형을 이미지로 만듦 */
.avatar-frame {
  width: 200px;
  height: 200px;
  background: url('avatar.jpg') center/cover;
  mask-image: url('circle-mask.png'); /* 추가 HTTP 요청 */
}
```

### ✅ 좋은 예 1: CSS 그라디언트로 해결

```css
/* 좋은 예: CSS로 동일한 효과 */
.avatar-frame {
  width: 200px;
  height: 200px;
  background: url('avatar.jpg') center/cover;
  mask-image: radial-gradient(circle, black 100%, transparent 100%);
  /* 파일 요청 없음, 크기 조정 자유로움 */
}
```

### ❌ 나쁜 예 2: 브라우저 호환성 무시

```css
/* 나쁜 예: Safari에서 작동 안 함 */
.masked-element {
  mask-image:
    radial-gradient(circle at 30% 50%, black 100px, transparent 100px),
    radial-gradient(circle at 70% 50%, black 100px, transparent 100px);
  mask-composite: intersect; /* Safari는 이해 못함 */
}
```

### ✅ 좋은 예 2: 크로스 브라우저 지원

```css
/* 좋은 예: 모든 브라우저 지원 */
.masked-element {
  mask-image:
    radial-gradient(circle at 30% 50%, black 100px, transparent 100px),
    radial-gradient(circle at 70% 50%, black 100px, transparent 100px);
  mask-composite: intersect;
  -webkit-mask-composite: source-in; /* Safari용 */
}
```

### ❌ 나쁜 예 3: 성능을 고려하지 않은 복잡한 마스크

```css
/* 나쁜 예: 너무 많은 마스크 레이어 */
.over-complex {
  mask-image:
    radial-gradient(circle at 10% 10%, black 30px, transparent 30px),
    radial-gradient(circle at 20% 10%, black 30px, transparent 30px),
    radial-gradient(circle at 30% 10%, black 30px, transparent 30px),
    /* ... 수십 개 더 ... */
    radial-gradient(circle at 90% 90%, black 30px, transparent 30px);
  mask-composite: add;
  -webkit-mask-composite: source-over;
  /* 렌더링 성능 저하 */
}
```

### ✅ 좋은 예 3: SVG 패턴으로 최적화

```css
/* 좋은 예: SVG 패턴으로 한 번에 처리 */
.optimized-pattern {
  mask-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="8" fill="black"/></pattern></defs><rect width="100" height="100" fill="url(%23dots)"/></svg>');
  mask-size: cover;
  /* 하나의 SVG로 반복 패턴 구현, 성능 우수 */
}
```

### ❌ 나쁜 예 4: 마스크 순서를 고려하지 않음

```css
/* 나쁜 예: 의도와 다른 결과 */
.wrong-order {
  mask-image:
    radial-gradient(circle at 50% 50%, transparent 50px, black 100%),  /* 투명 원 */
    linear-gradient(black, black);  /* 전체 검정 */
  mask-composite: intersect;
  -webkit-mask-composite: source-in;
  /* 결과: 가운데만 투명 (의도와 반대) */
}
```

### ✅ 좋은 예 4: 올바른 마스크 순서

```css
/* 좋은 예: 순서를 바꿔 의도한 결과 */
.correct-order {
  mask-image:
    linear-gradient(black, black),  /* 전체 검정 */
    radial-gradient(circle at 50% 50%, black 50px, transparent 100%);  /* 중앙 원 */
  mask-composite: subtract;  /* 전체에서 원을 뺌 */
  -webkit-mask-composite: source-out;
  /* 결과: 가운데가 투명한 도넛 모양 */
}
```

### ❌ 나쁜 예 5: 접근성을 고려하지 않음

```html
<!-- 나쁜 예: 중요한 텍스트가 마스크로 가려짐 -->
<div style="
  mask-image: radial-gradient(circle, black 50%, transparent 80%);
  mask-composite: intersect;
">
  <p>이 중요한 안내문은 읽기 어렵습니다.</p>
  <button>제출</button>
</div>
```

### ✅ 좋은 예 5: 배경 이미지에만 마스크 적용

```html
<!-- 좋은 예: 텍스트는 명확하게, 배경에만 효과 -->
<div style="position: relative;">
  <div style="
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: url('bg.jpg') center/cover;
    mask-image: radial-gradient(circle, black 50%, transparent 80%);
    z-index: -1;
  "></div>
  <p>이 텍스트는 명확하게 읽을 수 있습니다.</p>
  <button>제출</button>
</div>
```

## 고급 활용: mask 관련 다른 속성들과 함께 사용하기

`mask-composite`는 혼자 사용되지 않습니다. 다른 mask 속성들과 함께 사용해야 진정한 힘을 발휘합니다.

### mask-size: 마스크 크기 조절

```css
.size-control {
  background: url('photo.jpg') center/cover;
  mask-image: radial-gradient(circle, black 50%, transparent 50%);

  /* 마스크 크기 조절 */
  mask-size: 200px 200px;  /* 고정 크기 */
  mask-size: 50% 50%;      /* 백분율 */
  mask-size: cover;        /* 영역을 완전히 덮음 */
  mask-size: contain;      /* 영역에 맞게 조절 */
}
```

**실전 예제: 반응형 마스크**

```css
.responsive-mask {
  background: url('hero.jpg') center/cover;
  mask-image: url('logo-mask.svg');
  mask-size: contain;
  mask-repeat: no-repeat;
  mask-position: center;
}

/* 모바일에서는 크게 */
@media (max-width: 768px) {
  .responsive-mask {
    mask-size: 80%;
  }
}

/* 데스크톱에서는 작게 */
@media (min-width: 769px) {
  .responsive-mask {
    mask-size: 40%;
  }
}
```

### mask-position: 마스크 위치 조절

```css
.position-control {
  background: url('landscape.jpg') center/cover;
  mask-image: radial-gradient(circle, black 150px, transparent 150px);

  /* 다양한 위치 지정 */
  mask-position: center;           /* 중앙 */
  mask-position: top left;         /* 왼쪽 상단 */
  mask-position: 50% 50%;          /* 백분율 */
  mask-position: 100px 50px;       /* 픽셀 */
  mask-position: right 20px bottom 30px;  /* 오른쪽에서 20px, 아래에서 30px */
}
```

**실전 예제: 마우스 따라다니는 마스크**

```html
<style>
.follow-mask {
  width: 600px;
  height: 400px;
  background: url('hidden-message.jpg') center/cover;
  mask-image: radial-gradient(circle, black 100px, transparent 100px);
  mask-repeat: no-repeat;
  transition: mask-position 0.2s ease-out;
}
</style>

<script>
const element = document.querySelector('.follow-mask');

element.addEventListener('mousemove', (e) => {
  const rect = element.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  element.style.maskPosition = `${x}px ${y}px`;
});
</script>

<div class="follow-mask"></div>
```

### mask-repeat: 마스크 반복

```css
.repeat-pattern {
  background: url('fabric-texture.jpg') center/cover;
  mask-image: radial-gradient(circle, black 20px, transparent 40px);

  /* 반복 패턴 */
  mask-repeat: repeat;        /* 가로세로 반복 */
  mask-repeat: repeat-x;      /* 가로만 반복 */
  mask-repeat: repeat-y;      /* 세로만 반복 */
  mask-repeat: no-repeat;     /* 반복 안 함 */
  mask-repeat: space;         /* 공간을 균등하게 배치 */
  mask-repeat: round;         /* 크기를 조절해 반복 */

  mask-size: 80px 80px;
}
```

**실전 예제: 도트 패턴 오버레이**

```css
.dot-overlay {
  width: 100%;
  height: 500px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  mask-image: radial-gradient(circle, black 8px, transparent 8px);
  mask-size: 30px 30px;
  mask-repeat: repeat;
  mask-position: 0 0;
  animation: dot-move 4s linear infinite;
}

@keyframes dot-move {
  0% {
    mask-position: 0 0;
  }
  100% {
    mask-position: 30px 30px;
  }
}
```

### mask-origin과 mask-clip: 마스크 영역 제어

```css
.advanced-clip {
  padding: 40px;
  border: 20px solid transparent;
  background: url('photo.jpg') center/cover;
  background-clip: padding-box;

  mask-image: linear-gradient(to right, black, transparent);

  /* 마스크가 적용되는 영역 */
  mask-origin: border-box;   /* 테두리 포함 */
  mask-origin: padding-box;  /* 패딩 포함, 테두리 제외 */
  mask-origin: content-box;  /* 콘텐츠 영역만 */

  /* 마스크가 잘리는 영역 */
  mask-clip: border-box;
  mask-clip: padding-box;
  mask-clip: content-box;
}
```

### 모든 속성을 한 번에: mask 단축 속성

```css
.shorthand {
  /* 개별 속성 */
  mask-image: radial-gradient(circle, black, transparent);
  mask-position: center;
  mask-size: contain;
  mask-repeat: no-repeat;
  mask-origin: border-box;
  mask-clip: border-box;
  mask-composite: add;

  /* 단축 속성으로 한 번에 */
  mask: radial-gradient(circle, black, transparent)
        center / contain
        no-repeat
        border-box
        border-box;
  mask-composite: add;  /* 단축 속성에는 포함 안 됨 */
}
```

## 함정과 주의사항

### 함정 1: -webkit-mask-composite 값 혼동

가장 흔한 실수입니다. 표준과 WebKit의 값이 다릅니다.

```css
/* 잘못된 예 */
.wrong {
  mask-composite: intersect;
  -webkit-mask-composite: intersect;  /* ❌ Safari에서 작동 안 함! */
}

/* 올바른 예 */
.correct {
  mask-composite: intersect;
  -webkit-mask-composite: source-in;  /* ✅ 올바른 WebKit 값 */
}
```

**해결책: 매핑 테이블 참고**

| 표준 | WebKit | 기억법 |
|-----|--------|-------|
| add | source-over | 위에 덧칠 = 합집합 |
| subtract | source-out | 소스를 밖으로 = 차집합 |
| intersect | source-in | 소스 안쪽만 = 교집합 |
| exclude | xor | 배타적 OR = XOR |

### 함정 2: 마스크 순서의 중요성

마스크는 **위에서 아래로** 처리됩니다. 순서가 바뀌면 결과도 달라집니다.

```css
/* 케이스 A: 전체에서 원을 뺌 */
.case-a {
  mask-image:
    linear-gradient(black, black),                                    /* 1. 전체 */
    radial-gradient(circle at center, black 100px, transparent 100px); /* 2. 원 */
  mask-composite: subtract;  /* 1에서 2를 뺌 */
  -webkit-mask-composite: source-out;
  /* 결과: 도넛 모양 (가운데 구멍) */
}

/* 케이스 B: 원에서 전체를 뺌 */
.case-b {
  mask-image:
    radial-gradient(circle at center, black 100px, transparent 100px), /* 1. 원 */
    linear-gradient(black, black);                                    /* 2. 전체 */
  mask-composite: subtract;  /* 1에서 2를 뺌 */
  -webkit-mask-composite: source-out;
  /* 결과: 아무것도 안 보임 (원보다 전체가 크므로) */
}
```

**시각화:**

```
Case A: 전체 - 원 = 도넛
████████████
████  ██████
████  ██████
████████████

Case B: 원 - 전체 = 없음
(원이 전체보다 작으므로 다 빠짐)
```

### 함정 3: 성능 문제 - 너무 복잡한 마스크

복잡한 마스크는 GPU를 많이 사용합니다.

```css
/* ❌ 나쁜 예: 수십 개의 마스크 */
.performance-issue {
  mask-image:
    radial-gradient(circle at 10% 10%, black 20px, transparent 20px),
    radial-gradient(circle at 15% 10%, black 20px, transparent 20px),
    /* ... 50개 더 ... */
    radial-gradient(circle at 90% 90%, black 20px, transparent 20px);
  mask-composite: add;
  animation: move 2s infinite;
  /* 페이지가 버벅거림 */
}
```

**해결책: SVG나 Canvas로 대체**

```css
/* ✅ 좋은 예: SVG 패턴으로 한 번에 */
.performance-good {
  mask-image: url('optimized-pattern.svg');
  mask-size: cover;
  animation: move 2s infinite;
  /* 부드럽게 동작 */
}
```

### 함정 4: 애니메이션 시 깜빡임

mask-image를 직접 애니메이션하면 깜빡일 수 있습니다.

```css
/* ❌ 깜빡임 발생 */
.flicker {
  mask-image: radial-gradient(circle at 50% 50%, black 100px, transparent 100px);
  animation: bad-animate 2s infinite;
}

@keyframes bad-animate {
  0% {
    mask-image: radial-gradient(circle at 50% 50%, black 100px, transparent 100px);
  }
  100% {
    mask-image: radial-gradient(circle at 50% 50%, black 200px, transparent 200px);
  }
  /* mask-image를 바꾸면 리페인트 발생 */
}
```

**해결책: mask-size나 mask-position 애니메이션**

```css
/* ✅ 부드러운 애니메이션 */
.smooth {
  mask-image: radial-gradient(circle, black 50%, transparent 50%);
  mask-size: 200px 200px;
  mask-position: center;
  animation: good-animate 2s infinite;
}

@keyframes good-animate {
  0% {
    mask-size: 200px 200px;
  }
  100% {
    mask-size: 400px 400px;
  }
  /* size나 position 변경은 GPU 가속 */
}
```

### 함정 5: 투명도와 마스크 혼동

```css
/* ❌ 마스크가 아니라 투명도 */
.not-a-mask {
  background: url('image.jpg');
  opacity: 0.5;  /* 전체가 반투명 */
}

/* ✅ 진짜 마스크 */
.real-mask {
  background: url('image.jpg');
  mask-image: linear-gradient(to right, black, transparent);
  /* 오른쪽으로 갈수록 투명 */
}
```

차이점:
- `opacity`: 요소 전체를 투명하게 (자식 요소 포함)
- `mask`: 특정 부분만 선택적으로 투명

### 함정 6: 브라우저 지원 확인 없음

```html
<!-- ❌ 대체 수단 없음 -->
<div class="masked">
  <img src="important-info.jpg" alt="중요한 정보">
</div>

<style>
.masked {
  mask-image: radial-gradient(circle, black, transparent);
}
/* 구형 브라우저에서는 아무것도 안 보임! */
</style>
```

**해결책: Feature Detection**

```html
<!-- ✅ 폴백 제공 -->
<style>
.masked {
  /* 기본: 마스크 없이 보여줌 */
  background: url('important-info.jpg') center/cover;
}

/* 마스크 지원 시에만 적용 */
@supports (mask-image: url()) or (-webkit-mask-image: url()) {
  .masked {
    mask-image: radial-gradient(circle, black, transparent);
    -webkit-mask-image: radial-gradient(circle, black, transparent);
  }
}
</style>

<div class="masked"></div>
```

**JavaScript로 확인:**

```javascript
function supportsMask() {
  const element = document.createElement('div');
  return 'maskImage' in element.style ||
         'webkitMaskImage' in element.style;
}

if (supportsMask()) {
  document.body.classList.add('mask-supported');
} else {
  console.warn('이 브라우저는 CSS 마스크를 지원하지 않습니다.');
  // 대체 UI 표시
}
```

### 함정 7: 콘텐츠 접근성 문제

```html
<!-- ❌ 스크린 리더가 읽을 수 없는 텍스트 -->
<div style="
  mask-image: radial-gradient(circle at 10% 10%, black 50px, transparent 50px);
  font-size: 16px;
">
  <p>이 중요한 텍스트는 대부분 가려져 있습니다.</p>
</div>
```

**해결책: 시각 효과와 콘텐츠 분리**

```html
<!-- ✅ 접근성 고려 -->
<div style="position: relative;">
  <!-- 배경 효과만 마스크 적용 -->
  <div aria-hidden="true" style="
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: url('decorative.jpg') center/cover;
    mask-image: radial-gradient(circle, black 50%, transparent 80%);
    z-index: -1;
  "></div>

  <!-- 텍스트는 명확하게 -->
  <p style="color: #333; position: relative;">
    이 중요한 텍스트는 스크린 리더와 모든 사용자가 읽을 수 있습니다.
  </p>
</div>
```

## 실전 활용: 실제 프로젝트 패턴

### 패턴 1: 히어로 섹션의 창의적인 이미지 표현

```html
<style>
.hero-section {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: #000;
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('hero-background.jpg') center/cover;

  /* 상단과 하단이 페이드 아웃 */
  mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 10%,
    black 90%,
    transparent 100%
  );
}

.hero-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: white;
}

.hero-title {
  font-size: 80px;
  font-weight: 900;
  background: url('texture.jpg') center/cover;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

  /* 텍스트 가장자리가 페이드 */
  mask-image: linear-gradient(to bottom, black 80%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, black 80%, transparent 100%);
}
</style>

<section class="hero-section">
  <div class="hero-background"></div>
  <div class="hero-content">
    <h1 class="hero-title">FUTURE IS NOW</h1>
    <p>혁신적인 기술로 미래를 만듭니다</p>
  </div>
</section>
```

### 패턴 2: 이미지 갤러리의 호버 효과

```html
<style>
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  padding: 40px;
}

.gallery-item {
  position: relative;
  height: 400px;
  overflow: hidden;
  border-radius: 12px;
  cursor: pointer;
}

.gallery-image {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);

  /* 기본: 중앙에서 방사형으로 페이드 */
  mask-image: radial-gradient(
    circle at center,
    black 40%,
    transparent 70%
  );
  -webkit-mask-image: radial-gradient(
    circle at center,
    black 40%,
    transparent 70%
  );
}

.gallery-item:hover .gallery-image {
  transform: scale(1.1);

  /* 호버: 완전히 보이기 */
  mask-image: radial-gradient(
    circle at center,
    black 100%,
    black 100%
  );
  -webkit-mask-image: radial-gradient(
    circle at center,
    black 100%,
    black 100%
  );
}

.gallery-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 30px;
  background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
  color: white;
  transform: translateY(0);
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.gallery-item:hover .gallery-overlay {
  transform: translateY(0);
}
</style>

<div class="gallery">
  <div class="gallery-item">
    <div class="gallery-image" style="background-image: url('photo1.jpg')"></div>
    <div class="gallery-overlay">
      <h3>서울의 밤</h3>
      <p>도시의 불빛이 만들어내는 아름다움</p>
    </div>
  </div>
  <!-- 더 많은 아이템들... -->
</div>
```

### 패턴 3: 로딩 스피너와 프로그레스 바

```html
<style>
.loading-spinner {
  width: 100px;
  height: 100px;
  background: linear-gradient(45deg, #667eea, #764ba2, #f093fb, #4facfe);
  background-size: 400% 400%;
  border-radius: 50%;
  animation: gradient-shift 3s ease infinite;

  /* 원의 일부만 보이기 (스피너 효과) */
  mask-image: conic-gradient(
    from 0deg,
    black 0deg,
    black 270deg,
    transparent 270deg,
    transparent 360deg
  );
  -webkit-mask-image: conic-gradient(
    from 0deg,
    black 0deg,
    black 270deg,
    transparent 270deg,
    transparent 360deg
  );
  animation: gradient-shift 3s ease infinite, spin 1s linear infinite;
}

@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 프로그레스 바 */
.progress-bar {
  width: 100%;
  height: 40px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 20px;
  position: relative;
  overflow: hidden;
}

.progress-fill {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: inherit;

  /* 진행률만큼 보이기 */
  mask-image: linear-gradient(
    to right,
    black 0%,
    black var(--progress, 60%),
    transparent var(--progress, 60%)
  );
  -webkit-mask-image: linear-gradient(
    to right,
    black 0%,
    black var(--progress, 60%),
    transparent var(--progress, 60%)
  );
  transition: mask-position 0.3s ease;
}
</style>

<div class="loading-spinner"></div>

<div class="progress-bar">
  <div class="progress-fill" style="--progress: 75%"></div>
</div>
```

### 패턴 4: 텍스트 애니메이션 효과

```html
<style>
.animated-text {
  font-size: 120px;
  font-weight: 900;
  text-align: center;
  padding: 50px;

  /* 텍스트에 그라디언트 배경 */
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #f7b731);
  background-size: 300% 300%;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

  /* 왼쪽에서 오른쪽으로 리빌 */
  mask-image: linear-gradient(
    to right,
    black 0%,
    black 30%,
    transparent 30%,
    transparent 100%
  );
  -webkit-mask-image: linear-gradient(
    to right,
    black 0%,
    black 30%,
    transparent 30%,
    transparent 100%
  );

  animation: text-reveal 2s ease-in-out forwards, bg-shift 4s ease infinite;
}

@keyframes text-reveal {
  0% {
    mask-image: linear-gradient(
      to right,
      black 0%,
      black 0%,
      transparent 0%,
      transparent 100%
    );
  }
  100% {
    mask-image: linear-gradient(
      to right,
      black 0%,
      black 100%,
      transparent 100%,
      transparent 100%
    );
  }
}

@keyframes bg-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
</style>

<h1 class="animated-text">CREATIVE</h1>
```

### 패턴 5: 카드 스택 효과

```html
<style>
.card-stack {
  position: relative;
  width: 350px;
  height: 500px;
  margin: 100px auto;
}

.stacked-card {
  position: absolute;
  width: 100%;
  height: 100%;
  background: url('card-bg.jpg') center/cover;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.2);
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.stacked-card:nth-child(1) {
  z-index: 3;
  transform: translateY(0) scale(1);
}

.stacked-card:nth-child(2) {
  z-index: 2;
  transform: translateY(-20px) scale(0.95);
  mask-image: linear-gradient(to bottom, black 80%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, black 80%, transparent 100%);
}

.stacked-card:nth-child(3) {
  z-index: 1;
  transform: translateY(-40px) scale(0.9);
  mask-image: linear-gradient(to bottom, black 60%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, black 60%, transparent 100%);
}

.card-stack:hover .stacked-card:nth-child(1) {
  transform: translateY(20px) scale(1.02);
}

.card-stack:hover .stacked-card:nth-child(2) {
  transform: translateY(0) scale(0.98);
}

.card-stack:hover .stacked-card:nth-child(3) {
  transform: translateY(-20px) scale(0.94);
}
</style>

<div class="card-stack">
  <div class="stacked-card"></div>
  <div class="stacked-card"></div>
  <div class="stacked-card"></div>
</div>
```

## 브라우저 지원 현황 (2025년 기준)

### 데스크톱 브라우저

| 브라우저 | mask-image | mask-composite | 주의사항 |
|---------|-----------|---------------|---------|
| Chrome 120+ | ✅ | ✅ | `-webkit-` 접두사 권장 |
| Firefox 53+ | ✅ | ✅ | 표준 속성만 지원 |
| Safari 15.4+ | ✅ | ✅ | `-webkit-` 필수 |
| Edge 120+ | ✅ | ✅ | Chromium 기반 |
| Opera 106+ | ✅ | ✅ | Chromium 기반 |

### 모바일 브라우저

| 브라우저 | mask-image | mask-composite | 주의사항 |
|---------|-----------|---------------|---------|
| iOS Safari 15.4+ | ✅ | ✅ | `-webkit-` 필수 |
| Chrome Android | ✅ | ✅ | 데스크톱과 동일 |
| Samsung Internet | ✅ | ✅ | Chromium 기반 |
| Firefox Android | ✅ | ✅ | 데스크톱과 동일 |

### 프로덕션 권장 코드

```css
.production-safe {
  /* 1. 기본 배경 (폴백) */
  background: url('image.jpg') center/cover;

  /* 2. WebKit 접두사 (Safari용) */
  -webkit-mask-image: radial-gradient(circle, black 50%, transparent 70%);
  -webkit-mask-composite: source-in;

  /* 3. 표준 속성 (최신 브라우저) */
  mask-image: radial-gradient(circle, black 50%, transparent 70%);
  mask-composite: intersect;
}

/* 4. Feature Detection으로 향상 */
@supports (mask-composite: intersect) or (-webkit-mask-composite: source-in) {
  .production-safe {
    /* 추가 효과 적용 */
  }
}
```

## 성능 최적화 팁

### 1. will-change 사용

```css
.optimized-mask {
  background: url('large-image.jpg') center/cover;
  mask-image: radial-gradient(circle, black 50%, transparent 70%);

  /* 애니메이션 전에 GPU에게 알림 */
  will-change: mask-position, mask-size;
  transition: mask-position 0.3s, mask-size 0.3s;
}

.optimized-mask:hover {
  mask-position: 60% 60%;
  mask-size: 150% 150%;
}

/* 애니메이션 끝나면 제거 */
.optimized-mask:not(:hover) {
  will-change: auto;
}
```

### 2. 복잡한 마스크는 SVG로

```css
/* ❌ 느림: CSS로 복잡한 패턴 */
.slow {
  mask-image:
    radial-gradient(circle at 10% 10%, black 10px, transparent 10px),
    radial-gradient(circle at 20% 10%, black 10px, transparent 10px),
    /* ... 수십 개 더 ... */;
  mask-composite: add;
}

/* ✅ 빠름: SVG로 한 번에 */
.fast {
  mask-image: url('pattern.svg');
  mask-size: cover;
}
```

### 3. 애니메이션은 mask-position/size만

```css
/* ✅ GPU 가속 - 부드러움 */
.smooth-animation {
  mask-image: radial-gradient(circle, black 50%, transparent 50%);
  mask-size: 100px 100px;
  animation: grow 2s ease-in-out infinite;
}

@keyframes grow {
  0%, 100% { mask-size: 100px 100px; }
  50% { mask-size: 200px 200px; }
}

/* ❌ 리페인트 - 버벅거림 */
.janky-animation {
  animation: bad 2s infinite;
}

@keyframes bad {
  0% { mask-image: radial-gradient(circle, black 100px, transparent 100px); }
  100% { mask-image: radial-gradient(circle, black 200px, transparent 200px); }
}
```

## 참고 자료

### 공식 문서
- [MDN: mask-composite](https://developer.mozilla.org/en-US/docs/Web/CSS/mask-composite) - 가장 상세한 설명과 예제
- [MDN: mask-image](https://developer.mozilla.org/en-US/docs/Web/CSS/mask-image) - 마스크 이미지 기본 개념
- [CSS Masking Module Level 1](https://www.w3.org/TR/css-masking-1/) - W3C 공식 스펙
- [Can I Use: CSS Masks](https://caniuse.com/css-masks) - 브라우저 지원 현황

### 심화 학습
- [CSS Tricks: Masking vs. Clipping](https://css-tricks.com/masking-vs-clipping-use/) - 마스킹과 클리핑의 차이
- [Web.dev: Creative Image Effects](https://web.dev/creative-css-effects/) - 창의적인 CSS 효과
- [Smashing Magazine: CSS Masking](https://www.smashingmagazine.com/2021/05/css-masking/) - 실전 활용 가이드

### 도구와 생성기
- [CSS Gradient Generator](https://cssgradient.io/) - 그라디언트 마스크 만들기
- [Clippy](https://bennettfeely.com/clippy/) - CSS clip-path 생성기 (마스크와 함께 사용)
- [SVG Path Editor](https://yqnn.github.io/svg-path-editor/) - SVG 마스크 직접 제작

### 영감과 예제
- [CodePen: CSS Mask Effects](https://codepen.io/search/pens?q=css+mask+composite) - 실전 예제 모음
- [Awwwards: Mask Effects](https://www.awwwards.com/websites/masking/) - 수상작 사이트들의 마스크 활용

### 관련 CSS 속성
- [clip-path](https://developer.mozilla.org/en-US/docs/Web/CSS/clip-path) - 마스크와 유사하지만 다른 접근법
- [mix-blend-mode](https://developer.mozilla.org/en-US/docs/Web/CSS/mix-blend-mode) - 레이어 블렌딩
- [background-clip](https://developer.mozilla.org/en-US/docs/Web/CSS/background-clip) - 텍스트 클리핑 효과
