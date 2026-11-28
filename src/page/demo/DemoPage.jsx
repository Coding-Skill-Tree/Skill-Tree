import SkillMapDemo from "../practice/module-b-demo/src/App.jsx";
import "./DemoPage.css";

export default function DemoPage() {
  return (
    <main className="guest-demo-page">
      <header className="guest-demo-heading">
        <p>SKILL TREE · PROJECT SHOWCASE</p>
        <h1>老師展示模式</h1>
        <p>這裡使用前端合成範例資料。訪客不會讀取會員帳號、個人進度或管理題庫，也不能寫入伺服器資料。</p>
      </header>
      <SkillMapDemo readOnly />
    </main>
  );
}
