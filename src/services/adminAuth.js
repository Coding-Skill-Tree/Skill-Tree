import { apiRequest } from "./api";

export function getCurrentAdmin() {
  return apiRequest("/admin/me");
}

export function loginAdmin(credentials) {
  return apiRequest("/admin/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export function logoutAdmin() {
  return apiRequest("/admin/auth/logout", { method: "POST" });
}
