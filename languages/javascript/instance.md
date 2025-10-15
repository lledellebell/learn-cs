---
title: 인스턴스 (Instance)
date: 2025-10-02
categories: [Programming, JavaScript]
tags: [Instance, OOP, Prototype, Class, Constructor, new Keyword]
layout: page
---
# 인스턴스(Instance): 클래스라는 설계도에서 태어난 살아있는 객체들

혹시 이런 코드를 본 적 있나요?

```javascript
const date1 = new Date();
const date2 = new Date();

date1.setFullYear(2025);
console.log(date2.getFullYear()); // 왜 2025가 아니라 현재 연도가 나올까?
```

처음 JavaScript를 배울 때 저도 이런 의문이 들었습니다. "같은 `Date`인데 왜 따로 동작하지?" 이것이 바로 **인스턴스(Instance)**의 핵심 개념입니다. 각각이 독립적인 존재라는 것이죠.

상상해보세요. 건축가가 설계도를 그렸습니다. 그 설계도를 바탕으로 서울에 하나, 부산에 하나, 제주도에 하나, 똑같은 구조의 집을 지었습니다. 설계도는 하나지만 실제 집은 세 채입니다. 서울 집의 벽을 파란색으로 칠한다고 해서 부산 집 벽이 파란색으로 변하지 않습니다. 각 집은 **독립적인 실체**니까요.

JavaScript의 인스턴스도 정확히 이렇게 동작합니다. 클래스나 생성자 함수는 설계도이고, `new` 키워드로 만든 각각의 객체는 그 설계도를 바탕으로 만들어진 **독립적인 실체**입니다.

## 왜 인스턴스를 이해해야 할까요?

### 1. 현대 JavaScript 개발의 기초

React, Vue, Angular 같은 프레임워크를 사용하다 보면 이런 코드를 자주 만나게 됩니다:

```javascript
// React 컴포넌트
class UserProfile extends React.Component {
  constructor(props) {
    super(props);
    this.state = { isLoading: true };
  }
}

// Vue 인스턴스
const app = new Vue({
  data: { message: 'Hello' }
});

// Axios 인스턴스
const api = axios.create({
  baseURL: 'https://api.example.com'
});
```

이 모든 것이 인스턴스 개념을 활용합니다. 인스턴스를 이해하지 못하면 이 코드들이 어떻게 동작하는지, 왜 이렇게 작성하는지 알 수 없습니다.

### 2. 메모리와 성능 최적화

인스턴스를 이해하면 불필요한 객체 생성을 피할 수 있습니다:

```javascript
// ❌ 나쁜 예: 매번 새로운 Date 인스턴스 생성
function formatCurrentTime() {
  return new Date().toLocaleTimeString();
}

// 1초에 60번 호출하면 60개의 Date 인스턴스 생성!
setInterval(() => {
  console.log(formatCurrentTime());
}, 16);

// ✅ 좋은 예: 필요할 때만 생성
let lastTime = null;
function formatCurrentTime() {
  const now = Date.now();
  // 1초에 한 번만 업데이트
  if (!lastTime || now - lastTime > 1000) {
    lastTime = now;
  }
  return new Date(lastTime).toLocaleTimeString();
}
```

### 3. 디버깅과 문제 해결

실무에서 이런 버그를 만났을 때:

```javascript
const user1 = { name: 'Alice', scores: [85, 90] };
const user2 = user1;
user2.scores.push(95);

console.log(user1.scores); // [85, 90, 95] - 왜?!
```

인스턴스와 참조의 개념을 이해해야 해결할 수 있습니다.

## 기본 개념: 인스턴스란 무엇인가?

### 객체 vs 인스턴스

모든 인스턴스는 객체이지만, 모든 객체가 인스턴스는 아닙니다.

```javascript
// 그냥 객체 (리터럴)
const obj1 = { name: 'Alice' };

// 인스턴스 (생성자/클래스로 생성)
const obj2 = new Object({ name: 'Alice' });

console.log(obj1 instanceof Object); // true (객체는 Object의 인스턴스)
console.log(obj2 instanceof Object); // true

// 하지만 의미적으로 다름
// obj1: 단순 데이터 객체
// obj2: Object 생성자로 만든 인스턴스
```

**인스턴스의 핵심 특징:**
1. 생성자 함수나 클래스로부터 만들어짐
2. 프로토타입 체인을 통해 메서드를 상속받음
3. `instanceof` 연산자로 타입 확인 가능
4. 독립적인 상태(데이터)를 가짐

### 생성자 함수와 인스턴스

```javascript
// 생성자 함수 (관례적으로 대문자로 시작)
function Car(brand, color) {
  // this = 새로 만들어질 인스턴스를 가리킴
  this.brand = brand;
  this.color = color;
  this.mileage = 0;
}

// 프로토타입에 메서드 추가 (모든 인스턴스가 공유)
Car.prototype.drive = function(distance) {
  this.mileage += distance;
  return `${this.color} ${this.brand}가 ${distance}km 주행했습니다.`;
};

// 인스턴스 생성
const tesla = new Car('Tesla', 'red');
const bmw = new Car('BMW', 'blue');

tesla.drive(100);
bmw.drive(50);

console.log(tesla.mileage); // 100
console.log(bmw.mileage);   // 50

// 메서드는 공유하지만 상태는 독립적
console.log(tesla.drive === bmw.drive); // true (같은 함수 참조)
```

#### `new` 키워드가 하는 일

`new Car('Tesla', 'red')`를 실행하면 내부적으로:

```javascript
// 1. 빈 객체 생성
const instance = {};

// 2. 프로토타입 연결
Object.setPrototypeOf(instance, Car.prototype);
// 또는: instance.__proto__ = Car.prototype;

// 3. 생성자 함수 실행 (this를 새 객체에 바인딩)
Car.call(instance, 'Tesla', 'red');

// 4. 객체 반환 (생성자가 명시적으로 객체를 반환하지 않으면)
return instance;
```

### 클래스와 인스턴스 (ES6+)

클래스는 생성자 함수의 문법적 설탕(syntactic sugar)입니다:

```javascript
class Animal {
  // 생성자 메서드
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }

  // 인스턴스 메서드 (프로토타입에 추가됨)
  speak() {
    return `${this.name}가 소리를 냅니다.`;
  }

  // 정적 메서드 (클래스 자체의 메서드)
  static compare(animal1, animal2) {
    return animal1.age - animal2.age;
  }
}

const dog = new Animal('멍멍이', 3);
const cat = new Animal('야옹이', 2);

console.log(dog.speak()); // "멍멍이가 소리를 냅니다."
console.log(Animal.compare(dog, cat)); // 1

// 정적 메서드는 인스턴스에서 호출 불가
console.log(dog.compare); // undefined
```

### 프로토타입 체인 시각화

```
┌─────────────────────┐
│   dog 인스턴스       │
│  name: '멍멍이'      │
│  age: 3             │
└──────────┬──────────┘
           │ [[Prototype]]
           ↓
┌─────────────────────┐
│  Animal.prototype   │
│  speak: function    │
│  constructor: Animal│
└──────────┬──────────┘
           │ [[Prototype]]
           ↓
┌─────────────────────┐
│  Object.prototype   │
│  toString: function │
│  hasOwnProperty: fn │
└──────────┬──────────┘
           │
           ↓
         null
```

## 실전 예제: 다양한 인스턴스 생성 방법

### 1. new 키워드 사용

가장 전통적이고 명확한 방법:

```javascript
function User(name, email) {
  this.name = name;
  this.email = email;
  this.createdAt = new Date();
}

User.prototype.sendEmail = function(subject) {
  console.log(`${this.email}로 "${subject}" 전송`);
};

const user1 = new User('Alice', 'alice@example.com');
user1.sendEmail('환영합니다!');

// ❌ new 없이 호출하면?
const user2 = User('Bob', 'bob@example.com');
console.log(user2); // undefined
console.log(window.name); // 'Bob' - 전역 오염!
```

#### new 없는 호출 방지하기

```javascript
function SafeUser(name, email) {
  // new 없이 호출되었는지 체크
  if (!(this instanceof SafeUser)) {
    return new SafeUser(name, email);
  }

  this.name = name;
  this.email = email;
}

// 두 방법 모두 동작
const user3 = new SafeUser('Charlie', 'charlie@example.com');
const user4 = SafeUser('David', 'david@example.com');

console.log(user3 instanceof SafeUser); // true
console.log(user4 instanceof SafeUser); // true
```

### 2. Object.create() 사용

프로토타입을 직접 지정하여 인스턴스 생성:

```javascript
const personPrototype = {
  greet() {
    return `안녕하세요, ${this.name}입니다.`;
  },

  getAge() {
    const today = new Date();
    return today.getFullYear() - this.birthYear;
  }
};

// 프로토타입을 지정하여 객체 생성
const person1 = Object.create(personPrototype);
person1.name = 'Alice';
person1.birthYear = 1990;

console.log(person1.greet()); // "안녕하세요, Alice입니다."
console.log(person1.getAge()); // 35 (2025년 기준)

// 프로토타입 체인 확인
console.log(Object.getPrototypeOf(person1) === personPrototype); // true
```

#### Object.create()의 활용: 상속 구현

```javascript
function Parent(name) {
  this.name = name;
}

Parent.prototype.sayHello = function() {
  return `Hello, I'm ${this.name}`;
};

function Child(name, age) {
  Parent.call(this, name); // 부모 생성자 호출
  this.age = age;
}

// 프로토타입 체인 설정
Child.prototype = Object.create(Parent.prototype);
Child.prototype.constructor = Child;

Child.prototype.sayAge = function() {
  return `I'm ${this.age} years old`;
};

const child = new Child('Alice', 10);
console.log(child.sayHello()); // "Hello, I'm Alice"
console.log(child.sayAge());   // "I'm 10 years old"

// 프로토타입 체인
console.log(child instanceof Child);  // true
console.log(child instanceof Parent); // true
```

### 3. 클래스 문법 (ES6+)

현대적이고 가독성이 좋은 방법:

```javascript
class Rectangle {
  // 인스턴스 필드 (public)
  width;
  height;

  // private 필드 (ES2022+)
  #id = Math.random();

  // static 필드
  static count = 0;

  constructor(width, height) {
    this.width = width;
    this.height = height;
    Rectangle.count++;
  }

  // getter
  get area() {
    return this.width * this.height;
  }

  // setter
  set area(value) {
    // 정사각형으로 만들기
    const side = Math.sqrt(value);
    this.width = side;
    this.height = side;
  }

  // 인스턴스 메서드
  resize(factor) {
    this.width *= factor;
    this.height *= factor;
  }

  // private 메서드
  #getId() {
    return this.#id;
  }

  // static 메서드
  static fromSquare(side) {
    return new Rectangle(side, side);
  }
}

const rect1 = new Rectangle(10, 20);
console.log(rect1.area); // 200

rect1.area = 400;
console.log(rect1.width); // 20
console.log(rect1.height); // 20

const square = Rectangle.fromSquare(15);
console.log(square.area); // 225

console.log(Rectangle.count); // 2
```

### 4. 팩토리 함수 패턴

클래스나 생성자 없이 객체 생성:

```javascript
function createCounter(initialValue = 0) {
  // 클로저를 활용한 private 변수
  let count = initialValue;

  return {
    increment() {
      count++;
      return count;
    },

    decrement() {
      count--;
      return count;
    },

    getValue() {
      return count;
    },

    reset() {
      count = initialValue;
      return count;
    }
  };
}

const counter1 = createCounter(10);
const counter2 = createCounter(20);

console.log(counter1.increment()); // 11
console.log(counter2.increment()); // 21

// 각각 독립적
console.log(counter1.getValue()); // 11
console.log(counter2.getValue()); // 21

// private 변수에 직접 접근 불가
console.log(counter1.count); // undefined
```

## 좋은 예 vs 나쁜 예

### ❌ 나쁜 예 1: 인스턴스 프로퍼티를 프로토타입에 정의

```javascript
function BadUser(name) {
  this.name = name;
}

// ❌ 배열을 프로토타입에 정의 (모든 인스턴스가 공유!)
BadUser.prototype.hobbies = [];

const user1 = new BadUser('Alice');
const user2 = new BadUser('Bob');

user1.hobbies.push('독서');
user2.hobbies.push('운동');

console.log(user1.hobbies); // ['독서', '운동'] - 오염됨!
console.log(user2.hobbies); // ['독서', '운동'] - 오염됨!
```

### ✅ 좋은 예 1: 인스턴스 프로퍼티는 생성자에서

```javascript
function GoodUser(name) {
  this.name = name;
  this.hobbies = []; // 각 인스턴스마다 새 배열
}

const user3 = new GoodUser('Charlie');
const user4 = new GoodUser('David');

user3.hobbies.push('독서');
user4.hobbies.push('운동');

console.log(user3.hobbies); // ['독서']
console.log(user4.hobbies); // ['운동']
```

### ❌ 나쁜 예 2: 메서드를 생성자 안에서 정의

```javascript
function BadAnimal(name) {
  this.name = name;

  // ❌ 인스턴스마다 새로운 함수 생성 (메모리 낭비)
  this.speak = function() {
    console.log(`${this.name}가 소리를 냅니다.`);
  };
}

const animal1 = new BadAnimal('멍멍이');
const animal2 = new BadAnimal('야옹이');

console.log(animal1.speak === animal2.speak); // false (다른 함수!)
```

### ✅ 좋은 예 2: 메서드는 프로토타입에

```javascript
function GoodAnimal(name) {
  this.name = name;
}

// ✅ 프로토타입에 메서드 정의 (모든 인스턴스가 공유)
GoodAnimal.prototype.speak = function() {
  console.log(`${this.name}가 소리를 냅니다.`);
};

const animal3 = new GoodAnimal('멍멍이');
const animal4 = new GoodAnimal('야옹이');

console.log(animal3.speak === animal4.speak); // true (같은 함수!)
```

### ❌ 나쁜 예 3: this 바인딩 실수

```javascript
class Counter {
  constructor() {
    this.count = 0;
  }

  increment() {
    this.count++;
  }
}

const counter = new Counter();

// ❌ 메서드를 참조만 전달하면 this가 사라짐
const incrementFn = counter.increment;
incrementFn(); // TypeError: Cannot read property 'count' of undefined
```

### ✅ 좋은 예 3: this 바인딩 명확히 하기

```javascript
class Counter {
  constructor() {
    this.count = 0;

    // 방법 1: 생성자에서 바인딩
    this.increment = this.increment.bind(this);
  }

  increment() {
    this.count++;
  }

  // 방법 2: 화살표 함수 사용 (class field)
  decrement = () => {
    this.count--;
  }
}

const counter = new Counter();

const incrementFn = counter.increment;
const decrementFn = counter.decrement;

incrementFn(); // 동작!
decrementFn(); // 동작!

console.log(counter.count); // 0
```

## 활용

### 1. instanceof 연산자의 동작 원리

`instanceof`는 프로토타입 체인을 따라 올라가며 확인합니다:

```javascript
function MyClass() {}

const instance = new MyClass();

// instanceof의 내부 동작 구현
function customInstanceOf(obj, constructor) {
  let proto = Object.getPrototypeOf(obj);

  while (proto !== null) {
    if (proto === constructor.prototype) {
      return true;
    }
    proto = Object.getPrototypeOf(proto);
  }

  return false;
}

console.log(customInstanceOf(instance, MyClass)); // true
console.log(customInstanceOf(instance, Object)); // true
console.log(customInstanceOf(instance, Array)); // false
```

### 2. Symbol.hasInstance로 커스터마이징

```javascript
class MyArray {
  static [Symbol.hasInstance](instance) {
    return Array.isArray(instance);
  }
}

console.log([] instanceof MyArray); // true
console.log({} instanceof MyArray); // false

// 실용적인 예: 타입 체커
class TypeChecker {
  static [Symbol.hasInstance](instance) {
    return (
      typeof instance === 'object' &&
      instance !== null &&
      'validate' in instance &&
      typeof instance.validate === 'function'
    );
  }
}

const validator = {
  validate() { return true; }
};

console.log(validator instanceof TypeChecker); // true
```

### 3. 인스턴스 vs 프로토타입 프로퍼티

```javascript
class Person {
  constructor(name) {
    // 인스턴스 프로퍼티
    this.name = name;
    this.id = Math.random();
  }

  // 프로토타입 메서드
  greet() {
    return `안녕하세요, ${this.name}입니다.`;
  }
}

// 프로토타입에 동적으로 추가
Person.prototype.species = 'Human';

const person1 = new Person('Alice');
const person2 = new Person('Bob');

// 인스턴스 프로퍼티는 각자 다름
console.log(person1.id !== person2.id); // true

// 프로토타입 프로퍼티는 공유
console.log(person1.species === person2.species); // true

// 인스턴스에서 덮어쓰기
person1.species = 'Robot';

console.log(person1.species); // 'Robot' (인스턴스 프로퍼티)
console.log(person2.species); // 'Human' (프로토타입 프로퍼티)
console.log(Person.prototype.species); // 'Human' (영향 없음)

// 프로퍼티 확인
console.log(person1.hasOwnProperty('species')); // true
console.log(person2.hasOwnProperty('species')); // false
```

### 4. 메모리 최적화: 여러 인스턴스의 효율적 관리

```javascript
class GameCharacter {
  // 모든 캐릭터가 사용하는 스프라이트 시트 (static)
  static spriteSheet = null;

  // 인스턴스 카운터
  static instanceCount = 0;
  static maxInstances = 100;

  constructor(x, y, type) {
    // 인스턴스 제한
    if (GameCharacter.instanceCount >= GameCharacter.maxInstances) {
      throw new Error('최대 인스턴스 수를 초과했습니다.');
    }

    this.x = x;
    this.y = y;
    this.type = type;
    this.health = 100;

    GameCharacter.instanceCount++;
  }

  destroy() {
    GameCharacter.instanceCount--;
    // 정리 작업...
  }

  // 프로토타입 메서드 (공유됨)
  move(dx, dy) {
    this.x += dx;
    this.y += dy;
  }

  // 무거운 리소스는 static으로 공유
  static loadSpriteSheet(url) {
    if (!GameCharacter.spriteSheet) {
      GameCharacter.spriteSheet = loadImage(url);
    }
    return GameCharacter.spriteSheet;
  }
}

function loadImage(url) {
  return { url, loaded: true };
}

// 스프라이트 한 번만 로드
GameCharacter.loadSpriteSheet('/sprites.png');

// 여러 캐릭터 생성
const characters = [];
for (let i = 0; i < 50; i++) {
  characters.push(new GameCharacter(i * 10, 0, 'enemy'));
}

console.log(GameCharacter.instanceCount); // 50
console.log(characters[0].move === characters[1].move); // true (메서드 공유)
```

### 5. WeakMap을 활용한 Private 데이터

```javascript
const privateData = new WeakMap();

class BankAccount {
  constructor(owner, balance) {
    // public 프로퍼티
    this.owner = owner;

    // private 데이터 (WeakMap에 저장)
    privateData.set(this, {
      balance: balance,
      pin: Math.floor(Math.random() * 10000)
    });
  }

  deposit(amount) {
    const data = privateData.get(this);
    data.balance += amount;
    return data.balance;
  }

  withdraw(amount, pin) {
    const data = privateData.get(this);

    if (data.pin !== pin) {
      throw new Error('PIN이 일치하지 않습니다.');
    }

    if (data.balance < amount) {
      throw new Error('잔액이 부족합니다.');
    }

    data.balance -= amount;
    return data.balance;
  }

  getBalance(pin) {
    const data = privateData.get(this);

    if (data.pin !== pin) {
      throw new Error('PIN이 일치하지 않습니다.');
    }

    return data.balance;
  }
}

const account = new BankAccount('Alice', 1000);

account.deposit(500);
console.log(account.owner); // 'Alice'
console.log(account.balance); // undefined (접근 불가)

// PIN을 모르면 조회 불가
try {
  account.getBalance(1234);
} catch (e) {
  console.log(e.message); // "PIN이 일치하지 않습니다."
}
```

## 함정과 주의사항

### 1. this 바인딩 문제

```javascript
class Button {
  constructor(label) {
    this.label = label;
    this.clickCount = 0;
  }

  handleClick() {
    this.clickCount++;
    console.log(`${this.label} 버튼이 ${this.clickCount}번 클릭됨`);
  }
}

const button = new Button('제출');

// ❌ 문제: 이벤트 리스너에서 this가 바뀜
document.querySelector('#submit').addEventListener('click', button.handleClick);
// TypeError: Cannot read property 'clickCount' of undefined

// ✅ 해결 1: bind 사용
document.querySelector('#submit').addEventListener('click',
  button.handleClick.bind(button)
);

// ✅ 해결 2: 화살표 함수로 래핑
document.querySelector('#submit').addEventListener('click',
  () => button.handleClick()
);

// ✅ 해결 3: 클래스 필드 (자동 바인딩)
class BetterButton {
  constructor(label) {
    this.label = label;
    this.clickCount = 0;
  }

  handleClick = () => {
    this.clickCount++;
    console.log(`${this.label} 버튼이 ${this.clickCount}번 클릭됨`);
  }
}
```

### 2. 프로토타입 오염

```javascript
// ❌ 위험: 내장 프로토타입 수정
Array.prototype.first = function() {
  return this[0];
};

const arr = [1, 2, 3];
console.log(arr.first()); // 1

// 문제: 모든 배열이 영향받음
const otherArr = [];
console.log('first' in otherArr); // true

// for...in에서도 나타남
for (let key in arr) {
  console.log(key); // '0', '1', '2', 'first'
}

// ✅ 더 나은 방법: 헬퍼 함수
function first(array) {
  return array[0];
}

console.log(first([1, 2, 3])); // 1
```

### 3. 생성자 반환값 주의

```javascript
function WeirdConstructor() {
  this.value = 42;

  // ❌ 객체를 명시적으로 반환하면 this가 무시됨
  return { value: 100 };
}

const weird = new WeirdConstructor();
console.log(weird.value); // 100 (this.value가 아님!)

// ✅ 원시값 반환은 무시됨 (정상 동작)
function NormalConstructor() {
  this.value = 42;
  return 100; // 무시됨
}

const normal = new NormalConstructor();
console.log(normal.value); // 42
```

### 4. instanceof의 한계

```javascript
// 문제 1: iframe에서 생성된 배열
const iframe = document.createElement('iframe');
document.body.appendChild(iframe);
const iframeArray = iframe.contentWindow.Array;

const arr = new iframeArray(1, 2, 3);
console.log(arr instanceof Array); // false!
console.log(Array.isArray(arr)); // true ✅

// 문제 2: Object.create(null)
const obj = Object.create(null);
console.log(obj instanceof Object); // false
console.log(typeof obj); // 'object'

// ✅ 더 안전한 타입 체크
function isArray(value) {
  return Array.isArray(value);
}

function isObject(value) {
  return value !== null && typeof value === 'object';
}
```

### 5. 클래스 필드의 this

```javascript
class Counter {
  count = 0;

  // ❌ 화살표 함수는 인스턴스마다 새로 생성됨
  increment = () => {
    this.count++;
  }

  // ✅ 일반 메서드는 프로토타입에 공유됨
  decrement() {
    this.count--;
  }
}

const c1 = new Counter();
const c2 = new Counter();

console.log(c1.increment === c2.increment); // false (각자 생성)
console.log(c1.decrement === c2.decrement); // true (공유)

// 트레이드오프:
// - 화살표 함수: this 바인딩 자동, 메모리 많이 사용
// - 일반 메서드: 메모리 효율적, this 바인딩 수동 처리
```

## 실전 활용

### 1. UI 컴포넌트 인스턴스

```javascript
class Modal {
  static activeModals = new Set();

  constructor(options) {
    this.id = options.id || `modal-${Date.now()}`;
    this.title = options.title;
    this.content = options.content;
    this.isOpen = false;
    this.element = null;

    this.onOpen = options.onOpen || (() => {});
    this.onClose = options.onClose || (() => {});

    this.create();
  }

  create() {
    this.element = document.createElement('div');
    this.element.className = 'modal';
    this.element.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content">
        <h2>${this.title}</h2>
        <div class="modal-body">${this.content}</div>
        <button class="modal-close">닫기</button>
      </div>
    `;

    // 이벤트 리스너 (this 바인딩 주의!)
    this.element.querySelector('.modal-close')
      .addEventListener('click', () => this.close());

    document.body.appendChild(this.element);
  }

  open() {
    if (this.isOpen) return;

    this.isOpen = true;
    this.element.classList.add('open');
    Modal.activeModals.add(this);
    this.onOpen();

    // ESC 키로 닫기
    this.handleKeyDown = (e) => {
      if (e.key === 'Escape') this.close();
    };
    document.addEventListener('keydown', this.handleKeyDown);
  }

  close() {
    if (!this.isOpen) return;

    this.isOpen = false;
    this.element.classList.remove('open');
    Modal.activeModals.delete(this);
    this.onClose();

    document.removeEventListener('keydown', this.handleKeyDown);
  }

  destroy() {
    this.close();
    this.element.remove();
  }

  static closeAll() {
    Modal.activeModals.forEach(modal => modal.close());
  }
}

// 사용 예
const loginModal = new Modal({
  id: 'login',
  title: '로그인',
  content: '<form>...</form>',
  onOpen: () => console.log('로그인 모달 열림'),
  onClose: () => console.log('로그인 모달 닫힘')
});

const signupModal = new Modal({
  id: 'signup',
  title: '회원가입',
  content: '<form>...</form>'
});

loginModal.open();
signupModal.open();

console.log(Modal.activeModals.size); // 2

// 모든 모달 닫기
Modal.closeAll();
```

### 2. 게임 오브젝트 관리

```javascript
class GameObject {
  static allObjects = [];
  static nextId = 1;

  constructor(x, y, type) {
    this.id = GameObject.nextId++;
    this.x = x;
    this.y = y;
    this.type = type;
    this.isActive = true;

    GameObject.allObjects.push(this);
  }

  update(deltaTime) {
    // 각 타입마다 오버라이드
  }

  destroy() {
    this.isActive = false;
    const index = GameObject.allObjects.indexOf(this);
    if (index > -1) {
      GameObject.allObjects.splice(index, 1);
    }
  }

  static updateAll(deltaTime) {
    GameObject.allObjects.forEach(obj => {
      if (obj.isActive) {
        obj.update(deltaTime);
      }
    });
  }

  static findById(id) {
    return GameObject.allObjects.find(obj => obj.id === id);
  }

  static findByType(type) {
    return GameObject.allObjects.filter(obj => obj.type === type);
  }
}

class Player extends GameObject {
  constructor(x, y) {
    super(x, y, 'player');
    this.health = 100;
    this.speed = 5;
  }

  update(deltaTime) {
    // 플레이어 로직
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.destroy();
    }
  }
}

class Enemy extends GameObject {
  constructor(x, y) {
    super(x, y, 'enemy');
    this.health = 50;
  }

  update(deltaTime) {
    // 적 AI
    const player = GameObject.findByType('player')[0];
    if (player) {
      // 플레이어를 향해 이동
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0) {
        this.x += (dx / distance) * 2 * deltaTime;
        this.y += (dy / distance) * 2 * deltaTime;
      }
    }
  }
}

// 게임 실행
const player = new Player(400, 300);
const enemy1 = new Enemy(100, 100);
const enemy2 = new Enemy(700, 100);
const enemy3 = new Enemy(100, 500);

console.log(GameObject.allObjects.length); // 4

// 게임 루프
function gameLoop() {
  const deltaTime = 0.016; // 60fps
  GameObject.updateAll(deltaTime);
  requestAnimationFrame(gameLoop);
}

// gameLoop();
```

### 3. 데이터 모델과 상태 관리

```javascript
class Store {
  constructor(initialState = {}) {
    this.state = { ...initialState };
    this.listeners = new Set();
  }

  getState() {
    return { ...this.state };
  }

  setState(updater) {
    const newState = typeof updater === 'function'
      ? updater(this.state)
      : updater;

    this.state = { ...this.state, ...newState };
    this.notify();
  }

  subscribe(listener) {
    this.listeners.add(listener);

    // 구독 취소 함수 반환
    return () => {
      this.listeners.delete(listener);
    };
  }

  notify() {
    this.listeners.forEach(listener => {
      listener(this.state);
    });
  }
}

class TodoStore extends Store {
  constructor() {
    super({ todos: [], filter: 'all' });
  }

  addTodo(text) {
    const todo = {
      id: Date.now(),
      text,
      completed: false
    };

    this.setState(state => ({
      todos: [...state.todos, todo]
    }));
  }

  toggleTodo(id) {
    this.setState(state => ({
      todos: state.todos.map(todo =>
        todo.id === id
          ? { ...todo, completed: !todo.completed }
          : todo
      )
    }));
  }

  setFilter(filter) {
    this.setState({ filter });
  }

  getVisibleTodos() {
    const { todos, filter } = this.getState();

    switch (filter) {
      case 'active':
        return todos.filter(todo => !todo.completed);
      case 'completed':
        return todos.filter(todo => todo.completed);
      default:
        return todos;
    }
  }
}

// 사용
const todoStore = new TodoStore();

// 상태 변경 구독
const unsubscribe = todoStore.subscribe(state => {
  console.log('상태 업데이트:', state);
});

todoStore.addTodo('JavaScript 공부하기');
todoStore.addTodo('운동하기');
todoStore.toggleTodo(todoStore.getState().todos[0].id);

console.log(todoStore.getVisibleTodos());

// 구독 취소
unsubscribe();
```

### 4. 싱글톤 패턴: API 클라이언트

```javascript
class ApiClient {
  static instance = null;

  constructor(baseURL, options = {}) {
    // 싱글톤: 이미 인스턴스가 있으면 반환
    if (ApiClient.instance) {
      return ApiClient.instance;
    }

    this.baseURL = baseURL;
    this.defaultHeaders = options.headers || {};
    this.timeout = options.timeout || 5000;
    this.interceptors = {
      request: [],
      response: []
    };

    ApiClient.instance = this;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers
      }
    };

    // Request 인터셉터 실행
    for (const interceptor of this.interceptors.request) {
      await interceptor(config);
    }

    try {
      const response = await fetch(url, config);

      // Response 인터셉터 실행
      for (const interceptor of this.interceptors.response) {
        await interceptor(response);
      }

      return await response.json();
    } catch (error) {
      console.error('API 요청 실패:', error);
      throw error;
    }
  }

  get(endpoint, options) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, data, options) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      }
    });
  }

  addRequestInterceptor(fn) {
    this.interceptors.request.push(fn);
  }

  addResponseInterceptor(fn) {
    this.interceptors.response.push(fn);
  }

  static getInstance() {
    if (!ApiClient.instance) {
      throw new Error('ApiClient가 초기화되지 않았습니다.');
    }
    return ApiClient.instance;
  }
}

// 앱 초기화 시 한 번만 생성
const api = new ApiClient('https://api.example.com', {
  headers: {
    'Authorization': 'Bearer token123'
  }
});

// 인터셉터 추가
api.addRequestInterceptor(async (config) => {
  console.log('요청 시작:', config);
});

// 다른 모듈에서도 같은 인스턴스 사용
const api2 = new ApiClient('https://different-url.com');
console.log(api === api2); // true (같은 인스턴스!)

// 또는 getInstance()로 가져오기
const api3 = ApiClient.getInstance();
console.log(api === api3); // true
```

### 5. 풀링(Pooling) 패턴: 객체 재사용

```javascript
class ObjectPool {
  constructor(createFn, resetFn, initialSize = 10) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.available = [];
    this.inUse = new Set();

    // 초기 객체 생성
    for (let i = 0; i < initialSize; i++) {
      this.available.push(this.createFn());
    }
  }

  acquire() {
    let obj;

    if (this.available.length > 0) {
      obj = this.available.pop();
    } else {
      obj = this.createFn();
    }

    this.inUse.add(obj);
    return obj;
  }

  release(obj) {
    if (!this.inUse.has(obj)) {
      console.warn('이 객체는 풀에서 가져온 것이 아닙니다.');
      return;
    }

    this.inUse.delete(obj);
    this.resetFn(obj);
    this.available.push(obj);
  }

  getStats() {
    return {
      available: this.available.length,
      inUse: this.inUse.size,
      total: this.available.length + this.inUse.size
    };
  }
}

// 파티클 시스템에서 활용
class Particle {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.life = 1.0;
    this.isActive = false;
  }

  init(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.life = 1.0;
    this.isActive = true;
  }

  update(deltaTime) {
    if (!this.isActive) return;

    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
    this.life -= deltaTime;

    if (this.life <= 0) {
      this.isActive = false;
    }
  }
}

// 파티클 풀 생성
const particlePool = new ObjectPool(
  () => new Particle(),
  (particle) => {
    particle.isActive = false;
    particle.life = 1.0;
  },
  100
);

// 사용
function createExplosion(x, y) {
  const particles = [];

  for (let i = 0; i < 50; i++) {
    const particle = particlePool.acquire();
    const angle = (Math.PI * 2 * i) / 50;
    const speed = 100 + Math.random() * 100;

    particle.init(
      x,
      y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );

    particles.push(particle);
  }

  return particles;
}

// 업데이트 루프
function update(deltaTime) {
  particlePool.inUse.forEach(particle => {
    particle.update(deltaTime);

    if (!particle.isActive) {
      particlePool.release(particle);
    }
  });
}

console.log(particlePool.getStats()); // { available: 100, inUse: 0, total: 100 }

const explosion = createExplosion(400, 300);
console.log(particlePool.getStats()); // { available: 50, inUse: 50, total: 100 }
```

## 타입 체크: instanceof vs typeof vs Object.prototype.toString

```javascript
// typeof: 원시 타입 체크
console.log(typeof 42);          // 'number'
console.log(typeof 'hello');     // 'string'
console.log(typeof true);        // 'boolean'
console.log(typeof undefined);   // 'undefined'
console.log(typeof null);        // 'object' (역사적 버그)
console.log(typeof {});          // 'object'
console.log(typeof []);          // 'object' (구분 안됨)
console.log(typeof function(){}); // 'function'

// instanceof: 인스턴스와 생성자 관계 체크
class Animal {}
class Dog extends Animal {}

const dog = new Dog();

console.log(dog instanceof Dog);     // true
console.log(dog instanceof Animal);  // true
console.log(dog instanceof Object);  // true

console.log([] instanceof Array);    // true
console.log([] instanceof Object);   // true

// 한계: 다른 컨텍스트(iframe)에서는 실패
// instanceof는 원시값에 사용 불가
console.log(42 instanceof Number);   // false
console.log(new Number(42) instanceof Number); // true

// Object.prototype.toString: 가장 정확한 타입 체크
function getType(value) {
  return Object.prototype.toString.call(value).slice(8, -1);
}

console.log(getType(42));              // 'Number'
console.log(getType('hello'));         // 'String'
console.log(getType(true));            // 'Boolean'
console.log(getType(null));            // 'Null'
console.log(getType(undefined));       // 'Undefined'
console.log(getType({}));              // 'Object'
console.log(getType([]));              // 'Array'
console.log(getType(new Date()));      // 'Date'
console.log(getType(/regex/));         // 'RegExp'
console.log(getType(function(){}));    // 'Function'

// 커스텀 타입도 체크 가능
class MyClass {
  get [Symbol.toStringTag]() {
    return 'MyClass';
  }
}

console.log(getType(new MyClass()));   // 'MyClass'

// 실용적인 타입 체크 유틸리티
const is = {
  array: value => Array.isArray(value),
  object: value => value !== null && typeof value === 'object' && !Array.isArray(value),
  string: value => typeof value === 'string',
  number: value => typeof value === 'number' && !isNaN(value),
  function: value => typeof value === 'function',
  null: value => value === null,
  undefined: value => value === undefined,
  date: value => value instanceof Date && !isNaN(value),
  regexp: value => value instanceof RegExp,
  promise: value => value instanceof Promise || (value && typeof value.then === 'function')
};

console.log(is.array([1, 2, 3]));         // true
console.log(is.object({ a: 1 }));         // true
console.log(is.number(NaN));              // false
console.log(is.promise(Promise.resolve())); // true
```

## 참고 자료

### MDN 공식 문서
- [Classes - JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes)
- [new operator - JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/new)
- [instanceof - JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/instanceof)
- [Object.create() - JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create)
- [Inheritance and the prototype chain - JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain)
- [this - JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this)

### 심화 학습
- [You Don't Know JS: this & Object Prototypes](https://github.com/getify/You-Dont-Know-JS/tree/1st-ed/this%20%26%20object%20prototypes) - Kyle Simpson
- [JavaScript.info - Class basic syntax](https://javascript.info/class)
- [JavaScript.info - Prototypes](https://javascript.info/prototypes)
- [Understanding JavaScript Constructors](https://css-tricks.com/understanding-javascript-constructors/)

### 디자인 패턴
- [JavaScript Design Patterns](https://www.patterns.dev/posts/classic-design-patterns/) - Patterns.dev
- [Singleton Pattern in JavaScript](https://www.dofactory.com/javascript/design-patterns/singleton)
- [Object Pool Pattern](https://gameprogrammingpatterns.com/object-pool.html) - Game Programming Patterns

### 성능 최적화
- [Memory Management - JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_Management)
- [JavaScript Performance Optimization Tips](https://developer.mozilla.org/en-US/docs/Learn/Performance/JavaScript)
- [V8 Blog: Understanding Classes and Prototypes](https://v8.dev/features/class-fields)

### 블로그 글
- [A Simple Explanation of JavaScript Prototypes](https://www.freecodecamp.org/news/a-beginners-guide-to-javascripts-prototype/)
- [The Power of JavaScript Classes](https://www.sitepoint.com/object-oriented-javascript-deep-dive-es6-classes/)
- [When to use new in JavaScript](https://kentcdodds.com/blog/when-to-use-new-in-javascript)
