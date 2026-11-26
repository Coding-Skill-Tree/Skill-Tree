import { useEffect, useState } from "react";
import { getAdminQuestion } from "../../services/adminQuestions";
import AdminIcon from "./AdminIcon";
import AdminLayout from "./AdminLayout";

const difficultyLabels = { beginner: "初級", intermediate: "中級", advanced: "進階" };
function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("zh-TW", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function AdminQuestionDetailPage({ admin, onLogout }) {
  const questionId = decodeURIComponent(window.location.pathname.split("/").filter(Boolean).at(-1) ?? "");
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getAdminQuestion(questionId)
      .then((result) => { if (active) setQuestion(result); })
      .catch((requestError) => { if (active) setError(requestError.message || "載入題目資料失敗。"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [questionId]);

  if (loading || error || !question) {
    return (
      <AdminLayout activePage="questions" breadcrumb="題目詳細資訊" admin={admin} onLogout={onLogout}>
        <main className="admin-content"><section className="admin-panel question-form-not-found" role={error ? "alert" : "status"}>
          <span className="page-eyebrow">QUESTION LIBRARY <i>/</i> E-04</span>
          <h1>{loading ? "正在載入題目…" : error ? "無法載入題目" : "找不到這道題目"}</h1>
          {error && <p>{error}</p>}
          <a className="admin-primary-button" href="/admin/questions">返回題庫列表</a>
        </section></main>
      </AdminLayout>
    );
  }

  const statusLabel = question.status === "draft" ? "草稿" : "已發布";
  return (
    <AdminLayout activePage="questions" breadcrumb="題目詳細資訊" admin={admin} onLogout={onLogout}>
      <main className="admin-content question-detail-content">
        <div className="question-detail-back-row"><a className="question-editor-back" href="/admin/questions"><AdminIcon name="chevron-left" size={16}/>返回題庫列表</a><span className="page-eyebrow">QUESTION LIBRARY <i>/</i> E-04</span></div>

        <section className="admin-page-heading question-detail-heading">
          <div><span className="page-eyebrow">題目詳細資訊</span><h1>#{question.id}</h1><div className="question-detail-heading-meta"><span className="question-category">{question.category}</span><span className={`question-status${question.status === "draft" ? " is-draft" : ""}`}><span />{statusLabel}</span></div></div>
          <a className="admin-primary-button" href={`/admin/questions/${encodeURIComponent(question.id)}/edit`}><AdminIcon name="edit" size={16}/>編輯題目</a>
        </section>

        <div className="question-detail-layout">
          <div className="question-detail-main">
            <section className="admin-panel question-detail-card" aria-labelledby="question-prompt-heading"><div className="question-detail-card-heading"><span className="question-detail-icon"><AdminIcon name="book" size={17}/></span><div><span className="panel-kicker">QUESTION</span><h2 id="question-prompt-heading">題目敘述</h2></div></div><p className="question-detail-prompt">{question.prompt}</p></section>

            <section className="admin-panel question-detail-card" aria-labelledby="question-choices-heading"><div className="question-detail-card-heading"><span className="question-detail-icon"><AdminIcon name="check" size={17}/></span><div><span className="panel-kicker">ANSWER OPTIONS</span><h2 id="question-choices-heading">選項與正確答案</h2></div><span className="question-detail-answer-key">正解已標示</span></div><ol className="question-detail-options">{question.choices.map((choice, index) => { const isCorrect = index === question.correctChoice; return <li className={`question-detail-option${isCorrect ? " is-correct" : ""}`} key={`${question.id}-${index}`}><span className="question-detail-option-letter">{String.fromCharCode(65 + index)}</span><span className="question-detail-option-text">{choice}</span>{isCorrect && <span className="question-correct-answer"><AdminIcon name="check" size={14}/>正確答案</span>}</li>; })}</ol></section>

            <section className="admin-panel question-explanation-card" aria-labelledby="question-explanation-heading"><div className="question-detail-card-heading"><span className="question-explanation-icon"><AdminIcon name="check" size={17}/></span><div><span className="panel-kicker">EXPLANATION</span><h2 id="question-explanation-heading">答案解析</h2></div></div><p>{question.explanation}</p></section>
          </div>

          <aside className="question-detail-side">
            <section className="admin-panel question-detail-meta-card" aria-labelledby="question-info-heading"><div className="question-detail-card-heading"><span className="question-form-step">資訊</span><div><h2 id="question-info-heading">題目資訊</h2><p>分類、難度與建立時間</p></div></div><dl className="question-detail-meta-list"><div><dt>題目編號</dt><dd><span className="question-id">#{question.id}</span></dd></div><div><dt>技能節點</dt><dd>{question.skillTitle}</dd></div><div><dt>技能分類</dt><dd><span className="question-category">{question.category}</span></dd></div><div><dt>題目難度</dt><dd>{difficultyLabels[question.difficulty] || question.difficulty}</dd></div><div><dt>題目狀態</dt><dd><span className={`question-status${question.status === "draft" ? " is-draft" : ""}`}><span />{statusLabel}</span></dd></div><div><dt>建立時間</dt><dd>{formatDate(question.createdAt)}</dd></div><div><dt>最後更新</dt><dd>{formatDate(question.updatedAt)}</dd></div></dl></section>
            <div className="question-detail-actions"><a className="admin-secondary-button question-cancel-button" href="/admin/questions">返回題庫列表</a><a className="admin-primary-button" href={`/admin/questions/${encodeURIComponent(question.id)}/edit`}><AdminIcon name="edit" size={16}/>編輯題目</a></div>
          </aside>
        </div>
      </main>
    </AdminLayout>
  );
}
