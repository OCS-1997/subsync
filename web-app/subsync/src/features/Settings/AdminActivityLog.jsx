import React, { useEffect, useState } from 'react';
import api from '../../lib/axiosInstance';

const ActionBadge = ({ action }) => {
  const color =
    action?.toLowerCase().includes('delete') ? 'bg-red-100 text-red-700' :
    action?.toLowerCase().includes('update') ? 'bg-yellow-100 text-yellow-800' :
    action?.toLowerCase().includes('create') ? 'bg-green-100 text-green-700' :
    'bg-blue-100 text-blue-700';
  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${color}`}>{action}</span>
  );
};

const AdminActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/activity-logs');
        setLogs(res.data.logs || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch logs');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  // Filter logs by username or action
  const filteredLogs = logs.filter(
    log =>
      log.username?.toLowerCase().includes(search.toLowerCase()) ||
      log.action?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-2 md:p-6 w-full mx-auto">
      <h2 className="text-3xl font-bold  text-gray-800 dark:text-white tracking-tight">Activity Logs <span className="text-base font-normal text-gray-500">(Admin Only)</span></h2>
      <hr className="mb-10 mt-4  border-gray-200 dark:border-gray-700" />
      <div className="flex flex-col mt-4 md:flex-row md:items-center md:justify-between mb-4 gap-2">
        
        <input
          type="text"
          placeholder="Search by username or action..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full md:w-72 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
        />
      </div>
      <div className="overflow-x-auto rounded-lg shadow-lg bg-white dark:bg-gray-900">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
          <thead className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-900 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Timestamp</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Username</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Action</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Resource</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Resource ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-red-500">{error}</td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">No logs found.</td>
              </tr>
            ) : (
              filteredLogs.map((log, idx) => (
                <tr key={log.id} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-blue-50 dark:bg-gray-800'}>
                  <td className="px-4 py-2 whitespace-nowrap text-xs md:text-sm">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-2 whitespace-nowrap font-medium">{log.username}</td>
                  <td className="px-4 py-2"><ActionBadge action={log.action} /></td>
                  <td className="px-4 py-2">{log.resource_type}</td>
                  <td className="px-4 py-2">{log.resource_id}</td>
                  <td className="px-4 py-2 max-w-xs md:max-w-md break-words">
                    <details className="group cursor-pointer select-none">
                      <summary className="text-blue-600 dark:text-blue-300 underline cursor-pointer">View</summary>
                      <div className="mt-1 text-xs md:text-sm whitespace-pre-wrap">
                        {log.details ? (typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)) : ''}
                      </div>
                    </details>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminActivityLog; 