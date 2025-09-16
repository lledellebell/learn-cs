<div align="center">
<img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDFtbXJsZXJtMGdkZXZpbmVoNnRtdGNnNjJvZHVxdGVvZnRqcTNvZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/f3iwJFOVOwuy7K6FFw/giphy.gif" width="400" alt="Computer Science">
<h1 align="center" style="margin: 10px 0 20px">CS 학습 노트</h1>
</div>


<div align="center">

<!-- 프로젝트 상태 -->
![Last Updated](https://img.shields.io/badge/최종%20업데이트-2025--08--27-blue)
![Status](https://img.shields.io/badge/상태-진행%20중-success)
![Progress](https://img.shields.io/badge/학습진행도-1%25-yellow)

<!-- 콘텐츠 정보 -->
![Topics](https://img.shields.io/badge/주제-7개-brightgreen)
![Language](https://img.shields.io/badge/언어-한국어-orange)
![Code Examples](https://img.shields.io/badge/코드예제-포함-informational)

<!-- 저장소 통계 -->
![Stars](https://img.shields.io/github/stars/lledellebell/learn-cs)
![Forks](https://img.shields.io/github/forks/lledellebell/learn-cs)
![Visitors](https://visitor-badge.laobi.icu/badge?page_id=b.learn-cs)
![Contributors](https://img.shields.io/badge/기여자-1명-blueviolet)
![License](https://img.shields.io/badge/라이선스-MIT-lightgrey)

</div>

<div align="center">
<p>이 저장소는 컴퓨터 과학(CS) 개념과 기술을 학습하고 기록하기 위한 공간입니다.</p>
</div>

## 목차

- [알고리즘 (Algorithms)](/algorithms/): 알고리즘 설계, 분석 및 구현
- [자료구조 (Data Structures)](/data-structures/): 기본 및 자료구조
- [프로그래밍 언어 (Languages)](/languages/): 언어별 핵심 개념과 패러다임
- [네트워킹 (Networking)](/networking/): 네트워크 프로토콜, HTTP, TCP/IP 등
- [운영체제 (Operating Systems)](/operating-systems/): OS 개념, 프로세스, 스레드, 메모리 관리
- [데이터베이스 (Databases)](/databases/): SQL, NoSQL, 데이터 모델링, 쿼리 최적화
- [웹 개발 (Web Development)](/web-development/): 프론트엔드, 백엔드
- [보안 (Security)](/security/): 암호화, 인증, 권한 부여, 웹 보안

## 학습 방법

1. 각 주제별 폴더에 학습 내용을 마크다운 파일로 정리
2. 코드 예제는 해당 주제 폴더 내에 저장
3. 다이어그램과 시각 자료를 활용하여 개념 이해 강화
4. 실습 프로젝트를 통한 개념 적용

## 참고 자료

- 책, 강의, 온라인 자료 등의 출처 기록
- 링크 모음

## 학습 계획

- [ ] **기초 개념 학습**: 각 분야의 핵심 개념과 이론 학습
- [ ] **실습 프로젝트**: 학습한 개념을 적용한 소규모 프로젝트 구현
- [ ] **심화 학습**: 다양한 주제와 알고리즘 탐구
- [ ] **종합 프로젝트**: 여러 분야를 통합한 프로젝트 개발

## 학습 자료

### 추천 책

- **알고리즘**: "알고리즘 입문" (Grokking Algorithms) - Aditya Bhargava
- **자료구조**: "Data Structures and Algorithms in Python" - Michael T. Goodrich
- **네트워킹**: "Computer Networking: A Top-Down Approach" - James F. Kurose
- **운영체제**: "Operating System Concepts" - Abraham Silberschatz

### 온라인 강의

- [CS50: 컴퓨터 과학 입문](https://cs50.harvard.edu/)
- [MIT OpenCourseWare](https://ocw.mit.edu/)
- [Coursera - 컴퓨터 과학 강좌](https://www.coursera.org/browse/computer-science)

## Private Content 관리

이 저장소는 **Git Submodule**을 사용하여 private content를 관리합니다. 면접 대비 자료와 커리어 관련 자료는 별도의 `private` 저장소에서 관리됩니다.

### 초기 설정

```bash
# 1. GitHub에서 private 저장소 생성 (예: learn-cs-private)
# 2. Submodule 설정 스크립트 실행
npm run setup:submodule
```

### 일상 사용법

```bash
# Private content 상태 확인
npm run private:status

# Private content 업데이트 (다른 환경에서 변경사항 가져오기)
npm run private:update

# Private content 수정 후 커밋
npm run private:commit "새로운 면접 자료 추가"

# 새로운 면접 자료 생성
node scripts/manage-private-content.js create "binary-search"
node scripts/manage-private-content.js create "system-design" system-design
```

### 구조

```
learn-cs/
├── private/                    # Git Submodule (별도 private 저장소)
│   ├── interview/              # 면접 대비 자료
│   └── career/                 # 커리어 관련 자료
└── (public content)            # 공개 학습 자료
```

## 기여 방법

개인 학습 노트이지만 개선 제안이나 오류 수정은 언제든지 환영합니다.

### 템플릿 사용

기여하시려면 GitHub의 표준 템플릿을 사용해주세요. 이슈나 풀 리퀘스트 작성 시 자동으로 템플릿이 제공됩니다.

- 오류 보고: `.github/ISSUE_TEMPLATE/bug_report.md`
- 새로운 내용 제안: `.github/ISSUE_TEMPLATE/feature_request.md`
- 풀 리퀘스트: `.github/PULL_REQUEST_TEMPLATE.md`

### 자동화 워크플로우

이 저장소는 다음과 같은 GitHub Actions 자동화를 사용합니다:

- **마크다운 링크 검사**: 모든 마크다운 파일의 링크가 유효한지 검사합니다.
- **자동 라벨링**: 이슈와 PR에 자동으로 관련 라벨을 붙입니다.
- **오래된 이슈 관리**: 30일 동안 활동이 없는 이슈와 PR을 자동으로 표시하고 관리합니다.

## 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.
