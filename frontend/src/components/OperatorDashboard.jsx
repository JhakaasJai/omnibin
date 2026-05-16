import React, { useState, useEffect } from 'react';
import { LogOut, Radio, MapPin, Truck, RefreshCw, AlertCircle, Camera, CheckCircle } from 'lucide-react';
import { fetchBins, fetchOptimalRoute, fetchConfig, setOperatorLive, setOperatorOffline, updateOperatorLocation, updateComplaintStatus, fetchAllOperators, acknowledgeEmergency } from '../services/api';
import MapView from './MapView';

const haversineDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const OperatorDashboard = ({ operatorId, setRole, setOperatorId }) => {
  const [bins, setBins] = useState([]);
  const [optimalRoute, setOptimalRoute] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedBin, setSelectedBin] = useState(null);
  const [config, setConfig] = useState(null);
  const [hasEmergency, setHasEmergency] = useState(false);
  const watchIdRef = React.useRef(null);
  const isLiveRef = React.useRef(false);

  useEffect(() => {
    isLiveRef.current = isLive;
  }, [isLive]);

  const fetchDashboardData = async () => {
    try {
      setBins(await fetchBins());
      setConfig(await fetchConfig());
      if (isLiveRef.current) {
        const routeData = await fetchOptimalRoute('dynamic');
        setOptimalRoute(routeData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Separate dedicated polling for emergency dispatch flag - always runs
  useEffect(() => {
    if (!operatorId) return;
    const checkEmergency = async () => {
      try {
        const ops = await fetchAllOperators();
        const me = ops.find(o => o.operator_id === operatorId);
        if (me && me.emergency_dispatch) {
          setHasEmergency(true);
        }
      } catch (err) {
        console.error('Emergency check failed:', err);
      }
    };
    checkEmergency(); // run immediately on mount
    const iv = setInterval(checkEmergency, 5000); // poll every 5s
    return () => clearInterval(iv);
  }, [operatorId]);

  useEffect(() => {
    fetchDashboardData();
    const iv = setInterval(fetchDashboardData, 10000); // refresh every 10s
    return () => clearInterval(iv);
  }, [isLive]);

  const handleLogout = async () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (isLive && operatorId) {
      try {
        await setOperatorOffline(operatorId);
      } catch (e) {
        console.error(e);
      }
    }
    setRole(null);
    setOperatorId(null);
  };

  const handleGoLive = async (useMock = false) => {
    if (isLive) {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setLoading(true);
      try {
        await setOperatorOffline(operatorId);
        setIsLive(false);
        setLocation(null);
        setOptimalRoute(null);
      } catch (e) {
        setError('Failed to go offline.');
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    setError('');

    const setLocationAndLive = async (lat, lon, heading = null) => {
      try {
        if (!isLiveRef.current) {
          await setOperatorLive(operatorId, lat, lon, heading);
          setIsLive(true);
          setLocation({ lat, lon });
          fetchDashboardData();
        } else {
          await updateOperatorLocation(operatorId, lat, lon, heading);
          setLocation({ lat, lon });
        }
      } catch (e) {
        setError('Failed to go live or update location.');
      } finally {
        setLoading(false);
      }
    };

    if (useMock) {
      // Mock locations somewhere in Bhopal with random headings
      const mockLats = [23.235, 23.250, 23.220];
      const mockLons = [77.450, 77.410, 77.470];
      const idx = Math.floor(Math.random() * mockLats.length);
      const mockHeading = Math.floor(Math.random() * 360);
      setLocationAndLive(mockLats[idx], mockLons[idx], mockHeading);
    } else {
      if (navigator.geolocation) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => setLocationAndLive(pos.coords.latitude, pos.coords.longitude, pos.coords.heading),
          (err) => {
            setError('Geolocation tracking failed. Please allow access.');
            setLoading(false);
          },
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
        );
      } else {
        setError('Geolocation is not supported by your browser.');
        setLoading(false);
      }
    }
  };

  const handleResolveComplaint = async (complaintId) => {
    try {
      await updateComplaintStatus(complaintId, 'Resolved');
      fetchDashboardData();
    } catch (e) {
      setError('Failed to resolve complaint. Check network.');
    }
  };

  // Find the specific route for this operator
  const myRoute = optimalRoute?.fleet_routes?.find(r => r.operator_id === operatorId);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-4 lg:p-6 flex flex-col relative">
      {hasEmergency && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" style={{ background: 'rgba(220,38,38,0.4)', backdropFilter: 'blur(8px)' }}>
          <div className="bg-red-900 border-2 border-red-500 rounded-3xl p-8 max-w-lg w-full text-center shadow-[0_0_50px_rgba(220,38,38,0.6)] animate-pulse">
            <AlertCircle className="w-20 h-20 text-white mx-auto mb-4 animate-bounce" />
            <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-wider">Emergency Dispatch</h2>
            <p className="text-red-200 font-bold mb-8 text-lg">A critical collection route has been recalculated and prioritized. Proceed immediately.</p>
            <button
              onClick={async () => {
                try {
                  await acknowledgeEmergency(operatorId);
                  setHasEmergency(false);
                } catch (e) {
                  setError('Failed to acknowledge emergency.');
                }
              }}
              className="bg-white text-red-900 font-black px-8 py-4 rounded-xl hover:scale-105 transition-all text-lg w-full shadow-xl"
            >
              Acknowledge & Proceed
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 glass-panel p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-900/40 border border-teal-500/30 flex items-center justify-center">
            <Truck className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white">Operator Dashboard</h1>
            <p className="text-xs text-slate-400">ID: {operatorId}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={() => handleGoLive(true)} disabled={loading}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700">
            Mock Location
          </button>
          
          <button 
            onClick={() => handleGoLive(false)}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg ${
              isLive 
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/30' 
                : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30'
            }`}
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Radio className={`w-4 h-4 ${isLive ? 'animate-pulse' : ''}`} />}
            {isLive ? 'Go Offline' : 'Go Live'}
          </button>
          
          <button onClick={handleLogout} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-5 rounded-2xl">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Status & Assignment</h2>
            
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-slate-600'}`}></div>
              <span className="font-bold text-sm text-white">{isLive ? 'Active & Routing' : 'Offline'}</span>
            </div>

            {isLive && myRoute ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                    <p className="text-[10px] text-slate-400 uppercase">Distance</p>
                    <p className="text-lg font-black text-teal-400">{myRoute.distance_km} km</p>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                    <p className="text-[10px] text-slate-400 uppercase">Total Load</p>
                    <p className="text-lg font-black text-amber-400">{myRoute.total_volume} L</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Your Route Details</h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {myRoute.details.map(step => {
                      const isNear = location && step.latitude && step.longitude && haversineDistance(location.lat, location.lon, step.latitude, step.longitude) <= 0.1;

                      return (
                        <div key={step.bin_id} className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-lg bg-teal-900/50 text-teal-400 text-xs font-bold flex items-center justify-center shrink-0">
                                {step.step_order}
                              </span>
                              <div>
                                <p className="text-xs font-semibold text-white truncate max-w-[200px]">{step.location || step.bin_id}</p>
                                {step.is_complaint && (
                                  <span className="mt-1 flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-400 border border-purple-500/30 w-fit">
                                    <Camera className="w-3 h-3" /> Photo Complaint (Vol: {step.capacity || 0}L)
                                  </span>
                                )}
                              </div>
                            </div>
                            {!step.is_complaint && <span className="text-xs font-black text-emerald-400">{step.fill_percentage}%</span>}
                          </div>
                          
                          {step.is_complaint && isNear && (
                            <div className="flex justify-end mt-1 border-t border-slate-700/50 pt-2">
                              <button
                                onClick={() => handleResolveComplaint(step.bin_id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                Mark as Resolved
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : isLive ? (
              <div className="text-center py-8">
                <p className="text-sm text-slate-400 italic">No bins assigned currently.</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <MapPin className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Go live to receive route assignments.</p>
              </div>
            )}
          </div>
        </div>

        {/* Map Area */}
        <div className="lg:col-span-2">
          {/* We pass a custom optimalRoute object that only contains this operator's route so the map focuses on them */}
          <MapView 
            bins={bins} 
            optimalRoute={isLive && myRoute ? { fleet_routes: [myRoute] } : { fleet_routes: [] }} 
            setSelectedBin={setSelectedBin}
            selectedVan={myRoute ? myRoute.van_id.toString() : 'ALL'} 
            config={config}
          />
        </div>
      </div>
    </div>
  );
};

export default OperatorDashboard;
