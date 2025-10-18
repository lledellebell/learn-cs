---
title: Context API를 활용한 Compound Pattern 구현
date: 2025-10-13
categories: [Web Development]
tags: [Callback, Async, Functions, Factory Pattern, Design Patterns, OOP]
render_with_liquid: false
layout: page
---
# Context API를 활용한 Compound Pattern 구현

> React의 Context API와 Compound Pattern을 결합하면 강력하고 유연한 컴포넌트 시스템을 만들 수 있습니다.

## 들어가며: Prop Drilling의 고통

React로 복잡한 UI를 만들다 보면 이런 경험 한 번쯤 있으시죠?

```tsx
function Dashboard({ currentUser }) {
  return (
    <Layout currentUser={currentUser}>
      <Sidebar currentUser={currentUser}>
        <Navigation currentUser={currentUser}>
          <UserMenu currentUser={currentUser}>
            <Avatar user={currentUser} />
            <UserName user={currentUser} />
          </UserMenu>
        </Navigation>
      </Sidebar>
    </Layout>
  );
}
```

`currentUser`를 5단계나 전달하는 이 코드... 보기만 해도 답답합니다. 이게 바로 **Prop Drilling** 문제입니다.

저도 처음 React를 배울 때 이런 코드를 작성했습니다. 컴포넌트가 10개, 20개로 늘어나면서 props를 전달하는 것만으로도 머리가 아팠죠. 그리고 중간에 prop 이름을 바꾸려면? 모든 컴포넌트를 하나씩 수정해야 했습니다.

**이 문제를 해결하는 우아한 방법이 바로 Context API와 Compound Pattern의 조합입니다.**

## Context API란?

Context는 컴포넌트 트리에서 데이터를 "전역적으로" 공유할 수 있게 해주는 React의 기능입니다.

### Context의 핵심 개념

```
             Provider (데이터 제공자)
                   │
                   │ value={data}
                   ▼
           ┌───────────────┐
           │  Component A  │
           └───────┬───────┘
                   │
         ┌─────────┴─────────┐
         │                   │
         ▼                   ▼
   ┌─────────┐         ┌─────────┐
   │  Child1 │         │  Child2 │
   └─────────┘         └────┬────┘
                            │
                            ▼
                      ┌──────────┐
                      │Grandchild│ ← useContext()로 데이터 접근
                      └──────────┘
```

Grandchild 컴포넌트는 중간 컴포넌트들을 거치지 않고도 Provider의 데이터에 직접 접근할 수 있습니다!

### Context vs Provider 차이점

많은 개발자들이 Context와 Provider를 혼동하는데, 실제로는 **Context와 Provider는 함께 동작하는 하나의 시스템**입니다.

| 구분 | Context | Provider |
|------|---------|----------|
| **역할** | 데이터 저장소 정의 | 데이터 제공자 |
| **생성** | `createContext()` | `Context.Provider` |
| **기능** | 타입과 기본값 정의 | 실제 값 전달 |
| **사용** | `useContext(Context)` | JSX에서 컴포넌트 감싸기 |
| **비유** | 배달 앱의 주문 양식 | 실제 배달부 |

{% raw %}
```tsx
// Context: 데이터 구조 정의 (주문 양식)
const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {}
});

// Provider: 실제 데이터 제공 (배달부)
const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');

  return (
    <ThemeContext.Provider value={{
      theme,
      toggleTheme: () => setTheme(prev => prev === 'light' ? 'dark' : 'light')
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
```
{% endraw %}

**Context만으로는 데이터 공유가 불가능**하며, 반드시 **Provider와 함께 사용**해야 합니다. Context는 "무엇을 공유할지"를 정의하고, Provider는 "실제 값을 어떻게 제공할지"를 구현합니다.

## 왜 Context와 Compound Pattern을 함께 쓸까요?

Compound Pattern은 여러 서브컴포넌트가 협력해서 하나의 기능을 만드는 패턴입니다. 그런데 이 서브컴포넌트들이 서로 상태를 공유해야 한다면?

### 문제 상황: Tabs 컴포넌트

```tsx
// ❌ Props로 상태 전달: 복잡하고 제한적
<Tabs activeTab={activeTab} onChange={setActiveTab}>
  <TabList activeTab={activeTab} onChange={setActiveTab}>
    <Tab id="1" activeTab={activeTab} onChange={setActiveTab}>탭 1</Tab>
    <Tab id="2" activeTab={activeTab} onChange={setActiveTab}>탭 2</Tab>
  </TabList>
  <TabPanels activeTab={activeTab}>
    <TabPanel id="1" activeTab={activeTab}>내용 1</TabPanel>
    <TabPanel id="2" activeTab={activeTab}>내용 2</TabPanel>
  </TabPanels>
</Tabs>
```

`activeTab`과 `onChange`를 모든 컴포넌트에 전달해야 합니다. 너무 반복적이고 실수하기 쉽죠.

### 해결책: Context + Compound Pattern

```tsx
// ✅ Context로 상태 공유: 깔끔하고 직관적
<Tabs defaultTab="1">
  <TabList>
    <Tab id="1">탭 1</Tab>
    <Tab id="2">탭 2</Tab>
  </TabList>
  <TabPanels>
    <TabPanel id="1">내용 1</TabPanel>
    <TabPanel id="2">내용 2</TabPanel>
  </TabPanels>
</Tabs>
```

Context를 사용하면 서브컴포넌트들이 내부적으로 상태를 공유하므로 props를 반복해서 전달할 필요가 없습니다!

## Context + Compound의 시너지

이 두 패턴을 결합하면 다음과 같은 이점이 있습니다:

### 1. 사용자 친화적인 API

```tsx
// 사용자는 내부 구조를 몰라도 됩니다
<Accordion>
  <AccordionItem id="1">
    <AccordionHeader>질문 1</AccordionHeader>
    <AccordionContent>답변 1</AccordionContent>
  </AccordionItem>
  <AccordionItem id="2">
    <AccordionHeader>질문 2</AccordionHeader>
    <AccordionContent>답변 2</AccordionContent>
  </AccordionItem>
</Accordion>
```

### 2. 완벽한 캡슐화

```
┌─────────────────────────────────────┐
│         Accordion (Provider)         │
│  ┌───────────────────────────────┐  │
│  │  Context (내부 상태)           │  │
│  │  - openItems: Set<string>     │  │
│  │  - toggle: (id) => void       │  │
│  └───────────────────────────────┘  │
│           │                          │
│           │ (Context를 통해 공유)    │
│           ▼                          │
│  ┌─────────────────────┐            │
│  │  AccordionItem      │            │
│  │  ┌───────────────┐  │            │
│  │  │ Header        │──┼─ toggle() │
│  │  └───────────────┘  │            │
│  │  ┌───────────────┐  │            │
│  │  │ Content       │──┼─ isOpen   │
│  │  └───────────────┘  │            │
│  └─────────────────────┘            │
└─────────────────────────────────────┘
```

### 3. 유연한 구조

{% raw %}
```tsx
// 순서와 구조를 자유롭게 변경 가능
<Tabs>
  <TabPanels>  {/* 순서 바뀜 */}
    <TabPanel id="1">내용 1</TabPanel>
    <TabPanel id="2">내용 2</TabPanel>
  </TabPanels>
  <TabList>
    <Tab id="1">탭 1</Tab>
    <Tab id="2">탭 2</Tab>
  </TabList>
</Tabs>
```
{% endraw %}

## 단계별 구현 가이드

실제로 Context + Compound Pattern을 어떻게 구현하는지 단계별로 살펴보겠습니다.

### Step 1: Context 정의

먼저 공유할 데이터의 타입과 Context를 정의합니다.

{% raw %}
```tsx
// types.ts
interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
  orientation: 'horizontal' | 'vertical';
}

// TabsContext.ts
import { createContext } from 'react';

const TabsContext = createContext<TabsContextValue | null>(null);

export default TabsContext;
```
{% endraw %}

### Step 2: Provider 컴포넌트 구현

{% raw %}
```tsx
// Tabs.tsx
import { useState, ReactNode } from 'react';
import TabsContext from './TabsContext';

interface TabsProps {
  defaultTab: string;
  orientation?: 'horizontal' | 'vertical';
  children: ReactNode;
  className?: string;
}

const Tabs = ({
  defaultTab,
  orientation = 'horizontal',
  children,
  className
}: TabsProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const contextValue: TabsContextValue = {
    activeTab,
    setActiveTab,
    orientation
  };

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={`tabs tabs--${orientation} ${className || ''}`}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

export default Tabs;
```
{% endraw %}

### Step 3: Custom Hook 생성

Context를 안전하게 사용하기 위한 Hook을 만듭니다.

{% raw %}
```tsx
// useTabsContext.ts
import { useContext } from 'react';
import TabsContext from './TabsContext';

const useTabsContext = () => {
  const context = useContext(TabsContext);

  if (!context) {
    throw new Error(
      'Tabs 서브컴포넌트는 Tabs 컴포넌트 내부에서만 사용할 수 있습니다. ' +
      '사용 예시:\n' +
      '<Tabs>\n' +
      '  <TabList>\n' +
      '    <Tab>...</Tab>\n' +
      '  </TabList>\n' +
      '</Tabs>'
    );
  }

  return context;
};

export default useTabsContext;
```
{% endraw %}

### Step 4: 서브컴포넌트 구현

이제 Context를 사용하는 서브컴포넌트들을 만듭니다.

{% raw %}
```tsx
// Tab.tsx
import { ReactNode } from 'react';
import useTabsContext from './useTabsContext';

interface TabProps {
  id: string;
  children: ReactNode;
  disabled?: boolean;
}

const Tab = ({ id, children, disabled = false }: TabProps) => {
  const { activeTab, setActiveTab } = useTabsContext();

  const isActive = activeTab === id;

  const handleClick = () => {
    if (!disabled) {
      setActiveTab(id);
    }
  };

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`panel-${id}`}
      disabled={disabled}
      className={`tab ${isActive ? 'tab--active' : ''} ${disabled ? 'tab--disabled' : ''}`}
      onClick={handleClick}
    >
      {children}
    </button>
  );
};

export default Tab;
```
{% endraw %}

{% raw %}
```tsx
// TabPanel.tsx
import { ReactNode } from 'react';
import useTabsContext from './useTabsContext';

interface TabPanelProps {
  id: string;
  children: ReactNode;
}

const TabPanel = ({ id, children }: TabPanelProps) => {
  const { activeTab } = useTabsContext();

  const isActive = activeTab === id;

  if (!isActive) return null;

  return (
    <div
      role="tabpanel"
      id={`panel-${id}`}
      aria-labelledby={`tab-${id}`}
      className="tab-panel"
    >
      {children}
    </div>
  );
};

export default TabPanel;
```
{% endraw %}

### Step 5: 컴포넌트 조합

{% raw %}
```tsx
// index.ts
import Tabs from './Tabs';
import TabList from './TabList';
import Tab from './Tab';
import TabPanels from './TabPanels';
import TabPanel from './TabPanel';

// Compound Component 패턴으로 조합
Tabs.List = TabList;
Tabs.Tab = Tab;
Tabs.Panels = TabPanels;
Tabs.Panel = TabPanel;

export default Tabs;
```
{% endraw %}

### Step 6: 사용하기

{% raw %}
```tsx
// App.tsx
import Tabs from './components/Tabs';

function App() {
  return (
    <Tabs defaultTab="home" orientation="horizontal">
      <Tabs.List>
        <Tabs.Tab id="home">홈</Tabs.Tab>
        <Tabs.Tab id="profile">프로필</Tabs.Tab>
        <Tabs.Tab id="settings">설정</Tabs.Tab>
        <Tabs.Tab id="disabled" disabled>비활성</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panels>
        <Tabs.Panel id="home">
          <h2>홈 화면</h2>
          <p>메인 콘텐츠가 여기 표시됩니다.</p>
        </Tabs.Panel>

        <Tabs.Panel id="profile">
          <h2>프로필</h2>
          <p>사용자 정보를 확인하세요.</p>
        </Tabs.Panel>

        <Tabs.Panel id="settings">
          <h2>설정</h2>
          <p>앱 설정을 변경할 수 있습니다.</p>
        </Tabs.Panel>
      </Tabs.Panels>
    </Tabs>
  );
}
```
{% endraw %}

## 풍부한 실전 예제

### 예제 1: Accordion (아코디언)

여러 아이템을 펼치고 접을 수 있는 컴포넌트입니다.

{% raw %}
```tsx
// AccordionContext.tsx
interface AccordionContextValue {
  openItems: Set<string>;
  toggle: (id: string) => void;
  allowMultiple: boolean;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

// Accordion.tsx
interface AccordionProps {
  children: ReactNode;
  allowMultiple?: boolean;
  defaultOpen?: string[];
}

const Accordion = ({
  children,
  allowMultiple = false,
  defaultOpen = []
}: AccordionProps) => {
  const [openItems, setOpenItems] = useState<Set<string>>(
    new Set(defaultOpen)
  );

  const toggle = (id: string) => {
    setOpenItems(prev => {
      const newSet = new Set(prev);

      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        if (!allowMultiple) {
          newSet.clear();
        }
        newSet.add(id);
      }

      return newSet;
    });
  };

  const value: AccordionContextValue = {
    openItems,
    toggle,
    allowMultiple
  };

  return (
    <AccordionContext.Provider value={value}>
      <div className="accordion">
        {children}
      </div>
    </AccordionContext.Provider>
  );
};

// AccordionItem.tsx
interface AccordionItemProps {
  id: string;
  children: ReactNode;
}

const AccordionItem = ({ id, children }: AccordionItemProps) => {
  const { openItems } = useAccordionContext();
  const isOpen = openItems.has(id);

  return (
    <div
      className={`accordion-item ${isOpen ? 'accordion-item--open' : ''}`}
      data-item-id={id}
    >
      {children}
    </div>
  );
};

// AccordionHeader.tsx
const AccordionHeader = ({ children }: { children: ReactNode }) => {
  const { toggle } = useAccordionContext();
  const itemElement = document.querySelector(`[data-item-id]`);
  const itemId = itemElement?.getAttribute('data-item-id') || '';

  return (
    <button
      className="accordion-header"
      onClick={() => toggle(itemId)}
    >
      {children}
      <ChevronIcon />
    </button>
  );
};

// AccordionContent.tsx
const AccordionContent = ({ children }: { children: ReactNode }) => {
  const { openItems } = useAccordionContext();
  const itemElement = document.querySelector(`[data-item-id]`);
  const itemId = itemElement?.getAttribute('data-item-id') || '';
  const isOpen = openItems.has(itemId);

  return (
    <div
      className="accordion-content"
      style={{ display: isOpen ? 'block' : 'none' }}
    >
      {children}
    </div>
  );
};

// 사용 예시
<Accordion allowMultiple defaultOpen={['faq1']}>
  <AccordionItem id="faq1">
    <AccordionHeader>React란 무엇인가요?</AccordionHeader>
    <AccordionContent>
      React는 사용자 인터페이스를 만들기 위한 JavaScript 라이브러리입니다.
    </AccordionContent>
  </AccordionItem>

  <AccordionItem id="faq2">
    <AccordionHeader>Context API는 언제 사용하나요?</AccordionHeader>
    <AccordionContent>
      전역 상태를 공유하거나 Prop Drilling을 피하고 싶을 때 사용합니다.
    </AccordionContent>
  </AccordionItem>
</Accordion>
```
{% endraw %}

### 예제 2: Form with Steps (다단계 폼)

복잡한 폼을 여러 단계로 나누어 관리하는 컴포넌트입니다.

{% raw %}
```tsx
// FormContext.tsx
interface FormContextValue {
  currentStep: number;
  totalSteps: number;
  formData: Record<string, any>;
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateFormData: (data: Record<string, any>) => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

// Form.tsx
const Form = ({ children, onSubmit }: FormProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const steps = React.Children.toArray(children);
  const totalSteps = steps.length;

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const goToStep = (step: number) => {
    if (step >= 0 && step < totalSteps) {
      setCurrentStep(step);
    }
  };

  const updateFormData = (data: Record<string, any>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleSubmit = () => {
    if (currentStep === totalSteps - 1) {
      onSubmit?.(formData);
    }
  };

  const value: FormContextValue = {
    currentStep,
    totalSteps,
    formData,
    goToStep,
    nextStep,
    prevStep,
    updateFormData,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === totalSteps - 1
  };

  return (
    <FormContext.Provider value={value}>
      <div className="form-wizard">
        {steps[currentStep]}
      </div>
    </FormContext.Provider>
  );
};

// FormStep.tsx
const FormStep = ({ children, title }: FormStepProps) => {
  return (
    <div className="form-step">
      <h2 className="form-step__title">{title}</h2>
      <div className="form-step__content">
        {children}
      </div>
    </div>
  );
};

// FormNavigation.tsx
const FormNavigation = () => {
  const {
    isFirstStep,
    isLastStep,
    nextStep,
    prevStep
  } = useFormContext();

  return (
    <div className="form-navigation">
      {!isFirstStep && (
        <button onClick={prevStep}>이전</button>
      )}
      <button onClick={nextStep}>
        {isLastStep ? '제출' : '다음'}
      </button>
    </div>
  );
};

// FormProgress.tsx
const FormProgress = () => {
  const { currentStep, totalSteps } = useFormContext();
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="form-progress">
      <div className="form-progress__bar">
        <div
          className="form-progress__fill"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="form-progress__text">
        {currentStep + 1} / {totalSteps}
      </span>
    </div>
  );
};

// 사용 예시
<Form onSubmit={handleFormSubmit}>
  <FormProgress />

  <FormStep title="개인 정보">
    <input name="name" placeholder="이름" />
    <input name="email" placeholder="이메일" />
  </FormStep>

  <FormStep title="주소">
    <input name="address" placeholder="주소" />
    <input name="city" placeholder="도시" />
  </FormStep>

  <FormStep title="확인">
    <p>입력하신 정보를 확인해주세요.</p>
  </FormStep>

  <FormNavigation />
</Form>
```
{% endraw %}

### 예제 3: Carousel (캐러셀)

이미지나 콘텐츠를 슬라이드 형태로 보여주는 컴포넌트입니다.

{% raw %}
```tsx
// CarouselContext.tsx
interface CarouselContextValue {
  currentIndex: number;
  totalItems: number;
  goToSlide: (index: number) => void;
  nextSlide: () => void;
  prevSlide: () => void;
  isAutoPlaying: boolean;
  toggleAutoPlay: () => void;
}

// Carousel.tsx
const Carousel = ({
  children,
  autoPlay = false,
  interval = 3000
}: CarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);

  const items = React.Children.toArray(children);
  const totalItems = items.length;

  const goToSlide = (index: number) => {
    const newIndex = ((index % totalItems) + totalItems) % totalItems;
    setCurrentIndex(newIndex);
  };

  const nextSlide = () => goToSlide(currentIndex + 1);
  const prevSlide = () => goToSlide(currentIndex - 1);
  const toggleAutoPlay = () => setIsAutoPlaying(prev => !prev);

  // Auto play 기능
  useEffect(() => {
    if (!isAutoPlaying) return;

    const timer = setInterval(nextSlide, interval);
    return () => clearInterval(timer);
  }, [isAutoPlaying, currentIndex]);

  const value: CarouselContextValue = {
    currentIndex,
    totalItems,
    goToSlide,
    nextSlide,
    prevSlide,
    isAutoPlaying,
    toggleAutoPlay
  };

  return (
    <CarouselContext.Provider value={value}>
      <div className="carousel">
        {children}
      </div>
    </CarouselContext.Provider>
  );
};

// CarouselSlide.tsx
const CarouselSlide = ({
  children,
  index
}: CarouselSlideProps) => {
  const { currentIndex } = useCarouselContext();
  const isActive = currentIndex === index;

  return (
    <div
      className={`carousel-slide ${isActive ? 'carousel-slide--active' : ''}`}
      style={{
        transform: `translateX(${(index - currentIndex) * 100}%)`,
        transition: 'transform 0.3s ease-in-out'
      }}
    >
      {children}
    </div>
  );
};

// CarouselControls.tsx
const CarouselControls = () => {
  const { nextSlide, prevSlide } = useCarouselContext();

  return (
    <div className="carousel-controls">
      <button
        className="carousel-controls__prev"
        onClick={prevSlide}
      >
        ◀
      </button>
      <button
        className="carousel-controls__next"
        onClick={nextSlide}
      >
        ▶
      </button>
    </div>
  );
};

// CarouselIndicators.tsx
const CarouselIndicators = () => {
  const { currentIndex, totalItems, goToSlide } = useCarouselContext();

  return (
    <div className="carousel-indicators">
      {Array.from({ length: totalItems }).map((_, index) => (
        <button
          key={index}
          className={`carousel-indicator ${
            currentIndex === index ? 'carousel-indicator--active' : ''
          }`}
          onClick={() => goToSlide(index)}
        />
      ))}
    </div>
  );
};

// 사용 예시
<Carousel autoPlay interval={5000}>
  <CarouselSlide index={0}>
    <img src="/slide1.jpg" alt="Slide 1" />
  </CarouselSlide>
  <CarouselSlide index={1}>
    <img src="/slide2.jpg" alt="Slide 2" />
  </CarouselSlide>
  <CarouselSlide index={2}>
    <img src="/slide3.jpg" alt="Slide 3" />
  </CarouselSlide>

  <CarouselControls />
  <CarouselIndicators />
</Carousel>
```
{% endraw %}

### 예제 4: Modal (모달)

Context를 활용한 모달 시스템입니다.

{% raw %}
```tsx
// ModalContext.tsx
interface ModalContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

// Modal.tsx
const Modal = ({
  children,
  defaultOpen = false,
  onClose
}: ModalProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const open = () => setIsOpen(true);
  const close = () => {
    setIsOpen(false);
    onClose?.();
  };
  const toggle = () => setIsOpen(prev => !prev);

  // ESC 키로 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const value: ModalContextValue = { isOpen, open, close, toggle };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
};

// ModalTrigger.tsx
const ModalTrigger = ({ children, asChild }: ModalTriggerProps) => {
  const { open } = useModalContext();

  if (asChild) {
    return React.cloneElement(children as React.ReactElement, {
      onClick: open
    });
  }

  return <button onClick={open}>{children}</button>;
};

// ModalContent.tsx
const ModalContent = ({ children }: ModalContentProps) => {
  const { isOpen, close } = useModalContext();
  const modalRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        close();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, close]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" ref={modalRef}>
        {children}
      </div>
    </div>
  );
};

// ModalClose.tsx
const ModalClose = ({ children }: ModalCloseProps) => {
  const { close } = useModalContext();

  return (
    <button
      className="modal-close"
      onClick={close}
    >
      {children || '×'}
    </button>
  );
};

// 사용 예시
<Modal>
  <ModalTrigger>
    <button>모달 열기</button>
  </ModalTrigger>

  <ModalContent>
    <h2>알림</h2>
    <p>이것은 모달 내용입니다.</p>
    <ModalClose />
  </ModalContent>
</Modal>
```
{% endraw %}

### 예제 5: Menu (드롭다운 메뉴)

Context로 관리되는 드롭다운 메뉴입니다.

{% raw %}
```tsx
// MenuContext.tsx
interface MenuContextValue {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
  selectedValue: string | null;
  selectItem: (value: string) => void;
}

// Menu.tsx
const Menu = ({ children, onSelect }: MenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggle = () => setIsOpen(prev => !prev);
  const close = () => setIsOpen(false);

  const selectItem = (value: string) => {
    setSelectedValue(value);
    setIsOpen(false);
    onSelect?.(value);
  };

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        close();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const value: MenuContextValue = {
    isOpen,
    toggle,
    close,
    selectedValue,
    selectItem
  };

  return (
    <MenuContext.Provider value={value}>
      <div className="menu" ref={menuRef}>
        {children}
      </div>
    </MenuContext.Provider>
  );
};

// MenuButton.tsx
const MenuButton = ({ children }: MenuButtonProps) => {
  const { toggle, isOpen } = useMenuContext();

  return (
    <button
      className="menu-button"
      onClick={toggle}
      aria-expanded={isOpen}
    >
      {children}
      <span className={`menu-button__icon ${isOpen ? 'menu-button__icon--open' : ''}`}>
        ▼
      </span>
    </button>
  );
};

// MenuList.tsx
const MenuList = ({ children }: MenuListProps) => {
  const { isOpen } = useMenuContext();

  if (!isOpen) return null;

  return (
    <ul className="menu-list" role="menu">
      {children}
    </ul>
  );
};

// MenuItem.tsx
const MenuItem = ({ value, children, disabled }: MenuItemProps) => {
  const { selectItem, selectedValue } = useMenuContext();
  const isSelected = selectedValue === value;

  return (
    <li
      role="menuitem"
      className={`menu-item ${isSelected ? 'menu-item--selected' : ''} ${disabled ? 'menu-item--disabled' : ''}`}
      onClick={() => !disabled && selectItem(value)}
    >
      {children}
      {isSelected && <span className="menu-item__check">✓</span>}
    </li>
  );
};

// 사용 예시
<Menu onSelect={(value) => console.log('Selected:', value)}>
  <MenuButton>
    언어 선택
  </MenuButton>

  <MenuList>
    <MenuItem value="ko">한국어</MenuItem>
    <MenuItem value="en">English</MenuItem>
    <MenuItem value="ja">日本語</MenuItem>
    <MenuItem value="zh" disabled>中文 (곧 출시)</MenuItem>
  </MenuList>
</Menu>
```
{% endraw %}

### 예제 6: Stepper (단계 표시기)

프로세스의 진행 상황을 시각적으로 보여주는 컴포넌트입니다.

{% raw %}
```tsx
// StepperContext.tsx
interface StepperContextValue {
  currentStep: number;
  totalSteps: number;
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  completedSteps: Set<number>;
  markStepComplete: (step: number) => void;
  isStepComplete: (step: number) => boolean;
  isStepAccessible: (step: number) => boolean;
}

// Stepper.tsx
const Stepper = ({
  children,
  initialStep = 0,
  allowSkip = false
}: StepperProps) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const steps = React.Children.toArray(children);
  const totalSteps = steps.length;

  const goToStep = (step: number) => {
    if (step >= 0 && step < totalSteps) {
      if (allowSkip || isStepAccessible(step)) {
        setCurrentStep(step);
      }
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      markStepComplete(currentStep);
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const markStepComplete = (step: number) => {
    setCompletedSteps(prev => new Set([...prev, step]));
  };

  const isStepComplete = (step: number) => {
    return completedSteps.has(step);
  };

  const isStepAccessible = (step: number) => {
    if (allowSkip) return true;
    return step <= currentStep || isStepComplete(step - 1);
  };

  const value: StepperContextValue = {
    currentStep,
    totalSteps,
    goToStep,
    nextStep,
    prevStep,
    completedSteps,
    markStepComplete,
    isStepComplete,
    isStepAccessible
  };

  return (
    <StepperContext.Provider value={value}>
      <div className="stepper">
        {children}
      </div>
    </StepperContext.Provider>
  );
};

// StepperHeader.tsx
const StepperHeader = () => {
  const {
    currentStep,
    totalSteps,
    goToStep,
    isStepComplete,
    isStepAccessible
  } = useStepperContext();

  return (
    <div className="stepper-header">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div key={index} className="stepper-header__item">
          <button
            className={`stepper-header__step ${
              currentStep === index ? 'stepper-header__step--active' : ''
            } ${
              isStepComplete(index) ? 'stepper-header__step--complete' : ''
            }`}
            onClick={() => goToStep(index)}
            disabled={!isStepAccessible(index)}
          >
            {isStepComplete(index) ? '✓' : index + 1}
          </button>
          {index < totalSteps - 1 && (
            <div
              className={`stepper-header__line ${
                isStepComplete(index) ? 'stepper-header__line--complete' : ''
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

// Step.tsx
const Step = ({ children, title }: StepProps) => {
  return (
    <div className="step">
      <h3 className="step__title">{title}</h3>
      <div className="step__content">
        {children}
      </div>
    </div>
  );
};

// StepperActions.tsx
const StepperActions = () => {
  const {
    currentStep,
    totalSteps,
    nextStep,
    prevStep
  } = useStepperContext();

  return (
    <div className="stepper-actions">
      <button
        onClick={prevStep}
        disabled={currentStep === 0}
      >
        이전
      </button>
      <button
        onClick={nextStep}
        disabled={currentStep === totalSteps - 1}
      >
        {currentStep === totalSteps - 1 ? '완료' : '다음'}
      </button>
    </div>
  );
};

// 사용 예시
<Stepper initialStep={0} allowSkip={false}>
  <StepperHeader />

  <Step title="계정 정보">
    <input placeholder="이메일" />
    <input placeholder="비밀번호" type="password" />
  </Step>

  <Step title="개인 정보">
    <input placeholder="이름" />
    <input placeholder="전화번호" />
  </Step>

  <Step title="약관 동의">
    <label>
      <input type="checkbox" />
      이용약관에 동의합니다
    </label>
  </Step>

  <StepperActions />
</Stepper>
```
{% endraw %}

## 시각적 데이터 흐름 다이어그램

Context + Compound Pattern의 데이터 흐름을 시각화해보겠습니다.

### 기본 흐름

```
┌─────────────────────────────────────────────────────────┐
│                    Tabs Component                        │
│  ┌────────────────────────────────────────────────┐     │
│  │         TabsContext.Provider                   │     │
│  │                                                 │     │
│  │  value = {                                      │     │
│  │    activeTab: "home",                           │     │
│  │    setActiveTab: (id) => {...}                  │     │
│  │  }                                              │     │
│  │                                                 │     │
│  │         ▼                    ▼                  │     │
│  │   ┌─────────┐         ┌─────────┐              │     │
│  │   │ TabList │         │ Panels  │              │     │
│  │   └────┬────┘         └────┬────┘              │     │
│  │        │                   │                    │     │
│  │   ┌────┴────┬───────┐      │                   │     │
│  │   ▼         ▼       ▼      ▼                   │     │
│  │ ┌───┐    ┌───┐   ┌───┐  ┌─────┐               │     │
│  │ │Tab│    │Tab│   │Tab│  │Panel│               │     │
│  │ └─┬─┘    └─┬─┘   └─┬─┘  └──┬──┘               │     │
│  │   │        │       │       │                    │     │
│  │   └────────┴───────┴───────┘                    │     │
│  │              │                                   │     │
│  │     useContext(TabsContext)                     │     │
│  │              │                                   │     │
│  │     { activeTab, setActiveTab }                 │     │
│  └────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

### 상태 변경 흐름

```
1. 사용자가 Tab 클릭
   │
   ▼
2. Tab 컴포넌트에서 setActiveTab('profile') 호출
   │
   ▼
3. Tabs 컴포넌트의 상태 업데이트
   │
   ▼
4. Provider의 value가 변경됨
   │
   ▼
5. Context를 구독하는 모든 컴포넌트 리렌더링
   │
   ├─▶ Tab들이 isActive 상태 업데이트
   │
   └─▶ Panel들이 표시 여부 업데이트
```

### Compound Pattern의 계층 구조

```
<Tabs>                              ← Provider (상태 관리)
  │
  ├── <TabList>                     ← 그룹 컨테이너
  │     ├── <Tab id="1">            ← Consumer (Context 사용)
  │     ├── <Tab id="2">            ← Consumer
  │     └── <Tab id="3">            ← Consumer
  │
  └── <TabPanels>                   ← 그룹 컨테이너
        ├── <TabPanel id="1">       ← Consumer (Context 사용)
        ├── <TabPanel id="2">       ← Consumer
        └── <TabPanel id="3">       ← Consumer

모든 자식 컴포넌트가 동일한 Context를 공유
```

### Props 전달 vs Context 비교

```
┌─────────────────────────────────────────────────────────┐
│                    Props 전달 방식                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Parent { state, setState }                              │
│    │                                                     │
│    ├─▶ Child1 { state, setState }                       │
│    │     └─▶ Grandchild { state, setState }             │
│    │                                                     │
│    ├─▶ Child2 { state, setState }                       │
│    │     └─▶ Grandchild { state, setState }             │
│    │                                                     │
│    └─▶ Child3 { state, setState }                       │
│          └─▶ Grandchild { state, setState }             │
│                                                          │
│  문제: 모든 중간 컴포넌트가 props를 전달해야 함          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   Context 방식                           │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Provider { value: { state, setState } }                 │
│    │                                                     │
│    ├─▶ Child1 { }                                       │
│    │     └─▶ Grandchild ← useContext()                  │
│    │                                                     │
│    ├─▶ Child2 { }                                       │
│    │     └─▶ Grandchild ← useContext()                  │
│    │                                                     │
│    └─▶ Child3 { }                                       │
│          └─▶ Grandchild ← useContext()                  │
│                                                          │
│  장점: 중간 컴포넌트는 props 전달 불필요                 │
└─────────────────────────────────────────────────────────┘
```

## 성능 최적화

Context를 사용할 때 주의하지 않으면 불필요한 리렌더링이 발생할 수 있습니다.

### 문제 1: 매번 새로운 객체 생성

```tsx
// ❌ 나쁜 예: 매 렌더링마다 새 객체 생성
const Tabs = ({ children }) => {
  const [activeTab, setActiveTab] = useState('home');

  // 이 객체는 매번 새로 생성됩니다!
  const value = {
    activeTab,
    setActiveTab
  };

  return (
    <TabsContext.Provider value={value}>
      {children}
    </TabsContext.Provider>
  );
};

// 문제: value가 매번 달라지므로 모든 Consumer가 리렌더링됩니다
```

### 해결 1: useMemo 사용

```tsx
// ✅ 좋은 예: useMemo로 최적화
const Tabs = ({ children }) => {
  const [activeTab, setActiveTab] = useState('home');

  // activeTab이 변경될 때만 새 객체 생성
  const value = useMemo(() => ({
    activeTab,
    setActiveTab
  }), [activeTab]);

  return (
    <TabsContext.Provider value={value}>
      {children}
    </TabsContext.Provider>
  );
};
```

### 문제 2: 하나의 Context에 모든 상태

```tsx
// ❌ 나쁜 예: 모든 상태를 하나의 Context에
const FormContext = createContext(null);

const Form = ({ children }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  const value = {
    name, setName,
    email, setEmail,
    address, setAddress,
    phone, setPhone
  };

  return (
    <FormContext.Provider value={value}>
      {children}
    </FormContext.Provider>
  );
};

// 문제: name이 변경되면 email, address, phone을 사용하는 컴포넌트도 리렌더링
```

### 해결 2: Context 분리

{% raw %}
```tsx
// ✅ 좋은 예: 관심사별로 Context 분리
const NameContext = createContext(null);
const EmailContext = createContext(null);
const AddressContext = createContext(null);
const PhoneContext = createContext(null);

const Form = ({ children }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  return (
    <NameContext.Provider value={{ name, setName }}>
      <EmailContext.Provider value={{ email, setEmail }}>
        <AddressContext.Provider value={{ address, setAddress }}>
          <PhoneContext.Provider value={{ phone, setPhone }}>
            {children}
          </PhoneContext.Provider>
        </AddressContext.Provider>
      </EmailContext.Provider>
    </NameContext.Provider>
  );
};

// 이제 각 컴포넌트는 필요한 Context만 구독합니다
```
{% endraw %}

### 문제 3: 불필요한 컴포넌트 리렌더링

{% raw %}
```tsx
// ❌ 나쁜 예: 모든 자식이 리렌더링됨
const Tabs = ({ children }) => {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs">
        {children}
      </div>
    </TabsContext.Provider>
  );
};
```
{% endraw %}

### 해결 3: React.memo 사용

```tsx
// ✅ 좋은 예: React.memo로 불필요한 리렌더링 방지
const Tab = React.memo(({ id, children }) => {
  const { activeTab, setActiveTab } = useTabsContext();

  const isActive = activeTab === id;

  return (
    <button
      className={`tab ${isActive ? 'tab--active' : ''}`}
      onClick={() => setActiveTab(id)}
    >
      {children}
    </button>
  );
});

Tab.displayName = 'Tab';
```

### 해결 4: Context Selector 패턴

```tsx
// ✅ 더 나은 방법: 필요한 값만 선택해서 구독
const TabsStateContext = createContext(null);
const TabsActionsContext = createContext(null);

const Tabs = ({ children }) => {
  const [activeTab, setActiveTab] = useState('home');

  // 상태와 액션을 분리
  const state = useMemo(() => ({ activeTab }), [activeTab]);
  const actions = useMemo(() => ({ setActiveTab }), []);

  return (
    <TabsStateContext.Provider value={state}>
      <TabsActionsContext.Provider value={actions}>
        {children}
      </TabsActionsContext.Provider>
    </TabsStateContext.Provider>
  );
};

// 상태만 필요한 컴포넌트
const TabPanel = ({ id, children }) => {
  const { activeTab } = useContext(TabsStateContext);
  // setActiveTab가 변경되어도 리렌더링 안 됨!

  if (activeTab !== id) return null;
  return <div>{children}</div>;
};

// 액션만 필요한 컴포넌트
const TabResetButton = () => {
  const { setActiveTab } = useContext(TabsActionsContext);
  // activeTab이 변경되어도 리렌더링 안 됨!

  return <button onClick={() => setActiveTab('home')}>리셋</button>;
};
```

### 성능 측정 도구

```tsx
// React DevTools Profiler로 성능 측정
import { Profiler } from 'react';

const onRenderCallback = (
  id, // 프로파일러 ID
  phase, // "mount" 또는 "update"
  actualDuration, // 렌더링 시간
  baseDuration, // 최적화 없이 렌더링했을 때 예상 시간
  startTime, // React가 렌더링을 시작한 시간
  commitTime, // React가 이 업데이트를 커밋한 시간
  interactions // 이 업데이트와 관련된 상호작용
) => {
  console.log(`${id} took ${actualDuration}ms to render`);
};

<Profiler id="Tabs" onRender={onRenderCallback}>
  <Tabs>
    <TabList>
      <Tab>Tab 1</Tab>
      <Tab>Tab 2</Tab>
    </TabList>
  </Tabs>
</Profiler>
```

## 함정과 주의사항 (Pitfalls)

Context + Compound Pattern을 사용하면서 자주 마주치는 문제들과 해결 방법입니다.

### 함정 1: Provider 밖에서 Context 사용

```tsx
// ❌ 에러 발생!
function App() {
  return (
    <div>
      <Tab id="1">탭 1</Tab>  {/* TabsContext.Provider 밖에서 사용 */}
    </div>
  );
}

// Error: Tabs 서브컴포넌트는 Tabs 컴포넌트 내부에서만 사용할 수 있습니다.
```

**해결책:**

```tsx
// ✅ Custom Hook에서 명확한 에러 메시지 제공
const useTabsContext = () => {
  const context = useContext(TabsContext);

  if (!context) {
    throw new Error(
      'Tabs 서브컴포넌트는 Tabs 컴포넌트 내부에서만 사용할 수 있습니다.\n\n' +
      '올바른 사용법:\n' +
      '<Tabs>\n' +
      '  <Tab>...</Tab>\n' +
      '</Tabs>'
    );
  }

  return context;
};
```

### 함정 2: Context 기본값의 오해

```tsx
// ❌ 잘못된 이해: 기본값이 자동으로 사용될 것이라 생각
const TabsContext = createContext({
  activeTab: 'home',
  setActiveTab: () => {}
});

// 실제로는 Provider 없이 사용하면 기본값이 사용되지만,
// 이는 타입 에러를 숨기고 버그를 만들 수 있습니다!
```

**해결책:**

```tsx
// ✅ null을 기본값으로 하고 타입 체크 강제
const TabsContext = createContext<TabsContextValue | null>(null);

const useTabsContext = () => {
  const context = useContext(TabsContext);

  if (!context) {
    throw new Error('Provider 없이 사용됨');
  }

  return context;
};
```

### 함정 3: 순환 의존성

```tsx
// ❌ 컴포넌트끼리 서로 Context를 참조
const AccordionItem = ({ children }) => {
  const { openItems } = useAccordionContext();

  return (
    <div>
      {children}
      <AccordionHeader />  {/* 여기서 다시 Context 사용 */}
    </div>
  );
};

const AccordionHeader = () => {
  const { toggle } = useAccordionContext();
  const { itemId } = useAccordionItemContext();  // 또 다른 Context!

  return <button onClick={() => toggle(itemId)}>...</button>;
};

// 문제: Context 구조가 복잡해지고 디버깅이 어려워집니다
```

**해결책:**

{% raw %}
```tsx
// ✅ Context 계층을 명확하게 설계
const Accordion = ({ children }) => {
  // 최상위 Context
  return (
    <AccordionContext.Provider value={...}>
      {children}
    </AccordionContext.Provider>
  );
};

const AccordionItem = ({ id, children }) => {
  // 아이템별 Context (부모 Context 사용 가능)
  return (
    <AccordionItemContext.Provider value={{ id }}>
      {children}
    </AccordionItemContext.Provider>
  );
};
```
{% endraw %}

### 함정 4: 과도한 리렌더링

```tsx
// ❌ Context 값이 자주 변경되어 모든 자식이 리렌더링
const App = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <MouseContext.Provider value={mousePosition}>
      <ExpensiveComponent />  {/* 마우스 움직일 때마다 리렌더링! */}
    </MouseContext.Provider>
  );
};
```

**해결책:**

```tsx
// ✅ 방법 1: 구독 범위 최소화
const MouseTracker = () => {
  const { x, y } = useMouseContext();  // 여기서만 구독
  return <div>X: {x}, Y: {y}</div>;
};

const App = () => {
  return (
    <MouseProvider>
      <ExpensiveComponent />  {/* Context를 사용하지 않으므로 리렌더링 안 됨 */}
      <MouseTracker />
    </MouseProvider>
  );
};

// ✅ 방법 2: 업데이트 throttle
const MouseProvider = ({ children }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let timeoutId;

    const handleMouseMove = (e) => {
      if (timeoutId) return;

      timeoutId = setTimeout(() => {
        setMousePosition({ x: e.clientX, y: e.clientY });
        timeoutId = null;
      }, 16); // 약 60fps
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <MouseContext.Provider value={mousePosition}>
      {children}
    </MouseContext.Provider>
  );
};
```

### 함정 5: TypeScript 타입 안정성 부족

```tsx
// ❌ 타입이 느슨함
const TabsContext = createContext({} as any);

// 자동완성도 안 되고, 타입 에러도 잡지 못합니다
```

**해결책:**

```tsx
// ✅ 엄격한 타입 정의
interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
  orientation: 'horizontal' | 'vertical';
  disabled: boolean;
}

const TabsContext = createContext<TabsContextValue | null>(null);

// Custom Hook에서 타입 보장
const useTabsContext = (): TabsContextValue => {
  const context = useContext(TabsContext);

  if (!context) {
    throw new Error('useTabsContext must be used within Tabs');
  }

  return context;  // null이 제거된 타입 반환
};

// 사용할 때 자동완성 완벽하게 작동
const Tab = ({ id }) => {
  const { activeTab, setActiveTab } = useTabsContext();
  //      ~~~~~~~~~ 자동완성 ✓
};
```

### 함정 6: 메모리 누수

```tsx
// ❌ 이벤트 리스너가 정리되지 않음
const Modal = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    });
    // cleanup 함수 없음!
  }, []);

  // ...
};
```

**해결책:**

```tsx
// ✅ cleanup 함수로 이벤트 리스너 제거
const Modal = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);

      // cleanup 함수
      return () => {
        window.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen]);

  // ...
};
```

## 실전 활용 사례

실제 프로젝트에서 Context + Compound Pattern이 어떻게 사용되는지 살펴보겠습니다.

### 사례 1: 대시보드 위젯 시스템

```tsx
// 여러 위젯을 관리하는 대시보드
<Dashboard>
  <Dashboard.Header>
    <Dashboard.Title>분석 대시보드</Dashboard.Title>
    <Dashboard.Actions>
      <button>새로고침</button>
      <button>설정</button>
    </Dashboard.Actions>
  </Dashboard.Header>

  <Dashboard.Grid>
    <Dashboard.Widget id="sales" span={2}>
      <Dashboard.WidgetHeader>매출 현황</Dashboard.WidgetHeader>
      <Dashboard.WidgetContent>
        <SalesChart />
      </Dashboard.WidgetContent>
    </Dashboard.Widget>

    <Dashboard.Widget id="users">
      <Dashboard.WidgetHeader>사용자 통계</Dashboard.WidgetHeader>
      <Dashboard.WidgetContent>
        <UserStats />
      </Dashboard.WidgetContent>
    </Dashboard.Widget>

    <Dashboard.Widget id="notifications">
      <Dashboard.WidgetHeader>
        알림
        <Dashboard.WidgetBadge count={5} />
      </Dashboard.WidgetHeader>
      <Dashboard.WidgetContent>
        <NotificationList />
      </Dashboard.WidgetContent>
    </Dashboard.Widget>
  </Dashboard.Grid>
</Dashboard>
```

### 사례 2: 데이터 테이블

```tsx
// 복잡한 데이터 테이블
<DataTable data={users} onSort={handleSort}>
  <DataTable.Toolbar>
    <DataTable.Search placeholder="검색..." />
    <DataTable.Filter columns={['role', 'status']} />
    <DataTable.Export formats={['csv', 'excel']} />
  </DataTable.Toolbar>

  <DataTable.Table>
    <DataTable.Header>
      <DataTable.Column sortable>이름</DataTable.Column>
      <DataTable.Column sortable>이메일</DataTable.Column>
      <DataTable.Column>역할</DataTable.Column>
      <DataTable.Column>상태</DataTable.Column>
      <DataTable.Column>액션</DataTable.Column>
    </DataTable.Header>

    <DataTable.Body>
      {users.map(user => (
        <DataTable.Row key={user.id}>
          <DataTable.Cell>{user.name}</DataTable.Cell>
          <DataTable.Cell>{user.email}</DataTable.Cell>
          <DataTable.Cell>
            <Badge>{user.role}</Badge>
          </DataTable.Cell>
          <DataTable.Cell>
            <StatusIndicator status={user.status} />
          </DataTable.Cell>
          <DataTable.Cell>
            <DataTable.Actions>
              <button>편집</button>
              <button>삭제</button>
            </DataTable.Actions>
          </DataTable.Cell>
        </DataTable.Row>
      ))}
    </DataTable.Body>
  </DataTable.Table>

  <DataTable.Pagination
    totalItems={totalUsers}
    itemsPerPage={20}
  />
</DataTable>
```

### 사례 3: 폼 빌더

```tsx
// 동적 폼 생성기
<FormBuilder onSubmit={handleSubmit} validation={validationSchema}>
  <FormBuilder.Section title="기본 정보">
    <FormBuilder.Field
      name="name"
      label="이름"
      required
    >
      <FormBuilder.Input />
      <FormBuilder.ErrorMessage />
    </FormBuilder.Field>

    <FormBuilder.Field
      name="email"
      label="이메일"
      required
    >
      <FormBuilder.Input type="email" />
      <FormBuilder.HelperText>
        업무용 이메일을 입력하세요
      </FormBuilder.HelperText>
      <FormBuilder.ErrorMessage />
    </FormBuilder.Field>
  </FormBuilder.Section>

  <FormBuilder.Section title="추가 정보">
    <FormBuilder.Field name="role" label="역할">
      <FormBuilder.Select
        options={[
          { value: 'admin', label: '관리자' },
          { value: 'user', label: '사용자' }
        ]}
      />
    </FormBuilder.Field>

    <FormBuilder.Field name="bio" label="소개">
      <FormBuilder.Textarea rows={4} />
    </FormBuilder.Field>

    <FormBuilder.Field name="agree" label="약관 동의">
      <FormBuilder.Checkbox>
        이용약관에 동의합니다
      </FormBuilder.Checkbox>
    </FormBuilder.Field>
  </FormBuilder.Section>

  <FormBuilder.Actions>
    <FormBuilder.ResetButton>초기화</FormBuilder.ResetButton>
    <FormBuilder.SubmitButton>제출</FormBuilder.SubmitButton>
  </FormBuilder.Actions>
</FormBuilder>
```

## 다른 상태 관리와의 비교

Context + Compound Pattern을 다른 상태 관리 방법과 비교해보겠습니다.

### Context API vs Redux

| 특징 | Context API | Redux |
|------|-------------|-------|
| **학습 곡선** | 낮음 | 높음 |
| **보일러플레이트** | 적음 | 많음 |
| **DevTools** | 제한적 | 강력함 |
| **미들웨어** | 없음 | 풍부함 |
| **시간여행 디버깅** | 없음 | 있음 |
| **적합한 규모** | 작은~중간 | 중간~큰 |

{% raw %}
```tsx
// Context API
const Tabs = ({ children }) => {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabsContext.Provider>
  );
};

// Redux
const tabsSlice = createSlice({
  name: 'tabs',
  initialState: { activeTab: 'home' },
  reducers: {
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    }
  }
});

// 사용
const Tab = ({ id }) => {
  const dispatch = useDispatch();
  const activeTab = useSelector(state => state.tabs.activeTab);

  return (
    <button onClick={() => dispatch(setActiveTab(id))}>
      {id}
    </button>
  );
};
```
{% endraw %}

**언제 Context를 쓸까?**
- 컴포넌트 라이브러리 (Tabs, Modal 등)
- 테마, 언어 설정 같은 전역 설정
- 부모-자식 간 깊은 props 전달

**언제 Redux를 쓸까?**
- 복잡한 비즈니스 로직
- 여러 컴포넌트에서 공유되는 복잡한 상태
- 디버깅과 상태 추적이 중요한 경우

### Context API vs Zustand

```tsx
// Context API
const useTheme = () => {
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return { theme, toggleTheme };
};

// Zustand
import create from 'zustand';

const useThemeStore = create((set) => ({
  theme: 'light',
  toggleTheme: () => set((state) => ({
    theme: state.theme === 'light' ? 'dark' : 'light'
  }))
}));

// 사용
const ThemeToggle = () => {
  const { theme, toggleTheme } = useThemeStore();
  return <button onClick={toggleTheme}>{theme}</button>;
};
```

**Zustand의 장점:**
- Provider 불필요
- 더 간결한 문법
- 성능 최적화가 쉬움

**Context의 장점:**
- React 내장 기능
- 추가 라이브러리 불필요
- Compound Pattern과 자연스럽게 통합

### Context API vs React Query

{% raw %}
```tsx
// Context API (로컬 상태)
const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchUser = async () => {
    setLoading(true);
    const data = await api.getUser();
    setUser(data);
    setLoading(false);
  };

  return (
    <UserContext.Provider value={{ user, loading, fetchUser }}>
      {children}
    </UserContext.Provider>
  );
};

// React Query (서버 상태)
const useUser = () => {
  return useQuery('user', api.getUser, {
    staleTime: 5000,
    refetchOnWindowFocus: true
  });
};

const UserProfile = () => {
  const { data: user, isLoading, refetch } = useUser();

  if (isLoading) return <div>Loading...</div>;
  return <div>{user.name}</div>;
};
```
{% endraw %}

**언제 뭘 쓸까?**
- **Context**: UI 상태 (열림/닫힘, 선택된 탭 등)
- **React Query**: 서버 데이터 (API 응답, 캐싱 등)

## TypeScript 완벽 가이드

TypeScript와 함께 사용할 때의 베스트 프랙티스입니다.

### 제네릭을 활용한 재사용 가능한 Context

{% raw %}
```tsx
// 제네릭 Context Factory
function createGenericContext<T>() {
  const Context = createContext<T | null>(null);

  const useContext = (): T => {
    const context = useContext(Context);
    if (!context) {
      throw new Error('Context must be used within Provider');
    }
    return context;
  };

  return [Context.Provider, useContext] as const;
}

// 사용 예시
interface TabsState {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const [TabsProvider, useTabsContext] = createGenericContext<TabsState>();

const Tabs = ({ children }) => {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <TabsProvider value={{ activeTab, setActiveTab }}>
      {children}
    </TabsProvider>
  );
};
```
{% endraw %}

### 엄격한 Props 타입

```tsx
// 서브컴포넌트 타입 정의
interface TabProps {
  id: string;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
  onClick?: (id: string) => void;
}

interface TabListProps {
  children: ReactNode;
  'aria-label'?: string;
  className?: string;
}

// Compound Component 타입
interface TabsComponent extends FC<TabsProps> {
  List: FC<TabListProps>;
  Tab: FC<TabProps>;
  Panels: FC<{ children: ReactNode }>;
  Panel: FC<TabPanelProps>;
}

const Tabs: TabsComponent = ({ children, ...props }) => {
  // ...
};

Tabs.List = TabList;
Tabs.Tab = Tab;
Tabs.Panels = TabPanels;
Tabs.Panel = TabPanel;
```

### 타입 안전한 Event Handler

```tsx
interface AccordionContextValue {
  openItems: Set<string>;
  toggle: (id: string) => void;
  registerItem: (id: string) => () => void;
}

const Accordion = ({ children }: { children: ReactNode }) => {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  // 타입 안전한 toggle 함수
  const toggle = useCallback((id: string) => {
    setOpenItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // cleanup을 위한 register 함수
  const registerItem = useCallback((id: string) => {
    return () => {
      setOpenItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    };
  }, []);

  const value: AccordionContextValue = {
    openItems,
    toggle,
    registerItem
  };

  return (
    <AccordionContext.Provider value={value}>
      {children}
    </AccordionContext.Provider>
  );
};
```

### Discriminated Union으로 상태 관리

{% raw %}
```tsx
// 상태를 명확하게 구분
type FetchState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

interface DataContextValue<T> {
  state: FetchState<T>;
  refetch: () => void;
}

function createDataContext<T>() {
  const Context = createContext<DataContextValue<T> | null>(null);

  const Provider = ({
    children,
    fetcher
  }: {
    children: ReactNode;
    fetcher: () => Promise<T>
  }) => {
    const [state, setState] = useState<FetchState<T>>({ status: 'idle' });

    const refetch = async () => {
      setState({ status: 'loading' });
      try {
        const data = await fetcher();
        setState({ status: 'success', data });
      } catch (error) {
        setState({ status: 'error', error: error as Error });
      }
    };

    return (
      <Context.Provider value={{ state, refetch }}>
        {children}
      </Context.Provider>
    );
  };

  const useData = () => {
    const context = useContext(Context);
    if (!context) {
      throw new Error('useData must be used within Provider');
    }
    return context;
  };

  return { Provider, useData };
}

// 사용
const { Provider: UserProvider, useData: useUserData } =
  createDataContext<User>();

const UserProfile = () => {
  const { state, refetch } = useUserData();

  // TypeScript가 상태별로 타입을 좁혀줌
  switch (state.status) {
    case 'idle':
      return <button onClick={refetch}>Load User</button>;
    case 'loading':
      return <div>Loading...</div>;
    case 'success':
      return <div>{state.data.name}</div>;  // data가 T 타입으로 추론됨
    case 'error':
      return <div>Error: {state.error.message}</div>;  // error가 Error 타입
  }
};
```
{% endraw %}

## 참고 자료

### 공식 문서
- [React Context API 공식 문서](https://react.dev/reference/react/createContext)
- [Compound Components Pattern - Kent C. Dodds](https://kentcdodds.com/blog/compound-components-with-react-hooks)
- [React Patterns](https://reactpatterns.com/)

### 라이브러리 예시
- [Radix UI](https://www.radix-ui.com/) - Context + Compound Pattern의 완벽한 구현
- [Headless UI](https://headlessui.com/) - Tailwind의 headless component 라이브러리
- [Chakra UI](https://chakra-ui.com/) - 접근성이 뛰어난 컴포넌트 라이브러리
- [Reach UI](https://reach.tech/) - 접근성에 집중한 컴포넌트

### 추가 학습 자료
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Context API Best Practices](https://blog.logrocket.com/react-context-api-deep-dive-examples/)
- [Performance Optimization with Context](https://kentcdodds.com/blog/how-to-optimize-your-context-value)

## 결론

Context API와 Compound Pattern의 조합은 React에서 복잡한 UI 컴포넌트를 만들 때 매우 강력한 도구입니다.

**핵심 요약:**

1. **Prop Drilling 해결**: Context로 깊은 계층의 컴포넌트에 직접 데이터 전달
2. **유연한 구조**: Compound Pattern으로 자유로운 컴포넌트 조합
3. **완벽한 캡슐화**: 내부 로직을 숨기고 깔끔한 API 제공
4. **타입 안정성**: TypeScript와 함께 사용하면 안전한 개발 가능
5. **성능 최적화**: useMemo, React.memo, Context 분리로 최적화

**언제 사용할까?**
- UI 컴포넌트 라이브러리 제작
- 복잡한 상호작용이 있는 컴포넌트 (Tabs, Accordion, Modal 등)
- 여러 서브컴포넌트가 상태를 공유해야 할 때

**주의할 점:**
- 과도한 리렌더링 방지
- Context 분리로 관심사 분리
- TypeScript로 타입 안정성 확보
- 명확한 에러 메시지 제공

이 패턴을 마스터하면 재사용 가능하고 유지보수하기 쉬운 컴포넌트를 만들 수 있습니다. 직접 Tabs나 Accordion 같은 컴포넌트를 만들어보면서 익히시길 추천합니다!
