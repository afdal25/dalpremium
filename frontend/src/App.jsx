import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Users from "./pages/Users";
import AuditLogs from "./pages/AuditLogs";
import Settings from "./pages/Settings";
import MyAccount from "./pages/MyAccount";
import Dashboard from "./pages/Dashboard";
import EmailAccounts from "./pages/EmailAccounts";
import Transactions from "./pages/Transactions";
import Products from "./pages/Products";
import ContentManagement from "./pages/ContentManagement";
import Orders from "./pages/Orders";
import Shop from "./pages/Shop";
import CustomerLogin from "./pages/CustomerLogin";
import CustomerRegister from "./pages/CustomerRegister";
import CustomerForgotPassword from "./pages/CustomerForgotPassword";
import CustomerAccount from "./pages/CustomerAccount";
import Checkout from "./pages/Checkout";
import Payment from "./pages/Payment";
import OrderStatus from "./pages/OrderStatus";
import SearchOrder from "./pages/SearchOrder";
import Articles from "./pages/Articles";
import ArticleDetail from "./pages/ArticleDetail";
import LegalPage from "./pages/LegalPage";
import ScrollToTop from "./components/ScrollToTop";
import {
  ADMIN_DASHBOARD_PATH,
  ADMIN_LOGIN_PATH,
  ADMIN_REGISTER_PATH,
  CUSTOMER_LOGIN_PATH,
  CUSTOMER_FORGOT_PASSWORD_PATH,
  CUSTOMER_ACCOUNT_PATH,
  CUSTOMER_REGISTER_PATH,
} from "./config/routes";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to={ADMIN_LOGIN_PATH} replace />;
  }

  return children;
}

function AdminRoute({ children }) {
  const user = JSON.parse(
    localStorage.getItem("user")
  );

  if (user?.role !== "ADMIN") {
    return <Navigate to={ADMIN_DASHBOARD_PATH} replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route
          path={ADMIN_LOGIN_PATH}
          element={<Login />}
        />

        <Route
          path={ADMIN_REGISTER_PATH}
          element={<Register />}
        />

        <Route
          path="/"
          element={<Shop />}
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
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/emails"
          element={
            <ProtectedRoute>
              <MainLayout>
                <EmailAccounts />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Transactions />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <MainLayout>
                  <Users />
                </MainLayout>
              </AdminRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <MainLayout>
                  <AuditLogs />
                </MainLayout>
              </AdminRoute>
            </ProtectedRoute>
          }
        />

        <Route
  path="/settings"
  element={
    <ProtectedRoute>
      {JSON.parse(
        localStorage.getItem("user")
      )?.role === "ADMIN" ? (
        <MainLayout>
          <Settings />
        </MainLayout>
      ) : (
        <Navigate to={ADMIN_DASHBOARD_PATH} replace />
      )}
    </ProtectedRoute>
  }
/>

<Route
  path="/my-account"
  element={
    <ProtectedRoute>
      <MainLayout>
        <MyAccount />
      </MainLayout>
    </ProtectedRoute>
  }
/>

<Route
  path="/products"
  element={
    <ProtectedRoute>
      <AdminRoute>
        <MainLayout>
          <Products />
        </MainLayout>
      </AdminRoute>
    </ProtectedRoute>
  }
/>

<Route
  path="/content"
  element={
    <ProtectedRoute>
      <AdminRoute>
        <MainLayout>
          <ContentManagement />
        </MainLayout>
      </AdminRoute>
    </ProtectedRoute>
  }
/>

<Route
  path="/orders"
  element={
    <ProtectedRoute>
      <AdminRoute>
        <MainLayout>
          <Orders />
        </MainLayout>
      </AdminRoute>
    </ProtectedRoute>
  }
/>

<Route
  path="/shop"
  element={<Shop />}
/>

<Route
  path="/checkout/:slug"
  element={<Checkout />}
/>

<Route
  path="/payment/:id"
  element={<Payment />}
/>

<Route
  path="/order/:id"
  element={<OrderStatus />}
/>

<Route
  path="/search-order"
  element={<SearchOrder />}
/>

<Route
  path="/articles"
  element={<Articles />}
/>

<Route
  path="/articles/:slug"
  element={<ArticleDetail />}
/>

<Route
  path="/syarat-ketentuan"
  element={<LegalPage />}
/>

<Route
  path="/kebijakan-privasi"
  element={<LegalPage />}
/>

<Route
  path="/bantuan"
  element={<LegalPage />}
/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
