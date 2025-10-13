---
date: 2025-10-13
title: React Provider Pattern
render_with_liquid: false
layout: page
---
{% raw %}
# React Provider Pattern

## 전역 상태, 어떻게 관리하고 계신가요?

React 애플리케이션을 개발하다 보면 이런 상황을 자주 마주하게 됩니다:

```tsx
// 사용자 정보를 10단계나 전달해야 하는 상황
<App user={user}>
  <Layout user={user}>
    <Header user={user}>
      <Navigation user={user}>
        <Menu user={user}>
          <Dropdown user={user}>
            <UserProfile user={user} />
          </Dropdown>
        </Menu>
      </Navigation>
    </Header>
  </Layout>
</App>
```

이 코드의 문제점이 보이시나요? 중간의 `Layout`, `Header`, `Navigation`, `Menu`, `Dropdown` 컴포넌트는 실제로 `user` 데이터를 사용하지 않습니다. 단지 자식 컴포넌트에게 전달하기 위해 props를 받고 있을 뿐이죠. 이것이 바로 악명 높은 **Prop Drilling** 문제입니다.

저는 처음 React를 배울 때 이 문제를 해결하기 위해 Redux를 도입했습니다. 하지만 간단한 테마 색상 하나를 공유하기 위해 액션 생성자, 리듀서, 스토어 설정 등 너무 많은 보일러플레이트 코드를 작성해야 했습니다. "이렇게까지 복잡해야 하나?" 하는 생각이 들더군요.

그러다가 **Context API**와 **Provider Pattern**을 알게 되었습니다. React의 내장 기능만으로 전역 상태를 우아하게 관리할 수 있다는 사실이 놀라웠습니다. 이제는 다크 모드, 인증 상태, 다국어 지원, 장바구니 등 거의 모든 전역 상태를 Provider Pattern으로 관리하고 있습니다.

이 글에서는 Provider Pattern이 무엇인지, 왜 필요한지, 그리고 실무에서 어떻게 활용하는지 상세히 알아보겠습니다.

## Provider 패턴이란?

**Provider Pattern**은 React의 Context API를 활용하여 컴포넌트 트리 전체에 데이터를 효율적으로 공유하기 위한 디자인 패턴입니다. 마치 "데이터 저수지"처럼 상위 컴포넌트에 데이터를 저장해두고, 필요한 하위 컴포넌트가 언제든지 끌어다 쓸 수 있게 해줍니다.

### 핵심 구성요소

Provider Pattern은 세 가지 핵심 요소로 구성됩니다:

1. **Context** (컨텍스트)
   - 데이터 구조와 타입을 정의하는 "그릇"
   - `createContext()`로 생성
   - 초기값을 설정할 수 있음

2. **Provider** (공급자)
   - 실제 데이터를 담아서 제공하는 "공급자"
   - Context의 `Provider` 컴포넌트 사용
   - `value` props로 데이터 전달

3. **Consumer** (소비자)
   - 제공된 데이터를 사용하는 "소비자"
   - `useContext` Hook으로 데이터 접근
   - Custom Hook으로 사용성 개선

### 시각적 구조

Provider Pattern의 구조를 도식화하면 다음과 같습니다:

```
┌─────────────────────────────────────────┐
│         ThemeProvider (공급자)          │
│    value = { theme, toggleTheme }       │
└─────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │                       │
    ┌───▼───┐              ┌────▼────┐
    │ Header│              │  Main   │
    └───┬───┘              └────┬────┘
        │                       │
    ┌───▼─────────┐        ┌───▼──────┐
    │  Navigation │        │ Content  │
    └─────────────┘        └──────────┘
         │                      │
    ┌────▼──────┐          ┌───▼─────┐
    │ThemeButton│          │ Article │
    │ (소비자)  │          │(소비자) │
    └───────────┘          └─────────┘
```

중요한 점은 중간의 `Header`, `Navigation`, `Main`, `Content` 컴포넌트는 테마 데이터를 props로 받지 않는다는 것입니다. 오직 실제로 데이터가 필요한 `ThemeButton`과 `Article` 컴포넌트만 `useTheme()` Hook을 통해 직접 접근합니다.

## Provider 패턴이 왜 중요할까?

### 1. Prop Drilling 지옥 탈출

제가 실제 프로젝트에서 겪은 사례를 공유하겠습니다. 전자상거래 사이트를 개발할 때, 사용자 인증 상태를 20개가 넘는 컴포넌트에서 사용해야 했습니다. Provider Pattern을 사용하기 전에는 이랬습니다:

```tsx
// ❌ 지옥의 Prop Drilling
function App() {
  const [user, setUser] = useState(null);

  return (
    <Router user={user} setUser={setUser}>
      <Layout user={user} setUser={setUser}>
        <Header user={user} setUser={setUser}>
          <Navigation user={user} setUser={setUser}>
            <UserMenu user={user} setUser={setUser}>
              <ProfileDropdown user={user} setUser={setUser} />
            </UserMenu>
          </Navigation>
        </Header>
        <Main user={user}>
          <Sidebar user={user}>
            <UserWidget user={user} />
          </Sidebar>
          <Content user={user}>
            <Article user={user}>
              <AuthorInfo user={user} />
              <CommentSection user={user} />
            </Article>
          </Content>
        </Main>
      </Layout>
    </Router>
  );
}
```

중간의 90% 컴포넌트는 `user`를 사용하지도 않으면서 props를 받아서 전달만 합니다. 코드가 지저분해지고, 컴포넌트 재사용이 어려워지며, 타입 정의도 복잡해집니다.

Provider Pattern을 도입한 후:

```tsx
// ✅ 깔끔한 Provider Pattern
function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Header>
            <Navigation>
              <UserMenu>
                <ProfileDropdown /> {/* useAuth()로 직접 접근 */}
              </UserMenu>
            </Navigation>
          </Header>
          <Main>
            <Sidebar>
              <UserWidget /> {/* useAuth()로 직접 접근 */}
            </Sidebar>
            <Content>
              <Article>
                <AuthorInfo /> {/* useAuth()로 직접 접근 */}
                <CommentSection /> {/* useAuth()로 직접 접근 */}
              </Article>
            </Content>
          </Main>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

// 필요한 곳에서만 사용
function ProfileDropdown() {
  const { user, logout } = useAuth(); // 직접 접근!

  return (
    <div>
      <img src={user.avatar} alt={user.name} />
      <button onClick={logout}>로그아웃</button>
    </div>
  );
}
```

코드가 얼마나 깔끔해졌는지 보이시나요? 중간 컴포넌트들은 더 이상 관계 없는 props를 받지 않아도 됩니다.

### 2. 관심사의 분리

Provider Pattern은 **비즈니스 로직**과 **UI 컴포넌트**를 명확하게 분리합니다. 예를 들어, 장바구니 로직을 생각해보세요:

```tsx
// Provider에 모든 비즈니스 로직 캡슐화
export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  // 복잡한 비즈니스 로직
  const addItem = useCallback((product) => {
    setItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const totalPrice = useMemo(() =>
    items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  , [items]);

  // UI 컴포넌트는 이 간단한 API만 사용
  return (
    <CartContext.Provider value={{ items, addItem, removeItem, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

// UI 컴포넌트는 비즈니스 로직을 몰라도 됨
function ProductCard({ product }) {
  const { addItem } = useCart();

  return (
    <button onClick={() => addItem(product)}>
      장바구니 추가
    </button>
  );
}
```

UI 컴포넌트는 "어떻게" 장바구니에 추가되는지 몰라도 됩니다. 단지 `addItem()`을 호출하면 됩니다. 모든 복잡한 로직은 Provider 안에 숨겨져 있습니다.

### 3. 테스트 용이성

Provider Pattern은 테스트를 엄청나게 쉽게 만들어줍니다:

```tsx
// 테스트용 Mock Provider 생성
function TestAuthProvider({ children, value }) {
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// 테스트 코드
test('로그인된 사용자는 프로필을 볼 수 있다', () => {
  const mockUser = { id: '1', name: 'John', email: 'john@example.com' };

  render(
    <TestAuthProvider value={{ user: mockUser, isAuthenticated: true }}>
      <ProfilePage />
    </TestAuthProvider>
  );

  expect(screen.getByText('John')).toBeInTheDocument();
});

test('로그아웃된 사용자는 로그인 페이지로 리다이렉트', () => {
  render(
    <TestAuthProvider value={{ user: null, isAuthenticated: false }}>
      <ProfilePage />
    </TestAuthProvider>
  );

  expect(screen.getByText('로그인이 필요합니다')).toBeInTheDocument();
});
```

실제 인증 로직 없이도 다양한 상태를 테스트할 수 있습니다.

## 기본 구현 패턴

Provider Pattern의 기본 구조는 다음과 같습니다:

```typescript
// 1단계: Context 생성 및 타입 정의
interface MyContextType {
  state: string;
  setState: (value: string) => void;
}

const MyContext = createContext<MyContextType | undefined>(undefined);

// 2단계: Provider 컴포넌트 구현
export function MyProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<string>('initial');

  // 최적화: 값이 변경될 때만 새 객체 생성
  const value = useMemo(() => ({
    state,
    setState
  }), [state]);

  return (
    <MyContext.Provider value={value}>
      {children}
    </MyContext.Provider>
  );
}

// 3단계: Custom Hook으로 사용성 개선
export function useMyContext(): MyContextType {
  const context = useContext(MyContext);

  // Provider 외부에서 사용 시 명확한 에러 메시지
  if (context === undefined) {
    throw new Error('useMyContext는 MyProvider 내부에서만 사용할 수 있습니다');
  }

  return context;
}

// 4단계: 사용
function App() {
  return (
    <MyProvider>
      <ChildComponent />
    </MyProvider>
  );
}

function ChildComponent() {
  const { state, setState } = useMyContext();
  return <div>{state}</div>;
}
```

이 패턴의 핵심 포인트:

1. **타입 안전성**: TypeScript로 Context 타입을 명확히 정의
2. **에러 처리**: Provider 없이 사용 시 개발자에게 명확한 에러 메시지
3. **성능 최적화**: `useMemo`로 불필요한 리렌더링 방지
4. **사용 편의성**: Custom Hook으로 간결한 API 제공

## 실전 예제: 6가지 실무 시나리오

### 1. Theme Provider - 다크모드 구현

가장 흔하게 사용되는 예제입니다. 전체 앱의 테마를 관리합니다.

```typescript
// types.ts
interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
}

interface ThemeContextType {
  theme: 'light' | 'dark';
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

// ThemeProvider.tsx
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const lightTheme: ThemeColors = {
  primary: '#007bff',
  secondary: '#6c757d',
  background: '#ffffff',
  surface: '#f8f9fa',
  text: '#212529',
  textSecondary: '#6c757d',
  border: '#dee2e6',
  error: '#dc3545',
  success: '#28a745'
};

const darkTheme: ThemeColors = {
  primary: '#4dabf7',
  secondary: '#adb5bd',
  background: '#1a1a1a',
  surface: '#2d2d2d',
  text: '#f8f9fa',
  textSecondary: '#adb5bd',
  border: '#495057',
  error: '#ff6b6b',
  success: '#51cf66'
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');

  // 시스템 테마 감지
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;

    if (savedTheme) {
      setThemeState(savedTheme);
    } else if (mediaQuery.matches) {
      setThemeState('dark');
    }

    // 시스템 테마 변경 감지
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        setThemeState(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // 로컬 스토리지 및 DOM 동기화
  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  const setTheme = useCallback((newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
  }, []);

  const value = useMemo<ThemeContextType>(() => ({
    theme,
    colors: theme === 'light' ? lightTheme : darkTheme,
    toggleTheme,
    setTheme
  }), [theme, toggleTheme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme은 ThemeProvider 내부에서만 사용할 수 있습니다');
  }
  return context;
}

// 사용 예시
function Header() {
  const { theme, colors, toggleTheme } = useTheme();

  return (
    <header style={{
      backgroundColor: colors.surface,
      color: colors.text,
      borderBottom: `1px solid ${colors.border}`
    }}>
      <h1>My App</h1>
      <button onClick={toggleTheme}>
        {theme === 'light' ? '🌙 다크' : '☀️ 라이트'} 모드
      </button>
    </header>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();

  return (
    <div style={{
      backgroundColor: colors.surface,
      color: colors.text,
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      padding: '16px'
    }}>
      {children}
    </div>
  );
}
```

**실무 팁**:
- CSS 변수와 함께 사용하면 더 효율적입니다
- 시스템 테마 자동 감지 기능 추가
- 애니메이션 선호도도 함께 관리하면 좋습니다 (`prefers-reduced-motion`)

### 2. Authentication Provider - 인증 상태 관리

가장 중요한 전역 상태 중 하나입니다. 사용자 인증, 권한, 세션 관리를 담당합니다.

```typescript
// types.ts
interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'user' | 'guest';
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

// AuthProvider.tsx
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 초기 인증 상태 확인
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          localStorage.removeItem('auth_token');
        }
      } catch (error) {
        console.error('인증 확인 실패:', error);
        localStorage.removeItem('auth_token');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // 토큰 자동 갱신
  useEffect(() => {
    if (!user) return;

    const refreshInterval = setInterval(async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const { token: newToken } = await response.json();
          localStorage.setItem('auth_token', newToken);
        }
      } catch (error) {
        console.error('토큰 갱신 실패:', error);
      }
    }, 14 * 60 * 1000); // 14분마다 갱신

    return () => clearInterval(refreshInterval);
  }, [user]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        throw new Error('로그인에 실패했습니다');
      }

      const { user: userData, token } = await response.json();

      localStorage.setItem('auth_token', token);
      setUser(userData);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('로그아웃 요청 실패:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('auth_token');
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('회원가입에 실패했습니다');
      }

      const { user: userData, token } = await response.json();

      localStorage.setItem('auth_token', token);
      setUser(userData);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    if (!user) throw new Error('로그인이 필요합니다');

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('프로필 업데이트에 실패했습니다');
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
    } catch (error) {
      throw error;
    }
  }, [user]);

  const hasPermission = useCallback((permission: string) => {
    if (!user) return false;
    return user.permissions.includes(permission) || user.role === 'admin';
  }, [user]);

  const hasRole = useCallback((role: string) => {
    if (!user) return false;
    return user.role === role;
  }, [user]);

  const value = useMemo<AuthContextType>(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    register,
    updateProfile,
    hasPermission,
    hasRole
  }), [user, isLoading, login, logout, register, updateProfile, hasPermission, hasRole]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth는 AuthProvider 내부에서만 사용할 수 있습니다');
  }
  return context;
}

// 보호된 라우트 컴포넌트
export function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission
}: {
  children: React.ReactNode;
  requiredRole?: string;
  requiredPermission?: string;
}) {
  const { isAuthenticated, isLoading, hasRole, hasPermission } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/forbidden" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <>{children}</>;
}

// 사용 예시
function UserProfile() {
  const { user, logout, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: user?.name || '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(formData);
      setIsEditing(false);
    } catch (error) {
      alert('프로필 업데이트에 실패했습니다');
    }
  };

  return (
    <div>
      <h2>{user?.name}님의 프로필</h2>
      {isEditing ? (
        <form onSubmit={handleSubmit}>
          <input
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
          />
          <button type="submit">저장</button>
          <button onClick={() => setIsEditing(false)}>취소</button>
        </form>
      ) : (
        <>
          <p>이메일: {user?.email}</p>
          <p>역할: {user?.role}</p>
          <button onClick={() => setIsEditing(true)}>프로필 수정</button>
          <button onClick={logout}>로그아웃</button>
        </>
      )}
    </div>
  );
}

function AdminPanel() {
  const { hasRole } = useAuth();

  if (!hasRole('admin')) {
    return <div>접근 권한이 없습니다</div>;
  }

  return <div>관리자 패널</div>;
}
```

**실무 팁**:
- JWT 토큰 자동 갱신 로직 구현
- 권한 기반 접근 제어 (RBAC) 지원
- 세션 만료 시 자동 로그아웃
- 로그인 전 페이지 저장 후 리다이렉트

### 3. Internationalization Provider - 다국어 지원

글로벌 서비스에 필수적인 다국어 지원 기능입니다.

```typescript
// types.ts
type SupportedLanguage = 'ko' | 'en' | 'ja' | 'zh';

interface Translation {
  [key: string]: string | Translation;
}

interface I18nContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatDate: (date: Date) => string;
  formatNumber: (num: number) => string;
  formatCurrency: (amount: number, currency?: string) => string;
}

// translations.ts
const translations: Record<SupportedLanguage, Translation> = {
  ko: {
    common: {
      welcome: '환영합니다',
      hello: '안녕하세요, {{name}}님',
      loading: '로딩 중...',
      error: '오류가 발생했습니다'
    },
    auth: {
      login: '로그인',
      logout: '로그아웃',
      email: '이메일',
      password: '비밀번호'
    },
    cart: {
      addToCart: '장바구니에 추가',
      items: '{{count}}개 상품',
      total: '총 금액'
    }
  },
  en: {
    common: {
      welcome: 'Welcome',
      hello: 'Hello, {{name}}',
      loading: 'Loading...',
      error: 'An error occurred'
    },
    auth: {
      login: 'Login',
      logout: 'Logout',
      email: 'Email',
      password: 'Password'
    },
    cart: {
      addToCart: 'Add to Cart',
      items: '{{count}} items',
      total: 'Total'
    }
  },
  ja: {
    common: {
      welcome: 'ようこそ',
      hello: 'こんにちは、{{name}}さん',
      loading: '読み込み中...',
      error: 'エラーが発生しました'
    },
    auth: {
      login: 'ログイン',
      logout: 'ログアウト',
      email: 'メール',
      password: 'パスワード'
    },
    cart: {
      addToCart: 'カートに追加',
      items: '{{count}}個の商品',
      total: '合計'
    }
  },
  zh: {
    common: {
      welcome: '欢迎',
      hello: '你好，{{name}}',
      loading: '加载中...',
      error: '发生错误'
    },
    auth: {
      login: '登录',
      logout: '登出',
      email: '邮箱',
      password: '密码'
    },
    cart: {
      addToCart: '加入购物车',
      items: '{{count}}件商品',
      total: '总计'
    }
  }
};

// I18nProvider.tsx
const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>('ko');

  // 초기 언어 감지
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as SupportedLanguage;
    if (savedLanguage && translations[savedLanguage]) {
      setLanguageState(savedLanguage);
      return;
    }

    // 브라우저 언어 감지
    const browserLang = navigator.language.split('-')[0] as SupportedLanguage;
    if (translations[browserLang]) {
      setLanguageState(browserLang);
    }
  }, []);

  // 언어 변경 시 저장
  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    if (translations[lang]) {
      setLanguageState(lang);
    }
  }, []);

  // 번역 함수
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = translations[language];

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key; // 키를 찾지 못하면 키 자체 반환
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    // 파라미터 치환
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (_, param) =>
        String(params[param] ?? '')
      );
    }

    return value;
  }, [language]);

  // 날짜 포매팅
  const formatDate = useCallback((date: Date): string => {
    return new Intl.DateTimeFormat(language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }, [language]);

  // 숫자 포매팅
  const formatNumber = useCallback((num: number): string => {
    return new Intl.NumberFormat(language).format(num);
  }, [language]);

  // 통화 포매팅
  const formatCurrency = useCallback((amount: number, currency = 'USD'): string => {
    return new Intl.NumberFormat(language, {
      style: 'currency',
      currency: currency
    }).format(amount);
  }, [language]);

  const value = useMemo<I18nContextType>(() => ({
    language,
    setLanguage,
    t,
    formatDate,
    formatNumber,
    formatCurrency
  }), [language, setLanguage, t, formatDate, formatNumber, formatCurrency]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n은 I18nProvider 내부에서만 사용할 수 있습니다');
  }
  return context;
}

// 사용 예시
function LanguageSwitcher() {
  const { language, setLanguage } = useI18n();

  return (
    <select value={language} onChange={e => setLanguage(e.target.value as SupportedLanguage)}>
      <option value="ko">한국어</option>
      <option value="en">English</option>
      <option value="ja">日本語</option>
      <option value="zh">中文</option>
    </select>
  );
}

function WelcomeMessage() {
  const { t } = useI18n();
  const userName = 'John';

  return (
    <div>
      <h1>{t('common.welcome')}</h1>
      <p>{t('common.hello', { name: userName })}</p>
    </div>
  );
}

function ProductPrice({ price }: { price: number }) {
  const { formatCurrency } = useI18n();

  return (
    <span className="price">
      {formatCurrency(price, 'USD')}
    </span>
  );
}

function OrderDate({ date }: { date: Date }) {
  const { formatDate } = useI18n();

  return (
    <span className="date">
      {formatDate(date)}
    </span>
  );
}
```

**실무 팁**:
- 번역 파일은 JSON으로 분리하여 관리
- lazy loading으로 필요한 언어만 로드
- 번역 키 자동 완성을 위한 타입 정의
- Pluralization 지원 (1개, 2개 이상 등)

### 4. Shopping Cart Provider - 장바구니 상태 관리

전자상거래 필수 기능인 장바구니를 Provider로 구현합니다.

```typescript
// types.ts
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  stock: number;
  options?: Record<string, string>;
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  subtotal: number;
  tax: number;
  shipping: number;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  applyDiscount: (code: string) => Promise<void>;
  discount: number;
  isInCart: (id: string) => boolean;
  getItemQuantity: (id: string) => number;
}

// CartProvider.tsx
const CartContext = createContext<CartContextType | undefined>(undefined);

const TAX_RATE = 0.1; // 10% 세금
const FREE_SHIPPING_THRESHOLD = 50000; // 5만원 이상 무료배송
const SHIPPING_COST = 3000;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);

  // 로컬 스토리지 동기화
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setItems(parsedCart);
      } catch (error) {
        console.error('장바구니 데이터 로드 실패:', error);
        localStorage.removeItem('cart');
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  // 아이템 추가
  const addItem = useCallback((newItem: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === newItem.id);

      if (existingItem) {
        // 재고 확인
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > existingItem.stock) {
          alert(`재고가 부족합니다. 최대 ${existingItem.stock}개까지 구매 가능합니다.`);
          return prevItems;
        }

        return prevItems.map(item =>
          item.id === newItem.id
            ? { ...item, quantity: newQuantity }
            : item
        );
      }

      // 새 아이템 추가
      if (quantity > newItem.stock) {
        alert(`재고가 부족합니다. 최대 ${newItem.stock}개까지 구매 가능합니다.`);
        return prevItems;
      }

      return [...prevItems, { ...newItem, quantity }];
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
      prevItems.map(item => {
        if (item.id === id) {
          if (quantity > item.stock) {
            alert(`재고가 부족합니다. 최대 ${item.stock}개까지 구매 가능합니다.`);
            return item;
          }
          return { ...item, quantity };
        }
        return item;
      })
    );
  }, [removeItem]);

  // 장바구니 비우기
  const clearCart = useCallback(() => {
    if (confirm('장바구니를 비우시겠습니까?')) {
      setItems([]);
      setDiscount(0);
    }
  }, []);

  // 할인 코드 적용
  const applyDiscount = useCallback(async (code: string) => {
    try {
      const response = await fetch('/api/discount/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      if (response.ok) {
        const { discountPercent } = await response.json();
        setDiscount(discountPercent);
      } else {
        throw new Error('유효하지 않은 할인 코드입니다');
      }
    } catch (error) {
      throw error;
    }
  }, []);

  // 계산된 값들
  const totalItems = useMemo(() =>
    items.reduce((total, item) => total + item.quantity, 0)
  , [items]);

  const subtotal = useMemo(() =>
    items.reduce((total, item) => total + (item.price * item.quantity), 0)
  , [items]);

  const discountAmount = useMemo(() =>
    subtotal * (discount / 100)
  , [subtotal, discount]);

  const afterDiscount = useMemo(() =>
    subtotal - discountAmount
  , [subtotal, discountAmount]);

  const tax = useMemo(() =>
    Math.floor(afterDiscount * TAX_RATE)
  , [afterDiscount]);

  const shipping = useMemo(() =>
    afterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST
  , [afterDiscount]);

  const totalPrice = useMemo(() =>
    afterDiscount + tax + shipping
  , [afterDiscount, tax, shipping]);

  // 유틸리티 함수들
  const isInCart = useCallback((id: string) => {
    return items.some(item => item.id === id);
  }, [items]);

  const getItemQuantity = useCallback((id: string) => {
    const item = items.find(item => item.id === id);
    return item ? item.quantity : 0;
  }, [items]);

  const value = useMemo<CartContextType>(() => ({
    items,
    totalItems,
    totalPrice,
    subtotal,
    tax,
    shipping,
    discount: discountAmount,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    applyDiscount,
    isInCart,
    getItemQuantity
  }), [
    items, totalItems, totalPrice, subtotal, tax, shipping, discountAmount,
    addItem, removeItem, updateQuantity, clearCart, applyDiscount, isInCart, getItemQuantity
  ]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart는 CartProvider 내부에서만 사용할 수 있습니다');
  }
  return context;
}

// 사용 예시
function ProductCard({ product }: { product: Product }) {
  const { addItem, isInCart, getItemQuantity } = useCart();
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      stock: product.stock
    }, quantity);
  };

  return (
    <div className="product-card">
      <img src={product.image} alt={product.name} />
      <h3>{product.name}</h3>
      <p className="price">${product.price.toLocaleString()}</p>
      <p className="stock">재고: {product.stock}개</p>

      <div className="quantity-selector">
        <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
        <input type="number" value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 1)} />
        <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}>+</button>
      </div>

      <button onClick={handleAddToCart}>
        {isInCart(product.id)
          ? `장바구니에 ${getItemQuantity(product.id)}개 담김`
          : '장바구니에 추가'
        }
      </button>
    </div>
  );
}

function CartSummary() {
  const { totalItems, subtotal, discount, tax, shipping, totalPrice } = useCart();

  return (
    <div className="cart-summary">
      <h3>주문 요약</h3>
      <div className="summary-row">
        <span>상품 금액 ({totalItems}개)</span>
        <span>${subtotal.toLocaleString()}</span>
      </div>
      {discount > 0 && (
        <div className="summary-row discount">
          <span>할인</span>
          <span>-${discount.toLocaleString()}</span>
        </div>
      )}
      <div className="summary-row">
        <span>세금</span>
        <span>${tax.toLocaleString()}</span>
      </div>
      <div className="summary-row">
        <span>배송비</span>
        <span>{shipping === 0 ? '무료' : `$${shipping.toLocaleString()}`}</span>
      </div>
      {subtotal < FREE_SHIPPING_THRESHOLD && (
        <p className="free-shipping-notice">
          ${(FREE_SHIPPING_THRESHOLD - subtotal).toLocaleString()} 더 구매하시면 무료배송!
        </p>
      )}
      <div className="summary-row total">
        <strong>총 결제 금액</strong>
        <strong>${totalPrice.toLocaleString()}</strong>
      </div>
    </div>
  );
}

function CartBadge() {
  const { totalItems } = useCart();

  return (
    <button className="cart-button">
      🛒 장바구니
      {totalItems > 0 && (
        <span className="badge">{totalItems}</span>
      )}
    </button>
  );
}
```

**실무 팁**:
- 재고 관리 로직 필수
- 할인 코드, 쿠폰 시스템 통합
- 최소 주문 금액, 무료배송 조건 설정
- 장바구니 만료 시간 관리

### 5. Notification Provider - 알림 시스템

사용자에게 피드백을 제공하는 토스트 알림 시스템입니다.

```typescript
// types.ts
interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  remove: (id: string) => void;
  notify: (notification: Omit<Notification, 'id'>) => void;
}

// NotificationProvider.tsx
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // 알림 추가
  const notify = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = `notification-${Date.now()}-${Math.random()}`;
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? 3000
    };

    setNotifications(prev => [...prev, newNotification]);

    // 자동 제거
    if (newNotification.duration > 0) {
      setTimeout(() => {
        remove(id);
      }, newNotification.duration);
    }

    return id;
  }, []);

  // 알림 제거
  const remove = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // 편의 함수들
  const success = useCallback((message: string, duration?: number) => {
    notify({ type: 'success', message, duration });
  }, [notify]);

  const error = useCallback((message: string, duration?: number) => {
    notify({ type: 'error', message, duration });
  }, [notify]);

  const warning = useCallback((message: string, duration?: number) => {
    notify({ type: 'warning', message, duration });
  }, [notify]);

  const info = useCallback((message: string, duration?: number) => {
    notify({ type: 'info', message, duration });
  }, [notify]);

  const value = useMemo<NotificationContextType>(() => ({
    notifications,
    success,
    error,
    warning,
    info,
    remove,
    notify
  }), [notifications, success, error, warning, info, remove, notify]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
}

// 알림 컨테이너 컴포넌트
function NotificationContainer() {
  const { notifications, remove } = useNotification();

  return (
    <div className="notification-container">
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={() => remove(notification.id)}
        />
      ))}
    </div>
  );
}

function NotificationItem({
  notification,
  onClose
}: {
  notification: Notification;
  onClose: () => void;
}) {
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  return (
    <div className={`notification notification-${notification.type}`}>
      <span className="notification-icon">{icons[notification.type]}</span>
      <span className="notification-message">{notification.message}</span>
      {notification.action && (
        <button
          className="notification-action"
          onClick={notification.action.onClick}
        >
          {notification.action.label}
        </button>
      )}
      <button className="notification-close" onClick={onClose}>✕</button>
    </div>
  );
}

export function useNotification(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification은 NotificationProvider 내부에서만 사용할 수 있습니다');
  }
  return context;
}

// 사용 예시
function LoginForm() {
  const { success, error } = useNotification();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await login(email, password);
      success('로그인에 성공했습니다!');
    } catch (err) {
      error('로그인에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}

function DeleteButton({ itemId }: { itemId: string }) {
  const { notify, success, error } = useNotification();

  const handleDelete = async () => {
    // Undo 기능이 있는 알림
    notify({
      type: 'warning',
      message: '정말 삭제하시겠습니까?',
      duration: 5000,
      action: {
        label: '삭제',
        onClick: async () => {
          try {
            await deleteItem(itemId);
            success('삭제되었습니다');
          } catch (err) {
            error('삭제에 실패했습니다');
          }
        }
      }
    });
  };

  return <button onClick={handleDelete}>삭제</button>;
}
```

### 6. Modal Provider - 모달 관리

모달을 선언적으로 관리하는 Provider입니다.

```typescript
// types.ts
interface Modal {
  id: string;
  component: React.ComponentType<any>;
  props?: Record<string, any>;
}

interface ModalContextType {
  openModal: (component: React.ComponentType<any>, props?: Record<string, any>) => string;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
}

// ModalProvider.tsx
const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modals, setModals] = useState<Modal[]>([]);

  const openModal = useCallback((component: React.ComponentType<any>, props?: Record<string, any>) => {
    const id = `modal-${Date.now()}-${Math.random()}`;
    const newModal: Modal = { id, component, props };

    setModals(prev => [...prev, newModal]);

    // Body 스크롤 막기
    document.body.style.overflow = 'hidden';

    return id;
  }, []);

  const closeModal = useCallback((id: string) => {
    setModals(prev => {
      const filtered = prev.filter(m => m.id !== id);

      // 모든 모달이 닫히면 스크롤 복원
      if (filtered.length === 0) {
        document.body.style.overflow = '';
      }

      return filtered;
    });
  }, []);

  const closeAllModals = useCallback(() => {
    setModals([]);
    document.body.style.overflow = '';
  }, []);

  const value = useMemo<ModalContextType>(() => ({
    openModal,
    closeModal,
    closeAllModals
  }), [openModal, closeModal, closeAllModals]);

  return (
    <ModalContext.Provider value={value}>
      {children}
      <ModalContainer modals={modals} closeModal={closeModal} />
    </ModalContext.Provider>
  );
}

function ModalContainer({ modals, closeModal }: { modals: Modal[]; closeModal: (id: string) => void }) {
  if (modals.length === 0) return null;

  return (
    <div className="modal-overlay">
      {modals.map(modal => {
        const Component = modal.component;
        return (
          <div key={modal.id} className="modal">
            <Component {...modal.props} onClose={() => closeModal(modal.id)} />
          </div>
        );
      })}
    </div>
  );
}

export function useModal(): ModalContextType {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal은 ModalProvider 내부에서만 사용할 수 있습니다');
  }
  return context;
}

// 사용 예시
function ConfirmModal({
  title,
  message,
  onConfirm,
  onClose
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="confirm-modal">
      <h2>{title}</h2>
      <p>{message}</p>
      <div className="buttons">
        <button onClick={() => { onConfirm(); onClose(); }}>확인</button>
        <button onClick={onClose}>취소</button>
      </div>
    </div>
  );
}

function DeleteButton({ itemId }: { itemId: string }) {
  const { openModal } = useModal();

  const handleDelete = () => {
    openModal(ConfirmModal, {
      title: '삭제 확인',
      message: '정말 삭제하시겠습니까?',
      onConfirm: async () => {
        await deleteItem(itemId);
      }
    });
  };

  return <button onClick={handleDelete}>삭제</button>;
}
```

## Provider 계층 구조 시각화

실제 애플리케이션에서 여러 Provider를 조합하면 다음과 같은 계층 구조가 됩니다:

```
┌──────────────────────────────────────────────────────────┐
│                    App Component                         │
└──────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│              ThemeProvider (전체 앱)                    │
│  - theme: 'light' | 'dark'                             │
│  - colors: ThemeColors                                 │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│            I18nProvider (다국어)                       │
│  - language: 'ko' | 'en' | ...                         │
│  - t: (key: string) => string                          │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│           AuthProvider (인증)                          │
│  - user: User | null                                   │
│  - login, logout                                       │
└──────────────────────────┬─────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                                     │
┌───────▼──────────┐              ┌──────────▼────────────┐
│  CartProvider    │              │ NotificationProvider  │
│  (인증된 사용자만)│              │   (전역 알림)         │
└──────────────────┘              └───────────────────────┘
        │                                     │
┌───────▼──────────┐              ┌──────────▼────────────┐
│  ModalProvider   │              │   Router              │
│   (모달 관리)    │              │  (라우팅)             │
└──────────────────┘              └───────────────────────┘
        │                                     │
        └──────────────┬──────────────────────┘
                       │
            ┌──────────▼──────────┐
            │   App Content       │
            │ (Pages, Components) │
            └─────────────────────┘
```

**구현 코드**:

```typescript
// 1. 순차적 중첩 (가독성 좋음, 순서 명확)
function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <NotificationProvider>
            <ModalProvider>
              <CartProvider>
                <Router>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/cart" element={<CartPage />} />
                  </Routes>
                </Router>
              </CartProvider>
            </ModalProvider>
          </NotificationProvider>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

// 2. Provider Composer 패턴 (깔끔함, 동적 조합 가능)
function composeProviders(...providers: React.ComponentType<{ children: React.ReactNode }>[]) {
  return ({ children }: { children: React.ReactNode }) =>
    providers.reduceRight((acc, Provider) => <Provider>{acc}</Provider>, children);
}

const AppProviders = composeProviders(
  ThemeProvider,
  I18nProvider,
  AuthProvider,
  NotificationProvider,
  ModalProvider,
  CartProvider
);

function App() {
  return (
    <AppProviders>
      <Router>
        <Routes>...</Routes>
      </Router>
    </AppProviders>
  );
}

// 3. 조건부 Provider (동적 구성)
function App() {
  const isAuthenticated = useAuth();

  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <NotificationProvider>
            {isAuthenticated ? (
              <CartProvider>
                <ModalProvider>
                  <AuthenticatedApp />
                </ModalProvider>
              </CartProvider>
            ) : (
              <PublicApp />
            )}
          </NotificationProvider>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
```

## 성능 최적화 전략

Provider Pattern의 가장 큰 문제는 **불필요한 리렌더링**입니다. Context 값이 변경되면 해당 Context를 사용하는 모든 컴포넌트가 리렌더링됩니다.

### 1. useMemo로 Context 값 메모이제이션

```typescript
// ❌ 나쁜 예: 매 렌더링마다 새 객체 생성
function BadProvider({ children }) {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');

  // 렌더링마다 새 객체 생성 → 모든 소비자 리렌더링!
  const value = {
    user,
    setUser,
    theme,
    setTheme
  };

  return <MyContext.Provider value={value}>{children}</MyContext.Provider>;
}

// ✅ 좋은 예: useMemo로 최적화
function GoodProvider({ children }) {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');

  // 의존성이 변경될 때만 새 객체 생성
  const value = useMemo(() => ({
    user,
    setUser,
    theme,
    setTheme
  }), [user, theme]); // setUser, setTheme은 안정적이므로 생략 가능

  return <MyContext.Provider value={value}>{children}</MyContext.Provider>;
}
```

### 2. Context 분리 (Split Contexts)

하나의 Context에 여러 값을 넣으면, 한 값이 변경될 때 모든 소비자가 리렌더링됩니다. Context를 분리하면 이를 방지할 수 있습니다.

```typescript
// ❌ 나쁜 예: 하나의 Context에 모든 것
function BadAppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');
  const [cart, setCart] = useState([]);

  const value = useMemo(() => ({
    user, setUser,
    theme, setTheme,
    cart, setCart
  }), [user, theme, cart]);

  // 문제: theme만 변경되어도 user나 cart를 사용하는 모든 컴포넌트가 리렌더링!
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ✅ 좋은 예: Context 분리
function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const value = useMemo(() => ({ user, setUser }), [user]);
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const value = useMemo(() => ({ theme, setTheme }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const value = useMemo(() => ({ cart, setCart }), [cart]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// 이제 각 Context는 독립적으로 업데이트됨
function App() {
  return (
    <UserProvider>
      <ThemeProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </ThemeProvider>
    </UserProvider>
  );
}

// theme만 사용하는 컴포넌트는 user나 cart 변경 시 리렌더링 안 됨!
function ThemeButton() {
  const { theme, toggleTheme } = useTheme();
  console.log('ThemeButton rendered'); // theme 변경 시에만 출력
  return <button onClick={toggleTheme}>{theme}</button>;
}
```

### 3. State와 Dispatch 분리

상태를 읽기만 하는 컴포넌트와 변경만 하는 컴포넌트가 있다면, Context를 분리하세요.

```typescript
// State Context (읽기 전용)
const StateContext = createContext<State | undefined>(undefined);

// Dispatch Context (쓰기 전용)
const DispatchContext = createContext<Dispatch | undefined>(undefined);

function MyProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // dispatch는 항상 동일한 참조를 유지하므로 메모이제이션 불필요
  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
}

// 읽기만 하는 Hook
export function useState() {
  const context = useContext(StateContext);
  if (!context) throw new Error('Provider 필요');
  return context;
}

// 쓰기만 하는 Hook
export function useDispatch() {
  const context = useContext(DispatchContext);
  if (!context) throw new Error('Provider 필요');
  return context;
}

// 사용 예시
function DisplayComponent() {
  const state = useState(); // state 변경 시에만 리렌더링
  return <div>{state.value}</div>;
}

function ControlComponent() {
  const dispatch = useDispatch(); // dispatch는 절대 변경 안 되므로 리렌더링 안 됨
  return <button onClick={() => dispatch({ type: 'INCREMENT' })}>증가</button>;
}
```

### 4. React.memo로 컴포넌트 메모이제이션

```typescript
// Context 소비자를 memo로 감싸기
const ExpensiveComponent = React.memo(function ExpensiveComponent() {
  const { theme } = useTheme();

  console.log('ExpensiveComponent rendered');

  // 무거운 연산...
  const expensiveValue = useMemo(() => {
    return heavyComputation();
  }, [theme]);

  return <div>{expensiveValue}</div>;
});

// Props 비교 함수로 세밀한 제어
const UserCard = React.memo(
  function UserCard({ user }: { user: User }) {
    return (
      <div>
        <h3>{user.name}</h3>
        <p>{user.email}</p>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // user.id가 같으면 리렌더링 안 함
    return prevProps.user.id === nextProps.user.id;
  }
);
```

### 5. Context Selector 패턴

Context의 일부분만 구독하는 방법입니다.

```typescript
// use-context-selector 라이브러리 사용
import { createContext, useContextSelector } from 'use-context-selector';

interface AppState {
  user: User | null;
  theme: string;
  cart: CartItem[];
  notifications: Notification[];
}

const AppContext = createContext<AppState | undefined>(undefined);

function AppProvider({ children }) {
  const [state, setState] = useState<AppState>({
    user: null,
    theme: 'light',
    cart: [],
    notifications: []
  });

  return <AppContext.Provider value={state}>{children}</AppContext.Provider>;
}

// 특정 필드만 구독
function UserName() {
  // user.name이 변경될 때만 리렌더링
  const userName = useContextSelector(AppContext, state => state.user?.name);
  return <div>{userName}</div>;
}

function ThemeButton() {
  // theme이 변경될 때만 리렌더링
  const theme = useContextSelector(AppContext, state => state.theme);
  return <button>{theme}</button>;
}
```

### 6. 성능 측정 도구

```typescript
// React DevTools Profiler로 측정
import { Profiler } from 'react';

function onRenderCallback(
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number
) {
  console.log(`${id} ${phase} took ${actualDuration}ms`);
}

function App() {
  return (
    <Profiler id="App" onRender={onRenderCallback}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </Profiler>
  );
}

// why-did-you-render 라이브러리
import whyDidYouRender from '@welldone-software/why-did-you-render';

if (process.env.NODE_ENV === 'development') {
  whyDidYouRender(React, {
    trackAllPureComponents: true,
    logOnDifferentValues: true
  });
}

// 컴포넌트에 추적 활성화
MyComponent.whyDidYouRender = true;
```

## 함정과 주의사항

Provider Pattern을 사용하면서 자주 겪는 문제들을 정리했습니다.

### 1. Context Hell (Provider 중첩 지옥)

```typescript
// ❌ 읽기 어려운 Provider 중첩
function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <NotificationProvider>
            <ModalProvider>
              <CartProvider>
                <WishlistProvider>
                  <SearchProvider>
                    <FilterProvider>
                      <Router>
                        <Routes>...</Routes>
                      </Router>
                    </FilterProvider>
                  </SearchProvider>
                </WishlistProvider>
              </CartProvider>
            </ModalProvider>
          </NotificationProvider>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

// ✅ Provider Composer로 해결
const AppProviders = composeProviders(
  ThemeProvider,
  I18nProvider,
  AuthProvider,
  NotificationProvider,
  ModalProvider,
  CartProvider,
  WishlistProvider,
  SearchProvider,
  FilterProvider
);

function App() {
  return (
    <AppProviders>
      <Router>
        <Routes>...</Routes>
      </Router>
    </AppProviders>
  );
}
```

### 2. Provider 없이 Hook 사용

```typescript
// ❌ 에러 메시지가 불친절
const ThemeContext = createContext(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  return context; // undefined 반환 가능!
}

// 사용 시 런타임 에러
function MyComponent() {
  const { theme } = useTheme(); // TypeError: Cannot read property 'theme' of undefined
  return <div>{theme}</div>;
}

// ✅ 명확한 에러 메시지 제공
export function useTheme() {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error(
      'useTheme은 ThemeProvider 내부에서만 사용할 수 있습니다. ' +
      'App 컴포넌트를 <ThemeProvider>로 감싸주세요.'
    );
  }

  return context;
}
```

### 3. 과도한 리렌더링

```typescript
// ❌ 문제: 모든 필드가 하나의 Context
interface AppContextType {
  user: User | null;
  theme: string;
  cart: CartItem[];
  notifications: Notification[];
  // ... 10개 이상의 필드
}

// 한 필드만 변경되어도 모든 소비자가 리렌더링!

// ✅ 해결 1: Context 분리
<UserProvider>
  <ThemeProvider>
    <CartProvider>
      <NotificationProvider>
        ...
      </NotificationProvider>
    </CartProvider>
  </ThemeProvider>
</UserProvider>

// ✅ 해결 2: Context Selector 사용
const theme = useContextSelector(AppContext, state => state.theme);

// ✅ 해결 3: State와 Dispatch 분리
const state = useAppState();
const dispatch = useAppDispatch();
```

### 4. 초기값 함정

```typescript
// ❌ 나쁜 예: null을 초기값으로 사용하면 타입 체크가 번거로움
const ThemeContext = createContext<ThemeContextType | null>(null);

function useTheme() {
  const context = useContext(ThemeContext);
  // 매번 null 체크 필요
  if (context === null) {
    throw new Error('Provider 필요');
  }
  return context;
}

// ✅ 좋은 예: undefined를 사용하고 타입 단언
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('Provider 필요');
  }
  return context; // 여기서 타입이 ThemeContextType으로 좁혀짐
}
```

### 5. 메모이제이션 누락

```typescript
// ❌ 성능 문제: 매 렌더링마다 새 함수 생성
function MyProvider({ children }) {
  const [state, setState] = useState(initialState);

  const value = {
    state,
    updateState: (newState) => setState(newState), // 매번 새 함수!
    resetState: () => setState(initialState) // 매번 새 함수!
  };

  return <MyContext.Provider value={value}>{children}</MyContext.Provider>;
}

// ✅ 해결: useCallback과 useMemo
function MyProvider({ children }) {
  const [state, setState] = useState(initialState);

  const updateState = useCallback((newState) => {
    setState(newState);
  }, []);

  const resetState = useCallback(() => {
    setState(initialState);
  }, []);

  const value = useMemo(() => ({
    state,
    updateState,
    resetState
  }), [state, updateState, resetState]);

  return <MyContext.Provider value={value}>{children}</MyContext.Provider>;
}
```

### 6. 순환 의존성

```typescript
// ❌ 문제: CartProvider가 AuthProvider를 사용하고, AuthProvider가 CartProvider를 사용
function CartProvider({ children }) {
  const { user } = useAuth(); // AuthProvider 필요
  // ...
}

function AuthProvider({ children }) {
  const { clearCart } = useCart(); // CartProvider 필요 → 순환 의존성!
  // ...
}

// ✅ 해결: 이벤트 시스템이나 공통 상위 Provider 사용
const EventBus = createContext<EventEmitter>(new EventEmitter());

function AuthProvider({ children }) {
  const eventBus = useContext(EventBus);

  const logout = useCallback(() => {
    setUser(null);
    eventBus.emit('user:logout'); // 이벤트 발행
  }, []);

  // ...
}

function CartProvider({ children }) {
  const eventBus = useContext(EventBus);

  useEffect(() => {
    const handler = () => clearCart();
    eventBus.on('user:logout', handler);
    return () => eventBus.off('user:logout', handler);
  }, []);

  // ...
}
```

## Redux vs Context API 비교

"Context API만으로 충분할까, 아니면 Redux를 사용해야 할까?"는 React 개발자라면 한 번쯤 고민하는 질문입니다.

### 언제 Context API를 사용할까?

**✅ Context API가 적합한 경우:**

1. **간단한 전역 상태**: 테마, 언어, 사용자 인증 정보 등
2. **업데이트 빈도가 낮음**: 자주 변경되지 않는 데이터
3. **작은 팀/프로젝트**: 보일러플레이트를 최소화하고 싶을 때
4. **컴포넌트 레벨 상태 공유**: 특정 컴포넌트 트리에서만 사용

```typescript
// Context API로 충분한 예시
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

### 언제 Redux를 사용할까?

**✅ Redux가 적합한 경우:**

1. **복잡한 상태 로직**: 비동기 작업, 캐싱, 낙관적 업데이트 등
2. **높은 업데이트 빈도**: 실시간 데이터, 채팅, 게임 등
3. **DevTools 필요**: 타임 트래블 디버깅, 상태 추적
4. **미들웨어 필요**: Redux Thunk, Redux Saga 등
5. **대규모 프로젝트**: 명확한 구조와 패턴 필요

```typescript
// Redux가 필요한 예시
const todosSlice = createSlice({
  name: 'todos',
  initialState: {
    items: [],
    status: 'idle',
    error: null
  },
  reducers: {
    todoAdded: (state, action) => {
      state.items.push(action.payload);
    },
    todoToggled: (state, action) => {
      const todo = state.items.find(t => t.id === action.payload);
      if (todo) {
        todo.completed = !todo.completed;
      }
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchTodos.pending, state => {
        state.status = 'loading';
      })
      .addCase(fetchTodos.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchTodos.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  }
});
```

### 비교표

| 특성 | Context API | Redux | Zustand | Jotai |
|------|------------|-------|---------|-------|
| **학습 곡선** | 낮음 | 높음 | 낮음 | 중간 |
| **보일러플레이트** | 적음 | 많음 | 매우 적음 | 적음 |
| **DevTools** | 기본 제공 안 함 | 강력한 DevTools | 기본 DevTools | React DevTools |
| **성능 최적화** | 수동 (memo, split) | 자동 (selector) | 자동 | 자동 |
| **미들웨어** | 직접 구현 | 풍부한 생태계 | 간단한 미들웨어 | Suspense 통합 |
| **번들 크기** | 0 (내장) | ~8KB | ~1KB | ~3KB |
| **타입 지원** | 좋음 | 매우 좋음 | 좋음 | 매우 좋음 |
| **비동기 처리** | 직접 구현 | Thunk, Saga | 내장 | Suspense |

### 하이브리드 접근법

실무에서는 두 가지를 함께 사용하는 것이 일반적입니다:

```typescript
// Context API: 정적이거나 느리게 변하는 데이터
<ThemeProvider>
  <I18nProvider>
    <AuthProvider>
      {/* Redux: 복잡하고 자주 변하는 데이터 */}
      <Provider store={store}>
        <App />
      </Provider>
    </AuthProvider>
  </I18nProvider>
</ThemeProvider>
```

**실무 조언**:
- 프로젝트 초기에는 Context API로 시작
- 복잡도가 증가하면 Redux/Zustand로 마이그레이션
- 상태 관리 라이브러리는 필요할 때 도입

## Zustand, Jotai와의 비교

Context API의 성능 문제를 해결하는 최신 상태 관리 라이브러리들입니다.

### Zustand 예시

```typescript
import create from 'zustand';

// ✅ 매우 간결한 스토어 생성
const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (item) => set(state => ({
    items: [...state.items, item]
  })),

  removeItem: (id) => set(state => ({
    items: state.items.filter(item => item.id !== id)
  })),

  totalPrice: () => {
    const items = get().items;
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
}));

// 사용: Provider 불필요!
function CartBadge() {
  // items만 구독 → items 변경 시에만 리렌더링
  const items = useCartStore(state => state.items);
  return <span>{items.length}</span>;
}

function CheckoutButton() {
  // totalPrice만 구독
  const totalPrice = useCartStore(state => state.totalPrice());
  return <button>결제 (${totalPrice})</button>;
}

function AddToCartButton({ product }) {
  // 상태를 구독하지 않음 → 절대 리렌더링 안 됨!
  const addItem = useCartStore(state => state.addItem);
  return <button onClick={() => addItem(product)}>추가</button>;
}
```

**Zustand 장점**:
- Provider 불필요 (전역 스토어)
- 자동 선택적 구독 (selector)
- 매우 작은 번들 크기 (~1KB)
- TypeScript 완벽 지원

### Jotai 예시

```typescript
import { atom, useAtom } from 'jotai';

// ✅ Atom 기반 상태 관리 (Recoil과 유사)
const cartItemsAtom = atom<CartItem[]>([]);

const totalPriceAtom = atom(get => {
  const items = get(cartItemsAtom);
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

// 사용
function CartBadge() {
  const [items] = useAtom(cartItemsAtom);
  return <span>{items.length}</span>;
}

function CheckoutButton() {
  const [totalPrice] = useAtom(totalPriceAtom);
  return <button>결제 (${totalPrice})</button>;
}
```

**Jotai 장점**:
- Bottom-up 접근 (작은 atom들을 조합)
- React Suspense 완벽 통합
- 타입 추론 자동

### 언제 어떤 것을 사용할까?

```typescript
// Context API: 간단한 전역 상태, 교육 목적
<ThemeProvider>...</ThemeProvider>

// Zustand: 중간 규모, 간결함 선호
const useStore = create(...)

// Jotai: 세밀한 상태 관리, Suspense 필요
const userAtom = atom(...)

// Redux: 대규모 프로젝트, DevTools 필수
const store = configureStore(...)
```

## 실전 베스트 프랙티스

제가 실무에서 사용하는 Provider Pattern 베스트 프랙티스를 정리했습니다.

### 1. 타입 안전성 보장

```typescript
// types.ts에 모든 타입 정의
export interface ThemeContextType {
  theme: 'light' | 'dark';
  colors: ThemeColors;
  toggleTheme: () => void;
}

// Provider와 Hook을 하나의 파일에
// ThemeProvider.tsx
export function ThemeProvider({ children }: PropsWithChildren) {
  // 구현...
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error(
      'useTheme must be used within ThemeProvider\n\n' +
      'Wrap your component tree with <ThemeProvider>:\n' +
      '<ThemeProvider>\n' +
      '  <App />\n' +
      '</ThemeProvider>'
    );
  }

  return context;
}

// 내보내기는 Provider와 Hook만
export { ThemeProvider, useTheme };
```

### 2. 개발자 경험 개선

```typescript
// Provider 디버깅 정보
export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setTheme] = useState('light');

  // 개발 모드에서만 디버깅 정보 제공
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[ThemeProvider] Theme changed:', theme);
      window.__THEME_STATE__ = { theme }; // DevTools에서 접근 가능
    }
  }, [theme]);

  // ...
}

// Provider 사용 여부 확인
if (process.env.NODE_ENV === 'development') {
  ThemeProvider.displayName = 'ThemeProvider';
}
```

### 3. 테스트 유틸리티 제공

```typescript
// ThemeProvider.test.tsx
import { renderHook } from '@testing-library/react-hooks';

// 테스트 헬퍼
export function renderWithTheme(component: React.ReactElement, theme = 'light') {
  return render(
    <ThemeProvider initialTheme={theme}>
      {component}
    </ThemeProvider>
  );
}

// 사용
test('테마 버튼이 올바르게 렌더링된다', () => {
  const { getByText } = renderWithTheme(<ThemeButton />);
  expect(getByText('다크 모드')).toBeInTheDocument();
});
```

### 4. 로딩과 에러 상태 처리

```typescript
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  // ...
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState({
    user: null,
    isLoading: true,
    error: null
  });

  // 초기 로딩
  useEffect(() => {
    const initAuth = async () => {
      try {
        const user = await fetchCurrentUser();
        setState({ user, isLoading: false, error: null });
      } catch (error) {
        setState({ user: null, isLoading: false, error });
      }
    };

    initAuth();
  }, []);

  // 로딩 중에는 children 렌더링 안 함
  if (state.isLoading) {
    return <LoadingScreen />;
  }

  // 에러 발생 시 에러 화면
  if (state.error) {
    return <ErrorScreen error={state.error} />;
  }

  return (
    <AuthContext.Provider value={state}>
      {children}
    </AuthContext.Provider>
  );
}
```

### 5. Provider 설정 옵션 제공

```typescript
interface ThemeProviderProps extends PropsWithChildren {
  defaultTheme?: 'light' | 'dark';
  storageKey?: string;
  disableTransition?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  storageKey = 'theme',
  disableTransition = false
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>(defaultTheme);

  // 로컬 스토리지 커스터마이징
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) setTheme(saved as 'light' | 'dark');
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, theme);

    // 트랜지션 비활성화 옵션
    if (disableTransition) {
      document.documentElement.style.transition = 'none';
    }

    document.documentElement.setAttribute('data-theme', theme);

    if (disableTransition) {
      setTimeout(() => {
        document.documentElement.style.transition = '';
      }, 0);
    }
  }, [theme, storageKey, disableTransition]);

  // ...
}

// 사용
<ThemeProvider
  defaultTheme="dark"
  storageKey="my-app-theme"
  disableTransition
>
  <App />
</ThemeProvider>
```

### 6. Context 문서화

```typescript
/**
 * Theme Provider
 *
 * 애플리케이션 전체의 테마(라이트/다크 모드)를 관리합니다.
 *
 * @example
 * ```tsx
 * import { ThemeProvider, useTheme } from './ThemeProvider';
 *
 * function App() {
 *   return (
 *     <ThemeProvider>
 *       <MyComponent />
 *     </ThemeProvider>
 *   );
 * }
 *
 * function MyComponent() {
 *   const { theme, toggleTheme } = useTheme();
 *   return <button onClick={toggleTheme}>{theme}</button>;
 * }
 * ```
 *
 * @param {PropsWithChildren} props
 * @param {('light'|'dark')} [props.defaultTheme='light'] - 초기 테마
 * @param {string} [props.storageKey='theme'] - 로컬 스토리지 키
 */
export function ThemeProvider({ ... }: ThemeProviderProps) {
  // ...
}
```

## 실제 프로젝트 적용 사례

제가 실제로 작업했던 프로젝트의 Provider 구조를 공유합니다.

### E-Commerce 프로젝트 구조

```
src/
├── providers/
│   ├── index.tsx                 # Provider Composer
│   ├── ThemeProvider.tsx         # 테마 관리
│   ├── I18nProvider.tsx          # 다국어
│   ├── AuthProvider.tsx          # 인증
│   ├── CartProvider.tsx          # 장바구니
│   ├── NotificationProvider.tsx  # 알림
│   └── AnalyticsProvider.tsx     # 분석
├── hooks/
│   ├── useTheme.ts
│   ├── useI18n.ts
│   ├── useAuth.ts
│   ├── useCart.ts
│   └── useNotification.ts
└── App.tsx
```

**providers/index.tsx**:

```typescript
import { composeProviders } from './utils';
import { ThemeProvider } from './ThemeProvider';
import { I18nProvider } from './I18nProvider';
import { AuthProvider } from './AuthProvider';
import { CartProvider } from './CartProvider';
import { NotificationProvider } from './NotificationProvider';
import { AnalyticsProvider } from './AnalyticsProvider';

// 순서가 중요함: 의존성 순서대로 배치
export const AppProviders = composeProviders(
  ThemeProvider,          // 1. 테마 (다른 Provider들이 사용할 수 있음)
  I18nProvider,           // 2. 다국어
  AnalyticsProvider,      // 3. 분석 (Auth 이벤트 추적)
  AuthProvider,           // 4. 인증 (Cart가 user 정보 필요)
  NotificationProvider,   // 5. 알림
  CartProvider            // 6. 장바구니 (Auth 필요)
);

// utils
function composeProviders(...providers: React.ComponentType<{ children: React.ReactNode }>[]) {
  return ({ children }: { children: React.ReactNode }) =>
    providers.reduceRight((acc, Provider) => <Provider>{acc}</Provider>, children);
}
```

## 마치며

Provider Pattern은 React에서 전역 상태를 관리하는 가장 기본적이면서도 강력한 패턴입니다. 처음에는 prop drilling을 해결하는 단순한 방법으로 시작했지만, 지금은 테마, 인증, 다국어, 장바구니 등 모든 전역 상태를 Provider로 관리합니다.

핵심은 **적절한 추상화**와 **성능 최적화**입니다. Context를 너무 많이 쪼개면 관리가 어려워지고, 너무 크게 만들면 성능 문제가 발생합니다. 프로젝트의 규모와 복잡도에 맞게 균형을 찾는 것이 중요합니다.

작은 프로젝트에서는 Context API만으로 충분하지만, 규모가 커지면 Zustand나 Jotai 같은 최신 라이브러리를 고려해보세요. 무엇보다 중요한 것은 팀의 상황과 프로젝트의 요구사항에 맞는 도구를 선택하는 것입니다.

여러분의 Provider Pattern 경험은 어떠신가요? 어떤 상황에서 어떤 도구를 선택하시나요?

## 참고 자료

### 공식 문서
- [React Context API 공식 문서](https://react.dev/reference/react/createContext)
- [React useContext Hook](https://react.dev/reference/react/useContext)
- [React 18 새로운 기능](https://react.dev/blog/2022/03/29/react-v18)

### 아티클 및 튜토리얼
- [Kent C. Dodds - How to use React Context effectively](https://kentcdodds.com/blog/how-to-use-react-context-effectively)
- [Mark Erikson - Context vs Redux](https://blog.isquaredsoftware.com/2021/01/context-redux-differences/)
- [React Context Performance](https://github.com/facebook/react/issues/15156)
- [When to use React Context](https://kentcdodds.com/blog/application-state-management-with-react)

### 상태 관리 라이브러리
- [Zustand](https://github.com/pmndrs/zustand) - 간단하고 강력한 상태 관리
- [Jotai](https://jotai.org/) - Atom 기반 상태 관리
- [Valtio](https://github.com/pmndrs/valtio) - Proxy 기반 상태 관리
- [Redux Toolkit](https://redux-toolkit.js.org/) - Redux 공식 툴킷
- [MobX](https://mobx.js.org/) - Observable 기반 상태 관리

### 성능 최적화
- [use-context-selector](https://github.com/dai-shi/use-context-selector) - Context 선택적 구독
- [Why Did You Render](https://github.com/welldone-software/why-did-you-render) - 리렌더링 디버깅
- [React DevTools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi) - Profiler 기능

### 실전 예제
- [React Patterns](https://reactpatterns.com/) - React 패턴 모음
- [Bulletproof React](https://github.com/alan2207/bulletproof-react) - 프로덕션 레벨 React 구조
- [Real World React Apps](https://github.com/jeromedalbert/real-world-react-apps) - 실제 오픈소스 프로젝트
{% endraw %}