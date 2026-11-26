import { useEffect, useRef, useState } from "react";
import { Search } from "iconoir-react";
import "./MemberSearch.css";

const TEXT = {
  label: "搜尋暱稱或 Email",
  search: "搜尋",
  clear: "清除",
};

// 搜尋列：按「搜尋」或在欄位按 Enter 都會送出；有關鍵字時才顯示「清除」。
// 搜尋框裡瀏覽器內建的 X：清空文字；若目前正在顯示搜尋結果，就和「清除」一樣回到全部會員。
function MemberSearch({ initialKeyword, onSearch, onClear }) {
  const [value, setValue] = useState(initialKeyword);
  const inputRef = useRef(null);

  // 按 X 時瀏覽器會觸發原生的 search 事件（React 沒有提供 onSearch，所以自己監聽）
  useEffect(() => {
    const input = inputRef.current;
    function handleNativeSearch() {
      if (input.value === "" && initialKeyword) onClear();
    }
    input.addEventListener("search", handleNativeSearch);
    return () => input.removeEventListener("search", handleNativeSearch);
  }, [initialKeyword, onClear]);

  function handleSubmit(event) {
    event.preventDefault();
    onSearch(value.trim());
  }

  return (
    <form className="member-search" role="search" onSubmit={handleSubmit}>
      <label className="member-search-label" htmlFor="member-keyword">
        {TEXT.label}
      </label>
      <div className="member-search-row">
        <input
          ref={inputRef}
          id="member-keyword"
          className="member-search-input"
          type="search"
          value={value}
          maxLength={100}
          onChange={(e) => setValue(e.target.value)}
        />
        {/* 只有放大鏡圖示，所以用 aria-label 和 title 提供「搜尋」文字 */}
        <button
          type="submit"
          className="btn btn-primary member-search-submit"
          aria-label={TEXT.search}
          title={TEXT.search}
        >
          <Search className="member-search-icon" aria-hidden="true" focusable="false" />
        </button>
        {initialKeyword && (
          <button type="button" className="btn btn-ghost" onClick={onClear}>
            {TEXT.clear}
          </button>
        )}
      </div>
    </form>
  );
}

export default MemberSearch;
