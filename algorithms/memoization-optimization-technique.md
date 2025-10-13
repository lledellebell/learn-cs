# 메모이제이션(Memoization)

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


## 시간/공간 복잡도 분석

### 시간 복잡도 개선

메모이제이션의 핵심 가치는 **시간 복잡도의 극적인 개선**입니다.


```js
// 피보나치 수열 복잡도 비교
// 일반 재귀: O(2^n) - 지수적 증가
// 메모이제이션: O(n) - 선형 증가

const complexityDemo = {
  // 일반 재귀 - 매번 중복 계산
  fibRecursive(n) {
    if (n <= 1) return n;
    return this.fibRecursive(n-1) + this.fibRecursive(n-2);
    // fib(5) 계산 시 fib(3)이 2번, fib(2)가 3번, fib(1)이 5번 계산됨
  },
  
  // 메모이제이션 - 각 값을 한 번만 계산
  fibMemoized: (() => {
    const cache = {};
    return function(n) {
      if (n in cache) return cache[n];
      if (n <= 1) return n;
      return cache[n] = this.fibMemoized(n-1) + this.fibMemoized(n-2);
      // 각 fib(i)는 정확히 한 번만 계산됨
    };
  })()
};

// 복잡도 차이 시각화
console.log('n=40일 때:');
console.log('일반 재귀: 약 1,664,079,648번의 함수 호출');
console.log('메모이제이션: 정확히 40번의 함수 호출');
```


### 공간 복잡도 트레이드오프

메모이제이션은 **시간을 공간으로 교환**하는 기법입니다.

#### 트레이드오프의 원리

**시간 복잡도 개선 vs 공간 복잡도 증가**
- 계산 시간을 줄이는 대신 메모리 사용량이 증가
- 입력값의 개수만큼 캐시 공간이 필요
- 메모리가 부족하면 오히려 성능 저하 발생 가능


```js
// 트레이드오프 분석 예시
const analyzeTradeoff = (inputRange, functionComplexity) => {
  const withoutMemo = {
    timeComplexity: `O(${functionComplexity} * n)`, // 매번 계산
    spaceComplexity: 'O(1)', // 추가 메모리 없음
    totalCalls: inputRange * functionComplexity
  };
  
  const withMemo = {
    timeComplexity: 'O(n)', // 첫 계산 후 O(1)
    spaceComplexity: 'O(n)', // 입력값 개수만큼 캐시
    totalCalls: inputRange, // 각 입력당 한 번만 계산
    memoryUsage: inputRange * 64 // 64bytes per cache entry (추정)
  };
  
  return { withoutMemo, withMemo };
};

// 실제 시나리오 분석
console.log('작은 데이터셋 (100개):', analyzeTradeoff(100, 1000));
// 메모리: 6.4KB, 시간 절약: 99,900번의 계산 → 100번

console.log('큰 데이터셋 (100만개):', analyzeTradeoff(1000000, 1000));
// 메모리: 64MB, 시간 절약: 999,999,000,000번의 계산 → 1,000,000번
```


#### 메모리 사용량 실측


```js
// 실제 메모리 사용량 측정
const measureMemoryUsage = () => {
  const cache = new Map();
  const testData = Array.from({length: 1000}, (_, i) => ({
    id: i,
    data: `test-data-${i}`.repeat(10) // 약 100bytes per entry
  }));
  
  // 캐시 없이
  const beforeCache = process.memoryUsage().heapUsed;
  
  // 캐시 채우기
  testData.forEach((item, index) => {
    cache.set(index, item);
  });
  
  const afterCache = process.memoryUsage().heapUsed;
  const memoryIncrease = afterCache - beforeCache;
  
  return {
    cacheSize: cache.size,
    memoryIncrease: `${(memoryIncrease / 1024).toFixed(2)}KB`,
    avgPerEntry: `${(memoryIncrease / cache.size).toFixed(2)}bytes`
  };
};
```


#### 언제 트레이드오프가 유리한가?

**유리한 경우:**
- 계산 비용이 메모리 비용보다 훨씬 클 때
- 같은 입력이 반복적으로 사용될 때
- 메모리가 충분할 때

**불리한 경우:**
- 입력값이 매우 다양하고 재사용이 적을 때
- 메모리가 제한적인 환경
- 캐시 크기가 무제한 증가할 수 있을 때


```js
// 트레이드오프 결정 로직
const shouldUseMemoization = (scenario) => {
  const {
    computationCost,    // 계산 비용 (ms)
    memoryCost,        // 메모리 비용 (bytes)
    reuseFrequency,    // 재사용 빈도 (0-1)
    availableMemory    // 사용 가능한 메모리 (bytes)
  } = scenario;
  
  const timeSaved = computationCost * reuseFrequency;
  const memoryUsed = memoryCost;
  const memoryAvailable = availableMemory > memoryUsed;
  
  return {
    recommended: timeSaved > 10 && memoryAvailable, // 10ms 이상 절약 + 메모리 여유
    reason: timeSaved > 10 ? 
      (memoryAvailable ? '시간 절약 효과 큼' : '메모리 부족') : 
      '시간 절약 효과 미미'
  };
};

// 예시 시나리오들
console.log('API 호출:', shouldUseMemoization({
  computationCost: 200,    // 200ms API 응답
  memoryCost: 1024,       // 1KB 응답 데이터
  reuseFrequency: 0.7,    // 70% 재사용
  availableMemory: 50000000 // 50MB 여유
})); // → recommended: true, 시간 절약 효과 큼

console.log('간단한 계산:', shouldUseMemoization({
  computationCost: 0.1,   // 0.1ms 계산
  memoryCost: 64,         // 64bytes
  reuseFrequency: 0.9,    // 90% 재사용
  availableMemory: 1000000 // 1MB 여유
})); // → recommended: false, 시간 절약 효과 미미
```



```js
class SpaceComplexityAnalysis {
  constructor() {
    this.cache = new Map();
    this.cacheSize = 0;
    this.maxCacheSize = 0;
  }
  
  memoizedFunction(input) {
    const key = JSON.stringify(input);
    
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    const result = this.expensiveCalculation(input);
    this.cache.set(key, result);
    
    // 캐시 크기 모니터링
    this.cacheSize = this.cache.size;
    this.maxCacheSize = Math.max(this.maxCacheSize, this.cacheSize);
    
    return result;
  }
  
  expensiveCalculation(input) {
    // 복잡한 계산 시뮬레이션
    return input.reduce((acc, val) => acc + Math.pow(val, 2), 0);
  }
  
  getCacheStats() {
    return {
      currentSize: this.cacheSize,
      maxSize: this.maxCacheSize,
      memoryUsage: `약 ${this.cacheSize * 100}bytes` // 추정치
    };
  }
}
```


## 메모이제이션의 한계와 주의사항

### 1. 메모리 누수 위험

**문제:** 캐시가 무한정 증가하여 메모리 부족 발생


```js
// ❌ 위험한 패턴 - 메모리 누수 가능성
const dangerousMemo = (() => {
  const cache = {}; // 절대 정리되지 않는 캐시
  return function(input) {
    const key = JSON.stringify(input);
    if (cache[key]) return cache[key];
    
    const result = heavyComputation(input);
    cache[key] = result; // 계속 누적됨
    return result;
  };
})();

// ✅ 안전한 패턴 - 크기 제한과 TTL
class SafeMemoization {
  constructor(maxSize = 1000, ttl = 300000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }
  
  memoize(fn) {
    return (...args) => {
      const key = JSON.stringify(args);
      const cached = this.cache.get(key);
      
      // TTL 체크
      if (cached && Date.now() - cached.timestamp < this.ttl) {
        return cached.value;
      }
      
      // 크기 제한 체크
      if (this.cache.size >= this.maxSize) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }
      
      const result = fn.apply(this, args);
      this.cache.set(key, { value: result, timestamp: Date.now() });
      return result;
    };
  }
  
  clear() {
    this.cache.clear();
  }
}
```


### 2. 참조 타입 키 처리 문제

**문제:** 객체나 배열을 키로 사용할 때 직렬화 오버헤드


```js
// ❌ 비효율적인 객체 키 처리
const inefficientMemo = (() => {
  const cache = {};
  return function(objInput) {
    const key = JSON.stringify(objInput); // 매번 직렬화 비용 발생
    if (cache[key]) return cache[key];
    
    const result = processObject(objInput);
    cache[key] = result;
    return result;
  };
})();

// ✅ WeakMap을 활용한 효율적인 객체 캐싱
const efficientObjectMemo = (() => {
  const cache = new WeakMap(); // 객체가 GC되면 자동으로 캐시도 정리
  return function(objInput) {
    if (cache.has(objInput)) {
      return cache.get(objInput);
    }
    
    const result = processObject(objInput);
    cache.set(objInput, result);
    return result;
  };
})();
```


### 3. 함수 순수성 요구사항

**문제:** 부작용이 있는 함수는 메모이제이션 부적합


```js
// ❌ 부작용이 있는 함수 - 메모이제이션 부적합
let counter = 0;
const impureFunction = (x) => {
  counter++; // 부작용: 외부 상태 변경
  console.log(`Called ${counter} times`); // 부작용: 로깅
  return x * 2;
};

// ✅ 순수 함수 - 메모이제이션 적합
const pureFunction = (x) => {
  return x * 2; // 동일한 입력에 대해 항상 동일한 출력
};

// 순수성 검증 유틸리티
const isPureForMemoization = (fn, testInput, iterations = 10) => {
  const results = [];
  for (let i = 0; i < iterations; i++) {
    results.push(fn(testInput));
  }
  
  const allSame = results.every(result => 
    JSON.stringify(result) === JSON.stringify(results[0])
  );
  
  return {
    isPure: allSame,
    results: results.slice(0, 3) // 처음 3개 결과만 표시
  };
};
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


## 디버깅과 테스트 전략

### 1. 메모이제이션 동작 추적


```js
// 디버깅을 위한 메모이제이션 래퍼
const debugMemoize = (fn, name = 'anonymous') => {
  const cache = new Map();
  let hits = 0;
  let misses = 0;
  
  const memoized = (...args) => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      hits++;
      console.log(`[${name}] Cache HIT for ${key} (${hits}/${hits + misses})`);
      return cache.get(key);
    }
    
    misses++;
    console.log(`❌ [${name}] Cache MISS for ${key} (${hits}/${hits + misses})`);
    
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
  
  // 통계 메서드 추가
  memoized.getStats = () => ({
    hits,
    misses,
    hitRate: hits / (hits + misses) || 0,
    cacheSize: cache.size
  });
  
  memoized.clearCache = () => {
    cache.clear();
    hits = 0;
    misses = 0;
  };
  
  return memoized;
};

// 사용 예시
const expensiveFunction = debugMemoize((x, y) => {
  return Math.pow(x, y);
}, 'powerCalculation');

expensiveFunction(2, 10); // Cache MISS
expensiveFunction(2, 10); // Cache HIT
console.log(expensiveFunction.getStats()); // { hits: 1, misses: 1, hitRate: 0.5, cacheSize: 1 }
```


### 2. 단위 테스트 작성


```js
// Jest를 사용한 메모이제이션 테스트
describe('Memoization Tests', () => {
  let mockFn;
  let memoizedFn;
  
  beforeEach(() => {
    mockFn = jest.fn((x) => x * 2);
    memoizedFn = memoize(mockFn);
  });
  
  test('should call original function only once for same input', () => {
    memoizedFn(5);
    memoizedFn(5);
    memoizedFn(5);
    
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith(5);
  });
  
  test('should return correct results', () => {
    expect(memoizedFn(5)).toBe(10);
    expect(memoizedFn(3)).toBe(6);
    expect(memoizedFn(5)).toBe(10); // 캐시에서 가져옴
  });
  
  test('should handle different argument types', () => {
    const objectMemo = memoize((obj) => ({ ...obj, processed: true }));
    
    const input1 = { id: 1, name: 'test' };
    const input2 = { id: 1, name: 'test' }; // 같은 내용, 다른 참조
    
    const result1 = objectMemo(input1);
    const result2 = objectMemo(input2);
    
    expect(result1).toEqual(result2);
  });
  
  test('should handle memory cleanup', () => {
    const limitedMemo = memoizeWithLimit(mockFn, 2);
    
    limitedMemo(1);
    limitedMemo(2);
    limitedMemo(3); // 이때 1이 제거되어야 함
    limitedMemo(1); // 다시 계산되어야 함
    
    expect(mockFn).toHaveBeenCalledTimes(4);
  });
});
```


### 3. 성능 프로파일링


```js
// 메모리 사용량 모니터링
class MemoryAwareMemoization {
  constructor(maxMemoryMB = 50) {
    this.cache = new Map();
    this.maxMemoryBytes = maxMemoryMB * 1024 * 1024;
    this.currentMemoryUsage = 0;
  }
  
  memoize(fn) {
    return (...args) => {
      const key = JSON.stringify(args);
      
      if (this.cache.has(key)) {
        return this.cache.get(key);
      }
      
      const result = fn.apply(this, args);
      const resultSize = this.estimateSize(result);
      
      // 메모리 한계 체크
      if (this.currentMemoryUsage + resultSize > this.maxMemoryBytes) {
        this.evictLeastUsed();
      }
      
      this.cache.set(key, {
        value: result,
        lastUsed: Date.now(),
        size: resultSize
      });
      
      this.currentMemoryUsage += resultSize;
      return result;
    };
  }
  
  estimateSize(obj) {
    // 간단한 크기 추정 (실제로는 더 정교한 방법 필요)
    return JSON.stringify(obj).length * 2; // UTF-16 기준
  }
  
  evictLeastUsed() {
    let oldestKey = null;
    let oldestTime = Date.now();
    
    for (const [key, value] of this.cache) {
      if (value.lastUsed < oldestTime) {
        oldestTime = value.lastUsed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      const evicted = this.cache.get(oldestKey);
      this.currentMemoryUsage -= evicted.size;
      this.cache.delete(oldestKey);
    }
  }
}
```


## 프로덕션 환경 고려사항

### 1. 환경별 설정 관리


```js
// 환경별 메모이제이션 설정
const MemoConfig = {
  development: {
    enabled: true,
    maxCacheSize: 100,
    ttl: 60000, // 1분
    debug: true
  },
  production: {
    enabled: true,
    maxCacheSize: 10000,
    ttl: 300000, // 5분
    debug: false
  },
  test: {
    enabled: false, // 테스트에서는 비활성화
    maxCacheSize: 10,
    ttl: 1000,
    debug: false
  }
};

const createMemoization = (env = process.env.NODE_ENV) => {
  const config = MemoConfig[env] || MemoConfig.development;
  
  if (!config.enabled) {
    return (fn) => fn; // 메모이제이션 비활성화
  }
  
  return (fn) => {
    const cache = new Map();
    
    return (...args) => {
      const key = JSON.stringify(args);
      const cached = cache.get(key);
      
      if (cached && Date.now() - cached.timestamp < config.ttl) {
        if (config.debug) {
          console.log(`Cache hit: ${key}`);
        }
        return cached.value;
      }
      
      if (cache.size >= config.maxCacheSize) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      
      const result = fn.apply(this, args);
      cache.set(key, { value: result, timestamp: Date.now() });
      
      if (config.debug) {
        console.log(`Cache miss: ${key}`);
      }
      
      return result;
    };
  };
};
```


### 2. 모니터링과 메트릭스


```js
// 프로덕션 메모이제이션 모니터링
class ProductionMemoization {
  constructor(name, options = {}) {
    this.name = name;
    this.cache = new Map();
    this.metrics = {
      hits: 0,
      misses: 0,
      errors: 0,
      totalExecutionTime: 0,
      cacheOperationTime: 0
    };
    this.options = {
      maxSize: options.maxSize || 1000,
      ttl: options.ttl || 300000,
      reportInterval: options.reportInterval || 60000
    };
    
    // 주기적 메트릭스 리포팅
    this.startMetricsReporting();
  }
  
  memoize(fn) {
    return async (...args) => {
      const startTime = performance.now();
      const key = this.generateKey(args);
      
      try {
        const cacheStartTime = performance.now();
        const cached = this.cache.get(key);
        this.metrics.cacheOperationTime += performance.now() - cacheStartTime;
        
        if (cached && this.isValid(cached)) {
          this.metrics.hits++;
          return cached.value;
        }
        
        this.metrics.misses++;
        const result = await fn.apply(this, args);
        
        this.setCacheValue(key, result);
        this.metrics.totalExecutionTime += performance.now() - startTime;
        
        return result;
      } catch (error) {
        this.metrics.errors++;
        throw error;
      }
    };
  }
  
  generateKey(args) {
    // 더 효율적인 키 생성
    return args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join('|');
  }
  
  isValid(cached) {
    return Date.now() - cached.timestamp < this.options.ttl;
  }
  
  setCacheValue(key, value) {
    if (this.cache.size >= this.options.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }
  
  startMetricsReporting() {
    setInterval(() => {
      const total = this.metrics.hits + this.metrics.misses;
      const hitRate = total > 0 ? (this.metrics.hits / total * 100).toFixed(2) : 0;
      
      console.log(`[${this.name}] Metrics:`, {
        hitRate: `${hitRate}%`,
        cacheSize: this.cache.size,
        errors: this.metrics.errors,
        avgExecutionTime: total > 0 ? (this.metrics.totalExecutionTime / total).toFixed(2) : 0
      });
    }, this.options.reportInterval);
  }
}
```


### 3. 캐시 전략 비교


```js
// 다양한 캐시 전략
const CacheStrategies = {
  // FIFO (First In, First Out)
  FIFO: class {
    constructor(maxSize) {
      this.maxSize = maxSize;
      this.cache = new Map();
      this.insertionOrder = [];
    }
    
    get(key) {
      return this.cache.get(key);
    }
    
    set(key, value) {
      if (this.cache.has(key)) {
        this.cache.set(key, value);
        return;
      }
      
      if (this.cache.size >= this.maxSize) {
        const oldestKey = this.insertionOrder.shift();
        this.cache.delete(oldestKey);
      }
      
      this.cache.set(key, value);
      this.insertionOrder.push(key);
    }
  },
  
  // LFU (Least Frequently Used)
  LFU: class {
    constructor(maxSize) {
      this.maxSize = maxSize;
      this.cache = new Map();
      this.frequencies = new Map();
    }
    
    get(key) {
      if (this.cache.has(key)) {
        this.frequencies.set(key, (this.frequencies.get(key) || 0) + 1);
        return this.cache.get(key);
      }
      return undefined;
    }
    
    set(key, value) {
      if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
        // 가장 적게 사용된 키 찾기
        let minFreq = Infinity;
        let leastUsedKey = null;
        
        for (const [k, freq] of this.frequencies) {
          if (freq < minFreq) {
            minFreq = freq;
            leastUsedKey = k;
          }
        }
        
        if (leastUsedKey) {
          this.cache.delete(leastUsedKey);
          this.frequencies.delete(leastUsedKey);
        }
      }
      
      this.cache.set(key, value);
      this.frequencies.set(key, (this.frequencies.get(key) || 0) + 1);
    }
  }
};

// 전략별 성능 비교 테스트
const compareStrategies = async () => {
  const strategies = ['FIFO', 'LRU', 'LFU'];
  const testData = Array.from({ length: 1000 }, (_, i) => i);
  
  for (const strategy of strategies) {
    const cache = new CacheStrategies[strategy](100);
    const startTime = performance.now();
    
    // 테스트 실행
    testData.forEach(item => {
      cache.set(item, item * 2);
      cache.get(item);
    });
    
    const endTime = performance.now();
    console.log(`${strategy}: ${endTime - startTime}ms`);
  }
};
```


## 메모이제이션 패턴

### 1. LRU (Least Recently Used) 캐시

메모리가 가득 찰 때 가장 오래 사용되지 않은 데이터를 제거하는 캐시 전략입니다.

#### LRU를 사용하는 이유

**시간적 지역성(Temporal Locality) 원리**를 기반으로 합니다.
- 최근에 사용된 데이터는 다시 사용될 가능성이 높음
- 오래 사용되지 않은 데이터는 앞으로도 사용될 가능성이 낮음
- 실제 프로그램에서 80-20 법칙이 적용됨 (20%의 데이터가 80%의 시간 동안 사용)


```js
// LRU의 효과를 보여주는 예시
const accessPattern = [1, 2, 3, 1, 2, 4, 1, 2]; // 1, 2가 자주 사용됨
// LRU 캐시(크기 3)에서:
// [1] → [2,1] → [3,2,1] → [1,3,2] → [2,1,3] → [4,2,1] (3 제거) → [1,4,2] → [2,1,4]
// 자주 사용되는 1, 2는 캐시에 유지되고, 덜 사용되는 3이 제거됨
```

#### 다른 전략과의 비교


```js
// 캐시 히트율 비교 (일반적인 웹 애플리케이션 패턴)
const simulateAccess = (strategy, cacheSize, accessPattern) => {
  let hits = 0;
  const cache = new CacheStrategies[strategy](cacheSize);
  
  accessPattern.forEach(item => {
    if (cache.get(item)) hits++;
    else cache.set(item, `data-${item}`);
  });
  
  return hits / accessPattern.length;
};

// 실제 웹 애플리케이션 접근 패턴 (사용자가 최근 페이지를 다시 방문하는 경향)
const webAccessPattern = [1,2,3,1,2,1,4,5,1,2,6,1,2,3];

console.log('FIFO 히트율:', simulateAccess('FIFO', 3, webAccessPattern)); // ~42%
console.log('LRU 히트율:', simulateAccess('LRU', 3, webAccessPattern));   // ~64%
console.log('LFU 히트율:', simulateAccess('LFU', 3, webAccessPattern));   // ~57%
```



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


## TypeScript 타입 안전성

### 1. 제네릭을 활용한 타입 안전한 메모이제이션


```ts
// 기본 메모이제이션 타입 정의
type MemoizedFunction<T extends (...args: any[]) => any> = T & {
  cache: Map<string, ReturnType<T>>;
  clearCache: () => void;
  getStats: () => { hits: number; misses: number; hitRate: number };
};

// 제네릭 메모이제이션 함수
function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string
): MemoizedFunction<T> {
  const cache = new Map<string, ReturnType<T>>();
  let hits = 0;
  let misses = 0;

  const memoized = ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      hits++;
      return cache.get(key)!;
    }
    
    misses++;
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as MemoizedFunction<T>;

  memoized.cache = cache;
  memoized.clearCache = () => {
    cache.clear();
    hits = 0;
    misses = 0;
  };
  memoized.getStats = () => ({
    hits,
    misses,
    hitRate: hits / (hits + misses) || 0
  });

  return memoized;
}

// 사용 예시
const calculateDistance = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

const memoizedDistance = memoize(calculateDistance);
// 타입 추론: MemoizedFunction<(x1: number, y1: number, x2: number, y2: number) => number>
```


### 2. 비동기 함수 메모이제이션 타입


```ts
// 비동기 함수 메모이제이션 타입
type AsyncMemoizedFunction<T extends (...args: any[]) => Promise<any>> = T & {
  cache: Map<string, { promise: ReturnType<T>; timestamp: number }>;
  clearCache: () => void;
};

function memoizeAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  ttl: number = 300000
): AsyncMemoizedFunction<T> {
  const cache = new Map<string, { promise: ReturnType<T>; timestamp: number }>();

  const memoized = (async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    const key = JSON.stringify(args);
    const cached = cache.get(key);

    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.promise;
    }

    const promise = fn(...args);
    cache.set(key, { promise, timestamp: Date.now() });

    try {
      const result = await promise;
      // 성공한 결과로 캐시 업데이트
      cache.set(key, { 
        promise: Promise.resolve(result), 
        timestamp: Date.now() 
      });
      return result;
    } catch (error) {
      cache.delete(key); // 실패한 요청은 캐시하지 않음
      throw error;
    }
  }) as AsyncMemoizedFunction<T>;

  memoized.cache = cache;
  memoized.clearCache = () => cache.clear();

  return memoized;
}

// API 호출 예시
interface User {
  id: number;
  name: string;
  email: string;
}

const fetchUser = async (userId: number): Promise<User> => {
  const response = await fetch(`/api/users/${userId}`);
  return response.json();
};

const memoizedFetchUser = memoizeAsync(fetchUser, 60000);
// 타입: AsyncMemoizedFunction<(userId: number) => Promise<User>>
```

### 3. 클래스 메서드 데코레이터


```ts
// 메모이제이션 데코레이터 타입
type MethodDecorator<T = any> = (
  target: any,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<T>
) => TypedPropertyDescriptor<T> | void;

// 메모이제이션 데코레이터 구현
function Memoize<T extends (...args: any[]) => any>(
  ttl?: number,
  maxSize?: number
): MethodDecorator<T> {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const originalMethod = descriptor.value!;
    const cache = new Map<string, { value: ReturnType<T>; timestamp: number }>();

    descriptor.value = (function (this: any, ...args: Parameters<T>): ReturnType<T> {
      const key = JSON.stringify(args);
      const cached = cache.get(key);

      // TTL 체크
      if (cached && (!ttl || Date.now() - cached.timestamp < ttl)) {
        return cached.value;
      }

      // 크기 제한 체크
      if (maxSize && cache.size >= maxSize) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }

      const result = originalMethod.apply(this, args);
      cache.set(key, { value: result, timestamp: Date.now() });
      return result;
    } as any) as T;

    return descriptor;
  };
}

// 사용 예시
class MathService {
  @Memoize(60000, 100) // 1분 TTL, 최대 100개 캐시
  calculateFactorial(n: number): number {
    if (n <= 1) return 1;
    return n * this.calculateFactorial(n - 1);
  }

  @Memoize(30000) // 30초 TTL
  async fetchPrimeNumbers(limit: number): Promise<number[]> {
    // 복잡한 소수 계산 로직
    const primes: number[] = [];
    for (let i = 2; i <= limit; i++) {
      if (this.isPrime(i)) primes.push(i);
    }
    return primes;
  }

  private isPrime(n: number): boolean {
    for (let i = 2; i <= Math.sqrt(n); i++) {
      if (n % i === 0) return false;
    }
    return true;
  }
}
```


### 4. 타입 제약 조건


```ts
// 순수 함수만 메모이제이션 가능하도록 타입 제약
type PureFunction<T extends readonly any[], R> = (...args: T) => R;

// 부작용이 없는 함수만 허용하는 메모이제이션
interface MemoizeOptions {
  maxSize?: number;
  ttl?: number;
  keyGenerator?: (...args: any[]) => string;
}

function memoizePure<T extends readonly any[], R>(
  fn: PureFunction<T, R>,
  options: MemoizeOptions = {}
): PureFunction<T, R> & { clearCache(): void } {
  const { maxSize = 1000, ttl, keyGenerator } = options;
  const cache = new Map<string, { value: R; timestamp: number }>();

  const memoized = (...args: T): R => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    const cached = cache.get(key);

    if (cached && (!ttl || Date.now() - cached.timestamp < ttl)) {
      return cached.value;
    }

    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    const result = fn(...args);
    cache.set(key, { value: result, timestamp: Date.now() });
    return result;
  };

  memoized.clearCache = () => cache.clear();
  return memoized;
}

// 컴파일 타임에 타입 안전성 보장
const pureAdd = (a: number, b: number): number => a + b;
const memoizedAdd = memoizePure(pureAdd); // ✅ 허용

// const impureLog = (msg: string): void => console.log(msg);
// const memoizedLog = memoizePure(impureLog); // ❌ void 반환 타입으로 인해 의미 없음
```


### 5. React Hook과의 통합


```ts
import { useCallback, useRef, useMemo } from 'react';

// React용 메모이제이션 훅
function useMemoizedCallback<T extends (...args: any[]) => any>(
  fn: T,
  deps: React.DependencyList,
  options: { maxSize?: number; ttl?: number } = {}
): T {
  const { maxSize = 100, ttl = 300000 } = options;
  const cacheRef = useRef(new Map<string, { value: ReturnType<T>; timestamp: number }>());

  return useCallback(
    ((...args: Parameters<T>): ReturnType<T> => {
      const key = JSON.stringify(args);
      const cache = cacheRef.current;
      const cached = cache.get(key);

      if (cached && Date.now() - cached.timestamp < ttl) {
        return cached.value;
      }

      if (cache.size >= maxSize) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }

      const result = fn(...args);
      cache.set(key, { value: result, timestamp: Date.now() });
      return result;
    }) as T,
    deps
  );
}

// React 컴포넌트에서 사용
interface Props {
  data: number[];
}

const ExpensiveComponent: React.FC<Props> = ({ data }) => {
  const expensiveCalculation = useMemoizedCallback(
    (numbers: number[]) => {
      return numbers.reduce((sum, num) => sum + Math.pow(num, 2), 0);
    },
    [data],
    { maxSize: 50, ttl: 60000 }
  );

  const result = useMemo(() => expensiveCalculation(data), [data, expensiveCalculation]);

  return <div>Result: {result}</div>;
};
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
