"use client";
import { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';

export default function Dashboard() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [sortBy, setSortBy] = useState("date");
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [visibleCount, setVisibleCount] = useState(50);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);

  useEffect(() => {
    fetch('/chicago_permits.csv')
      .then(response => response.text())
      .then(csvText => {
        const result = Papa.parse(csvText, { header: true, skipEmptyLines: true, dynamicTyping: true });
        setData(result.data);
        setLoading(false);
      });

    const saved = localStorage.getItem('chicago_leads_bookmarks');
    if (saved) setBookmarks(JSON.parse(saved));
  }, []);

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newBookmarks = bookmarks.includes(id) ? bookmarks.filter(b => b !== id) : [...bookmarks, id];
    setBookmarks(newBookmarks);
    localStorage.setItem('chicago_leads_bookmarks', JSON.stringify(newBookmarks));
  };

  const copyToClipboard = (row: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `Lead: ${row.street_number} ${row.street_name}\nValue: $${row.reported_cost}\nWork: ${row.work_description}\nSource: LeadSource Chicago`;
    navigator.clipboard.writeText(text);
    alert("Lead details copied to clipboard!");
  };

  const filteredData = useMemo(() => {
    return data.filter((row: any) => {
      const id = `${row.id || row.permit_}`;
      if (showBookmarksOnly && !bookmarks.includes(id)) return false;

      const cost = parseFloat(row.reported_cost) || 0;
      const permitType = (row.permit_type || "").toUpperCase();
      const description = (row.work_description || "").toUpperCase();
      const searchUpper = search.toUpperCase();
      const filterUpper = filterType.toUpperCase();

      const matchesCost = cost >= 2000;
      const matchesSearch = permitType.includes(searchUpper) || description.includes(searchUpper) || (row.street_name || "").toUpperCase().includes(searchUpper);
      const matchesType = filterType === "All" || permitType.includes(filterUpper) || description.includes(filterUpper);

      return matchesCost && matchesSearch && matchesType;
    }).sort((a: any, b: any) => {
      if (sortBy === "cost") return (b.reported_cost || 0) - (a.reported_cost || 0);
      return new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime();
    });
  }, [data, search, filterType, sortBy, bookmarks, showBookmarksOnly]);

  const visibleData = filteredData.slice(0, visibleCount);

  const isNew = (dateStr: string) => {
    const issueDate = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - issueDate.getTime();
    return diff < (72 * 60 * 60 * 1000); // 72 Hours
  };

  const formatCurrency = (val: any) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);
  };

  return (
    <div className="p-4 md:p-10 bg-[#050505] min-h-screen text-slate-200 font-sans selection:bg-blue-500/30">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8 border-b border-slate-800/60 pb-10">
          <div>
            <h1 className="text-5xl font-black tracking-tighter text-white uppercase">
              LEAD<span className="text-blue-600">SOURCE</span> PRO
            </h1>
            <p className="text-slate-500 font-bold mt-2 uppercase tracking-[0.2em] text-[10px]">Real-Time Permit Intelligence Terminal</p>
          </div>
          <button 
            onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
            className={`px-8 py-4 rounded-xl border font-bold transition-all ${showBookmarksOnly ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
          >
            Vault ({bookmarks.length})
          </button>
        </div>

        {/* Lead Grid */}
        <div className="space-y-4">
          {visibleData.map((row: any, i) => {
            const leadId = `${row.id || row.permit_}`;
            const bookmarked = bookmarks.includes(leadId);
            const fresh = isNew(row.issue_date);

            return (
              <div 
                key={i} 
                className={`bg-slate-900/20 border p-7 rounded-2xl hover:bg-slate-900/40 transition-all cursor-pointer group relative ${fresh ? 'border-red-600/50 shadow-[0_0_15px_rgba(220,38,38,0.15)]' : 'border-slate-800/60'}`} 
                onClick={() => setSelectedLead(row)}
              >
                {fresh && (
                  <div className="absolute -top-3 left-6 bg-red-600 text-white text-[9px] font-black px-3 py-1 rounded-full animate-pulse uppercase tracking-widest border border-red-400">
                    NEW LEAD
                  </div>
                )}
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <span className="text-3xl font-bold tracking-tighter text-white">{formatCurrency(row.reported_cost)}</span>
                      <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest px-3 py-1 bg-blue-500/5 rounded-full border border-blue-500/10">
                        {row.permit_type?.split('-')[1] || 'General'}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-100 uppercase">{row.street_number} {row.street_name}</h3>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={(e) => copyToClipboard(row, e)} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-400 hover:text-white transition-all text-xs font-bold uppercase">Share</button>
                    <button onClick={(e) => toggleBookmark(leadId, e)} className={`p-4 rounded-xl border transition-all ${bookmarked ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white'}`}>
                      {bookmarked ? '★ Saved' : '☆ Save'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Modal Logic remains the same... */}
        {selectedLead && (
          <div className="fixed inset-0 bg-[#000]/90 backdrop-blur-md flex items-center justify-center p-6 z-50" onClick={() => setSelectedLead(null)}>
             <div className="bg-[#0A0A0A] border border-slate-800 max-w-2xl w-full p-10 rounded-[2.5rem] relative" onClick={e => e.stopPropagation()}>
                <h2 className="text-3xl font-black text-white mb-2">{selectedLead.street_number} {selectedLead.street_name}</h2>
                <div className="grid grid-cols-2 gap-4 my-8">
                  <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 text-center">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Estimated Cost</p>
                    <p className="text-2xl font-bold text-green-500">{formatCurrency(selectedLead.reported_cost)}</p>
                  </div>
                  <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 text-center">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Date Issued</p>
                    <p className="text-2xl font-bold text-white uppercase">{selectedLead.issue_date?.split('T')[0]}</p>
                  </div>
                </div>
                <p className="text-slate-400 italic mb-10 text-center leading-relaxed">"{selectedLead.work_description}"</p>
                <button onClick={() => setSelectedLead(null)} className="w-full bg-slate-800 text-white py-4 rounded-xl font-black uppercase text-xs">Close Report</button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}