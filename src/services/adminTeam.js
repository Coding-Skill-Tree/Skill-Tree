import { apiRequest } from "./api";

export function listAdminTeam() {
  return apiRequest("/admin/team");
}

export function setAdminTeamDisabled(accountId, disabled) {
  return apiRequest(`/admin/team/${encodeURIComponent(accountId)}`, {
    method: "PATCH",
    body: JSON.stringify({ disabled }),
  });
}
