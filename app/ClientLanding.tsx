// app/ClientLanding.tsx
"use client";

import { useEffect, useRef } from "react";

export type KeyNums = {
  key: number;
  nums: number[];
};

export default function ClientLanding({ keyNums }: { keyNums: KeyNums }) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const { key, nums } = keyNums;
    let s = "";
    for (let i = 0; i < nums.length; i++) {
      s += String.fromCharCode(nums[i] ^ key);
    }

    const root = rootRef.current;
    if (!root) return;

    // 1. 把解密后的 HTML + <script> 塞进去
    root.innerHTML = s;

    // 2. 浏览器对 innerHTML 插入的 <script> 不执行，这里手动“重新挂载”
    const scripts = Array.from(root.querySelectorAll("script"));

    scripts.forEach((oldScript) => {
      const newScript = document.createElement("script");

      // 拷贝所有属性（如果以后有 src / type / data-xxx 也能兼容）
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });

      // 内联脚本内容
      if (oldScript.textContent) {
        newScript.textContent = oldScript.textContent;
      }

      // 用新的 <script> 替换旧的，这一步会触发执行
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });
  }, [keyNums]);

  return (
    <main className="bg-[black] relative">
      {/* hydration 前后，这里都是一个空 div，不会 mismatch */}
      <div
        id="landing-root"
        ref={rootRef}
        className="absolute left-0 right-0 top-0 bottom-0"
      />
    </main>
  );
}
