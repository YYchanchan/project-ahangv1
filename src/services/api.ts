let configuredBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

// #ifdef MP-WEIXIN
configuredBaseUrl = (import.meta.env.VITE_MP_API_BASE_URL || configuredBaseUrl).replace(/\/$/, "");
// #endif

export function getApiBaseUrl(): string {
  return configuredBaseUrl;
}

export function resolveMediaUrl(source?: string): string {
  const value = source?.trim() || "";
  if (!value) return "";
  if (/^(https?:|data:|blob:|wxfile:)/i.test(value)) return value;
  if (value.startsWith("/")) return `${configuredBaseUrl}${value}`;
  return value;
}

export function requestApi<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    data?: UniApp.RequestOptions["data"];
    header?: Record<string, string>;
  } = {},
): Promise<T> {
  const token = uni.getStorageSync("ahang_session_token");
  const authorization = token ? { Authorization: `Bearer ${token}` } : {};

  return new Promise((resolve, reject) => {
    uni.request({
      url: `${configuredBaseUrl}${path}`,
      method: options.method || "GET",
      data: options.data,
      header: {
        "Content-Type": "application/json",
        ...authorization,
        ...options.header,
      },
      timeout: 20000,
      success(response) {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(response.data as T);
          return;
        }

        const body = response.data as { error?: string };
        reject(new Error(body?.error || `请求失败（${response.statusCode}）`));
      },
      fail(error) {
        reject(new Error(error.errMsg || "网络连接失败"));
      },
    });
  });
}

export function getApi<T>(path: string): Promise<T> {
  return requestApi<T>(path);
}

export function postApi<T>(
  path: string,
  data?: UniApp.RequestOptions["data"],
): Promise<T> {
  return requestApi<T>(path, { method: "POST", data });
}

export function putApi<T>(
  path: string,
  data?: UniApp.RequestOptions["data"],
): Promise<T> {
  return requestApi<T>(path, { method: "PUT", data });
}

export function deleteApi<T>(path: string): Promise<T> {
  return requestApi<T>(path, { method: "DELETE" });
}

export function uploadMedia(filePath: string): Promise<string> {
  const token = uni.getStorageSync("ahang_session_token");
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: `${configuredBaseUrl}/api/uploads`,
      filePath,
      name: "file",
      header: token ? { Authorization: `Bearer ${token}` } : {},
      timeout: 30000,
      success(response) {
        let body: { url?: string; error?: string } = {};
        try {
          body = typeof response.data === "string" ? JSON.parse(response.data) : response.data;
        } catch {
          reject(new Error("服务器返回了无法识别的上传结果"));
          return;
        }
        if (response.statusCode >= 200 && response.statusCode < 300 && body.url) {
          resolve(body.url);
          return;
        }
        reject(new Error(body.error || `图片上传失败（${response.statusCode}）`));
      },
      fail(error) {
        reject(new Error(error.errMsg || "图片上传失败"));
      },
    });
  });
}
