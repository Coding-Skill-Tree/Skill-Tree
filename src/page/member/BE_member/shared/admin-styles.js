// 後台三頁共用的樣式引入順序：reset → 共用變數 → App.css → 共用按鈕 → 補充樣式
import "../../../../style/reset.css";
import "../../../../style/variables.css";
import "../../../../App.css";
import "../../../../style/button.css";
// 輸入框 focus、文字連結、visually-hidden、減少動態效果：和前台會員頁共用
import "../../forget_pwd/forget-pwd-base.css";
import "./admin-base.css";
