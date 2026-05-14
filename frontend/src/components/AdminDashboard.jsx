import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import OverviewCards from './OverviewCards';
import AnalyticsCards from './AnalyticsCards';
import MapView from './MapView';
import RoutePanel from './RoutePanel';
import AIChatWidget from './AIChatWidget';
import FleetConfigModal from './FleetConfigModal';
import QuickActions from './QuickActions';
import AlertsPanel from './AlertsPanel';
import FuelAnalytics from './FuelAnalytics';
import ComplaintsPanel from './ComplaintsPanel';
import BottleScanner from './BottleScanner';
import {
  fetchBins, fetchBinHistory, seedBins,
  randomizeBins, fetchOptimalRoute, fetchConfig, fetchAllOperators,
  fetchPredictedBins, fetchPredictedRoute
} from '../services/api';
import {
  X, Activity, Filter, Settings, Recycle,
  Leaf, RefreshCw, ChevronRight
} from 'lucide-react';

/* ─── derived helpers ───────────────────────────────────────── */
const statusChip = s =>
  s === 'Critical' ? 'chip-critical' : s === 'Needs Collection' ? 'chip-warn' : 'chip-ok';

const FillBar = ({ pct }) => (
  <div className="w-full h-1.5 rounded-full overflow-hidden"
       style={{ background: 'rgba(13,74,47,0.10)', minWidth: 60 }}>
    <div className="h-full rounded-full transition-all duration-500"
         style={{
           width: `${Math.min(pct, 100)}%`,
           background: pct > 80 ? 'linear-gradient(90deg,#f59e0b,#dc2626)'
                      : pct > 50 ? '#d97706' : '#16a34a'
         }} />
  </div>
);

function AdminDashboard() {
  const [bins,              setBins]              = useState([]);
  const [optimalRoute,      setOptimalRoute]      = useState(null);
  const [selectedBin,       setSelectedBin]       = useState(null);
  const [binHistory,        setBinHistory]        = useState(null);
  const [historyLoading,    setHistoryLoading]    = useState(false);
  const [activeTab,         setActiveTab]         = useState('dashboard');
  const [isConnected,       setIsConnected]       = useState(true);
  const [seeding,           setSeeding]           = useState(false);
  const [randomizing,       setRandomizing]       = useState(false);
  const [selectedVan,       setSelectedVan]       = useState('ALL');
  const [config,            setConfig]            = useState(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [routeLoading,      setRouteLoading]      = useState(false);
  const [routingMode,       setRoutingMode]       = useState('static');
  const [operators,         setOperators]         = useState([]);
  const [predicting,        setPredicting]        = useState(false);
  const [predictions,       setPredictions]       = useState({});

  /* polling */
  useEffect(() => {
    const load = async () => {
      try { 
        setBins(await fetchBins()); 
        setOperators(await fetchAllOperators());
        setIsConnected(true); 
      }
      catch { setIsConnected(false); }
    };
    load();
    fetchConfig().then(setConfig).catch(console.error);
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, []);

  /* background prediction polling for 'hours to full' */
  useEffect(() => {
    const fetchPreds = async () => {
      try {
        const pBins = await fetchPredictedBins(1); // Hours ahead doesn't matter for hours_until_full
        const predMap = {};
        pBins.forEach(p => { predMap[p.bin_id] = p.hours_until_full; });
        setPredictions(predMap);
      } catch (e) { console.error("Prediction fetch failed", e); }
    };
    fetchPreds();
    const iv = setInterval(fetchPreds, 60000);
    return () => clearInterval(iv);
  }, []);

  /* history on bin select */
  useEffect(() => {
    if (!selectedBin) { setBinHistory(null); return; }
    const load = async () => {
      setHistoryLoading(true);
      try { setBinHistory((await fetchBinHistory(selectedBin.bin_id))?.history || []); }
      catch { setBinHistory([]); }
      finally { setHistoryLoading(false); }
    };
    load();
  }, [selectedBin]);

  /* actions */
  const handleSeed = async () => {
    setSeeding(true);
    try { setBins(await seedBins()); }
    catch (e) { console.error(e); }
    finally { setSeeding(false); }
  };

  const handleRandomize = async () => {
    setRandomizing(true);
    try {
      await randomizeBins();
      setBins(await fetchBins());
      setOptimalRoute(await fetchOptimalRoute(routingMode));
      setSelectedVan('ALL');
    } catch (e) { console.error(e); }
    finally { setRandomizing(false); }
  };

  const handleOptimizeRoute = async () => {
    setRouteLoading(true);
    try { 
      setOptimalRoute(await fetchOptimalRoute(routingMode));
      setSelectedVan('ALL'); 
    }
    catch (e) { console.error(e); }
    finally { setRouteLoading(false); }
  };

  const handlePredict = async () => {
    setPredicting(true);
    try {
      const pBins = await fetchPredictedBins(1);
      const predMap = {};
      pBins.forEach(p => { predMap[p.bin_id] = p.hours_until_full; });
      setPredictions(predMap);
    } catch (e) { console.error(e); }
    finally { setPredicting(false); }
  };

  const handleConfigSaved = async () => {
    try { 
      setOptimalRoute(await fetchOptimalRoute(routingMode));
      setSelectedVan('ALL'); 
    }
    catch (e) { console.error(e); }
  };

  /* shared header */
  const PageHeader = ({ title, sub }) => (
    <div className="mb-5">
      <div className="flex items-center gap-1.5 mb-1">
        <Leaf className="w-3 h-3" style={{ color: '#16a34a' }} />
        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#16a34a' }}>OmniBin · Live</span>
      </div>
      <h1 className="text-xl font-black" style={{ color: '#0d4a2f' }}>{title}</h1>
      <p className="text-xs mt-0.5" style={{ color: 'rgba(13,74,47,0.50)' }}>{sub}</p>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen relative">
      <div className="nature-bg" />
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isConnected={isConnected} />

      <main className="flex-1 p-5 lg:p-6 pb-24 md:pb-6 overflow-y-auto relative z-10">

        {/* ── DASHBOARD ────────────────────────────────────────── */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4 animate-fade-in">
            {/* Top bar */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <PageHeader
                title="Operations Dashboard"
                sub="Real-time smart bin telemetry · AI-driven fleet dispatch · Bhopal Municipal Corp."
              />
              <div className="flex items-center gap-2 flex-wrap">
                {/* Predictor */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl glass-card text-xs">
                  <span className="font-bold" style={{ color: 'rgba(13,74,47,0.7)' }}>Predictions:</span>
                  <button 
                    onClick={handlePredict}
                    disabled={predicting}
                    className="ml-2 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider font-bold transition-all disabled:opacity-50 hover:scale-105"
                    style={{ background: '#0d9488', color: 'white' }}
                  >
                    {predicting ? 'Calculating...' : 'Predict Fill Times'}
                  </button>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl glass-card text-xs">
                  <Filter className="w-3 h-3" style={{ color: 'rgba(13,74,47,0.45)' }} />
                  <select
                    id="van-filter"
                    value={selectedVan}
                    onChange={e => setSelectedVan(e.target.value)}
                    className="bg-transparent font-bold outline-none cursor-pointer"
                    style={{ color: '#0d4a2f' }}
                  >
                    <option value="ALL">All Vans</option>
                    {optimalRoute?.fleet_routes?.map(r => (
                      <option key={r.van_id} value={r.van_id.toString()}>Van {r.van_id}</option>
                    ))}
                  </select>
                </div>
                <button
                  id="fleet-config-btn"
                  onClick={() => setIsConfigModalOpen(true)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center glass-card hover:scale-105 transition-all"
                  title="Fleet Config">
                  <Settings className="w-4 h-4" style={{ color: '#0d9488' }} />
                </button>
              </div>
            </div>

            {/* 10-stat overview */}
            <OverviewCards bins={bins} optimalRoute={optimalRoute} config={config} operators={operators} />

            {/* Quick actions */}
            <QuickActions
              onSeed={handleSeed} seeding={seeding}
              onRandomize={handleRandomize} randomizing={randomizing}
              onConfig={() => setIsConfigModalOpen(true)}
              onOptimizeRoute={handleOptimizeRoute} routeLoading={routeLoading}
              setOptimalRoute={setOptimalRoute}
              bins={bins}
            />

            {/* Map + Alerts row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <MapView bins={bins} optimalRoute={optimalRoute} setSelectedBin={setSelectedBin} selectedVan={selectedVan} operators={operators} routingMode={routingMode} predictions={predictions} />
              </div>
              <div className="flex flex-col gap-4">
                <AlertsPanel bins={bins} />
              </div>
            </div>

            {/* Route + Fuel row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <RoutePanel optimalRoute={optimalRoute} setOptimalRoute={setOptimalRoute} bins={bins} routingMode={routingMode} setRoutingMode={setRoutingMode} />
              <FuelAnalytics optimalRoute={optimalRoute} config={config} />
            </div>

            {/* Bin monitoring table */}
            <div className="glass-panel rounded-2xl p-4 text-left">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-black uppercase tracking-widest"
                   style={{ color: 'rgba(13,74,47,0.50)' }}>Smart Bin Monitoring</p>
                <span className="text-[10px] font-semibold" style={{ color: '#16a34a' }}>
                  {bins.length} nodes live
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(13,74,47,0.10)' }}>
                      {['Location','ID','Fill Level','Capacity','Priority','Confidence','Hours to Full','Status'].map(h => (
                        <th key={h} className="text-left py-2 px-2 font-bold uppercase tracking-wider"
                            style={{ color: 'rgba(13,74,47,0.40)', fontSize: 9 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bins.map(b => (
                      <tr
                        key={b.bin_id}
                        onClick={() => setSelectedBin(b)}
                        className="cursor-pointer transition-all rounded-xl"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.35)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.40)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td className="py-2.5 px-2 font-semibold" style={{ color: '#0d4a2f' }}>{b.location}</td>
                        <td className="py-2.5 px-2 font-mono text-[10px]" style={{ color: 'rgba(13,74,47,0.50)' }}>{b.bin_id}</td>
                        <td className="py-2.5 px-2">
                          <div className="flex items-center gap-2">
                            <FillBar pct={b.fill_percentage || 0} />
                            <span className="font-bold w-8 text-right" style={{ color: '#0d4a2f' }}>{b.fill_percentage}%</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-2" style={{ color: 'rgba(13,74,47,0.55)' }}>{b.capacity}L</td>
                        <td className="py-2.5 px-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                                style={{ background: b.priority === 1 ? 'rgba(22,163,74,0.12)' : b.priority === 2 ? 'rgba(217,119,6,0.12)' : 'rgba(220,38,38,0.12)',
                                         color: b.priority === 1 ? '#16a34a' : b.priority === 2 ? '#d97706' : '#dc2626' }}>
                            P{b.priority}
                          </span>
                        </td>
                        <td className="py-2.5 px-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                                style={{ background: (b.confidence_percent ?? 100) > 80 ? 'rgba(22,163,74,0.12)' : (b.confidence_percent ?? 100) > 50 ? 'rgba(217,119,6,0.12)' : 'rgba(220,38,38,0.12)',
                                         color: (b.confidence_percent ?? 100) > 80 ? '#16a34a' : (b.confidence_percent ?? 100) > 50 ? '#d97706' : '#dc2626' }}>
                            {(b.confidence_percent ?? 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-2.5 px-2 font-bold" style={{ color: '#0d9488' }}>
                          {predictions[b.bin_id] !== undefined ? (predictions[b.bin_id] === -1 ? '>168h' : `${predictions[b.bin_id]}h`) : '...'}
                        </td>
                        <td className="py-2.5 px-2"><span className={statusChip(b.status)}>{b.status}</span></td>
                      </tr>
                    ))}
                    {bins.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-xs italic" style={{ color: 'rgba(13,74,47,0.35)' }}>
                          No bins loaded — use Quick Actions → Seed Fleet to populate.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── MAP tab ──────────────────────────────────────────── */}
        {activeTab === 'map' && (
          <div className="space-y-4 animate-fade-in">
            <PageHeader title="Live Telemetry Map" sub="Click markers for sensor details · Active routes shown in real-time" />
            <MapView bins={bins} optimalRoute={optimalRoute} setSelectedBin={setSelectedBin} selectedVan={selectedVan} operators={operators} routingMode={routingMode} predictions={predictions} />
          </div>
        )}

        {/* ── ROUTES tab ───────────────────────────────────────── */}
        {activeTab === 'routes' && (
          <div className="space-y-4 animate-fade-in">
            <PageHeader title="Route Optimizer" sub="CVRP + OR-Tools · OSRM road-snapped geometry · Multi-van dispatch" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <RoutePanel optimalRoute={optimalRoute} setOptimalRoute={setOptimalRoute} bins={bins} routingMode={routingMode} setRoutingMode={setRoutingMode} />
              <FuelAnalytics optimalRoute={optimalRoute} config={config} />
            </div>
            <MapView bins={bins} optimalRoute={optimalRoute} setSelectedBin={setSelectedBin} selectedVan={selectedVan} operators={operators} routingMode={routingMode} predictions={predictions} />
          </div>
        )}

        {/* ── HISTORY tab ─────────────────────────────────────── */}
        {activeTab === 'history' && (
          <div className="space-y-4 animate-fade-in">
            <PageHeader title="Audit Logs" sub="Historical telemetry records — click any bin to view timeline" />
            <div className="glass-panel rounded-2xl p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {bins.map(b => (
                  <div key={b.bin_id} onClick={() => setSelectedBin(b)}
                       className="glass-card p-3.5 rounded-xl cursor-pointer flex items-center justify-between gap-3 hover:scale-[1.01] transition-all">
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate" style={{ color: '#0d4a2f' }}>{b.location}</p>
                      <p className="text-[10px] font-mono" style={{ color: 'rgba(13,74,47,0.45)' }}>{b.bin_id}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={statusChip(b.status)}>{b.status}</span>
                      <ChevronRight className="w-3.5 h-3.5" style={{ color: '#0d9488' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── COMPLAINTS tab ──────────────────────────────────── */}
        {activeTab === 'complaints' && (
          <ComplaintsPanel />
        )}

        {/* ── SCANNER tab ─────────────────────────────────────── */}
        {activeTab === 'scanner' && (
          <BottleScanner />
        )}
      </main>

      {/* ── Bin Detail Modal ─────────────────────────────────── */}
      {selectedBin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
             style={{ background: 'rgba(13,74,47,0.30)', backdropFilter: 'blur(10px)' }}>
          <div className="glass-panel w-full max-w-lg rounded-3xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-in"
               style={{ boxShadow: '0 24px 80px rgba(13,74,47,0.20)' }}>

            {/* header */}
            <div className="px-5 py-4 flex items-center justify-between shrink-0"
                 style={{ borderBottom: '1px solid rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.20)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                     style={{ background: 'rgba(22,163,74,0.12)', border: '1px solid rgba(22,163,74,0.25)' }}>
                  <Recycle className="w-4 h-4" style={{ color: '#16a34a' }} />
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#0d9488' }}>IoT Sensor Logbook</span>
                  <h3 className="font-bold text-sm" style={{ color: '#0d4a2f' }}>{selectedBin.location}</h3>
                </div>
              </div>
              <button onClick={() => setSelectedBin(null)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/50 transition-colors"
                      style={{ color: 'rgba(13,74,47,0.50)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {/* key stats */}
              <div className="grid grid-cols-5 gap-2 p-3 rounded-xl text-center"
                   style={{ background: 'rgba(255,255,255,0.50)', border: '1px solid rgba(255,255,255,0.65)' }}>
                {[
                  { label: 'Fill',     value: `${selectedBin.fill_percentage}%`, color: selectedBin.fill_percentage > 80 ? '#dc2626' : '#0d4a2f' },
                  { label: 'Capacity', value: `${selectedBin.capacity}L`,        color: '#0d9488' },
                  { label: 'Priority', value: `P${selectedBin.priority}`,        color: '#d97706' },
                  { label: 'Conf.',    value: `${(selectedBin.confidence_percent ?? 100).toFixed(0)}%`, color: (selectedBin.confidence_percent ?? 100) > 80 ? '#16a34a' : (selectedBin.confidence_percent ?? 100) > 50 ? '#d97706' : '#dc2626' },
                  { label: 'Status',   value: selectedBin.status,                color: selectedBin.status === 'Critical' ? '#dc2626' : '#16a34a' },
                ].map(m => (
                  <div key={m.label}>
                    <span className="text-[9px] block mb-1" style={{ color: 'rgba(13,74,47,0.40)' }}>{m.label}</span>
                    <span className="font-black text-sm" style={{ color: m.color }}>{m.value}</span>
                  </div>
                ))}
              </div>

              {/* fill bar */}
              <FillBar pct={selectedBin.fill_percentage} />

              {/* history timeline */}
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-1.5"
                    style={{ color: 'rgba(13,74,47,0.50)' }}>
                  <Activity className="w-3 h-3" style={{ color: '#0d9488' }} /> History Timeline
                </h4>
                {historyLoading ? (
                  <div className="py-6 flex items-center justify-center gap-2"
                       style={{ color: 'rgba(13,74,47,0.40)' }}>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-xs">Loading records...</span>
                  </div>
                ) : binHistory?.length > 0 ? (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {binHistory.map((item, i) => {
                      const d = new Date(item.timestamp);
                      const time = isNaN(d.getTime()) ? item.timestamp : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                      const date = isNaN(d.getTime()) ? '' : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
                      return (
                        <div key={i} className="p-2.5 rounded-xl flex items-center justify-between"
                             style={{ background: 'rgba(255,255,255,0.48)', border: '1px solid rgba(255,255,255,0.65)' }}>
                          <div>
                            <span className="font-mono text-[10px] block" style={{ color: '#0d4a2f' }}>{time}</span>
                            <span className="text-[9px]" style={{ color: 'rgba(13,74,47,0.45)' }}>{date}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {item.confidence_percent !== undefined && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md" 
                                    style={{ background: item.confidence_percent > 80 ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)', color: item.confidence_percent > 80 ? '#16a34a' : '#dc2626' }}>
                                C:{item.confidence_percent.toFixed(0)}%
                              </span>
                            )}
                            <FillBar pct={item.fill_percentage} />
                            <span className="font-bold text-xs w-8 text-right" style={{ color: '#0d4a2f' }}>
                              {item.fill_percentage}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs italic py-4 text-center" style={{ color: 'rgba(13,74,47,0.35)' }}>
                    No archive records for this sensor token.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <AIChatWidget />
      <FleetConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        config={config}
        setConfig={setConfig}
        onSaveSuccess={handleConfigSaved}
      />
    </div>
  );
}

export default AdminDashboard;
