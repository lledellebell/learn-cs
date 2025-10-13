---
title: JavaScript에서 Mutation vs Non-Mutation
date: 2025-10-02
layout: page
---
# JavaScript에서 Mutation vs Non-Mutation

JavaScript에서 배열과 객체를 다룰 때 **원본 데이터를 변경하는 방식(Mutation)**과 **새로운 데이터를 생성하는 방식(Non-Mutation)**의 차이점과 활용법을 알아봅니다.

## 개념과 동작 원리

### 메모리 관점에서의 차이점

#### Mutation (변이) - 원본 수정 방식

```
초기 상태:
Memory Address: 0x1000
┌─────────────────┐
│ arr = [1, 2, 3] │  ← 원본 배열
└─────────────────┘
       ↑
   변수 'arr'이 참조

arr.push(4) 실행 후:
Memory Address: 0x1000 (동일한 주소)
┌─────────────────────┐
│ arr = [1, 2, 3, 4]  │  ← 같은 위치에서 내용만 변경
└─────────────────────┘
       ↑
   변수 'arr'이 여전히 같은 주소 참조
```

#### Non-Mutation (불변성) - 새 데이터 생성 방식

```
초기 상태:
Memory Address: 0x1000
┌─────────────────┐
│ arr = [1, 2, 3] │  ← 원본 배열
└─────────────────┘
       ↑
   변수 'arr'이 참조

arr.concat(4) 실행 후:
Memory Address: 0x1000        Memory Address: 0x2000
┌─────────────────┐          ┌─────────────────────┐
│ arr = [1, 2, 3] │          │ new = [1, 2, 3, 4]  │  ← 새로운 배열
└─────────────────┘          └─────────────────────┘
       ↑                             ↑
   기존 참조 유지               새로운 변수가 참조
```

### 특징 비교

| 특징 | Mutation (변이) | Non-Mutation (불변성) |
|------|----------------|----------------------|
| **메모리 주소** | 변경 없음 (재사용) | 새로운 주소에 생성 |
| **원본 데이터** | 내용 수정됨 | 완전 보존됨 |
| **참조 관계** | 모든 참조가 변경된 값 확인 | 기존/새 참조가 다른 데이터 |
| **메모리 사용량** | 효율적 (재사용) | 추가 메모리 필요 |
| **성능** | 빠름 (직접 수정) | 상대적으로 느림 (복사) |
| **예측 가능성** | 낮음 (부작용 존재) | 높음 (부작용 없음) |
| **동시성 안전** | 위험 (Race Condition) | 안전 (독립적 실행) |
| **디버깅** | 어려움 (상태 추적 복잡) | 쉬움 (상태 변화 명확) |

### 참조와 값의 관계

#### 1. 얕은 참조 (Shallow Reference)

```js
// Mutation 방식
const original = [1, 2, 3];
const reference = original;  // 같은 메모리 주소를 참조

original.push(4);
console.log(reference);  // [1, 2, 3, 4] - 함께 변경됨!

/*
메모리 다이어그램:
┌─────────────────────┐
│    [1, 2, 3, 4]     │ ← 0x1000
└─────────────────────┘
       ↑         ↑
   original  reference
   (둘 다 같은 주소 참조)
*/
```

```js
// Non-Mutation 방식
const original = [1, 2, 3];
const newArray = original.concat(4);  // 새로운 배열 생성

console.log(original);  // [1, 2, 3] - 원본 유지
console.log(newArray);  // [1, 2, 3, 4] - 새로운 데이터

/*
메모리 다이어그램:
┌─────────────┐              ┌─────────────────────┐
│ [1, 2, 3]   │ ← 0x1000     │    [1, 2, 3, 4]     │ ← 0x2000
└─────────────┘              └─────────────────────┘
       ↑                        ↑
   original                 newArray
*/
```

#### 2. 깊은 참조 (Deep Reference)

```js
// 중첩 객체에서의 Mutation
const user = {
  name: 'John',
  profile: { age: 30, city: 'Seoul' }
};

const userRef = user;
userRef.profile.age = 31;  // 깊은 속성 변경

console.log(user.profile.age);  // 31 - 원본도 변경됨!

/*
메모리 구조:
user ──┐    ┌─────────────────┐
       └──→ │ name: 'John'    │ ← 0x1000
            │ profile: ──────┐│
            └────────────────┘│
userRef ──────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ age: 31         │ ← 0x2000
                    │ city: 'Seoul'   │
                    └─────────────────┘
*/
```

```js
// 중첩 객체에서의 Non-Mutation
const user = {
  name: 'John',
  profile: { age: 30, city: 'Seoul' }
};

const updatedUser = {
  ...user,
  profile: {
    ...user.profile,
    age: 31
  }
};

console.log(user.profile.age);        // 30 - 원본 유지
console.log(updatedUser.profile.age); // 31 - 새로운 값

/*
메모리 구조:
user ──┐         ┌─────────────────┐
       └───────→ │ name: 'John'    │ ← 0x1000
                 │ profile: ──────┐│
                 └────────────────┘│
                                  │
                                  ▼
                        ┌─────────────────┐
                        │ age: 30         │ ← 0x2000
                        │ city: 'Seoul'   │
                        └─────────────────┘

updatedUser ──┐   ┌─────────────────┐
              └─→ │ name: 'John'    │ ← 0x3000
                  │ profile: ──────┐│
                  └────────────────┘│
                                    │
                                    ▼
                        ┌─────────────────┐
                        │ age: 31         │ ← 0x4000
                        │ city: 'Seoul'   │
                        └─────────────────┘
*/
```

### 가비지 컬렉션과의 관계

#### 메모리 사용 패턴 비교

| 측면 | Mutation 방식 | Non-Mutation 방식 |
|------|---------------|-------------------|
| **메모리 주소** | 동일 주소 재사용 (0x1000) | 새 주소 할당 (0x1000, 0x2000, 0x3000...) |
| **메모리 사용량** | 일정 (기존 공간 확장) | 누적 증가 (새 객체마다 추가) |
| **가비지 컬렉션** | 거의 발생하지 않음 | 참조 없는 객체들 정리 필요 |
| **메모리 효율성** | 높음 (재사용) | 낮음 (중복 데이터) |
| **메모리 단편화** | 적음 | 많음 (여러 객체 분산) |
| **대용량 데이터** | 유리 (공간 절약) | 불리 (메모리 부족 위험) |

#### Mutation 방식의 메모리 효율성

```
시간 흐름 →

T1: arr = [1, 2, 3]     Memory: 0x1000 ┌─────────────┐
                                       │ [1, 2, 3]   │
                                       └─────────────┘

T2: arr.push(4)         Memory: 0x1000 ┌─────────────────┐
                                       │ [1, 2, 3, 4]    │ (확장)
                                       └─────────────────┘

T3: arr.push(5)         Memory: 0x1000 ┌─────────────────────┐
                                       │ [1, 2, 3, 4, 5]     │ (확장)
                                       └─────────────────────┘
```

#### Non-Mutation 방식의 메모리 패턴

```
시간 흐름 →

T1: arr1 = [1, 2, 3]    Memory: 0x1000 ┌─────────────┐
                                       │ [1, 2, 3]   │
                                       └─────────────┘

T2: arr2 = arr1.concat(4) Memory: 0x1000 ┌─────────────┐  0x2000 ┌─────────────────┐
                                         │ [1, 2, 3]   │         │ [1, 2, 3, 4]    │
                                         └─────────────┘         └─────────────────┘

T3: arr3 = arr2.concat(5) Memory: 0x1000 ┌─────────────┐  0x2000 ┌─────────────────┐  0x3000 ┌─────────────────────┐
                                         │ [1, 2, 3]   │         │ [1, 2, 3, 4]    │         │ [1, 2, 3, 4, 5]     │
                                         └─────────────┘         └─────────────────┘         └─────────────────────┘
```

### 동시성과 스레드 안전성

#### 동시성 안전성 비교

| 측면 | Mutation 방식 | Non-Mutation 방식 |
|------|---------------|-------------------|
| **Race Condition** | 발생 가능 | 발생하지 않음 |
| **상태 예측성** | 낮음 (실행 순서에 따라 달라짐) | 높음 (항상 동일한 결과) |
| **동시 접근** | 위험 (데이터 손상 가능) | 안전 (독립적 실행) |
| **락(Lock) 필요성** | 필요 (동기화 메커니즘) | 불필요 (자연스럽게 안전) |
| **병렬 처리** | 복잡 (동기화 고려) | 단순 (독립적 처리) |
| **디버깅 난이도** | 높음 (타이밍 이슈) | 낮음 (결정적 동작) |

#### Mutation의 동시성 문제

```js
// 문제 상황: 여러 함수가 같은 객체를 동시에 수정
const sharedState = { counter: 0, items: [] };

function incrementCounter() {
  sharedState.counter++;  // Race Condition 가능
}

function addItem(item) {
  sharedState.items.push(item);  // Race Condition 가능
}

// 동시 실행 시 예측 불가능한 결과
Promise.all([
  Promise.resolve().then(() => incrementCounter()),
  Promise.resolve().then(() => incrementCounter()),
  Promise.resolve().then(() => addItem('A')),
  Promise.resolve().then(() => addItem('B'))
]);

/*
메모리 상태 변화 (예측 불가능):
T1: { counter: 0, items: [] }
T2: { counter: 1, items: ['A'] }     또는
T2: { counter: 1, items: ['B'] }     또는
T2: { counter: 2, items: [] }        등등...
*/
```

#### Non-Mutation의 동시성 안전성

```js
// 안전한 상황: 각 함수가 새로운 상태를 생성
function incrementCounter(state) {
  return { ...state, counter: state.counter + 1 };
}

function addItem(state, item) {
  return { ...state, items: [...state.items, item] };
}

// 동시 실행해도 각각 독립적인 결과
const initialState = { counter: 0, items: [] };

const results = await Promise.all([
  Promise.resolve(incrementCounter(initialState)),
  Promise.resolve(incrementCounter(initialState)),
  Promise.resolve(addItem(initialState, 'A')),
  Promise.resolve(addItem(initialState, 'B'))
]);

/*
각각 독립적인 결과:
results[0]: { counter: 1, items: [] }
results[1]: { counter: 1, items: [] }
results[2]: { counter: 0, items: ['A'] }
results[3]: { counter: 0, items: ['B'] }
원본: { counter: 0, items: [] } (변경되지 않음)
*/
```

### 타입 시스템과의 관계

#### JavaScript 타입별 동작 비교

| 타입 분류 | 데이터 저장 방식 | 할당 시 동작 | Mutation 영향 | 예시 |
|----------|----------------|-------------|---------------|------|
| **원시 타입** | 값 직접 저장 | 값 복사 | 영향 없음 | `number`, `string`, `boolean` |
| **참조 타입** | 메모리 주소 저장 | 주소 복사 | 모든 참조에 영향 | `object`, `array`, `function` |
| **특수 타입** | 값 저장 | 값 복사 | 영향 없음 | `null`, `undefined`, `symbol` |

#### JavaScript의 참조 타입 동작

```js
// 원시 타입 (Primitive Types) - 항상 값 복사
let a = 5;
let b = a;  // 값 복사
a = 10;
console.log(b);  // 5 (변경되지 않음)

// 참조 타입 (Reference Types) - 주소 복사
let obj1 = { value: 5 };
let obj2 = obj1;  // 주소 복사
obj1.value = 10;
console.log(obj2.value);  // 10 (함께 변경됨)

/*
원시 타입 메모리:
a: 0x1000 [10]    b: 0x2000 [5]
   ↑ 독립적        ↑ 독립적

참조 타입 메모리:
obj1: 0x1000 ──┐
               └─→ 0x3000 [{ value: 10 }]
obj2: 0x2000 ──┘
   ↑ 같은 객체를 참조
*/
```

### 함수형 프로그래밍의 수학적 기초

#### 함수형 프로그래밍 원칙 비교

| 원칙 | Mutation 방식 | Non-Mutation 방식 |
|------|---------------|-------------------|
| **순수성 (Purity)** | 위반 (부작용 존재) | 준수 (부작용 없음) |
| **참조 투명성** | 위반 (같은 입력, 다른 결과) | 준수 (같은 입력, 같은 결과) |
| **불변성 (Immutability)** | 위반 (데이터 변경) | 준수 (데이터 보존) |
| **합성 가능성** | 어려움 (상태 의존) | 쉬움 (독립적 함수) |
| **테스트 용이성** | 어려움 (상태 설정 복잡) | 쉬움 (입출력만 확인) |
| **병렬 처리** | 복잡 (동기화 필요) | 단순 (자연스럽게 안전) |

#### 순수 함수 (Pure Function)의 정의

```js
// 순수 함수: 같은 입력 → 같은 출력, 부작용 없음
function pureAdd(arr, item) {
  return [...arr, item];  // 새 배열 반환
}

// 비순수 함수: 부작용 존재
function impureAdd(arr, item) {
  arr.push(item);  // 원본 수정
  return arr;
}

/*
수학적 관점:
f(x) = y  (순수 함수)
- f([1,2], 3) = [1,2,3] (항상 같은 결과)
- 입력값 [1,2]는 변경되지 않음

g(x) = y + side_effect  (비순수 함수)
- g([1,2], 3) = [1,2,3] (결과는 같지만)
- 입력값 [1,2]가 [1,2,3]으로 변경됨 (부작용)
*/
```

#### 참조 투명성 (Referential Transparency)

```js
// 참조 투명성을 만족하는 코드
const numbers = [1, 2, 3];
const doubled1 = numbers.map(x => x * 2);
const doubled2 = numbers.map(x => x * 2);
// doubled1과 doubled2는 항상 같은 값
// numbers는 항상 [1, 2, 3]으로 일정

// 참조 투명성을 위반하는 코드
const mutableNumbers = [1, 2, 3];
function doubleInPlace(arr) {
  for (let i = 0; i < arr.length; i++) {
    arr[i] *= 2;
  }
  return arr;
}

const result1 = doubleInPlace(mutableNumbers);  // [2, 4, 6]
const result2 = doubleInPlace(mutableNumbers);  // [4, 8, 12] - 다른 결과!
```

## 참고 자료

### 공식 문서
- [MDN - Array.prototype methods](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) - JavaScript 배열 메서드 공식 문서
- [MDN - Object methods](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) - JavaScript 객체 메서드 공식 문서
- [MDN - Spread syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax) - 스프레드 연산자 문법

### 불변성 관련 자료
- [Immutable.js](https://immutable-js.com/) - Facebook의 불변성 라이브러리
- [Immer](https://immerjs.github.io/immer/) - 불변성을 쉽게 다루는 라이브러리
- [Ramda](https://ramdajs.com/) - 함수형 프로그래밍 유틸리티 라이브러리

### 함수형 프로그래밍
- [Functional Programming in JavaScript](https://mostly-adequate.gitbook.io/mostly-adequate-guide/) - 함수형 프로그래밍 가이드북
- [Professor Frisby's Mostly Adequate Guide](https://github.com/MostlyAdequate/mostly-adequate-guide) - 함수형 프로그래밍 무료 책
- [Functional-Light JavaScript](https://github.com/getify/Functional-Light-JavaScript) - Kyle Simpson의 함수형 JavaScript

### 성능 관련 자료
- [V8 Engine Blog](https://v8.dev/blog) - JavaScript 엔진 최적화 관련 블로그
- [JavaScript Performance](https://developers.google.com/web/fundamentals/performance/rendering) - Google의 JavaScript 성능 가이드
- [Benchmark.js](https://benchmarkjs.com/) - JavaScript 성능 측정 라이브러리

### React와 불변성
- [React Immutability Helpers](https://legacy.reactjs.org/docs/update.html) - React 불변성 헬퍼 (레거시)
- [React State Updates](https://react.dev/learn/updating-objects-in-state) - React 상태 업데이트 가이드
- [Redux Immutable Patterns](https://redux.js.org/usage/structuring-reducers/immutable-update-patterns) - Redux 불변성 패턴

### 도구 및 라이브러리
- [ESLint Rules](https://eslint.org/docs/latest/rules/) - JavaScript 코드 품질 검사
- [TypeScript](https://www.typescriptlang.org/) - 타입 안전성을 위한 JavaScript 확장
- [Lodash](https://lodash.com/) - JavaScript 유틸리티 라이브러리

### 블로그 및 아티클
- [JavaScript Array Methods: Mutating vs Non-Mutating](https://lorenstewart.me/2017/01/22/javascript-array-methods-mutating-vs-non-mutating/) - 배열 메서드 비교
- [Immutability in JavaScript](https://www.sitepoint.com/immutability-javascript/) - JavaScript 불변성 설명
- [Why Immutability Matters](https://hackernoon.com/why-immutability-matters-in-javascript-3c3b3b8e9e8) - 불변성의 중요성

### 학습 자료
- [JavaScript.info](https://javascript.info/) - 모던 JavaScript 튜토리얼
- [You Don't Know JS](https://github.com/getify/You-Dont-Know-JS) - JavaScript 심화 학습서
- [Eloquent JavaScript](https://eloquentjavascript.net/) - JavaScript 프로그래밍 입문서

