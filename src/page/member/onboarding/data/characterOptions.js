// 建立角色頁的文字、路徑和角色選項。
// id 對應規格的 avatar-01～avatar-06；角色只差在外觀，不影響任何數值。

import avatar01 from "../assets/avatars/avatar-01.svg";
import avatar02 from "../assets/avatars/avatar-02.svg";
import avatar03 from "../assets/avatars/avatar-03.svg";
import avatar04 from "../assets/avatars/avatar-04.svg";
import avatar05 from "../assets/avatars/avatar-05.svg";
import avatar06 from "../assets/avatars/avatar-06.svg";

export const SITE_NAME = "Skill Tree";

export const ROUTES = {
  home: "/",
  login: "/login",
  learn: "/skillmap",
};

export const PAGE_TEXT = {
  eyebrow: "建立角色",
  title: "建立你的角色",
  description: "取一個暱稱、挑一個角色，就可以開始闖關了。",
  nicknameLabel: "暱稱",
  nicknamePlaceholder: "例如：野豬騎士",
  nicknameHint: "2 到 12 個字，可用中文、英文、數字與底線",
  avatarLegend: "選擇角色",
  submitLabel: "開始冒險",
  submittingLabel: "建立中…",
  disabledHint: "輸入暱稱並選擇一個角色後，就可以開始冒險",
  submitFailed: "角色建立失敗，請確認網路後再試一次。",
  learnLabel: "前往技能樹",
};

// 角色圖片：assets/avatars 裡的 SVG 檔（12×12 像素圖），檔名就是 avatar id。
// 之後要換成設計師畫的圖，直接覆蓋同名的 SVG 檔即可，程式不用改。
export const AVATARS = [
  { id: "avatar-01", name: "勇者", image: avatar01 },
  { id: "avatar-02", name: "法師", image: avatar02 },
  { id: "avatar-03", name: "騎士", image: avatar03 },
  { id: "avatar-04", name: "精靈", image: avatar04 },
  { id: "avatar-05", name: "盜賊", image: avatar05 },
  { id: "avatar-06", name: "巫師", image: avatar06 },
];
