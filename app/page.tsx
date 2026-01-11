"use client";
import { useState, useEffect } from 'react';
import Papa from 'papaparse';

export default function Dashboard() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch('/chicago_permits.csv')
      .then(response => response.text())
      .then(csvText => {
        const result = Papa.parse(csvText, { header: true, skipEmptyLines: true });
        // Filter: Cost > $50k AND must have a valid description
        const filtered = result.data
          .filter((row: any) => parseFloat(row.reported_cost) > 50000)
          .sort((a: any, b: any) => parseFloat(b.reported_cost) - parseFloat(a.reported_cost));
        
        setData(filtered);
        setLoading(false);
      });
  }, []);

  // Formatter for Currency (adds commas and $)
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

  return (
    <div className="p-4 md:p-10 bg-slate-950 min-h-screen text-slate-100 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
              Chicago <span className="text-blue-500">Big Money</span> Permits
            </h1>
            <p className="text-slate-400">Tracking real-time construction leads over $50,000.</p>
          </div>
          <div className="bg-blue-600 px-6 py-3 rounded-full font-bold shadow-lg shadow-blue-500/20">
            {data.length} High-Value Leads Found
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <input 
            type="text" 
            placeholder="Search by neighborhood, contractor, or work type (e.g., 'Roofing')..." 
            className="w-full p-4 pl-6 rounded-2xl bg-slate-900 border border-slate-800 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-2xl"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid gap-6">
            {data.filter((row: any) => 
              JSON.stringify(row).toLowerCase().includes(search.toLowerCase())
            ).slice(0, 200).map((row: any, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-blue-500/50 transition-colors shadow-xl group">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl font-black text-green-400">
                        {formatter.format(row.reported_cost || 0)}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-widest bg-slate-800 px-2 py-1 rounded text-slate-400">
                        {row.permit_type?.replace('PERMIT - ', '')}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">{row.street_number} {row.street_name}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-4 italic">
                      "{row.work_description}"
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-medium text-slate-500">
                      <div>
                        <p className="uppercase text-[10px] mb-1">Owner / Contact</p>
                        <p className="text-slate-200">{row.contact_1_name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="uppercase text-[10px] mb-1">Issue Date</p>
                        <p className="text-slate-200">{row.issue_date?.split('T')[0]}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <button className="w-full md:w-auto bg-slate-800 group-hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold transition-all">
                      View Lead Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}