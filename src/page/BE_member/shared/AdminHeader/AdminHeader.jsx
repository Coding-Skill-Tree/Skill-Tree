import { useState } from "react";
import { ADMIN_ROUTES, ADMIN_SITE_NAME, COMMON_TEXT } from "../adminContent.js";
import { adminLogout } from "../fakeAdminApi.js";
import "./AdminHeader.css";

// 後台頁首。有 admin 時顯示管理員帳號與「登出」（登入頁不傳 admin，只顯示名稱）。
function AdminHeader({ admin }) {
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await adminLogout().catch(() => null); // 登出不論成功與否都回到登入頁
    window.location.assign(ADMIN_ROUTES.login);
  }

  return (
    <header className="admin-header">
      <a className="admin-brand" href={admin ? ADMIN_ROUTES.members : ADMIN_ROUTES.login}>
        {ADMIN_SITE_NAME}
      </a>
      {admin && (
        <div className="admin-header-user">
          <span className="admin-header-name">
            <span className="visually-hidden">目前登入的管理員：</span>
            {admin.username}
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? COMMON_TEXT.loggingOut : COMMON_TEXT.logout}
          </button>
        </div>
      )}
    </header>
  );
}

export default AdminHeader;
