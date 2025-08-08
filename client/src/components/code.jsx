import { useLayoutEffect, useRef } from "react";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";

export default function CodeHighlighter({ code = "", language = "javascript" }) {
  const codeRef = useRef();

  useLayoutEffect(() => {
    if (codeRef.current) {
      try {
        const highlighted = hljs.highlight(code, { language }).value;
        codeRef.current.innerHTML = highlighted;
        codeRef.current.className = `hljs language-${language}`;
      } catch (e) {
        // Fallback to raw code if language is invalid
        codeRef.current.textContent = code;
        codeRef.current.className = "hljs";
      }
    }
  }, [language, code]);

  return (
    <div className="border rounded-md shadow p-4 bg-[#0d1117] relative">
      <pre className="relative text-md font-mono overflow-hidden  max-h-[80vh] hover:overflow-auto">
        <code ref={codeRef} />
        <button
          className="copy-btn absolute top-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded hover:bg-gray-700"
          onClick={(event) => {
            navigator.clipboard.writeText(code);
            const btn = event.currentTarget;
            btn.innerText = "Copied!";
            setTimeout(() => (btn.innerText = "Copy"), 1500);
          }}
        >
          Copy
        </button>
      </pre>
    </div>
  );
}
