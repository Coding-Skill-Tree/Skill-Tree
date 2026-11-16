const API_URL = "https://skill-tree-notification.matt02416.workers.dev";

export async function sendDiscordNotification(): Promise<void> {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Discord 通知發送失敗");
    }

    const data = await response.json();

    console.log(data.message);
  } catch (error) {
    console.error("通知發送錯誤：", error);
    throw error;
  }
}
