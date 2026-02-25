import { useState } from "react";

export default function CopyButton({ text, label = "Copy" }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  };

  return (
    <button className={`ai-btn copy-btn${copied ? " copied" : ""}`} onClick={copy}>
      {copied ? "✓ Copied!" : "⎘ " + label}
    </button>
  );
}
