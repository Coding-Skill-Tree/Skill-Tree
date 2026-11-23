import { useEffect, useState } from "react";
import { getMembers } from "./shared/fakeAdminApi.js";
import { useAdminSession, isAdminUnauthenticated } from "./shared/useAdminSession.js";
import AdminHeader from "./shared/AdminHeader/AdminHeader.jsx";
import AdminStatus from "./shared/AdminStatus/AdminStatus.jsx";
import MemberSearch from "./components/MemberSearch/MemberSearch.jsx";
import MemberTable from "./components/MemberTable/MemberTable.jsx";
import Pagination from "./components/Pagination/Pagination.jsx";
import DemoHint from "../forget_pwd/components/DemoHint/DemoHint.jsx";
import "./MemberListPage.css";

// 搜尋關鍵字與頁碼放在網址 ?keyword=&page=，重新整理或按上一頁都會看到同樣的結果。
const params = new URLSearchParams(window.location.search);
const KEYWORD = (params.get("keyword") ?? "").trim();
const PAGE = /^[1-9]\d*$/.test(params.get("page") ?? "") ? Number(params.get("page")) : 1;
const DEMO = params.get("demo");

function goTo({ keyword = "", page = 1 }) {
  const next = new URLSearchParams();
  if (keyword) next.set("keyword", keyword);
  if (page > 1) next.set("page", String(page));
  if (DEMO) next.set("demo", DEMO);
  const query = next.toString();
  window.location.assign(query ? `?${query}` : window.location.pathname);
}

const DEMO_LINKS = [
  { label: "全部會員", href: "./index.html" },
  { label: "第 3 頁", href: "./index.html?page=3" },
  { label: "搜尋「小明」", href: "./index.html?keyword=小明" },
  { label: "搜尋無結果", href: "./index.html?keyword=zzz" },
  { label: "列表載入失敗", href: "./index.html?demo=list-error" },
  { label: "後台登入已過期", href: "./index.html?demo=expired" },
];

function MemberListPage() {
  const session = useAdminSession();
  const [list, setList] = useState({ status: "loading", data: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (session.status !== "ready") return undefined;
    let alive = true;
    getMembers({ keyword: KEYWORD, page: PAGE })
      .catch(() => ({ status: 0 }))
      .then((result) => {
        if (!alive || isAdminUnauthenticated(result)) return;
        if (result.status === 200) setList({ status: "ready", data: result.body.data });
        else setList({ status: "error", data: null });
      });
    return () => {
      alive = false;
    };
  }, [session.status, attempt]);

  function retryList() {
    setList({ status: "loading", data: null });
    setAttempt((n) => n + 1);
  }

  if (session.status !== "ready") {
    return (
      <div className="admin-page">
        <AdminHeader />
        <main className="admin-main">
          <AdminStatus state={session.status} onRetry={session.retry} />
        </main>
      </div>
    );
  }

  const data = list.data;

  return (
    <div className="admin-page">
      <AdminHeader admin={session.admin} />

      <main className="admin-main">
        <div className="admin-card">
          <div className="member-list-heading">
            <h1 className="admin-title">會員列表</h1>
            {data && (
              <p className="member-list-count" aria-live="polite">
                共 {data.total} 位會員
              </p>
            )}
          </div>

          <MemberSearch
            initialKeyword={KEYWORD}
            onSearch={(keyword) => goTo({ keyword, page: 1 })}
            onClear={() => goTo({})}
          />

          {list.status !== "ready" ? (
            <AdminStatus state={list.status} onRetry={retryList} />
          ) : data.items.length === 0 ? (
            <p className="member-list-empty">找不到符合的會員</p>
          ) : (
            <MemberTable items={data.items} backQuery={window.location.search} />
          )}

          {data && (
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              onChange={(page) => goTo({ keyword: KEYWORD, page })}
            />
          )}
        </div>

        <DemoHint>
          <p className="demo-hint-links">
            {DEMO_LINKS.map((item) => (
              <a key={item.label} className="text-link" href={item.href}>
                {item.label}
              </a>
            ))}
          </p>
        </DemoHint>
      </main>
    </div>
  );
}

export default MemberListPage;
