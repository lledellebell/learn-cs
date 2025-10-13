---
title: Compound Pattern
date: 2025-10-02
last_modified_at: 2025-10-13
layout: page
---
# Compound Pattern

**Compound Pattern**은 React에서 여러 컴포넌트가 함께 작동하여 하나의 완전한 기능을 제공하는 디자인 패턴입니다. 각 컴포넌트는 독립적으로 사용할 수 있지만, 함께 사용될 때 더 강력한 기능을 발휘합니다.

## 특징

### 1. **암묵적 상태 공유**
- 부모 컴포넌트가 상태를 관리하고 자식 컴포넌트들이 이를 공유
- React Context API를 통한 상태 전달이 일반적

### 2. **유연한 조합**
- 자식 컴포넌트들의 순서와 조합을 자유롭게 변경 가능
- 필요한 컴포넌트만 선택적으로 사용 가능

### 3. **명시적 API**
- 각 서브 컴포넌트가 명확한 역할과 책임을 가짐
- 컴포넌트 이름만으로도 기능을 쉽게 파악 가능

## 기본 구조

```ts
// 기본 패턴 구조
<ParentComponent>
  <ParentComponent.SubComponent1 />
  <ParentComponent.SubComponent2 />
  <ParentComponent.SubComponent3 />
</ParentComponent>
```

## 구현 방법

### 1. **Context API 활용**

```ts
// Context 생성
const AccordionContext = createContext();

// 부모 컴포넌트
const Accordion = ({ children, ...props }) => {
  const [openIndex, setOpenIndex] = useState(null);
  
  const contextValue = {
    openIndex,
    setOpenIndex
  };
  
  return (
    <AccordionContext.Provider value={contextValue}>
      <div className="accordion" {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
};

// 서브 컴포넌트들
const AccordionItem = ({ children, index }) => {
  const { openIndex } = useContext(AccordionContext);
  const isOpen = openIndex === index;
  
  return (
    <div className={`accordion-item ${isOpen ? 'open' : ''}`}>
      {children}
    </div>
  );
};

const AccordionHeader = ({ children, index }) => {
  const { setOpenIndex, openIndex } = useContext(AccordionContext);
  
  const handleClick = () => {
    setOpenIndex(openIndex === index ? null : index);
  };
  
  return (
    <button className="accordion-header" onClick={handleClick}>
      {children}
    </button>
  );
};

const AccordionPanel = ({ children }) => {
  return (
    <div className="accordion-panel">
      {children}
    </div>
  );
};

// 서브 컴포넌트 연결
Accordion.Item = AccordionItem;
Accordion.Header = AccordionHeader;
Accordion.Panel = AccordionPanel;
```

### 2. **사용 예시**

```ts
// 유연한 조합 가능
<Accordion>
  <Accordion.Item index={0}>
    <Accordion.Header index={0}>
      첫 번째 섹션
    </Accordion.Header>
    <Accordion.Panel>
      첫 번째 내용입니다.
    </Accordion.Panel>
  </Accordion.Item>
  
  <Accordion.Item index={1}>
    <Accordion.Header index={1}>
      두 번째 섹션
    </Accordion.Header>
    <Accordion.Panel>
      두 번째 내용입니다.
    </Accordion.Panel>
  </Accordion.Item>
</Accordion>
```

## 실제 사용 사례

### 1. **Modal 컴포넌트**

```ts
<Modal>
  <Modal.Header>
    <Modal.Title>제목</Modal.Title>
    <Modal.CloseButton />
  </Modal.Header>
  <Modal.Body>
    내용
  </Modal.Body>
  <Modal.Footer>
    <Modal.CancelButton />
    <Modal.ConfirmButton />
  </Modal.Footer>
</Modal>
```

### 2. **Card 컴포넌트**

```ts
<Card>
  <Card.Image src="..." alt="..." />
  <Card.Body>
    <Card.Title>카드 제목</Card.Title>
    <Card.Description>카드 설명</Card.Description>
  </Card.Body>
  <Card.Footer>
    <Card.Button>액션</Card.Button>
  </Card.Footer>
</Card>
```

### 3. **Form 컴포넌트**

```ts
<Form>
  <Form.Field>
    <Form.Label>이름</Form.Label>
    <Form.Input name="name" />
    <Form.Error field="name" />
  </Form.Field>
  <Form.Field>
    <Form.Label>이메일</Form.Label>
    <Form.Input name="email" type="email" />
    <Form.Error field="email" />
  </Form.Field>
  <Form.Submit>제출</Form.Submit>
</Form>
```

## 장점

### 1. **높은 유연성**
- 컴포넌트 조합을 자유롭게 변경 가능
- 필요한 부분만 선택적으로 사용

### 2. **명확한 API**
- 각 컴포넌트의 역할이 명확
- 코드 가독성 향상

### 3. **재사용성**
- 서브 컴포넌트들을 다른 맥락에서도 활용 가능
- 확장성이 뛰어남

### 4. **관심사 분리**
- 각 컴포넌트가 단일 책임을 가짐
- 유지보수가 용이

## 단점

### 1. **복잡성 증가**
- 초기 설정이 복잡할 수 있음
- Context API 사용으로 인한 성능 고려사항

### 2. **잘못된 사용 가능성**
- 개발자가 잘못된 조합을 만들 수 있음
- 필수 컴포넌트 누락 위험

### 3. **타입 안전성**
- TypeScript에서 타입 정의가 복잡할 수 있음
- 런타임 에러 가능성

## 사용 시기

### 적합한 경우
- **복잡한 UI 컴포넌트**: Modal, Accordion, Dropdown 등
- **높은 커스터마이징 필요**: 다양한 조합이 필요한 경우
- **재사용성 중요**: 여러 곳에서 다르게 사용되는 컴포넌트

### 부적합한 경우
- **단순한 컴포넌트**: 기본 Button, Input 등
- **고정된 구조**: 항상 같은 형태로 사용되는 컴포넌트
- **성능이 중요**: Context 사용으로 인한 리렌더링 우려

## 모범 사례

### 1. **명확한 네이밍**
```ts
// 좋은 예
<Card.Header />
<Card.Body />
<Card.Footer />

// 나쁜 예
<Card.Top />
<Card.Middle />
<Card.Bottom />
```

### 2. **타입 안전성 확보**
```ts
interface CardProps {
  children: React.ReactNode;
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
}

const Card: React.FC<CardProps> & {
  Header: React.FC<CardHeaderProps>;
  Body: React.FC<CardProps>;
  Footer: React.FC<CardProps>;
} = ({ children }) => {
  return <div className="card">{children}</div>;
};
```

### 3. **기본값 제공**
```ts
const Modal = ({ children, isOpen = false, onClose }) => {
  // 기본 동작 제공
  const handleEscapeKey = useCallback((e) => {
    if (e.key === 'Escape') onClose?.();
  }, [onClose]);
  
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [isOpen, handleEscapeKey]);
  
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};
```

## 참고 자료

### 공식 문서
- [React Patterns - Compound Components](https://react-patterns.com/#compound-components)
- [React Context API](https://react.dev/reference/react/createContext)

### 아티클
- [Kent C. Dodds - Compound Components](https://kentcdodds.com/blog/compound-components-with-react-hooks)
- [Advanced React Patterns](https://advanced-react-patterns.netlify.app/)
- [React Compound Component Pattern](https://blog.logrocket.com/understanding-react-compound-components/)

### 라이브러리 예시
- [Reach UI](https://reach.tech/) - 접근성을 고려한 Compound 패턴 구현
- [Headless UI](https://headlessui.dev/) - 스타일 없는 Compound 컴포넌트
- [Ariakit](https://ariakit.org/) - 현대적인 Compound 패턴 구현

### 블로그 포스트
- [Compound Components in React](https://www.smashingmagazine.com/2021/08/compound-components-react/)
- [Building Flexible Components](https://epicreact.dev/compound-components/)
- [React Design Patterns](https://www.patterns.dev/posts/compound-pattern/)
