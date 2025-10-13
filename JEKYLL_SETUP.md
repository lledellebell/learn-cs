# Jekyll 로컬 개발 가이드

이 레포지토리는 GitHub Pages를 사용하여 Jekyll로 빌드됩니다.

## 로컬 환경 설정

### 1. Ruby 설치 (macOS)

```bash
# Homebrew로 Ruby 설치
brew install ruby

# 또는 rbenv 사용 (권장)
brew install rbenv ruby-build
rbenv install 3.1.0
rbenv global 3.1.0
```

### 2. Bundler 설치

```bash
gem install bundler
```

### 3. 의존성 설치

```bash
bundle install
```

## 로컬 개발 서버 실행

### 기본 서버 실행

```bash
bundle exec jekyll serve
```

브라우저에서 `http://localhost:4000/learn-cs/` 접속

### 개발 모드 (자동 새로고침)

```bash
bundle exec jekyll serve --livereload
```

### 초안 포함하여 실행

```bash
bundle exec jekyll serve --drafts
```

## 빌드만 하기

```bash
bundle exec jekyll build
```

빌드된 파일은 `_site/` 디렉토리에 생성됩니다.

## 문제 해결

### 빈 마크다운 파일 오류

빈 마크다운 파일은 Jekyll 빌드 오류를 일으킬 수 있습니다.
최소한 제목과 내용을 포함해야 합니다:

```markdown
# 제목

내용
```

### 포트 충돌

다른 포트로 실행하려면:

```bash
bundle exec jekyll serve --port 4001
```

### 캐시 문제

빌드 캐시를 삭제하려면:

```bash
bundle exec jekyll clean
```

## GitHub Pages 배포

- `master` 브랜치에 push하면 자동으로 GitHub Pages에 배포됩니다
- GitHub Actions에서 빌드 상태를 확인할 수 있습니다
- 배포 URL: https://lledellebell.github.io/learn-cs/

## 파일 구조

```
.
├── _config.yml          # Jekyll 설정
├── Gemfile             # Ruby 의존성
├── README.md           # 프로젝트 소개
├── NAVIGATION.md       # 네비게이션
├── algorithms/         # 알고리즘 문서
├── databases/          # 데이터베이스 문서
├── languages/          # 프로그래밍 언어 문서
├── networking/         # 네트워킹 문서
├── web-development/    # 웹 개발 문서
└── scripts/            # 빌드 스크립트
```

## 참고 자료

- [Jekyll 공식 문서](https://jekyllrb.com/)
- [GitHub Pages 문서](https://docs.github.com/en/pages)
- [Jekyll 테마](https://github.com/pages-themes/primer)
