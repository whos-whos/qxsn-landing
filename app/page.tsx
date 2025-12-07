// page.tsx

import fs from "node:fs";
import path from "node:path";
import ClientLanding from "./ClientLanding";
import { getDownloadUrlsFromApi } from "./api/download";

export const dynamic = "force-dynamic";

// 简单 XOR 编码，把字符串变成数字数组
function encode(source: string, pwd: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < source.length; i++) {
    out.push(source.charCodeAt(i) ^ pwd);
  }
  return out;
}

// 这里封装一个拿下载地址的函数
async function getDownloadUrls() {
  const { data } = await getDownloadUrlsFromApi();

  return {
    androidUrl: data.android,
    iosUrl: data.ios,
  };
}

type KeyNums = {
  key: number;
  nums: number[];
};

// 读 landing.html + landing-secret.js，注入下载地址，再编码
async function buildEncodedHtml(): Promise<KeyNums> {
  const htmlPath = path.join(process.cwd(), "landing.html");
  // const jsPath = path.join(process.cwd(), "landing-secret.js");

  let html = fs.readFileSync(htmlPath, "utf8");
  // const js = fs.readFileSync(jsPath, "utf8");

  // 1. 先从接口拿到下载地址
  // const { androidUrl, iosUrl } = await getDownloadUrls();

  // 2. 把占位符替换成真实地址（g 表示全局替换）
  html = html
    // .replace(/__ANDROID_URL__/g, androidUrl)
    // .replace(/__IOS_URL__/g, iosUrl);

  // 3. 把脚本拼到 HTML 后面，一起加密
  // const fullHtml = `${html}\n<script>${js}</script>`;
   const fullHtml = `${html}`;

  // 4. XOR 编码成数字数组
  const key = 9189162;
  const nums = encode(fullHtml, key);

  return { key, nums };
}

export default async function Page() {
  let keyNums: KeyNums | null = null;
  let error: unknown = null;

  try {
    keyNums = await buildEncodedHtml();
  } catch (e: unknown) {
    error = e;
    console.error("[Page] error:", e instanceof Error ? e.message : e);
  }

  if (!keyNums) {
    // 出错时至少给你一个提示，不会是纯白
    return (
      <div style={{ padding: 24, color: "red" }}>
        服务器渲染出错：
        {error instanceof Error ? error.message : String(error ?? "未知错误")}
      </div>
    );
  }

  // 这里已经不在 try/catch 里，ESLint 不再报错
  return <ClientLanding keyNums={keyNums} />;
}
