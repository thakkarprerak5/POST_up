"use client";

import { useState, useEffect } from "react";
import { Activity } from "lucide-react";

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/activity-logs")
      .then((res) => res.json())
      .then((data) => {
        // Safe extraction of logs array
        const logsArray = Array.isArray(data) ? data : (data.logs || data.data || []);
        setLogs(logsArray);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLogs([]); // Ensure logs is an array even on error
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Activity Logs</h1>
          <p className="text-slate-500">Super Admin system monitoring</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-900">Action</th>
                <th className="px-6 py-4 font-semibold text-slate-900">Admin</th>
                <th className="px-6 py-4 font-semibold text-slate-900">Details</th>
                <th className="px-6 py-4 font-semibold text-slate-900">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    Loading logs...
                  </td>
                </tr>
              ) : Array.isArray(logs) && logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    No activity logs found
                  </td>
                </tr>
              ) : Array.isArray(logs) && logs.map((log: any) => (
                <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {log.action}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {log.adminEmail || log.adminName || "System"}
                  </td>
                  <td className="px-6 py-4 text-slate-500 max-w-xs truncate">
                    {JSON.stringify(log.details || {})}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString()}
                  </td>
                </tr>
              ))}

            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
