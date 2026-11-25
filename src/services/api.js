export class ApiRequestError extends Error {
    status;
    code;
    requestId;
    fields;
    constructor(status, error = {}) {
        super(error.message || "請求失敗，請稍後再試。");
        this.name = "ApiRequestError";
        this.status = status;
        this.code = error.code || "REQUEST_FAILED";
        this.requestId = error.requestId;
        this.fields = error.fields;
    }
}
export async function apiRequest(path, init = {}) {
    const headers = new Headers(init.headers);
    if (init.body !== undefined && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }
    const response = await fetch(`/api${path}`, {
        ...init,
        headers,
        credentials: "include",
    });
    if (response.status === 204)
        return undefined;
    let payload;
    try {
        payload = await response.json();
    }
    catch {
        throw new ApiRequestError(response.status, {
            code: "INVALID_RESPONSE",
            message: "伺服器回應格式錯誤，請稍後再試。",
        });
    }
    if (!response.ok || payload?.success !== true) {
        throw new ApiRequestError(response.status, payload?.error ?? {
            code: "REQUEST_FAILED",
            message: "請求失敗，請稍後再試。",
        });
    }
    return payload.data;
}
