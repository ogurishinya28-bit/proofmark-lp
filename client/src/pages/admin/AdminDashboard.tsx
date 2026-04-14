import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { Activity, Database, Server, Users, CheckCircle, XCircle, Clock } from "lucide-react";
import { supabase } from "../../lib/supabase";

// Vercel APIのレスポンスの型定義
interface Deployment {
    uid: string;
    name: string;
    state: 'READY' | 'ERROR' | 'BUILDING' | 'QUEUED' | 'CANCELED';
    createdAt: number;
    meta?: {
        githubCommitMessage?: string;
        githubCommitAuthorName?: string;
    };
}

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        certs: 0,
        users: 0,
        loading: true
    });

    const [deployments, setDeployments] = useState<Deployment[]>([]);
    const [loadingDeploys, setLoadingDeploys] = useState(true);
    const [activityData, setActivityData] = useState<{ label: string, count: number }[]>([]);
    const [maxActivity, setMaxActivity] = useState(1);

    useEffect(() => {
        const fetchAdminStats = async () => {
            try {
                const { count: certCount, error: certError } = await supabase
                    .from('certificates')
                    .select('*', { count: 'exact', head: true });

                const { count: userCount, error: userError } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true });

                if (certError) console.error("Error fetching certs:", certError);
                if (userError) console.error("Error fetching users:", userError);

                setStats({
                    certs: certCount || 0,
                    users: userCount || 0,
                    loading: false
                });
            } catch (error) {
                console.error("Failed to fetch admin stats:", error);
                setStats(s => ({ ...s, loading: false }));
            }
        };

        const fetchVercelDeployments = async () => {
            const token = import.meta.env.VITE_VERCEL_TOKEN;
            const projectId = import.meta.env.VITE_VERCEL_PROJECT_ID;

            if (!token || !projectId) {
                console.warn("Vercel credentials missing in .env");
                setLoadingDeploys(false);
                return;
            }

            try {
                const response = await fetch(
                    `https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=5`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!response.ok) throw new Error("Failed to fetch deployments");

                const data = await response.json();
                setDeployments(data.deployments);
            } catch (error) {
                console.error("Vercel API Error:", error);
            } finally {
                // 💡 初回だけ true になっているローディングフラグを false にする（以降は二度と true に戻さない）
                setLoadingDeploys(false);
            }
        };

        const fetchActivity = async () => {
            try {
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
                sevenDaysAgo.setHours(0, 0, 0, 0);

                const { data, error } = await supabase
                    .from('certificates')
                    .select('created_at')
                    .gte('created_at', sevenDaysAgo.toISOString());

                if (error) throw error;

                // 過去7日間の箱（配列）を準備
                const last7Days = [...Array(7)].map((_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (6 - i));
                    return {
                        dateStr: d.toISOString().split('T')[0],
                        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
                        count: 0
                    };
                });

                // データを箱に振り分け
                if (data) {
                    data.forEach(cert => {
                        const certDate = cert.created_at.split('T')[0];
                        const targetDay = last7Days.find(d => d.dateStr === certDate);
                        if (targetDay) targetDay.count++;
                    });
                }

                const maxCount = Math.max(...last7Days.map(d => d.count), 1); // ゼロ除算防止
                setMaxActivity(maxCount);
                setActivityData(last7Days);

            } catch (error) {
                console.error("Failed to fetch activity data:", error);
            }
        };

        // 初回マウント時に1回実行
        const fetchAllData = () => {
            fetchAdminStats();
            fetchVercelDeployments();
            fetchActivity();
        };
        fetchAllData();

        // 💡 60秒（60000ミリ秒）ごとに自動更新するタイマーをセット
        const intervalId = setInterval(fetchAllData, 60000);

        // 💡 コンポーネントがアンマウント（画面遷移など）された時にタイマーを解除（メモリリーク防止）
        return () => clearInterval(intervalId);
    }, []);

    // 時間のフォーマット
    const timeAgo = (timestamp: number) => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    return (
        <AdminLayout title="System Overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total Certificates" value={stats.loading ? "..." : stats.certs} icon={Database} trend="Total" color="#00D4AA" />
                <StatCard title="Active Users" value={stats.loading ? "..." : stats.users} icon={Users} trend="Total" color="#6C3EF4" />
                <StatCard title="API Requests (24h)" value="--" icon={Activity} trend="Pending Phase 3" color="#BC78FF" />

                {/* Edge Status: 最新のデプロイがREADYならHealthy、それ以外ならWarning */}
                <StatCard
                    title="Vercel Edge Status"
                    value={deployments[0]?.state === 'READY' ? 'Healthy' : (deployments[0]?.state || 'Unknown')}
                    icon={Server}
                    trend={deployments[0]?.state === 'READY' ? '100% UP' : 'Checking...'}
                    color={deployments[0]?.state === 'READY' ? '#00D4AA' : '#FF6B6B'}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-[#0D0B24] border border-[#1C1A38] rounded-2xl p-6">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-[#00D4AA]" /> System Activity
                    </h2>
                    <div className="h-64 flex items-end justify-between gap-2 pt-8 pb-2">
                        {activityData.length === 0 ? (
                            <div className="w-full h-full flex items-center justify-center text-[#A8A0D8] text-sm">Loading activity...</div>
                        ) : (
                            activityData.map((day, i) => {
                                const heightPercentage = Math.max((day.count / maxActivity) * 100, 4); // 最低4%の高さを担保
                                return (
                                    <div key={i} className="flex flex-col items-center flex-1 h-full justify-end group">
                                        <div className="relative w-full max-w-[40px] flex items-end justify-center h-[calc(100%-24px)]">
                                            {/* ツールチップ（ホバー時） */}
                                            <div className="absolute -top-10 bg-[#1C1A38] text-white text-xs font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                                {day.count} certs
                                            </div>
                                            {/* バー本体 */}
                                            <div
                                                className="w-full bg-gradient-to-t from-[#6C3EF4]/40 to-[#00D4AA] rounded-t-sm transition-all duration-500 ease-out group-hover:brightness-125"
                                                style={{ height: `${heightPercentage}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] font-bold text-[#A8A0D8] mt-2 uppercase tracking-wider">{day.label}</span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Vercel API 連携エリア */}
                <div className="bg-[#0D0B24] border border-[#1C1A38] rounded-2xl p-6 flex flex-col h-full">
                    <h2 className="text-lg font-bold mb-4">Recent Deployments</h2>
                    <div className="space-y-3 flex-1 overflow-y-auto">
                        {loadingDeploys ? (
                            <div className="flex items-center justify-center h-32">
                                <div className="w-6 h-6 border-2 border-[#00D4AA] border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : deployments.length === 0 ? (
                            <div className="text-sm text-[#A8A0D8] text-center mt-8">No deployment data found. Check your .env setup.</div>
                        ) : (
                            deployments.map((dep) => (
                                <div key={dep.uid} className="flex flex-col gap-1.5 p-3.5 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <span className={`text-xs font-bold flex items-center gap-1.5 ${dep.state === 'READY' ? 'text-[#00D4AA]' :
                                            dep.state === 'ERROR' ? 'text-[#FF4D4D]' : 'text-[#f5a623]'
                                            }`}>
                                            {dep.state === 'READY' ? <CheckCircle className="w-3.5 h-3.5" /> :
                                                dep.state === 'ERROR' ? <XCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5 animate-pulse" />}
                                            {dep.state}
                                        </span>
                                        <span className="text-[10px] text-[#A8A0D8]">{timeAgo(dep.createdAt)}</span>
                                    </div>
                                    <span className="text-sm font-medium text-white truncate">
                                        {dep.meta?.githubCommitMessage || 'Manual Deployment'}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

function StatCard({ title, value, icon: Icon, trend, color }: any) {
    return (
        <div className="bg-[#0D0B24] border border-[#1C1A38] p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 transition-transform group-hover:scale-150" style={{ backgroundColor: color }} />
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                    <p className="text-sm font-bold text-[#A8A0D8] mb-1">{title}</p>
                    <h3 className="text-3xl font-black">{value}</h3>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10" style={{ color: color }}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
            <div className="text-xs font-bold relative z-10" style={{ color: color }}>{trend}</div>
        </div>
    );
}