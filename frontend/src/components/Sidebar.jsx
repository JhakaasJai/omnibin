import React from 'react';
import { LayoutDashboard, MapPin, Route, History, Recycle, Sparkles, Wifi, WifiOff, Leaf, AlertCircle, Scan } from 'lucide-react';

const menuItems = [
  { id: 'dashboard', label: 'Live Overview',        icon: LayoutDashboard },
  { id: 'map',       label: 'Telemetry Map',         icon: MapPin },
  { id: 'routes',    label: 'Route Optimizer',       icon: Route },
  { id: 'history',   label: 'Audit Logs',            icon: History },
  { id: 'complaints',label: 'Complaints',          icon: AlertCircle },
  { id: 'scanner',   label: 'AI Scanner',            icon: Scan },
];

const Sidebar = ({ activeTab, setActiveTab, isConnected }) => (
  <aside
    className="fixed md:sticky bottom-0 md:top-0 left-0 right-0 md:w-60 flex flex-row md:flex-col h-[68px] md:h-screen z-50 shrink-0 glass-deep overflow-x-auto md:overflow-visible touch-pan-x"
    style={{ borderRight: '1px solid rgba(255,255,255,0.55)', borderTop: '1px solid rgba(255,255,255,0.55)', borderRadius: 0 }}
  >
    {/* Brand */}
    <div className="hidden md:flex px-5 py-5 items-center gap-3 shrink-0"
         style={{ borderBottom: '1px solid rgba(255,255,255,0.40)' }}>
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
           style={{ background: 'linear-gradient(135deg,#16a34a,#059669)', boxShadow: '0 4px 12px rgba(22,163,74,0.30)' }}>
        <Recycle className="w-5 h-5 text-white stroke-[2.5]" />
      </div>
      <div>
        <h1 className="font-black text-base leading-none" style={{ color: '#0d4a2f' }}>OmniBin</h1>
        <p className="text-[10px] font-semibold flex items-center gap-1 mt-0.5" style={{ color: '#16a34a' }}>
          <Sparkles className="w-2.5 h-2.5" /> AI Route Engine
        </p>
      </div>
    </div>

    {/* Nav */}
    <nav className="flex-1 flex flex-row md:flex-col px-2 md:px-3 py-2 md:py-4 space-x-1 md:space-x-0 md:space-y-1 items-center md:items-stretch w-full justify-around md:justify-start">
      <p className="hidden md:block px-3 text-[9px] font-black uppercase tracking-widest mb-3"
         style={{ color: 'rgba(13,74,47,0.35)' }}>Main Views</p>
      {menuItems.map(({ id, label, icon: Icon }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            id={`sidebar-${id}`}
            onClick={() => setActiveTab(id)}
            className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 px-2 md:px-3.5 py-1.5 md:py-2.5 rounded-xl text-[10px] md:text-sm font-semibold text-center md:text-left transition-all duration-200 relative min-w-[64px] md:w-full"
            style={active ? {
              background: 'rgba(22,163,74,0.12)',
              border: '1px solid rgba(22,163,74,0.25)',
              color: '#166534',
            } : {
              background: 'transparent',
              border: '1px solid transparent',
              color: 'rgba(13,74,47,0.55)',
            }}
            onMouseEnter={e => { if (!active) { e.currentTarget.style.background='rgba(255,255,255,0.50)'; e.currentTarget.style.color='#166534'; } }}
            onMouseLeave={e => { if (!active) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(13,74,47,0.55)'; } }}
          >
            {active && (
              <span className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full"
                    style={{ background: '#16a34a', boxShadow:'0 0 6px rgba(22,163,74,0.50)' }} />
            )}
            <Icon className="w-5 h-5 md:w-4 md:h-4 shrink-0" style={{ color: active ? '#16a34a' : 'rgba(13,74,47,0.40)' }} />
            <span className="truncate w-full">{label}</span>
          </button>
        );
      })}
    </nav>

    {/* Connection status */}
    <div className="hidden md:flex p-3 m-3 rounded-2xl items-center gap-2.5 shrink-0"
         style={{ background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.60)' }}>
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? 'bg-green-400' : 'bg-amber-400'}`} />
        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-amber-500'}`} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold truncate" style={{ color: '#0d4a2f' }}>FastAPI Gateway</p>
        <p className="text-[9px] truncate" style={{ color: 'rgba(13,74,47,0.50)' }}>
          {isConnected ? 'Live Synchronized' : 'Reconnecting...'}
        </p>
      </div>
      {isConnected
        ? <Wifi className="w-3.5 h-3.5 shrink-0" style={{ color:'#16a34a' }} />
        : <WifiOff className="w-3.5 h-3.5 shrink-0" style={{ color:'#f59e0b' }} />}
    </div>
  </aside>
);

export default Sidebar;
