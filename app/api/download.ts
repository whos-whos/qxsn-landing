// download.ts
import http from "../client/http";

export interface DownloadUrlResp {
  data: {
    android: string;
    ios: string;
  };
}

export const getDownloadUrlsFromApi = async (
  params?: Record<string, any>
): Promise<DownloadUrlResp> => {
  const res = await http.get<DownloadUrlResp>("/common/downloadUrl", {
    params,
  });
  return res;
};
