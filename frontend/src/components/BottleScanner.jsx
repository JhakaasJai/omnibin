import React, { useState, useRef } from 'react';
import { Upload, Camera, CheckCircle, XCircle, Scan, Loader2, AlertCircle, Menu } from 'lucide-react';
import { detectPlasticBottle } from '../services/api';

const BottleScanner = ({ toggleSidebar }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    setError('');
    setResult(null);
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file.');
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScan = async () => {
    if (!imagePreview) return;
    
    setIsAnalyzing(true);
    setError('');
    
    try {
      const res = await detectPlasticBottle(imagePreview);
      setResult(res);
    } catch (err) {
      console.error(err);
      setError('Failed to analyze the image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearImage = () => {
    setSelectedFile(null);
    setImagePreview('');
    setResult(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4 animate-fade-in max-w-4xl mx-auto">
      <div className="mb-5 flex items-start gap-4">
        <button 
          onClick={toggleSidebar}
          className="p-2.5 rounded-xl glass-card hover:scale-105 transition-all shrink-0 flex items-center justify-center mt-1"
          style={{ color: '#0d4a2f' }}
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Scan className="w-4 h-4" style={{ color: '#16a34a' }} />
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#16a34a' }}>AI Scanner Vision</span>
          </div>
          <h1 className="text-2xl font-black" style={{ color: '#0d4a2f' }}>Plastic Bottle Detection</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(13,74,47,0.60)' }}>
            Upload an image to verify whether it contains a plastic bottle using the Llama 3.2 Vision Model.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload Column */}
        <div className="glass-panel p-6 rounded-3xl flex flex-col items-center justify-center min-h-[400px]">
          {!imagePreview ? (
            <div 
              onClick={() => fileInputRef.current.click()}
              className="w-full h-full min-h-[300px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-white/10"
              style={{ borderColor: 'rgba(13,74,47,0.2)' }}
            >
              <div className="w-16 h-16 rounded-full glass-card flex items-center justify-center mb-4">
                <Upload className="w-8 h-8" style={{ color: '#0d9488' }} />
              </div>
              <p className="font-bold text-lg mb-1" style={{ color: '#0d4a2f' }}>Upload Image</p>
              <p className="text-xs" style={{ color: 'rgba(13,74,47,0.5)' }}>Click or drag and drop</p>
              <p className="text-[10px] mt-2 font-mono" style={{ color: 'rgba(13,74,47,0.4)' }}>JPG, PNG, WEBP</p>
            </div>
          ) : (
            <div className="w-full relative group rounded-2xl overflow-hidden shadow-xl" style={{ border: '1px solid rgba(255,255,255,0.4)' }}>
              <img 
                src={imagePreview} 
                alt="Upload Preview" 
                className="w-full h-auto max-h-[400px] object-contain bg-black/5"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button 
                  onClick={clearImage}
                  className="px-4 py-2 bg-rose-500 text-white font-bold rounded-xl text-sm shadow-lg hover:scale-105 transition-transform"
                >
                  Remove Image
                </button>
              </div>
            </div>
          )}
          
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={handleImageChange} 
            className="hidden" 
          />
        </div>

        {/* Action/Result Column */}
        <div className="flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-3xl">
            <h2 className="text-sm font-black uppercase tracking-wider mb-4" style={{ color: '#0d4a2f' }}>Analysis Controls</h2>
            
            <button
              onClick={handleScan}
              disabled={!imagePreview || isAnalyzing}
              className="w-full py-4 rounded-xl flex items-center justify-center gap-2 font-black text-white text-lg tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] shadow-xl"
              style={{ background: 'linear-gradient(135deg, #0d9488, #0f766e)' }}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Analyzing Image...
                </>
              ) : (
                <>
                  <Scan className="w-6 h-6" />
                  Run AI Scanner
                </>
              )}
            </button>

            {error && (
              <div className="mt-4 p-3 rounded-xl flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-700">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}
          </div>

          {result && (
            <div className={`glass-panel p-6 rounded-3xl border-2 transition-all duration-500 animate-scale-in ${result.is_plastic_bottle ? 'border-emerald-500/30' : 'border-rose-500/30'}`}>
              <h2 className="text-[10px] font-black uppercase tracking-widest mb-4" style={{ color: 'rgba(13,74,47,0.50)' }}>Detection Result</h2>
              
              <div className="flex flex-col items-center justify-center text-center py-4">
                {result.is_plastic_bottle ? (
                  <>
                    <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-4 border-emerald-500/20 flex items-center justify-center mb-4">
                      <CheckCircle className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h3 className="text-2xl font-black text-emerald-700 mb-2">Plastic Bottle Detected</h3>
                    <p className="text-sm text-emerald-600/70 font-medium">The vision model verified the presence of a plastic bottle.</p>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 rounded-full bg-rose-500/10 border-4 border-rose-500/20 flex items-center justify-center mb-4">
                      <XCircle className="w-10 h-10 text-rose-600" />
                    </div>
                    <h3 className="text-2xl font-black text-rose-700 mb-2">No Plastic Bottle</h3>
                    <p className="text-sm text-rose-600/70 font-medium">The vision model did not detect a plastic bottle in this image.</p>
                  </>
                )}

                <div className="mt-8 w-full max-w-xs mx-auto">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold" style={{ color: '#0d4a2f' }}>AI Confidence</span>
                    <span className="text-xs font-black" style={{ color: result.confidence_score > 80 ? '#16a34a' : '#d97706' }}>
                      {result.confidence_score.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(13,74,47,0.1)' }}>
                    <div className="h-full rounded-full transition-all duration-1000 ease-out" 
                         style={{ 
                           width: `${result.confidence_score}%`,
                           background: result.confidence_score > 80 ? '#16a34a' : '#d97706' 
                         }} 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BottleScanner;
