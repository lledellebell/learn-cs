---
title: Prop Drilling과 컴포넌트 설계 - 진짜 문제는 무엇일까?
description: Prop drilling의 근본 원인은 UI 기준 컴포넌트 설계입니다. 데이터 기준으로 설계하면 prop drilling이 자연스럽게 해결되고, TypeScript 타입 안정성, 성능 최적화, 테스트 용이성까지 개선됩니다. Context API 없이도 깔끔한 컴포넌트 구조를 만드는 실전 가이드.
date: 2025-10-17
categories: [Web Development, React]
tags: [React, Component Design, Prop Drilling, Architecture, TypeScript, Performance, Testing, Best Practices]
render_with_liquid: false
layout: page
---
{% raw %}

# Prop Drilling과 컴포넌트 설계: 진짜 문제는 무엇일까?

## 이런 고민 해보신 적 있나요?

> "컴포넌트를 만드는 과정에서 자식 컴포넌트를 많이 만들다 보니, prop을 여러 단계로 넘기는 게 너무 과한 것 같아요. 이게 prop drilling인가요? 설계를 잘못한 걸까요?"

저도 정확히 같은 고민을 했었습니다. 컴포넌트를 "잘" 쪼개려고 노력했는데, 어느 순간 보니 5단계, 6단계로 prop을 계속 전달하고 있더라고요. 그때마다 "Context API를 써야 하나?", "이게 과도한 추상화인가?" 같은 생각이 들었죠.

그런데 나중에 깨달은 게 있습니다. **Prop drilling 자체가 문제가 아니었어요.** 진짜 문제는 컴포넌트를 **어떤 기준으로 나누는가**에 있었습니다.

## Prop Drilling은 증상일 뿐

Prop drilling을 "증상"으로 생각해봅시다. 열이 나는 것처럼요. 열이 나면 해열제를 먹을 수 있지만, 진짜 병을 치료하지 않으면 계속 열이 날 거예요.

```text
증상: Prop drilling (prop을 여러 단계로 전달)
     ↓
진짜 원인: 불필요한 중간 컴포넌트들
     ↓
근본 원인: UI 기준으로 컴포넌트 설계
```

## UI 기준 설계가 Prop Drilling을 만든다

실제 예제로 살펴봅시다. 사용자 프로필 페이지를 만든다고 가정해볼게요.

### ❌ UI 기준으로 설계하면

디자인을 보면서 "음, 여기 카드가 있고, 그 안에 헤더가 있고, 바디가 있네"라고 생각하며 만들면:

```jsx
function ProfilePage() {
  const user = {
    name: "홍길동",
    email: "hong@example.com",
    avatar: "...",
    followers: 100,
    posts: [...]
  };

  return <ProfileCard user={user} />;
}

function ProfileCard({ user }) {
  // user 전체를 받았지만, 여기서는 사용하지 않음
  // 그냥 자식들에게 전달하기 위한 중간 다리일 뿐
  return (
    <div className="card">
      <ProfileHeader user={user} />
      <ProfileBody user={user} />
    </div>
  );
}

function ProfileHeader({ user }) {
  // user 전체를 받았지만, 여기서도 사용하지 않음
  return (
    <div className="header">
      <ProfileImage user={user} />
      <ProfileInfo user={user} />
    </div>
  );
}

function ProfileImage({ user }) {
  // 드디어 실제로 사용!
  return <img src={user.avatar} alt={user.name} />;
}

function ProfileInfo({ user }) {
  // 여기서도 실제로 사용
  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}

function ProfileBody({ user }) {
  return (
    <div className="body">
      <FollowerCount user={user} />
      <PostList user={user} />
    </div>
  );
}

function FollowerCount({ user }) {
  // 또 한참 내려와서 사용
  return <span>{user.followers} followers</span>;
}

function PostList({ user }) {
  return user.posts.map(post => <Post key={post.id} post={post} />);
}
```

**보이시나요?** `ProfileCard`, `ProfileHeader`, `ProfileBody` 같은 컴포넌트들은 **실제로 user 데이터를 사용하지 않습니다**. 그냥 레이아웃을 위해 존재하면서 prop을 전달만 해요.

```text
ProfilePage (user 생성)
    ↓ user 전달
ProfileCard (user 사용 안함, 전달만)
    ↓ user 전달
ProfileHeader (user 사용 안함, 전달만)
    ↓ user 전달
ProfileImage (드디어 user.avatar 사용!)
```

이게 바로 **UI 기준 설계가 만드는 prop drilling**입니다.

### ✅ 데이터 기준으로 설계하면

같은 기능을 데이터 기준으로 설계해봅시다.

```jsx
function ProfilePage() {
  const user = {
    name: "홍길동",
    email: "hong@example.com",
    avatar: "...",
    followers: 100,
    posts: [...]
  };

  // 데이터를 직접 분해해서 필요한 컴포넌트에 전달
  return (
    <div className="card">
      <div className="header">
        <UserAvatar src={user.avatar} alt={user.name} />
        <UserInfo name={user.name} email={user.email} />
      </div>
      <div className="body">
        <FollowerCount count={user.followers} />
        <PostList posts={user.posts} />
      </div>
    </div>
  );
}

// 각 컴포넌트는 필요한 데이터만 받음
function UserAvatar({ src, alt }) {
  return <img src={src} alt={alt} />;
}

function UserInfo({ name, email }) {
  return (
    <div>
      <h2>{name}</h2>
      <p>{email}</p>
    </div>
  );
}

function FollowerCount({ count }) {
  return <span>{count} followers</span>;
}

function PostList({ posts }) {
  return posts.map(post => <Post key={post.id} post={post} />);
}
```

**차이가 보이시나요?**

- 불필요한 중간 컴포넌트 없음
- 각 컴포넌트가 필요한 데이터만 정확히 받음
- Prop drilling 없음!

```text
ProfilePage
  ├─ UserAvatar (src, alt만 받음)
  ├─ UserInfo (name, email만 받음)
  ├─ FollowerCount (count만 받음)
  └─ PostList (posts만 받음)

평평한 구조! 각자 필요한 것만!
```

## 핵심 차이점: 컴포넌트의 존재 이유

두 접근법의 근본적인 차이를 정리하면:

### UI 기준 (❌)

```text
질문: "화면에 뭐가 보이지?"
답변: 카드, 헤더, 바디...

결과:
- 레이아웃을 위한 컴포넌트들이 생김
- 이들은 데이터를 사용하지 않고 전달만 함
- Prop drilling 발생
```

### 데이터 기준 (✅)

```text
질문: "어떤 데이터를 보여주지?"
답변: 유저 아바타, 유저 정보, 팔로워 수...

결과:
- 데이터를 사용하는 컴포넌트들만 생김
- 각자 필요한 데이터만 직접 받음
- Prop drilling 최소화
```

## 실전 예제: 전자상거래 상품 상세 페이지

더 복잡한 예제로 비교해봅시다.

### ❌ UI 기준: Prop Drilling 발생

```jsx
function ProductDetailPage({ productId }) {
  const product = useProduct(productId);

  return <ProductDetailCard product={product} />;
}

function ProductDetailCard({ product }) {
  // product를 사용하지 않고 전달만
  return (
    <div className="detail-card">
      <ProductDetailHeader product={product} />
      <ProductDetailContent product={product} />
      <ProductDetailFooter product={product} />
    </div>
  );
}

function ProductDetailHeader({ product }) {
  // 또 전달만
  return (
    <div className="header">
      <ProductBreadcrumb product={product} />
      <ProductMainInfo product={product} />
    </div>
  );
}

function ProductBreadcrumb({ product }) {
  // 드디어 사용
  return (
    <nav>
      <a href="/">홈</a> &gt;
      <a href={`/category/${product.categoryId}`}>{product.category}</a> &gt;
      <span>{product.name}</span>
    </nav>
  );
}

function ProductMainInfo({ product }) {
  // 또 전달만...
  return (
    <div>
      <ProductImage product={product} />
      <ProductInfo product={product} />
    </div>
  );
}

function ProductImage({ product }) {
  // 여기서 사용
  return <img src={product.imageUrl} alt={product.name} />;
}

function ProductInfo({ product }) {
  // 또 전달...
  return (
    <div>
      <ProductTitle product={product} />
      <ProductPrice product={product} />
      <ProductRating product={product} />
    </div>
  );
}

function ProductTitle({ product }) {
  return <h1>{product.name}</h1>;
}

function ProductPrice({ product }) {
  return <span>{product.price}원</span>;
}

function ProductRating({ product }) {
  return <span>⭐ {product.rating}</span>;
}

// ... 더 많은 중간 컴포넌트들
```

**prop drilling 지옥**입니다. `product` 객체가 6~7단계를 거쳐 내려가요.

### ✅ 데이터 기준: 평평한 구조

```jsx
function ProductDetailPage({ productId }) {
  const product = useProduct(productId);

  // 레이아웃은 HTML/CSS로, 데이터는 필요한 곳에 직접
  return (
    <div className="detail-card">
      <div className="header">
        {/* 데이터를 바로 분해해서 전달 */}
        <Breadcrumb
          items={[
            { label: '홈', href: '/' },
            { label: product.category, href: `/category/${product.categoryId}` },
            { label: product.name }
          ]}
        />

        <div className="main-info">
          <ProductImage src={product.imageUrl} alt={product.name} />

          <div className="info">
            <ProductTitle>{product.name}</ProductTitle>
            <ProductPrice amount={product.price} />
            <Rating score={product.rating} />
          </div>
        </div>
      </div>

      <div className="content">
        <ProductDescription text={product.description} />
        <ProductSpecs specs={product.specs} />
      </div>

      <div className="footer">
        <ProductActions
          productId={product.id}
          inStock={product.inStock}
          onAddToCart={handleAddToCart}
        />
        <ReviewList productId={product.id} />
      </div>
    </div>
  );
}

// 각 컴포넌트는 필요한 것만 받음
function ProductImage({ src, alt }) {
  return <img src={src} alt={alt} />;
}

function ProductTitle({ children }) {
  return <h1>{children}</h1>;
}

function ProductPrice({ amount }) {
  return <span className="price">{amount.toLocaleString()}원</span>;
}

function Rating({ score }) {
  return <span>⭐ {score}</span>;
}

function Breadcrumb({ items }) {
  return (
    <nav>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {item.href ? (
            <a href={item.href}>{item.label}</a>
          ) : (
            <span>{item.label}</span>
          )}
          {index < items.length - 1 && ' > '}
        </React.Fragment>
      ))}
    </nav>
  );
}
```

**차이가 명확하죠?**

- 중간에 prop을 전달만 하는 컴포넌트가 없음
- 각 컴포넌트는 정확히 필요한 데이터만 받음
- 레이아웃은 부모 컴포넌트에서 직접 관리

## "그럼 레이아웃 컴포넌트는 언제 만드나요?"

좋은 질문입니다! 레이아웃 컴포넌트가 필요한 경우도 있어요. 하지만 **데이터를 전달하지 않을 때**입니다.

### ✅ 좋은 레이아웃 컴포넌트

```jsx
// children을 받아서 레이아웃만 담당
function Card({ children }) {
  return (
    <div className="card shadow-lg rounded-lg p-4">
      {children}
    </div>
  );
}

function TwoColumnLayout({ left, right }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>{left}</div>
      <div>{right}</div>
    </div>
  );
}

// 사용
function ProfilePage({ user }) {
  return (
    <Card>
      <TwoColumnLayout
        left={<UserAvatar src={user.avatar} />}
        right={<UserInfo name={user.name} email={user.email} />}
      />
    </Card>
  );
}
```

**핵심**: 레이아웃 컴포넌트는 `children`이나 `left/right` 같은 **슬롯**을 받지, 비즈니스 데이터(`user`, `product` 등)를 받지 않습니다.

### ❌ 나쁜 레이아웃 컴포넌트

```jsx
// 데이터를 받아서 전달만 하는 컴포넌트
function Card({ user }) {
  return (
    <div className="card">
      <CardHeader user={user} />  {/* 데이터를 전달 */}
      <CardBody user={user} />    {/* 데이터를 전달 */}
    </div>
  );
}
```

## 시각적 비교

```text
❌ UI 기준 (Prop Drilling 발생):

ProfilePage {user}
    ↓ user 전체 전달
ProfileCard {user}
    ↓ user 전체 전달
ProfileHeader {user}
    ↓ user 전체 전달
ProfileImage {user}
    ↓ 드디어 user.avatar 사용

5단계를 거쳐 전달!


✅ 데이터 기준 (직접 전달):

ProfilePage {user}
    ↓ user.avatar만 전달
UserAvatar {src}
    ↓ 바로 사용!

1단계로 끝!
```

## "과도한 분리"가 아니라 "잘못된 분리"

여러분의 질문으로 돌아가볼게요:

> "자식 컴포넌트를 많이 만들어서 prop을 넘기는 과정이 과하다고 느껴지는데, 이게 과도한 분리인가요?"

아니요! **과도한 분리가 아니라 잘못된 기준으로 분리**한 것입니다.

```text
❌ 잘못된 분리:
- UI 요소별로 컴포넌트를 나눔
- 데이터를 사용하지 않는 중간 컴포넌트들이 생김
- Prop drilling 발생

✅ 올바른 분리:
- 데이터 책임별로 컴포넌트를 나눔
- 모든 컴포넌트가 자신의 데이터를 사용함
- Prop drilling 최소화
```

### 실제 비교

같은 기능, 같은 수의 컴포넌트를 만들어도:

```jsx
// ❌ UI 기준: 10개 컴포넌트, 5단계 drilling
<ProfileCard>
  <ProfileHeader>
    <ProfileImage />
    <ProfileInfo>
      <ProfileName />
      <ProfileEmail />
    </ProfileInfo>
  </ProfileHeader>
  <ProfileBody>
    <ProfileStats />
    <ProfilePosts />
  </ProfileBody>
</ProfileCard>

// ✅ 데이터 기준: 10개 컴포넌트, 1단계만
<div className="card">
  <div className="header">
    <UserAvatar src={user.avatar} />
    <UserName>{user.name}</UserName>
    <UserEmail>{user.email}</UserEmail>
  </div>
  <div className="body">
    <UserStats followers={user.followers} />
    <PostList posts={user.posts} />
  </div>
</div>
```

컴포넌트 개수는 비슷하지만, **prop drilling은 완전히 다릅니다**.

## 언제 Context API가 필요한가?

데이터 기준으로 설계하면 대부분의 prop drilling이 사라집니다. 그럼 Context API는 언제 쓸까요?

### Context가 필요한 경우

```jsx
// ✅ 진짜 전역 상태: 여러 컴포넌트 트리에서 필요
- 테마 (다크모드/라이트모드)
- 로그인 사용자 정보
- 언어 설정
- 앱 전체 설정

// ❌ Context가 필요 없는 경우
- 한 페이지 안에서만 쓰는 데이터
- 부모에서 자식으로 직접 전달 가능한 데이터
```

예제:

```jsx
// ✅ Context가 적절한 경우
function App() {
  return (
    <ThemeProvider>  {/* 앱 전체에서 사용 */}
      <UserProvider>  {/* 여러 페이지에서 사용 */}
        <Routes>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </UserProvider>
    </ThemeProvider>
  );
}

// ❌ Context가 불필요한 경우
function ProfilePage() {
  const user = useUser();

  // 이렇게 하지 마세요!
  return (
    <UserContext.Provider value={user}>
      <ProfileCard />
    </UserContext.Provider>
  );
}

// ✅ 이렇게 하세요!
function ProfilePage() {
  const user = useUser();

  return (
    <div>
      <UserAvatar src={user.avatar} />
      <UserInfo name={user.name} email={user.email} />
    </div>
  );
}
```

## 실전 가이드: 어떻게 판단할까?

컴포넌트를 만들 때 이 질문들을 해보세요:

### 체크리스트

```markdown
1. [ ] 이 컴포넌트가 다루는 **데이터**는 무엇인가?
   - ✅ UserProfile, ProductInfo, OrderSummary
   - ❌ Card, Container, Wrapper

2. [ ] 이 컴포넌트는 받은 데이터를 **직접 사용**하는가?
   - ✅ Yes: 좋은 컴포넌트!
   - ❌ No, 그냥 전달만: 불필요한 중간 컴포넌트

3. [ ] prop으로 받는 것이 **객체 전체**인가, **필요한 값만**인가?
   - ✅ 필요한 값만: {name, email}
   - ❌ 객체 전체: {user}

4. [ ] 이 컴포넌트를 제거해도 되는가?
   - Yes라면: 불필요한 컴포넌트일 가능성 높음
```

### 리팩토링 순서

기존 코드에서 prop drilling이 보인다면:

```jsx
// Step 1: 중간 컴포넌트들을 찾아라
// "이 컴포넌트가 받은 prop을 직접 사용하나?"

function ProfileCard({ user }) {
  return (
    <div>
      <ProfileHeader user={user} />  {/* user를 사용 안함 */}
    </div>
  );
}

// Step 2: 중간 컴포넌트를 제거하거나 레이아웃만 담당하게
function ProfileCard({ children }) {  // user 대신 children
  return <div className="card">{children}</div>;
}

// Step 3: 부모에서 데이터를 직접 분해해서 전달
function ProfilePage({ user }) {
  return (
    <ProfileCard>
      <UserAvatar src={user.avatar} />
      <UserInfo name={user.name} email={user.email} />
    </ProfileCard>
  );
}
```

## 디자인 시스템은 예외

처음 메시지에서 언급했듯이, **디자인 시스템 컴포넌트는 UI 기준이 맞습니다**:

```jsx
// ✅ 디자인 시스템: UI 기준
function Button({ variant, size, children }) {
  // Button은 비즈니스 데이터와 무관
}

function Card({ padding, shadow, children }) {
  // Card는 레이아웃 컴포넌트
}

function Modal({ isOpen, onClose, children }) {
  // Modal은 UI 패턴
}

// ✅ 비즈니스 컴포넌트: 데이터 기준
function Product({ name, price, imageUrl }) {
  // Product는 비즈니스 데이터
}

function UserProfile({ name, email, avatar }) {
  // UserProfile은 사용자 데이터
}
```

**구분 기준**:

- **디자인 시스템**: 재사용 가능한 UI 패턴 → UI 기준 ✅
- **비즈니스 로직**: 도메인 데이터를 다룸 → 데이터 기준 ✅

## TypeScript와 함께 사용하기

데이터 기준 설계는 TypeScript와 찰떡궁합입니다. 타입이 더욱 명확해지고, 실수를 방지할 수 있어요.

### ❌ UI 기준: 타입이 모호함

```typescript
// 무엇을 받는지 불명확
interface ProfileCardProps {
  user: User;  // User 전체? 어떤 필드를 사용하지?
}

function ProfileCard({ user }: ProfileCardProps) {
  return (
    <div>
      <ProfileHeader user={user} />  {/* user 전체를 전달 */}
    </div>
  );
}

// 나중에 User 타입이 바뀌면?
interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
  // 새로운 필드 추가
  phoneNumber: string;
  address: string;
  // ...더 많은 필드
}

// ProfileCard가 실제로 사용하는 필드가 무엇인지 알 수 없음
// 불필요한 의존성이 생김
```

### ✅ 데이터 기준: 타입이 명확함

```typescript
// 정확히 무엇이 필요한지 타입으로 표현
interface UserAvatarProps {
  src: string;
  alt: string;
}

interface UserInfoProps {
  name: string;
  email: string;
}

interface FollowerCountProps {
  count: number;
}

function UserAvatar({ src, alt }: UserAvatarProps) {
  return <img src={src} alt={alt} />;
}

function UserInfo({ name, email }: UserInfoProps) {
  return (
    <div>
      <h2>{name}</h2>
      <p>{email}</p>
    </div>
  );
}

function FollowerCount({ count }: FollowerCountProps) {
  return <span>{count} followers</span>;
}

// 부모 컴포넌트
function ProfilePage({ user }: { user: User }) {
  return (
    <div>
      {/* 타입 체크가 각 prop마다 정확하게 이루어짐 */}
      <UserAvatar src={user.avatar} alt={user.name} />
      <UserInfo name={user.name} email={user.email} />
      <FollowerCount count={user.followers} />
    </div>
  );
}

// User 타입이 바뀌어도 영향 받는 컴포넌트만 수정하면 됨
```

### 장점: 타입 안정성

```typescript
// ✅ 컴파일 타임에 에러 발견
<UserAvatar
  src={user.avatar}
  alt={user.name}
  // 불필요한 prop을 전달하면 에러
  email={user.email}  // ❌ Type Error!
/>

// ✅ 필수 prop 누락 시 에러
<UserInfo
  name={user.name}
  // email을 빼먹으면 에러
  // ❌ Property 'email' is missing
/>

// ✅ IDE 자동완성이 정확해짐
<UserAvatar
  src={user.}  // avatar, name만 자동완성에 표시됨
```

### 실전 패턴: Pick 유틸리티 타입

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
  followers: number;
  posts: Post[];
  createdAt: Date;
  updatedAt: Date;
}

// 필요한 필드만 선택
type UserAvatarProps = Pick<User, 'avatar' | 'name'>;
type UserInfoProps = Pick<User, 'name' | 'email'>;
type FollowerCountProps = Pick<User, 'followers'>;

function UserAvatar({ avatar, name }: UserAvatarProps) {
  return <img src={avatar} alt={name} />;
}

function UserInfo({ name, email }: UserInfoProps) {
  return (
    <div>
      <h2>{name}</h2>
      <p>{email}</p>
    </div>
  );
}
```

## 성능 관점: 불필요한 리렌더링 방지

데이터 기준 설계는 성능 최적화에도 유리합니다.

### 문제: UI 기준 설계의 리렌더링

```jsx
// ❌ UI 기준: user가 바뀌면 전체가 리렌더링
function ProfileCard({ user }) {
  console.log('ProfileCard 렌더링');

  return (
    <div>
      <ProfileHeader user={user} />  {/* user.avatar만 바뀌어도 */}
      <ProfileBody user={user} />     {/* 모두 리렌더링 */}
    </div>
  );
}

function ProfileHeader({ user }) {
  console.log('ProfileHeader 렌더링');
  return (
    <div>
      <ProfileImage user={user} />
      <ProfileInfo user={user} />
    </div>
  );
}

// user.followers만 바뀌었는데...
// ProfileCard → ProfileHeader → ProfileImage 모두 리렌더링!
```

### 해결: 데이터 기준 설계 + React.memo

```jsx
// ✅ 필요한 데이터만 받으면 최적화가 쉬움
const UserAvatar = React.memo(({ src, alt }) => {
  console.log('UserAvatar 렌더링');
  return <img src={src} alt={alt} />;
});

const UserInfo = React.memo(({ name, email }) => {
  console.log('UserInfo 렌더링');
  return (
    <div>
      <h2>{name}</h2>
      <p>{email}</p>
    </div>
  );
});

const FollowerCount = React.memo(({ count }) => {
  console.log('FollowerCount 렌더링');
  return <span>{count} followers</span>;
});

function ProfilePage({ user }) {
  return (
    <div>
      <UserAvatar src={user.avatar} alt={user.name} />
      <UserInfo name={user.name} email={user.email} />
      <FollowerCount count={user.followers} />
    </div>
  );
}

// user.followers만 바뀌면?
// FollowerCount만 리렌더링! 👍
```

### 리렌더링 비교

```text
❌ UI 기준 (user 전체를 전달):

user.followers 변경
    ↓
ProfileCard 리렌더링 (user 객체 참조 변경)
    ↓
ProfileHeader 리렌더링 (user 객체 전달)
    ↓
ProfileImage 리렌더링 (필요 없는데!)
    ↓
ProfileInfo 리렌더링 (필요 없는데!)


✅ 데이터 기준 (필요한 값만 전달):

user.followers 변경
    ↓
ProfilePage 리렌더링
    ↓
FollowerCount만 리렌더링! ✨
(UserAvatar, UserInfo는 리렌더링 안함)
```

### 왜 이런 차이가 생길까?

```jsx
// React.memo는 prop을 얕은 비교(shallow comparison)함

// ❌ UI 기준
<ProfileCard user={user} />
// user 객체 참조가 바뀌면 무조건 리렌더링

// ✅ 데이터 기준
<UserAvatar src={user.avatar} alt={user.name} />
// avatar와 name이 같으면 리렌더링 안함!

// 예시
const user1 = { avatar: 'a.jpg', name: 'Hong', followers: 100 };
const user2 = { avatar: 'a.jpg', name: 'Hong', followers: 101 };

// user1 !== user2 (객체 참조 다름)
// 하지만 user1.avatar === user2.avatar (값 같음)
// 하지만 user1.name === user2.name (값 같음)
```

## 테스트 용이성

데이터 기준으로 설계된 컴포넌트는 테스트하기 훨씬 쉽습니다.

### ❌ UI 기준: 테스트가 복잡함

```jsx
// 테스트하려면 전체 User 객체를 만들어야 함
describe('ProfileCard', () => {
  it('should render user avatar', () => {
    const user = {
      id: 1,
      name: 'Hong',
      email: 'hong@example.com',
      avatar: 'avatar.jpg',
      followers: 100,
      posts: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      // ...더 많은 필드
    };

    render(<ProfileCard user={user} />);
    expect(screen.getByAltText('Hong')).toBeInTheDocument();
  });
});

// ProfileCard가 실제로 avatar와 name만 사용하는데,
// 테스트를 위해 전체 User 객체를 만들어야 함 😰
```

### ✅ 데이터 기준: 테스트가 간단함

```jsx
// 필요한 prop만 전달하면 됨
describe('UserAvatar', () => {
  it('should render image with correct src and alt', () => {
    render(
      <UserAvatar
        src="avatar.jpg"
        alt="Hong"
      />
    );

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'avatar.jpg');
    expect(img).toHaveAttribute('alt', 'Hong');
  });

  it('should render with default avatar when src is empty', () => {
    render(
      <UserAvatar
        src=""
        alt="Hong"
      />
    );

    // 간단하고 명확한 테스트
  });
});

// 관련 없는 데이터를 준비할 필요 없음! 👍
```

### 테스트의 초점이 명확해짐

```jsx
// ❌ UI 기준: 무엇을 테스트하는지 불명확
describe('ProfileHeader', () => {
  it('should render correctly', () => {
    const user = createMockUser();  // 거대한 mock 객체
    render(<ProfileHeader user={user} />);

    // 이 컴포넌트가 user의 어떤 부분을 사용하는지 알 수 없음
    // 테스트에서도 불명확
  });
});

// ✅ 데이터 기준: 무엇을 테스트하는지 명확
describe('UserInfo', () => {
  it('should display user name and email', () => {
    render(
      <UserInfo
        name="Hong Gil-dong"
        email="hong@example.com"
      />
    );

    expect(screen.getByText('Hong Gil-dong')).toBeInTheDocument();
    expect(screen.getByText('hong@example.com')).toBeInTheDocument();
  });

  it('should handle long email addresses', () => {
    render(
      <UserInfo
        name="Hong"
        email="very.long.email.address@example.com"
      />
    );

    // 특정 케이스만 집중해서 테스트 가능
  });
});
```

### Mock 데이터가 간단해짐

```jsx
// ❌ UI 기준: 복잡한 mock 팩토리 필요
function createMockUser(overrides = {}) {
  return {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    avatar: 'avatar.jpg',
    followers: 100,
    posts: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ✅ 데이터 기준: 필요한 값만 인라인으로
test('UserAvatar renders correctly', () => {
  render(<UserAvatar src="test.jpg" alt="Test" />);
  // 간단하고 명확!
});
```

## 실무 마이그레이션 전략

기존 프로젝트를 어떻게 점진적으로 개선할 수 있을까요?

### 1단계: 문제 식별

```jsx
// 현재 코드에서 prop drilling 패턴 찾기
// 🔍 체크 포인트:
// - prop을 받지만 사용하지 않고 전달만 하는 컴포넌트
// - 3단계 이상 prop이 내려가는 경로
// - 객체 전체를 전달하는 컴포넌트

// 예시:
function PageLayout({ data }) {
  return (
    <Container data={data}>  {/* 🚨 data를 사용 안함 */}
      <Content data={data} />
    </Container>
  );
}
```

### 2단계: Leaf 컴포넌트부터 리팩토링

**중요**: 하위(leaf) 컴포넌트부터 시작하세요. 상위 컴포넌트부터 바꾸면 더 복잡해집니다.

```jsx
// ❌ 이렇게 하지 마세요
// 상위부터 바꾸면 하위 컴포넌트를 다 고쳐야 함
function PageLayout({ children }) { // 너무 급진적
  return <div>{children}</div>;
}

// ✅ 이렇게 하세요
// Step 1: 가장 아래 컴포넌트부터
// Before
function UserName({ user }) {
  return <h2>{user.name}</h2>;
}

// After
function UserName({ name }) {
  return <h2>{name}</h2>;
}

// Step 2: 그 위 컴포넌트
// Before
function UserCard({ user }) {
  return (
    <div>
      <UserName user={user} />
    </div>
  );
}

// After
function UserCard({ user }) {
  return (
    <div>
      <UserName name={user.name} />  {/* 여기만 수정 */}
    </div>
  );
}

// Step 3: 점진적으로 위로 올라가기
```

### 3단계: 새로운 기능은 데이터 기준으로

기존 코드를 모두 고치려고 하지 마세요. 새로운 기능부터 적용하면 됩니다.

```jsx
// 기존 코드 (건드리지 않음)
function LegacyUserProfile({ user }) {
  return (
    <LegacyCard user={user}>
      <LegacyHeader user={user} />
    </LegacyCard>
  );
}

// 새로운 기능 (데이터 기준으로)
function NewUserSettings({ user }) {
  return (
    <div>
      <SettingsHeader title={user.name} />
      <EmailSettings email={user.email} />
      <NotificationSettings userId={user.id} />
    </div>
  );
}
```

### 4단계: 공통 컴포넌트 리팩토링

팀 전체가 사용하는 컴포넌트를 개선할 때는 신중하게:

```jsx
// 1. 새로운 버전을 만들어서 병행 사용
// components/UserAvatar.jsx (기존)
export function UserAvatar({ user }) {
  return <img src={user.avatar} alt={user.name} />;
}

// components/UserAvatar2.jsx (신규)
export function UserAvatar2({ src, alt }) {
  return <img src={src} alt={alt} />;
}

// 2. 점진적으로 마이그레이션
// - 새 코드는 UserAvatar2 사용
// - 기존 코드는 그대로 UserAvatar 사용

// 3. 모두 마이그레이션 완료 후 UserAvatar를 교체
export function UserAvatar({ src, alt }) {
  return <img src={src} alt={alt} />;
}
```

### 5단계: 팀 컨벤션 정립

```markdown
## 컴포넌트 작성 가이드

### DO ✅
- [ ] 컴포넌트 이름은 데이터 기준 (UserProfile, ProductCard)
- [ ] prop은 필요한 원시값만 받기 (name, price)
- [ ] 레이아웃 컴포넌트는 children 사용

### DON'T ❌
- [ ] UI 기준 이름 금지 (Card, Header, Container)
- [ ] 객체 전체 전달 금지 (user={user})
- [ ] 사용하지 않는 prop 전달 금지

### 예외
- 디자인 시스템 컴포넌트는 UI 기준 OK
```

### 실전 예시: 단계별 마이그레이션

```jsx
// 현재 상태 (변경 전)
function DashboardPage() {
  const data = useDashboard();
  return <Dashboard data={data} />;
}

function Dashboard({ data }) {
  return (
    <Layout data={data}>
      <Header data={data} />
      <Content data={data} />
    </Layout>
  );
}

// Week 1: Leaf 컴포넌트부터
function UserGreeting({ userName }) {  // data.user.name → userName
  return <h1>안녕하세요, {userName}님</h1>;
}

// Week 2: 중간 레벨
function Header({ userName, notificationCount }) {
  return (
    <header>
      <UserGreeting userName={userName} />
      <NotificationBadge count={notificationCount} />
    </header>
  );
}

// Week 3: 상위 레벨
function Dashboard({ data }) {
  return (
    <Layout>  {/* children 방식으로 변경 */}
      <Header
        userName={data.user.name}
        notificationCount={data.notifications.length}
      />
      <Content
        stats={data.stats}
        recentActivity={data.recentActivity}
      />
    </Layout>
  );
}

// 최종: 깔끔한 구조
function DashboardPage() {
  const data = useDashboard();
  return (
    <Layout>
      <Header
        userName={data.user.name}
        notificationCount={data.notifications.length}
      />
      <StatsCards stats={data.stats} />
      <ActivityFeed items={data.recentActivity} />
    </Layout>
  );
}
```

### 마이그레이션 체크리스트

```markdown
- [ ] 현재 prop drilling 패턴 문서화
- [ ] 가장 문제되는 3개 경로 선정
- [ ] Leaf 컴포넌트부터 리팩토링 시작
- [ ] 각 단계마다 테스트 작성/수정
- [ ] 팀원과 패턴 공유
- [ ] 새 기능은 무조건 데이터 기준으로
- [ ] 분기별로 진행상황 리뷰
```

## 정리

### 핵심 인사이트

```text
Prop drilling이 생긴다
    ↓
"Context를 써야 하나?" (❌ 잘못된 질문)
    ↓
"왜 prop drilling이 생겼지?" (✅ 올바른 질문)
    ↓
"UI 기준으로 나눴구나"
    ↓
"데이터 기준으로 다시 설계"
    ↓
Prop drilling 자연스럽게 해결!
```

### 행동 지침

1. **디자인을 보기 전에 데이터 구조부터 파악**하세요
2. **컴포넌트가 받은 데이터를 직접 사용**하는지 확인하세요
3. **객체 전체가 아닌 필요한 값만** prop으로 전달하세요
4. **레이아웃 컴포넌트는 children**을 받게 하세요
5. **3단계 이상 prop drilling이 보이면** 설계를 재검토하세요

### 마지막 조언

다음에 "prop drilling이 너무 심한데?"라고 느껴지면, Context API를 찾기 전에 먼저 이렇게 물어보세요:

> "이 중간 컴포넌트들이 정말 필요한가?"
> "UI가 아니라 데이터 기준으로 나눴나?"
> "각 컴포넌트가 받은 데이터를 직접 사용하나?"

대부분의 경우, 답은 설계를 바꾸는 것입니다. Context가 아니라요.

경험해보셨나요? 코드를 리팩토링하다가 "아, 이 컴포넌트는 사실 필요 없었구나"라고 깨닫는 순간을요. 그 순간이 바로 더 나은 설계로 가는 길입니다.

## 참고 자료

- [Thinking in React](https://react.dev/learn/thinking-in-react) - React 공식 문서의 컴포넌트 설계 철학
- [Passing Data Deeply with Context](https://react.dev/learn/passing-data-deeply-with-context) - Context가 정말 필요한 경우
- [Component Composition](https://react.dev/learn/passing-props-to-a-component#passing-jsx-as-children) - children을 활용한 컴포지션

{% endraw %}
