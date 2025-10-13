---
title: `useMemo`를 활용한 성능 최적화
date: 2025-10-02
last_modified_at: 2025-10-13
layout: page
---
# React 성능 최적화의 핵심, `useMemo` 완벽 가이드

상상해보세요. 여러분이 만든 React 앱의 검색 페이지에서 사용자가 검색어를 입력할 때마다 화면이 버벅입니다. 단 1글자를 입력할 때마다 수백 개의 아이템을 필터링하고 정렬하는 작업이 반복되고, 그 결과 입력이 느려지고 사용자는 답답함을 느낍니다. "React는 빠르다던데 왜 이럴까?" 하고 의아해하셨나요?

저도 처음에는 같은 경험을 했습니다. 리스트 컴포넌트에서 `filter()`와 `sort()`를 사용했는데, 부모 컴포넌트의 다른 상태가 바뀔 때마다 리스트 전체가 다시 계산되었죠. 심지어 버튼 하나를 클릭할 때마다 무거운 계산이 반복되었습니다. 그때 알게 된 것이 바로 `useMemo`였습니다.

## 왜 useMemo를 이해해야 할까요?

React의 기본 동작 방식을 이해하면 `useMemo`의 중요성이 명확해집니다. React는 상태나 props가 변경될 때마다 컴포넌트 함수를 **처음부터 끝까지 다시 실행**합니다. 이는 대부분의 경우 문제없지만, 다음과 같은 상황에서는 심각한 성능 문제를 야기합니다:

### 1. 불필요한 재계산 문제

```tsx
function ProductList({ products, theme }) {
  // theme이 바뀔 때마다 이 무거운 계산이 반복됩니다!
  const sortedProducts = products
    .filter(p => p.stock > 0)
    .sort((a, b) => b.rating - a.rating)
    .map(p => ({
      ...p,
      priceWithTax: p.price * 1.1,
      displayName: p.name.toUpperCase()
    }));

  return (
    <div className={theme}>
      {sortedProducts.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

위 코드에서 `theme`이 "light"에서 "dark"로 바뀌면 어떻게 될까요? `products` 배열은 전혀 변하지 않았는데도 필터링, 정렬, 맵핑이 모두 다시 실행됩니다. 1,000개의 상품이 있다면 이는 심각한 성능 저하를 일으킵니다.

### 2. 참조 동일성 문제

```tsx
function ParentComponent() {
  const [count, setCount] = useState(0);

  // count가 바뀔 때마다 새로운 객체가 생성됩니다
  const config = {
    apiUrl: 'https://api.example.com',
    timeout: 5000
  };

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>
      <ExpensiveChild config={config} />
    </div>
  );
}

const ExpensiveChild = React.memo(({ config }) => {
  // React.memo를 사용했지만 config가 매번 새 객체이므로
  // 리렌더링을 막을 수 없습니다!
  console.log('ExpensiveChild rendered!');

  return <div>Child component</div>;
});
```

`React.memo`를 사용해서 최적화했다고 생각했지만, `config` 객체는 렌더링마다 새로 생성되므로 참조가 달라져 자식 컴포넌트가 매번 리렌더링됩니다.

### 3. Context API의 성능 함정

```tsx
function DataProvider({ children }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // loading만 바뀌어도 모든 Consumer가 리렌더링됩니다!
  const value = {
    data,
    loading,
    setData,
    setLoading
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}
```

`loading` 상태만 `false`에서 `true`로 바뀌었는데, `data`를 사용하는 모든 컴포넌트가 리렌더링됩니다. `value` 객체가 매번 새로 생성되기 때문입니다.

**이런 문제들을 `useMemo`로 해결할 수 있습니다.** 메모이제이션(Memoization)을 통해 불필요한 재계산을 방지하고, 참조 동일성을 보장하여 불필요한 리렌더링을 막을 수 있습니다.

## 기본 개념: useMemo란 무엇인가?

### 메모이제이션(Memoization)이란?

메모이제이션은 **이전에 계산한 결과를 저장해두고 재사용하는 최적화 기법**입니다. 수학에서 배운 함수의 캐싱과 비슷합니다:

```
f(2) = 4  // 처음 계산
f(3) = 9  // 처음 계산
f(2) = 4  // 이미 계산했으니 저장된 값 반환 (재계산 안 함!)
```

React의 `useMemo`도 같은 원리로 동작합니다.

### useMemo의 기본 문법

```tsx
const memoizedValue = useMemo(
  () => {
    // 이 함수의 반환값이 메모이제이션됩니다
    return expensiveCalculation(a, b);
  },
  [a, b] // 의존성 배열: 이 값들이 변경될 때만 재계산
);
```

**동작 원리:**

```
렌더링 #1: a=1, b=2
→ expensiveCalculation(1, 2) 실행
→ 결과: 10
→ 저장: { deps: [1, 2], value: 10 }

렌더링 #2: a=1, b=2 (동일!)
→ 의존성 배열 비교: [1, 2] === [1, 2] ✅
→ 저장된 값 10 반환 (계산 건너뜀!)

렌더링 #3: a=1, b=3 (b 변경!)
→ 의존성 배열 비교: [1, 3] !== [1, 2] ❌
→ expensiveCalculation(1, 3) 실행
→ 결과: 15
→ 저장: { deps: [1, 3], value: 15 }
```

### 시각적 다이어그램

```
┌─────────────────────────────────────────┐
│         Component Re-render              │
└───────────┬─────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────┐
│  useMemo 의존성 배열 체크                │
│  이전 [a, b]와 현재 [a, b] 비교          │
└───────────┬─────────────────────────────┘
            │
     ┌──────┴──────┐
     │             │
     ▼             ▼
  동일함          변경됨
     │             │
     ▼             ▼
캐시된 값 반환   계산 함수 실행
     │             │
     │             ▼
     │        새 값 캐싱
     │             │
     └──────┬──────┘
            │
            ▼
      memoizedValue
```

## 실전 예제: 언제 useMemo를 사용해야 할까?

### 예제 1: 복잡한 필터링과 정렬

**❌ 나쁜 예: 매번 재계산**

```tsx
function ArticleList({ articles, category, searchTerm, sortBy }) {
  // 문제: 어떤 props가 바뀌든 이 모든 계산이 반복됩니다
  const displayArticles = articles
    .filter(article => {
      // 카테고리 필터링
      if (category && article.category !== category) return false;

      // 검색어 필터링 (제목, 내용, 태그 모두 검색)
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          article.title.toLowerCase().includes(term) ||
          article.content.toLowerCase().includes(term) ||
          article.tags.some(tag => tag.toLowerCase().includes(term))
        );
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'views':
          return b.views - a.views;
        case 'likes':
          return b.likes - a.likes;
        default:
          return 0;
      }
    });

  console.log('Filtered and sorted!'); // 매번 출력됨

  return (
    <div>
      {displayArticles.map(article => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}
```

**성능 측정:**
```
articles: 1000개
렌더링 1회당 소요 시간: 약 15-20ms
불필요한 리렌더링 10회: 150-200ms (눈에 띄는 지연!)
```

**✅ 좋은 예: useMemo로 최적화**

```tsx
function ArticleList({ articles, category, searchTerm, sortBy }) {
  // useMemo로 메모이제이션: 의존성이 변경될 때만 재계산
  const displayArticles = useMemo(() => {
    console.log('Recalculating...'); // 의존성이 바뀔 때만 출력

    return articles
      .filter(article => {
        if (category && article.category !== category) return false;

        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          return (
            article.title.toLowerCase().includes(term) ||
            article.content.toLowerCase().includes(term) ||
            article.tags.some(tag => tag.toLowerCase().includes(term))
          );
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'date':
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          case 'title':
            return a.title.localeCompare(b.title);
          case 'views':
            return b.views - a.views;
          case 'likes':
            return b.likes - a.likes;
          default:
            return 0;
        }
      });
  }, [articles, category, searchTerm, sortBy]); // 이 4개 중 하나라도 바뀌면 재계산

  return (
    <div>
      {displayArticles.map(article => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}
```

**개선된 성능:**
```
테마 변경: 0ms (재계산 건너뜀!)
사이드바 토글: 0ms (재계산 건너뜀!)
검색어 입력: 15-20ms (필요한 재계산만 수행)
```

### 예제 2: 비용이 큰 계산

**❌ 나쁜 예: 피보나치 계산 반복**

```tsx
function FibonacciCalculator({ number, theme }) {
  // 테마가 바뀔 때마다 피보나치를 다시 계산합니다!
  function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
  }

  const result = fibonacci(number); // 매우 느림!

  return (
    <div className={theme}>
      <h2>Fibonacci({number}) = {result}</h2>
    </div>
  );
}

// 사용 예
<FibonacciCalculator number={35} theme="light" />
```

**성능 문제:**
```
fibonacci(35) 계산: 약 100-200ms
theme만 "light" → "dark"로 변경: 100-200ms 낭비!
```

**✅ 좋은 예: 계산 결과 메모이제이션**

```tsx
function FibonacciCalculator({ number, theme }) {
  // number가 같으면 이전 결과 재사용
  const result = useMemo(() => {
    console.log(`Calculating fibonacci(${number})...`);

    function fibonacci(n) {
      if (n <= 1) return n;
      return fibonacci(n - 1) + fibonacci(n - 2);
    }

    return fibonacci(number);
  }, [number]); // theme은 의존성에 없음!

  return (
    <div className={theme}>
      <h2>Fibonacci({number}) = {result}</h2>
    </div>
  );
}
```

**개선 효과:**
```
number=35로 처음 렌더링: 100-200ms (계산 필요)
theme 변경: 0ms (계산 건너뜀!)
number=36으로 변경: 200-300ms (새로운 계산 필요)
다시 number=35로 변경: 100-200ms (이전 결과는 캐시되지 않음)
```

### 예제 3: 참조 동일성 유지 (React.memo와 함께)

**❌ 나쁜 예: 자식 컴포넌트가 계속 리렌더링**

```tsx
function Dashboard() {
  const [count, setCount] = useState(0);
  const [userName, setUserName] = useState('홍길동');

  // 매번 새로운 객체 생성
  const userInfo = {
    name: userName,
    role: 'admin',
    permissions: ['read', 'write', 'delete']
  };

  // 매번 새로운 배열 생성
  const settings = [
    { key: 'theme', value: 'dark' },
    { key: 'language', value: 'ko' }
  ];

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>

      {/* count가 바뀔 때마다 리렌더링됨 (userInfo가 새 객체이므로) */}
      <UserProfile userInfo={userInfo} />

      {/* count가 바뀔 때마다 리렌더링됨 (settings가 새 배열이므로) */}
      <SettingsPanel settings={settings} />
    </div>
  );
}

const UserProfile = React.memo(({ userInfo }) => {
  console.log('UserProfile rendered!');
  return <div>Welcome, {userInfo.name}</div>;
});

const SettingsPanel = React.memo(({ settings }) => {
  console.log('SettingsPanel rendered!');
  return <div>{settings.length} settings</div>;
});
```

**결과:**
```
버튼 클릭 (count만 변경)
→ UserProfile rendered!  ← 불필요!
→ SettingsPanel rendered!  ← 불필요!
```

**✅ 좋은 예: 참조 안정화로 불필요한 리렌더링 방지**

```tsx
function Dashboard() {
  const [count, setCount] = useState(0);
  const [userName, setUserName] = useState('홍길동');

  // userName이 변경될 때만 새 객체 생성
  const userInfo = useMemo(() => ({
    name: userName,
    role: 'admin',
    permissions: ['read', 'write', 'delete']
  }), [userName]);

  // 한 번만 생성 (절대 변하지 않음)
  const settings = useMemo(() => [
    { key: 'theme', value: 'dark' },
    { key: 'language', value: 'ko' }
  ], []); // 빈 의존성 배열

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>

      {/* count가 바뀌어도 리렌더링 안 됨! */}
      <UserProfile userInfo={userInfo} />

      {/* count가 바뀌어도 리렌더링 안 됨! */}
      <SettingsPanel settings={settings} />
    </div>
  );
}

const UserProfile = React.memo(({ userInfo }) => {
  console.log('UserProfile rendered!');
  return <div>Welcome, {userInfo.name}</div>;
});

const SettingsPanel = React.memo(({ settings }) => {
  console.log('SettingsPanel rendered!');
  return <div>{settings.length} settings</div>;
});
```

**개선된 결과:**
```
버튼 클릭 (count만 변경)
→ (아무것도 출력 안 됨) ← 리렌더링 방지 성공!

userName 변경
→ UserProfile rendered!  ← 필요한 리렌더링만 발생!
```

### 예제 4: Context API 최적화

**❌ 나쁜 예: 모든 Consumer가 불필요하게 리렌더링**

```tsx
function ArticleProvider({ children }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // loading이나 error만 바뀌어도 새 객체 생성!
  const value = {
    articles,
    loading,
    error,
    addArticle: (article) => {
      setArticles(prev => [...prev, article]);
    },
    deleteArticle: (id) => {
      setArticles(prev => prev.filter(a => a.id !== id));
    }
  };

  return (
    <ArticleContext.Provider value={value}>
      {children}
    </ArticleContext.Provider>
  );
}

// Consumer 컴포넌트
function ArticleCount() {
  const { articles } = useContext(ArticleContext);
  console.log('ArticleCount rendered!');
  return <div>Total: {articles.length}</div>;
}

function LoadingSpinner() {
  const { loading } = useContext(ArticleContext);
  console.log('LoadingSpinner rendered!');
  return loading ? <div>Loading...</div> : null;
}
```

**문제:**
```
setLoading(true) 호출
→ ArticleCount rendered!  ← articles는 안 바뀌었는데 리렌더링!
→ LoadingSpinner rendered!  ← 필요한 리렌더링

setArticles([...]) 호출
→ ArticleCount rendered!  ← 필요한 리렌더링
→ LoadingSpinner rendered!  ← loading은 안 바뀌었는데 리렌더링!
```

**✅ 좋은 예: Context value 메모이제이션**

```tsx
function ArticleProvider({ children }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 함수들을 useCallback으로 메모이제이션
  const addArticle = useCallback((article) => {
    setArticles(prev => [...prev, article]);
  }, []); // 의존성 없음 (함수형 업데이트 사용)

  const deleteArticle = useCallback((id) => {
    setArticles(prev => prev.filter(a => a.id !== id));
  }, []);

  // Context value를 useMemo로 메모이제이션
  const value = useMemo(() => ({
    articles,
    loading,
    error,
    addArticle,
    deleteArticle
  }), [articles, loading, error, addArticle, deleteArticle]);

  return (
    <ArticleContext.Provider value={value}>
      {children}
    </ArticleContext.Provider>
  );
}
```

**개선 효과:**
여전히 모든 Consumer가 리렌더링되지만, 이제 **Context value의 불필요한 재생성을 방지**합니다. 더 나은 최적화를 위해서는 Context를 분리하는 것이 좋습니다:

**✅ 더 좋은 예: Context 분리**

```tsx
// 데이터와 로딩 상태를 분리
const ArticleDataContext = createContext();
const ArticleLoadingContext = createContext();

function ArticleProvider({ children }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addArticle = useCallback((article) => {
    setArticles(prev => [...prev, article]);
  }, []);

  const deleteArticle = useCallback((id) => {
    setArticles(prev => prev.filter(a => a.id !== id));
  }, []);

  // 데이터 관련 Context value
  const dataValue = useMemo(() => ({
    articles,
    addArticle,
    deleteArticle
  }), [articles, addArticle, deleteArticle]);

  // 로딩 관련 Context value
  const loadingValue = useMemo(() => ({
    loading,
    error
  }), [loading, error]);

  return (
    <ArticleDataContext.Provider value={dataValue}>
      <ArticleLoadingContext.Provider value={loadingValue}>
        {children}
      </ArticleLoadingContext.Provider>
    </ArticleDataContext.Provider>
  );
}

// 각각의 Consumer는 필요한 Context만 구독
function ArticleCount() {
  const { articles } = useContext(ArticleDataContext);
  console.log('ArticleCount rendered!');
  return <div>Total: {articles.length}</div>;
}

function LoadingSpinner() {
  const { loading } = useContext(ArticleLoadingContext);
  console.log('LoadingSpinner rendered!');
  return loading ? <div>Loading...</div> : null;
}
```

**최종 결과:**
```
setLoading(true) 호출
→ LoadingSpinner rendered!  ← loading만 사용하는 컴포넌트만 렌더링!

setArticles([...]) 호출
→ ArticleCount rendered!  ← articles만 사용하는 컴포넌트만 렌더링!
```

### 예제 5: 다단계 데이터 변환

**✅ 실전 예제: 대시보드 데이터 처리**

```tsx
function Dashboard({ rawData, filters, userPreferences }) {
  // 1단계: 기본 데이터 정규화
  const normalizedData = useMemo(() => {
    console.log('1단계: 데이터 정규화');
    return rawData.map(item => ({
      ...item,
      date: new Date(item.timestamp),
      value: parseFloat(item.value),
      category: item.category.toLowerCase()
    }));
  }, [rawData]);

  // 2단계: 필터링
  const filteredData = useMemo(() => {
    console.log('2단계: 필터링');
    return normalizedData.filter(item => {
      if (filters.category && item.category !== filters.category) {
        return false;
      }
      if (filters.dateFrom && item.date < filters.dateFrom) {
        return false;
      }
      if (filters.dateTo && item.date > filters.dateTo) {
        return false;
      }
      return true;
    });
  }, [normalizedData, filters]);

  // 3단계: 정렬
  const sortedData = useMemo(() => {
    console.log('3단계: 정렬');
    const sorted = [...filteredData];
    sorted.sort((a, b) => {
      switch (userPreferences.sortBy) {
        case 'date':
          return b.date.getTime() - a.date.getTime();
        case 'value':
          return b.value - a.value;
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });
    return userPreferences.sortOrder === 'desc' ? sorted : sorted.reverse();
  }, [filteredData, userPreferences.sortBy, userPreferences.sortOrder]);

  // 4단계: 집계 데이터 계산
  const aggregatedData = useMemo(() => {
    console.log('4단계: 집계');
    return {
      total: sortedData.reduce((sum, item) => sum + item.value, 0),
      average: sortedData.length > 0
        ? sortedData.reduce((sum, item) => sum + item.value, 0) / sortedData.length
        : 0,
      max: Math.max(...sortedData.map(item => item.value)),
      min: Math.min(...sortedData.map(item => item.value)),
      count: sortedData.length
    };
  }, [sortedData]);

  // 5단계: 차트 데이터 변환
  const chartData = useMemo(() => {
    console.log('5단계: 차트 데이터 변환');
    return sortedData.map(item => ({
      x: item.date.toISOString().split('T')[0],
      y: item.value,
      label: item.category
    }));
  }, [sortedData]);

  return (
    <div>
      <SummaryCards data={aggregatedData} />
      <DataTable data={sortedData} />
      <Chart data={chartData} />
    </div>
  );
}
```

**최적화 효과:**
```
// 시나리오 1: rawData만 변경
→ 1단계 실행 → 2단계 실행 → 3단계 실행 → 4단계 실행 → 5단계 실행

// 시나리오 2: filters.category만 변경
→ 1단계 건너뜀 → 2단계 실행 → 3단계 실행 → 4단계 실행 → 5단계 실행

// 시나리오 3: userPreferences.sortBy만 변경
→ 1단계 건너뜀 → 2단계 건너뜀 → 3단계 실행 → 4단계 실행 → 5단계 실행

// 시나리오 4: 다른 상태 변경 (theme 등)
→ 모든 단계 건너뜀!
```

### 예제 6: 동적 스타일 계산

**✅ CSS-in-JS 최적화**

```tsx
function AnimatedList({ items, isAutoPlaying, currentIndex }) {
  // 컨테이너 클래스명 메모이제이션
  const containerClassName = useMemo(() => {
    const baseClass = 'animated-list';
    const animationClass = isAutoPlaying
      ? 'animated-list--playing'
      : 'animated-list--paused';
    const layoutClass = items.length > 10
      ? 'animated-list--grid'
      : 'animated-list--flex';

    return `${baseClass} ${animationClass} ${layoutClass}`;
  }, [isAutoPlaying, items.length]);

  // CSS 변수를 통한 동적 스타일 메모이제이션
  const containerStyle = useMemo(() => ({
    '--current-index': currentIndex,
    '--total-items': items.length,
    '--animation-duration': isAutoPlaying ? '0.5s' : '0s'
  }), [currentIndex, items.length, isAutoPlaying]);

  // 각 아이템의 스타일 계산 메모이제이션
  const itemStyles = useMemo(() => {
    return items.map((item, index) => ({
      transform: `translateX(${(index - currentIndex) * 100}%)`,
      opacity: Math.abs(index - currentIndex) <= 1 ? 1 : 0,
      zIndex: items.length - Math.abs(index - currentIndex)
    }));
  }, [items, currentIndex]);

  return (
    <div className={containerClassName} style={containerStyle}>
      {items.map((item, index) => (
        <div
          key={item.id}
          className="animated-list__item"
          style={itemStyles[index]}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
```

## 좋은 예 vs 나쁜 예: 언제 사용하지 말아야 할까?

### ❌ 나쁜 예 1: 단순한 계산에 useMemo 사용

```tsx
function SimpleComponent({ a, b }) {
  // 나쁜 예: useMemo의 오버헤드가 계산 비용보다 큼
  const sum = useMemo(() => a + b, [a, b]);
  const product = useMemo(() => a * b, [a, b]);
  const isEven = useMemo(() => sum % 2 === 0, [sum]);

  return (
    <div>
      <p>Sum: {sum}</p>
      <p>Product: {product}</p>
      <p>Is Even: {isEven ? 'Yes' : 'No'}</p>
    </div>
  );
}

// ✅ 좋은 예: 그냥 계산하세요
function SimpleComponent({ a, b }) {
  const sum = a + b;
  const product = a * b;
  const isEven = sum % 2 === 0;

  return (
    <div>
      <p>Sum: {sum}</p>
      <p>Product: {product}</p>
      <p>Is Even: {isEven ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

**왜 나쁜가?**
- `useMemo` 자체도 비용이 듭니다 (의존성 비교, 캐시 관리)
- 간단한 연산(덧셈, 곱셈)은 useMemo 오버헤드보다 빠릅니다
- 코드만 복잡해지고 성능 이득은 없습니다

### ❌ 나쁜 예 2: 원시 타입 값에 useMemo 사용

```tsx
function UserProfile({ user }) {
  // 나쁜 예: 문자열은 이미 불변이므로 의미 없음
  const userName = useMemo(() => user.name, [user.name]);
  const userAge = useMemo(() => user.age, [user.age]);
  const isAdult = useMemo(() => user.age >= 18, [user.age]);

  return (
    <div>
      <h1>{userName}</h1>
      <p>Age: {userAge}</p>
      <p>{isAdult ? 'Adult' : 'Minor'}</p>
    </div>
  );
}

// ✅ 좋은 예: 직접 사용
function UserProfile({ user }) {
  const isAdult = user.age >= 18; // 이 정도는 메모이제이션 불필요

  return (
    <div>
      <h1>{user.name}</h1>
      <p>Age: {user.age}</p>
      <p>{isAdult ? 'Adult' : 'Minor'}</p>
    </div>
  );
}
```

**원시 타입(string, number, boolean)은 메모이제이션이 불필요합니다.**

### ❌ 나쁜 예 3: 의존성 배열 누락

```tsx
function SearchResults({ items, query, maxResults }) {
  // 나쁜 예: maxResults를 의존성에 포함 안 함
  const filteredItems = useMemo(() => {
    return items
      .filter(item => item.name.includes(query))
      .slice(0, maxResults); // maxResults 사용했는데 의존성에 없음!
  }, [items, query]);

  return (
    <div>
      {filteredItems.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}

// ✅ 좋은 예: 모든 의존성 포함
function SearchResults({ items, query, maxResults }) {
  const filteredItems = useMemo(() => {
    return items
      .filter(item => item.name.includes(query))
      .slice(0, maxResults);
  }, [items, query, maxResults]); // 모든 의존성 포함!

  return (
    <div>
      {filteredItems.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

**ESLint 규칙을 활성화하세요:**
```json
{
  "rules": {
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

### ❌ 나쁜 예 4: 모든 것을 메모이제이션

```tsx
// 나쁜 예: 과도한 최적화
function OverOptimizedComponent({ data }) {
  const title = useMemo(() => data.title, [data.title]);
  const subtitle = useMemo(() => data.subtitle, [data.subtitle]);
  const description = useMemo(() => data.description, [data.description]);

  const titleUpper = useMemo(() => title.toUpperCase(), [title]);
  const subtitleLower = useMemo(() => subtitle.toLowerCase(), [subtitle]);

  const containerClass = useMemo(() => 'container', []); // 절대 변하지 않는데?
  const staticText = useMemo(() => 'Hello World', []); // 리터럴인데?

  return (
    <div className={containerClass}>
      <h1>{titleUpper}</h1>
      <h2>{subtitleLower}</h2>
      <p>{description}</p>
      <p>{staticText}</p>
    </div>
  );
}

// ✅ 좋은 예: 필요한 것만 최적화
function ProperlyOptimizedComponent({ data }) {
  // 단순한 값들은 그대로 사용
  const title = data.title.toUpperCase();
  const subtitle = data.subtitle.toLowerCase();

  return (
    <div className="container">
      <h1>{title}</h1>
      <h2>{subtitle}</h2>
      <p>{data.description}</p>
      <p>Hello World</p>
    </div>
  );
}
```

### ✅ 좋은 예: 적절한 사용 사례 요약

```tsx
function AppropriateUseMemoUsage() {
  const data = useData();
  const filters = useFilters();
  const preferences = usePreferences();

  // ✅ 1. 비용이 큰 계산
  const processedData = useMemo(() => {
    return heavyDataProcessing(data); // 100ms+ 소요
  }, [data]);

  // ✅ 2. 참조 동일성이 중요한 객체/배열
  const config = useMemo(() => ({
    apiKey: process.env.API_KEY,
    timeout: 5000
  }), []); // React.memo된 자식 컴포넌트에 전달

  // ✅ 3. 다른 훅의 의존성
  const filteredData = useMemo(() => {
    return processedData.filter(applyFilters(filters));
  }, [processedData, filters]);

  useEffect(() => {
    // filteredData가 의존성이므로 useMemo 적절
    updateChart(filteredData);
  }, [filteredData]);

  // ❌ 4. 단순한 계산 - useMemo 불필요
  const count = processedData.length;
  const hasData = count > 0;

  return (
    <div>
      <ExpensiveChild config={config} />
      <DataList items={filteredData} />
      <Summary count={count} hasData={hasData} />
    </div>
  );
}
```

## 고급 활용: 실무 패턴과 기법

### 패턴 1: 조건부 메모이제이션

```tsx
function ConditionalMemoization({ data, enableOptimization }) {
  // 최적화가 필요한 경우에만 메모이제이션
  const processedData = useMemo(() => {
    if (!enableOptimization) {
      // 최적화 비활성화 시 매번 계산 (디버깅 등에 유용)
      return processData(data);
    }

    // 최적화 활성화 시 메모이제이션된 값 반환
    return processData(data);
  }, enableOptimization ? [data] : [data, Math.random()]);
  // Math.random()으로 항상 다른 의존성 → 캐시 무효화

  return <DataView data={processedData} />;
}
```

**더 명확한 패턴:**

```tsx
function ConditionalMemoization({ data, enableOptimization }) {
  // 방법 1: 조건문으로 분기
  const processedData = enableOptimization
    ? useMemo(() => processData(data), [data])
    : processData(data);

  return <DataView data={processedData} />;
}

// 방법 2: 커스텀 훅으로 추상화
function useConditionalMemo(factory, deps, condition) {
  const memoizedValue = useMemo(factory, deps);
  const regularValue = factory();
  return condition ? memoizedValue : regularValue;
}

function ConditionalMemoization({ data, enableOptimization }) {
  const processedData = useConditionalMemo(
    () => processData(data),
    [data],
    enableOptimization
  );

  return <DataView data={processedData} />;
}
```

### 패턴 2: 메모이제이션 체인

```tsx
function DataPipeline({ rawData, filters, sorting, grouping }) {
  // 파이프라인의 각 단계를 메모이제이션

  // 1. 검증 및 정규화
  const validatedData = useMemo(() => {
    return rawData.filter(item => item.isValid).map(normalize);
  }, [rawData]);

  // 2. 필터링 (이전 단계 결과 사용)
  const filteredData = useMemo(() => {
    return validatedData.filter(item => matchesFilters(item, filters));
  }, [validatedData, filters]);

  // 3. 정렬 (이전 단계 결과 사용)
  const sortedData = useMemo(() => {
    return [...filteredData].sort(createSorter(sorting));
  }, [filteredData, sorting]);

  // 4. 그룹화 (이전 단계 결과 사용)
  const groupedData = useMemo(() => {
    return groupBy(sortedData, grouping.key);
  }, [sortedData, grouping]);

  // 5. 최종 통계
  const statistics = useMemo(() => {
    return calculateStatistics(groupedData);
  }, [groupedData]);

  return (
    <div>
      <StatsSummary stats={statistics} />
      <GroupedDataView data={groupedData} />
    </div>
  );
}
```

**장점:**
- 각 단계가 독립적으로 캐시됨
- 중간 단계만 변경되면 그 이후만 재계산
- 디버깅과 테스트가 쉬움

### 패턴 3: useMemo vs useCallback vs React.memo

```tsx
// 시나리오: 부모 컴포넌트
function ParentComponent() {
  const [count, setCount] = useState(0);
  const [text, setText] = useState('');

  // ❌ 문제: 매번 새 함수 생성
  const handleClick = () => {
    console.log('Clicked!');
  };

  // ❌ 문제: 매번 새 객체 생성
  const config = {
    theme: 'dark',
    fontSize: 16
  };

  // ❌ 문제: 매번 새 배열 생성
  const items = [1, 2, 3];

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <input value={text} onChange={(e) => setText(e.target.value)} />

      {/* 모두 React.memo를 사용했지만 소용없음 */}
      <ExpensiveChild1 onClick={handleClick} />
      <ExpensiveChild2 config={config} />
      <ExpensiveChild3 items={items} />
    </div>
  );
}

// ✅ 해결: 적절한 메모이제이션 사용
function ParentComponent() {
  const [count, setCount] = useState(0);
  const [text, setText] = useState('');

  // useCallback: 함수 메모이제이션
  const handleClick = useCallback(() => {
    console.log('Clicked!');
  }, []); // 의존성 없음 → 한 번만 생성

  // useMemo: 객체 메모이제이션
  const config = useMemo(() => ({
    theme: 'dark',
    fontSize: 16
  }), []); // 의존성 없음 → 한 번만 생성

  // useMemo: 배열 메모이제이션
  const items = useMemo(() => [1, 2, 3], []); // 한 번만 생성

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      <input value={text} onChange={(e) => setText(e.target.value)} />

      {/* 이제 불필요한 리렌더링이 방지됨 */}
      <ExpensiveChild1 onClick={handleClick} />
      <ExpensiveChild2 config={config} />
      <ExpensiveChild3 items={items} />
    </div>
  );
}

// 자식 컴포넌트들은 React.memo로 감싸야 함
const ExpensiveChild1 = React.memo(({ onClick }) => {
  console.log('Child1 rendered');
  return <button onClick={onClick}>Click me</button>;
});

const ExpensiveChild2 = React.memo(({ config }) => {
  console.log('Child2 rendered');
  return <div style={{ fontSize: config.fontSize }}>Content</div>;
});

const ExpensiveChild3 = React.memo(({ items }) => {
  console.log('Child3 rendered');
  return <ul>{items.map(item => <li key={item}>{item}</li>)}</ul>;
});
```

**비교 표:**

| 훅 | 용도 | 메모이제이션 대상 | 반환값 |
|---|---|---|---|
| `useMemo` | 계산된 값 저장 | 값, 객체, 배열 | 계산 결과 |
| `useCallback` | 함수 참조 저장 | 함수 | 함수 자체 |
| `React.memo` | 컴포넌트 리렌더링 방지 | 컴포넌트 | 메모이제이션된 컴포넌트 |

```tsx
// useMemo vs useCallback
const value = useMemo(() => computeExpensiveValue(a, b), [a, b]);
const callback = useCallback(() => doSomething(a, b), [a, b]);

// 사실 이 둘은 동일합니다:
const callback = useCallback(fn, deps);
const callback = useMemo(() => fn, deps);

// 하지만 useCallback이 의도를 더 명확히 표현합니다
```

### 패턴 4: 커스텀 훅으로 복잡한 메모이제이션 추상화

```tsx
// 재사용 가능한 필터링/정렬 로직
function useFilteredAndSortedData(data, filters, sortConfig) {
  const filteredData = useMemo(() => {
    return data.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        return item[key] === value;
      });
    });
  }, [data, filters]);

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  return sortedData;
}

// 사용
function DataTable({ rawData }) {
  const [filters, setFilters] = useState({ category: '', status: '' });
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  const displayData = useFilteredAndSortedData(rawData, filters, sortConfig);

  return (
    <div>
      <FilterControls filters={filters} onChange={setFilters} />
      <SortControls config={sortConfig} onChange={setSortConfig} />
      <table>
        {displayData.map(row => (
          <tr key={row.id}>
            <td>{row.name}</td>
            <td>{row.category}</td>
            <td>{row.status}</td>
          </tr>
        ))}
      </table>
    </div>
  );
}
```

### 패턴 5: 메모이제이션 디버깅 훅

```tsx
// 개발 중 메모이제이션 효과를 확인하는 커스텀 훅
function useWhyDidYouUpdate(name, props) {
  const previousProps = useRef();

  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps = {};

      allKeys.forEach(key => {
        if (previousProps.current[key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current[key],
            to: props[key]
          };
        }
      });

      if (Object.keys(changedProps).length > 0) {
        console.log('[why-did-you-update]', name, changedProps);
      }
    }

    previousProps.current = props;
  });
}

// 사용 예
function ExpensiveComponent({ data, config, onAction }) {
  useWhyDidYouUpdate('ExpensiveComponent', { data, config, onAction });

  // 컴포넌트 로직...
  return <div>Content</div>;
}

// 콘솔 출력:
// [why-did-you-update] ExpensiveComponent {
//   config: { from: {...}, to: {...} }  <- config가 변경됨
// }
```

## 함정과 주의사항: 흔한 실수들

### 함정 1: 얕은 비교 (Shallow Comparison)

```tsx
function UserList({ users }) {
  const [filter, setFilter] = useState('');

  // 함정: users 배열의 참조만 비교함
  const filteredUsers = useMemo(() => {
    console.log('Filtering users...');
    return users.filter(user =>
      user.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [users, filter]);

  return (
    <div>
      <input value={filter} onChange={(e) => setFilter(e.target.value)} />
      {filteredUsers.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}

// 문제 상황
function App() {
  const [theme, setTheme] = useState('light');

  // 매번 새 배열 생성!
  const users = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' }
  ];

  return <UserList users={users} />; // 매 렌더링마다 필터링 실행됨
}

// ✅ 해결 1: 부모에서 메모이제이션
function App() {
  const [theme, setTheme] = useState('light');

  const users = useMemo(() => [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' }
  ], []); // 한 번만 생성

  return <UserList users={users} />;
}

// ✅ 해결 2: 컴포넌트 외부로 이동
const USERS = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' }
];

function App() {
  const [theme, setTheme] = useState('light');
  return <UserList users={USERS} />;
}
```

### 함정 2: 불안정한 의존성

```tsx
function SearchableList({ items }) {
  const [query, setQuery] = useState('');

  // 함정: 객체 리터럴을 의존성으로 사용
  const searchOptions = { caseSensitive: false, fuzzy: true };

  const filteredItems = useMemo(() => {
    return items.filter(item =>
      search(item.name, query, searchOptions)
    );
  }, [items, query, searchOptions]); // searchOptions가 매번 새 객체!

  return <div>{/* ... */}</div>;
}

// ✅ 해결 1: 의존성을 안정화
function SearchableList({ items }) {
  const [query, setQuery] = useState('');

  const searchOptions = useMemo(() => ({
    caseSensitive: false,
    fuzzy: true
  }), []); // 한 번만 생성

  const filteredItems = useMemo(() => {
    return items.filter(item =>
      search(item.name, query, searchOptions)
    );
  }, [items, query, searchOptions]);

  return <div>{/* ... */}</div>;
}

// ✅ 해결 2: 컴포넌트 외부로 이동
const SEARCH_OPTIONS = { caseSensitive: false, fuzzy: true };

function SearchableList({ items }) {
  const [query, setQuery] = useState('');

  const filteredItems = useMemo(() => {
    return items.filter(item =>
      search(item.name, query, SEARCH_OPTIONS)
    );
  }, [items, query]); // SEARCH_OPTIONS는 의존성에서 제외 가능

  return <div>{/* ... */}</div>;
}
```

### 함정 3: 비동기 함수와 useMemo

```tsx
// ❌ 잘못된 예: useMemo에서 비동기 함수 사용
function DataComponent({ userId }) {
  // 문제: useMemo는 동기적이어야 함!
  const userData = useMemo(async () => {
    const response = await fetch(`/api/users/${userId}`);
    return response.json();
  }, [userId]); // Promise 객체가 반환됨!

  return <div>{userData.name}</div>; // 에러!
}

// ✅ 올바른 예: useEffect 사용
function DataComponent({ userId }) {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();

      if (!cancelled) {
        setUserData(data);
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!userData) return <div>Loading...</div>;
  return <div>{userData.name}</div>;
}

// ✅ 또는 React Query 같은 라이브러리 사용
function DataComponent({ userId }) {
  const { data: userData, isLoading } = useQuery(
    ['user', userId],
    () => fetch(`/api/users/${userId}`).then(r => r.json())
  );

  if (isLoading) return <div>Loading...</div>;
  return <div>{userData.name}</div>;
}
```

### 함정 4: 조기 최적화 (Premature Optimization)

```tsx
// ❌ 나쁜 예: 측정하지 않고 모든 것을 메모이제이션
function OverOptimizedApp() {
  const [state1, setState1] = useState(0);
  const [state2, setState2] = useState('');
  const [state3, setState3] = useState(false);

  // 불필요한 메모이제이션들...
  const value1 = useMemo(() => state1 + 1, [state1]);
  const value2 = useMemo(() => state2.length, [state2]);
  const value3 = useMemo(() => !state3, [state3]);
  const value4 = useMemo(() => 'constant', []);
  const value5 = useMemo(() => Math.PI, []);

  // 모든 컴포넌트를 React.memo로...
  return (
    <div>
      <MemoizedComponent1 value={value1} />
      <MemoizedComponent2 value={value2} />
      <MemoizedComponent3 value={value3} />
    </div>
  );
}

// ✅ 좋은 예: 먼저 프로파일링, 병목 발견, 그 다음 최적화
function ProperlyOptimizedApp() {
  const [state1, setState1] = useState(0);
  const [state2, setState2] = useState('');
  const [state3, setState3] = useState(false);

  // 단순한 계산은 그냥 수행
  const value1 = state1 + 1;
  const value2 = state2.length;
  const value3 = !state3;

  // 실제로 느린 계산만 메모이제이션
  const expensiveValue = useMemo(() => {
    return reallyExpensiveCalculation(state1, state2);
  }, [state1, state2]);

  return (
    <div>
      <Component1 value={value1} />
      <Component2 value={value2} />
      {/* 실제로 느린 컴포넌트만 메모이제이션 */}
      <ExpensiveMemoizedComponent value={expensiveValue} />
    </div>
  );
}
```

**도널드 크누스의 명언:**
> "조기 최적화는 모든 악의 근원이다 (Premature optimization is the root of all evil)"

### 함정 5: 의존성 배열 조작

```tsx
// ❌ 절대 하지 말 것: ESLint 경고 무시
function BadComponent({ data, searchTerm }) {
  const result = useMemo(() => {
    return data.filter(item => item.name.includes(searchTerm));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]); // searchTerm 누락!

  return <div>{/* ... */}</div>;
}

// 문제: searchTerm이 바뀌어도 result가 업데이트 안 됨!

// ✅ 올바른 방법: 모든 의존성 포함
function GoodComponent({ data, searchTerm }) {
  const result = useMemo(() => {
    return data.filter(item => item.name.includes(searchTerm));
  }, [data, searchTerm]); // 모든 의존성 포함!

  return <div>{/* ... */}</div>;
}

// 만약 의존성이 너무 자주 변경된다면, 로직을 재고해보세요
function BetterComponent({ data, searchTerm }) {
  // 방법 1: 메모이제이션하지 않고 계산이 빠른지 확인
  const result = data.filter(item => item.name.includes(searchTerm));

  // 방법 2: 검색 로직을 debounce
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const result = useMemo(() => {
    return data.filter(item => item.name.includes(debouncedSearchTerm));
  }, [data, debouncedSearchTerm]); // 덜 자주 업데이트됨

  return <div>{/* ... */}</div>;
}
```

## 실전 활용: 성능 측정과 프로파일링

### React DevTools Profiler 사용하기

```tsx
function ProfiledComponent({ items }) {
  const [filter, setFilter] = useState('');

  const filteredItems = useMemo(() => {
    console.time('filtering');
    const result = items.filter(item =>
      item.name.toLowerCase().includes(filter.toLowerCase())
    );
    console.timeEnd('filtering');
    return result;
  }, [items, filter]);

  return (
    <Profiler id="ItemList" onRender={onRenderCallback}>
      <div>
        <input value={filter} onChange={(e) => setFilter(e.target.value)} />
        <ItemList items={filteredItems} />
      </div>
    </Profiler>
  );
}

function onRenderCallback(
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime
) {
  console.log(`${id} (${phase}) took ${actualDuration}ms`);
}
```

**React DevTools Profiler 활용:**

1. Chrome DevTools → React Profiler 탭 열기
2. 녹화 시작 (빨간 버튼)
3. 앱 사용 (상태 변경, 인터랙션 등)
4. 녹화 중지
5. Flame Graph 확인:
   - 막대가 길수록 렌더링 시간이 오래 걸림
   - 노란색/빨간색은 느린 컴포�트
   - 회색은 메모이제이션으로 건너뛴 컴포넌트

### 성능 측정 커스텀 훅

```tsx
function usePerformanceMonitor(name) {
  const renderCount = useRef(0);
  const startTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current++;
    const endTime = performance.now();
    const duration = endTime - startTime.current;

    console.log(`[${name}] Render #${renderCount.current}: ${duration.toFixed(2)}ms`);

    startTime.current = endTime;
  });
}

// 사용
function MonitoredComponent({ data }) {
  usePerformanceMonitor('MonitoredComponent');

  const processedData = useMemo(() => {
    return expensiveProcessing(data);
  }, [data]);

  return <div>{/* ... */}</div>;
}
```

### 실전 최적화 워크플로우

```tsx
// 1단계: 문제 확인 (측정하지 않고 최적화하지 말 것!)
function Step1_Measure({ items }) {
  // Performance API로 측정
  performance.mark('filter-start');

  const filtered = items.filter(item => item.active);
  const sorted = filtered.sort((a, b) => a.name.localeCompare(b.name));

  performance.mark('filter-end');
  performance.measure('filtering', 'filter-start', 'filter-end');

  const measure = performance.getEntriesByName('filtering')[0];
  console.log(`Filtering took: ${measure.duration}ms`);

  return <div>{/* ... */}</div>;
}

// 2단계: 병목 지점 발견
// 콘솔 출력: "Filtering took: 150ms" ← 느림!

// 3단계: useMemo 적용
function Step3_Optimize({ items }) {
  const processedItems = useMemo(() => {
    performance.mark('filter-start');

    const filtered = items.filter(item => item.active);
    const sorted = filtered.sort((a, b) => a.name.localeCompare(b.name));

    performance.mark('filter-end');
    performance.measure('filtering', 'filter-start', 'filter-end');

    const measure = performance.getEntriesByName('filtering')[0];
    console.log(`Filtering took: ${measure.duration}ms`);

    return sorted;
  }, [items]);

  return <div>{/* ... */}</div>;
}

// 4단계: 효과 검증
// 첫 렌더링: "Filtering took: 150ms"
// 재렌더링 (items 동일): (로그 없음) ← 성공!
// 재렌더링 (items 변경): "Filtering took: 150ms" ← 예상된 동작
```

### 벤치마크 유틸리티

```tsx
function BenchmarkComponent() {
  const [withMemo, setWithMemo] = useState(true);
  const [data] = useState(() => generateLargeDataset(10000));
  const [filter, setFilter] = useState('');

  // useMemo 사용
  const memoizedResult = useMemo(() => {
    const start = performance.now();
    const result = data.filter(item => item.name.includes(filter));
    const duration = performance.now() - start;
    console.log(`With useMemo: ${duration.toFixed(2)}ms`);
    return result;
  }, [data, filter]);

  // useMemo 미사용
  const start = performance.now();
  const regularResult = data.filter(item => item.name.includes(filter));
  const duration = performance.now() - start;
  console.log(`Without useMemo: ${duration.toFixed(2)}ms`);

  const displayResult = withMemo ? memoizedResult : regularResult;

  return (
    <div>
      <button onClick={() => setWithMemo(!withMemo)}>
        Toggle Memo (Current: {withMemo ? 'ON' : 'OFF'})
      </button>
      <input value={filter} onChange={(e) => setFilter(e.target.value)} />
      <div>Results: {displayResult.length}</div>
    </div>
  );
}

// 콘솔 출력 예시:
// With useMemo: 0.05ms (캐시됨)
// Without useMemo: 12.34ms (매번 계산)
```

## useMemo 사용 결정 플로우차트

```
시작: 값을 계산해야 하는가?
    │
    ▼
[1] 계산이 매우 단순한가? (덧셈, 문자열 연결 등)
    │
    ├─ 예 → useMemo 불필요 ✅
    │
    └─ 아니오
        ▼
    [2] 계산 결과가 원시 타입인가? (string, number, boolean)
        │
        ├─ 예 → useMemo 불필요 (대부분) ✅
        │      (단, 계산이 매우 무거우면 3번으로)
        │
        └─ 아니오 (객체, 배열, 함수)
            ▼
        [3] 계산이 무거운가? (반복문 1000+, 재귀, 복잡한 로직)
            │
            ├─ 예 → useMemo 고려 🤔 → [4]로
            │
            └─ 아니오
                ▼
            [4] React.memo로 감싼 자식 컴포넌트에 전달하는가?
                │
                ├─ 예 → useMemo 사용! ✅ (참조 동일성 필요)
                │
                └─ 아니오
                    ▼
                [5] useEffect/useMemo/useCallback의 의존성인가?
                    │
                    ├─ 예 → useMemo 사용! ✅ (무한 루프 방지)
                    │
                    └─ 아니오 → useMemo 불필요 ✅
```

**의사결정 예시:**

```tsx
// 시나리오 1: 단순 계산
const sum = a + b; // [1] 단순 → useMemo 불필요 ✅

// 시나리오 2: 원시 타입이지만 무거운 계산
const fibonacci = fibonacci(40); // [2→3] 무거움 → useMemo 고려 🤔

// 시나리오 3: 객체, React.memo 자식에 전달
const config = useMemo(() => ({...}), []); // [4] → useMemo 사용 ✅
<MemoizedChild config={config} />

// 시나리오 4: 배열, useEffect 의존성
const items = useMemo(() => [...], [dep]); // [5] → useMemo 사용 ✅
useEffect(() => { doSomething(items); }, [items]);

// 시나리오 5: 배열, 자식에 전달하지만 React.memo 없음
const items = [...rawData]; // [4] 아니오 → useMemo 불필요 ✅
<RegularChild items={items} />
```

## Modern React: React Compiler와 미래

### React 19+ Compiler (실험적)

React 팀은 자동으로 메모이제이션을 추가하는 컴파일러를 개발 중입니다:

```tsx
// 우리가 작성하는 코드
function MyComponent({ items, filter }) {
  const filteredItems = items.filter(item =>
    item.name.includes(filter)
  );

  return (
    <div>
      {filteredItems.map(item => (
        <Item key={item.id} item={item} />
      ))}
    </div>
  );
}

// React Compiler가 자동으로 변환한 코드 (개념적)
function MyComponent({ items, filter }) {
  const filteredItems = useMemo(() =>
    items.filter(item => item.name.includes(filter)),
    [items, filter]
  );

  return (
    <div>
      {filteredItems.map(item => (
        <Item key={item.id} item={item} />
      ))}
    </div>
  );
}
```

**React Compiler 활성화 (실험적):**

```bash
npm install babel-plugin-react-compiler
```

```json
// .babelrc
{
  "plugins": [
    ["react-compiler", {
      "compilationMode": "annotation" // 또는 "all"
    }]
  ]
}
```

```tsx
// 명시적으로 최적화 요청
'use memo'; // 파일 최상단

function AutoOptimizedComponent({ data }) {
  // 컴파일러가 자동으로 메모이제이션 추가
  const processed = data.map(item => transform(item));

  return <div>{processed}</div>;
}
```

**현재 상태 (2025년 기준):**
- 아직 실험 단계
- production 사용 권장하지 않음
- useMemo/useCallback은 여전히 필요

## 베스트 프랙티스 요약

### ✅ DO (해야 할 것)

```tsx
// 1. 비용이 큰 계산 메모이제이션
const result = useMemo(() => {
  return items
    .filter(complexFilter)
    .sort(complexSort)
    .map(complexTransform);
}, [items, filters, sortConfig]);

// 2. 참조 동일성이 중요한 경우
const config = useMemo(() => ({ theme, locale }), [theme, locale]);
<MemoizedChild config={config} />

// 3. 다른 훅의 의존성
const value = useMemo(() => compute(data), [data]);
useEffect(() => { use(value); }, [value]);

// 4. Context value 안정화
const contextValue = useMemo(() => ({
  data,
  actions
}), [data, actions]);

// 5. 측정 후 최적화
// React DevTools Profiler로 병목 확인 → useMemo 적용
```

### ❌ DON'T (하지 말아야 할 것)

```tsx
// 1. 단순한 계산
const sum = a + b; // useMemo 불필요

// 2. 원시 타입 값
const userName = useMemo(() => user.name, [user.name]); // 불필요

// 3. 의존성 누락
const result = useMemo(() => compute(a, b), [a]); // b 누락!

// 4. 모든 것을 메모이제이션
// 조기 최적화는 독이 됩니다

// 5. 비동기 함수
const data = useMemo(async () => await fetch(...), []); // 잘못됨!
```

### 최적화 체크리스트

- [ ] React DevTools Profiler로 성능 문제 확인했는가?
- [ ] 계산이 실제로 무거운가? (측정 완료)
- [ ] 모든 의존성이 배열에 포함되었는가?
- [ ] ESLint react-hooks/exhaustive-deps 규칙 활성화했는가?
- [ ] useMemo로 인한 성능 개선을 측정했는가?
- [ ] 코드 가독성과 유지보수성을 해치지 않는가?

## 참고 자료

### React 공식 문서
- [useMemo – React](https://react.dev/reference/react/useMemo) - React 공식 문서
- [useCallback – React](https://react.dev/reference/react/useCallback) - useCallback과의 비교
- [React.memo – React](https://react.dev/reference/react/memo) - 컴포넌트 메모이제이션
- [Profiler – React](https://react.dev/reference/react/Profiler) - 성능 측정

### 심화 학습
- [Before You memo() – Dan Abramov](https://overreacted.io/before-you-memo/) - memo 사용 전 고려사항
- [React Performance Optimization – Kent C. Dodds](https://kentcdodds.com/blog/usememo-and-usecallback) - useMemo와 useCallback 실전 가이드
- [When to useMemo and useCallback – Josh Comeau](https://www.joshwcomeau.com/react/usememo-and-usecallback/) - 시각적 설명
- [React Performance – web.dev](https://web.dev/react/) - 웹 성능 최적화 가이드
- [Optimizing Performance – React Docs](https://legacy.reactjs.org/docs/optimizing-performance.html) - 전체적인 성능 최적화 전략

### 도구와 라이브러리
- [React DevTools](https://react.dev/learn/react-developer-tools) - Profiler 사용법
- [why-did-you-render](https://github.com/welldone-software/why-did-you-render) - 불필요한 리렌더링 감지
- [React Compiler (Experimental)](https://react.dev/learn/react-compiler) - 자동 메모이제이션

### 관련 개념
- [메모이제이션 – Wikipedia](https://ko.wikipedia.org/wiki/%EB%A9%94%EB%AA%A8%EC%9D%B4%EC%A0%9C%EC%9D%B4%EC%85%98) - 메모이제이션 개념
- [참조 동일성 (Referential Equality)](https://developer.mozilla.org/ko/docs/Web/JavaScript/Equality_comparisons_and_sameness) - JavaScript 동등성 비교
- [얕은 비교 vs 깊은 비교](https://medium.com/@yuyeonlee/shallow-vs-deep-equality-in-javascript-and-react-d38bc72af319) - React의 비교 방식

### 커뮤니티 토론
- [useMemo 남용하지 않기 – Reddit r/reactjs](https://www.reddit.com/r/reactjs/comments/hsu5el/dont_overuse_usememo/)
- [React 성능 최적화 FAQ – Stack Overflow](https://stackoverflow.com/questions/tagged/react-hooks+performance)
- [React Patterns](https://www.patterns.dev/posts/react-patterns) - React 디자인 패턴 모음
