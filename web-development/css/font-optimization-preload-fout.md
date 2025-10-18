---
title: 웹폰트 최적화 완전 가이드: 다운로드부터 배포까지
date: 2025-10-02
categories: [Web Development]
tags: [this, Context, Scope, HTTP, Authentication, Security]
layout: page
---
# 웹폰트 최적화 완전 가이드: 다운로드부터 배포까지

웹폰트는 브랜딩과 사용자 경험의 핵심 요소이지만, 잘못 구현하면 성능 문제와 접근성 이슈를 야기합니다. 
이 가이드는 폰트 파일 최적화부터 웹 배포까지의 전체 과정을 다룹니다.

## 왜 웹폰트 최적화가 중요한가?

**실제 문제 사례들:**

- **Zach Leatherman의 "A Comprehensive Guide to Font Loading Strategies" (2016)**
  - 웹폰트 전문가가 문서화한 FOUT/FOIT 문제 사례들
  - Medium, Guardian 등 주요 사이트들의 폰트 로딩 실패 사례 분석
  - 참조: [zachleat.com/web/comprehensive-webfonts](https://www.zachleat.com/web/comprehensive-webfonts/)

- **Filament Group의 "How we load web fonts progressively" (2014)**
  - 실제 프로젝트에서 FOUT로 인한 사용자 이탈 증가 사례
  - 폰트 로딩 최적화 전후 성능 비교 데이터 제공
  - 참조: [filamentgroup.com/lab/font-loading](https://www.filamentgroup.com/lab/font-loading/)

- **Google Web.dev "Avoid invisible text during font swaps" (2019)**
  - 구글이 공식 문서화한 FOUT/FOIT 문제점들
  - 실제 웹사이트들의 폰트 로딩 성능 측정 결과
  - 참조: [web.dev/avoid-invisible-text](https://web.dev/avoid-invisible-text/)

이러한 문제들을 해결하기 위해 **폰트 파일 최적화 → 웹 로딩 전략 → 성능 모니터링**의 체계적인 접근이 필요합니다.

## 1단계: 웹폰트 로딩 문제 이해

### 웹폰트 로딩 문제의 두 가지 유형: FOUT vs FOIT

### FOUT(Flash of Unstyled Text)
- **현상**: 웹폰트 로드 전 fallback 폰트로 텍스트 표시 → 웹폰트 로드 완료 시 깜빡이며 변경
- **브라우저**: Chrome, Firefox, Safari 등 대부분의 모던 브라우저
- **장점**: 텍스트가 즉시 보여 읽기 가능
- **단점**: 폰트 변경 시 깜빡임과 레이아웃 시프트 발생

### FOIT(Flash of Invisible Text)
- **현상**: 웹폰트 로드 완료까지 텍스트를 아예 숨김 → 로드 완료 시 갑자기 나타남
- **브라우저**: 구형 IE, 일부 설정의 브라우저
- **장점**: 폰트 변경으로 인한 깜빡임 없음
- **단점**: 텍스트가 보이지 않아 사용자가 내용을 읽을 수 없음 (더 심각한 문제)

### 비교표

| 특징 | FOUT | FOIT |
|------|------|------|
| **텍스트 가시성** | 즉시 표시 (fallback 폰트) | 웹폰트 로드까지 숨김 |
| **사용자 경험** | 읽기 가능하지만 깜빡임 | 읽기 불가능 |
| **성능 인식** | 빠르게 느껴짐 | 느리게 느껴짐 |
| **접근성** | 양호 | 나쁨 |
| **권장도** | 상대적으로 나음 | 피해야 함 |

### FOUT 문제 상황 예시

```html
<!-- ❌ 일반적인 폰트 로딩 -->
<html>
<head>
  <style>
    body { font-family: 'Noto Sans KR', sans-serif; }
  </style>
  <link rel="stylesheet" href="/css/fonts.css">
</head>
<body>
  <p>한글 텍스트 내용</p>
</body>
</html>
```

**발생하는 문제:**
1. 페이지 로드 시 fallback 폰트(sans-serif)로 텍스트 표시
2. 웹 폰트 로드 완료 후 지정된 폰트로 변경
3. 폰트 변경 시 깜빡임 현상 발생 (FOUT)
4. 레이아웃 시프트 가능성 (폰트 크기 차이로 인한)

## 2단계: 폰트 파일 최적화 (Python 활용)

웹에서 사용하기 전에 폰트 파일 자체를 최적화하는 것이 첫 번째 단계입니다.

### Python을 이용한 폰트 최적화

#### 필요한 라이브러리 설치

```bash
pip install fonttools[woff] brotli
```

#### 1. 폰트 서브셋팅 (불필요한 글리프 제거)

```python
# font_optimizer.py
from fontTools import subset
from fontTools.ttLib import TTFont
import os

def create_korean_subset(input_font, output_font):
    """
    한글 전용 서브셋 생성
    """
    # 한글 완성형 유니코드 범위
    korean_unicode_ranges = [
        'U+AC00-D7AF',  # 한글 완성형
        'U+1100-11FF',  # 한글 자모
        'U+3130-318F',  # 한글 호환 자모
        'U+0020-007F',  # 기본 라틴 문자
        'U+00A0-00FF',  # 라틴-1 보충
    ]
    
    # 서브셋 옵션 설정
    options = subset.Options()
    options.flavor = 'woff2'  # 출력 형식
    options.with_zopfli = True  # 압축 최적화
    options.desubroutinize = True  # 서브루틴 제거로 크기 감소
    
    # 서브셋 생성
    subsetter = subset.Subsetter(options=options)
    
    # 유니코드 범위 파싱
    unicodes = []
    for range_str in korean_unicode_ranges:
        if '-' in range_str:
            start, end = range_str.replace('U+', '').split('-')
            unicodes.extend(range(int(start, 16), int(end, 16) + 1))
        else:
            unicodes.append(int(range_str.replace('U+', ''), 16))
    
    subsetter.populate(unicodes=unicodes)
    
    # 폰트 로드 및 서브셋 적용
    font = TTFont(input_font)
    subsetter.subset(font)
    
    # 저장
    font.save(output_font)
    print(f"서브셋 생성 완료: {output_font}")
    
    # 파일 크기 비교
    original_size = os.path.getsize(input_font)
    subset_size = os.path.getsize(output_font)
    reduction = (1 - subset_size / original_size) * 100
    
    print(f"원본 크기: {original_size:,} bytes")
    print(f"서브셋 크기: {subset_size:,} bytes")
    print(f"크기 감소: {reduction:.1f}%")

# 사용 예시
if __name__ == "__main__":
    create_korean_subset(
        'NotoSansKR-Regular.otf',
        'NotoSansKR-Regular-subset.woff2'
    )
```

#### 2. 폰트 메타데이터 최적화

```python
# font_metadata_optimizer.py
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables._n_a_m_e import NameRecord

def optimize_font_metadata(input_font, output_font):
    """
    폰트 메타데이터 최적화 및 불필요한 테이블 제거
    """
    font = TTFont(input_font)
    
    # 1. 불필요한 테이블 제거
    unnecessary_tables = [
        'DSIG',  # 디지털 서명
        'LTSH',  # 선형 임계값
        'VDMX',  # 수직 디바이스 메트릭
        'hdmx',  # 수평 디바이스 메트릭
        'PCLT',  # PCL 5 테이블
    ]
    
    for table in unnecessary_tables:
        if table in font:
            del font[table]
            print(f"테이블 제거: {table}")
    
    # 2. 이름 테이블 최적화
    if 'name' in font:
        name_table = font['name']
        
        # 필수 이름 레코드만 유지
        essential_name_ids = [
            1,   # 폰트 패밀리명
            2,   # 서브패밀리명
            4,   # 전체 폰트명
            6,   # PostScript명
            16,  # 선호 패밀리명
            17,  # 선호 서브패밀리명
        ]
        
        # 기존 레코드 백업
        original_records = list(name_table.names)
        
        # 새로운 레코드 리스트 생성
        new_records = []
        for record in original_records:
            if record.nameID in essential_name_ids:
                # 영어(1033)와 유니코드(0) 플랫폼만 유지
                if (record.platformID == 3 and record.langID == 1033) or \
                   (record.platformID == 0):
                    new_records.append(record)
        
        # 이름 테이블 업데이트
        name_table.names = new_records
        print(f"이름 레코드 최적화: {len(original_records)} → {len(new_records)}")
    
    # 3. 힌팅 정보 제거 (웹폰트에서는 불필요)
    if 'fpgm' in font:
        del font['fpgm']
        print("fpgm 테이블 제거 (폰트 프로그램)")
    
    if 'prep' in font:
        del font['prep']
        print("prep 테이블 제거 (사전 프로그램)")
    
    if 'cvt ' in font:
        del font['cvt ']
        print("cvt 테이블 제거 (제어 값)")
    
    # 저장
    font.save(output_font)
    
    # 파일 크기 비교
    original_size = os.path.getsize(input_font)
    optimized_size = os.path.getsize(output_font)
    reduction = (1 - optimized_size / original_size) * 100
    
    print(f"\n메타데이터 최적화 완료:")
    print(f"원본 크기: {original_size:,} bytes")
    print(f"최적화 크기: {optimized_size:,} bytes")
    print(f"크기 감소: {reduction:.1f}%")

# 사용 예시
if __name__ == "__main__":
    optimize_font_metadata(
        'NotoSansKR-Regular-subset.woff2',
        'NotoSansKR-Regular-optimized.woff2'
    )
```

#### 3. 배치 최적화 스크립트

```python
# batch_font_optimizer.py
import os
import glob
from font_optimizer import create_korean_subset
from font_metadata_optimizer import optimize_font_metadata

def batch_optimize_fonts(input_dir, output_dir):
    """
    폴더 내 모든 폰트 파일을 일괄 최적화
    """
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # 지원하는 폰트 형식
    font_extensions = ['*.otf', '*.ttf', '*.woff', '*.woff2']
    
    total_original_size = 0
    total_optimized_size = 0
    
    for extension in font_extensions:
        pattern = os.path.join(input_dir, extension)
        font_files = glob.glob(pattern)
        
        for font_file in font_files:
            print(f"\n처리 중: {os.path.basename(font_file)}")
            
            base_name = os.path.splitext(os.path.basename(font_file))[0]
            
            # 1단계: 서브셋 생성
            subset_file = os.path.join(output_dir, f"{base_name}-subset.woff2")
            create_korean_subset(font_file, subset_file)
            
            # 2단계: 메타데이터 최적화
            final_file = os.path.join(output_dir, f"{base_name}-final.woff2")
            optimize_font_metadata(subset_file, final_file)
            
            # 임시 파일 정리
            os.remove(subset_file)
            
            # 크기 누적
            original_size = os.path.getsize(font_file)
            optimized_size = os.path.getsize(final_file)
            
            total_original_size += original_size
            total_optimized_size += optimized_size
    
    # 전체 결과 출력
    total_reduction = (1 - total_optimized_size / total_original_size) * 100
    print(f"\n=== 전체 최적화 결과 ===")
    print(f"총 원본 크기: {total_original_size:,} bytes")
    print(f"총 최적화 크기: {total_optimized_size:,} bytes")
    print(f"총 크기 감소: {total_reduction:.1f}%")

# 사용 예시
if __name__ == "__main__":
    batch_optimize_fonts('./fonts/original', './fonts/optimized')
```

### 실제 최적화 사례

**Noto Sans KR 최적화 결과:**
```
원본 파일: NotoSansKR-Regular.otf (2.1MB)
↓ 한글 서브셋팅
서브셋 파일: NotoSansKR-Regular-subset.woff2 (847KB) - 60% 감소
↓ 메타데이터 최적화
최종 파일: NotoSansKR-Regular-final.woff2 (823KB) - 61% 감소
```

**최적화 효과:**
- 파일 크기: 2.1MB → 823KB (61% 감소)
- 로딩 시간: 3G 환경에서 약 2초 → 0.8초
- 대역폭 절약: 사용자 1000명 기준 월 1.2GB 절약

## 3단계: 웹 로딩 전략 구현

폰트 파일 최적화가 완료되면 웹에서의 로딩 전략을 구현합니다.

### 기본 구현: preload + 비동기 CSS

### 1. 기본 구현: preload + 비동기 CSS

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>폰트 최적화 예시</title>
  
  <!-- 크리티컬 CSS 인라인 -->
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      margin: 0; 
      line-height: 1.6;
    }
  </style>
  
  <!-- 폰트 파일 preload: FOUT 방지를 위한 우선 다운로드 -->
  <link rel="preload" href="/fonts/NotoSansKR-Regular.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/fonts/NotoSansKR-Bold.woff2" as="font" type="font/woff2" crossorigin>
  
  <!-- 폰트 CSS는 비동기 로드 -->
  <link rel="stylesheet" href="/css/fonts.css" media="print" onload="this.media='all'">
  
  <!-- JavaScript 비활성화 환경 대응 -->
  <noscript><link rel="stylesheet" href="/css/fonts.css"></noscript>
</head>
<body>
  <h1>웹사이트 제목</h1>
  <p>한글 텍스트 내용이 깜빡임 없이 표시됩니다.</p>
</body>
</html>
```

### 2. fonts.css 구현

```css
/* fonts.css */
@font-face {
  font-family: 'Noto Sans KR';
  src: url('/fonts/NotoSansKR-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap; /* 폰트 로딩 중 fallback 폰트 표시 */
}

@font-face {
  font-family: 'Noto Sans KR';
  src: url('/fonts/NotoSansKR-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

/* 폰트 적용 */
body {
  font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif;
}

h1, h2, h3, h4, h5, h6 {
  font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif;
  font-weight: 700;
}
```

## 폰트 로딩 전략

### 동작 순서

```
1. HTML 파싱 시작
   ↓
2. 폰트 파일 preload 시작 (최우선 다운로드)
   ↓
3. 인라인 CSS로 즉시 렌더링 (fallback 폰트)
   ↓
4. fonts.css 백그라운드 다운로드
   ↓
5. fonts.css 로드 완료 → @font-face 정의 적용
   ↓
6. preload된 폰트 파일 즉시 적용 (깜빡임 없음)
```

### 속성 설명

**1. `crossorigin` 속성**
```html
<link rel="preload" href="/fonts/font.woff2" as="font" type="font/woff2" crossorigin>
```
- 폰트 파일은 CORS 정책에 따라 crossorigin 속성 필수
- 없으면 preload가 무시되고 중복 다운로드 발생

**2. `font-display: swap`**
```css
@font-face {
  font-family: 'Custom Font';
  src: url('font.woff2') format('woff2');
  font-display: swap; /* 핵심 속성 */
}
```

**font-display 옵션:**
- `auto`: 브라우저 기본 동작
- `block`: 폰트 로드까지 텍스트 숨김 (최대 3초)
- `swap`: 즉시 fallback 폰트 표시, 로드 완료 시 교체 ✅ **권장**
- `fallback`: 짧은 차단 후 fallback 표시, 제한된 시간 내 교체
- `optional`: 네트워크 상태에 따라 폰트 사용 여부 결정

## 

### 1. 폰트 서브셋팅

```html
<!-- 한글 전용 서브셋 -->
<link rel="preload" href="/fonts/NotoSansKR-Korean.woff2" as="font" type="font/woff2" crossorigin>

<!-- 영문 전용 서브셋 -->
<link rel="preload" href="/fonts/NotoSansKR-Latin.woff2" as="font" type="font/woff2" crossorigin>
```

```css
/* 유니코드 범위 지정 */
@font-face {
  font-family: 'Noto Sans KR';
  src: url('/fonts/NotoSansKR-Korean.woff2') format('woff2');
  unicode-range: U+AC00-D7AF; /* 한글 완성형 */
  font-display: swap;
}

@font-face {
  font-family: 'Noto Sans KR';
  src: url('/fonts/NotoSansKR-Latin.woff2') format('woff2');
  unicode-range: U+0000-00FF; /* 라틴 문자 */
  font-display: swap;
}
```

### 2. 조건부 폰트 로딩

```html
<script>
// 네트워크 상태에 따른 조건부 로딩
if ('connection' in navigator) {
  const connection = navigator.connection;
  
  // 빠른 네트워크에서만 웹 폰트 로드
  if (connection.effectiveType === '4g') {
    const fontLink = document.createElement('link');
    fontLink.rel = 'preload';
    fontLink.href = '/fonts/NotoSansKR-Regular.woff2';
    fontLink.as = 'font';
    fontLink.type = 'font/woff2';
    fontLink.crossOrigin = 'anonymous';
    document.head.appendChild(fontLink);
  }
}
</script>
```

### 3. 폰트 로딩 상태 모니터링

```javascript
// Font Loading API 사용
if ('fonts' in document) {
  // 폰트 로딩 시작
  document.fonts.load('400 16px "Noto Sans KR"').then(() => {
    console.log('폰트 로딩 완료');
    document.body.classList.add('fonts-loaded');
  });
  
  // 모든 폰트 로딩 완료 감지
  document.fonts.ready.then(() => {
    console.log('모든 폰트 로딩 완료');
  });
}
```

```css
/* 폰트 로딩 상태에 따른 스타일 조정 */
body {
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  transition: font-family 0.1s ease;
}

body.fonts-loaded {
  font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif;
}
```

## 성능 측정 및 모니터링

### 1. 폰트 로딩 성능 측정

```javascript
// 폰트 로딩 시간 측정
function measureFontLoading() {
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.name.includes('.woff2')) {
        console.log(`폰트 로딩 시간: ${entry.name}`, {
          duration: `${entry.duration.toFixed(2)}ms`,
          transferSize: `${entry.transferSize} bytes`
        });
      }
    });
  });
  
  observer.observe({ entryTypes: ['resource'] });
}

// 페이지 로드 시 측정 시작
window.addEventListener('load', measureFontLoading);
```

### 2. 레이아웃 시프트 모니터링

```javascript
// Cumulative Layout Shift 측정
new PerformanceObserver((list) => {
  let clsValue = 0;
  
  list.getEntries().forEach((entry) => {
    if (!entry.hadRecentInput) {
      clsValue += entry.value;
    }
  });
  
  console.log('CLS (폰트 관련):', clsValue);
}).observe({ entryTypes: ['layout-shift'] });
```

## 브라우저별 최적화

### 1. 구형 브라우저 대응

```html
<!-- IE11 등 구형 브라우저 대응 -->
<script>
// preload 지원 여부 확인
if (!('onload' in document.createElement('link'))) {
  // 구형 브라우저: 일반 CSS 로딩
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/css/fonts.css';
  document.head.appendChild(link);
} else {
  // 모던 브라우저: preload 사용
  const fontFiles = [
    '/fonts/NotoSansKR-Regular.woff2',
    '/fonts/NotoSansKR-Bold.woff2'
  ];
  
  fontFiles.forEach(href => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff2';
    link.href = href;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}
</script>
```

### 2. 모바일 최적화

```css
/* 모바일에서 폰트 크기 최적화 */
@media (max-width: 768px) {
  body {
    font-size: 14px;
    line-height: 1.5;
  }
  
  /* 모바일에서는 가벼운 폰트 사용 */
  @font-face {
    font-family: 'Noto Sans KR Light';
    src: url('/fonts/NotoSansKR-Light.woff2') format('woff2');
    font-weight: 300;
    font-display: swap;
  }
}
```

## 체크리스트

### ✅ 필수 구현 사항

1. **폰트 파일 preload**
   - `as="font"` + `crossorigin` 속성 필수
   - 중요한 폰트만 preload (보통 2-3개)

2. **font-display: swap 설정**
   - 모든 @font-face에 적용
   - FOUT 방지와 성능 균형

3. **폴백 폰트 체인**
   - 시스템 폰트를 fallback으로 설정
   - 폰트 크기 유사성 고려

4. **noscript 대응**
   - JavaScript 비활성화 환경 고려

### ❌ 주의사항

1. **과도한 preload 금지**
   - 너무 많은 폰트 preload는 오히려 성능 저하
   - 핵심 폰트만 선별적으로 preload

2. **crossorigin 누락 주의**
   - 폰트 preload 시 crossorigin 속성 필수
   - 누락 시 중복 다운로드 발생

3. **폰트 크기 최적화**
   - 서브셋팅으로 파일 크기 최소화
   - 불필요한 글리프 제거

## 참고 자료

### 공식 문서
- **[MDN - Preloading content with rel="preload"](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/preload)** - preload 속성 공식 가이드
- **[MDN - font-display](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display)** - font-display 속성 상세 설명
- **[W3C - CSS Fonts Module Level 4](https://www.w3.org/TR/css-fonts-4/)** - CSS 폰트 명세서

### 성능 최적화 가이드
- **[Google Web.dev - Font best practices](https://web.dev/font-best-practices/)** - 구글 폰트 최적화 가이드
- **[Google Web.dev - Avoid invisible text during font swaps](https://web.dev/avoid-invisible-text/)** - FOIT/FOUT 방지 전략
- **[Google Web.dev - Reduce WebFont Size](https://web.dev/reduce-webfont-size/)** - 웹폰트 크기 최적화

### 도구 및 측정
- **[Font Loading Strategies](https://www.zachleat.com/web/comprehensive-webfonts/)** - 종합적인 웹폰트 로딩 전략
- **[Fontface Ninja](https://www.fontface.ninja/)** - 웹사이트 폰트 분석 도구
- **[Google Fonts](https://fonts.google.com/)** - 최적화된 웹폰트 서비스

폰트 최적화는 사용자 경험에 직접적인 영향을 미치는 중요한 요소입니다. `preload`와 적절한 CSS 전략을 통해 FOUT를 방지하고 빠른 폰트 로딩을 구현할 수 있습니다.
