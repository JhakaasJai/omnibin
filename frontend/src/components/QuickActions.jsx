import React from 'react';
import { Route, Plus, FileText, Truck, Bell, Map, AlertOctagon, Dices, RefreshCw } from 'lucide-react';
import { fetchOptimalRoute } from '../services/api';

const QuickActions = ({ onSeed, seeding, onRandomize, randomizing, onConfig, onOptimizeRoute, routeLoading, onEmergency, setOptimalRoute, bins }) => {
  const actions = [
    {
      id: 'qa-optimize',
      label: routeLoading ? 'Optimizing…' : 'Optimize Route',
      icon: Route,
      color: '#0d9488',
      bg: 'rgba(13,148,136,0.12)',
      border: 'rgba(13,148,136,0.28)',
      onClick: onOptimizeRoute,
      disabled: routeLoading,
      spin: routeLoading,
    },
    {
      id: 'qa-seed',
      label: seeding ? 'Seeding…' : 'Seed Fleet',
      icon: Plus,
      color: '#16a34a',
      bg: 'rgba(22,163,74,0.10)',
      border: 'rgba(22,163,74,0.24)',
      onClick: onSeed,
      disabled: seeding,
    },
    {
      id: 'qa-randomize',
      label: randomizing ? 'Simulating…' : 'Simulate Fill',
      icon: Dices,
      color: '#d97706',
      bg: 'rgba(217,119,6,0.10)',
      border: 'rgba(217,119,6,0.24)',
      onClick: onRandomize,
      disabled: randomizing,
      spin: randomizing,
    },
    {
      id: 'qa-config',
      label: 'Fleet Config',
      icon: Truck,
      color: '#7c3aed',
      bg: 'rgba(124,58,237,0.10)',
      border: 'rgba(124,58,237,0.24)',
      onClick: onConfig,
    },
    {
      id: 'qa-report',
      label: 'Gen. Report',
      icon: FileText,
      color: '#0369a1',
      bg: 'rgba(3,105,161,0.10)',
      border: 'rgba(3,105,161,0.24)',
      onClick: () => window.open(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/docs`, '_blank'),
    },
    {
      id: 'qa-emergency',
      label: 'Emergency',
      icon: AlertOctagon,
      color: '#dc2626',
      bg: 'rgba(220,38,38,0.10)',
      border: 'rgba(220,38,38,0.24)',
      onClick: onEmergency ? onEmergency : () => alert('Emergency protocol offline.'),
    },
  ];

  return (
    <div className="glass-panel rounded-2xl p-4 mb-5">
      <p className="text-[10px] font-black uppercase tracking-widest mb-3"
         style={{ color: 'rgba(13,74,47,0.45)' }}>Quick Actions</p>
      <div className="flex flex-wrap gap-2">
        {actions.map(a => {
          const Icon = a.icon;
          return (
            <button
              key={a.id}
              id={a.id}
              onClick={a.onClick}
              disabled={a.disabled}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all hover:scale-[1.03] active:scale-[0.97] disabled:opacity-60"
              style={{ background: a.bg, border: `1px solid ${a.border}`, color: a.color }}
            >
              <Icon className={`w-3.5 h-3.5 ${a.spin ? 'animate-spin' : ''}`} />
              {a.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;
