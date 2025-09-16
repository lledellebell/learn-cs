# 메타프로그래밍(Metaprogramming)

메타프로그래밍(Metaprogramming)은 **프로그램이 다른 프로그램을 조작하거나, 자기 자신을 조작하는 프로그래밍 기법**을 의미합니다.

## 개념

### 1. **일반적인 정의**
- **메타(Meta)**: "~에 대한", "~를 넘어선"이라는 의미
- **프로그램을 작성하는 프로그램**을 만드는 것
- 코드가 코드를 생성하거나 수정하는 기법

### 2. **TypeScript에서의 메타프로그래밍**

TypeScript의 타입 시스템은 **컴파일 타임**에 <u>타입을 조작하고 생성하는 메타프로그래밍</u>을 지원합니다.

```ts
// 타입이 타입을 생성하는 예시
type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : never

// 이 타입은 함수 타입을 받아서 새로운 타입(반환 타입)을 생성
type Result = MyReturnType<() => string> // string
```

## 다른 언어에서의 메타프로그래밍 예시

```js
// JavaScript - Proxy (객체 동작을 가로채고 조작)
const user = new Proxy({}, {
  get(target, prop) {
    console.log(`${prop} 속성에 접근했습니다.`)
    return target[prop]
  }
})
```

## TypeScript 타입 메타프로그래밍의 특징

```ts
// 타입을 변환하는 유틸리티 타입들
type Partial<T> = {
  [P in keyof T]?: T[P]
}

type Required<T> = {
  [P in keyof T]-?: T[P]
}

type Pick<T, K extends keyof T> = {
  [P in K]: T[P]
}

// 이런 타입들이 모두 메타프로그래밍의 결과물
```

## 활용 예시

```ts
// API 응답 타입에서 특정 필드만 추출
type User = {
  id: number
  name: string
  email: string
  password: string
}

type PublicUser = Pick<User, 'id' | 'name' | 'email'> // password 제외
type UserUpdate = Partial<Omit<User, 'id'>> // id 제외하고 모든 필드 optional
```

## 왜 "메타프로그래밍"이라고 부르나?

1. **추상화 레벨**: 일반 코드보다 한 단계 높은 추상화
2. **코드 생성**: 실행 시점이 아닌 컴파일 시점에 타입 코드를 생성
3. **자동화**: 반복적인 타입 정의를 자동화

TypeScript의 `MyReturnType`같은 유틸리티 타입은 함수 타입을 입력받아 새로운 타입을 **자동으로 생성**하기 때문에 메타프로그래밍이라고 할 수 있습니다.

## 요약

간단히 말하면, **메타프로그래밍은 코드가 코드를 다루는 프로그래밍 기법**입니다.

<u>TypeScript에서는 타입 시스템을 통해 이를 구현합니다.</u>

```ts
// 이 타입 정의 자체가 메타프로그래밍
type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : never

// 함수 타입을 받아서 → 새로운 타입(반환 타입)을 자동 생성
type Result = MyReturnType<() => string> // string 타입이 자동 생성됨
```

**특징:**
- **자동화**: 수동으로 타입을 하나씩 정의하지 않고 자동 생성
- **추상화**: 타입을 조작하는 타입을 만듦
- **재사용성**: 한 번 정의하면 다양한 상황에 적용 가능

`Partial<T>`, `Pick<T, K>`, `Omit<T, K>` 같은 유틸리티 타입들이 모두 메타프로그래밍의 결과물입니다.
