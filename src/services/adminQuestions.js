import { apiRequest } from "./api";
export async function getAdminQuestionSummary() {
    return apiRequest("/admin/questions/summary");
}
export async function getAdminQuestionOptions() {
    return apiRequest("/admin/questions/options");
}
export async function listAdminQuestions(filters = {}) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== "")
            query.set(key, String(value));
    }
    const queryString = query.toString();
    const suffix = queryString ? `?${queryString}` : "";
    return apiRequest(`/admin/questions${suffix}`);
}
export async function getAdminQuestion(id) {
    return apiRequest(`/admin/questions/${encodeURIComponent(id)}`);
}
export async function createAdminQuestion(question) {
    return apiRequest("/admin/questions", {
        method: "POST",
        body: JSON.stringify(question),
    });
}
export async function updateAdminQuestion(id, question) {
    return apiRequest(`/admin/questions/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(question),
    });
}
export async function deleteAdminQuestion(id) {
    return apiRequest(`/admin/questions/${encodeURIComponent(id)}`, { method: "DELETE" });
}
