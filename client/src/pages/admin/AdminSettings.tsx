import { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { Bell, Key, Shield, Save } from "lucide-react";
import { toast } from "sonner";

export default function AdminSettings() {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    // 今後のフェーズで実際にSupabaseやAPIに保存するロジックをここに追加します
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
              Configure automated push notifications for system events (e.g., New Certificate Created, Edge Error).
            </p>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-white flex items-center gap-2">
                Discord / Slack Webhook URL
              </label>
              <input 
                type="url" 
                placeholder="https://discord.com/api/webhooks/..." 
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full bg-[#1C1A38]/50 border border-[#1C1A38] text-sm text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#6C3EF4] transition-colors font-mono"
              />
              <p className="text-xs text-[#A8A0D8] mt-1">Leave blank to disable notifications.</p>
            </div>
          </div>
        </section>

        {/* Security Preferences */}
        <section className="bg-[#0D0B24] border border-[#1C1A38] rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-[#1C1A38] flex items-center gap-3 bg-[#07061A]/50">
            <Shield className="w-5 h-5 text-[#6C3EF4]" />
            <h2 className="text-lg font-bold">Security Preferences</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Maintenance Mode</h3>
                <p className="text-xs text-[#A8A0D8]">Temporarily disable public access to certificate generation.</p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-[#1C1A38] transition-colors">
                <span className="inline-block h-4 w-4 translate-x-1 rounded-full bg-[#A8A0D8] transition-transform" />
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Strict OGP Generation</h3>
                <p className="text-xs text-[#A8A0D8]">Force re-render of OGP images avoiding CDN cache.</p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-[#00D4AA] transition-colors">
                <span className="inline-block h-4 w-4 translate-x-6 rounded-full bg-white transition-transform" />
              </button>
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
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

      </div>
    </AdminLayout>
  );
}
