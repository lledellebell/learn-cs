---
title: ReturnType - 함수의 반환 타입을 자동으로 추출하는 마법
date: 2025-10-02
layout: page
---

# ReturnType: 함수의 반환 타입을 자동으로 추출하는 마법

상상해보세요. 동료가 만든 복잡한 API 함수가 있습니다. 이 함수의 반환값을 다른 곳에서 사용해야 하는데, 반환 타입을 정확히 알 수가 없습니다. 함수 구현을 열어서 return 문을 하나하나 찾아보고, 조건문마다 다른 타입을 반환하는 것을 확인하고, 직접 타입을 작성해야 할까요?

```ts
// 이런 복잡한 함수가 있다면?
const fetchUserData = async (userId: string, includeDetails: boolean) => {
  const user = await getUserFromDB(userId);

  if (includeDetails) {
    const details = await getUserDetails(userId);
    return { ...user, details, timestamp: Date.now() };
  }

  return { ...user, timestamp: Date.now() };
}

// 반환 타입을 어떻게 알아낼까요? 🤔
```

저도 처음에는 이런 상황에서 함수를 분석해서 타입을 수동으로 작성했습니다. 하지만 함수가 수정될 때마다 타입도 함께 업데이트해야 했고, 실수로 타입과 실제 구현이 달라지는 경우도 있었습니다. **TypeScript의 `ReturnType` 유틸리티 타입은 바로 이런 문제를 해결해줍니다.**

## 왜 ReturnType을 이해해야 할까요?

### 1. 타입 중복을 제거하고 단일 진실 공급원(Single Source of Truth)을 만듭니다

실무에서 가장 흔한 패턴입니다:

```ts
// ❌ 나쁜 예: 타입을 두 번 정의
interface UserResponse {
  id: string;
  name: string;
  email: string;
}

const getUser = (id: string): UserResponse => {
  return {
    id,
    name: "John",
    email: "john@example.com"
  };
}

// 문제: 함수가 변경되면 인터페이스도 수동으로 업데이트해야 함
```

```ts
// ✅ 좋은 예: 함수가 진실의 유일한 공급원
const getUser = (id: string) => {
  return {
    id,
    name: "John",
    email: "john@example.com",
    // 새 필드 추가 - 타입도 자동으로 업데이트됨!
    createdAt: new Date()
  };
}

type UserResponse = ReturnType<typeof getUser>;
// { id: string; name: string; email: string; createdAt: Date }
```

**왜 이것이 중요한가?**
- 함수가 변경되면 타입도 자동으로 업데이트됩니다
- 타입과 구현이 절대 어긋나지 않습니다
- 리팩토링이 훨씬 안전해집니다

### 2. 복잡한 타입 추론을 자동화합니다

TypeScript 컴파일러가 이미 계산한 타입을 재사용할 수 있습니다:

```ts
// 복잡한 조건부 반환
const processData = (value: string | number) => {
  if (typeof value === "string") {
    return { type: "string" as const, value, length: value.length };
  }
  return { type: "number" as const, value, doubled: value * 2 };
}

// 이 복잡한 Union 타입을 수동으로 작성할 필요 없음
type ProcessResult = ReturnType<typeof processData>;
// {
//   type: "string";
//   value: string;
//   length: number;
// } | {
//   type: "number";
//   value: number;
//   doubled: number;
// }
```

### 3. 라이브러리 코드와의 통합을 쉽게 만듭니다

외부 라이브러리의 함수 반환 타입을 활용할 때:

```ts
import { someComplexFunction } from 'external-library';

// 라이브러리가 타입을 export하지 않더라도 추출 가능
type Result = ReturnType<typeof someComplexFunction>;

// 이제 Result를 앱 전체에서 사용 가능
const processResult = (data: Result) => {
  // ...
}
```

### 4. 제네릭 함수의 구체적인 타입을 얻습니다

제네릭 함수를 특정 타입으로 사용할 때의 반환 타입:

```ts
function createList<T>(items: T[]) {
  return {
    items,
    length: items.length,
    first: items[0],
    last: items[items.length - 1]
  };
}

// string[] 버전의 반환 타입
type StringListResult = ReturnType<typeof createList<string>>;
// {
//   items: string[];
//   length: number;
//   first: string;
//   last: string;
// }
```

## 기본 개념: ReturnType은 어떻게 작동할까?

### ReturnType의 내부 구현

TypeScript의 `ReturnType`은 놀랍도록 간단합니다:

```ts
type ReturnType<T extends (...args: any) => any> =
  T extends (...args: any) => infer R ? R : any;
```

이 한 줄을 분해해서 이해해봅시다:

```
┌─────────────────────────────────────────────────────────────┐
│ type ReturnType<T extends (...args: any) => any>           │
│                    ↑                                        │
│                    타입 제약: T는 반드시 함수여야 함         │
│                                                             │
│   = T extends (...args: any) => infer R                    │
│                                    ↑                        │
│                                    R을 추론해줘!            │
│                                                             │
│     ? R        ← 함수면 R 반환                              │
│     : any      ← 함수가 아니면 any (실제로는 일어나지 않음)  │
└─────────────────────────────────────────────────────────────┘
```

### 핵심 키워드: `infer`

`infer`는 "이 위치의 타입을 추론해서 변수에 저장해줘"라는 의미입니다:

```ts
// infer 없이는 불가능
type GetReturnType<T> = T extends (...args: any) => ??? // ??? 이걸 어떻게 표현?

// infer를 사용하면 가능
type GetReturnType<T> = T extends (...args: any) => infer R ? R : never;
//                                                   ↑      ↑
//                                                   추론   사용
```

### 조건부 타입 (Conditional Types)

ReturnType은 조건부 타입을 사용합니다:

```ts
// 기본 형태
T extends U ? X : Y

// 읽는 법: "T가 U에 할당 가능하면 X, 아니면 Y"

// 예시
type IsString<T> = T extends string ? true : false;

type A = IsString<"hello">;  // true
type B = IsString<number>;   // false
```

### 동작 과정 시각화

```ts
// 1단계: typeof로 함수 타입 얻기
const add = (a: number, b: number) => a + b;
type AddFunction = typeof add;
// (a: number, b: number) => number

// 2단계: ReturnType으로 반환 타입 추출
type AddResult = ReturnType<typeof add>;

// 내부 처리 과정:
// AddFunction이 (...args: any) => infer R 패턴과 매치되는가?
// (a: number, b: number) => number
//  ↑ 이 부분이 (...args: any)와 매치
//                              ↑ 이 부분이 infer R과 매치, R = number
// 따라서 AddResult = number
```

## 실전 예제: 다양한 상황에서 ReturnType 활용하기

### 예제 1: 기본 사용법

```ts
// 간단한 함수
const greet = (name: string) => `Hello, ${name}!`;
type GreetResult = ReturnType<typeof greet>;  // string

// void 반환
const logMessage = (msg: string) => {
  console.log(msg);
};
type LogResult = ReturnType<typeof logMessage>;  // void

// 객체 반환
const createUser = (name: string, age: number) => {
  return { name, age, id: Math.random() };
};
type User = ReturnType<typeof createUser>;
// { name: string; age: number; id: number }
```

### 예제 2: Promise와 Async 함수

```ts
// async 함수는 항상 Promise를 반환
const fetchData = async () => {
  return { data: "hello", status: 200 };
};

type FetchResult = ReturnType<typeof fetchData>;
// Promise<{ data: string; status: number }>

// Promise를 벗겨내려면 Awaited 유틸리티 사용
type UnwrappedResult = Awaited<ReturnType<typeof fetchData>>;
// { data: string; status: number }

// 실전 패턴: API 응답 타입 추출
const apiClient = {
  getUser: async (id: string) => {
    const response = await fetch(`/api/users/${id}`);
    return response.json() as {
      id: string;
      name: string;
      email: string;
    };
  },

  createUser: async (data: { name: string; email: string }) => {
    const response = await fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response.json() as { id: string; success: boolean };
  }
};

// API 응답 타입들을 자동으로 추출
type GetUserResponse = Awaited<ReturnType<typeof apiClient.getUser>>;
type CreateUserResponse = Awaited<ReturnType<typeof apiClient.createUser>>;

// 사용
const handleUser = (user: GetUserResponse) => {
  console.log(user.name);  // 타입 안전!
};
```

### 예제 3: 조건부 반환 타입

```ts
// if-else로 다른 타입 반환
const getValue = (flag: boolean) => {
  if (flag) {
    return { type: "success" as const, value: 42 };
  }
  return { type: "error" as const, message: "Failed" };
};

type ValueResult = ReturnType<typeof getValue>;
// {
//   type: "success";
//   value: number;
// } | {
//   type: "error";
//   message: string;
// }

// 타입 가드와 함께 사용
const handleResult = (result: ValueResult) => {
  if (result.type === "success") {
    console.log(result.value);  // number 타입으로 좁혀짐
  } else {
    console.log(result.message);  // string 타입으로 좁혀짐
  }
};
```

### 예제 4: 제네릭 함수

```ts
// 제네릭 함수 정의
function wrapInArray<T>(value: T) {
  return [value];
}

// 제네릭 타입 변수를 사용한 ReturnType
type WrappedString = ReturnType<typeof wrapInArray<string>>;  // string[]
type WrappedNumber = ReturnType<typeof wrapInArray<number>>;  // number[]

// 더 복잡한 제네릭 예제
function createStore<T>(initialState: T) {
  let state = initialState;

  return {
    getState: () => state,
    setState: (newState: T) => { state = newState; },
    subscribe: (listener: (state: T) => void) => {
      // 구독 로직
    }
  };
}

type Store<T> = ReturnType<typeof createStore<T>>;
// {
//   getState: () => T;
//   setState: (newState: T) => void;
//   subscribe: (listener: (state: T) => void) => void;
// }

type UserStore = Store<{ name: string; age: number }>;
// {
//   getState: () => { name: string; age: number };
//   setState: (newState: { name: string; age: number }) => void;
//   subscribe: (listener: (state: { name: string; age: number }) => void) => void;
// }
```

### 예제 5: 오버로드된 함수

```ts
// 함수 오버로드
function process(value: string): string;
function process(value: number): number;
function process(value: boolean): string;
function process(value: string | number | boolean): string | number {
  if (typeof value === "string") return value.toUpperCase();
  if (typeof value === "number") return value * 2;
  return value.toString();
}

type ProcessResult = ReturnType<typeof process>;
// string | number

// 주의: 오버로드된 함수의 경우, 구현 시그니처의 반환 타입을 가져옴
```

### 예제 6: 고차 함수 (Higher-Order Functions)

```ts
// 함수를 반환하는 함수
const createMultiplier = (factor: number) => {
  return (value: number) => value * factor;
};

// 중첩된 ReturnType 사용
type Multiplier = ReturnType<typeof createMultiplier>;
// (value: number) => number

type MultiplierResult = ReturnType<Multiplier>;
// number

// 한 번에 추출
type DirectResult = ReturnType<ReturnType<typeof createMultiplier>>;
// number

// 실전 예제: 미들웨어 패턴
const createMiddleware = (config: { timeout: number }) => {
  return (req: Request) => {
    return {
      ...req,
      timestamp: Date.now(),
      timeout: config.timeout
    };
  };
};

type Middleware = ReturnType<typeof createMiddleware>;
// (req: Request) => { timestamp: number; timeout: number; ... }

type MiddlewareResult = ReturnType<Middleware>;
// { timestamp: number; timeout: number; ... }
```

### 예제 7: 클래스 메서드

```ts
class UserService {
  getUser(id: string) {
    return {
      id,
      name: "John",
      email: "john@example.com"
    };
  }

  async fetchUsers() {
    return [
      { id: "1", name: "Alice" },
      { id: "2", name: "Bob" }
    ];
  }
}

const service = new UserService();

type GetUserResult = ReturnType<typeof service.getUser>;
// { id: string; name: string; email: string }

type FetchUsersResult = ReturnType<typeof service.fetchUsers>;
// Promise<{ id: string; name: string }[]>

type UnwrappedFetchResult = Awaited<ReturnType<typeof service.fetchUsers>>;
// { id: string; name: string }[]
```

## 좋은 예 vs 나쁜 예

### 안티패턴 1: 불필요한 타입 중복

```ts
// ❌ 나쁜 예: 타입을 두 번 정의
interface ApiResponse {
  data: string;
  status: number;
}

const fetchData = (): ApiResponse => {
  return { data: "hello", status: 200 };
};

// 문제점:
// 1. 함수 시그니처와 타입 정의가 따로 관리됨
// 2. 함수가 변경되면 타입도 수동으로 변경해야 함
// 3. 실수로 둘이 달라질 수 있음
```

```ts
// ✅ 좋은 예: 함수가 유일한 진실의 공급원
const fetchData = () => {
  return { data: "hello", status: 200 };
};

type ApiResponse = ReturnType<typeof fetchData>;

// 장점:
// 1. 함수 하나만 관리
// 2. 타입이 자동으로 동기화됨
// 3. 리팩토링이 안전함
```

### 안티패턴 2: 복잡한 타입을 수동으로 작성

```ts
// ❌ 나쁜 예: 복잡한 Union 타입을 수동으로 작성
type Result =
  | { success: true; data: { id: string; name: string } }
  | { success: false; error: string };

const processRequest = (shouldSucceed: boolean): Result => {
  if (shouldSucceed) {
    return { success: true, data: { id: "1", name: "John" } };
  }
  return { success: false, error: "Failed" };
};

// 문제점: 함수 구현이 바뀌면 Result 타입도 수동 업데이트 필요
```

```ts
// ✅ 좋은 예: 컴파일러가 타입을 추론하게 함
const processRequest = (shouldSucceed: boolean) => {
  if (shouldSucceed) {
    return { success: true as const, data: { id: "1", name: "John" } };
  }
  return { success: false as const, error: "Failed" };
};

type Result = ReturnType<typeof processRequest>;
// 자동으로 정확한 Union 타입 생성
```

### 안티패턴 3: Promise 타입을 잘못 다룸

```ts
// ❌ 나쁜 예: Promise를 벗겨내지 않음
const fetchUser = async () => {
  return { id: "1", name: "John" };
};

type UserData = ReturnType<typeof fetchUser>;
// Promise<{ id: string; name: string }>

const processUser = (user: UserData) => {
  console.log(user.name);  // ❌ 에러! Promise에는 name이 없음
};
```

```ts
// ✅ 좋은 예: Awaited로 Promise 언래핑
const fetchUser = async () => {
  return { id: "1", name: "John" };
};

type UserData = Awaited<ReturnType<typeof fetchUser>>;
// { id: string; name: string }

const processUser = (user: UserData) => {
  console.log(user.name);  // ✅ 정상 작동
};
```

### 안티패턴 4: any 남용

```ts
// ❌ 나쁜 예: any로 타입 안전성 포기
const getData = (): any => {
  return { id: 1, value: "test" };
};

type Data = ReturnType<typeof getData>;  // any

const process = (data: Data) => {
  console.log(data.nonExistent);  // 런타임 에러 가능
};
```

```ts
// ✅ 좋은 예: 구체적인 타입 반환
const getData = () => {
  return { id: 1, value: "test" };
};

type Data = ReturnType<typeof getData>;
// { id: number; value: string }

const process = (data: Data) => {
  console.log(data.value);  // ✅ 타입 안전
  // console.log(data.nonExistent);  // ✅ 컴파일 에러
};
```

## 활용: ReturnType을 넘어서

### 패턴 1: 유틸리티 타입 조합하기

```ts
// ReturnType + Awaited + NonNullable
const fetchMaybeUser = async (id: string) => {
  const user = await getUser(id);
  return user || null;
};

type MaybeUser = Awaited<ReturnType<typeof fetchMaybeUser>>;
// User | null

type DefiniteUser = NonNullable<MaybeUser>;
// User (null 제거)

// ReturnType + Parameters
const multiply = (a: number, b: number) => a * b;

type MultiplyParams = Parameters<typeof multiply>;  // [number, number]
type MultiplyReturn = ReturnType<typeof multiply>;  // number

// 함수 시그니처 재구성
type MultiplyFunction = (...args: MultiplyParams) => MultiplyReturn;
```

### 패턴 2: 조건부 타입과 함께 사용

```ts
// 함수가 Promise를 반환하는지 체크
type IsAsyncFunction<T> =
  T extends (...args: any) => Promise<any> ? true : false;

const syncFn = () => "hello";
const asyncFn = async () => "hello";

type A = IsAsyncFunction<typeof syncFn>;   // false
type B = IsAsyncFunction<typeof asyncFn>;  // true

// 자동으로 Promise 언래핑
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

type AutoUnwrap<Fn> = UnwrapPromise<ReturnType<Fn>>;

type C = AutoUnwrap<typeof syncFn>;   // string
type D = AutoUnwrap<typeof asyncFn>;  // string (자동으로 Promise 벗겨짐)
```

### 패턴 3: 제네릭 ReturnType 헬퍼

```ts
// API 클라이언트의 모든 메서드 반환 타입 추출
type ApiClient = {
  getUser: (id: string) => Promise<{ id: string; name: string }>;
  getPost: (id: string) => Promise<{ id: string; title: string }>;
  deleteUser: (id: string) => Promise<{ success: boolean }>;
};

// 모든 메서드의 반환 타입을 추출하는 헬퍼
type ApiResponses<T> = {
  [K in keyof T]: T[K] extends (...args: any) => any
    ? Awaited<ReturnType<T[K]>>
    : never;
};

type Responses = ApiResponses<ApiClient>;
// {
//   getUser: { id: string; name: string };
//   getPost: { id: string; title: string };
//   deleteUser: { success: boolean };
// }

// 사용 예시
type UserResponse = Responses['getUser'];
// { id: string; name: string }
```

### 패턴 4: 팩토리 패턴과 ReturnType

```ts
// 복잡한 팩토리 함수
const createStore = <State>(initialState: State) => {
  let state = initialState;
  const listeners: Array<(state: State) => void> = [];

  return {
    getState: () => state,
    setState: (newState: State) => {
      state = newState;
      listeners.forEach(listener => listener(state));
    },
    subscribe: (listener: (state: State) => void) => {
      listeners.push(listener);
      return () => {
        const index = listeners.indexOf(listener);
        if (index > -1) listeners.splice(index, 1);
      };
    },
    reset: () => {
      state = initialState;
    }
  };
};

// Store 타입 추출
type Store<State> = ReturnType<typeof createStore<State>>;

// 구체적인 Store 타입
interface UserState {
  name: string;
  email: string;
}

type UserStore = Store<UserState>;
// {
//   getState: () => UserState;
//   setState: (newState: UserState) => void;
//   subscribe: (listener: (state: UserState) => void) => () => void;
//   reset: () => void;
// }

// 사용
const userStore: UserStore = createStore<UserState>({
  name: "",
  email: ""
});
```

### 패턴 5: 직접 ReturnType 구현하기

```ts
// 기본 ReturnType 재구현
type MyReturnType<T extends (...args: any) => any> =
  T extends (...args: any) => infer R ? R : never;

// 더 엄격한 버전
type StrictReturnType<T> =
  T extends (...args: any[]) => infer R
    ? R
    : T extends (...args: any[]) => any
      ? never
      : "Error: T must be a function type";

type Test1 = StrictReturnType<() => string>;  // string
type Test2 = StrictReturnType<string>;        // "Error: T must be a function type"

// 오버로드 처리 버전
type LastOverloadReturnType<T> =
  T extends {
    (...args: infer A1): infer R1;
    (...args: infer A2): infer R2;
  } ? R2 : ReturnType<T>;
```

## 함정과 주의사항

### 함정 1: typeof를 빼먹는 실수

```ts
const getUser = () => ({ id: "1", name: "John" });

// ❌ 에러: 'getUser' refers to a value, but is being used as a type
type Wrong = ReturnType<getUser>;

// ✅ 올바름: typeof를 사용해 값을 타입으로 변환
type Correct = ReturnType<typeof getUser>;
```

**이유:** `ReturnType`은 타입을 받지만, 함수 자체는 값입니다. `typeof`를 사용해 값의 타입을 추출해야 합니다.

```
┌─────────────────────────────────────────┐
│ const getUser = () => { ... }           │  ← 값 (Value)
│       ↑                                 │
│       typeof getUser                    │  ← 타입 (Type)
│       ↑                                 │
│       ReturnType<typeof getUser>        │  ← 반환 타입
└─────────────────────────────────────────┘
```

### 함정 2: 제네릭 함수의 추론 한계

```ts
function identity<T>(value: T): T {
  return value;
}

// ❌ 문제: 제네릭이 구체화되지 않음
type IdentityReturn = ReturnType<typeof identity>;
// unknown

// ✅ 해결: 제네릭 타입 명시
type StringIdentityReturn = ReturnType<typeof identity<string>>;
// string

// 더 나은 패턴: 제네릭 타입 헬퍼 사용
type ReturnTypeOf<Fn, Args extends any[]> =
  Fn extends (...args: Args) => infer R ? R : never;
```

### 함정 3: void vs undefined

```ts
// void를 반환하는 함수
const logMessage = (msg: string) => {
  console.log(msg);
};

type LogReturn = ReturnType<typeof logMessage>;  // void

// undefined를 반환하는 함수
const returnUndefined = () => undefined;

type UndefinedReturn = ReturnType<typeof returnUndefined>;  // undefined

// 주의: void와 undefined는 다릅니다!
const handleLog: LogReturn = undefined;  // ✅ OK (void는 undefined 허용)

const handleUndefined: UndefinedReturn = undefined;  // ✅ OK

// 하지만 반대는 안 됨
// const test: undefined = logMessage("hi");  // ❌ void는 undefined가 아님
```

**핵심 차이:**
- `void`: "반환값에 관심 없음" (undefined 할당 가능)
- `undefined`: "명시적으로 undefined 반환" (정확히 undefined만)

### 함정 4: 순환 참조 (Circular Reference)

```ts
// ❌ 에러: 순환 참조
const recursiveFn = () => {
  type Result = ReturnType<typeof recursiveFn>;  // 에러!
  return { nested: recursiveFn() };
};

// ✅ 해결: 명시적 타입 정의
type RecursiveResult = {
  nested: RecursiveResult;
};

const recursiveFn = (): RecursiveResult => {
  return { nested: recursiveFn() };
};
```

### 함정 5: 함수 표현식 vs 선언식

```ts
// 함수 선언식
function declaredFn() {
  return { value: 42 };
}

// 함수 표현식
const expressedFn = () => {
  return { value: 42 };
};

// 둘 다 typeof 필요
type A = ReturnType<typeof declaredFn>;   // { value: number }
type B = ReturnType<typeof expressedFn>;  // { value: number }

// 타입만 있는 경우 (typeof 불필요)
type FnType = () => { value: number };
type C = ReturnType<FnType>;  // { value: number }
```

### 함정 6: 오버로드된 함수의 예상치 못한 동작

```ts
// 오버로드 정의
function process(x: string): string;
function process(x: number): number;
function process(x: string | number): string | number {
  return x;
}

type ProcessReturn = ReturnType<typeof process>;
// string | number (구현 시그니처를 따름)

// 예상했던 것과 다를 수 있음!
// 개별 오버로드의 반환 타입을 원한다면 별도 처리 필요
```

## 실전 활용: 실제 프로젝트 패턴

### 실전 1: Redux/Zustand Store 타입

```ts
// Zustand 스타일 store
const createUserStore = () => {
  return {
    user: null as { id: string; name: string } | null,
    isLoading: false,
    error: null as string | null,

    setUser: (user: { id: string; name: string }) => {
      // setState 로직
    },

    clearUser: () => {
      // clear 로직
    },

    fetchUser: async (id: string) => {
      // fetch 로직
    }
  };
};

// Store 타입 추출
type UserStore = ReturnType<typeof createUserStore>;

// 개별 액션 타입 추출
type SetUserAction = UserStore['setUser'];
// (user: { id: string; name: string }) => void

type FetchUserAction = UserStore['fetchUser'];
// (id: string) => Promise<void>
```

### 실전 2: React Hook 반환 타입

```ts
// 커스텀 훅
const useForm = (initialValues: Record<string, any>) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (onSubmit: (values: typeof values) => void) => {
    // validation
    onSubmit(values);
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
  };

  return {
    values,
    errors,
    handleChange,
    handleSubmit,
    reset
  };
};

// Hook 반환 타입
type UseFormReturn = ReturnType<typeof useForm>;

// 컴포넌트에서 사용
const MyComponent = () => {
  const form: UseFormReturn = useForm({ name: '', email: '' });

  return (
    <form onSubmit={() => form.handleSubmit(console.log)}>
      {/* ... */}
    </form>
  );
};
```

### 실전 3: API 클라이언트 타입 생성

```ts
// API 클라이언트
const api = {
  users: {
    list: async () => {
      const res = await fetch('/api/users');
      return res.json() as Array<{ id: string; name: string }>;
    },

    get: async (id: string) => {
      const res = await fetch(`/api/users/${id}`);
      return res.json() as { id: string; name: string; email: string };
    },

    create: async (data: { name: string; email: string }) => {
      const res = await fetch('/api/users', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return res.json() as { id: string; success: boolean };
    }
  },

  posts: {
    list: async () => {
      const res = await fetch('/api/posts');
      return res.json() as Array<{ id: string; title: string }>;
    }
  }
};

// 모든 API 응답 타입 자동 추출
type ApiEndpoints = typeof api;

type ApiResponseTypes = {
  [K in keyof ApiEndpoints]: {
    [M in keyof ApiEndpoints[K]]:
      ApiEndpoints[K][M] extends (...args: any) => any
        ? Awaited<ReturnType<ApiEndpoints[K][M]>>
        : never;
  };
};

// 사용
type UserListResponse = ApiResponseTypes['users']['list'];
// Array<{ id: string; name: string }>

type UserGetResponse = ApiResponseTypes['users']['get'];
// { id: string; name: string; email: string }

// React Query와 함께
const useUsers = () => {
  return useQuery<UserListResponse>({
    queryKey: ['users'],
    queryFn: api.users.list
  });
};
```

### 실전 4: 빌더 패턴 타입

```ts
// Fluent API / Builder 패턴
const createQueryBuilder = () => {
  let query = '';

  const builder = {
    select: (fields: string[]) => {
      query += `SELECT ${fields.join(', ')} `;
      return builder;
    },

    from: (table: string) => {
      query += `FROM ${table} `;
      return builder;
    },

    where: (condition: string) => {
      query += `WHERE ${condition} `;
      return builder;
    },

    build: () => query.trim()
  };

  return builder;
};

// Builder 타입
type QueryBuilder = ReturnType<typeof createQueryBuilder>;

// 메서드 체이닝 타입 안전성
const query: string = createQueryBuilder()
  .select(['id', 'name'])
  .from('users')
  .where('age > 18')
  .build();
```

### 실전 5: Event Handler 타입

```ts
// 이벤트 핸들러 팩토리
const createEventHandlers = (config: { debug: boolean }) => {
  return {
    onClick: (event: MouseEvent) => {
      if (config.debug) console.log('Click:', event);
      return { type: 'click' as const, x: event.clientX, y: event.clientY };
    },

    onKeyPress: (event: KeyboardEvent) => {
      if (config.debug) console.log('KeyPress:', event);
      return { type: 'keypress' as const, key: event.key };
    },

    onSubmit: (event: SubmitEvent) => {
      event.preventDefault();
      if (config.debug) console.log('Submit:', event);
      return { type: 'submit' as const, data: new FormData(event.target as HTMLFormElement) };
    }
  };
};

// 핸들러 타입들
type EventHandlers = ReturnType<typeof createEventHandlers>;

type ClickHandler = EventHandlers['onClick'];
// (event: MouseEvent) => { type: "click"; x: number; y: number }

type ClickResult = ReturnType<ClickHandler>;
// { type: "click"; x: number; y: number }

// 모든 핸들러의 결과 타입 Union
type AllEventResults = {
  [K in keyof EventHandlers]: ReturnType<EventHandlers[K]>;
}[keyof EventHandlers];
// { type: "click"; x: number; y: number }
// | { type: "keypress"; key: string }
// | { type: "submit"; data: FormData }
```

### 실전 6: 미들웨어 체인

```ts
// Express-style 미들웨어
type Request = { url: string; method: string };
type Response = { status: number; body: any };

const createMiddleware = () => {
  const authMiddleware = (req: Request) => {
    return { ...req, userId: "123", authenticated: true };
  };

  const loggingMiddleware = (req: ReturnType<typeof authMiddleware>) => {
    console.log(`${req.method} ${req.url} by ${req.userId}`);
    return { ...req, timestamp: Date.now() };
  };

  const rateLimitMiddleware = (req: ReturnType<typeof loggingMiddleware>) => {
    return { ...req, rateLimitRemaining: 100 };
  };

  return {
    authMiddleware,
    loggingMiddleware,
    rateLimitMiddleware
  };
};

// 전체 미들웨어 체인의 최종 결과 타입
type Middleware = ReturnType<typeof createMiddleware>;
type FinalRequest = ReturnType<Middleware['rateLimitMiddleware']>;
// {
//   url: string;
//   method: string;
//   userId: string;
//   authenticated: boolean;
//   timestamp: number;
//   rateLimitRemaining: number;
// }
```

## 디버깅과 타입 검증

### 타입을 시각적으로 확인하기

```ts
// 타입을 출력하는 헬퍼
type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

const complexFunction = () => {
  return {
    user: { id: "1", name: "John" },
    settings: { theme: "dark", language: "en" },
    metadata: { createdAt: new Date() }
  };
};

// 기본 ReturnType (접혀있음)
type Raw = ReturnType<typeof complexFunction>;

// Prettify로 펼쳐서 보기
type Pretty = Prettify<ReturnType<typeof complexFunction>>;
// {
//   user: { id: string; name: string };
//   settings: { theme: string; language: string };
//   metadata: { createdAt: Date };
// }
```

### 타입 추론 체크하기

```ts
// 타입이 예상과 맞는지 검증
type Expect<T extends true> = T;
type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends
  (<T>() => T extends Y ? 1 : 2) ? true : false;

const getUser = () => ({ id: "1", name: "John" });

type Test1 = Expect<Equal<
  ReturnType<typeof getUser>,
  { id: string; name: string }
>>;  // ✅ 통과

// type Test2 = Expect<Equal<
//   ReturnType<typeof getUser>,
//   { id: number; name: string }
// >>;  // ❌ 에러: false는 true에 할당 불가
```

### 런타임 타입 검증

```ts
// Zod와 함께 사용
import { z } from 'zod';

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email()
});

const getUser = (id: string) => {
  const data = { id, name: "John", email: "john@example.com" };
  return userSchema.parse(data);  // 런타임 검증
};

// 타입과 런타임 검증이 동기화됨
type User = ReturnType<typeof getUser>;
// z.infer<typeof userSchema>와 동일
```

## 성능과 최적화 고려사항

### 컴파일 시간 최적화

```ts
// ❌ 나쁜 예: 중첩된 ReturnType 남발
type A = ReturnType<ReturnType<ReturnType<typeof fn1>>>;
type B = ReturnType<ReturnType<ReturnType<typeof fn2>>>;
type C = ReturnType<ReturnType<ReturnType<typeof fn3>>>;

// ✅ 좋은 예: 중간 타입 재사용
type Fn1Result = ReturnType<typeof fn1>;
type Fn1Nested = ReturnType<Fn1Result>;
type Fn1Final = ReturnType<Fn1Nested>;
```

### 타입 계산 복잡도

```ts
// 간단한 ReturnType: O(1)
type Simple = ReturnType<typeof simpleFunction>;

// 복잡한 조건부 타입과 결합: O(n)
type Complex<T> = T extends Array<infer U>
  ? ReturnType<U> extends Promise<infer R>
    ? R
    : never
  : never;
```

## 참고 자료

### TypeScript 공식 문서
- [Utility Types - ReturnType](https://www.typescriptlang.org/docs/handbook/utility-types.html#returntypetype) - ReturnType 공식 문서
- [Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html) - 조건부 타입 상세 가이드
- [Type Inference in Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#inferring-within-conditional-types) - infer 키워드 설명
- [TypeScript Deep Dive - Conditional Types](https://basarat.gitbook.io/typescript/type-system/conditional-types) - 조건부 타입 심화

### 관련 Type Challenges
- [Get Return Type](https://github.com/type-challenges/type-challenges/tree/main/questions/00002-medium-return-type) - 원본 문제
- [tsch.js - Get Return Type](https://tsch.js.org/2/play/ko) - 온라인 플레이그라운드
- [Awaited](https://github.com/type-challenges/type-challenges/tree/main/questions/00189-easy-awaited) - Promise 언래핑
- [Parameters](https://github.com/type-challenges/type-challenges/tree/main/questions/00003-medium-omit) - 함수 매개변수 타입 추출

### 추가 학습 자료
- [TypeScript Handbook - Advanced Types](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html) - 타입에서 타입 만들기
- [Matt Pocock - ReturnType Tips](https://www.totaltypescript.com/tips) - 실전 팁 모음
- [TypeScript Weekly](https://www.typescript-weekly.com/) - 최신 TypeScript 뉴스
- [Type-Level TypeScript](https://type-level-typescript.com/) - 고급 타입 시스템

### 실전 예제 프로젝트
- [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) - 실제 라이브러리 타입 정의
- [Zod](https://github.com/colinhacks/zod) - 런타임 + 타입 검증
- [tRPC](https://github.com/trpc/trpc) - ReturnType을 활용한 E2E 타입 안전성
- [Tanstack Query](https://github.com/TanStack/query) - API 응답 타입 추론

### 도구
- [TypeScript Playground](https://www.typescriptlang.org/play) - 온라인 실험 환경
- [TS-Node](https://typestrong.org/ts-node/) - Node.js에서 TypeScript 실행
- [Type Coverage](https://github.com/plantain-00/type-coverage) - 타입 커버리지 측정
