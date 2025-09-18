# `React`에서 `Composite`/`Compound` Pattern 활용 가이드

> **어원적 차이**: Compound(복합어)는 두 개 이상의 완전한 단어를 결합하여 새로운 하나의 단어를 만드는 것(예: "sailboat")이고, Composite(합성어)는 여러 다른 재료나 부분들로 만들어진 것을 의미하며, 일반적으로 결합하는 행위나 여러 구성 요소로 만들어진 구조를 설명하는 단어입니다. 

`Composite Pattern`과 `Compound Pattern`은 React에서 복잡한 UI 컴포넌트를 구성할 때 쓰이는 디자인 패턴입니다. 
이 글에서는 실제 프로젝트에서 적용한 경험을 바탕으로 이 패턴들의 활용법을 설명합니다.

## `Composite Pattern` vs `Compound Pattern`

### `Composite Pattern`
- **목적**: 객체들을 트리 구조로 구성하여 부분-전체 계층을 표현
- **특징**: 개별 객체와 복합 객체를 동일하게 다룰 수 있음

### `Compound Pattern`  
- **목적**: 여러 컴포넌트가 함께 작동하여 하나의 기능을 제공
- **특징**: 컴포넌트 간의 상태와 로직을 공유하면서도 독립적으로 사용 가능

## 실제 적용 사례

### 1. Card 컴포넌트 - `Composite Pattern`

```tsx
// 기본 구조
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

**장점:**
- 각 서브컴포넌트를 독립적으로 사용 가능
- 레이아웃 구조를 명확하게 표현
- 재사용성과 확장성이 뛰어남

### 2. Daily 컴포넌트 - `Compound Pattern`

```tsx
// 컴포넌트 구성
<Daily>
  <Daily.Header title="Daily" />
  <Daily.Content>
    <Daily.Card>
      {/* Card 서브컴포넌트들 */}
    </Daily.Card>
  </Daily.Content>
  <Daily.MoreButton href="/daily">
    더보기
  </Daily.MoreButton>
</Daily>
```

**특징:**
- 각 서브컴포넌트가 Daily의 컨텍스트 내에서 동작
- 일관된 스타일링과 동작을 보장
- 유연한 구성이 가능

## 구현 패턴

### 1. 서브컴포넌트 정의

```tsx
// Card 컴포넌트 예시
const Card = ({ children, className, ...props }) => {
  return (
    <article className={classNames('card', className)} {...props}>
      {children}
    </article>
  );
};

// 서브컴포넌트들
Card.Image = CardImage;
Card.Body = CardBody;
Card.Headline = CardHeadline;
Card.Series = CardSeries;
Card.Description = CardDescription;
Card.Date = CardDate;
Card.Badge = CardBadge;
```

### 2. 타입 정의

```tsx
interface CardComponent extends React.FC<CardProps> {
  Image: typeof CardImage;
  Body: typeof CardBody;
  Headline: typeof CardHeadline;
  Series: typeof CardSeries;
  Description: typeof CardDescription;
  Date: typeof CardDate;
  Badge: typeof CardBadge;
}
```

### 3. Context 활용 (Compound Pattern)

```tsx
const DailyContext = createContext<DailyContextType | null>(null);

const Daily: DailyComponent = ({ children, ...props }) => {
  const contextValue = {
    // 공유할 상태나 함수들
  };

  return (
    <DailyContext.Provider value={contextValue}>
      <section className="daily" {...props}>
        {children}
      </section>
    </DailyContext.Provider>
  );
};
```

## 실제 사용 예시

### Storybook에서의 활용

```tsx
// 기본 사용법
export const Default: Story = {
  render: args => (
    <Daily {...args}>
      <Daily.Header title="Daily" />
      <Daily.Content>
        {renderDailyCards(MOCK_DAILY_ARTICLES.slice(0, 2))}
      </Daily.Content>
      <Daily.MoreButton href="/daily">
        더보기
      </Daily.MoreButton>
    </Daily>
  ),
};

// 개별 컴포넌트 테스트
export const ContentOnly: Story = {
  render: () => (
    <Daily.Content>
      {renderDailyCards(MOCK_DAILY_ARTICLES.slice(0, 1))}
    </Daily.Content>
  ),
};
```

### 이벤트 처리

```tsx
// 클릭 이벤트가 있는 Card
<Daily.Card>
  <Daily.Card.Series
    href={article.categoryLink}
    onClick={(e: React.MouseEvent) => {
      e.preventDefault();
      alert(`카테고리 클릭됨: ${article.category}`);
    }}
  >
    {article.category}
  </Daily.Card.Series>
  <Daily.Card.Headline
    href={article.link}
    as="h2"
    onClick={(e: React.MouseEvent) => {
      e.preventDefault();
      alert(`제목 클릭됨: ${article.title}`);
    }}
  >
    {article.title}
  </Daily.Card.Headline>
</Daily.Card>
```

## 패턴 적용 시 고려사항

### 1. 네이밍 일관성
- 서브컴포넌트 이름은 역할을 명확히 표현
- 계층 구조를 반영한 네이밍 사용

### 2. 타입 안정성
```tsx
// 제네릭을 활용한 유연한 타입 정의
interface CardHeadlineProps<T extends ElementType = 'h3'> {
  as?: T;
  href?: string;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  children: React.ReactNode;
}
```

### 3. 접근성 고려
```tsx
// ARIA 속성과 시맨틱 HTML 활용
<Card.Headline 
  as="h2" 
  href={article.link}
  aria-describedby={`${article.id}-description`}
>
  {article.title}
</Card.Headline>
<Card.Description id={`${article.id}-description`}>
  {article.description}
</Card.Description>
```

### 4. 스타일링 전략
```tsx
// className prop을 통한 외부 스타일 주입 허용
const Card = ({ className, children, ...props }) => (
  <article className={classNames('card', className)} {...props}>
    {children}
  </article>
);
```

## 장점과 한계

### 장점
- **재사용성**: 컴포넌트를 다양한 조합으로 사용 가능
- **유지보수성**: 각 서브컴포넌트를 독립적으로 수정 가능
- **가독성**: 컴포넌트 구조가 명확하게 드러남
- **확장성**: 새로운 서브컴포넌트를 쉽게 추가 가능

### 한계
- **복잡성**: 초기 설계 시 더 많은 고민이 필요
- **번들 크기**: 사용하지 않는 서브컴포넌트도 포함될 수 있음
- **학습 곡선**: 팀원들이 패턴을 이해하는 데 시간이 필요

## 성능 최적화

### 1. `React.memo` 활용
```tsx
// 불필요한 리렌더링 방지
const CardImage = React.memo<CardImageProps>(({ src, alt, className }) => (
  <img 
    src={src} 
    alt={alt} 
    className={classNames('card__image', className)}
    loading="lazy"
  />
));

CardImage.displayName = 'Card.Image';
```

### 2. 조건부 렌더링 최적화
```tsx
const Card = ({ children, variant = 'default' }) => {
  // children을 미리 필터링하여 성능 향상
  const validChildren = React.Children.toArray(children).filter(Boolean);
  
  return (
    <article className={`card card--${variant}`}>
      {validChildren}
    </article>
  );
};
```

## 테스팅 전략

### 1. 단위 테스트
```tsx
import { render, screen } from '@testing-library/react';
import { Card } from './Card';

describe('카드 컴포넌트', () => {
  it('모든 서브 컴포넌트를 포함한 카드 컴포넌트 렌더링 테스트', () => {
    render(
      <Card>
        <Card.Image src="/test.jpg" alt="Test" />
        <Card.Body>
          <Card.Headline>테스트 타이틀</Card.Headline>
          <Card.Description>테스트 설명문</Card.Description>
        </Card.Body>
      </Card>
    );

    expect(screen.getByRole('img')).toBeInTheDocument();
    expect(screen.getByText('테스트 타이틀')).toBeInTheDocument();
    expect(screen.getByText('테스트 설명문')).toBeInTheDocument();
  });

  it('서브 컴포넌트가 모두 포함되지 않은 경우', () => {
    render(
      <Card>
        <Card.Headline>테스트 타이틀</Card.Headline>
      </Card>
    );

    expect(screen.getByText('테스트 타이틀')).toBeInTheDocument();
  });
});
```

### 2. 통합 테스트
```tsx
describe('카드 컴포넌트 통합 테스트', () => {
  it('클릭 이벤트 처리', async () => {
    const handleClick = jest.fn();
    
    render(
      <Card>
        <Card.Headline href="/article" onClick={handleClick}>
          테스트 타이틀
        </Card.Headline>
      </Card>
    );

    await userEvent.click(screen.getByText('테스트 타이틀'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## 베스트 프랙티스

### 1. 점진적 마이그레이션
```tsx
// 기존 컴포넌트를 점진적으로 패턴 적용
const LegacyCard = ({ title, description, imageUrl }) => (
  <Card>
    <Card.Image src={imageUrl} alt={title} />
    <Card.Body>
      <Card.Headline>{title}</Card.Headline>
      <Card.Description>{description}</Card.Description>
    </Card.Body>
  </Card>
);

// 새로운 방식과 기존 방식 모두 지원
const FlexibleCard = ({ title, description, imageUrl, children }) => {
  if (children) {
    return <Card>{children}</Card>;
  }
  
  return <LegacyCard title={title} description={description} imageUrl={imageUrl} />;
};
```

### 2. 개발자 경험 향상
```tsx
// 개발 모드에서 잘못된 사용법 경고
const Card = ({ children }) => {
  if (process.env.NODE_ENV === 'development') {
    const childTypes = React.Children.map(children, child => 
      React.isValidElement(child) ? child.type.displayName : null
    );
    
    const invalidChildren = childTypes.filter(type => 
      type && !type.startsWith('Card.')
    );
    
    if (invalidChildren.length > 0) {
      console.warn(`Card: 부적합한 자식 컴포넌트가 발견되었습니다. ${invalidChildren.join(', ')}`);
    }
  }
  
  return <article className="card">{children}</article>;
};
```

### 3. 문서화 자동화
```tsx
/**
 * Card 컴포넌트 - Composite Pattern 구현
 * 
 * @example
 * ```tsx
 * <Card>
 *   <Card.Image src="/image.jpg" alt="Description" />
 *   <Card.Body>
 *     <Card.Headline>Title</Card.Headline>
 *     <Card.Description>Description</Card.Description>
 *   </Card.Body>
 * </Card>
 * ```
 */
interface CardComponent extends React.FC<CardProps> {
  /** 카드 이미지 컴포넌트 */
  Image: typeof CardImage;
  /** 카드 본문 컨테이너 */
  Body: typeof CardBody;
  /** 카드 제목 */
  Headline: typeof CardHeadline;
  /** 카드 설명 */
  Description: typeof CardDescription;
}
```

## 다른 패턴과의 비교

### `Render Props` vs `Compound Components`
```tsx
// Render Props 방식
<DataFetcher url="/api/articles">
  {({ data, loading, error }) => (
    <div>
      {loading && <Spinner />}
      {error && <ErrorMessage error={error} />}
      {data && <ArticleList articles={data} />}
    </div>
  )}
</DataFetcher>

// Compound Components 방식
<DataFetcher url="/api/articles">
  <DataFetcher.Loading>
    <Spinner />
  </DataFetcher.Loading>
  <DataFetcher.Error>
    {error => <ErrorMessage error={error} />}
  </DataFetcher.Error>
  <DataFetcher.Success>
    {data => <ArticleList articles={data} />}
  </DataFetcher.Success>
</DataFetcher>
```

**선택 기준:**
- **Compound**: 구조가 고정적이고 재사용성이 중요한 경우
- **Render Props**: 동적인 렌더링 로직이 필요한 경우

## 결론

`Composite`/`Compound` Pattern은 복잡한 UI 컴포넌트를 구성할 때 자주 사용되는 패턴입니다. 
이 패턴은 **컴포넌트의 역할과 책임을 명확히 분리**하면서도 **전체적으로 일관된 사용자 경험**을 제공하기 위해 사용됩니다.

### 체크리스트

패턴 적용 시 다음 사항들을 확인하세요.

- [ ] 컴포넌트 구조가 직관적이고 예측 가능한가?
- [ ] 각 서브컴포넌트의 역할이 명확한가?
- [ ] 타입 안정성이 보장되는가?
- [ ] 접근성 요구사항을 충족하는가?
- [ ] 성능 최적화가 적용되었는가?
- [ ] 테스트 코드가 작성되었는가?
- [ ] 문서화가 충분한가?