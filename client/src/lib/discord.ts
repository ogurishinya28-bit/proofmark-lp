// Discordへリッチな通知（Embed）を送信するエンジン
export async function sendDiscordAlert(title: string, description: string, isError: boolean = false) {
  // ブラウザのローカルストレージから保存されたWebhook URLを取得
  const webhookUrl = localStorage.getItem("proofmark_discord_webhook");
  if (!webhookUrl) return;

  // ProofMarkのブランドカラー（正常: #00D4AA, エラー: #FF4D4D）を10進数に変換
  const color = isError ? 16731469 : 54442; 

  const payload = {
    username: "ProofMark System",
    avatar_url: "https://proofmark.jp/apple-touch-icon.png",
    embeds: [
      {
        title: title,
        description: description,
        color: color,
        timestamp: new Date().toISOString(),
        footer: {
          text: "ProofMark Admin Center",
        }
      }
    ]
  };

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error("Failed to send Discord webhook:", error);
  }
}
