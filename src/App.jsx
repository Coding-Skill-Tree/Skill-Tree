import Dashboard from "./page/dashboard/Dashboard.jsx";
import AdminApp from "./page/admin/AdminApp.jsx";

function App() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";

  if (path === "/admin" || path.startsWith("/admin/")) {
    return <AdminApp />;
  }

  return (
    <div className="app-container">
      <Dashboard />
    </div>
  );
}

export default App;
