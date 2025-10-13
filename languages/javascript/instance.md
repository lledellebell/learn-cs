---
title: 인스턴스 (Instance)
date: 2025-10-02
layout: page
---
# 인스턴스 (Instance)

## 개념

**인스턴스(instance)**는 클래스(class)로부터 생성된 실제 객체입니다.

### 비유

- **클래스** = 붕어빵 틀 (설계도, 템플릿)
- **인스턴스** = 실제 붕어빵 (만들어진 제품)

하나의 틀로 여러 개의 붕어빵을 만들 수 있듯이, 하나의 클래스로 여러 개의 인스턴스를 생성할 수 있습니다.

## 기본 예제

```javascript
class Car {
  constructor(color, brand) {
    this.color = color;
    this.brand = brand;
  }

  drive() {
    console.log(`${this.color} ${this.brand} is driving`);
  }
}

// 인스턴스 생성
const car1 = new Car('red', 'Tesla');
const car2 = new Car('blue', 'BMW');
const car3 = new Car('black', 'Audi');

car1.drive(); // "red Tesla is driving"
car2.drive(); // "blue BMW is driving"
```

위 예제에서:

- `Car`는 **클래스** (설계도)
- `car1`, `car2`, `car3`는 각각 **인스턴스** (실제 객체)
- 같은 클래스로 만들어졌지만 각각 독립적인 데이터를 가짐

## 인스턴스의 특징

### 1. 독립성

각 인스턴스는 독립적인 메모리 공간을 가집니다.

```javascript
const user1 = new User('Alice');
const user2 = new User('Bob');

user1.name = 'Charlie'; // user2에는 영향 없음
console.log(user2.name); // "Bob"
```

### 2. 동일한 메서드 공유

인스턴스들은 프로토타입을 통해 메서드를 공유합니다.

```javascript
class Calculator {
  add(a, b) {
    return a + b;
  }
}

const calc1 = new Calculator();
const calc2 = new Calculator();

// 같은 메서드를 참조 (메모리 효율적)
console.log(calc1.add === calc2.add); // true
```

### 3. `instanceof`로 확인 가능

```javascript
class Animal {}
class Dog extends Animal {}

const myDog = new Dog();

console.log(myDog instanceof Dog);    // true
console.log(myDog instanceof Animal); // true
console.log(myDog instanceof Object); // true
```

## 디자인 패턴별 인스턴스 관리

### 싱글톤 패턴 (Singleton Pattern)

**전체 애플리케이션에서 단 하나의 인스턴스만 존재**하도록 보장하는 패턴입니다.

```javascript
class Database {
  static instance = null;

  constructor() {
    // 이미 인스턴스가 있으면 기존 것을 반환
    if (Database.instance) {
      return Database.instance;
    }

    this.connection = this.connect();
    Database.instance = this;
  }

  connect() {
    return { status: 'connected' };
  }
}

const db1 = new Database();
const db2 = new Database();
const db3 = new Database();

console.log(db1 === db2); // true
console.log(db2 === db3); // true
// 모두 같은 인스턴스
```

**특징:**

- 전체 앱에서 인스턴스가 **딱 1개**만 존재
- 어디서 생성하든 **항상 같은 객체** 반환
- 전역 상태 관리, DB 연결 등에 사용

### Multiton 패턴 (Registry Pattern)

**키(key)별로 하나의 인스턴스만 존재**하도록 관리하는 패턴입니다.

```javascript
class InfiniteTextScroller {
  static instances = new Map();

  static create(options) {
    const containerId = options.containerId;

    // 이미 해당 ID로 생성된 인스턴스가 있으면 재사용
    if (InfiniteTextScroller.instances.has(containerId)) {
      console.log('기존 인스턴스 재사용');
      return InfiniteTextScroller.instances.get(containerId);
    }

    // 새 인스턴스 생성
    const instance = {
      id: containerId,
      config: options,
      destroy() {
        InfiniteTextScroller.instances.delete(containerId);
      }
    };

    // Map에 저장
    InfiniteTextScroller.instances.set(containerId, instance);
    return instance;
  }

  static getInstance(containerId) {
    return InfiniteTextScroller.instances.get(containerId);
  }
}

// 사용 예시
const scroller1a = InfiniteTextScroller.create({ containerId: 'box1' });
const scroller1b = InfiniteTextScroller.create({ containerId: 'box1' });
const scroller2 = InfiniteTextScroller.create({ containerId: 'box2' });

console.log(scroller1a === scroller1b); // true (같은 ID = 같은 인스턴스)
console.log(scroller1a === scroller2);  // false (다른 ID = 다른 인스턴스)
console.log(InfiniteTextScroller.instances.size); // 2
```

**특징:**

- **키마다 하나씩** 인스턴스 생성
- 같은 키로 생성 시 기존 인스턴스 재사용
- 다른 키로 생성 시 새 인스턴스 생성
- DOM 요소별 관리, 사용자별 세션 등에 사용

### 팩토리 패턴 (Factory Pattern)

객체 생성 로직을 캡슐화하는 패턴입니다. 매번 **새로운 인스턴스**를 생성합니다.

```javascript
class AnimalFactory {
  static createAnimal(type) {
    switch(type) {
      case 'dog':
        return new Dog();
      case 'cat':
        return new Cat();
      default:
        return new Animal();
    }
  }
}

const dog1 = AnimalFactory.createAnimal('dog');
const dog2 = AnimalFactory.createAnimal('dog');

console.log(dog1 === dog2); // false (항상 새로운 인스턴스)
```

**특징:**

- 호출할 때마다 **새로운 인스턴스** 생성
- 생성 로직을 한 곳에서 관리
- 조건에 따라 다른 타입의 객체 생성 가능

## 패턴 비교표

| 패턴 | 인스턴스 개수 | 재사용 여부 | 사용 예시 |
|------|--------------|------------|----------|
| **싱글톤** | 전체 앱에서 1개 | 항상 재사용 | Database, Logger, Config |
| **Multiton** | 키당 1개 | 같은 키면 재사용 | DOM 요소별 컨트롤러, 사용자별 세션 |
| **팩토리** | 호출마다 새로 생성 | 재사용 안함 | UI 컴포넌트, 데이터 모델 |

## Static Instances 패턴 (Multiton 구현)

`static instances = new Map()`은 Multiton 패턴을 구현하는 일반적인 방법입니다.

### 목적

1. **중복 방지**: 동일한 식별자로 여러 인스턴스가 생성되는 것을 방지
2. **인스턴스 재사용**: 이미 생성된 인스턴스가 있으면 재사용
3. **전역 관리**: 모든 인스턴스에 접근 가능
4. **메모리 최적화**: 불필요한 객체 생성 방지

### 실제 코드 예시 (infinite-text-scroller 기반)

```javascript
class InfiniteTextScroller {
  static instances = new Map();

  static create(options) {
    const containerId = options.containerId;

    // 중복 체크: 이미 존재하면 재사용
    if (InfiniteTextScroller.instances.has(containerId)) {
      return InfiniteTextScroller.instances.get(containerId);
    }

    // 새 인스턴스 생성
    const instance = {
      id: containerId,
      element: document.getElementById(containerId),
      config: options,

      destroy() {
        // 인스턴스 제거
        InfiniteTextScroller.instances.delete(containerId);
      }
    };

    // Map에 저장
    InfiniteTextScroller.instances.set(containerId, instance);
    return instance;
  }

  // 유틸리티 메서드들
  static getInstance(containerId) {
    return InfiniteTextScroller.instances.get(containerId);
  }

  static getAllInstances() {
    return Array.from(InfiniteTextScroller.instances.values());
  }

  static destroyAll() {
    InfiniteTextScroller.instances.forEach(instance => instance.destroy());
  }
}
```

### `Map`을 사용하는 이유

```javascript
// ❌ Object 방식 (제한적)
static instances = {};
instances[element] = this; // element가 문자열로 변환됨 (문제!)
// DOM 요소를 키로 사용하면 "[object HTMLDivElement]"로 변환됨

// ✅ Map 방식 (권장)
static instances = new Map();
instances.set(element, this); // 어떤 타입이든 키로 사용 가능
// DOM 요소 자체를 키로 사용 가능
```

**Map의 장점:**

- DOM 요소, 객체 등 **모든 타입을 키로 사용 가능**
- `has()`, `get()`, `set()`, `delete()` 메서드로 직관적 관리
- `size` 프로퍼티로 크기 확인 용이
- 순회가 간편 (`for...of`, `forEach`)
- Object보다 성능이 우수 (특히 빈번한 추가/삭제)

## 인스턴스 vs 클래스 멤버

```javascript
class Example {
  // 인스턴스 프로퍼티 (각 인스턴스마다 독립적)
  instanceProperty = 'instance';

  // static 프로퍼티 (모든 인스턴스가 공유, 클래스 레벨)
  static staticProperty = 'static';

  // 인스턴스 메서드
  instanceMethod() {
    console.log(this.instanceProperty);
  }

  // static 메서드
  static staticMethod() {
    console.log(this.staticProperty);
  }
}

const ex1 = new Example();
const ex2 = new Example();

// 인스턴스 프로퍼티는 독립적
ex1.instanceProperty = 'changed';
console.log(ex2.instanceProperty); // "instance" (변경 안됨)

// static 프로퍼티는 공유됨
Example.staticProperty = 'changed';
console.log(Example.staticProperty); // "changed"

// 접근 방식 차이
ex1.instanceMethod(); // 인스턴스로 호출
Example.staticMethod(); // 클래스로 호출
```

## 실전 활용: 언제 어떤 패턴을 쓸까?

### 싱글톤 사용

```javascript
// ✅ 전역 설정 관리
class AppConfig {
  static instance = null;
  constructor() {
    if (AppConfig.instance) return AppConfig.instance;
    this.settings = {};
    AppConfig.instance = this;
  }
}

// ✅ 로거
class Logger {
  static instance = null;
  constructor() {
    if (Logger.instance) return Logger.instance;
    Logger.instance = this;
  }
  log(msg) { console.log(msg); }
}
```

### Multiton 사용

```javascript
// ✅ DOM 요소별 컨트롤러
class TabController {
  static instances = new Map();
  constructor(element) {
    if (TabController.instances.has(element)) {
      return TabController.instances.get(element);
    }
    this.element = element;
    TabController.instances.set(element, this);
  }
}

// ✅ 사용자별 세션 관리
class UserSession {
  static sessions = new Map();
  static getSession(userId) {
    if (!this.sessions.has(userId)) {
      this.sessions.set(userId, new Session(userId));
    }
    return this.sessions.get(userId);
  }
}
```

### 팩토리 사용

```javascript
// ✅ UI 컴포넌트 생성
class ButtonFactory {
  static create(type) {
    switch(type) {
      case 'primary': return new PrimaryButton();
      case 'secondary': return new SecondaryButton();
      default: return new Button();
    }
  }
}

// ✅ 데이터 모델 생성
class UserFactory {
  static create(data) {
    return new User(data); // 매번 새로운 User 인스턴스
  }
}
```

## 핵심 정리

### 용어 정리

| 구분 | 설명 | 예시 |
|------|------|------|
| **클래스** | 객체의 설계도, 틀 | `class Car {}` |
| **인스턴스** | 클래스로 만든 실제 객체 | `new Car()` |
| **인스턴스 생성** | `new` 키워드 사용 | `const car = new Car()` |
| **static instances** | 모든 인스턴스를 추적하는 클래스 레벨 저장소 | `static instances = new Map()` |

### 핵심 개념

- 하나의 클래스로 여러 인스턴스 생성 가능
- 각 인스턴스는 독립적인 데이터 보유
- **싱글톤**: 전체 앱에서 1개
- **Multiton**: 키마다 1개 (Map으로 관리)
- **팩토리**: 호출마다 새로 생성
- Map을 사용하면 객체를 키로 사용 가능
