---
title: 메타프로그래밍(Metaprogramming)
date: 2025-10-02
layout: page
---
# TypeScript 메타프로그래밍: 코드가 코드를 작성하는 마법

여러분은 TypeScript로 코드를 작성하다가 이런 경험을 해본 적 있나요? "어, 이 타입 정의... 80줄이나 되는데 패턴이 반복되네?" 저도 처음에는 모든 타입을 손으로 하나씩 작성했습니다. API 응답 타입을 정의하고, 그걸 또 폼 데이터 타입으로 변환하고, 또 다시 업데이트용 타입으로 변환하고... 같은 패턴을 계속 반복하면서 "분명 더 나은 방법이 있을 텐데"라고 생각했죠.

그러던 중 메타프로그래밍을 접하게 되었습니다. 처음에는 마법처럼 느껴졌습니다. 한 줄의 타입 정의로 수십 개의 타입이 자동으로 생성되는 것을 보고 충격을 받았죠. 하지만 곧 깨달았습니다. 이건 마법이 아니라 **프로그래밍의 근본 원칙을 타입 시스템에 적용한 것**이라는 것을요.

이 문서에서는 TypeScript 메타프로그래밍의 세계로 여러분을 안내하겠습니다. 단순히 개념만 설명하는 것이 아니라, 실제로 마주할 문제들과 그 해결책을 함께 살펴보겠습니다.

## 왜 메타프로그래밍을 배워야 할까요?

### 실제 프로젝트에서 마주하는 문제들

상상해보세요. API에서 사용자 데이터를 받아오는 프로젝트를 진행하고 있습니다.

```ts
// API 응답 타입
interface User {
  id: number;
  email: string;
  name: string;
  phoneNumber: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
  password: string;
  isAdmin: boolean;
  lastLoginAt: Date;
}
```

이제 여러 상황에서 다른 타입들이 필요합니다:

```ts
// 1. 사용자 생성 시 (id, createdAt, updatedAt은 서버에서 생성)
interface UserCreateInput {
  email: string;
  name: string;
  phoneNumber: string;
  address: string;
  password: string;
  isAdmin: boolean;
}

// 2. 사용자 업데이트 시 (모든 필드가 선택적)
interface UserUpdateInput {
  email?: string;
  name?: string;
  phoneNumber?: string;
  address?: string;
  password?: string;
  isAdmin?: boolean;
}

// 3. 공개 프로필 (password 제외)
interface UserPublicProfile {
  id: number;
  email: string;
  name: string;
  phoneNumber: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
  isAdmin: boolean;
  lastLoginAt: Date;
}

// 4. 관리자용 뷰 (비밀번호 제외, 모두 읽기 전용)
interface UserAdminView {
  readonly id: number;
  readonly email: string;
  readonly name: string;
  readonly phoneNumber: string;
  readonly address: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly isAdmin: boolean;
  readonly lastLoginAt: Date;
}
```

이런 식으로 타입을 정의하면 몇 가지 심각한 문제가 발생합니다:

1. **중복 코드**: 같은 필드를 여러 번 작성합니다
2. **유지보수 지옥**: `User`에 새 필드가 추가되면 4개 타입을 모두 수정해야 합니다
3. **실수 발생**: 한 타입만 업데이트를 빠뜨려도 버그가 생깁니다
4. **타입 불일치**: 실제 API와 타입이 달라질 수 있습니다

### 메타프로그래밍으로 해결하기

메타프로그래밍을 사용하면 이렇게 바뀝니다:

```ts
// API 응답 타입 (변경 없음)
interface User {
  id: number;
  email: string;
  name: string;
  phoneNumber: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
  password: string;
  isAdmin: boolean;
  lastLoginAt: Date;
}

// 나머지는 자동으로 생성!
type UserCreateInput = Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'password' | 'lastLoginAt'> & {
  password: string;
};

type UserUpdateInput = Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>;

type UserPublicProfile = Omit<User, 'password'>;

type UserAdminView = Readonly<Omit<User, 'password'>>;
```

**변화를 보셨나요?**

- 코드가 1/3로 줄었습니다
- `User` 타입만 수정하면 나머지가 자동으로 업데이트됩니다
- 타입 불일치가 **구조적으로 불가능**해집니다
- 의도가 명확해집니다: "사용자 타입에서 비밀번호를 제외한 것"

이것이 메타프로그래밍의 힘입니다. **타입이 타입을 생성**하게 만들어, 반복을 제거하고 안전성을 높입니다.

## 기본 개념: 메타프로그래밍이란 무엇인가?

### 정의

메타프로그래밍(Metaprogramming)은 **프로그램이 다른 프로그램을 조작하거나, 자기 자신을 조작하는 프로그래밍 기법**입니다.

"메타(Meta)"는 그리스어로 "~에 대한", "~를 넘어선"이라는 의미입니다. 즉, 메타프로그래밍은 **프로그램에 대한 프로그램**, **코드에 대한 코드**를 작성하는 것입니다.

### 추상화의 레벨

일반 프로그래밍과 메타프로그래밍의 차이를 시각화하면:

```
┌─────────────────────────────────────────┐
│   메타프로그래밍 (Meta-level)            │
│   - 타입을 생성하는 타입                 │
│   - 코드를 생성하는 코드                 │
│   - 런타임에 동작을 변경하는 코드        │
└─────────────────────────────────────────┘
              ↓ 생성/변환
┌─────────────────────────────────────────┐
│   일반 프로그래밍 (Base-level)           │
│   - 구체적인 타입 정의                   │
│   - 비즈니스 로직                        │
│   - 데이터 처리                          │
└─────────────────────────────────────────┘
              ↓ 처리
┌─────────────────────────────────────────┐
│   데이터 (Data)                          │
│   - 실제 값들                            │
└─────────────────────────────────────────┘
```

### TypeScript의 두 가지 메타프로그래밍

TypeScript에서 메타프로그래밍은 두 가지 차원에서 일어납니다:

#### 1. 타입 레벨 메타프로그래밍 (Compile-time)

**컴파일 타임**에 타입을 조작하고 생성합니다:

```ts
// 타입이 타입을 생성
type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

// 함수 타입을 입력받아 새로운 타입(반환 타입)을 자동 생성
type Result = MyReturnType<() => string>; // string
type Result2 = MyReturnType<(x: number) => boolean>; // boolean
type Result3 = MyReturnType<typeof Math.random>; // number
```

#### 2. 런타임 메타프로그래밍 (Runtime)

**실행 시점**에 객체의 동작을 가로채고 조작합니다:

```ts
// Proxy를 사용한 런타임 메타프로그래밍
const user = new Proxy({} as Record<string, any>, {
  get(target, prop) {
    console.log(`${String(prop)} 속성에 접근했습니다.`);
    return target[prop];
  },
  set(target, prop, value) {
    console.log(`${String(prop)} 속성을 ${value}로 설정합니다.`);
    target[prop] = value;
    return true;
  }
});

user.name = "홍길동";  // 콘솔: "name 속성을 홍길동로 설정합니다."
console.log(user.name);  // 콘솔: "name 속성에 접근했습니다."
                         // 출력: "홍길동"
```

## 실전 예제: 타입 레벨 메타프로그래밍

### 예제 1: Mapped Types - 타입 변환하기

**문제**: 모든 필드를 선택적으로 만들고 싶습니다.

❌ **나쁜 방법: 수동으로 모든 필드에 `?` 추가**

```ts
interface User {
  id: number;
  name: string;
  email: string;
}

// 모든 필드를 하나씩 복사하고 ? 추가
interface PartialUser {
  id?: number;
  name?: string;
  email?: string;
}
```

**문제점:**
- 원본 타입이 바뀌면 수동으로 업데이트해야 함
- 필드가 많으면 작업량이 기하급수적으로 증가
- 실수하기 쉬움

✅ **좋은 방법: Mapped Type 사용**

```ts
interface User {
  id: number;
  name: string;
  email: string;
}

// 제네릭 타입으로 자동 변환
type Partial<T> = {
  [P in keyof T]?: T[P];
};

type PartialUser = Partial<User>;
// 결과: { id?: number; name?: string; email?: string; }
```

**동작 원리:**

```ts
// 1단계: keyof T - 모든 키를 추출
keyof User  // "id" | "name" | "email"

// 2단계: [P in keyof T] - 각 키를 순회
// P는 차례로 "id", "name", "email"이 됨

// 3단계: ?: T[P] - 각 키를 선택적으로 만들고 원래 타입 유지
{
  [P in "id" | "name" | "email"]?: T[P]
}

// 최종 결과:
{
  id?: number;
  name?: string;
  email?: string;
}
```

### 예제 2: Conditional Types - 타입 분기하기

**문제**: 함수의 반환 타입만 추출하고 싶습니다.

❌ **나쁜 방법: 각 함수별로 타입 지정**

```ts
function getUser() { return { name: "홍길동" }; }
function getPost() { return { title: "제목" }; }
function getComment() { return { text: "댓글" }; }

// 각각 따로 타입 정의
type UserResult = { name: string };
type PostResult = { title: string };
type CommentResult = { text: string };
```

✅ **좋은 방법: Conditional Type으로 자동 추출**

```ts
// 함수의 반환 타입을 자동으로 추출하는 유틸리티
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

function getUser() { return { name: "홍길동" }; }
function getPost() { return { title: "제목" }; }
function getComment() { return { text: "댓글" }; }

// 자동으로 반환 타입 추출
type UserResult = ReturnType<typeof getUser>;      // { name: string }
type PostResult = ReturnType<typeof getPost>;      // { title: string }
type CommentResult = ReturnType<typeof getComment>; // { text: string }
```

**동작 원리:**

```ts
// Conditional Type 문법: T extends U ? X : Y
// "T가 U에 할당 가능하면 X, 아니면 Y"

type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

// infer 키워드: 타입을 "추론"해서 변수에 저장
// R은 함수의 반환 타입을 저장하는 변수

// 예시:
type Test1 = ReturnType<() => string>;
// 1. () => string은 (...args: any[]) => infer R에 매칭됨
// 2. R이 string으로 추론됨
// 3. 조건이 참이므로 R(string) 반환

type Test2 = ReturnType<string>;
// 1. string은 함수가 아니므로 매칭 실패
// 2. 조건이 거짓이므로 never 반환
```

### 예제 3: Template Literal Types - 문자열 조합하기

**문제**: API 엔드포인트 타입을 자동 생성하고 싶습니다.

❌ **나쁜 방법: 모든 엔드포인트를 수동으로 나열**

```ts
type Endpoint =
  | "/api/users"
  | "/api/posts"
  | "/api/comments"
  | "/api/users/:id"
  | "/api/posts/:id"
  | "/api/comments/:id"
  | "/api/users/:id/posts"
  | "/api/users/:id/comments"
  | "/api/posts/:id/comments";
```

✅ **좋은 방법: Template Literal Type으로 자동 생성**

```ts
type Resource = "users" | "posts" | "comments";
type Action = "list" | "detail" | "create" | "update" | "delete";

// 기본 엔드포인트: /api/{resource}
type BaseEndpoint = `/api/${Resource}`;

// 상세 엔드포인트: /api/{resource}/:id
type DetailEndpoint = `/api/${Resource}/:id`;

// 중첩 엔드포인트: /api/{parent}/:id/{child}
type NestedEndpoint = `/api/${Resource}/:id/${Resource}`;

// 모든 엔드포인트
type Endpoint = BaseEndpoint | DetailEndpoint | NestedEndpoint;

// 타입 체크
const endpoint1: Endpoint = "/api/users";           // ✅ OK
const endpoint2: Endpoint = "/api/posts/:id";       // ✅ OK
const endpoint3: Endpoint = "/api/users/:id/posts"; // ✅ OK
const endpoint4: Endpoint = "/api/invalid";         // ❌ 타입 에러!
```

**실전 활용: HTTP 메서드와 결합**

```ts
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";
type Resource = "users" | "posts";

// HTTP 메서드와 엔드포인트를 결합
type ApiRoute = `${HttpMethod} /api/${Resource}` | `${HttpMethod} /api/${Resource}/:id`;

// 타입 안전한 API 클라이언트
function apiCall(route: ApiRoute, data?: any) {
  const [method, path] = route.split(' ');
  return fetch(path, { method, body: JSON.stringify(data) });
}

// 사용
apiCall("GET /api/users");           // ✅ OK
apiCall("POST /api/posts");          // ✅ OK
apiCall("DELETE /api/users/:id");    // ✅ OK
apiCall("GET /api/invalid");         // ❌ 타입 에러!
apiCall("PATCH /api/users");         // ❌ 타입 에러!
```

### 예제 4: 재귀 타입 - 깊은 타입 변환

**문제**: 중첩된 객체의 모든 필드를 읽기 전용으로 만들고 싶습니다.

❌ **나쁜 방법: 한 레벨만 readonly**

```ts
interface User {
  id: number;
  profile: {
    name: string;
    settings: {
      theme: string;
      notifications: boolean;
    };
  };
}

type ReadonlyUser = Readonly<User>;
// 결과:
// {
//   readonly id: number;
//   readonly profile: {  // profile은 readonly지만
//     name: string;      // 내부는 여전히 변경 가능!
//     settings: {
//       theme: string;
//       notifications: boolean;
//     };
//   };
// }

const user: ReadonlyUser = {
  id: 1,
  profile: {
    name: "홍길동",
    settings: { theme: "dark", notifications: true }
  }
};

user.id = 2;  // ❌ 에러: readonly
user.profile = { ... };  // ❌ 에러: readonly
user.profile.name = "김철수";  // ✅ OK - 문제! 변경 가능!
user.profile.settings.theme = "light";  // ✅ OK - 문제!
```

✅ **좋은 방법: 재귀 타입으로 깊은 readonly**

```ts
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object
    ? T[P] extends Function
      ? T[P]  // 함수는 그대로
      : DeepReadonly<T[P]>  // 객체는 재귀적으로 readonly
    : T[P];  // 기본 타입은 그대로
};

interface User {
  id: number;
  profile: {
    name: string;
    settings: {
      theme: string;
      notifications: boolean;
    };
  };
}

type ImmutableUser = DeepReadonly<User>;

const user: ImmutableUser = {
  id: 1,
  profile: {
    name: "홍길동",
    settings: { theme: "dark", notifications: true }
  }
};

user.id = 2;  // ❌ 에러
user.profile = { ... };  // ❌ 에러
user.profile.name = "김철수";  // ❌ 에러 - 해결!
user.profile.settings.theme = "light";  // ❌ 에러 - 해결!
```

### 예제 5: 유니온 타입에서 특정 타입 제거하기

**문제**: 유니온 타입에서 특정 타입만 제거하고 싶습니다.

```ts
type Primitive = string | number | boolean | null | undefined;

// null과 undefined를 제거한 타입을 원함
```

✅ **Exclude를 사용한 필터링**

```ts
type Primitive = string | number | boolean | null | undefined;

// null과 undefined 제거
type NonNullablePrimitive = Exclude<Primitive, null | undefined>;
// 결과: string | number | boolean

// 동작 원리
type Exclude<T, U> = T extends U ? never : T;

// 단계별 분해:
// 1. string extends null | undefined ? never : string  → string
// 2. number extends null | undefined ? never : number  → number
// 3. boolean extends null | undefined ? never : boolean → boolean
// 4. null extends null | undefined ? never : null  → never
// 5. undefined extends null | undefined ? never : undefined → never
// 최종: string | number | boolean | never | never = string | number | boolean
```

**실전 활용: 옵셔널 필드만 추출하기**

```ts
interface User {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address: string;
}

// 옵셔널 필드의 키만 추출
type OptionalKeys<T> = {
  [K in keyof T]: T extends Record<K, T[K]> ? never : K;
}[keyof T];

type UserOptionalKeys = OptionalKeys<User>;  // "email" | "phone"

// 옵셔널 필드만 추출
type OptionalFields<T> = Pick<T, OptionalKeys<T>>;

type UserOptionalFields = OptionalFields<User>;
// 결과: { email?: string; phone?: string; }
```

### 예제 6: 함수 오버로딩 타입 추출

**문제**: 오버로딩된 함수의 모든 시그니처를 타입으로 추출하고 싶습니다.

```ts
function process(value: string): string;
function process(value: number): number;
function process(value: boolean): string;
function process(value: string | number | boolean): string | number {
  if (typeof value === 'string') return value.toUpperCase();
  if (typeof value === 'number') return value * 2;
  return value.toString();
}

// 각 오버로드의 타입을 추출하고 싶음
```

✅ **파라미터와 반환 타입 추출**

```ts
// 함수의 파라미터 타입 추출
type Parameters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? P : never;

// 함수의 반환 타입 추출
type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : never;

// 사용 예시
type ProcessParams = Parameters<typeof process>;  // [string | number | boolean]
type ProcessReturn = ReturnType<typeof process>;  // string | number

// 특정 파라미터 타입에 대한 반환 타입 추출
type ProcessWithString = ReturnType<(value: string) => ReturnType<typeof process>>;  // string | number
```

## 좋은 예 vs 나쁜 예

### 상황 1: 폼 데이터와 API 데이터 동기화

#### ❌ 나쁜 예: 타입을 따로 정의

```ts
// API 응답 타입
interface UserResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  birthDate: string;  // ISO 문자열
  createdAt: string;
  updatedAt: string;
}

// 폼 데이터 타입 - 수동으로 다시 정의
interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  birthDate: Date;  // 폼에서는 Date 객체
}

// 문제점:
// 1. UserResponse에 필드가 추가되면 UserFormData도 수동으로 업데이트해야 함
// 2. 필드명 오타가 발생할 수 있음
// 3. 타입 불일치가 컴파일 타임에 잡히지 않음
```

#### ✅ 좋은 예: 타입 변환 자동화

```ts
// API 응답 타입
interface UserResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  birthDate: string;  // ISO 문자열
  createdAt: string;
  updatedAt: string;
}

// 제외할 필드 지정
type FormData<T, Exclude extends keyof T = never> = Omit<T, 'id' | 'createdAt' | 'updatedAt' | Exclude>;

// 날짜 문자열을 Date 객체로 변환하는 유틸리티
type StringToDate<T> = {
  [K in keyof T]: T[K] extends string
    ? K extends `${string}Date` | `${string}At`
      ? Date
      : T[K]
    : T[K];
};

// 자동으로 폼 데이터 타입 생성
type UserFormData = StringToDate<FormData<UserResponse>>;
// 결과:
// {
//   firstName: string;
//   lastName: string;
//   email: string;
//   phoneNumber: string;
//   birthDate: Date;  // 자동으로 Date로 변환!
// }

// 장점:
// 1. UserResponse만 수정하면 UserFormData도 자동 업데이트
// 2. 타입 불일치가 구조적으로 불가능
// 3. 의도가 명확함
```

### 상황 2: 이벤트 핸들러 타입 정의

#### ❌ 나쁜 예: 각 이벤트마다 타입 정의

```ts
interface ButtonClickHandler {
  (event: MouseEvent): void;
}

interface InputChangeHandler {
  (event: InputEvent): void;
}

interface FormSubmitHandler {
  (event: SubmitEvent): void;
}

interface KeyDownHandler {
  (event: KeyboardEvent): void;
}

// 문제점:
// 1. 패턴이 반복됨
// 2. 새로운 이벤트 타입마다 핸들러 타입을 정의해야 함
// 3. 파라미터 이름이나 추가 옵션을 통일하기 어려움
```

#### ✅ 좋은 예: 제네릭 이벤트 핸들러

```ts
// 제네릭 이벤트 핸들러 타입
type EventHandler<E extends Event = Event> = (event: E) => void;

// 비동기 버전
type AsyncEventHandler<E extends Event = Event> = (event: E) => Promise<void>;

// 반환값이 있는 버전
type EventHandlerWithReturn<E extends Event = Event, R = void> = (event: E) => R;

// 사용
const handleClick: EventHandler<MouseEvent> = (event) => {
  console.log(event.clientX, event.clientY);
};

const handleChange: EventHandler<InputEvent> = (event) => {
  const input = event.target as HTMLInputElement;
  console.log(input.value);
};

const handleSubmit: AsyncEventHandler<SubmitEvent> = async (event) => {
  event.preventDefault();
  await submitForm();
};

const handleKeyDown: EventHandlerWithReturn<KeyboardEvent, boolean> = (event) => {
  return event.key === 'Enter';
};
```

### 상황 3: API 클라이언트 메서드 타입

#### ❌ 나쁜 예: 각 메서드마다 타입 정의

```ts
class ApiClient {
  async getUser(id: number): Promise<User> {
    const response = await fetch(`/api/users/${id}`);
    return response.json();
  }

  async getPost(id: number): Promise<Post> {
    const response = await fetch(`/api/posts/${id}`);
    return response.json();
  }

  async getComment(id: number): Promise<Comment> {
    const response = await fetch(`/api/comments/${id}`);
    return response.json();
  }

  // 100개의 리소스가 있다면? 100개의 메서드를 작성?
}
```

#### ✅ 좋은 예: 타입 안전한 제네릭 메서드

```ts
// 리소스 타입 맵
interface ResourceMap {
  users: User;
  posts: Post;
  comments: Comment;
  products: Product;
  orders: Order;
  // ... 더 많은 리소스
}

class ApiClient {
  // 단일 제네릭 메서드로 모든 리소스 처리
  async get<K extends keyof ResourceMap>(
    resource: K,
    id: number
  ): Promise<ResourceMap[K]> {
    const response = await fetch(`/api/${resource}/${id}`);
    return response.json();
  }

  async list<K extends keyof ResourceMap>(
    resource: K,
    params?: Record<string, any>
  ): Promise<ResourceMap[K][]> {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`/api/${resource}?${query}`);
    return response.json();
  }

  async create<K extends keyof ResourceMap>(
    resource: K,
    data: Partial<ResourceMap[K]>
  ): Promise<ResourceMap[K]> {
    const response = await fetch(`/api/${resource}`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response.json();
  }
}

// 사용 - 타입이 자동으로 추론됨!
const api = new ApiClient();

const user = await api.get('users', 1);      // user: User
const posts = await api.list('posts');       // posts: Post[]
const comment = await api.create('comments', { // comment: Comment
  text: '댓글 내용',
  userId: 1
});

// ❌ 타입 에러!
await api.get('invalid', 1);  // 'invalid'는 ResourceMap에 없음
```

## 활용: 런타임 메타프로그래밍

### Proxy를 활용한 객체 동작 제어

**상황**: 객체의 속성 접근을 추적하고 로깅하고 싶습니다.

```ts
// 타입 안전한 Proxy 래퍼
function createTrackedObject<T extends object>(target: T, name: string): T {
  return new Proxy(target, {
    get(target, prop, receiver) {
      console.log(`[${name}] GET: ${String(prop)}`);
      const value = Reflect.get(target, prop, receiver);

      // 중첩 객체도 자동으로 추적
      if (value !== null && typeof value === 'object') {
        return createTrackedObject(value, `${name}.${String(prop)}`);
      }

      return value;
    },

    set(target, prop, value, receiver) {
      console.log(`[${name}] SET: ${String(prop)} = ${value}`);
      return Reflect.set(target, prop, value, receiver);
    }
  });
}

// 사용
interface User {
  name: string;
  profile: {
    age: number;
    email: string;
  };
}

const user = createTrackedObject<User>(
  {
    name: "홍길동",
    profile: { age: 30, email: "hong@example.com" }
  },
  "user"
);

console.log(user.name);
// 로그: [user] GET: name
// 출력: 홍길동

console.log(user.profile.age);
// 로그: [user] GET: profile
// 로그: [user.profile] GET: age
// 출력: 30

user.profile.email = "new@example.com";
// 로그: [user] GET: profile
// 로그: [user.profile] SET: email = new@example.com
```

### Decorator를 활용한 메서드 확장 (실험적 기능)

**상황**: 메서드 실행 시간을 자동으로 측정하고 싶습니다.

```ts
// 메서드 실행 시간 측정 데코레이터
function measureTime(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const start = performance.now();
    try {
      const result = await originalMethod.apply(this, args);
      const end = performance.now();
      console.log(`${propertyKey} 실행 시간: ${(end - start).toFixed(2)}ms`);
      return result;
    } catch (error) {
      const end = performance.now();
      console.log(`${propertyKey} 실패 (${(end - start).toFixed(2)}ms)`);
      throw error;
    }
  };

  return descriptor;
}

// 캐싱 데코레이터
function memoize(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;
  const cache = new Map<string, any>();

  descriptor.value = function (...args: any[]) {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      console.log(`${propertyKey} 캐시 히트!`);
      return cache.get(key);
    }

    const result = originalMethod.apply(this, args);
    cache.set(key, result);
    return result;
  };

  return descriptor;
}

// 사용
class DataService {
  @measureTime
  @memoize
  async fetchUser(id: number): Promise<User> {
    // 실제로는 API 호출
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { id, name: `User ${id}` };
  }

  @measureTime
  async processData(data: any[]): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`Processed ${data.length} items`);
  }
}

// 테스트
const service = new DataService();

await service.fetchUser(1);
// 로그: fetchUser 실행 시간: 1002.34ms

await service.fetchUser(1);
// 로그: fetchUser 캐시 히트!
// 로그: fetchUser 실행 시간: 0.12ms

await service.processData([1, 2, 3]);
// 로그: Processed 3 items
// 로그: processData 실행 시간: 502.45ms
```

### Symbol을 활용한 private 속성

**상황**: 진짜 private한 속성을 만들고 싶습니다 (외부에서 접근 불가).

```ts
// Symbol을 사용한 진짜 private 필드
const _privateData = Symbol('privateData');
const _internalId = Symbol('internalId');

class User {
  public name: string;
  [_privateData]: any;
  [_internalId]: string;

  constructor(name: string) {
    this.name = name;
    this[_privateData] = { sensitive: 'data' };
    this[_internalId] = Math.random().toString(36);
  }

  public getName(): string {
    // 내부에서는 Symbol로 접근 가능
    console.log('Internal ID:', this[_internalId]);
    return this.name;
  }
}

const user = new User('홍길동');

console.log(user.name);  // ✅ OK: '홍길동'
console.log(user.getName());  // ✅ OK: '홍길동'

// ❌ 외부에서는 접근 불가
console.log(user[_privateData]);  // undefined (Symbol이 다름)
console.log(user['_privateData']);  // undefined
console.log(Object.keys(user));  // ['name'] - Symbol은 나타나지 않음

// Symbol.for를 사용하면 전역 Symbol 생성 가능
const globalSymbol = Symbol.for('globalKey');

class SharedData {
  [globalSymbol]: string = 'shared';
}

const obj1 = new SharedData();
const obj2 = new SharedData();

// 같은 Symbol로 접근 가능
const key = Symbol.for('globalKey');
console.log(obj1[key]);  // 'shared'
console.log(obj2[key]);  // 'shared'
```

## 함정과 주의사항

### 1. 과도한 추상화의 위험

❌ **안티패턴: 읽을 수 없는 타입**

```ts
// 너무 복잡한 타입은 오히려 독이 됨
type DeepPartialReadonlyPickOmitRequired<
  T,
  K extends keyof T,
  O extends keyof T
> = Readonly<Partial<Required<Pick<Omit<T, O>, K>>>>;

// 이게 뭘 하는 타입인지 아무도 모름
// 타입 에러 메시지도 읽을 수 없음
```

✅ **좋은 패턴: 단계별 타입 조합**

```ts
// 명확한 이름으로 단계별로 조합
type WithoutId<T> = Omit<T, 'id'>;
type OptionalFields<T> = Partial<T>;
type ReadonlyFields<T> = Readonly<T>;

// 사용 시 의도가 명확
type UserUpdate = OptionalFields<WithoutId<User>>;
type ImmutableUser = ReadonlyFields<User>;
```

### 2. 타입 추론 실패

❌ **문제 상황: any로 추론됨**

```ts
function processData(data: any) {
  // data의 타입이 any이므로 메타프로그래밍 불가
  return data.map((item: any) => item.value);  // 타입 안정성 상실
}
```

✅ **해결: 제네릭으로 타입 보존**

```ts
function processData<T extends { value: any }>(data: T[]) {
  // T의 타입이 보존됨
  return data.map(item => item.value);
}

// 사용
const result = processData([{ value: 1, other: 'a' }]);
// result의 타입이 number[]로 정확히 추론됨
```

### 3. 순환 참조 문제

❌ **안티패턴: 무한 재귀**

```ts
// 이 타입은 무한 재귀에 빠짐
type InfiniteRecursion<T> = {
  value: T;
  next: InfiniteRecursion<T>;  // 종료 조건 없음
};

// TypeScript 컴파일러가 멈춤
```

✅ **해결: 종료 조건 추가**

```ts
// 옵셔널로 만들어 종료 가능
type LinkedList<T> = {
  value: T;
  next?: LinkedList<T>;  // 종료 조건
};

// 또는 최대 깊이 제한
type DeepPartial<T, Depth extends number = 5> = Depth extends 0
  ? T
  : {
      [P in keyof T]?: T[P] extends object
        ? DeepPartial<T[P], Prev[Depth]>
        : T[P];
    };

type Prev = [never, 0, 1, 2, 3, 4, 5, ...0[]];
```

### 4. 성능 문제

#### Proxy의 오버헤드

```ts
// ❌ 모든 속성 접근에 Proxy를 사용하면 느림
const data = new Proxy(largeObject, {
  get(target, prop) {
    // 매번 실행됨 - 성능 저하
    console.log(`Accessing ${String(prop)}`);
    validateAccess(prop);
    logToServer(prop);
    return target[prop];
  }
});

// 데이터가 크고 접근이 빈번하면 성능 문제 발생
for (let i = 0; i < 100000; i++) {
  data.someProperty;  // 매번 핸들러 실행
}
```

✅ **해결: 필요한 경우만 Proxy 사용**

```ts
// 개발 환경에서만 Proxy 활성화
const createObject = <T extends object>(target: T): T => {
  if (process.env.NODE_ENV === 'development') {
    return new Proxy(target, {
      get(target, prop) {
        console.log(`Accessing ${String(prop)}`);
        return target[prop];
      }
    });
  }
  return target;  // 프로덕션에서는 Proxy 없이 사용
};
```

### 5. 타입 에러 메시지가 복잡함

❌ **문제: 이해할 수 없는 에러**

```ts
type ComplexType<T> = T extends Array<infer U>
  ? U extends { id: number }
    ? { data: U; meta: { count: number } }
    : never
  : never;

// 에러 메시지:
// Type 'string' does not satisfy the constraint 'never'.
// Type 'string' is not assignable to type '{ id: number; }'.
// ... 10줄 더 계속
```

✅ **해결: 헬퍼 타입으로 분리**

```ts
// 단계별로 분리하여 에러 위치 파악 쉽게
type ExtractArrayItem<T> = T extends Array<infer U> ? U : never;
type RequireId<T> = T extends { id: number } ? T : never;
type WithMeta<T> = { data: T; meta: { count: number } };

type ComplexType<T> = WithMeta<RequireId<ExtractArrayItem<T>>>;

// 에러가 발생한 단계를 쉽게 파악 가능
```

## 실전 활용: 실제 프로젝트 사례

### 사례 1: Type-Safe Redux Actions

**문제**: Redux 액션을 타입 안전하게 만들고 싶습니다.

```ts
// 액션 정의
const actions = {
  user: {
    fetch: (id: number) => ({ type: 'USER_FETCH', payload: id }),
    update: (id: number, data: Partial<User>) => ({
      type: 'USER_UPDATE',
      payload: { id, data }
    }),
    delete: (id: number) => ({ type: 'USER_DELETE', payload: id }),
  },
  post: {
    fetch: (id: number) => ({ type: 'POST_FETCH', payload: id }),
    create: (data: Omit<Post, 'id'>) => ({
      type: 'POST_CREATE',
      payload: data
    }),
  }
};

// 모든 액션 타입 자동 추출
type ActionCreators = typeof actions;

type ExtractActions<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => infer R
    ? R
    : T[K] extends object
    ? ExtractActions<T[K]>
    : never;
}[keyof T];

type Action = ExtractActions<ActionCreators>;
// 결과: 모든 액션의 유니온 타입
// | { type: 'USER_FETCH'; payload: number }
// | { type: 'USER_UPDATE'; payload: { id: number; data: Partial<User> } }
// | { type: 'USER_DELETE'; payload: number }
// | { type: 'POST_FETCH'; payload: number }
// | { type: 'POST_CREATE'; payload: Omit<Post, 'id'> }

// 리듀서에서 타입 안전하게 사용
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'USER_FETCH':
      // action.payload는 자동으로 number로 추론
      return { ...state, loading: true };

    case 'USER_UPDATE':
      // action.payload는 자동으로 { id: number; data: Partial<User> }로 추론
      return {
        ...state,
        users: state.users.map(u =>
          u.id === action.payload.id
            ? { ...u, ...action.payload.data }
            : u
        )
      };

    default:
      return state;
  }
}
```

### 사례 2: Type-Safe Query Builder

**문제**: SQL 쿼리 빌더를 타입 안전하게 만들고 싶습니다.

```ts
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

class QueryBuilder<T> {
  private table: string;
  private selectedColumns: (keyof T)[] = [];
  private whereConditions: string[] = [];

  constructor(table: string) {
    this.table = table;
  }

  // SELECT 절 - 타입 안전
  select<K extends keyof T>(...columns: K[]): QueryBuilder<Pick<T, K>> {
    this.selectedColumns = columns as (keyof T)[];
    return this as any;
  }

  // WHERE 절 - 타입 안전
  where<K extends keyof T>(
    column: K,
    operator: '=' | '>' | '<' | '>=' | '<=',
    value: T[K]
  ): this {
    this.whereConditions.push(`${String(column)} ${operator} ${value}`);
    return this;
  }

  build(): string {
    const columns = this.selectedColumns.length > 0
      ? this.selectedColumns.join(', ')
      : '*';

    const where = this.whereConditions.length > 0
      ? `WHERE ${this.whereConditions.join(' AND ')}`
      : '';

    return `SELECT ${columns} FROM ${this.table} ${where}`.trim();
  }
}

// 사용 - 완전한 타입 안정성
const query = new QueryBuilder<User>('users')
  .select('id', 'name', 'email')  // ✅ OK
  .where('age', '>=', 18)         // ✅ OK: age는 number
  .build();

// ❌ 타입 에러들
const badQuery = new QueryBuilder<User>('users')
  .select('invalid')              // ❌ 에러: 'invalid'는 User의 키가 아님
  .where('age', '>=', 'string')   // ❌ 에러: age는 number인데 string 전달
  .where('name', '>', 100);       // ❌ 에러: name은 string인데 number 전달
```

### 사례 3: React Props 자동 생성

**문제**: 컴포넌트의 Props를 API 타입에서 자동 생성하고 싶습니다.

```ts
// API 응답 타입
interface ApiProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

// 컴포넌트 Props 자동 생성 유틸리티
type ComponentProps<T, ExcludeKeys extends keyof T = never> = {
  // 제외할 필드 제거
  [K in Exclude<keyof T, ExcludeKeys>]: T[K];
} & {
  // 이벤트 핸들러 자동 추가
  onClick?: () => void;
  onEdit?: (id: T extends { id: infer ID } ? ID : never) => void;
  onDelete?: (id: T extends { id: infer ID } ? ID : never) => void;
};

// Props 타입 자동 생성
type ProductCardProps = ComponentProps<
  ApiProduct,
  'createdAt' | 'updatedAt'  // 컴포넌트에서 사용하지 않는 필드 제외
>;

// 결과:
// {
//   id: number;
//   name: string;
//   description: string;
//   price: number;
//   stock: number;
//   imageUrl: string;
//   onClick?: () => void;
//   onEdit?: (id: number) => void;
//   onDelete?: (id: number) => void;
// }

// 컴포넌트에서 사용
function ProductCard(props: ProductCardProps) {
  return (
    <div onClick={props.onClick}>
      <img src={props.imageUrl} alt={props.name} />
      <h3>{props.name}</h3>
      <p>{props.description}</p>
      <span>${props.price}</span>
      <button onClick={() => props.onEdit?.(props.id)}>수정</button>
      <button onClick={() => props.onDelete?.(props.id)}>삭제</button>
    </div>
  );
}
```

### 사례 4: 타입 안전한 환경 변수

**문제**: 환경 변수를 타입 안전하게 사용하고 싶습니다.

```ts
// 환경 변수 스키마 정의
const envSchema = {
  API_URL: { type: 'string' as const, required: true },
  API_KEY: { type: 'string' as const, required: true },
  PORT: { type: 'number' as const, required: false, default: 3000 },
  DEBUG: { type: 'boolean' as const, required: false, default: false },
  MAX_UPLOAD_SIZE: { type: 'number' as const, required: false, default: 5_000_000 },
} as const;

// 스키마에서 타입 추출
type EnvSchema = typeof envSchema;

type ExtractEnvType<T> = T extends { type: infer Type; required: infer Required; default?: infer Default }
  ? Type extends 'string'
    ? Required extends true
      ? string
      : Default extends string
      ? string
      : string | undefined
    : Type extends 'number'
    ? Required extends true
      ? number
      : Default extends number
      ? number
      : number | undefined
    : Type extends 'boolean'
    ? Required extends true
      ? boolean
      : Default extends boolean
      ? boolean
      : boolean | undefined
    : never
  : never;

type Env = {
  [K in keyof EnvSchema]: ExtractEnvType<EnvSchema[K]>;
};

// 환경 변수 파싱 함수
function loadEnv(): Env {
  const env = {} as any;

  for (const [key, config] of Object.entries(envSchema)) {
    const value = process.env[key];

    if (config.required && !value) {
      throw new Error(`Required environment variable ${key} is missing`);
    }

    if (!value) {
      env[key] = config.default;
      continue;
    }

    // 타입 변환
    switch (config.type) {
      case 'string':
        env[key] = value;
        break;
      case 'number':
        env[key] = parseInt(value, 10);
        if (isNaN(env[key])) {
          throw new Error(`${key} must be a number`);
        }
        break;
      case 'boolean':
        env[key] = value === 'true';
        break;
    }
  }

  return env;
}

// 사용 - 완전한 타입 안정성
const env = loadEnv();

console.log(env.API_URL);  // ✅ string
console.log(env.PORT);     // ✅ number
console.log(env.DEBUG);    // ✅ boolean

// ❌ 타입 에러
console.log(env.INVALID);  // 에러: 'INVALID' 속성 없음
```

### 사례 5: 타입 안전한 이벤트 에미터

**문제**: 이벤트 이름과 데이터 타입을 연결하고 싶습니다.

```ts
// 이벤트 맵 정의
interface EventMap {
  'user:login': { userId: number; timestamp: Date };
  'user:logout': { userId: number };
  'post:create': { postId: number; authorId: number; title: string };
  'post:delete': { postId: number };
  'error': { message: string; code: number };
}

// 타입 안전한 이벤트 에미터
class TypedEventEmitter<Events extends Record<string, any>> {
  private listeners: {
    [K in keyof Events]?: Array<(data: Events[K]) => void>;
  } = {};

  // 이벤트 리스너 등록 - 타입 안전
  on<K extends keyof Events>(
    event: K,
    listener: (data: Events[K]) => void
  ): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(listener);
  }

  // 이벤트 발생 - 타입 안전
  emit<K extends keyof Events>(event: K, data: Events[K]): void {
    const eventListeners = this.listeners[event];
    if (eventListeners) {
      eventListeners.forEach(listener => listener(data));
    }
  }

  // 이벤트 리스너 제거
  off<K extends keyof Events>(
    event: K,
    listener: (data: Events[K]) => void
  ): void {
    const eventListeners = this.listeners[event];
    if (eventListeners) {
      this.listeners[event] = eventListeners.filter(l => l !== listener) as any;
    }
  }
}

// 사용
const emitter = new TypedEventEmitter<EventMap>();

// ✅ 타입 안전한 리스너 등록
emitter.on('user:login', (data) => {
  // data는 자동으로 { userId: number; timestamp: Date }로 추론
  console.log(`User ${data.userId} logged in at ${data.timestamp}`);
});

emitter.on('post:create', (data) => {
  // data는 자동으로 { postId: number; authorId: number; title: string }로 추론
  console.log(`Post ${data.postId} created: ${data.title}`);
});

// ✅ 타입 안전한 이벤트 발생
emitter.emit('user:login', {
  userId: 123,
  timestamp: new Date()
});

emitter.emit('post:create', {
  postId: 456,
  authorId: 123,
  title: '새 포스트'
});

// ❌ 타입 에러들
emitter.on('invalid', (data) => {});  // 에러: 'invalid' 이벤트 없음

emitter.emit('user:login', {
  userId: '123',  // 에러: userId는 number여야 함
  timestamp: new Date()
});

emitter.emit('post:create', {
  postId: 456,
  // 에러: authorId와 title이 누락됨
});
```

## 성능 고려사항

### 타입 체킹 시간

복잡한 타입은 컴파일 시간을 늘립니다:

```ts
// ❌ 매우 느린 타입
type SlowType<T> = T extends any
  ? T extends any
    ? T extends any
      ? T extends any
        ? T
        : never
      : never
    : never
  : never;

// 깊은 재귀는 컴파일러를 느리게 만듦
type DeepNested<T, D extends number = 100> = D extends 0
  ? T
  : { nested: DeepNested<T, Prev[D]> };
```

✅ **해결: 단순하고 명확한 타입 사용**

```ts
// 적절한 수준의 복잡도 유지
type SimpleType<T> = T extends object ? Partial<T> : T;

// 재귀 깊이 제한
type DeepNested<T, D extends number = 5> = D extends 0
  ? T
  : { nested: DeepNested<T, Prev[D]> };
```

### 런타임 오버헤드

Proxy와 Reflect는 성능 오버헤드가 있습니다:

```ts
// 성능 비교 테스트
const plainObject = { value: 0 };
const proxiedObject = new Proxy({ value: 0 }, {
  get(target, prop) {
    return target[prop];
  }
});

// 벤치마크
console.time('Plain object');
for (let i = 0; i < 1_000_000; i++) {
  plainObject.value;
}
console.timeEnd('Plain object');  // ~5ms

console.time('Proxied object');
for (let i = 0; i < 1_000_000; i++) {
  proxiedObject.value;
}
console.timeEnd('Proxied object');  // ~50ms (10배 느림)
```

**권장사항:**

1. **개발 환경에서만 사용**: Proxy를 디버깅용으로만 사용
2. **핫 패스 피하기**: 성능이 중요한 루프에서는 Proxy 사용 자제
3. **캐싱 활용**: 자주 접근하는 속성은 캐싱

## 언제 메타프로그래밍을 사용하고, 언제 피해야 할까?

### ✅ 사용해야 할 때

1. **반복적인 패턴이 많을 때**
   - API 응답과 폼 데이터 변환
   - CRUD 작업의 타입 정의
   - 유사한 컴포넌트 Props

2. **타입 안정성이 중요할 때**
   - 런타임 에러를 컴파일 타임에 잡고 싶을 때
   - 리팩토링 안정성을 높이고 싶을 때

3. **유지보수성을 높이고 싶을 때**
   - 한 곳만 수정하면 여러 곳이 자동으로 업데이트되어야 할 때
   - 코드 중복을 제거하고 싶을 때

### ❌ 피해야 할 때

1. **간단한 경우**
   - 타입이 3개 이하일 때는 직접 작성하는 게 더 명확
   - 재사용되지 않는 일회성 타입

2. **팀원들이 이해하기 어려울 때**
   - 복잡한 타입은 onboarding을 어렵게 만듦
   - 문서화와 예제가 충분하지 않을 때

3. **성능이 중요할 때**
   - 게임이나 실시간 애플리케이션
   - 모바일 환경에서 번들 크기가 중요할 때

## 디버깅 전략

### 타입 에러 추적하기

```ts
// 중간 타입을 명시적으로 추출하여 확인
type Step1<T> = Omit<T, 'id'>;
type Step2<T> = Partial<Step1<T>>;
type Step3<T> = Required<Step2<T>>;

// 어느 단계에서 에러가 나는지 쉽게 파악 가능
type Result = Step3<User>;
```

### 타입 검사 헬퍼

```ts
// 타입이 예상대로 추론되는지 확인
type Expect<T extends true> = T;
type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
  ? true
  : false;

// 테스트
type Test1 = Expect<Equal<Partial<User>, { id?: number; name?: string }>>;  // ✅
type Test2 = Expect<Equal<string, number>>;  // ❌ 타입 에러!
```

## 참고 자료

### TypeScript 공식 문서

- [Advanced Types](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html) - 타입 조작 및 변환
- [Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html) - 조건부 타입 심화
- [Mapped Types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html) - 매핑된 타입
- [Template Literal Types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html) - 템플릿 리터럴 타입
- [Decorators](https://www.typescriptlang.org/docs/handbook/decorators.html) - 데코레이터 (실험적 기능)
- [Symbols](https://www.typescriptlang.org/docs/handbook/symbols.html) - Symbol 사용법

### JavaScript 런타임 메타프로그래밍

- [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) - MDN Proxy 문서
- [Reflect](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect) - MDN Reflect 문서
- [Symbol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol) - MDN Symbol 문서

### 타입 챌린지

- [Type Challenges](https://github.com/type-challenges/type-challenges) - TypeScript 타입 문제집
- [TypeScript 연습 문제](https://typescript-exercises.github.io/) - 실전 연습

### 고급 자료

- [Type-Level Programming in TypeScript](https://www.learningtypescript.com/) - 타입 레벨 프로그래밍 가이드
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/) - 타입스크립트 심화 가이드
- [Effective TypeScript](https://effectivetypescript.com/) - 효과적인 타입스크립트 사용법

### 도구

- [TS Playground](https://www.typescriptlang.org/play) - 타입 실험 및 테스트
- [Type Coverage](https://github.com/plantain-00/type-coverage) - 타입 커버리지 측정
- [ts-toolbelt](https://github.com/millsp/ts-toolbelt) - 고급 유틸리티 타입 라이브러리
