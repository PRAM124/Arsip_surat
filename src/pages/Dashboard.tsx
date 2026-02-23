import { useState, useEffect } from "react";
import { Inbox, Send, Clock, CheckCircle2, TrendingUp, Calendar } from "lucide-react";
import { motion } from "motion/react";
import { DashboardStats } from "../types";

const StatCard = ({ title, value, icon: Icon, color, delay }: { title: string, value: number, icon: any, color: string, delay: number }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-100 flex items-center gap-5"
  >
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${color}`}>
      <Icon size={28} />
    </div>
    <div>
      <p className="text-slate-500 text-sm font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
    </div>
  </motion.div>
);

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then(res => res.json())
      .then(data => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Ringkasan Statistik</h1>
          <p className="text-slate-500">Pantau aktivitas persuratan hari ini</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
          <Calendar size={18} className="text-emerald-600" />
          <span className="text-sm font-semibold text-slate-700">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Surat Masuk" 
          value={stats?.incoming || 0} 
          icon={Inbox} 
          color="bg-blue-600 shadow-blue-100" 
          delay={0.1}
        />
        <StatCard 
          title="Surat Keluar" 
          value={stats?.outgoing || 0} 
          icon={Send} 
          color="bg-purple-600 shadow-purple-100" 
          delay={0.2}
        />
        <StatCard 
          title="Menunggu" 
          value={stats?.pending || 0} 
          icon={Clock} 
          color="bg-amber-500 shadow-amber-100" 
          delay={0.3}
        />
        <StatCard 
          title="Selesai" 
          value={stats?.processed || 0} 
          icon={CheckCircle2} 
          color="bg-emerald-600 shadow-emerald-100" 
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-slate-800">Aktivitas Terbaru</h2>
            <button className="text-emerald-600 font-semibold text-sm hover:underline">Lihat Semua</button>
          </div>
          
          <div className="space-y-6">
            {/* Placeholder for recent activity */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                  <TrendingUp size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-800">Surat Masuk Baru</h4>
                    <span className="text-xs text-slate-400">2 jam yang lalu</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">Surat dari Dinas Pendidikan perihal Undangan Rapat Koordinasi Wilayah.</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-emerald-600 rounded-[2rem] p-8 shadow-xl shadow-emerald-100 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-xl font-bold mb-4">Tips Hari Ini</h2>
            <p className="text-emerald-50 opacity-90 leading-relaxed">
              Pastikan setiap surat masuk segera diberikan disposisi agar proses administrasi berjalan lebih cepat dan efisien.
            </p>
            <button className="mt-8 px-6 py-3 bg-white text-emerald-600 rounded-xl font-bold text-sm shadow-lg hover:bg-emerald-50 transition-colors">
              Pelajari Disposisi
            </button>
          </div>
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-500 rounded-full opacity-20"></div>
          <div className="absolute right-10 top-10 w-20 h-20 bg-emerald-400 rounded-full opacity-10"></div>
        </div>
      </div>
    </div>
  );
}
