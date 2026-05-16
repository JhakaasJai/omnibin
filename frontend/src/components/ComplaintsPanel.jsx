import React, { useState, useEffect } from 'react';
import { fetchComplaints, updateComplaintStatus } from '../services/api';
import { RefreshCw, CheckCircle, Clock, AlertCircle, Camera, Menu } from 'lucide-react';

const ComplaintsPanel = ({ toggleSidebar }) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const data = await fetchComplaints();
      setComplaints(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
    const iv = setInterval(loadComplaints, 10000); // Poll every 10s
    return () => clearInterval(iv);
  }, []);

  const handleResolve = async (id) => {
    setUpdating(id);
    try {
      await updateComplaintStatus(id, 'Resolved');
      await loadComplaints();
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="mb-5 flex items-start gap-4">
        <button 
          onClick={toggleSidebar}
          className="p-2.5 rounded-xl glass-card hover:scale-105 transition-all shrink-0 flex items-center justify-center mt-1"
          style={{ color: '#0d4a2f' }}
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-black" style={{ color: '#0d4a2f' }}>Citizen Complaints</h2>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(13,74,47,0.50)' }}>
            Review and resolve anonymous reports from civilians regarding waste management issues.
          </p>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-4 text-left">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(13,74,47,0.50)' }}>
            Active Reports
          </p>
          <button onClick={loadComplaints} className="p-1 rounded-md hover:bg-white/30 transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} style={{ color: '#16a34a' }} />
          </button>
        </div>

        {complaints.length === 0 && !loading ? (
          <div className="py-8 text-center text-xs italic" style={{ color: 'rgba(13,74,47,0.35)' }}>
            No complaints registered.
          </div>
        ) : (
          <div className="space-y-3">
            {complaints.map(c => {
              const d = new Date(c.timestamp);
              const isResolved = c.status === 'Resolved';
              return (
                <div key={c.complaint_id} className="p-4 rounded-xl flex flex-col md:flex-row gap-4 justify-between transition-all"
                     style={{ background: isResolved ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.65)' }}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      {isResolved ? <CheckCircle className="w-4 h-4 text-green-600" /> : <AlertCircle className="w-4 h-4 text-amber-500" />}
                      <span className="text-xs font-bold" style={{ color: '#0d4a2f' }}>{c.status}</span>
                      <span className="text-[10px] font-mono" style={{ color: 'rgba(13,74,47,0.45)' }}>• {d.toLocaleString()}</span>
                      {c.photo_base64 && (
                        <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white/50" style={{ color: '#0d4a2f' }}>
                          <Camera className="w-3 h-3" /> Photo Report
                        </span>
                      )}
                    </div>
                    {c.location && (
                      <p className="text-xs font-semibold mb-1 flex items-center gap-1" style={{ color: '#0d9488' }}>
                         📍 {c.location} 
                         {c.latitude && c.longitude && (
                           <span className="font-mono text-[9px] opacity-70 ml-1">
                             ({c.latitude.toFixed(5)}, {c.longitude.toFixed(5)})
                           </span>
                         )}
                      </p>
                    )}
                    <p className="text-sm" style={{ color: '#0d4a2f' }}>{c.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mt-3">
                      {c.garbage_quantity !== undefined && c.garbage_quantity > 0 && (
                        <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider"
                              style={{ 
                                background: c.garbage_quantity >= 200 ? 'rgba(220,38,38,0.1)' : 'rgba(217,119,6,0.1)', 
                                color: c.garbage_quantity >= 200 ? '#dc2626' : '#d97706' 
                              }}>
                          Est. Volume: {c.garbage_quantity}L
                        </span>
                      )}
                      {c.confidence_score !== undefined && c.photo_base64 && (
                        <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/40"
                              style={{ color: '#0d4a2f' }}>
                          AI Confidence: {c.confidence_score.toFixed(1)}%
                        </span>
                      )}
                    </div>

                    {c.photo_base64 && (
                      <div className="mt-3 rounded-xl overflow-hidden border border-white/40 shadow-sm" style={{ maxWidth: '300px' }}>
                        <img src={c.photo_base64} alt="Complaint Photo" className="w-full h-auto object-cover" />
                      </div>
                    )}

                  </div>
                  
                  <div className="flex flex-col gap-2 min-w-[120px]">
                    {!isResolved && (
                      <button 
                        onClick={() => handleResolve(c.complaint_id)}
                        disabled={updating === c.complaint_id}
                        className="btn-primary py-2 text-xs rounded-lg"
                      >
                        {updating === c.complaint_id ? 'Resolving...' : 'Mark Resolved'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplaintsPanel;
