// http.ts
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

export interface AxiosResponseProps {
  code?: number;
  status?: number;
  data?: any;
  datas?: any;
  msg?: string | null;
}

function showLog(msg: string) {
  if (process.env.MODE === "development") {
    console.log(msg);
  }
}

const rawBase = process.env.BASE_API || "";
const rawCommon = process.env.COMMON_API || "";

const baseApi = rawBase.split(",").map(s => s.trim()).filter(Boolean);
const commonApi = rawCommon.split(",").map(s => s.trim()).filter(Boolean);

const apiDomains: string[] = [...baseApi, ...commonApi];

if (!apiDomains.length) {
  // 这里可以不要 throw，防止线上因为 env 没配直接崩掉
  console.error("请配置 BASE_API / COMMON_API 至少一个域名");
}

async function findFastestDomain(timeout = 3000): Promise<number> {
  if (!apiDomains.length) return 0;

  const controllers = apiDomains.map(() => new AbortController());

  const tests = apiDomains.map((domain, index) => {
    return new Promise<number>((resolve, reject) => {
      axios
        .get(`https://${domain}/check`, {
          signal: controllers[index].signal,
          timeout,
        })
        .then((res) => {
          if (res.status === 200 && res.data === "ok") {
            showLog(`✅ ${domain} 响应正常`);
            resolve(index);
          } else {
            reject(new Error(`⚠️ ${domain} 响应异常: ${res.status}`));
          }
        })
        .catch((err) => {
          showLog(`❌ ${domain} 请求失败, ${err.message}`);
          reject(err);
        });
    });
  });

  try {
    const fastestIndex = await Promise.any(tests);
    controllers.forEach((c, i) => i !== fastestIndex && c.abort());
    return fastestIndex;
  } catch {
    showLog("⚠️ 所有域名测速失败，使用默认 index 0");
    return 0;
  }
}

class HttpRequest {
  private instance: AxiosInstance | null = null;
  private baseURLIndex = 0;
  private timeout = 60 * 1000;
  private withCredentials = false;

  private getBaseURL(): string {
    if (!apiDomains.length) return "";
    showLog(`fastestApi => ${apiDomains[this.baseURLIndex]}`);
    return `https://${apiDomains[this.baseURLIndex]}`;
  }

  private async createInstance(): Promise<AxiosInstance> {
    this.baseURLIndex = await findFastestDomain();
    const instance = axios.create({
      baseURL: this.getBaseURL(),
      withCredentials: this.withCredentials,
      timeout: this.timeout,
    });
    this.setupInterceptors(instance);
    return instance;
  }

  private setupInterceptors(instance: AxiosInstance) {
    instance.interceptors.response.use(
      (response) => response.data,
      async (error) => {
        const status = error?.response?.status;

        if (status >= 400 && status < 500) {
          return Promise.reject(error);
        }

        const maxRetries = 2;
        let retryCount = 0;
        const delay = 3000;

        const retryRequest = async (): Promise<any> => {
          try {
            if (apiDomains.length > 0) {
              this.baseURLIndex = (this.baseURLIndex + 1) % apiDomains.length;
            }
            const updatedConfig: AxiosRequestConfig = {
              ...error.config,
              baseURL: this.getBaseURL(),
            };
            const res = await instance.request(updatedConfig);
            return res.data;
          } catch (err) {
            retryCount++;
            if (retryCount < maxRetries) {
              await new Promise((r) => setTimeout(r, delay));
              return retryRequest();
            }
            return Promise.reject(err);
          }
        };

        return retryRequest();
      }
    );
  }

  private async getInstance(): Promise<AxiosInstance> {
    if (!this.instance) {
      this.instance = await this.createInstance();
    }
    return this.instance;
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const instance = await this.getInstance();
    return (instance.get as any)(url, config) as Promise<T>;
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const instance = await this.getInstance();
    return (instance.post as any)(url, data, config) as Promise<T>;
  }
  // 其他略…
}

const http = new HttpRequest();
export default http;
