---
date: 2025-10-13
title: Configuration over Composition Pattern
render_with_liquid: false
layout: page
---
{% raw %}
# Configuration over Composition Pattern

Header 컴포넌트를 만들 때 이런 고민을 해본 적 있나요?

"다양한 페이지에서 사용할 수 있도록 유연하게 만들어야 하는데, 어디까지 자유도를 줘야 할까?"

저도 처음 컴포넌트 라이브러리를 설계할 때 이 문제로 한참을 고민했습니다. 처음에는 "최대한 유연하게!"라는 생각으로 모든 것을 조합 가능하게 만들었습니다. 그런데 실제로 팀에서 사용하다 보니 문제가 생겼습니다.

```tsx
// 6개월 후 프로젝트에서 발견된 실제 코드
<Header>
  <Header.Brand>
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <img src="logo.png" />
      <h1>App Name</h1>
    </div>
  </Header.Brand>
  <div className="weird-spacing">
    <Header.Nav>
      <Header.Link>Home</Header.Link>
      {/* ... */}
    </Header.Nav>
  </div>
  <Header.Actions>
    <button className="custom-btn-1">Login</button>
  </Header.Actions>
</Header>

// 다른 곳에서는...
<Header>
  <div className="container">
    <Header.Brand logo="logo.png" />
    <Header.Nav items={navItems} />
  </div>
</Header>
```

동일한 컴포넌트인데 사용법이 완전히 달랐고, 디자인 시스템의 일관성은 사라졌습니다. 게다가 새로 합류한 개발자들은 "대체 이걸 어떻게 써야 하나요?"라고 물었습니다.

그때 깨달았습니다. **유연성이 항상 정답은 아니라는 것을.**

## 왜 이 패턴을 이해해야 할까요?

컴포넌트를 설계할 때 우리는 항상 두 가지 목표 사이에서 균형을 맞춰야 합니다:

1. **일관성**: 모든 곳에서 동일한 룩앤필 유지
2. **유연성**: 다양한 사용 사례 지원

Configuration over Composition 패턴은 **"일관성이 더 중요한 상황"**에서 빛을 발합니다. 이 패턴을 이해하면:

- 디자인 시스템 컴포넌트를 올바르게 설계할 수 있습니다
- API 설계의 트레이드오프를 이해하게 됩니다
- 언제 어떤 패턴을 써야 하는지 판단할 수 있습니다

## 두 패턴의 핵심 차이

먼저 두 패턴을 간단히 비교해보겠습니다:

| 관점 | Configuration | Composition |
|------|---------------|-------------|
| **제어 방식** | Props로 설정 | 컴포넌트 조합 |
| **누가 결정하나** | 컴포넌트 내부 | 사용하는 쪽 |
| **유연성** | ⭐⭐ 제한적 | ⭐⭐⭐⭐⭐ 높음 |
| **일관성** | ⭐⭐⭐⭐⭐ 높음 | ⭐⭐ 낮음 |
| **학습 곡선** | ⭐ 낮음 | ⭐⭐⭐ 높음 |
| **타입 안전성** | ⭐⭐⭐⭐⭐ 높음 | ⭐⭐⭐ 중간 |
| **사용 복잡도** | ⭐ 낮음 | ⭐⭐⭐ 높음 |
| **확장성** | ⭐⭐ Props 추가 필요 | ⭐⭐⭐⭐ 자연스러움 |
| **잘못된 사용** | ❌ 거의 불가능 | ⚠️ 가능 |

핵심 차이를 코드로 보면 더 명확합니다:

```tsx
// Configuration: "설정으로 알려주세요"
<Button
  variant="primary"    // 이렇게 보이게 해주세요
  size="large"         // 이 크기로 해주세요
  disabled={false}     // 활성화해주세요
>
  Click me
</Button>

// Composition: "이렇게 조합해서 만들 거예요"
<Button>
  <Button.Icon position="left">
    <SaveIcon />
  </Button.Icon>
  <Button.Text>Click me</Button.Text>
  <Button.Badge>New</Button.Badge>
</Button>
```

## 실제 경험으로 배우는 패턴 선택

### 경험 1: 회사 디자인 시스템 구축

제가 근무했던 회사에서 디자인 시스템을 구축할 때의 이야기입니다.

**초기 접근 (Composition)**
```tsx
// 최대한 유연하게 만들자!
<Card>
  <Card.Header>
    <Card.Title>제목</Card.Title>
    <Card.Subtitle>부제목</Card.Subtitle>
  </Card.Header>
  <Card.Body>
    <Card.Image src="..." />
    <Card.Text>내용</Card.Text>
  </Card.Body>
  <Card.Footer>
    <Card.Actions>
      <Button>확인</Button>
    </Card.Actions>
  </Card.Footer>
</Card>
```

**3개월 후 실제 코드들**
```tsx
// 개발자 A
<Card>
  <Card.Body>
    <Card.Title>제목</Card.Title>  // 헤더가 아닌 바디에
    <Card.Image src="..." />
  </Card.Body>
</Card>

// 개발자 B
<Card>
  <div className="my-custom-header">  // 커스텀 div 사용
    <h2>제목</h2>
  </div>
  <Card.Body>...</Card.Body>
</Card>

// 개발자 C
<Card>
  <Card.Image src="..." />  // 헤더/바디 구분 없이
  <Card.Title>제목</Card.Title>
</Card>
```

결과: **일관성 붕괴, 유지보수 악몽**

**개선 후 (Configuration)**
```tsx
// 명확한 설정 방식
<Card
  variant="product"
  image={{ src: "...", aspectRatio: "16:9" }}
  title="제목"
  subtitle="부제목"
  actions={[
    { label: "확인", onClick: handleConfirm, variant: "primary" }
  ]}
>
  내용
</Card>
```

결과: **통일된 구조, 명확한 사용법, 쉬운 유지보수**

### 경험 2: 네비게이션 컴포넌트의 진화

**1단계: 과도한 자유도 (Composition)**
```tsx
<Navigation>
  <Navigation.Brand>
    <img src="logo.png" />
    <span>MyApp</span>
  </Navigation.Brand>
  <Navigation.Menu>
    <Navigation.Item href="/">Home</Navigation.Item>
    <Navigation.Item href="/about">About</Navigation.Item>
  </Navigation.Menu>
  <Navigation.Actions>
    <button>Login</button>
  </Navigation.Actions>
</Navigation>
```

**문제점:**
- 모바일 반응형 처리를 각자 구현
- 브랜드 영역 스타일이 페이지마다 다름
- 액티브 상태 표시 방법이 제각각

**2단계: 설정 중심으로 전환 (Configuration)**
```tsx
<Navigation
  variant="main"  // 'main' | 'sub' | 'mobile'
  brand={{
    text: "MyApp",
    logo: "/logo.png",
    href: "/"
  }}
  menuItems={[
    { label: "Home", href: "/", active: true },
    { label: "About", href: "/about" }
  ]}
  actions={{
    primary: { label: "Sign up", onClick: handleSignup },
    secondary: { label: "Login", onClick: handleLogin }
  }}
  mobileMenu={{
    isOpen: isMobileMenuOpen,
    onToggle: toggleMobileMenu
  }}
/>
```

**개선 효과:**
- ✅ 반응형이 내장되어 일관성 보장
- ✅ 모든 페이지에서 동일한 네비게이션 구조
- ✅ 타입스크립트로 잘못된 사용 방지
- ✅ 새 개발자가 5분 만에 이해

## 언제 어느 패턴을 선택해야 할까?

### 의사결정 플로우차트

```
시작: 새 컴포넌트를 만들어야 한다
  ↓
질문 1: 이 컴포넌트가 디자인 시스템의 일부인가?
  ├─ YES → Configuration 강력 추천 ⭐⭐⭐⭐⭐
  └─ NO → 다음 질문으로
          ↓
질문 2: 사용 패턴이 명확하게 정의되어 있는가?
  ├─ YES → 다음 질문으로
  └─ NO → Composition 고려 (유연성 필요)
          ↓
질문 3: 3~5가지 이하의 변형만 존재하는가?
  ├─ YES → Configuration 추천 ⭐⭐⭐⭐
  └─ NO → 다음 질문으로
          ↓
질문 4: 잘못된 사용이 큰 문제를 일으키는가?
  ├─ YES → Configuration 강력 추천 ⭐⭐⭐⭐⭐
  └─ NO → 다음 질문으로
          ↓
질문 5: 사용자가 내부 구조를 변경해야 하는가?
  ├─ YES → Composition 추천 ⭐⭐⭐⭐
  └─ NO → Configuration 추천 ⭐⭐⭐
          ↓
결론: 하이브리드 접근 고려
     (기본은 Configuration, 확장은 Composition)
```

### 실전 선택 가이드

#### Configuration을 선택하세요 ✅

**1. 디자인 시스템의 기본 컴포넌트**
```tsx
// Button, Input, Select, Checkbox 등
<Button variant="primary" size="md" disabled={false}>
  Click me
</Button>

// 이유: 일관된 룩앤필이 가장 중요
```

**2. 명확한 변형이 있는 컴포넌트**
```tsx
// Alert: success, error, warning, info
<Alert
  type="error"
  title="오류 발생"
  dismissible={true}
>
  잘못된 입력입니다.
</Alert>

// 이유: 제한된 옵션으로 일관성 유지
```

**3. 레이아웃 컴포넌트**
```tsx
// Header, Footer, Sidebar
<Header
  variant="fixed"  // fixed, sticky, static
  showShadow={true}
  transparent={false}
/>

// 이유: 구조적 일관성이 중요
```

**4. 폼 컴포넌트**
```tsx
<FormField
  type="text"
  label="이름"
  error="필수 입력 항목입니다"
  required={true}
  disabled={false}
/>

// 이유: 접근성과 검증 로직 일관성
```

#### Composition을 선택하세요 ✅

**1. 복잡한 데이터 표시 컴포넌트**
```tsx
// 수십 가지 조합이 필요한 경우
<DataTable>
  <DataTable.Header>
    <DataTable.Column sortable>Name</DataTable.Column>
    <DataTable.Column>Email</DataTable.Column>
  </DataTable.Header>
  <DataTable.Body>
    {/* 동적 데이터 */}
  </DataTable.Body>
</DataTable>

// 이유: props로 모든 경우를 커버하기 불가능
```

**2. 사용자 정의가 핵심인 컴포넌트**
```tsx
// 대시보드, 드래그앤드롭 빌더 등
<Dashboard>
  <Widget position="top-left" size="large">
    <Chart />
  </Widget>
  <Widget position="top-right" size="small">
    <Stats />
  </Widget>
</Dashboard>

// 이유: 사용자가 구조를 완전히 제어해야 함
```

**3. 에디터나 툴바 컴포넌트**
```tsx
<RichTextEditor>
  <Toolbar>
    <Toolbar.Group>
      <BoldButton />
      <ItalicButton />
    </Toolbar.Group>
    <Toolbar.Group>
      <LinkButton />
      <ImageButton />
    </Toolbar.Group>
  </Toolbar>
  <EditorContent />
</RichTextEditor>

// 이유: 매우 다양한 조합 필요
```

## 풍부한 Before/After 예제

### 예제 1: Modal 컴포넌트

**❌ Composition으로 시작 (문제 발생)**
```tsx
// 사용법이 너무 복잡하고 일관성 없음
function ProductModal() {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header>
        <Modal.Title>상품 상세</Modal.Title>
        <Modal.CloseButton onClick={onClose} />
      </Modal.Header>
      <Modal.Body>
        <div className="product-content">
          {/* 내용 */}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Modal.Actions>
          <Button variant="secondary" onClick={onClose}>취소</Button>
          <Button variant="primary" onClick={handleConfirm}>확인</Button>
        </Modal.Actions>
      </Modal.Footer>
    </Modal>
  );
}

// 문제점:
// 1. CloseButton을 깜빡 잊음
// 2. Footer 버튼 순서가 페이지마다 다름
// 3. Modal.Actions를 써야 하는지 몰라서 그냥 div 사용
```

**✅ Configuration으로 개선**
```tsx
function ProductModal() {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="상품 상세"
      size="lg"  // sm, md, lg, xl
      closeOnOverlay={true}
      actions={[
        { label: "취소", onClick: onClose, variant: "secondary" },
        { label: "확인", onClick: handleConfirm, variant: "primary" }
      ]}
    >
      <div className="product-content">
        {/* 내용만 집중 */}
      </div>
    </Modal>
  );
}

// 개선 효과:
// ✅ CloseButton 자동 추가
// ✅ 버튼 순서 일관성 보장
// ✅ 사용법이 명확하고 단순
// ✅ 타입스크립트로 오타 방지
```

### 예제 2: Form Field 컴포넌트

**❌ 자유로운 구조 (접근성 문제)**
```tsx
// 각자 다른 방식으로 구현
function LoginForm() {
  return (
    <form>
      {/* 개발자 A의 방식 */}
      <div>
        <label>이메일</label>
        <input type="email" />
        {error && <span className="error">{error}</span>}
      </div>

      {/* 개발자 B의 방식 */}
      <div className="form-group">
        <input type="password" placeholder="비밀번호" />
        <label>비밀번호</label>  {/* 순서 바뀜 */}
      </div>
    </form>
  );
}

// 문제점:
// 1. label-input 연결이 제각각 (접근성 문제)
// 2. 에러 표시 방식이 다름
// 3. required, disabled 처리가 일관성 없음
```

**✅ Configuration으로 표준화**
```tsx
function LoginForm() {
  return (
    <form>
      <FormField
        name="email"
        type="email"
        label="이메일"
        required={true}
        error={errors.email}
        helpText="로그인에 사용할 이메일을 입력하세요"
      />

      <FormField
        name="password"
        type="password"
        label="비밀번호"
        required={true}
        error={errors.password}
        autoComplete="current-password"
      />
    </form>
  );
}

// 개선 효과:
// ✅ label-input 자동 연결 (htmlFor, id)
// ✅ 에러 메시지 위치와 스타일 통일
// ✅ required, disabled 스타일 자동 적용
// ✅ 접근성 속성 자동 추가 (aria-invalid, aria-describedby)
```

### 예제 3: Card 컴포넌트 - 실무 진화 과정

**1단계: 순수 Composition (초기)**
```tsx
<Card>
  <Card.Image src="/product.jpg" alt="상품" />
  <Card.Body>
    <Card.Title>상품명</Card.Title>
    <Card.Description>설명</Card.Description>
    <Card.Price>29,900원</Card.Price>
  </Card.Body>
  <Card.Footer>
    <Button>장바구니</Button>
  </Card.Footer>
</Card>

// 6개월 후...
<Card>
  {/* 순서가 제각각 */}
  <Card.Body>
    <Card.Title>상품명</Card.Title>
    <Card.Image src="/product.jpg" />  {/* Body 안에 이미지 */}
  </Card.Body>
  <div className="custom-footer">  {/* Card.Footer 대신 div */}
    <button>구매</button>
  </div>
</Card>
```

**2단계: Configuration 도입**
```tsx
<Card
  variant="product"
  image={{
    src: "/product.jpg",
    alt: "상품",
    aspectRatio: "1:1"  // 일관된 비율
  }}
  title="상품명"
  description="설명"
  price={29900}
  badge={{ text: "NEW", variant: "primary" }}
  actions={[
    { label: "장바구니", onClick: addToCart, variant: "secondary" },
    { label: "구매", onClick: purchase, variant: "primary" }
  ]}
/>

// 개선 효과:
// ✅ 모든 상품 카드가 동일한 구조
// ✅ 반응형 대응이 내장됨
// ✅ 가격 포맷팅 자동 처리
// ✅ 뱃지 위치 일관성
```

**3단계: 하이브리드 (유연성 추가)**
```tsx
// 기본 사용 (90% 케이스)
<Card
  variant="product"
  image={{ src: "/product.jpg" }}
  title="상품명"
  price={29900}
/>

// 특별한 케이스 (10%)
<Card
  variant="custom"
  image={{ src: "/product.jpg" }}
>
  {/* children으로 커스텀 콘텐츠 */}
  <Card.Body>
    <SpecialBadge />
    <Card.Title>한정판 상품</Card.Title>
    <CountdownTimer endTime={endTime} />
    <Card.Price
      original={99000}
      discounted={29900}
      showDiscount
    />
  </Card.Body>
  <Card.Footer>
    <SpecialButton />
  </Card.Footer>
</Card>

// 최종 형태:
// ✅ 일반적인 경우는 Configuration으로 간단히
// ✅ 특별한 경우는 Composition으로 유연하게
// ✅ 서브 컴포넌트(Card.Body 등)는 내부 구조를 알고 있어 일관성 유지
```

### 예제 4: Tabs 컴포넌트

**❌ 상태 관리 불일치**
```tsx
// Composition: 각자 상태 관리
function ProductTabs() {
  const [activeTab, setActiveTab] = useState('description');

  return (
    <Tabs>
      <Tabs.List>
        <Tabs.Tab
          active={activeTab === 'description'}
          onClick={() => setActiveTab('description')}
        >
          상세설명
        </Tabs.Tab>
        <Tabs.Tab
          active={activeTab === 'reviews'}
          onClick={() => setActiveTab('reviews')}
        >
          리뷰
        </Tabs.Tab>
      </Tabs.List>
      <Tabs.Panels>
        {activeTab === 'description' && (
          <Tabs.Panel>상세설명 내용</Tabs.Panel>
        )}
        {activeTab === 'reviews' && (
          <Tabs.Panel>리뷰 내용</Tabs.Panel>
        )}
      </Tabs.Panels>
    </Tabs>
  );
}

// 문제점:
// 1. 상태 관리를 각자 구현
// 2. active 체크 로직 중복
// 3. 패널 조건부 렌더링을 수동으로
// 4. 접근성 속성(role, aria-*)을 각자 추가
```

**✅ Configuration으로 단순화**
```tsx
function ProductTabs() {
  return (
    <Tabs
      defaultTab="description"
      tabs={[
        {
          id: 'description',
          label: '상세설명',
          content: <ProductDescription />
        },
        {
          id: 'reviews',
          label: '리뷰',
          badge: reviewCount,
          content: <ProductReviews />
        },
        {
          id: 'qna',
          label: 'Q&A',
          content: <ProductQnA />
        }
      ]}
      onChange={(tabId) => {
        // 선택적 콜백
        analytics.track('tab_changed', { tabId });
      }}
    />
  );
}

// 개선 효과:
// ✅ 상태 관리 내장
// ✅ 접근성 자동 처리 (키보드 네비게이션 포함)
// ✅ 뱃지, 아이콘 같은 표준 기능 통합
// ✅ 애니메이션 일관성
```

### 예제 5: Toast/Notification 시스템

**❌ 위치와 스타일 불일치**
```tsx
// 각 페이지마다 다른 구현
function PageA() {
  return (
    <>
      <Toast position="top-right">
        <Toast.Icon type="success" />
        <Toast.Title>성공</Toast.Title>
        <Toast.Message>저장되었습니다</Toast.Message>
      </Toast>
    </>
  );
}

function PageB() {
  return (
    <>
      {/* 구조가 다름 */}
      <Toast position="bottom-center">
        <div className="toast-content">
          <span>✓ 완료</span>
        </div>
      </Toast>
    </>
  );
}

// 문제점:
// 1. 위치가 페이지마다 다름
// 2. 아이콘 표시 방식 불일치
// 3. 자동 닫힘 동작이 제각각
// 4. 여러 토스트 쌓이는 방식이 다름
```

**✅ Configuration + API 패턴**
```tsx
// toast.ts - 중앙 관리
import { toast } from '@/lib/toast';

// 사용법
function handleSave() {
  try {
    await saveData();

    toast.success({
      title: '저장 완료',
      message: '데이터가 저장되었습니다',
      duration: 3000,
      action: {
        label: '실행 취소',
        onClick: handleUndo
      }
    });
  } catch (error) {
    toast.error({
      title: '저장 실패',
      message: error.message,
      duration: 5000
    });
  }
}

// 다양한 타입을 메서드로 제공
toast.info({ message: '처리 중입니다...' });
toast.warning({ message: '주의가 필요합니다' });
toast.promise(asyncOperation(), {
  loading: '처리 중...',
  success: '완료!',
  error: '실패했습니다'
});

// 개선 효과:
// ✅ 앱 전체에서 동일한 위치와 스타일
// ✅ 타입별 일관된 아이콘과 색상
// ✅ 자동 닫힘, 쌓임 로직 통일
// ✅ Promise 상태 자동 추적
```

### 예제 6: Select/Dropdown 컴포넌트

**❌ 접근성과 UX 불일치**
```tsx
// Composition: 세부 제어
function UserFilter() {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  return (
    <Select>
      <Select.Trigger onClick={() => setIsOpen(!isOpen)}>
        {selected?.label || '선택하세요'}
      </Select.Trigger>
      {isOpen && (
        <Select.Dropdown>
          {options.map(option => (
            <Select.Option
              key={option.value}
              onClick={() => {
                setSelected(option);
                setIsOpen(false);
              }}
            >
              {option.label}
            </Select.Option>
          ))}
        </Select.Dropdown>
      )}
    </Select>
  );
}

// 문제점:
// 1. 열림/닫힘 상태를 각자 관리
// 2. ESC로 닫기, 외부 클릭 감지 누락
// 3. 키보드 네비게이션 미구현
// 4. 검색 기능 있는 곳/없는 곳 제각각
```

**✅ Configuration으로 표준화**
```tsx
function UserFilter() {
  return (
    <Select
      placeholder="사용자 선택"
      options={[
        { value: 'all', label: '전체', icon: <AllIcon /> },
        { value: 'active', label: '활성', icon: <CheckIcon /> },
        { value: 'inactive', label: '비활성', icon: <XIcon /> }
      ]}
      value={selectedUser}
      onChange={setSelectedUser}
      searchable={true}  // 검색 가능
      clearable={true}   // 선택 해제 가능
      disabled={isLoading}
      error={validationError}
      grouped={false}    // 그룹핑 옵션
    />
  );
}

// 그룹핑이 필요한 경우
<Select
  options={[
    {
      group: '관리자',
      options: [
        { value: 'admin', label: 'Admin User' },
        { value: 'moderator', label: 'Moderator' }
      ]
    },
    {
      group: '일반 사용자',
      options: [
        { value: 'user', label: 'Regular User' }
      ]
    }
  ]}
/>

// 개선 효과:
// ✅ 상태 관리 완전 자동화
// ✅ 접근성 완벽 지원 (ARIA, 키보드)
// ✅ 검색, 다중 선택 등 고급 기능 쉽게 추가
// ✅ 포털 렌더링으로 z-index 문제 해결
// ✅ 로딩, 에러 상태 일관성
```

## 핵심 철학

### 1. **설정 중심 접근**
- 컴포넌트의 모든 변형을 props로 제어
- 명확하고 예측 가능한 API 제공
- 잘못된 사용을 원천적으로 방지

### 2. **일관성 우선**
- 모든 사용처에서 동일한 구조 보장
- 예상치 못한 레이아웃 조합 방지

### 3. **단순성 추구**
- 개발자가 복잡한 조합을 고민할 필요 없음
- 학습 곡선 최소화
- 명확한 사용법 제시

## 기본 구조와 TypeScript 패턴

### 기본 형태

```tsx
// Configuration 패턴의 기본 형태
interface ComponentProps {
  variant: 'primary' | 'secondary' | 'danger';
  size: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  // 모든 변형을 props로 제어
}

const Component = ({
  variant,
  size,
  disabled,
  loading,
  ...props
}: ComponentProps) => {
  // props에 따라 내부에서 조건부 렌더링
  return (
    <div
      className={classNames(
        'component',
        `component--${variant}`,
        `component--${size}`,
        { 'component--disabled': disabled }
      )}
      {...props}
    />
  );
};
```

### 고급 TypeScript 패턴

**1. Discriminated Union으로 상호 배타적 Props**
```tsx
// variant에 따라 다른 props 허용
type ButtonProps =
  | {
      variant: 'primary' | 'secondary';
      color?: never;  // 이 variant에서는 color 불가
      onClick: () => void;
    }
  | {
      variant: 'custom';
      color: string;  // custom일 때만 color 필수
      onClick: () => void;
    }
  | {
      variant: 'link';
      color?: never;
      href: string;  // link일 때는 href 필수, onClick 대신
      onClick?: never;
    };

// 사용
<Button variant="primary" onClick={handleClick} />  // ✅
<Button variant="custom" color="#ff0000" onClick={handleClick} />  // ✅
<Button variant="link" href="/page" />  // ✅

<Button variant="primary" color="#ff0000" />  // ❌ 타입 에러
<Button variant="link" onClick={handleClick} />  // ❌ 타입 에러
```

**2. 조건부 Props 타입**
```tsx
// size가 'custom'일 때만 width, height 허용
interface BaseImageProps {
  src: string;
  alt: string;
}

type ImageProps = BaseImageProps & (
  | {
      size: 'small' | 'medium' | 'large';
      width?: never;
      height?: never;
    }
  | {
      size: 'custom';
      width: number;
      height: number;
    }
);

const Image = ({ src, alt, size, width, height }: ImageProps) => {
  const dimensions = size === 'custom'
    ? { width, height }
    : PRESET_SIZES[size];

  return <img src={src} alt={alt} {...dimensions} />;
};
```

**3. Generic Props로 타입 안전성 강화**
```tsx
// Select 컴포넌트에서 value 타입 추론
interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface SelectProps<T = string> {
  options: SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  placeholder?: string;
}

function Select<T = string>({
  options,
  value,
  onChange,
  placeholder
}: SelectProps<T>) {
  // 구현
}

// 사용 - 타입이 자동으로 추론됨
const numberSelect = (
  <Select
    options={[
      { value: 1, label: 'One' },
      { value: 2, label: 'Two' }
    ]}
    value={selectedNumber}  // number 타입
    onChange={(num) => {
      // num은 number로 추론됨
      setSelectedNumber(num);
    }}
  />
);

type Status = 'pending' | 'approved' | 'rejected';

const statusSelect = (
  <Select<Status>
    options={[
      { value: 'pending', label: '대기중' },
      { value: 'approved', label: '승인' },
      { value: 'rejected', label: '거부' }
    ]}
    value={status}  // Status 타입
    onChange={(newStatus) => {
      // newStatus는 Status로 추론됨
      setStatus(newStatus);
    }}
  />
);
```

**4. Builder Pattern으로 복잡한 설정 단순화**
```tsx
// 복잡한 table 설정을 타입 안전하게
interface TableColumn<T> {
  key: keyof T;
  header: string;
  width?: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  sortBy?: keyof T;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: keyof T) => void;
}

// 사용
interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

<Table<User>
  data={users}
  columns={[
    {
      key: 'name',
      header: '이름',
      sortable: true,
      width: '200px'
    },
    {
      key: 'email',
      header: '이메일'
    },
    {
      key: 'role',
      header: '역할',
      render: (role) => (
        <Badge variant={role === 'admin' ? 'primary' : 'secondary'}>
          {role}
        </Badge>
      )
    }
  ]}
  sortBy="name"
  sortDirection="asc"
  onSort={handleSort}
/>

// key는 User의 실제 키로 제한되며, 자동완성 지원
```

## 실제 구현 예시

### 1. **Button 컴포넌트 - 완전한 구현**

```tsx
// types.ts
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
}

// Button.tsx
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  children,
  className,
  ...props
}, ref) => {
  const buttonClass = classNames(
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    {
      'btn--disabled': disabled,
      'btn--loading': loading,
      'btn--full-width': fullWidth,
    },
    className
  );

  return (
    <button
      ref={ref}
      className={buttonClass}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="btn__spinner">
          <Spinner size={size === 'xs' ? 'xs' : 'sm'} />
        </span>
      )}
      {!loading && leftIcon && (
        <span className="btn__left-icon">{leftIcon}</span>
      )}
      <span className="btn__content">{children}</span>
      {!loading && rightIcon && (
        <span className="btn__right-icon">{rightIcon}</span>
      )}
    </button>
  );
});

Button.displayName = 'Button';

// 사용 예시
<Button
  variant="primary"
  size="lg"
  leftIcon={<SaveIcon />}
  loading={isSaving}
  onClick={handleSave}
>
  저장하기
</Button>
```

### 2. **Navigation 컴포넌트 - 반응형 완벽 구현**

```tsx
interface NavigationProps {
  variant?: 'main' | 'sub' | 'mobile';
  brand?: {
    text: string;
    href?: string;
    logo?: string;
  };
  menuItems?: Array<{
    label: string;
    href: string;
    active?: boolean;
    badge?: string | number;
  }>;
  actions?: {
    primary?: {
      label: string;
      onClick: () => void;
    };
    secondary?: {
      label: string;
      onClick: () => void;
    };
  };
  mobileMenu?: {
    isOpen: boolean;
    onToggle: () => void;
  };
  sticky?: boolean;
  transparent?: boolean;
}

const Navigation: React.FC<NavigationProps> = ({
  variant = 'main',
  brand,
  menuItems = [],
  actions,
  mobileMenu,
  sticky = false,
  transparent = false,
  ...props
}) => {
  const navigationClass = classNames(
    'navigation',
    `navigation--${variant}`,
    {
      'navigation--sticky': sticky,
      'navigation--transparent': transparent,
    }
  );

  const renderBrand = () => {
    if (!brand) return null;

    const brandContent = (
      <>
        {brand.logo && (
          <img
            src={brand.logo}
            alt={brand.text}
            className="navigation__logo"
          />
        )}
        <span className="navigation__brand-text">{brand.text}</span>
      </>
    );

    return brand.href ? (
      <a href={brand.href} className="navigation__brand">
        {brandContent}
      </a>
    ) : (
      <div className="navigation__brand">{brandContent}</div>
    );
  };

  const renderMenu = () => {
    if (menuItems.length === 0) return null;

    return (
      <nav className="navigation__menu">
        {menuItems.map((item, index) => (
          <a
            key={index}
            href={item.href}
            className={classNames('navigation__link', {
              'navigation__link--active': item.active
            })}
          >
            {item.label}
            {item.badge && (
              <span className="navigation__badge">{item.badge}</span>
            )}
          </a>
        ))}
      </nav>
    );
  };

  const renderActions = () => {
    if (!actions) return null;

    return (
      <div className="navigation__actions">
        {actions.secondary && (
          <Button
            variant="secondary"
            size="md"
            onClick={actions.secondary.onClick}
          >
            {actions.secondary.label}
          </Button>
        )}
        {actions.primary && (
          <Button
            variant="primary"
            size="md"
            onClick={actions.primary.onClick}
          >
            {actions.primary.label}
          </Button>
        )}
      </div>
    );
  };

  const renderMobileToggle = () => {
    if (!mobileMenu) return null;

    return (
      <button
        className="navigation__mobile-toggle"
        onClick={mobileMenu.onToggle}
        aria-label="메뉴 열기/닫기"
        aria-expanded={mobileMenu.isOpen}
      >
        <MenuIcon />
      </button>
    );
  };

  if (variant === 'mobile') {
    return (
      <header className={navigationClass} {...props}>
        {renderMobileToggle()}
        {renderBrand()}
        {mobileMenu?.isOpen && (
          <div className="navigation__mobile-menu">
            {renderMenu()}
            {renderActions()}
          </div>
        )}
      </header>
    );
  }

  return (
    <header className={navigationClass} {...props}>
      <div className="navigation__container">
        {renderBrand()}
        {renderMenu()}
        {renderActions()}
        {renderMobileToggle()}
      </div>
    </header>
  );
};

// 사용 예시
<Navigation
  variant="main"
  sticky={true}
  brand={{
    text: "MyApp",
    logo: "/logo.png",
    href: "/"
  }}
  menuItems={[
    { label: "홈", href: "/", active: true },
    { label: "상품", href: "/products", badge: "NEW" },
    { label: "소개", href: "/about" }
  ]}
  actions={{
    secondary: { label: "로그인", onClick: handleLogin },
    primary: { label: "회원가입", onClick: handleSignup }
  }}
  mobileMenu={{
    isOpen: isMobileMenuOpen,
    onToggle: toggleMobileMenu
  }}
/>
```

### 3. **Card 컴포넌트 - 하이브리드 접근**

```tsx
// Configuration 중심 + Composition 확장 가능
interface CardProps {
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost';
  padding?: 'none' | 'sm' | 'md' | 'lg';

  // Configuration 방식
  title?: string;
  subtitle?: string;
  headerActions?: React.ReactNode;

  image?: {
    src: string;
    alt: string;
    aspectRatio?: '16:9' | '4:3' | '1:1' | 'auto';
  };

  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
    loading?: boolean;
  }>;

  // Composition을 위한 children
  children: React.ReactNode;

  // 추가 옵션
  hoverable?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(({
  variant = 'default',
  padding = 'md',
  title,
  subtitle,
  headerActions,
  image,
  actions,
  children,
  hoverable = false,
  clickable = false,
  onClick,
  className,
  ...props
}, ref) => {
  const cardClass = classNames(
    'card',
    `card--${variant}`,
    {
      'card--hoverable': hoverable,
      'card--clickable': clickable,
    },
    className
  );

  const hasHeader = title || subtitle || headerActions;

  return (
    <div
      ref={ref}
      className={cardClass}
      onClick={clickable ? onClick : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      {...props}
    >
      {image && (
        <div
          className={classNames(
            'card__image',
            `card__image--${image.aspectRatio || '16:9'}`
          )}
        >
          <img src={image.src} alt={image.alt} />
        </div>
      )}

      {hasHeader && (
        <div className="card__header">
          <div className="card__header-content">
            {title && <h3 className="card__title">{title}</h3>}
            {subtitle && <p className="card__subtitle">{subtitle}</p>}
          </div>
          {headerActions && (
            <div className="card__header-actions">{headerActions}</div>
          )}
        </div>
      )}

      <div className={`card__body card__body--${padding}`}>
        {children}
      </div>

      {actions && actions.length > 0 && (
        <div className="card__footer">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'secondary'}
              onClick={action.onClick}
              loading={action.loading}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
});

Card.displayName = 'Card';

// 서브 컴포넌트도 제공 (Composition 지원)
Card.Image = CardImage;
Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;
Card.Title = CardTitle;

export { Card };

// 사용 예시 1: Configuration 방식
<Card
  variant="elevated"
  padding="lg"
  title="프로젝트 카드"
  subtitle="React 프로젝트"
  image={{ src: "/thumb.jpg", alt: "썸네일", aspectRatio: "16:9" }}
  actions={[
    { label: "취소", onClick: handleCancel },
    { label: "확인", onClick: handleConfirm, variant: "primary" }
  ]}
  hoverable
>
  <p>카드 내용입니다.</p>
</Card>

// 사용 예시 2: Composition 방식 (특별한 경우)
<Card variant="elevated">
  <Card.Image src="/special.jpg" aspectRatio="1:1" />
  <Card.Body>
    <Badge variant="new">NEW</Badge>
    <Card.Title>한정판 상품</Card.Title>
    <CountdownTimer endTime={endTime} />
    <PriceDisplay original={99000} sale={29900} />
  </Card.Body>
  <Card.Footer>
    <ShareButtons />
    <Button variant="primary">구매하기</Button>
  </Card.Footer>
</Card>
```

## 함정과 주의사항

### Configuration 패턴의 함정 ⚠️

#### 함정 1: Props 폭발 (Props Explosion)

```tsx
// ❌ 나쁜 예: 모든 것을 props로
interface BadButtonProps {
  variant: string;
  size: string;
  color: string;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  padding: string;
  margin: string;
  fontSize: string;
  fontWeight: string;
  textAlign: string;
  textTransform: string;
  // ... 50개 이상의 props
}

// ✅ 좋은 예: 의미있는 변형으로 그룹화
interface GoodButtonProps {
  variant: 'primary' | 'secondary' | 'outline';  // 색상과 스타일 포함
  size: 'sm' | 'md' | 'lg';  // 크기 관련 모든 속성 포함
  fullWidth?: boolean;
  // 내부적으로 variant와 size가 모든 스타일 결정
}
```

**교훈**: props는 **의미있는 변형**을 나타내야지, CSS 속성의 단순 복사가 되어선 안 됩니다.

#### 함정 2: 예상하지 못한 조합 처리 실패

```tsx
// ❌ 문제: 모든 조합을 테스트하지 않음
interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  variant: 'filled' | 'outlined' | 'minimal';
  icon?: React.ReactNode;
}

const Alert = ({ type, variant, icon }: AlertProps) => {
  // 'minimal' + 'error' 조합을 고려하지 않아 색상이 이상함
  const colors = {
    success: 'green',
    error: 'red',
    // warning과 info가 없어서 에러 발생
  };

  return (
    <div className={`alert-${type}-${variant}`}>
      {icon}
    </div>
  );
};

// ✅ 해결: 모든 조합을 명시적으로 처리
const Alert = ({ type, variant, icon }: AlertProps) => {
  const getAlertStyles = (): string => {
    // variant별 기본 스타일
    const variantStyles = {
      filled: 'text-white',
      outlined: 'border-2 bg-white',
      minimal: 'bg-opacity-10'
    };

    // type별 색상 (모든 variant와 호환)
    const typeColors = {
      success: {
        filled: 'bg-green-500',
        outlined: 'border-green-500 text-green-700',
        minimal: 'bg-green-500 text-green-700'
      },
      error: {
        filled: 'bg-red-500',
        outlined: 'border-red-500 text-red-700',
        minimal: 'bg-red-500 text-red-700'
      },
      // warning, info도 모두 정의
    };

    return classNames(
      'alert',
      variantStyles[variant],
      typeColors[type][variant]
    );
  };

  // 테스트: 4 types × 3 variants = 12개 조합 모두 확인
  return (
    <div className={getAlertStyles()}>
      {icon || DEFAULT_ICONS[type]}
      {children}
    </div>
  );
};
```

**교훈**: Configuration 패턴에서는 **가능한 모든 조합을 테스트**해야 합니다.

#### 함정 3: 확장성 부족으로 인한 회귀

```tsx
// 처음 설계
interface ModalProps {
  size: 'sm' | 'md' | 'lg';
  title: string;
  children: React.ReactNode;
}

// 6개월 후... 새로운 요구사항
// "모달에 아이콘도 넣고 싶어요"
interface ModalProps {
  size: 'sm' | 'md' | 'lg';
  title: string;
  titleIcon?: React.ReactNode;  // 추가
  children: React.ReactNode;
}

// 1년 후...
// "서브타이틀도 넣고 싶어요"
// "모달 헤더에 버튼도 넣고 싶어요"
interface ModalProps {
  size: 'sm' | 'md' | 'lg';
  title: string;
  titleIcon?: React.ReactNode;
  subtitle?: string;  // 추가
  headerActions?: React.ReactNode;  // 추가
  children: React.ReactNode;
  // ... props가 계속 늘어남
}

// ✅ 해결: 처음부터 확장 가능하게 설계
interface ModalProps {
  size: 'sm' | 'md' | 'lg';

  // Configuration (일반적인 경우)
  title?: string;
  subtitle?: string;

  // Composition (특별한 경우)
  header?: React.ReactNode;  // 완전한 커스텀 헤더

  children: React.ReactNode;
}

const Modal = ({ size, title, subtitle, header, children }: ModalProps) => {
  return (
    <div className={`modal modal--${size}`}>
      {header ? (
        // 커스텀 헤더
        <div className="modal__header">{header}</div>
      ) : (
        // 기본 헤더 (title + subtitle)
        title && (
          <div className="modal__header">
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
        )
      )}
      <div className="modal__body">{children}</div>
    </div>
  );
};

// 일반적인 사용 (90%)
<Modal title="제목" subtitle="부제목">내용</Modal>

// 특별한 경우 (10%)
<Modal
  header={
    <CustomHeader
      title="제목"
      icon={<Icon />}
      actions={<Actions />}
    />
  }
>
  내용
</Modal>
```

**교훈**: 처음부터 **하이브리드 접근**을 고려하여 확장성을 확보하세요.

#### 함정 4: 타입 안전성 착각

```tsx
// ❌ 문제: variant는 타입 안전하지만, 런타임 검증 없음
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger';
}

const Button = ({ variant }: ButtonProps) => {
  // 외부 API에서 받은 데이터
  const variantFromAPI = response.variant;  // any 타입

  return <Button variant={variantFromAPI} />;
  // 컴파일은 되지만, 런타임에 'unknown' 값이 올 수 있음
};

// ✅ 해결: 런타임 검증 추가
const VALID_VARIANTS = ['primary', 'secondary', 'danger'] as const;
type Variant = typeof VALID_VARIANTS[number];

interface ButtonProps {
  variant: Variant;
}

const isValidVariant = (value: any): value is Variant => {
  return VALID_VARIANTS.includes(value);
};

const Button = ({ variant }: ButtonProps) => {
  const variantFromAPI = response.variant;

  const safeVariant = isValidVariant(variantFromAPI)
    ? variantFromAPI
    : 'primary';  // fallback

  return <Button variant={safeVariant} />;
};

// 또는 Zod 같은 라이브러리 사용
import { z } from 'zod';

const ButtonPropsSchema = z.object({
  variant: z.enum(['primary', 'secondary', 'danger']),
  size: z.enum(['sm', 'md', 'lg']),
});

// API 응답 검증
const validatedProps = ButtonPropsSchema.parse(apiResponse);
```

**교훈**: 타입스크립트는 **컴파일 타임**만 보호합니다. 런타임 검증도 필요합니다.

### Composition 패턴의 함정 ⚠️

#### 함정 5: 필수 구조를 강제할 수 없음

```tsx
// ❌ 문제: 개발자가 구조를 잘못 사용
<Table>
  <Table.Body>  {/* Header가 빠짐 */}
    <Table.Row>
      <Table.Cell>데이터</Table.Cell>
    </Table.Row>
  </Table.Body>
</Table>

// 또는
<Card>
  <Card.Footer>  {/* Body 없이 Footer만 */}
    <Button>확인</Button>
  </Card.Footer>
</Card>

// ✅ 해결: Configuration으로 필수 구조 보장
interface TableProps {
  columns: Array<{ key: string; header: string }>;  // 필수
  data: Array<Record<string, any>>;  // 필수
  // Header는 columns에서 자동 생성
}

<Table
  columns={[
    { key: 'name', header: '이름' },
    { key: 'email', header: '이메일' }
  ]}
  data={users}
/>
```

#### 함정 6: 상태 관리 복잡도 증가

```tsx
// ❌ 문제: Accordion 상태를 각자 관리
function FAQ() {
  const [open1, setOpen1] = useState(false);
  const [open2, setOpen2] = useState(false);
  const [open3, setOpen3] = useState(false);
  // 10개면 10개의 상태...

  return (
    <Accordion>
      <Accordion.Item isOpen={open1} onToggle={() => setOpen1(!open1)}>
        <Accordion.Header>질문 1</Accordion.Header>
        <Accordion.Body>답변 1</Accordion.Body>
      </Accordion.Item>
      {/* 반복... */}
    </Accordion>
  );
}

// ✅ 해결: Configuration으로 상태 관리 내장
function FAQ() {
  return (
    <Accordion
      items={[
        { id: '1', header: '질문 1', body: '답변 1' },
        { id: '2', header: '질문 2', body: '답변 2' },
        { id: '3', header: '질문 3', body: '답변 3' }
      ]}
      defaultOpen={['1']}  // 기본 열림
      allowMultiple={false}  // 한 번에 하나만
    />
  );
}
```

## 장점과 단점

### 장점

#### 1. **일관성 보장**
```tsx
// 모든 사용처에서 동일한 구조
<Header variant="main" sticky={true} />
<Header variant="sub" showBackButton={true} />
// 항상 예측 가능한 결과
```

#### 2. **사용성 향상**
```tsx
// 명확한 API - 무엇을 설정해야 하는지 명확
interface ButtonProps {
  variant: 'primary' | 'secondary';  // 필수 선택
  size?: 'sm' | 'md' | 'lg';        // 선택적 설정
}

// IDE 자동완성과 타입 체크 지원
<Button variant="|" />  // Ctrl+Space로 옵션 확인
```

#### 3. **오류 방지**
```tsx
// 잘못된 조합 원천 차단
const Modal = ({ size }: { size: 'sm' | 'md' | 'lg' }) => {
  // size에 따라 내부에서 적절한 스타일 적용
  // 개발자가 잘못된 크기를 설정할 수 없음
};

<Modal size="huge" />  // ❌ 타입 에러
```

#### 4. **유지보수성**
```tsx
// 변경사항이 한 곳에서 관리됨
const Button = ({ variant }: ButtonProps) => {
  const getButtonStyle = (variant: string) => {
    switch (variant) {
      case 'primary': return 'bg-blue-500';
      case 'secondary': return 'bg-gray-500';
      // 새로운 variant 추가 시 여기서만 수정
      // 모든 사용처에 자동 반영
    }
  };
};
```

#### 5. **학습 곡선 낮음**
```tsx
// 문서를 보면 바로 이해
<Button
  variant="primary"    // 옵션이 명확함
  size="lg"           // 간단한 설정
  onClick={handler}
>
  클릭
</Button>

// vs Composition (학습 필요)
<Button>
  <Button.Icon><SaveIcon /></Button.Icon>
  <Button.Content>클릭</Button.Content>
  <Button.Loader show={loading} />
</Button>
```

### 단점

#### 1. **유연성 제한**
```tsx
// 예상하지 못한 조합이 필요할 때 제약
<Button variant="primary" size="lg">
  {/* 특별한 아이콘 배치가 필요하다면? */}
  {/* props로 모든 경우를 다 커버하기 어려움 */}
</Button>

// 해결: 하이브리드 접근
<Button variant="primary" size="lg">
  <CustomIconLayout />  {/* children 허용 */}
</Button>
```

#### 2. **Props 복잡성**
```tsx
// 많은 옵션으로 인한 인터페이스 복잡화
interface ComplexComponentProps {
  variant: string;
  size: string;
  color: string;
  border: string;
  shadow: string;
  // ... 수십 개의 설정 옵션
}

// 완화: 합리적인 기본값 제공
const Component = ({
  variant = 'default',  // 대부분은 기본값 사용
  size = 'md',
  ...rest
}: ComplexComponentProps) => {
  // 사용자는 필요한 것만 override
};
```

#### 3. **확장성 한계**
```tsx
// 새로운 요구사항마다 props 추가 필요
interface HeaderProps {
  isHome?: boolean;
  isProgressBar?: boolean;
  showNotification?: boolean;  // 새 요구사항
  hasSearchBar?: boolean;      // 또 다른 요구사항
  // 계속 증가하는 props...
}

// 해결: 플러그인 패턴 또는 하이브리드
interface HeaderProps {
  variant: 'home' | 'default' | 'minimal';  // 일반적인 경우
  plugins?: Array<HeaderPlugin>;  // 확장
}
```

## 모범 사례

### 1. **명확한 타입 정의**
```tsx
// 가능한 모든 옵션을 타입으로 명시
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger' | 'ghost';
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

// JSDoc으로 설명 추가
interface ButtonProps {
  /**
   * 버튼의 시각적 스타일
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';

  /**
   * 버튼 크기
   * - xs: 24px height
   * - sm: 32px height
   * - md: 40px height (default)
   * - lg: 48px height
   * - xl: 56px height
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}
```

### 2. **기본값 제공**
```tsx
const Button: React.FC<ButtonProps> = ({
  variant = 'primary',    // 합리적인 기본값
  size = 'md',           // 가장 일반적인 크기
  disabled = false,      // 안전한 기본값
  loading = false,
  fullWidth = false,
  ...props
}) => {
  // 사용자는 필요한 것만 override
};

// 사용
<Button onClick={handler}>클릭</Button>
// variant="primary", size="md" 자동 적용
```

### 3. **조건부 props 패턴**
```tsx
// 상호 배타적인 옵션을 타입으로 표현
type ButtonProps =
  | { variant: 'primary'; color?: never }
  | { variant: 'custom'; color: string };

// Discriminated union 사용
type ModalProps =
  | { type: 'confirm'; onConfirm: () => void; onCancel: () => void }
  | { type: 'alert'; onClose: () => void };

// 사용
<Modal type="confirm" onConfirm={fn} onCancel={fn} />  // ✅
<Modal type="alert" onClose={fn} />  // ✅
<Modal type="confirm" onClose={fn} />  // ❌ 타입 에러
```

### 4. **점진적 확장**
```tsx
// 기본 인터페이스에서 시작
interface BaseButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
}

// 필요에 따라 확장
interface ExtendedButtonProps extends BaseButtonProps {
  variant: 'primary' | 'secondary';
  size: 'sm' | 'md' | 'lg';
}

// 더 확장
interface AdvancedButtonProps extends ExtendedButtonProps {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}
```

### 5. **문서화와 예제**
```tsx
/**
 * Button 컴포넌트
 *
 * @example
 * // 기본 사용
 * <Button onClick={handleClick}>클릭</Button>
 *
 * @example
 * // 아이콘과 함께
 * <Button variant="primary" leftIcon={<SaveIcon />}>
 *   저장
 * </Button>
 *
 * @example
 * // 로딩 상태
 * <Button loading={isSaving}>저장중...</Button>
 */
export const Button: React.FC<ButtonProps> = ({ ... }) => {
  // 구현
};
```

### 6. **Storybook으로 모든 조합 테스트**
```tsx
// Button.stories.tsx
export default {
  title: 'Components/Button',
  component: Button,
} as Meta;

// 모든 variant 테스트
export const AllVariants = () => (
  <div>
    <Button variant="primary">Primary</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="danger">Danger</Button>
    <Button variant="ghost">Ghost</Button>
  </div>
);

// 모든 size 테스트
export const AllSizes = () => (
  <div>
    <Button size="xs">Extra Small</Button>
    <Button size="sm">Small</Button>
    <Button size="md">Medium</Button>
    <Button size="lg">Large</Button>
    <Button size="xl">Extra Large</Button>
  </div>
);

// 조합 테스트 (variant × size)
export const Combinations = () => {
  const variants = ['primary', 'secondary', 'danger'];
  const sizes = ['sm', 'md', 'lg'];

  return (
    <table>
      {variants.map(variant => (
        <tr key={variant}>
          {sizes.map(size => (
            <td key={size}>
              <Button variant={variant} size={size}>
                {variant} {size}
              </Button>
            </td>
          ))}
        </tr>
      ))}
    </table>
  );
};
```

## 하이브리드 접근법

두 패턴을 조합하여 사용하는 것이 실전에서는 가장 효과적입니다.

### 기본 패턴

```tsx
// 기본은 Configuration, 필요시 Composition 허용
interface CardProps {
  // Configuration 부분 (90% 케이스)
  variant?: 'default' | 'elevated';
  padding?: 'sm' | 'md' | 'lg';

  // 빠른 설정
  title?: string;
  subtitle?: string;

  // Composition 부분 (10% 케이스)
  header?: React.ReactNode;  // 완전한 커스텀 헤더
  footer?: React.ReactNode;

  // 기본 콘텐츠
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  title,
  subtitle,
  header,
  footer,
  children
}) => (
  <div className={`card card--${variant} card--${padding}`}>
    {/* header가 있으면 그것을 사용, 없으면 title/subtitle로 */}
    {header ? (
      <div className="card__header">{header}</div>
    ) : (
      (title || subtitle) && (
        <div className="card__header">
          {title && <h3 className="card__title">{title}</h3>}
          {subtitle && <p className="card__subtitle">{subtitle}</p>}
        </div>
      )
    )}

    <div className="card__body">{children}</div>

    {footer && <div className="card__footer">{footer}</div>}
  </div>
);

// 사용법 1: Configuration (대부분의 경우)
<Card
  variant="elevated"
  padding="md"
  title="카드 제목"
  subtitle="부제목"
>
  기본 사용법
</Card>

// 사용법 2: Composition (특별한 경우)
<Card
  variant="elevated"
  padding="md"
  header={
    <CustomHeader
      title="특별한 헤더"
      icon={<Icon />}
      badge={<Badge />}
    />
  }
  footer={<CustomFooter />}
>
  고급 사용법
</Card>
```

### 서브 컴포넌트 패턴

```tsx
// Card 자체는 Configuration
// 하지만 서브 컴포넌트로 Composition 지원
Card.Image = CardImage;
Card.Body = CardBody;
Card.Header = CardHeader;
Card.Footer = CardFooter;
Card.Title = CardTitle;

// 완전한 커스텀이 필요한 경우
<Card variant="elevated">
  <Card.Image src="..." aspectRatio="16:9" />
  <Card.Body padding="lg">
    <Badge variant="new">NEW</Badge>
    <Card.Title>커스텀 제목</Card.Title>
    <PriceDisplay price={29900} />
    <CountdownTimer />
  </Card.Body>
  <Card.Footer>
    <ShareButtons />
    <Button>구매</Button>
  </Card.Footer>
</Card>

// 서브 컴포넌트들은 Card의 context를 알고 있어 일관성 유지
```

## Composition 패턴과의 비교

| 측면 | Configuration | Composition |
|------|---------------|-------------|
| **제어 방식** | Props 설정 | 컴포넌트 조합 |
| **유연성** | 제한적 | 높음 |
| **일관성** | 높음 | 낮음 (잘못된 조합 가능) |
| **학습 곡선** | 낮음 | 높음 |
| **타입 안전성** | 높음 | 중간 |
| **확장성** | Props 추가 필요 | 자연스러운 확장 |
| **사용 복잡도** | 낮음 | 높음 |
| **적합한 사례** | 디자인 시스템, 폼, 레이아웃 | 대시보드, 에디터, 복잡한 데이터 표시 |

### 의사결정 매트릭스

```
복잡도 vs 일관성

          높은 일관성 필요
                ↑
Configuration  │  Hybrid
─────────────┼────────────→ 높은 유연성 필요
 Hybrid       │  Composition
                ↓
          낮은 일관성 필요
```

## 사용 시기

### Configuration을 선택하세요 ✅

#### 1. **디자인 시스템 컴포넌트**
```tsx
// 일관된 디자인이 중요한 기본 컴포넌트
<Button variant="primary" size="md" />
<Input variant="outlined" size="lg" />
<Card variant="elevated" padding="md" />
```

#### 2. **레이아웃 컴포넌트**
```tsx
// 구조적 일관성이 중요한 컴포넌트
<Header variant="main" sticky={true} />
<Sidebar collapsed={false} width="240px" />
<Footer showSocialLinks={true} />
```

#### 3. **제한된 변형이 필요한 경우**
```tsx
// 명확하게 정의된 몇 가지 패턴만 필요
<Alert type="success" dismissible={true} />
<Badge variant="primary" size="sm" />
```

#### 4. **접근성이 중요한 컴포넌트**
```tsx
// FormField, Dialog, Tabs 등
// 내부에서 접근성 속성을 일관되게 처리
<FormField
  label="이메일"
  error="필수 항목입니다"
  // aria-invalid, aria-describedby 자동 처리
/>
```

### Composition을 선택하세요 ✅

#### 1. **높은 커스터마이징이 필요한 경우**
```tsx
// 매우 다양한 조합이 필요한 복잡한 컴포넌트
<DataTable>
  <DataTable.Header>
    <DataTable.Column sortable>Name</DataTable.Column>
    <DataTable.Column>Email</DataTable.Column>
  </DataTable.Header>
  <DataTable.Body>{/* 동적 데이터 */}</DataTable.Body>
</DataTable>
```

#### 2. **동적 구조가 필요한 경우**
```tsx
// 런타임에 구조가 결정되는 컴포넌트
<Form>
  {fields.map(field => (
    <Form.Field key={field.id} {...field} />
  ))}
</Form>
```

#### 3. **복잡한 조합이 일반적인 경우**
```tsx
// 대시보드, 드래그앤드롭 빌더 등
<Dashboard>
  <Widget position="top-left">
    <Chart />
  </Widget>
  <Widget position="top-right">
    <Stats />
  </Widget>
</Dashboard>
```

## 실전 체크리스트

컴포넌트를 만들기 전에 다음을 확인하세요:

### Configuration 체크리스트 ✅

- [ ] 변형이 3~5가지 이하로 명확한가?
- [ ] 디자인 시스템의 일부인가?
- [ ] 일관성이 유연성보다 중요한가?
- [ ] 잘못된 사용을 방지해야 하는가?
- [ ] 접근성 속성을 일관되게 적용해야 하는가?
- [ ] 새 개발자가 5분 안에 이해할 수 있어야 하는가?

### Composition 체크리스트 ✅

- [ ] 가능한 조합이 10가지 이상인가?
- [ ] 사용자가 내부 구조를 제어해야 하는가?
- [ ] 런타임에 구조가 결정되는가?
- [ ] 플러그인이나 확장 시스템이 필요한가?
- [ ] 개발자가 세부 제어를 원하는가?

### 하이브리드 체크리스트 ✅

- [ ] 90% 케이스는 단순하지만, 10%는 복잡한가?
- [ ] 기본 동작은 일관되어야 하지만, 확장이 필요한가?
- [ ] 단계적으로 복잡도를 높여야 하는가?

## 참고 자료

### 디자인 시스템 사례

- [Material-UI](https://mui.com/) - Configuration 중심의 컴포넌트 라이브러리
- [Ant Design](https://ant.design/) - 체계적인 props 기반 API
- [Chakra UI](https://chakra-ui.com/) - 설정과 조합의 균형
- [Radix UI](https://www.radix-ui.com/) - Composition 중심의 headless 컴포넌트
- [Tailwind UI](https://tailwindui.com/) - Configuration 패턴의 실전 예제

### 아티클 및 블로그

- [Component API Design](https://jxnblk.com/blog/component-api-design/) - Brent Jackson
- [Building Better Component APIs](https://www.smashingmagazine.com/2021/08/building-better-component-apis-react/) - Smashing Magazine
- [The Spectrum of Abstraction](https://www.youtube.com/watch?v=mVVNJKv9esE) - Cheng Lou (React Conf)
- [Configuration vs Composition in React](https://kentcdodds.com/blog/configuration-vs-composition) - Kent C. Dodds
- [Component Design Patterns](https://blog.bitsrc.io/react-component-design-patterns-2022-1b0b7e0e4b5a)
- [Building Flexible React Components](https://epicreact.dev/flexible-components/)

### 디자인 원칙

- [Design Systems for Developers](https://www.learnstorybook.com/design-systems-for-developers/) - Storybook
- [Component Library Best Practices](https://www.chromatic.com/blog/component-library-best-practices)
- [API Design in React](https://www.swyx.io/api-design-react)

### 도구 및 라이브러리

- [Storybook](https://storybook.js.org/) - Configuration 기반 컴포넌트 문서화
- [React Hook Form](https://react-hook-form.com/) - Configuration 중심의 폼 라이브러리
- [Styled System](https://styled-system.com/) - Props 기반 스타일링
- [Zod](https://zod.dev/) - 런타임 타입 검증

### TypeScript 관련

- [TypeScript Handbook - Discriminated Unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)
- [Advanced TypeScript Patterns](https://www.learningtypescript.com/)
- [Type-Safe Component APIs](https://www.totaltypescript.com/)

### 실전 경험 공유

- [How We Built Our Design System](https://medium.com/styled-components/how-to-build-a-design-system-with-react-components-3f7d6a3e3e3e)
- [Lessons from Building Component Libraries](https://www.youtube.com/watch?v=j8eBXGPl_5E)

## 마무리

Configuration over Composition 패턴은 **"일관성이 유연성보다 중요한 상황"**에서 강력한 도구입니다.

핵심은:
- 디자인 시스템에는 Configuration
- 복잡한 데이터 표시에는 Composition
- 대부분의 경우는 Hybrid

여러분의 프로젝트에서 올바른 균형을 찾으세요. 처음부터 완벽할 필요는 없습니다. 사용자 피드백을 받으며 점진적으로 개선하세요.

저도 여전히 배우고 있습니다. 여러분의 경험도 공유해주시면 감사하겠습니다!
{% endraw %}
