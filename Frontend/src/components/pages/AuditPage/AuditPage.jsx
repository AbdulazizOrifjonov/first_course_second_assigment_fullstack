import { useState, useEffect } from 'react';
import { Shield, Search, Clock, User } from 'lucide-react';
import { api } from '../../../api';
import './AuditPage.css';

export function AuditPage() {
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterEntity, setFilterEntity] = useState('');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAuditLogs()
      .then(setLogs)
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  const getUserName = (log) => log.userFullName || "Noma'lum";

  const filtered = logs.filter(log => {
    let match = true;
    if (search) {
      const q = search.toLowerCase();
      match = match && (
        log.action.toLowerCase().includes(q) ||
        log.entity.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        getUserName(log).toLowerCase().includes(q)
      );
    }
    if (filterAction) match = match && log.action === filterAction;
    if (filterEntity) match = match && log.entity === filterEntity;
    return match;
  });

  const actionColor = {
    CREATE: 'bg-green-100 text-green-800 border-green-200',
    UPDATE: 'bg-blue-100 text-blue-800 border-blue-200',
    DELETE: 'bg-red-100 text-red-800 border-red-200',
  };

  const entityIcon = {
    Doctor: '🩺',
    Patient: '👤',
    Illness: '🏥',
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Jurnal yuklanmoqda...</p>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{logs.length} ta jurnal yozuvi</p>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Qidirish..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
            />
          </div>
          <select
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            className="w-full sm:w-auto min-w-0 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
          >
            <option value="">Barcha amallar</option>
            <option value="CREATE">Yaratish</option>
            <option value="UPDATE">Yangilash</option>
            <option value="DELETE">O'chirish</option>
          </select>
          <select
            value={filterEntity}
            onChange={e => setFilterEntity(e.target.value)}
            className="w-full sm:w-auto min-w-0 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
          >
            <option value="">Barcha ob'ektlar</option>
            <option value="Doctor">Shifokor</option>
            <option value="Patient">Bemor</option>
            <option value="Illness">Tashxis</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <Shield className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-500 font-medium">Jurnal yozuvi topilmadi</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-50">
            {filtered.map(log => (
              <div key={log.id} className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                <div className="text-2xl flex-shrink-0 mt-0.5">
                  {entityIcon[log.entity] || '📋'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${actionColor[log.action] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                      {log.action === 'CREATE' ? 'YARATILDI' : log.action === 'UPDATE' ? 'YANGILANDI' : "O'CHIRILDI"}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{log.entity}</span>
                  </div>
                  <p className="text-sm text-gray-800 font-medium break-safe">{log.details}</p>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1.5 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <User size={11} /> {getUserName(log)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> {new Date(log.timestamp).toLocaleString('uz-UZ')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}




