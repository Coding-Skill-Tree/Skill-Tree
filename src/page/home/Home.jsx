import { NavLink } from "react-router-dom";
import "./Home.css";

const Home = () => {
  return (
    <div className="home">
      <nav>
        <NavLink to="/profile" className="navList">
          Profile
        </NavLink>
        <NavLink to="/skillmap" className="navList">
          Skillmap
        </NavLink>
        <NavLink to="/quizs" className="navList">
          Quizs
        </NavLink>
        <NavLink to="/dashboard" className="navList">
          Dashboard
        </NavLink>
        <NavLink to="/admin" className="navList">
          Admin
        </NavLink>
        {import.meta.env.DEV && (
          <NavLink to="/acceptance" className="navList">
            驗收實驗室
          </NavLink>
        )}
      </nav>
    </div>
  );
};

export default Home;
