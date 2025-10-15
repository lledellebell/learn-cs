---
title: JavaScript의 Mutation vs Non-Mutation 심화
date: 2025-10-02
last_modified_at: 2025-10-13
categories: [Programming, JavaScript]
tags: [Mutation, Immutability, Array Methods, Functional Programming, Side Effects]
layout: page
---
# JavaScript의 Mutation vs Non-Mutation 심화

> 이 문서는 [Mutation vs Non-Mutation 개념](./mutation-vs-non-mutation.md)의 실무 활용 예시를 다룹니다.

## Non-Mutation이 중요한 이유

### 1. 예측 가능성과 안전성
```js
const arr = [1, 2, 3];
const doubled = arr.map(x => x * 2);
console.log(arr); // [1, 2, 3] → 원본 그대로 유지
```
- 원본 데이터를 다른 곳에서 재사용할 때 안전
- 대규모 코드베이스에서 여러 함수가 같은 배열을 공유할 때 중요

### 2. 디버깅 용이성
- 데이터가 예상치 못하게 변경되는 버그 방지
- 부작용(side effects) 감소로 데이터 변경 추적 용이

### 3. 함수형 프로그래밍과 불변성
- React, Redux, Zustand 등 모던 JavaScript 패턴의 기반
- 이전 상태와 새 상태를 직접 비교 가능

### 4. 시간 여행 디버깅
- Redux DevTools처럼 "시간을 되돌리는" 기능 구현 가능
- 모든 상태가 새로운 스냅샷이기 때문에 가능

### 5. 병렬 및 동시성 안전성
- 멀티스레드나 비동기 환경에서 안전
- 한 함수가 데이터를 변경하는 동안 다른 함수가 사용하는 것을 방지

## Mutation이 필요한 경우

### 1. 성능이 중요한 시나리오
```js
// 대용량 데이터 실시간 처리
const arr = new Array(1_000_000).fill(0);
// Mutation 방식 (더 빠름)
for (let i = 0; i < arr.length; i++) {
  arr[i] = i * 2;
}
// map() 사용 시 새 배열 생성으로 메모리 사용량 2배
```

### 2. Mutation을 기대하는 데이터 구조
```js
const scores = [50, 90, 70];
scores.sort((a, b) => b - a); // 원본 변경
console.log(scores); // [90, 70, 50]
```

### 3. 저수준 제어 (게임, 시뮬레이션, 애니메이션)
```js
// 게임 루프에서 플레이어 위치 업데이트
const players = [{ x: 0, y: 0 }, { x: 5, y: 5 }];
players.forEach(p => {
  p.x += 1;
  p.y += 1;
});
```

### 4. 히스토리 상태가 불필요한 경우
```js
let cart = ["apple", "banana"];
cart.push("orange"); // 이전 장바구니 상태 보존 불필요
```

### 5. 외부 시스템과의 인터페이스
```js
const button = document.querySelector("button");
button.textContent = "Clicked!"; // DOM은 본질적으로 mutable
```

## 예시

### 데이터셋
```js
const numbers = [1, 2, 3, 4];
```

### 1. 요소 추가

**Mutation:**
```js
numbers.push(5);
console.log(numbers); // [1, 2, 3, 4, 5]
// 원본 배열이 변경됨
```

**Non-Mutation:**
```js
const newNumbers = numbers.concat(5);
console.log(newNumbers); // [1, 2, 3, 4, 5]
console.log(numbers);    // [1, 2, 3, 4] (변경되지 않음)
```

### 2. 요소 제거

**Mutation:**
```js
numbers.splice(1, 2);
console.log(numbers); // [1, 4]
// 원본 데이터 손실
```

**Non-Mutation:**
```js
const filtered = numbers.filter(n => n !== 2 && n !== 3);
console.log(filtered); // [1, 4]
console.log(numbers);  // [1, 2, 3, 4] (원본 보존)
```

### 3. 값 업데이트

**Mutation:**
```js
for (let i = 0; i < numbers.length; i++) {
  numbers[i] = numbers[i] * 2;
}
console.log(numbers); // [2, 4, 6, 8]
```

**Non-Mutation:**
```js
const doubled = numbers.map(n => n * 2);
console.log(doubled); // [2, 4, 6, 8]
console.log(numbers); // [1, 2, 3, 4] (원본 보존)
```

### 4. 정렬

**Mutation:**
```js
numbers.sort((a, b) => b - a);
console.log(numbers); // [4, 3, 2, 1]
```

**Non-Mutation (ES2023):**
```js
const sorted = numbers.toSorted((a, b) => b - a);
console.log(sorted);  // [4, 3, 2, 1]
console.log(numbers); // [1, 2, 3, 4] (원본 보존)
```

## 사용 시기

### Mutation 사용 시기
- 내부/로컬 로직 (반복문, 정렬, DOM 업데이트)
- 성능이 중요한 상황
- 히스토리 관리가 불필요한 경우

### Non-Mutation 사용 시기
- 상태 관리 시스템 (React, Redux, 협업 앱)
- 여러 함수가 같은 데이터를 공유하는 경우
- 디버깅과 예측 가능성이 중요한 경우

## 하이브리드 접근법

```js
// 내부적으로는 mutation 사용, 외부에는 immutable하게 노출
class DataProcessor {
  constructor(data) {
    this._data = [...data]; // 복사본으로 시작
  }
  
  // 내부적으로 mutation 사용 (성능)
  _processInternal() {
    for (let i = 0; i < this._data.length; i++) {
      this._data[i] = this._data[i] * 2;
    }
  }
  
  // 외부에는 immutable하게 노출 (안전성)
  getProcessedData() {
    this._processInternal();
    return [...this._data]; // 복사본 반환
  }
}
```

## 실무 개발 관점

### 1. 팀 협업에서의 고려사항

#### 코드 리뷰 시 체크포인트
```js
// ❌ 리뷰에서 지적받을 코드
function processUserData(users) {
  users.sort((a, b) => a.name.localeCompare(b.name)); // 원본 변경!
  users.forEach(user => {
    user.isActive = checkUserStatus(user.id); // 원본 객체 변경!
  });
  return users;
}

// ✅ 리뷰 통과 코드
function processUserData(users) {
  return users
    .map(user => ({
      ...user,
      isActive: checkUserStatus(user.id)
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
```

#### 버그 추적의 어려움
```js
// 실제 프로덕션에서 발생한 버그 사례
const sharedConfig = { apiUrl: 'https://api.example.com', timeout: 5000 };

function moduleA() {
  sharedConfig.timeout = 10000; // 다른 모듈에 영향!
  return fetchData(sharedConfig);
}

function moduleB() {
  // moduleA 호출 후 timeout이 예상과 다름
  return fetchData(sharedConfig); // timeout: 10000 (예상: 5000)
}
```

### 2. 성능 벤치마킹

#### 메모리 사용량 비교
```js
// 성능 테스트 코드
function benchmarkMemoryUsage() {
  const largeArray = new Array(1000000).fill(0).map((_, i) => ({ id: i, value: Math.random() }));
  
  console.time('Mutation');
  const mutationResult = largeArray;
  mutationResult.forEach(item => item.processed = true);
  console.timeEnd('Mutation'); // ~50ms
  
  console.time('Non-Mutation');
  const nonMutationResult = largeArray.map(item => ({ ...item, processed: true }));
  console.timeEnd('Non-Mutation'); // ~200ms
  
  // 메모리 사용량: Non-Mutation이 약 2배
}
```

#### 실제 프로젝트 성능 임계점
```js
// 경험상 성능 차이가 체감되는 기준점
const PERFORMANCE_THRESHOLD = {
  arraySize: 10000,      // 배열 크기
  objectDepth: 3,        // 객체 중첩 깊이
  updateFrequency: 60    // 초당 업데이트 횟수 (60fps)
};

function shouldUseMutation(data, context) {
  return (
    data.length > PERFORMANCE_THRESHOLD.arraySize ||
    context.isRealTime ||
    context.memoryConstrained
  );
}
```

### 3. 프레임워크별 패턴

#### React에서의 실무 패턴
```js
// ❌ React에서 흔한 실수
function UserList({ users, onUserUpdate }) {
  const handleToggleActive = (userId) => {
    const user = users.find(u => u.id === userId);
    user.isActive = !user.isActive; // 직접 변경 - 리렌더링 안됨!
    onUserUpdate(users);
  };
  
  // ✅ 올바른 React 패턴
  const handleToggleActive = (userId) => {
    const updatedUsers = users.map(user =>
      user.id === userId
        ? { ...user, isActive: !user.isActive }
        : user
    );
    onUserUpdate(updatedUsers);
  };
}
```

#### Redux/Zustand 상태 관리
```js
// Redux Toolkit의 Immer 활용
const userSlice = createSlice({
  name: 'users',
  initialState: { list: [] },
  reducers: {
    // Immer 덕분에 mutation 문법 사용 가능
    updateUser: (state, action) => {
      const user = state.list.find(u => u.id === action.payload.id);
      if (user) {
        user.name = action.payload.name; // 실제로는 immutable 업데이트
      }
    }
  }
});

// Zustand의 Immer 통합
const useStore = create(
  immer((set) => ({
    users: [],
    updateUser: (id, updates) => set((state) => {
      const user = state.users.find(u => u.id === id);
      if (user) Object.assign(user, updates);
    })
  }))
);
```

### 4. 디버깅 전략

#### 개발 도구 활용
```js
// 개발 환경에서 mutation 감지
if (process.env.NODE_ENV === 'development') {
  const originalPush = Array.prototype.push;
  Array.prototype.push = function(...args) {
    console.warn('Array mutation detected:', this);
    console.trace();
    return originalPush.apply(this, args);
  };
}

// Object.freeze를 활용한 불변성 강제
function deepFreeze(obj) {
  Object.getOwnPropertyNames(obj).forEach(prop => {
    if (obj[prop] !== null && typeof obj[prop] === 'object') {
      deepFreeze(obj[prop]);
    }
  });
  return Object.freeze(obj);
}

// 개발 환경에서만 적용
const safeData = process.env.NODE_ENV === 'development' 
  ? deepFreeze(data) 
  : data;
```

#### 타입스크립트와의 조합
```ts
// readonly를 활용한 컴파일 타임 보호
interface User {
  readonly id: number;
  readonly name: string;
  readonly email: string;
}

type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// 유틸리티 타입으로 불변성 강제
function processUsers(users: DeepReadonly<User[]>): User[] {
  // users.push() // 컴파일 에러!
  return users.map(user => ({ ...user, processed: true }));
}
```

### 5. 성능 최적화

#### 얕은 복사 vs 깊은 복사 전략
```js
// 성능을 고려한 선택적 복사
function updateNestedData(data, path, value) {
  if (path.length === 1) {
    // 얕은 복사로 충분
    return { ...data, [path[0]]: value };
  }
  
  // 깊은 복사가 필요한 경우만 재귀
  const [head, ...tail] = path;
  return {
    ...data,
    [head]: updateNestedData(data[head], tail, value)
  };
}

// 구조적 공유를 활용한 메모리 최적화
const structuralSharing = {
  updateUser(users, userId, updates) {
    return users.map(user => 
      user.id === userId 
        ? { ...user, ...updates }  // 변경된 객체만 새로 생성
        : user                     // 기존 객체 재사용
    );
  }
};
```

#### 배치 업데이트 패턴
```js
// 여러 변경사항을 한 번에 처리
class DataManager {
  constructor(data) {
    this._data = data;
    this._pendingChanges = [];
  }
  
  // 변경사항 누적
  queueUpdate(id, updates) {
    this._pendingChanges.push({ id, updates });
    return this; // 체이닝 지원
  }
  
  // 한 번에 적용 (성능 최적화)
  commit() {
    if (this._pendingChanges.length === 0) return this._data;
    
    const result = this._data.map(item => {
      const changes = this._pendingChanges.filter(c => c.id === item.id);
      return changes.length > 0
        ? { ...item, ...Object.assign({}, ...changes.map(c => c.updates)) }
        : item;
    });
    
    this._pendingChanges = [];
    return result;
  }
}
```

### 6. 라이브러리 생태계

#### 실무에서 자주 사용하는 도구들 - `Immer`, `Ramda`, `Lodash` 
```js
// Immer - 가장 인기 있는 불변성 라이브러리
import produce from 'immer';

const nextState = produce(currentState, draft => {
  draft.users.push(newUser);           // mutation 문법
  draft.settings.theme = 'dark';       // 하지만 실제로는 immutable
});

// Ramda - 함수형 프로그래밍 유틸리티
import { assocPath, dissocPath } from 'ramda';

const updated = assocPath(['user', 'profile', 'name'], 'John', state);

// Lodash - 실무에서 가장 많이 사용
import { cloneDeep, merge } from 'lodash';

const deepCopy = cloneDeep(originalData);
const merged = merge({}, defaultConfig, userConfig);
```

#### 성능 비교 및 선택 기준
```js
// 라이브러리별 성능 특성 (경험적 데이터)
const LIBRARY_PERFORMANCE = {
  native: { speed: 'fastest', bundle: 0, learning: 'easy' },
  immer: { speed: 'good', bundle: '43kb', learning: 'easy' },
  ramda: { speed: 'good', bundle: '173kb', learning: 'hard' },
  lodash: { speed: 'fast', bundle: '69kb', learning: 'medium' }
};

// 프로젝트 규모별 권장사항
function recommendLibrary(projectSize, teamExperience) {
  if (projectSize === 'small' && teamExperience === 'junior') {
    return 'native + simple helpers';
  }
  if (projectSize === 'large' && teamExperience === 'senior') {
    return 'immer + custom utilities';
  }
  return 'lodash for general use';
}
```
