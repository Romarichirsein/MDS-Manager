import React, { useState } from 'react';
import { ActivityLog } from '../types';
import { formatDateTime, downloadCSV } from '../services/api';
import { Shield, Search, Download, Filter, User, Clock } from 'lucide-react';

interface AuditLogsViewProps {
  logs: ActivityLog[];
  onRefresh: () => void;
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ logs, onRefresh }) => {
  const [filterType, setFilterType] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredLogs = logs.filter((log) => {
    if (filterType && log.actionType !== filterType) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const mAction = log.action.toLowerCase().includes(q);
      const mUser = log.userName.toLowerCase().includes(q);
      const mDetails = log.details.toLowerCase().includes(q);
      if (!mAction && !mUser && !mDetails) return false;
    }
    return true;
  });

  const handleExportCSV = () => {
    const headers = ['Date & Heure', 'Utilisateur', 'Rôle', 'Type Action', 'Événement', 'Détails Opérationnels'];
    const rows = filteredLogs.map((l) => [
      l.timestamp,
      l.userName,
      l.userRole,
      l.actionType,
      l.action,
      l.details,
    ]);
    downloadCSV(`audit-logs-${new Date().toISOString().slice(0, 10)}.csv`, [headers, ...rows]);
  };

  const getBadgeColor = (type: ActivityLog['actionType']) => {
    switch (type) {
      case 'INSCRIPTION':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PAIEMENT':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'MODIFICATION':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'ARCHIVAGE':
        return 'bg-slate-200 text-slate-800 border-slate-300';
      case 'SUPPRESSION':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'AUTH':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'CONFIG':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-700" />
            Journal d Audit & Traçabilité Opérationnelle
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Historique infalsifiable de toutes les actions administratives, encaissements et modifications
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="export-logs-csv-btn"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Exporter le journal (CSV)
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            id="audit-log-search-input"
            type="text"
            placeholder="Rechercher utilisateur, action, détails..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>

        <div className="sm:w-64">
          <select
            id="audit-log-type-filter"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-700"
          >
            <option value="">Tous les types d actions</option>
            <option value="INSCRIPTION">Inscriptions</option>
            <option value="PAIEMENT">Paiements & Encaissements</option>
            <option value="MODIFICATION">Modifications</option>
            <option value="ARCHIVAGE">Archivages</option>
            <option value="SUPPRESSION">Suppressions</option>
            <option value="AUTH">Connexions & Accès</option>
            <option value="CONFIG">Configuration Système</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Aucun événement enregistré correspondant aux critères.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <th className="p-3.5">Horodatage</th>
                  <th className="p-3.5">Utilisateur</th>
                  <th className="p-3.5">Rôle</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Détails de l action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-mono text-slate-500 whitespace-nowrap">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">
                      {log.userName}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {log.userRole}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getBadgeColor(
                          log.actionType
                        )}`}
                      >
                        {log.actionType}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-700 leading-relaxed">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
