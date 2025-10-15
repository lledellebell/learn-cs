---
title: Prototype - JavaScript의 숨은 마법을 이해하기
date: 2025-10-13
categories: [Programming, JavaScript]
tags: [Prototype, OOP, Inheritance, this, Context, Scope]
layout: page
---
# Prototype - JavaScript의 숨은 마법을 이해하기

JavaScript를 배우면서 이런 코드를 본 적이 있나요?

```javascript
const arr = [1, 2, 3];
arr.map(x => x * 2);  // [2, 4, 6]
```

"어? 내가 `map` 메소드를 만든 적도 없는데, 어떻게 `arr`에서 사용할 수 있지?" 이런 의문을 가져본 적이 있다면, 바로 **Prototype**을 마주한 것입니다.

저도 처음 JavaScript를 배울 때는 이게 그냥 "배열이 원래 가지고 있는 기능"이라고만 생각했습니다. 하지만 프로젝트가 커지고, 성능 최적화를 고민하게 되면서 깨달았습니다. Prototype은 단순히 "메소드를 공유하는 방법"이 아니라, **JavaScript가 객체 지향 프로그래밍을 구현하는 핵심 메커니즘**이라는 것을 말이죠.

이 문서에서는 Prototype이 무엇인지, 왜 중요한지, 그리고 실제로 어떻게 활용해야 하는지를 실무 경험을 바탕으로 자세히 설명하겠습니다.

## 목차

- [왜 Prototype을 이해해야 할까요?](#왜-prototype을-이해해야-할까요)
- [먼저, 문제 상황을 보면서 시작해볼까요?](#먼저-문제-상황을-보면서-시작해볼까요)
- [Prototype이란 무엇인가?](#prototype이란-무엇인가)
- [Prototype은 어떻게 작동할까요?](#prototype은-어떻게-작동할까요)
- [Prototype Chain - 마법 같은 조회 과정](#prototype-chain---마법-같은-조회-과정)
- [실전에서 Prototype 활용하기](#실전에서-prototype-활용하기)
- [Class vs Prototype - 무엇을 써야 할까?](#class-vs-prototype---무엇을-써야-할까)
- [Prototype의 함정과 주의사항](#prototype의-함정과-주의사항)
- [성능 최적화 관점에서 본 Prototype](#성능-최적화-관점에서-본-prototype)
- [결론: Prototype을 언제 어떻게 사용할까?](#결론-prototype을-언제-어떻게-사용할까)
- [참고 자료](#참고-자료)

## 왜 Prototype을 이해해야 할까요?

### 1. JavaScript의 모든 것이 Prototype 기반입니다

"저는 `class`만 사용하니까 Prototype은 몰라도 되지 않나요?" 라고 생각할 수 있습니다. 하지만 놀랍게도 JavaScript의 `class`는 **Prototype의 문법적 설탕(Syntactic Sugar)**일 뿐입니다.

```javascript
// ES6 Class를 사용하면
class Dog {
  constructor(name) {
    this.name = name;
  }

  bark() {
    console.log(`${this.name}: 멍멍!`);
  }
}

// 내부적으로는 이렇게 동작합니다
function Dog(name) {
  this.name = name;
}

Dog.prototype.bark = function() {
  console.log(`${this.name}: 멍멍!`);
};
```

즉, `class`를 쓰더라도 **내부적으로는 Prototype**을 사용하고 있습니다. Prototype을 이해하지 못하면 `class`의 동작도 완전히 이해할 수 없습니다.

### 2. 디버깅할 때 필수입니다

실무에서 이런 에러를 본 적이 있나요?

```javascript
const obj = Object.create(null);
obj.toString(); // ❌ TypeError: obj.toString is not a function
```

"모든 객체가 `toString`을 가지고 있다고 들었는데?" 라고 생각했다면, 이것이 바로 Prototype을 이해해야 하는 이유입니다. `Object.create(null)`은 **Prototype이 없는 객체**를 만들기 때문에 `toString` 같은 기본 메소드가 없습니다.

### 3. 라이브러리와 프레임워크 코드를 이해하는 데 필수입니다

유명한 라이브러리들은 성능을 위해 Prototype을 직접 활용합니다:

```javascript
// jQuery의 실제 구조
jQuery.fn = jQuery.prototype = {
  jquery: version,
  constructor: jQuery,
  // ...
};

// 이렇게 메소드를 추가하면
jQuery.fn.myPlugin = function() {
  // 모든 jQuery 객체에서 사용 가능!
};
```

Prototype을 모르면 이런 코드를 읽고 이해하는 것이 불가능합니다.

## 먼저, 문제 상황을 보면서 시작해볼까요?

게임 캐릭터를 만드는 상황을 상상해보세요. 여러 캐릭터가 있고, 각 캐릭터는 `attack()` 메소드를 가지고 있어야 합니다.

### 접근 1: 매번 메소드를 복사하기

```javascript
function createWarrior(name, hp) {
  return {
    name: name,
    hp: hp,
    attack: function() {
      console.log(`${this.name}의 물리 공격!`);
    }
  };
}

const warrior1 = createWarrior('전사1', 100);
const warrior2 = createWarrior('전사2', 120);
const warrior3 = createWarrior('전사3', 110);

console.log(warrior1.attack === warrior2.attack); // false
```

**문제점:**
- 3개의 전사를 만들면 **3개의 독립적인 `attack` 함수가 메모리에 생성**됩니다
- 1000명의 전사를 만들면? 1000개의 똑같은 함수가 메모리를 낭비합니다
- 만약 `attack` 로직을 수정하고 싶다면? 이미 만들어진 전사들의 메소드는 수정할 수 없습니다

실제로 메모리를 측정해보면:

```javascript
// 10,000명의 전사 생성
const warriors = [];
for (let i = 0; i < 10000; i++) {
  warriors.push(createWarrior(`전사${i}`, 100));
}

// 각 전사마다 attack 함수가 복사되어 메모리 낭비 발생!
```

### 접근 2: 메소드를 외부에 두기

```javascript
function attack() {
  console.log(`${this.name}의 물리 공격!`);
}

function createWarrior(name, hp) {
  return {
    name: name,
    hp: hp,
    attack: attack  // 같은 함수를 참조
  };
}

const warrior1 = createWarrior('전사1', 100);
const warrior2 = createWarrior('전사2', 120);

console.log(warrior1.attack === warrior2.attack); // true
```

**개선점:**
- 이제 모든 전사가 **같은 함수를 공유**합니다
- 메모리 효율적입니다

**여전히 남은 문제:**
- 전역 스코프가 오염됩니다 (`attack` 함수가 전역에 노출)
- 메소드가 많아지면 관리가 어렵습니다 (`attack`, `defend`, `heal`, ...)
- 객체와 메소드의 연결이 명시적이지 않습니다

### 접근 3: Prototype 사용하기 ⭐

```javascript
function Warrior(name, hp) {
  this.name = name;
  this.hp = hp;
}

// Prototype에 메소드를 추가
Warrior.prototype.attack = function() {
  console.log(`${this.name}의 물리 공격!`);
};

const warrior1 = new Warrior('전사1', 100);
const warrior2 = new Warrior('전사2', 120);

console.log(warrior1.attack === warrior2.attack); // true
warrior1.attack(); // "전사1의 물리 공격!"
```

**해결된 점:**
- ✅ 메모리 효율적 (메소드 공유)
- ✅ 전역 스코프 오염 없음
- ✅ 명시적인 객체-메소드 연결
- ✅ 나중에 메소드 추가/수정 가능

```javascript
// 나중에 메소드 추가
Warrior.prototype.defend = function() {
  console.log(`${this.name}이 방어합니다!`);
};

// 이미 생성된 객체들도 즉시 사용 가능!
warrior1.defend(); // "전사1이 방어합니다!"
```

이것이 바로 Prototype의 힘입니다!

## Prototype이란 무엇인가?

### 기본 개념

JavaScript에서 **Prototype은 객체들이 메소드와 속성을 공유하기 위한 메커니즘**입니다.

모든 JavaScript 함수는 생성될 때 자동으로 `prototype` 속성을 가집니다:

```javascript
function Dog() {}

console.log(Dog.prototype); // { constructor: Dog }
console.log(typeof Dog.prototype); // "object"
```

이 `prototype` 객체는 특별한 역할을 합니다:

```javascript
Dog.prototype.bark = function() {
  console.log('멍멍!');
};

const dog1 = new Dog();
dog1.bark(); // "멍멍!"

// dog1 객체 자체에는 bark가 없습니다!
console.log(dog1.hasOwnProperty('bark')); // false

// 하지만 Prototype에 있습니다
console.log(Dog.prototype.hasOwnProperty('bark')); // true
```

### 핵심 3가지 개념

#### 1. `함수.prototype` - 청사진

함수의 `prototype` 속성은 **이 함수로 생성될 객체들이 공유할 메소드와 속성을 담는 곳**입니다.

```javascript
function Person(name) {
  this.name = name;
}

// Person.prototype은 "청사진"
Person.prototype.greet = function() {
  console.log(`안녕하세요, ${this.name}입니다.`);
};
```

#### 2. `객체.__proto__` - 연결 고리

생성된 객체는 `__proto__` 속성을 통해 **생성자 함수의 prototype을 참조**합니다.

```javascript
const person1 = new Person('홍길동');

console.log(person1.__proto__ === Person.prototype); // true
```

**시각화:**

```
person1 (객체)
  ├─ name: "홍길동"           (자신의 속성)
  └─ __proto__ ───┐
                  ↓
Person.prototype (청사진)
  ├─ greet: function() {...}
  └─ constructor: Person
```

#### 3. `new` 연산자 - 연결의 마법

`new` 연산자는 다음과 같이 동작합니다:

```javascript
function Person(name) {
  this.name = name;
}

Person.prototype.greet = function() {
  console.log(`안녕하세요, ${this.name}입니다.`);
};

// new Person('홍길동')은 내부적으로:
/*
1. 빈 객체를 생성: const obj = {};
2. __proto__ 연결: obj.__proto__ = Person.prototype;
3. 생성자 실행: Person.call(obj, '홍길동');
4. 객체 반환: return obj;
*/

const person1 = new Person('홍길동');
```

우리가 직접 구현하면:

```javascript
function myNew(constructor, ...args) {
  // 1. 빈 객체 생성 및 __proto__ 연결
  const obj = Object.create(constructor.prototype);

  // 2. 생성자 함수 실행
  const result = constructor.apply(obj, args);

  // 3. 생성자가 객체를 반환하면 그것을, 아니면 생성한 객체를 반환
  return (typeof result === 'object' && result !== null) ? result : obj;
}

// 사용
const person2 = myNew(Person, '김철수');
person2.greet(); // "안녕하세요, 김철수입니다."
```

## Prototype은 어떻게 작동할까요?

### 속성 조회 과정 (Property Lookup)

객체의 속성이나 메소드에 접근하면, JavaScript는 다음 순서로 찾습니다:

```javascript
function Animal(name) {
  this.name = name;
}

Animal.prototype.speak = function() {
  console.log(`${this.name}이 소리를 냅니다.`);
};

Animal.prototype.species = 'Unknown';

const cat = new Animal('야옹이');
cat.legs = 4;  // cat 자신의 속성

console.log(cat.legs);    // 4 (1단계: cat 자신에게서 찾음)
console.log(cat.name);    // "야옹이" (1단계: cat 자신에게서 찾음)
console.log(cat.species); // "Unknown" (2단계: Animal.prototype에서 찾음)
cat.speak();              // "야옹이이 소리를 냅니다." (2단계에서 찾음)
```

**단계별 탐색:**

```
1. cat.legs 조회
   → cat 객체 자신에게 있음 → 반환 ✅

2. cat.species 조회
   → cat 객체에 없음 ❌
   → cat.__proto__ (Animal.prototype)에서 찾음 → 반환 ✅

3. cat.toString 조회
   → cat 객체에 없음 ❌
   → cat.__proto__ (Animal.prototype)에 없음 ❌
   → Animal.prototype.__proto__ (Object.prototype)에서 찾음 → 반환 ✅

4. cat.nonExistent 조회
   → cat 객체에 없음 ❌
   → cat.__proto__에 없음 ❌
   → Object.prototype에 없음 ❌
   → Object.prototype.__proto__ (null) → undefined 반환
```

### 속성 가리기 (Property Shadowing)

자신의 속성과 Prototype의 속성이 같은 이름을 가지면, **자신의 속성이 우선**합니다:

```javascript
function Vehicle() {}
Vehicle.prototype.wheels = 4;

const car = new Vehicle();
console.log(car.wheels); // 4 (Prototype에서 가져옴)

// car 자신에게 wheels 속성 추가
car.wheels = 18;  // 트럭처럼 바퀴가 많은 차량

console.log(car.wheels); // 18 (자신의 속성이 우선)

// 하지만 Prototype은 변하지 않음
const bike = new Vehicle();
console.log(bike.wheels); // 4 (여전히 Prototype의 값)
```

**시각화:**

```
// car.wheels = 18 이전
car
  └─ __proto__ → Vehicle.prototype
                   └─ wheels: 4

car.wheels 조회 → Vehicle.prototype.wheels → 4

// car.wheels = 18 이후
car
  ├─ wheels: 18  ⬅ 자신의 속성 (이것이 우선!)
  └─ __proto__ → Vehicle.prototype
                   └─ wheels: 4

car.wheels 조회 → car.wheels → 18
```

### 메소드 오버라이딩

```javascript
function Person(name) {
  this.name = name;
}

Person.prototype.introduce = function() {
  return `저는 ${this.name}입니다.`;
};

const person = new Person('홍길동');
console.log(person.introduce()); // "저는 홍길동입니다."

// 특정 인스턴스만 다른 동작
person.introduce = function() {
  return `안녕하세요! ${this.name}이라고 합니다!`;
};

console.log(person.introduce()); // "안녕하세요! 홍길동이라고 합니다!"

// 다른 인스턴스는 영향 없음
const person2 = new Person('김철수');
console.log(person2.introduce()); // "저는 김철수입니다."
```

## Prototype Chain - 마법 같은 조회 과정

Prototype Chain은 **Prototype을 따라 올라가며 속성을 찾는 메커니즘**입니다.

### 시각적으로 이해하기

```javascript
function Animal(name) {
  this.name = name;
}

Animal.prototype.eat = function() {
  console.log(`${this.name}이 먹이를 먹습니다.`);
};

function Dog(name, breed) {
  Animal.call(this, name);  // 부모 생성자 호출
  this.breed = breed;
}

// 상속 설정: Dog.prototype이 Animal.prototype을 상속
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;

Dog.prototype.bark = function() {
  console.log(`${this.name}: 멍멍!`);
};

const myDog = new Dog('뽀삐', '푸들');
```

**Prototype Chain 구조:**

```
myDog
  ├─ name: "뽀삐"
  ├─ breed: "푸들"
  └─ __proto__: Dog.prototype
                  ├─ bark: function
                  ├─ constructor: Dog
                  └─ __proto__: Animal.prototype
                                  ├─ eat: function
                                  ├─ constructor: Animal
                                  └─ __proto__: Object.prototype
                                                  ├─ toString: function
                                                  ├─ hasOwnProperty: function
                                                  └─ __proto__: null
```

### Chain을 따라 올라가기

```javascript
myDog.bark();
// 1. myDog.bark 찾기 → 없음
// 2. myDog.__proto__ (Dog.prototype).bark 찾기 → 발견! ✅

myDog.eat();
// 1. myDog.eat 찾기 → 없음
// 2. Dog.prototype.eat 찾기 → 없음
// 3. Dog.prototype.__proto__ (Animal.prototype).eat 찾기 → 발견! ✅

myDog.toString();
// 1. myDog.toString 찾기 → 없음
// 2. Dog.prototype.toString 찾기 → 없음
// 3. Animal.prototype.toString 찾기 → 없음
// 4. Object.prototype.toString 찾기 → 발견! ✅

myDog.nonExistent();
// 1. myDog.nonExistent 찾기 → 없음
// 2. Dog.prototype.nonExistent 찾기 → 없음
// 3. Animal.prototype.nonExistent 찾기 → 없음
// 4. Object.prototype.nonExistent 찾기 → 없음
// 5. Object.prototype.__proto__ (null) → undefined
// ❌ TypeError: myDog.nonExistent is not a function
```

### Chain 검증하기

```javascript
console.log(myDog instanceof Dog);        // true
console.log(myDog instanceof Animal);     // true
console.log(myDog instanceof Object);     // true

// Prototype Chain 확인
console.log(Dog.prototype.isPrototypeOf(myDog));        // true
console.log(Animal.prototype.isPrototypeOf(myDog));     // true
console.log(Object.prototype.isPrototypeOf(myDog));     // true

// 직접 확인
console.log(myDog.__proto__ === Dog.prototype);                    // true
console.log(myDog.__proto__.__proto__ === Animal.prototype);       // true
console.log(myDog.__proto__.__proto__.__proto__ === Object.prototype); // true
console.log(myDog.__proto__.__proto__.__proto__.__proto__ === null);   // true
```

## 실전에서 Prototype 활용하기

### 예제 1: 커스텀 컬렉션 만들기

배열과 비슷하지만 중복을 허용하지 않는 컬렉션을 만들어봅시다.

```javascript
function UniqueArray() {
  this.items = [];
}

UniqueArray.prototype.add = function(item) {
  if (!this.items.includes(item)) {
    this.items.push(item);
    return true;
  }
  return false;
};

UniqueArray.prototype.remove = function(item) {
  const index = this.items.indexOf(item);
  if (index !== -1) {
    this.items.splice(index, 1);
    return true;
  }
  return false;
};

UniqueArray.prototype.has = function(item) {
  return this.items.includes(item);
};

UniqueArray.prototype.size = function() {
  return this.items.length;
};

UniqueArray.prototype.toArray = function() {
  return [...this.items];
};

// 사용
const tags = new UniqueArray();
tags.add('javascript');  // true
tags.add('react');       // true
tags.add('javascript');  // false (이미 존재)

console.log(tags.toArray()); // ['javascript', 'react']
console.log(tags.size());    // 2
```

**장점:**
- 모든 `UniqueArray` 인스턴스가 메소드를 공유합니다
- 메모리 효율적입니다
- 확장이 쉽습니다

```javascript
// 나중에 기능 추가
UniqueArray.prototype.clear = function() {
  this.items = [];
};

// 이미 생성된 인스턴스들도 즉시 사용 가능
tags.clear();
console.log(tags.size()); // 0
```

### 예제 2: 내장 객체 확장하기 (주의해서!)

```javascript
// ⚠️ 주의: 내장 객체 확장은 신중하게!

// Array에 유틸리티 메소드 추가
Array.prototype.last = function() {
  return this[this.length - 1];
};

Array.prototype.first = function() {
  return this[0];
};

const numbers = [1, 2, 3, 4, 5];
console.log(numbers.first()); // 1
console.log(numbers.last());  // 5

// String에 메소드 추가
String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

console.log('hello'.capitalize()); // "Hello"
```

**주의사항:**
- 내장 객체를 확장하면 다른 라이브러리와 충돌할 수 있습니다
- 팀 규칙이나 ESLint로 금지되어 있을 수 있습니다
- 대안: 유틸리티 함수로 만들기

```javascript
// ✅ 더 안전한 방법
const ArrayUtils = {
  last: (arr) => arr[arr.length - 1],
  first: (arr) => arr[0]
};

console.log(ArrayUtils.last([1, 2, 3])); // 3
```

### 예제 3: Private 데이터 패턴

Prototype과 클로저를 조합하여 private 데이터를 구현할 수 있습니다.

```javascript
function BankAccount(initialBalance) {
  // Private 변수 (클로저로 보호)
  let balance = initialBalance;

  // Public 메소드들은 Prototype에
  this.getBalance = function() {
    return balance;
  };

  this.deposit = function(amount) {
    if (amount > 0) {
      balance += amount;
      return true;
    }
    return false;
  };

  this.withdraw = function(amount) {
    if (amount > 0 && amount <= balance) {
      balance -= amount;
      return true;
    }
    return false;
  };
}

const account = new BankAccount(1000);
console.log(account.getBalance()); // 1000
account.deposit(500);
console.log(account.getBalance()); // 1500

// ❌ 직접 접근 불가능
console.log(account.balance); // undefined
```

**트레이드오프:**
- ✅ 진짜 private 데이터
- ❌ 메소드가 인스턴스마다 복사됨 (메모리 비효율적)

**ES2022+ 해결책:**

```javascript
class BankAccount {
  #balance;  // Private 필드

  constructor(initialBalance) {
    this.#balance = initialBalance;
  }

  getBalance() {
    return this.#balance;
  }

  deposit(amount) {
    if (amount > 0) {
      this.#balance += amount;
      return true;
    }
    return false;
  }
}

// 메소드는 자동으로 Prototype에 추가됨!
```

### 예제 4: 믹스인(Mixin) 패턴

여러 기능을 조합할 때 유용합니다.

```javascript
// 믹스인 정의
const canEat = {
  eat(food) {
    console.log(`${this.name}이 ${food}를 먹습니다.`);
  }
};

const canWalk = {
  walk() {
    console.log(`${this.name}이 걷습니다.`);
  }
};

const canSwim = {
  swim() {
    console.log(`${this.name}이 수영합니다.`);
  }
};

// 생성자
function Person(name) {
  this.name = name;
}

// 믹스인 적용
Object.assign(Person.prototype, canEat, canWalk);

function Duck(name) {
  this.name = name;
}

Object.assign(Duck.prototype, canEat, canWalk, canSwim);

// 사용
const person = new Person('홍길동');
person.eat('밥');   // "홍길동이 밥를 먹습니다."
person.walk();      // "홍길동이 걷습니다."
// person.swim();   // ❌ 에러

const duck = new Duck('도널드');
duck.eat('빵');     // "도널드이 빵를 먹습니다."
duck.walk();        // "도널드이 걷습니다."
duck.swim();        // "도널드이 수영합니다."
```

## Class vs Prototype - 무엇을 써야 할까?

현대 JavaScript에서는 `class` 문법을 주로 사용하지만, Prototype을 직접 사용해야 할 때도 있습니다.

### Class 문법 (ES6+)

```javascript
class Animal {
  constructor(name) {
    this.name = name;
  }

  speak() {
    console.log(`${this.name}이 소리를 냅니다.`);
  }
}

class Dog extends Animal {
  constructor(name, breed) {
    super(name);
    this.breed = breed;
  }

  bark() {
    console.log(`${this.name}: 멍멍!`);
  }
}
```

**장점:**
- ✅ 읽기 쉽고 직관적
- ✅ 다른 언어 개발자에게 친숙
- ✅ `extends`로 상속이 간단
- ✅ `super`로 부모 접근이 명확
- ✅ Private 필드 지원 (`#`)

### Prototype 직접 사용

```javascript
function Animal(name) {
  this.name = name;
}

Animal.prototype.speak = function() {
  console.log(`${this.name}이 소리를 냅니다.`);
};

function Dog(name, breed) {
  Animal.call(this, name);
  this.breed = breed;
}

Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;

Dog.prototype.bark = function() {
  console.log(`${this.name}: 멍멍!`);
};
```

**장점:**
- ✅ 더 명시적인 제어
- ✅ 동적으로 메소드 추가/제거 가능
- ✅ 라이브러리/프레임워크 코드에서 유용
- ✅ 레거시 코드베이스와 호환

### 언제 무엇을 사용할까?

#### Class를 사용하세요:
- 🎯 새로운 프로젝트
- 🎯 팀원들이 OOP에 익숙한 경우
- 🎯 복잡한 상속 구조
- 🎯 TypeScript 사용 시
- 🎯 일반적인 애플리케이션 로직

#### Prototype을 직접 사용하세요:
- 🎯 라이브러리/프레임워크 개발
- 🎯 성능이 매우 중요한 경우
- 🎯 동적으로 프로토타입을 조작해야 할 때
- 🎯 레거시 코드와 통합
- 🎯 Polyfill 작성 시

**실전 조언:**

```javascript
// ✅ 대부분의 경우: Class 사용
class UserService {
  constructor(api) {
    this.api = api;
  }

  async getUser(id) {
    return this.api.get(`/users/${id}`);
  }
}

// ✅ 내부 동작을 이해하고 필요시 Prototype 활용
UserService.prototype.debugInfo = function() {
  console.log('Debugging:', this);
};

// 모든 인스턴스가 새 메소드를 사용 가능
const service = new UserService(api);
service.debugInfo();
```

## Prototype의 함정과 주의사항

### 함정 1: Reference 타입 공유

```javascript
function Team(name) {
  this.name = name;
}

// ❌ 배열을 Prototype에 직접 정의
Team.prototype.members = [];

Team.prototype.addMember = function(member) {
  this.members.push(member);
};

const teamA = new Team('A팀');
const teamB = new Team('B팀');

teamA.addMember('홍길동');
teamB.addMember('김철수');

console.log(teamA.members); // ['홍길동', '김철수'] ⚠️ 공유됨!
console.log(teamB.members); // ['홍길동', '김철수'] ⚠️ 공유됨!
```

**왜 이런 일이?**

```
teamA, teamB 둘 다 같은 배열을 참조:

teamA → Team.prototype.members ← teamB
              ↓
        ['홍길동', '김철수']
```

**해결책:**

```javascript
// ✅ 생성자에서 인스턴스마다 배열 생성
function Team(name) {
  this.name = name;
  this.members = [];  // 각 인스턴스가 고유한 배열을 가짐
}

Team.prototype.addMember = function(member) {
  this.members.push(member);
};

const teamA = new Team('A팀');
const teamB = new Team('B팀');

teamA.addMember('홍길동');
teamB.addMember('김철수');

console.log(teamA.members); // ['홍길동'] ✅
console.log(teamB.members); // ['김철수'] ✅
```

**원칙:**
- **원시값(Primitive)**: Prototype에 넣어도 안전 (숫자, 문자열, 불린 등)
- **참조값(Reference)**: 생성자에서 초기화 (배열, 객체 등)

### 함정 2: `new` 없이 호출하기

```javascript
function Person(name) {
  this.name = name;
}

Person.prototype.greet = function() {
  console.log(`안녕하세요, ${this.name}입니다.`);
};

// ❌ new 없이 호출
const person = Person('홍길동');

console.log(person);  // undefined
console.log(window.name); // '홍길동' (전역 객체 오염!)
```

**해결책 1: new 강제하기**

```javascript
function Person(name) {
  // new 없이 호출되었는지 확인
  if (!(this instanceof Person)) {
    return new Person(name);
  }

  this.name = name;
}

// 이제 안전
const person1 = new Person('홍길동');  // ✅
const person2 = Person('김철수');      // ✅ 자동으로 new 적용
```

**해결책 2: Class 사용**

```javascript
class Person {
  constructor(name) {
    this.name = name;
  }
}

// ❌ Class는 new 없이 호출 불가능
const person = Person('홍길동'); // TypeError: Class constructor Person cannot be invoked without 'new'
```

### 함정 3: `constructor` 속성 유지

```javascript
function Animal() {}
function Dog() {}

// ❌ 잘못된 상속
Dog.prototype = Animal.prototype;  // 같은 객체를 참조!

Dog.prototype.bark = function() {
  console.log('멍멍');
};

// Animal도 bark를 가지게 됨!
const animal = new Animal();
animal.bark(); // '멍멍' ⚠️
```

```javascript
// ❌ 이것도 문제
Dog.prototype = new Animal();  // Animal 인스턴스의 불필요한 속성까지 상속

// ✅ 올바른 방법
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;  // constructor 복원!
```

**왜 `constructor`를 복원해야 할까?**

```javascript
function Dog(name) {
  this.name = name;
}

Dog.prototype = Object.create(Animal.prototype);
// Dog.prototype.constructor를 복원하지 않으면:

const dog = new Dog('뽀삐');
console.log(dog.constructor); // Animal ⚠️ (잘못된 정보)
console.log(dog.constructor === Dog); // false ⚠️

// 복원 후:
Dog.prototype.constructor = Dog;

console.log(dog.constructor); // Dog ✅
console.log(dog.constructor === Dog); // true ✅
```

### 함정 4: `hasOwnProperty` vs `in` 연산자

```javascript
function Person(name) {
  this.name = name;
}

Person.prototype.greet = function() {
  console.log('안녕하세요');
};

const person = new Person('홍길동');

// hasOwnProperty: 자신의 속성만
console.log(person.hasOwnProperty('name'));   // true
console.log(person.hasOwnProperty('greet'));  // false

// in: Prototype Chain 전체 검색
console.log('name' in person);   // true
console.log('greet' in person);  // true
console.log('toString' in person); // true (Object.prototype)
```

**실전 활용:**

```javascript
// 객체의 자신의 속성만 순회
for (let key in person) {
  if (person.hasOwnProperty(key)) {
    console.log(key, person[key]);
  }
}

// 또는 더 현대적으로
Object.keys(person).forEach(key => {
  console.log(key, person[key]);
});
```

## 성능 최적화 관점에서 본 Prototype

### 1. 메모리 효율성

```javascript
// ❌ 메모리 비효율적
function BadUser(name) {
  this.name = name;
  this.greet = function() {  // 인스턴스마다 함수 복사
    console.log(`Hello, ${this.name}`);
  };
}

// ✅ 메모리 효율적
function GoodUser(name) {
  this.name = name;
}

GoodUser.prototype.greet = function() {  // 한 번만 생성
  console.log(`Hello, ${this.name}`);
};

// 성능 비교
const users1 = Array.from({ length: 10000 }, (_, i) => new BadUser(`User${i}`));
const users2 = Array.from({ length: 10000 }, (_, i) => new GoodUser(`User${i}`));

// BadUser: 10,000개의 greet 함수 생성
// GoodUser: 1개의 greet 함수만 생성 ⚡
```

### 2. 조회 성능

Prototype Chain이 길수록 조회가 느려집니다:

```javascript
// ❌ 너무 깊은 Chain
function A() {}
function B() {}
function C() {}
function D() {}
function E() {}

B.prototype = Object.create(A.prototype);
C.prototype = Object.create(B.prototype);
D.prototype = Object.create(C.prototype);
E.prototype = Object.create(D.prototype);

E.prototype.method = function() {
  // ...
};

const e = new E();
e.method(); // A → B → C → D → E (5단계 탐색)
```

**최적화 팁:**
- Chain을 2-3단계 이내로 유지
- 자주 사용하는 메소드는 가까운 곳에 배치
- 핫 패스(Hot Path)는 캐싱 고려

```javascript
// ✅ 캐싱으로 최적화
function Person(name) {
  this.name = name;

  // 자주 호출되는 메소드를 캐싱
  this._cachedFullName = null;
}

Person.prototype.getFullName = function() {
  if (!this._cachedFullName) {
    this._cachedFullName = this.computeFullName();
  }
  return this._cachedFullName;
};
```

### 3. 동적 메소드 추가의 영향

```javascript
function MyClass() {}

// 1만 개의 인스턴스 생성
const instances = Array.from({ length: 10000 }, () => new MyClass());

// ⚡ 런타임에 메소드 추가 - 모든 인스턴스가 즉시 사용 가능!
MyClass.prototype.newMethod = function() {
  console.log('New method');
};

instances[0].newMethod(); // 작동!
```

이것은 강력하지만, 엔진이 최적화를 무효화(deoptimization)할 수 있습니다.

**권장사항:**
- 초기화 시점에 모든 메소드를 정의
- 런타임에 프로토타입을 수정하지 않기

## 결론: Prototype을 언제 어떻게 사용할까?

### 핵심 요약

1. **Prototype은 JavaScript의 상속 메커니즘입니다**
   - 모든 `class`도 내부적으로 Prototype을 사용합니다
   - 메모리를 효율적으로 사용하기 위한 핵심 도구입니다

2. **언제 Prototype을 직접 사용하나요?**
   - 라이브러리/프레임워크 개발
   - 동적인 프로토타입 조작이 필요할 때
   - 레거시 코드와의 통합
   - 성능이 매우 중요한 경우

3. **대부분의 경우 Class를 사용하세요**
   - 더 읽기 쉽고 유지보수하기 쉽습니다
   - 팀원들에게 더 익숙합니다
   - TypeScript와 잘 맞습니다

4. **Prototype을 이해하면**
   - JavaScript의 동작 원리를 깊이 이해할 수 있습니다
   - 디버깅이 쉬워집니다
   - 라이브러리 코드를 읽고 이해할 수 있습니다
   - 성능 최적화를 할 수 있습니다

### 실전 가이드라인

```javascript
// ✅ 일반적인 애플리케이션 코드
class UserService {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  async fetchUser(id) {
    return this.apiClient.get(`/users/${id}`);
  }
}

// ✅ 필요할 때만 Prototype 직접 활용
if (process.env.NODE_ENV === 'development') {
  UserService.prototype.debug = function() {
    console.log('Debug info:', this);
  };
}

// ✅ 내장 객체는 확장하지 말기 (또는 매우 신중하게)
// Array.prototype.myMethod = ... ❌

// ✅ 대신 유틸리티 함수 사용
const ArrayUtils = {
  last: (arr) => arr[arr.length - 1]
};
```

### 마지막 조언

JavaScript를 진정으로 마스터하려면 Prototype을 이해해야 합니다. 하지만 그렇다고 해서 모든 곳에 Prototype을 직접 사용할 필요는 없습니다. **Class 문법을 사용하되, 그 내부에서 Prototype이 어떻게 동작하는지 이해하는 것**이 현대 JavaScript 개발자의 올바른 자세입니다.

Prototype은 도구입니다. 도구를 이해하고, 적재적소에 사용하세요. 🛠️

## 참고 자료

### MDN 공식 문서
- [Inheritance and the prototype chain](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain)
- [Object prototypes](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/Object_prototypes)
- [Object.create()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create)
- [Object.getPrototypeOf()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/getPrototypeOf)

### 심화 학습
- [You Don't Know JS: this & Object Prototypes](https://github.com/getify/You-Dont-Know-JS/tree/1st-ed/this%20%26%20object%20prototypes) - Kyle Simpson
- [JavaScript: The Good Parts](http://shop.oreilly.com/product/9780596517748.do) - Douglas Crockford
- [Eloquent JavaScript: Objects and Classes](https://eloquentjavascript.net/06_object.html)

### 관련 문서
- [prototype_chain.md](./prototype_chain.md) - Prototype Chain 상세 설명
- [this.md](./this.md) - this 키워드 이해
- [bind.md](./bind.md) - bind 메소드와 this
- [instance.md](./instance.md) - 인스턴스의 개념

### 추가 자료
- [JavaScript Prototype in Plain Language](http://javascriptissexy.com/javascript-prototype-in-plain-detailed-language/)
- [Master the JavaScript Interview: What's the Difference Between Class & Prototypal Inheritance?](https://medium.com/javascript-scene/master-the-javascript-interview-what-s-the-difference-between-class-prototypal-inheritance-e4cd0a7562e9)
- [Understanding Prototypes in JavaScript](https://www.digitalocean.com/community/tutorials/understanding-prototypes-and-inheritance-in-javascript)
