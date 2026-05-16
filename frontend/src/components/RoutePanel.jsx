import React, { useState } from 'react';
import { Route, Sparkles, RefreshCw, AlertCircle, CheckCircle, Truck, Fuel, DollarSign, MapPin, Camera } from 'lucide-react';
import { fetchOptimalRoute } from '../services/api';

const RoutePanel = ({ optimalRoute, setOptimalRoute, bins = [], routingMode, setRoutingMode }) => {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const handleGenerateRoute = async () => {
    setLoading(true); setError(null);
    try {
      const data = await fetchOptimalRoute(routingMode);
      setOptimalRoute(data);
    } catch {
      setError('Failed to compute VRP route. Ensure the backend service is running.');
    } finally { setLoading(false); }
  };

  const statItems = optimalRoute?.fleet_totals ? [
    { icon: Truck,      label: 'Active Vans',     value: optimalRoute.fleet_totals.total_vans,       color: '#0d9488' },
    { icon: Route,      label: 'Total Distance',  value: `${optimalRoute.fleet_totals.total_distance} km`, color: '#166534' },
    { icon: Fuel,       label: 'Total Fuel',      value: `${optimalRoute.fleet_totals.total_fuel} L`,      color: '#dc2626' },
    { icon: DollarSign, label: 'Est. Cost',        value: `₹${optimalRoute.fleet_totals.total_cost}`,      color: '#16a34a' },
  ] : [];

  return (
    <div className="glass-panel rounded-2xl p-5 text-left flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: '#0d4a2f' }}>
            <Route className="w-4 h-4" style={{ color: '#16a34a' }} />
            AI Fleet Dispatch Optimizer
          </h2>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(13,74,47,0.50)' }}>
            Multi-Vehicle Routing Problem & K-Means Clustering
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {setRoutingMode && (
            <div className="flex bg-slate-200/50 p-1 rounded-xl">
              <button 
                onClick={() => setRoutingMode('static')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${routingMode === 'static' ? 'bg-white shadow-sm text-teal-700' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Static (Depot)
              </button>
              <button 
                onClick={() => setRoutingMode('dynamic')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${routingMode === 'dynamic' ? 'bg-white shadow-sm text-teal-700' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Dynamic (Live)
              </button>
            </div>
          )}
          
          <button
            id="generate-routes-btn"
            onClick={handleGenerateRoute}
            disabled={loading}
            className="btn-primary shrink-0 rounded-xl py-2.5 px-4 text-xs"
          >
            {loading
              ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Computing...</>
              : <><Sparkles className="w-3.5 h-3.5" /> Generate Routes</>}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-xl flex items-center gap-2.5"
             style={{ background: 'rgba(254,226,226,0.60)', border: '1px solid rgba(239,68,68,0.22)' }}>
          <AlertCircle className="w-4 h-4 shrink-0" style={{ color: '#dc2626' }} />
          <span className="text-xs font-medium" style={{ color: '#991b1b' }}>{error}</span>
        </div>
      )}

      {/* Route results */}
      {optimalRoute?.fleet_totals && (
        <div className="space-y-4 animate-fade-in flex-1 flex flex-col min-h-0">
          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-xl"
               style={{ background: 'rgba(255,255,255,0.50)', border: '1px solid rgba(255,255,255,0.65)' }}>
            {statItems.map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <Icon className="w-3 h-3" style={{ color: 'rgba(13,74,47,0.45)' }} />
                    <span className="text-[9px] font-bold uppercase tracking-wider"
                          style={{ color: 'rgba(13,74,47,0.45)' }}>{s.label}</span>
                  </div>
                  <span className="font-black text-sm" style={{ color: s.color }}>{s.value}</span>
                </div>
              );
            })}
            {optimalRoute.message && (
              <div className="col-span-2 sm:col-span-4 pt-2 text-center"
                   style={{ borderTop: '1px solid rgba(13,74,47,0.08)' }}>
                <span className="text-[11px] font-semibold" style={{ color: '#16a34a' }}>
                  ✓ {optimalRoute.message || 'VRP Tour Solved'}
                </span>
              </div>
            )}
          </div>

          {/* Van manifest */}
          <div className="flex-1 flex flex-col min-h-0">
            <h3 className="text-[10px] font-black uppercase tracking-widest mb-3 shrink-0"
                style={{ color: 'rgba(13,74,47,0.45)' }}>Fleet Dispatch Manifest</h3>

            {(!optimalRoute.fleet_routes || optimalRoute.fleet_routes.length === 0) ? (
              <div className="p-4 rounded-xl text-center"
                   style={{ background: 'rgba(22,163,74,0.07)', border: '1px solid rgba(22,163,74,0.18)' }}>
                <CheckCircle className="w-5 h-5 mx-auto mb-1.5" style={{ color: '#16a34a' }} />
                <p className="text-xs" style={{ color: 'rgba(13,74,47,0.55)' }}>
                  No bins need collection. Fleet is fully balanced.
                </p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto pr-1 flex-1 min-h-0">
                {optimalRoute.fleet_routes.map(van => (
                  <div key={`van-${van.van_id}`} className="p-3 rounded-xl"
                       style={{ background: 'rgba(255,255,255,0.48)', border: '1px solid rgba(255,255,255,0.65)' }}>
                    {/* Van header */}
                    <div className="flex justify-between items-center mb-2.5 pb-2"
                         style={{ borderBottom: '1px solid rgba(13,74,47,0.08)' }}>
                      <span className="text-sm font-bold flex items-center gap-2" style={{ color: '#0d4a2f' }}>
                        <span className="w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black"
                              style={{ background: 'rgba(13,148,136,0.14)', color: '#0d9488', border: '1px solid rgba(13,148,136,0.25)' }}>
                          {van.van_id}
                        </span>
                        Van Alpha-{van.van_id}
                      </span>
                      <span className="text-[10px]" style={{ color: 'rgba(13,74,47,0.50)' }}>
                        <span className="font-bold" style={{ color: '#16a34a' }}>{van.total_volume}L</span>
                        {' '}· {van.distance_km}km · ₹{van.cost_inr}
                      </span>
                    </div>

                    {/* Steps */}
                    <div className="space-y-1.5">
                      {van.details.map((step, idx) => (
                        <div key={`${step.bin_id}-${idx}`}
                             className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-lg flex items-center justify-center text-[9px] font-black shrink-0"
                                  style={{ background: 'rgba(22,163,74,0.10)', color: '#166534', border: '1px solid rgba(22,163,74,0.20)' }}>
                              {step.step_order}
                            </span>
                            <div>
                                <p className="text-xs font-semibold truncate" style={{ color: '#0d4a2f' }}>
                                  {step.location || step.bin_id}
                                </p>
                                {step.is_complaint && (
                                    <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md mt-0.5 w-fit" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#9333ea', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                                        <Camera className="w-3 h-3" /> Photo Complaint (Vol: {step.capacity || 0}L)
                                    </span>
                                )}
                            </div>
                          </div>
                          {!step.is_complaint && (
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                                    style={step.priority === 3
                                      ? { background:'rgba(220,38,38,0.12)', color:'#dc2626', border:'1px solid rgba(220,38,38,0.22)' }
                                      : step.priority === 2
                                      ? { background:'rgba(217,119,6,0.12)', color:'#d97706', border:'1px solid rgba(217,119,6,0.22)' }
                                      : { background:'rgba(22,163,74,0.10)', color:'#16a34a', border:'1px solid rgba(22,163,74,0.20)' }}>
                                P{step.priority}
                              </span>
                              <span className="text-xs font-bold w-8 text-right" style={{ color: '#0d4a2f' }}>
                                {step.fill_percentage}%
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!optimalRoute && !loading && !error && (
        <div className="py-8 text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 animate-float"
               style={{ background: 'rgba(22,163,74,0.10)', border: '1px solid rgba(22,163,74,0.22)' }}>
            <MapPin className="w-5 h-5" style={{ color: '#16a34a' }} />
          </div>
          <p className="text-sm font-bold mb-1" style={{ color: '#166534' }}>No routes computed yet</p>
          <p className="text-xs" style={{ color: 'rgba(13,74,47,0.45)' }}>Click Generate to run the VRP optimizer</p>
        </div>
      )}
    </div>
  );
};

export default RoutePanel;
