---
title: "HackerNews 오늘의 IT 뉴스"
date: 2025-10-14
last_modified_at: 2025-10-14T00:34:41.858Z
categories: [Tech News]
tags: [HTTP, Authentication, Security]
layout: news
category: tech-news
---
# HackerNews 오늘의 IT 뉴스

**2025년 10월 14일 화요일** 기준 HackerNews Top 10 이야기

---


## 1. Uv overtakes pip in CI (for Wagtail users)

uv가 Wagtail 프로젝트의 CI(지속적 통합) 환경에서 pip을 제치고 주요 패키지 설치 도구로 자리 잡았습니다. Wagtail의 CI 다운로드 중 uv가 66%를 차지하며 pip의 34%를 넘어섰고, 이러한 추세는 Django 및 FastAPI와 같은 다른 파이썬 프로젝트에서도 유사하게 나타납니다. 이에 따라 Wagtail은 공식 설치 가이드나 프로젝트 템플릿을 uv 중심으로 업데이트할 가능성이 있습니다.

**원문:** [https://wagtail.org/blog/uv-overtakes-pip-in-ci/](https://wagtail.org/blog/uv-overtakes-pip-in-ci/)

---


## 2. NanoChat – The best ChatGPT that $100 can buy

Andrej Karpathy의 `karpathy/nanochat`은 약 100달러의 예산으로 ChatGPT와 유사한 LLM을 구축할 수 있는 풀스택 구현체입니다. 이 프로젝트는 토큰화, 사전 학습, 미세 조정, 평가, 추론 및 웹 UI를 통한 대화형 서비스까지 LLM 개발의 전 과정을 포함하며, 단일 8XH100 GPU 노드에서 `speedrun.sh` 스크립트를 통해 약 4시간 만에 전체 파이프라인을 실행할 수 있습니다.

**원문:** [https://github.com/karpathy/nanochat](https://github.com/karpathy/nanochat)

---


## 3. DDoS Botnet Aisuru Blankets US ISPs in Record DDoS

Aisuru 봇넷은 미국 ISP에 호스팅된 취약한 IoT 장치(라우터, 보안 카메라 등)를 활용하여 전례 없는 규모의 DDoS 공격을 감행하고 있으며, 최근에는 초당 약 30테라비트의 트래픽을 기록하며 이전 기록을 경신했습니다. 이 봇넷은 주로 온라인 게임 커뮤니티를 표적으로 삼아 광범위한 인터넷 서비스 중단을 야기하며, 감염된 고객 장치에서 발생하는 대규모 아웃바운드 공격은 ISP의 서비스 품질 저하와 운영 문제를 초래하고 있습니다.

**원문:** [https://krebsonsecurity.com/2025/10/ddos-botnet-aisuru-blankets-us-isps-in-record-ddos/](https://krebsonsecurity.com/2025/10/ddos-botnet-aisuru-blankets-us-isps-in-record-ddos/)

---


## 4. First device based on 'optical thermodynamics' can route light without switches

미국 서던 캘리포니아 대학교 연구팀이 '광학 열역학' 원리를 활용하여 스위치나 외부 제어 없이 빛이 스스로 경로를 찾아가는 최초의 광학 장치를 개발했습니다. 이 장치는 비선형 시스템에서 빛이 열역학적 원리에 따라 자가 조직화된 흐름을 생성함으로써, 기존의 복잡한 광학 라우팅 방식의 한계를 극복하고 컴퓨팅 및 통신 분야에 혁신적인 잠재력을 제공합니다.

**원문:** [https://phys.org/news/2025-10-device-based-optical-thermodynamics-route.html](https://phys.org/news/2025-10-device-based-optical-thermodynamics-route.html)

---


## 5. Sony Playstation 2 fixing frenzy

이 웹페이지는 저자가 여러 대의 Sony PlayStation 2 FAT 콘솔을 수리하고 개조한 과정을 상세히 설명합니다. RTC 배터리, 서멀 패드, KHS-400C 레이저 모듈 교체, 파손된 플라스틱 부품 및 전원 스위치 수리 등 다양한 기술적 문제를 해결했습니다. 또한, FMCB/FHDB 설치, 1TB SATA HDD 및 어댑터 장착, 컨트롤러 복원 등의 개조 작업을 통해 현대적인 플레이 환경을 구축했습니다.

**원문:** [https://retrohax.net/sony-playstation-2-fixing-frenzy/](https://retrohax.net/sony-playstation-2-fixing-frenzy/)

---


## 6. JIT: So you want to be faster than an interpreter on modern CPUs

JIT 컴파일러는 인터프리터보다 빠른 성능을 목표로 하지만, 현대 CPU의 비순차적 실행 및 분기 예측과 같은 고급 기능 덕분에 잘 작성된 인터프리터도 상당한 효율을 낼 수 있습니다. 특히, 인터프리터의 `switch` 문 기반 디스패치를 "computed gotos" 방식으로 개선하고, PostgreSQL의 `int4eq`와 같은 일반적인 함수 호출을 인라인하여 특수 오퍼코드화하는 등의 최적화는 인터프리터 성능을 크게 향상시킵니다. 이러한 개선 사항들은 JIT 컴파일러가 목표로 하는 성능 향상 중 상당 부분을 인터프리터 자체에서도 달성할 수 있게 하여, JIT의 우위 확보를 더욱 어렵게 만듭니다.

**원문:** [https://www.pinaraf.info/2025/10/jit-so-you-want-to-be-faster-than-an-interpreter-on-modern-cpus/](https://www.pinaraf.info/2025/10/jit-so-you-want-to-be-faster-than-an-interpreter-on-modern-cpus/)

---


## 7. Show HN: SQLite Online – 11 years of solo development, 11K daily users

SQL Online AiDE는 SQLite, DuckDB, PGLite, MariaDB, PostgreSQL, MS SQL 등 다양한 데이터베이스를 지원하는 차세대 온라인 SQL 에디터입니다. 이 에디터는 `QLINE-SELECT`와 같은 사용자 정의 구문을 통해 데이터 시각화(차트) 기능을 제공하며, AI 도움말, 실시간 오류 강조, XLSX 내보내기 및 가상 테이블(federated queries) 지원 등 고급 기능을 포함합니다.

**원문:** [https://sqliteonline.com/](https://sqliteonline.com/)

---


## 8. Accidentally Made a Zig Dotenv Parser

작성자는 Zig 기반 CLI 인자 파서 개발 중 환경 변수 지원 기능을 구현하다가, 우연히 완전한 `.dotenv` 파서를 만들게 되었습니다. 이 기능을 `zdotenv`라는 별도의 Zig 라이브러리로 분리했으며, 이는 `.env` 파일에서 키-값 쌍을 로드하고, 주석 및 빈 줄을 지원하며, 해시 맵을 통해 값에 쉽게 접근할 수 있는 메모리 안전한 파서입니다. `zdotenv`는 사용자 지정 `.env` 파일 이름과 여러 파일을 로드하는 기능도 제공합니다.

**원문:** [https://dayvster.com/blog/accidentally-made-a-zig-dotenv-parser/](https://dayvster.com/blog/accidentally-made-a-zig-dotenv-parser/)

---


## 9. Modern iOS Security Features – A Deep Dive into SPTM, TXM, and Exclaves

애플의 XNU 커널은 모놀리식 구조로 인해 커널 손상 시 시스템 전반에 심각한 영향을 미칠 수 있었으나, 애플은 이를 개선하기 위해 보다 세분화된 아키텍처를 도입하고 있습니다. 이 논문은 새로운 보안 메커니즘인 SPTM, TXM, Exclaves를 심층 분석하며, SPTM이 메모리 재타이핑을 통해 신뢰 도메인을 도입하여 코드 서명 및 권한 확인을 담당하는 TXM과 같은 핵심 기능을 분리함을 설명합니다. 나아가 SPTM이 Exclaves의 기반을 마련하고 xnuproxy 및 Tightbeam IPC를 통해 통신하며, 이러한 아키텍처 변화가 시스템 보안을 강화하여 커널 손상 시에도 추가적인 보안 보장을 제공함을 밝힙니다.

**원문:** [https://arxiv.org/abs/2510.09272](https://arxiv.org/abs/2510.09272)

---


## 10. Strudel REPL – a music live coding environment living in the browser

**원문:** [https://strudel.cc](https://strudel.cc)

---


## 정보

- **출처:** [HackerNews](https://news.ycombinator.com/)
- **업데이트:** 이 뉴스는 매일 자동으로 업데이트됩니다
- **API:** [HackerNews API](https://github.com/HackerNews/API)


**요약:** Google Gemini API 사용

