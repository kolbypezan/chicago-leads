"use client";
import { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';

export default function Dashboard() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [sortBy, setSortBy] = useState("cost"); // "cost" or "date"
  const [selectedLead, setSelectedLead] = useState<any>(null);

  useEffect(() => {
    fetch('/chicago_permits.csv')
      .then(response => response.text())
      .then(csvText => {
        const result = Papa.parse(csvText, { header: true, skipEmptyLines: true });
        setData(result.data);
        setLoading(false);
      });
  }, []);

  // Professional Filter & Sort Logic
  const processedData = useMemo(() => {
    return data
      .filter((row: any) => {
        const matchesCost = parseFloat(row.reported_cost) > 10000;
        const matchesSearch = JSON.stringify(row).toLowerCase().includes(search.toLowerCase());
        const matchesType = filterType === "All" || row.permit_type?.includes(filterType);
        return matchesCost && matchesSearch && matchesType;
      })
      .sort((a: any, b: any) => {
        if (sortBy === "cost") return parseFloat(b.reported_cost) - parseFloat(a.reported_cost);
        return new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime();
      })
      .slice(0, 300);
  }, [data, search, filterType, sortBy]);

  const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  return (
    <div className="p-4 md:p-10 bg-black min-h-screen text-slate-100 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-800 pb-8">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-white">CHI-TOWN <span className="text-blue-500">PERMIT PRO</span></h1>
            <p className="text-slate-500 font-medium">Verified high-value construction leads for Chicago sub-contractors.</p>
          </div>
          <div className="flex gap-2">
             <div className="bg-slate-900 border border-slate-700 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest text-slate-400">
               Live Database: {data.length.toLocaleString()} Records
             </div>
          </div>
        </div>

        {/* Filter Bar */}
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <input 
            type="text" 
            placeholder="Search leads..." 
            className="md:col-span-2 p-4 rounded-xl bg-slate-900 border border-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={(e) => setSearch(e.target.value)}
          />
          <select 
            className="p-4 rounded-xl bg-slate-900 border border-slate-800 outline-none cursor-pointer"
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="All">All Permit Types</option>
            <option value="ELECTRIC">Electrical</option>
            <option value="WRECKING">Wrecking/Demo</option>
            <option value="ELEVATOR">Elevator</option>
            <option value="SIGNS">Signs</option>
          </select>
          <select 
            className="p-4 rounded-xl bg-slate-900 border border-slate-800 outline-none cursor-pointer text-blue-400 font-bold"
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="cost">Sort: Highest Cost</option>
            <option value="date">Sort: Newest First</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-500 font-bold animate-pulse">Initializing Lead Engine...</div>
        ) : (
          <div className="grid gap-4">
            {processedData.map((row: any, i) => (
              <div key={i} className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl hover:bg-slate-900 transition-all cursor-pointer group" onClick={() => setSelectedLead(row)}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl font-black text-green-400">{formatter.format(row.reported_cost || 0)}</span>
                      <span className="text-[10px] font-black bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded italic uppercase">
                        {row.permit_type?.replace('PERMIT - ', '')}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{row.street_number} {row.street_name}</h3>
                    <p className="text-slate-500 text-sm line-clamp-1 mb-4">Issued: {row.issue_date?.split('T')[0]} • {row.work_description}</p>
                  </div>
                  <button className="bg-slate-800 text-white px-5 py-2 rounded-lg text-sm font-bold group-hover:bg-blue-600 transition-all">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lead Detail Modal */}
        
        {selectedLead && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-700 max-w-2xl w-full p-8 rounded-3xl shadow-2xl relative animate-in fade-in zoom-in duration-200">
              <button onClick={() => setSelectedLead(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white font-bold">CLOSE ✕</button>
              
              <div className="mb-6">
                <span className="text-blue-500 font-black text-sm uppercase tracking-widest">Lead Intelligence Report</span>
                <h2 className="text-3xl font-black text-white mt-2">{selectedLead.street_number} {selectedLead.street_name}</h2>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-black/40 p-4 rounded-xl border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Estimated Cost</p>
                  <p className="text-2xl font-black text-green-400">{formatter.format(selectedLead.reported_cost)}</p>
                </div>
                <div className="bg-black/40 p-4 rounded-xl border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Total Fees Paid</p>
                  <p className="text-2xl font-black text-white">${selectedLead.total_fee}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Work Description</h4>
                  <p className="text-slate-300 text-sm leading-relaxed bg-black/20 p-4 rounded-lg border border-slate-800 italic">
                    "{selectedLead.work_description}"
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-1">Primary Contact</h4>
                    <p className="text-white font-bold">{selectedLead.contact_1_name || "Unknown"}</p>
                    <p className="text-slate-400 text-xs italic">{selectedLead.contact_1_type}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-1">Status</h4>
                    <p className="text-white font-bold text-sm uppercase text-blue-400">{selectedLead.permit_status}</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${selectedLead.street_number}+${selectedLead.street_name}+Chicago+IL`)}
                className="mt-8 w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-blue-500/20"
              >
                OPEN IN GOOGLE MAPS
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}