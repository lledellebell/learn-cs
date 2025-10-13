---
title: Factory Pattern - 객체를 만드는 똑똑한 방법
date: 2025-10-13
layout: page
---
# Factory Pattern - 객체를 만드는 똑똑한 방법

프로젝트가 커지면서 이런 경험을 해본 적 있나요?

```javascript
// 사용자 객체를 만들어야 하는데...
const user1 = {
  id: 1,
  name: '홍길동',
  email: 'hong@example.com',
  role: 'admin',
  createdAt: new Date(),
  isActive: true
};

const user2 = {
  id: 2,
  name: '김철수',
  email: 'kim@example.com',
  role: 'user',
  createdAt: new Date(),
  isActive: true
};

const user3 = {
  id: 3,
  name: '이영희',
  email: 'lee@example.com',
  role: 'user',
  createdAt: new Date(),
  isActive: true
};
```

"또 똑같은 구조를 복사-붙여넣기 하고 있네..." 저도 처음에는 이렇게 했습니다. 그런데 어느 날 갑자기 모든 사용자 객체에 `lastLogin` 필드를 추가해야 한다는 요구사항이 들어왔습니다. 이미 100개 이상의 사용자 객체가 코드 곳곳에 흩어져 있었죠. 😱

그때 깨달았습니다. "객체를 만드는 방법을 한 곳에 모아두면 얼마나 좋을까?" 이것이 바로 **Factory Pattern**의 핵심 아이디어입니다.

## 목차

- [왜 Factory Pattern을 이해해야 할까요?](#왜-factory-pattern을-이해해야-할까요)
- [먼저, 문제 상황을 보면서 시작해볼까요?](#먼저-문제-상황을-보면서-시작해볼까요)
- [Factory Pattern이란 무엇인가?](#factory-pattern이란-무엇인가)
- [Factory Pattern의 동작 원리](#factory-pattern의-동작-원리)
- [다양한 Factory Pattern 형태](#다양한-factory-pattern-형태)
- [실전 예제로 배우기](#실전-예제로-배우기)
- [Factory Pattern vs 다른 방법들](#factory-pattern-vs-다른-방법들)
- [함정과 주의사항](#함정과-주의사항)
- [실전에서 활용하기](#실전에서-활용하기)
- [성능과 메모리 최적화](#성능과-메모리-최적화)
- [TypeScript로 타입 안전하게 만들기](#typescript로-타입-안전하게-만들기)
- [결론: Factory Pattern을 언제 사용할까?](#결론-factory-pattern을-언제-사용할까)
- [참고 자료](#참고-자료)

## 왜 Factory Pattern을 이해해야 할까요?

### 1. 객체 생성 로직을 한 곳에서 관리할 수 있습니다

실무에서 가장 흔한 상황입니다. API 응답으로 받은 데이터를 프론트엔드에서 사용하기 좋은 형태로 변환해야 할 때:

```javascript
// ❌ 변환 로직이 코드 곳곳에 흩어져 있음
function fetchUsers() {
  return api.get('/users').then(users => {
    return users.map(user => ({
      ...user,
      fullName: `${user.firstName} ${user.lastName}`,
      isAdmin: user.role === 'admin'
    }));
  });
}

function fetchUserProfile(id) {
  return api.get(`/users/${id}`).then(user => ({
    ...user,
    fullName: `${user.firstName} ${user.lastName}`,
    isAdmin: user.role === 'admin'
  }));
}

// 같은 변환 로직이 반복됨!
```

Factory Pattern을 사용하면:

```javascript
// ✅ 변환 로직이 한 곳에만 있음
const UserFactory = {
  create(userData) {
    return {
      ...userData,
      fullName: `${userData.firstName} ${userData.lastName}`,
      isAdmin: userData.role === 'admin'
    };
  }
};

function fetchUsers() {
  return api.get('/users').then(users => users.map(UserFactory.create));
}

function fetchUserProfile(id) {
  return api.get(`/users/${id}`).then(UserFactory.create);
}
```

### 2. 복잡한 초기화 로직을 숨길 수 있습니다

게임 캐릭터를 만드는 상황을 생각해보세요:

```javascript
// ❌ 복잡한 초기화 로직이 노출됨
const warrior = {
  name: '전사',
  hp: 100,
  mp: 50,
  attack: 20,
  defense: 15,
  skills: ['강타', '방패막기'],
  inventory: [],
  equipment: {
    weapon: null,
    armor: null,
    accessory: null
  },
  stats: {
    strength: 10,
    agility: 5,
    intelligence: 3
  }
};

// 매번 이렇게 긴 객체를 만들어야 한다면?
```

Factory Pattern으로 단순화:

```javascript
// ✅ 사용자는 간단하게 호출만 하면 됨
function createWarrior(name) {
  return {
    name,
    hp: 100,
    mp: 50,
    attack: 20,
    defense: 15,
    skills: ['강타', '방패막기'],
    inventory: [],
    equipment: { weapon: null, armor: null, accessory: null },
    stats: { strength: 10, agility: 5, intelligence: 3 }
  };
}

const warrior = createWarrior('홍길동');
```

### 3. 조건에 따라 다른 객체를 생성할 수 있습니다

실무에서 정말 자주 마주치는 상황입니다:

```javascript
// ❌ 조건 분기가 사용하는 곳마다 반복됨
function handlePayment(type, amount) {
  let payment;
  if (type === 'credit-card') {
    payment = new CreditCardPayment(amount);
  } else if (type === 'paypal') {
    payment = new PayPalPayment(amount);
  } else if (type === 'bank-transfer') {
    payment = new BankTransferPayment(amount);
  }
  return payment.process();
}

// ✅ Factory에서 조건 분기를 처리
const PaymentFactory = {
  create(type, amount) {
    switch (type) {
      case 'credit-card':
        return new CreditCardPayment(amount);
      case 'paypal':
        return new PayPalPayment(amount);
      case 'bank-transfer':
        return new BankTransferPayment(amount);
      default:
        throw new Error(`Unknown payment type: ${type}`);
    }
  }
};

function handlePayment(type, amount) {
  const payment = PaymentFactory.create(type, amount);
  return payment.process();
}
```

## 먼저, 문제 상황을 보면서 시작해볼까요?

전자상거래 사이트에서 다양한 종류의 제품 카드를 만들어야 하는 상황을 상상해보세요.

### 접근 1: 직접 객체 리터럴로 만들기

```javascript
const product1 = {
  id: 1,
  name: '노트북',
  price: 1500000,
  category: 'electronics',
  image: '/images/laptop.jpg',
  discount: 0,
  finalPrice: 1500000,
  isOnSale: false,
  displayPrice: '1,500,000원'
};

const product2 = {
  id: 2,
  name: '키보드',
  price: 150000,
  category: 'electronics',
  image: '/images/keyboard.jpg',
  discount: 0.1,
  finalPrice: 135000,
  isOnSale: true,
  displayPrice: '135,000원'
};

const product3 = {
  id: 3,
  name: '마우스',
  price: 80000,
  category: 'electronics',
  image: '/images/mouse.jpg',
  discount: 0.15,
  finalPrice: 68000,
  isOnSale: true,
  displayPrice: '68,000원'
};
```

**문제점:**
- 매번 `finalPrice`를 직접 계산해야 합니다
- `displayPrice` 형식을 일일이 만들어야 합니다
- `isOnSale` 로직이 중복됩니다
- 새로운 필드를 추가하려면 모든 제품을 수정해야 합니다
- 실수할 가능성이 매우 높습니다

### 접근 2: 생성 함수 만들기

```javascript
function formatPrice(price) {
  return price.toLocaleString('ko-KR') + '원';
}

function calculateFinalPrice(price, discount) {
  return Math.floor(price * (1 - discount));
}

const product1 = {
  id: 1,
  name: '노트북',
  price: 1500000,
  category: 'electronics',
  image: '/images/laptop.jpg',
  discount: 0,
  finalPrice: calculateFinalPrice(1500000, 0),
  isOnSale: 0 > 0,
  displayPrice: formatPrice(calculateFinalPrice(1500000, 0))
};

// 여전히 복잡하고 실수하기 쉽습니다
```

**개선점:**
- 계산 로직은 함수로 분리했습니다

**여전히 남은 문제:**
- 객체 구조를 매번 반복해야 합니다
- 여러 함수를 적절한 순서로 호출해야 합니다
- 코드가 여전히 복잡합니다

### 접근 3: Factory Pattern 사용하기 ⭐

```javascript
function createProduct(data) {
  const { id, name, price, category, image, discount = 0 } = data;
  const finalPrice = Math.floor(price * (1 - discount));

  return {
    id,
    name,
    price,
    category,
    image,
    discount,
    finalPrice,
    isOnSale: discount > 0,
    displayPrice: finalPrice.toLocaleString('ko-KR') + '원',
    // 추가 메서드도 쉽게 넣을 수 있음
    applyAdditionalDiscount(extraDiscount) {
      const newPrice = Math.floor(this.finalPrice * (1 - extraDiscount));
      return createProduct({
        ...data,
        discount: 1 - (newPrice / price)
      });
    }
  };
}

// 사용하기
const product1 = createProduct({
  id: 1,
  name: '노트북',
  price: 1500000,
  category: 'electronics',
  image: '/images/laptop.jpg'
});

const product2 = createProduct({
  id: 2,
  name: '키보드',
  price: 150000,
  category: 'electronics',
  image: '/images/keyboard.jpg',
  discount: 0.1
});

console.log(product2.displayPrice); // "135,000원"
console.log(product2.isOnSale);     // true
```

**해결된 점:**
- ✅ 일관된 객체 구조 보장
- ✅ 계산 로직이 Factory 내부에 숨겨짐
- ✅ 사용하기 쉽고 실수할 가능성이 낮음
- ✅ 새 기능 추가가 쉬움
- ✅ 테스트하기 쉬움

## Factory Pattern이란 무엇인가?

### 기본 개념

Factory Pattern은 **객체 생성 로직을 캡슐화하는 디자인 패턴**입니다. "공장(Factory)"처럼 원하는 제품(객체)을 주문하면, 내부에서 어떻게 만드는지 몰라도 완성된 제품을 받을 수 있습니다.

**실생활 비유:**
- 햄버거 가게에서 "치즈버거 하나요"라고 주문하면, 주방(Factory)에서 빵 굽고, 패티 익히고, 야채 넣고, 소스 뿌리는 복잡한 과정을 거쳐 완성된 버거를 받습니다
- 당신은 "어떻게 만드는지" 알 필요 없이 "무엇을 원하는지"만 말하면 됩니다

### 핵심 특징

#### 1. 캡슐화 (Encapsulation)

객체 생성의 복잡성을 숨깁니다.

```javascript
// 사용자는 이렇게만 호출
const user = createUser({ name: '홍길동', email: 'hong@example.com' });

// 내부의 복잡한 로직은 모름
function createUser(data) {
  // 1. 데이터 검증
  if (!data.email || !data.email.includes('@')) {
    throw new Error('Invalid email');
  }

  // 2. 기본값 설정
  const id = generateUUID();
  const createdAt = new Date();
  const role = data.role || 'user';

  // 3. 추가 속성 계산
  const displayName = data.displayName || data.name;
  const initials = data.name.split(' ').map(n => n[0]).join('');

  // 4. 객체 반환
  return {
    id,
    name: data.name,
    email: data.email,
    role,
    displayName,
    initials,
    createdAt,
    isActive: true
  };
}
```

#### 2. 일관성 (Consistency)

모든 객체가 동일한 구조를 가집니다.

```javascript
function createTask(title, priority = 'medium') {
  return {
    id: Date.now(),
    title,
    priority,
    status: 'pending',
    createdAt: new Date(),
    completedAt: null,
    // 모든 task는 이 메서드들을 가짐
    complete() {
      this.status = 'completed';
      this.completedAt = new Date();
    },
    cancel() {
      this.status = 'cancelled';
    }
  };
}

// 모든 task가 일관된 인터페이스를 가짐
const task1 = createTask('코드 리뷰');
const task2 = createTask('버그 수정', 'high');

task1.complete(); // 모두 같은 방식으로 작동
task2.complete();
```

#### 3. 유연성 (Flexibility)

조건에 따라 다른 타입의 객체를 생성할 수 있습니다.

```javascript
function createAnimal(type, name) {
  const base = {
    name,
    type,
    eat() {
      console.log(`${this.name}이 먹이를 먹습니다.`);
    }
  };

  // 타입에 따라 다른 속성과 메서드 추가
  if (type === 'dog') {
    return {
      ...base,
      breed: 'Unknown',
      bark() {
        console.log(`${this.name}: 멍멍!`);
      }
    };
  } else if (type === 'cat') {
    return {
      ...base,
      furColor: 'Unknown',
      meow() {
        console.log(`${this.name}: 야옹~`);
      }
    };
  } else if (type === 'bird') {
    return {
      ...base,
      canFly: true,
      chirp() {
        console.log(`${this.name}: 짹짹!`);
      }
    };
  }

  return base;
}

const dog = createAnimal('dog', '뭉치');
dog.bark(); // "뭉치: 멍멍!"

const cat = createAnimal('cat', '나비');
cat.meow(); // "나비: 야옹~"
```

## Factory Pattern의 동작 원리

### 기본 구조 이해하기

Factory Pattern의 동작 과정을 시각적으로 이해해봅시다.

```
사용자 코드
    ↓
    ↓ createProduct({ name: '노트북', price: 1000000 })
    ↓
Factory Function
    ├─ 1. 입력 검증
    ├─ 2. 기본값 설정
    ├─ 3. 추가 속성 계산
    ├─ 4. 메서드 추가
    └─ 5. 완성된 객체 반환
    ↓
    ↓ { id, name, price, finalPrice, displayPrice, ... }
    ↓
사용자 코드
```

### 단계별 분해

```javascript
function createProduct(data) {
  // === 1단계: 입력 검증 ===
  if (!data.name || !data.price) {
    throw new Error('Name and price are required');
  }

  if (data.price < 0) {
    throw new Error('Price must be positive');
  }

  // === 2단계: 기본값 설정 ===
  const id = data.id || generateId();
  const discount = data.discount || 0;
  const category = data.category || 'general';

  // === 3단계: 추가 속성 계산 ===
  const finalPrice = Math.floor(data.price * (1 - discount));
  const isOnSale = discount > 0;
  const displayPrice = formatCurrency(finalPrice);
  const savings = data.price - finalPrice;

  // === 4단계: 객체 생성 ===
  const product = {
    id,
    name: data.name,
    price: data.price,
    category,
    discount,
    finalPrice,
    isOnSale,
    displayPrice,
    savings,
    createdAt: new Date()
  };

  // === 5단계: 메서드 추가 ===
  product.applyDiscount = function(extraDiscount) {
    return createProduct({
      ...data,
      discount: Math.min(discount + extraDiscount, 0.9) // 최대 90% 할인
    });
  };

  product.toString = function() {
    return `${this.name} - ${this.displayPrice}`;
  };

  // === 6단계: 반환 ===
  return product;
}

// 헬퍼 함수들
function generateId() {
  return `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function formatCurrency(price) {
  return price.toLocaleString('ko-KR') + '원';
}
```

### 내부 동작 추적하기

```javascript
// 디버깅을 위한 추적 기능 추가
function createProductWithLogging(data) {
  console.log('1️⃣ Factory 호출됨:', data);

  if (!data.name || !data.price) {
    console.error('❌ 검증 실패: 필수 필드 누락');
    throw new Error('Name and price are required');
  }
  console.log('✅ 검증 통과');

  const id = data.id || generateId();
  console.log('2️⃣ ID 생성:', id);

  const finalPrice = Math.floor(data.price * (1 - (data.discount || 0)));
  console.log('3️⃣ 가격 계산:', {
    original: data.price,
    discount: data.discount || 0,
    final: finalPrice
  });

  const product = {
    id,
    name: data.name,
    price: data.price,
    finalPrice,
    displayPrice: formatCurrency(finalPrice)
  };

  console.log('4️⃣ 객체 생성 완료:', product);
  return product;
}

// 실행 예시
const product = createProductWithLogging({
  name: '노트북',
  price: 1000000,
  discount: 0.1
});

// 콘솔 출력:
// 1️⃣ Factory 호출됨: { name: '노트북', price: 1000000, discount: 0.1 }
// ✅ 검증 통과
// 2️⃣ ID 생성: prod_1234567890_abc123xyz
// 3️⃣ 가격 계산: { original: 1000000, discount: 0.1, final: 900000 }
// 4️⃣ 객체 생성 완료: { id: '...', name: '노트북', ... }
```

## 다양한 Factory Pattern 형태

Factory Pattern은 상황에 따라 여러 형태로 구현할 수 있습니다.

### 1. Simple Factory (간단한 팩토리)

가장 기본적인 형태입니다.

```javascript
// 간단한 함수 형태
function createUser(name, email) {
  return {
    id: generateId(),
    name,
    email,
    createdAt: new Date(),
    isActive: true,
    greet() {
      return `안녕하세요, ${this.name}입니다.`;
    }
  };
}

const user = createUser('홍길동', 'hong@example.com');
```

**장점:**
- 구현이 간단
- 이해하기 쉬움
- 작은 프로젝트에 적합

**단점:**
- 복잡한 생성 로직에는 부적합
- 확장성이 제한적

### 2. Factory Object (객체 형태 팩토리)

관련된 여러 팩토리 함수를 객체로 묶습니다.

```javascript
const UserFactory = {
  create(name, email, role = 'user') {
    const base = {
      id: generateId(),
      name,
      email,
      role,
      createdAt: new Date(),
      isActive: true
    };

    // role에 따라 다른 권한 추가
    if (role === 'admin') {
      base.permissions = ['read', 'write', 'delete', 'manage'];
      base.canManageUsers = true;
    } else if (role === 'moderator') {
      base.permissions = ['read', 'write', 'moderate'];
      base.canModerate = true;
    } else {
      base.permissions = ['read'];
    }

    return base;
  },

  createAdmin(name, email) {
    return this.create(name, email, 'admin');
  },

  createModerator(name, email) {
    return this.create(name, email, 'moderator');
  },

  createGuest() {
    return {
      id: 'guest',
      name: 'Guest',
      email: null,
      role: 'guest',
      permissions: ['read'],
      isActive: true,
      createdAt: new Date()
    };
  }
};

// 사용
const admin = UserFactory.createAdmin('관리자', 'admin@example.com');
const user = UserFactory.create('홍길동', 'hong@example.com');
const guest = UserFactory.createGuest();

console.log(admin.canManageUsers); // true
console.log(user.permissions);     // ['read']
```

**장점:**
- 관련 팩토리 메서드를 그룹화
- 네임스페이스 제공
- 편의 메서드 추가 가능

### 3. Factory Class (클래스 형태 팩토리)

클래스를 사용한 더 구조화된 방식입니다.

```javascript
class VehicleFactory {
  constructor() {
    this.vehicleCount = 0;
  }

  createVehicle(type, options) {
    this.vehicleCount++;

    const baseVehicle = {
      id: this.vehicleCount,
      type,
      color: options.color || 'white',
      year: options.year || new Date().getFullYear(),
      createdAt: new Date()
    };

    switch (type) {
      case 'car':
        return {
          ...baseVehicle,
          doors: options.doors || 4,
          engine: options.engine || 'gasoline',
          drive() {
            console.log(`${this.color} 자동차가 달립니다.`);
          }
        };

      case 'motorcycle':
        return {
          ...baseVehicle,
          engineSize: options.engineSize || 125,
          hasSideCar: options.hasSideCar || false,
          ride() {
            console.log(`${this.color} 오토바이를 탑니다.`);
          }
        };

      case 'truck':
        return {
          ...baseVehicle,
          capacity: options.capacity || 1000,
          axles: options.axles || 2,
          loadCargo(weight) {
            if (weight <= this.capacity) {
              console.log(`${weight}kg 화물을 실었습니다.`);
            } else {
              console.log(`용량 초과! 최대 ${this.capacity}kg만 실을 수 있습니다.`);
            }
          }
        };

      default:
        throw new Error(`Unknown vehicle type: ${type}`);
    }
  }

  getStats() {
    return {
      totalVehiclesCreated: this.vehicleCount
    };
  }
}

// 사용
const factory = new VehicleFactory();

const car = factory.createVehicle('car', { color: 'red', doors: 2 });
const motorcycle = factory.createVehicle('motorcycle', { engineSize: 250 });
const truck = factory.createVehicle('truck', { capacity: 5000 });

car.drive();              // "red 자동차가 달립니다."
motorcycle.ride();        // "white 오토바이를 탑니다."
truck.loadCargo(3000);   // "3000kg 화물을 실었습니다."

console.log(factory.getStats()); // { totalVehiclesCreated: 3 }
```

**장점:**
- 상태 관리 가능 (vehicleCount 등)
- 인스턴스 메서드 활용
- OOP 패러다임과 잘 맞음

### 4. Abstract Factory (추상 팩토리)

관련된 객체 그룹을 만들 수 있는 상위 레벨 팩토리입니다.

```javascript
// UI 컴포넌트를 테마별로 만드는 예제
function createUIFactory(theme) {
  if (theme === 'dark') {
    return {
      createButton(text) {
        return {
          text,
          backgroundColor: '#333',
          textColor: '#fff',
          border: '1px solid #555',
          render() {
            return `<button style="background: ${this.backgroundColor}; color: ${this.textColor}; border: ${this.border}">${this.text}</button>`;
          }
        };
      },

      createInput(placeholder) {
        return {
          placeholder,
          backgroundColor: '#222',
          textColor: '#fff',
          border: '1px solid #444',
          render() {
            return `<input placeholder="${this.placeholder}" style="background: ${this.backgroundColor}; color: ${this.textColor}; border: ${this.border}">`;
          }
        };
      }
    };
  } else if (theme === 'light') {
    return {
      createButton(text) {
        return {
          text,
          backgroundColor: '#fff',
          textColor: '#000',
          border: '1px solid #ddd',
          render() {
            return `<button style="background: ${this.backgroundColor}; color: ${this.textColor}; border: ${this.border}">${this.text}</button>`;
          }
        };
      },

      createInput(placeholder) {
        return {
          placeholder,
          backgroundColor: '#fff',
          textColor: '#000',
          border: '1px solid #ccc',
          render() {
            return `<input placeholder="${this.placeholder}" style="background: ${this.backgroundColor}; color: ${this.textColor}; border: ${this.border}">`;
          }
        };
      }
    };
  }
}

// 사용
const darkFactory = createUIFactory('dark');
const lightFactory = createUIFactory('light');

const darkButton = darkFactory.createButton('클릭');
const darkInput = darkFactory.createInput('검색...');

const lightButton = lightFactory.createButton('클릭');
const lightInput = lightFactory.createInput('검색...');

console.log(darkButton.render());  // 다크 테마 버튼 HTML
console.log(lightButton.render()); // 라이트 테마 버튼 HTML
```

**장점:**
- 일관된 테마/스타일 적용
- 관련 객체들을 함께 생성
- 테마 전환이 쉬움

### 5. Builder Pattern과 결합

복잡한 객체를 단계적으로 구성할 때 유용합니다.

```javascript
function createQueryBuilder() {
  const query = {
    table: null,
    columns: ['*'],
    whereConditions: [],
    orderBy: null,
    limit: null
  };

  return {
    from(table) {
      query.table = table;
      return this;
    },

    select(...columns) {
      query.columns = columns;
      return this;
    },

    where(condition) {
      query.whereConditions.push(condition);
      return this;
    },

    orderBy(column, direction = 'ASC') {
      query.orderBy = { column, direction };
      return this;
    },

    limit(count) {
      query.limit = count;
      return this;
    },

    build() {
      if (!query.table) {
        throw new Error('Table name is required');
      }

      let sql = `SELECT ${query.columns.join(', ')} FROM ${query.table}`;

      if (query.whereConditions.length > 0) {
        sql += ` WHERE ${query.whereConditions.join(' AND ')}`;
      }

      if (query.orderBy) {
        sql += ` ORDER BY ${query.orderBy.column} ${query.orderBy.direction}`;
      }

      if (query.limit) {
        sql += ` LIMIT ${query.limit}`;
      }

      return sql + ';';
    }
  };
}

// 사용
const query = createQueryBuilder()
  .from('users')
  .select('id', 'name', 'email')
  .where('age > 18')
  .where('isActive = true')
  .orderBy('createdAt', 'DESC')
  .limit(10)
  .build();

console.log(query);
// "SELECT id, name, email FROM users WHERE age > 18 AND isActive = true ORDER BY createdAt DESC LIMIT 10;"
```

**장점:**
- 가독성이 높음 (메서드 체이닝)
- 복잡한 객체를 단계적으로 구성
- 유연하고 확장 가능

## 실전 예제로 배우기

### 예제 1: HTTP 요청 객체 팩토리

실무에서 가장 흔하게 사용하는 패턴입니다.

```javascript
const RequestFactory = {
  create(config) {
    const {
      url,
      method = 'GET',
      headers = {},
      body = null,
      timeout = 5000,
      retry = 0
    } = config;

    // 기본 헤더 설정
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    const request = {
      url,
      method: method.toUpperCase(),
      headers: { ...defaultHeaders, ...headers },
      body: body ? JSON.stringify(body) : null,
      timeout,
      retry,
      timestamp: Date.now(),

      async execute() {
        let attempts = 0;

        while (attempts <= this.retry) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(this.url, {
              method: this.method,
              headers: this.headers,
              body: this.body,
              signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
          } catch (error) {
            attempts++;

            if (attempts > this.retry) {
              throw new Error(`Request failed after ${attempts} attempts: ${error.message}`);
            }

            // 재시도 전 대기 (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts)));
          }
        }
      },

      clone() {
        return RequestFactory.create({
          url: this.url,
          method: this.method,
          headers: this.headers,
          body: this.body ? JSON.parse(this.body) : null,
          timeout: this.timeout,
          retry: this.retry
        });
      },

      withHeaders(newHeaders) {
        const cloned = this.clone();
        cloned.headers = { ...cloned.headers, ...newHeaders };
        return cloned;
      }
    };

    return request;
  },

  get(url, config = {}) {
    return this.create({ ...config, url, method: 'GET' });
  },

  post(url, body, config = {}) {
    return this.create({ ...config, url, method: 'POST', body });
  },

  put(url, body, config = {}) {
    return this.create({ ...config, url, method: 'PUT', body });
  },

  delete(url, config = {}) {
    return this.create({ ...config, url, method: 'DELETE' });
  }
};

// 사용 예시
async function fetchUserProfile(userId) {
  const request = RequestFactory.get(`/api/users/${userId}`, {
    timeout: 3000,
    retry: 2
  });

  // 인증 토큰 추가
  const authRequest = request.withHeaders({
    'Authorization': `Bearer ${getToken()}`
  });

  return authRequest.execute();
}

async function updateUserProfile(userId, data) {
  const request = RequestFactory.put(`/api/users/${userId}`, data, {
    retry: 1
  });

  return request.execute();
}
```

### 예제 2: Form Validation Factory

폼 검증 규칙을 쉽게 만들고 조합할 수 있습니다.

```javascript
const ValidationFactory = {
  required(message = '필수 입력 항목입니다.') {
    return {
      type: 'required',
      message,
      validate(value) {
        if (value === null || value === undefined || value === '') {
          return { valid: false, message: this.message };
        }
        return { valid: true };
      }
    };
  },

  minLength(length, message) {
    return {
      type: 'minLength',
      length,
      message: message || `최소 ${length}자 이상 입력해주세요.`,
      validate(value) {
        if (value.length < this.length) {
          return { valid: false, message: this.message };
        }
        return { valid: true };
      }
    };
  },

  maxLength(length, message) {
    return {
      type: 'maxLength',
      length,
      message: message || `최대 ${length}자까지 입력 가능합니다.`,
      validate(value) {
        if (value.length > this.length) {
          return { valid: false, message: this.message };
        }
        return { valid: true };
      }
    };
  },

  pattern(regex, message = '형식이 올바르지 않습니다.') {
    return {
      type: 'pattern',
      regex,
      message,
      validate(value) {
        if (!this.regex.test(value)) {
          return { valid: false, message: this.message };
        }
        return { valid: true };
      }
    };
  },

  email(message = '올바른 이메일 주소를 입력해주세요.') {
    return this.pattern(
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message
    );
  },

  phone(message = '올바른 전화번호를 입력해주세요.') {
    return this.pattern(
      /^01[0-9]-?[0-9]{4}-?[0-9]{4}$/,
      message
    );
  },

  custom(validatorFn, message = '유효하지 않은 값입니다.') {
    return {
      type: 'custom',
      message,
      validate(value) {
        const result = validatorFn(value);
        if (result === true) {
          return { valid: true };
        }
        return { valid: false, message: this.message };
      }
    };
  }
};

// 폼 필드 팩토리
function createFormField(name, validators = []) {
  return {
    name,
    value: '',
    validators,
    errors: [],
    touched: false,

    setValue(newValue) {
      this.value = newValue;
      this.validate();
    },

    setTouched() {
      this.touched = true;
      this.validate();
    },

    validate() {
      this.errors = [];

      for (const validator of this.validators) {
        const result = validator.validate(this.value);
        if (!result.valid) {
          this.errors.push(result.message);
        }
      }

      return this.errors.length === 0;
    },

    isValid() {
      return this.errors.length === 0;
    },

    getFirstError() {
      return this.errors[0] || null;
    }
  };
}

// 사용 예시
const emailField = createFormField('email', [
  ValidationFactory.required(),
  ValidationFactory.email()
]);

const passwordField = createFormField('password', [
  ValidationFactory.required(),
  ValidationFactory.minLength(8),
  ValidationFactory.custom(
    (value) => /[A-Z]/.test(value) && /[0-9]/.test(value),
    '비밀번호는 대문자와 숫자를 포함해야 합니다.'
  )
]);

const usernameField = createFormField('username', [
  ValidationFactory.required(),
  ValidationFactory.minLength(3),
  ValidationFactory.maxLength(20)
]);

// 사용
emailField.setValue('invalid-email');
console.log(emailField.errors); // ["올바른 이메일 주소를 입력해주세요."]

emailField.setValue('user@example.com');
console.log(emailField.isValid()); // true

passwordField.setValue('weak');
console.log(passwordField.errors);
// ["최소 8자 이상 입력해주세요.", "비밀번호는 대문자와 숫자를 포함해야 합니다."]
```

### 예제 3: 로거 팩토리

다양한 로그 레벨과 포맷을 지원하는 로거를 만듭니다.

```javascript
const LoggerFactory = {
  create(config = {}) {
    const {
      name = 'App',
      level = 'info',
      format = 'text',
      destination = 'console',
      timestamp = true
    } = config;

    const levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };

    const colors = {
      debug: '\x1b[36m',  // Cyan
      info: '\x1b[32m',   // Green
      warn: '\x1b[33m',   // Yellow
      error: '\x1b[31m',  // Red
      reset: '\x1b[0m'
    };

    function shouldLog(logLevel) {
      return levels[logLevel] >= levels[level];
    }

    function formatMessage(logLevel, message, data) {
      const time = timestamp ? new Date().toISOString() : '';

      if (format === 'json') {
        return JSON.stringify({
          timestamp: time,
          level: logLevel,
          logger: name,
          message,
          data
        });
      } else {
        const color = colors[logLevel];
        const reset = colors.reset;
        const timeStr = time ? `[${time}] ` : '';
        const dataStr = data ? ` ${JSON.stringify(data)}` : '';

        return `${color}${timeStr}[${logLevel.toUpperCase()}] [${name}]${reset} ${message}${dataStr}`;
      }
    }

    function output(message) {
      if (destination === 'console') {
        console.log(message);
      } else if (destination === 'file') {
        // 파일에 쓰기 (Node.js 환경)
        // fs.appendFileSync('app.log', message + '\n');
      }
    }

    return {
      name,
      level,

      debug(message, data) {
        if (shouldLog('debug')) {
          output(formatMessage('debug', message, data));
        }
      },

      info(message, data) {
        if (shouldLog('info')) {
          output(formatMessage('info', message, data));
        }
      },

      warn(message, data) {
        if (shouldLog('warn')) {
          output(formatMessage('warn', message, data));
        }
      },

      error(message, data) {
        if (shouldLog('error')) {
          output(formatMessage('error', message, data));
        }
      },

      child(childName) {
        return LoggerFactory.create({
          ...config,
          name: `${name}:${childName}`
        });
      }
    };
  }
};

// 사용 예시
const appLogger = LoggerFactory.create({
  name: 'App',
  level: 'debug',
  format: 'text'
});

const dbLogger = appLogger.child('Database');
const apiLogger = appLogger.child('API');

appLogger.info('애플리케이션 시작');
dbLogger.debug('데이터베이스 연결 시도', { host: 'localhost', port: 5432 });
apiLogger.warn('API 응답 지연', { endpoint: '/users', duration: 3000 });
apiLogger.error('치명적 오류 발생', { error: 'Connection refused' });

// 프로덕션용 JSON 로거
const prodLogger = LoggerFactory.create({
  name: 'Production',
  level: 'warn',
  format: 'json'
});

prodLogger.error('서버 오류', { statusCode: 500, message: 'Internal Server Error' });
```

### 예제 4: State Machine Factory

상태 기계를 쉽게 만들 수 있습니다.

```javascript
function createStateMachine(config) {
  const {
    initialState,
    states,
    transitions
  } = config;

  let currentState = initialState;
  const listeners = [];

  return {
    getCurrentState() {
      return currentState;
    },

    can(transitionName) {
      return transitions[transitionName] &&
             transitions[transitionName].from.includes(currentState);
    },

    transition(transitionName) {
      if (!this.can(transitionName)) {
        throw new Error(
          `Cannot transition '${transitionName}' from state '${currentState}'`
        );
      }

      const transition = transitions[transitionName];
      const previousState = currentState;
      currentState = transition.to;

      // 상태 진입/퇴장 훅 실행
      if (states[previousState]?.onExit) {
        states[previousState].onExit();
      }

      if (states[currentState]?.onEnter) {
        states[currentState].onEnter();
      }

      // 리스너들에게 알림
      listeners.forEach(listener => {
        listener({ from: previousState, to: currentState, transition: transitionName });
      });

      return this;
    },

    onTransition(callback) {
      listeners.push(callback);
      return () => {
        const index = listeners.indexOf(callback);
        if (index > -1) listeners.splice(index, 1);
      };
    },

    is(state) {
      return currentState === state;
    }
  };
}

// 주문 상태 기계 예시
const orderStateMachine = createStateMachine({
  initialState: 'pending',

  states: {
    pending: {
      onEnter() {
        console.log('주문이 접수되었습니다.');
      }
    },
    processing: {
      onEnter() {
        console.log('주문을 처리 중입니다.');
      }
    },
    shipped: {
      onEnter() {
        console.log('주문이 배송되었습니다.');
      }
    },
    delivered: {
      onEnter() {
        console.log('주문이 배송 완료되었습니다.');
      }
    },
    cancelled: {
      onEnter() {
        console.log('주문이 취소되었습니다.');
      }
    }
  },

  transitions: {
    confirm: {
      from: ['pending'],
      to: 'processing'
    },
    ship: {
      from: ['processing'],
      to: 'shipped'
    },
    deliver: {
      from: ['shipped'],
      to: 'delivered'
    },
    cancel: {
      from: ['pending', 'processing'],
      to: 'cancelled'
    }
  }
});

// 사용
orderStateMachine.onTransition((event) => {
  console.log(`상태 전환: ${event.from} → ${event.to}`);
});

console.log(orderStateMachine.getCurrentState()); // 'pending'
console.log(orderStateMachine.can('confirm'));    // true
console.log(orderStateMachine.can('deliver'));    // false

orderStateMachine.transition('confirm');
// "주문을 처리 중입니다."
// "상태 전환: pending → processing"

orderStateMachine.transition('ship');
orderStateMachine.transition('deliver');

// orderStateMachine.transition('cancel'); // Error: 배송 완료 후에는 취소 불가
```

### 예제 5: 알림(Notification) 팩토리

다양한 타입의 알림을 생성합니다.

```javascript
const NotificationFactory = {
  create(type, message, options = {}) {
    const baseNotification = {
      id: generateId(),
      type,
      message,
      timestamp: new Date(),
      read: false,

      markAsRead() {
        this.read = true;
      },

      getAge() {
        const now = Date.now();
        const diff = now - this.timestamp.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}일 전`;
        if (hours > 0) return `${hours}시간 전`;
        if (minutes > 0) return `${minutes}분 전`;
        return '방금 전';
      },

      toHTML() {
        const icon = this.getIcon();
        const color = this.getColor();

        return `
          <div class="notification ${this.type}" style="border-left: 4px solid ${color}">
            <div class="notification-icon">${icon}</div>
            <div class="notification-content">
              <p class="notification-message">${this.message}</p>
              <span class="notification-time">${this.getAge()}</span>
            </div>
          </div>
        `;
      }
    };

    // 타입별 특화 속성 추가
    if (type === 'success') {
      return {
        ...baseNotification,
        duration: options.duration || 3000,
        getIcon() { return '✓'; },
        getColor() { return '#4CAF50'; }
      };
    }

    if (type === 'error') {
      return {
        ...baseNotification,
        duration: options.duration || 5000,
        error: options.error,
        retry: options.retry || null,
        getIcon() { return '✗'; },
        getColor() { return '#F44336'; },
        hasRetry() {
          return typeof this.retry === 'function';
        }
      };
    }

    if (type === 'warning') {
      return {
        ...baseNotification,
        duration: options.duration || 4000,
        action: options.action || null,
        getIcon() { return '⚠'; },
        getColor() { return '#FF9800'; }
      };
    }

    if (type === 'info') {
      return {
        ...baseNotification,
        duration: options.duration || 3000,
        link: options.link || null,
        getIcon() { return 'ℹ'; },
        getColor() { return '#2196F3'; }
      };
    }

    return baseNotification;
  },

  success(message, options) {
    return this.create('success', message, options);
  },

  error(message, error, options = {}) {
    return this.create('error', message, { ...options, error });
  },

  warning(message, options) {
    return this.create('warning', message, options);
  },

  info(message, options) {
    return this.create('info', message, options);
  }
};

// 알림 관리자
class NotificationManager {
  constructor() {
    this.notifications = [];
    this.maxNotifications = 5;
  }

  add(notification) {
    this.notifications.unshift(notification);

    // 최대 개수 제한
    if (this.notifications.length > this.maxNotifications) {
      this.notifications.pop();
    }

    // 자동 제거 (duration이 있는 경우)
    if (notification.duration) {
      setTimeout(() => {
        this.remove(notification.id);
      }, notification.duration);
    }

    return notification;
  }

  remove(id) {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      this.notifications.splice(index, 1);
    }
  }

  clear() {
    this.notifications = [];
  }

  getAll() {
    return this.notifications;
  }

  getUnread() {
    return this.notifications.filter(n => !n.read);
  }
}

// 사용 예시
const manager = new NotificationManager();

// 성공 알림
manager.add(NotificationFactory.success('파일이 성공적으로 업로드되었습니다.'));

// 에러 알림 (재시도 가능)
manager.add(NotificationFactory.error(
  '서버 연결에 실패했습니다.',
  new Error('Connection timeout'),
  {
    retry: () => {
      console.log('재시도 중...');
      // 재시도 로직
    }
  }
));

// 경고 알림 (액션 포함)
manager.add(NotificationFactory.warning(
  '디스크 공간이 부족합니다.',
  {
    action: () => {
      console.log('설정으로 이동');
      // 설정 페이지로 이동
    }
  }
));

// 정보 알림 (링크 포함)
manager.add(NotificationFactory.info(
  '새로운 기능이 추가되었습니다.',
  {
    link: '/whats-new'
  }
));

// 알림 표시
manager.getAll().forEach(notification => {
  console.log(notification.toHTML());
});
```

### 예제 6: 데이터 변환 파이프라인 팩토리

데이터 변환 파이프라인을 쉽게 구성할 수 있습니다.

```javascript
const TransformerFactory = {
  // 필터 변환기
  filter(predicate) {
    return {
      type: 'filter',
      transform(data) {
        return Array.isArray(data) ? data.filter(predicate) : data;
      }
    };
  },

  // 매핑 변환기
  map(mapper) {
    return {
      type: 'map',
      transform(data) {
        return Array.isArray(data) ? data.map(mapper) : mapper(data);
      }
    };
  },

  // 정렬 변환기
  sort(compareFn) {
    return {
      type: 'sort',
      transform(data) {
        return Array.isArray(data) ? [...data].sort(compareFn) : data;
      }
    };
  },

  // 그룹화 변환기
  groupBy(keyFn) {
    return {
      type: 'groupBy',
      transform(data) {
        if (!Array.isArray(data)) return data;

        return data.reduce((groups, item) => {
          const key = keyFn(item);
          if (!groups[key]) {
            groups[key] = [];
          }
          groups[key].push(item);
          return groups;
        }, {});
      }
    };
  },

  // 집계 변환기
  aggregate(reduceFn, initialValue) {
    return {
      type: 'aggregate',
      transform(data) {
        return Array.isArray(data) ? data.reduce(reduceFn, initialValue) : data;
      }
    };
  },

  // 페이지네이션 변환기
  paginate(page, pageSize) {
    return {
      type: 'paginate',
      transform(data) {
        if (!Array.isArray(data)) return data;

        const start = (page - 1) * pageSize;
        const end = start + pageSize;

        return {
          data: data.slice(start, end),
          page,
          pageSize,
          total: data.length,
          totalPages: Math.ceil(data.length / pageSize)
        };
      }
    };
  }
};

// 파이프라인 생성
function createPipeline(...transformers) {
  return {
    transformers,

    process(data) {
      return transformers.reduce((result, transformer) => {
        return transformer.transform(result);
      }, data);
    },

    add(transformer) {
      return createPipeline(...this.transformers, transformer);
    }
  };
}

// 사용 예시
const users = [
  { id: 1, name: '홍길동', age: 25, role: 'admin' },
  { id: 2, name: '김철수', age: 30, role: 'user' },
  { id: 3, name: '이영희', age: 28, role: 'user' },
  { id: 4, name: '박민수', age: 35, role: 'admin' },
  { id: 5, name: '정수진', age: 27, role: 'user' }
];

// 파이프라인 구성
const pipeline = createPipeline(
  TransformerFactory.filter(user => user.age >= 27),
  TransformerFactory.map(user => ({
    ...user,
    displayName: `${user.name} (${user.age}세)`
  })),
  TransformerFactory.sort((a, b) => b.age - a.age)
);

const result = pipeline.process(users);
console.log(result);
// [
//   { id: 4, name: '박민수', age: 35, role: 'admin', displayName: '박민수 (35세)' },
//   { id: 2, name: '김철수', age: 30, role: 'user', displayName: '김철수 (30세)' },
//   { id: 3, name: '이영희', age: 28, role: 'user', displayName: '이영희 (28세)' },
//   { id: 5, name: '정수진', age: 27, role: 'user', displayName: '정수진 (27세)' }
// ]

// 동적으로 변환기 추가
const paginatedPipeline = pipeline.add(
  TransformerFactory.paginate(1, 2)
);

const paginatedResult = paginatedPipeline.process(users);
console.log(paginatedResult);
// {
//   data: [...2개 항목...],
//   page: 1,
//   pageSize: 2,
//   total: 4,
//   totalPages: 2
// }
```

## Factory Pattern vs 다른 방법들

Factory Pattern이 항상 최선은 아닙니다. 상황에 따라 다른 방법이 더 나을 수 있습니다.

### Factory Function vs Constructor Function

```javascript
// === Constructor Function ===
function User(name, email) {
  this.name = name;
  this.email = email;
  this.createdAt = new Date();
}

User.prototype.greet = function() {
  return `안녕하세요, ${this.name}입니다.`;
};

const user1 = new User('홍길동', 'hong@example.com');

// === Factory Function ===
function createUser(name, email) {
  return {
    name,
    email,
    createdAt: new Date(),
    greet() {
      return `안녕하세요, ${this.name}입니다.`;
    }
  };
}

const user2 = createUser('홍길동', 'hong@example.com');
```

**비교:**

| 특징 | Constructor Function | Factory Function |
|------|---------------------|------------------|
| 호출 방식 | `new` 필요 | 일반 함수 호출 |
| 프로토타입 | 자동으로 설정됨 | 수동으로 관리 |
| `instanceof` | 작동함 | 작동 안 함 |
| 메모리 효율 | 메서드 공유 (프로토타입) | 메서드 복사 (일반적으로) |
| 유연성 | 제한적 | 매우 높음 |
| Private 데이터 | 어려움 | 클로저로 쉽게 구현 |

**Constructor Function을 사용하세요:**
- 프로토타입 체인이 필요할 때
- `instanceof` 체크가 필요할 때
- 많은 인스턴스를 생성하고 메모리 효율이 중요할 때
- 전통적인 OOP 패턴을 선호할 때

**Factory Function을 사용하세요:**
- 조건부 객체 생성이 필요할 때
- Private 데이터가 필요할 때
- 복잡한 초기화 로직이 있을 때
- `new` 키워드를 피하고 싶을 때

### Factory Pattern vs Class

```javascript
// === Class ===
class User {
  constructor(name, email) {
    this.name = name;
    this.email = email;
    this.createdAt = new Date();
  }

  greet() {
    return `안녕하세요, ${this.name}입니다.`;
  }

  static create(data) {
    return new User(data.name, data.email);
  }
}

const user1 = new User('홍길동', 'hong@example.com');
const user2 = User.create({ name: '김철수', email: 'kim@example.com' });

// === Factory Pattern ===
const UserFactory = {
  create(data) {
    return {
      name: data.name,
      email: data.email,
      createdAt: new Date(),
      greet() {
        return `안녕하세요, ${this.name}입니다.`;
      }
    };
  },

  createAdmin(data) {
    return {
      ...this.create(data),
      role: 'admin',
      permissions: ['read', 'write', 'delete']
    };
  }
};

const user3 = UserFactory.create({ name: '이영희', email: 'lee@example.com' });
const admin = UserFactory.createAdmin({ name: '관리자', email: 'admin@example.com' });
```

**Class를 사용하세요:**
- 상속이 필요할 때
- TypeScript와 함께 사용할 때
- Private 필드(`#`)가 필요할 때
- 팀이 OOP 패러다임에 익숙할 때
- IDE의 자동완성/타입 체킹을 활용하고 싶을 때

**Factory Pattern을 사용하세요:**
- 런타임에 동적으로 객체 구조를 결정해야 할 때
- 여러 관련 객체를 함께 생성해야 할 때
- 복잡한 초기화 로직을 숨기고 싶을 때
- 객체 풀(Object Pool) 패턴을 구현할 때

### Factory Pattern vs Object Literal

```javascript
// === Object Literal ===
const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3
};

// === Factory Pattern ===
function createConfig(environment) {
  const base = {
    timeout: 5000,
    retries: 3
  };

  if (environment === 'development') {
    return {
      ...base,
      apiUrl: 'http://localhost:3000',
      debug: true
    };
  } else if (environment === 'production') {
    return {
      ...base,
      apiUrl: 'https://api.example.com',
      debug: false,
      logging: true
    };
  }

  return base;
}

const devConfig = createConfig('development');
const prodConfig = createConfig('production');
```

**Object Literal을 사용하세요:**
- 단순한 설정 객체
- 정적인 데이터
- 한 번만 사용되는 객체

**Factory Pattern을 사용하세요:**
- 환경별로 다른 설정이 필요할 때
- 동적으로 계산된 값이 필요할 때
- 여러 번 재사용해야 할 때

## 함정과 주의사항

Factory Pattern을 사용할 때 흔히 실수하는 부분들을 알아봅시다.

### 함정 1: 과도한 추상화

```javascript
// ❌ 나쁜 예: 너무 복잡한 Factory
const SuperComplexFactory = {
  create(type, subtype, options, context, metadata, callbacks) {
    // 100줄 이상의 복잡한 로직...

    if (type === 'A') {
      if (subtype === 'A1') {
        if (options.mode === 'advanced') {
          // 더 복잡한 조건들...
        }
      }
    }
    // 이해하기 어렵고 유지보수하기 힘듦
  }
};

// ✅ 좋은 예: 적절한 수준의 추상화
const UserFactory = {
  create(data) {
    return this.createBase(data);
  },

  createAdmin(data) {
    return {
      ...this.createBase(data),
      role: 'admin',
      permissions: this.getAdminPermissions()
    };
  },

  createBase(data) {
    return {
      id: generateId(),
      name: data.name,
      email: data.email,
      createdAt: new Date()
    };
  },

  getAdminPermissions() {
    return ['read', 'write', 'delete', 'manage'];
  }
};
```

**원칙:**
- Factory가 너무 복잡해지면 여러 개의 작은 Factory로 분리하세요
- 한 Factory는 한 가지 타입의 객체만 생성하게 하세요
- 조건 분기가 너무 깊어지면 Strategy Pattern을 고려하세요

### 함정 2: 메모리 누수

```javascript
// ❌ 나쁜 예: 메서드가 매번 새로 생성됨
function createUser(name) {
  return {
    name,
    greet() {  // 인스턴스마다 새로운 함수 생성!
      return `Hello, ${this.name}`;
    },
    sayGoodbye() {  // 또 새로운 함수!
      return `Goodbye, ${this.name}`;
    }
  };
}

// 1000개의 user를 만들면 2000개의 함수가 생성됨!
const users = Array.from({ length: 1000 }, (_, i) => createUser(`User${i}`));

// ✅ 좋은 예 1: 메서드를 외부에 정의
const userMethods = {
  greet() {
    return `Hello, ${this.name}`;
  },
  sayGoodbye() {
    return `Goodbye, ${this.name}`;
  }
};

function createUser(name) {
  return Object.assign(
    { name },
    userMethods
  );
}

// ✅ 좋은 예 2: Constructor Function 사용
function User(name) {
  this.name = name;
}

User.prototype.greet = function() {
  return `Hello, ${this.name}`;
};

User.prototype.sayGoodbye = function() {
  return `Goodbye, ${this.name}`;
};
```

**원칙:**
- 많은 인스턴스를 생성한다면 메서드 공유를 고려하세요
- 프로토타입이나 Object.assign을 활용하세요
- 성능이 중요하다면 Constructor Function이나 Class를 고려하세요

### 함정 3: 불변성 문제

```javascript
// ❌ 나쁜 예: 기본값 객체가 공유됨
const defaultOptions = {
  colors: ['red', 'blue'],
  settings: { theme: 'dark' }
};

function createConfig(options = {}) {
  return {
    ...defaultOptions,  // 얕은 복사!
    ...options
  };
}

const config1 = createConfig();
const config2 = createConfig();

config1.colors.push('green');  // config2에도 영향!
console.log(config2.colors);   // ['red', 'blue', 'green'] ⚠️

// ✅ 좋은 예: 깊은 복사
function createConfig(options = {}) {
  const defaults = {
    colors: ['red', 'blue'],
    settings: { theme: 'dark' }
  };

  return {
    colors: [...defaults.colors, ...(options.colors || [])],
    settings: { ...defaults.settings, ...options.settings }
  };
}

// 또는 structuredClone 사용 (최신 브라우저)
function createConfig(options = {}) {
  const defaults = {
    colors: ['red', 'blue'],
    settings: { theme: 'dark' }
  };

  return structuredClone({ ...defaults, ...options });
}
```

**원칙:**
- 기본값으로 객체나 배열을 사용할 때는 항상 복사하세요
- 얕은 복사와 깊은 복사의 차이를 이해하세요
- 불변성이 중요하다면 Immutable.js 같은 라이브러리를 고려하세요

### 함정 4: 타입 체크의 어려움

```javascript
// ❌ Factory로 만든 객체는 instanceof가 작동하지 않음
function createDog(name) {
  return {
    name,
    bark() {
      console.log('멍멍!');
    }
  };
}

const dog = createDog('뭉치');
console.log(dog instanceof Dog);  // ReferenceError: Dog is not defined

// ✅ 해결책 1: 타입 필드 추가
function createDog(name) {
  return {
    type: 'Dog',
    name,
    bark() {
      console.log('멍멍!');
    }
  };
}

function isDog(obj) {
  return obj && obj.type === 'Dog';
}

// ✅ 해결책 2: Symbol 사용 (더 안전)
const DOG_TYPE = Symbol('Dog');

function createDog(name) {
  return {
    [DOG_TYPE]: true,
    name,
    bark() {
      console.log('멍멍!');
    }
  };
}

function isDog(obj) {
  return obj && obj[DOG_TYPE] === true;
}

// ✅ 해결책 3: TypeScript 사용
interface Dog {
  name: string;
  bark(): void;
}

function createDog(name: string): Dog {
  return {
    name,
    bark() {
      console.log('멍멍!');
    }
  };
}
```

### 함정 5: 테스트의 어려움

```javascript
// ❌ 나쁜 예: 테스트하기 어려운 Factory
function createUser(name) {
  return {
    name,
    id: Math.random().toString(36),  // 테스트마다 다름!
    createdAt: new Date(),            // 테스트마다 다름!
    apiClient: new APIClient()        // Mock하기 어려움!
  };
}

// ✅ 좋은 예: 의존성 주입
function createUser(name, dependencies = {}) {
  const {
    idGenerator = () => Math.random().toString(36),
    dateProvider = () => new Date(),
    apiClient = new APIClient()
  } = dependencies;

  return {
    name,
    id: idGenerator(),
    createdAt: dateProvider(),
    apiClient
  };
}

// 테스트 코드
test('createUser should create user with given name', () => {
  const user = createUser('Test User', {
    idGenerator: () => 'test-id',
    dateProvider: () => new Date('2024-01-01'),
    apiClient: mockAPIClient
  });

  expect(user.id).toBe('test-id');
  expect(user.createdAt).toEqual(new Date('2024-01-01'));
});
```

**원칙:**
- 외부 의존성은 주입 가능하게 만드세요
- 난수나 시간 같은 비결정적 값은 모킹 가능하게 하세요
- Pure Function으로 만들 수 있다면 그렇게 하세요

## 실전에서 활용하기

### 실전 1: React 컴포넌트 데이터 준비

```javascript
// API 응답을 React 컴포넌트용 데이터로 변환
const PostFactory = {
  fromAPI(apiData) {
    return {
      id: apiData.id,
      title: apiData.title,
      content: apiData.body,
      author: {
        id: apiData.userId,
        name: apiData.user?.name || 'Unknown'
      },
      publishedAt: new Date(apiData.created_at),
      displayDate: this.formatDate(apiData.created_at),
      excerpt: this.createExcerpt(apiData.body),
      readTime: this.calculateReadTime(apiData.body),
      tags: apiData.tags || [],
      imageUrl: apiData.featured_image || '/images/default-post.jpg'
    };
  },

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  createExcerpt(content, maxLength = 150) {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
  },

  calculateReadTime(content) {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes}분 읽기`;
  }
};

// React 컴포넌트에서 사용
function PostList() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch('/api/posts')
      .then(res => res.json())
      .then(data => {
        // API 데이터를 컴포넌트용 형식으로 변환
        const formattedPosts = data.map(PostFactory.fromAPI);
        setPosts(formattedPosts);
      });
  }, []);

  return (
    <div>
      {posts.map(post => (
        <PostCard key={post.id} {...post} />
      ))}
    </div>
  );
}
```

### 실전 2: 폼 상태 관리

```javascript
// 복잡한 폼 상태를 관리하는 Factory
function createFormField(config) {
  const {
    name,
    initialValue = '',
    validators = [],
    formatter = (v) => v,
    parser = (v) => v
  } = config;

  let value = initialValue;
  let errors = [];
  let touched = false;
  let dirty = false;
  const listeners = [];

  return {
    get name() { return name; },
    get value() { return value; },
    get errors() { return errors; },
    get touched() { return touched; },
    get dirty() { return dirty; },
    get valid() { return errors.length === 0; },

    setValue(newValue) {
      const parsed = parser(newValue);
      if (parsed !== value) {
        value = parsed;
        dirty = true;
        this.validate();
        this.notify();
      }
    },

    setTouched(isTouched = true) {
      if (touched !== isTouched) {
        touched = isTouched;
        if (isTouched) {
          this.validate();
        }
        this.notify();
      }
    },

    validate() {
      errors = [];

      for (const validator of validators) {
        const result = validator(value);
        if (result !== true) {
          errors.push(result);
        }
      }

      return errors.length === 0;
    },

    reset() {
      value = initialValue;
      errors = [];
      touched = false;
      dirty = false;
      this.notify();
    },

    getFormattedValue() {
      return formatter(value);
    },

    onChange(listener) {
      listeners.push(listener);
      return () => {
        const index = listeners.indexOf(listener);
        if (index > -1) listeners.splice(index, 1);
      };
    },

    notify() {
      listeners.forEach(listener => listener(this));
    }
  };
}

// 사용 예시
const emailField = createFormField({
  name: 'email',
  validators: [
    (value) => value.length > 0 || '이메일을 입력해주세요',
    (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || '올바른 이메일 형식이 아닙니다'
  ]
});

const phoneField = createFormField({
  name: 'phone',
  parser: (value) => value.replace(/[^0-9]/g, ''),
  formatter: (value) => {
    if (value.length === 11) {
      return `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7)}`;
    }
    return value;
  },
  validators: [
    (value) => value.length === 11 || '11자리 전화번호를 입력해주세요'
  ]
});

// React Hook으로 감싸기
function useFormField(config) {
  const [field] = useState(() => createFormField(config));
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  useEffect(() => {
    return field.onChange(() => forceUpdate());
  }, [field]);

  return field;
}

// React 컴포넌트에서 사용
function SignupForm() {
  const email = useFormField({
    name: 'email',
    validators: [
      (value) => value.length > 0 || '이메일을 입력해주세요',
      (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || '올바른 이메일이 아닙니다'
    ]
  });

  const phone = useFormField({
    name: 'phone',
    parser: (value) => value.replace(/[^0-9]/g, ''),
    formatter: (value) => {
      if (value.length === 11) {
        return `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7)}`;
      }
      return value;
    }
  });

  return (
    <form>
      <div>
        <input
          value={email.value}
          onChange={(e) => email.setValue(e.target.value)}
          onBlur={() => email.setTouched()}
        />
        {email.touched && email.errors.map((error, i) => (
          <span key={i} className="error">{error}</span>
        ))}
      </div>

      <div>
        <input
          value={phone.getFormattedValue()}
          onChange={(e) => phone.setValue(e.target.value)}
          onBlur={() => phone.setTouched()}
        />
        {phone.touched && phone.errors.map((error, i) => (
          <span key={i} className="error">{error}</span>
        ))}
      </div>
    </form>
  );
}
```

### 실전 3: 에러 처리 표준화

```javascript
// 일관된 에러 객체를 생성하는 Factory
const ErrorFactory = {
  create(type, message, details = {}) {
    const error = new Error(message);
    error.type = type;
    error.timestamp = new Date();
    error.details = details;

    // 에러 타입별 추가 속성
    if (type === 'ValidationError') {
      error.statusCode = 400;
      error.fields = details.fields || {};
    } else if (type === 'AuthenticationError') {
      error.statusCode = 401;
      error.requiresLogin = true;
    } else if (type === 'AuthorizationError') {
      error.statusCode = 403;
      error.requiredPermission = details.permission;
    } else if (type === 'NotFoundError') {
      error.statusCode = 404;
      error.resource = details.resource;
    } else if (type === 'ServerError') {
      error.statusCode = 500;
      error.originalError = details.originalError;
    }

    // 사용자 친화적 메시지
    error.getUserMessage = function() {
      const messages = {
        ValidationError: '입력하신 정보를 확인해주세요.',
        AuthenticationError: '로그인이 필요합니다.',
        AuthorizationError: '권한이 없습니다.',
        NotFoundError: '요청하신 정보를 찾을 수 없습니다.',
        ServerError: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      };
      return messages[this.type] || '오류가 발생했습니다.';
    };

    // 로깅용 직렬화
    error.toJSON = function() {
      return {
        type: this.type,
        message: this.message,
        statusCode: this.statusCode,
        timestamp: this.timestamp,
        details: this.details
      };
    };

    return error;
  },

  validation(message, fields) {
    return this.create('ValidationError', message, { fields });
  },

  authentication(message) {
    return this.create('AuthenticationError', message);
  },

  authorization(message, permission) {
    return this.create('AuthorizationError', message, { permission });
  },

  notFound(resource, id) {
    return this.create(
      'NotFoundError',
      `${resource} not found`,
      { resource, id }
    );
  },

  server(message, originalError) {
    return this.create('ServerError', message, { originalError });
  }
};

// Express.js 미들웨어에서 사용
app.get('/api/users/:id', async (req, res, next) => {
  try {
    const user = await getUserById(req.params.id);

    if (!user) {
      throw ErrorFactory.notFound('User', req.params.id);
    }

    if (!req.user.canView(user)) {
      throw ErrorFactory.authorization('Cannot view this user', 'user:view');
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// 에러 핸들러 미들웨어
app.use((error, req, res, next) => {
  // ErrorFactory로 생성된 에러인지 확인
  if (error.toJSON) {
    // 로깅
    logger.error(error.toJSON());

    // 클라이언트에 응답
    res.status(error.statusCode || 500).json({
      error: {
        type: error.type,
        message: error.getUserMessage(),
        details: error.details
      }
    });
  } else {
    // 예상치 못한 에러
    logger.error('Unexpected error:', error);
    res.status(500).json({
      error: {
        type: 'ServerError',
        message: '서버 오류가 발생했습니다.'
      }
    });
  }
});
```

### 실전 4: 테스트 데이터 생성

```javascript
// 테스트용 Mock 데이터를 쉽게 생성
const TestDataFactory = {
  user(overrides = {}) {
    const defaults = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
      createdAt: new Date('2024-01-01'),
      isActive: true
    };

    return { ...defaults, ...overrides };
  },

  admin(overrides = {}) {
    return this.user({
      role: 'admin',
      permissions: ['read', 'write', 'delete', 'manage'],
      ...overrides
    });
  },

  post(overrides = {}) {
    const defaults = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'Test Post',
      content: 'This is a test post content.',
      authorId: this.user().id,
      createdAt: new Date('2024-01-01'),
      published: true,
      tags: ['test']
    };

    return { ...defaults, ...overrides };
  },

  comment(overrides = {}) {
    const defaults = {
      id: Math.random().toString(36).substr(2, 9),
      content: 'Test comment',
      authorId: this.user().id,
      postId: this.post().id,
      createdAt: new Date('2024-01-01')
    };

    return { ...defaults, ...overrides };
  },

  // 연관된 데이터를 함께 생성
  userWithPosts(postCount = 3) {
    const user = this.user();
    const posts = Array.from({ length: postCount }, (_, i) =>
      this.post({
        authorId: user.id,
        title: `Post ${i + 1}`,
        createdAt: new Date(2024, 0, i + 1)
      })
    );

    return { user, posts };
  },

  postWithComments(commentCount = 5) {
    const post = this.post();
    const comments = Array.from({ length: commentCount }, (_, i) =>
      this.comment({
        postId: post.id,
        content: `Comment ${i + 1}`,
        createdAt: new Date(2024, 0, 1, i)
      })
    );

    return { post, comments };
  }
};

// 테스트 코드에서 사용
describe('User Service', () => {
  test('should create user', () => {
    const userData = TestDataFactory.user({
      name: 'John Doe',
      email: 'john@example.com'
    });

    const user = UserService.create(userData);
    expect(user.name).toBe('John Doe');
  });

  test('should get user posts', () => {
    const { user, posts } = TestDataFactory.userWithPosts(5);

    // Mock database
    db.users.insert(user);
    posts.forEach(post => db.posts.insert(post));

    const userPosts = PostService.getByUser(user.id);
    expect(userPosts).toHaveLength(5);
  });
});
```

### 실전 5: 설정 객체 관리

```javascript
// 환경별 설정을 관리하는 Factory
function createAppConfig(environment) {
  const base = {
    appName: 'My App',
    version: '1.0.0',
    features: {
      analytics: true,
      notifications: true
    }
  };

  const configs = {
    development: {
      ...base,
      apiUrl: 'http://localhost:3000',
      debug: true,
      logLevel: 'debug',
      features: {
        ...base.features,
        devTools: true,
        mockData: true
      },
      database: {
        host: 'localhost',
        port: 5432,
        name: 'myapp_dev'
      }
    },

    staging: {
      ...base,
      apiUrl: 'https://staging-api.example.com',
      debug: true,
      logLevel: 'info',
      features: {
        ...base.features,
        devTools: true
      },
      database: {
        host: 'staging-db.example.com',
        port: 5432,
        name: 'myapp_staging'
      }
    },

    production: {
      ...base,
      apiUrl: 'https://api.example.com',
      debug: false,
      logLevel: 'error',
      features: {
        ...base.features,
        analytics: true,
        errorReporting: true
      },
      database: {
        host: 'prod-db.example.com',
        port: 5432,
        name: 'myapp_prod'
      }
    }
  };

  const config = configs[environment] || configs.development;

  // 환경변수로 오버라이드 가능
  if (process.env.API_URL) {
    config.apiUrl = process.env.API_URL;
  }

  // 읽기 전용으로 만들기
  return Object.freeze(config);
}

// 사용
const config = createAppConfig(process.env.NODE_ENV);

console.log(config.apiUrl);      // 환경에 따라 다름
console.log(config.debug);       // 환경에 따라 다름
console.log(config.features);    // 환경에 따라 다름

// config.apiUrl = 'hacked'; // TypeError: Cannot assign to read only property
```

## 성능과 메모리 최적화

Factory Pattern을 사용할 때 성능을 고려해야 할 상황들입니다.

### 1. Object Pool Pattern

객체 생성 비용이 높을 때, 재사용 가능한 객체 풀을 만듭니다.

```javascript
class ObjectPool {
  constructor(factory, initialSize = 10) {
    this.factory = factory;
    this.available = [];
    this.inUse = new Set();

    // 초기 객체 생성
    for (let i = 0; i < initialSize; i++) {
      this.available.push(this.factory.create());
    }
  }

  acquire() {
    let obj;

    if (this.available.length > 0) {
      obj = this.available.pop();
    } else {
      obj = this.factory.create();
    }

    this.inUse.add(obj);
    return obj;
  }

  release(obj) {
    if (this.inUse.has(obj)) {
      this.inUse.delete(obj);

      // 객체 초기화
      if (this.factory.reset) {
        this.factory.reset(obj);
      }

      this.available.push(obj);
    }
  }

  getStats() {
    return {
      available: this.available.length,
      inUse: this.inUse.size,
      total: this.available.length + this.inUse.size
    };
  }
}

// 무거운 객체 Factory
const ParticleFactory = {
  create() {
    return {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 1.0,
      color: '#ffffff',
      size: 1
    };
  },

  reset(particle) {
    particle.x = 0;
    particle.y = 0;
    particle.vx = 0;
    particle.vy = 0;
    particle.life = 1.0;
    particle.color = '#ffffff';
    particle.size = 1;
  }
};

// 사용
const particlePool = new ObjectPool(ParticleFactory, 100);

function createExplosion(x, y) {
  const particles = [];

  // 풀에서 파티클 가져오기
  for (let i = 0; i < 50; i++) {
    const particle = particlePool.acquire();
    particle.x = x;
    particle.y = y;
    particle.vx = (Math.random() - 0.5) * 10;
    particle.vy = (Math.random() - 0.5) * 10;
    particles.push(particle);
  }

  return particles;
}

function updateParticles(particles) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const particle = particles[i];
    particle.life -= 0.01;

    if (particle.life <= 0) {
      // 풀에 반환
      particlePool.release(particle);
      particles.splice(i, 1);
    }
  }
}
```

### 2. 지연 초기화 (Lazy Initialization)

필요할 때만 객체를 생성합니다.

```javascript
const LazyFactory = {
  _cache: new Map(),

  get(key, creator) {
    if (!this._cache.has(key)) {
      console.log(`Creating ${key}...`);
      this._cache.set(key, creator());
    } else {
      console.log(`Using cached ${key}...`);
    }
    return this._cache.get(key);
  },

  clear() {
    this._cache.clear();
  }
};

// 무거운 객체들
const HeavyResources = {
  getDatabase() {
    return LazyFactory.get('database', () => {
      console.log('Connecting to database...');
      return {
        connection: 'db-connection',
        query: (sql) => console.log('Executing:', sql)
      };
    });
  },

  getCache() {
    return LazyFactory.get('cache', () => {
      console.log('Initializing cache...');
      return new Map();
    });
  },

  getLogger() {
    return LazyFactory.get('logger', () => {
      console.log('Setting up logger...');
      return {
        log: (msg) => console.log('[LOG]', msg)
      };
    });
  }
};

// 사용 - 필요할 때만 생성됨
const db = HeavyResources.getDatabase();  // "Connecting to database..."
const db2 = HeavyResources.getDatabase(); // "Using cached database..."
```

### 3. Flyweight Pattern

많은 수의 유사한 객체를 공유하여 메모리를 절약합니다.

```javascript
// 공유 가능한 부분 (Intrinsic state)
class CharacterStyle {
  constructor(font, size, color) {
    this.font = font;
    this.size = size;
    this.color = color;
  }
}

// Flyweight Factory
const StyleFactory = {
  _styles: new Map(),

  getStyle(font, size, color) {
    const key = `${font}-${size}-${color}`;

    if (!this._styles.has(key)) {
      this._styles.set(key, new CharacterStyle(font, size, color));
    }

    return this._styles.get(key);
  },

  getStyleCount() {
    return this._styles.size;
  }
};

// 개별 문자 (Extrinsic state)
class Character {
  constructor(char, style) {
    this.char = char;
    this.style = style;  // 공유되는 스타일 객체
  }

  render(x, y) {
    console.log(
      `Drawing '${this.char}' at (${x},${y}) ` +
      `with ${this.style.font} ${this.style.size}px ${this.style.color}`
    );
  }
}

// 문서
class Document {
  constructor() {
    this.characters = [];
  }

  addText(text, font, size, color) {
    const style = StyleFactory.getStyle(font, size, color);

    for (const char of text) {
      this.characters.push(new Character(char, style));
    }
  }

  render() {
    let x = 0;
    this.characters.forEach(char => {
      char.render(x, 0);
      x += char.style.size;
    });
  }
}

// 사용
const doc = new Document();
doc.addText('Hello ', 'Arial', 12, 'black');
doc.addText('World', 'Arial', 12, 'black');
doc.addText('!!!', 'Arial', 16, 'red');

console.log(`Total characters: ${doc.characters.length}`);  // 11
console.log(`Unique styles: ${StyleFactory.getStyleCount()}`);  // 2 (많은 메모리 절약!)

doc.render();
```

### 4. 메모이제이션

같은 입력에 대해 캐시된 결과를 반환합니다.

```javascript
function memoize(factory) {
  const cache = new Map();

  return function(...args) {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      console.log('Cache hit!');
      return cache.get(key);
    }

    console.log('Cache miss, creating...');
    const result = factory(...args);
    cache.set(key, result);
    return result;
  };
}

// 복잡한 계산을 하는 Factory
function createComplexObject(config) {
  console.log('Doing expensive calculations...');

  // 복잡한 계산 시뮬레이션
  let result = 0;
  for (let i = 0; i < 1000000; i++) {
    result += Math.sqrt(i);
  }

  return {
    ...config,
    computedValue: result
  };
}

// 메모이제이션 적용
const memoizedFactory = memoize(createComplexObject);

// 사용
const obj1 = memoizedFactory({ id: 1, name: 'test' });
// "Cache miss, creating..."
// "Doing expensive calculations..."

const obj2 = memoizedFactory({ id: 1, name: 'test' });
// "Cache hit!" (즉시 반환)

const obj3 = memoizedFactory({ id: 2, name: 'test' });
// "Cache miss, creating..." (다른 설정)
```

## TypeScript로 타입 안전하게 만들기

TypeScript를 사용하면 Factory Pattern을 더 안전하게 만들 수 있습니다.

### 1. 기본 타입 정의

```typescript
// 사용자 타입 정의
interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'moderator';
  createdAt: Date;
  isActive: boolean;
}

// Factory 함수 타입
type UserFactory = {
  create: (data: Partial<User>) => User;
  createAdmin: (name: string, email: string) => User;
  createGuest: () => User;
};

// Factory 구현
const UserFactory: UserFactory = {
  create(data) {
    return {
      id: data.id || generateId(),
      name: data.name || 'Unknown',
      email: data.email || '',
      role: data.role || 'user',
      createdAt: data.createdAt || new Date(),
      isActive: data.isActive ?? true
    };
  },

  createAdmin(name, email) {
    return this.create({
      name,
      email,
      role: 'admin'
    });
  },

  createGuest() {
    return this.create({
      name: 'Guest',
      role: 'user',
      isActive: false
    });
  }
};

// 사용 - 타입 체크가 작동함
const user = UserFactory.create({
  name: '홍길동',
  email: 'hong@example.com',
  // role: 'invalid' // 컴파일 에러!
});
```

### 2. 제네릭 Factory

```typescript
// 제네릭 Factory 인터페이스
interface Factory<T> {
  create(data?: Partial<T>): T;
}

// Entity 베이스 인터페이스
interface Entity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// 구체적인 엔티티들
interface Post extends Entity {
  title: string;
  content: string;
  authorId: string;
}

interface Comment extends Entity {
  content: string;
  authorId: string;
  postId: string;
}

// 제네릭 Factory 구현
class EntityFactory<T extends Entity> implements Factory<T> {
  constructor(private defaults: Omit<T, keyof Entity>) {}

  create(data?: Partial<T>): T {
    return {
      ...this.defaults,
      ...data,
      id: (data as any)?.id || generateId(),
      createdAt: (data as any)?.createdAt || new Date(),
      updatedAt: (data as any)?.updatedAt || new Date()
    } as T;
  }
}

// 사용
const postFactory = new EntityFactory<Post>({
  title: '',
  content: '',
  authorId: ''
});

const post = postFactory.create({
  title: 'My Post',
  content: 'Content here',
  authorId: 'user-123'
});

console.log(post.id);        // string
console.log(post.createdAt); // Date
console.log(post.title);     // string
```

### 3. Builder Pattern과 타입 안전성

```typescript
// Builder 인터페이스
interface Builder<T> {
  build(): T;
}

// 제품 타입
interface Product {
  name: string;
  price: number;
  category: string;
  description?: string;
  tags?: string[];
  discount?: number;
  imageUrl?: string;
}

// Builder 클래스
class ProductBuilder implements Builder<Product> {
  private product: Partial<Product> = {};

  setName(name: string): this {
    this.product.name = name;
    return this;
  }

  setPrice(price: number): this {
    if (price < 0) {
      throw new Error('Price must be positive');
    }
    this.product.price = price;
    return this;
  }

  setCategory(category: string): this {
    this.product.category = category;
    return this;
  }

  setDescription(description: string): this {
    this.product.description = description;
    return this;
  }

  setTags(...tags: string[]): this {
    this.product.tags = tags;
    return this;
  }

  setDiscount(discount: number): this {
    if (discount < 0 || discount > 1) {
      throw new Error('Discount must be between 0 and 1');
    }
    this.product.discount = discount;
    return this;
  }

  setImageUrl(url: string): this {
    this.product.imageUrl = url;
    return this;
  }

  build(): Product {
    // 필수 필드 검증
    if (!this.product.name || !this.product.price || !this.product.category) {
      throw new Error('Missing required fields: name, price, category');
    }

    return this.product as Product;
  }
}

// Factory에서 Builder 사용
const ProductFactory = {
  builder(): ProductBuilder {
    return new ProductBuilder();
  },

  createBasic(name: string, price: number, category: string): Product {
    return this.builder()
      .setName(name)
      .setPrice(price)
      .setCategory(category)
      .build();
  },

  createWithDiscount(
    name: string,
    price: number,
    category: string,
    discount: number
  ): Product {
    return this.builder()
      .setName(name)
      .setPrice(price)
      .setCategory(category)
      .setDiscount(discount)
      .build();
  }
};

// 사용
const product1 = ProductFactory.builder()
  .setName('노트북')
  .setPrice(1500000)
  .setCategory('electronics')
  .setDescription('고성능 노트북')
  .setTags('laptop', 'computer', 'electronics')
  .setDiscount(0.1)
  .build();

const product2 = ProductFactory.createBasic('키보드', 150000, 'electronics');
```

### 4. Discriminated Unions로 타입 안전한 Factory

```typescript
// 다양한 알림 타입
type Notification =
  | { type: 'success'; message: string; duration: number }
  | { type: 'error'; message: string; error: Error; retry?: () => void }
  | { type: 'warning'; message: string; action?: () => void }
  | { type: 'info'; message: string; link?: string };

// Factory 함수들
const NotificationFactory = {
  success(message: string, duration: number = 3000): Extract<Notification, { type: 'success' }> {
    return {
      type: 'success',
      message,
      duration
    };
  },

  error(message: string, error: Error, retry?: () => void): Extract<Notification, { type: 'error' }> {
    return {
      type: 'error',
      message,
      error,
      retry
    };
  },

  warning(message: string, action?: () => void): Extract<Notification, { type: 'warning' }> {
    return {
      type: 'warning',
      message,
      action
    };
  },

  info(message: string, link?: string): Extract<Notification, { type: 'info' }> {
    return {
      type: 'info',
      message,
      link
    };
  }
};

// 타입 가드
function isErrorNotification(notification: Notification): notification is Extract<Notification, { type: 'error' }> {
  return notification.type === 'error';
}

// 사용
const notification = NotificationFactory.error(
  'Server error',
  new Error('Connection failed'),
  () => console.log('Retrying...')
);

if (isErrorNotification(notification)) {
  console.log(notification.error.message);  // 타입 안전!
  notification.retry?.();
}
```

### 5. Abstract Factory 패턴

```typescript
// 추상 제품 인터페이스
interface Button {
  render(): string;
  onClick(handler: () => void): void;
}

interface Input {
  render(): string;
  getValue(): string;
  setValue(value: string): void;
}

// 추상 Factory 인터페이스
interface UIFactory {
  createButton(text: string): Button;
  createInput(placeholder: string): Input;
}

// Dark 테마 구현
class DarkButton implements Button {
  constructor(private text: string) {}

  render(): string {
    return `<button class="dark-button">${this.text}</button>`;
  }

  onClick(handler: () => void): void {
    console.log('Dark button clicked');
    handler();
  }
}

class DarkInput implements Input {
  constructor(private placeholder: string, private value: string = '') {}

  render(): string {
    return `<input class="dark-input" placeholder="${this.placeholder}" value="${this.value}">`;
  }

  getValue(): string {
    return this.value;
  }

  setValue(value: string): void {
    this.value = value;
  }
}

class DarkUIFactory implements UIFactory {
  createButton(text: string): Button {
    return new DarkButton(text);
  }

  createInput(placeholder: string): Input {
    return new DarkInput(placeholder);
  }
}

// Light 테마 구현
class LightButton implements Button {
  constructor(private text: string) {}

  render(): string {
    return `<button class="light-button">${this.text}</button>`;
  }

  onClick(handler: () => void): void {
    console.log('Light button clicked');
    handler();
  }
}

class LightInput implements Input {
  constructor(private placeholder: string, private value: string = '') {}

  render(): string {
    return `<input class="light-input" placeholder="${this.placeholder}" value="${this.value}">`;
  }

  getValue(): string {
    return this.value;
  }

  setValue(value: string): void {
    this.value = value;
  }
}

class LightUIFactory implements UIFactory {
  createButton(text: string): Button {
    return new LightButton(text);
  }

  createInput(placeholder: string): Input {
    return new LightInput(placeholder);
  }
}

// Factory 선택
function getUIFactory(theme: 'dark' | 'light'): UIFactory {
  return theme === 'dark' ? new DarkUIFactory() : new LightUIFactory();
}

// 사용
function createLoginForm(theme: 'dark' | 'light') {
  const factory = getUIFactory(theme);

  const emailInput = factory.createInput('이메일을 입력하세요');
  const passwordInput = factory.createInput('비밀번호를 입력하세요');
  const submitButton = factory.createButton('로그인');

  return {
    render() {
      return `
        <form>
          ${emailInput.render()}
          ${passwordInput.render()}
          ${submitButton.render()}
        </form>
      `;
    },

    submit() {
      submitButton.onClick(() => {
        console.log('Email:', emailInput.getValue());
        console.log('Password:', passwordInput.getValue());
      });
    }
  };
}

const darkForm = createLoginForm('dark');
const lightForm = createLoginForm('light');
```

## 결론: Factory Pattern을 언제 사용할까?

### Factory Pattern을 사용하세요:

✅ **객체 생성이 복잡할 때**
- 초기화 로직이 여러 단계를 거쳐야 할 때
- 생성 시 복잡한 계산이 필요할 때
- 외부 의존성을 설정해야 할 때

✅ **같은 타입의 객체를 여러 곳에서 생성할 때**
- 코드 중복을 줄이고 싶을 때
- 일관된 객체 구조를 보장하고 싶을 때

✅ **조건에 따라 다른 객체를 생성해야 할 때**
- 런타임에 타입이 결정될 때
- 환경이나 설정에 따라 다른 구현이 필요할 때

✅ **객체 생성 방식을 변경할 가능성이 있을 때**
- 생성 로직이 자주 바뀔 수 있을 때
- 테스트 시 Mock 객체로 교체하고 싶을 때

### Factory Pattern을 피하세요:

❌ **단순한 객체 생성**
- 객체 리터럴이나 Class로 충분한 경우
- 오버엔지니어링이 될 수 있음

❌ **생성 로직이 거의 없을 때**
- 단순히 new 연산자만 호출하는 경우
- 불필요한 추상화 계층 추가

❌ **성능이 매우 중요한 경우**
- Factory 호출 오버헤드가 문제될 때
- 직접 생성이 더 빠를 수 있음

### 실전 가이드라인

```javascript
// ✅ 좋은 사용 예
const UserFactory = {
  create(apiData) {
    return {
      id: apiData.id,
      name: apiData.first_name + ' ' + apiData.last_name,
      email: apiData.email,
      isActive: apiData.status === 'active',
      roles: apiData.roles.map(r => r.name),
      createdAt: new Date(apiData.created_at)
    };
  }
};

// ❌ 불필요한 Factory
const PointFactory = {
  create(x, y) {
    return { x, y };  // 그냥 { x, y }를 쓰세요
  }
};

// ✅ 조건부 생성
const PaymentFactory = {
  create(type, amount) {
    switch (type) {
      case 'card':
        return new CardPayment(amount);
      case 'paypal':
        return new PayPalPayment(amount);
      case 'crypto':
        return new CryptoPayment(amount);
      default:
        throw new Error('Unknown payment type');
    }
  }
};

// ✅ 테스트 데이터 생성
const TestFactory = {
  user(overrides = {}) {
    return {
      id: 'test-id',
      name: 'Test User',
      email: 'test@example.com',
      ...overrides
    };
  }
};
```

### 마지막 조언

Factory Pattern은 **도구**입니다. 모든 곳에 사용할 필요는 없습니다. 다음을 기억하세요:

1. **단순함을 유지하세요** - Factory가 너무 복잡해지면 분리하세요
2. **일관성을 유지하세요** - 팀 전체가 같은 방식으로 사용하세요
3. **문서화하세요** - Factory가 어떤 객체를 만드는지 명확히 하세요
4. **테스트하세요** - Factory 로직도 테스트가 필요합니다

Factory Pattern을 잘 사용하면 코드가 더 깨끗해지고, 유지보수가 쉬워지며, 버그가 줄어듭니다. 하지만 과도하게 사용하면 코드가 복잡해질 수 있으니, 항상 **"정말 필요한가?"**를 자문하세요.

## 참고 자료

### 공식 문서 및 표준

- [MDN - Working with Objects](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_Objects)
- [JavaScript.info - Object methods, "this"](https://javascript.info/object-methods)
- [TC39 - ECMAScript Proposals](https://github.com/tc39/proposals)

### 디자인 패턴

- [Refactoring.Guru - Factory Method Pattern](https://refactoring.guru/design-patterns/factory-method)
- [Patterns.dev - Factory Pattern](https://www.patterns.dev/posts/factory-pattern/)
- [Learning JavaScript Design Patterns](https://www.patterns.dev/posts/classic-design-patterns/) - Addy Osmani

### 책

- **"Head First Design Patterns"** - Eric Freeman, Elisabeth Robson
- **"JavaScript Patterns"** - Stoyan Stefanov
- **"Design Patterns: Elements of Reusable Object-Oriented Software"** - Gang of Four

### 심화 학습

- [Factory Pattern in TypeScript](https://refactoring.guru/design-patterns/factory-method/typescript/example)
- [When to Use Factory Pattern](https://stackoverflow.com/questions/69849/factory-pattern-when-to-use-factory-methods)
- [JavaScript Factory Functions vs Constructor Functions](https://www.javascripttutorial.net/javascript-factory-functions/)

### 관련 문서

- [prototype.md](./prototype.md) - JavaScript 프로토타입 이해
- [instance.md](./instance.md) - 인스턴스의 개념
- [callback.md](./callback.md) - 콜백 함수 패턴

### 실전 예제

- [React Patterns](https://reactpatterns.com/) - React에서의 Factory Pattern
- [Node.js Design Patterns](https://www.nodejsdesignpatterns.com/) - Node.js 디자인 패턴
- [TypeScript Deep Dive - Factory Functions](https://basarat.gitbook.io/typescript/main-1/factory)

### 커뮤니티

- [r/javascript - Design Patterns Discussion](https://www.reddit.com/r/javascript/)
- [Dev.to - JavaScript Design Patterns](https://dev.to/t/designpatterns)
- [Stack Overflow - Factory Pattern Tag](https://stackoverflow.com/questions/tagged/factory-pattern)
