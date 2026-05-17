import axios from "axios";
import {
  ADMIN_LOGIN_PATH,
  CUSTOMER_LOGIN_PATH,
} from "../config/routes";
import { API_BASE_URL } from "../utils/url";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const adminToken = localStorage.getItem("token");
  const customerToken =
    localStorage.getItem("customerToken");
  const isCustomerRequest = config.url
    ?.toString()
    .startsWith("/customers");
  const token = isCustomerRequest
    ? customerToken
    : adminToken || customerToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      const hasAdminToken =
        localStorage.getItem("token");
      const hasCustomerToken =
        localStorage.getItem("customerToken");
      const isCustomerRequest = error.config?.url
        ?.toString()
        .startsWith("/customers");

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("customerToken");
      localStorage.removeItem("customerUser");

      window.location.href =
        isCustomerRequest ||
        (hasCustomerToken && !hasAdminToken)
          ? CUSTOMER_LOGIN_PATH
          : ADMIN_LOGIN_PATH;
    }

    return Promise.reject(error);
  }
);

export default api;
