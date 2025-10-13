---
title: Custom Hooks 가이드 (React 공식 문서 기반)
date: 2025-10-10
last_modified_at: 2025-10-13
layout: page
---
# Custom Hooks 가이드 (React 공식 문서 기반)

> React 공식 문서를 기반으로 작성된 Custom Hooks 가이드

## Custom Hooks란?

Custom Hooks는 **컴포넌트 간에 상태 로직(stateful logic)을 공유**하기 위한 메커니즘입니다.

### 핵심 개념

```ts
// ✅ Custom Hook: 상태 로직을 재사용
function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    function handleOnline() { setIsOnline(true); }
    function handleOffline() { setIsOnline(false); }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
```

**중요**: Custom Hooks는 **상태 로직(logic)을 공유**하지, **상태 자체(state)를 공유하지 않습니다**.

```ts
function ComponentA() {
  const isOnline = useOnlineStatus(); // 독립적인 상태
}

function ComponentB() {
  const isOnline = useOnlineStatus(); // 독립적인 상태 (ComponentA와 다름)
}
```

## 왜 `Custom Hooks`를 사용하는가?

### 1. 코드 중복 제거

**Before: 코드 중복**

```ts
function ChatRoom() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    function handleOnline() { setIsOnline(true); }
    function handleOffline() { setIsOnline(false); }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return <div>{isOnline ? '✅ 연결된 상태' : '❌ 연결되지 않은 상태'}</div>;
}

function StatusBar() {
  // 동일한 로직 반복...
  const [isOnline, setIsOnline] = useState(true);
  useEffect(() => { /* ... */ }, []);

  return <div>{isOnline ? '🟢' : '🔴'}</div>;
}
```

**After: Custom Hook으로 추출**

```ts
// 한 번만 작성
function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  useEffect(() => { /* ... */ }, []);
  return isOnline;
}

// 여러 곳에서 재사용
function ChatRoom() {
  const isOnline = useOnlineStatus();
  return <div>{isOnline ? '✅ Online' : '❌ Disconnected'}</div>;
}

function StatusBar() {
  const isOnline = useOnlineStatus();
  return <div>{isOnline ? '🟢' : '🔴'}</div>;
}
```

### 2. 관심사의 분리 (Separation of Concerns)

```ts
// ❌ 컴포넌트에 모든 로직이 섞여있음
function ProductPage({ productId }) {
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    fetchProduct(productId).then(setProduct);
  }, [productId]);

  useEffect(() => {
    fetchReviews(productId).then(setReviews);
  }, [productId]);

  useEffect(() => {
    fetchRelatedProducts(productId).then(setRelatedProducts);
  }, [productId]);

  // ...
}

// ✅ 각 관심사를 Custom Hook으로 분리
function ProductPage({ productId }) {
  const product = useProduct(productId);
  const reviews = useReviews(productId);
  const relatedProducts = useRelatedProducts(productId);

  // 컴포넌트는 UI 렌더링에만 집중
  return (
    <div>
      <ProductInfo product={product} />
      <ReviewList reviews={reviews} />
      <RelatedProducts products={relatedProducts} />
    </div>
  );
}
```

### 3. 테스트 용이성

```ts
// Custom Hook을 독립적으로 테스트 가능
import { renderHook, act } from '@testing-library/react-hooks';

test('useCounter increments correctly', () => {
  const { result } = renderHook(() => useCounter());

  act(() => {
    result.current.increment();
  });

  expect(result.current.count).toBe(1);
});
```

## Custom Hooks 작성 규칙

### 1. 네이밍 규칙 (Naming Convention)

**필수**: 반드시 `use`로 시작해야 합니다.

```ts
// ✅ 올바른 네이밍
function useFormInput() { }
function useOnlineStatus() { }
function useLocalStorage() { }
function usePrevious() { }

// ❌ 잘못된 네이밍
function getFormInput() { }      // use로 시작하지 않음
function FormInputHook() { }     // use로 시작하지 않음
function form_input_hook() { }   // camelCase가 아님
```

**이유**: React는 `use`로 시작하는 함수를 Hook으로 인식하고, Rules of Hooks를 검증합니다.

### 2. Rules of Hooks

Custom Hooks도 일반 Hooks와 동일한 규칙을 따릅니다.

#### Rule 1: 최상위에서만 호출

```ts
// ❌ 조건문, 반복문, 중첩 함수 내에서 호출 금지
function useExample(condition) {
  if (condition) {
    const [state, setState] = useState(); // ❌ 조건부 호출
  }

  for (let i = 0; i < 10; i++) {
    useEffect(() => {}); // ❌ 반복문 내 호출
  }
}

// ✅ 최상위에서만 호출
function useExample(condition) {
  const [state, setState] = useState();

  useEffect(() => {
    if (condition) {
      // 조건부 로직은 Hook 내부에서
    }
  }, [condition]);
}
```

#### Rule 2: React 함수 내에서만 호출

```ts
// ❌ 일반 JavaScript 함수에서 호출 금지
function regularFunction() {
  const [state, setState] = useState(); // ❌
}

// ✅ React 함수 컴포넌트에서 호출
function Component() {
  const [state, setState] = useState(); // ✅
}

// ✅ Custom Hook 내에서 호출
function useCustomHook() {
  const [state, setState] = useState(); // ✅
}
```

### 3. 순수 함수여야 함 (Pure Function)

```ts
// ❌ 부수 효과가 있는 Hook
let globalCache = {};

function useData(key) {
  // Hook 실행 중 외부 상태 직접 변경 (부수 효과)
  globalCache[key] = 'data';
  return globalCache[key];
}

// ✅ 순수한 Hook
function useData(key) {
  const [data, setData] = useState(null);

  useEffect(() => {
    // 부수 효과는 useEffect 내에서
    fetchData(key).then(setData);
  }, [key]);

  return data;
}
```

## 실전 예제

### 예제 1: useLocalStorage

브라우저 localStorage와 동기화되는 상태 관리

```ts
import { useState, useEffect } from 'react';

function useLocalStorage<T>(key: string, initialValue: T) {
  // localStorage에서 초기값 가져오기
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  // 값이 변경될 때 localStorage 업데이트
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue] as const;
}

// 사용 예시
function Settings() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  const [language, setLanguage] = useLocalStorage('language', 'ko');

  return (
    <div>
      <select value={theme} onChange={e => setTheme(e.target.value)}>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>

      <select value={language} onChange={e => setLanguage(e.target.value)}>
        <option value="ko">한국어</option>
        <option value="en">English</option>
      </select>
    </div>
  );
}
```

### 예제 2: useDebounce

입력값 디바운싱

```ts
import { useState, useEffect } from 'react';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// 사용 예시: 검색 API 호출 최적화
function SearchComponent() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (debouncedSearchTerm) {
      // 500ms 후에만 API 호출
      searchAPI(debouncedSearchTerm).then(setResults);
    }
  }, [debouncedSearchTerm]);

  return (
    <input
      type="text"
      value={searchTerm}
      onChange={e => setSearchTerm(e.target.value)}
      placeholder="검색어 입력..."
    />
  );
}
```

### 예제 3: usePrevious

이전 값 추적

```ts
import { useRef, useEffect } from 'react';

function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

// 사용 예시: 값 변화 감지
function Counter() {
  const [count, setCount] = useState(0);
  const prevCount = usePrevious(count);

  return (
    <div>
      <p>현재: {count}</p>
      <p>이전: {prevCount}</p>
      <p>
        {prevCount !== undefined && count > prevCount
          ? '증가 ⬆️'
          : '감소 ⬇️'}
      </p>
      <button onClick={() => setCount(count + 1)}>+</button>
      <button onClick={() => setCount(count - 1)}>-</button>
    </div>
  );
}
```

### 예제 4: useFetch

데이터 페칭 로직 재사용

```ts
import { useState, useEffect } from 'react';

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

function useFetch<T>(url: string): FetchState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (!cancelled) {
          setData(data);
          setLoading(false);
        }
      })
      .catch(error => {
        if (!cancelled) {
          setError(error);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return { data, loading, error };
}

// 사용 예시
function UserProfile({ userId }: { userId: number }) {
  const { data, loading, error } = useFetch<User>(
    `https://api.example.com/users/${userId}`
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return null;

  return (
    <div>
      <h1>{data.name}</h1>
      <p>{data.email}</p>
    </div>
  );
}
```

### 예제 5: useForm

폼 상태 관리

```ts
import { useState, ChangeEvent } from 'react';

interface FormValues {
  [key: string]: any;
}

interface UseFormReturn<T> {
  values: T;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (callback: (values: T) => void) => (e: React.FormEvent) => void;
  resetForm: () => void;
}

function useForm<T extends FormValues>(initialValues: T): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setValues({
      ...values,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = (callback: (values: T) => void) => (e: React.FormEvent) => {
    e.preventDefault();
    callback(values);
  };

  const resetForm = () => {
    setValues(initialValues);
  };

  return {
    values,
    handleChange,
    handleSubmit,
    resetForm,
  };
}

// 사용 예시
function LoginForm() {
  const { values, handleChange, handleSubmit, resetForm } = useForm({
    email: '',
    password: '',
    rememberMe: false,
  });

  const onSubmit = (data: typeof values) => {
    console.log('Form submitted:', data);
    // API 호출 등
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        name="email"
        type="email"
        value={values.email}
        onChange={handleChange}
        placeholder="이메일"
      />

      <input
        name="password"
        type="password"
        value={values.password}
        onChange={handleChange}
        placeholder="비밀번호"
      />

      <label>
        <input
          name="rememberMe"
          type="checkbox"
          checked={values.rememberMe}
          onChange={handleChange}
        />
        로그인 상태 유지
      </label>

      <button type="submit">로그인</button>
      <button type="button" onClick={resetForm}>초기화</button>
    </form>
  );
}
```

## Best Practices

### 1. 구체적이고 집중된 Hook 만들기

```ts
// ❌ 너무 범용적인 Hook
function useLifecycle(onMount, onUpdate, onUnmount) {
  useEffect(() => {
    onMount();
    return onUnmount;
  }, []);

  useEffect(() => {
    onUpdate();
  });
}

// ✅ 구체적인 목적을 가진 Hook
function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}

function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}
```

### 2. 명확한 네이밍

```ts
// ❌ 불분명한 이름
function useData() { }
function useValue() { }
function useHelper() { }

// ✅ 명확하고 설명적인 이름
function useUserProfile(userId: string) { }
function useShoppingCart() { }
function useAuthToken() { }
function useMediaQuery(query: string) { }
```

### 3. 반환 값 패턴

**튜플 패턴**: 단순한 값 2개

```ts
// useState와 유사한 패턴
function useToggle(initialValue: boolean = false) {
  const [value, setValue] = useState(initialValue);
  const toggle = () => setValue(v => !v);

  return [value, toggle] as const;
}

// 사용
const [isOpen, toggleOpen] = useToggle(false);
```

**객체 패턴**: 여러 값 또는 복잡한 API

```ts
// 여러 값을 반환할 때는 객체 사용
function usePagination(totalItems: number, itemsPerPage: number) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return {
    currentPage,
    totalPages,
    nextPage: () => setCurrentPage(p => Math.min(p + 1, totalPages)),
    prevPage: () => setCurrentPage(p => Math.max(p - 1, 1)),
    goToPage: (page: number) => setCurrentPage(page),
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === totalPages,
  };
}

// 사용 (필요한 것만 destructure)
const { currentPage, nextPage, prevPage, isLastPage } = usePagination(100, 10);
```

### 4. 의존성 배열 정확히 관리

```ts
// ❌ 의존성 누락
function useInterval(callback: () => void, delay: number) {
  useEffect(() => {
    const id = setInterval(callback, delay);
    return () => clearInterval(id);
  }, [delay]); // ❌ callback 누락
}

// ✅ 모든 의존성 포함
function useInterval(callback: () => void, delay: number) {
  const savedCallback = useRef(callback);

  // callback이 변경되면 ref 업데이트
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      savedCallback.current();
    }

    const id = setInterval(tick, delay);
    return () => clearInterval(id);
  }, [delay]);
}
```

### 5. 타입 안정성 (TypeScript)

```ts
// ✅ 제네릭을 활용한 타입 안전성
function useArray<T>(initialValue: T[] = []) {
  const [array, setArray] = useState<T[]>(initialValue);

  const push = (element: T) => {
    setArray(arr => [...arr, element]);
  };

  const filter = (callback: (item: T) => boolean) => {
    setArray(arr => arr.filter(callback));
  };

  const update = (index: number, newElement: T) => {
    setArray(arr => [
      ...arr.slice(0, index),
      newElement,
      ...arr.slice(index + 1),
    ]);
  };

  const remove = (index: number) => {
    setArray(arr => [
      ...arr.slice(0, index),
      ...arr.slice(index + 1),
    ]);
  };

  const clear = () => {
    setArray([]);
  };

  return { array, set: setArray, push, filter, update, remove, clear };
}

// 사용 - 타입 추론 자동
const { array, push, remove } = useArray<string>(['a', 'b', 'c']);
push('d');      // ✅ OK
push(123);      // ❌ Type error
```

### 6. 성능 최적화

```ts
import { useState, useCallback, useMemo } from 'react';

function useExpensiveHook(data: number[]) {
  // ✅ 무거운 계산은 useMemo로 메모이제이션
  const processedData = useMemo(() => {
    return data.map(item => expensiveOperation(item));
  }, [data]);

  // ✅ 콜백 함수는 useCallback으로 메모이제이션
  const handleOperation = useCallback((item: number) => {
    return item * 2;
  }, []);

  return { processedData, handleOperation };
}
```

## 주의사항

### 1. 상태를 공유하지 않음

```ts
// Custom Hook은 로직만 공유, 상태는 독립적
function useCounter() {
  const [count, setCount] = useState(0);
  const increment = () => setCount(c => c + 1);
  return { count, increment };
}

function ComponentA() {
  const { count, increment } = useCounter(); // 독립적인 count
  return <button onClick={increment}>{count}</button>;
}

function ComponentB() {
  const { count, increment } = useCounter(); // 또 다른 독립적인 count
  return <button onClick={increment}>{count}</button>;
}

// ComponentA와 ComponentB의 count는 서로 다름!
```

**상태를 공유하려면 Context API 사용**:

```ts
const CountContext = createContext();

function CountProvider({ children }) {
  const counter = useCounter();
  return (
    <CountContext.Provider value={counter}>
      {children}
    </CountContext.Provider>
  );
}

function useSharedCounter() {
  return useContext(CountContext);
}
```

### 2. Effect를 데이터 흐름 제어에 사용하지 말 것

```ts
// ❌ Effect로 데이터 변환 (안티 패턴)
function useFilteredData(data: Item[]) {
  const [filtered, setFiltered] = useState<Item[]>([]);

  useEffect(() => {
    setFiltered(data.filter(item => item.active));
  }, [data]);

  return filtered;
}

// ✅ 직접 계산 또는 useMemo 사용
function useFilteredData(data: Item[]) {
  return useMemo(() => {
    return data.filter(item => item.active);
  }, [data]);
}
```

### 3. Hook 호출 순서 유지

```ts
// ❌ 조건부 Hook 호출
function useExample(shouldFetch: boolean) {
  if (shouldFetch) {
    const data = useFetch('/api/data'); // ❌ 순서가 바뀔 수 있음
  }
}

// ✅ 항상 호출하되, 조건은 내부에서 처리
function useExample(shouldFetch: boolean) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (shouldFetch) {
      fetch('/api/data').then(setData);
    }
  }, [shouldFetch]);

  return data;
}
```

### 4. 무한 루프 주의

```ts
// ❌ 무한 루프 발생
function useBadExample() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(count + 1); // count가 변경되면 다시 실행 → 무한 루프
  }, [count]);
}

// ✅ 의존성 배열 제거 또는 함수형 업데이트
function useGoodExample() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(c => c + 1); // 함수형 업데이트로 count 의존성 제거
  }, []); // 한 번만 실행
}
```

## 실전 팁

### 1. Hook 조합하기

Custom Hooks는 다른 Hooks를 조합할 수 있습니다.

```ts
function useAuthUser() {
  const { user } = useAuth();
  const { data: profile } = useFetch(`/api/users/${user?.id}`);
  const { data: permissions } = useFetch(`/api/users/${user?.id}/permissions`);

  return {
    user,
    profile,
    permissions,
    isAdmin: permissions?.includes('admin'),
  };
}
```

### 2. 디버깅을 위한 useDebugValue

```ts
import { useDebugValue } from 'react';

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  // React DevTools에 표시될 값
  useDebugValue(isOnline ? 'Online' : 'Offline');

  // ...

  return isOnline;
}
```

### 3. ESLint 플러그인 사용

```bash
npm install eslint-plugin-react-hooks --save-dev
```

```json
{
  "extends": ["plugin:react-hooks/recommended"]
}
```

이 플러그인은 Rules of Hooks 위반을 자동으로 감지합니다.

## 참고 자료

- [React 공식 문서 - Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [React 공식 문서 - Built-in React Hooks](https://react.dev/reference/react/hooks)
- [React Hooks API Reference](https://react.dev/reference/react)
- [Rules of Hooks](https://react.dev/warnings/invalid-hook-call-warning)

## 정리

Custom Hooks는 React의 강력한 기능으로, 다음과 같은 이점을 제공합니다.

1. **재사용성**: 로직을 여러 컴포넌트에서 재사용
2. **가독성**: 복잡한 로직을 명확한 이름의 Hook으로 추상화
3. **테스트 용이성**: 로직을 독립적으로 테스트
4. **관심사의 분리**: UI와 비즈니스 로직을 분리

**핵심 원칙**:

- `use`로 시작하는 네이밍
- Rules of Hooks 준수
- 순수 함수로 작성
- 구체적이고 집중된 목적

Custom Hooks를 잘 활용하면 더 깔끔하고 유지보수하기 쉬운 React 애플리케이션을 만들 수 있습니다.
