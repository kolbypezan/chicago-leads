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

  // 1. Fetch and Parse Data
  useEffect(() => {
    fetch('/chicago_permits.csv')
      .then(response => response.text())
      .then(csvText => {
        const result = Papa.parse(csvText, { 
          header: true, 
          skipEmptyLines: true,
          dynamicTyping: true // Automatically converts numbers
        });
        setData(result.data);
        setLoading(false);
      });
  }, []);

  // 2. Professional Filter & Sort Logic (Fuzzy Search)
  const processedData = useMemo(() => {
    return data
      .filter((row: any) => {
        const cost = parseFloat(row.reported_cost) || 0;
        const permitType = (row.permit_type || "").toUpperCase();
        const description = (row.work_description || "").toUpperCase();
        const searchUpper = search.toUpperCase();
        const filterUpper = filterType.toUpperCase();

        // Must be at least $2,000 to be a "lead"
        const matchesCost = cost >= 2000;

        // Search box matches address, owner, or description
        const matchesSearch = 
          permitType.includes(searchUpper) || 
          description.includes(searchUpper) || 
          (row.street_name || "").toUpperCase().includes(searchUpper) ||
          (row.contact_1_name || "").toUpperCase().includes(searchUpper);

        // Filter Category matches either the Permit Type OR the Description
        // This is the fix for "Electrical" which is often hidden in descriptions
        const matchesType = 
          filterType === "All" || 
          permitType.includes(filterUpper) || 
          description.includes(filterUpper);

        return matchesCost && matchesSearch && matchesType;
      })
      .sort((a: any, b: any) => {
        if (sortBy === "cost") {
          return (parseFloat(b.reported_cost) || 0) - (parseFloat(a.reported_cost) || 0);
        }
        return new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime();
      })
      .slice(0, 300); // Only show top 300 for speed
  }, [data, search, filterType, sortBy]);

  // 3. Helpers
  const formatCurrency = (val: any) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD', 
      maximumFractionDigits: 0 
    }).format(parseFloat(val) || 0);
  };

  return (
    <div className="p-4 md:p-10 bg-black min-h-screen text-slate-100 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-800 pb-8">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">
              Chi-Town <span className="text-blue-500 underline decoration-2 underline-offset-8">Permit Pro</span>
            </h1>
            <p className="text-slate-500 font-medium mt-2">Verified $2k+ Construction Leads for Sub-Contractors.</p>
          </div>
          <div className="flex flex-col items-end">
             <div className="bg-blue-600/10 border border-blue-500/20 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest text-blue-400">
               {processedData.length} Matches Found
             </div>
          </div>
        </div>

        {/* Control Panel (Filters & Search) */}
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          <div className="md:col-span-2 relative">
            <input 
              type="text" 
              placeholder="Search by street name, owner, or keyword..." 
              className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <select 
            className="p-4 rounded-xl bg-slate-900 border border-slate-800 outline-none cursor-pointer hover:border-slate-600"
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="All">All Categories</option>
            <option value="ELECTRIC">Electrical Wiring</option>
            <option value="PLUMBING">Plumbing</option>
            <option value="WRECKING">Demolition/Wrecking</option>
            <option value="NEW CONSTRUCTION">New Construction</option>
            <option value="RENOVATION">Renovations</option>
            <option value="ROOFING">Roofing</option>
          </select>

          <select 
            className="p-4 rounded-xl bg-slate-900 border border-slate-800 outline-none cursor-pointer font-bold text-blue-400"
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="cost">Sort: Highest Cost</option>
            <option value="date">Sort: Newest First</option>
          </select>
        </div>

        {/* Data List */}
        {loading ? (
          <div className="text-center py-24 text-slate-500 font-black animate-pulse tracking-widest">LOADING LIVE PERMIT FEED...</div>
        ) : (
          <div className="grid gap-4">
            {processedData.map((row: any, i) => (
              <div 
                key={i} 
                className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl hover:bg-slate-900 hover:border-blue-500/50 transition-all cursor-pointer group"
                onClick={() => setSelectedLead(row)}
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl font-black text-green-400">
                        {formatCurrency(row.reported_cost)}
                      </span>
                      <span className="text-[10px] font-black bg-slate-800 text-slate-400 border border-slate-700 px-2 py-1 rounded uppercase">
                        {row.permit_type?.replace('PERMIT - ', '') || 'Project'}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors uppercase">
                      {row.street_number} {row.street_name}
                    </h3>
                    <p className="text-slate-500 text-sm line-clamp-1 italic">
                      {row.work_description}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                    <span className="text-xs text-slate-500 font-bold">Issued: {row.issue_date?.split('T')[0]}</span>
                    <button className="bg-slate-800 text-white px-6 py-2 rounded-lg text-sm font-black group-hover:bg-blue-600 transition-all w-full">
                      FULL DETAILS
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Detailed Modal */}
        
        {selectedLead && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-700 max-w-3xl w-full p-8 rounded-[2rem] shadow-2xl relative animate-in zoom-in duration-200">
              <button 
                onClick={() => setSelectedLead(null)} 
                className="absolute top-8 right-8 text-slate-500 hover:text-white font-black text-xl"
              >
                ✕
              </button>
              
              <div className="mb-8">
                <span className="text-blue-500 font-black text-xs uppercase tracking-[0.2em] mb-2 block">Premium Lead Intel</span>
                <h2 className="text-4xl font-black text-white">{selectedLead.street_number} {selectedLead.street_name}</h2>
                <p className="text-slate-400 font-bold mt-1">Chicago, IL {selectedLead.contact_1_zipcode}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-black/50 p-6 rounded-2xl border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-black mb-2 tracking-tighter">Est. Project Cost</p>
                  <p className="text-3xl font-black text-green-400">{formatCurrency(selectedLead.reported_cost)}</p>
                </div>
                <div className="bg-black/50 p-6 rounded-2xl border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-black mb-2 tracking-tighter">City Fees Paid</p>
                  <p className="text-3xl font-black text-white">{formatCurrency(selectedLead.total_fee)}</p>
                </div>
                <div className="bg-black/50 p-6 rounded-2xl border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-black mb-2 tracking-tighter">Permit Status</p>
                  <p className="text-lg font-black text-blue-400 uppercase">{selectedLead.permit_status}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-black text-slate-500 uppercase mb-3 tracking-widest">Official Work Description</h4>
                  <div className="bg-black/30 p-5 rounded-xl border border-slate-800 leading-relaxed text-slate-300 italic text-sm">
                    "{selectedLead.work_description}"
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 border-t border-slate-800 pt-6">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Primary Contact (Lead)</h4>
                    <p className="text-xl font-bold text-white">{selectedLead.contact_1_name || "Private Owner"}</p>
                    <p className="text-blue-500 text-xs font-black uppercase mt-1">{selectedLead.contact_1_type}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Issue Date</h4>
                    <p className="text-xl font-bold text-white">{selectedLead.issue_date?.split('T')[0]}</p>
                    <p className="text-slate-500 text-xs font-bold uppercase mt-1">Ready for bidding</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-10">
                <button 
                  onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${selectedLead.street_number}+${selectedLead.street_name}+Chicago+IL`)}
                  className="flex-1 bg-white text-black font-black py-4 rounded-xl hover:bg-blue-500 hover:text-white transition-all uppercase tracking-tighter"
                >
                  View Job Site on Map
                </button>
                <button 
                  onClick={() => setSelectedLead(null)}
                  className="flex-1 bg-slate-800 text-white font-black py-4 rounded-xl hover:bg-slate-700 transition-all uppercase tracking-tighter"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}