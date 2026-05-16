import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, ArrowLeft, Send, CheckCircle, AlertCircle, MapPin, Camera, Image as ImageIcon } from 'lucide-react';
import { submitComplaint } from '../services/api';

const ComplaintForm = () => {
  const [tab, setTab] = useState('standard');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);
  const [locating, setLocating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const getLocation = () => {
    setLocating(true);
    setError('');
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        position => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          setLocation(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
          setLocating(false);
        },
        err => {
          setError("Failed to get location. Please allow location access or type it manually.");
          setLocating(false);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
      setLocating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim() && tab === 'standard') {
      setError('Description is required.');
      return;
    }
    if (tab === 'photo' && !photoBase64) {
      setError('Please upload a photo for the photo report.');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      await submitComplaint({ 
        description: description || "Photo report of illegal dumping.", 
        location,
        latitude,
        longitude,
        photo_base64: tab === 'photo' ? photoBase64 : undefined
      });
      setSuccess(true);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to submit the complaint. Please try again later.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Nature background */}
      <div className="nature-bg" />

      <div className="relative z-10 w-full max-w-xl glass-panel rounded-3xl overflow-hidden shadow-2xl animate-scale-in">
        <div className="p-5 md:p-8 lg:p-10" style={{ background: 'rgba(255,255,255,0.45)' }}>
          
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 mb-6 text-sm font-semibold transition-opacity hover:opacity-70"
            style={{ color: '#0d4a2f' }}
          >
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </button>

          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-black mb-2" style={{ color: '#0d4a2f' }}>
              Register a <span style={{ color: '#16a34a' }}>Complaint</span>
            </h1>
            <p className="text-sm" style={{ color: 'rgba(13,74,47,0.65)' }}>
              Help us keep the city clean. Submit an anonymous report about overflowing bins or waste management issues.
            </p>
          </div>

          {success ? (
            <div className="p-6 rounded-2xl flex flex-col items-center justify-center text-center animate-fade-in"
                 style={{ background: 'rgba(22,163,74,0.15)', border: '1px solid rgba(22,163,74,0.30)' }}>
              <CheckCircle className="w-12 h-12 mb-3" style={{ color: '#16a34a' }} />
              <h3 className="text-xl font-bold mb-2" style={{ color: '#0d4a2f' }}>Complaint Received</h3>
              <p className="text-sm mb-6" style={{ color: 'rgba(13,74,47,0.70)' }}>
                Thank you for your report. Our team will review and take action shortly.
              </p>
              <button 
                onClick={() => navigate('/')}
                className="btn-primary px-6 py-2.5 rounded-xl text-sm"
              >
                Return to Home
              </button>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex rounded-xl p-1 mb-6" style={{ background: 'rgba(13,74,47,0.1)' }}>
                <button
                  onClick={() => setTab('standard')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${tab === 'standard' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                  style={{ color: tab === 'standard' ? '#0d4a2f' : 'rgba(13,74,47,0.6)' }}
                >
                  Standard Report
                </button>
                <button
                  onClick={() => setTab('photo')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${tab === 'photo' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                  style={{ color: tab === 'photo' ? '#0d4a2f' : 'rgba(13,74,47,0.6)' }}
                >
                  <Camera className="w-4 h-4" /> Photo Report
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
                {error && (
                  <div className="p-3 rounded-2xl flex items-center gap-2.5 animate-fade-in"
                       style={{ background: 'rgba(254,226,226,0.70)', border: '1px solid rgba(239,68,68,0.25)' }}>
                    <AlertCircle className="w-4 h-4 shrink-0" style={{ color: '#dc2626' }} />
                    <p className="text-sm font-medium" style={{ color: '#991b1b' }}>{error}</p>
                  </div>
                )}

                {tab === 'photo' && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#0d4a2f' }}>
                      Upload Photo of Dumping Site *
                    </label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-white/20 transition-all overflow-hidden relative"
                      style={{ borderColor: 'rgba(13,74,47,0.3)', minHeight: '160px' }}
                    >
                      {photoBase64 ? (
                        <img src={photoBase64} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <>
                          <ImageIcon className="w-8 h-8 mb-2" style={{ color: 'rgba(13,74,47,0.4)' }} />
                          <p className="text-sm font-bold" style={{ color: '#0d4a2f' }}>Click to select a photo</p>
                          <p className="text-xs mt-1" style={{ color: 'rgba(13,74,47,0.6)' }}>JPEG, PNG, WEBP allowed</p>
                        </>
                      )}
                    </div>
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" />
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: '#0d4a2f' }}>
                      Location {tab === 'photo' ? '*' : '(Optional)'}
                    </label>
                    <button type="button" onClick={getLocation} disabled={locating} className="text-xs font-bold hover:underline" style={{ color: '#0d9488' }}>
                      {locating ? 'Locating...' : 'Get My Location'}
                    </button>
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                            style={{ color: 'rgba(13,74,47,0.40)' }} />
                    <input
                      type="text"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      className="eco-input pl-10"
                      placeholder="E.g. Near Central Park entrance"
                      required={tab === 'photo'}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#0d4a2f' }}>
                    Complaint Details {tab === 'standard' ? '*' : '(Optional)'}
                  </label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="eco-input"
                    style={{ minHeight: tab === 'photo' ? '80px' : '120px', padding: '12px 16px', resize: 'vertical' }}
                    placeholder="Describe the issue... (e.g. The bin is overflowing and scattered waste is around it.)"
                    required={tab === 'standard'}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || locating}
                  className="btn-primary w-full py-3.5 rounded-2xl text-sm mt-4"
                >
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin mr-2 inline" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      {tab === 'photo' ? 'Analyzing & Submitting...' : 'Submitting...'}
                    </>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Submit Complaint <Send className="w-4 h-4" />
                    </span>
                  )}
                </button>
              </form>
            </>
          )}

          <div className="mt-8 pt-6 flex justify-center border-t border-white/30">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                 style={{ background: 'rgba(255,255,255,0.50)', border: '1px solid rgba(255,255,255,0.65)' }}>
              <Leaf className="w-3.5 h-3.5" style={{ color: '#16a34a' }} />
              <p className="text-xs font-medium" style={{ color: '#166534' }}>
                Your identity remains <span className="font-bold text-green-600">100% anonymous</span>.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ComplaintForm;
