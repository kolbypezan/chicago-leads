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
    // 1. Fetch Data
    fetch('/chicago_permits.csv')
      .then(response => response.text())
      .then(csvText => {
        const result = Papa.parse(csvText, { header: true, skipEmptyLines: true, dynamicTyping: true });
        setData(result.data);
        setLoading(false);
      });

    // 2. Load Bookmarks from Local Storage
    const saved = localStorage.getItem('chicago_leads_bookmarks');
    if (saved) setBookmarks(JSON.parse(saved));
  }, []);

  // Toggle Bookmark Function
  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Don't open the modal when clicking bookmark
    const newBookmarks = bookmarks.includes(id) 
      ? bookmarks.filter(b => b !== id) 
      : [...bookmarks, id];
    setBookmarks(newBookmarks);
    localStorage.setItem('chicago_leads_bookmarks', JSON.stringify(newBookmarks));
  };

  const filteredData = useMemo(() => {
    return data.filter((row: any) => {
      const id = `${row.id || row.permit_}`; // Unique ID for bookmarking
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

  // Helper to check if a lead is "New" (issued within last 72 hours)
  const isNew = (dateStr: string) => {
    const issueDate = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - issueDate.getTime();
    return diff < (72 * 60 * 60 * 1000); // 72 hours in milliseconds
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
          <div className="flex gap-4">
            <button 
              onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
              className={`px-6 py-4 rounded-xl border font-bold transition-all ${showBookmarksOnly ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}
            >
              Vault ({bookmarks.length})
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <input 
            type="text" 
            placeholder="Search address or owner..." 
            className="md:col-span-2 p-5 rounded-xl bg-slate-900/40 border border-slate-800 focus:border-blue-600 outline-none text-white transition-all"
            onChange={(e) => { setSearch(e.target.value); setVisibleCount(50); }}
          />
          <select 
            className="p-5 rounded-xl bg-slate-900/40 border border-slate-800 outline-none text-slate-300 font-semibold cursor-pointer"
            onChange={(e) => { setFilterType(e.target.value); setVisibleCount(50); }}
          >
            <option value="All">All Sectors</option>
            <option value="ELECTRIC">Electrical</option>
            <option value="PLUMBING">Plumbing</option>
            <option value="NEW CONSTRUCTION">New Construction</option>
            <option value="ROOFING">Roofing</option>
          </select>
          <select 
            className="p-5 rounded-xl bg-blue-700 text-white font-bold cursor-pointer"
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">Newest First</option>
            <option value="cost">Highest Value</option>
          </select>
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
                className={`bg-slate-900/20 border p-7 rounded-2xl hover:bg-slate-900/40 transition-all cursor-pointer group relative ${fresh ? 'border-red-900/50 shadow-[0_0_15px_rgba(220,38,38,0.1)]' : 'border-slate-800/60'}`} 
                onClick={() => setSelectedLead(row)}
              >
                {fresh && (
                  <div className="absolute -top-3 left-6 bg-red-600 text-white text-[9px] font-black px-3 py-1 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.5)] animate-pulse uppercase tracking-widest border border-red-400">
                    Neon Signal: New Lead
                  </div>
                )}
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <span className="text-3xl font-bold tracking-tighter text-white">{formatCurrency(row.reported_cost)}</span>
                      <div className="h-4 w-[1px] bg-slate-800"></div>
                      <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{row.permit_type?.split('-')[1] || 'General'}</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-100 uppercase">{row.street_number} {row.street_name}</h3>
                    <p className="text-slate-500 text-sm mt-2 line-clamp-1">{row.work_description}</p>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={(e) => toggleBookmark(leadId, e)}
                      className={`p-4 rounded-xl border transition-all ${bookmarked ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white'}`}
                    >
                      {bookmarked ? '★ Saved' : '☆ Save'}
                    </button>
                    <button className="bg-white text-black px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">
                      Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Load More */}
        {filteredData.length > visibleCount && (
          <div className="mt-16 text-center border-t border-slate-900 pt-10">
            <button onClick={() => setVisibleCount(prev => prev + 100)} className="text-slate-500 hover:text-white font-bold tracking-widest text-xs uppercase transition-all">
              Load More Results ({filteredData.length - visibleCount} remaining)
            </button>
          </div>
        )}

        {/* Detail Modal (Standard Logic) */}
        {selectedLead && (
          <div className="fixed inset-0 bg-[#000]/90 backdrop-blur-md flex items-center justify-center p-6 z-50" onClick={() => setSelectedLead(null)}>
             <div className="bg-[#0A0A0A] border border-slate-800 max-w-2xl w-full p-10 rounded-[2.5rem] relative" onClick={e => e.stopPropagation()}>
                <h2 className="text-3xl font-black text-white mb-2">{selectedLead.street_number} {selectedLead.street_name}</h2>
                <div className="grid grid-cols-2 gap-4 my-8">
                  <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 text-center">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Cost</p>
                    <p className="text-2xl font-bold text-green-500">{formatCurrency(selectedLead.reported_cost)}</p>
                  </div>
                  <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 text-center">
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Status</p>
                    <p className="text-2xl font-bold text-white uppercase">{selectedLead.permit_status || 'Active'}</p>
                  </div>
                </div>
                <p className="text-slate-400 italic mb-10 text-center leading-relaxed">"{selectedLead.work_description}"</p>
                <div className="flex gap-4">
                  <button onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${selectedLead.street_number}+${selectedLead.street_name}+Chicago+IL`)} className="flex-1 bg-white text-black py-4 rounded-xl font-black uppercase text-xs">Maps</button>
                  <button onClick={() => setSelectedLead(null)} className="flex-1 bg-slate-800 text-white py-4 rounded-xl font-black uppercase text-xs">Close</button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}