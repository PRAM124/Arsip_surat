import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  Eye, 
  Clock, 
  CheckCircle2, 
  User as UserIcon,
  MessageSquare,
  Send,
  Plus,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Letter, Disposition, User, LetterStatus } from "../types";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function LetterDetail({ user }: { user: User }) {
  const { id: letterId } = useParams();
  const navigate = useNavigate();
  const [letter, setLetter] = useState<Letter | null>(null);
  const [dispositions, setDispositions] = useState<Disposition[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDispModalOpen, setIsDispModalOpen] = useState(false);
  
  // Disposition Form
  const [dispForm, setDispForm] = useState({
    to_user_id: "",
    notes: ""
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [letterRes, dispRes, usersRes] = await Promise.all([
        fetch(`/api/letters/${letterId}`),
        fetch(`/api/letters/${letterId}/dispositions`),
        fetch("/api/users")
      ]);
      
      if (!letterRes.ok) {
        navigate("/");
        return;
      }

      const letterData = await letterRes.json();
      const dispData = await dispRes.json();
      const usersData = await usersRes.json();

      setLetter(letterData);
      setDispositions(Array.isArray(dispData) ? dispData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [letterId]);

  const handleUpdateStatus = async (status: LetterStatus) => {
    await fetch(`/api/letters/${letterId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    fetchData();
  };

  const handleAddDisposition = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/dispositions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        letter_id: letterId,
        to_user_id: dispForm.to_user_id,
        notes: dispForm.notes
      })
    });

    if (res.ok) {
      setIsDispModalOpen(false);
      setDispForm({ to_user_id: "", notes: "" });
      fetchData();
    }
  };

  if (loading || !letter) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors font-semibold"
        >
          <ArrowLeft size={20} />
          Kembali
        </button>
        <div className="flex items-center gap-3">
          {letter.status !== LetterStatus.COMPLETED && (
            <button 
              onClick={() => handleUpdateStatus(LetterStatus.COMPLETED)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold border border-emerald-100 hover:bg-emerald-100 transition-all"
            >
              <CheckCircle2 size={18} />
              Tandai Selesai
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Letter Info */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
            <div className="flex items-start justify-between mb-8">
              <div>
                <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold uppercase tracking-wider mb-3 inline-block">
                  {letter.category}
                </span>
                <h1 className="text-2xl font-bold text-slate-800 leading-tight">{letter.subject}</h1>
                <p className="text-emerald-600 font-bold mt-1">{letter.letter_number}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400">Tanggal Surat</p>
                <p className="font-bold text-slate-700">
                  {format(new Date(letter.date), "dd MMMM yyyy", { locale: id })}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 p-6 bg-slate-50 rounded-3xl mb-8">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Pengirim</p>
                <p className="font-bold text-slate-800">{letter.sender}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Penerima</p>
                <p className="font-bold text-slate-800">{letter.recipient}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-slate-800">Dokumen Lampiran</h3>
              {letter.file_path ? (
                <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl group hover:border-emerald-500 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center">
                      <FileText size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Dokumen_Surat.pdf</p>
                      <p className="text-xs text-slate-400">PDF Document • 1.2 MB</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a 
                      href={letter.file_path} 
                      target="_blank" 
                      rel="noreferrer"
                      className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                    >
                      <Eye size={20} />
                    </a>
                    <a 
                      href={letter.file_path} 
                      download
                      className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                    >
                      <Download size={20} />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                  <p className="text-slate-400">Tidak ada lampiran file</p>
                </div>
              )}
            </div>
          </div>

          {/* Dispositions List */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                <MessageSquare size={24} className="text-emerald-600" />
                Riwayat Disposisi
              </h2>
              <button 
                onClick={() => setIsDispModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
              >
                <Plus size={18} />
                Beri Disposisi
              </button>
            </div>

            <div className="space-y-6 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
              {dispositions.length === 0 ? (
                <p className="text-center text-slate-400 py-4">Belum ada disposisi untuk surat ini</p>
              ) : (
                dispositions.map((disp, i) => (
                  <div key={disp.id} className="relative pl-12">
                    <div className="absolute left-4 top-2 w-4 h-4 rounded-full bg-emerald-600 border-4 border-white shadow-sm z-10"></div>
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{disp.from_name}</span>
                          <span className="text-slate-400">→</span>
                          <span className="font-bold text-emerald-600">{disp.to_name}</span>
                        </div>
                        <span className="text-xs text-slate-400">
                          {format(new Date(disp.created_at), "dd MMM, HH:mm", { locale: id })}
                        </span>
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed italic">"{disp.notes}"</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-6">Status Alur Surat</h3>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Diarsipkan</p>
                  <p className="text-xs text-slate-400">{format(new Date(letter.created_at), "dd MMM yyyy")}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  letter.status !== LetterStatus.PENDING ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
                )}>
                  {letter.status !== LetterStatus.PENDING ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                </div>
                <div>
                  <p className={cn("text-sm font-bold", letter.status !== LetterStatus.PENDING ? "text-slate-800" : "text-slate-400")}>
                    Diproses / Disposisi
                  </p>
                  <p className="text-xs text-slate-400">Menunggu instruksi</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  letter.status === LetterStatus.COMPLETED ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
                )}>
                  {letter.status === LetterStatus.COMPLETED ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                </div>
                <div>
                  <p className={cn("text-sm font-bold", letter.status === LetterStatus.COMPLETED ? "text-slate-800" : "text-slate-400")}>
                    Selesai
                  </p>
                  <p className="text-xs text-slate-400">Arsip ditutup</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-xl text-white">
            <h3 className="font-bold mb-4">Butuh Bantuan?</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Jika ada kesalahan data surat, silakan hubungi bagian IT atau Administrator untuk melakukan perubahan.
            </p>
            <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm transition-all">
              Hubungi Admin
            </button>
          </div>
        </div>
      </div>

      {/* Modal Disposisi */}
      <AnimatePresence>
        {isDispModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDispModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Beri Disposisi</h2>
                  <p className="text-sm text-slate-500">Teruskan surat ini ke user lain</p>
                </div>
                <button onClick={() => setIsDispModalOpen(false)} className="p-2 hover:bg-white rounded-xl transition-colors">
                  <X size={24} className="text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleAddDisposition} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Tujuan Disposisi</label>
                  <select 
                    required
                    value={dispForm.to_user_id}
                    onChange={(e) => setDispForm({ ...dispForm, to_user_id: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
                  >
                    <option value="">Pilih User</option>
                    {users.filter(u => u.id !== user.id).map(u => (
                      <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Catatan / Instruksi</label>
                  <textarea 
                    required
                    rows={4}
                    value={dispForm.notes}
                    onChange={(e) => setDispForm({ ...dispForm, notes: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
                    placeholder="Masukkan instruksi disposisi..."
                  />
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsDispModalOpen(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Send size={18} />
                    Kirim Disposisi
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
