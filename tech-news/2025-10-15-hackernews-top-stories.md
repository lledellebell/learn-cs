---
title: "HackerNews 오늘의 IT 뉴스"
date: 2025-10-15
last_modified_at: 2025-10-15T00:02:11.439Z
categories: [Tech News]
tags: [HTTP, Authentication, Security]
layout: news
category: tech-news
---
# HackerNews 오늘의 IT 뉴스

**2025년 10월 15일 수요일** 기준 HackerNews Top 10 이야기

---


## 1. Surveillance data challenges what we thought we knew about location tracking

<div class="home-news-summary">

Lighthouse Reports는 First Wap의 휴대폰 추적 소프트웨어인 Altamides에 대한 방대한 감시 데이터를 발견했습니다. 이 소프트웨어는 SS7 취약점을 이용해 전 세계인의 위치를 파악하고, SMS를 가로채며, WhatsApp 같은 암호화된 메시지 앱까지 침해할 수 있습니다. 조사 결과, First Wap은 권위주의 정부, 개인 기업, 심지어 제재 대상 개인에게까지 이 기술을 판매하며, 환경 운동가 감시나 개인 스토킹 등 광범위한 목적으로 사용되고 있음이 드러났고, 회사는 제재 회피를 돕고 불법 활동을 부인했습니다.

</div>

**원문:** [https://www.lighthousereports.com/investigation/surveillance-secrets/](https://www.lighthousereports.com/investigation/surveillance-secrets/)

---


## 2. Beliefs that are true for regular software but false when applied to AI

<div class="home-news-summary">

이 웹페이지는 일반 대중이 AI의 위험성을 기존 소프트웨어 버그에 대한 이해를 바탕으로 오해하고 있다고 지적합니다. AI 시스템의 문제는 코드 오류가 아닌 방대한 훈련 데이터에서 비롯되며, 특정 데이터 포인트를 찾아 논리적으로 해결하거나 완전히 제거하는 것이 불가능합니다. 또한 AI는 예측 불가능한 방식으로 동작하거나 개발자조차 모르는 능력을 발현할 수 있어, 기존 소프트웨어처럼 명확한 사양에 맞춰 제어하거나 버그를 영구적으로 수정하기 어렵다고 설명합니다.

</div>

**원문:** [https://boydkane.com/essays/boss](https://boydkane.com/essays/boss)

---


## 3. How bad can a $2.97 ADC be?

**원문:** [https://excamera.substack.com/p/how-bad-can-a-297-adc-be](https://excamera.substack.com/p/how-bad-can-a-297-adc-be)

---


## 4. Why Is SQLite Coded in C and not Rust

<div class="home-news-summary">

SQLite는 성능, 호환성, 낮은 의존성, 안정성을 이유로 C 언어로 구현되었다. C++나 Java 같은 객체 지향 언어는 다른 언어와의 호환성이 낮고, Rust나 Go 같은 "안전한" 언어는 개발 당시 존재하지 않았거나 재구현 시 버그 발생 및 성능 저하 우려, OOM(메모리 부족) 처리 방식의 차이 등으로 채택되지 않았다.

</div>

**원문:** [https://www.sqlite.org/whyc.html](https://www.sqlite.org/whyc.html)

---


## 5. How AI hears accents: An audible visualization of accent clusters

<div class="home-news-summary">

BoldVoice는 방대한 비원어민 영어 발음 데이터셋을 활용하여 사전 학습된 HuBERT 모델을 발음 식별 작업에 맞게 미세 조정했습니다. 이 모델의 768차원 잠재 공간을 UMAP으로 3D 시각화하여 발음 클러스터를 분석했으며, 개인 정보 보호 및 발음 차이 명확화를 위해 음성 표준화 기술을 적용했습니다. 그 결과, 발음 그룹화가 언어학적 분류보다는 지리적 근접성, 이민, 식민주의와 같은 요인에 더 크게 영향을 받는다는 것을 발견했습니다.

</div>

**원문:** [https://accent-explorer.boldvoice.com/](https://accent-explorer.boldvoice.com/)

---


## 6. Hacking the Humane AI Pin

<div class="home-news-summary">

작성자는 Humane Ai Pin 서비스 종료 후 기기를 확보하고, 익명으로 유출된 ADB 프라이빗 키를 통해 장치에 초기 접근하는 데 성공했습니다. 하지만 SELinux 제한으로 인해 기능이 제한되자, Android 12L에 존재하는 CVE-2024-31317 취약점을 발견하고 이를 활용했습니다. 이 취약점은 `hidden_api_blacklist_exemptions` 전역 설정을 조작하여 Zygote 프로세스에 악성 페이로드를 주입함으로써 `system` 수준의 권한을 획득하는 방식으로 작동합니다.

</div>

**원문:** [https://writings.agg.im/posts/hacking_ai_pin/](https://writings.agg.im/posts/hacking_ai_pin/)

---


## 7. GrapheneOS is finally ready to break free from Pixels and it may never look back

<div class="home-news-summary">

GrapheneOS가 구글 픽셀 독점 지원에서 벗어나, 주요 안드로이드 OEM과 협력하여 스냅드래곤 기반의 플래그십 스마트폰에 보안 운영체제를 제공할 예정이다. 이는 해당 OEM이 GrapheneOS의 엄격한 보안 및 업데이트 요구사항을 충족했기 때문이며, 픽셀 10 지원은 확정되었으나 픽셀 11 지원 여부는 미정이다.

</div>

**원문:** [https://www.androidauthority.com/graphene-os-major-android-oem-partnership-3606853/](https://www.androidauthority.com/graphene-os-major-android-oem-partnership-3606853/)

---


## 8. Unpacking Cloudflare Workers CPU Performance Benchmarks

<div class="home-news-summary">

클라우드플레어 워커스가 Theo Browne의 CPU 성능 벤치마크에서 Vercel보다 최대 3.5배 낮은 성능을 보였습니다. 조사 결과, 워커스 인프라의 스케줄링 문제, V8 가비지 컬렉터 튜닝 미흡, 그리고 OpenNext/Next.js 코드 내 불필요한 메모리 할당 및 비효율적인 스트림 어댑터 사용 등 여러 문제가 발견되었습니다. 클라우드플레어는 이러한 문제들을 해결하여 워커스의 성능을 Vercel과 동등한 수준으로 끌어올렸으며, 이는 모든 사용자에게 혜택을 줄 것입니다.

</div>

**원문:** [https://blog.cloudflare.com/unpacking-cloudflare-workers-cpu-performance-benchmarks/](https://blog.cloudflare.com/unpacking-cloudflare-workers-cpu-performance-benchmarks/)

---


## 9. SmolBSD – build your own minimal BSD system

<div class="home-news-summary">

smolBSD는 NetBSD 기반의 메타 운영체제로, `netbsd-MICROVM` 커널을 활용하여 사용자가 자신만의 최소화된 UNIX 환경이나 맞춤형 OS 이미지를 빠르고 재현 가능하게 구성할 수 있도록 돕습니다. 필요한 서비스만 선택하면 몇 분 안에 어디서든 실행 가능한 작고 부팅 가능한 이미지를 생성하며, 즉각적인 부팅과 범용적인 실행 환경을 제공하는 것이 특징입니다.

</div>

**원문:** [https://smolbsd.org](https://smolbsd.org)

---


## 10. What Americans die from vs. what the news reports on

<div class="home-news-summary">

이 웹페이지는 2023년 미국 내 사망 원인과 뉴욕타임스, 워싱턴포스트, 폭스뉴스 등 주요 언론의 보도 내용을 비교 분석한 결과, 뉴스 보도가 실제 사망 원인 분포를 크게 왜곡하고 있음을 밝힌다. 심장병과 암처럼 실제 사망의 56%를 차지하는 주요 원인들은 언론 보도의 7%만을 차지한 반면, 살인이나 테러 같은 드물고 극적인 사건들은 전체 보도의 절반 이상을 차지하며 실제 사망률에 비해 극도로 과대 대표되었다.

</div>

**원문:** [https://ourworldindata.org/does-the-news-reflect-what-we-die-from](https://ourworldindata.org/does-the-news-reflect-what-we-die-from)

---


## 정보

- **출처:** [HackerNews](https://news.ycombinator.com/)
- **업데이트:** 이 뉴스는 매일 오전 9시 자동으로 업데이트됩니다
- **API:** [HackerNews API](https://github.com/HackerNews/API)


**요약:** Google Gemini API 사용

