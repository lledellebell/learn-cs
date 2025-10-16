---
title: Liquid 템플릿 문법 완벽 가이드 - Jekyll에서 동적 콘텐츠 만들기
date: 2025-10-16
last_modified_at: 2025-10-16
layout: page
categories: [web-development, guides]
tags: [liquid, jekyll, template, static-site]
render_with_liquid: false
---

# Liquid 템플릿 문법 완벽 가이드 - Jekyll에서 동적 콘텐츠 만들기

Jekyll 블로그를 만들었는데, 포스트 목록을 자동으로 표시하고 싶으신가요? 카테고리별로 글을 필터링하고 싶으신가요?

저도 처음 Jekyll을 시작했을 때, "정적 사이트인데 어떻게 동적인 것처럼 보이지?"라고 궁금했습니다. 답은 **Liquid 템플릿 엔진**에 있었습니다.

Liquid는 Shopify에서 만든 템플릿 언어로, Jekyll에서 HTML에 동적 요소를 추가할 수 있게 해줍니다. 이 가이드에서는 Liquid의 기초부터 고급 기법까지, 실전 예제와 함께 설명합니다.

## 왜 Liquid를 배워야 할까요?

### 1. 반복 작업 자동화

포스트 목록을 수동으로 업데이트할 필요 없이, Liquid가 자동으로 생성해줍니다.

### 2. 재사용 가능한 컴포넌트

헤더, 푸터, 네비게이션을 한 번 작성하면 모든 페이지에서 재사용할 수 있습니다.

### 3. 조건부 렌더링

로그인 상태, 카테고리, 날짜 등에 따라 다른 내용을 보여줄 수 있습니다.

### 4. 데이터 변환

날짜 포맷, 문자열 조작, 배열 필터링 등을 쉽게 할 수 있습니다.

## Liquid 기본 구조

Liquid는 크게 3가지 요소로 구성됩니다.

```
1. Objects    {{ }}   - 값 출력
2. Tags       {% %}   - 로직 (반복, 조건문 등)
3. Filters    |       - 값 변환
```

시각적으로 표현하면:

```
┌─────────────────────────────────────┐
│ Liquid 템플릿                        │
├─────────────────────────────────────┤
│ {{ page.title }}      ← Object      │
│ {% if ... %}          ← Tag         │
│ {{ "hi" | upcase }}   ← Filter      │
└─────────────────────────────────────┘
         ↓ 빌드 시
┌─────────────────────────────────────┐
│ HTML 출력                            │
├─────────────────────────────────────┤
│ My Blog Post                         │
│ <div>...</div>                       │
│ HI                                   │
└─────────────────────────────────────┘
```

## 1. Objects - 값 출력하기

### 1-1. 기본 사용법

이중 중괄호 `{{ }}`로 값을 출력합니다.

```liquid
{{ page.title }}
{{ site.author }}
{{ "Hello, World!" }}
```

**실행 결과**:
```
My First Post
John Doe
Hello, World!
```

### 1-2. Jekyll 내장 변수

Jekyll은 다양한 내장 변수를 제공합니다.

```liquid
<!-- 사이트 전역 변수 (_config.yml) -->
{{ site.title }}
{{ site.description }}
{{ site.baseurl }}
{{ site.url }}

<!-- 현재 페이지 변수 (Front Matter) -->
{{ page.title }}
{{ page.date }}
{{ page.categories }}
{{ page.tags }}

<!-- 콘텐츠 -->
{{ content }}  <!-- 포스트/페이지 내용 -->
```

**예제 - 포스트 메타데이터 표시**:

```liquid
<article>
  <h1>{{ page.title }}</h1>
  <time>{{ page.date | date: "%Y년 %m월 %d일" }}</time>
  <div>{{ content }}</div>
</article>
```

**출력**:
```html
<article>
  <h1>Jekyll로 블로그 시작하기</h1>
  <time>2025년 10월 16일</time>
  <div><p>포스트 내용...</p></div>
</article>
```

### 1-3. 중첩된 속성 접근

점(`.`) 또는 대괄호(`[]`)로 접근:

```liquid
{{ site.author.name }}
{{ page.categories[0] }}
{{ site.data.members[0].name }}
```

### 1-4. 흔한 실수

```liquid
<!-- ❌ 따옴표 없이 문자열 사용 -->
{{ Hello }}  <!-- "Hello"라는 변수를 찾음 -->

<!-- ✅ 문자열은 따옴표로 감싸기 -->
{{ "Hello" }}

<!-- ❌ 변수를 따옴표로 감싸기 -->
{{ "page.title" }}  <!-- 문자열 "page.title" 출력 -->

<!-- ✅ 변수는 따옴표 없이 -->
{{ page.title }}
```

## 2. Tags - 로직 실행하기

### 2-1. 조건문 - if

```liquid
{% if 조건 %}
  내용
{% endif %}
```

**예제 - 태그가 있을 때만 표시**:

```liquid
{% if page.tags.size > 0 %}
  <div class="tags">
    태그: {{ page.tags | join: ", " }}
  </div>
{% endif %}
```

### 2-2. if-elsif-else

```liquid
{% if page.category == "tutorial" %}
  <span class="badge tutorial">튜토리얼</span>
{% elsif page.category == "news" %}
  <span class="badge news">뉴스</span>
{% else %}
  <span class="badge">일반</span>
{% endif %}
```

### 2-3. 조건 연산자

```liquid
==   같음
!=   다름
>    크다
<    작다
>=   크거나 같다
<=   작거나 같다
contains  포함
```

**예제**:

```liquid
{% if page.title == "About" %}
  <p>소개 페이지입니다.</p>
{% endif %}

{% if page.tags contains "jekyll" %}
  <p>Jekyll 관련 글입니다.</p>
{% endif %}

{% if page.date > site.time %}
  <p>미래의 포스트입니다.</p>
{% endif %}
```

### 2-4. 논리 연산자

```liquid
and   그리고
or    또는
```

**예제**:

```liquid
{% if page.published and page.featured %}
  <span>추천 글</span>
{% endif %}

{% if page.category == "tutorial" or page.category == "guide" %}
  <span>학습 자료</span>
{% endif %}
```

### 2-5. 반복문 - for

```liquid
{% for 변수 in 배열 %}
  내용
{% endfor %}
```

**예제 - 최근 포스트 5개 표시**:

```liquid
<ul>
  {% for post in site.posts limit:5 %}
    <li>
      <a href="{{ post.url }}">{{ post.title }}</a>
      <time>{{ post.date | date: "%Y-%m-%d" }}</time>
    </li>
  {% endfor %}
</ul>
```

**출력**:
```html
<ul>
  <li>
    <a href="/2025/10/16/hello-jekyll.html">Jekyll로 블로그 시작하기</a>
    <time>2025-10-16</time>
  </li>
  <!-- ... 4개 더 -->
</ul>
```

### 2-6. for 반복문 옵션

```liquid
{% for post in site.posts limit:10 %}     <!-- 10개만 -->
{% for post in site.posts offset:5 %}     <!-- 5개 건너뛰기 -->
{% for post in site.posts reversed %}     <!-- 역순 -->
{% for i in (1..10) %}                    <!-- 범위 -->
```

### 2-7. forloop 변수

반복문 안에서 사용 가능한 특수 변수:

```liquid
{% for post in site.posts %}
  {{ forloop.index }}      <!-- 1부터 시작하는 인덱스 -->
  {{ forloop.index0 }}     <!-- 0부터 시작하는 인덱스 -->
  {{ forloop.first }}      <!-- 첫 번째면 true -->
  {{ forloop.last }}       <!-- 마지막이면 true -->
  {{ forloop.length }}     <!-- 전체 길이 -->
{% endfor %}
```

**예제 - 첫 번째 글만 다르게 표시**:

```liquid
{% for post in site.posts %}
  {% if forloop.first %}
    <article class="featured">
      <h2>{{ post.title }}</h2>
      <p>{{ post.excerpt }}</p>
    </article>
  {% else %}
    <article>
      <h3>{{ post.title }}</h3>
    </article>
  {% endif %}
{% endfor %}
```

### 2-8. break와 continue

```liquid
{% for post in site.posts %}
  {% if post.published == false %}
    {% continue %}  <!-- 다음 반복으로 -->
  {% endif %}

  {% if forloop.index > 10 %}
    {% break %}     <!-- 반복 종료 -->
  {% endif %}

  <li>{{ post.title }}</li>
{% endfor %}
```

### 2-9. assign - 변수 할당

```liquid
{% assign 변수명 = 값 %}
```

**예제**:

```liquid
{% assign author = "John Doe" %}
{% assign post_count = site.posts.size %}
{% assign featured_posts = site.posts | where: "featured", true %}

<p>작성자: {{ author }}</p>
<p>전체 포스트: {{ post_count }}개</p>
<p>추천 글: {{ featured_posts.size }}개</p>
```

### 2-10. capture - 블록 캡처

여러 줄의 내용을 변수에 저장:

```liquid
{% capture greeting %}
  안녕하세요, {{ site.author }}님!
  오늘은 {{ site.time | date: "%Y년 %m월 %d일" }}입니다.
{% endcapture %}

<div>{{ greeting }}</div>
```

**왜 capture를 사용할까요?**

복잡한 HTML을 반복 사용하거나, 조건문 결과를 저장할 때 유용합니다.

### 2-11. case/when - switch 문

```liquid
{% case 변수 %}
  {% when 값1 %}
    내용1
  {% when 값2 %}
    내용2
  {% else %}
    기본 내용
{% endcase %}
```

**예제 - 카테고리별 아이콘**:

```liquid
{% case page.category %}
  {% when "tutorial" %}
    📚
  {% when "news" %}
    📰
  {% when "tech" %}
    💻
  {% else %}
    📝
{% endcase %}
```

## 3. Filters - 값 변환하기

파이프(`|`)로 연결하여 값을 변환합니다.

```liquid
{{ 값 | filter1 | filter2 | filter3 }}
```

### 3-1. 문자열 필터

```liquid
<!-- 대소문자 변환 -->
{{ "hello" | upcase }}           <!-- HELLO -->
{{ "WORLD" | downcase }}         <!-- world -->
{{ "hello world" | capitalize }} <!-- Hello world -->

<!-- 문자열 조작 -->
{{ "  hello  " | strip }}        <!-- "hello" (공백 제거) -->
{{ "hello world" | replace: "world", "jekyll" }}  <!-- hello jekyll -->
{{ "a,b,c" | split: "," }}       <!-- ["a", "b", "c"] -->

<!-- 자르기 -->
{{ "Hello World" | truncate: 8 }}      <!-- Hello... -->
{{ "Hello World" | truncatewords: 1 }} <!-- Hello... -->
{{ "Hello World" | slice: 0, 5 }}      <!-- Hello -->
```

**예제 - 긴 제목 축약**:

```liquid
<h2>{{ post.title | truncate: 50 }}</h2>
```

### 3-2. 배열 필터

```liquid
<!-- 크기 -->
{{ site.posts | size }}          <!-- 42 -->

<!-- 정렬 -->
{{ site.posts | sort: "date" }}
{{ site.posts | reverse }}

<!-- 첫 번째/마지막 -->
{{ site.posts | first }}
{{ site.posts | last }}

<!-- 조인 -->
{{ page.tags | join: ", " }}     <!-- "jekyll, blog, tutorial" -->

<!-- 범위 -->
{{ site.posts | slice: 0, 5 }}   <!-- 첫 5개 -->
```

**예제 - 태그 쉼표로 연결**:

```liquid
{% if page.tags.size > 0 %}
  <p>태그: {{ page.tags | join: ", " }}</p>
{% endif %}
```

### 3-3. 날짜 필터

```liquid
{{ page.date | date: "%Y-%m-%d" }}           <!-- 2025-10-16 -->
{{ page.date | date: "%Y년 %m월 %d일" }}     <!-- 2025년 10월 16일 -->
{{ page.date | date: "%B %d, %Y" }}          <!-- October 16, 2025 -->
{{ page.date | date_to_string }}             <!-- 16 Oct 2025 -->
{{ page.date | date_to_long_string }}        <!-- 16 October 2025 -->
```

**날짜 포맷 옵션**:

```
%Y - 연도 (4자리)         2025
%y - 연도 (2자리)         25
%m - 월 (01-12)           10
%B - 월 이름 (전체)       October
%b - 월 이름 (축약)       Oct
%d - 일 (01-31)           16
%H - 시 (00-23)           14
%M - 분 (00-59)           30
%S - 초 (00-59)           45
```

### 3-4. 수학 필터

```liquid
{{ 4 | plus: 2 }}        <!-- 6 -->
{{ 4 | minus: 2 }}       <!-- 2 -->
{{ 4 | times: 2 }}       <!-- 8 -->
{{ 10 | divided_by: 2 }} <!-- 5 -->
{{ 5 | modulo: 2 }}      <!-- 1 -->

{{ 4.5 | ceil }}         <!-- 5 -->
{{ 4.5 | floor }}        <!-- 4 -->
{{ 4.5 | round }}        <!-- 5 -->

{{ -5 | abs }}           <!-- 5 -->
```

**예제 - 읽는 시간 계산**:

```liquid
{% assign words = content | number_of_words %}
{% assign minutes = words | divided_by: 200 %}
<p>읽는 시간: 약 {{ minutes }}분</p>
```

### 3-5. URL 필터

```liquid
{{ "/about" | relative_url }}     <!-- /blog/about (baseurl 포함) -->
{{ "/about" | absolute_url }}     <!-- https://example.com/blog/about -->
{{ "hello world" | slugify }}     <!-- hello-world -->
{{ "hello world" | url_encode }}  <!-- hello%20world -->
```

**예제 - 링크 생성**:

```liquid
<a href="{{ post.url | relative_url }}">{{ post.title }}</a>
<img src="{{ '/assets/logo.png' | relative_url }}" alt="Logo">
```

### 3-6. Jekyll 특화 필터

```liquid
<!-- 마크다운 → HTML -->
{{ page.description | markdownify }}

<!-- HTML 태그 제거 -->
{{ content | strip_html }}

<!-- 단어 수 -->
{{ content | number_of_words }}

<!-- 배열 필터링 -->
{{ site.posts | where: "category", "tutorial" }}
{{ site.posts | where_exp: "post", "post.featured == true" }}

<!-- 그룹화 -->
{{ site.posts | group_by: "category" }}
```

**예제 - 카테고리별 포스트**:

```liquid
{% assign posts_by_category = site.posts | group_by: "category" %}

{% for group in posts_by_category %}
  <h2>{{ group.name }}</h2>
  <ul>
    {% for post in group.items %}
      <li>{{ post.title }}</li>
    {% endfor %}
  </ul>
{% endfor %}
```

## 4. Comments - 주석

```liquid
{% comment %}
  이 부분은 출력되지 않습니다.
  여러 줄 주석 가능
{% endcomment %}

{%- comment -%}하이픈을 사용하면 공백도 제거됩니다{%- endcomment -%}
```

## 5. Whitespace Control - 공백 제어

하이픈(`-`)을 사용하여 공백을 제거할 수 있습니다.

```liquid
{%- if true -%}
  hello
{%- endif -%}
```

**Before** (공백 포함):
```html

  hello

```

**After** (공백 제거):
```html
hello
```

**실전 활용**:

```liquid
<ul>
  {%- for post in site.posts -%}
    <li>{{ post.title }}</li>
  {%- endfor -%}
</ul>
```

## 6. 실전 예제

### 예제 1: 포스트 목록 (카드 형태)

```liquid
<div class="post-grid">
  {% for post in site.posts limit:9 %}
    <article class="post-card">
      {% if post.image %}
        <img src="{{ post.image | relative_url }}" alt="{{ post.title }}">
      {% endif %}

      <h2>
        <a href="{{ post.url | relative_url }}">
          {{ post.title }}
        </a>
      </h2>

      <time>{{ post.date | date: "%Y년 %m월 %d일" }}</time>

      <p>{{ post.excerpt | strip_html | truncate: 150 }}</p>

      {% if post.tags.size > 0 %}
        <div class="tags">
          {% for tag in post.tags %}
            <span class="tag">{{ tag }}</span>
          {% endfor %}
        </div>
      {% endif %}
    </article>
  {% endfor %}
</div>
```

### 예제 2: 카테고리 네비게이션

```liquid
{% assign categories = site.posts | map: "category" | uniq %}

<nav class="category-nav">
  <ul>
    {% for category in categories %}
      {% assign posts_in_category = site.posts | where: "category", category %}
      <li>
        <a href="/category/{{ category | slugify }}">
          {{ category }}
          <span class="count">({{ posts_in_category.size }})</span>
        </a>
      </li>
    {% endfor %}
  </ul>
</nav>
```

### 예제 3: 이전/다음 포스트 네비게이션

```liquid
<nav class="post-navigation">
  {% if page.previous %}
    <a href="{{ page.previous.url | relative_url }}" class="prev">
      ← {{ page.previous.title }}
    </a>
  {% endif %}

  {% if page.next %}
    <a href="{{ page.next.url | relative_url }}" class="next">
      {{ page.next.title }} →
    </a>
  {% endif %}
</nav>
```

### 예제 4: 관련 포스트 추천

```liquid
{% assign related_posts = site.posts | where_exp: "post",
    "post.category == page.category and post.url != page.url"
    | limit: 3 %}

{% if related_posts.size > 0 %}
  <aside class="related-posts">
    <h3>관련 글</h3>
    <ul>
      {% for post in related_posts %}
        <li>
          <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
        </li>
      {% endfor %}
    </ul>
  </aside>
{% endif %}
```

### 예제 5: 태그 클라우드

```liquid
{% assign all_tags = site.posts | map: "tags" | flatten | uniq %}

<div class="tag-cloud">
  {% for tag in all_tags %}
    {% assign posts_with_tag = site.posts | where_exp: "post",
        "post.tags contains tag" %}
    {% assign count = posts_with_tag.size %}

    {% if count > 10 %}
      {% assign size = "large" %}
    {% elsif count > 5 %}
      {% assign size = "medium" %}
    {% else %}
      {% assign size = "small" %}
    {% endif %}

    <a href="/tag/{{ tag | slugify }}" class="tag-{{ size }}">
      {{ tag }} ({{ count }})
    </a>
  {% endfor %}
</div>
```

### 예제 6: 읽는 시간 & 단어 수 표시

```liquid
{% assign words = content | number_of_words %}
{% assign read_time = words | divided_by: 200 | at_least: 1 %}

<div class="post-meta">
  <span>{{ words }}단어</span>
  <span>약 {{ read_time }}분</span>
</div>
```

### 예제 7: 조건부 광고 표시 (N번째 포스트마다)

```liquid
{% for post in site.posts %}
  <article>
    <h2>{{ post.title }}</h2>
    <!-- 포스트 내용 -->
  </article>

  {% assign index_mod = forloop.index | modulo: 3 %}
  {% if index_mod == 0 %}
    <aside class="ad">
      <!-- 광고 코드 -->
    </aside>
  {% endif %}
{% endfor %}
```

## 7. 고급 테크닉

### 7-1. Include 파라미터 전달

`_includes/button.html`:

```liquid
<button class="{{ include.class }}">
  {{ include.text }}
</button>
```

사용:

```liquid
{% include button.html text="클릭하세요" class="primary" %}
```

### 7-2. 데이터 파일 활용

`_data/authors.yml`:

```yaml
john:
  name: John Doe
  bio: 프론트엔드 개발자
  avatar: /assets/authors/john.jpg

jane:
  name: Jane Smith
  bio: 백엔드 개발자
  avatar: /assets/authors/jane.jpg
```

포스트에서 사용:

```liquid
{% assign author = site.data.authors[page.author] %}

<div class="author-info">
  <img src="{{ author.avatar }}" alt="{{ author.name }}">
  <h3>{{ author.name }}</h3>
  <p>{{ author.bio }}</p>
</div>
```

### 7-3. 커스텀 컬렉션

`_config.yml`:

```yaml
collections:
  projects:
    output: true
    permalink: /projects/:name/
```

`_projects/my-project.md`:

```markdown
---
title: My Project
tech: [React, Node.js]
---

프로젝트 설명...
```

프로젝트 목록:

```liquid
{% for project in site.projects %}
  <div class="project">
    <h2>{{ project.title }}</h2>
    <p>기술: {{ project.tech | join: ", " }}</p>
    {{ project.content }}
  </div>
{% endfor %}
```

### 7-4. 페이지네이션

`_config.yml`:

```yaml
plugins:
  - jekyll-paginate

paginate: 10
paginate_path: "/page/:num/"
```

`index.html`:

```liquid
{% for post in paginator.posts %}
  <article>{{ post.title }}</article>
{% endfor %}

{% if paginator.total_pages > 1 %}
  <nav class="pagination">
    {% if paginator.previous_page %}
      <a href="{{ paginator.previous_page_path }}">이전</a>
    {% endif %}

    <span>{{ paginator.page }} / {{ paginator.total_pages }}</span>

    {% if paginator.next_page %}
      <a href="{{ paginator.next_page_path }}">다음</a>
    {% endif %}
  </nav>
{% endif %}
```

## 8. 흔한 실수와 디버깅

### 실수 1: 잘못된 변수 참조

```liquid
<!-- ❌ 존재하지 않는 변수 -->
{{ post.auther }}  <!-- author의 오타 -->

<!-- ✅ 디폴트 값 사용 -->
{{ post.author | default: "익명" }}
```

### 실수 2: 필터 순서

```liquid
<!-- ❌ 순서가 틀림 -->
{{ post.title | truncate: 50 | upcase }}  <!-- 잘린 후 대문자 변환 -->

<!-- ✅ 올바른 순서 -->
{{ post.title | upcase | truncate: 50 }}  <!-- 대문자 변환 후 자르기 -->
```

### 실수 3: where 필터 오류

```liquid
<!-- ❌ 문자열 비교 오류 -->
{{ site.posts | where: "featured", "true" }}  <!-- featured가 boolean이면 안 됨 -->

<!-- ✅ boolean 비교 -->
{{ site.posts | where: "featured", true }}
```

### 실수 4: 빈 배열 체크

```liquid
<!-- ❌ 빈 배열도 true -->
{% if page.tags %}
  <!-- tags가 빈 배열이어도 실행됨 -->
{% endif %}

<!-- ✅ 크기 체크 -->
{% if page.tags.size > 0 %}
  <!-- 올바른 방법 -->
{% endif %}
```

### 디버깅 팁

**1. 변수 내용 확인**:

```liquid
<pre>{{ page | inspect }}</pre>
<pre>{{ site.posts | inspect }}</pre>
```

**2. 타입 확인**:

```liquid
{{ page.tags.size }}  <!-- 0이면 빈 배열, nil이면 에러 -->
```

**3. 조건문 디버깅**:

```liquid
{% if page.featured %}
  Debug: featured = {{ page.featured }}
  Type: {{ page.featured | inspect }}
{% else %}
  Debug: featured is nil or false
{% endif %}
```

## 9. 성능 최적화

### 1. assign을 활용한 중복 계산 방지

```liquid
<!-- ❌ 비효율적 (3번 계산) -->
{{ site.posts | where: "featured", true | size }}
{{ site.posts | where: "featured", true | first }}
{{ site.posts | where: "featured", true | last }}

<!-- ✅ 효율적 (1번 계산) -->
{% assign featured_posts = site.posts | where: "featured", true %}
{{ featured_posts.size }}
{{ featured_posts | first }}
{{ featured_posts | last }}
```

### 2. 조기 종료

```liquid
<!-- ❌ 모든 포스트를 순회 -->
{% for post in site.posts %}
  {% if forloop.index > 10 %}
    {% break %}
  {% endif %}
  {{ post.title }}
{% endfor %}

<!-- ✅ limit 사용 -->
{% for post in site.posts limit:10 %}
  {{ post.title }}
{% endfor %}
```

### 3. include 최소화

너무 많은 include는 빌드 시간을 증가시킵니다. 필요한 경우에만 사용하세요.

## 마치며

축하합니다! 이제 Liquid 템플릿 문법의 핵심을 모두 배웠습니다.

**핵심 정리**:
1. `{{ }}` - 값 출력
2. `{% %}` - 로직 (if, for, assign 등)
3. `|` - 필터 (변환)

**다음 단계**:
1. 실제 프로젝트에 적용해보기
2. `_includes`에 재사용 컴포넌트 만들기
3. `_layouts`에 커스텀 레이아웃 작성
4. `_data`에 구조화된 데이터 저장

**유용한 리소스**:
- [Liquid 공식 문서](https://shopify.github.io/liquid/)
- [Jekyll Liquid 필터](https://jekyllrb.com/docs/liquid/filters/)
- [Jekyll Cheatsheet](https://devhints.io/jekyll)

**연습 프로젝트 아이디어**:
1. 카테고리별 포스트 목록 페이지
2. 태그 검색 기능
3. 관련 포스트 추천 시스템
4. 저자 프로필 페이지
5. 프로젝트 포트폴리오

Liquid를 익히는 가장 좋은 방법은 직접 사용해보는 것입니다. 작은 것부터 시작해서 점차 복잡한 기능을 만들어보세요!