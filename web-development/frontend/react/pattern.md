---
date: 2025-10-13
title: Header 컴포넌트에서 Compound/Composite 패턴을 사용하지 않는 이유
render_with_liquid: false
layout: page
---
{% raw %}
# Header 컴포넌트에서 Compound/Composite 패턴을 사용하지 않는 이유

혹시 이런 의문을 가져보신 적 있으신가요? "Card 컴포넌트는 Compound 패턴을 사용하는데, 왜 Header는 그냥 props로만 관리하지?" 저도 처음엔 똑같이 궁금했습니다. 이 글에서는 그 이유를 함께 알아보겠습니다.

## 먼저, 두 패턴을 비교해볼까요?

### Compound 패턴으로 만든다면?

Header를 Compound 패턴으로 만들면 이렇게 생겼을 겁니다:

```tsx
// Compound 패턴 스타일
<Header>
  <Header.HamburgerButton onClick={handleMenu} />
  <Header.Logo href="/" useMainHeading />
  <Header.SideButton onClick={handleIntro} />
</Header>

// 서브페이지용
<Header>
  <Header.BackButton onClick={goBack} />
  <Header.HomeButton href="/" />
  <Header.ProgressBar />
</Header>
```

### 현재 Configuration 패턴은?

현재 Header는 이렇게 사용하고 있습니다:

```tsx
// Configuration 패턴 스타일
<Header
  isHome
  showHamburgerMenu
  hamburgerButton={{
    onClick: handleMenu,
    ariaLabel: '메뉴 열기'
  }}
  logo={{
    href: '/',
    useMainHeading: true
  }}
/>
```

언뜻 보면 Compound 패턴이 더 직관적으로 보일 수 있습니다. 그런데 왜 Configuration 패턴을 선택했을까요?

## Header가 특별한 이유

### 1. 컴포넌트의 역할이 다릅니다

Card나 Daily 같은 컴포넌트를 떠올려보세요. 이들은 **콘텐츠를 표시**하는 역할입니다:

```tsx
// Card는 다양한 내용을 담을 수 있어요
<Card>
  <Card.Image src="photo.jpg" />
  <Card.Body>
    <Card.Headline>제목</Card.Headline>
    <Card.Description>설명</Card.Description>
  </Card.Body>
</Card>

// 또는 이미지 없이도 가능
<Card>
  <Card.Body>
    <Card.Headline>제목만</Card.Headline>
  </Card.Body>
</Card>
```

반면 Header는 **네비게이션**이라는 명확한 역할이 있습니다. 모든 페이지에서 일관되게 보여야 하고, 사용자가 헷갈리지 않아야 합니다.

### 2. 구조가 비교적 고정적입니다

웹사이트의 Header를 떠올려보세요. 대부분 이런 패턴을 따르죠:

- **홈페이지**: 메뉴 버튼 + 로고 + 부가 버튼
- **서브페이지**: 뒤로가기 + 로고 + 홈 버튼

이 구조는 거의 변하지 않습니다. 왜일까요? 바로 **사용자 경험의 일관성** 때문입니다. 사용자가 페이지를 이동할 때마다 Header의 위치나 구조가 바뀌면 혼란스럽겠죠?

### 3. 잘못된 사용을 방지할 수 있습니다

만약 Compound 패턴을 사용한다면 이런 실수가 발생할 수 있습니다:

```tsx
// 이런 조합도 가능해집니다 😱
<Header>
  <Header.Logo />
  <Header.Logo /> {/* 로고가 두 개? */}
  {/* 뒤로가기 버튼은 어디 갔지? */}
</Header>

// 아니면 이런 식으로...
<Header>
  <Header.SideButton />
  {/* 로고가 없네요? */}
  <Header.HamburgerButton />
</Header>
```

Configuration 패턴을 사용하면 이런 실수를 컴포넌트 내부에서 방지할 수 있습니다.

## 언제 어떤 패턴을 써야 할까요?

### Compound 패턴이 좋은 경우

**"다양한 조합이 필요한 콘텐츠 컴포넌트"**

- Card, Modal, Accordion
- 탭, 드롭다운, 리스트
- 매번 다른 구조로 사용될 수 있는 컴포넌트

```tsx
// 이런 유연성이 필요할 때
<Card>
  <Card.Image />
  <Card.Title />
  <Card.Actions>
    <Button>좋아요</Button>
    <Button>공유</Button>
  </Card.Actions>
</Card>
```

### Configuration 패턴이 좋은 경우

**"일관된 구조가 중요한 레이아웃 컴포넌트"**

- Header, Footer, Navigation
- Sidebar, Toolbar
- 브랜딩이나 UX 일관성이 중요한 컴포넌트

```tsx
// 이런 명확한 설정이 필요할 때
<Header
  variant="home"
  showMenu
  menuItems={menuItems}
  onMenuClick={handleMenu}
/>
```

## 실제 장단점을 비교해보면

### Compound 패턴의 장점
- 레이아웃을 자유롭게 변경 가능
- 조건부 렌더링이 명확
- 각 서브컴포넌트를 독립적으로 사용 가능

### Compound 패턴의 단점
- API가 복잡해질 수 있음
- 잘못된 조합이 가능
- 기본 레이아웃을 보장하기 어려움

### Configuration 패턴의 장점
- 일관된 구조 보장
- 사용이 간단하고 명확
- 잘못된 사용 방지
- 타입 안정성 확보 용이

### Configuration 패턴의 단점
- 새로운 변형 추가 시 props 증가
- 매우 복잡한 조합은 어려울 수 있음

## 결론: 적재적소가 중요합니다

Header에 Configuration 패턴을 사용하는 것은 **의도적인 선택**입니다. 이는:

1. **일관성**: 모든 페이지에서 예측 가능한 네비게이션 제공
2. **단순성**: 개발자가 복잡한 조합을 고민할 필요 없음
3. **안정성**: 잘못된 레이아웃 조합 방지
4. **유지보수**: 변경사항을 한 곳에서 관리

Card와 같은 콘텐츠 컴포넌트는 유연성이 중요하지만, Header와 같은 레이아웃 컴포넌트는 일관성이 더 중요합니다. 각 컴포넌트의 역할과 목적에 맞는 패턴을 선택하는 것이 좋은 설계입니다.

**핵심은 이것입니다**: 모든 패턴이 좋은 것도, 나쁜 것도 아닙니다. 상황과 목적에 맞게 선택하는 것이 중요합니다.

## 참고 자료

### 관련 문서
- [Compound Pattern](/web-development/frontend/react/patterns/compound-pattern.md)
- [Composite Pattern](/web-development/frontend/react/patterns/composite-pattern.md)
- [Configuration over Composition Pattern](/web-development/frontend/react/patterns/configuration-over-composition.md)
- [React에서 Composite/Compound Pattern 활용 가이드](/web-development/frontend/react/patterns/react-composite-compound-patterns.md)

### 외부 자료
- [React Patterns - Compound Components](https://kentcdodds.com/blog/compound-components-with-react-hooks) - Kent C. Dodds
- [When to Use Compound Components](https://www.patterns.dev/posts/compound-pattern) - Patterns.dev
- [Composition vs Configuration](https://americanexpress.io/composition-vs-configuration) - American Express Technology Blog
- [Design Patterns for Modern Web Development](https://www.smashingmagazine.com/2021/08/react-component-design-patterns-2021/) - Smashing Magazine

### React 공식 문서
- [Composition vs Inheritance](https://react.dev/learn/passing-props-to-a-component#passing-jsx-as-children) - React Docs
- [Thinking in React](https://react.dev/learn/thinking-in-react) - React Docs
{% endraw %}