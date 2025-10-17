---
title: DNS와 도메인, 호스팅의 관계 이해하기
description: 웹사이트 배포를 위한 도메인, DNS, 호스팅의 연결 과정과 실전 가이드
date: 2025-10-17
last_modified_at: 2025-10-17
categories: [Networking, Web Development]
tags: [DNS, Domain, Hosting, GitHub Pages, Deployment, Web Hosting]
layout: page
---

# DNS와 도메인, 호스팅의 관계 이해하기

웹사이트를 만들고 배포할 때, "도메인을 구매했는데 왜 DNS 설정이 필요하지?"라는 의문을 가져본 적 있나요?

저도 처음 웹사이트를 배포할 때, 도메인만 구매하면 끝인 줄 알았습니다. 하지만 도메인을 구매하고, 호스팅 서비스에 코드를 올렸는데도 사이트가 보이지 않아서 당황했던 기억이 있습니다. 알고 보니 DNS 설정을 하지 않았기 때문이었죠.

이 문서에서는 도메인, DNS, 호스팅이 어떻게 연결되는지 실전 예제와 함께 설명하겠습니다.

## 왜 이 개념들을 이해해야 할까요?

### 1. 웹사이트 배포의 필수 지식

도메인, DNS, 호스팅은 웹사이트를 인터넷에 공개하기 위한 세 가지 핵심 요소입니다. 이들의 관계를 이해하지 못하면:

- 사이트가 배포되었는데 접속이 안 되는 상황 발생
- 문제가 생겼을 때 어디서부터 확인해야 할지 모름
- 비용 낭비 (불필요한 서비스 중복 구매)

### 2. 문제 해결 능력 향상

DNS 전파 시간, 레코드 설정 오류 등 실전에서 자주 마주치는 문제들을 스스로 해결할 수 있습니다.

## 세 가지 핵심 개념

### 도메인 (Domain)

**도메인은 웹사이트의 주소입니다.**

```
예시:
- google.com
- github.io
- my-blog.com
```

일상생활에 비유하면:

- 도메인 = 집 주소
- IP 주소 = 집의 GPS 좌표

"서울시 강남구 테헤란로 123"이라는 주소가 읽기 쉽듯이, 도메인도 사람이 기억하고 입력하기 쉽도록 만든 것입니다.

#### 도메인의 구조

```
https://blog.example.com
       │    │      └─ TLD (Top-Level Domain)
       │    └─ 메인 도메인
       └─ 서브도메인
```

**실전 예시:**
```
example.com        → 메인 도메인
www.example.com    → 서브도메인 (www)
api.example.com    → 서브도메인 (api)
```

### DNS (Domain Name System)

**DNS는 도메인을 IP 주소로 변환해주는 시스템입니다.**

생각해보세요. 브라우저에 `google.com`을 입력하면 어떻게 구글 서버를 찾아갈까요? 바로 DNS가 다음과 같이 동작하기 때문입니다.

```
사용자 입력: google.com
       ↓
DNS 조회: google.com → 142.250.196.78
       ↓
서버 연결: 142.250.196.78로 접속
```

#### DNS 레코드 타입

DNS는 여러 종류의 레코드를 사용합니다. 각각의 용도를 이해하는 것이 중요합니다.

**A 레코드 (Address Record)**
```
용도: 도메인을 IPv4 주소로 매핑
형식: 도메인 → IPv4 주소

예시:
example.com → 93.184.216.34

언제 사용?
- 웹사이트의 메인 도메인을 서버 IP에 연결
- 대부분의 호스팅 서비스에서 기본으로 사용
```

**AAAA 레코드 (IPv6 Address Record)**
```
용도: 도메인을 IPv6 주소로 매핑
형식: 도메인 → IPv6 주소

예시:
example.com → 2606:2800:220:1:248:1893:25c8:1946

언제 사용?
- IPv6를 지원하는 서버에 연결
- 최신 인프라에서 IPv4와 함께 설정
```

**CNAME 레코드 (Canonical Name Record)**
```
용도: 도메인을 다른 도메인으로 별칭 설정
형식: 도메인 → 다른 도메인

예시:
www.example.com → example.com
blog.example.com → myblog.vercel.app

언제 사용?
- 서브도메인을 호스팅 서비스에 연결
- 여러 도메인을 하나의 대상으로 통합

⚠️ 주의사항:
- CNAME은 루트 도메인(@)에는 사용 불가
- 다른 레코드(A, MX 등)와 함께 사용 불가
```

**MX 레코드 (Mail Exchange)**
```
용도: 이메일 서버 지정
형식: 도메인 → 메일 서버 (우선순위 포함)

예시:
example.com → 10 mail.example.com
example.com → 20 backup-mail.example.com

언제 사용?
- 커스텀 도메인으로 이메일 수신 설정
- Google Workspace, Microsoft 365 등 이메일 서비스 연동

우선순위:
- 숫자가 낮을수록 우선순위 높음
- 10번 서버가 실패하면 20번 서버로 전달
```

**TXT 레코드 (Text Record)**
```
용도: 도메인에 텍스트 정보 추가
형식: 도메인 → 텍스트 값

예시:
example.com → "v=spf1 include:_spf.google.com ~all"
_dmarc.example.com → "v=DMARC1; p=quarantine"

언제 사용?
- 도메인 소유권 인증 (Google Search Console, 호스팅 서비스)
- 이메일 인증 (SPF, DKIM, DMARC)
- 사이트 검증 코드 추가
```

**NS 레코드 (Name Server)**
```
용도: 도메인의 네임서버 지정
형식: 도메인 → 네임서버

예시:
example.com → ns1.cloudflare.com
example.com → ns2.cloudflare.com

언제 사용?
- 도메인의 DNS를 다른 서비스로 위임
- Cloudflare, Route53 등의 DNS 서비스 사용 시
```

**SOA 레코드 (Start of Authority)**
```
용도: DNS 존(zone)의 기본 정보 저장
형식: 도메인 → 주 네임서버, 관리자 이메일, 시리얼 번호 등

예시:
example.com → ns1.example.com admin.example.com 2024101701

언제 사용?
- 자동으로 생성되며 직접 수정할 일은 거의 없음
- DNS 존 전송 및 캐싱 동작 제어
```

**CAA 레코드 (Certification Authority Authorization)**
```
용도: SSL 인증서 발급 권한 제어
형식: 도메인 → CA 정책

예시:
example.com → 0 issue "letsencrypt.org"

언제 사용?
- 특정 인증 기관만 SSL 인증서 발급 허용
- 보안 강화 목적
```

#### DNS 설정 실제 예시

Vercel에 커스텀 도메인을 연결하는 경우:

```
타입: A
호스트: @
값: 76.76.21.21
TTL: 1800

타입: CNAME
호스트: www
값: cname.vercel-dns.com.
TTL: 1800
```

### 호스팅 (Hosting)

**호스팅은 웹사이트 파일을 저장하고 제공하는 서버 서비스입니다.**

```
코드 파일들
  ├── index.html
  ├── style.css
  └── script.js
       ↓ 업로드
  호스팅 서버
       ↓ 사용자 요청 시
  웹사이트 제공
```

#### 호스팅 서비스 종류

**1. 정적 호스팅 (Static Hosting)**
- HTML, CSS, JS 파일만 제공
- 예: Vercel, Netlify, GitHub Pages
- 특징: 무료/저렴, 빠름, 간단함
- 적합한 경우: 블로그, 포트폴리오, 문서 사이트

**2. 서버리스 호스팅 (Serverless)**
- 서버 관리 없이 백엔드 로직 실행
- 예: Vercel (Serverless Functions), Netlify Functions, AWS Lambda
- 특징: 자동 확장, 사용량 기반 과금
- 적합한 경우: API, 실시간 데이터 처리

**3. 동적 호스팅 (Traditional Hosting)**
- 완전한 서버 환경 제공
- 예: AWS EC2, DigitalOcean, Heroku
- 특징: 유료, 유연함, 서버 관리 필요
- 적합한 경우: 데이터베이스 연동, 복잡한 백엔드

**4. 클라우드 호스팅 (Cloud Platform)**
- 확장 가능한 엔터프라이즈 인프라
- 예: AWS, Google Cloud, Azure
- 특징: 종량제, 고성능, 다양한 서비스 통합
- 적합한 경우: 대규모 애플리케이션, 기업용 서비스

## 세 가지 요소의 연결 과정

웹사이트를 배포하는 전체 과정을 단계별로 살펴보겠습니다.

### 1단계: 호스팅 준비

```bash
# 정적 호스팅 서비스를 사용하는 경우 (Vercel, Netlify 등)
# 예: Vercel CLI 사용
npm install -g vercel
vercel login
vercel --prod
```

이제 사이트가 호스팅 서비스에서 제공하는 임시 도메인(예: `https://your-site.vercel.app`)에서 접근 가능합니다.

### 2단계: 도메인 구매

도메인 등록 업체(예: GoDaddy, Namecheap, Gabia 등)에서 원하는 도메인을 구매합니다.

```
구매한 도메인: my-blog.com
```

### 3단계: DNS 설정

❌ **잘못된 생각:**
> "도메인을 구매했으니까 자동으로 연결되겠지?"

✅ **올바른 이해:**
> "도메인과 호스팅 서버를 DNS로 연결해야 한다"

**DNS 설정 전:**
```
my-blog.com 입력
    ↓
DNS 조회
    ↓
아무것도 찾을 수 없음 ❌
```

**DNS 설정 후:**
```
my-blog.com 입력
    ↓
DNS 조회
    ↓
192.0.2.1 (호스팅 서버)
    ↓
웹사이트 표시 ✅
```

### 4단계: 호스팅 서비스에 도메인 등록

호스팅 서비스에 커스텀 도메인을 사용한다고 알려줘야 합니다.

**Vercel 예시:**
```
Project Settings → Domains → Add Domain
→ my-blog.com 입력
```

**GitHub Pages 예시:**
```
Settings → Pages → Custom domain에서 my-blog.com 입력
```

### 5단계: DNS 전파 대기

DNS 설정이 전 세계 DNS 서버에 전파되기까지 시간이 걸립니다.

```
소요 시간: 몇 분 ~ 48시간
평균: 1~2시간
```

**확인 방법:**
```bash
# 맥/리눅스
dig my-blog.com +noall +answer

# 윈도우
nslookup my-blog.com
```

**정상 응답 예시:**
```
my-blog.com.    1800    IN    A    75.2.60.5
```

## 실전 시나리오: Vercel 배포

전체 과정을 실제 명령어와 함께 살펴보겠습니다.

### 시나리오

정적 웹사이트를 Vercel에 배포하고, 커스텀 도메인 `my-blog.com`을 연결하려고 합니다.

### Step 1: Vercel CLI 설치 및 로그인

```bash
# Vercel CLI 설치
npm install -g vercel

# Vercel 계정 로그인
vercel login
```

### Step 2: 사이트 배포

```bash
# 빌드 (예: Next.js 앱의 경우)
npm run build

# Vercel에 배포
vercel --prod
```

또는 Git 저장소 연동:

```
Vercel 대시보드 → Add New Project → Import Git Repository
→ GitHub 저장소 선택 → 빌드 설정 → Deploy
```

배포 완료 후 접속 가능: `https://your-site.vercel.app`

### Step 3: 커스텀 도메인 추가

Vercel 대시보드에서:

```
Project Settings → Domains → Add Domain
→ my-blog.com 입력
```

### Step 4: DNS 설정

도메인 등록 업체의 DNS 관리 페이지에서:

```
A 레코드 추가:
타입: A, 호스트: @, 값: 76.76.21.21

CNAME 레코드 추가:
타입: CNAME, 호스트: www, 값: cname.vercel-dns.com.
```

### Step 5: DNS 전파 확인

```bash
# DNS 조회
dig my-blog.com +noall +answer

# 결과 확인
my-blog.com.    1800    IN    A    76.76.21.21
```

### Step 6: HTTPS 자동 활성화

Vercel은 Let's Encrypt를 사용하여 자동으로 HTTPS 인증서를 발급합니다.

```
Project Settings → Domains → SSL 확인
```

몇 분 후 `https://my-blog.com`으로 접속 가능!

## 흔한 실수와 해결 방법

### 실수 1: 호스팅 서비스별 IP 주소 혼동

❌ **잘못된 설정:**
```
# GitHub Pages IP를 Vercel에 사용
타입: A, 호스트: @, 값: 185.199.108.153
```

✅ **올바른 설정:**
```
# Vercel 공식 IP 사용
타입: A, 호스트: @, 값: 76.76.21.21
```

**이유:** 각 호스팅 서비스는 고유한 IP 주소를 사용합니다. 호스팅 서비스의 공식 문서를 확인하세요.

### 실수 2: CNAME 값에 점(.) 없음

❌ **잘못된 설정:**
```
타입: CNAME, 호스트: www, 값: cname.vercel-dns.com
```

✅ **올바른 설정:**
```
타입: CNAME, 호스트: www, 값: cname.vercel-dns.com.
```

**이유:** 일부 DNS 관리 시스템은 FQDN(Fully Qualified Domain Name) 형식을 요구합니다.

### 실수 3: baseurl 설정 미변경

커스텀 도메인을 사용하면 사이트 설정의 baseurl을 변경해야 합니다.

❌ **문제 상황:**
```yaml
# _config.yml (Jekyll) 또는 config 파일
url: "https://your-site.vercel.app"
baseurl: "/subfolder"
```

커스텀 도메인 사용 후 모든 리소스가 404 에러!

✅ **해결:**
```yaml
# 커스텀 도메인 사용 시
url: "https://my-blog.com"
baseurl: ""
```

### 실수 4: DNS 전파 기다리지 않음

DNS 설정 직후 "사이트가 안 보여요!"라고 당황하지 마세요.

```
DNS 설정 완료
    ↓
전파 시작 (1~2시간 소요)
    ↓
브라우저 캐시 삭제
    ↓
정상 접속 ✅
```

**확인 방법:**
```bash
# 현재 DNS 상태 확인
dig +trace my-blog.com
```

## 고급 주제

### TTL (Time To Live)

DNS 레코드에는 TTL 값이 있습니다.

```
my-blog.com.    1800    IN    A    192.0.2.1
                 ↑
                TTL (초 단위)
```

**의미:**
- 1800초 = 30분
- DNS 서버가 이 정보를 30분 동안 캐시
- 30분 후에는 다시 조회

**실전 팁:**
```
DNS 변경 예정 → TTL을 300(5분)으로 낮춤
변경 완료 후 → TTL을 3600(1시간)으로 높임
```

### Apex 도메인 vs 서브도메인

```
example.com          → Apex 도메인 (root domain)
www.example.com      → 서브도메인
blog.example.com     → 서브도메인
```

**일반적인 DNS 설정 권장사항:**
- Apex 도메인: A 레코드 사용
- 서브도메인: CNAME 레코드 사용

**참고:** 일부 호스팅 서비스(GitHub Pages, Netlify 등)는 Apex 도메인에 여러 개의 A 레코드 설정을 요구합니다.

### DNS 전파 과정 시각화

```
1. 도메인 등록 업체 DNS 서버
   ↓ (몇 분)
2. 상위 DNS 서버 (.com, .net 등)
   ↓ (몇 시간)
3. 전 세계 DNS 서버들
   ↓ (최대 48시간)
4. ISP DNS 서버
   ↓
5. 사용자의 브라우저
```

## 다양한 호스팅 서비스의 DNS 설정

### Vercel

```
타입: A, 호스트: @, 값: 76.76.21.21
타입: CNAME, 호스트: www, 값: cname.vercel-dns.com.
```

**특징:**
- 자동 SSL 인증서 발급
- 글로벌 CDN 지원
- Next.js 최적화

### Netlify

```
타입: A, 호스트: @, 값: 75.2.60.5
타입: CNAME, 호스트: www, 값: your-site.netlify.app.
```

**특징:**
- 자동 빌드 및 배포
- 서버리스 함수 지원
- 폼 처리 기능

### GitHub Pages

```
타입: A, 호스트: @, 값: 185.199.108.153
타입: A, 호스트: @, 값: 185.199.109.153
타입: A, 호스트: @, 값: 185.199.110.153
타입: A, 호스트: @, 값: 185.199.111.153
타입: CNAME, 호스트: www, 값: username.github.io.
```

**특징:**
- GitHub과 완벽한 통합
- 무료 호스팅
- Jekyll 지원

### AWS CloudFront + S3

```
타입: A, 호스트: @, 값: [CloudFront Distribution 도메인]
타입: AAAA, 호스트: @, 값: [CloudFront IPv6]

(권장: Route 53에서 Alias 레코드 사용)
```

**특징:**
- 엔터프라이즈급 성능
- 세밀한 캐싱 제어
- AWS 서비스와 통합

## 문제 해결 체크리스트

사이트가 연결되지 않을 때 다음 순서로 확인하세요:

### 1. 호스팅 확인

```bash
# Vercel 사이트가 정상 배포되었는지 확인
curl https://your-site.vercel.app

# 또는 GitHub Pages 사용 시
curl https://username.github.io/repository-name
```

### 2. DNS 설정 확인

```bash
# DNS 레코드가 올바른지 확인
dig my-blog.com +noall +answer
```

### 3. 호스팅 서비스 설정 확인

```bash
# Vercel 대시보드에서 커스텀 도메인 설정 확인
# Project Settings → Domains 확인

# GitHub Pages 사용 시 CNAME 파일 확인
cat CNAME
```

### 4. DNS 전파 확인
```bash
# 전 세계 DNS 서버에서 조회
# https://dnschecker.org 사용
```

### 5. 브라우저 캐시 삭제
```
Chrome: Cmd + Shift + Delete (Mac)
Chrome: Ctrl + Shift + Delete (Windows)
```

## 참고 자료

### 공식 문서
- [Vercel - Custom Domains](https://vercel.com/docs/concepts/projects/custom-domains)
- [GitHub Pages - Custom Domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)
- [Cloudflare DNS Docs](https://developers.cloudflare.com/dns/)
- [DNS RFC 1035](https://www.rfc-editor.org/rfc/rfc1035)

### 유용한 도구
- [DNSChecker](https://dnschecker.org) - DNS 전파 확인
- [What's My DNS](https://www.whatsmydns.net) - 전 세계 DNS 조회
- [MX Toolbox](https://mxtoolbox.com) - DNS 진단

### 추가 학습 자료
- [How DNS Works (Comic)](https://howdns.works/) - DNS 동작 원리 시각화
- [DNS Explained (Video)](https://www.youtube.com/watch?v=72snZctFFtA) - DNS 개념 영상

## 마치며

도메인, DNS, 호스팅은 웹 개발의 기초이지만, 처음에는 헷갈리기 쉽습니다.

**핵심 요약:**
1. **도메인**: 웹사이트의 주소 (집 주소)
2. **DNS**: 도메인을 IP로 변환 (GPS 좌표 찾기)
3. **호스팅**: 웹사이트 파일을 저장하고 제공 (실제 집)

이 세 가지를 올바르게 연결하면, 전 세계 누구나 여러분의 웹사이트에 접속할 수 있습니다.

처음 배포할 때는 실수도 많이 하고 시간도 오래 걸리지만, 한 번 경험하고 나면 다음부터는 자신 있게 배포할 수 있을 것입니다!
