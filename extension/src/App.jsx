import { useState, useEffect } from 'react';
import { Timer, Clock, PhoneCall, LogOut, CheckCircle, AlertCircle, PlayCircle, Square, Briefcase, PhoneIncoming, PhoneOutgoing, PhoneMissed } from 'lucide-react';
import './index.css';
import { loginAPI, fetchActiveTimer, fetchProjects, startTimer, stopTimer, fetchRecentEntries, fetchCallLogs } from './api';
import DCRForm from './components/DCRForm';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentView, setCurrentView] = useState('timer'); // 'timer', 'dcr'

  // Timer & API state
  const [activeTimerObj, setActiveTimerObj] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [projects, setProjects] = useState([]);
  const [recentEntries, setRecentEntries] = useState([]);
  const [recentCalls, setRecentCalls] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [description, setDescription] = useState('');
  const [syncing, setSyncing] = useState(false);
  
  // Auth check
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['authToken'], (result) => {
        if (result.authToken) setIsAuthenticated(true);
      });
    }
  }, []);

  // Sync Timer & Projects when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadInitialData();
      
      // Background sync every 30s
      const syncInterval = setInterval(() => {
         loadInitialData(true);
      }, 30000);
      return () => clearInterval(syncInterval);
    }
  }, [isAuthenticated]);

  const loadInitialData = async (silent = false) => {
    try {
      if (!silent) setSyncing(true);
      const [timerRes, projectsRes, entriesRes, callsRes] = await Promise.all([
        fetchActiveTimer().catch(() => ({ active_timer: null })),
        fetchProjects().catch(() => ({ projects: [] })),
        fetchRecentEntries().catch(() => ({ data: [] })),
        fetchCallLogs().catch(() => ({ success: false, data: [] }))
      ]);
      
      if (timerRes && timerRes.active_timer) {
        setActiveTimerObj(timerRes.active_timer);
      } else {
        setActiveTimerObj(null);
      }

      if (projectsRes && projectsRes.projects) {
        setProjects(projectsRes.projects);
      }
      
      if (entriesRes) {
        const entries = Array.isArray(entriesRes) ? entriesRes : (entriesRes.data || []);
        setRecentEntries(entries.slice(0, 5));
      }

      if (callsRes && callsRes.success) {
        setRecentCalls(callsRes.data || []);
      }
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      if (!silent) setSyncing(false);
    }
  };

  // Timer interval calculation
  useEffect(() => {
    let interval;
    if (activeTimerObj && activeTimerObj.start_time) {
      interval = setInterval(() => {
         const start = new Date(activeTimerObj.start_time);
         const now = new Date();
         setElapsed(Math.floor((now - start) / 1000));
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(interval);
  }, [activeTimerObj]);

  const formatTime = (totalSeconds) => {
    if (totalSeconds < 0) totalSeconds = 0;
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const handleStartTimer = async () => {
    if (!selectedProject && projects.length > 0) {
      setError("Please select a project");
      return;
    }
    setError(null);
    setSyncing(true);
    try {
      const payload = {
        project_id: selectedProject || null,
        description: description || "Extension Timer"
      };
      await startTimer(payload);
      setDescription('');
      await loadInitialData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleStopTimer = async () => {
    if (!activeTimerObj) return;
    setSyncing(true);
    try {
      await stopTimer(activeTimerObj.entry_id || activeTimerObj.id);
      setActiveTimerObj(null);
      setElapsed(0);
      await loadInitialData(); // Refresh list if we implement recent entries later
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleLogin = async () => {
    if (!identifier || !password) {
      setError('Please fill in both fields');
      return;
    }
    setError(null);
    setLoading(true);
    
    try {
      const data = await loginAPI(identifier, password);
      if (typeof chrome !== 'undefined' && chrome.storage && data.token) {
        chrome.storage.local.set({ authToken: data.token });
      }
      setIsAuthenticated(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.remove('authToken');
    }
    setIsAuthenticated(false);
    setIdentifier('');
    setPassword('');
    setActiveTimerObj(null);
    setCurrentView('timer');
  };

  return (
    <div className="w-[350px] h-[550px] bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans flex flex-col relative shadow-2xl overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 shrink-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <Timer className="h-4.5 w-4.5 text-white" />
          </div>
          <h1 className="text-base font-black tracking-wide text-slate-900 dark:text-white uppercase">Subsync</h1>
        </div>
        {isAuthenticated && (
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                <div className={`h-2 w-2 rounded-full ${syncing ? 'bg-indigo-500 animate-pulse' : 'bg-emerald-500'}`} />
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{syncing ? 'Syncing...' : 'Online'}</span>
             </div>
             <button onClick={handleLogout} title="Log out" className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors">
                <LogOut className="h-4 w-4" />
             </button>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar relative z-10 fade-in bg-slate-50/50 dark:bg-transparent">
        {!isAuthenticated ? (
          <div className="flex flex-col gap-5 p-6 mt-6">
            <div className="text-center">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Welcome Back</h2>
              <p className="text-sm text-slate-500 font-medium mt-1">Sign in to your Subsync account</p>
            </div>
            
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium border border-red-100 dark:border-red-900/30">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}
            
            <div className="flex flex-col gap-3 mt-2">
              <input 
                type="text" 
                placeholder="Username or Email" 
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-900 dark:text-white placeholder-slate-400"
              />
              <input 
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-900 dark:text-white placeholder-slate-400"
              />
              <button 
                onClick={handleLogin}
                disabled={loading}
                className={`mt-4 w-full bg-indigo-600 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-wait' : 'hover:bg-indigo-700 active:transform active:scale-[0.98]'}`}
              >
                {loading ? 'Authenticating...' : 'Sign In To Subsync'}
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full pb-6 pt-4 px-4 flex flex-col gap-4">
            
            {/* VIEW: TIMER */}
            {currentView === 'timer' && (
              <div className="flex flex-col gap-4 fade-in">
                 {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 mb-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <p>{error}</p>
                  </div>
                 )}

                 {/* Active Timer Card */}
                 <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                     <Timer className="h-24 w-24 text-indigo-600" />
                   </div>
                   
                   <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-3 relative z-10">
                     {activeTimerObj ? 'Active Mission' : 'Standby Mode'}
                   </p>

                   {activeTimerObj ? (
                     <div className="relative z-10">
                       <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight mb-2 truncate">
                         {activeTimerObj.title || activeTimerObj.description || 'Tracking Time'}
                       </h3>
                       {activeTimerObj.project_name && (
                         <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mt-1 mb-4">
                           <Briefcase className="h-3.5 w-3.5" />
                           <span>{activeTimerObj.project_name}</span>
                         </div>
                       )}

                       <div className="text-4xl font-mono font-black text-indigo-600 dark:text-indigo-400 my-5 tracking-tight flex items-baseline">
                         {formatTime(elapsed)}
                       </div>

                       <button 
                         disabled={syncing} 
                         onClick={handleStopTimer} 
                         className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-500/20 active:scale-[0.98] disabled:opacity-50"
                       >
                         <Square className="h-4 w-4 fill-current" />
                         Stop & Log
                       </button>
                     </div>
                   ) : (
                     <div className="relative z-10 flex flex-col gap-3 mt-2">
                       <div className="text-4xl font-mono font-black text-slate-300 dark:text-slate-700 my-2 tracking-tight">
                         00:00:00
                       </div>
                       
                       <div className="relative">
                         <Briefcase className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                         <select 
                           className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                           value={selectedProject}
                           onChange={(e) => setSelectedProject(e.target.value)}
                         >
                           <option value="">Select Project...</option>
                           {projects.map(p => (
                             <option key={p.id || p.project_id} value={p.id || p.project_id}>{p.name || p.project_name || p.title}</option>
                           ))}
                         </select>
                       </div>
                       
                       <input
                         type="text"
                         placeholder="What are you working on?"
                         className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400"
                         value={description}
                         onChange={(e) => setDescription(e.target.value)}
                       />

                       <button 
                         disabled={syncing} 
                         onClick={handleStartTimer} 
                         className="w-full flex items-center justify-center gap-2 mt-2 bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50"
                       >
                         <PlayCircle className="h-4.5 w-4.5 fill-current" />
                         Start Timer
                       </button>
                     </div>
                   )}
                 </div>

                 {/* Recent Entries */}
                 {!activeTimerObj && recentEntries.length > 0 && (
                   <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm mt-1">
                     <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 pl-1">Recent Missions</h4>
                     <div className="flex flex-col gap-2">
                       {recentEntries.map(entry => (
                         <div key={entry.id || entry.entry_id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent hover:border-slate-100 dark:hover:border-slate-700 transition-all cursor-pointer group" onClick={() => {
                           setDescription(entry.title || entry.description || '');
                           setSelectedProject(entry.project_id || '');
                           // Scroll to top or give feedback
                         }}>
                           <div className="flex flex-col gap-1 overflow-hidden pr-2">
                             <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                               {entry.title || entry.description || 'Time Entry'}
                             </div>
                             {(entry.project_name || entry.customer_name) && (
                               <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                                 <Briefcase className="h-3 w-3" />
                                 <span className="truncate">{entry.project_name || entry.customer_name}</span>
                               </div>
                             )}
                           </div>
                           <div className="flex items-center gap-3 shrink-0">
                             <span className="text-xs font-mono font-bold text-slate-400">
                               {Math.floor(entry.duration_minutes / 60)}h {entry.duration_minutes % 60}m
                             </span>
                             <button className="h-8 w-8 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all group-hover:scale-110">
                               <PlayCircle className="h-4 w-4" />
                             </button>
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
              </div>
            )}

            {/* VIEW: DCR */}
            {currentView === 'dcr' && (
              <div className="flex flex-col gap-4 fade-in">
                <DCRForm onBack={() => setCurrentView('timer')} onLogged={() => loadInitialData(true)} />
                
                {/* Recent Calls */}
                {recentCalls.length > 0 && (
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 pl-1">Recent History</h4>
                    <div className="flex flex-col gap-2">
                       {recentCalls.map(call => (
                         <div key={call.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-transparent">
                            <div className="flex items-center gap-3 overflow-hidden">
                               <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                                 call.call_type === 'incoming' ? 'bg-emerald-50 text-emerald-600' : 
                                 call.call_type === 'outgoing' ? 'bg-blue-50 text-blue-600' :
                                 'bg-red-50 text-red-600'
                               }`}>
                                 {call.call_type === 'incoming' ? <PhoneIncoming size={14} /> : 
                                  call.call_type === 'outgoing' ? <PhoneOutgoing size={14} /> : 
                                  <PhoneMissed size={14} />}
                               </div>
                               <div className="flex flex-col gap-0.5 overflow-hidden">
                                  <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                    {call.name || call.phone}
                                  </div>
                                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter truncate flex items-center gap-1">
                                    {call.company || (call.entity_type !== 'unknown' ? call.entity_type : 'Unknown Contact')}
                                  </div>
                               </div>
                            </div>
                            <div className="text-[10px] font-black text-slate-400 text-right shrink-0">
                               {Math.floor(call.duration / 60)}m {call.duration % 60}s
                            </div>
                         </div>
                       ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      {isAuthenticated && (
        <nav className="h-[68px] bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-around items-center shrink-0 z-20 px-2 pb-1 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
          <button 
            onClick={() => setCurrentView('timer')} 
            className={`flex flex-col items-center justify-center gap-1 w-20 h-14 rounded-2xl transition-all ${currentView === 'timer' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${currentView === 'timer' ? 'bg-indigo-50 dark:bg-indigo-500/10' : 'bg-transparent'}`}>
                <Clock className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold tracking-wide">Timer</span>
          </button>

          <button 
            onClick={() => setCurrentView('dcr')} 
            className={`flex flex-col items-center justify-center gap-1 w-20 h-14 rounded-2xl transition-all ${currentView === 'dcr' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${currentView === 'dcr' ? 'bg-indigo-50 dark:bg-indigo-500/10' : 'bg-transparent'}`}>
                <PhoneCall className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold tracking-wide">Calls</span>
          </button>
        </nav>
      )}
    </div>
  );
}

export default App;