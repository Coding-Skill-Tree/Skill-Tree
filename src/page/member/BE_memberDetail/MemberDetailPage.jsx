import { useCallback, useEffect, useRef, useState } from "react";
import { ADMIN_ROUTES, COMMON_TEXT } from "../BE_member/shared/adminContent.js";
import { getMember, restoreMember, suspendMember } from "../BE_member/shared/fakeAdminApi.js";
import { useAdminSession, isAdminUnauthenticated } from "../BE_member/shared/useAdminSession.js";
import AdminHeader from "../BE_member/shared/AdminHeader/AdminHeader.jsx";
import AdminStatus from "../BE_member/shared/AdminStatus/AdminStatus.jsx";
import MemberAvatar from "../BE_member/shared/MemberAvatar.jsx";
import { formatJoinDate } from "../profile/utils/formatJoinDate.js";
// 彈窗、浮動通知、示範區塊沿用前台會員頁的元件
import Modal from "../forget_pwd/components/Modal/Modal.jsx";
import FloatingNotice from "../forget_pwd/components/FloatingNotice/FloatingNotice.jsx";
import DemoHint from "../forget_pwd/components/DemoHint/DemoHint.jsx";
import InfoList from "./components/InfoList/InfoList.jsx";
import { NO_DATA, formatCourseProgress, formatLevel, formatXp } from "./utils/gameDataFormat.js";
import "./MemberDetailPage.css";

// 網址：?id=<會員編號>&from=<會員列表的搜尋條件>
const params = new URLSearchParams(window.location.search);
const MEMBER_ID = params.get("id") ?? "";
const FROM = params.get("from") ?? "";
// 「回到會員列表」還原原本的關鍵字與頁碼（只接受 ? 開頭的查詢字串）
const BACK_HREF = FROM.startsWith("?") ? `${ADMIN_ROUTES.members}${FROM}` : ADMIN_ROUTES.members;

// 停權／恢復的確認視窗內容
const ACTIONS = {
  suspend: {
    button: "停權",
    message: "確定要停權這位會員嗎？停權後對方將無法登入。",
    confirm: "確定停權",
    confirmClass: "btn btn-danger",
    done: "已停權這位會員",
    request: suspendMember,
  },
  restore: {
    button: "恢復",
    message: "確定要恢復這位會員嗎？",
    confirm: "確定恢復",
    confirmClass: "btn btn-primary",
    done: "已恢復這位會員",
    request: restoreMember,
  },
};

const DEMO_LINKS = [
  { label: "小明（正常）", href: "./index.html?id=45" },
  { label: "未完成建立角色＋Google", href: "./index.html?id=43" },
  { label: "已停權", href: "./index.html?id=33" },
  { label: "有遊戲數據", href: "./index.html?id=45&demo=game-data" },
  { label: "找不到會員", href: "./index.html?id=999999" },
  { label: "停權／恢復失敗", href: "./index.html?id=45&demo=action-error" },
];

function MemberDetailPage() {
  const session = useAdminSession();
  const [state, setState] = useState({ status: "loading", member: null }); // loading | error | not-found | ready
  const [attempt, setAttempt] = useState(0);
  const [dialog, setDialog] = useState(null); // null | "suspend" | "restore"
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState(null);
  const actionButtonRef = useRef(null);
  const clearNotice = useCallback(() => setNotice(null), []);

  useEffect(() => {
    if (session.status !== "ready") return undefined;
    let alive = true;
    getMember(MEMBER_ID)
      .catch(() => ({ status: 0 }))
      .then((result) => {
        if (!alive || isAdminUnauthenticated(result)) return;
        if (result.status === 200) setState({ status: "ready", member: result.body.data });
        else if (result.status === 404) setState({ status: "not-found", member: null });
        else setState({ status: "error", member: null });
      });
    return () => {
      alive = false;
    };
  }, [session.status, attempt]);

  async function handleConfirm() {
    const action = ACTIONS[dialog];
    setSending(true);
    const result = await action.request(MEMBER_ID).catch(() => ({ status: 0 }));
    setSending(false);
    setDialog(null);
    if (isAdminUnauthenticated(result)) return;
    if (result.status === 200) {
      setState({ status: "ready", member: result.body.data });
      setNotice({ id: Date.now(), text: action.done });
    } else {
      // 失敗時畫面上的狀態不變
      setNotice({ id: Date.now(), text: COMMON_TEXT.actionFailed });
    }
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

  const m = state.member;
  const dialogAction = dialog ? ACTIONS[dialog] : null;

  return (
    <div className="admin-page">
      <AdminHeader admin={session.admin} />
      <FloatingNotice notice={notice} onDone={clearNotice} />

      <main className="admin-main member-detail-main">
        <a className="text-link member-detail-back" href={BACK_HREF}>
          <span aria-hidden="true">←</span> 回到會員列表
        </a>

        <div className="admin-card">
          <h1 className="admin-title">會員詳情</h1>

          {state.status === "not-found" && <p className="member-detail-empty">找不到這位會員</p>}

          {(state.status === "loading" || state.status === "error") && (
            <AdminStatus
              state={state.status}
              onRetry={() => {
                setState({ status: "loading", member: null });
                setAttempt((n) => n + 1);
              }}
            />
          )}

          {state.status === "ready" && (
            <>
              <section className="admin-section" aria-labelledby="basic-title">
                <h2 id="basic-title" className="admin-section-title">
                  基本資料
                </h2>
                <InfoList
                  items={[
                    { label: "角色", value: <MemberAvatar avatarId={m.avatarId} showName /> },
                    { label: "暱稱", value: m.username ?? COMMON_TEXT.notSet },
                    { label: "Email", value: m.email },
                    {
                      label: "加入日期",
                      value: <time dateTime={m.createdAt}>{formatJoinDate(m.createdAt)}</time>,
                    },
                    { label: "建立角色", value: m.onboardingCompleted ? "已完成" : "未完成" },
                    { label: "Google 登入", value: m.googleLinked ? "是" : "否" },
                    {
                      label: "帳號狀態",
                      value: m.suspended ? (
                        <span className="status-badge status-badge-suspended">
                          <span aria-hidden="true">⛔</span>
                          {COMMON_TEXT.statusSuspended} {formatJoinDate(m.suspendedAt)}
                        </span>
                      ) : (
                        <span className="status-badge status-badge-active">
                          <span aria-hidden="true">✓</span>
                          {COMMON_TEXT.statusActive}
                        </span>
                      ),
                    },
                  ]}
                />
                <div className="member-detail-actions">
                  <button
                    ref={actionButtonRef}
                    type="button"
                    className={m.suspended ? "btn btn-secondary" : "btn btn-danger"}
                    onClick={() => setDialog(m.suspended ? "restore" : "suspend")}
                  >
                    {m.suspended ? ACTIONS.restore.button : ACTIONS.suspend.button}
                  </button>
                </div>
              </section>

              <section className="admin-section" aria-labelledby="game-title">
                <h2 id="game-title" className="admin-section-title">
                  遊戲數據
                </h2>
                <InfoList
                  items={[
                    { label: "XP 經驗值", value: formatXp(m.xp) },
                    { label: "等級", value: formatLevel(m.level) },
                    {
                      label: "遊戲進度",
                      value: formatCourseProgress(m.courseProgress) ? (
                        <ul className="member-detail-progress">
                          {formatCourseProgress(m.courseProgress).map((line) => (
                            <li key={line}>{line}</li>
                          ))}
                        </ul>
                      ) : (
                        NO_DATA
                      ),
                    },
                  ]}
                />
              </section>
            </>
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

      {/* 停權／恢復確認：按「取消」或 Esc 關閉、不送請求；關閉後焦點回到停權／恢復按鈕 */}
      <Modal
        open={dialog !== null}
        labelId="confirm-message"
        blocking={sending}
        onClose={() => setDialog(null)}
        returnFocusRef={actionButtonRef}
      >
        {dialogAction && (
          <div className="modal-body">
            <p id="confirm-message" className="modal-message">
              {dialogAction.message}
            </p>
            <div className="modal-actions member-detail-dialog-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setDialog(null)}
                disabled={sending}
                autoFocus
              >
                取消
              </button>
              <button type="button" className={dialogAction.confirmClass} onClick={handleConfirm} disabled={sending}>
                {sending ? "處理中…" : dialogAction.confirm}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default MemberDetailPage;
