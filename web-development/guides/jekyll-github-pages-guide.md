---
title: Jekyll로 GitHub Pages 블로그 만들기 - 완벽 가이드
date: 2025-10-16
last_modified_at: 2025-10-16
layout: page
categories: [web-development, guides]
tags: [jekyll, github-pages, static-site, blog]
---

{% raw %}
# Jekyll로 GitHub Pages 블로그 만들기 - 완벽 가이드

무료로 블로그를 만들고 싶은데, 서버 관리는 부담스럽고 광고도 넣기 싫으신가요?

저도 처음 개발 블로그를 시작할 때 비슷한 고민을 했습니다. WordPress는 무겁고, Medium은 커스터마이징이 제한적이죠. 그러다 발견한 것이 Jekyll과 GitHub Pages의 조합이었습니다. 무료 호스팅, 커스텀 도메인 지원, 그리고 마크다운으로 글을 작성할 수 있다는 점이 매력적이었습니다.

이 가이드에서는 제로부터 Jekyll 블로그를 만들고 GitHub Pages에 배포하는 전 과정을 실전 경험을 바탕으로 설명합니다.

## 왜 Jekyll + GitHub Pages를 선택해야 할까요?

### 1. 완전히 무료

GitHub Pages는 무료로 정적 사이트를 호스팅해줍니다. 트래픽 걱정 없이, 매달 서버비를 내지 않아도 됩니다.

### 2. 버전 관리

모든 글과 설정이 Git으로 관리됩니다. 글을 잘못 수정했다면? `git revert`로 되돌리면 됩니다.

### 3. 마크다운으로 작성

HTML을 직접 작성할 필요 없이, 마크다운으로 글을 쓸 수 있습니다. 개발자에게 익숙한 방식이죠.

### 4. 커스터마이징 자유로움

HTML, CSS, JavaScript를 자유롭게 수정할 수 있습니다. 플랫폼의 제약을 받지 않습니다.

## 시작하기 전에

### 필요한 것

- GitHub 계정
- Git 기본 지식
- 터미널 사용 경험 (기초적인 명령어만 알아도 됩니다)
- Ruby 설치 (로컬 개발용)

### 로컬 vs GitHub만 사용하기

Jekyll을 로컬에서 실행하지 않고, GitHub에 push만 해도 블로그가 작동합니다. 하지만 로컬 환경을 설정하면:

- 글 작성 후 실시간으로 미리보기 가능
- 테마 수정 사항을 즉시 확인
- 빌드 오류를 배포 전에 발견

저는 **로컬 환경 설정을 강력히 추천**합니다.

## Step 1: GitHub 저장소 생성

### 1-1. 저장소 이름 정하기

GitHub Pages는 특별한 명명 규칙이 있습니다.

```
username.github.io
```

예를 들어, 제 GitHub 사용자명이 `johndoe`라면:

```
johndoe.github.io
```

이렇게 저장소를 만들어야 합니다.

### 1-2. 저장소 생성

1. GitHub에 로그인
2. 우측 상단 `+` 버튼 클릭 → `New repository`
3. Repository name: `username.github.io` (본인 username으로 변경)
4. Public 선택 (무료 호스팅을 위해 필수)
5. `Add a README file` 체크
6. `Create repository` 클릭

### 1-3. 로컬로 클론

```bash
git clone https://github.com/username/username.github.io.git
cd username.github.io
```

## Step 2: Jekyll 설치 (macOS 기준)

### 2-1. Ruby 설치

Jekyll은 Ruby로 만들어져 있어서 Ruby가 필요합니다.

```bash
# Homebrew로 Ruby 설치
brew install ruby

# 또는 rbenv 사용 (권장 - 버전 관리가 편리합니다)
brew install rbenv ruby-build
rbenv install 3.1.0
rbenv global 3.1.0
```

**왜 rbenv를 권장할까요?**

macOS에는 시스템 Ruby가 설치되어 있습니다. 하지만 시스템 Ruby를 직접 사용하면:
- 권한 문제가 발생할 수 있음
- 버전 업그레이드가 어려움
- 여러 프로젝트에서 다른 Ruby 버전이 필요할 때 대응 불가

rbenv를 사용하면 이런 문제를 해결할 수 있습니다.

### 2-2. 환경 변수 설정

`.zshrc` 또는 `.bash_profile`에 추가:

```bash
# rbenv 사용 시
echo 'export PATH="$HOME/.rbenv/bin:$PATH"' >> ~/.zshrc
echo 'eval "$(rbenv init -)"' >> ~/.zshrc
source ~/.zshrc

# Ruby 설치 확인
ruby -v  # 3.1.0 이상이면 OK
```

### 2-3. Bundler 및 Jekyll 설치

```bash
gem install bundler jekyll
```

**Bundler가 뭔가요?**

Bundler는 Ruby의 패키지 관리자입니다. npm의 package.json처럼, Gemfile에 의존성을 명시하면 Bundler가 설치를 관리합니다.

## Step 3: Jekyll 사이트 생성

### 3-1. 새 Jekyll 사이트 만들기

```bash
# 현재 디렉토리에 Jekyll 사이트 생성
jekyll new . --force

# 또는 새 폴더에 생성
jekyll new my-blog
cd my-blog
```

생성되는 파일 구조:

```
.
├── _config.yml          # Jekyll 설정 파일
├── _posts/              # 블로그 포스트 저장
├── _site/               # 빌드된 정적 파일 (Git에 커밋하지 않음)
├── .gitignore
├── Gemfile              # Ruby 의존성 관리
├── Gemfile.lock
├── index.md             # 홈페이지
└── about.md             # About 페이지
```

### 3-2. GitHub Pages용 설정

`Gemfile`을 열어서 수정합니다.

```ruby
# ❌ 이 줄을 주석 처리
# gem "jekyll", "~> 4.3.4"

# ✅ 이 줄의 주석을 해제
gem "github-pages", group: :jekyll_plugins
```

**왜 이렇게 해야 할까요?**

GitHub Pages는 특정 버전의 Jekyll과 플러그인만 지원합니다. `github-pages` gem을 사용하면 로컬 환경이 GitHub Pages와 정확히 일치합니다.

의존성 설치:

```bash
bundle install
```

### 3-3. _config.yml 수정

`_config.yml` 파일을 열어서 기본 정보를 수정합니다.

```yaml
title: 내 개발 블로그
email: your-email@example.com
description: >-
  Jekyll과 GitHub Pages로 만든 개발 블로그입니다.
  프론트엔드, 백엔드, 알고리즘 등을 다룹니다.

baseurl: ""  # 저장소가 username.github.io면 비워둡니다
url: "https://username.github.io"  # 본인 username으로 변경

# 빌드 설정
markdown: kramdown
theme: minima
plugins:
  - jekyll-feed
  - jekyll-seo-tag
```

**baseurl vs url의 차이**

- `url`: 사이트의 전체 URL (예: https://johndoe.github.io)
- `baseurl`: 서브 경로 (예: 저장소 이름이 `blog`라면 `/blog`)

```
# username.github.io 저장소인 경우
url: "https://johndoe.github.io"
baseurl: ""

# 프로젝트 페이지인 경우 (예: johndoe.github.io/blog)
url: "https://johndoe.github.io"
baseurl: "/blog"
```

## Step 4: 로컬에서 실행

### 4-1. 개발 서버 시작

```bash
bundle exec jekyll serve
```

브라우저에서 `http://localhost:4000` 접속

**자동 새로고침 모드** (파일 수정 시 자동 반영):

```bash
bundle exec jekyll serve --livereload
```

### 4-2. 초안 작성하기

공개하기 전 초안을 작성하고 싶다면:

1. `_drafts` 폴더 생성
2. 초안 파일 작성 (파일명에 날짜 불필요)

```bash
mkdir _drafts
echo "# 내 첫 초안" > _drafts/my-first-draft.md
```

초안 포함하여 실행:

```bash
bundle exec jekyll serve --drafts
```

### 4-3. 빌드만 하기

서버를 띄우지 않고 빌드만:

```bash
bundle exec jekyll build
```

빌드된 파일은 `_site/` 디렉토리에 생성됩니다.

## Step 5: 첫 포스트 작성

### 5-1. 포스트 파일 생성

`_posts` 폴더에 파일을 생성합니다. **파일명 규칙이 중요합니다**:

```
YYYY-MM-DD-title.md
```

예시:

```bash
# ✅ 올바른 파일명
_posts/2025-10-16-hello-jekyll.md

# ❌ 잘못된 파일명 (날짜 형식 틀림)
_posts/2025-10-hello.md
_posts/hello-jekyll.md
```

### 5-2. Front Matter 작성

모든 포스트는 상단에 Front Matter를 가져야 합니다.

```markdown
---
layout: post
title: "Jekyll로 블로그 시작하기"
date: 2025-10-16 14:30:00 +0900
categories: [jekyll, tutorial]
tags: [jekyll, github-pages, blog]
---

# 내 첫 포스트

Jekyll로 블로그를 시작했습니다!

## 코드 블록도 가능

```python
def hello():
    print("Hello, Jekyll!")
```
\```

## 이미지 삽입

![설명]({{ site.baseurl }}/assets/images/photo.jpg)
```

**Front Matter가 뭔가요?**

YAML 형식으로 작성된 메타데이터입니다. Jekyll은 이 정보를 읽어서:
- 레이아웃 적용
- 카테고리/태그 분류
- 날짜 정렬
- SEO 최적화

### 5-3. 흔한 실수

```markdown
# ❌ Front Matter 없이 작성
# Hello

This is my post.

# ✅ Front Matter 포함
---
layout: post
title: "Hello"
---

This is my post.
```

Front Matter가 없으면 Jekyll이 포스트로 인식하지 못합니다.

## Step 6: 테마 적용

### 6-1. 기본 테마 (Minima)

Jekyll은 기본적으로 `minima` 테마를 사용합니다. 간단하고 깔끔하지만, 커스터마이징이 필요하다면:

### 6-2. 테마 커스터마이징

테마 파일을 직접 수정하려면, 먼저 테마의 파일을 복사해야 합니다.

```bash
# 테마 위치 확인
bundle info minima

# 출력 예시: /path/to/gems/minima-2.5.1
```

해당 경로에 가서 원하는 파일을 복사:

```bash
# 레이아웃 복사
cp -r /path/to/gems/minima-2.5.1/_layouts ./_layouts

# CSS 복사
cp -r /path/to/gems/minima-2.5.1/_sass ./_sass
cp -r /path/to/gems/minima-2.5.1/assets ./assets
```

이제 복사한 파일을 수정하면 됩니다.

### 6-3. 다른 테마 사용하기

GitHub Pages에서 지원하는 테마:

- [Minimal Mistakes](https://github.com/mmistakes/minimal-mistakes)
- [Beautiful Jekyll](https://github.com/daattali/beautiful-jekyll)
- [Chirpy](https://github.com/cotes2020/jekyll-theme-chirpy)

`_config.yml`에서 테마 변경:

```yaml
# remote_theme 플러그인 사용
plugins:
  - jekyll-remote-theme

remote_theme: mmistakes/minimal-mistakes
```

**주의사항**

테마마다 설정 방법이 다릅니다. 각 테마의 공식 문서를 꼭 확인하세요.

## Step 7: GitHub Pages에 배포

### 7-1. .gitignore 설정

`.gitignore` 파일 확인:

```
_site/
.sass-cache/
.jekyll-cache/
.jekyll-metadata
vendor/
```

`_site/` 폴더는 빌드 결과물이므로 Git에 커밋하지 않습니다. GitHub Pages가 자동으로 빌드해줍니다.

### 7-2. Git 커밋 및 푸시

```bash
git add .
git commit -m "Initial Jekyll blog setup"
git push origin master
```

**또는 main 브랜치를 사용한다면**:

```bash
git push origin main
```

### 7-3. GitHub Pages 설정

1. GitHub 저장소 페이지로 이동
2. `Settings` → `Pages`
3. Source:
   - Branch: `master` (또는 `main`)
   - Folder: `/ (root)`
4. `Save` 클릭

### 7-4. 배포 확인

약 1~2분 후, `https://username.github.io`에 접속하면 블로그가 보입니다!

**배포 상태 확인**:
- `Actions` 탭에서 빌드 진행 상황 확인
- 초록색 체크마크: 성공
- 빨간색 X: 실패 (로그를 확인하여 오류 수정)

## Step 8: 고급 기능

### 8-1. 커스텀 도메인 설정

`username.github.io` 대신 `myblog.com`처럼 커스텀 도메인을 사용하려면:

1. 도메인 구입 (예: Namecheap, GoDaddy)
2. DNS 설정:

```
Type: A
Name: @
Value: 185.199.108.153
       185.199.109.153
       185.199.110.153
       185.199.111.153

Type: CNAME
Name: www
Value: username.github.io
```

3. 저장소 루트에 `CNAME` 파일 생성:

```bash
echo "myblog.com" > CNAME
git add CNAME
git commit -m "Add custom domain"
git push
```

4. GitHub Settings → Pages → Custom domain에 `myblog.com` 입력
5. `Enforce HTTPS` 체크

### 8-2. SEO 최적화

`_config.yml`에 추가:

```yaml
plugins:
  - jekyll-seo-tag
  - jekyll-sitemap
  - jekyll-feed
```

`_layouts/default.html`의 `<head>` 태그 안에:

```html
{% seo %}
```

### 8-3. 댓글 시스템 추가

[Utterances](https://utteranc.es/) 사용 (GitHub Issues 기반):

1. Utterances GitHub App 설치
2. `_layouts/post.html`에 추가:

```html
<script src="https://utteranc.es/client.js"
        repo="username/username.github.io"
        issue-term="pathname"
        theme="github-light"
        crossorigin="anonymous"
        async>
</script>
```

### 8-4. Google Analytics 연동

`_config.yml`에 추가:

```yaml
google_analytics: G-XXXXXXXXXX  # 본인의 GA4 측정 ID
```

### 8-5. 광고 추가하기

Jekyll은 정적 사이트지만 HTML/JavaScript를 자유롭게 추가할 수 있어서, 원하는 광고 시스템을 쉽게 연동할 수 있습니다.

#### Google AdSense

1. [AdSense](https://www.google.com/adsense/)에 가입하고 사이트 승인
2. 광고 코드를 `_includes/adsense.html`에 저장:

```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXX"
     crossorigin="anonymous"></script>
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-XXXXXXXXXX"
     data-ad-slot="XXXXXXXXXX"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>
```

3. 포스트 레이아웃에 추가 (`_layouts/post.html`):

```liquid
<article>
  <h1>{{ page.title }}</h1>

  <!-- 본문 위 광고 -->
  {%- raw -%}
  {% include adsense.html %}
  {% endraw %}

  {{ content }}

  <!-- 본문 아래 광고 -->
  {%- raw -%}
  {% include adsense.html %}
  {% endraw %}
</article>
```

#### Carbon Ads (개발자 블로그에 적합)

개발자/디자이너 블로그에 특화된 광고 네트워크입니다.

```html
<!-- _includes/carbon-ads.html -->
<script async type="text/javascript"
  src="//cdn.carbonads.com/carbon.js?serve=YOUR_SERVE_ID&placement=YOUR_PLACEMENT"
  id="_carbonads_js">
</script>
```

#### 조건부 광고 표시

특정 포스트에만 광고를 보여주려면 Front Matter 활용:

```yaml
---
title: My Post
show_ads: true
---
```

레이아웃에서:

```liquid
{%- raw -%}
{% if page.show_ads %}
  {% include adsense.html %}
{% endif %}
{% endraw %}
```

#### N번째 포스트마다 광고 삽입

Liquid 문법 가이드에서 본 예제처럼:

```liquid
{%- raw -%}
{% for post in site.posts %}
  <article>{{ post.title }}</article>

  {% assign index_mod = forloop.index | modulo: 3 %}
  {% if index_mod == 0 %}
    {% include adsense.html %}
  {% endif %}
{% endfor %}
{% endraw %}
```

**주의사항**:
- GitHub Pages는 정적 호스팅이므로 서버 사이드 광고 삽입은 불가능
- 클라이언트 사이드 JavaScript 기반 광고만 가능
- AdSense 정책을 준수해야 함 (부적절한 콘텐츠 금지 등)

## 문제 해결

### 문제 1: 빈 페이지만 보임

**원인**: `baseurl` 설정 오류

**해결**:
```yaml
# _config.yml
baseurl: ""  # username.github.io 저장소라면 비워두기
```

### 문제 2: CSS가 적용되지 않음

**원인**: `url`과 `baseurl` 불일치

**해결**:
```yaml
url: "https://username.github.io"
baseurl: ""
```

템플릿에서 경로 사용 시:

```liquid
<!-- ❌ 절대 경로 -->
<link href="/assets/main.css" rel="stylesheet">

<!-- ✅ site.baseurl 사용 -->
<link href="{{ '/assets/main.css' | relative_url }}" rel="stylesheet">
```

### 문제 3: 로컬에서는 되는데 GitHub Pages에서 안 됨

**원인**: GitHub Pages에서 지원하지 않는 플러그인 사용

**해결**: [지원되는 플러그인 목록](https://pages.github.com/versions/) 확인

### 문제 4: 포트 충돌

**증상**: `Address already in use - bind(2)`

**해결**:
```bash
# 다른 포트 사용
bundle exec jekyll serve --port 4001

# 또는 기존 프로세스 종료
lsof -i :4000
kill -9 <PID>
```

### 문제 5: 빌드 오류 - "Invalid Date"

**원인**: 포스트 파일명 날짜 형식 오류

**해결**:
```bash
# ✅ 올바른 형식
2025-10-16-title.md

# ❌ 잘못된 형식
2025-10-title.md
10-16-2025-title.md
```

## 실전 팁

### 1. 글 작성 워크플로우

```bash
# 1. 초안 작성
mkdir -p _drafts
vim _drafts/my-new-post.md

# 2. 로컬 미리보기
bundle exec jekyll serve --drafts --livereload

# 3. 완성되면 _posts로 이동
mv _drafts/my-new-post.md _posts/2025-10-16-my-new-post.md

# 4. 커밋 및 배포
git add .
git commit -m "Add new post: My New Post"
git push
```

### 2. 이미지 관리

```
assets/
└── images/
    ├── 2025/
    │   └── 10/
    │       └── screenshot.png
    └── common/
        └── logo.png
```

포스트에서 사용:

```markdown
![설명]({{ '/assets/images/2025/10/screenshot.png' | relative_url }})
```

### 3. 카테고리와 태그 활용

```yaml
---
categories: [web-development, jekyll]
tags: [static-site, github-pages, tutorial]
---
```

카테고리 페이지 만들기 (`category/jekyll.md`):

```markdown
---
layout: category
title: Jekyll
category: jekyll
---
```

### 4. 빌드 캐시 삭제

이상한 오류가 발생하면:

```bash
bundle exec jekyll clean
rm -rf _site .jekyll-cache
bundle exec jekyll build
```

## 성능 최적화

### 1. 이미지 최적화

- WebP 형식 사용
- 적절한 크기로 리사이징
- Lazy loading 적용

```html
<img src="image.jpg" loading="lazy" alt="설명">
```

### 2. 빌드 시간 단축

많은 포스트가 있다면 증분 빌드 사용:

```bash
bundle exec jekyll serve --incremental
```

### 3. CDN 사용

큰 파일(이미지, 동영상)은 별도 CDN에 업로드:
- Cloudinary
- imgix
- AWS CloudFront

## 마치며

축하합니다! 이제 여러분만의 Jekyll 블로그가 생겼습니다.

**다음 단계로**:
1. 테마 커스터마이징
2. 자주 쓰는 레이아웃을 `_layouts`에 추가
3. 재사용 가능한 컴포넌트를 `_includes`에 작성
4. Liquid 문법 익히기 (다음 문서 참고)

**유용한 링크**:
- [Jekyll 공식 문서](https://jekyllrb.com/docs/)
- [GitHub Pages 문서](https://docs.github.com/en/pages)
- [Liquid 템플릿 문법](https://shopify.github.io/liquid/)
- [Jekyll Themes](http://jekyllthemes.org/)

**커뮤니티**:
- [Jekyll Talk](https://talk.jekyllrb.com/)
- [Stack Overflow - Jekyll 태그](https://stackoverflow.com/questions/tagged/jekyll)

블로그 운영하면서 궁금한 점이 생기면 언제든지 공식 문서와 커뮤니티를 활용하세요. 행복한 블로깅 되세요!
{% endraw %}