---
title: 웹 접근성 테스팅 가이드
description: 자동화 도구는 30-40%만 찾습니다. Lighthouse, axe DevTools, 스크린 리더를 활용한 완전한 접근성 테스팅 방법과 CI/CD 통합 가이드.
date: 2019-09-20
last_modified_at: 2019-10-24
categories: [Web Development, Accessibility, Testing]
tags: [Accessibility Testing, A11y Testing, Screen Reader, Automated Testing]
render_with_liquid: false
layout: page
---

# 접근성 테스팅 - "확인하지 않으면 알 수 없습니다"

## "100% 통과했는데 왜 안 돼요?"

제품 출시 전날이었습니다. Lighthouse 접근성 점수 100점! axe DevTools도 위반사항 0개! 완벽했죠.

다음 날 아침, 실제 스크린 리더 사용자로부터 피드백이 왔습니다: **"회원가입 폼을 찾을 수 없어요. 어디 있는 건가요?"**

당황해서 NVDA로 직접 테스트해보니... 폼은 있었지만 **"버튼, 버튼, 버튼, 버튼..."**만 반복해서 들렸습니다. 각 버튼이 무엇인지 전혀 알 수 없었죠.

그때 깨달았습니다. **자동화 도구는 시작일 뿐, 진짜 테스트는 직접 해봐야 한다는 것을요.**

## 접근성 테스팅의 진실

접근성 테스팅에 대한 **불편한 진실**:

```
자동화 도구가 찾는 문제: 30-40%
수동 테스트가 필요한 문제: 60-70%
```

**왜 그럴까요?**

자동화 도구는 "이미지에 alt가 있는가?"는 확인할 수 있지만, "alt 텍스트가 의미 있는가?"는 확인할 수 없습니다.

```html
<!-- 자동화 도구: ✅ 통과 -->
<img src="photo.jpg" alt="image123">

<!-- 실제 사용자: ❌ 의미 없음 -->
스크린 리더: "이미지 123"
사용자: "이게 뭐지?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<!-- 올바른 alt -->
<img src="photo.jpg" alt="팀원들이 회의실에서 프로젝트를 논의하는 모습">
```

**그래서 우리는 3가지 레이어의 테스팅이 필요합니다:**

1. **자동화 테스팅** - 빠른 기본 검사 (30-40%)
2. **수동 테스팅** - 실제 사용성 확인 (60-70%)
3. **사용자 테스팅** - 실제 장애인 사용자 피드백 (100%)

---

## 레이어 1: 자동화 테스팅 - 빠른 기본 검사

자동화 도구는 **기본적인 문제를 빠르게 찾아냅니다**. CI/CD에 통합하여 매번 자동 검사할 수 있습니다.

### 1. Lighthouse - Chrome에 내장된 감사 도구

**왜 좋은가?**
- Chrome에 이미 내장되어 있어 설치 불필요
- 성능, SEO, PWA 등 다른 지표도 함께 확인
- 개발 중 빠른 피드백

**사용법:**

```bash
# 방법 1: Chrome DevTools
1. F12 키
2. Lighthouse 탭
3. "Accessibility" 선택
4. "Analyze page load" 클릭

# 방법 2: CLI (CI/CD 통합)
npm install -g lighthouse
lighthouse https://yoursite.com --only-categories=accessibility --output html --output-path ./report.html
```

**출력 예시:**

```
Performance: 95
Accessibility: 78  👈 개선 필요
Best Practices: 92
SEO: 100

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Accessibility Issues:
❌ [button-name] Buttons do not have an accessible name
   Found 3 elements

❌ [color-contrast] Background and foreground colors do not have sufficient contrast
   Found 5 elements

⚠️  [image-alt] Image elements do not have [alt] attributes
   Found 2 elements
```

**장점:**
- ✅ 즉시 사용 가능
- ✅ 종합 리포트
- ✅ CI/CD 통합 쉬움

**단점:**
- ❌ 페이지 로드 시점만 확인 (동적 콘텐츠 미확인)
- ❌ 기본적인 문제만 검사

### 2. axe DevTools - 가장 정확한 접근성 테스터

**왜 좋은가?**
- 업계 표준 (Deque Systems 개발)
- 가장 정확하고 false positive 적음
- WCAG 2.1 레벨별 검사

**사용법:**

```bash
# 방법 1: 브라우저 확장 프로그램
1. Chrome Web Store에서 "axe DevTools" 검색
2. 확장 프로그램 설치
3. F12 → axe DevTools 탭
4. "Scan ALL of my page" 클릭

# 방법 2: CLI
npm install --save-dev @axe-core/cli
npx axe https://yoursite.com --rules wcag2a,wcag2aa

# 방법 3: JavaScript API (테스트 통합)
npm install --save-dev axe-core
```

**테스트 코드에서 사용:**

```javascript
import axe from 'axe-core';

// React Testing Library
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('should not have accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

**출력 예시:**

```
Violation 1: button-name
  Impact: critical
  Description: Buttons must have discernible text
  WCAG: 4.1.2

  Elements:
  <button onclick="submit()">
    <svg>...</svg>  👈 아이콘만 있음
  </button>

  How to fix:
  - Add aria-label attribute
  - Add text content
  - Add aria-labelledby
```

**장점:**
- ✅ 가장 정확함
- ✅ 상세한 설명과 수정 방법 제공
- ✅ React, Vue, Angular 통합
- ✅ 동적 콘텐츠도 검사 가능

**단점:**
- ❌ 무료 버전은 기능 제한 (하지만 충분함)

### 3. WAVE - 시각적으로 문제 표시

**왜 좋은가?**
- 페이지에 직접 문제를 시각적으로 표시
- 초보자에게 가장 친화적
- 완전 무료

**사용법:**

```bash
# 방법 1: 브라우저 확장 프로그램
1. https://wave.webaim.org/extension/
2. 확장 프로그램 설치
3. 페이지에서 WAVE 아이콘 클릭

# 방법 2: 웹 인터페이스
https://wave.webaim.org/ 에서 URL 입력
```

**장점:**
- ✅ 문제 위치를 페이지에 직접 표시
- ✅ 무료
- ✅ 사용하기 쉬움

**단점:**
- ❌ 심층 분석 부족
- ❌ CI/CD 통합 어려움

### 4. pa11y - CI/CD에 최적화된 도구

**왜 좋은가?**
- CLI 친화적
- 여러 URL 일괄 테스트
- GitHub Actions, GitLab CI 등과 완벽 통합

**사용법:**

```bash
# 설치
npm install -g pa11y pa11y-ci

# 단일 URL 테스트
pa11y https://yoursite.com

# 여러 URL 테스트
pa11y-ci --config .pa11yrc.json
```

**`.pa11yrc.json` 설정:**

```json
{
  "defaults": {
    "standard": "WCAG2AA",
    "timeout": 30000,
    "wait": 1000,
    "chromeLaunchConfig": {
      "args": ["--no-sandbox"]
    }
  },
  "urls": [
    "https://yoursite.com",
    "https://yoursite.com/about",
    "https://yoursite.com/contact"
  ]
}
```

**장점:**
- ✅ CI/CD 통합 매우 쉬움
- ✅ 여러 페이지 자동 테스트
- ✅ 빌드 실패 조건 설정 가능

**단점:**
- ❌ 시각적 인터페이스 없음

### 5. eslint-plugin-jsx-a11y - 코딩 중 실시간 피드백

**왜 좋은가?**
- 문제를 조기에 발견 (코딩 중!)
- 팀 전체 일관성 유지
- 에디터에서 즉시 피드백

**설치 및 설정:**

```bash
npm install --save-dev eslint-plugin-jsx-a11y
```

**`.eslintrc.js`:**

```javascript
module.exports = {
  extends: [
    'plugin:jsx-a11y/recommended'
  ],
  plugins: ['jsx-a11y'],
  rules: {
    // 엄격 모드
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/anchor-has-content': 'error',
    'jsx-a11y/aria-props': 'error',
    'jsx-a11y/aria-role': 'error',
    'jsx-a11y/click-events-have-key-events': 'error',
    'jsx-a11y/label-has-associated-control': 'error',
    'jsx-a11y/no-static-element-interactions': 'warn'
  }
};
```

**VS Code에서 실시간 피드백:**

```jsx
// ❌ 에러 표시
<img src="photo.jpg">
     ~~~~~~~~~~~~~~~~
     Missing alt attribute

// ❌ 경고 표시
<div onClick={handleClick}>클릭</div>
     ~~~~~~~~~~~~~~~~~~~~~
     onClick must be accompanied by onKeyDown/onKeyUp/onKeyPress
```

**장점:**
- ✅ 실시간 피드백
- ✅ 문제 조기 발견
- ✅ 자동 수정 (일부)

**단점:**
- ❌ React/JSX 전용
- ❌ 정적 분석의 한계

---

## 레이어 2: 수동 테스팅 - 실제 사용성 확인

자동화 도구는 30-40%만 찾습니다. 나머지 60-70%는 **직접 해봐야** 합니다.

### 1. 키보드 네비게이션 - 가장 중요한 테스트

**시나리오:**

여러분의 사이트를 마우스 없이 사용하는 사용자를 상상해보세요. 손이 불편해서, 또는 시각 장애가 있어서, 또는 단순히 마우스가 고장나서요.

**테스트 방법:**

```
1. 마우스를 물리적으로 치워두세요 (진짜로!)
2. Tab 키만으로 전체 사이트 탐색
3. 모든 기능을 키보드로 실행
4. 막히는 곳이 있으면 기록
```

**체크리스트:**

```markdown
[ ] Tab으로 모든 인터랙티브 요소에 접근 가능
    → 버튼, 링크, 폼 필드, 드롭다운 등

[ ] Shift + Tab으로 역순 이동 가능
    → 이전 요소로 돌아갈 수 있어야 함

[ ] Enter로 버튼과 링크 활성화
    → <button>, <a> 요소

[ ] Space로 버튼, 체크박스 활성화
    → <button>, <input type="checkbox">

[ ] 화살표 키로 라디오 버튼, 탭, 메뉴 이동
    → 커스텀 위젯

[ ] Esc로 모달, 드롭다운 닫기
    → 닫기 기능 필수

[ ] 포커스 순서가 논리적
    → 위에서 아래, 왼쪽에서 오른쪽

[ ] 포커스 표시가 명확히 보임
    → 3px 이상 outline, 충분한 대비

[ ] 키보드 트랩 없음
    → 모달에서 빠져나올 수 있어야 함

[ ] 스킵 링크 작동
    → "본문으로 건너뛰기"
```

**흔한 문제:**

```html
❌ div를 버튼으로 사용 (키보드 접근 불가)
<div onclick="submit()">제출</div>

✅ 진짜 button 사용
<button onclick="submit()">제출</button>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ 포커스 표시 제거
:focus { outline: none; }

✅ 명확한 포커스 표시
:focus-visible {
  outline: 3px solid #ff230a;
  outline-offset: 2px;
}
```

### 2. 스크린 리더 테스팅 - 가장 중요하지만 가장 어려운 테스트

**왜 중요한가?**

시각 장애인 사용자는 **스크린 리더**로 웹을 "듣습니다". 자동화 도구는 스크린 리더 경험을 절대 확인할 수 없습니다.

#### VoiceOver (macOS) - 무료, 내장

**활성화:**

```
Command + F5
```

**필수 단축키:**

```
VO = Control + Option

VO + A          : 웹 로터 (모든 요소 목록)
VO + →          : 다음 요소
VO + ←          : 이전 요소
VO + Command + H: 다음 헤딩
VO + Command + L: 다음 링크
VO + Space      : 활성화 (클릭)
VO + U          : 로터 열기
Control         : 읽기 중지
```

**실전 팁:**

```
처음에는 혼란스러울 겁니다. 정상입니다!

1. 작은 페이지부터 시작 (로그인 폼 등)
2. 눈을 감고 들어보세요
3. "이게 뭔지 알겠어?"라고 자문
4. 헷갈리면 문제가 있는 것
```

#### NVDA (Windows) - 무료, 오픈소스

**다운로드:**
https://www.nvaccess.org/download/

**필수 단축키:**

```
NVDA = Insert 또는 CapsLock

NVDA + Down     : 다음 줄 읽기
NVDA + H        : 다음 헤딩
NVDA + K        : 다음 링크
NVDA + F        : 다음 폼 필드
NVDA + T        : 다음 테이블
Insert + F7     : 요소 목록
Control         : 읽기 중지
```

#### 스크린 리더 테스트 체크리스트

```markdown
[ ] 페이지 제목이 적절히 읽힘
    → <title> 태그가 페이지 내용 설명

[ ] 헤딩 계층이 논리적
    → H1 → H2 → H3 순서대로

[ ] 이미지 alt 텍스트가 의미 전달
    → "image123" (X) / "팀원들이 회의하는 모습" (O)

[ ] 링크 텍스트가 목적을 설명
    → "여기 클릭" (X) / "가격표 다운로드" (O)

[ ] 폼 레이블이 명확
    → 각 input에 연결된 label

[ ] 에러 메시지가 읽힘
    → aria-describedby 또는 role="alert"

[ ] 동적 콘텐츠 변경이 알려짐
    → aria-live regions

[ ] 모달이 포커스 트랩
    → Tab 순환, Esc로 닫기
```

**실제 테스트 시나리오:**

```
시나리오: 로그인하기

1. 페이지 로드
   → "로그인 - 사이트명"

2. Tab으로 첫 입력 필드
   → "이메일, 텍스트 입력"

3. 이메일 입력
   → 입력한 글자 읽음

4. Tab으로 다음 필드
   → "비밀번호, 보안 텍스트 입력"

5. Tab으로 버튼
   → "로그인 버튼"

6. Enter로 제출
   → "로그인 중..." (aria-live)
   → "로그인 성공" 또는 "오류: ..."
```

### 3. 색상 대비 검사 - 읽기 쉬운가?

**테스트 도구:**

**1. Chrome DevTools (가장 쉬움)**

```
1. 요소 검사 (F12)
2. Elements 탭
3. Styles 패널에서 색상 값 찾기
4. 색상 박스 클릭
5. "Contrast ratio" 섹션 확인
   → AA, AAA 마크 확인
```

**2. WebAIM Contrast Checker**

https://webaim.org/resources/contrastchecker/

```
1. 전경색 (텍스트) 입력: #666666
2. 배경색 입력: #ffffff
3. 결과 확인:

   Contrast Ratio: 5.74:1
   ✅ WCAG AA (4.5:1 이상)
   ❌ WCAG AAA (7:1 필요)
```

**기준:**

```
일반 텍스트 (18px 미만):
- WCAG AA: 4.5:1 ✅ 대부분 충족
- WCAG AAA: 7:1   ✅ 더 좋음

큰 텍스트 (18px 이상 또는 14px Bold):
- WCAG AA: 3:1
- WCAG AAA: 4.5:1

UI 컴포넌트 (버튼, 아이콘 등):
- WCAG AA: 3:1
```

**자주 하는 실수:**

```css
❌ 대비 부족: 2.1:1
.text {
  color: #cccccc;
  background: #ffffff;
}

✅ 충분한 대비: 7.0:1
.text {
  color: #595959;
  background: #ffffff;
}
```

### 4. 확대/축소 테스팅 - 저시력 사용자

**테스트:**

```
브라우저 확대:
- 확대: Cmd/Ctrl + +
- 축소: Cmd/Ctrl + -
- 100%: Cmd/Ctrl + 0
```

**체크리스트:**

```markdown
[ ] 200% 확대 시 레이아웃 깨지지 않음
    → 수평 스크롤 없음

[ ] 400% 확대 시 2차원 스크롤 불필요
    → 세로 스크롤만

[ ] 텍스트가 잘리지 않음
    → overflow: hidden 주의

[ ] 중요 기능에 접근 가능
    → 버튼이 화면 밖으로 안 나감

[ ] 고정 폰트 크기 사용 안 함
    → px 대신 rem, em 사용
```

**좋은 예:**

```css
/* ✅ 상대 단위 사용 */
.text {
  font-size: 1rem;     /* 사용자 설정 반영 */
  line-height: 1.5;
  max-width: 70ch;    /* 읽기 좋은 줄 길이 */
}

/* ❌ 고정 크기 */
.text {
  font-size: 14px;    /* 확대 안 됨 */
  width: 600px;       /* 반응형 아님 */
}
```

### 5. 모바일 접근성 - 터치와 제스처

**체크리스트:**

```markdown
[ ] 터치 타겟 최소 44x44px
    → 손가락 크기

[ ] 터치 타겟 간 충분한 간격
    → 최소 8px

[ ] 핀치 줌 허용
    → viewport meta 태그 확인

[ ] 가로/세로 모드 모두 지원
    → orientation lock 금지

[ ] 모바일 스크린 리더 테스트
    → TalkBack (Android), VoiceOver (iOS)
```

**나쁜 예:**

```html
<!-- ❌ 줌 차단 -->
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">

<!-- ✅ 줌 허용 -->
<meta name="viewport" content="width=device-width, initial-scale=1">
```

```css
/* ❌ 터치 타겟 작음 */
.button {
  width: 30px;
  height: 30px;
}

/* ✅ 충분한 크기 */
.button {
  min-width: 44px;
  min-height: 44px;
  padding: 12px 16px;
}
```

---

## 레이어 3: CI/CD 통합 - 자동으로 지키기

접근성을 한 번만 확인하는 것이 아니라, **매 배포마다** 자동으로 확인하세요.

### GitHub Actions 예시

```yaml
name: Accessibility Tests

on: [push, pull_request]

jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Start server
        run: npm start &

      - name: Wait for server
        run: npx wait-on http://localhost:3000

      - name: Run pa11y
        run: |
          npm install -g pa11y-ci
          pa11y-ci --config .pa11yrc.json

      - name: Run axe
        run: |
          npm install -g @axe-core/cli
          axe http://localhost:3000 --exit
```

### Jest + axe-core 통합

```javascript
// setupTests.js
import { toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

// MyComponent.test.js
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import MyComponent from './MyComponent';

test('should not have accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

**빌드가 실패하면:**

```
FAIL  src/components/MyComponent.test.js
  ✕ should not have accessibility violations (123 ms)

  Expected the HTML found at $('button') to have no violations:

  <button onclick="submit()">
    <svg>...</svg>
  </button>

  Received:

  "Buttons must have discernible text (button-name)"

  Fix any of the following:
    - Element does not have inner text
    - aria-label attribute does not exist
    - aria-labelledby attribute does not exist
```

---

## 릴리스 전 체크리스트

### 🚨 필수 항목 (차단 이슈)

```markdown
[ ] 자동화 도구로 critical 위반사항 0개
    → axe, Lighthouse 실행

[ ] 키보드만으로 모든 기능 사용 가능
    → 마우스 치우고 테스트

[ ] 포커스 표시 명확
    → 3px 이상 outline

[ ] 스크린 리더로 주요 플로우 테스트 완료
    → 회원가입, 로그인, 구매 등

[ ] 색상 대비 WCAG AA 이상
    → 4.5:1 (일반), 3:1 (큰 텍스트)

[ ] 모든 이미지에 의미 있는 alt
    → "image123" 같은 거 없음

[ ] 모든 폼 필드에 명확한 레이블
    → <label> 연결

[ ] 페이지 제목 적절
    → 각 페이지 고유 제목

[ ] 언어 속성 설정
    → <html lang="ko">

[ ] 에러 메시지 명확하고 도움이 됨
    → "오류" (X) / "비밀번호는 8자 이상" (O)
```

### ✅ 권장 항목 (개선 사항)

```markdown
[ ] 200% 확대 시 레이아웃 유지
[ ] 스킵 링크 제공 ("본문으로 건너뛰기")
[ ] 랜드마크 역할 사용 (<main>, <nav> 등)
[ ] 헤딩 계층 논리적 (H1 → H2 → H3)
[ ] ARIA live regions 적절히 사용
[ ] 애니메이션 축소 모드 지원 (prefers-reduced-motion)
[ ] 터치 타겟 44x44px 이상
[ ] 고대비 모드 지원
```

---

## 문제 우선순위 - 무엇부터 고칠까?

### 🔴 Critical (즉시 수정)

**사용자가 기능을 아예 사용할 수 없는 문제**

- 키보드로 핵심 기능 접근 불가
- 스크린 리더로 주요 콘텐츠 인식 불가
- 폼 제출 불가능
- 색상 대비 심각하게 부족 (3:1 미만)

### 🟠 High (다음 배포 전 수정)

**사용성을 크게 해치는 문제**

- 포커스 표시 불명확
- 잘못된 ARIA 사용 (오히려 혼란)
- 에러 메시지 불명확
- alt 텍스트 누락 또는 의미 없음

### 🟡 Medium (개선 권장)

**사용성을 해치지만 우회 가능한 문제**

- 헤딩 순서 이상
- 랜드마크 누락
- 링크 텍스트 모호 ("여기 클릭")

### 🟢 Low (시간 날 때)

**마이너한 문제**

- 미세한 색상 대비 이슈 (4.5:1 vs 7:1)
- 중복된 링크
- 긴 페이지에 스킵 링크 없음

---

## 유용한 북마클릿 (빠른 시각적 검사)

### 랜드마크 시각화

```javascript
javascript:(function(){
  const landmarks = document.querySelectorAll('[role], main, nav, header, footer, aside');
  landmarks.forEach(el => {
    el.style.outline = '3px solid red';
    const role = el.getAttribute('role') || el.tagName.toLowerCase();
    const label = document.createElement('div');
    label.textContent = role;
    label.style.cssText = 'position:absolute;background:red;color:white;padding:2px 5px;font-size:12px;z-index:10000;';
    el.style.position = 'relative';
    el.insertBefore(label, el.firstChild);
  });
})();
```

### 헤딩 아웃라인

```javascript
javascript:(function(){
  const headings = document.querySelectorAll('h1,h2,h3,h4,h5,h6');
  headings.forEach(h => {
    const level = h.tagName[1];
    h.style.outline = `${level}px solid blue`;
    h.style.outlineOffset = '2px';
  });
})();
```

### 포커스 가능한 요소 하이라이트

```javascript
javascript:(function(){
  const focusable = document.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
  focusable.forEach((el, i) => {
    el.style.outline = '3px solid green';
    el.title = `Tab order: ${i + 1}`;
  });
})();
```

---

## 마치며

접근성 테스팅은 **한 번의 이벤트가 아니라 지속적인 습관**입니다.

저도 처음에는 "자동화 도구 100점이면 완벽하지!"라고 생각했습니다. 하지만 실제 사용자 피드백을 받고 나서야 깨달았죠. **자동화는 시작일 뿐, 진짜 테스트는 직접 해봐야 한다는 것을요.**

**오늘부터 시작하세요:**

1. **자동화 도구 실행** - Lighthouse 또는 axe (5분)
2. **키보드만으로 탐색** - 마우스 치우기 (10분)
3. **스크린 리더로 주요 플로우 테스트** - VoiceOver 또는 NVDA (15분)

**매주 30분이면 충분합니다.**

그리고 기억하세요:
> **"확인하지 않으면 알 수 없습니다."**

**여러분의 사이트가 모두에게 접근 가능한지, 오늘 확인해보시겠어요?** 🧪✨

---

## 참고 자료

### 자동화 도구
- [axe DevTools](https://www.deque.com/axe/devtools/) - 가장 정확한 도구
- [WAVE](https://wave.webaim.org/) - 시각적 피드백
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Chrome 내장
- [pa11y](https://pa11y.org/) - CI/CD 통합

### 스크린 리더
- [NVDA](https://www.nvaccess.org/) - Windows, 무료
- [JAWS](https://www.freedomscientific.com/products/software/jaws/) - Windows, 유료
- VoiceOver - macOS/iOS 내장
- TalkBack - Android 내장

### 학습 자료
- [WebAIM](https://webaim.org/) - 접근성 리소스
- [The A11Y Project](https://www.a11yproject.com/) - 체크리스트와 팁
- [Deque University](https://dequeuniversity.com/) - 심화 학습

### 관련 문서
- 📖 [완전 가이드](/web-development/accessibility/guidelines/complete-guide) - 접근성 기초
- 🏷️ [ARIA 가이드](/web-development/accessibility/aria/) - ARIA 사용법
- 💡 [실전 예제](/web-development/accessibility/examples/) - 컴포넌트 구현

**함께 접근 가능한 웹을 만들어갑시다!** 🚀
