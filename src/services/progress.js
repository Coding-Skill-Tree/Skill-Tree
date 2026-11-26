import { apiRequest } from "./api";
export function getMemberProgress() {
    return apiRequest("/progress");
}
