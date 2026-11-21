import { useEffect } from "react";
import "./FloatingNotice.css";

// 浮動通知：固定在畫面左上角，不推動版面，4 秒後自動消失。
// notice 是 { id, text }：同樣的文字再出現一次時換新的 id，計時會重新開始。
function FloatingNotice({ notice, onDone, duration = 4000 }) {
  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(onDone, duration);
    return () => clearTimeout(timer);
  }, [notice, onDone, duration]);

  return (
    <div className="floating-notice" role="status" aria-live="polite">
      {notice && <p className="floating-notice-box">{notice.text}</p>}
    </div>
  );
}

export default FloatingNotice;
