---
date: 2025-09-17
last_modified_at: 2025-10-13
render_with_liquid: false
layout: page
---
{% raw %}
# React Provider Pattern

**Provider Pattern**은 React에서 컴포넌트 트리 전체에 데이터를 효율적으로 공유하기 위한 디자인 패턴입니다. Context API를 기반으로 하여 prop drilling 없이 깊은 컴포넌트 계층에 상태와 함수를 전달할 수 있게 해줍니다.

## 핵심 개념

### 1. **데이터 공급자 역할**
- 컴포넌트 트리의 상위에서 하위로 데이터를 제공
- 여러 컴포넌트가 동일한 상태를 공유할 수 있게 함
- 중앙화된 상태 관리 제공

### 2. **Context와의 관계**
- Context: 데이터 구조와 타입을 정의하는 "그릇"
- Provider: 실제 데이터를 담아서 제공하는 "공급자"
- Consumer: 제공된 데이터를 사용하는 "소비자"

### 3. **캡슐화와 추상화**
- 복잡한 상태 로직을 Provider 내부에 숨김
- 외부 컴포넌트는 단순한 API만 사용
- 관심사의 분리를 통한 코드 구조화

## 기본 구조



```ts
// 1. Context 생성
const MyContext = createContext<ContextType | undefined>(undefined);

// 2. Provider 컴포넌트 생성
export const MyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 상태 관리
  const [state, setState] = useState(initialState);

  // 비즈니스 로직
  const actions = {
    updateState: (newState: StateType) => setState(newState),
    resetState: () => setState(initialState),
  };

  // Context 값 제공
  const contextValue = {
    state,
    ...actions
  };

  return (
    <MyContext.Provider value={contextValue}>
      {children}
    </MyContext.Provider>
  );
};

// 3. Custom Hook 생成
export const useMyContext = () => {
  const context = useContext(MyContext);
  if (context === undefined) {
    throw new Error('useMyContext must be used within MyProvider');
  }
  return context;
};
```



## 예제

### 1. **Theme Provider**



```ts
// 테마 관련 타입 정의
interface ThemeContextType {
  theme: 'light' | 'dark';
  colors: {
    primary: string;
    background: string;
    text: string;
  };
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

// Context 생성
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 테마 설정
const themes = {
  light: {
    primary: '#007bff',
    background: '#ffffff',
    text: '#333333'
  },
  dark: {
    primary: '#4dabf7',
    background: '#1a1a1a',
    text: '#ffffff'
  }
};

// Theme Provider 구현
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // 테마 토글 함수
  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  }, []);

  // 로컬 스토리지 동기화
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const contextValue: ThemeContextType = {
    theme,
    colors: themes[theme],
    toggleTheme,
    setTheme
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom Hook
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme은 ThemeProvider와 함께 사용해야합니다.');
  }
  return context;
};

// 사용 예시
const App = () => (
  <ThemeProvider>
    <Header />
    <Main />
    <Footer />
  </ThemeProvider>
);

const Header = () => {
  const { theme, colors, toggleTheme } = useTheme();

  return (
    <header style={{ backgroundColor: colors.background, color: colors.text }}>
      <h1>My App</h1>
      <button onClick={toggleTheme}>
        {theme === 'light' ? '다크 모드' : '라이트 모드'}
      </button>
    </header>
  );
};
```



### 2. **Authentication Provider**



```ts
// 사용자 타입 정의
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider 구현
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 로그인 함수
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authAPI.login({ email, password });
      const userData = response.data.user;

      setUser(userData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      throw new Error('로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 로그아웃 함수
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  // 프로필 업데이트 함수
  const updateProfile = useCallback(async (data: Partial<User>) => {
    if (!user) return;

    try {
      const response = await authAPI.updateProfile(data);
      const updatedUser = response.data.user;

      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      throw new Error('프로필 업데이트에 실패했습니다.');
    }
  }, [user]);

  // 초기 인증 상태 확인
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }

    setIsLoading(false);
  }, []);

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth는 AuthProvide와 함께 사용해야합니다.');
  }
  return context;
};

// 사용 예시
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>로딩 중...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};
```



### 3. **Shopping Cart Provider**



```ts
// 장바구니 아이템 타입
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Cart Provider 구현
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  // 아이템 추가
  const addItem = useCallback((newItem: Omit<CartItem, 'quantity'>) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === newItem.id);

      if (existingItem) {
        return prevItems.map(item =>
          item.id === newItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prevItems, { ...newItem, quantity: 1 }];
    });
  }, []);

  // 아이템 제거
  const removeItem = useCallback((id: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  }, []);

  // 수량 업데이트
  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }

    setItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  }, [removeItem]);

  // 장바구니 비우기
  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  // 계산된 값들
  const totalItems = useMemo(() =>
    items.reduce((total, item) => total + item.quantity, 0)
  , [items]);

  const totalPrice = useMemo(() =>
    items.reduce((total, item) => total + (item.price * item.quantity), 0)
  , [items]);

  // 로컬 스토리지 동기화
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('장바구니 데이터 로드 실패:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const contextValue: CartContextType = {
    items,
    totalItems,
    totalPrice,
    addItem,
    removeItem,
    updateQuantity,
    clearCart
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

// Custom Hook
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart는 CartProvider와 함께 사용해야합니다.');
  }
  return context;
};

// 사용 예시
const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const { addItem } = useCart();

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image
    });
  };

  return (
    <div className="product-card">
      <img src={product.image} alt={product.name} width={100} height={100} loading="lazy" />
      <h3>{product.name}</h3>
      <p>${product.price}</p>
      <button onClick={handleAddToCart}>장바구니 추가</button>
    </div>
  );
};

const CartSummary: React.FC = () => {
  const { totalItems, totalPrice } = useCart();

  return (
    <div className="cart-summary">
      <p>총 {totalItems}개 상품</p>
      <p>총 가격: ${totalPrice}</p>
    </div>
  );
};
```



## 패턴 활용 예시

### 1. **Multiple Providers 조합**



```ts
// 여러 Provider를 조합하는 패턴
const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
    <AuthProvider>
      <CartProvider>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </CartProvider>
    </AuthProvider>
  </ThemeProvider>
);

// 또는 Provider Composer 패턴
const ProviderComposer: React.FC<{
  providers: React.ComponentType<{ children: React.ReactNode }>[];
  children: React.ReactNode;
}> = ({ providers, children }) =>
  providers.reduceRight(
    (acc, Provider) => <Provider>{acc}</Provider>,
    children
  );

const App = () => (
  <ProviderComposer providers={[ThemeProvider, AuthProvider, CartProvider]}>
    <Router>
      <Routes>
        {/* 라우트들 */}
      </Routes>
    </Router>
  </ProviderComposer>
);
```



### 2. **Provider with Reducer**



```ts
// 복잡한 상태 관리를 위한 Reducer 패턴
interface State {
  user: User | null;
  theme: 'light' | 'dark';
  cart: CartItem[];
  notifications: Notification[];
}

type Action =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'TOGGLE_THEME' }
  | { type: 'ADD_TO_CART'; payload: CartItem }
  | { type: 'ADD_NOTIFICATION'; payload: Notification };

const appReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'TOGGLE_THEME':
      return {
        ...state,
        theme: state.theme === 'light' ? 'dark' : 'light'
      };
    case 'ADD_TO_CART':
      return {
        ...state,
        cart: [...state.cart, action.payload]
      };
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, action.payload]
      };
    default:
      return state;
  }
};

const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const contextValue = {
    state,
    dispatch,
    // 편의 함수들
    setUser: (user: User | null) => dispatch({ type: 'SET_USER', payload: user }),
    toggleTheme: () => dispatch({ type: 'TOGGLE_THEME' }),
    addToCart: (item: CartItem) => dispatch({ type: 'ADD_TO_CART', payload: item }),
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};
```



### 3. **Conditional Provider**



```ts
// 조건부 Provider 패턴
const ConditionalProvider: React.FC<{
  condition: boolean;
  provider: React.ComponentType<{ children: React.ReactNode }>;
  children: React.ReactNode;
}> = ({ condition, provider: Provider, children }) => {
  if (condition) {
    return <Provider>{children}</Provider>;
  }
  return <>{children}</>;
};

// 사용 예시
const App = () => {
  const isAuthenticated = useAuth();

  return (
    <ConditionalProvider
      condition={isAuthenticated}
      provider={UserDataProvider}
    >
      <MainApp />
    </ConditionalProvider>
  );
};
```



## 장점

### 1. **Prop Drilling 해결**


```ts
// ❌ Prop Drilling
const App = () => {
  const [user, setUser] = useState(null);
  return <Header user={user} setUser={setUser} />;
};

const Header = ({ user, setUser }) => (
  <Navigation user={user} setUser={setUser} />
);

const Navigation = ({ user, setUser }) => (
  <UserMenu user={user} setUser={setUser} />
);

// ✅ Provider Pattern
const App = () => (
  <AuthProvider>
    <Header />
  </AuthProvider>
);

const UserMenu = () => {
  const { user, setUser } = useAuth(); // 직접 접근
  // ...
};
```



### 2. **중앙화된 상태 관리**
- 관련된 상태와 로직을 한 곳에서 관리
- 일관된 데이터 흐름 보장
- 디버깅과 테스트 용이성

### 3. **관심사 분리**
- UI 컴포넌트와 비즈니스 로직 분리
- 재사용 가능한 상태 로직
- 코드 구조화와 유지보수성 향상

## 단점

### 1. **성능 고려사항**


```ts
// ❌ 매번 새 객체 생성으로 불필요한 리렌더링
const MyProvider = ({ children }) => {
  const [state, setState] = useState(initialState);

  const contextValue = {
    state,
    updateState: (newState) => setState(newState) // 매번 새 함수
  };

  return (
    <MyContext.Provider value={contextValue}>
      {children}
    </MyContext.Provider>
  );
};

// ✅ useMemo와 useCallback으로 최적화
const MyProvider = ({ children }) => {
  const [state, setState] = useState(initialState);

  const updateState = useCallback((newState) => {
    setState(newState);
  }, []);

  const contextValue = useMemo(() => ({
    state,
    updateState
  }), [state, updateState]);

  return (
    <MyContext.Provider value={contextValue}>
      {children}
    </MyContext.Provider>
  );
};
```



### 2. **과도한 리렌더링**


```ts
// 문제: 하나의 값이 변경되면 모든 소비자가 리렌더링
const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');
  const [cart, setCart] = useState([]);

  const value = { user, setUser, theme, setTheme, cart, setCart };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// 해결: Context 분리
const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  return <UserContext.Provider value={{ user, setUser }}>{children}</UserContext.Provider>;
};

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
};
```



## 사용 시기

### 적합한 경우
- **전역 상태**: 여러 컴포넌트에서 공유해야 하는 데이터
- **깊은 계층**: 5단계 이상의 깊은 prop drilling이 필요한 경우
- **관련 로직**: 상태와 관련된 비즈니스 로직이 복잡한 경우

### 부적합한 경우
- **지역 상태**: 특정 컴포넌트에서만 사용되는 상태
- **단순한 데이터**: 1-2단계 prop 전달로 충분한 경우
- **성능이 중요**: 빈번한 업데이트가 있는 상태

## 모범 사례

### 1. **타입 안전성 확보**


```ts
interface ContextType {
  state: State;
  actions: Actions;
}

const MyContext = createContext<ContextType | undefined>(undefined);

export const useMyContext = (): ContextType => {
  const context = useContext(MyContext);
  if (context === undefined) {
    throw new Error('useMyContext must be used within MyProvider');
  }
  return context;
};
```



### 2. **에러 경계 설정**
```ts
class ProviderErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Provider Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Provider에서 오류가 발생했습니다.</div>;
    }

    return this.props.children;
  }
}

const SafeProvider = ({ children }) => (
  <ProviderErrorBoundary>
    <MyProvider>
      {children}
    </MyProvider>
  </ProviderErrorBoundary>
);
```

### 3. **개발자 도구 지원**


```ts
const MyProvider = ({ children }) => {
  const [state, setState] = useState(initialState);

  // 개발 모드에서 디버깅 정보 제공
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      window.__MY_PROVIDER_STATE__ = state;
    }
  }, [state]);

  return (
    <MyContext.Provider value={{ state, setState }}>
      {children}
    </MyContext.Provider>
  );
};
```



## 참고 자료

### 공식 문서
- [React Context API](https://react.dev/reference/react/createContext)
- [React useContext Hook](https://react.dev/reference/react/useContext)

### 아티클
- [React Context for Beginners](https://kentcdodds.com/blog/how-to-use-react-context-effectively)
- [When to use React Context vs Redux](https://blog.isquaredsoftware.com/2021/01/context-redux-differences/)
- [React Context Performance](https://github.com/facebook/react/issues/15156)

### 라이브러리
- [Zustand](https://github.com/pmndrs/zustand)
- [Jotai](https://jotai.org/)
- [Valtio](https://github.com/pmndrs/valtio)

### 도구
- [React DevTools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- [Why Did You Render](https://github.com/welldone-software/why-did-you-render)
{% endraw %}