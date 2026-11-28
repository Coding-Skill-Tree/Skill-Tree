import { apiRequest } from "./api";

export function listAdminMembers({ keyword = "", page = 1 } = {}) {
  const query = new URLSearchParams();
  if (keyword) query.set("keyword", keyword);
  query.set("page", String(page));
  return apiRequest(`/admin/members?${query.toString()}`);
}

export function getAdminMember(userId) {
  return apiRequest(`/admin/members/${encodeURIComponent(userId)}`);
}

export function suspendAdminMember(userId) {
  return apiRequest(`/admin/members/${encodeURIComponent(userId)}/suspend`, { method: "POST" });
}

export function restoreAdminMember(userId) {
  return apiRequest(`/admin/members/${encodeURIComponent(userId)}/restore`, { method: "POST" });
}
