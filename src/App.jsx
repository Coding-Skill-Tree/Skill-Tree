import Dahboard from "./page/dashboard/Dashboard.jsx";
import { BrowserRouter } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Dahboard />
      </div>
    </BrowserRouter>
  );
}

export default App;
