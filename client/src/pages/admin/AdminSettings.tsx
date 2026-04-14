import { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { Bell, Shield, Save } from "lucide-react";
import { toast } from "sonner";
import { sendDiscordAlert } from "../../lib/discord";

export default function AdminSettings() {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [saving, setSaving] = useState(false);

  // マウント時に保存済みのURLを読み込む
  useEffect(() => {
    const savedUrl = localStorage.getItem("proofmark_discord_webhook");
    if (savedUrl) setWebhookUrl(savedUrl);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    
    // URLをブラウザに保存
    if (webhookUrl) {
      localStorage.setItem("proofmark_discord_webhook", webhookUrl);
      
      // Discordへテスト通知を送信
      await sendDiscordAlert(
        "🟢 System Connected", 
        "ProofMark Admin Center との連携が正常に完了しました。これよりシステムログの監視を開始します。"
      );
    } else {
      localStorage.removeItem("proofmark_discord_webhook");
    }

    setTimeout(() => {
      setSaving(false);
      toast.success("Settings updated successfully", {
        style: { background: '#00D4AA', color: '#07061A', border: 'none' }
      });
    }, 800);
  };

  return (
    <AdminLayout title="Admin Settings">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Webhook Integrations */}
        <section className="bg-[#0D0B24] border border-[#1C1A38] rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-[#1C1A38] flex items-center gap-3 bg-[#07061A]/50">
            <Bell className="w-5 h-5 text-[#00D4AA]" />
            <h2 className="text-lg font-bold">Notifications & Webhooks</h2>
          </div>
          <div className="p-6 space-y-6">
            <p className="text-sm text-[#A8A0D8]">
              システムイベント（新規証明書の発行、エッジエラー等）の自動Push通知を設定します。
            </p>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-white flex items-center gap-2">
                Discord Webhook URL
              </label>
              <input 
                type="password" 
                placeholder="https://discord.com/api/webhooks/..." 
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full bg-[#1C1A38]/50 border border-[#1C1A38] text-sm text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#6C3EF4] transition-colors font-mono"
              />
              <p className="text-xs text-[#A8A0D8] mt-1">空欄にすると通知が無効になります。保存時にテスト通知が送信されます。</p>
            </div>
          </div>
        </section>

        {/* Action Bar */}
        <div className="flex justify-end pt-4">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-gradient-to-r from-[#6C3EF4] to-[#00D4AA] hover:brightness-110 text-white px-8 py-3 rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(108,62,244,0.3)] transition-all disabled:opacity-50"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving & Testing...' : 'Save & Test Connection'}
          </button>
        </div>

      </div>
    </AdminLayout>
  );
}
