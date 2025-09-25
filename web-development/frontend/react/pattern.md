# (수정해야함) Header 컴포넌트에서 Compound/Composite 패턴을 사용하지 않는 이유

Header 컴포넌트에서 Compound/Composite 패턴을 사용하지 않는 이유와 사용할 수 있는 방법을 분석해보겠습니다.

## 현재 Header가 Compound 패턴을 사용하지 않는 이유

### 1. **단일 책임 원칙**
Header는 하나의 명확한 역할(페이지 상단 네비게이션)을 가지고 있어서 내부 구조를 외부에 노출할 필요가 적습니다.

### 2. **고정된 레이아웃**
Header의 구조는 비교적 고정적입니다.
- 홈페이지: 햄버거메뉴 + 로고 + 사이드버튼
- 서브페이지: 뒤로가기 + 홈버튼

### 3. **복잡성 vs 유연성 트레이드오프**
현재는 props로 충분히 커스터마이징이 가능하여 Compound 패턴의 복잡성이 필요하지 않았습니다.

## Compound 패턴을 적용한다면?

메모리에서 보듯이 Card, Daily, Weekly 컴포넌트들은 Compound 패턴을 성공적으로 사용하고 있습니다. Header에도 적용할 수 있습니다.

```tsx
// 가능한 Compound 패턴 구조
<Header>
  <Header.HamburgerButton onClick={handleMenu} />
  <Header.Logo href="/" useMainHeading={true} />
  <Header.SideButton onClick={handleIntro} />
</Header>

// 또는 서브페이지
<Header>
  <Header.BackButton onClick={goBack} />
  <Header.HomeButton href="/" />
  <Header.ProgressBar />
</Header>
```

## Compound 패턴의 장단점

**장점:**
- 더 세밀한 제어 가능
- 각 서브컴포넌트의 독립적 사용
- 레이아웃 순서 변경 가능
- 조건부 렌더링이 더 명확

**단점:**
- API 복잡성 증가
- 잘못된 조합 가능성
- 기본 레이아웃 보장의 어려움

## 결론

현재 Header는 **Configuration over Composition** 접근법을 사용하고 있습니다. 이는:

1. **일관성**: 모든 페이지에서 동일한 Header 구조 보장
2. **단순성**: 개발자가 복잡한 조합을 고민할 필요 없음
3. **안정성**: 잘못된 레이아웃 조합 방지

하지만 더 유연한 Header가 필요하다면 Compound 패턴을 적용할 수 있습니다. 어떤 방향을 선호하시나요?

Header에 Compound 패턴을 적용해보겠습니다. 현재 메모리에서 보듯이 Card, Daily, TodayWeeklyInsight 컴포넌트들이 이 패턴을 성공적으로 사용하고 있으니, Header에도 동일한 접근법을 적용할 수 있습니다.

Header에 Compound 패턴을 적용하겠습니다. 기존 메모리에서 본 Card, Daily, TodayWeeklyInsight 컴포넌트들과 동일한 패턴을 사용하겠습니다.

먼저 Header 컴포넌트를 Compound 패턴으로 리팩토링하겠습니다.

현재 Header를 Compound 패턴으로 리팩토링하는 중이었는데, 이 작업이 너무 복잡해질 수 있습니다. 

실제로 Header 컴포넌트의 경우 Compound 패턴이 적합하지 않을 수 있는 이유들이 있습니다.

1. **고정된 레이아웃**: Header는 브랜딩과 일관성이 중요하여 자유로운 조합보다는 정해진 패턴이 더 적합
2. **복잡성 증가**: 현재 props 기반 API가 이미 충분히 유연하고 사용하기 쉬움
3. **잘못된 사용 가능성**: 개발자가 잘못된 조합으로 Header를 구성할 위험

변경사항을 되돌리고 원래 Header 구조로 복원하겠습니다.

Header에서 Compound/Composite 패턴을 사용하지 않는 이유를 정리하면:

## Header가 Compound 패턴을 사용하지 않는 이유

### 1. **컴포넌트의 성격 차이**
- **Card, Daily, Weekly**: 콘텐츠 표시 컴포넌트로 다양한 조합이 필요
- **Header**: 네비게이션 컴포넌트로 일관된 구조가 중요

### 2. **사용 패턴의 차이**
```tsx
// Card는 다양한 조합이 유용
<Card>
  <Card.Image />
  <Card.Body>
    <Card.Headline />
    <Card.Description />
  </Card.Body>
</Card>

// Header는 고정된 패턴이 더 적합
<Header 
  isHome={true}
  showHamburgerMenu={true}
  hamburgerButton={{...}}
/>
```

### 3. **복잡성 vs 유연성**
- **Card 계열**: 유연성이 복잡성보다 중요 (다양한 콘텐츠 표현)
- **Header**: 일관성이 유연성보다 중요 (브랜딩, UX 일관성)

### 4. **잘못된 사용 방지**
Header에 Compound 패턴을 적용하면:
```tsx
// 잘못된 조합 가능성
<Header>
  <Header.Logo />
  <Header.Logo /> {/* 중복 로고 */}
  {/* 뒤로가기 버튼 없음 */}
</Header>
```

### 5. **현재 API의 충분함**
현재 props 기반 API로도 필요한 모든 커스터마이징이 가능:
- 각 버튼의 attributes 추가
- 조건부 표시/숨김
- 이벤트 핸들러 커스터마이징

## 결론

Header는 **Configuration over Composition** 패턴이 더 적합합니다. 이는 일관된 사용자 경험과 개발자 경험을 보장하면서도 필요한 유연성을 제공합니다.

Card 같은 콘텐츠 컴포넌트와 Header 같은 레이아웃 컴포넌트는 서로 다른 설계 철학이 필요한 것이 맞습니다.