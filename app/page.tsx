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

  const filteredData = useMemo(() => {
    return data.filter((row: any) => {
      const cost = parseFloat(row.reported_cost) || 0;
      const permitType = (row.permit_type || "").toUpperCase();
      const description = (row.work_description || "").toUpperCase();
      const searchUpper = search.toUpperCase();
      const filterUpper = filterType.toUpperCase();

      // Lead Qualification Criteria
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

  const visibleData = filteredData.slice(0, visibleCount);

  const formatCurrency = (val: any) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD', 
      maximumFractionDigits: 0 
    }).format(val || 0);
  };

  return (
    <div className="p-4 md:p-10 bg-[#050505] min-h-screen text-slate-200 font-sans selection:bg-blue-500/30">
      <div className="max-w-7xl mx-auto">
        
        {/* Enterprise Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8 border-b border-slate-800/60 pb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold tracking-[0.3em] text-slate-500 uppercase">Live Intelligence Feed</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter text-white">
              LEAD<span className="text-blue-600">SOURCE</span> CHICAGO
            </h1>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <div className="bg-slate-900/50 px-6 py-4 rounded-xl border border-slate-800">
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1">Total Qualified Leads</p>
              <p className="text-2xl font-mono font-bold text-white">{filteredData.length.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Professional Filter Set */}
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <div className="md:col-span-2">
            <input 
              type="text" 
              placeholder="Search by address, owner, or keyword..." 
              className="w-full p-5 rounded-xl bg-slate-900/40 border border-slate-800 focus:border-blue-600 focus:ring-0 outline-none transition-all text-white placeholder:text-slate-600"
              onChange={(e) => { setSearch(e.target.value); setVisibleCount(50); }}
            />
          </div>
          <select 
            className="p-5 rounded-xl bg-slate-900/40 border border-slate-800 outline-none text-slate-300 font-semibold appearance-none hover:border-slate-700 cursor-pointer"
            onChange={(e) => { setFilterType(e.target.value); setVisibleCount(50); }}
          >
            <option value="All">All Sectors</option>
            <option value="ELECTRIC">Electrical Wiring</option>
            <option value="PLUMBING">Plumbing & Mechanical</option>
            <option value="NEW CONSTRUCTION">New Construction</option>
            <option value="ROOFING">Roofing & Exterior</option>
            <option value="WRECKING">Demolition Services</option>
          </select>
          <select 
            className="p-5 rounded-xl bg-blue-700 text-white font-bold outline-none hover:bg-blue-600 transition-colors cursor-pointer"
            onChange={(e) => { setSortBy(e.target.value); setVisibleCount(50); }}
          >
            <option value="date">Sort: Newest First</option>
            <option value="cost">Sort: Highest Value</option>
          </select>
        </div>

        {/* Lead Table / Cards */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-bold tracking-widest text-xs uppercase">Syncing Database</p>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleData.map((row: any, i) => (
              <div 
                key={i} 
                className="bg-slate-900/20 border border-slate-800/60 p-7 rounded-2xl hover:bg-slate-900/40 hover:border-blue-900/50 transition-all cursor-pointer group" 
                onClick={() => setSelectedLead(row)}
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <span className="text-3xl font-bold tracking-tighter text-white">
                        {formatCurrency(row.reported_cost)}
                      </span>
                      <div className="h-4 w-[1px] bg-slate-800"></div>
                      <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest bg-blue-500/5 px-3 py-1 rounded-full border border-blue-500/10">
                        {row.permit_type?.split('-')[1] || 'General'}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-100 group-hover:text-blue-500 transition-colors uppercase">
                      {row.street_number} {row.street_name}
                    </h3>
                    <p className="text-slate-500 text-sm mt-2 line-clamp-1 max-w-2xl">
                      {row.work_description}
                    </p>
                  </div>
                  <div className="flex flex-col md:items-end gap-3 w-full md:w-auto">
                    <span className="text-[10px] text-slate-600 font-bold uppercase">Issued: {row.issue_date?.split('T')[0]}</span>
                    <button className="bg-slate-800 text-white px-8 py-3 rounded-lg text-[11px] font-black tracking-widest uppercase group-hover:bg-blue-600 transition-all shadow-xl">
                      View Report
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More Control */}
        {filteredData.length > visibleCount && (
          <div className="mt-16 text-center border-t border-slate-900 pt-10">
            <button 
              onClick={() => setVisibleCount(prev => prev + 100)}
              className="bg-transparent hover:bg-slate-900 text-slate-400 hover:text-white font-bold px-10 py-4 rounded-xl transition-all border border-slate-800"
            >
              LOAD MORE DATA ({filteredData.length - visibleCount} ENTRIES REMAINING)
            </button>
          </div>
        )}

        {/* Enterprise Modal */}
        
        {selectedLead && (
          <div className="fixed inset-0 bg-[#000]/80 backdrop-blur-md flex items-center justify-center p-6 z-50" onClick={() => setSelectedLead(null)}>
             <div className="bg-[#0A0A0A] border border-slate-800 max-w-3xl w-full p-12 rounded-[2rem] shadow-2xl relative" onClick={e => e.stopPropagation()}>
                <button onClick={() => setSelectedLead(null)} className="absolute top-10 right-10 text-slate-600 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <p className="text-blue-600 font-bold uppercase text-[10px] tracking-[0.4em] mb-4">Project Intelligence Report</p>
                <h2 className="text-4xl font-black text-white mb-2">{selectedLead.street_number} {selectedLead.street_name}</h2>
                <p className="text-slate-500 font-bold text-sm mb-10 italic">Issued {selectedLead.issue_date?.split('T')[0]}</p>
                
                <div className="grid grid-cols-2 gap-6 mb-10">
                  <div className="bg-slate-900/40 p-8 rounded-2xl border border-slate-800/60">
                    <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest mb-2">Estimated Value</p>
                    <p className="text-3xl font-bold text-green-500">{formatCurrency(selectedLead.reported_cost)}</p>
                  </div>
                  <div className="bg-slate-900/40 p-8 rounded-2xl border border-slate-800/60">
                    <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest mb-2">Permit Status</p>
                    <p className="text-3xl font-bold text-white uppercase">{selectedLead.permit_status || 'Active'}</p>
                  </div>
                </div>
                
                <div className="text-left mb-10">
                  <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest mb-3">Scope of Work</p>
                  <p className="text-slate-300 leading-relaxed p-6 bg-slate-950 border border-slate-900 rounded-xl text-sm italic">
                    "{selectedLead.work_description}"
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${selectedLead.street_number}+${selectedLead.street_name}+Chicago+IL`)}
                    className="bg-white text-black py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-600 hover:text-white transition-all"
                  >
                    View Job Location
                  </button>
                  <button onClick={() => setSelectedLead(null)} className="bg-slate-900 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs border border-slate-800">
                    Close Report
                  </button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}