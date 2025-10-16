---
layout: page
title: "TypeScript 기본 타입 - JavaScript와 비교하며 이해하기"
description: "TypeScript의 기본 타입 시스템을 JavaScript와 비교하며 깊이 있게 이해합니다"
category: typescript
tags: [typescript, types, javascript, type-safety]
date: 2025-10-17
---

# TypeScript 기본 타입 - JavaScript와 비교하며 이해하기

JavaScript로 프로젝트를 개발하다 보면 이런 경험 없으셨나요?

```javascript
function calculateDiscount(price, discountRate) {
  return price * discountRate;
}

calculateDiscount(1000, "50%"); // 🤔 "1000500%"... 뭐지?
```

함수를 만들 때는 `discountRate`가 숫자일 거라고 생각했지만, 누군가 문자열을 넣어버렸습니다. 코드를 실행하기 전까지는 이 버그를 발견할 수 없었죠.

저도 처음 JavaScript로 큰 프로젝트를 진행할 때, **런타임에서야 발견되는 타입 오류** 때문에 밤을 새웠던 경험이 있습니다. 그때 TypeScript를 알게 되었고, "왜 진작 사용하지 않았을까?"라는 생각이 들었습니다.

**TypeScript는 JavaScript에 타입을 추가한 언어**입니다. 코드를 실행하기 전에 타입 오류를 잡아주고, 더 안전하고 유지보수하기 쉬운 코드를 작성할 수 있게 도와줍니다.

## TypeScript가 JavaScript와 다른 점

### JavaScript의 동적 타입

JavaScript는 **동적 타입 언어**입니다. 변수의 타입이 런타임에 결정됩니다.

```javascript
let value = 42;        // 숫자
value = "hello";       // 문자열로 변경 가능
value = true;          // 불린으로 변경 가능
value = { x: 10 };     // 객체로 변경 가능
```

**왜 이게 문제일까요?**

작은 프로젝트에서는 괜찮지만, 코드가 커질수록 변수가 어떤 타입인지 추적하기 어려워집니다. 특히 여러 사람이 함께 작업할 때 더욱 그렇습니다.

### TypeScript의 정적 타입

TypeScript는 **정적 타입 언어**입니다. 변수의 타입을 미리 선언하고, 컴파일 시점에 타입을 검사합니다.

```typescript
let value: number = 42;
value = "hello";  // ❌ 오류: string은 number에 할당할 수 없습니다
```

**왜 이게 좋을까요?**

코드를 실행하기 전에 오류를 발견할 수 있습니다. IDE에서 자동완성과 타입 힌트를 제공받을 수 있고, 리팩토링이 훨씬 안전해집니다.

### Before & After 비교

#### ❌ JavaScript (타입 오류를 런타임에 발견)

```javascript
function greet(person) {
  return `Hello, ${person.name}!`;
}

greet({ name: "Alice" });     // ✅ "Hello, Alice!"
greet({ username: "Bob" });   // ❌ "Hello, undefined!" (런타임에서야 발견)
greet(null);                  // ❌ TypeError: Cannot read property 'name' of null
```

#### ✅ TypeScript (타입 오류를 컴파일 시점에 발견)

```typescript
interface Person {
  name: string;
}

function greet(person: Person): string {
  return `Hello, ${person.name}!`;
}

greet({ name: "Alice" });     // ✅ "Hello, Alice!"
greet({ username: "Bob" });   // ❌ 컴파일 오류: 'name' 속성이 없습니다
greet(null);                  // ❌ 컴파일 오류: null은 Person 타입이 아닙니다
```

## TypeScript 기본 타입 톺아보기

TypeScript는 JavaScript의 모든 타입을 포함하면서, 추가적인 타입을 제공합니다.

### 1. Primitive Types (원시 타입)

#### `number` - 숫자

JavaScript의 `number`와 동일하지만, 타입 선언이 가능합니다.

```typescript
let decimal: number = 6;
let hex: number = 0xf00d;
let binary: number = 0b1010;
let octal: number = 0o744;
let big: number = 1_000_000; // 밑줄로 가독성 향상
```

**JavaScript와의 차이점:**

JavaScript에서는 모든 숫자가 자동으로 number 타입이지만, TypeScript에서는 명시적으로 타입을 선언할 수 있습니다.

```typescript
// TypeScript에서 타입 안전성 보장
function multiply(a: number, b: number): number {
  return a * b;
}

multiply(5, 10);      // ✅ 50
multiply("5", 10);    // ❌ 컴파일 오류
```

#### `string` - 문자열

```typescript
let firstName: string = "Alice";
let lastName: string = 'Smith';
let fullName: string = `${firstName} ${lastName}`; // 템플릿 리터럴
```

**특별한 점:**

TypeScript는 **템플릿 리터럴 타입**도 지원합니다 (고급 기능).

```typescript
type Greeting = `Hello, ${string}!`;

const greeting1: Greeting = "Hello, World!";    // ✅
const greeting2: Greeting = "Hi, World!";       // ❌ 'Hi'로 시작하면 안 됨
```

#### `boolean` - 불린

```typescript
let isActive: boolean = true;
let isComplete: boolean = false;
```

**실전 활용:**

```typescript
function isEven(num: number): boolean {
  return num % 2 === 0;
}

if (isEven(4)) {
  console.log("짝수입니다");
}
```

#### `null`과 `undefined`

JavaScript처럼 `null`과 `undefined`가 존재하지만, TypeScript에서는 이들도 타입입니다.

```typescript
let nothing: null = null;
let notDefined: undefined = undefined;
```

**JavaScript와의 중요한 차이:**

TypeScript의 `strictNullChecks` 옵션을 켜면, `null`과 `undefined`를 엄격하게 검사합니다.

```typescript
// strictNullChecks: true
let name: string = "Alice";
name = null;  // ❌ 오류: null은 string에 할당할 수 없습니다

// null을 허용하려면 명시적으로 선언
let nullableName: string | null = "Alice";
nullableName = null;  // ✅
```

**왜 이게 중요할까요?**

JavaScript에서 가장 흔한 오류 중 하나가 "Cannot read property of null"입니다. TypeScript는 이런 오류를 컴파일 시점에 잡아줍니다.

#### `symbol` - 심볼

ES2015에서 추가된 타입으로, 고유하고 불변인 값을 생성합니다.

```typescript
const sym1: symbol = Symbol("key");
const sym2: symbol = Symbol("key");

console.log(sym1 === sym2); // false (각 심볼은 고유함)
```

**실전 활용:**

```typescript
const PASSWORD_FIELD: unique symbol = Symbol("password");

interface User {
  username: string;
  [PASSWORD_FIELD]: string; // 외부에서 접근하기 어려운 속성
}
```

#### `bigint` - 큰 정수

ES2020에서 추가된 타입으로, `Number.MAX_SAFE_INTEGER`보다 큰 정수를 다룹니다.

```typescript
let big: bigint = 100n;
let huge: bigint = BigInt(9007199254740991);

console.log(big + 1n); // 101n
```

⚠️ **주의:** `number`와 `bigint`는 서로 연산할 수 없습니다.

```typescript
let num: number = 10;
let bigNum: bigint = 10n;

console.log(num + bigNum); // ❌ 오류: number와 bigint는 연산 불가
```

### 2. Array (배열)

TypeScript에서 배열은 두 가지 방법으로 선언할 수 있습니다.

```typescript
// 방법 1: 타입[] 형식
let numbers: number[] = [1, 2, 3, 4, 5];
let names: string[] = ["Alice", "Bob", "Charlie"];

// 방법 2: Array<타입> 형식 (제네릭)
let scores: Array<number> = [90, 85, 88];
let colors: Array<string> = ["red", "green", "blue"];
```

**JavaScript와의 차이점:**

JavaScript 배열은 어떤 타입이든 섞어서 넣을 수 있지만, TypeScript는 타입을 강제합니다.

```javascript
// JavaScript - 아무 타입이나 OK
const mixed = [1, "hello", true, { x: 10 }];
```

```typescript
// TypeScript - 한 가지 타입만
const numbers: number[] = [1, 2, 3];
numbers.push("4");  // ❌ 오류: string은 number[]에 추가할 수 없습니다
```

**여러 타입을 허용하고 싶다면?**

Union 타입을 사용합니다:

```typescript
let mixed: (number | string)[] = [1, "hello", 2, "world"];
mixed.push(3);        // ✅
mixed.push("test");   // ✅
mixed.push(true);     // ❌ 오류: boolean은 허용되지 않음
```

### 3. Tuple (튜플)

**JavaScript에는 없는 TypeScript만의 타입**입니다.

튜플은 **고정된 길이와 타입**을 가진 배열입니다.

```typescript
// [string, number] 형태의 튜플
let person: [string, number] = ["Alice", 30];

console.log(person[0]); // "Alice" (string)
console.log(person[1]); // 30 (number)
```

**왜 필요할까요?**

함수에서 여러 값을 반환할 때 유용합니다.

```typescript
function getUser(): [string, number, boolean] {
  return ["Alice", 30, true];
}

const [name, age, isActive] = getUser();
console.log(name);      // "Alice" (string)
console.log(age);       // 30 (number)
console.log(isActive);  // true (boolean)
```

**배열과의 차이:**

```typescript
// 배열: 같은 타입, 길이 제한 없음
let numbers: number[] = [1, 2, 3, 4, 5, 6];

// 튜플: 다른 타입, 고정된 길이
let tuple: [string, number] = ["Alice", 30];
tuple.push(100);  // ⚠️ 런타임에서는 가능하지만 타입 안전성이 떨어짐
```

⚠️ **함정:** 튜플도 배열 메서드(push, pop 등)를 사용할 수 있어서, 길이가 변경될 수 있습니다. 이는 TypeScript의 한계입니다.

### 4. Enum (열거형)

**JavaScript에는 없는 TypeScript만의 타입**입니다.

Enum은 **관련된 상수 값들을 하나로 묶어서 관리**할 수 있게 해줍니다.

```typescript
enum Direction {
  Up,      // 0
  Down,    // 1
  Left,    // 2
  Right    // 3
}

let dir: Direction = Direction.Up;
console.log(dir); // 0
```

**숫자를 직접 지정:**

```typescript
enum Status {
  Pending = 1,
  InProgress = 2,
  Completed = 3
}

console.log(Status.Pending);  // 1
```

**문자열 Enum:**

```typescript
enum Color {
  Red = "RED",
  Green = "GREEN",
  Blue = "BLUE"
}

let favoriteColor: Color = Color.Red;
console.log(favoriteColor); // "RED"
```

**왜 Enum을 사용할까요?**

매직 넘버나 매직 스트링을 제거하고, 코드의 의도를 명확하게 만들 수 있습니다.

#### ❌ 나쁜 예 (매직 넘버)

```typescript
function getStatusMessage(status: number): string {
  if (status === 0) return "대기 중";
  if (status === 1) return "진행 중";
  if (status === 2) return "완료";
  return "알 수 없음";
}

getStatusMessage(0); // 0이 뭘 의미하는지 알기 어려움
```

#### ✅ 좋은 예 (Enum 사용)

```typescript
enum Status {
  Pending,
  InProgress,
  Completed
}

function getStatusMessage(status: Status): string {
  switch (status) {
    case Status.Pending:
      return "대기 중";
    case Status.InProgress:
      return "진행 중";
    case Status.Completed:
      return "완료";
  }
}

getStatusMessage(Status.Pending); // 의도가 명확함
```

**const enum으로 최적화:**

```typescript
const enum Direction {
  Up,
  Down,
  Left,
  Right
}

let dir = Direction.Up; // 컴파일 후 -> let dir = 0;
```

`const enum`은 컴파일 시 인라인으로 치환되어 번들 크기를 줄입니다.

### 5. Any (모든 타입)

`any`는 **어떤 타입이든 허용**하는 타입입니다.

```typescript
let anything: any = 42;
anything = "hello";
anything = true;
anything = { x: 10 };
```

**JavaScript와 동일:**

`any`를 사용하면 사실상 JavaScript처럼 동작합니다. 타입 검사를 하지 않습니다.

```typescript
let value: any = "hello";
value.toUpperCase();  // ✅ 동작
value.nonExistentMethod();  // ❌ 런타임 오류 (컴파일 시점에는 발견 못함)
```

⚠️ **주의:** `any`는 TypeScript의 타입 안전성을 무력화시킵니다. **가급적 사용을 피해야** 합니다.

**언제 사용할까요?**

- JavaScript 라이브러리를 마이그레이션할 때 임시로
- 타입을 정의하기 어려운 외부 라이브러리를 사용할 때
- 정말로 모든 타입을 받아야 하는 경우 (매우 드물음)

```typescript
// 점진적 마이그레이션 예시
function legacyFunction(param: any) {
  // TODO: 나중에 구체적인 타입으로 변경
  return param;
}
```

### 6. Unknown (알 수 없는 타입)

`unknown`은 `any`보다 안전한 대안입니다. **타입을 확인하기 전까지는 어떤 연산도 할 수 없습니다.**

```typescript
let value: unknown = "hello";

// ❌ 타입 체크 없이 사용 불가
value.toUpperCase();  // 오류: 'unknown' 타입에는 'toUpperCase'가 없습니다

// ✅ 타입 체크 후 사용 가능
if (typeof value === "string") {
  value.toUpperCase();  // OK
}
```

**any와의 차이:**

```typescript
// any: 뭐든지 할 수 있음 (위험)
let anyValue: any = "hello";
anyValue.toUpperCase();           // ✅ 동작
anyValue.nonExistentMethod();     // ❌ 런타임 오류

// unknown: 타입 체크 강제 (안전)
let unknownValue: unknown = "hello";
unknownValue.toUpperCase();       // ❌ 컴파일 오류

if (typeof unknownValue === "string") {
  unknownValue.toUpperCase();     // ✅ 동작
}
```

**실전 활용:**

외부 API 응답처럼 타입을 알 수 없는 데이터를 다룰 때 유용합니다.

```typescript
function parseJSON(json: string): unknown {
  return JSON.parse(json);
}

const result = parseJSON('{"name": "Alice"}');

// ❌ 바로 사용 불가
console.log(result.name);  // 오류

// ✅ 타입 가드로 검증 후 사용
if (typeof result === "object" && result !== null && "name" in result) {
  console.log(result.name);
}
```

### 7. Void (반환값 없음)

`void`는 **함수가 값을 반환하지 않을 때** 사용합니다.

```typescript
function logMessage(message: string): void {
  console.log(message);
  // return이 없거나 return만 있음
}
```

**JavaScript와의 차이:**

JavaScript에서는 return이 없으면 암묵적으로 `undefined`를 반환하지만, TypeScript에서는 `void`로 명시합니다.

```typescript
// 반환값이 없는 함수
function sayHello(): void {
  console.log("Hello!");
}

const result = sayHello();
console.log(result); // undefined (런타임에서는 undefined)
```

⚠️ **주의:** `void`와 `undefined`는 다릅니다.

```typescript
// void: 반환값을 사용하지 않음
function log(): void {
  console.log("logging");
}

// undefined: 명시적으로 undefined를 반환
function getUndefined(): undefined {
  return undefined;
}
```

### 8. Never (절대 발생하지 않음)

`never`는 **절대로 반환되지 않는 함수**의 반환 타입입니다.

```typescript
// 항상 예외를 던지는 함수
function throwError(message: string): never {
  throw new Error(message);
}

// 무한 루프 함수
function infiniteLoop(): never {
  while (true) {
    // 무한 루프
  }
}
```

**왜 필요할까요?**

TypeScript의 타입 시스템에서 **도달할 수 없는 코드**를 표현하기 위해 사용합니다.

```typescript
function processValue(value: string | number) {
  if (typeof value === "string") {
    return value.toUpperCase();
  } else if (typeof value === "number") {
    return value.toFixed(2);
  } else {
    // 여기는 절대 도달할 수 없음
    const exhaustiveCheck: never = value;
    throw new Error(`Unhandled case: ${exhaustiveCheck}`);
  }
}
```

**실전 활용 - Exhaustive Check:**

모든 케이스를 처리했는지 확인할 때 유용합니다.

```typescript
type Shape = "circle" | "square" | "triangle";

function getArea(shape: Shape): number {
  switch (shape) {
    case "circle":
      return Math.PI * 10 * 10;
    case "square":
      return 10 * 10;
    case "triangle":
      return (10 * 10) / 2;
    default:
      const exhaustiveCheck: never = shape;
      throw new Error(`Unhandled shape: ${exhaustiveCheck}`);
  }
}
```

만약 나중에 `Shape`에 `"rectangle"`을 추가하면, TypeScript가 컴파일 오류를 발생시켜 `getArea` 함수를 수정하도록 강제합니다.

### 9. Object (객체)

TypeScript에서 객체 타입은 여러 방법으로 선언할 수 있습니다.

#### 방법 1: 인라인 타입

```typescript
let person: { name: string; age: number } = {
  name: "Alice",
  age: 30
};
```

#### 방법 2: Type Alias

```typescript
type Person = {
  name: string;
  age: number;
};

let person: Person = {
  name: "Alice",
  age: 30
};
```

#### 방법 3: Interface

```typescript
interface Person {
  name: string;
  age: number;
}

let person: Person = {
  name: "Alice",
  age: 30
};
```

**선택적 속성:**

```typescript
interface User {
  username: string;
  email?: string;  // 선택적 (있을 수도, 없을 수도)
}

const user1: User = { username: "alice" };           // ✅
const user2: User = { username: "bob", email: "bob@example.com" }; // ✅
```

**읽기 전용 속성:**

```typescript
interface Config {
  readonly apiUrl: string;
  timeout: number;
}

const config: Config = {
  apiUrl: "https://api.example.com",
  timeout: 5000
};

config.timeout = 3000;     // ✅
config.apiUrl = "https://new-api.com";  // ❌ 오류: readonly 속성은 수정 불가
```

**JavaScript와의 차이:**

JavaScript에서는 객체 구조를 강제할 수 없지만, TypeScript는 컴파일 시점에 검사합니다.

```typescript
interface Point {
  x: number;
  y: number;
}

const point: Point = { x: 10, y: 20 };      // ✅
const invalid: Point = { x: 10 };           // ❌ 오류: 'y' 속성이 없습니다
const extra: Point = { x: 10, y: 20, z: 30 };  // ❌ 오류: 'z'는 존재하지 않음
```

### 10. Function (함수)

TypeScript에서 함수 타입을 정의하는 방법입니다.

#### 함수 선언

```typescript
function add(a: number, b: number): number {
  return a + b;
}
```

#### 함수 표현식

```typescript
const multiply = function(a: number, b: number): number {
  return a * b;
};
```

#### 화살표 함수

```typescript
const divide = (a: number, b: number): number => {
  return a / b;
};
```

#### 함수 타입 정의

```typescript
type MathOperation = (a: number, b: number) => number;

const add: MathOperation = (a, b) => a + b;
const subtract: MathOperation = (a, b) => a - b;
```

**선택적 매개변수:**

```typescript
function greet(name: string, greeting?: string): string {
  return `${greeting || "Hello"}, ${name}!`;
}

greet("Alice");              // "Hello, Alice!"
greet("Bob", "Hi");          // "Hi, Bob!"
```

**기본 매개변수:**

```typescript
function createUser(name: string, role: string = "user"): void {
  console.log(`${name} - ${role}`);
}

createUser("Alice");              // "Alice - user"
createUser("Bob", "admin");       // "Bob - admin"
```

**나머지 매개변수:**

```typescript
function sum(...numbers: number[]): number {
  return numbers.reduce((total, num) => total + num, 0);
}

sum(1, 2, 3, 4, 5);  // 15
```

## 타입 추론 (Type Inference)

TypeScript는 타입을 명시하지 않아도 **자동으로 타입을 추론**합니다.

```typescript
let num = 42;          // number로 추론
let str = "hello";     // string으로 추론
let bool = true;       // boolean으로 추론

// 함수 반환 타입도 추론
function double(n: number) {  // 반환 타입: number (자동 추론)
  return n * 2;
}
```

**JavaScript와의 차이:**

JavaScript는 런타임에 타입이 결정되지만, TypeScript는 컴파일 시점에 타입을 추론하고 고정합니다.

```typescript
let value = 10;     // number로 추론
value = "hello";    // ❌ 오류: string은 number에 할당 불가
```

## 타입 단언 (Type Assertion)

개발자가 TypeScript보다 타입을 더 잘 알고 있을 때 사용합니다.

```typescript
// 방법 1: as 키워드
let someValue: unknown = "hello";
let strLength: number = (someValue as string).length;

// 방법 2: <타입> 형식 (JSX에서는 사용 불가)
let strLength2: number = (<string>someValue).length;
```

⚠️ **주의:** 타입 단언은 **컴파일러에게 "내가 더 잘 안다"고 말하는 것**입니다. 잘못 사용하면 런타임 오류가 발생할 수 있습니다.

```typescript
let value: unknown = 42;
let str = value as string;  // 컴파일러는 믿지만...
console.log(str.toUpperCase());  // ❌ 런타임 오류!
```

## Union Types (유니온 타입)

**여러 타입 중 하나**를 허용합니다.

```typescript
let id: number | string;

id = 101;        // ✅
id = "A101";     // ✅
id = true;       // ❌ 오류
```

**실전 활용:**

```typescript
function printId(id: number | string): void {
  if (typeof id === "string") {
    console.log(`ID (string): ${id.toUpperCase()}`);
  } else {
    console.log(`ID (number): ${id.toFixed(2)}`);
  }
}

printId(101);      // "ID (number): 101.00"
printId("A101");   // "ID (string): A101"
```

## Intersection Types (교차 타입)

**여러 타입을 모두 만족**하는 타입입니다.

```typescript
interface Person {
  name: string;
}

interface Employee {
  employeeId: number;
}

type Staff = Person & Employee;

const staff: Staff = {
  name: "Alice",
  employeeId: 12345
};
```

## Literal Types (리터럴 타입)

**특정 값만 허용**하는 타입입니다.

```typescript
let status: "pending" | "approved" | "rejected";

status = "pending";    // ✅
status = "approved";   // ✅
status = "done";       // ❌ 오류
```

**숫자 리터럴:**

```typescript
function rollDice(): 1 | 2 | 3 | 4 | 5 | 6 {
  return (Math.floor(Math.random() * 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6;
}
```

## 실전 활용 팁

### 1. 타입을 명시적으로 작성하자

타입 추론이 있지만, **명시적으로 타입을 작성하면 의도가 명확**해집니다.

```typescript
// ❌ 추론에만 의존
function processUser(user) {
  return user.name;
}

// ✅ 명시적 타입
function processUser(user: { name: string; age: number }): string {
  return user.name;
}
```

### 2. `any` 대신 `unknown` 사용

타입을 정말 모르겠다면 `any` 대신 `unknown`을 사용하세요.

```typescript
// ❌ any는 타입 안전성 무력화
function processData(data: any) {
  return data.value;  // 오류 가능성 높음
}

// ✅ unknown으로 안전하게
function processData(data: unknown) {
  if (typeof data === "object" && data !== null && "value" in data) {
    return (data as { value: any }).value;
  }
  throw new Error("Invalid data");
}
```

### 3. Union 대신 구체적인 타입 사용

가능하면 Union보다 구체적인 타입을 사용하세요.

```typescript
// ❌ 너무 넓은 타입
function process(input: string | number | boolean | object) {
  // ...
}

// ✅ 구체적인 타입
interface User {
  name: string;
  age: number;
}

function processUser(user: User) {
  // ...
}
```

## 함정과 주의사항

### ❌ 실수 1: any 남용

```typescript
// ❌ any를 남용하면 TypeScript를 쓰는 의미가 없음
let data: any = fetchData();
data.nonExistentMethod();  // 런타임 오류!
```

### ❌ 실수 2: 타입 단언 남용

```typescript
// ❌ 타입 단언을 남용하면 런타임 오류 발생
let value: unknown = 42;
(value as string).toUpperCase();  // 런타임 오류!
```

### ❌ 실수 3: 불필요한 타입 중복

```typescript
// ❌ 중복된 타입 정의
let name: string = "Alice";
name = "Bob" as string;  // 불필요한 타입 단언
```

## 마치며

TypeScript의 타입 시스템은 JavaScript에 **타입 안전성**을 더해줍니다.

처음에는 타입을 작성하는 게 번거롭게 느껴질 수 있지만, 프로젝트가 커질수록 타입의 가치를 실감하게 될 것입니다.

- **버그를 미리 발견**할 수 있고
- **리팩토링이 안전**해지며
- **코드 가독성**이 높아집니다

저도 처음에는 "왜 이렇게 타입을 다 써야 하지?"라고 생각했지만, 지금은 TypeScript 없이는 큰 프로젝트를 진행할 수 없을 정도로 의존하고 있습니다.

여러분도 천천히 TypeScript에 익숙해지면, 분명 그 가치를 느끼실 거예요! 🎯

---

## 참고 자료

- [TypeScript 공식 문서 - Basic Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [TypeScript Playground](https://www.typescriptlang.org/play) - 브라우저에서 TypeScript 실습

## 다음에 읽을 글

- [TypeScript 고급 타입](./advanced-types.md)
- [TypeScript 제네릭](./generics.md)
- [TypeScript 유틸리티 타입](./utility-types.md)
