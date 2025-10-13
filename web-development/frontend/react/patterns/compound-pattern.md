---
title: Compound Pattern
date: 2025-10-02
last_modified_at: 2025-10-13
layout: page
---
# Compound Pattern

Select와 Option 컴포넌트를 본 적 있나요? 아니면 HTML의 `<table>`, `<tr>`, `<td>`처럼 함께 사용해야 의미가 있는 요소들을 떠올려보세요. React의 **Compound Pattern**은 바로 이런 방식으로 작동하는 컴포넌트들을 만드는 디자인 패턴입니다.

저는 처음 이 패턴을 접했을 때, "이게 정말 필요한가?"라는 의문이 들었습니다. 단순히 props를 전달하는 것만으로도 충분하지 않을까 생각했죠. 하지만 복잡한 UI 라이브러리를 만들면서 이 패턴의 진가를 깨달았습니다. 특히 Accordion, Tabs, Dropdown 같은 컴포넌트를 구현할 때 Compound Pattern은 유연성과 명확성을 동시에 제공했습니다.

## 왜 Compound Pattern이 필요한가?

### 실제 문제 상황

여러분이 재사용 가능한 Modal 컴포넌트를 만든다고 상상해보세요. 처음에는 이렇게 시작할 겁니다:

```tsx
// 초기 버전 - props만 사용
<Modal
  title="제목"
  content="내용"
  footer="푸터"
  onClose={handleClose}
/>
```

하지만 곧 다양한 요구사항이 생깁니다:
- "제목에 아이콘을 넣고 싶어요"
- "푸터에 버튼을 3개 넣고 싶어요"
- "제목과 닫기 버튼 사이에 검색창을 넣고 싶어요"
- "본문에 탭을 넣고 싶어요"

이제 Modal은 이렇게 변합니다:

```tsx
// 점점 복잡해지는 props
<Modal
  title="제목"
  titleIcon={<SearchIcon />}
  headerExtra={<SearchBar />}
  content="내용"
  footer="푸터"
  footerButtons={[button1, button2, button3]}
  footerAlign="right"
  showCloseButton={true}
  closeButtonPosition="top-right"
  onClose={handleClose}
/>
```

이런 식으로 계속 props를 추가하다 보면:
- Props가 무한정 늘어남
- 컴포넌트 내부 로직이 복잡해짐
- 새로운 요구사항마다 코드 수정 필요
- 타입 정의가 지옥이 됨

### Compound Pattern의 해결책

Compound Pattern을 사용하면 이렇게 바뀝니다:

```tsx
// 유연하고 명확한 구조
<Modal isOpen={isOpen} onClose={handleClose}>
  <Modal.Header>
    <SearchIcon />
    <Modal.Title>제목</Modal.Title>
    <SearchBar />
    <Modal.CloseButton />
  </Modal.Header>

  <Modal.Body>
    <Tabs>
      <Tabs.Tab>첫 번째 탭</Tabs.Tab>
      <Tabs.Tab>두 번째 탭</Tabs.Tab>
    </Tabs>
  </Modal.Body>

  <Modal.Footer align="right">
    <Button>취소</Button>
    <Button>저장</Button>
    <Button variant="primary">확인</Button>
  </Modal.Footer>
</Modal>
```

이제 다음이 가능합니다:
- **무한한 유연성**: 원하는 대로 조합 가능
- **명확한 구조**: 코드만 봐도 UI 구조가 보임
- **확장 가능**: 새로운 요구사항에 코드 수정 없이 대응
- **재사용성**: 각 서브 컴포넌트를 독립적으로 사용 가능

## Compound Pattern의 핵심 개념

### 1. 암묵적 상태 공유 (Implicit State Sharing)

자식 컴포넌트들이 부모의 상태를 명시적인 props 전달 없이 공유합니다. 이는 React Context API를 통해 구현됩니다.

```tsx
// 부모 컴포넌트에서 상태 관리
const Tabs = ({ children }) => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
};

// 자식 컴포넌트에서 props 없이 상태 접근
const TabPanel = ({ index, children }) => {
  const { activeTab } = useContext(TabsContext); // Context에서 직접 가져옴
  return activeTab === index ? <div>{children}</div> : null;
};
```

### 2. 유연한 조합 (Flexible Composition)

컴포넌트의 순서와 조합을 자유롭게 변경할 수 있습니다.

```tsx
// 패턴 1: 기본 구조
<Accordion>
  <Accordion.Item>
    <Accordion.Header>제목</Accordion.Header>
    <Accordion.Panel>내용</Accordion.Panel>
  </Accordion.Item>
</Accordion>

// 패턴 2: 커스텀 아이콘 추가
<Accordion>
  <Accordion.Item>
    <Accordion.Header>
      <CustomIcon />
      <span>제목</span>
    </Accordion.Header>
    <Accordion.Panel>내용</Accordion.Panel>
  </Accordion.Item>
</Accordion>

// 패턴 3: 조건부 렌더링
<Accordion>
  <Accordion.Item>
    <Accordion.Header>제목</Accordion.Header>
    {showDetails && <Accordion.Panel>내용</Accordion.Panel>}
  </Accordion.Item>
</Accordion>
```

### 3. 명시적 API (Explicit API)

각 서브 컴포넌트의 이름이 그 역할을 명확히 표현합니다.

```tsx
// 좋은 예 - 이름만 봐도 역할이 명확
<Card>
  <Card.Image />      // 이미지를 표시
  <Card.Title />      // 제목을 표시
  <Card.Description /> // 설명을 표시
  <Card.Actions />    // 액션 버튼들
</Card>

// 나쁜 예 - 역할이 불명확
<Card>
  <Card.Top />        // 무엇을 넣어야 하나?
  <Card.Content />    // 제목? 내용? 둘 다?
  <Card.Bottom />     // 어떤 요소가 들어가나?
</Card>
```

## 컴포넌트 관계 다이어그램

### 1. Context 기반 통신 구조

```
┌─────────────────────────────────────────┐
│         Parent Component                │
│  ┌───────────────────────────────────┐  │
│  │     Context Provider              │  │
│  │  (상태: isOpen, toggle, value)    │  │
│  └───────────────┬───────────────────┘  │
│                  │                       │
│         ┌────────┼────────┐             │
│         ↓        ↓         ↓             │
│   ┌─────────┐ ┌────────┐ ┌─────────┐   │
│   │ Child 1 │ │Child 2 │ │ Child 3 │   │
│   │(Header) │ │ (Body) │ │(Footer) │   │
│   └─────────┘ └────────┘ └─────────┘   │
│        ↑          ↑          ↑          │
│        └──────────┴──────────┘          │
│         Context Consumer                │
│      (상태를 읽고 업데이트)              │
└─────────────────────────────────────────┘
```

### 2. Accordion 컴포넌트 구조

```
Accordion (상태: openIndex)
│
├─ AccordionItem (index: 0)
│  ├─ AccordionHeader (toggle 함수 호출)
│  │  └─ "첫 번째 섹션" + Icon
│  │
│  └─ AccordionPanel (openIndex === 0 일 때 표시)
│     └─ "첫 번째 내용"
│
├─ AccordionItem (index: 1)
│  ├─ AccordionHeader (toggle 함수 호출)
│  │  └─ "두 번째 섹션" + Icon
│  │
│  └─ AccordionPanel (openIndex === 1 일 때 표시)
│     └─ "두 번째 내용"
│
└─ AccordionItem (index: 2)
   ├─ AccordionHeader (toggle 함수 호출)
   │  └─ "세 번째 섹션" + Icon
   │
   └─ AccordionPanel (openIndex === 2 일 때 표시)
      └─ "세 번째 내용"
```

### 3. 데이터 흐름 다이어그램

```
User Click
    ↓
AccordionHeader (index: 1)
    ↓
setOpenIndex(1) 호출
    ↓
Context 상태 업데이트
    ↓
모든 Consumer 리렌더링
    ↓
├─ AccordionItem (index: 0) → isOpen: false → 닫힘
├─ AccordionItem (index: 1) → isOpen: true  → 열림 ✓
└─ AccordionItem (index: 2) → isOpen: false → 닫힘
```

## 구현 방법

### 방법 1: Context API를 활용한 기본 구현

```tsx
import { createContext, useContext, useState, ReactNode } from 'react';

// 1. Context 타입 정의
interface AccordionContextType {
  openIndex: number | null;
  setOpenIndex: (index: number | null) => void;
}

// 2. Context 생성
const AccordionContext = createContext<AccordionContextType | undefined>(undefined);

// 3. Custom Hook으로 Context 사용 편의성 증가
function useAccordion() {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error('Accordion 컴포넌트 내부에서만 사용 가능합니다');
  }
  return context;
}

// 4. 부모 컴포넌트 - 상태 관리 및 Context 제공
interface AccordionProps {
  children: ReactNode;
  defaultIndex?: number | null;
  allowMultiple?: boolean;
}

const Accordion = ({ children, defaultIndex = null }: AccordionProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(defaultIndex);

  return (
    <AccordionContext.Provider value={{ openIndex, setOpenIndex }}>
      <div className="accordion">
        {children}
      </div>
    </AccordionContext.Provider>
  );
};

// 5. 서브 컴포넌트들 - Context를 소비하여 상태 공유
interface AccordionItemProps {
  children: ReactNode;
  index: number;
}

const AccordionItem = ({ children, index }: AccordionItemProps) => {
  const { openIndex } = useAccordion();
  const isOpen = openIndex === index;

  return (
    <div className={`accordion-item ${isOpen ? 'open' : ''}`}>
      {children}
    </div>
  );
};

interface AccordionHeaderProps {
  children: ReactNode;
  index: number;
}

const AccordionHeader = ({ children, index }: AccordionHeaderProps) => {
  const { setOpenIndex, openIndex } = useAccordion();

  const handleClick = () => {
    // 같은 항목 클릭 시 닫기, 다른 항목 클릭 시 열기
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <button
      className="accordion-header"
      onClick={handleClick}
      aria-expanded={openIndex === index}
    >
      {children}
      <span className="icon">{openIndex === index ? '▲' : '▼'}</span>
    </button>
  );
};

interface AccordionPanelProps {
  children: ReactNode;
  index: number;
}

const AccordionPanel = ({ children, index }: AccordionPanelProps) => {
  const { openIndex } = useAccordion();

  if (openIndex !== index) return null;

  return (
    <div className="accordion-panel">
      {children}
    </div>
  );
};

// 6. 서브 컴포넌트를 부모에 연결 (Compound Component 패턴의 핵심)
Accordion.Item = AccordionItem;
Accordion.Header = AccordionHeader;
Accordion.Panel = AccordionPanel;

export default Accordion;
```

### 방법 2: 고급 구현 - Multiple Open 지원

```tsx
import { createContext, useContext, useState, ReactNode } from 'react';

interface AccordionContextType {
  openIndexes: number[];
  toggleIndex: (index: number) => void;
  allowMultiple: boolean;
}

const AccordionContext = createContext<AccordionContextType | undefined>(undefined);

function useAccordion() {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error('Accordion 컴포넌트 내부에서만 사용 가능합니다');
  }
  return context;
}

interface AccordionProps {
  children: ReactNode;
  defaultIndexes?: number[];
  allowMultiple?: boolean; // 여러 패널을 동시에 열 수 있는지
}

const Accordion = ({
  children,
  defaultIndexes = [],
  allowMultiple = false
}: AccordionProps) => {
  const [openIndexes, setOpenIndexes] = useState<number[]>(defaultIndexes);

  const toggleIndex = (index: number) => {
    setOpenIndexes(prev => {
      if (allowMultiple) {
        // 다중 선택 모드: 배열에 추가/제거
        return prev.includes(index)
          ? prev.filter(i => i !== index)
          : [...prev, index];
      } else {
        // 단일 선택 모드: 하나만 유지
        return prev.includes(index) ? [] : [index];
      }
    });
  };

  return (
    <AccordionContext.Provider value={{ openIndexes, toggleIndex, allowMultiple }}>
      <div className="accordion" role="region">
        {children}
      </div>
    </AccordionContext.Provider>
  );
};

const AccordionItem = ({ children, index }: { children: ReactNode; index: number }) => {
  const { openIndexes } = useAccordion();
  const isOpen = openIndexes.includes(index);

  return (
    <div className={`accordion-item ${isOpen ? 'open' : ''}`}>
      {children}
    </div>
  );
};

const AccordionHeader = ({ children, index }: { children: ReactNode; index: number }) => {
  const { toggleIndex, openIndexes } = useAccordion();
  const isOpen = openIndexes.includes(index);

  return (
    <button
      className="accordion-header"
      onClick={() => toggleIndex(index)}
      aria-expanded={isOpen}
    >
      {children}
      <span className="icon">{isOpen ? '▲' : '▼'}</span>
    </button>
  );
};

const AccordionPanel = ({ children, index }: { children: ReactNode; index: number }) => {
  const { openIndexes } = useAccordion();
  const isOpen = openIndexes.includes(index);

  return (
    <div
      className={`accordion-panel ${isOpen ? 'visible' : 'hidden'}`}
      role="region"
      aria-hidden={!isOpen}
    >
      {children}
    </div>
  );
};

Accordion.Item = AccordionItem;
Accordion.Header = AccordionHeader;
Accordion.Panel = AccordionPanel;

export default Accordion;
```

### 사용 예시

```tsx
// 기본 사용 (단일 선택)
<Accordion defaultIndexes={[0]}>
  <Accordion.Item index={0}>
    <Accordion.Header index={0}>
      첫 번째 섹션
    </Accordion.Header>
    <Accordion.Panel index={0}>
      첫 번째 내용입니다.
    </Accordion.Panel>
  </Accordion.Item>

  <Accordion.Item index={1}>
    <Accordion.Header index={1}>
      두 번째 섹션
    </Accordion.Header>
    <Accordion.Panel index={1}>
      두 번째 내용입니다.
    </Accordion.Panel>
  </Accordion.Item>
</Accordion>

// 다중 선택 모드
<Accordion allowMultiple defaultIndexes={[0, 2]}>
  <Accordion.Item index={0}>
    <Accordion.Header index={0}>FAQ 1</Accordion.Header>
    <Accordion.Panel index={0}>답변 1</Accordion.Panel>
  </Accordion.Item>

  <Accordion.Item index={1}>
    <Accordion.Header index={1}>FAQ 2</Accordion.Header>
    <Accordion.Panel index={1}>답변 2</Accordion.Panel>
  </Accordion.Item>

  <Accordion.Item index={2}>
    <Accordion.Header index={2}>FAQ 3</Accordion.Header>
    <Accordion.Panel index={2}>답변 3</Accordion.Panel>
  </Accordion.Item>
</Accordion>
```

## 실전 예제: 6가지 필수 컴포넌트

### 1. Select / Dropdown 컴포넌트

HTML의 `<select>`와 `<option>`처럼 작동하는 커스텀 드롭다운입니다.

```tsx
import { createContext, useContext, useState, ReactNode, useRef, useEffect } from 'react';

interface SelectContextType {
  value: string;
  isOpen: boolean;
  toggle: () => void;
  selectOption: (value: string) => void;
}

const SelectContext = createContext<SelectContextType | undefined>(undefined);

function useSelect() {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error('Select 컴포넌트 내부에서만 사용 가능합니다');
  }
  return context;
}

interface SelectProps {
  children: ReactNode;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

const Select = ({ children, value: controlledValue, onChange, placeholder = '선택하세요' }: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState('');
  const selectRef = useRef<HTMLDivElement>(null);

  const value = controlledValue ?? internalValue;

  const toggle = () => setIsOpen(prev => !prev);

  const selectOption = (newValue: string) => {
    setInternalValue(newValue);
    onChange?.(newValue);
    setIsOpen(false);
  };

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <SelectContext.Provider value={{ value, isOpen, toggle, selectOption }}>
      <div className="select-container" ref={selectRef}>
        {children}
      </div>
    </SelectContext.Provider>
  );
};

const SelectTrigger = ({ children }: { children?: ReactNode }) => {
  const { isOpen, toggle, value } = useSelect();

  return (
    <button
      className={`select-trigger ${isOpen ? 'open' : ''}`}
      onClick={toggle}
      aria-haspopup="listbox"
      aria-expanded={isOpen}
    >
      {children || value || '선택하세요'}
      <span className="arrow">{isOpen ? '▲' : '▼'}</span>
    </button>
  );
};

const SelectContent = ({ children }: { children: ReactNode }) => {
  const { isOpen } = useSelect();

  if (!isOpen) return null;

  return (
    <div className="select-content" role="listbox">
      {children}
    </div>
  );
};

interface SelectOptionProps {
  value: string;
  children: ReactNode;
}

const SelectOption = ({ value, children }: SelectOptionProps) => {
  const { selectOption, value: selectedValue } = useSelect();
  const isSelected = selectedValue === value;

  return (
    <div
      className={`select-option ${isSelected ? 'selected' : ''}`}
      onClick={() => selectOption(value)}
      role="option"
      aria-selected={isSelected}
    >
      {children}
      {isSelected && <span className="check">✓</span>}
    </div>
  );
};

Select.Trigger = SelectTrigger;
Select.Content = SelectContent;
Select.Option = SelectOption;

// 사용 예시
function App() {
  const [fruit, setFruit] = useState('');

  return (
    <Select value={fruit} onChange={setFruit}>
      <Select.Trigger />
      <Select.Content>
        <Select.Option value="apple">사과 🍎</Select.Option>
        <Select.Option value="banana">바나나 🍌</Select.Option>
        <Select.Option value="orange">오렌지 🍊</Select.Option>
        <Select.Option value="grape">포도 🍇</Select.Option>
      </Select.Content>
    </Select>
  );
}
```

### 2. Tabs 컴포넌트

탭 네비게이션을 구현하는 컴포넌트입니다.

```tsx
import { createContext, useContext, useState, ReactNode } from 'react';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

function useTabs() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs 컴포넌트 내부에서만 사용 가능합니다');
  }
  return context;
}

interface TabsProps {
  children: ReactNode;
  defaultTab?: string;
}

const Tabs = ({ children, defaultTab }: TabsProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab || '');

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs">
        {children}
      </div>
    </TabsContext.Provider>
  );
};

const TabList = ({ children }: { children: ReactNode }) => {
  return (
    <div className="tab-list" role="tablist">
      {children}
    </div>
  );
};

interface TabProps {
  value: string;
  children: ReactNode;
  disabled?: boolean;
}

const Tab = ({ value, children, disabled = false }: TabProps) => {
  const { activeTab, setActiveTab } = useTabs();
  const isActive = activeTab === value;

  return (
    <button
      className={`tab ${isActive ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={() => !disabled && setActiveTab(value)}
      role="tab"
      aria-selected={isActive}
      aria-disabled={disabled}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

interface TabPanelProps {
  value: string;
  children: ReactNode;
}

const TabPanel = ({ value, children }: TabPanelProps) => {
  const { activeTab } = useTabs();

  if (activeTab !== value) return null;

  return (
    <div className="tab-panel" role="tabpanel">
      {children}
    </div>
  );
};

Tabs.List = TabList;
Tabs.Tab = Tab;
Tabs.Panel = TabPanel;

// 사용 예시
function ProductDetailPage() {
  return (
    <Tabs defaultTab="description">
      <Tabs.List>
        <Tabs.Tab value="description">상품 설명</Tabs.Tab>
        <Tabs.Tab value="reviews">리뷰 (123)</Tabs.Tab>
        <Tabs.Tab value="qna">Q&A</Tabs.Tab>
        <Tabs.Tab value="shipping">배송 정보</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="description">
        <h3>상품 상세 설명</h3>
        <p>이 상품은...</p>
      </Tabs.Panel>

      <Tabs.Panel value="reviews">
        <h3>고객 리뷰</h3>
        <ReviewList />
      </Tabs.Panel>

      <Tabs.Panel value="qna">
        <h3>자주 묻는 질문</h3>
        <QnAList />
      </Tabs.Panel>

      <Tabs.Panel value="shipping">
        <h3>배송 및 반품 안내</h3>
        <ShippingInfo />
      </Tabs.Panel>
    </Tabs>
  );
}
```

### 3. Modal 컴포넌트

접근성을 고려한 모달 다이얼로그입니다.

```tsx
import { createContext, useContext, useEffect, ReactNode, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface ModalContextType {
  isOpen: boolean;
  onClose: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('Modal 컴포넌트 내부에서만 사용 가능합니다');
  }
  return context;
}

interface ModalProps {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
}

const Modal = ({ children, isOpen, onClose }: ModalProps) => {
  // ESC 키로 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // body 스크롤 방지
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <ModalContext.Provider value={{ isOpen, onClose }}>
      <div className="modal-overlay" onClick={onClose}>
        <div
          className="modal-content"
          onClick={e => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          {children}
        </div>
      </div>
    </ModalContext.Provider>,
    document.body
  );
};

const ModalHeader = ({ children }: { children: ReactNode }) => {
  return (
    <div className="modal-header">
      {children}
    </div>
  );
};

const ModalTitle = ({ children }: { children: ReactNode }) => {
  return <h2 className="modal-title">{children}</h2>;
};

const ModalCloseButton = () => {
  const { onClose } = useModal();

  return (
    <button
      className="modal-close-button"
      onClick={onClose}
      aria-label="닫기"
    >
      ✕
    </button>
  );
};

const ModalBody = ({ children }: { children: ReactNode }) => {
  return <div className="modal-body">{children}</div>;
};

const ModalFooter = ({ children }: { children: ReactNode }) => {
  return <div className="modal-footer">{children}</div>;
};

Modal.Header = ModalHeader;
Modal.Title = ModalTitle;
Modal.CloseButton = ModalCloseButton;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;

// 사용 예시
function DeleteConfirmModal() {
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async () => {
    await deleteItem();
    setIsOpen(false);
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>삭제</button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <Modal.Header>
          <Modal.Title>정말 삭제하시겠습니까?</Modal.Title>
          <Modal.CloseButton />
        </Modal.Header>

        <Modal.Body>
          <p>이 작업은 되돌릴 수 없습니다.</p>
          <p>정말로 삭제하시겠습니까?</p>
        </Modal.Body>

        <Modal.Footer>
          <button onClick={() => setIsOpen(false)}>취소</button>
          <button onClick={handleDelete} className="danger">
            삭제
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
```

### 4. Card 컴포넌트

다양한 레이아웃을 지원하는 카드 컴포넌트입니다.

```tsx
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  onClick?: () => void;
}

const Card = ({ children, variant = 'default', onClick }: CardProps) => {
  return (
    <div
      className={`card card-${variant} ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

const CardImage = ({ src, alt }: { src: string; alt: string }) => {
  return (
    <div className="card-image">
      <img src={src} alt={alt} />
    </div>
  );
};

const CardHeader = ({ children }: { children: ReactNode }) => {
  return <div className="card-header">{children}</div>;
};

const CardTitle = ({ children }: { children: ReactNode }) => {
  return <h3 className="card-title">{children}</h3>;
};

const CardSubtitle = ({ children }: { children: ReactNode }) => {
  return <p className="card-subtitle">{children}</p>;
};

const CardBody = ({ children }: { children: ReactNode }) => {
  return <div className="card-body">{children}</div>;
};

const CardDescription = ({ children }: { children: ReactNode }) => {
  return <p className="card-description">{children}</p>;
};

const CardFooter = ({ children }: { children: ReactNode }) => {
  return <div className="card-footer">{children}</div>;
};

const CardActions = ({ children }: { children: ReactNode }) => {
  return <div className="card-actions">{children}</div>;
};

Card.Image = CardImage;
Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Subtitle = CardSubtitle;
Card.Body = CardBody;
Card.Description = CardDescription;
Card.Footer = CardFooter;
Card.Actions = CardActions;

// 사용 예시 1: 블로그 카드
function BlogCard({ post }) {
  return (
    <Card variant="elevated">
      <Card.Image src={post.thumbnail} alt={post.title} />
      <Card.Body>
        <Card.Title>{post.title}</Card.Title>
        <Card.Subtitle>{post.author} · {post.date}</Card.Subtitle>
        <Card.Description>{post.excerpt}</Card.Description>
      </Card.Body>
      <Card.Footer>
        <Card.Actions>
          <button>읽기</button>
          <button>저장</button>
        </Card.Actions>
      </Card.Footer>
    </Card>
  );
}

// 사용 예시 2: 상품 카드
function ProductCard({ product }) {
  return (
    <Card variant="outlined" onClick={() => navigate(`/products/${product.id}`)}>
      <Card.Image src={product.image} alt={product.name} />
      <Card.Body>
        <Card.Title>{product.name}</Card.Title>
        <Card.Description>{product.description}</Card.Description>
      </Card.Body>
      <Card.Footer>
        <div className="price">{product.price.toLocaleString()}원</div>
        <button>장바구니</button>
      </Card.Footer>
    </Card>
  );
}

// 사용 예시 3: 프로필 카드
function ProfileCard({ user }) {
  return (
    <Card>
      <Card.Header>
        <img src={user.avatar} alt={user.name} className="avatar" />
        <Card.Title>{user.name}</Card.Title>
        <Card.Subtitle>@{user.username}</Card.Subtitle>
      </Card.Header>
      <Card.Body>
        <Card.Description>{user.bio}</Card.Description>
        <div className="stats">
          <span>팔로워 {user.followers}</span>
          <span>팔로잉 {user.following}</span>
        </div>
      </Card.Body>
      <Card.Footer>
        <button>팔로우</button>
        <button>메시지</button>
      </Card.Footer>
    </Card>
  );
}
```

### 5. Form 컴포넌트

유효성 검증을 포함한 폼 컴포넌트입니다.

```tsx
import { createContext, useContext, useState, FormEvent, ReactNode } from 'react';

interface FormContextType {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  handleChange: (name: string, value: any) => void;
  handleBlur: (name: string) => void;
  setError: (name: string, error: string) => void;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

function useForm() {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('Form 컴포넌트 내부에서만 사용 가능합니다');
  }
  return context;
}

interface FormProps {
  children: ReactNode;
  onSubmit: (values: Record<string, any>) => void;
  initialValues?: Record<string, any>;
}

const Form = ({ children, onSubmit, initialValues = {} }: FormProps) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = (name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    // 에러 초기화
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const setError = (name: string, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // 모든 필드를 touched로 표시
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setTouched(allTouched);

    // 에러가 없으면 submit
    if (Object.keys(errors).length === 0) {
      onSubmit(values);
    }
  };

  return (
    <FormContext.Provider value={{ values, errors, touched, handleChange, handleBlur, setError }}>
      <form onSubmit={handleSubmit} className="form">
        {children}
      </form>
    </FormContext.Provider>
  );
};

const FormField = ({ children }: { children: ReactNode }) => {
  return <div className="form-field">{children}</div>;
};

const FormLabel = ({ htmlFor, children }: { htmlFor: string; children: ReactNode }) => {
  return (
    <label htmlFor={htmlFor} className="form-label">
      {children}
    </label>
  );
};

interface FormInputProps {
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  validate?: (value: any) => string | undefined;
}

const FormInput = ({ name, type = 'text', placeholder, required, validate }: FormInputProps) => {
  const { values, errors, touched, handleChange, handleBlur, setError } = useForm();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    handleChange(name, value);

    // 실시간 유효성 검증
    if (validate) {
      const error = validate(value);
      if (error) {
        setError(name, error);
      }
    }
  };

  const showError = touched[name] && errors[name];

  return (
    <input
      id={name}
      name={name}
      type={type}
      value={values[name] || ''}
      onChange={handleInputChange}
      onBlur={() => handleBlur(name)}
      placeholder={placeholder}
      required={required}
      className={`form-input ${showError ? 'error' : ''}`}
      aria-invalid={!!showError}
      aria-describedby={showError ? `${name}-error` : undefined}
    />
  );
};

const FormTextarea = ({ name, placeholder, rows = 4 }: { name: string; placeholder?: string; rows?: number }) => {
  const { values, handleChange, handleBlur } = useForm();

  return (
    <textarea
      id={name}
      name={name}
      value={values[name] || ''}
      onChange={(e) => handleChange(name, e.target.value)}
      onBlur={() => handleBlur(name)}
      placeholder={placeholder}
      rows={rows}
      className="form-textarea"
    />
  );
};

const FormError = ({ name }: { name: string }) => {
  const { errors, touched } = useForm();

  if (!touched[name] || !errors[name]) return null;

  return (
    <span id={`${name}-error`} className="form-error" role="alert">
      {errors[name]}
    </span>
  );
};

const FormSubmit = ({ children }: { children: ReactNode }) => {
  return (
    <button type="submit" className="form-submit">
      {children}
    </button>
  );
};

Form.Field = FormField;
Form.Label = FormLabel;
Form.Input = FormInput;
Form.Textarea = FormTextarea;
Form.Error = FormError;
Form.Submit = FormSubmit;

// 사용 예시
function SignupForm() {
  const handleSubmit = (values: Record<string, any>) => {
    console.log('제출된 값:', values);
    // API 호출 등
  };

  const validateEmail = (email: string) => {
    if (!email) return '이메일을 입력하세요';
    if (!/\S+@\S+\.\S+/.test(email)) return '올바른 이메일 형식이 아닙니다';
  };

  const validatePassword = (password: string) => {
    if (!password) return '비밀번호를 입력하세요';
    if (password.length < 8) return '비밀번호는 최소 8자 이상이어야 합니다';
  };

  return (
    <Form onSubmit={handleSubmit} initialValues={{ name: '', email: '', password: '' }}>
      <Form.Field>
        <Form.Label htmlFor="name">이름</Form.Label>
        <Form.Input
          name="name"
          placeholder="홍길동"
          required
        />
        <Form.Error name="name" />
      </Form.Field>

      <Form.Field>
        <Form.Label htmlFor="email">이메일</Form.Label>
        <Form.Input
          name="email"
          type="email"
          placeholder="example@email.com"
          validate={validateEmail}
          required
        />
        <Form.Error name="email" />
      </Form.Field>

      <Form.Field>
        <Form.Label htmlFor="password">비밀번호</Form.Label>
        <Form.Input
          name="password"
          type="password"
          placeholder="8자 이상"
          validate={validatePassword}
          required
        />
        <Form.Error name="password" />
      </Form.Field>

      <Form.Field>
        <Form.Label htmlFor="bio">자기소개</Form.Label>
        <Form.Textarea name="bio" placeholder="간단히 소개해주세요" />
      </Form.Field>

      <Form.Submit>가입하기</Form.Submit>
    </Form>
  );
}
```

### 6. Menu / Dropdown Menu 컴포넌트

컨텍스트 메뉴나 드롭다운 메뉴를 구현하는 컴포넌트입니다.

```tsx
import { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';

interface MenuContextType {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

function useMenu() {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('Menu 컴포넌트 내부에서만 사용 가능합니다');
  }
  return context;
}

interface MenuProps {
  children: ReactNode;
}

const Menu = ({ children }: MenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggle = () => setIsOpen(prev => !prev);
  const close = () => setIsOpen(false);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        close();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <MenuContext.Provider value={{ isOpen, toggle, close }}>
      <div className="menu" ref={menuRef}>
        {children}
      </div>
    </MenuContext.Provider>
  );
};

const MenuButton = ({ children }: { children: ReactNode }) => {
  const { toggle } = useMenu();

  return (
    <button
      className="menu-button"
      onClick={toggle}
      aria-haspopup="true"
    >
      {children}
    </button>
  );
};

const MenuList = ({ children }: { children: ReactNode }) => {
  const { isOpen } = useMenu();

  if (!isOpen) return null;

  return (
    <div className="menu-list" role="menu">
      {children}
    </div>
  );
};

interface MenuItemProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
}

const MenuItem = ({ children, onClick, disabled = false, danger = false }: MenuItemProps) => {
  const { close } = useMenu();

  const handleClick = () => {
    if (!disabled) {
      onClick?.();
      close();
    }
  };

  return (
    <button
      className={`menu-item ${disabled ? 'disabled' : ''} ${danger ? 'danger' : ''}`}
      onClick={handleClick}
      disabled={disabled}
      role="menuitem"
    >
      {children}
    </button>
  );
};

const MenuDivider = () => {
  return <div className="menu-divider" role="separator" />;
};

const MenuGroup = ({ children, label }: { children: ReactNode; label?: string }) => {
  return (
    <div className="menu-group" role="group">
      {label && <div className="menu-group-label">{label}</div>}
      {children}
    </div>
  );
};

Menu.Button = MenuButton;
Menu.List = MenuList;
Menu.Item = MenuItem;
Menu.Divider = MenuDivider;
Menu.Group = MenuGroup;

// 사용 예시 1: 사용자 프로필 메뉴
function UserProfileMenu() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  return (
    <Menu>
      <Menu.Button>
        <img src="/avatar.jpg" alt="프로필" />
      </Menu.Button>

      <Menu.List>
        <Menu.Item onClick={() => navigate('/profile')}>
          👤 내 프로필
        </Menu.Item>
        <Menu.Item onClick={() => navigate('/settings')}>
          ⚙️ 설정
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item onClick={() => navigate('/help')}>
          ❓ 도움말
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item onClick={logout} danger>
          🚪 로그아웃
        </Menu.Item>
      </Menu.List>
    </Menu>
  );
}

// 사용 예시 2: 컨텍스트 메뉴
function FileContextMenu({ file }) {
  const { duplicateFile, deleteFile, renameFile } = useFileActions();

  return (
    <Menu>
      <Menu.Button>⋮</Menu.Button>

      <Menu.List>
        <Menu.Group label="편집">
          <Menu.Item onClick={() => renameFile(file.id)}>
            ✏️ 이름 바꾸기
          </Menu.Item>
          <Menu.Item onClick={() => duplicateFile(file.id)}>
            📋 복제
          </Menu.Item>
        </Menu.Group>

        <Menu.Divider />

        <Menu.Group label="공유">
          <Menu.Item onClick={() => shareFile(file.id)}>
            🔗 링크 복사
          </Menu.Item>
          <Menu.Item onClick={() => downloadFile(file.id)}>
            📥 다운로드
          </Menu.Item>
        </Menu.Group>

        <Menu.Divider />

        <Menu.Item onClick={() => deleteFile(file.id)} danger>
          🗑️ 삭제
        </Menu.Item>
      </Menu.List>
    </Menu>
  );
}
```

## 함정과 주의사항

제가 Compound Pattern을 사용하면서 실제로 겪었던 문제들과 해결 방법을 공유합니다.

### 1. Context를 찾지 못하는 에러

**문제**: 서브 컴포넌트를 부모 컴포넌트 밖에서 사용하면 에러 발생

```tsx
// ❌ 잘못된 사용
function App() {
  return (
    <>
      <Accordion />
      <Accordion.Item index={0}>  // 에러! Context를 찾을 수 없음
        <Accordion.Header index={0}>제목</Accordion.Header>
      </Accordion.Item>
    </>
  );
}
```

**해결책**: Custom Hook에서 명확한 에러 메시지 제공

```tsx
function useAccordion() {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error(
      'Accordion 서브 컴포넌트는 Accordion 컴포넌트 내부에서만 사용할 수 있습니다.\n' +
      '올바른 사용: <Accordion><Accordion.Item>...</Accordion.Item></Accordion>'
    );
  }
  return context;
}
```

### 2. Props Drilling vs Context 성능

**문제**: Context를 사용하면 Provider의 value가 바뀔 때마다 모든 Consumer가 리렌더링됩니다.

```tsx
// ❌ 성능 문제: value 객체가 매번 새로 생성됨
const Accordion = ({ children }) => {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <AccordionContext.Provider value={{ openIndex, setOpenIndex }}>
      {children}
    </AccordionContext.Provider>
  );
};
```

**해결책 1**: useMemo로 value 메모이제이션

```tsx
// ✅ 개선: value를 메모이제이션
const Accordion = ({ children }) => {
  const [openIndex, setOpenIndex] = useState(null);

  const contextValue = useMemo(
    () => ({ openIndex, setOpenIndex }),
    [openIndex]
  );

  return (
    <AccordionContext.Provider value={contextValue}>
      {children}
    </AccordionContext.Provider>
  );
};
```

**해결책 2**: Context 분리

```tsx
// ✅ 더 나은 방법: 읽기와 쓰기 Context 분리
const AccordionStateContext = createContext();  // 읽기 전용
const AccordionDispatchContext = createContext(); // 쓰기 전용

const Accordion = ({ children }) => {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <AccordionStateContext.Provider value={openIndex}>
      <AccordionDispatchContext.Provider value={setOpenIndex}>
        {children}
      </AccordionDispatchContext.Provider>
    </AccordionStateContext.Provider>
  );
};

// 읽기만 필요한 컴포넌트
function AccordionPanel({ index, children }) {
  const openIndex = useContext(AccordionStateContext); // setOpenIndex 변경 시 리렌더링 안됨
  return openIndex === index ? <div>{children}</div> : null;
}

// 쓰기만 필요한 컴포넌트
function AccordionHeader({ index, children }) {
  const setOpenIndex = useContext(AccordionDispatchContext); // openIndex 변경 시 리렌더링 안됨
  return <button onClick={() => setOpenIndex(index)}>{children}</button>;
}
```

### 3. 타입스크립트 타입 정의의 어려움

**문제**: 서브 컴포넌트를 부모에 연결할 때 타입 정의가 복잡함

```tsx
// ❌ 타입 에러 발생
const Accordion = ({ children }: { children: ReactNode }) => {
  // ...
};

Accordion.Item = AccordionItem; // 타입 에러!
```

**해결책**: 올바른 타입 정의

```tsx
// ✅ 올바른 타입 정의
interface AccordionComponent extends React.FC<AccordionProps> {
  Item: React.FC<AccordionItemProps>;
  Header: React.FC<AccordionHeaderProps>;
  Panel: React.FC<AccordionPanelProps>;
}

const Accordion: AccordionComponent = ({ children }) => {
  // ...
} as AccordionComponent;

Accordion.Item = AccordionItem;
Accordion.Header = AccordionHeader;
Accordion.Panel = AccordionPanel;
```

### 4. 필수 컴포넌트 누락

**문제**: 사용자가 필수 서브 컴포넌트를 빠트릴 수 있음

```tsx
// ❌ Header가 없으면 작동하지 않음
<Accordion>
  <Accordion.Item index={0}>
    <Accordion.Panel>내용만 있음</Accordion.Panel>
  </Accordion.Item>
</Accordion>
```

**해결책 1**: children 검증

```tsx
const AccordionItem = ({ children, index }) => {
  // children 검증
  useEffect(() => {
    const childrenArray = React.Children.toArray(children);
    const hasHeader = childrenArray.some(
      child => React.isValidElement(child) && child.type === AccordionHeader
    );

    if (!hasHeader) {
      console.warn(`AccordionItem (index: ${index})에 AccordionHeader가 없습니다.`);
    }
  }, [children, index]);

  // ...
};
```

**해결책 2**: 명확한 문서화와 예시

```tsx
/**
 * Accordion 컴포넌트
 *
 * @example
 * // 올바른 사용법
 * <Accordion>
 *   <Accordion.Item index={0}>
 *     <Accordion.Header index={0}>필수!</Accordion.Header>
 *     <Accordion.Panel>내용</Accordion.Panel>
 *   </Accordion.Item>
 * </Accordion>
 *
 * @requires AccordionItem 내부에는 반드시 AccordionHeader가 있어야 합니다.
 */
```

### 5. index prop의 불편함

**문제**: 모든 서브 컴포넌트에 index를 전달하는 것이 번거로움

```tsx
// ❌ 반복적이고 에러 발생 가능
<Accordion>
  <Accordion.Item index={0}>
    <Accordion.Header index={0}>제목</Accordion.Header>  // index 중복
    <Accordion.Panel index={0}>내용</Accordion.Panel>
  </Accordion.Item>
</Accordion>
```

**해결책**: Context로 index 자동 전달

```tsx
// ✅ 개선: Item에서 Context로 index 제공
const AccordionItemContext = createContext<number>(0);

const AccordionItem = ({ children, index }) => {
  return (
    <AccordionItemContext.Provider value={index}>
      <div className="accordion-item">
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
};

const AccordionHeader = ({ children }) => {
  const index = useContext(AccordionItemContext); // 자동으로 index 가져옴
  const { setOpenIndex, openIndex } = useAccordion();

  return (
    <button onClick={() => setOpenIndex(openIndex === index ? null : index)}>
      {children}
    </button>
  );
};

// 이제 index를 반복해서 전달하지 않아도 됨!
<Accordion>
  <Accordion.Item index={0}>
    <Accordion.Header>제목</Accordion.Header>
    <Accordion.Panel>내용</Accordion.Panel>
  </Accordion.Item>
</Accordion>
```

### 6. 서브 컴포넌트의 순서 의존성

**문제**: 특정 순서로만 사용해야 하는 경우

```tsx
// ❌ 순서가 잘못됨
<Accordion.Item index={0}>
  <Accordion.Panel>내용</Accordion.Panel>
  <Accordion.Header>제목</Accordion.Header>  // Header가 아래에 있음
</Accordion.Item>
```

**해결책**: CSS나 로직으로 순서 무관하게 만들기

```tsx
// ✅ Flexbox로 순서 조정
.accordion-item {
  display: flex;
  flex-direction: column;
}

.accordion-header {
  order: 1; /* 항상 위에 표시 */
}

.accordion-panel {
  order: 2; /* 항상 아래에 표시 */
}
```

### 7. 중첩된 Compound Component

**문제**: Compound Component 안에 또 다른 Compound Component를 사용할 때 Context 충돌

```tsx
// ❌ Context 충돌 가능
<Tabs>
  <Tabs.Tab value="tab1">탭 1</Tabs.Tab>
  <Tabs.Panel value="tab1">
    <Tabs>  {/* 중첩된 Tabs */}
      <Tabs.Tab value="nested1">중첩 탭</Tabs.Tab>
    </Tabs>
  </Tabs.Panel>
</Tabs>
```

**해결책**: 고유한 Context 이름 사용

```tsx
// ✅ 각 레벨마다 독립적인 Context
const TabsContext = createContext();  // 자동으로 격리됨

// 또는 명시적으로 id 부여
const Tabs = ({ children, id }) => {
  const contextId = useId(); // React 18+
  // ...
};
```

## 실전 활용 가이드

### 언제 Compound Pattern을 사용해야 할까?

저의 경험상, 다음 조건 중 2개 이상 해당하면 Compound Pattern을 고려하세요:

#### ✅ 사용하면 좋은 경우

1. **컴포넌트가 여러 하위 요소로 구성됨**
   - Modal (Header, Body, Footer)
   - Card (Image, Title, Description, Actions)
   - Accordion (Item, Header, Panel)

2. **하위 요소들이 상태를 공유함**
   - Tabs: activeTab 상태 공유
   - Select: selectedValue 상태 공유
   - Accordion: openIndex 상태 공유

3. **레이아웃의 유연성이 필요함**
   - 헤더에 아이콘, 버튼, 텍스트 등 다양한 요소 배치
   - 순서 변경 가능
   - 선택적 요소 표시/숨김

4. **재사용성이 중요함**
   - 여러 페이지에서 다양한 형태로 사용
   - 디자인 시스템의 일부

#### ❌ 사용하지 말아야 할 경우

1. **단순한 컴포넌트**
```tsx
// ❌ 과한 추상화
<Button>
  <Button.Icon />
  <Button.Text>클릭</Button.Text>
</Button>

// ✅ 그냥 props 사용
<Button icon={<Icon />}>클릭</Button>
```

2. **고정된 구조**
```tsx
// ❌ 항상 같은 구조라면 불필요
<Header>
  <Header.Logo />
  <Header.Nav />
  <Header.Actions />
</Header>

// ✅ 그냥 단일 컴포넌트
<Header logo={logo} nav={nav} actions={actions} />
```

3. **성능이 매우 중요한 경우**
```tsx
// Context 리렌더링이 부담스러운 경우
// 대신 props drilling이나 상태 관리 라이브러리 고려
```

### 다른 패턴과의 비교

#### 1. Compound Pattern vs Render Props

```tsx
// Compound Pattern
<Select value={value} onChange={setValue}>
  <Select.Trigger />
  <Select.Content>
    <Select.Option value="a">A</Select.Option>
    <Select.Option value="b">B</Select.Option>
  </Select.Content>
</Select>

// Render Props
<Select
  value={value}
  onChange={setValue}
  render={({ isOpen, selected }) => (
    <>
      <SelectTrigger isOpen={isOpen} selected={selected} />
      <SelectContent isOpen={isOpen}>
        <SelectOption value="a">A</SelectOption>
        <SelectOption value="b">B</SelectOption>
      </SelectContent>
    </>
  )}
/>
```

**Compound Pattern 장점**:
- 더 선언적이고 읽기 쉬움
- IDE 자동완성 지원 우수
- 타입 안전성 확보 쉬움

**Render Props 장점**:
- 더 많은 제어권
- 복잡한 로직 처리 용이

#### 2. Compound Pattern vs Higher-Order Components (HOC)

```tsx
// Compound Pattern
<Tabs defaultTab="home">
  <Tabs.List>
    <Tabs.Tab value="home">홈</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="home">홈 내용</Tabs.Panel>
</Tabs>

// HOC
const TabPanel = withTabContext(({ isActive, children }) => (
  isActive ? <div>{children}</div> : null
));
```

**Compound Pattern 장점**:
- 명시적이고 직관적
- Props 충돌 없음
- 디버깅 쉬움

#### 3. Compound Pattern vs Custom Hooks

```tsx
// Compound Pattern - UI와 로직이 함께
<Tabs>
  <Tabs.Tab>탭</Tabs.Tab>
</Tabs>

// Custom Hooks - 로직만 분리
function MyTabs() {
  const { activeTab, setActiveTab } = useTabs();
  return (
    <div>
      <button onClick={() => setActiveTab('tab1')}>탭</button>
    </div>
  );
}
```

**언제 뭘 쓸까?**
- **Compound Pattern**: UI 컴포넌트 라이브러리, 일관된 디자인
- **Custom Hooks**: 로직 재사용, 완전한 커스터마이징 필요

### 실전 팁

#### 1. 점진적 도입

처음부터 완벽한 Compound Component를 만들려 하지 마세요. 단계적으로 발전시키세요.

```tsx
// 1단계: 기본 컴포넌트
function SimpleAccordion({ items }) {
  return items.map(item => <div>{item}</div>);
}

// 2단계: Props 추가
function BetterAccordion({ items, onItemClick }) {
  // ...
}

// 3단계: Compound Pattern 적용 (유연성 필요할 때)
<Accordion>
  <Accordion.Item>
    <Accordion.Header>커스텀 가능!</Accordion.Header>
  </Accordion.Item>
</Accordion>
```

#### 2. 기본 컴포넌트도 함께 제공

모든 사용자가 유연성을 원하는 건 아닙니다. 간단한 사용을 위한 래퍼도 제공하세요.

```tsx
// 복잡한 사용 (유연함)
<Accordion>
  <Accordion.Item index={0}>
    <Accordion.Header index={0}>제목</Accordion.Header>
    <Accordion.Panel index={0}>내용</Accordion.Panel>
  </Accordion.Item>
</Accordion>

// 간단한 사용 (편리함)
<SimpleAccordion
  items={[
    { title: '제목', content: '내용' }
  ]}
/>
```

#### 3. 스토리북으로 문서화

Compound Component는 사용법이 다양하므로 충분한 예시가 필요합니다.

```tsx
// Button.stories.tsx
export default {
  title: 'Components/Card',
  component: Card,
};

export const Basic = () => (
  <Card>
    <Card.Title>기본 카드</Card.Title>
    <Card.Body>내용</Card.Body>
  </Card>
);

export const WithImage = () => (
  <Card>
    <Card.Image src="..." />
    <Card.Title>이미지 카드</Card.Title>
  </Card>
);

export const WithActions = () => (
  <Card>
    <Card.Title>액션 카드</Card.Title>
    <Card.Footer>
      <Button>확인</Button>
    </Card.Footer>
  </Card>
);
```

## 장점과 단점

### 장점

#### 1. 높은 유연성과 확장성

```tsx
// 새로운 요구사항에도 컴포넌트 수정 없이 대응
<Modal>
  <Modal.Header>
    <SearchIcon />  {/* 새로운 요소 추가 */}
    <Modal.Title>제목</Modal.Title>
    <Badge>New</Badge>  {/* 또 다른 요소 추가 */}
  </Modal.Header>
</Modal>
```

#### 2. 명확한 의도 표현

```tsx
// 코드만 봐도 UI 구조가 한눈에 보임
<Card>
  <Card.Image src="thumb.jpg" />
  <Card.Title>제목</Card.Title>
  <Card.Description>설명</Card.Description>
  <Card.Actions>
    <Button>버튼</Button>
  </Card.Actions>
</Card>
```

#### 3. 재사용성과 조합 가능성

```tsx
// 서브 컴포넌트를 다른 곳에서도 사용 가능
<CustomContainer>
  <Modal.Header>  {/* Modal 밖에서도 사용 */}
    <h2>재사용!</h2>
  </Modal.Header>
</CustomContainer>
```

#### 4. 타입 안전성

```tsx
// TypeScript와 완벽한 조합
<Select value={value}>
  <Select.Option value="hello">  {/* value 타입이 자동 추론 */}
    Hello
  </Select.Option>
</Select>
```

### 단점

#### 1. 초기 설정의 복잡성

- Context 설정
- 타입 정의
- 서브 컴포넌트 연결
- 문서화

단순한 컴포넌트에는 과한 추상화일 수 있습니다.

#### 2. 러닝 커브

```tsx
// 새로운 개발자가 이해하기 어려울 수 있음
<Accordion>
  <Accordion.Item index={0}>  {/* 왜 index가 필요하지? */}
    <Accordion.Header index={0}>  {/* 왜 또 index? */}
      제목
    </Accordion.Header>
  </Accordion.Item>
</Accordion>
```

#### 3. 잘못된 사용 가능성

```tsx
// 필수 컴포넌트 누락
<Modal>
  <Modal.Body>내용</Modal.Body>
  {/* Header 없음 - 괜찮은가? */}
</Modal>

// 잘못된 순서
<Accordion.Header>제목</Accordion.Header>
<Accordion>  {/* 순서가 잘못됨 */}
  ...
</Accordion>
```

#### 4. Context 성능 오버헤드

```tsx
// Context 값이 바뀔 때마다 모든 자식이 리렌더링
<Accordion>  {/* 상태가 여기 있음 */}
  <Accordion.Item />  {/* 리렌더링 */}
  <Accordion.Item />  {/* 리렌더링 */}
  <Accordion.Item />  {/* 리렌더링 */}
</Accordion>
```

## 모범 사례

### 1. 명확하고 일관된 네이밍

```tsx
// ✅ 좋은 예 - 역할이 명확
<Dialog>
  <Dialog.Title>제목</Dialog.Title>
  <Dialog.Description>설명</Dialog.Description>
  <Dialog.Actions>액션</Dialog.Actions>
</Dialog>

// ❌ 나쁜 예 - 역할이 불명확
<Dialog>
  <Dialog.Top>제목</Dialog.Top>
  <Dialog.Middle>설명</Dialog.Middle>
  <Dialog.Bottom>액션</Dialog.Bottom>
</Dialog>
```

### 2. 적절한 기본값 제공

```tsx
// ✅ 기본 동작 제공
const Modal = ({
  isOpen,
  onClose,
  closeOnEscape = true,  // 기본값
  closeOnOverlayClick = true,  // 기본값
  children
}) => {
  // ESC 키 처리
  useEffect(() => {
    if (!closeOnEscape) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [closeOnEscape, onClose]);

  // ...
};
```

### 3. 접근성 고려

```tsx
// ✅ ARIA 속성 추가
const Tabs = ({ children }) => {
  return (
    <div role="tablist">  {/* ARIA role */}
      {children}
    </div>
  );
};

const Tab = ({ value, children, isActive }) => {
  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`panel-${value}`}
      id={`tab-${value}`}
    >
      {children}
    </button>
  );
};

const TabPanel = ({ value, children, isActive }) => {
  return (
    <div
      role="tabpanel"
      aria-labelledby={`tab-${value}`}
      id={`panel-${value}`}
      hidden={!isActive}
    >
      {children}
    </div>
  );
};
```

### 4. 에러 경계 설정

```tsx
// ✅ 에러 처리
function useAccordion() {
  const context = useContext(AccordionContext);

  if (!context) {
    throw new Error(
      '❌ Accordion 서브 컴포넌트는 Accordion 컴포넌트 내부에서만 사용할 수 있습니다.\n\n' +
      '올바른 사용법:\n' +
      '<Accordion>\n' +
      '  <Accordion.Item>\n' +
      '    <Accordion.Header>제목</Accordion.Header>\n' +
      '  </Accordion.Item>\n' +
      '</Accordion>'
    );
  }

  return context;
}
```

### 5. 포워딩 ref 지원

```tsx
// ✅ ref 전달 가능
const AccordionHeader = forwardRef<HTMLButtonElement, AccordionHeaderProps>(
  ({ children, ...props }, ref) => {
    const { toggle } = useAccordion();

    return (
      <button ref={ref} onClick={toggle} {...props}>
        {children}
      </button>
    );
  }
);

AccordionHeader.displayName = 'AccordionHeader';
```

### 6. 성능 최적화

```tsx
// ✅ 메모이제이션
const Accordion = ({ children, defaultIndex = null }) => {
  const [openIndex, setOpenIndex] = useState(defaultIndex);

  // Context value를 메모이제이션
  const contextValue = useMemo(
    () => ({ openIndex, setOpenIndex }),
    [openIndex]
  );

  return (
    <AccordionContext.Provider value={contextValue}>
      <div className="accordion">{children}</div>
    </AccordionContext.Provider>
  );
};

// 서브 컴포넌트도 메모이제이션
const AccordionItem = memo(({ children, index }) => {
  const { openIndex } = useAccordion();
  const isOpen = openIndex === index;

  return (
    <div className={`item ${isOpen ? 'open' : ''}`}>
      {children}
    </div>
  );
});
```

## 실제 라이브러리 사례 분석

### 1. Radix UI

Radix UI는 Compound Pattern의 교과서적인 예시입니다.

```tsx
import * as Dialog from '@radix-ui/react-dialog';

<Dialog.Root>
  <Dialog.Trigger>열기</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content>
      <Dialog.Title>제목</Dialog.Title>
      <Dialog.Description>설명</Dialog.Description>
      <Dialog.Close>닫기</Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

**특징**:
- 매우 세밀한 제어 가능
- 접근성 자동 처리
- 스타일 없음 (headless)

### 2. Chakra UI

Chakra UI는 스타일까지 포함한 Compound Pattern입니다.

```tsx
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
} from '@chakra-ui/react';

<Modal isOpen={isOpen} onClose={onClose}>
  <ModalOverlay />
  <ModalContent>
    <ModalHeader>제목</ModalHeader>
    <ModalCloseButton />
    <ModalBody>내용</ModalBody>
    <ModalFooter>
      <Button>확인</Button>
    </ModalFooter>
  </ModalContent>
</Modal>
```

**특징**:
- 스타일 포함
- 테마 시스템 통합
- 간단한 사용법

### 3. Headless UI

Tailwind팀이 만든 Headless UI도 Compound Pattern을 사용합니다.

```tsx
import { Menu } from '@headlessui/react';

<Menu>
  <Menu.Button>Options</Menu.Button>
  <Menu.Items>
    <Menu.Item>
      {({ active }) => (
        <a className={active ? 'bg-blue-500' : ''}>
          Account settings
        </a>
      )}
    </Menu.Item>
  </Menu.Items>
</Menu>
```

**특징**:
- Render Props와 Compound Pattern 혼합
- 완전한 스타일 제어
- 접근성 내장

## 나의 경험담

제가 처음 Compound Pattern을 도입했던 프로젝트는 사내 디자인 시스템이었습니다. 처음에는 모든 컴포넌트에 Compound Pattern을 적용하려 했습니다. Button, Input, Checkbox까지도요. 하지만 곧 깨달았습니다. **모든 것을 Compound Component로 만들 필요는 없다는 것을**.

단순한 Button은 그냥 props로 충분했습니다. 하지만 Modal, Accordion, Tabs 같은 복잡한 컴포넌트에서는 Compound Pattern이 빛을 발했습니다. 특히 디자이너들이 "모달 헤더에 검색창을 넣고 싶어요"라고 할 때, 코드 수정 없이 바로 대응할 수 있었던 것이 큰 장점이었습니다.

```tsx
// 디자이너: "헤더에 검색창 넣어주세요"
// 나: "알겠습니다! 코드 수정 없이 가능합니다"
<Modal>
  <Modal.Header>
    <Modal.Title>사용자 찾기</Modal.Title>
    <SearchBar />  {/* 그냥 추가! */}
    <Modal.CloseButton />
  </Modal.Header>
  <Modal.Body>...</Modal.Body>
</Modal>
```

하지만 실수도 많았습니다. 한 번은 Context 성능 최적화를 하지 않아서 한 Accordion의 항목을 열 때마다 페이지 전체가 느려지는 버그를 만들었습니다. 그때부터 useMemo와 Context 분리의 중요성을 깨달았죠.

## 참고 자료

### 공식 문서 및 가이드

- [React Context API](https://react.dev/reference/react/createContext) - React 공식 Context 문서
- [React Patterns - Compound Components](https://react-patterns.com/#compound-components) - React 패턴 가이드
- [Patterns.dev - Compound Pattern](https://www.patterns.dev/posts/compound-pattern/) - 상세한 패턴 설명

### 심화 아티클

- [Kent C. Dodds - Compound Components with React Hooks](https://kentcdodds.com/blog/compound-components-with-react-hooks) - Hooks를 활용한 Compound Pattern
- [Advanced React Patterns](https://advanced-react-patterns.netlify.app/) - 고급 React 패턴 모음
- [Smashing Magazine - Compound Components in React](https://www.smashingmagazine.com/2021/08/compound-components-react/) - 실전 예제와 함께
- [LogRocket - Understanding React Compound Components](https://blog.logrocket.com/understanding-react-compound-components/) - 단계별 구현 가이드

### 실전 구현 예시

- [Epic React - Compound Components](https://epicreact.dev/compound-components/) - Kent C. Dodds의 실전 강의
- [React TypeScript Cheatsheet - Compound Components](https://react-typescript-cheatsheet.netlify.app/docs/advanced/patterns_by_usecase/#compound-components) - TypeScript 구현 가이드

### 오픈소스 라이브러리

- [Radix UI](https://www.radix-ui.com/) - Headless UI 라이브러리, 접근성 최고
- [Headless UI](https://headlessui.dev/) - Tailwind팀의 Headless 컴포넌트
- [Chakra UI](https://chakra-ui.com/) - 스타일 포함 컴포넌트 라이브러리
- [Reach UI](https://reach.tech/) - 접근성 중심 컴포넌트
- [Ariakit](https://ariakit.org/) - 현대적인 Compound Pattern 구현
- [React Aria](https://react-spectrum.adobe.com/react-aria/) - Adobe의 접근성 컴포넌트

### 블로그 및 튜토리얼

- [Robin Wieruch - React Compound Components](https://www.robinwieruch.de/react-compound-components/) - 단계별 튜토리얼
- [Josh Comeau - Building a Compound Component](https://www.joshwcomeau.com/react/compound-components/) - 상세한 설명과 예제

### 동영상 강의

- [Egghead.io - Compound Components](https://egghead.io/courses/advanced-react-component-patterns) - Kent C. Dodds의 동영상 강의
- [Frontend Masters - Advanced React Patterns](https://frontendmasters.com/courses/advanced-react-patterns/) - 고급 패턴 강의

### 도구 및 유틸리티

- [react-component-composition](https://github.com/jxom/react-component-composition) - Compound Component 생성 도구
- [Storybook](https://storybook.js.org/) - 컴포넌트 문서화 도구
