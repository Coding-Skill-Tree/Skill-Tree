import { NavLink } from "react-router-dom";
import "./Home.css";

const Home = ({ demo = false }) => (
  <div className="home">
    <nav>
      {demo ? (
        <NavLink to="/demo" className="navList">老師展示（唯讀）</NavLink>
      ) : (
        <>
          <NavLink to="/profile" className="navList">Profile</NavLink>
          <NavLink to="/skillmap" className="navList">Skillmap</NavLink>
          <NavLink to="/quizs" className="navList">Quizs</NavLink>
          <NavLink to="/dashboard" className="navList">Dashboard</NavLink>
          <NavLink to="/admin" className="navList">Admin</NavLink>
          {import.meta.env.DEV && <NavLink to="/acceptance" className="navList">驗收實驗室</NavLink>}
          {import.meta.env.DEV && <NavLink to="/workbench" className="navList">開發工作台</NavLink>}
          <NavLink to="/login" className="navList">登入</NavLink>
          <NavLink to="/register" className="navList">註冊會員</NavLink>
        </>
      )}
    </nav>
  </div>
);

export default Home;
