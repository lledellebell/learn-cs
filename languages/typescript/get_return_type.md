---
title: Get Return Type
date: 2025-10-02
layout: page
---
# Get Return Type
## 출처

- [Type Challenges - Get Return Type](https://github.com/type-challenges/type-challenges/tree/main/questions/00002-medium-return-type)
- [tsch.js](https://tsch.js.org/2/play/ko)

## 문제

내장 제네릭 `ReturnType<T>`을 이를 사용하지 않고 구현하세요.

### 예시

```ts
const fn = (v: boolean) => {
  if (v)
    return 1
  else
    return 2
}

type a = MyReturnType<typeof fn> // should be "1 | 2"
```

## 사전 요구 개념

- 함수의 반환값 타입을 추출하는 제네릭
- 조건부 타입(Conditional Types)
- infer 키워드
- 함수 시그니처 매칭
- 타입 안정성
- never 타입

## 문제 풀이

이 문제는 TypeScript의 **타입 시스템**을 활용해 <u>함수의 반환 타입을 자동으로 추출하는 유틸리티 타입을 만드는 것</u>입니다. 

### 핵심 아이디어

함수 타입에서 반환 타입만 분리해내려면?

1. 입력된 타입이 함수인지 확인
2. 함수라면 반환 타입 부분을 추출
3. 함수가 아니라면 `never` 타입 반환

### 1. 기본 접근법

TypeScript의 `조건부 타입(Conditional Types)`과 `infer` 키워드를 사용하여 함수의 반환 타입을 추출할 수 있습니다.

```ts
type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : never
//                     ↑ 함수 타입인가?        ↑ 반환타입 추출  ↑ 아니면 never
```

### 2. 단계별 분석

#### 2-1. 조건부 타입 구조
```ts
T extends U ? X : Y
```
- `T`가 `U`에 할당 가능하면 `X`, 아니면 `Y`

#### 2-2. 함수 타입 패턴 매칭
```ts
T extends (...args: any[]) => infer R
```

이 부분을 자세히 분석해보면?

**`(...args: any[])`**: 
- 함수의 매개변수 부분을 나타냄
- `...args`는 `rest parameter (나머지 매개변수)`
- `any[]`는 어떤 타입의 매개변수든 받을 수 있음을 의미

**`=> infer R`**:
- `=>` 뒤는 함수의 반환 타입 부분
- `infer R`은 "이 위치의 타입을 R이라는 변수로 추론해줘"라는 의미
- R은 나중에 조건부 타입의 true 분기에서 사용됨

**전체 의미**:
"T가 '어떤 매개변수든 받고 R 타입을 반환하는 함수' 형태라면, 그 R을 추출해줘"

#### 2-3. 실제 동작 과정

```ts
// 예시: 함수 타입 분석
type ExampleFn = (x: number, y: string) => boolean

// MyReturnType<ExampleFn> 처리 과정:
// 1. ExampleFn이 (...args: any[]) => infer R 패턴과 매치되는가?
// 2. (x: number, y: string) => boolean이 (...args: any[]) => infer R과 매치됨
// 3. 이때 R = boolean으로 추론됨
// 4. 조건이 true이므로 R(boolean)을 반환

type Result = MyReturnType<ExampleFn> // boolean
```

#### 2-4. 구현
```ts
type MyReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : never
```

**타입 제약 추가**: `T extends (...args: any) => any`
- 제네릭 T가 반드시 함수 타입이어야 함을 명시
- 함수가 아닌 타입을 전달하면 컴파일 에러 발생

### 3. 테스트 케이스

```ts
// 기본 함수
const fn = (v: boolean) => {
  if (v) return 1
  else return 2
}
type Test1 = MyReturnType<typeof fn> // 1 | 2

// 다양한 반환 타입
const stringFn = () => "hello"
type Test2 = MyReturnType<typeof stringFn> // string

const voidFn = () => {}
type Test3 = MyReturnType<typeof voidFn> // void

const asyncFn = async () => "async"
type Test4 = MyReturnType<typeof asyncFn> // Promise<string>

// 제네릭 함수
function genericFn<T>(arg: T): T {
  return arg
}
type Test5 = MyReturnType<typeof genericFn> // unknown
```

### 4. 활용

#### 4-1. 더 엄격한 타입 제약

기본 구현에서는 함수가 아닌 타입을 전달하면 단순히 `never`를 반환합니다.
하지만 더 명확한 에러 메시지를 제공하여 타입 안정성을 높일 수 있습니다.

```ts
// 함수가 아닌 타입에 대해 더 명확한 에러 메시지
type MyReturnType<T> = T extends (...args: any[]) => infer R 
  ? R 
  : T extends (...args: any[]) => any 
    ? never 
    : "에러: T는 함수 타입이어야 합니다."

// 사용 예시
type Test1 = MyReturnType<() => string>  // string
type Test2 = MyReturnType<number>        // "에러: T는 함수 타입이어야 합니다."
type Test3 = MyReturnType<string>        // "에러: T는 함수 타입이어야 합니다."
```

**동작 원리:**
1. 첫 번째 조건: `T extends (...args: any[]) => infer R` - 함수면 반환 타입 추출
2. 두 번째 조건: `T extends (...args: any[]) => any` - 함수지만 첫 번째에서 매치 안됨 (거의 없음)
3. 세 번째: 함수가 아니면 에러 메시지 반환

#### 4-2. 오버로드된 함수 처리

TypeScript에서 함수 오버로드는 여러 시그니처를 가질 수 있습니다.

> 시그니처(Signature): 함수의 타입을 정의하는 부분

```ts
// 오버로드된 함수 정의
function overloadedFn(x: string): string
function overloadedFn(x: number): number
function overloadedFn(x: string | number): string | number {
  return x
}

type Test6 = MyReturnType<typeof overloadedFn> // string | number
```

**오버로드 처리 방식:**
- TypeScript는 오버로드된 함수의 **마지막 시그니처**(구현 시그니처)를 타입으로 인식
- `(x: string | number) => string | number`가 실제 함수 타입
- 따라서 `MyReturnType`은 `string | number`를 반환

**실무 활용:**
```ts
// API 함수 오버로드 예시
function fetchData(id: string): Promise<User>
function fetchData(ids: string[]): Promise<User[]>
function fetchData(param: string | string[]): Promise<User | User[]> {
  // 구현...
}

type FetchResult = MyReturnType<typeof fetchData> // Promise<User | User[]>
```

### 5. 실제 사용 예시

#### 5-1. API 응답 타입 추출

실무에서 API 함수의 반환 타입을 추출하는 패턴:

```ts
// API 함수 정의
const fetchUser = async (id: string) => {
  return { id, name: "John", email: "john@example.com" }
}

// 1단계: 함수 반환 타입 추출 (Promise 포함)
type UserData = MyReturnType<typeof fetchUser> 
// Promise<{ id: string; name: string; email: string; }>

// 2단계: Promise에서 실제 데이터 타입 추출
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T
type User = UnwrapPromise<UserData> 
// { id: string; name: string; email: string; }
```

**활용 시나리오:**
- API 응답 타입을 별도로 정의하지 않고 함수에서 자동 추출
- 타입 중복 제거 및 일관성 유지
- 함수 시그니처 변경 시 타입 자동 업데이트

#### 5-2. 함수 팩토리 패턴

고차 함수에서 반환되는 함수의 타입 추출:

> 고차 함수(HOC; Higher Order Function): 다른 함수를 반환하는 함수

```ts
// 함수를 생성하는 함수 (팩토리)
const createHandler = (type: string) => {
  return (data: any) => ({ 
    type, 
    data, 
    timestamp: Date.now() 
  })
}

// 중첩된 타입 추출
type HandlerResult = MyReturnType<ReturnType<typeof createHandler>>
// { type: string; data: any; timestamp: number; }
```

**단계별 분석:**
1. `typeof createHandler`: `(type: string) => (data: any) => {...}`
2. `ReturnType<typeof createHandler>`: `(data: any) => {...}`
3. `MyReturnType<...>`: `{ type: string; data: any; timestamp: number; }`

#### 5-3. 이벤트 핸들러 타입 추출

React나 DOM 이벤트 핸들러에서 활용:

```ts
// 이벤트 핸들러 함수들
const handleClick = (event: MouseEvent) => {
  return { clicked: true, x: event.clientX, y: event.clientY }
}

const handleSubmit = (formData: FormData) => {
  return { success: true, data: Object.fromEntries(formData) }
}

// 핸들러 결과 타입 추출
type ClickResult = MyReturnType<typeof handleClick>
// { clicked: boolean; x: number; y: number; }

type SubmitResult = MyReturnType<typeof handleSubmit>
// { success: boolean; data: any; }

// 통합 결과 타입
type HandlerResults = ClickResult | SubmitResult
```

#### 5-4. 유틸리티 함수 체이닝

여러 유틸리티 타입을 조합한 패턴:

```ts
// 복잡한 함수 시그니처
const processData = <T>(data: T[]) => {
  return {
    items: data,
    count: data.length,
    isEmpty: data.length === 0,
    first: data[0] || null,
    last: data[data.length - 1] || null
  }
}

// 타입 추출 및 변환
type ProcessResult<T> = MyReturnType<typeof processData<T>>
// { items: T[]; count: number; isEmpty: boolean; first: T | null; last: T | null; }

// 특정 타입으로 특화
type StringProcessResult = ProcessResult<string>
type NumberProcessResult = ProcessResult<number>
```
