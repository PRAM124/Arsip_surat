import { useState } from "react";
import { 
  FileText, 
  Download, 
  Calendar as CalendarIcon, 
  Filter,
  FileSpreadsheet,
  File as FilePdf
} from "lucide-react";
import { motion } from "motion/react";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export default function Reports() {
  const [dateRange, setDateRange] = useState({
    start: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd"),
    end: format(new Date(), "yyyy-MM-dd")
  });
  const [type, setType] = useState("ALL");
  const [loading, setLoading] = useState(false);

  const handleExportExcel = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/letters`);
      const data = await res.json();
      
      if (!Array.isArray(data)) {
        alert("Gagal mengambil data surat");
        return;
      }

      const filteredData = data.filter((l: any) => {
        const date = l.date;
        return date >= dateRange.start && date <= dateRange.end && (type === "ALL" || l.type === type);
      });

      const ws = XLSX.utils.json_to_sheet(filteredData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Laporan Arsip");
      XLSX.writeFile(wb, `Laporan_Arsip_${dateRange.start}_to_${dateRange.end}.xlsx`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/letters`);
      const data = await res.json();
      
      if (!Array.isArray(data)) {
        alert("Gagal mengambil data surat");
        return;
      }

      const filteredData = data.filter((l: any) => {
        const date = l.date;
        return date >= dateRange.start && date <= dateRange.end && (type === "ALL" || l.type === type);
      });

      const doc = new jsPDF();
      doc.text("Laporan Arsip Surat", 14, 15);
      doc.setFontSize(10);
      doc.text(`Periode: ${dateRange.start} s/d ${dateRange.end}`, 14, 22);
      
      doc.autoTable({
        startY: 30,
        head: [['No. Surat', 'Perihal', 'Tipe', 'Tanggal', 'Status']],
        body: filteredData.map((l: any) => [
          l.letter_number,
          l.subject,
          l.type === "INCOMING" ? "Masuk" : "Keluar",
          l.date,
          l.status
        ]),
      });

      doc.save(`Laporan_Arsip_${dateRange.start}_to_${dateRange.end}.pdf`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Laporan & Rekapitulasi</h1>
        <p className="text-slate-500">Ekspor data arsip surat ke format PDF atau Excel</p>
      </div>

      <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <CalendarIcon size={20} className="text-emerald-600" />
              Rentang Tanggal
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mulai</label>
                <input 
                  type="date" 
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Selesai</label>
                <input 
                  type="date" 
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Filter size={20} className="text-emerald-600" />
              Tipe Surat
            </h3>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pilih Kategori</label>
              <select 
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
              >
                <option value="ALL">Semua Tipe</option>
                <option value="INCOMING">Hanya Surat Masuk</option>
                <option value="OUTGOING">Hanya Surat Keluar</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button 
            onClick={handleExportPDF}
            disabled={loading}
            className="flex flex-col items-center justify-center p-8 bg-red-50 border-2 border-dashed border-red-200 rounded-[2rem] group hover:bg-red-100 hover:border-red-300 transition-all disabled:opacity-50"
          >
            <div className="w-16 h-16 bg-red-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-100 mb-4 group-hover:scale-110 transition-transform">
              <FilePdf size={32} />
            </div>
            <h4 className="font-bold text-red-700">Ekspor ke PDF</h4>
            <p className="text-xs text-red-500 mt-1">Cocok untuk cetak laporan fisik</p>
          </button>

          <button 
            onClick={handleExportExcel}
            disabled={loading}
            className="flex flex-col items-center justify-center p-8 bg-emerald-50 border-2 border-dashed border-emerald-200 rounded-[2rem] group hover:bg-emerald-100 hover:border-emerald-300 transition-all disabled:opacity-50"
          >
            <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100 mb-4 group-hover:scale-110 transition-transform">
              <FileSpreadsheet size={32} />
            </div>
            <h4 className="font-bold text-emerald-700">Ekspor ke Excel</h4>
            <p className="text-xs text-emerald-500 mt-1">Cocok untuk pengolahan data lanjut</p>
          </button>
        </div>
      </div>

      <div className="bg-slate-50 rounded-[2rem] p-8 flex items-center gap-6">
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
          <FileText size={24} />
        </div>
        <div>
          <h4 className="font-bold text-slate-800">Catatan Laporan</h4>
          <p className="text-sm text-slate-500">Laporan yang dihasilkan mencakup seluruh metadata surat termasuk nomor, perihal, dan status terakhir.</p>
        </div>
      </div>
    </div>
  );
}
