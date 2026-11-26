import React from 'react';
import Icon from './Icon.jsx';
export default function Sidebar({stats}) {
  return <aside className="sidebar" aria-label="側邊欄">
    <header className="brand"><a href="#main-content"><Icon name="brand" className="brand-icon"/>Skill Tree</a><p>前端學習與實作平台</p></header>
    <nav className="sidebar-nav" aria-label="主導覽"><ul>
      <li><a href="#main-content" aria-current="page"><Icon name="map"/>學習地圖</a></li>
      {[['tasks','任務清單'],['history','練習紀錄'],['badge','成就徽章'],['user','我的角色']].map(([icon,label])=><li key={icon}><button type="button" disabled title="尚未開發" aria-label={label}><Icon name={icon}/>{label}</button></li>)}
    </ul></nav>
    <section className="user-profile"><h2>前端學習者</h2><p>Lv. {stats.level}</p><p>累積經驗值：{stats.xp.toLocaleString()} XP</p></section>
    <blockquote className="daily-quote"><p>今天學一點，明天的你會更強！</p></blockquote>
  </aside>;
}
