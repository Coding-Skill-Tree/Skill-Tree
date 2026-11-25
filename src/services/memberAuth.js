import { apiRequest } from "./api";

export function getMe() {
  return apiRequest("/me");
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

export function verifyResetToken(token) {
  return apiRequest("/auth/reset-password/verify", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export function resetPassword(token, password) {
  return apiRequest("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}

export function completeOnboarding({ username, avatarId }) {
  return apiRequest("/me/profile", {
    method: "PATCH",
    body: JSON.stringify({ username, avatarId }),
  });
}
