---
title: JavaScript 네이밍 컨벤션: Public vs Private
date: 2025-10-02
last_modified_at: 2025-10-13
categories: [Programming, JavaScript]
tags: [Naming Conventions, Private Fields, Encapsulation, Class, Code Style]
layout: page
---
{% raw %}
# JavaScript 네이밍 컨벤션: Public vs Private

## 개요

JavaScript/TypeScript에서 클래스의 메서드나 프로퍼티 이름을 짓는 방식은 **접근 권한**(public/private)에 따라 달라집니다.

## Public 메서드: 언더스코어 없이

**외부에서 호출할 수 있는 메서드는 언더스코어 없이 명확한 이름을 사용합니다.**

```javascript
class InfiniteTextScroller {
  // ✅ Public static 메서드 - 외부 API
  static create(options) {
    // 사용자가 직접 호출
    return this.#createInternal(options);
  }

  // ✅ Public 인스턴스 메서드
  start() {
    console.log('Starting...');
  }

  destroy() {
    console.log('Destroying...');
  }
}

// 사용 예시
const scroller = InfiniteTextScroller.create({ id: 'box1' });
scroller.start();
scroller.destroy();
```

**특징:**
- 외부 사용자가 호출하도록 의도된 메서드
- 명확하고 간결한 이름 사용
- 클래스의 **공개 API (Public API)**
- 라이브러리나 모듈의 인터페이스

## Private 메서드: `#` 또는 `_` 접두사

**내부에서만 사용하는 메서드는 private 표시를 추가합니다.**

### 1. `#` 방식 (Modern JavaScript - 권장)

```javascript
class DataProcessor {
  // ✅ 진짜 private - 외부에서 접근 불가
  static #validateData(data) {
    return Array.isArray(data);
  }

  #privateField = 'secret';

  static process(data) {
    if (!this.#validateData(data)) {
      throw new Error('Invalid data');
    }
    return data.map(item => item * 2);
  }
}

// 접근 테스트
DataProcessor.process([1, 2, 3]); // ✅ 정상 동작
DataProcessor.#validateData([1, 2, 3]); // ❌ SyntaxError: Private field
```

**특징:**
- **진짜 private** (언어 차원에서 강제)
- ES2022부터 지원
- 클래스 외부에서 절대 접근 불가
- 모던 JavaScript의 표준

### 2. `_` 방식 (Legacy JavaScript)

```javascript
class DataProcessor {
  // ⚠️ 관례상 private (실제로는 접근 가능)
  static _processInternal(data) {
    return data.map(item => item * 2);
  }

  _privateField = 'secret';

  static process(data) {
    return this._processInternal(data);
  }
}

// 접근 테스트
DataProcessor.process([1, 2, 3]); // ✅ 정상 동작
DataProcessor._processInternal([1, 2, 3]); // ⚠️ 동작하지만 사용하면 안됨
```

**특징:**
- **관례상** private을 나타냄
- 실제로는 외부에서 접근 가능 (강제되지 않음)
- 레거시 코드나 프레임워크에서 자주 보임
- "이 메서드는 내부용이니 사용하지 마세요"라는 신호

### 3. TypeScript `private` 키워드

```ts
class FileManager {
  // public (기본값)
  public upload(file: File) {
    return this.validateFile(file);
  }

  // protected - 자식 클래스에서만 접근 가능
  protected validateFile(file: File): boolean {
    return file.size < 1024 * 1024;
  }

  // private - 이 클래스 내부에서만 접근 가능
  private logUpload(fileName: string) {
    console.log(`Uploaded: ${fileName}`);
  }

  // private static
  private static instance: FileManager;
}
```

**특징:**
- 명시적인 접근 제어 (`public`, `protected`, `private`)
- IDE와 컴파일러가 잘못된 접근 방지
- 코드 가독성 향상
- **주의**: JavaScript로 컴파일되면 실제 private이 아님 (런타임 보호 없음)

## 실전 예시: Multiton 패턴

```javascript
class InfiniteTextScroller {
  // ✅ Public static 프로퍼티 (의도적으로 노출)
  static instances = new Map();

  // ✅ Private static 헬퍼 메서드 (구현 세부사항)
  static #validateOptions(options) {
    if (!options.containerId) {
      throw new Error('containerId is required');
    }
    return true;
  }

  // ✅ Private static 초기화 메서드
  static #initializeScroller(options) {
    return {
      id: options.containerId,
      element: document.getElementById(options.containerId),
      config: options
    };
  }

  // ✅ Public static 팩토리 메서드 (외부에서 호출)
  static create(options) {
    this.#validateOptions(options);

    const containerId = options.containerId;

    if (this.instances.has(containerId)) {
      return this.instances.get(containerId);
    }

    const instance = this.#initializeScroller(options);
    this.instances.set(containerId, instance);
    return instance;
  }

  // ✅ Public static 유틸리티 메서드
  static getInstance(containerId) {
    return this.instances.get(containerId);
  }

  // ✅ Public static 정리 메서드
  static destroyAll() {
    this.instances.clear();
  }
}

// 사용 예시
const scroller = InfiniteTextScroller.create({ containerId: 'box1' });
// InfiniteTextScroller.#validateOptions({ id: 'box1' }); // ❌ Error
```

## 네이밍 가이드라인

| 상황 | 방식 | 예시 |
|------|------|------|
| **외부 API** | 언더스코어 없음 | `create()`, `getInstance()`, `destroy()` |
| **내부 헬퍼 (Modern JS)** | `#` 접두사 | `#validateOptions()`, `#initializeScroller()` |
| **내부 헬퍼 (Legacy JS)** | `_` 접두사 | `_processData()`, `_handleEvent()` |
| **TypeScript** | `private` 키워드 | `private validateData()` |
| **의도적 노출 (유틸)** | 언더스코어 없음 | `static instances` (공개적으로 접근 가능) |

## 왜 `_create`를 사용하는 사람들이 있을까?

### 패턴 1: Public/Private 분리

```javascript
class ComponentFactory {
  // Public API - 검증, 로깅 담당
  static create(type, options) {
    console.log(`Creating ${type}...`);

    // 유효성 검사
    if (!options) {
      throw new Error('Options required');
    }

    return this._create(type, options);
  }

  // Private 구현 - 실제 생성 로직
  static _create(type, options) {
    switch(type) {
      case 'button': return new Button(options);
      case 'input': return new Input(options);
      default: throw new Error('Unknown type');
    }
  }
}
```

**이유:**
1. **관심사 분리**: public 메서드는 검증/로깅, private 메서드는 실제 로직
2. **테스트 편의성**: 내부 로직만 따로 테스트하고 싶을 때 (권장하지 않음)
3. **레거시 습관**: `#`이 나오기 전에는 `_`만 사용 가능했음

### 패턴 2: 현대적(?) 대안 (권장)

```javascript
class ComponentFactory {
  static create(type, options) {
    console.log(`Creating ${type}...`);

    if (!options) {
      throw new Error('Options required');
    }

    return this.#createComponent(type, options); // ✅ #으로 대체
  }

  static #createComponent(type, options) {
    switch(type) {
      case 'button': return new Button(options);
      case 'input': return new Input(options);
      default: throw new Error('Unknown type');
    }
  }
}
```

## 최종 권장사항

### Modern JavaScript (ES2022+)
```javascript
class MyClass {
  // ✅ Public - 언더스코어 없이
  static create(options) {
    return this.#initialize(options);
  }

  // ✅ Private - # 사용
  static #initialize(options) {
    return new MyClass(options);
  }

  static #helper() {
    // 내부 헬퍼 메서드
  }

  #privateField = 'secret';
}
```

### TypeScript
```ts
class MyClass {
  // ✅ Public (명시적 또는 생략)
  public static create(options: Options) {
    return this.initialize(options);
  }

  // ✅ Private
  private static initialize(options: Options) {
    return new MyClass(options);
  }

  private privateField = 'secret';
}
```

### Legacy JavaScript (ES5/ES6)
```javascript
class MyClass {
  // ✅ Public
  static create(options) {
    return this._initialize(options);
  }

  // ⚠️ Private (관례)
  static _initialize(options) {
    return new MyClass(options);
  }

  constructor() {
    this._privateField = 'secret';
  }
}
```

## 핵심 정리

### 기본 원칙

| 구분 | 네이밍 | 접근성 | 예시 |
|------|--------|--------|------|
| **Public** | 언더스코어 없음 | 외부에서 호출 가능 | `create()`, `getInstance()` |
| **Private (Modern)** | `#` 접두사 | 외부 접근 불가 | `#validateData()` |
| **Private (Legacy)** | `_` 접두사 | 외부 접근 가능 (관례상 금지) | `_processInternal()` |
| **Private (TS)** | `private` 키워드 | 컴파일 타임 체크 | `private helper()` |

### 선택 가이드

```javascript
// ✅ 외부 사용자가 호출하는 메서드
static create(options) { }
getInstance() { }
destroy() { }

// ✅ 내부 구현 세부사항 (Modern JS)
static #validateOptions(options) { }
#initializeState() { }

// ✅ 내부 구현 세부사항 (TypeScript)
private static validateOptions(options: Options) { }
private initializeState() { }

// ⚠️ 내부 구현 세부사항 (Legacy - 마이그레이션 권장)
static _validateOptions(options) { }
_initializeState() { }
```

### 실무 팁

1. **새 프로젝트**: `#` 사용 (Modern JavaScript)
2. **TypeScript**: `private` 키워드 사용
3. **레거시 유지보수**: 기존 `_` 패턴 유지, 점진적으로 `#`로 마이그레이션
4. **라이브러리 개발**: Public API는 명확하게, Private은 철저히 숨김
5. **팀 컨벤션**: 팀 내 일관성 유지가 가장 중요

### 절대 규칙

- ✅ **Public API는 깔끔한 이름 사용**
- ✅ **Private 메서드는 숨김 표시 필수**
- ✅ **한 프로젝트 내에서 일관성 유지**
- ❌ **Public 메서드에 `_` 또는 `#` 사용 금지**
- ❌ **Private과 Public을 혼용하지 말 것**

## 비교표: 각 방식의 장단점

| 방식 | 진짜 Private | 브라우저 지원 | 가독성 | 추천도 |
|------|-------------|-------------|--------|--------|
| `#` (Modern JS) | ✅ Yes | Modern browsers (2022+) | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| `private` (TS) | ❌ No (컴파일 후) | All (컴파일됨) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| `_` (Legacy) | ❌ No | All | ⭐⭐⭐ | ⭐⭐ |
| WeakMap | ✅ Yes | ES6+ | ⭐⭐ | ⭐⭐⭐ |
| Symbol | ⚠️ 유사 Private | ES6+ | ⭐⭐ | ⭐⭐ |

## Private 구현 방식

### 1. WeakMap을 이용한 Private 데이터 저장

`#`이 나오기 전 진짜 private을 구현하는 방법으로, 외부에서 절대 접근할 수 없습니다.

```javascript
const privateData = new WeakMap();
const privateCounter = new WeakMap();

class BankAccount {
  constructor(balance) {
    // WeakMap에 private 데이터 저장
    privateData.set(this, {
      balance: balance,
      accountNumber: Math.random().toString(36).substring(7)
    });
    privateCounter.set(this, 0);
  }

  deposit(amount) {
    const data = privateData.get(this);
    data.balance += amount;
    privateCounter.set(this, privateCounter.get(this) + 1);
    return data.balance;
  }

  getBalance() {
    return privateData.get(this).balance;
  }

  getTransactionCount() {
    return privateCounter.get(this);
  }
}

const account = new BankAccount(1000);
console.log(account.getBalance()); // 1000
account.deposit(500);
console.log(account.getBalance()); // 1500
console.log(account.getTransactionCount()); // 1

// ❌ 외부에서 접근 불가
console.log(account.balance); // undefined
console.log(Object.keys(account)); // []
```

**장점:**
- ✅ 진짜 private (외부 접근 불가)
- ✅ `#` 문법이 없던 시절의 표준 패턴
- ✅ 메모리 누수 방지 (인스턴스 삭제 시 자동 정리)

**단점:**
- ❌ 코드 복잡도 증가
- ❌ 가독성 저하
- ❌ 디버깅 어려움
- ❌ 성능 오버헤드 (Map 조회 비용)

**언제 사용?**
- `#` 문법을 사용할 수 없는 환경 (레거시 브라우저)
- 진짜 private이 필요하지만 Babel/TypeScript 없이 순수 ES6만 사용 가능한 경우

### 2. Symbol을 이용한 유사 Private

완전한 private은 아니지만, 일반적인 접근을 어렵게 만듭니다.

```javascript
const _balance = Symbol('balance');
const _accountNumber = Symbol('accountNumber');
const _validateAmount = Symbol('validateAmount');

class BankAccount {
  constructor(balance) {
    this[_balance] = balance;
    this[_accountNumber] = Math.random().toString(36).substring(7);
  }

  [_validateAmount](amount) {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }
    return true;
  }

  deposit(amount) {
    this[_validateAmount](amount);
    this[_balance] += amount;
    return this[_balance];
  }

  getBalance() {
    return this[_balance];
  }

  getAccountNumber() {
    return this[_accountNumber];
  }
}

const account = new BankAccount(1000);
console.log(account.getBalance()); // 1000

// ⚠️ 일반적인 방법으로는 접근 불가
console.log(account.balance); // undefined
console.log(Object.keys(account)); // []

// ❌ 하지만 Symbol을 얻으면 접근 가능
console.log(Object.getOwnPropertySymbols(account));
// [Symbol(balance), Symbol(accountNumber)]

const symbols = Object.getOwnPropertySymbols(account);
console.log(account[symbols[0]]); // 1000 (접근됨!)
```

**장점:**
- ✅ 일반적인 접근 방지 (`Object.keys()`, `for...in` 등에서 숨김)
- ✅ 프로퍼티 충돌 방지
- ✅ ES6부터 사용 가능

**단점:**
- ❌ 진짜 private 아님 (`Object.getOwnPropertySymbols()`로 접근 가능)
- ❌ JSON 직렬화 시 제외됨
- ❌ 가독성이 떨어짐

**언제 사용?**
- 프로퍼티 이름 충돌을 피하고 싶을 때
- 공개 API에서 숨기고 싶지만 완전한 private은 불필요할 때
- 메타데이터나 내부 설정 저장 시

### 3. Private Static 블록 (ES2022)

클래스 로딩 시 한 번만 실행되는 static 초기화 블록입니다.

```javascript
class DatabaseConnection {
  static #config;
  static #connections = new Map();
  static #maxConnections = 10;

  // static 초기화 블록 - 클래스 정의 시 한 번만 실행
  static {
    console.log('Initializing DatabaseConnection class...');

    // 설정 로드
    this.#config = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      timeout: 30000
    };

    // 초기 연결 풀 생성
    for (let i = 0; i < 3; i++) {
      this.#connections.set(i, {
        id: i,
        status: 'idle',
        createdAt: new Date()
      });
    }

    console.log(`Initialized with ${this.#connections.size} connections`);
  }

  static #validateConnectionLimit() {
    if (this.#connections.size >= this.#maxConnections) {
      throw new Error('Connection pool exhausted');
    }
  }

  static getConnection(id) {
    return this.#connections.get(id);
  }

  static createConnection() {
    this.#validateConnectionLimit();

    const newId = this.#connections.size;
    const connection = {
      id: newId,
      status: 'idle',
      createdAt: new Date()
    };

    this.#connections.set(newId, connection);
    return connection;
  }

  static getConfig() {
    return { ...this.#config }; // 복사본 반환
  }

  static getConnectionCount() {
    return this.#connections.size;
  }
}

// 클래스 정의 시 static 블록 자동 실행됨
// Console: "Initializing DatabaseConnection class..."
// Console: "Initialized with 3 connections"

console.log(DatabaseConnection.getConnectionCount()); // 3
console.log(DatabaseConnection.getConfig()); // { host: 'localhost', port: 5432, ... }

const conn = DatabaseConnection.createConnection();
console.log(conn); // { id: 3, status: 'idle', ... }
```

**장점:**
- ✅ 복잡한 static 초기화 로직 처리
- ✅ Private static 필드 초기화 가능
- ✅ 클래스 로딩 시 한 번만 실행 (효율적)
- ✅ try-catch로 초기화 에러 처리 가능

**단점:**
- ❌ ES2022부터 지원 (최신 기능)
- ❌ 일부 레거시 환경에서 미지원

**언제 사용?**
- 복잡한 static 설정 초기화
- 환경 변수 로드 및 검증
- Singleton 패턴의 초기 설정
- 연결 풀, 캐시 등 리소스 사전 초기화

```javascript
// 여러 static 블록 사용 가능
class Configuration {
  static #env;
  static #features;
  static #cache;

  static {
    // 환경 설정 로드
    this.#env = {
      mode: process.env.NODE_ENV || 'development',
      debug: process.env.DEBUG === 'true'
    };
    console.log('Environment loaded');
  }

  static {
    // 기능 플래그 초기화
    this.#features = {
      newUI: this.#env.mode === 'development',
      analytics: this.#env.mode === 'production'
    };
    console.log('Features configured');
  }

  static {
    // 캐시 초기화
    this.#cache = new Map();
    console.log('Cache initialized');
  }

  static getEnv() {
    return { ...this.#env };
  }

  static isFeatureEnabled(name) {
    return this.#features[name] || false;
  }
}

// 순서대로 실행됨:
// Console: "Environment loaded"
// Console: "Features configured"
// Console: "Cache initialized"
```

### 4. Getter/Setter와 Private 필드

Private 필드를 Getter/Setter로 안전하게 노출하는 패턴입니다.

```javascript
class Temperature {
  #celsius;

  constructor(celsius) {
    this.#celsius = celsius;
  }

  // Getter - 읽기 전용 접근
  get celsius() {
    return this.#celsius;
  }

  // Setter - 유효성 검증 포함
  set celsius(value) {
    if (typeof value !== 'number') {
      throw new TypeError('Temperature must be a number');
    }
    if (value < -273.15) {
      throw new RangeError('Temperature below absolute zero');
    }
    this.#celsius = value;
  }

  // Computed property with getter
  get fahrenheit() {
    return this.#celsius * 9/5 + 32;
  }

  set fahrenheit(value) {
    this.celsius = (value - 32) * 5/9; // celsius setter를 통해 검증
  }

  get kelvin() {
    return this.#celsius + 273.15;
  }

  set kelvin(value) {
    this.celsius = value - 273.15;
  }
}

const temp = new Temperature(25);
console.log(temp.celsius); // 25
console.log(temp.fahrenheit); // 77
console.log(temp.kelvin); // 298.15

temp.fahrenheit = 86;
console.log(temp.celsius); // 30

// ❌ 직접 접근 불가
console.log(temp.#celsius); // SyntaxError

// ✅ Setter 검증 동작
temp.celsius = -300; // RangeError: Temperature below absolute zero
```

**패턴: 읽기 전용 프로퍼티**

```javascript
class User {
  #id;
  #createdAt;
  #name;

  constructor(name) {
    this.#id = Math.random().toString(36).substring(7);
    this.#createdAt = new Date();
    this.#name = name;
  }

  // 읽기 전용 (getter만 제공)
  get id() {
    return this.#id;
  }

  get createdAt() {
    return new Date(this.#createdAt); // 복사본 반환 (불변성 보장)
  }

  // 읽기/쓰기 가능 (getter + setter)
  get name() {
    return this.#name;
  }

  set name(value) {
    if (!value || value.trim() === '') {
      throw new Error('Name cannot be empty');
    }
    this.#name = value.trim();
  }
}

const user = new User('Alice');
console.log(user.id); // "abc123"
console.log(user.name); // "Alice"

user.name = 'Bob'; // ✅ 가능
user.id = 'new-id'; // ⚠️ 무시됨 (setter 없음)
console.log(user.id); // 여전히 "abc123"
```

### 5. 상속 시 Private 필드 동작

Private 필드는 상속되지 않으며, 자식 클래스에서 접근할 수 없습니다.

```javascript
class Parent {
  #privateField = 'parent secret';
  _protectedField = 'parent protected';
  publicField = 'parent public';

  #privateMethod() {
    return 'private method';
  }

  getPrivate() {
    return this.#privateField;
  }

  callPrivateMethod() {
    return this.#privateMethod();
  }
}

class Child extends Parent {
  #privateField = 'child secret'; // ✅ 다른 필드로 취급됨

  testAccess() {
    console.log(this.publicField); // ✅ "parent public"
    console.log(this._protectedField); // ✅ "parent protected"

    // console.log(this.#privateField); // ⚠️ "child secret" (부모 것 아님!)
    console.log(super.getPrivate()); // ✅ "parent secret" (메서드 통해 접근)

    // this.#privateMethod(); // ❌ SyntaxError
    console.log(super.callPrivateMethod()); // ✅ "private method"
  }

  getChildPrivate() {
    return this.#privateField; // "child secret"
  }
}

const child = new Child();
child.testAccess();
console.log(child.getChildPrivate()); // "child secret"
console.log(child.getPrivate()); // "parent secret"
```

**TypeScript의 protected vs JavaScript의 private**

```ts
class Parent {
  private privateField = 'private'; // 자식 접근 불가
  protected protectedField = 'protected'; // 자식 접근 가능
  public publicField = 'public'; // 모두 접근 가능
}

class Child extends Parent {
  test() {
    // console.log(this.privateField); // ❌ 컴파일 에러
    console.log(this.protectedField); // ✅ 가능
    console.log(this.publicField); // ✅ 가능
  }
}
```

### 6. Private 필드와 성능 고려사항

**일반 프로퍼티 vs Private 필드**

```javascript
class RegularClass {
  publicField = 'public';

  getValue() {
    return this.publicField;
  }
}

class PrivateClass {
  #privateField = 'private';

  getValue() {
    return this.#privateField;
  }
}

// 성능 테스트
console.time('Regular');
for (let i = 0; i < 1000000; i++) {
  const obj = new RegularClass();
  obj.getValue();
}
console.timeEnd('Regular'); // ~50ms

console.time('Private');
for (let i = 0; i < 1000000; i++) {
  const obj = new PrivateClass();
  obj.getValue();
}
console.timeEnd('Private'); // ~52ms (거의 동일)
```

**성능 차이:**
- Modern JS 엔진 (V8, SpiderMonkey)은 private 필드를 최적화함
- 실제 성능 차이는 미미함 (대부분 경우 무시 가능)
- 보안성과 캡슐화가 훨씬 중요

**주의사항:**
```javascript
class Counter {
  #count = 0;

  // ✅ 좋음 - 단순 접근
  increment() {
    this.#count++;
  }

  // ⚠️ 피하기 - 불필요한 반복 접근
  badIncrement() {
    for (let i = 0; i < 1000; i++) {
      this.#count = this.#count + 1; // 반복적인 lookup
    }
  }

  // ✅ 더 나음 - 로컬 변수 활용
  goodIncrement() {
    let count = this.#count;
    for (let i = 0; i < 1000; i++) {
      count++;
    }
    this.#count = count;
  }
}
```

### 7. Private 필드 디버깅

**Chrome DevTools에서 private 필드 확인**

```javascript
class Debug {
  #secret = 'hidden';
  public = 'visible';

  #privateMethod() {
    return 'secret function';
  }

  reveal() {
    debugger; // 여기서 멈춤
    return this.#secret;
  }
}

const obj = new Debug();
obj.reveal();

// DevTools Console:
// > obj
// Debug {public: 'visible', #secret: 'hidden'}
//
// > obj.#secret // ❌ SyntaxError
// > obj.public  // ✅ "visible"
```

**Console에서 private 접근 (비추천)**

```javascript
class MyClass {
  #data = 'secret';

  getData() {
    return this.#data;
  }
}

const instance = new MyClass();

// 방법 1: 메서드 통해 접근
console.log(instance.getData()); // "secret"

// 방법 2: DevTools에서만 가능
// Chrome DevTools > Sources > Scope 섹션에서 확인 가능
```

### 8. Private 필드와 JSON 직렬화

Private 필드는 JSON.stringify()에서 자동으로 제외됩니다.

```javascript
class User {
  #password;
  #ssn;
  username;
  email;

  constructor(username, email, password, ssn) {
    this.username = username;
    this.email = email;
    this.#password = password;
    this.#ssn = ssn;
  }

  // 자동 JSON 직렬화
  toJSON() {
    return {
      username: this.username,
      email: this.email
      // private 필드는 의도적으로 제외
    };
  }

  // password 확인용 메서드
  verifyPassword(input) {
    return this.#password === input;
  }
}

const user = new User('alice', 'alice@example.com', 'secret123', '123-45-6789');

// ✅ Private 필드 자동 제외
console.log(JSON.stringify(user));
// {"username":"alice","email":"alice@example.com"}

// ❌ 직접 접근 불가
console.log(user.#password); // SyntaxError
console.log(user.#ssn); // SyntaxError

// ✅ 메서드로 검증만 가능
console.log(user.verifyPassword('secret123')); // true
```

**WeakMap과 JSON 직렬화**

```javascript
const privateData = new WeakMap();

class Product {
  constructor(name, price, cost) {
    this.name = name;
    this.price = price;
    // cost는 private (이윤 계산용, 외부 노출 금지)
    privateData.set(this, { cost });
  }

  getProfit() {
    const { cost } = privateData.get(this);
    return this.price - cost;
  }

  toJSON() {
    return {
      name: this.name,
      price: this.price
      // cost는 직렬화 안됨
    };
  }
}

const product = new Product('Laptop', 1000, 600);
console.log(JSON.stringify(product));
// {"name":"Laptop","price":1000}

console.log(product.getProfit()); // 400
```

### 9. 프레임워크별 Private 컨벤션

**React 컴포넌트**

```javascript
class Counter extends React.Component {
  // ✅ Public state
  state = { count: 0 };

  // ✅ Private 헬퍼 메서드
  #calculateNextValue(delta) {
    return Math.max(0, this.state.count + delta);
  }

  // ✅ Public 이벤트 핸들러 (외부에서 ref로 호출 가능)
  increment = () => {
    const nextValue = this.#calculateNextValue(1);
    this.setState({ count: nextValue });
  };

  // ✅ Public 라이프사이클
  componentDidMount() {
    console.log('Component mounted');
  }

  render() {
    return (
      <div>
        <p>Count: {this.state.count}</p>
        <button onClick={this.increment}>+1</button>
      </div>
    );
  }
}
```

**Vue 3 Composition API**

```javascript
import { ref, computed } from 'vue';

export default {
  setup() {
    // ✅ Private (setup 내부에서만 접근)
    const _internalState = ref(0);

    function _validateInput(value) {
      return value >= 0 && value <= 100;
    }

    // ✅ Public (template과 외부에 노출)
    const count = ref(0);
    const doubleCount = computed(() => count.value * 2);

    function increment() {
      if (_validateInput(count.value + 1)) {
        count.value++;
      }
    }

    // Public만 반환
    return {
      count,
      doubleCount,
      increment
    };
  }
};
```

**Angular 서비스**

```ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  // ✅ Private (Angular DI에서만 접근)
  private cache = new Map<string, any>();

  private validateKey(key: string): boolean {
    return key.length > 0;
  }

  // ✅ Public (컴포넌트에서 사용)
  public getData(key: string): any {
    if (!this.validateKey(key)) {
      throw new Error('Invalid key');
    }
    return this.cache.get(key);
  }

  public setData(key: string, value: any): void {
    if (!this.validateKey(key)) {
      throw new Error('Invalid key');
    }
    this.cache.set(key, value);
  }
}
```

### 10. JavaScript 엔진별 Private 필드 최적화

**V8 (Chrome, Node.js)**
```javascript
// V8은 private 필드를 "hidden class"로 최적화
class Optimized {
  #x;
  #y;

  constructor(x, y) {
    this.#x = x; // 인라인 캐싱 가능
    this.#y = y;
  }

  sum() {
    return this.#x + this.#y; // JIT 최적화됨
  }
}
```

**브라우저 지원 현황 (2024년 기준)**

| 엔진 | `#` Private | Static Block | 버전 |
|------|------------|--------------|------|
| V8 (Chrome) | ✅ | ✅ | 74+ / 94+ |
| SpiderMonkey (Firefox) | ✅ | ✅ | 90+ / 93+ |
| JavaScriptCore (Safari) | ✅ | ✅ | 14.1+ / 16.4+ |
| Node.js | ✅ | ✅ | 12+ / 16.11+ |

### 11. 패턴: Private + Proxy

```javascript
class SecureStore {
  #data = new Map();
  #accessLog = [];

  #logAccess(action, key) {
    this.#accessLog.push({
      action,
      key,
      timestamp: Date.now()
    });
  }

  set(key, value) {
    this.#logAccess('set', key);
    this.#data.set(key, value);
  }

  get(key) {
    this.#logAccess('get', key);
    return this.#data.get(key);
  }

  getAccessLog() {
    return [...this.#accessLog]; // 복사본 반환
  }
}

// Proxy로 래핑하여 추가 검증
function createSecureStore() {
  const store = new SecureStore();

  return new Proxy(store, {
    get(target, prop) {
      // 특정 메서드만 노출
      if (['set', 'get', 'getAccessLog'].includes(prop)) {
        return target[prop].bind(target);
      }
      return undefined;
    },
    set() {
      throw new Error('Cannot modify store directly');
    }
  });
}

const store = createSecureStore();
store.set('key1', 'value1');
console.log(store.get('key1')); // "value1"
console.log(store.getAccessLog());
// [{ action: 'set', key: 'key1', ... }, { action: 'get', key: 'key1', ... }]

// ❌ 직접 수정 불가
store.newProp = 'test'; // Error: Cannot modify store directly
```

## 참조

- [MDN: Private class features](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_class_fields)
- [TypeScript: Classes](https://www.typescriptlang.org/docs/handbook/2/classes.html)
- [JavaScript.info: Private and protected properties and methods](https://javascript.info/private-protected-properties-methods)

## 마이그레이션 예시

### Before (Legacy)
```javascript
class OldClass {
  static _helper() {
    return 'private';
  }

  static create() {
    return this._helper();
  }
}
```

### After (Modern)
```javascript
class NewClass {
  static #helper() {
    return 'private';
  }

  static create() {
    return this.#helper();
  }
}
```

### After (TypeScript)
```ts
class NewClass {
  private static helper(): string {
    return 'private';
  }

  public static create(): string {
    return this.helper();
  }
}
```
{% endraw %}