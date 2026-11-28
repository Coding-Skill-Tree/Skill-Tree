import { useEffect, useState } from "react";
import { listAdminMembers } from "../../services/adminMembers";
import AdminIcon from "./AdminIcon";
import AdminLayout from "./AdminLayout";

function readPage() {
  const value = Number(new URLSearchParams(window.location.search).get("page") || 1);
  return Number.isSafeInteger(value) && value > 0 ? value : 1;
}

function makeMembersHref(keyword, page = 1) {
  const query = new URLSearchParams();
  if (keyword) query.set("keyword", keyword);
  if (page > 1) query.set("page", String(page));
  const suffix = query.toString();
  return `/admin/members${suffix ? `?${suffix}` : ""}`;
}

function MemberStatus({ suspended }) {
  return (
    <span className={`member-status${suspended ? " is-suspended" : ""}`}>
      <span aria-hidden="true"/>
      {suspended ? "已停權" : "正常"}
    </span>
  );
}

export default function AdminMembersPage({ admin, onLogout }) {
  const params = new URLSearchParams(window.location.search);
  const keyword = (params.get("keyword") || "").trim();
  const page = readPage();
  const [search, setSearch] = useState(keyword);
  const [list, setList] = useState({ status: "loading", data: null, error: null });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    listAdminMembers({ keyword, page })
      .then((data) => {
        if (active) setList({ status: "ready", data, error: null });
      })
      .catch((error) => {
        if (active) setList({ status: "error", data: null, error });
      });
    return () => { active = false; };
  }, [keyword, page, reloadKey]);

  function submitSearch(event) {
    event.preventDefault();
    window.location.assign(makeMembersHref(search.trim()));
  }

  function clearSearch() {
    setSearch("");
    window.location.assign(makeMembersHref(""));
  }

  function retryList() {
    setList({ status: "loading", data: null, error: null });
    setReloadKey((value) => value + 1);
  }

  const data = list.data;
  const pageValue = data?.page ?? page;
  const pageCount = data?.totalPages ?? 1;

  return (
    <AdminLayout activePage="members" breadcrumb="會員管理" admin={admin} onLogout={onLogout}>
      <main className="admin-content member-admin-content">
        <section className="admin-page-heading">
          <div>
            <span className="page-eyebrow">MEMBER MANAGEMENT <i>/</i> A-09</span>
            <h1>會員管理</h1>
            <p>搜尋會員資料，查看帳號狀態與學習概況。</p>
          </div>
          <div className="member-total-card" aria-live="polite">
            <span className="member-total-icon"><AdminIcon name="users" size={19}/></span>
            <span><strong>{data ? data.total : "—"}</strong><small>位會員</small></span>
          </div>
        </section>

        {list.status === "error" && (
          <div className="admin-inline-error" role="alert">
            <span>{list.error?.status === 401 ? "管理員登入已逾時，請重新登入。" : list.error?.message || "目前無法載入會員列表。"}</span>
            {list.error?.status === 401
              ? <a className="admin-secondary-button" href="/admin/login">重新登入</a>
              : <button className="admin-secondary-button" type="button" onClick={retryList}>重試</button>}
          </div>
        )}

        <section className="admin-panel member-list-panel" aria-labelledby="member-list-heading" aria-busy={list.status === "loading"}>
          <div className="member-list-panel-heading">
            <div><span className="panel-kicker">ACCOUNTS</span><h2 id="member-list-heading">會員列表</h2></div>
            <span className="member-list-total">{data ? `共 ${data.total} 位會員` : "載入會員資料…"}</span>
          </div>

          <form className="member-search-toolbar" role="search" onSubmit={submitSearch}>
            <label className="member-search-input-wrap" htmlFor="member-search">
              <AdminIcon name="search" size={18}/>
              <span className="sr-only">搜尋暱稱或 Email</span>
              <input id="member-search" type="search" maxLength={100} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜尋暱稱或 Email" />
            </label>
            <button className="admin-primary-button" type="submit"><AdminIcon name="search" size={16}/>搜尋</button>
            {keyword && <button className="admin-secondary-button member-clear-button" type="button" onClick={clearSearch}>清除</button>}
          </form>

          {list.status === "loading" ? (
            <div className="member-list-state" role="status"><span className="member-state-indicator"/>正在載入會員…</div>
          ) : list.status === "error" ? (
            <div className="member-list-state"><h3>無法載入會員</h3><p>請確認後端服務正常，再重新載入。</p></div>
          ) : data.items.length === 0 ? (
            <div className="member-list-state"><span className="member-empty-icon"><AdminIcon name="users" size={21}/></span><h3>{keyword ? "找不到符合條件的會員" : "目前沒有會員資料"}</h3><p>{keyword ? "請檢查暱稱或 Email，或清除搜尋條件。" : "新會員完成註冊後會顯示在這裡。"}</p>{keyword && <button className="admin-secondary-button" type="button" onClick={clearSearch}>清除搜尋</button>}</div>
          ) : (
            <div className="member-table-wrap">
              <table className="member-admin-table">
                <caption className="sr-only">會員列表，依加入時間由新到舊排序</caption>
                <thead><tr><th scope="col">會員</th><th scope="col">Email</th><th scope="col">加入日期</th><th scope="col">帳號狀態</th><th scope="col"><span className="sr-only">查看詳情</span></th></tr></thead>
                <tbody>
                  {data.items.map((member) => {
                    const query = new URLSearchParams();
                    if (keyword) query.set("keyword", keyword);
                    if (pageValue > 1) query.set("page", String(pageValue));
                    const from = query.toString();
                    const href = `/admin/members/${encodeURIComponent(member.userId)}${from ? `?from=${encodeURIComponent(`?${from}`)}` : ""}`;
                    return (
                      <tr key={member.userId}>
                        <td data-label="會員"><a className="member-name-link" href={href}><span className="member-initial" aria-hidden="true">{(member.username || "? ").slice(0, 1)}</span><span><strong>{member.username || "（尚未設定暱稱）"}</strong><small>ID {member.userId}</small></span></a></td>
                        <td data-label="Email"><span className="member-email">{member.email}</span></td>
                        <td data-label="加入日期"><time className="member-date" dateTime={member.createdAt}>{new Intl.DateTimeFormat("zh-TW", { dateStyle: "medium" }).format(new Date(member.createdAt))}</time></td>
                        <td data-label="帳號狀態"><MemberStatus suspended={member.suspended}/></td>
                        <td data-label="詳情"><a className="member-detail-link" href={href}>查看詳情<AdminIcon name="chevron-right" size={15}/></a></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {data && data.total > 0 && <div className="member-pagination">
            <span>第 {pageValue} / {pageCount} 頁<span className="member-page-total"> · 共 {data.total} 位會員</span></span>
            <nav className="member-pagination-controls" aria-label="會員列表分頁">
              {pageValue > 1 && <a className="admin-secondary-button" href={makeMembersHref(keyword, pageValue - 1)}><AdminIcon name="chevron-left" size={15}/>上一頁</a>}
              {pageValue < pageCount && <a className="admin-secondary-button" href={makeMembersHref(keyword, pageValue + 1)}>下一頁<AdminIcon name="chevron-right" size={15}/></a>}
            </nav>
          </div>}
        </section>
      </main>
    </AdminLayout>
  );
}
