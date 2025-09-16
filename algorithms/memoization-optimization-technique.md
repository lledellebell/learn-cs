# 메모이제이션(Memoization)

## 메모이제이션이란 무엇인가?

메모이제이션(Memoization)은 **함수의 계산 결과를 저장해두고 재사용하는 프로그래밍 기법**입니다.
같은 입력값으로 함수를 다시 호출할 때, 이전에 계산한 결과를 그대로 반환하여 불필요한 계산을 피할 수 있습니다.

### 간단한 예시로 이해하기

일반적인 함수는 같은 입력값이라도 매번 처음부터 계산을 수행합니다.

```js
// 메모이제이션 없이 - 매번 계산
function slowCalculation(n) {
  console.log(`${n}을 계산 중...`);
  // 복잡한 계산을 시뮬레이션 (실제로는 더 복잡한 로직이 들어갈 수 있음)
  let result = 0;
  for (let i = 0; i < 1000000; i++) {
    result += n * i;
  }
  return result;
}

slowCalculation(5); // "5을 계산 중..." 출력 후 결과 반환
slowCalculation(5); // 또 다시 "5을 계산 중..." 출력 후 같은 결과 반환 (비효율적!)
```

메모이제이션을 적용하면 한 번 계산한 결과를 저장해두고 재사용할 수 있습니다.

```js
// 메모이제이션 적용 - 한 번 계산하고 저장
function memoizedCalculation() {
  const cache = {}; // 계산 결과를 저장할 캐시 공간
  
  return function(n) {
    // 이미 계산한 값이 캐시에 있는지 확인
    if (cache[n]) {
      console.log(`${n}의 결과를 캐시에서 가져옴`);
      return cache[n]; // 저장된 결과를 바로 반환
    }
    
    // 처음 계산하는 값이면 계산 수행
    console.log(`${n}을 계산 중...`);
    let result = 0;
    for (let i = 0; i < 1000000; i++) {
      result += n * i;
    }
    
    cache[n] = result; // 계산 결과를 캐시에 저장
    return result;
  };
}

const fastCalculation = memoizedCalculation();
fastCalculation(5); // "5을 계산 중..." 출력 후 결과 반환 (첫 번째 호출)
fastCalculation(5); // "5의 결과를 캐시에서 가져옴" 출력 후 즉시 반환 (두 번째 호출)
```

이처럼 메모이제이션을 사용하면 동일한 입력에 대해 두 번째 호출부터는 계산 시간을 크게 단축할 수 있습니다.

## 실무에서 메모이제이션이 필요한 순간들

### 1. API 응답 캐싱으로 사용자 경험 개선

웹 애플리케이션에서 같은 API를 반복 호출할 때, 이전 결과를 저장해두고 재사용하는 방법입니다.

```js
class APICache {
  constructor(ttl = 300000) { // 5분 TTL
    this.cache = new Map();
    this.ttl = ttl;
  }

  memoizedFetch = (url, options = {}) => {
    const key = `${url}:${JSON.stringify(options)}`;
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      console.log(`${url} 캐시에서 가져옴`);
      return Promise.resolve(cached.data);
    }

    return fetch(url, options)
      .then(response => response.json())
      .then(data => {
        this.cache.set(key, { data, timestamp: Date.now() });
        return data;
      });
  };
}

const apiCache = new APICache();
const getUserProfile = (userId) => apiCache.memoizedFetch(`/api/users/${userId}`);
```

### 2. 최적화

전자상거래에서 할인, 세금, 배송비를 포함한 최종 가격을 계산하는 것은 연산입니다. 
동일한 상품과 할인 조건으로 여러 번 가격을 조회할 때마다 매번 새로 계산하는 것은 비효율적이므로, 한 번 계산한 결과를 저장해두고 재사용합니다.

```js
const priceCalculator = (() => {
  const cache = new Map();
  
  return function calculateFinalPrice(basePrice, discounts, taxes, shipping) {
    const key = `${basePrice}-${JSON.stringify(discounts)}-${JSON.stringify(taxes)}-${shipping}`;
    
    // 캐시가 있으면 바로 반환하므로 중복 계산을 피할 수 있습니다.
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const finalPrice = discounts.reduce((price, discount) => {
      if (discount.type === 'percentage') {
        return price * (1 - discount.value / 100);
      } else {
        return price - discount.value;
      }
    }, basePrice);
    
    const totalTax = taxes.reduce((sum, tax) => sum + (finalPrice * tax.rate), 0);
    const totalPrice = finalPrice + totalTax + shipping;
    
    cache.set(key, totalPrice);
    return totalPrice;
  };
})();
```

## 성능 측정과 최적화 전략

### 벤치마킹

메모이제이션의 효과를 확인하려면 실제 성능을 측정해야 합니다. 피보나치 수열은 메모이제이션의 효과를 극명하게 보여주는 대표적인 예시입니다.

```js
// 성능 측정 유틸리티
function benchmark(fn, iterations = 1000) {
  const start = performance.now();
  
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  
  const end = performance.now();
  return {
    totalTime: end - start,
    averageTime: (end - start) / iterations,
    operationsPerSecond: iterations / ((end - start) / 1000)
  };
}

// 일반적인 재귀 피보나치 (메모이제이션 없음)
const fibonacciNormal = (n) => n <= 1 ? n : fibonacciNormal(n-1) + fibonacciNormal(n-2);

// 메모이제이션을 적용한 피보나치
const fibonacciMemo = (() => {
  const cache = {};
  return function(n) {
    if (n in cache) return cache[n]; // 캐시에 있으면 바로 반환
    if (n <= 1) return n;
    return cache[n] = fibonacciMemo(n-1) + fibonacciMemo(n-2); // 계산 후 캐시에 저장
  };
})();

// 성능 테스트 실행
console.log('일반 재귀:', benchmark(() => fibonacciNormal(30), 10));
console.log('메모이제이션:', benchmark(() => fibonacciMemo(30), 10));
```

**예상 결과:**
- 일반 재귀: 약 100-200ms (fibonacci(30) 기준)
- 메모이제이션: 약 0.01ms 미만

메모이제이션을 적용하면 **수천 배에서 수만 배**의 성능 향상을 확인할 수 있습니다. 이는 중복 계산을 완전히 제거했기 때문입니다.

## 사례

### 1. React 컴포넌트 최적화

React에서 `useMemo`를 사용하여 복잡한 데이터 처리나 객체 생성을 최적화하는 방법입니다.

```jsx
// 대용량 데이터 처리 컴포넌트
const DataVisualization = ({ rawData, filters, sortConfig }) => {
  // 데이터 전처리 메모이제이션
  const processedData = useMemo(() => {
    console.log('Processing data...'); // 실행 횟수 확인용
    
    return rawData
      .filter(item => filters.every(filter => filter.fn(item)))
      .sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      })
      .map(item => ({
        ...item,
        displayValue: formatCurrency(item.value),
        category: getCategoryName(item.categoryId)
      }));
  }, [rawData, filters, sortConfig]);

  // 차트 설정 메모이제이션
  const chartConfig = useMemo(() => ({
    type: 'line',
    data: {
      labels: processedData.map(item => item.date),
      datasets: [{
        data: processedData.map(item => item.value),
        borderColor: '#007bff',
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      }
    }
  }), [processedData]);

  return <Chart {...chartConfig} />;
};
```

### 2. Node.js 백엔드 최적화

서버에서 데이터베이스 쿼리 결과를 캐싱하여 동일한 요청에 대해 빠르게 응답하는 방법입니다.

```js
// 데이터베이스 쿼리 결과 캐싱
const QueryCache = require('node-cache');
const cache = new QueryCache({ stdTTL: 600 }); // 10분 캐시

const memoizedQuery = (query, params) => {
  const cacheKey = `${query}:${JSON.stringify(params)}`;
  
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log(`Cache hit: ${cacheKey}`);
    return Promise.resolve(cached);
  }
  
  return db.query(query, params)
    .then(result => {
      cache.set(cacheKey, result);
      return result;
    });
};

// 사용 예시
const getUserOrders = async (userId, status) => {
  return memoizedQuery(
    'SELECT * FROM orders WHERE user_id = ? AND status = ?',
    [userId, status]
  );
};
```

## 메모이제이션 패턴

### 1. LRU (Least Recently Used) 캐시

메모리가 가득 찰 때 가장 오래 사용되지 않은 데이터를 제거하는 캐시 전략입니다.

```js
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }
  
  get(key) {
    if (this.cache.has(key)) {
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value); // 최근 사용으로 이동
      return value;
    }
    return null;
  }
  
  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}

// 함수 메모이제이션에 적용
const memoizeWithLRU = (fn, cacheSize = 100) => {
  const cache = new LRUCache(cacheSize);
  
  return function(...args) {
    const key = JSON.stringify(args);
    const cached = cache.get(key);
    
    if (cached !== null) return cached;
    
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
};
```

### 2. 비동기 함수 메모이제이션

Promise를 반환하는 비동기 함수의 결과를 캐싱하는 방법입니다.

```js
const memoizeAsync = (asyncFn, ttl = 300000) => {
  const cache = new Map();
  
  return async function(...args) {
    const key = JSON.stringify(args);
    const cached = cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.promise;
    }
    
    const promise = asyncFn.apply(this, args);
    cache.set(key, { promise, timestamp: Date.now() });
    
    try {
      const result = await promise;
      cache.set(key, { promise: Promise.resolve(result), timestamp: Date.now() });
      return result;
    } catch (error) {
      cache.delete(key); // 실패한 요청은 캐시하지 않음
      throw error;
    }
  };
};

// 사용 예시
const fetchUserData = memoizeAsync(async (userId) => {
  const response = await fetch(`/api/users/${userId}`);
  return response.json();
}, 60000); // 1분 캐시
```

## 참고 자료

- **[MDN - Map과 WeakMap](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)**
- **[React 공식 문서 - useMemo](https://react.dev/reference/react/useMemo)**
- **[Node.js 메모리 관리](https://nodejs.org/en/docs/guides/simple-profiling/)**

- **[LeetCode - Dynamic Programming](https://leetcode.com/tag/dynamic-programming/)**
- **[High Performance JavaScript](https://www.oreilly.com/library/view/high-performance-javascript/9781449382308/)**
- **[Redis 공식 문서](https://redis.io/documentation)**

- **[Lodash.memoize](https://lodash.com/docs/4.17.15#memoize)**
- **[React DevTools Profiler](https://react.dev/learn/react-developer-tools)**
- **[Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)**
