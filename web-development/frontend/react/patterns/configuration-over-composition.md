# Configuration over Composition Pattern

**Configuration over Composition**은 컴포넌트의 동작과 외형을 props를 통한 설정으로 제어하는 디자인 패턴입니다. 복잡한 컴포넌트 조합 대신 명확한 설정 옵션을 제공하여 일관성과 사용성을 보장합니다.

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

## 기본 구조

```tsx
// Configuration 패턴의 기본 형태
interface ComponentProps {
  variant: 'primary' | 'secondary' | 'danger';
  size: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  // 모든 변형을 props로 제어
}

const Component = ({ variant, size, disabled, loading, ...props }: ComponentProps) => {
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

## 실제 구현 예시

### 1. **Button 컴포넌트**

```tsx
// Configuration 방식
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  children,
  ...props
}) => {
  const buttonClass = classNames(
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    {
      'btn--disabled': disabled,
      'btn--loading': loading,
      'btn--full-width': fullWidth,
    }
  );

  return (
    <button 
      className={buttonClass}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {leftIcon && <span className="btn__left-icon">{leftIcon}</span>}
      <span className="btn__content">{children}</span>
      {rightIcon && <span className="btn__right-icon">{rightIcon}</span>}
    </button>
  );
};

// 사용법 - 명확하고 예측 가능
<Button variant="primary" size="lg" leftIcon={<SaveIcon />}>
  저장하기
</Button>
```

### 2. **Navigation 컴포넌트**

{% raw %}
```tsx
interface NavigationProps {
  // 네비게이션 타입 설정
  variant: 'main' | 'sub' | 'mobile';
  
  // 브랜드 설정
  brand?: {
    text: string;
    href?: string;
    logo?: string;
  };
  
  // 메뉴 항목들
  menuItems?: Array<{
    label: string;
    href: string;
    active?: boolean;
  }>;
  
  // 액션 버튼들
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
  
  // 모바일 메뉴 설정
  mobileMenu?: {
    isOpen: boolean;
    onToggle: () => void;
  };
}

const Navigation: React.FC<NavigationProps> = ({
  variant = 'main',
  brand,
  menuItems = [],
  actions,
  mobileMenu,
  ...props
}) => {
  // variant에 따른 조건부 렌더링
  const renderContent = () => {
    switch (variant) {
      case 'main':
        return (
          <>
            {brand && (
              <div className="nav__brand">
                {brand.logo && <img src={brand.logo} alt={brand.text} />}
                <span>{brand.text}</span>
              </div>
            )}
            <nav className="nav__menu">
              {menuItems.map((item, index) => (
                <a 
                  key={index}
                  href={item.href}
                  className={`nav__link ${item.active ? 'nav__link--active' : ''}`}
                >
                  {item.label}
                </a>
              ))}
            </nav>
            {actions && (
              <div className="nav__actions">
                {actions.secondary && (
                  <button 
                    className="btn btn--secondary"
                    onClick={actions.secondary.onClick}
                  >
                    {actions.secondary.label}
                  </button>
                )}
                {actions.primary && (
                  <button 
                    className="btn btn--primary"
                    onClick={actions.primary.onClick}
                  >
                    {actions.primary.label}
                  </button>
                )}
              </div>
            )}
          </>
        );
        
      case 'mobile':
        return (
          <>
            <button 
              className="nav__mobile-toggle"
              onClick={mobileMenu?.onToggle}
            >
              ☰
            </button>
            {brand && <span className="nav__brand-mobile">{brand.text}</span>}
            {mobileMenu?.isOpen && (
              <div className="nav__mobile-menu">
                {menuItems.map((item, index) => (
                  <a key={index} href={item.href} className="nav__mobile-link">
                    {item.label}
                  </a>
                ))}
              </div>
            )}
          </>
        );
        
      case 'sub':
        return (
          <>
            <button className="nav__back">← 뒤로</button>
            {brand && <span className="nav__title">{brand.text}</span>}
          </>
        );
        
      default:
        return null;
    }
  };

  return (
    <header className={`navigation navigation--${variant}`} {...props}>
      {renderContent()}
    </header>
  );
};

// 사용법 - 설정만으로 모든 변형 제어
<Navigation
  variant="main"
  brand={{ text: "MyApp", logo: "/logo.png" }}
  menuItems={[
    { label: "홈", href: "/", active: true },
    { label: "상품", href: "/products" },
  ]}
  actions={{
    secondary: { label: "로그인", onClick: handleLogin },
    primary: { label: "회원가입", onClick: handleSignup }
  }}
/>
```
{% endraw %}


### 3. **Card 컴포넌트 비교**

{% raw %}
```tsx
// Configuration 방식
interface CardProps {
  variant: 'default' | 'elevated' | 'outlined';
  padding: 'none' | 'sm' | 'md' | 'lg';
  
  // 헤더 설정
  title?: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  
  // 이미지 설정
  image?: {
    src: string;
    alt: string;
    aspectRatio?: '16:9' | '4:3' | '1:1';
  };
  
  // 푸터 설정
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }>;
  
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  title,
  subtitle,
  headerActions,
  image,
  actions,
  children
}) => {
  return (
    <div className={`card card--${variant}`}>
      {image && (
        <div className={`card__image card__image--${image.aspectRatio || '16:9'}`}>
          <img src={image.src} alt={image.alt} />
        </div>
      )}
      
      {(title || subtitle || headerActions) && (
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
      
      {actions && (
        <div className="card__footer">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'secondary'}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

// 사용법: props로 모든 설정을 제어
<Card
  variant="elevated"
  padding="lg"
  title="카드 제목"
  subtitle="부제목"
  image={{ src: "/image.jpg", alt: "설명", aspectRatio: "16:9" }}
  actions={[
    { label: "취소", onClick: handleCancel },
    { label: "확인", onClick: handleConfirm, variant: "primary" }
  ]}
>
  카드 내용입니다.
</Card>

// 또는 서브 컴포넌트로 구성
<Card>
  <Card.Image src="..." alt="..." />
  <Card.Body>
    <Card.Series href="...">카테고리</Card.Series>
    <Card.Headline href="..." as="h2">제목</Card.Headline>
    <Card.Description>설명</Card.Description>
    <Card.Date>2025-01-20</Card.Date>
    <Card.Badge variant="badge_new" label="NEW" />
  </Card.Body>
</Card>
```
{% endraw %}

## 장점

### 1. **일관성 보장**
```tsx
// 모든 사용처에서 동일한 구조
<Header isHome={true} />
<Header isHome={false} isProgressBar={true} />
// 항상 예측 가능한 결과
```

### 2. **사용성 향상**
```tsx
// 명확한 API - 무엇을 설정해야 하는지 명확
interface ButtonProps {
  variant: 'primary' | 'secondary';  // 필수 선택
  size?: 'sm' | 'md' | 'lg';        // 선택적 설정
}
```

### 3. **오류 방지**
```tsx
// 잘못된 조합 원천 차단
const Modal = ({ size }: { size: 'sm' | 'md' | 'lg' }) => {
  // size에 따라 내부에서 적절한 스타일 적용
  // 개발자가 잘못된 크기를 설정할 수 없음
};
```

### 4. **유지보수성**
```tsx
// 변경사항이 한 곳에서 관리됨
const Button = ({ variant }: ButtonProps) => {
  // variant 로직 변경 시 모든 사용처에 자동 반영
  const getButtonStyle = (variant: string) => {
    switch (variant) {
      case 'primary': return 'bg-blue-500';
      case 'secondary': return 'bg-gray-500';
      // 새로운 variant 추가 시 여기서만 수정
    }
  };
};
```

## 단점

### 1. **유연성 제한**
```tsx
// 예상하지 못한 조합이 필요할 때 제약
<Button variant="primary" size="lg">
  {/* 특별한 아이콘 배치가 필요하다면? */}
  {/* props로 모든 경우를 다 커버하기 어려움 */}
</Button>
```

### 2. **Props 복잡성**
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
```

### 3. **확장성 한계**
```tsx
// 새로운 요구사항마다 props 추가 필요
interface HeaderProps {
  isHome?: boolean;
  isProgressBar?: boolean;
  showNotification?: boolean;  // 새 요구사항
  hasSearchBar?: boolean;      // 또 다른 요구사항
  // 계속 증가하는 props...
}
```

## 사용 시기

### 적합한 경우

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
<Header isHome={true} />
<Sidebar collapsed={false} />
<Footer showSocialLinks={true} />
```

#### 3. **제한된 변형이 필요한 경우**
```tsx
// 명확하게 정의된 몇 가지 패턴만 필요
<Alert type="success" dismissible={true} />
<Badge variant="primary" size="sm" />
```

### 부적합한 경우

#### 1. **높은 커스터마이징이 필요한 경우**
```tsx
// 매우 다양한 조합이 필요한 복잡한 컴포넌트
<DataTable /> // 수많은 컬럼, 필터, 정렬 옵션
<RichTextEditor /> // 다양한 툴바 구성
```

#### 2. **동적 구조가 필요한 경우**
```tsx
// 런타임에 구조가 결정되는 컴포넌트
<Form /> // 동적 필드 추가/제거
<Dashboard /> // 사용자 정의 위젯 배치
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
```

### 2. **기본값 제공**
```tsx
const Button: React.FC<ButtonProps> = ({
  variant = 'primary',    // 합리적인 기본값
  size = 'md',           // 가장 일반적인 크기
  disabled = false,      // 안전한 기본값
  ...props
}) => {
  // 구현
};
```

### 3. **조건부 props 패턴**
```tsx
// 상호 배타적인 옵션을 타입으로 표현
type ButtonProps = 
  | { variant: 'primary'; color?: never }
  | { variant: 'custom'; color: string };

// 또는 discriminated union 사용
type ModalProps = 
  | { type: 'confirm'; onConfirm: () => void; onCancel: () => void }
  | { type: 'alert'; onClose: () => void };
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

## 하이브리드 접근법

두 패턴을 조합하여 사용하는 것도 가능합니다.

```tsx
// 기본은 Configuration, 필요시 Composition 허용
interface CardProps {
  // Configuration 부분
  variant: 'default' | 'elevated';
  padding: 'sm' | 'md' | 'lg';
  
  // Composition 부분 (선택적)
  header?: React.ReactNode;
  footer?: React.ReactNode;
  
  // 기본 콘텐츠
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ 
  variant, 
  padding, 
  header, 
  footer, 
  children 
}) => (
  <div className={`card card--${variant} card--${padding}`}>
    {header && <div className="card__header">{header}</div>}
    <div className="card__body">{children}</div>
    {footer && <div className="card__footer">{footer}</div>}
  </div>
);

// 사용법
<Card variant="elevated" padding="md">
  기본 사용법
</Card>

<Card 
  variant="elevated" 
  padding="md"
  header={<CustomHeader />}  // 필요시 커스텀 헤더
  footer={<CustomFooter />}  // 필요시 커스텀 푸터
>
  고급 사용법
</Card>
```

## 참고 자료

### 디자인 시스템 사례
- [Material-UI](https://mui.com/) - Configuration 중심의 컴포넌트 라이브러리
- [Ant Design](https://ant.design/) - 체계적인 props 기반 API
- [Chakra UI](https://chakra-ui.com/) - 설정과 조합의 균형

### 아티클
- [Component API Design](https://jxnblk.com/blog/component-api-design/)
- [Building Better Component APIs](https://www.smashingmagazine.com/2021/08/building-better-component-apis-react/)
- [The Spectrum of Abstraction](https://www.youtube.com/watch?v=mVVNJKv9esE) - Cheng Lou

### 도구 및 라이브러리
- [Storybook](https://storybook.js.org/) - Configuration 기반 컴포넌트 문서화
- [React Hook Form](https://react-hook-form.com/) - Configuration 중심의 폼 라이브러리
- [Styled System](https://styled-system.com/) - Props 기반 스타일링

### 블로그 포스트
- [Configuration vs Composition in React](https://kentcdodds.com/blog/configuration-vs-composition)
- [Component Design Patterns](https://blog.bitsrc.io/react-component-design-patterns-2022-1b0b7e0e4b5a)
- [Building Flexible React Components](https://epicreact.dev/flexible-components/)
