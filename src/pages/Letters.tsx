import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Trash2, 
  Download, 
  FileText,
  ChevronRight,
  MoreHorizontal,
  Calendar as CalendarIcon,
  Tag
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Letter, LetterType, LetterStatus } from "../types";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const StatusBadge = ({ status }: { status: LetterStatus }) => {
  const styles = {
    [LetterStatus.PENDING]: "bg-amber-100 text-amber-600 border-amber-200",
    [LetterStatus.PROCESSED]: "bg-blue-100 text-blue-600 border-blue-200",
    [LetterStatus.COMPLETED]: "bg-emerald-100 text-emerald-600 border-emerald-200",
  };

  const labels = {
    [LetterStatus.PENDING]: "Menunggu",
    [LetterStatus.PROCESSED]: "Diproses",
    [LetterStatus.COMPLETED]: "Selesai",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

export default function Letters({ type }: { type: keyof typeof LetterType }) {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    letter_number: "",
    subject: "",
    sender: "",
    recipient: "",
    date: format(new Date(), "yyyy-MM-dd"),
    category: "UMUM",
  });
  const [file, setFile] = useState<File | null>(null);

  const fetchLetters = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/letters?type=${type}&search=${search}`);
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
        const data = await res.json();
        setLetters(Array.isArray(data) ? data : []);
      } else {
        console.error("Non-JSON or error response for letters:", await res.text());
        setLetters([]);
      }
    } catch (error) {
      console.error("Failed to fetch letters:", error);
      setLetters([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchNextNumber = async () => {
    try {
      const res = await fetch(`/api/letters/next-number?type=${type}`);
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
        const data = await res.json();
        setFormData(prev => ({ ...prev, letter_number: data.number || "" }));
      }
    } catch (error) {
      console.error("Failed to fetch next number:", error);
    }
  };

  useEffect(() => {
    fetchLetters();
  }, [type, search]);

  useEffect(() => {
    if (isModalOpen) {
      fetchNextNumber();
    }
  }, [isModalOpen, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => data.append(key, value as string));
    data.append("type", type);
    if (file) data.append("file", file);

    const res = await fetch("/api/letters", {
      method: "POST",
      body: data,
    });

    if (res.ok) {
      setIsModalOpen(false);
      setFormData({
        letter_number: "",
        subject: "",
        sender: "",
        recipient: "",
        date: format(new Date(), "yyyy-MM-dd"),
        category: "UMUM",
      });
      setFile(null);
      fetchLetters();
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus surat ini?")) {
      await fetch(`/api/letters/${id}`, { method: "DELETE" });
      fetchLetters();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {type === "INCOMING" ? "Surat Masuk" : "Surat Keluar"}
          </h1>
          <p className="text-slate-500">Kelola dan arsipkan dokumen {type === "INCOMING" ? "masuk" : "keluar"}</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95"
        >
          <Plus size={20} />
          Tambah Surat
        </button>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari nomor surat atau perihal..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg border border-slate-200">
              <Filter size={20} />
            </button>
            <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg border border-slate-200">
              <Download size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">No. Surat / Perihal</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {type === "INCOMING" ? "Pengirim" : "Penerima"}
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [1, 2, 3].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-8 bg-slate-50/20"></td>
                  </tr>
                ))
              ) : letters.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <FileText size={48} className="opacity-20" />
                      <p>Tidak ada data surat ditemukan</p>
                    </div>
                  </td>
                </tr>
              ) : (
                letters.map((letter) => (
                  <tr key={letter.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-emerald-600 mb-1">{letter.letter_number}</span>
                        <span className="text-sm font-bold text-slate-800 line-clamp-1">{letter.subject}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm text-slate-600">{type === "INCOMING" ? letter.sender : letter.recipient}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm text-slate-500">
                        {format(new Date(letter.date), "dd MMM yyyy", { locale: id })}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <StatusBadge status={letter.status} />
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link 
                          to={`/letters/${letter.id}`}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        >
                          <Eye size={18} />
                        </Link>
                        <button 
                          onClick={() => handleDelete(letter.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Surat */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Tambah {type === "INCOMING" ? "Surat Masuk" : "Surat Keluar"}</h2>
                  <p className="text-sm text-slate-500">Lengkapi formulir di bawah untuk mengarsipkan surat</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-xl transition-colors">
                  <X size={24} className="text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Nomor Surat</label>
                    <input 
                      type="text" 
                      required
                      value={formData.letter_number || ""}
                      onChange={(e) => setFormData({ ...formData, letter_number: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
                      placeholder="Contoh: 001/SK/2024"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Kategori</label>
                    <select 
                      value={formData.category || "UMUM"}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
                    >
                      <option value="UMUM">Umum</option>
                      <option value="DINAS">Dinas</option>
                      <option value="PENTING">Penting</option>
                      <option value="RAHASIA">Rahasia</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Perihal / Subjek</label>
                  <input 
                    type="text" 
                    required
                    value={formData.subject || ""}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
                    placeholder="Masukkan perihal surat"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">
                      {type === "INCOMING" ? "Pengirim" : "Penerima"}
                    </label>
                    <input 
                      type="text" 
                      required
                      value={(type === "INCOMING" ? formData.sender : formData.recipient) || ""}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        [type === "INCOMING" ? "sender" : "recipient"]: e.target.value 
                      })}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
                      placeholder={type === "INCOMING" ? "Nama pengirim" : "Nama penerima"}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Tanggal Surat</label>
                    <input 
                      type="date" 
                      required
                      value={formData.date || ""}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">File Dokumen (PDF/DOC)</label>
                  <div className="relative">
                    <input 
                      type="file" 
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="hidden" 
                      id="file-upload"
                    />
                    <label 
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center w-full h-32 px-4 transition bg-slate-50 border-2 border-slate-200 border-dashed rounded-2xl appearance-none cursor-pointer hover:border-emerald-500 focus:outline-none"
                    >
                      <span className="flex items-center space-x-2">
                        <Plus className="w-6 h-6 text-slate-400" />
                        <span className="font-medium text-slate-600">
                          {file ? file.name : "Klik untuk pilih file atau drag & drop"}
                        </span>
                      </span>
                    </label>
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95"
                  >
                    Simpan Surat
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

const X = ({ size, className }: { size: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);
