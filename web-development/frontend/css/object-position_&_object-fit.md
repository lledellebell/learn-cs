---
title: 반응형 디자인의 필수 도구, object-fit과 object-position 완벽 가이드
date: 2025-10-02
layout: page
---

# 반응형 디자인의 필수 도구, object-fit과 object-position 완벽 가이드

프로필 이미지를 업로드했는데 얼굴이 잘리거나, 상품 사진이 찌그러져서 나오거나, 히어로 섹션의 배경 이미지가 이상하게 늘어난 경험 있나요? 저도 처음 웹 개발을 배울 때 이미지가 자꾸 왜곡되어서 "도대체 왜 내 마음대로 안 되는 거야?"라고 좌절했던 기억이 납니다.

상상해보세요. 사용자가 여러분의 쇼핑몰에 정사각형 프로필 사진을 업로드했는데, 여러분의 사이트는 가로로 긴 직사각형 영역에 그 이미지를 표시해야 합니다. 어떻게 해야 할까요? 이미지를 늘려서 공간을 채울까요? 아니면 여백을 두고 원본 비율을 유지할까요? 중요한 부분이 잘리면 어떡하죠?

이런 문제를 해결하기 위해 예전에는 복잡한 JavaScript나 `background-image` 속성을 사용했습니다. 하지만 CSS의 `object-fit`과 `object-position` 속성이 등장하면서 모든 것이 간단해졌습니다.

## 왜 object-fit과 object-position을 배워야 할까요?

### 1. 반응형 디자인의 핵심입니다

현대 웹은 다양한 화면 크기에서 동작해야 합니다. 데스크톱, 태블릿, 모바일... 같은 이미지가 각기 다른 크기의 컨테이너에 표시되어야 합니다. `object-fit`과 `object-position` 없이는 이미지가 찌그러지거나 잘리는 문제를 피할 수 없습니다.

```html
<!-- 예전 방식: 복잡하고 번거로움 -->
<div style="background-image: url('profile.jpg'); background-size: cover; background-position: center; width: 200px; height: 200px;"></div>

<!-- 현대적 방식: 간단하고 명확함 -->
<img src="profile.jpg" style="width: 200px; height: 200px; object-fit: cover; object-position: center;">
```

### 2. 사용자 경험을 크게 개선합니다

찌그러진 얼굴 사진, 잘린 상품 이미지는 사용자에게 "이 사이트는 허술하다"는 인상을 줍니다. 반대로 이미지가 완벽하게 표시되면 전문적이고 신뢰감을 줍니다.

### 3. 성능과 접근성을 동시에 잡습니다

`background-image`로 우회하는 대신 실제 `<img>` 태그를 사용하면:
- 스크린 리더가 alt 텍스트를 읽을 수 있습니다 (접근성)
- 브라우저가 이미지를 최적화할 수 있습니다 (성능)
- SEO에 유리합니다 (검색엔진이 이미지를 인식)

### 4. 코드가 단순하고 유지보수하기 쉬워집니다

추가 div wrapper나 JavaScript 없이 CSS 두 줄로 해결됩니다.

## 기본 개념: 이미지는 왜 찌그러질까?

먼저 문제를 이해해봅시다. HTML에서 이미지를 이렇게 사용하면:

```html
<img src="photo.jpg" style="width: 300px; height: 200px;">
```

원본 이미지의 비율과 지정한 크기의 비율이 다르면 브라우저는 **기본적으로 이미지를 늘리거나 줄여서** 주어진 공간을 채웁니다. 이것이 찌그러짐의 원인입니다.

```
원본: 400px × 400px (1:1 정사각형)
지정: 300px × 200px (3:2 직사각형)
결과: 이미지가 가로로 늘어남
```

### object-fit이 하는 일

`object-fit`은 "이미지를 컨테이너에 어떻게 맞출지" 결정합니다. 이미지의 원본 비율을 유지하면서 말이죠.

### object-position이 하는 일

`object-fit`으로 이미지를 맞춘 후, 컨테이너 안에서 **어디에 위치시킬지** 결정합니다.

## object-fit 속성: 5가지 값 완벽 분석

### 1. fill (기본값) - 공간을 채우되 비율 무시

```css
img {
  width: 300px;
  height: 200px;
  object-fit: fill; /* 기본값이므로 생략해도 동일 */
}
```

**동작 방식:**
```
┌─────────────────┐
│                 │
│  ████████████   │  이미지를 늘려서
│  ████████████   │  컨테이너를 완전히 채움
│  ████████████   │  (비율 무시)
│                 │
└─────────────────┘
컨테이너 (300×200)
```

**언제 사용하나요?**
- 거의 사용하지 않습니다
- 비율이 정확히 맞는 이미지만 있을 때

❌ **나쁜 예: 프로필 사진이 찌그러짐**
```html
<img src="profile-400x400.jpg"
     style="width: 300px; height: 200px; object-fit: fill;">
<!-- 얼굴이 가로로 늘어나서 이상하게 보임 -->
```

### 2. contain - 전체를 보여주되 여백 허용

```css
img {
  width: 300px;
  height: 200px;
  object-fit: contain;
}
```

**동작 방식:**
```
┌─────────────────┐
│                 │
│  ┌───────────┐  │  이미지가 컨테이너 안에
│  │ ████████  │  │  완전히 들어가도록 축소
│  │ ████████  │  │  (여백 생김)
│  └───────────┘  │
│                 │
└─────────────────┘
```

**언제 사용하나요?**
- 이미지의 모든 부분을 보여줘야 할 때
- 상품 사진 (신발, 가방 등)
- 로고
- 썸네일에서 잘림이 허용되지 않을 때

✅ **좋은 예: 상품 사진 전체를 보여줌**
```html
<div class="product-grid">
  <img src="product1.jpg"
       style="width: 200px; height: 200px; object-fit: contain; background: #f5f5f5;">
  <!-- 상품 전체가 보이고, 여백은 배경색으로 채워짐 -->
</div>
```

### 3. cover - 공간을 채우되 비율 유지 (가장 많이 사용!)

```css
img {
  width: 300px;
  height: 200px;
  object-fit: cover;
}
```

**동작 방식:**
```
┌─────────────────┐
│█████████████████│  이미지를 확대/축소해서
│█████████████████│  컨테이너를 완전히 채움
│█████████████████│  (넘치는 부분은 잘림)
│█████████████████│
└─────────────────┘
```

**언제 사용하나요?**
- 히어로 섹션 배경
- 프로필 사진
- 카드 썸네일
- 갤러리 이미지
- **가장 많이 사용되는 값입니다!**

✅ **좋은 예: 프로필 사진이 깔끔하게 표시됨**
```html
<img src="profile.jpg"
     class="avatar"
     style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover;">
<!-- 정사각형 공간에 원형으로 잘린 프로필 사진 -->
```

### 4. none - 원본 크기 유지

```css
img {
  width: 300px;
  height: 200px;
  object-fit: none;
}
```

**동작 방식:**
```
┌─────────────────┐
│                 │
│    ████████     │  이미지를 원본 크기로 표시
│    ████████     │  (넘치면 잘리고, 작으면 여백)
│                 │
└─────────────────┘
```

**언제 사용하나요?**
- 아이콘이나 작은 그래픽
- 픽셀 퍼펙트한 디자인이 필요할 때
- 거의 사용하지 않음

### 5. scale-down - contain과 none 중 작은 것

```css
img {
  width: 300px;
  height: 200px;
  object-fit: scale-down;
}
```

**동작 방식:**
- 이미지가 컨테이너보다 크면: `contain`처럼 동작 (축소)
- 이미지가 컨테이너보다 작으면: `none`처럼 동작 (원본 크기)

**언제 사용하나요?**
- 다양한 크기의 이미지를 다룰 때
- 작은 이미지가 불필요하게 확대되는 것을 방지

✅ **좋은 예: 아이콘이 과도하게 커지지 않음**
```html
<img src="icon-32x32.png"
     style="width: 100px; height: 100px; object-fit: scale-down;">
<!-- 32px 아이콘이 100px로 확대되지 않고 원본 크기로 표시됨 -->
```

## object-position 속성: 이미지 위치 조정

`object-fit: cover`나 `contain`을 사용하면 이미지의 일부가 잘리거나 여백이 생깁니다. `object-position`으로 **어느 부분을 보여줄지** 제어합니다.

### 기본 문법

```css
object-position: <x> <y>;
```

### 키워드 값

```css
/* 9가지 기본 위치 */
object-position: center;        /* 중앙 (기본값) */
object-position: top;           /* 상단 중앙 */
object-position: bottom;        /* 하단 중앙 */
object-position: left;          /* 좌측 중앙 */
object-position: right;         /* 우측 중앙 */
object-position: top left;      /* 좌상단 */
object-position: top right;     /* 우상단 */
object-position: bottom left;   /* 좌하단 */
object-position: bottom right;  /* 우하단 */
```

### 백분율과 픽셀 값

```css
/* 백분율: 컨테이너 크기에 비례 */
object-position: 50% 50%;    /* center와 동일 */
object-position: 0% 0%;      /* top left와 동일 */
object-position: 100% 100%;  /* bottom right와 동일 */
object-position: 75% 25%;    /* 우측 상단 쪽 */

/* 픽셀: 절대값 */
object-position: 20px 30px;  /* 왼쪽에서 20px, 위에서 30px */
object-position: -20px 0px;  /* 왼쪽으로 20px 이동 (잘림) */

/* 혼합 사용 가능 */
object-position: center 20%;
object-position: 10px 50%;
```

### 시각적 예제

```
원본 이미지: 사람의 전신 사진 (키가 큰 이미지)
컨테이너: 정사각형

object-fit: cover; object-position: top;
┌─────────┐
│  ◯ 얼굴  │  ← 상단 위주로 보임
│   │몸    │
│   │      │
└─────────┘

object-fit: cover; object-position: center;
┌─────────┐
│   │몸    │  ← 중앙 위주로 보임
│  ─┼─     │
│   │다리  │
└─────────┘

object-fit: cover; object-position: bottom;
┌─────────┐
│   │몸    │
│  ─┼─     │  ← 하단 위주로 보임
│   │다리  │
└─────────┘
```

## 실전 예제: 다양한 시나리오

### 예제 1: 프로필 사진 - 정사각형 원형

```html
<style>
  .avatar {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    object-fit: cover;
    object-position: center;
    border: 3px solid #e0e0e0;
  }
</style>

<img src="profile.jpg" alt="프로필 사진" class="avatar">
```

**왜 이렇게 할까요?**
- `object-fit: cover`: 정사각형을 완전히 채움 (빈 공간 없음)
- `object-position: center`: 얼굴이 중앙에 오도록
- `border-radius: 50%`: 원형으로 자름

### 예제 2: 카드 썸네일 - 16:9 비율

```html
<style>
  .card {
    width: 100%;
    max-width: 400px;
  }

  .card-image {
    width: 100%;
    height: 225px; /* 400px × 9/16 = 225px */
    object-fit: cover;
    object-position: center;
  }

  .card-body {
    padding: 16px;
  }
</style>

<div class="card">
  <img src="thumbnail.jpg" alt="썸네일" class="card-image">
  <div class="card-body">
    <h3>카드 제목</h3>
    <p>카드 설명...</p>
  </div>
</div>
```

### 예제 3: 히어로 섹션 - 전체 화면 배경

```html
<style>
  .hero {
    position: relative;
    width: 100%;
    height: 100vh; /* 화면 전체 높이 */
    overflow: hidden;
  }

  .hero-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center bottom; /* 하단 중앙 */
  }

  .hero-content {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    text-align: center;
    z-index: 1;
  }
</style>

<section class="hero">
  <img src="hero-bg.jpg" alt="" class="hero-image">
  <div class="hero-content">
    <h1>환영합니다</h1>
    <p>우리의 이야기를 만나보세요</p>
  </div>
</section>
```

**주의:** `alt=""` - 장식용 이미지이므로 빈 alt 사용

### 예제 4: 상품 그리드 - 전체를 보여주는 썸네일

```html
<style>
  .product-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 20px;
  }

  .product-card {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    overflow: hidden;
  }

  .product-image {
    width: 100%;
    height: 200px;
    object-fit: contain; /* 상품 전체를 보여줌 */
    object-position: center;
    background: #f9f9f9; /* 여백에 배경색 */
    padding: 16px;
  }

  .product-info {
    padding: 12px;
  }
</style>

<div class="product-grid">
  <div class="product-card">
    <img src="shoe.jpg" alt="운동화" class="product-image">
    <div class="product-info">
      <h4>프리미엄 운동화</h4>
      <p>89,000원</p>
    </div>
  </div>
  <!-- 더 많은 상품들... -->
</div>
```

### 예제 5: 배너 - 좌우 크기에 맞춤

```html
<style>
  .banner {
    width: 100%;
    height: 400px;
    position: relative;
  }

  .banner-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center 30%; /* 상단 쪽을 더 보여줌 */
  }
</style>

<div class="banner">
  <img src="banner.jpg" alt="프로모션 배너" class="banner-image">
</div>
```

### 예제 6: 비디오 요소에도 적용

```html
<style>
  .video-container {
    width: 100%;
    height: 500px;
    background: black;
  }

  .video-player {
    width: 100%;
    height: 100%;
    object-fit: contain; /* 비디오 전체를 보여줌 */
    object-position: center;
  }
</style>

<div class="video-container">
  <video class="video-player" controls>
    <source src="video.mp4" type="video/mp4">
  </video>
</div>
```

**참고:** `object-fit`과 `object-position`은 `<video>`, `<iframe>` 등 **replaced elements**에도 동작합니다!

## 좋은 예 vs 나쁜 예

### ❌ 나쁜 예 1: width/height 없이 object-fit 사용

```html
<img src="photo.jpg" style="object-fit: cover;">
<!-- 작동하지 않음! 컨테이너 크기가 없으면 의미 없음 -->
```

**문제:** `object-fit`은 **명시적으로 지정된 width/height 안에서** 작동합니다.

✅ **올바른 방법:**
```html
<img src="photo.jpg" style="width: 300px; height: 200px; object-fit: cover;">
```

### ❌ 나쁜 예 2: 프로필 사진에 contain 사용

```html
<img src="profile.jpg"
     style="width: 100px; height: 100px; border-radius: 50%; object-fit: contain;">
<!-- 원형 안에 여백이 생겨서 이상하게 보임 -->
```

✅ **올바른 방법:**
```html
<img src="profile.jpg"
     style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover;">
<!-- 원형을 완전히 채움 -->
```

### ❌ 나쁜 예 3: 상품 사진에 cover 사용

```html
<img src="product.jpg"
     style="width: 200px; height: 200px; object-fit: cover;">
<!-- 상품의 일부가 잘려서 무엇인지 알 수 없음 -->
```

✅ **올바른 방법:**
```html
<img src="product.jpg"
     style="width: 200px; height: 200px; object-fit: contain; background: #f5f5f5;">
<!-- 상품 전체가 보이고, 여백은 배경색으로 채움 -->
```

### ❌ 나쁜 예 4: background-image로 우회

```html
<div style="background-image: url('photo.jpg');
            background-size: cover;
            background-position: center;
            width: 200px;
            height: 200px;"></div>
<!-- 접근성 문제: alt 텍스트 없음 -->
<!-- SEO 문제: 검색엔진이 이미지를 인식 못함 -->
```

✅ **올바른 방법:**
```html
<img src="photo.jpg"
     alt="상품 설명"
     style="width: 200px; height: 200px; object-fit: cover;">
<!-- 접근성 OK, SEO OK, 성능 OK -->
```

### ❌ 나쁜 예 5: 모든 이미지에 cover 남용

```html
<img src="logo.svg" style="width: 100px; height: 50px; object-fit: cover;">
<!-- 로고가 잘려서 브랜드 아이덴티티 훼손 -->
```

✅ **올바른 방법:**
```html
<img src="logo.svg" style="width: 100px; height: 50px; object-fit: contain;">
<!-- 로고 전체가 보임 -->
```

## 고급 활용: 실전 테크닉

### 1. aspect-ratio와 함께 사용 (현대적 방법)

```css
.image-16-9 {
  width: 100%;
  aspect-ratio: 16 / 9; /* 자동으로 높이 계산 */
  object-fit: cover;
  object-position: center;
}
```

```html
<img src="photo.jpg" class="image-16-9">
<!-- width가 400px이면 높이는 자동으로 225px -->
```

**장점:**
- `height`를 수동으로 계산할 필요 없음
- 반응형에 유리
- 코드가 더 간결

### 2. 조건부 object-position (중요한 부분 보존)

얼굴 인식 API로 얼굴 위치를 파악한 후 적용:

```html
<img src="photo.jpg"
     style="width: 200px; height: 200px; object-fit: cover; object-position: 65% 30%;">
<!-- 얼굴이 65%, 30% 위치에 있다면 -->
```

실제 프로젝트에서는 JavaScript로 동적 계산:

```javascript
// 얼굴 인식 API 결과: { x: 0.65, y: 0.30 }
const img = document.querySelector('img');
img.style.objectPosition = `${face.x * 100}% ${face.y * 100}%`;
```

### 3. 로딩 중 placeholder와 함께

```html
<style>
  .image-wrapper {
    position: relative;
    width: 400px;
    height: 300px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
  }

  @keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  .image-wrapper img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    opacity: 0;
    transition: opacity 0.3s;
  }

  .image-wrapper img.loaded {
    opacity: 1;
  }
</style>

<div class="image-wrapper">
  <img src="photo.jpg"
       alt="사진"
       onload="this.classList.add('loaded')">
</div>
```

### 4. 여러 비율을 지원하는 컴포넌트

```css
.image-container {
  width: 100%;
}

.image-container img {
  width: 100%;
  object-fit: cover;
  object-position: center;
}

/* 비율별 클래스 */
.image-container.square {
  aspect-ratio: 1 / 1;
}

.image-container.landscape {
  aspect-ratio: 16 / 9;
}

.image-container.portrait {
  aspect-ratio: 9 / 16;
}

.image-container.ultrawide {
  aspect-ratio: 21 / 9;
}
```

```html
<div class="image-container square">
  <img src="photo.jpg" alt="정사각형">
</div>

<div class="image-container landscape">
  <img src="photo.jpg" alt="가로형">
</div>
```

### 5. 반응형: 화면 크기에 따라 다른 object-position

```css
.hero-image {
  width: 100%;
  height: 400px;
  object-fit: cover;
  object-position: center 40%; /* 기본: 중앙 상단 쪽 */
}

@media (max-width: 768px) {
  .hero-image {
    height: 300px;
    object-position: 60% center; /* 모바일: 우측 중앙 */
  }
}

@media (max-width: 480px) {
  .hero-image {
    height: 250px;
    object-position: center top; /* 작은 화면: 상단 중앙 */
  }
}
```

### 6. CSS Grid/Flexbox와 조합

```css
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.gallery-item {
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: 8px;
}

.gallery-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transition: transform 0.3s;
}

.gallery-item:hover img {
  transform: scale(1.1); /* 호버 시 확대 */
}
```

## 함정과 주의사항

### 함정 1: width/height를 잊어버림

```css
/* ❌ 작동하지 않음 */
img {
  object-fit: cover;
}

/* ✅ 올바름 */
img {
  width: 300px;
  height: 200px;
  object-fit: cover;
}
```

**핵심:** `object-fit`은 **대체 요소(replaced element)의 내용**을 어떻게 맞출지 결정합니다. 요소 자체의 크기가 먼저 정의되어야 합니다.

### 함정 2: 부모 컨테이너 크기 문제

```html
<!-- ❌ 이미지가 부모를 넘어감 -->
<div style="width: 200px; height: 200px;">
  <img src="photo.jpg" style="object-fit: cover;">
  <!-- img는 원본 크기로 렌더링됨! -->
</div>

<!-- ✅ 올바름 -->
<div style="width: 200px; height: 200px;">
  <img src="photo.jpg" style="width: 100%; height: 100%; object-fit: cover;">
</div>
```

### 함정 3: IE11 미지원 (하지만 이제는 괜찮음)

```css
/* IE11에서는 작동하지 않음 */
img {
  object-fit: cover;
}

/* Polyfill 사용 또는 Fallback */
@supports not (object-fit: cover) {
  .image-container {
    background-size: cover;
    background-position: center;
  }

  .image-container img {
    opacity: 0; /* 실제 이미지 숨김 */
  }
}
```

**하지만:** IE11은 2022년 6월 공식 지원 종료되었으므로 대부분의 프로젝트에서는 신경 쓰지 않아도 됩니다.

### 함정 4: Lazy Loading과 함께 사용 시 레이아웃 시프트

```html
<!-- ❌ 나쁜 예: 이미지 로드되면 레이아웃이 밀림 -->
<img src="photo.jpg" loading="lazy" style="object-fit: cover;">

<!-- ✅ 올바른 예: 명시적 크기로 공간 확보 -->
<img src="photo.jpg"
     loading="lazy"
     style="width: 400px; height: 300px; object-fit: cover;">

<!-- ✅ 더 좋은 예: aspect-ratio로 비율 유지 -->
<img src="photo.jpg"
     loading="lazy"
     style="width: 100%; aspect-ratio: 4/3; object-fit: cover;">
```

### 함정 5: 잘못된 object-fit 선택

| 용도 | 올바른 값 | 잘못된 값 |
|------|-----------|-----------|
| 프로필 사진 | `cover` | `contain` (여백 생김) |
| 상품 사진 | `contain` | `cover` (상품 잘림) |
| 히어로 배경 | `cover` | `fill` (비율 깨짐) |
| 로고 | `contain` | `cover` (로고 잘림) |
| 아이콘 | `scale-down` | `cover` (작은 아이콘 확대됨) |

### 함정 6: 접근성 무시

```html
<!-- ❌ 나쁜 예 -->
<div style="background-image: url('important-info.jpg'); background-size: cover; width: 400px; height: 300px;"></div>

<!-- ✅ 올바른 예 -->
<img src="important-info.jpg"
     alt="중요한 정보: 행사 일시와 장소"
     style="width: 400px; height: 300px; object-fit: cover;">
```

**원칙:** 정보를 담은 이미지는 반드시 `<img>` 태그와 `alt` 속성 사용!

## background-image vs object-fit 비교

### background-image 방식

```html
<div class="image-bg" style="background-image: url('photo.jpg');
                              background-size: cover;
                              background-position: center;
                              width: 400px;
                              height: 300px;"></div>
```

**장점:**
- 여러 개의 배경 이미지를 겹칠 수 있음
- `background-attachment: fixed` 등 추가 효과 가능

**단점:**
- `alt` 텍스트 없음 (접근성 나쁨)
- SEO에 불리 (검색엔진이 인식 못함)
- 인쇄 시 기본적으로 출력 안 됨
- lazy loading 구현이 복잡함
- HTML이 아닌 CSS에 콘텐츠가 있음 (관심사 분리 위반)

### object-fit 방식

```html
<img src="photo.jpg"
     alt="설명"
     style="width: 400px; height: 300px; object-fit: cover; object-position: center;">
```

**장점:**
- 접근성 (alt 텍스트)
- SEO 친화적
- 인쇄 가능
- 네이티브 lazy loading 지원 (`loading="lazy"`)
- 의미론적으로 올바름

**단점:**
- 여러 이미지 겹치기 불가 (하지만 `position: absolute`로 가능)
- background 관련 효과 사용 불가

**결론:** **콘텐츠 이미지는 무조건 `<img>` + `object-fit` 사용!** 순수 장식용 배경만 `background-image` 사용.

## 브라우저 지원 및 Fallback

### 브라우저 지원 현황 (2024년 기준)

✅ **지원:**
- Chrome 32+ (2014년)
- Firefox 36+ (2015년)
- Safari 10+ (2016년)
- Edge 16+ (2017년)
- iOS Safari 10+ (2016년)
- Android Chrome/Firefox (최신)

❌ **미지원:**
- IE 11 이하 (2022년 지원 종료)

**현실적 판단:** 전 세계 브라우저의 95%+ 지원하므로 대부분의 프로젝트에서 안전하게 사용 가능합니다.

### Fallback 전략 (필요한 경우)

#### 1. @supports를 이용한 Feature Detection

```css
.image {
  width: 300px;
  height: 200px;
}

/* object-fit 지원 브라우저 */
@supports (object-fit: cover) {
  .image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

/* 미지원 브라우저 */
@supports not (object-fit: cover) {
  .image {
    background-size: cover;
    background-position: center;
    overflow: hidden;
  }

  .image img {
    display: none; /* 이미지 숨기고 배경으로 표시 */
  }
}
```

#### 2. JavaScript Polyfill

```html
<!-- object-fit-images polyfill -->
<script src="https://cdn.jsdelivr.net/npm/object-fit-images@3.2.4/dist/ofi.min.js"></script>
<script>
  objectFitImages(); // IE11에서 object-fit 에뮬레이션
</script>
```

#### 3. Modernizr를 활용한 조건부 처리

```javascript
if (Modernizr.objectfit) {
  // object-fit 지원
  image.classList.add('use-object-fit');
} else {
  // fallback: background-image 사용
  image.parentElement.style.backgroundImage = `url(${image.src})`;
  image.style.display = 'none';
}
```

## 성능 고려사항

### 1. 이미지 크기 최적화

```html
<!-- ❌ 나쁜 예: 거대한 원본 이미지 -->
<img src="photo-4000x3000.jpg"
     style="width: 200px; height: 200px; object-fit: cover;">
<!-- 4000×3000 이미지를 다운로드해서 200×200으로 축소 (낭비!) -->

<!-- ✅ 좋은 예: 적절한 크기로 사전 처리 -->
<img src="photo-400x400.jpg"
     style="width: 200px; height: 200px; object-fit: cover;">
<!-- 2배 밀도(레티나)를 고려한 400×400 이미지 -->
```

### 2. srcset과 함께 사용

```html
<img srcset="photo-400.jpg 400w,
             photo-800.jpg 800w,
             photo-1200.jpg 1200w"
     sizes="(max-width: 600px) 100vw,
            (max-width: 1200px) 50vw,
            400px"
     src="photo-800.jpg"
     alt="반응형 이미지"
     style="width: 100%; height: 300px; object-fit: cover;">
```

**효과:**
- 브라우저가 화면 크기에 맞는 이미지 선택
- 대역폭 절약
- 로딩 속도 개선

### 3. 레이지 로딩

```html
<img src="photo.jpg"
     loading="lazy"
     style="width: 400px; height: 300px; object-fit: cover;">
```

**효과:**
- 뷰포트에 보이지 않는 이미지는 나중에 로드
- 초기 페이지 로딩 속도 개선

### 4. 이미지 포맷 최적화

```html
<picture>
  <source srcset="photo.avif" type="image/avif">
  <source srcset="photo.webp" type="image/webp">
  <img src="photo.jpg"
       alt="최적화된 이미지"
       style="width: 400px; height: 300px; object-fit: cover;">
</picture>
```

**효과:**
- AVIF/WebP는 JPEG보다 30-50% 작음
- 자동 fallback으로 호환성 유지

## 실전 활용: 완전한 예제 모음

### 완전한 프로필 컴포넌트

```html
<style>
  .user-profile {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .avatar-wrapper {
    position: relative;
  }

  .avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    object-fit: cover;
    object-position: center;
    border: 3px solid #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .online-badge {
    position: absolute;
    bottom: 5px;
    right: 5px;
    width: 16px;
    height: 16px;
    background: #4caf50;
    border: 2px solid #fff;
    border-radius: 50%;
  }

  .user-info h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }

  .user-info p {
    margin: 4px 0 0;
    color: #666;
    font-size: 14px;
  }
</style>

<div class="user-profile">
  <div class="avatar-wrapper">
    <img src="profile.jpg"
         alt="홍길동 프로필 사진"
         class="avatar">
    <div class="online-badge"></div>
  </div>
  <div class="user-info">
    <h3>홍길동</h3>
    <p>프론트엔드 개발자</p>
  </div>
</div>
```

### 완전한 반응형 갤러리

```html
<style>
  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
    padding: 20px;
  }

  .gallery-item {
    position: relative;
    aspect-ratio: 1 / 1;
    overflow: hidden;
    border-radius: 12px;
    cursor: pointer;
    transition: transform 0.3s, box-shadow 0.3s;
  }

  .gallery-item:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  }

  .gallery-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    transition: transform 0.3s;
  }

  .gallery-item:hover img {
    transform: scale(1.05);
  }

  .gallery-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
    color: white;
    padding: 16px;
    opacity: 0;
    transition: opacity 0.3s;
  }

  .gallery-item:hover .gallery-overlay {
    opacity: 1;
  }

  @media (max-width: 768px) {
    .gallery-grid {
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 12px;
      padding: 12px;
    }
  }
</style>

<div class="gallery-grid">
  <div class="gallery-item">
    <img src="photo1.jpg" alt="사진 1">
    <div class="gallery-overlay">
      <h4>제목</h4>
      <p>설명</p>
    </div>
  </div>
  <!-- 더 많은 항목들... -->
</div>
```

### 완전한 카드 컴포넌트

```html
<style>
  .card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    max-width: 400px;
    transition: box-shadow 0.3s;
  }

  .card:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }

  .card-image-wrapper {
    aspect-ratio: 16 / 9;
    overflow: hidden;
    background: #f5f5f5;
  }

  .card-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    transition: transform 0.3s;
  }

  .card:hover .card-image {
    transform: scale(1.05);
  }

  .card-badge {
    position: absolute;
    top: 12px;
    left: 12px;
    background: #ff5722;
    color: white;
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
  }

  .card-body {
    padding: 20px;
  }

  .card-title {
    margin: 0 0 8px;
    font-size: 20px;
    font-weight: 600;
  }

  .card-description {
    margin: 0 0 16px;
    color: #666;
    line-height: 1.5;
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .card-price {
    font-size: 24px;
    font-weight: 700;
    color: #2196f3;
  }

  .card-button {
    background: #2196f3;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    transition: background 0.3s;
  }

  .card-button:hover {
    background: #1976d2;
  }
</style>

<div class="card">
  <div class="card-image-wrapper">
    <img src="product.jpg"
         alt="프리미엄 헤드폰"
         class="card-image">
    <div class="card-badge">NEW</div>
  </div>
  <div class="card-body">
    <h3 class="card-title">프리미엄 헤드폰</h3>
    <p class="card-description">
      뛰어난 음질과 편안한 착용감을 자랑하는
      무선 노이즈 캔슬링 헤드폰입니다.
    </p>
    <div class="card-footer">
      <div class="card-price">89,000원</div>
      <button class="card-button">구매하기</button>
    </div>
  </div>
</div>
```

## 참고 자료

### 공식 명세와 문서
- [CSS Images Module Level 3 - object-fit](https://drafts.csswg.org/css-images/#propdef-object-fit) - W3C 공식 명세
- [CSS Images Module Level 3 - object-position](https://drafts.csswg.org/css-images/#the-object-position) - W3C 공식 명세
- [MDN - object-fit](https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit) - 상세한 설명과 예제
- [MDN - object-position](https://developer.mozilla.org/en-US/docs/Web/CSS/object-position) - 위치 지정 가이드

### 브라우저 지원
- [Can I Use - object-fit](https://caniuse.com/object-fit) - 브라우저 호환성 표
- [Can I Use - object-position](https://caniuse.com/object-position) - 브라우저 호환성 표

### 실전 가이드
- [CSS-Tricks - object-fit](https://css-tricks.com/almanac/properties/o/object-fit/) - 실용적인 예제 모음
- [Web.dev - Images](https://web.dev/fast/#optimize-your-images) - 이미지 최적화 종합 가이드
- [Smashing Magazine - Aspect Ratio](https://www.smashingmagazine.com/2019/03/aspect-ratio-unit-css/) - 비율 관리 가이드

### 도구와 라이브러리
- [object-fit-images Polyfill](https://github.com/fregante/object-fit-images) - IE11 지원 polyfill
- [Cloudinary](https://cloudinary.com/) - 이미지 자동 최적화 서비스
- [Sharp](https://sharp.pixelplumbing.com/) - Node.js 이미지 처리 라이브러리

### 관련 CSS 속성
- [aspect-ratio](https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio) - 비율 유지하기
- [background-size](https://developer.mozilla.org/en-US/docs/Web/CSS/background-size) - 배경 이미지 크기
- [background-position](https://developer.mozilla.org/en-US/docs/Web/CSS/background-position) - 배경 이미지 위치

### 접근성
- [WebAIM - Alternative Text](https://webaim.org/techniques/alttext/) - alt 텍스트 작성 가이드
- [W3C - Images Tutorial](https://www.w3.org/WAI/tutorials/images/) - 이미지 접근성 튜토리얼

### 성능 최적화
- [Google - Image Optimization](https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/image-optimization) - 이미지 최적화 종합 가이드
- [ImageOptim](https://imageoptim.com/) - 이미지 압축 도구
- [Squoosh](https://squoosh.app/) - 웹 기반 이미지 최적화
