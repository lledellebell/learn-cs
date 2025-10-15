---
title: Event Bus - 모듈 간 통신의 우아한 해결책
date: 2025-10-15
last_modified_at: 2025-10-15T00:02:11.439Z
categories: [Web Development]
tags: [this, Context, Scope, bind, Method, Callback]
render_with_liquid: false
layout: page
---
{% raw %}
# `Event Bus` - 모듈 간 통신의 우아한 해결책

이런 경험 있으신가요? 애플리케이션에서 서로 멀리 떨어져 있는 모듈들이 소통해야 하는 상황 말이죠. 사용자가 로그인하면 헤더, 사이드바, 알림 시스템이 모두 업데이트되어야 하는데, 이들을 어떻게 연결해야 할지 막막하셨던 적 있으신가요?

```javascript
// 😰 모든 모듈을 직접 호출해야 한다면?
function handleUserLogin(user) {
  // 1. 사용자 데이터 저장
  userData = user;

  // 2. UI 업데이트 - 모든 모듈을 직접 호출해야 함
  header.updateUserInfo(user);
  sidebar.showUserMenu(user);
  notification.show('로그인 성공!');
  analytics.trackLogin(user.id);

  // 나중에 기능이 추가되면? 여기를 또 수정해야 함...
}
```

저도 처음 이런 상황에 직면했을 때, "이렇게까지 해야 하나?" 하는 생각이 들었습니다. 모든 모듈을 직접 호출하자니 코드가 복잡해지고, 새로운 기능을 추가할 때마다 기존 코드를 수정해야 하더라고요.

바로 이런 상황에서 **Event Bus 패턴**이 빛을 발합니다. 마치 라디오 방송국처럼, 이벤트를 발행(publish)하면 구독(subscribe)하고 있는 모든 모듈이 알림을 받는 간단하면서도 강력한 패턴입니다.

**Event Bus는 JavaScript의 어디서든 사용할 수 있습니다** - Vanilla JavaScript, Node.js, React, Vue 등 환경에 상관없이 동일한 개념으로 적용됩니다. 이 문서에서는 `Event Bus`가 무엇인지, 언제 사용해야 하는지, 그리고 실제 프로젝트에서 어떻게 구현하고 활용하는지를 처음부터 끝까지 자세히 설명하겠습니다.

## 목차

- [왜 Event Bus를 이해해야 할까요?](#왜-event-bus를-이해해야-할까요)
- [먼저, 문제 상황을 보면서 시작해볼까요?](#먼저-문제-상황을-보면서-시작해볼까요)
- [Event Bus란 무엇인가?](#event-bus란-무엇인가)
- [Event Bus는 어떻게 작동할까요?](#event-bus는-어떻게-작동할까요)
- [직접 구현해보기](#직접-구현해보기)
- [실전 예제로 배우는 Event Bus](#실전-예제로-배우는-event-bus)
- [함정과 주의사항](#함정과-주의사항)
- [실전에서 활용하기](#실전에서-활용하기)
- [Event Bus vs 다른 패턴들](#event-bus-vs-다른-패턴들)
- [결론: Event Bus를 언제 어떻게 사용할까?](#결론-event-bus를-언제-어떻게-사용할까)
- [참고 자료](#참고-자료)

## 왜 Event Bus를 이해해야 할까요?

### 1. Props Drilling 문제를 해결합니다

`React`나 `Vue`에서 가장 흔하게 겪는 문제 중 하나가 `props drilling`입니다.

```jsx
// ❌ Props Drilling의 전형적인 예
function App() {
  const [user, setUser] = useState(null);

  return <Layout onUserChange={setUser}>
    <Sidebar user={user} />
    <Main user={user} />
  </Layout>;
}

function Layout({ onUserChange, children }) {
  // Layout은 onUserChange를 사용하지 않지만 전달만 함
  return <div>
    <Header onUserChange={onUserChange} />
    {children}
  </div>;
}

function Header({ onUserChange }) {
  // Header도 사용하지 않고 전달만 함
  return <nav>
    <LoginButton onUserChange={onUserChange} />
  </nav>;
}

function LoginButton({ onUserChange }) {
  // 드디어 사용!
  const handleLogin = () => {
    const user = authenticate();
    onUserChange(user);
  };

  return <button onClick={handleLogin}>로그인</button>;
}
```

**Event Bus를 사용하면:**

```jsx
// ✅ Event Bus로 간단하게
function LoginButton() {
  const handleLogin = () => {
    const user = authenticate();
    eventBus.emit('user:login', user);
  };

  return <button onClick={handleLogin}>로그인</button>;
}

function Sidebar() {
  useEffect(() => {
    const handleUserLogin = (user) => {
      console.log('사이드바에서 사용자 감지:', user);
    };

    eventBus.on('user:login', handleUserLogin);

    return () => eventBus.off('user:login', handleUserLogin);
  }, []);

  return <aside>...</aside>;
}
```

중간 컴포넌트들은 전혀 신경 쓰지 않아도 됩니다!

### 2. 느슨한 결합(Loose Coupling)을 만듭니다

컴포넌트들이 서로를 직접 알 필요가 없습니다.

```javascript
// ❌ 강한 결합: ShoppingCart가 ProductList를 직접 알아야 함
class ShoppingCart {
  addItem(item) {
    this.items.push(item);
    // ProductList를 직접 업데이트해야 함
    productList.updateStock(item.id, -1);
    // Analytics를 직접 호출해야 함
    analytics.trackAddToCart(item);
    // Notification을 직접 표시해야 함
    notification.show('장바구니에 추가되었습니다');
  }
}

// ✅ 느슨한 결합: 이벤트만 발행하면 됨
class ShoppingCart {
  addItem(item) {
    this.items.push(item);
    eventBus.emit('cart:itemAdded', item);
  }
}

// 각각 독립적으로 구독
productList.on('cart:itemAdded', (item) => updateStock(item));
analytics.on('cart:itemAdded', (item) => trackAddToCart(item));
notification.on('cart:itemAdded', () => show('추가 완료'));
```

### 3. 확장성이 뛰어납니다

새로운 기능을 추가할 때 기존 코드를 수정할 필요가 없습니다.

```javascript
// 기존 코드는 그대로 유지
eventBus.emit('user:purchase', { userId: 123, amount: 50000 });

// 나중에 새로운 기능 추가 (기존 코드 수정 없음!)
eventBus.on('user:purchase', (data) => {
  // 포인트 적립 기능 추가
  addPoints(data.userId, data.amount * 0.01);
});

eventBus.on('user:purchase', (data) => {
  // 이메일 발송 기능 추가
  sendThankYouEmail(data.userId);
});

eventBus.on('user:purchase', (data) => {
  // 추천 시스템 학습 데이터 수집
  collectDataForRecommendation(data);
});
```

### 4. JavaScript 생태계 전반에서 사용됩니다

Event Bus 패턴은 **환경과 프레임워크에 관계없이** JavaScript 생태계 전반에서 널리 사용됩니다.

#### Vanilla JavaScript
- **DOM Events**: `addEventListener`, `dispatchEvent`
- **Custom Events**: 사용자 정의 이벤트 시스템
- **브라우저 API**: `postMessage`, `BroadcastChannel`

#### Node.js
- **EventEmitter**: Node.js 핵심 모듈
- **Stream API**: Readable, Writable 스트림
- **Process Events**: `process.on('exit', callback)`

#### 프레임워크/라이브러리
- **Vue 2**: 전역 이벤트 버스 (`new Vue()`)
- **Socket.io**: 실시간 이벤트 기반 통신
- **Electron**: IPC (Inter-Process Communication)
- **RxJS**: Subject와 Observable
- **jQuery**: `.on()`, `.trigger()` (과거에 많이 사용)

**Event Bus를 이해하면** 이런 다양한 도구들의 동작 원리를 쉽게 파악하고, 필요에 따라 직접 구현하거나 커스터마이징할 수 있습니다.

## 먼저, 문제 상황을 보면서 시작해볼까요?

쇼핑몰 애플리케이션을 만든다고 가정해봅시다. 사용자가 상품을 장바구니에 담으면:

1. 장바구니 아이콘의 개수가 업데이트되어야 함
2. 재고가 감소해야 함
3. 알림이 표시되어야 함
4. Analytics에 이벤트가 전송되어야 함

### 접근 1: 직접 호출 (강한 결합)

```javascript
// ❌ 모든 것을 직접 처리
class ProductCard {
  addToCart(product) {
    // 1. 장바구니에 추가
    cart.addItem(product);

    // 2. 장바구니 UI 업데이트
    cartIcon.updateCount(cart.getCount());

    // 3. 재고 업데이트
    inventory.decreaseStock(product.id, 1);

    // 4. 알림 표시
    notification.show('장바구니에 추가되었습니다');

    // 5. Analytics 전송
    analytics.track('add_to_cart', {
      productId: product.id,
      price: product.price
    });
  }
}
```

**문제점:**
- 🚫 ProductCard가 너무 많은 것을 알아야 함
- 🚫 새로운 기능 추가 시 ProductCard 수정 필요
- 🚫 테스트하기 어려움
- 🚫 재사용하기 어려움

### 접근 2: Event Bus 사용 (느슨한 결합) ⭐

```javascript
// ✅ Event Bus로 간단하게
class ProductCard {
  addToCart(product) {
    // 이벤트만 발행!
    eventBus.emit('cart:add', product);
  }
}

// 각 모듈이 독립적으로 구독
cart.on('cart:add', (product) => {
  cart.addItem(product);
});

cartIcon.on('cart:add', () => {
  cartIcon.updateCount(cart.getCount());
});

inventory.on('cart:add', (product) => {
  inventory.decreaseStock(product.id, 1);
});

notification.on('cart:add', () => {
  notification.show('장바구니에 추가되었습니다');
});

analytics.on('cart:add', (product) => {
  analytics.track('add_to_cart', {
    productId: product.id,
    price: product.price
  });
});
```

**해결된 점:**
- ✅ ProductCard는 이벤트만 발행하면 됨
- ✅ 새 기능 추가 시 기존 코드 수정 불필요
- ✅ 각 모듈을 독립적으로 테스트 가능
- ✅ 모듈 재사용 쉬움

### 시각화: 이벤트 흐름

```
직접 호출 방식:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ProductCard
    │
    ├──────────────→ Cart
    ├──────────────→ CartIcon
    ├──────────────→ Inventory
    ├──────────────→ Notification
    └──────────────→ Analytics

(ProductCard가 모든 것을 알아야 함)


Event Bus 방식:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ProductCard
    │
    └──────→ Event Bus ──────┬→ Cart
                             ├→ CartIcon
                             ├→ Inventory
                             ├→ Notification
                             └→ Analytics

(ProductCard는 Event Bus만 알면 됨!)
```

## Event Bus란 무엇인가?

### 기본 개념

**Event Bus는 Publish-Subscribe (발행-구독) 패턴을 구현한 중앙 이벤트 관리 시스템입니다.**

라디오 방송을 떠올려보세요.

```
라디오 방송국 (Event Bus)
    │
    │ 📻 "오전 9시 뉴스입니다" (이벤트 발행)
    │
    ├───→ 청취자 A (구독자)
    ├───→ 청취자 B (구독자)
    └───→ 청취자 C (구독자)
```

핵심 개념:

1. **Publisher (발행자)**: 이벤트를 발행하는 주체
2. **Subscriber (구독자)**: 이벤트를 수신하는 주체
3. **Event Bus**: 발행자와 구독자를 연결하는 중개자
4. **Event (이벤트)**: 전달되는 메시지와 데이터

### Event Bus의 3가지 핵심 메소드

```javascript
// 1. on (subscribe) - 이벤트 구독
eventBus.on('eventName', callback);

// 2. emit (publish) - 이벤트 발행
eventBus.emit('eventName', data);

// 3. off (unsubscribe) - 구독 취소
eventBus.off('eventName', callback);
```

### 간단한 예제

```javascript
// Event Bus 생성
const eventBus = new EventBus();

// 구독자 1: 알림 표시
eventBus.on('userLoggedIn', (user) => {
  console.log(`환영합니다, ${user.name}님!`);
});

// 구독자 2: Analytics 전송
eventBus.on('userLoggedIn', (user) => {
  analytics.track('login', { userId: user.id });
});

// 발행자: 로그인 성공 시 이벤트 발행
function handleLogin(username, password) {
  const user = authenticate(username, password);

  if (user) {
    eventBus.emit('userLoggedIn', user);
  }
}

// 실행
handleLogin('john@example.com', 'password123');

// 출력:
// 환영합니다, John님!
// (Analytics에 login 이벤트 전송됨)
```

## Event Bus는 어떻게 작동할까요?

### 내부 구조

Event Bus는 내부적으로 **이벤트 이름을 키로 하는 콜백 배열**을 관리합니다.

```javascript
// Event Bus 내부 구조 (개념적)
{
  'userLoggedIn': [callback1, callback2, callback3],
  'cart:add': [callback4, callback5],
  'notification:show': [callback6]
}
```

### 실행 흐름

```javascript
// 1. 구독 단계
eventBus.on('message', handleMessage);
// → 내부: events['message'] = [handleMessage]

// 2. 발행 단계
eventBus.emit('message', 'Hello');
// → 내부: events['message'].forEach(cb => cb('Hello'))

// 3. 구독 취소 단계
eventBus.off('message', handleMessage);
// → 내부: events['message']에서 handleMessage 제거
```

### 시각화: 전체 흐름

```
1. 구독 단계 (Subscription)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Component A: on('user:login', handlerA)
Component B: on('user:login', handlerB)
Component C: on('user:login', handlerC)
                    ↓
           Event Bus 내부:
           {
             'user:login': [
               handlerA,
               handlerB,
               handlerC
             ]
           }


2. 발행 단계 (Publish)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Login Component:
  emit('user:login', userData)
                    ↓
           Event Bus가 실행:
           handlerA(userData)
           handlerB(userData)
           handlerC(userData)
                    ↓
           각 컴포넌트가 반응!


3. 구독 취소 (Unsubscribe)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Component B: off('user:login', handlerB)
                    ↓
           Event Bus 내부:
           {
             'user:login': [
               handlerA,
               handlerC
             ]
           }
```

## 직접 구현해보기

### 기본 Event Bus 구현

```javascript
class EventBus {
  constructor() {
    // 이벤트 저장소: { eventName: [callback1, callback2, ...] }
    this.events = {};
  }

  // 이벤트 구독
  on(eventName, callback) {
    // 이벤트가 처음 등록되는 경우 배열 생성
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }

    // 콜백 추가
    this.events[eventName].push(callback);
  }

  // 이벤트 발행
  emit(eventName, data) {
    // 해당 이벤트의 모든 콜백 실행
    const callbacks = this.events[eventName];

    if (callbacks) {
      callbacks.forEach(callback => {
        callback(data);
      });
    }
  }

  // 구독 취소
  off(eventName, callback) {
    const callbacks = this.events[eventName];

    if (callbacks) {
      // 특정 콜백 제거
      this.events[eventName] = callbacks.filter(cb => cb !== callback);
    }
  }
}

// 사용 예제
const bus = new EventBus();

function handleUserLogin(user) {
  console.log('사용자 로그인:', user.name);
}

// 구독
bus.on('user:login', handleUserLogin);

// 발행
bus.emit('user:login', { name: '홍길동', id: 123 });
// 출력: 사용자 로그인: 홍길동

// 구독 취소
bus.off('user:login', handleUserLogin);

// 이제 발행해도 아무 일도 일어나지 않음
bus.emit('user:login', { name: '김철수', id: 456 });
```

### 고급(?) 기능 추가

```javascript
class AdvancedEventBus {
  constructor() {
    this.events = {};
  }

  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);

    // 구독 해제 함수 반환 (편의성)
    return () => this.off(eventName, callback);
  }

  // 한 번만 실행되는 구독
  once(eventName, callback) {
    const wrappedCallback = (data) => {
      callback(data);
      this.off(eventName, wrappedCallback);
    };

    this.on(eventName, wrappedCallback);
  }

  emit(eventName, data) {
    const callbacks = this.events[eventName];

    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event "${eventName}":`, error);
        }
      });
    }
  }

  off(eventName, callback) {
    const callbacks = this.events[eventName];

    if (callbacks) {
      if (callback) {
        // 특정 콜백만 제거
        this.events[eventName] = callbacks.filter(cb => cb !== callback);
      } else {
        // 모든 콜백 제거
        delete this.events[eventName];
      }
    }
  }

  // 모든 이벤트 리스너 제거
  clear() {
    this.events = {};
  }

  // 디버깅: 현재 등록된 이벤트 확인
  getEventNames() {
    return Object.keys(this.events);
  }

  getListenerCount(eventName) {
    return this.events[eventName]?.length || 0;
  }
}

// 사용 예제
const bus = new AdvancedEventBus();

// 1. 자동 구독 해제
const unsubscribe = bus.on('notification', (msg) => {
  console.log('알림:', msg);
});

bus.emit('notification', '새 메시지');
unsubscribe(); // 구독 해제

// 2. 한 번만 실행
bus.once('init', () => {
  console.log('초기화 완료! (한 번만 실행됨)');
});

bus.emit('init'); // 출력: 초기화 완료!
bus.emit('init'); // 아무것도 출력되지 않음

// 3. 디버깅
console.log('이벤트 목록:', bus.getEventNames());
console.log('notification 리스너 개수:', bus.getListenerCount('notification'));
```

### TypeScript 버전

```typescript
type EventCallback<T = any> = (data: T) => void;
type UnsubscribeFunction = () => void;

interface Events {
  [eventName: string]: EventCallback[];
}

class TypedEventBus {
  private events: Events = {};

  on<T = any>(
    eventName: string,
    callback: EventCallback<T>
  ): UnsubscribeFunction {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }

    this.events[eventName].push(callback);

    return () => this.off(eventName, callback);
  }

  once<T = any>(
    eventName: string,
    callback: EventCallback<T>
  ): void {
    const wrappedCallback: EventCallback<T> = (data) => {
      callback(data);
      this.off(eventName, wrappedCallback);
    };

    this.on(eventName, wrappedCallback);
  }

  emit<T = any>(eventName: string, data: T): void {
    const callbacks = this.events[eventName];

    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event "${eventName}":`, error);
        }
      });
    }
  }

  off(eventName: string, callback?: EventCallback): void {
    const callbacks = this.events[eventName];

    if (callbacks) {
      if (callback) {
        this.events[eventName] = callbacks.filter(cb => cb !== callback);
      } else {
        delete this.events[eventName];
      }
    }
  }

  clear(): void {
    this.events = {};
  }
}

// 사용 예제 (타입 안전)
interface User {
  id: number;
  name: string;
}

const bus = new TypedEventBus();

bus.on<User>('user:login', (user) => {
  console.log(user.name); // 타입 추론!
});

bus.emit<User>('user:login', { id: 1, name: '홍길동' });
```

## 실전 예제로 배우는 Event Bus

### 예제 1: Vanilla JavaScript에서 알림 시스템

먼저 프레임워크 없이 순수 JavaScript로 Event Bus를 사용하는 방법을 살펴봅시다.

```javascript
// EventBus.js - 순수 JavaScript로 구현
class EventBus {
  constructor() {
    this.events = {};
  }

  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
    return () => this.off(eventName, callback);
  }

  emit(eventName, data) {
    const callbacks = this.events[eventName];
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  off(eventName, callback) {
    const callbacks = this.events[eventName];
    if (callbacks) {
      this.events[eventName] = callbacks.filter(cb => cb !== callback);
    }
  }
}

// 전역 Event Bus 인스턴스
const eventBus = new EventBus();

// NotificationManager.js - 알림을 표시하는 모듈
class NotificationManager {
  constructor() {
    this.container = document.getElementById('notification-container');

    // 이벤트 구독
    eventBus.on('user:login', (user) => {
      this.show(`환영합니다, ${user.name}님!`, 'success');
    });

    eventBus.on('cart:add', (product) => {
      this.show(`${product.name}이(가) 장바구니에 추가되었습니다`, 'success');
    });

    eventBus.on('error', (message) => {
      this.show(message, 'error');
    });
  }

  show(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    this.container.appendChild(notification);

    // 3초 후 자동 제거
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// LoginForm.js - 로그인 폼 모듈
class LoginForm {
  constructor() {
    this.form = document.getElementById('login-form');
    this.form.addEventListener('submit', this.handleSubmit.bind(this));
  }

  async handleSubmit(e) {
    e.preventDefault();

    const email = this.form.email.value;
    const password = this.form.password.value;

    try {
      const user = await this.authenticate(email, password);

      // 이벤트 발행 - 다른 모듈에 로그인 성공 알림
      eventBus.emit('user:login', user);
    } catch (error) {
      // 에러 이벤트 발행
      eventBus.emit('error', '로그인에 실패했습니다');
    }
  }

  async authenticate(email, password) {
    // API 호출 로직
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) throw new Error('Authentication failed');
    return response.json();
  }
}

// ProductCard.js - 상품 카드 모듈
class ProductCard {
  constructor(product, element) {
    this.product = product;
    this.element = element;

    const addButton = element.querySelector('.add-to-cart');
    addButton.addEventListener('click', this.addToCart.bind(this));
  }

  addToCart() {
    // 장바구니에 상품 추가
    const cart = window.cart || { items: [] };
    cart.items.push(this.product);
    window.cart = cart;

    // 이벤트 발행 - 다른 모듈들이 반응
    eventBus.emit('cart:add', this.product);
  }
}

// Header.js - 헤더 모듈
class Header {
  constructor() {
    this.userInfo = document.getElementById('user-info');
    this.cartCount = document.getElementById('cart-count');

    // 이벤트 구독
    eventBus.on('user:login', (user) => {
      this.updateUserInfo(user);
    });

    eventBus.on('cart:add', () => {
      this.updateCartCount();
    });
  }

  updateUserInfo(user) {
    this.userInfo.textContent = user.name;
    this.userInfo.style.display = 'block';
  }

  updateCartCount() {
    const count = window.cart ? window.cart.items.length : 0;
    this.cartCount.textContent = count;
  }
}

// Analytics.js - 분석 모듈
class Analytics {
  constructor() {
    // 모든 중요 이벤트 추적
    eventBus.on('user:login', (user) => {
      this.track('User Login', { userId: user.id });
    });

    eventBus.on('cart:add', (product) => {
      this.track('Add to Cart', {
        productId: product.id,
        price: product.price
      });
    });
  }

  track(eventName, data) {
    console.log('[Analytics]', eventName, data);
    // 실제로는 Google Analytics, Mixpanel 등으로 전송
    // gtag('event', eventName, data);
  }
}

// app.js - 애플리케이션 초기화
document.addEventListener('DOMContentLoaded', () => {
  // 모든 모듈 초기화
  const notificationManager = new NotificationManager();
  const loginForm = new LoginForm();
  const header = new Header();
  const analytics = new Analytics();

  // 상품 카드들 초기화
  const productElements = document.querySelectorAll('.product-card');
  productElements.forEach(element => {
    const productData = JSON.parse(element.dataset.product);
    new ProductCard(productData, element);
  });
});
```

**핵심 포인트:**
- ✅ 각 모듈이 독립적으로 동작
- ✅ 새로운 기능 추가 시 기존 코드 수정 불필요
- ✅ 모듈 간 직접적인 의존성 없음
- ✅ 프레임워크 없이도 강력한 이벤트 시스템 구축 가능

### 예제 2: React에서 Toast 알림 시스템

```jsx
// EventBus.js
class EventBus {
  constructor() {
    this.events = {};
  }

  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
    return () => this.off(eventName, callback);
  }

  emit(eventName, data) {
    const callbacks = this.events[eventName];
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  off(eventName, callback) {
    const callbacks = this.events[eventName];
    if (callbacks) {
      this.events[eventName] = callbacks.filter(cb => cb !== callback);
    }
  }
}

export const eventBus = new EventBus();

// ToastContainer.jsx
import { useState, useEffect } from 'react';
import { eventBus } from './EventBus';

function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (toast) => {
      const id = Date.now();
      setToasts(prev => [...prev, { ...toast, id }]);

      // 3초 후 자동 제거
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 3000);
    };

    const unsubscribe = eventBus.on('toast:show', handleToast);

    return unsubscribe; // 컴포넌트 언마운트 시 구독 해제
  }, []);

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}

// 어디서든 사용 가능!
// ProductCard.jsx
import { eventBus } from './EventBus';

function ProductCard({ product }) {
  const addToCart = () => {
    cart.add(product);
    eventBus.emit('toast:show', {
      type: 'success',
      message: '장바구니에 추가되었습니다'
    });
  };

  return <button onClick={addToCart}>담기</button>;
}

// LoginForm.jsx
import { eventBus } from './EventBus';

function LoginForm() {
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await login(email, password);
      eventBus.emit('toast:show', {
        type: 'success',
        message: '로그인 성공!'
      });
    } catch (error) {
      eventBus.emit('toast:show', {
        type: 'error',
        message: '로그인 실패: ' + error.message
      });
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### 예제 3: Vue에서 전역 모달 관리

```vue
<!-- EventBus.js -->
<script>
import { reactive } from 'vue';

class EventBus {
  constructor() {
    this.events = {};
  }

  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
    return () => this.off(eventName, callback);
  }

  emit(eventName, data) {
    const callbacks = this.events[eventName];
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  off(eventName, callback) {
    const callbacks = this.events[eventName];
    if (callbacks) {
      this.events[eventName] = callbacks.filter(cb => cb !== callback);
    }
  }
}

export const eventBus = new EventBus();
</script>

<!-- ModalManager.vue -->
<template>
  <div>
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="currentModal" class="modal-overlay" @click="closeModal">
          <div class="modal-content" @click.stop>
            <component
              :is="currentModal.component"
              v-bind="currentModal.props"
              @close="closeModal"
            />
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { eventBus } from './EventBus';

const currentModal = ref(null);

const openModal = (modalData) => {
  currentModal.value = modalData;
};

const closeModal = () => {
  currentModal.value = null;
};

let unsubscribeOpen;
let unsubscribeClose;

onMounted(() => {
  unsubscribeOpen = eventBus.on('modal:open', openModal);
  unsubscribeClose = eventBus.on('modal:close', closeModal);
});

onUnmounted(() => {
  unsubscribeOpen();
  unsubscribeClose();
});
</script>

<!-- ProductList.vue -->
<template>
  <div>
    <button @click="openProductDetail(product)">
      상세 보기
    </button>
  </div>
</template>

<script setup>
import { eventBus } from './EventBus';
import ProductDetailModal from './ProductDetailModal.vue';

const openProductDetail = (product) => {
  eventBus.emit('modal:open', {
    component: ProductDetailModal,
    props: { product }
  });
};
</script>
```

### 예제 4: 실시간 채팅 애플리케이션 (Vanilla JavaScript + WebSocket)

```javascript
// ChatEventBus.js
class ChatEventBus {
  constructor() {
    this.events = {};
  }

  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
    return () => this.off(eventName, callback);
  }

  emit(eventName, data) {
    const callbacks = this.events[eventName];
    if (callbacks) {
      callbacks.forEach(callback => {
        callback(data);
      });
    }
  }

  off(eventName, callback) {
    const callbacks = this.events[eventName];
    if (callbacks) {
      this.events[eventName] = callbacks.filter(cb => cb !== callback);
    }
  }
}

export const chatBus = new ChatEventBus();

// WebSocketService.js
import { chatBus } from './ChatEventBus';

class WebSocketService {
  constructor() {
    this.ws = null;
  }

  connect(url) {
    this.ws = new WebSocket(url);

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // 메시지 타입에 따라 다른 이벤트 발행
      switch (data.type) {
        case 'message':
          chatBus.emit('chat:message', data.message);
          break;
        case 'userJoined':
          chatBus.emit('chat:userJoined', data.user);
          break;
        case 'userLeft':
          chatBus.emit('chat:userLeft', data.user);
          break;
        case 'typing':
          chatBus.emit('chat:typing', data.user);
          break;
      }
    };

    this.ws.onerror = (error) => {
      chatBus.emit('chat:error', error);
    };

    this.ws.onclose = () => {
      chatBus.emit('chat:disconnected');
    };
  }

  sendMessage(message) {
    this.ws.send(JSON.stringify({
      type: 'message',
      message
    }));
  }
}

export const wsService = new WebSocketService();

// ChatMessages.jsx
import { useState, useEffect } from 'react';
import { chatBus } from './ChatEventBus';

function ChatMessages() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const unsubscribe = chatBus.on('chat:message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    return unsubscribe;
  }, []);

  return (
    <div className="messages">
      {messages.map((msg, index) => (
        <div key={index} className="message">
          <strong>{msg.user}:</strong> {msg.text}
        </div>
      ))}
    </div>
  );
}

// UserList.jsx
import { useState, useEffect } from 'react';
import { chatBus } from './ChatEventBus';

function UserList() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const handleUserJoined = (user) => {
      setUsers(prev => [...prev, user]);
    };

    const handleUserLeft = (user) => {
      setUsers(prev => prev.filter(u => u.id !== user.id));
    };

    const unsubscribeJoin = chatBus.on('chat:userJoined', handleUserJoined);
    const unsubscribeLeave = chatBus.on('chat:userLeft', handleUserLeft);

    return () => {
      unsubscribeJoin();
      unsubscribeLeave();
    };
  }, []);

  return (
    <div className="user-list">
      <h3>온라인 사용자 ({users.length})</h3>
      {users.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}

// TypingIndicator.jsx
import { useState, useEffect } from 'react';
import { chatBus } from './ChatEventBus';

function TypingIndicator() {
  const [typingUsers, setTypingUsers] = useState(new Set());

  useEffect(() => {
    const handleTyping = (user) => {
      setTypingUsers(prev => new Set([...prev, user.name]));

      // 3초 후 제거
      setTimeout(() => {
        setTypingUsers(prev => {
          const next = new Set(prev);
          next.delete(user.name);
          return next;
        });
      }, 3000);
    };

    const unsubscribe = chatBus.on('chat:typing', handleTyping);
    return unsubscribe;
  }, []);

  if (typingUsers.size === 0) return null;

  return (
    <div className="typing-indicator">
      {Array.from(typingUsers).join(', ')}님이 입력 중...
    </div>
  );
}
```

### 예제 5: 게임 이벤트 시스템 (Vanilla JavaScript)

```javascript
// GameEventBus.js
class GameEventBus {
  constructor() {
    this.events = {};
    this.debugMode = false;
  }

  on(eventName, callback, priority = 0) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }

    this.events[eventName].push({ callback, priority });

    // 우선순위로 정렬 (높은 우선순위가 먼저 실행)
    this.events[eventName].sort((a, b) => b.priority - a.priority);

    return () => this.off(eventName, callback);
  }

  emit(eventName, data) {
    if (this.debugMode) {
      console.log(`[Event] ${eventName}`, data);
    }

    const listeners = this.events[eventName];

    if (listeners) {
      listeners.forEach(({ callback }) => {
        callback(data);
      });
    }
  }

  off(eventName, callback) {
    const listeners = this.events[eventName];

    if (listeners) {
      this.events[eventName] = listeners.filter(
        listener => listener.callback !== callback
      );
    }
  }

  setDebugMode(enabled) {
    this.debugMode = enabled;
  }
}

export const gameBus = new GameEventBus();

// Player.js
import { gameBus } from './GameEventBus';

class Player {
  constructor(name) {
    this.name = name;
    this.health = 100;
    this.score = 0;

    // 데미지 받기 이벤트 구독
    gameBus.on('player:damage', (data) => {
      if (data.playerId === this.name) {
        this.health -= data.amount;

        if (this.health <= 0) {
          this.health = 0;
          gameBus.emit('player:died', { player: this.name });
        }
      }
    });

    // 점수 획득 이벤트 구독
    gameBus.on('player:score', (data) => {
      if (data.playerId === this.name) {
        this.score += data.points;
        gameBus.emit('ui:updateScore', {
          playerId: this.name,
          score: this.score
        });
      }
    });
  }

  attack(targetPlayer, damage) {
    gameBus.emit('player:damage', {
      playerId: targetPlayer,
      amount: damage,
      source: this.name
    });
  }
}

// Enemy.js
import { gameBus } from './GameEventBus';

class Enemy {
  constructor(id, health) {
    this.id = id;
    this.health = health;

    gameBus.on('enemy:damage', (data) => {
      if (data.enemyId === this.id) {
        this.health -= data.amount;

        if (this.health <= 0) {
          this.die();
        }
      }
    });
  }

  die() {
    // 적 제거
    gameBus.emit('enemy:died', {
      enemyId: this.id,
      position: this.position
    });

    // 점수 부여
    gameBus.emit('player:score', {
      playerId: 'player1',
      points: 100
    });

    // 아이템 드롭 (20% 확률)
    if (Math.random() < 0.2) {
      gameBus.emit('item:spawn', {
        type: 'healthPotion',
        position: this.position
      });
    }
  }
}

// UI.js
import { gameBus } from './GameEventBus';

class GameUI {
  constructor() {
    // UI 업데이트 이벤트 구독 (높은 우선순위)
    gameBus.on('ui:updateScore', this.updateScore.bind(this), 10);
    gameBus.on('player:damage', this.showDamageEffect.bind(this), 10);
    gameBus.on('player:died', this.showGameOver.bind(this), 10);
    gameBus.on('enemy:died', this.showKillNotification.bind(this), 10);
  }

  updateScore(data) {
    document.getElementById('score').textContent = data.score;
  }

  showDamageEffect(data) {
    // 화면 깜빡임 효과
    document.body.classList.add('damage-flash');
    setTimeout(() => {
      document.body.classList.remove('damage-flash');
    }, 200);
  }

  showGameOver(data) {
    const modal = document.getElementById('game-over-modal');
    modal.style.display = 'block';
    modal.querySelector('.player-name').textContent = data.player;
  }

  showKillNotification(data) {
    const notification = document.createElement('div');
    notification.className = 'kill-notification';
    notification.textContent = `Enemy defeated! +100`;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 2000);
  }
}

// SoundManager.js
import { gameBus } from './GameEventBus';

class SoundManager {
  constructor() {
    gameBus.on('player:damage', () => this.playSound('hit'));
    gameBus.on('player:died', () => this.playSound('death'));
    gameBus.on('enemy:died', () => this.playSound('kill'));
    gameBus.on('item:pickup', () => this.playSound('pickup'));
  }

  playSound(soundName) {
    const audio = new Audio(`/sounds/${soundName}.mp3`);
    audio.play();
  }
}

// Game.js - 전체 연결
import { gameBus } from './GameEventBus';

class Game {
  constructor() {
    this.player = new Player('player1');
    this.enemies = [];
    this.ui = new GameUI();
    this.soundManager = new SoundManager();

    // 게임 디버그 모드
    gameBus.setDebugMode(true);

    // 적 생성
    this.spawnEnemy();
  }

  spawnEnemy() {
    const enemy = new Enemy(`enemy_${Date.now()}`, 50);
    this.enemies.push(enemy);

    gameBus.emit('enemy:spawned', {
      enemyId: enemy.id,
      position: { x: 100, y: 100 }
    });
  }

  start() {
    console.log('게임 시작!');

    // 예시: 플레이어가 적 공격
    setTimeout(() => {
      gameBus.emit('enemy:damage', {
        enemyId: this.enemies[0].id,
        amount: 60
      });
    }, 1000);
  }
}

const game = new Game();
game.start();
```

## 함정과 주의사항

### 함정 1: 메모리 누수

Event Bus의 가장 큰 함정은 **메모리 누수**입니다.

```javascript
// ❌ 메모리 누수 발생!
function MyComponent() {
  useEffect(() => {
    eventBus.on('data:updated', handleUpdate);

    // 구독 해제를 잊어버림!
  }, []);

  return <div>...</div>;
}

// ✅ 항상 구독 해제하기
function MyComponent() {
  useEffect(() => {
    const handleUpdate = (data) => {
      console.log('데이터 업데이트:', data);
    };

    eventBus.on('data:updated', handleUpdate);

    // cleanup 함수에서 구독 해제
    return () => {
      eventBus.off('data:updated', handleUpdate);
    };
  }, []);

  return <div>...</div>;
}

// ✅ 또는 자동 구독 해제 활용
function MyComponent() {
  useEffect(() => {
    const unsubscribe = eventBus.on('data:updated', (data) => {
      console.log('데이터 업데이트:', data);
    });

    return unsubscribe; // 더 간단!
  }, []);

  return <div>...</div>;
}
```

**메모리 누수 디버깅:**

```javascript
class EventBus {
  constructor() {
    this.events = {};
  }

  // ... 다른 메소드들

  // 메모리 누수 감지
  detectLeaks(threshold = 10) {
    const leaks = [];

    Object.entries(this.events).forEach(([eventName, callbacks]) => {
      if (callbacks.length > threshold) {
        leaks.push({
          eventName,
          listenerCount: callbacks.length
        });
      }
    });

    if (leaks.length > 0) {
      console.warn('🔥 메모리 누수 의심:', leaks);
    }

    return leaks;
  }
}

// 개발 모드에서 주기적으로 체크
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    eventBus.detectLeaks(5);
  }, 10000);
}
```

### 함정 2: 순환 의존성

이벤트가 서로를 호출하면 무한 루프가 발생할 수 있습니다.

```javascript
// ❌ 무한 루프 발생!
eventBus.on('cart:updated', () => {
  // 장바구니 업데이트 시 재고 업데이트
  eventBus.emit('inventory:updated');
});

eventBus.on('inventory:updated', () => {
  // 재고 업데이트 시 장바구니 업데이트
  eventBus.emit('cart:updated'); // 무한 루프!
});

// ✅ 해결책 1: 이벤트 체인 끊기
eventBus.on('cart:updated', (data) => {
  if (!data.fromInventory) {
    eventBus.emit('inventory:updated', {
      fromCart: true
    });
  }
});

eventBus.on('inventory:updated', (data) => {
  if (!data.fromCart) {
    eventBus.emit('cart:updated', {
      fromInventory: true
    });
  }
});

// ✅ 해결책 2: 무한 루프 감지
class SafeEventBus {
  constructor() {
    this.events = {};
    this.emitStack = [];
    this.maxDepth = 10;
  }

  emit(eventName, data) {
    // 현재 emit 스택에 같은 이벤트가 너무 많으면 에러
    const sameEventCount = this.emitStack.filter(
      name => name === eventName
    ).length;

    if (sameEventCount > this.maxDepth) {
      throw new Error(
        `순환 이벤트 감지: "${eventName}" (깊이: ${sameEventCount})`
      );
    }

    this.emitStack.push(eventName);

    try {
      const callbacks = this.events[eventName];
      if (callbacks) {
        callbacks.forEach(callback => callback(data));
      }
    } finally {
      this.emitStack.pop();
    }
  }
}
```

### 함정 3: 디버깅의 어려움

Event Bus는 흐름을 추적하기 어렵습니다.

```javascript
// ❌ 어디서 이벤트가 발생했는지 알 수 없음
eventBus.emit('user:updated', userData);

// ✅ 해결책 1: 디버그 모드
class DebugEventBus {
  constructor() {
    this.events = {};
    this.debugMode = false;
    this.eventHistory = [];
  }

  setDebugMode(enabled) {
    this.debugMode = enabled;
  }

  emit(eventName, data) {
    if (this.debugMode) {
      // 호출 스택 추적
      const stack = new Error().stack;
      const caller = stack.split('\n')[2]?.trim();

      console.group(`📢 Event: ${eventName}`);
      console.log('Data:', data);
      console.log('Caller:', caller);
      console.log('Listeners:', this.events[eventName]?.length || 0);
      console.groupEnd();

      // 히스토리 저장
      this.eventHistory.push({
        eventName,
        data,
        timestamp: Date.now(),
        caller
      });
    }

    const callbacks = this.events[eventName];
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  getEventHistory() {
    return this.eventHistory;
  }

  clearHistory() {
    this.eventHistory = [];
  }
}

// ✅ 해결책 2: 이벤트 이름 상수화
// events.js
export const EVENTS = {
  USER_LOGIN: 'user:login',
  USER_LOGOUT: 'user:logout',
  CART_ADD: 'cart:add',
  CART_REMOVE: 'cart:remove',
  NOTIFICATION_SHOW: 'notification:show'
};

// 사용
import { EVENTS } from './events';

eventBus.on(EVENTS.USER_LOGIN, handleUserLogin);
eventBus.emit(EVENTS.USER_LOGIN, userData);

// 타입 안전성과 자동완성까지!
```

### 함정 4: 이벤트 이름 충돌

```javascript
// ❌ 이벤트 이름 충돌
// ModuleA.js
eventBus.on('update', () => console.log('A 업데이트'));

// ModuleB.js
eventBus.on('update', () => console.log('B 업데이트'));

// 둘 다 호출됨!
eventBus.emit('update');
// 출력:
// A 업데이트
// B 업데이트

// ✅ 해결책: 네임스페이스 사용
// ModuleA.js
eventBus.on('moduleA:update', () => console.log('A 업데이트'));

// ModuleB.js
eventBus.on('moduleB:update', () => console.log('B 업데이트'));

// 명확하게 구분
eventBus.emit('moduleA:update'); // A만 호출
eventBus.emit('moduleB:update'); // B만 호출

// ✅ 더 나은 방법: 와일드카드 지원
class WildcardEventBus {
  on(eventPattern, callback) {
    // 'user:*' 같은 패턴 지원
    const regex = new RegExp(
      '^' + eventPattern.replace('*', '.*') + '$'
    );

    if (!this.events[eventPattern]) {
      this.events[eventPattern] = { regex, callbacks: [] };
    }

    this.events[eventPattern].callbacks.push(callback);
  }

  emit(eventName, data) {
    Object.values(this.events).forEach(({ regex, callbacks }) => {
      if (regex.test(eventName)) {
        callbacks.forEach(callback => callback(data));
      }
    });
  }
}

// 사용
const bus = new WildcardEventBus();

// 모든 user 이벤트 수신
bus.on('user:*', (data) => {
  console.log('사용자 이벤트 발생:', data);
});

bus.emit('user:login', userData);   // 호출됨
bus.emit('user:logout', userData);  // 호출됨
bus.emit('cart:add', cartData);     // 호출 안됨
```

### 함정 5: 타입 안전성 부족

```typescript
// ❌ 타입 안전하지 않음
eventBus.emit('user:login', { name: 'John' });
eventBus.on('user:login', (user: User) => {
  // user.id에 접근하면? 런타임 에러!
  console.log(user.id);
});

// ✅ 해결책: 타입 안전한 Event Bus
type EventMap = {
  'user:login': { id: number; name: string; email: string };
  'user:logout': { id: number };
  'cart:add': { productId: number; quantity: number };
  'notification:show': { message: string; type: 'success' | 'error' };
};

class TypeSafeEventBus<T extends Record<string, any>> {
  private events: Partial<Record<keyof T, ((data: any) => void)[]>> = {};

  on<K extends keyof T>(
    eventName: K,
    callback: (data: T[K]) => void
  ): () => void {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName]!.push(callback);

    return () => this.off(eventName, callback);
  }

  emit<K extends keyof T>(eventName: K, data: T[K]): void {
    const callbacks = this.events[eventName];
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  off<K extends keyof T>(
    eventName: K,
    callback: (data: T[K]) => void
  ): void {
    const callbacks = this.events[eventName];
    if (callbacks) {
      this.events[eventName] = callbacks.filter(cb => cb !== callback) as any;
    }
  }
}

// 사용
const eventBus = new TypeSafeEventBus<EventMap>();

// ✅ 타입 체크됨!
eventBus.on('user:login', (user) => {
  console.log(user.id);    // OK
  console.log(user.name);  // OK
  console.log(user.email); // OK
});

// ✅ emit도 타입 체크
eventBus.emit('user:login', {
  id: 1,
  name: 'John',
  email: 'john@example.com'
}); // OK

// ❌ 타입 에러!
eventBus.emit('user:login', {
  id: 1,
  name: 'John'
  // email 누락!
});
```

### 함정 6: 과도한 사용

Event Bus는 만능이 아닙니다.

```javascript
// ❌ 모든 것을 Event Bus로 처리
function calculateTotal(items) {
  let total = 0;
  eventBus.emit('calculate:start');

  items.forEach(item => {
    eventBus.emit('calculate:item', item);
    total += item.price;
  });

  eventBus.emit('calculate:end', total);
  return total;
}

// ✅ 단순한 로직은 직접 구현
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// Event Bus는 정말 필요한 곳에만
function checkout(items) {
  const total = calculateTotal(items);

  // 이건 Event Bus 사용이 적절함
  eventBus.emit('checkout:complete', {
    items,
    total,
    timestamp: Date.now()
  });
}
```

**사용 가이드라인:**

```javascript
// ✅ Event Bus 사용이 적절한 경우:
// - 멀리 떨어진 컴포넌트 간 통신
eventBus.emit('notification:show', message);

// - 다수의 구독자가 있는 경우
eventBus.emit('user:login', userData); // 여러 모듈이 관심

// - 느슨한 결합이 필요한 경우
eventBus.emit('analytics:track', eventData);

// ❌ Event Bus 사용이 부적절한 경우:
// - 부모-자식 간 통신 (props 사용)
<Child onUpdate={handleUpdate} />

// - 단순한 함수 호출
const result = calculateTotal(items); // 이벤트 필요 없음

// - 동기적 데이터 반환이 필요한 경우
const isValid = validateForm(data); // 반환값 필요
```

## 실전에서 활용하기

### 패턴 1: Event Bus + Context API (React)

```jsx
// EventBusContext.jsx
import { createContext, useContext, useEffect, useMemo } from 'react';

class EventBus {
  constructor() {
    this.events = {};
  }

  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
    return () => this.off(eventName, callback);
  }

  emit(eventName, data) {
    const callbacks = this.events[eventName];
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  off(eventName, callback) {
    const callbacks = this.events[eventName];
    if (callbacks) {
      this.events[eventName] = callbacks.filter(cb => cb !== callback);
    }
  }
}

const EventBusContext = createContext(null);

export function EventBusProvider({ children }) {
  const eventBus = useMemo(() => new EventBus(), []);

  return (
    <EventBusContext.Provider value={eventBus}>
      {children}
    </EventBusContext.Provider>
  );
}

// Custom Hook
export function useEventBus() {
  const eventBus = useContext(EventBusContext);

  if (!eventBus) {
    throw new Error('useEventBus must be used within EventBusProvider');
  }

  return eventBus;
}

// 구독 전용 Hook
export function useEventListener(eventName, callback) {
  const eventBus = useEventBus();

  useEffect(() => {
    return eventBus.on(eventName, callback);
  }, [eventBus, eventName, callback]);
}

// 사용 예제
// App.jsx
import { EventBusProvider } from './EventBusContext';

function App() {
  return (
    <EventBusProvider>
      <Header />
      <ProductList />
      <Cart />
      <Notifications />
    </EventBusProvider>
  );
}

// ProductCard.jsx
import { useEventBus } from './EventBusContext';

function ProductCard({ product }) {
  const eventBus = useEventBus();

  const addToCart = () => {
    eventBus.emit('cart:add', product);
  };

  return (
    <div>
      <h3>{product.name}</h3>
      <button onClick={addToCart}>담기</button>
    </div>
  );
}

// Cart.jsx
import { useEventListener } from './EventBusContext';

function Cart() {
  const [items, setItems] = useState([]);

  useEventListener('cart:add', (product) => {
    setItems(prev => [...prev, product]);
  });

  useEventListener('cart:remove', (productId) => {
    setItems(prev => prev.filter(item => item.id !== productId));
  });

  return (
    <div>
      <h2>장바구니 ({items.length})</h2>
      {/* ... */}
    </div>
  );
}

// Notifications.jsx
import { useEventListener } from './EventBusContext';

function Notifications() {
  const [notifications, setNotifications] = useState([]);

  useEventListener('cart:add', (product) => {
    showNotification(`${product.name}이(가) 장바구니에 추가되었습니다`);
  });

  const showNotification = (message) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message }]);

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  return (
    <div className="notifications">
      {notifications.map(notif => (
        <div key={notif.id} className="notification">
          {notif.message}
        </div>
      ))}
    </div>
  );
}
```

### 패턴 2: Event Bus + Composables (Vue)

```vue
<!-- useEventBus.js -->
<script>
import { onMounted, onUnmounted } from 'vue';

class EventBus {
  constructor() {
    this.events = {};
  }

  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
    return () => this.off(eventName, callback);
  }

  emit(eventName, data) {
    const callbacks = this.events[eventName];
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  off(eventName, callback) {
    const callbacks = this.events[eventName];
    if (callbacks) {
      this.events[eventName] = callbacks.filter(cb => cb !== callback);
    }
  }
}

// 싱글톤 인스턴스
export const eventBus = new EventBus();

// Composable
export function useEventBus() {
  return {
    emit: eventBus.emit.bind(eventBus),
    on: eventBus.on.bind(eventBus),
    off: eventBus.off.bind(eventBus)
  };
}

// 자동 cleanup을 제공하는 Composable
export function useEventListener(eventName, callback) {
  let unsubscribe;

  onMounted(() => {
    unsubscribe = eventBus.on(eventName, callback);
  });

  onUnmounted(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });
}
</script>

<!-- ProductCard.vue -->
<template>
  <div class="product-card">
    <h3>{{ product.name }}</h3>
    <button @click="addToCart">담기</button>
  </div>
</template>

<script setup>
import { useEventBus } from './useEventBus';

const props = defineProps(['product']);
const { emit } = useEventBus();

const addToCart = () => {
  emit('cart:add', props.product);
};
</script>

<!-- Cart.vue -->
<template>
  <div class="cart">
    <h2>장바구니 ({{ items.length }})</h2>
    <div v-for="item in items" :key="item.id">
      {{ item.name }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useEventListener } from './useEventBus';

const items = ref([]);

useEventListener('cart:add', (product) => {
  items.value.push(product);
});

useEventListener('cart:remove', (productId) => {
  items.value = items.value.filter(item => item.id !== productId);
});
</script>
```

### 패턴 3: Event Bus + Redux/Vuex 미들웨어

```javascript
// Redux Middleware
const eventBusMiddleware = (eventBus) => (store) => (next) => (action) => {
  const result = next(action);

  // Redux 액션을 Event Bus로 전파
  switch (action.type) {
    case 'user/login':
      eventBus.emit('user:login', action.payload);
      break;
    case 'cart/addItem':
      eventBus.emit('cart:add', action.payload);
      break;
    case 'notification/show':
      eventBus.emit('notification:show', action.payload);
      break;
  }

  return result;
};

// Store 설정
import { configureStore } from '@reduxjs/toolkit';
import { eventBus } from './eventBus';

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(eventBusMiddleware(eventBus))
});

// 이제 Redux 액션이 자동으로 Event Bus로 전파됨
store.dispatch({
  type: 'user/login',
  payload: { id: 1, name: 'John' }
});
// → Event Bus에서 'user:login' 이벤트 발생

// Analytics 모듈이 구독
eventBus.on('user:login', (user) => {
  analytics.track('User Login', {
    userId: user.id,
    name: user.name
  });
});
```

### 패턴 4: Namespaced Event Bus

```javascript
class NamespacedEventBus {
  constructor(namespace = '') {
    this.namespace = namespace;
    this.events = {};
  }

  // 네임스페이스 추가
  createNamespace(name) {
    return new NamespacedEventBus(
      this.namespace ? `${this.namespace}:${name}` : name
    );
  }

  // 전체 이벤트 이름 생성
  getEventName(eventName) {
    return this.namespace ? `${this.namespace}:${eventName}` : eventName;
  }

  on(eventName, callback) {
    const fullEventName = this.getEventName(eventName);

    if (!this.events[fullEventName]) {
      this.events[fullEventName] = [];
    }

    this.events[fullEventName].push(callback);

    return () => this.off(eventName, callback);
  }

  emit(eventName, data) {
    const fullEventName = this.getEventName(eventName);
    const callbacks = this.events[fullEventName];

    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  off(eventName, callback) {
    const fullEventName = this.getEventName(eventName);
    const callbacks = this.events[fullEventName];

    if (callbacks) {
      this.events[fullEventName] = callbacks.filter(cb => cb !== callback);
    }
  }
}

// 사용 예제
const globalBus = new NamespacedEventBus();

// 각 모듈별 네임스페이스 생성
const userBus = globalBus.createNamespace('user');
const cartBus = globalBus.createNamespace('cart');
const notificationBus = globalBus.createNamespace('notification');

// 사용
userBus.on('login', (user) => {
  // 실제 이벤트 이름: 'user:login'
  console.log('사용자 로그인:', user);
});

cartBus.on('add', (item) => {
  // 실제 이벤트 이름: 'cart:add'
  console.log('장바구니 추가:', item);
});

// 발행
userBus.emit('login', { id: 1, name: 'John' });
cartBus.emit('add', { productId: 123 });
```

### 패턴 5: Priority-based Event Bus

```javascript
class PriorityEventBus {
  constructor() {
    this.events = {};
  }

  on(eventName, callback, priority = 0) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }

    this.events[eventName].push({ callback, priority });

    // 우선순위로 정렬 (높은 숫자가 먼저 실행)
    this.events[eventName].sort((a, b) => b.priority - a.priority);

    return () => this.off(eventName, callback);
  }

  emit(eventName, data) {
    const listeners = this.events[eventName];

    if (listeners) {
      for (const { callback } of listeners) {
        const result = callback(data);

        // callback이 false를 반환하면 이벤트 전파 중단
        if (result === false) {
          break;
        }
      }
    }
  }

  off(eventName, callback) {
    const listeners = this.events[eventName];

    if (listeners) {
      this.events[eventName] = listeners.filter(
        listener => listener.callback !== callback
      );
    }
  }
}

// 사용 예제
const bus = new PriorityEventBus();

// 낮은 우선순위 (기본값 0)
bus.on('request:send', (request) => {
  console.log('3. 요청 전송:', request);
});

// 높은 우선순위 (10)
bus.on('request:send', (request) => {
  console.log('1. 요청 검증');

  if (!request.isValid) {
    console.log('검증 실패! 이벤트 중단');
    return false; // 이벤트 전파 중단
  }
}, 10);

// 중간 우선순위 (5)
bus.on('request:send', (request) => {
  console.log('2. 인증 토큰 추가');
  request.headers.Authorization = 'Bearer token';
}, 5);

// 실행
bus.emit('request:send', {
  url: '/api/users',
  isValid: true,
  headers: {}
});

// 출력:
// 1. 요청 검증
// 2. 인증 토큰 추가
// 3. 요청 전송: { url: '/api/users', isValid: true, headers: { Authorization: 'Bearer token' } }
```

## Event Bus vs 다른 패턴들

### Event Bus vs Props Drilling

```jsx
// Props Drilling
function App() {
  const [user, setUser] = useState(null);

  return (
    <Layout user={user} onUserChange={setUser}>
      <Dashboard user={user} />
    </Layout>
  );
}

function Layout({ user, onUserChange, children }) {
  return (
    <div>
      <Header user={user} onUserChange={onUserChange} />
      {children}
    </div>
  );
}

function Header({ user, onUserChange }) {
  return (
    <nav>
      <LoginButton user={user} onUserChange={onUserChange} />
    </nav>
  );
}

function LoginButton({ user, onUserChange }) {
  return <button onClick={() => onUserChange(newUser)}>로그인</button>;
}

// Event Bus
function LoginButton() {
  return <button onClick={() => eventBus.emit('user:login', newUser)}>
    로그인
  </button>;
}

function Dashboard() {
  const [user, setUser] = useState(null);

  useEventListener('user:login', setUser);

  return <div>{user?.name}</div>;
}
```

**비교:**

| 특징 | Props Drilling | Event Bus |
|------|----------------|-----------|
| **명확성** | 🟢 데이터 흐름이 명확 | 🔴 암시적 연결 |
| **간결성** | 🔴 중간 컴포넌트 많음 | 🟢 직접 통신 |
| **결합도** | 🟡 부모-자식 결합 | 🟢 느슨한 결합 |
| **디버깅** | 🟢 추적 쉬움 | 🔴 추적 어려움 |
| **사용 시기** | 가까운 컴포넌트 | 멀리 떨어진 컴포넌트 |

### Event Bus vs Context API

```jsx
// Context API
const UserContext = createContext(null);

function App() {
  const [user, setUser] = useState(null);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <Dashboard />
    </UserContext.Provider>
  );
}

function LoginButton() {
  const { setUser } = useContext(UserContext);

  return <button onClick={() => setUser(newUser)}>로그인</button>;
}

// Event Bus (동일)
function LoginButton() {
  return <button onClick={() => eventBus.emit('user:login', newUser)}>
    로그인
  </button>;
}
```

**비교:**

| 특징 | Context API | Event Bus |
|------|-------------|-----------|
| **리렌더링** | 🔴 Provider 하위 전체 | 🟢 구독자만 |
| **타입 안전성** | 🟢 TypeScript 지원 | 🟡 추가 작업 필요 |
| **범위** | 🟡 Provider 내부만 | 🟢 전역 |
| **React 통합** | 🟢 네이티브 지원 | 🔴 외부 라이브러리 |
| **사용 시기** | 상태 공유 | 이벤트 기반 통신 |

### Event Bus vs Redux/Zustand

```javascript
// Redux
const userSlice = createSlice({
  name: 'user',
  initialState: null,
  reducers: {
    login: (state, action) => action.payload,
    logout: () => null
  }
});

function LoginButton() {
  const dispatch = useDispatch();
  return <button onClick={() => dispatch(userSlice.actions.login(newUser))}>
    로그인
  </button>;
}

function Dashboard() {
  const user = useSelector(state => state.user);
  return <div>{user?.name}</div>;
}

// Event Bus (동일)
function LoginButton() {
  return <button onClick={() => eventBus.emit('user:login', newUser)}>
    로그인
  </button>;
}

function Dashboard() {
  const [user, setUser] = useState(null);
  useEventListener('user:login', setUser);
  return <div>{user?.name}</div>;
}
```

**비교:**

| 특징 | Redux/Zustand | Event Bus |
|------|---------------|-----------|
| **상태 관리** | 🟢 중앙 집중식 | 🔴 분산 관리 |
| **시간 여행** | 🟢 DevTools 지원 | 🔴 지원 안함 |
| **학습 곡선** | 🔴 높음 | 🟢 낮음 |
| **보일러플레이트** | 🔴 많음 | 🟢 적음 |
| **확장성** | 🟢 대규모 앱 | 🟡 중소규모 |
| **사용 시기** | 복잡한 상태 관리 | 간단한 이벤트 전파 |

### 언제 무엇을 사용할까?

```javascript
// ✅ Props: 부모-자식 간 데이터 전달
<Child data={data} onChange={handleChange} />

// ✅ Context: 전역 상태 (테마, 언어, 인증 등)
const ThemeContext = createContext('light');

// ✅ Redux/Zustand: 복잡한 비즈니스 로직과 상태
const userStore = create((set) => ({
  user: null,
  login: (user) => set({ user }),
  logout: () => set({ user: null })
}));

// ✅ Event Bus: 느슨하게 결합된 이벤트 통신
eventBus.emit('notification:show', message);
eventBus.emit('analytics:track', event);
eventBus.emit('socket:message', data);
```

## 결론: Event Bus를 언제 어떻게 사용할까?

### 핵심 요약

1. **Event Bus는 느슨한 결합을 위한 강력한 도구입니다**
   - 컴포넌트 간 직접적인 의존성을 제거합니다
   - 확장성이 뛰어나 새로운 기능 추가가 쉽습니다
   - Publish-Subscribe 패턴의 단순하고 우아한 구현입니다

2. **Event Bus의 장점**
   - ✅ Props Drilling 해결
   - ✅ 느슨한 결합 (Decoupling)
   - ✅ 확장성과 유연성
   - ✅ 간단한 API (on, emit, off)
   - ✅ 학습 곡선이 낮음

3. **Event Bus의 단점**
   - ❌ 디버깅이 어려움
   - ❌ 메모리 누수 위험
   - ❌ 타입 안전성 부족 (TypeScript 필요)
   - ❌ 과도한 사용 시 코드 추적 어려움

4. **실전 사용 가이드라인**

```javascript
// ✅ 적합한 경우:
// 1. 멀리 떨어진 컴포넌트 통신
eventBus.emit('notification:show', message);

// 2. 다수의 리스너가 있는 이벤트
eventBus.emit('user:login', userData);
// → Analytics, UI, Notifications 등 여러 모듈이 구독

// 3. 플러그인 시스템
eventBus.emit('plugin:loaded', pluginInfo);

// 4. 실시간 통신 (WebSocket, SSE)
eventBus.emit('chat:message', message);

// ❌ 부적합한 경우:
// 1. 부모-자식 간 통신 (Props 사용)
<Child onUpdate={handleUpdate} />

// 2. 전역 상태 관리 (Context/Redux 사용)
const { user } = useContext(UserContext);

// 3. 동기적 반환값이 필요한 경우
const result = calculateTotal(items);
```

### 실전 조언

```javascript
// 1. 항상 구독 해제
useEffect(() => {
  const unsubscribe = eventBus.on('event', handler);
  return unsubscribe; // cleanup!
}, []);

// 2. 이벤트 이름 상수화
export const EVENTS = {
  USER_LOGIN: 'user:login',
  CART_ADD: 'cart:add'
};

eventBus.on(EVENTS.USER_LOGIN, handler);

// 3. 네임스페이스 사용
eventBus.emit('user:login', data);  // ✅
eventBus.emit('cart:add', data);    // ✅
eventBus.emit('login', data);       // ❌ 충돌 위험

// 4. 디버그 모드 활용
eventBus.setDebugMode(process.env.NODE_ENV === 'development');

// 5. 타입 안전성 확보 (TypeScript)
const eventBus = new TypeSafeEventBus<EventMap>();
```

### 마지막 조언

Event Bus는 **적절히 사용하면 강력하지만, 과도하게 사용하면 복잡도를 높이는 도구**입니다.

다음 질문에 답해보세요.

1. ❓ **컴포넌트가 서로 멀리 떨어져 있나요?**
   - 예 → Event Bus 고려
   - 아니오 → Props 사용

2. ❓ **다수의 구독자가 필요한가요?**
   - 예 → Event Bus 적합
   - 아니오 → 직접 호출

3. ❓ **느슨한 결합이 중요한가요?**
   - 예 → Event Bus 사용
   - 아니오 → 직접 의존성

4. ❓ **상태 관리가 복잡한가요?**
   - 예 → Redux/Zustand 고려
   - 아니오 → Event Bus로 충분

Event Bus는 도구일 뿐입니다. **프로젝트의 요구사항과 팀의 선호도에 맞춰 적절히 선택하세요.** 가장 중요한 것은 **코드의 의도가 명확하고 유지보수하기 쉽게 만드는 것**입니다.

## 참고 자료

### 관련 개념
- [Observer Pattern](https://refactoring.guru/design-patterns/observer) - 디자인 패턴
- [Publish-Subscribe Pattern](https://en.wikipedia.org/wiki/Publish%E2%80%93subscribe_pattern) - 아키텍처 패턴
- [Event-Driven Architecture](https://martinfowler.com/articles/201701-event-driven.html) - Martin Fowler

### 프레임워크별 구현
- [Vue 2 Event Bus](https://v2.vuejs.org/v2/guide/migration.html#Global-Event-Bus-replaced) - Vue 공식 문서
- [mitt](https://github.com/developit/mitt) - 200바이트 Event Emitter
- [EventEmitter3](https://github.com/primus/eventemitter3) - 빠른 Event Emitter
- [Node.js EventEmitter](https://nodejs.org/api/events.html) - Node.js 내장 모듈

### 심화 학습
- [Learning JavaScript Design Patterns](https://www.patterns.dev/posts/classic-design-patterns) - Addy Osmani
- [Decoupling Your HTML, CSS, and JavaScript](https://philipwalton.com/articles/decoupling-html-css-and-javascript/) - Philip Walton
- [The Event-Driven Architecture](https://herbertograca.com/2017/10/05/event-driven-architecture/) - Herberto Graça

### 관련 문서
- [Callback](/languages/javascript/callback.md) - Callback 패턴 이해하기
- [Observer Pattern](/web-development/patterns/observer-pattern.md) - Observer 패턴 가이드
- [React Context API](/web-development/frontend/react/context-api.md) - Context API 활용법
{% endraw %}