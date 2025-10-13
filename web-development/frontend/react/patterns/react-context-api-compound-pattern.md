---
render_with_liquid: false
layout: page
---

# `Context API`를 활용한 `Compound Pattern` 구현

> React의 `Context API`는 `Compound Pattern`을 구현할 때 사용됩니다.

`Context`는 컴포넌트 트리에서 데이터를 전역적으로 공유할 수 있게 해주는 React의 기능입니다. 
`prop drilling` 없이 깊은 컴포넌트 계층에 데이터를 전달할 수 있습니다.

### Context vs Provider 차이점

많은 개발자들이 Context와 Provider를 혼동하는데, 실제로는 **Context와 Provider는 함께 동작하는 하나의 시스템**입니다.

| 구분 | Context | Provider |
|------|---------|----------|
| **역할** | 데이터 저장소 정의 | 데이터 제공자 |
| **생성** | `createContext()` | `Context.Provider` |
| **기능** | 타입과 기본값 정의 | 실제 값 전달 |
| **사용** | `useContext(Context)` | JSX에서 컴포넌트 감싸기 |



```tsx
// Context: 데이터 구조 정의
const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {}
});

// Provider: 실제 데이터 제공
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



**Context만으로는 데이터 공유가 불가능**하며, 반드시 **Provider와 함께 사용**해야 합니다. Context는 "무엇을 공유할지"를 정의하고, Provider는 "실제 값을 어떻게 제공할지"를 구현합니다.

## `Compound Pattern`에서의 `Context` 활용

### 1. 기본 구조



```tsx
// Context 생성
const DailyContext = createContext<DailyContextType | null>(null);

// Provider 컴포넌트
const Daily: DailyComponent = ({ children, ...props }) => {
  const [state, setState] = useState(initialState);

  const contextValue = {
    state,
    setState,
    // 공유할 함수들
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



### 2. `Context` 사용하는 서브컴포넌트



```tsx
// Custom Hook으로 Context 접근
const useDailyContext = () => {
  const context = useContext(DailyContext);
  if (!context) {
    throw new Error('Daily 서브컴포넌트는 Daily 내부에서만 사용할 수 있습니다.');
  }
  return context;
};

// 서브컴포넌트에서 Context 활용
const DailyHeader = ({ title, ...props }) => {
  const { state, updateHeader } = useDailyContext();

  return (
    <header {...props}>
      <h2>{title}</h2>
    </header>
  );
};
```



## `Context` 활용 사례

### 1. 상태 공유


```tsx
const Weekly = createContext<{
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  isAutoPlaying: boolean;
  setIsAutoPlaying: (playing: boolean) => void;
} | null>(null);

const Weekly = ({ children }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  return (
    <Weekly.Provider value={{
      currentIndex,
      setCurrentIndex,
      isAutoPlaying,
      setIsAutoPlaying
    }}>
      <div className="weekly">
        {children}
      </div>
    </Weekly.Provider>
  );
};
```



### 2. 네비게이션 컴포넌트에서 `Context` 활용


```tsx
const Navigation = ({ showIndicator }) => {
  const { currentIndex, setCurrentIndex, isAutoPlaying } = useWeeklyContext();

  return (
    <nav>
      <button onClick={() => setCurrentIndex(currentIndex - 1)}>이전</button>
      {showIndicator && <span>{currentIndex + 1}</span>}
      <button onClick={() => setCurrentIndex(currentIndex + 1)}>다음</button>
    </nav>
  );
};
```



## `Context` 활용의 장점

### 1. **컴포넌트 간 통신**
- 서브컴포넌트들이 부모의 상태를 공유
- prop drilling 없이 깊은 계층에 데이터 전달

### 2. **일관된 동작**
- 모든 서브컴포넌트가 같은 상태를 참조
- 상태 변경 시 관련 컴포넌트들이 자동으로 업데이트

### 3. **캡슐화**
- Context를 통해 내부 로직을 숨김
- 외부에서는 단순한 API만 노출

## `Context` 활용 패턴

### 1. 다중 `Context`


```tsx
// 서로 다른 관심사를 분리
const UIStateContext = createContext(null);
const DataContext = createContext(null);

const ComplexComponent = ({ children }) => (
  <UIStateContext.Provider value={uiState}>
    <DataContext.Provider value={data}>
      {children}
    </DataContext.Provider>
  </UIStateContext.Provider>
);
```



### 2. `Context` + `Reducer` 패턴


```tsx
const initialState = {
  currentSlide: 0,
  isPlaying: false,
  slides: []
};

const swiperReducer = (state, action) => {
  switch (action.type) {
    case 'NEXT_SLIDE':
      return { ...state, currentSlide: state.currentSlide + 1 };
    case 'PREV_SLIDE':
      return { ...state, currentSlide: state.currentSlide - 1 };
    case 'TOGGLE_PLAY':
      return { ...state, isPlaying: !state.isPlaying };
    default:
      return state;
  }
};

const SwiperContext = createContext();

const Swiper = ({ children }) => {
  const [state, dispatch] = useReducer(swiperReducer, initialState);

  return (
    <SwiperContext.Provider value={{ state, dispatch }}>
      {children}
    </SwiperContext.Provider>
  );
};
```



## 주의사항

### 1. **성능 고려**


```tsx
// ❌ 매번 새 객체 생성으로 불필요한 리렌더링
const contextValue = {
  data,
  updateData: (newData) => setData(newData)
};

// ✅ useMemo로 최적화
const contextValue = useMemo(() => ({
  data,
  updateData: (newData) => setData(newData)
}), [data]);
```



### 2. **타입 안정성**


```tsx
interface ContextType {
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  totalItems: number;
}

const MyContext = createContext<ContextType | null>(null);

const useMyContext = (): ContextType => {
  const context = useContext(MyContext);
  if (!context) {
    throw new Error('useMyContext must be used within MyProvider');
  }
  return context;
};
```



### 3. **적절한 범위 설정**


```tsx
// Context는 필요한 범위에서만 사용
const ArticleListProvider = ({ children }) => (
  <ArticleListContext.Provider value={contextValue}>
    {children}
  </ArticleListContext.Provider>
);

// 전역이 아닌 특정 컴포넌트 트리에서만 활용
<ArticleListProvider>
  <ArticleList>
    <ArticleList.Header />
    <ArticleList.Content />
    <ArticleList.Pagination />
  </ArticleList>
</ArticleListProvider>
```



## 결론

`Context`는 `Compound` Pattern에서 서브컴포넌트들 간의 상태 공유와 통신을 가능하게 합니다. 
적절히 활용하면 컴포넌트 간의 결합도를 낮추면서도 일관된 동작을 보장할 수 있습니다. 
다만 성능과 타입 안정성을 고려하여 설계해야 합니다.

# 참고
