import { useEffect, useState } from "react";
import { deleteAdminQuestion, getAdminQuestionOptions, listAdminQuestions } from "../../services/adminQuestions";
import AdminIcon from "./AdminIcon";
import AdminLayout from "./AdminLayout";

const PAGE_SIZE = 8;

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("zh-TW", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function Status({ value }) {
  const draft = value === "draft";
  return <span className={`question-status${draft ? " is-draft" : ""}`}><span />{draft ? "草稿" : "已發布"}</span>;
}

export default function AdminQuestionBankPage({ admin, onLogout }) {
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const hasFilters = Boolean(keyword.trim()) || Boolean(categoryId) || Boolean(status);

  useEffect(() => {
    let active = true;
    getAdminQuestionOptions()
      .then((options) => { if (active) setCategories(options.categories); })
      .catch((requestError) => { if (active) setError(requestError.message || "載入技能分類失敗。"); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedKeyword(keyword.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    let active = true;
    Promise.resolve()
      .then(() => {
        if (!active) return null;
        setLoading(true);
        setError("");
        return listAdminQuestions({ keyword: debouncedKeyword, categoryId, status, page, pageSize: PAGE_SIZE });
      })
      .then((result) => { if (active && result) setData(result); })
      .catch((requestError) => { if (active) setError(requestError.message || "載入題庫失敗。"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [debouncedKeyword, categoryId, status, page, reloadKey]);

  function resetFilters() {
    setKeyword("");
    setCategoryId("");
    setStatus("");
    setPage(1);
  }

  async function handleDelete(question) {
    if (!window.confirm(`確定要刪除題目「${question.id}」嗎？這會將題目從題庫移除。`)) return;
    try {
      await deleteAdminQuestion(question.id);
      if (data?.items.length === 1 && page > 1) setPage((current) => current - 1);
      else setReloadKey((key) => key + 1);
    } catch (requestError) {
      setError(requestError.message || "刪除題目失敗。");
    }
  }

  const questions = data?.items ?? [];
  const total = data?.total ?? 0;
  const firstResult = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastResult = Math.min(page * PAGE_SIZE, total);
  const pageCount = data?.totalPages ?? 1;

  return (
    <AdminLayout activePage="questions" breadcrumb="題庫管理" questionCount={total} admin={admin} onLogout={onLogout}>
      <main className="admin-content question-bank-content">
        <section className="admin-page-heading">
          <div><span className="page-eyebrow">QUESTION LIBRARY <i>/</i> E-02</span><h1>題庫管理</h1><p>搜尋題目、瀏覽分類，並整理題庫內容。</p></div>
          <a className="admin-primary-button" href="/admin/questions/new"><AdminIcon name="plus" size={17}/>新增題目</a>
        </section>

        {error && <div className="admin-inline-error" role="alert"><span>{error}</span><button className="admin-secondary-button" type="button" onClick={() => { setError(""); setReloadKey((key) => key + 1); }}>重試</button></div>}
        <section className="admin-panel question-list-panel" aria-labelledby="question-list-heading" aria-busy={loading}>
          <div className="question-list-heading">
            <div><span className="panel-kicker">QUESTION BANK</span><h2 id="question-list-heading">題目列表</h2></div>
            <span className="question-total"><strong>{loading && !data ? "—" : total}</strong> 筆題目</span>
          </div>

          <div className="question-toolbar" role="search">
            <label className="question-search-field">
              <AdminIcon name="search" size={18}/>
              <span className="sr-only">搜尋題目編號或內容</span>
              <input type="search" value={keyword} onChange={(event) => { setKeyword(event.target.value); setPage(1); }} placeholder="搜尋題目編號或內容" />
            </label>
            <label className="question-filter-select">
              <AdminIcon name="filter" size={17}/>
              <span className="sr-only">依技能分類篩選</span>
              <select value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setPage(1); }}>
                <option value="">所有分類</option>
                {categories.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label className="question-filter-select status-filter">
              <span className="sr-only">依題目狀態篩選</span>
              <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
                <option value="">所有狀態</option><option value="published">已發布</option><option value="draft">草稿</option>
              </select>
            </label>
            <button className="filter-reset-button" type="button" onClick={resetFilters} disabled={!hasFilters}>清除條件</button>
          </div>

          <div className="question-table-wrap">
            {loading && !data ? <div className="question-empty-state" role="status">正在載入題庫…</div> : error && !data ? <div className="question-empty-state"><h3>目前無法載入題庫</h3><p>請檢查後端連線後重試。</p></div> : total === 0 ? (
              <div className="question-empty-state">
                <span className="question-empty-icon"><AdminIcon name={hasFilters ? "search" : "book"} size={22}/></span>
                <h3>{hasFilters ? "找不到符合條件的題目" : "題庫目前還沒有題目"}</h3>
                <p>{hasFilters ? "調整搜尋文字或篩選條件，再試一次。" : "建立第一道題目，開始整理技能學習內容。"}</p>
                {hasFilters ? <button className="admin-secondary-button" type="button" onClick={resetFilters}>清除搜尋條件</button> : <a className="admin-primary-button" href="/admin/questions/new"><AdminIcon name="plus" size={16}/>新增題目</a>}
              </div>
            ) : (
              <table className="question-table">
                <thead><tr><th scope="col">題目編號</th><th scope="col">題目內容</th><th scope="col">技能分類</th><th scope="col">狀態</th><th scope="col">更新時間</th><th scope="col"><span className="sr-only">操作</span></th></tr></thead>
                <tbody>
                  {questions.map((question) => (
                    <tr key={question.id}>
                      <td data-label="題目編號"><span className="question-id">{question.id}</span></td>
                      <td data-label="題目內容"><a className="question-prompt-link" href={`/admin/questions/${encodeURIComponent(question.id)}`}>{question.prompt}</a></td>
                      <td data-label="技能分類"><span className="question-category">{question.category}</span></td>
                      <td data-label="狀態"><Status value={question.status}/></td>
                      <td data-label="更新時間"><span className="question-updated">{formatDate(question.updatedAt)}</span></td>
                      <td data-label="操作"><div className="question-row-actions">
                        <a className="question-action-button" href={`/admin/questions/${encodeURIComponent(question.id)}/edit`} aria-label={`編輯 ${question.id}`} title="編輯題目"><AdminIcon name="edit" size={16}/></a>
                        <button className="question-action-button is-danger" type="button" onClick={() => handleDelete(question)} aria-label={`刪除 ${question.id}`} title="刪除題目"><AdminIcon name="trash" size={16}/></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {total > 0 && <div className="question-pagination">
            <span className="question-results-range">顯示 {firstResult}–{lastResult} 筆，共 {total} 筆符合條件</span>
            <nav className="pagination-controls" aria-label="題庫分頁">
              <button className="pagination-arrow" type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1} aria-label="上一頁"><AdminIcon name="chevron-left" size={16}/></button>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => <button className={`pagination-number${pageNumber === page ? " is-current" : ""}`} type="button" key={pageNumber} onClick={() => setPage(pageNumber)} aria-current={pageNumber === page ? "page" : undefined} aria-label={`第 ${pageNumber} 頁`}>{pageNumber}</button>)}
              <button className="pagination-arrow" type="button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page >= pageCount} aria-label="下一頁"><AdminIcon name="chevron-right" size={16}/></button>
            </nav>
          </div>}
        </section>
      </main>
    </AdminLayout>
  );
}
