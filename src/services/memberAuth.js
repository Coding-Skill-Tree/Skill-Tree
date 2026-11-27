import { apiRequest } from "./api";

export function registerMember({ email, password }) {
  return apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function loginMember({ email, password }) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function getMe() {
  return apiRequest("/me");
}

export function updateMe({ username, avatarId }) {
  return apiRequest("/me/profile", {
    method: "PATCH",
    body: JSON.stringify({ username, avatarId }),
  });
}

export function logout() {
  return apiRequest("/auth/logout", { method: "POST" });
}

export function requestPasswordReset(email) {
  return apiRequest("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function verifyResetCode(email, code) {
  return apiRequest("/auth/reset-password/verify", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
}

export function resetPassword(email, code, password) {
  return apiRequest("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, code, password }),
  });
}

export function completeOnboarding({ username, avatarId }) {
  return apiRequest("/me/profile", {
    method: "PATCH",
    body: JSON.stringify({ username, avatarId }),
  });
}
