---
layout: news
title: "HackerNews 오늘의 IT 뉴스"
date: 2025-10-17
last_modified_at: 2025-10-17T00:01:54.934Z
category: tech-news
---

# HackerNews 오늘의 IT 뉴스

**2025년 10월 17일 금요일** 기준 HackerNews Top 10 이야기

---


## 1. How I bypassed Amazon's Kindle web DRM

<div class="home-news-summary">

작성자는 아마존 킨들 웹 DRM을 리버스 엔지니어링하여 구매한 전자책을 다운로드했습니다. 이 DRM은 텍스트를 무작위 글리프 ID로 난독화하고 이를 SVG 경로에 매핑하며, 매핑이 5페이지마다 변경되고 스크래핑 방지용 SVG 경로 명령을 포함하는 다층적인 구조였습니다. 작성자는 각 SVG 글리프를 이미지로 렌더링하여 지각 해시(perceptual hash)를 생성한 뒤, 실제 TTF 폰트의 문자와 SSIM(Structural Similarity Index)을 이용해 매칭함으로써 텍스트를 100% 정확하게 디코딩하고 EPUB을 재구성하는 데 성공했습니다.

</div>

**원문:** [https://blog.pixelmelt.dev/kindle-web-drm/](https://blog.pixelmelt.dev/kindle-web-drm/)

---


## 2. Claude Skills

<div class="home-news-summary">

Claude Skills는 Claude가 특정 작업을 더 잘 수행하도록 돕는 기능으로, 지침, 스크립트, 리소스를 포함하는 폴더 형태입니다. Claude는 필요할 때 관련 스킬을 로드하여 엑셀 작업이나 브랜드 가이드라인 준수와 같은 전문화된 작업을 효율적으로 처리합니다. 사용자는 직접 스킬을 구축하여 Claude 앱, Claude Code, API 전반에 걸쳐 활용할 수 있으며, 스킬은 실행 가능한 코드를 포함할 수 있습니다.

</div>

**원문:** [https://www.anthropic.com/news/skills](https://www.anthropic.com/news/skills)

---


## 3. Cloudflare Sandbox SDK

**원문:** [https://sandbox.cloudflare.com/](https://sandbox.cloudflare.com/)

---


## 4. Gemini 3.0 spotted in the wild through A/B testing

<div class="home-news-summary">

Rick Lamers는 Google AI Studio의 A/B 테스트를 통해 소문으로만 전해지던 Gemini 3.0을 발견했으며, 모델 품질 평가 지표로 SVG 생성(특히 Xbox 360 컨트롤러 이미지)을 활용했다. 테스트 결과, 기존 모델 대비 매우 인상적인 Xbox 360 컨트롤러 SVG 이미지가 생성되었고, 이는 Gemini 3.0으로 추정되는 모델이 Gemini 2.5 Pro와 비교되었을 가능성을 시사하며, 해당 모델은 더 긴 TTFT와 약 40% 더 긴 출력 길이를 보였다.

</div>

**원문:** [https://ricklamers.io/posts/gemini-3-spotted-in-the-wild/](https://ricklamers.io/posts/gemini-3-spotted-in-the-wild/)

---


## 5. Your data model is your destiny

<div class="home-news-summary">

데이터 모델은 제품의 핵심 추상화를 정의하며, 새로운 기능이 경쟁 우위로 작용할지 단순한 기능 목록에 그칠지를 결정하는 스타트업의 운명입니다. 이는 제품이 현실을 표현하는 방식, 즉 핵심 개념이나 객체를 우선순위로 정하고 데이터베이스 아키텍처부터 UI/UX, 가격 책정, GTM 전략까지 모든 것을 형성합니다. AI가 코드를 보편화하는 시대에, 차별화된 데이터 모델은 경쟁자가 쉽게 복제할 수 없는 복합적인 이점과 조직적 현실을 구축하며, 성공적인 데이터 모델은 도메인의 '작업의 최소 단위'를 중심으로 설계되어야 합니다.

</div>

**원문:** [https://notes.mtb.xyz/p/your-data-model-is-your-destiny](https://notes.mtb.xyz/p/your-data-model-is-your-destiny)

---


## 6. Benjie's Humanoid Olympic Games

**원문:** [https://generalrobots.substack.com/p/benjies-humanoid-olympic-games](https://generalrobots.substack.com/p/benjies-humanoid-olympic-games)

---


## 7. Codex Is Live in Zed

<div class="home-news-summary">

Zed은 사용자들의 많은 요청에 따라 Agent Client Protocol (ACP)을 통해 OpenAI의 Codex를 기본 지원하기 시작했습니다. Codex는 터미널 명령을 자체 프로세스에서 실행하고 출력을 스트리밍하는 독특한 방식으로 작동하며, 이는 다른 에이전트와 달리 비-PTY 모드를 사용하여 교착 상태를 방지합니다. 사용자들은 OpenAI와 직접 요금 및 약정을 맺으며, Zed은 데이터에 관여하지 않고, 관련 `codex-acp` 어댑터는 오픈 소스로 공개되었습니다.

</div>

**원문:** [https://zed.dev/blog/codex-is-live-in-zed](https://zed.dev/blog/codex-is-live-in-zed)

---


## 8. DoorDash and Waymo launch autonomous delivery service in Phoenix

<div class="home-news-summary">

DoorDash와 Waymo는 메트로 피닉스에서 자율주행 배달 서비스를 시작했으며, DoorDash의 자율 배달 플랫폼을 통해 참여 가맹점의 주문을 Waymo 자율주행 차량으로 배달합니다. 또한, 로스앤젤레스, 샌프란시스코, 피닉스의 DashPass 회원에게는 2025년 말까지 매월 Waymo 탑승 시 10달러 할인 혜택을 제공하는 한정 프로모션을 진행합니다.

</div>

**원문:** [https://about.doordash.com/en-us/news/waymo](https://about.doordash.com/en-us/news/waymo)

---


## 9. Lead Limited Brain and Language Development in Neanderthals and Other Hominids?

<div class="home-news-summary">

고대 인류 친척들이 2백만 년 전부터 납에 노출되었으며, UC 샌디에이고 연구진은 네안데르탈인과 현대인의 치아에서 높은 납 수치를 발견했다. 현대인만이 가진 NOVA1 유전자 변이가 납의 해로운 영향으로부터 뇌를 보호하여 복잡한 언어 발달을 가능하게 했고, 이는 네안데르탈인에 대한 진화적 우위로 작용했을 수 있다.

</div>

**원문:** [https://today.ucsd.edu/story/did-lead-limit-brain-and-language-development-in-neanderthals-and-other-extinct-hominids](https://today.ucsd.edu/story/did-lead-limit-brain-and-language-development-in-neanderthals-and-other-extinct-hominids)

---


## 10. Talent

<div class="home-news-summary">

이 글은 극도로 생산적인 인물들의 사례를 통해 재능과 노력의 관계를 탐구하며, 특정 분야에서 뛰어난 성과는 종종 타고난 능력이나 기질에서 비롯된다고 주장합니다. 저자는 스콧 알렉산더의 에세이를 인용하여, 자연스럽게 잘하는 일은 '무료'처럼 느껴져 엄청난 노력이 필요 없지만, 그렇지 않은 일은 아무리 노력해도 힘든 '오르막길'과 같으므로, 자신에게 맞는 일을 찾아 집중하는 것이 중요하다고 강조합니다.

</div>

**원문:** [https://www.felixstocker.com/blog/talent](https://www.felixstocker.com/blog/talent)

---


## 정보

- **출처:** [HackerNews](https://news.ycombinator.com/)
- **업데이트:** 이 뉴스는 매일 오전 9시 자동으로 업데이트됩니다
- **API:** [HackerNews API](https://github.com/HackerNews/API)


**요약:** Google Gemini API 사용

