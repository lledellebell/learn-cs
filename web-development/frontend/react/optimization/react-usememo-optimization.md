# `useMemo`를 활용한 성능 최적화

`useMemo`는 React에서 성능 최적화를 위해 사용하는 훅으로,
계산 비용이 큰 값을 메모이제이션하여 불필요한 재계산을 방지합니다.

> 메모이제이션(Memoization)이란?
> 메모이제이션은 **이전에 계산한 결과를 저장해두고 재사용하는 최적화 기법**입니다.

## `useMemo`의 기본 개념

### 1. 동작 원리
```ts
const memoizedValue = useMemo(() => {
  return expensiveCalculation(a, b);
}, [a, b]); // 의존성 배열
```

- 의존성 배열의 값이 변경될 때만 함수를 재실행
- 값이 변경되지 않으면 이전에 계산된 값을 재사용

### 2. `Context`에서의 활용
```ts
// ❌ 매번 새 객체 생성 - 모든 Consumer가 리렌더링
const MyProvider = ({ children }) => {
  const [data, setData] = useState(initialData);
  
  const contextValue = {
    data,
    updateData: (newData) => setData(newData),
    deleteData: (id) => setData(prev => prev.filter(item => item.id !== id))
  };

  return (
    <MyContext.Provider value={contextValue}>
      {children}
    </MyContext.Provider>
  );
};

// ✅ useMemo로 최적화 - data가 변경될 때만 새 객체 생성
const MyProvider = ({ children }) => {
  const [data, setData] = useState(initialData);
  
  const contextValue = useMemo(() => ({
    data,
    updateData: (newData) => setData(newData),
    deleteData: (id) => setData(prev => prev.filter(item => item.id !== id))
  }), [data]);

  return (
    <MyContext.Provider value={contextValue}>
      {children}
    </MyContext.Provider>
  );
};
```

## 실제 적용 사례

### 1. 복잡한 계산 최적화
```ts
const ArticleList = ({ articles, searchTerm, sortBy }) => {
  // 검색과 정렬이 포함된 복잡한 계산
  const filteredAndSortedArticles = useMemo(() => {
    const filtered = articles.filter(article => 
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
  }, [articles, searchTerm, sortBy]);

  return (
    <div>
      {filteredAndSortedArticles.map(article => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
};
```

### 2. 객체/배열 참조 최적화
```ts
const Weekly = ({ articles }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // 객체 참조를 안정화하여 불필요한 리렌더링 방지
  const contextValue = useMemo(() => ({
    currentIndex,
    setCurrentIndex,
    isAutoPlaying,
    setIsAutoPlaying,
    totalItems: articles.length
  }), [currentIndex, isAutoPlaying, articles.length]);

  // CSS 클래스명 메모이제이션
  const containerClassName = useMemo(() => {
    const baseClass = 'weekly-container';
    const animationClass = isAutoPlaying ? 'weekly-container--animated' : 'weekly-container--static';
    return `${baseClass} ${animationClass}`;
  }, [isAutoPlaying]);

  // CSS 변수를 통한 동적 스타일 제어
  const containerStyle = useMemo(() => ({
    '--slide-index': currentIndex
  }), [currentIndex]);

  return (
    <WeeklyContext.Provider value={contextValue}>
      <div className="weekly-wrapper">
        <div 
          className={containerClassName}
          style={containerStyle}
        >
          {articles.map((article, index) => (
            <ArticleSlide key={article.id} article={article} />
          ))}
        </div>
      </div>
    </WeeklyContext.Provider>
  );
};
```

**CSS 예시:**
```css
.weekly-container {
  display: flex;
  transform: translateX(calc(var(--slide-index) * -100%));
}

.weekly-container--animated {
  transition: transform 0.3s ease;
}

.weekly-container--static {
  transition: none;
}
```

### 3. 함수 메모이제이션과 조합
```ts
const ArticleListProvider = ({ children }) => {
  const [articles, setArticles] = useState([]);
  const [filters, setFilters] = useState({ category: '', isNew: false });

  // 함수들을 useCallback으로 메모이제이션
  const updateArticle = useCallback((id, updates) => {
    setArticles(prev => prev.map(article => 
      article.id === id ? { ...article, ...updates } : article
    ));
  }, []);

  const deleteArticle = useCallback((id) => {
    setArticles(prev => prev.filter(article => article.id !== id));
  }, []);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Context value 메모이제이션
  const contextValue = useMemo(() => ({
    articles,
    filters,
    updateArticle,
    deleteArticle,
    updateFilters
  }), [articles, filters, updateArticle, deleteArticle, updateFilters]);

  return (
    <ArticleListContext.Provider value={contextValue}>
      {children}
    </ArticleListContext.Provider>
  );
};
```

## 패턴

### 1. 조건부 메모이제이션
```ts
const ExpensiveComponent = ({ data, shouldOptimize }) => {
  const processedData = useMemo(() => {
    if (!shouldOptimize) return data;
    
    // 복잡한 데이터 처리
    return data.map(item => ({
      ...item,
      processed: heavyCalculation(item)
    }));
  }, shouldOptimize ? [data] : [data, Math.random()]); // 조건부 의존성

  return <div>{/* 렌더링 로직 */}</div>;
};
```

### 2. 여러 단계의 메모이제이션
```ts
const ComplexDashboard = ({ rawData, userPreferences }) => {
  // 1단계: 기본 데이터 처리
  const processedData = useMemo(() => {
    return rawData.map(item => processItem(item));
  }, [rawData]);

  // 2단계: 사용자 설정에 따른 필터링
  const filteredData = useMemo(() => {
    return processedData.filter(item => 
      matchesUserPreferences(item, userPreferences)
    );
  }, [processedData, userPreferences]);

  // 3단계: 차트용 데이터 변환
  const chartData = useMemo(() => {
    return transformForChart(filteredData);
  }, [filteredData]);

  return (
    <div>
      <DataTable data={filteredData} />
      <Chart data={chartData} />
    </div>
  );
};
```

## 주의사항과 베스트 프랙티스

### 1. 과도한 사용 피하기
```ts
// ❌ 불필요한 useMemo - 단순한 계산
const SimpleComponent = ({ a, b }) => {
  const sum = useMemo(() => a + b, [a, b]); // 오버헤드가 더 클 수 있음
  return <div>{sum}</div>;
};

// ✅ 단순한 계산은 그대로 사용
const SimpleComponent = ({ a, b }) => {
  const sum = a + b;
  return <div>{sum}</div>;
};
```

### 2. 의존성 배열 정확히 설정
```ts
// ❌ 의존성 누락
const Component = ({ items, searchTerm }) => {
  const filteredItems = useMemo(() => {
    return items.filter(item => item.name.includes(searchTerm));
  }, [items]); // searchTerm 누락!

  // ✅ 모든 의존성 포함
  const filteredItems = useMemo(() => {
    return items.filter(item => item.name.includes(searchTerm));
  }, [items, searchTerm]);
};
```

### 3. 참조 동일성 고려
```ts
const ParentComponent = () => {
  const [count, setCount] = useState(0);
  
  // ✅ 객체 참조 안정화
  const config = useMemo(() => ({
    theme: 'dark',
    animations: true
  }), []); // 빈 의존성 배열로 한 번만 생성

  return (
    <div>
      <ExpensiveChild config={config} />
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>
    </div>
  );
};
```

## 성능 측정과 디버깅

### 1. `React DevTools Profiler` 활용
```ts
const ProfiledComponent = ({ data }) => {
  const expensiveValue = useMemo(() => {
    console.time('expensive-calculation');
    const result = heavyCalculation(data);
    console.timeEnd('expensive-calculation');
    return result;
  }, [data]);

  return <div>{expensiveValue}</div>;
};
```

### 2. 메모이제이션 효과 확인
```ts
const useMemorizationStats = (value, deps) => {
  const hitCount = useRef(0);
  const missCount = useRef(0);
  
  const memoizedValue = useMemo(() => {
    missCount.current++;
    console.log(`Cache miss: ${missCount.current}`);
    return value;
  }, deps);
  
  useEffect(() => {
    hitCount.current++;
    console.log(`Cache hit: ${hitCount.current}`);
  });
  
  return memoizedValue;
};
```

## 결론

`useMemo`는 `Context API`와 함께 사용할 때 성능 최적화를 위한 훅입니다.
 Context value 객체의 참조 안정성을 보장하여 불필요한 리렌더링을 방지하고, 
 복잡한 계산을 메모이제이션하여 성능을 향상시킬 수 있습니다. 
 다만 모든 곳에 사용하기보다는 실제 성능 병목이 있는 곳에 선택적으로 적용하는 것이 좋습니다.