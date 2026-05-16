import React, { useState, useEffect } from 'react';
import { Settings, X, Save, RefreshCw, Truck, Fuel, DollarSign } from 'lucide-react';
import { updateConfig } from '../services/api';

const FleetConfigModal = ({ isOpen, onClose, config, setConfig, onSaveSuccess }) => {
  const [form,   setForm]   = useState({ van_capacity: 500.0, mileage_kmpl: 5.5, fuel_price: 95.0 });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState(null);

  useEffect(() => {
    if (config) setForm({
      van_capacity: config.van_capacity ?? 500.0,
      mileage_kmpl: config.mileage_kmpl ?? 5.5,
      fuel_price:   config.fuel_price   ?? 95.0,
      show_bin_nodes: config.show_bin_nodes ?? true,
      show_text_complaints: config.show_text_complaints ?? true,
      show_photo_complaints: config.show_photo_complaints ?? true,
    });
  }, [config]);

  if (!isOpen) return null;

  const onChange = e => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: parseFloat(value) || 0 }));
  };

  const onSave = async e => {
    e.preventDefault(); setSaving(true); setError(null);
    try {
      const updated = await updateConfig(form);
      setConfig(updated); onSaveSuccess(); onClose();
    } catch { setError('Failed to save. Check network connectivity.'); }
    finally { setSaving(false); }
  };

  const fields = [
    { name: 'van_capacity', label: 'Max Van Capacity', unit: 'Liters', icon: Truck,
      hint: 'Total volume limit per route cluster' },
    { name: 'mileage_kmpl', label: 'Vehicle Mileage',  unit: 'km/L',  icon: Fuel,
      hint: 'Used to calculate fuel burn per route segment' },
    { name: 'fuel_price',   label: 'Fuel Price',       unit: '₹/L',   icon: DollarSign,
      hint: 'Cost minimization weight in the CVRP optimizer' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
         style={{ background: 'rgba(13,74,47,0.30)', backdropFilter: 'blur(12px)' }}>
      <div className="glass-panel w-full max-w-md rounded-3xl overflow-hidden animate-scale-in"
           style={{ boxShadow: '0 24px 80px rgba(13,74,47,0.18)' }}>

        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between"
             style={{ borderBottom: '1px solid rgba(255,255,255,0.45)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                 style={{ background: 'rgba(22,163,74,0.12)', border: '1px solid rgba(22,163,74,0.25)' }}>
              <Settings className="w-4 h-4" style={{ color: '#16a34a' }} />
            </div>
            <div>
              <h3 className="font-bold text-sm" style={{ color: '#0d4a2f' }}>Fleet Configuration</h3>
              <p className="text-[10px]" style={{ color: 'rgba(13,74,47,0.50)' }}>Adjust optimizer constraints</p>
            </div>
          </div>
          <button
            id="fleet-config-close"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-white/50"
            style={{ color: 'rgba(13,74,47,0.50)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSave} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl text-xs font-medium"
                 style={{ background: 'rgba(254,226,226,0.60)', border: '1px solid rgba(239,68,68,0.22)', color: '#991b1b' }}>
              {error}
            </div>
          )}

          {fields.map(f => {
            const Icon = f.icon;
            return (
              <div key={f.name}>
                <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest mb-2"
                       style={{ color: 'rgba(13,74,47,0.55)' }}>
                  <Icon className="w-3 h-3" />
                  {f.label}
                  <span className="font-normal lowercase tracking-normal opacity-60">({f.unit})</span>
                </label>
                <input
                  id={`config-${f.name}`}
                  type="number"
                  step="0.1"
                  name={f.name}
                  value={form[f.name]}
                  onChange={onChange}
                  required
                  className="eco-input font-bold"
                />
                <p className="text-[10px] mt-1" style={{ color: 'rgba(13,74,47,0.38)' }}>{f.hint}</p>
              </div>
            );
          })}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2"
               style={{ borderTop: '1px solid rgba(255,255,255,0.45)' }}>
            <button type="button" onClick={onClose} className="btn-glass px-4 py-2.5 rounded-xl text-xs">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary px-4 py-2.5 rounded-xl text-xs">
              {saving
                ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...</>
                : <><Save className="w-3.5 h-3.5" /> Save Config</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FleetConfigModal;
