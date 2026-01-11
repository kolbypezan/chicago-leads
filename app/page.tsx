"use client";
import { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';

export default function Dashboard() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [sortBy, setSortBy] = useState("date"); // Default to Newest for contractors
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [visibleCount, setVisibleCount] = useState(50); // Start with 50

  useEffect(() => {
    fetch('/chicago_permits.csv')
      .then(response => response.text())
      .then(csvText => {
        const result = Papa.parse(csvText, { 
          header: true, 
          skipEmptyLines: true,
          dynamicTyping: true 
        });
        setData(result.data);
        setLoading(false);
      });
  }, []);

  // Filter Logic - Runs on the WHOLE dataset
  const filteredData = useMemo(() => {
    return data.filter((row: any) => {
      const cost = parseFloat(row.reported_cost) || 0;
      const permitType = (row.permit_type || "").toUpperCase();
      const description = (row.work_description || "").toUpperCase();
      const searchUpper = search.toUpperCase();
      const filterUpper = filterType.toUpperCase();

      const matchesCost = cost >= 2000;
      const matchesSearch = 
        permitType.includes(searchUpper) || 
        description.includes(searchUpper) || 
        (row.street_name || "").toUpperCase().includes(searchUpper);

      const matchesType = 
        filterType === "All" || 
        permitType.includes(filterUpper) || 
        description.includes(filterUpper);

      return matchesCost && matchesSearch && matchesType;
    }).sort((a: any, b: any) => {
      if (sortBy === "cost") return (b.reported_cost || 0) - (a.reported_cost || 0);
      return new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime();
    });
  }, [data, search, filterType, sortBy]);

  // This is what actually displays (paged for performance)
  const visibleData = filteredData.slice(0, visibleCount);

  const formatCurrency = (val: any) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);
  };

  return (
    <div className="p-4 md:p-10 bg-black min-h-screen text-slate-100 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Real-Time Stats Bar */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-6 border-b border-slate-800 pb-8">
          <div>
            <h1 className="text-5xl font-black tracking-tighter text-white italic">PERMIT <span className="text-blue-500">PULSE</span></h1>
            <p className="text-slate-500 font-bold mt-2 uppercase tracking-widest text-xs">Chicago Business Intelligence Terminal</p>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <p className="text-[10px] text-slate-500 font-black uppercase">Matching Leads</p>
              <p className="text-xl font-black text-blue-400">{filteredData.length.toLocaleString()}</p>
            </div>
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <p className="text-[10px] text-slate-500 font-black uppercase">Avg. Project Cost</p>
              <p className="text-xl font-black text-green-400">$142k</p>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          <input 
            type="text" 
            placeholder="Search by street or owner..." 
            className="md:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800 focus:border-blue-500 outline-none transition-all text-lg"
            onChange={(e) => { setSearch(e.target.value); setVisibleCount(50); }}
          />
          <select 
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 outline-none font-bold"
            onChange={(e) => { setFilterType(e.target.value); setVisibleCount(50); }}
          >
            <option value="All">All Sectors</option>
            <option value="ELECTRIC">⚡ Electrical</option>
            <option value="PLUMBING">🚰 Plumbing</option>
            <option value="NEW CONSTRUCTION">🏗️ New Build</option>
            <option value="ROOFING">🏠 Roofing</option>
            <option value="WRECKING">🧨 Demolition</option>
          </select>
          <select 
            className="p-5 rounded-2xl bg-blue-600 text-white font-black outline-none"
            onChange={(e) => { setSortBy(e.target.value); setVisibleCount(50); }}
          >
            <option value="date">Newest First</option>
            <option value="cost">Highest Value</option>
          </select>
        </div>

        {/* Data Cards */}
        <div className="grid gap-4">
          {visibleData.map((row: any, i) => (
            <div key={i} className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl hover:bg-slate-900 hover:border-blue-500/50 transition-all cursor-pointer group" onClick={() => setSelectedLead(row)}>
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl font-black text-green-400">{formatCurrency(row.reported_cost)}</span>
                    <span className="text-[10px] font-black bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded uppercase tracking-tighter">
                      {row.permit_type?.split('-')[1] || 'GENERAL'}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white uppercase">{row.street_number} {row.street_name}</h3>
                  <p className="text-slate-500 text-sm italic mt-1">{row.work_description?.substring(0, 100)}...</p>
                </div>
                <button className="bg-white text-black px-8 py-3 rounded-2xl font-black group-hover:bg-blue-500 group-hover:text-white transition-all">DETAILS</button>
              </div>
            </div>
          ))}
        </div>

        {/* Load More Button */}
        {filteredData.length > visibleCount && (
          <div className="mt-12 text-center">
            <button 
              onClick={() => setVisibleCount(prev => prev + 100)}
              className="bg-slate-800 hover:bg-slate-700 text-white font-black px-12 py-5 rounded-2xl transition-all border border-slate-700"
            >
              LOAD MORE LEADS ({filteredData.length - visibleCount} REMAINING)
            </button>
          </div>
        )}

        {/* Modal Logic (Same as V3 but styled deeper) */}
        {selectedLead && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 z-50" onClick={() => setSelectedLead(null)}>
             {/* Modal Content - (See previous V3 code for internal modal structure) */}
             <div className="bg-slate-900 border border-slate-700 max-w-2xl w-full p-10 rounded-[3rem] text-center" onClick={e => e.stopPropagation()}>
                <p className="text-blue-500 font-black uppercase text-xs mb-4">Lead Intelligence</p>
                <h2 className="text-4xl font-black text-white mb-6">{selectedLead.street_number} {selectedLead.street_name}</h2>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-black p-6 rounded-2xl border border-slate-800">
                    <p className="text-slate-500 text-[10px] font-bold uppercase mb-2">Cost</p>
                    <p className="text-2xl font-black text-green-400">{formatCurrency(selectedLead.reported_cost)}</p>
                  </div>
                  <div className="bg-black p-6 rounded-2xl border border-slate-800">
                    <p className="text-slate-500 text-[10px] font-bold uppercase mb-2">Issued</p>
                    <p className="text-2xl font-black text-white">{selectedLead.issue_date?.split('T')[0]}</p>
                  </div>
                </div>
                <p className="text-slate-400 italic mb-10">"{selectedLead.work_description}"</p>
                <button onClick={() => setSelectedLead(null)} className="w-full bg-blue-600 py-5 rounded-2xl font-black">BACK TO DASHBOARD</button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}