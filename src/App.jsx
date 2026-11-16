import { sendDiscordNotification } from "./services/notificationService.js";

function App() {
  const handleSendNotification = async () => {
    try {
      await sendDiscordNotification();
      alert("Discord通知發送成功!");
    } catch {
      alert("通知發送失敗，請檢查console");
    }
  };

  return (
    <div>
      <h1>Discord Webhook測試</h1>
      <button onClick={handleSendNotification}>發送測試通知</button>
    </div>
  );
}

export default App;
