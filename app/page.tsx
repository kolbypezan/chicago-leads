"use client";
import { useState, useEffect } from 'react';
import Papa from 'papaparse';

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // This fetches the CSV you put in the public folder
    fetch('/chicago_permits.csv')
      .then(response => response.text())
      .then(csvText => {
        const result = Papa.parse(csvText, { header: true });
        // Filter for high-value leads immediately
        const highValue = result.data.filter((row: any) => 
          parseFloat(row.reported_cost) > 50000
        );
        setData(highValue);
      });
  }, []);

  return (
    <div className="p-8 bg-gray-900 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-4">Chicago High-Value Leads</h1>
      <p className="mb-8 text-gray-400">Showing projects over $50,000 in reported cost.</p>
      
      <input 
        type="text" 
        placeholder="Search by neighborhood or work type..." 
        className="p-3 w-full mb-6 rounded bg-gray-800 border border-gray-700"
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-700 bg-gray-800">
              <th className="p-4">Cost</th>
              <th className="p-4">Work Description</th>
              <th className="p-4">Owner/Contact</th>
              <th className="p-4">Address</th>
            </tr>
          </thead>
          <tbody>
            {data.filter((row: any) => 
              row.work_description?.toLowerCase().includes(search.toLowerCase()) ||
              row.street_name?.toLowerCase().includes(search.toLowerCase())
            ).map((row: any, i) => (
              <tr key={i} className="border-b border-gray-800 hover:bg-gray-850">
                <td className="p-4 text-green-400 font-bold">${row.reported_cost}</td>
                <td className="p-4 text-sm">{row.work_description?.substring(0, 60)}...</td>
                <td className="p-4">{row.contact_1_name}</td>
                <td className="p-4">{row.street_number} {row.street_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
