import { lazy, Suspense } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import ScrollToTop from "./components/ScrollToTop";
import Shop from "./pages/Shop";
import {
  ADMIN_DASHBOARD_PATH,
  ADMIN_LOGIN_PATH,
  ADMIN_REGISTER_PATH,
  CUSTOMER_ACCOUNT_PATH,
  CUSTOMER_FORGOT_PASSWORD_PATH,
  CUSTOMER_LOGIN_PATH,
  CUSTOMER_REGISTER_PATH,
} from "./config/routes";

const MainLayout = lazy(() => import("./layouts/MainLayout"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Users = lazy(() => import("./pages/Users"));
const AuditLogs = lazy(() => import("./pages/AuditLogs"));
const Settings = lazy(() => import("./pages/Settings"));
const MyAccount = lazy(() => import("./pages/MyAccount"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const EmailAccounts = lazy(() => import("./pages/EmailAccounts"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Products = lazy(() => import("./pages/Products"));
const ContentManagement = lazy(() =>
  import("./pages/ContentManagement")
);
const Orders = lazy(() => import("./pages/Orders"));
const CustomerLogin = lazy(() => import("./pages/CustomerLogin"));
const CustomerRegister = lazy(() =>
  import("./pages/CustomerRegister")
);
const CustomerForgotPassword = lazy(() =>
  import("./pages/CustomerForgotPassword")
);
const CustomerAccount = lazy(() =>
  import("./pages/CustomerAccount")
);
const Checkout = lazy(() => import("./pages/Checkout"));
const Payment = lazy(() => import("./pages/Payment"));
const OrderStatus = lazy(() => import("./pages/OrderStatus"));
const SearchOrder = lazy(() => import("./pages/SearchOrder"));
const Articles = lazy(() => import("./pages/Articles"));
const ArticleDetail = lazy(() => import("./pages/ArticleDetail"));
const LegalPage = lazy(() => import("./pages/LegalPage"));

function PageLoader() {
  return (
    <div className="min-h-screen bg-[#070604] px-4 py-10 text-white">
      <div className="mx-auto flex min-h-[50vh] max-w-6xl items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#d5a756]/30 border-t-[#d5a756]" />
      </div>
    </div>
  );
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to={ADMIN_LOGIN_PATH} replace />;
  }

  return children;
}

function AdminRoute({ children }) {
  const user = getStoredUser();

  if (user?.role !== "ADMIN") {
    return <Navigate to={ADMIN_DASHBOARD_PATH} replace />;
  }

  return children;
}

function AdminPage({ children, adminOnly = false }) {
  const page = <MainLayout>{children}</MainLayout>;

  return (
    <ProtectedRoute>
      {adminOnly ? <AdminRoute>{page}</AdminRoute> : page}
    </ProtectedRoute>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Shop />} />
          <Route path="/shop" element={<Shop />} />

          <Route path={ADMIN_LOGIN_PATH} element={<Login />} />
          <Route
            path={ADMIN_REGISTER_PATH}
            element={<Register />}
          />

          <Route
            path={CUSTOMER_LOGIN_PATH}
            element={<CustomerLogin />}
          />
          <Route
            path={CUSTOMER_REGISTER_PATH}
            element={<CustomerRegister />}
          />
          <Route
            path={CUSTOMER_FORGOT_PASSWORD_PATH}
            element={<CustomerForgotPassword />}
          />
          <Route
            path={CUSTOMER_ACCOUNT_PATH}
            element={<CustomerAccount />}
          />

          <Route
            path={ADMIN_DASHBOARD_PATH}
            element={
              <AdminPage>
                <Dashboard />
              </AdminPage>
            }
          />
          <Route
            path="/emails"
            element={
              <AdminPage>
                <EmailAccounts />
              </AdminPage>
            }
          />
          <Route
            path="/transactions"
            element={
              <AdminPage>
                <Transactions />
              </AdminPage>
            }
          />
          <Route
            path="/my-account"
            element={
              <AdminPage>
                <MyAccount />
              </AdminPage>
            }
          />
          <Route
            path="/users"
            element={
              <AdminPage adminOnly>
                <Users />
              </AdminPage>
            }
          />
          <Route
            path="/audit-logs"
            element={
              <AdminPage adminOnly>
                <AuditLogs />
              </AdminPage>
            }
          />
          <Route
            path="/settings"
            element={
              <AdminPage adminOnly>
                <Settings />
              </AdminPage>
            }
          />
          <Route
            path="/products"
            element={
              <AdminPage adminOnly>
                <Products />
              </AdminPage>
            }
          />
          <Route
            path="/content"
            element={
              <AdminPage adminOnly>
                <ContentManagement />
              </AdminPage>
            }
          />
          <Route
            path="/orders"
            element={
              <AdminPage adminOnly>
                <Orders />
              </AdminPage>
            }
          />

          <Route path="/checkout/:slug" element={<Checkout />} />
          <Route path="/payment/:id" element={<Payment />} />
          <Route path="/order/:id" element={<OrderStatus />} />
          <Route path="/search-order" element={<SearchOrder />} />
          <Route path="/articles" element={<Articles />} />
          <Route
            path="/articles/:slug"
            element={<ArticleDetail />}
          />
          <Route path="/syarat-ketentuan" element={<LegalPage />} />
          <Route path="/kebijakan-privasi" element={<LegalPage />} />
          <Route path="/bantuan" element={<LegalPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
