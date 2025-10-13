---
title: Composite Pattern
date: 2025-10-02
last_modified_at: 2025-10-13
layout: page
---
# Composite Pattern

**Composite Pattern**은 객체들을 트리 구조로 구성하여 부분-전체 계층을 표현하는 구조적 디자인 패턴입니다. 
개별 객체와 객체들의 조합(컴포지트)을 동일하게 다룰 수 있게 해주는 패턴입니다.

## 개념

### 1. **통일된 인터페이스**
- 개별 객체(Leaf)와 복합 객체(Composite) 모두 같은 인터페이스를 구현
- 클라이언트는 개별 객체인지 복합 객체인지 구분하지 않고 사용

### 2. **재귀적 구조**
- 복합 객체는 다른 복합 객체나 개별 객체를 포함할 수 있음
- 트리 구조의 재귀적 처리가 가능

### 3. **부분-전체 관계**
- 전체는 부분들로 구성되며, 부분들도 또 다른 전체가 될 수 있음
- 계층적 구조를 자연스럽게 표현

## 구조 다이어그램

```
Component (인터페이스)
├── Leaf (개별 객체)
└── Composite (복합 객체)
    ├── Component[]
    ├── add(Component)
    ├── remove(Component)
    └── operation()
```

## 기본 구현

### 1. **TypeScript로 구현한 기본 구조**

```ts
// 공통 인터페이스
interface Component {
  operation(): string;
  getSize(): number;
}

// 개별 객체 (Leaf)
class File implements Component {
  constructor(private name: string, private size: number) {}
  
  operation(): string {
    return `File: ${this.name}`;
  }
  
  getSize(): number {
    return this.size;
  }
}

// 복합 객체 (Composite)
class Directory implements Component {
  private children: Component[] = [];
  
  constructor(private name: string) {}
  
  add(component: Component): void {
    this.children.push(component);
  }
  
  remove(component: Component): void {
    const index = this.children.indexOf(component);
    if (index > -1) {
      this.children.splice(index, 1);
    }
  }
  
  operation(): string {
    const childResults = this.children
      .map(child => child.operation())
      .join('\n  ');
    
    return `Directory: ${this.name}\n  ${childResults}`;
  }
  
  getSize(): number {
    return this.children.reduce((total, child) => total + child.getSize(), 0);
  }
}
```

### 2. **사용 예시**

```ts
// 파일 시스템 구조 생성
const root = new Directory('root');
const documents = new Directory('documents');
const images = new Directory('images');

const file1 = new File('readme.txt', 1024);
const file2 = new File('photo.jpg', 2048);
const file3 = new File('config.json', 512);

// 트리 구조 구성
documents.add(file1);
documents.add(file3);
images.add(file2);
root.add(documents);
root.add(images);

// 통일된 방식으로 처리
console.log(root.operation());
console.log(`Total size: ${root.getSize()} bytes`);

/*
출력:
Directory: root
  Directory: documents
    File: readme.txt
    File: config.json
  Directory: images
    File: photo.jpg
Total size: 3584 bytes
*/
```

## React에서의 Composite Pattern

### 1. **UI 컴포넌트 트리**

```ts
// 기본 컴포넌트 인터페이스
interface UIComponent {
  render(): React.ReactNode;
  getHeight(): number;
}

// 개별 컴포넌트 (Leaf)
class Button implements UIComponent {
  constructor(
    private text: string,
    private onClick: () => void
  ) {}
  
  render(): React.ReactNode {
    return <button onClick={this.onClick}>{this.text}</button>;
  }
  
  getHeight(): number {
    return 40; // 버튼 높이
  }
}

class Text implements UIComponent {
  constructor(private content: string) {}
  
  render(): React.ReactNode {
    return <p>{this.content}</p>;
  }
  
  getHeight(): number {
    return 20; // 텍스트 높이
  }
}

// 복합 컴포넌트 (Composite)
class Panel implements UIComponent {
  private children: UIComponent[] = [];
  
  constructor(private title: string) {}
  
  add(component: UIComponent): void {
    this.children.push(component);
  }
  
  render(): React.ReactNode {
    return (
      <div className="panel">
        <h3>{this.title}</h3>
        {this.children.map((child, index) => (
          <div key={index}>{child.render()}</div>
        ))}
      </div>
    );
  }
  
  getHeight(): number {
    const childrenHeight = this.children.reduce(
      (total, child) => total + child.getHeight(), 
      0
    );
    return 60 + childrenHeight; // 헤더 높이 + 자식들 높이
  }
}
```

### 2. **실제 사용 예시**

```ts
const App: React.FC = () => {
  // UI 구조 생성
  const mainPanel = new Panel('메인 패널');
  const sidePanel = new Panel('사이드 패널');
  
  const welcomeText = new Text('환영합니다!');
  const loginButton = new Button('로그인', () => console.log('로그인'));
  const signupButton = new Button('회원가입', () => console.log('회원가입'));
  
  const infoText = new Text('추가 정보');
  const helpButton = new Button('도움말', () => console.log('도움말'));
  
  // 트리 구조 구성
  mainPanel.add(welcomeText);
  mainPanel.add(loginButton);
  mainPanel.add(signupButton);
  
  sidePanel.add(infoText);
  sidePanel.add(helpButton);
  
  const rootPanel = new Panel('루트');
  rootPanel.add(mainPanel);
  rootPanel.add(sidePanel);
  
  return (
    <div>
      {rootPanel.render()}
      <div>총 높이: {rootPanel.getHeight()}px</div>
    </div>
  );
};
```

## 실제 활용 사례

### 1. **메뉴 시스템**

```ts
interface MenuItem {
  render(): React.ReactNode;
  isActive(): boolean;
}

class MenuLink implements MenuItem {
  constructor(
    private label: string,
    private href: string,
    private active: boolean = false
  ) {}
  
  render(): React.ReactNode {
    return (
      <a 
        href={this.href} 
        className={this.active ? 'active' : ''}
      >
        {this.label}
      </a>
    );
  }
  
  isActive(): boolean {
    return this.active;
  }
}

class MenuGroup implements MenuItem {
  private items: MenuItem[] = [];
  
  constructor(private title: string) {}
  
  add(item: MenuItem): void {
    this.items.push(item);
  }
  
  render(): React.ReactNode {
    return (
      <div className="menu-group">
        <h4>{this.title}</h4>
        <ul>
          {this.items.map((item, index) => (
            <li key={index}>{item.render()}</li>
          ))}
        </ul>
      </div>
    );
  }
  
  isActive(): boolean {
    return this.items.some(item => item.isActive());
  }
}
```

### 2. **폼 필드 시스템**

```ts
interface FormElement {
  validate(): boolean;
  getValue(): any;
  render(): React.ReactNode;
}

class InputField implements FormElement {
  constructor(
    private name: string,
    private value: string,
    private required: boolean = false
  ) {}
  
  validate(): boolean {
    if (this.required && !this.value.trim()) {
      return false;
    }
    return true;
  }
  
  getValue(): string {
    return this.value;
  }
  
  render(): React.ReactNode {
    return (
      <input 
        name={this.name}
        value={this.value}
        required={this.required}
      />
    );
  }
}

class FieldGroup implements FormElement {
  private fields: FormElement[] = [];
  
  constructor(private title: string) {}
  
  add(field: FormElement): void {
    this.fields.push(field);
  }
  
  validate(): boolean {
    return this.fields.every(field => field.validate());
  }
  
  getValue(): Record<string, any> {
    return this.fields.reduce((acc, field) => {
      return { ...acc, ...field.getValue() };
    }, {});
  }
  
  render(): React.ReactNode {
    return (
      <fieldset>
        <legend>{this.title}</legend>
        {this.fields.map((field, index) => (
          <div key={index}>{field.render()}</div>
        ))}
      </fieldset>
    );
  }
}
```

## 장점

### 1. **일관된 처리**
- 개별 객체와 복합 객체를 동일하게 처리
- 클라이언트 코드의 단순화

### 2. **확장성**
- 새로운 타입의 컴포넌트를 쉽게 추가
- 기존 코드 수정 없이 확장 가능

### 3. **재귀적 처리**
- 복잡한 트리 구조를 자연스럽게 처리
- 깊이에 관계없이 동일한 로직 적용

### 4. **유연한 구조**
- 런타임에 객체 구조를 동적으로 변경 가능
- 다양한 조합과 구성이 가능

## 단점

### 1. **과도한 일반화**
- 모든 컴포넌트가 같은 인터페이스를 가져야 함
- 특정 기능이 모든 컴포넌트에 적합하지 않을 수 있음

### 2. **타입 안전성**
- 런타임에 잘못된 조합이 생성될 수 있음
- 컴파일 타임에 구조적 제약을 강제하기 어려움

### 3. **성능 고려사항**
- 깊은 트리 구조에서 재귀 호출로 인한 성능 저하
- 메모리 사용량 증가 가능성

## 사용 시기

### 적합한 경우
- **계층적 구조**: 파일 시스템, 메뉴, 조직도 등
- **부분-전체 관계**: UI 컴포넌트 트리, 문서 구조 등
- **재귀적 처리**: 동일한 작업을 트리 전체에 적용해야 할 때

### 부적합한 경우
- **단순한 구조**: 계층이 없거나 얕은 구조
- **성능이 중요**: 대용량 데이터나 실시간 처리
- **타입 안전성 중요**: 컴파일 타임 검증이 중요한 경우

## Compound Pattern과의 차이점

| 구분 | Composite Pattern | Compound Pattern |
|------|------------------|------------------|
| **목적** | 부분-전체 계층 표현 | 컴포넌트 간 협력 |
| **구조** | 트리 구조 | 플랫 구조 |
| **관계** | 포함 관계 (has-a) | 협력 관계 (works-with) |
| **상태** | 개별 상태 관리 | 공유 상태 관리 |
| **사용 사례** | 파일 시스템, 메뉴 | Modal, Form, Card |

## 참고 자료

### 디자인 패턴 서적
- [Design Patterns: Elements of Reusable Object-Oriented Software](https://www.amazon.com/Design-Patterns-Elements-Reusable-Object-Oriented/dp/0201633612) - Gang of Four
- [Head First Design Patterns](https://www.amazon.com/Head-First-Design-Patterns-Brain-Friendly/dp/0596007124)

### 온라인 자료
- [Refactoring Guru - Composite Pattern](https://refactoring.guru/design-patterns/composite)
- [Wikipedia - Composite Pattern](https://en.wikipedia.org/wiki/Composite_pattern)
- [Source Making - Composite Pattern](https://sourcemaking.com/design_patterns/composite)

### React 관련 자료
- [React Patterns - Composite Components](https://react-patterns.com/)
- [Advanced React Patterns](https://advanced-react-patterns.netlify.app/)
- [React Design Patterns and Best Practices](https://www.packtpub.com/product/react-design-patterns-and-best-practices-second-edition/9781789530174)

### 실무 예시
- [Ant Design Tree Component](https://ant.design/components/tree/) - 트리 구조 UI 구현
- [React DnD](https://react-dnd.github.io/react-dnd/) - 드래그 앤 드롭에서의 Composite 활용
- [React Router](https://reactrouter.com/) - 중첩 라우팅에서의 Composite 패턴

### 블로그 포스트
- [Composite Pattern in JavaScript](https://www.dofactory.com/javascript/design-patterns/composite)
- [Building Tree Structures in React](https://blog.logrocket.com/building-tree-structures-react/)
- [Design Patterns in Modern JavaScript](https://www.patterns.dev/)
