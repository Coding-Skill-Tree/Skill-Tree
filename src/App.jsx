import Dashboard from "./page/dashboard/Dashboard.jsx";
import AdminApp from "./page/admin/AdminApp.jsx";
import { BrowserRouter } from "react-router-dom";

function App() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";

  return (
    <BrowserRouter>
      {path === "/admin" || path.startsWith("/admin/") ? (
        <AdminApp />
      ) : (
        <div className="app-container">
          <Dashboard />
        </div>
      )}
    </BrowserRouter>
  );
}

export default App;