import React, { useEffect, useRef, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { fetchComplaints } from '../services/api';

// Animated vehicle marker component bypassing React state for 60fps smooth rendering
const AnimatedVehicle = ({ roadGeometry }) => {
  const markerRef = useRef(null);

  useEffect(() => {
    let animationFrameId;
    let startTime;
    const TIME_PER_POINT = 20; // ms per coordinate point. Adjust for speed.

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      
      let index = Math.floor(elapsed / TIME_PER_POINT);
      
      if (index >= roadGeometry.length) {
        // Loop back to start
        startTime = timestamp;
        index = 0;
      }

      if (markerRef.current) {
        markerRef.current.setLatLng(roadGeometry[index]);
        
        if (index < roadGeometry.length - 1) {
          const current = roadGeometry[index];
          const next = roadGeometry[index + 1];
          // Leaflet coords are [lat, lon], so dy is lat, dx is lon
          const dx = next[1] - current[1];
          const dy = next[0] - current[0];
          // Bearing from north
          const angle = Math.atan2(dx, dy) * (180 / Math.PI);
          
          const el = markerRef.current.getElement();
          if (el) {
            const arrow = el.querySelector('.direction-arrow');
            if (arrow) {
              arrow.style.transform = `rotate(${angle}deg)`;
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    if (roadGeometry && roadGeometry.length > 0) {
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [roadGeometry]);

  const getVehicleIcon = () => L.divIcon({
    className: 'custom-vehicle-icon',
    html: `<div class="relative w-3.5 h-3.5 bg-yellow-400 rounded-full shadow-[0_0_15px_rgba(250,204,21,0.9)] border-2 border-white flex items-center justify-center">
             <div class="direction-arrow" style="position:absolute; top:-5px; left:50%; width:0; height:0; margin-left:-3px; border-left:3px solid transparent; border-right:3px solid transparent; border-bottom:6px solid #eab308; transform-origin: 50% 12px; transition: transform 0.1s linear;"></div>
           </div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });

  if (!roadGeometry || roadGeometry.length === 0) return null;

  return (
    <Marker
      position={roadGeometry[0]}
      icon={getVehicleIcon()}
      zIndexOffset={1000}
      ref={markerRef}
    />
  );
};

// Dynamic auto-bounds updater adjusting viewports perfectly around valid generated itineraries
const BoundsUpdater = ({ optimalRoute, selectedVan }) => {
  const map = useMap();

  useEffect(() => {
    if (optimalRoute?.fleet_routes && optimalRoute.fleet_routes.length > 0) {
      const allCoords = [];
      optimalRoute.fleet_routes.forEach(r => {
        if (selectedVan === 'ALL' || r.van_id.toString() === selectedVan) {
          if (r.roadGeometry) allCoords.push(...r.roadGeometry);
        }
      });
      if (allCoords.length > 1) {
        map.fitBounds(allCoords, { padding: [40, 40], maxZoom: 15 });
        return;
      }
    }
    // Default bounds focusing cleanly over Bhopal municipal boundaries
    map.fitBounds([
      [23.2244, 77.4027],
      [23.2524, 77.5404]
    ], { padding: [50, 50], maxZoom: 14 });
  }, [map, optimalRoute]);

  return null;
};

// Permanent distinct icon styling for the Starting Municipal Building Depot
const getStartIcon = () => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="px-2.5 py-1 bg-blue-600 border-2 border-white rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/40">
             <span class="text-[10px] font-extrabold text-white whitespace-nowrap">Start: Nagar Nigam</span>
           </div>`,
    iconSize: [110, 26],
    iconAnchor: [55, 13],
  });
};

// Permanent distinct icon styling for the Ending Solid Waste Dump Site
const getEndIcon = () => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="px-2.5 py-1 bg-slate-950 border-2 border-white rounded-lg flex items-center justify-center shadow-lg shadow-slate-950/50">
             <span class="text-[10px] font-extrabold text-white whitespace-nowrap">End: Waste Facility</span>
           </div>`,
    iconSize: [110, 26],
    iconAnchor: [55, 13],
  });
};

// Generate dynamic custom colored HTML markers matching fill status thresholds
const getCustomIcon = (fillPercentage, isDimmed = false) => {
  let colorClass = 'bg-emerald-500 shadow-emerald-500/40';
  let pulseClass = 'bg-emerald-400';

  if (fillPercentage > 80) {
    colorClass = 'bg-rose-500 shadow-rose-500/50 animate-pulse';
    pulseClass = 'bg-rose-400';
  } else if (fillPercentage >= 50) {
    colorClass = 'bg-amber-500 shadow-amber-500/40';
    pulseClass = 'bg-amber-400';
  }

  if (isDimmed) {
    colorClass = 'bg-slate-700 shadow-none border-slate-600';
  }

  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="relative flex items-center justify-center">
             ${!isDimmed ? `<span class="absolute inline-flex h-5 w-5 rounded-full ${pulseClass} opacity-50 animate-ping"></span>` : ''}
             <div class="w-4 h-4 ${colorClass} ${!isDimmed ? 'border-[1.5px] border-white' : 'border'} rounded-full shadow-md flex items-center justify-center">
               <span class="sr-only">${fillPercentage}%</span>
             </div>
           </div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};

// Dynamic text complaint markers
const getTextComplaintIcon = (status, isDimmed = false) => {
  const isResolved = status === 'Resolved';
  let colorClass = isResolved ? 'bg-emerald-600 shadow-emerald-600/40' : 'bg-blue-500 shadow-blue-500/50';
  let pulseClass = isResolved ? '' : '<span class="absolute inline-flex h-5 w-5 rounded-full bg-blue-400 opacity-50 animate-ping"></span>';
  
  if (isDimmed) {
    colorClass = 'bg-slate-700 shadow-none border-slate-600';
    pulseClass = '';
  }

  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="relative flex items-center justify-center">
             ${pulseClass}
             <div class="w-5 h-5 ${colorClass} ${!isDimmed ? 'border-[1.5px] border-white' : 'border'} rounded-full shadow-md flex items-center justify-center">
               <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="${isDimmed ? '#94a3b8' : 'white'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
             </div>
           </div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

// Dynamic photo complaint markers
const getPhotoComplaintIcon = (status, isDimmed = false) => {
  const isResolved = status === 'Resolved';
  let colorClass = isResolved ? 'bg-emerald-600 shadow-emerald-600/40' : 'bg-purple-500 shadow-purple-500/50';
  let pulseClass = isResolved ? '' : '<span class="absolute inline-flex h-5 w-5 rounded-full bg-purple-400 opacity-50 animate-ping"></span>';
  
  if (isDimmed) {
    colorClass = 'bg-slate-700 shadow-none border-slate-600';
    pulseClass = '';
  }

  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="relative flex items-center justify-center">
             ${pulseClass}
             <div class="w-5 h-5 ${colorClass} ${!isDimmed ? 'border-[1.5px] border-white' : 'border'} rounded-full shadow-md flex items-center justify-center">
               <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="${isDimmed ? '#94a3b8' : 'white'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle></svg>
             </div>
           </div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

const MapView = ({ bins, optimalRoute, setSelectedBin, selectedVan = 'ALL', operators = [], routingMode = 'static', setRoutingMode, predictions = {}, config, onToggleLayer }) => {
  // Center map focused around localized Bhopal coordinates initially
  const centerPosition = [23.2360, 77.4700];

  // Array of distinct, high-contrast hex colors for different vans
  const vanColors = [
    '#3b82f6', // Blue (Van 1)
    '#f97316', // Orange (Van 2)
    '#a855f7', // Purple (Van 3)
    '#ec4899', // Pink (Van 4)
    '#10b981', // Emerald (Van 5)
    '#eab308'  // Yellow (Van 6)
  ];

  const [complaints, setComplaints] = useState([]);
  const showBins = config?.show_bin_nodes ?? true;
  const showTextComplaints = config?.show_text_complaints ?? true;
  const showPhotoComplaints = config?.show_photo_complaints ?? true;

  useEffect(() => {
    const loadComplaints = async () => {
      try {
        const data = await fetchComplaints();
        setComplaints(data);
      } catch (e) {
        console.error(e);
      }
    };
    loadComplaints();
    const iv = setInterval(loadComplaints, 15000);
    return () => clearInterval(iv);
  }, []);

  const getVanColor = (vanId) => {
    // Fallback to blue if vanId exceeds our array (vanId starts at 1)
    return vanColors[(vanId - 1) % vanColors.length] || vanColors[0];
  };

  // Build segments for distinct polyline for ALL vans
  const allRouteSegments = useMemo(() => {
    let allSegments = [];
    if (!optimalRoute?.fleet_routes) return allSegments;

    optimalRoute.fleet_routes.forEach((fleetRoute) => {
      if (selectedVan !== 'ALL' && fleetRoute.van_id.toString() !== selectedVan) return;

      if (fleetRoute.roadGeometry && fleetRoute.roadGeometry.length > 1) {
        allSegments.push({
          positions: fleetRoute.roadGeometry,
          color: getVanColor(fleetRoute.van_id),
          vanId: fleetRoute.van_id
        });
      }
    });
    return allSegments;
  }, [optimalRoute?.fleet_routes, selectedVan]);

  // Straight line segments fallback logic mapping active nodes
  const polylinePositions = useMemo(() => {
    if (!optimalRoute?.fleet_routes) return [];

    let allLines = [];
    optimalRoute.fleet_routes.forEach((fleetRoute) => {
      if (selectedVan !== 'ALL' && fleetRoute.van_id.toString() !== selectedVan) return;

      const positions = fleetRoute.route.map((id) => {
        if (id === 'depot') return [23.2244, 77.4027];
        if (id === 'dump_east') return [23.2524, 77.5404];
        if (id === 'dump_north') return [23.2800, 77.4000];

        let target = bins.find((b) => b.bin_id === id);
        if (!target) {
            target = complaints.find(c => c.complaint_id === id);
        }
        
        if (target && target.latitude && target.longitude) {
          return [target.latitude, target.longitude];
        }
        return null;
      }).filter(Boolean);

      if (positions.length > 1) {
        allLines.push(positions);
      }
    });
    return allLines;
  }, [optimalRoute?.fleet_routes, bins, selectedVan]);

  // Determine active bins Set for Focus + Context highlighting
  const activeBinIds = useMemo(() => {
    if (selectedVan === 'ALL' || !optimalRoute?.fleet_routes) {
      return null; // null represents all active
    }
    const targetRoute = optimalRoute.fleet_routes.find(r => r.van_id.toString() === selectedVan);
    if (!targetRoute?.route) return new Set();
    return new Set(targetRoute.route);
  }, [optimalRoute?.fleet_routes, selectedVan]);

  return (
    <div className="w-full h-[520px] rounded-2xl overflow-hidden glass-panel border border-slate-800 relative z-10 shadow-2xl">
      <MapContainer
        center={centerPosition}
        zoom={13}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', background: '#0b0f19' }}
      >
        <BoundsUpdater optimalRoute={optimalRoute} selectedVan={selectedVan} />

        {/* Dark mode tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Permanent Starting Depot Marker: Bhopal Nagar Nigam Building */}
        <Marker position={[23.2244, 77.4027]} icon={getStartIcon()}>
          <Tooltip direction="top" offset={[0, -10]} className="rounded-xl bg-slate-900 text-slate-200 border-none">
            <div className="p-1 text-slate-200 font-sans text-left">
              <p className="font-bold text-xs text-white">Bhopal Nagar Nigam Building</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Municipal Corporation Headquarters &amp; Starting Dispatch Depot</p>
            </div>
          </Tooltip>
        </Marker>

        {/* Dynamic Ending Dump Site Markers Extracted from Final Route Coordinates */}
        {optimalRoute?.fleet_routes && optimalRoute.fleet_routes.map((route, idx) => {
          if (selectedVan !== 'ALL' && route.van_id.toString() !== selectedVan) return null;
          if (!route.roadGeometry || route.roadGeometry.length === 0) return null;
          const finalCoord = route.roadGeometry[route.roadGeometry.length - 1];
          return (
            <Marker key={`end-marker-${route.van_id}-${idx}`} position={finalCoord} icon={getEndIcon()}>
              <Tooltip direction="top" offset={[0, -10]} className="rounded-xl bg-slate-900 text-slate-200 border-none">
                <div className="p-1 text-slate-200 font-sans text-left">
                  <p className="font-bold text-xs text-white flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: getVanColor(route.van_id) }}></span>
                    End: Waste Facility
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Terminal dumping grounds for Van {route.van_id}</p>
                </div>
              </Tooltip>
            </Marker>
          );
        })}

        {/* Real-time Dynamic IoT Dustbin Node Markers */}
        {showBins && bins.map((bin) => {
          const lat = bin.latitude;
          const lng = bin.longitude;
          if (!lat || !lng) return null;

          const isDimmed = activeBinIds !== null && !activeBinIds.has(bin.bin_id);

          return (
            <Marker
              key={bin.bin_id}
              position={[lat, lng]}
              icon={getCustomIcon(bin.fill_percentage || 0, isDimmed)}
              eventHandlers={{
                click: () => setSelectedBin(bin),
              }}
            >
              <Tooltip direction="top" offset={[0, -5]} className="rounded-2xl shadow-xl border-0 overflow-hidden custom-popup bg-slate-900">
                <div className="p-1 text-slate-200 font-sans text-left min-w-[150px]">
                  <p className="font-bold text-xs border-b border-slate-700 pb-1 mb-1.5 flex items-center justify-between gap-2">
                    <span className="truncate text-white">{bin.location}</span>
                    <span className="text-[8px] uppercase px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-mono shrink-0">
                      {bin.bin_id}
                    </span>
                  </p>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Current Load:</span>
                      <span className="font-bold text-white">{bin.fill_percentage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Max Capacity:</span>
                      <span className="font-medium text-slate-300">{bin.capacity}L</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Hours to Full:</span>
                      <span className="font-bold text-teal-400">
                        {predictions[bin.bin_id] !== undefined ? (predictions[bin.bin_id] === -1 ? '>168h' : `${predictions[bin.bin_id]}h`) : '...'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Priority Tier:</span>
                      <span className="font-medium text-slate-300">Level {bin.priority}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1.5 mt-1.5 border-t border-slate-700">
                      <span className="text-slate-400">Sensor State:</span>
                      <span className={`font-bold text-[10px] ${bin.status === 'Critical' ? 'text-rose-500 animate-pulse' : bin.status === 'Needs Collection' ? 'text-amber-500' : 'text-emerald-500'
                        }`}>
                        {bin.status}
                      </span>
                    </div>
                  </div>
                </div>
              </Tooltip>
            </Marker>
          );
        })}

        {/* Text Complaint Markers */}
        {showTextComplaints && complaints.filter(c => !c.photo_base64 && c.latitude && c.longitude && c.status !== 'Resolved').map((c) => {
          const isDimmed = activeBinIds !== null && !activeBinIds.has(c.complaint_id);
          return (
            <Marker
              key={`comp-${c.complaint_id}`}
              position={[c.latitude, c.longitude]}
              icon={getTextComplaintIcon(c.status, isDimmed)}
              eventHandlers={{ click: () => setSelectedBin(c) }}
            >
              <Tooltip direction="top" offset={[0, -5]} className="rounded-2xl shadow-xl border-0 overflow-hidden custom-popup bg-slate-900">
                <div className="p-1 text-slate-200 font-sans text-left min-w-[150px] max-w-[220px]">
                  <p className="font-bold text-xs border-b border-slate-700 pb-1 mb-1.5 flex items-center justify-between gap-2">
                    <span className="truncate text-white">Text Complaint</span>
                    <span className={`text-[8px] uppercase px-1 py-0.2 rounded font-mono shrink-0 ${c.status === 'Resolved' ? 'bg-emerald-900 text-emerald-400' : 'bg-slate-800 text-amber-400'}`}>
                      {c.status}
                    </span>
                  </p>
                  <div className="space-y-1 text-[11px]">
                    <p className="text-slate-300 italic whitespace-pre-wrap break-words">"{c.description}"</p>
                    {c.location && <p className="text-slate-400 mt-1">📍 {c.location}</p>}
                  </div>
                </div>
              </Tooltip>
            </Marker>
          );
        })}

        {/* Photo Complaint Markers */}
        {showPhotoComplaints && complaints.filter(c => c.photo_base64 && c.latitude && c.longitude && c.status !== 'Resolved').map((c) => {
          const isDimmed = activeBinIds !== null && !activeBinIds.has(c.complaint_id);
          return (
            <Marker
              key={`comp-${c.complaint_id}`}
              position={[c.latitude, c.longitude]}
              icon={getPhotoComplaintIcon(c.status, isDimmed)}
              eventHandlers={{ click: () => setSelectedBin(c) }}
            >
              <Tooltip direction="top" offset={[0, -5]} className="rounded-2xl shadow-xl border-0 overflow-hidden custom-popup bg-slate-900">
                <div className="p-1 text-slate-200 font-sans text-left min-w-[150px] max-w-[220px]">
                  <p className="font-bold text-xs border-b border-slate-700 pb-1 mb-1.5 flex items-center justify-between gap-2">
                    <span className="truncate text-white">Photo Complaint</span>
                    <span className={`text-[8px] uppercase px-1 py-0.2 rounded font-mono shrink-0 ${c.status === 'Resolved' ? 'bg-emerald-900 text-emerald-400' : 'bg-slate-800 text-amber-400'}`}>
                      {c.status}
                    </span>
                  </p>
                  <div className="space-y-1 text-[11px]">
                    <p className="text-slate-300 italic whitespace-pre-wrap break-words">"{c.description}"</p>
                    {c.garbage_quantity !== undefined && (
                       <p className="text-rose-400 font-bold mt-1">Volume: {c.garbage_quantity}L</p>
                    )}
                    {c.location && <p className="text-slate-400">📍 {c.location}</p>}
                  </div>
                </div>
              </Tooltip>
            </Marker>
          );
        })}

        {/* Live Operator Van Markers */}
        {routingMode === 'dynamic' && operators.filter(o => o.state === 'live' && o.latitude && o.longitude).map((op, idx) => {
          return (
            <Marker
              key={`op-${op.operator_id}`}
              position={[op.latitude, op.longitude]}
              icon={L.divIcon({
                className: 'custom-vehicle-icon',
                html: `<div class="relative w-5 h-5 bg-yellow-400 rounded-full shadow-[0_0_15px_rgba(250,204,21,0.9)] border-2 border-white flex items-center justify-center">
                         <span class="text-[9px] font-black text-yellow-900 z-10 relative">${idx+1}</span>
                         <div style="position:absolute; top:-6px; left:50%; width:0; height:0; margin-left:-4px; border-left:4px solid transparent; border-right:4px solid transparent; border-bottom:7px solid #eab308; transform-origin: 50% 16px; transform: rotate(${op.heading || 0}deg); filter: drop-shadow(0 -1px 1px rgba(250,204,21,0.6));"></div>
                       </div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
              })}
              zIndexOffset={800}
            >
              <Tooltip direction="top" offset={[0, -5]} className="rounded-xl bg-slate-900 text-slate-200 border-none">
                <div className="p-1 text-slate-200 font-sans text-left">
                  <p className="font-bold text-xs text-white">Van {idx+1} (Live)</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Operator: {op.username}</p>
                </div>
              </Tooltip>
            </Marker>
          );
        })}

        {/* Calculated OSRM Road-Snapped Route Overlay (Gradient) */}
        {allRouteSegments.length > 0 ? (
          <>
            {allRouteSegments.map((segment, index) => (
              <Polyline
                key={`segment-${segment.vanId}-${index}`}
                positions={segment.positions}
                pathOptions={{
                  color: segment.color,
                  weight: 6,
                  opacity: 0.85,
                  lineCap: 'round',
                  lineJoin: 'round'
                }}
              />
            ))}
            {/* Animated Vehicle Markers (One per van) */}
            {optimalRoute.fleet_routes.map(r => {
               if (selectedVan !== 'ALL' && r.van_id.toString() !== selectedVan) return null;
               return r.roadGeometry && r.roadGeometry.length > 1 && (
                  <AnimatedVehicle key={`van-${r.van_id}`} roadGeometry={r.roadGeometry} />
               );
            })}
          </>
        ) : polylinePositions.length > 0 && (
          <>
            {polylinePositions.map((positions, index) => (
              <Polyline
                key={`fallback-${index}`}
                positions={positions}
                pathOptions={{
                  color: '#0284c7',
                  weight: 4.5,
                  opacity: 0.9,
                  dashArray: '8, 8',
                  lineCap: 'round',
                  lineJoin: 'round'
                }}
              />
            ))}
          </>
        )}
      </MapContainer>

      {/* Aesthetic integrated Status Legend container */}
      <div className="absolute bottom-3 left-3 z-[400] glass-card p-2 rounded-xl border border-slate-700/60 text-[10px] flex items-center gap-2.5 bg-slate-900/90 text-slate-300">
        <span className="font-semibold text-slate-400">Map Fill Levels:</span>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
          <span>&lt;50%</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
          <span>50-80%</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-rose-500 inline-block animate-pulse"></span>
          <span>&gt;80% Critical</span>
        </div>
      </div>

      {/* Map Control: Layer Toggles (Admin Only) */}
      {onToggleLayer && (
        <div className="absolute top-[60px] right-3 z-[400] glass-card p-2 rounded-xl border border-slate-700/60 flex flex-col gap-2 bg-slate-900/90 text-slate-300 shadow-xl">
          <label className="flex items-center gap-2 text-[10px] font-bold cursor-pointer hover:text-white">
            <input type="checkbox" checked={showBins} onChange={() => onToggleLayer('show_bin_nodes')} className="accent-teal-500 w-3 h-3" />
            Bin Nodes
          </label>
          <label className="flex items-center gap-2 text-[10px] font-bold cursor-pointer hover:text-white">
            <input type="checkbox" checked={showTextComplaints} onChange={() => onToggleLayer('show_text_complaints')} className="accent-blue-500 w-3 h-3" />
            Text Complaints
          </label>
          <label className="flex items-center gap-2 text-[10px] font-bold cursor-pointer hover:text-white">
            <input type="checkbox" checked={showPhotoComplaints} onChange={() => onToggleLayer('show_photo_complaints')} className="accent-purple-500 w-3 h-3" />
            Photo Complaints
          </label>
        </div>
      )}

      {/* Map Control: Routing Mode Toggle */}
      {setRoutingMode && (
        <div className="absolute top-3 right-3 z-[400] glass-card p-1 rounded-xl border border-slate-700/60 flex items-center bg-slate-900/90 text-slate-300 shadow-xl">
          <button 
            onClick={(e) => { e.stopPropagation(); setRoutingMode('static'); }}
            className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${routingMode === 'static' ? 'bg-teal-600 text-white' : 'hover:bg-slate-800'}`}
          >
            Static (Depot)
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setRoutingMode('dynamic'); }}
            className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${routingMode === 'dynamic' ? 'bg-teal-600 text-white' : 'hover:bg-slate-800'}`}
          >
            Dynamic (Live)
          </button>
        </div>
      )}
    </div>
  );
};

export default MapView;
