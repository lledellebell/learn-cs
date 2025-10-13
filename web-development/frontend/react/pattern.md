---
date: 2025-10-13
title: Header 컴포넌트에서 Compound/Composite 패턴을 사용하지 않는 이유
render_with_liquid: false
layout: page
---
{% raw %}
# Header 컴포넌트에서 Compound/Composite 패턴을 사용하지 않는 이유

React로 컴포넌트를 설계하다 보면 이런 고민을 하게 됩니다. "Card 컴포넌트는 Compound 패턴을 사용해서 유연하게 만들었는데, Header도 똑같이 만들어야 하나?" 저도 처음에는 일관성을 위해 모든 컴포넌트를 같은 패턴으로 만들어야 한다고 생각했습니다. 하지만 실제로 프로젝트를 진행하면서 깨달은 것은, **컴포넌트의 목적과 사용 패턴에 따라 다른 설계 접근법이 필요**하다는 것입니다.

이 문서에서는 왜 Header 같은 레이아웃 컴포넌트에는 Configuration 패턴이 더 적합한지, 그리고 언제 Compound 패턴을 사용해야 하는지 실제 경험을 바탕으로 자세히 설명하겠습니다.

## 먼저, 두 패턴을 자세히 비교해볼까요?

### Compound 패턴 방식

Compound 패턴은 부모 컴포넌트와 자식 컴포넌트가 암묵적으로 상태를 공유하는 패턴입니다. Header를 Compound 패턴으로 만든다면 이렇게 될 것입니다:

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

**이 방식의 특징:**
- 각 서브 컴포넌트를 자유롭게 배치할 수 있습니다
- 조건부로 특정 요소만 렌더링하기 쉽습니다
- JSX만 보고도 화면 구조를 파악할 수 있습니다
- 하지만 개발자가 직접 올바른 조합을 만들어야 합니다

### Configuration 패턴 방식

현재 Header는 이렇게 구현되어 있습니다:

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

// 서브페이지용
<Header
  showBackButton
  backButton={{
    onClick: goBack,
    ariaLabel: '뒤로가기'
  }}
  showHomeButton
/>
```

**이 방식의 특징:**
- props를 통해 컴포넌트의 동작을 설정합니다
- 내부 구조는 컴포넌트가 제어합니다
- 잘못된 조합을 컴포넌트 레벨에서 방지할 수 있습니다
- 일관된 레이아웃을 보장합니다

언뜻 보면 Compound 패턴이 더 직관적이고 유연해 보일 수 있습니다. 실제로 많은 UI 라이브러리들이 이 패턴을 사용합니다. 그렇다면 왜 Header에는 Configuration 패턴을 선택했을까요?

## Header 컴포넌트가 특별한 이유

### 1. 컴포넌트의 역할과 목적이 근본적으로 다릅니다

Card나 Modal, Accordion 같은 컴포넌트를 생각해보세요. 이들은 **콘텐츠를 담는 컨테이너**입니다:

```tsx
// Card는 매번 다른 내용을 담습니다
<Card>
  <Card.Image src="product.jpg" alt="상품 이미지" />
  <Card.Body>
    <Card.Badge>NEW</Card.Badge>
    <Card.Title>프리미엄 헤드폰</Card.Title>
    <Card.Description>
      뛰어난 음질과 편안한 착용감을 자랑하는...
    </Card.Description>
    <Card.Price>89,000원</Card.Price>
  </Card.Body>
  <Card.Actions>
    <Button variant="primary">구매하기</Button>
    <Button variant="secondary">장바구니</Button>
  </Card.Actions>
</Card>

// 또는 간단하게
<Card>
  <Card.Body>
    <Card.Title>공지사항</Card.Title>
    <Card.Description>시스템 점검이 예정되어 있습니다.</Card.Description>
  </Card.Body>
</Card>

// 심지어 완전히 다른 구조도 가능
<Card>
  <Card.Header>
    <Card.Avatar src="user.jpg" />
    <Card.Meta>
      <Card.Author>홍길동</Card.Author>
      <Card.Date>2시간 전</Card.Date>
    </Card.Meta>
  </Card.Header>
  <Card.Content>
    <p>오늘 점심 뭐 먹지?</p>
  </Card.Content>
</Card>
```

**Card가 Compound 패턴을 사용하는 이유:**
1. **다양한 콘텐츠 구조**: 상품 카드, 프로필 카드, 게시글 카드 등 매번 다른 구조가 필요합니다
2. **유연한 레이아웃**: 이미지를 위에 둘지, 옆에 둘지, 아예 없을지 상황에 따라 다릅니다
3. **조건부 요소**: Badge나 Actions 같은 요소는 있을 수도, 없을 수도 있습니다
4. **재사용 가능한 파츠**: Card.Image, Card.Title 등을 다른 곳에서도 독립적으로 사용할 수 있습니다

반면 **Header는 네비게이션을 담당하는 레이아웃 컴포넌트**입니다. Header의 역할은 명확합니다:
- 사용자가 현재 어디에 있는지 알려줌
- 다른 페이지로 이동할 수 있게 함
- 주요 액션(메뉴 열기, 홈으로 가기 등)에 접근하게 함

이런 역할은 모든 페이지에서 **일관되게 동작**해야 합니다. 사용자가 페이지를 이동할 때마다 Header의 구조나 위치가 바뀌면 혼란스럽고 불편합니다.

### 2. 구조의 고정성과 변동성

웹사이트의 Header를 떠올려보세요. 대부분의 웹사이트는 이런 패턴을 따릅니다:

**홈페이지:**
```
[메뉴 버튼] [로고] [검색/프로필 등]
```

**서브페이지:**
```
[뒤로가기] [페이지 제목] [홈 버튼]
```

이 구조는 거의 **절대 변하지 않습니다**. 왜일까요?

#### 사용자 경험의 일관성

사용자는 학습을 통해 인터페이스를 익힙니다. "아, 이 앱은 왼쪽 위에 메뉴 버튼이 있구나", "뒤로가기는 여기 있지"라고 한 번 익히면, 다음부터는 생각 없이 그 위치를 터치합니다.

만약 개발자가 Compound 패턴을 사용해서 이렇게 만든다면:

```tsx
// A 페이지
<Header>
  <Header.Logo />
  <Header.Menu />
  <Header.Search />
</Header>

// B 페이지 - 개발자가 실수로 순서를 바꿈
<Header>
  <Header.Menu />
  <Header.Logo />
  <Header.Search />
</Header>

// C 페이지 - 또 다른 개발자가 다르게 구성
<Header>
  <Header.BackButton />
  <Header.Logo />
  <Header.Menu />
  <Header.Search />
</Header>
```

이렇게 되면 사용자는 매 페이지마다 "메뉴 버튼이 어디 있지?"하고 찾아야 합니다.

#### 브랜딩과 디자인 시스템

Header는 브랜드 아이덴티티의 핵심입니다. 로고의 위치, 크기, 주변 요소들은 디자인 시스템에서 엄격하게 정의됩니다. Configuration 패턴을 사용하면 이런 규칙을 컴포넌트 내부에 강제할 수 있습니다:

```tsx
// Header 컴포넌트 내부
const Header = ({ isHome, showBackButton, logo, ... }) => {
  return (
    <header className="fixed top-0 w-full h-14 bg-white border-b">
      <div className="container mx-auto flex items-center justify-between">
        {/* 왼쪽: 항상 하나의 액션만 */}
        {showBackButton ? (
          <BackButton {...backButton} />
        ) : isHome ? (
          <HamburgerButton {...hamburgerButton} />
        ) : (
          <div className="w-10" /> // 빈 공간 유지
        )}

        {/* 중앙: 항상 로고 */}
        <Logo {...logo} className="absolute left-1/2 -translate-x-1/2" />

        {/* 오른쪽: 조건부 액션들 */}
        <div className="flex items-center gap-2">
          {showHomeButton && <HomeButton {...homeButton} />}
          {showProfile && <ProfileButton {...profile} />}
        </div>
      </div>
    </header>
  );
};
```

이렇게 하면:
- 로고는 **항상** 중앙에 위치합니다
- 왼쪽은 **항상** 하나의 주요 액션만 있습니다
- 레이아웃의 높이와 간격이 **항상** 일정합니다

### 3. 잘못된 사용을 방지하는 것의 중요성

"개발자가 조심하면 되지 않나?"라고 생각할 수 있습니다. 하지만 실제 프로젝트에서는:

#### 여러 개발자가 함께 작업합니다

```tsx
// 개발자 A가 만든 페이지
<Header>
  <Header.BackButton onClick={goBack} />
  <Header.Logo href="/" />
  <Header.HomeButton href="/" />
</Header>

// 개발자 B가 만든 페이지 - BackButton과 HomeButton이 둘 다 있음
<Header>
  <Header.BackButton onClick={goBack} />
  <Header.Logo href="/" />
  <Header.HomeButton href="/" />
  <Header.SearchButton onClick={openSearch} />
</Header>

// 개발자 C가 만든 페이지 - 순서가 다름
<Header>
  <Header.Logo href="/" />
  <Header.BackButton onClick={goBack} />
</Header>
```

**문제점:**
- 일관성이 깨집니다
- 코드 리뷰에서 모든 Header 사용을 일일이 확인해야 합니다
- 나중에 Header 디자인이 바뀌면 모든 사용처를 찾아서 수정해야 합니다

#### 논리적으로 말이 안 되는 조합이 가능합니다

```tsx
// 로고가 없는 Header - 브랜딩이 사라짐
<Header>
  <Header.BackButton onClick={goBack} />
  <Header.SearchButton onClick={openSearch} />
</Header>

// 로고가 두 개 - 말이 안 됨
<Header>
  <Header.Logo href="/" />
  <Header.Logo href="/" />
  <Header.BackButton onClick={goBack} />
</Header>

// BackButton과 HomeButton이 동시에 - 중복 기능
<Header>
  <Header.BackButton onClick={goBack} />
  <Header.HomeButton href="/" />
  <Header.Logo href="/" />
</Header>
```

Configuration 패턴을 사용하면 이런 문제를 **컴파일 타임에** 방지할 수 있습니다:

```tsx
type HeaderProps = {
  logo: LogoProps;
  // isHome이 true면 showBackButton은 불가능
} & (
  | { isHome: true; hamburgerButton: HamburgerButtonProps; showBackButton?: never }
  | { isHome?: false; showBackButton?: boolean; backButton?: BackButtonProps }
);
```

이렇게 타입을 정의하면:
```tsx
// ✅ OK
<Header isHome hamburgerButton={{...}} logo={{...}} />

// ✅ OK
<Header showBackButton backButton={{...}} logo={{...}} />

// ❌ 타입 에러!
<Header isHome showBackButton hamburgerButton={{...}} backButton={{...}} logo={{...}} />
```

## 언제 어떤 패턴을 써야 할까요?

### Compound 패턴이 적합한 경우

**"콘텐츠의 구조가 매번 다른 컴포넌트"**

#### 1. Card 계열

```tsx
// 상품 카드
<ProductCard>
  <ProductCard.Image src="..." />
  <ProductCard.Badge>신상품</ProductCard.Badge>
  <ProductCard.Title>제품명</ProductCard.Title>
  <ProductCard.Price original="50,000" sale="39,000" />
  <ProductCard.Rating value={4.5} />
  <ProductCard.Actions>
    <Button>구매</Button>
    <IconButton icon="heart" />
  </ProductCard.Actions>
</ProductCard>

// 블로그 카드
<BlogCard>
  <BlogCard.Image src="..." />
  <BlogCard.Category>기술</BlogCard.Category>
  <BlogCard.Title>리액트 패턴 가이드</BlogCard.Title>
  <BlogCard.Excerpt>
    리액트에서 자주 사용되는...
  </BlogCard.Excerpt>
  <BlogCard.Meta>
    <BlogCard.Author name="홍길동" />
    <BlogCard.Date>2024-01-15</BlogCard.Date>
    <BlogCard.ReadTime>5분</BlogCard.ReadTime>
  </BlogCard.Meta>
</BlogCard>
```

**왜 Compound 패턴인가?**
- 상품 카드와 블로그 카드는 완전히 다른 구조입니다
- Badge가 있을 수도, 없을 수도 있습니다
- 가격 표시 방식이 다양합니다
- Actions의 버튼 구성이 다릅니다

#### 2. Modal / Dialog

```tsx
<Modal open={isOpen} onClose={handleClose}>
  <Modal.Header>
    <Modal.Title>삭제 확인</Modal.Title>
    <Modal.CloseButton />
  </Modal.Header>
  <Modal.Body>
    <Modal.Icon type="warning" />
    <p>정말로 삭제하시겠습니까?</p>
    <Modal.Description>
      이 작업은 되돌릴 수 없습니다.
    </Modal.Description>
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={handleClose}>
      취소
    </Button>
    <Button variant="danger" onClick={handleDelete}>
      삭제
    </Button>
  </Modal.Footer>
</Modal>

// 또는 간단한 알림
<Modal open={isOpen} onClose={handleClose}>
  <Modal.Body>
    <p>저장되었습니다!</p>
  </Modal.Body>
  <Modal.Footer>
    <Button onClick={handleClose}>확인</Button>
  </Modal.Footer>
</Modal>
```

#### 3. Form 계열

```tsx
<Form onSubmit={handleSubmit}>
  <Form.Section title="기본 정보">
    <Form.Field>
      <Form.Label>이름</Form.Label>
      <Form.Input name="name" required />
      <Form.HelperText>실명을 입력해주세요</Form.HelperText>
    </Form.Field>

    <Form.Field>
      <Form.Label>이메일</Form.Label>
      <Form.Input type="email" name="email" required />
    </Form.Field>
  </Form.Section>

  <Form.Section title="추가 정보">
    <Form.Field>
      <Form.Label>전화번호</Form.Label>
      <Form.Input type="tel" name="phone" />
      <Form.HelperText>선택사항입니다</Form.HelperText>
    </Form.Field>
  </Form.Section>

  <Form.Actions>
    <Button type="button" variant="secondary">
      취소
    </Button>
    <Button type="submit" variant="primary">
      제출
    </Button>
  </Form.Actions>
</Form>
```

### Configuration 패턴이 적합한 경우

**"구조가 일정하고 일관성이 중요한 레이아웃 컴포넌트"**

#### 1. Header

```tsx
// 일관된 레이아웃 보장
<Header
  variant="home"
  logo={{ href: '/', alt: '회사 로고' }}
  navigation={{
    items: menuItems,
    onMenuClick: handleMenuClick
  }}
  actions={[
    { type: 'search', onClick: openSearch },
    { type: 'notifications', count: 3 },
    { type: 'profile', user: currentUser }
  ]}
/>
```

#### 2. Footer

```tsx
<Footer
  logo={{ src: '/logo.svg', alt: '회사 로고' }}
  description="우리는 최고의 서비스를 제공합니다"
  links={{
    company: [
      { label: '회사 소개', href: '/about' },
      { label: '채용', href: '/careers' }
    ],
    support: [
      { label: '고객 지원', href: '/support' },
      { label: 'FAQ', href: '/faq' }
    ]
  }}
  social={{
    facebook: 'https://facebook.com/company',
    twitter: 'https://twitter.com/company',
    instagram: 'https://instagram.com/company'
  }}
  copyright="© 2024 Company. All rights reserved."
/>
```

#### 3. Sidebar / Navigation

```tsx
<Sidebar
  position="left"
  width={240}
  collapsible
  defaultCollapsed={false}
  items={[
    {
      id: 'dashboard',
      label: '대시보드',
      icon: 'dashboard',
      href: '/dashboard'
    },
    {
      id: 'users',
      label: '사용자 관리',
      icon: 'users',
      href: '/users',
      badge: { count: 5, variant: 'danger' }
    },
    {
      id: 'settings',
      label: '설정',
      icon: 'settings',
      children: [
        { label: '일반', href: '/settings/general' },
        { label: '보안', href: '/settings/security' },
        { label: '알림', href: '/settings/notifications' }
      ]
    }
  ]}
  footer={{
    user: currentUser,
    actions: ['profile', 'logout']
  }}
/>
```

## 실제 장단점을 깊이 있게 비교해보면

### Compound 패턴의 장점

#### 1. 극도로 유연한 레이아웃

```tsx
// 이미지를 위에
<Card>
  <Card.Image />
  <Card.Body>
    <Card.Title />
  </Card.Body>
</Card>

// 이미지를 옆에
<Card horizontal>
  <Card.Image />
  <Card.Body>
    <Card.Title />
  </Card.Body>
</Card>

// 이미지를 배경으로
<Card>
  <Card.BackgroundImage />
  <Card.Body overlay>
    <Card.Title />
  </Card.Body>
</Card>
```

#### 2. 조건부 렌더링이 명확

```tsx
<Card>
  <Card.Image src={product.image} />
  <Card.Body>
    {product.isNew && <Card.Badge>NEW</Card.Badge>}
    <Card.Title>{product.name}</Card.Title>
    {product.discount > 0 && (
      <Card.Price
        original={product.price}
        sale={product.price * (1 - product.discount)}
      />
    )}
    {user.isLoggedIn && (
      <Card.Actions>
        <Button>구매</Button>
      </Card.Actions>
    )}
  </Card.Body>
</Card>
```

JSX를 보는 것만으로 "아, 신상품일 때만 Badge가 나오고, 할인 중일 때만 할인가가 표시되고, 로그인했을 때만 구매 버튼이 보이는구나"를 바로 알 수 있습니다.

#### 3. 서브 컴포넌트의 독립적 재사용

```tsx
// Card.Title을 다른 곳에서도 사용
<div>
  <Card.Title as="h1">페이지 제목</Card.Title>
  <Card.Description>페이지 설명</Card.Description>
</div>

// Card.Image도 독립적으로
<div>
  <Card.Image
    src="banner.jpg"
    aspectRatio="16:9"
    objectFit="cover"
  />
</div>
```

### Compound 패턴의 단점

#### 1. API 복잡성

사용자(개발자)가 알아야 할 것이 많습니다:

```tsx
// 어떤 서브 컴포넌트들이 있는지 알아야 함
<Card>
  <Card.Image />        // 이게 있고
  <Card.Thumbnail />    // 이것도 있는지?
  <Card.Picture />      // 이것과 차이는?
  <Card.Body>
    <Card.Title />      // 이건 필수?
    <Card.Heading />    // 이것과 다른가?
    <Card.Text />
    <Card.Description /> // 이것도 있네?
    <Card.Content />    // 뭐가 다르지?
  </Card.Body>
</Card>
```

문서를 자세히 읽지 않으면 올바르게 사용하기 어렵습니다.

#### 2. 잘못된 조합이 가능

```tsx
// 논리적으로 말이 안 되는 조합들
<Modal>
  <Modal.Footer>
    <Button>확인</Button>
  </Modal.Footer>
  {/* Body가 없는 Modal? */}
</Modal>

<Card>
  <Card.Body>
    <Card.Title>제목</Card.Title>
  </Card.Body>
  <Card.Body>
    <Card.Description>설명</Card.Description>
  </Card.Body>
  {/* Body가 두 개? */}
</Card>
```

이런 문제를 방지하려면 런타임 체크가 필요합니다:

```tsx
// Card 컴포넌트 내부
useEffect(() => {
  const bodies = React.Children.toArray(children).filter(
    child => child.type === Card.Body
  );

  if (bodies.length > 1) {
    console.warn('Card는 하나의 Body만 가질 수 있습니다');
  }
}, [children]);
```

#### 3. 기본 레이아웃 보장의 어려움

디자인 시스템에서 "Card의 이미지는 항상 위에, Title은 Body 안에, Actions는 항상 맨 아래"라고 정의했다면, Compound 패턴에서는 이를 강제하기 어렵습니다.

### Configuration 패턴의 장점

#### 1. 일관된 구조 보장

```tsx
// 모든 Header는 동일한 구조를 가짐
<Header variant="home" logo={{...}} menuButton={{...}} />
<Header variant="sub" logo={{...}} backButton={{...}} />
```

컴포넌트 내부에서 레이아웃을 제어하므로 일관성이 보장됩니다.

#### 2. 사용이 간단하고 명확

```tsx
// 단순히 props를 전달
<Header
  showSearch
  searchPlaceholder="검색어를 입력하세요"
  onSearchSubmit={handleSearch}
/>
```

"무엇을 어떻게 배치할지"가 아니라 "어떤 기능을 활성화할지"만 생각하면 됩니다.

#### 3. 타입 안정성

```tsx
type HeaderProps = {
  logo: LogoProps;
} & (
  // 홈 variant
  | {
      variant: 'home';
      menuButton: MenuButtonProps;
      backButton?: never;  // 불가능
    }
  // 서브페이지 variant
  | {
      variant: 'sub';
      backButton: BackButtonProps;
      menuButton?: never;  // 불가능
    }
);

// ✅ OK
<Header variant="home" logo={{...}} menuButton={{...}} />

// ❌ 타입 에러!
<Header variant="home" logo={{...}} menuButton={{...}} backButton={{...}} />
```

### Configuration 패턴의 단점

#### 1. Props 증가

새로운 기능이 추가될 때마다 props가 늘어납니다:

```tsx
interface HeaderProps {
  variant: 'home' | 'sub' | 'modal';
  logo: LogoProps;
  menuButton?: MenuButtonProps;
  backButton?: BackButtonProps;
  closeButton?: CloseButtonProps;
  homeButton?: HomeButtonProps;
  searchButton?: SearchButtonProps;
  notificationButton?: NotificationButtonProps;
  profileButton?: ProfileButtonProps;
  title?: string;
  subtitle?: string;
  showBorder?: boolean;
  showShadow?: boolean;
  sticky?: boolean;
  // ... 계속 늘어남
}
```

하지만 이는 적절한 그룹핑으로 해결 가능합니다:

```tsx
interface HeaderProps {
  variant: 'home' | 'sub' | 'modal';
  logo: LogoProps;
  primaryAction: PrimaryActionProps;  // menuButton | backButton | closeButton
  secondaryActions?: SecondaryAction[];  // search, notification, profile 등
  title?: TitleProps;
  style?: StyleProps;  // border, shadow, sticky 등
}
```

#### 2. 매우 복잡한 조합은 어려움

Configuration 패턴으로는 구현하기 어려운 경우도 있습니다:

```tsx
// 이런 복잡한 레이아웃은 어려움
<Header>
  <div className="left">
    <BackButton />
    <Logo />
  </div>
  <div className="center">
    <SearchBar fullWidth />
  </div>
  <div className="right">
    <Badge count={3}>
      <NotificationButton />
    </Badge>
    <ProfileMenu>
      <Avatar />
      <DropdownMenu items={menuItems} />
    </ProfileMenu>
  </div>
</Header>
```

하지만 Header처럼 일관성이 중요한 컴포넌트에서는 이런 극단적인 커스터마이징이 필요하지 않습니다.

## 결론: 컴포넌트의 본질을 이해하고 선택하세요

Header에 Configuration 패턴을 사용하는 것은 **타협이 아니라 의도적인 선택**입니다.

### Configuration 패턴이 제공하는 가치

1. **일관성**: 모든 페이지에서 예측 가능한 네비게이션
2. **안정성**: 잘못된 조합을 컴파일 타임에 방지
3. **단순성**: 개발자가 "어떻게 배치할지" 고민할 필요 없음
4. **유지보수성**: 변경사항을 한 곳에서 관리
5. **접근성**: 일관된 구조로 스크린 리더 등이 예측 가능
6. **성능**: 불필요한 리렌더링 최소화

### 선택의 기준

컴포넌트를 설계할 때 이렇게 질문해보세요:

1. **"이 컴포넌트의 주요 목적은 무엇인가?"**
   - 콘텐츠를 담는 것 → Compound 패턴 고려
   - 일관된 레이아웃 제공 → Configuration 패턴 고려

2. **"매번 다른 구조가 필요한가?"**
   - 예 → Compound 패턴
   - 아니오 → Configuration 패턴

3. **"잘못된 조합이 문제가 되나?"**
   - 예 (사용자 경험, 브랜딩 등에 영향) → Configuration 패턴
   - 아니오 → Compound 패턴

4. **"개발자의 자유도와 제약 중 무엇이 더 중요한가?"**
   - 자유도 → Compound 패턴
   - 제약 → Configuration 패턴

### 마지막 조언

**좋은 API 설계는 "무엇이든 할 수 있게" 만드는 것이 아니라, "올바른 것은 쉽게, 잘못된 것은 어렵게" 만드는 것입니다.**

Header는 Configuration 패턴으로, Card는 Compound 패턴으로 만든 것은 각 컴포넌트의 본질을 이해하고 그에 맞는 최선의 선택을 한 것입니다. 모든 컴포넌트를 같은 패턴으로 만들려는 "일관성"보다는, 각 컴포넌트의 목적에 맞는 "적절한" 패턴을 선택하는 것이 진정한 좋은 설계입니다.

## 참고 자료

### 관련 문서
- [Compound Pattern](/web-development/frontend/react/patterns/compound-pattern.md) - Compound 패턴의 상세한 구현 방법
- [Composite Pattern](/web-development/frontend/react/patterns/composite-pattern.md) - Composite 패턴과의 차이점
- [Configuration over Composition Pattern](/web-development/frontend/react/patterns/configuration-over-composition.md) - Configuration 패턴의 철학
- [React에서 Composite/Compound Pattern 활용 가이드](/web-development/frontend/react/patterns/react-composite-compound-patterns.md) - 실전 활용 가이드

### 외부 자료
- [React Patterns - Compound Components](https://kentcdodds.com/blog/compound-components-with-react-hooks) - Kent C. Dodds
- [When to Use Compound Components](https://www.patterns.dev/posts/compound-pattern) - Patterns.dev
- [Composition vs Configuration](https://americanexpress.io/composition-vs-configuration) - American Express Technology Blog
- [Advanced React Component Patterns](https://frontendmasters.com/courses/advanced-react-patterns/) - Frontend Masters
- [Design Patterns for Modern Web Development](https://www.smashingmagazine.com/2021/08/react-component-design-patterns-2021/) - Smashing Magazine

### React 공식 문서
- [Composition vs Inheritance](https://react.dev/learn/passing-props-to-a-component#passing-jsx-as-children) - React Docs
- [Thinking in React](https://react.dev/learn/thinking-in-react) - React Docs
- [Choosing the State Structure](https://react.dev/learn/choosing-the-state-structure) - React Docs

### 책
- "Advanced React Patterns" - Alex Kondov
- "React Design Patterns and Best Practices" - Michele Bertoli
- "Fluent React" - Tejas Kumar
{% endraw %}
