import { useState, useEffect } from 'react';
import { PhoneCall, PhoneIncoming, PhoneOutgoing, PhoneMissed, User, Clock, AlignLeft, CheckCircle2, ChevronLeft } from 'lucide-react';
import { logCall } from '../api';

export default function DCRForm({ onBack, onLogged }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    phone: '',
    name: '',
    call_type: 'incoming',
    durationMinutes: '',
    description: ''
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.phone) {
      setError("Phone number is required");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      await logCall({
        phone: formData.phone,
        name: formData.name || 'Unknown',
        entity_type: 'unknown',
        call_type: formData.call_type,
        duration: (Number(formData.durationMinutes) || 0) * 60, // backend expects seconds
        description: formData.description || 'Call logged via extension'
      });
      setSuccess(true);
      if (onLogged) onLogged();
      setTimeout(() => {
        if (onBack) onBack();
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-emerald-50 dark:bg-emerald-950/20 rounded-3xl border border-emerald-100 dark:border-emerald-900/30 mt-4 fade-in w-full text-center">
        <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4 animate-bounce" />
        <h3 className="text-emerald-700 dark:text-emerald-400 font-black text-xl tracking-tight">Call Logged!</h3>
        <p className="text-sm font-medium text-emerald-600/80 dark:text-emerald-500/80 mt-1">Successfully synced to DCR</p>
      </div>
    );
  }

  const getCallTypeStyles = (type) => {
    const isSelected = formData.call_type === type;
    if (type === 'incoming') {
      return isSelected ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700/50' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:bg-emerald-50';
    } else if (type === 'outgoing') {
      return isSelected ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700/50' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:bg-blue-50';
    } else {
      return isSelected ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700/50' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:bg-red-50';
    }
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 p-5 flex flex-col gap-4 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 fade-in text-left">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <PhoneCall className="h-5 w-5 text-indigo-500" />
          Quick Call
        </h3>
        {onBack && (
          <button type="button" onClick={onBack} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 p-3 rounded-xl font-bold text-center">{error}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <PhoneCall className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
            <input required type="text" name="phone" placeholder="Phone Number *" value={formData.phone} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-900 dark:text-white placeholder-slate-400" />
          </div>
          <div className="relative">
            <User className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
            <input type="text" name="name" placeholder="Contact Name (Optional)" value={formData.name} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-900 dark:text-white placeholder-slate-400" />
          </div>
        </div>

        {/* Call Type Pills */}
        <div className="flex gap-2 w-full pt-1">
          <button type="button" onClick={() => setFormData({...formData, call_type: 'incoming'})} className={`flex-1 flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all gap-1.5 ${getCallTypeStyles('incoming')}`}>
            <PhoneIncoming className="h-4.5 w-4.5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">In</span>
          </button>
          <button type="button" onClick={() => setFormData({...formData, call_type: 'outgoing'})} className={`flex-1 flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all gap-1.5 ${getCallTypeStyles('outgoing')}`}>
            <PhoneOutgoing className="h-4.5 w-4.5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Out</span>
          </button>
          <button type="button" onClick={() => setFormData({...formData, call_type: 'missed'})} className={`flex-1 flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all gap-1.5 ${getCallTypeStyles('missed')}`}>
            <PhoneMissed className="h-4.5 w-4.5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Missed</span>
          </button>
        </div>

        <div className="flex flex-col gap-3 pt-1">
          <div className="relative">
            <Clock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
            <input type="number" name="durationMinutes" placeholder="Duration (min)" min="0" value={formData.durationMinutes} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-900 dark:text-white placeholder-slate-400 font-mono" />
          </div>

          <div className="relative">
            <AlignLeft className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
            <textarea name="description" placeholder="Call Notes" rows="3" value={formData.description} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-900 dark:text-white placeholder-slate-400 resize-none"></textarea>
          </div>
        </div>

        <button type="submit" disabled={loading} className={`mt-2 w-full bg-indigo-600 text-white font-black uppercase tracking-widest text-xs py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-indigo-600/20 ${loading ? 'opacity-70 cursor-wait' : 'hover:bg-indigo-700 active:transform active:scale-[0.98]'}`}>
          {loading ? 'Saving...' : 'Log It'}
        </button>
      </form>
    </div>
  );
}
