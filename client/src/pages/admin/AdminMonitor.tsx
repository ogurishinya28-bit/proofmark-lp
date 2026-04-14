import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { Activity, Server, Terminal, CheckCircle, XCircle, Clock, ExternalLink } from "lucide-react";

interface Deployment {
  uid: string;
  url: string;
  state: string;
  createdAt: number;
  meta?: { githubCommitMessage?: string; githubCommitRef?: string };
}

export default function AdminMonitor() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeployments = async () => {
      const token = import.meta.env.VITE_VERCEL_TOKEN;
      const projectId = import.meta.env.VITE_VERCEL_PROJECT_ID;
      if (!token || !projectId) {
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=10`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setDeployments(data.deployments || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchDeployments();
    const interval = setInterval(fetchDeployments, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AdminLayout title="System Monitor">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
        
        {/* Left Column: Metrics & Terminal */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          {/* Edge Node Status */}
          <div className="bg-[#0D0B24] border border-[#1C1A38] rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Server className="w-5 h-5 text-[#6C3EF4]" /> Edge Network
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="text-sm font-bold text-[#A8A0D8]">Tokyo (HND1)</span>
                <span className="flex items-center gap-2 text-xs font-bold text-[#00D4AA]"><span className="w-2 h-2 rounded-full bg-[#00D4AA] animate-pulse"></span> ONLINE 12ms</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="text-sm font-bold text-[#A8A0D8]">Seoul (ICN1)</span>
                <span className="flex items-center gap-2 text-xs font-bold text-[#00D4AA]"><span className="w-2 h-2 rounded-full bg-[#00D4AA] animate-pulse"></span> ONLINE 28ms</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="text-sm font-bold text-[#A8A0D8]">Satori Engine</span>
                <span className="text-xs font-bold text-[#00D4AA]">Node.js Runtime</span>
              </div>
            </div>
          </div>

          {/* Terminal Logs */}
          <div className="bg-[#07061A] border border-[#1C1A38] rounded-2xl p-4 flex-1 flex flex-col font-mono relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-8 bg-[#1C1A38]/50 flex items-center px-4 gap-2 border-b border-[#1C1A38]">
               <div className="w-3 h-3 rounded-full bg-[#FF4D4D]"></div>
               <div className="w-3 h-3 rounded-full bg-[#F5A623]"></div>
               <div className="w-3 h-3 rounded-full bg-[#00D4AA]"></div>
               <span className="ml-2 text-xs text-[#A8A0D8] font-sans">system_logs.sh</span>
             </div>
             <div className="mt-10 text-[11px] text-[#00D4AA] space-y-1.5 opacity-80 flex-1 overflow-auto">
               <p>{`> [INFO] ProofMark Edge Gateway Initialized.`}</p>
               <p>{`> [INFO] Supabase connection established.`}</p>
               <p>{`> [INFO] Polling Vercel API (interval: 60s)...`}</p>
               <p className="animate-pulse">{`> _`}</p>
             </div>
          </div>
        </div>

        {/* Right Column: Deployment History */}
        <div className="bg-[#0D0B24] border border-[#1C1A38] rounded-2xl flex flex-col lg:col-span-2 overflow-hidden">
           <div className="p-6 border-b border-[#1C1A38] flex justify-between items-center bg-[#07061A]/50">
             <h2 className="text-lg font-bold flex items-center gap-2">
               <Activity className="w-5 h-5 text-[#00D4AA]" /> Deployment History
             </h2>
             <span className="text-xs font-bold text-[#A8A0D8] bg-[#1C1A38] px-3 py-1 rounded-full border border-white/10">Production</span>
           </div>
           
           <div className="flex-1 overflow-auto p-2">
             {loading ? (
                <div className="flex justify-center items-center h-full text-[#A8A0D8]">Loading Vercel data...</div>
             ) : deployments.length === 0 ? (
                <div className="flex justify-center items-center h-full text-[#A8A0D8]">No deployments found.</div>
             ) : (
                <div className="space-y-2 p-4">
                  {deployments.map((dep) => (
                    <div key={dep.uid} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors gap-4">
                       <div className="flex items-start gap-4">
                          <div className="pt-1">
                            {dep.state === 'READY' ? <CheckCircle className="w-5 h-5 text-[#00D4AA]" /> : 
                             dep.state === 'ERROR' ? <XCircle className="w-5 h-5 text-[#FF4D4D]" /> : 
                             <Clock className="w-5 h-5 text-[#f5a623] animate-pulse" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-bold text-white">{dep.meta?.githubCommitMessage || 'Manual Deploy'}</span>
                              <span className="text-[10px] bg-[#6C3EF4]/20 text-[#BC78FF] px-2 py-0.5 rounded border border-[#6C3EF4]/30 font-mono">
                                {dep.meta?.githubCommitRef || 'master'}
                              </span>
                            </div>
                            <div className="text-xs text-[#A8A0D8] flex items-center gap-3">
                              <span>{new Date(dep.createdAt).toLocaleString()}</span>
                              <span className="font-mono opacity-50">{dep.uid.split('-')[1] || dep.uid}</span>
                            </div>
                          </div>
                       </div>
                       <a 
                          href={`https://${dep.url}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-4 py-2 bg-[#1C1A38] hover:bg-[#6C3EF4]/20 text-sm font-bold text-[#A8A0D8] hover:text-[#00D4AA] rounded-lg transition-colors border border-transparent hover:border-[#6C3EF4]/30"
                       >
                         Visit <ExternalLink className="w-4 h-4" />
                       </a>
                    </div>
                  ))}
                </div>
             )}
           </div>
        </div>

      </div>
    </AdminLayout>
  );
}
