import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Leaf, Lock, User, AlertCircle, ArrowRight, Eye, EyeOff,
  Globe, Cpu, Wifi, BarChart3, Truck, Recycle
} from 'lucide-react';

/* ── Floating leaf decorations ──────────────────────────────────── */
const LEAVES = [
  { top:'4%',  left:'2%',  size:28, delay:'0s',   dur:'4s'   },
  { top:'8%',  right:'5%', size:36, delay:'0.8s',  dur:'5s'   },
  { top:'35%', left:'1%',  size:22, delay:'1.2s',  dur:'4.5s' },
  { top:'70%', right:'3%', size:30, delay:'0.4s',  dur:'3.8s' },
  { top:'88%', left:'5%',  size:20, delay:'1.6s',  dur:'5.5s' },
  { top:'55%', right:'1%', size:18, delay:'2s',    dur:'4s'   },
];

/* Feature items beneath the hero */
const FEATURES = [
  { icon: Cpu,      label: 'AI Detection',      sub: 'Smart classification'  },
  { icon: Wifi,     label: 'Real-time Monitor', sub: 'Live IoT telemetry'    },
  { icon: Truck,    label: 'Smart Collection',  sub: 'Route optimised'       },
  { icon: BarChart3,label: 'Analytics Insights',sub: 'Data-driven decisions' },
];

const LoginPage = ({ setRole, setOperatorId }) => {
  const [username,  setUsername]  = useState('');
  const [password,  setPassword]  = useState('');
  const [remember,  setRemember]  = useState(false);
  const [showPass,  setShowPass]  = useState(false);
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const navigate = useNavigate();

  const handleLogin = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    
    if (username === 'admin' && password === 'admin123') {
      setTimeout(() => {
        setRole('admin'); navigate('/dashboard');
        setLoading(false);
      }, 650);
      return;
    }
    
    // Call operator login API
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${apiUrl}/api/operators/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (response.ok) {
        const data = await response.json();
        setRole('operator');
        setOperatorId(data.operator_id);
        navigate('/operator-dashboard');
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError('Connection to server failed.');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">

      {/* Nature background */}
      <div className="nature-bg" />

      {/* Floating leaf SVGs */}
      {LEAVES.map((l, i) => (
        <div
          key={i}
          className="absolute pointer-events-none select-none animate-leaf"
          style={{
            top: l.top, left: l.left, right: l.right,
            width: l.size, height: l.size,
            animationDelay: l.delay, animationDuration: l.dur,
            zIndex: 1, opacity: 0.75,
          }}
        >
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 5 C20 20, 5 50, 50 95 C95 50, 80 20, 50 5 Z" fill="rgba(22,163,74,0.55)" />
            <line x1="50" y1="5" x2="50" y2="95" stroke="rgba(255,255,255,0.40)" strokeWidth="3" />
          </svg>
        </div>
      ))}

      {/* ── Main glass container ─────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-5xl glass-panel rounded-3xl overflow-hidden animate-scale-in shadow-2xl lg:min-h-[580px]">
        <div className="flex flex-col lg:flex-row h-full">

          {/* ── LEFT: Hero panel ──────────────────────────────────── */}
          <div className="lg:w-[55%] p-6 lg:p-10 flex flex-col justify-between relative overflow-hidden"
               style={{ background: 'rgba(255,255,255,0.18)' }}>

            {/* Inner glow top */}
            <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full pointer-events-none"
                 style={{ background: 'radial-gradient(circle, rgba(134,239,172,0.35) 0%, transparent 70%)' }} />

            {/* Brand */}
            <div className="relative z-10 flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                   style={{ background: 'rgba(255,255,255,0.70)', border: '1.5px solid rgba(255,255,255,0.85)', boxShadow: '0 4px 12px rgba(22,163,74,0.20)' }}>
                <Recycle className="w-5 h-5" style={{ color: '#16a34a' }} />
              </div>
              <div>
                <h1 className="font-black text-lg leading-none" style={{ color: '#0d4a2f' }}>OmniBin</h1>
                <p className="text-[10px] font-semibold" style={{ color: 'rgba(13,74,47,0.60)' }}>AI Smart Waste Management</p>
              </div>
            </div>

            {/* Hero text */}
            <div className="relative z-10 mt-8 lg:mt-0">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
                   style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.70)' }}>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[11px] font-bold" style={{ color: '#166534' }}>AI-Powered Platform · Live</span>
              </div>

              <h2 className="text-3xl lg:text-4xl font-black leading-tight mb-3"
                  style={{ color: '#0d4a2f' }}>
                Smarter Waste.<br />
                <span style={{ color: '#16a34a' }}>Better Tomorrow.</span>
              </h2>
              <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(13,74,47,0.65)', maxWidth: 400 }}>
                AI-powered system for efficient waste monitoring, collection, and a cleaner, greener future for your city.
              </p>

              {/* Feature grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-3">
                {FEATURES.map(f => {
                  const Icon = f.icon;
                  return (
                    <div key={f.label}
                         className="p-3 rounded-2xl text-center transition-all hover:scale-105"
                         style={{ background: 'rgba(255,255,255,0.50)', border: '1px solid rgba(255,255,255,0.70)', boxShadow: '0 2px 8px rgba(22,163,74,0.08)' }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-1.5"
                           style={{ background: 'rgba(22,163,74,0.12)' }}>
                        <Icon className="w-4 h-4" style={{ color: '#16a34a' }} />
                      </div>
                      <p className="text-[10px] font-bold leading-tight" style={{ color: '#0d4a2f' }}>{f.label}</p>
                      <p className="text-[9px] mt-0.5" style={{ color: 'rgba(13,74,47,0.50)' }}>{f.sub}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom tagline */}
            <div className="relative z-10 mt-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                   style={{ background: 'rgba(255,255,255,0.50)', border: '1px solid rgba(255,255,255,0.65)' }}>
                <Leaf className="w-3.5 h-3.5" style={{ color: '#16a34a' }} />
                <p className="text-xs font-medium" style={{ color: '#166534' }}>
                  Together, let's build a{' '}
                  <span className="font-bold text-green-600">cleaner</span> and{' '}
                  <span className="font-bold text-teal-600">sustainable</span> planet.
                </p>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Login form ──────────────────────────────────── */}
          <div className="lg:w-[45%] p-6 lg:p-10 flex flex-col justify-center"
               style={{ background: 'rgba(255,255,255,0.42)', borderLeft: '1px solid rgba(255,255,255,0.55)' }}>

            {/* Avatar circle */}
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 animate-float"
                 style={{ background: 'rgba(255,255,255,0.75)', border: '2px solid rgba(255,255,255,0.90)', boxShadow: '0 8px 24px rgba(22,163,74,0.20)' }}>
              <Recycle className="w-7 h-7" style={{ color: '#16a34a' }} />
            </div>

            <div className="text-center mb-6">
              <h2 className="text-xl font-black" style={{ color: '#0d4a2f' }}>Welcome Back!</h2>
              <p className="text-sm mt-1" style={{ color: 'rgba(13,74,47,0.55)' }}>Login to continue to your dashboard</p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 rounded-2xl flex items-center gap-2.5 animate-fade-in"
                   style={{ background: 'rgba(254,226,226,0.70)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <AlertCircle className="w-4 h-4 shrink-0" style={{ color: '#dc2626' }} />
                <p className="text-sm font-medium" style={{ color: '#991b1b' }}>{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Username */}
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                      style={{ color: 'rgba(13,74,47,0.40)' }} />
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="eco-input pl-10"
                  placeholder="Username / Email"
                  required
                  autoComplete="username"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                      style={{ color: 'rgba(13,74,47,0.40)' }} />
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="eco-input pl-10 pr-11"
                  placeholder="Password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                  style={{ color: 'rgba(13,74,47,0.45)' }}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Remember me */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={remember}
                    onChange={e => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded accent-green-600 cursor-pointer"
                  />
                  <span className="text-sm font-medium" style={{ color: 'rgba(13,74,47,0.65)' }}>Remember me</span>
                </label>
                <button type="button" className="text-sm font-semibold transition-colors hover:underline"
                        style={{ color: '#16a34a' }}>
                  Forgot Password?
                </button>
              </div>

              {/* Login button */}
              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3.5 rounded-2xl text-sm"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>Login <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>



            {/* Demo credentials */}
            <div className="mt-5 p-3.5 rounded-2xl"
                 style={{ background: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.65)' }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-center mb-2.5"
                 style={{ color: 'rgba(13,74,47,0.40)' }}>Demo Credentials</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: '🛡 Admin',   user: 'admin',   pass: 'admin123' },
                  { label: '🚚 Van Op.', user: 'operator1', pass: 'password123'  },
                ].map(c => (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => { setUsername(c.user); setPassword(c.pass); }}
                    className="p-2.5 rounded-xl text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.70)' }}
                  >
                    <span className="block text-xs font-bold" style={{ color: '#166534' }}>{c.label}</span>
                    <span className="text-[10px]" style={{ color: 'rgba(13,74,47,0.50)' }}>{c.user} / {c.pass}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Civilian Complaint Link */}
            <div className="mt-4 text-center">
              <p className="text-xs" style={{ color: 'rgba(13,74,47,0.65)' }}>
                See an overflowing bin?{' '}
                <button 
                  type="button"
                  onClick={() => navigate('/complaint')}
                  className="font-bold transition-opacity hover:opacity-70 underline"
                  style={{ color: '#16a34a' }}
                >
                  Register a Complaint
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
