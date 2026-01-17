
import React, { useState, useMemo, useEffect } from 'react';
import { 
  PerformanceData, 
  CoachingReport, 
  Message, 
  EmployeeRecord, 
  LeadershipPersona, 
  CoachingMode,
  Metric, 
  SentimentType,
  AppLanguage,
  PersistentStorage
} from './types';
import { INITIAL_METRICS, SENTIMENT_MAP, PERSONAS } from './constants';
import * as gemini from './services/geminiService';
import MetricChart from './components/MetricChart';
import ActionPlan from './components/ActionPlan';
import ShareModal from './components/ShareModal';
import Logo from './components/Logo';
import ZenWaterGarden from './components/ZenWaterGarden';

const STORAGE_KEY = 'saarathi_v4_storage';
const DATA_VERSION = 4;

// Fix: Added missing language keys to satisfy the Record<AppLanguage, any> type requirement.
const UI_TRANSLATIONS: Record<AppLanguage, any> = {
  'English': { input: 'Pulse', report: 'Insight', chat: 'Counsel', analyze: 'Generate Strategy', myHuddle: 'Growth sanctuary' },
  'Hinglish': { input: 'Pulse', report: 'Insight', chat: 'Counsel', analyze: 'Generate Strategy', myHuddle: 'Growth sanctuary' },
  'Tamil': { input: 'Pulse', report: 'Insight', chat: 'Counsel', analyze: 'Generate Strategy', myHuddle: 'Growth sanctuary' },
  'Malayalam': { input: 'Pulse', report: 'Insight', chat: 'Counsel', analyze: 'Generate Strategy', myHuddle: 'Growth sanctuary' },
  'Gujarati': { input: 'Pulse', report: 'Insight', chat: 'Counsel', analyze: 'Generate Strategy', myHuddle: 'Growth sanctuary' },
  'Kannada': { input: 'Pulse', report: 'Insight', chat: 'Counsel', analyze: 'Generate Strategy', myHuddle: 'Growth sanctuary' },
  'Bengali': { input: 'Pulse', report: 'Insight', chat: 'Counsel', analyze: 'Generate Strategy', myHuddle: 'Growth sanctuary' },
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'input' | 'report' | 'chat'>('input');
  const [persona, setPersona] = useState<LeadershipPersona>('Empathetic Mentor');
  const [mode, setMode] = useState<CoachingMode>('Manager');
  const [language, setLanguage] = useState<AppLanguage>('English');
  const [isLoading, setIsLoading] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [records, setRecords] = useState<EmployeeRecord[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedReportIndex, setSelectedReportIndex] = useState<number>(0);

  const [data, setData] = useState<PerformanceData>({
    employeeName: '',
    role: '',
    metrics: INITIAL_METRICS,
    observations: [],
    context: '',
    sentiment: 'Eager',
    sentimentNotes: ''
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed: PersistentStorage = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.records)) {
          setRecords(parsed.records);
          if (parsed.records.length > 0) loadEmployee(parsed.records[0]);
        }
      } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    const storageObj: PersistentStorage = { version: DATA_VERSION, records: records };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storageObj));
  }, [records]);

  const loadEmployee = (record: EmployeeRecord) => {
    setActiveId(record.id);
    setData(structuredClone(record.data));
    setSelectedReportIndex(0);
    setActiveTab(record.reports.length > 0 ? 'report' : 'input');
    setMessages([]);
    if (window.innerWidth < 1280) setSidebarOpen(false);
  };

  const createNewEmployee = () => {
    const newId = crypto.randomUUID();
    const newRecord: EmployeeRecord = {
      id: newId,
      data: { employeeName: mode === 'Self' ? 'My Persona' : 'New Colleague', role: '', metrics: structuredClone(INITIAL_METRICS), observations: [], context: '', sentiment: 'Eager', sentimentNotes: '' },
      reports: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setRecords([newRecord, ...records]);
    loadEmployee(newRecord);
    setActiveTab('input');
  };

  const handleGenerateReport = async () => {
    if (!data.employeeName.trim() || !activeId) return;
    setIsLoading(true);
    try {
      const res = await gemini.generateCoachingReport(data, persona, language, mode);
      const reportWithMeta: CoachingReport = { 
        ...res, 
        id: crypto.randomUUID(), 
        timestamp: new Date().toISOString(),
        metricSnapshot: structuredClone(data) 
      };
      setRecords(prev => prev.map(r => r.id === activeId ? { ...r, data: structuredClone(data), reports: [reportWithMeta, ...r.reports], updatedAt: new Date().toISOString() } : r));
      setSelectedReportIndex(0);
      setActiveTab('report');
    } catch (error) { 
      console.error(error); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const updateMetric = (index: number, field: keyof Metric, value: any) => {
    const newMetrics = [...data.metrics];
    newMetrics[index] = { ...newMetrics[index], [field]: value };
    setData({ ...data, metrics: newMetrics });
  };

  const activeEmployee = useMemo(() => records.find(r => r.id === activeId), [records, activeId]);
  const activeReport = activeEmployee?.reports[selectedReportIndex] || null;

  return (
    <div className="min-h-screen flex text-slate-800 overflow-hidden font-sans relative">
      <ZenWaterGarden />

      <aside className={`fixed inset-y-0 left-0 xl:static bg-white/40 backdrop-blur-3xl border-r border-white/40 z-[70] transition-all duration-500 flex flex-col ${sidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full xl:w-0 overflow-hidden'}`}>
        <div className="p-10 flex flex-col gap-10 h-full relative z-10">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-[10px] font-black text-[#B8860B] uppercase tracking-[0.3em]">
                {mode === 'Manager' ? 'My Huddle' : 'Growth Sanctuary'}
              </h2>
              <p className="text-xl font-black text-slate-900 tracking-tighter">
                {mode === 'Manager' ? 'Colleague Pool' : 'Personal Journey'}
              </p>
            </div>
            <button onClick={createNewEmployee} className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center hover:bg-[#B8860B] shadow-xl active:scale-90">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
            {records.map(record => (
              <button key={record.id} onClick={() => loadEmployee(record)} className={`w-full text-left p-5 rounded-[2rem] transition-all border-2 ${activeId === record.id ? 'bg-white border-white shadow-2xl ring-1 ring-[#B8860B]/10' : 'bg-transparent border-transparent hover:bg-white/40'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center font-black text-sm ${activeId === record.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}>{record.data.employeeName.charAt(0)}</div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-800 text-sm truncate">{record.data.employeeName}</h3>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{record.data.role || 'Strategic Focus'}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen relative z-10 overflow-hidden">
        <header className="px-8 py-8 lg:px-14 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-6">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl text-slate-400 border border-slate-100 shadow-sm transition-all hover:text-[#B8860B]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <Logo size="md" showText={true} variant="ornate" />
          </div>

          <div className="flex items-center gap-4">
            {/* Perspective Selector */}
            <div className="hidden md:flex items-center gap-3 bg-white/60 backdrop-blur-md px-5 py-3 rounded-[1.5rem] border border-white shadow-sm ring-1 ring-slate-100">
              <span className="text-[9px] font-black text-[#B8860B] uppercase tracking-widest">Perspective</span>
              <select value={mode} onChange={(e) => setMode(e.target.value as CoachingMode)} className="bg-transparent border-none text-[11px] font-black focus:ring-0 cursor-pointer text-slate-800">
                <option value="Manager">Manager Mode</option>
                <option value="Self">Self-Coach Mode</option>
              </select>
            </div>
            {/* Persona Selector */}
            <div className="hidden md:flex items-center gap-3 bg-white/60 backdrop-blur-md px-5 py-3 rounded-[1.5rem] border border-white shadow-sm ring-1 ring-slate-100">
              <span className="text-[9px] font-black text-[#B8860B] uppercase tracking-widest">Coach Tone</span>
              <select value={persona} onChange={(e) => setPersona(e.target.value as LeadershipPersona)} className="bg-transparent border-none text-[11px] font-black focus:ring-0 cursor-pointer text-slate-800">
                {PERSONAS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </header>

        {/* Tab switcher */}
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
          <nav className="flex bg-white/80 backdrop-blur-2xl rounded-full p-2 border border-white/50 shadow-2xl ring-1 ring-slate-100">
            {(['input', 'report', 'chat'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-3.5 rounded-full text-[10px] font-black transition-all uppercase tracking-widest ${activeTab === tab ? 'bg-slate-900 text-white shadow-xl translate-y-[-2px]' : 'text-slate-400 hover:text-slate-600'}`}>
                {tab === 'input' ? (mode === 'Self' ? 'Reflect' : 'Pulse') : tab}
              </button>
            ))}
          </nav>
        </div>

        <main className="flex-1 overflow-y-auto px-6 lg:px-14 pb-48 custom-scrollbar relative z-20">
          {!activeId ? (
            <div className="h-full flex items-center justify-center text-center">
              <div className="max-w-lg">
                 <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter mb-6 leading-none">
                    {mode === 'Manager' ? 'Guide Your Team.' : 'Unleash Your Potential.'}
                 </h2>
                 <p className="text-slate-400 font-medium text-lg mb-12 px-10">Start a new coaching cycle to receive high-fidelity, empathetic insights.</p>
                 <button onClick={createNewEmployee} className="px-12 py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-[#B8860B] transition-all">Initiate Journey</button>
              </div>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto animate-in slide-in-from-bottom-8 duration-700">
              {activeTab === 'input' && (
                <div className="space-y-12">
                  <div className="space-y-2">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter">{mode === 'Manager' ? 'Engagement Diagnostic' : 'Self-Reflection Lab'}</h2>
                    <p className="text-slate-400 font-medium">{mode === 'Manager' ? `Synthesize the growth for ${data.employeeName}.` : 'Analyze your current headspace and output.'}</p>
                  </div>

                  <section className="glass-surface rounded-[3.5rem] p-10 lg:p-20 shadow-2xl shadow-indigo-50/40">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-[#B8860B] uppercase tracking-widest px-1">{mode === 'Manager' ? 'Colleague Identity' : 'My Public Identity'}</label>
                        <input className="w-full bg-white border border-slate-100 rounded-[1.75rem] px-10 py-7 text-sm font-bold text-slate-800" value={data.employeeName} onChange={e => setData({...data, employeeName: e.target.value})} placeholder="Name" />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-[#B8860B] uppercase tracking-widest px-1">{mode === 'Manager' ? 'Strategic Function' : 'Current Primary Focus'}</label>
                        <input className="w-full bg-white border border-slate-100 rounded-[1.75rem] px-10 py-7 text-sm font-bold text-slate-800" value={data.role} onChange={e => setData({...data, role: e.target.value})} placeholder="e.g. Design Lead" />
                      </div>
                    </div>

                    <div className="mb-16 space-y-6">
                      <label className="text-[10px] font-black text-[#B8860B] uppercase tracking-widest px-1">Behavioral Sentiment (The Pulse)</label>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <select value={data.sentiment} onChange={(e) => setData({...data, sentiment: e.target.value as SentimentType})} className="w-full bg-white border border-slate-100 rounded-[1.75rem] px-10 py-7 text-sm font-bold text-slate-800 appearance-none shadow-sm cursor-pointer">
                          {(Object.keys(SENTIMENT_MAP) as SentimentType[]).map(s => <option key={s} value={s}>{SENTIMENT_MAP[s].emoji} {s}</option>)}
                        </select>
                        <div className="lg:col-span-2">
                          <input className="w-full bg-white border border-slate-100 rounded-[1.75rem] px-10 py-7 text-sm font-bold text-slate-600 shadow-sm" placeholder={mode === 'Manager' ? "Describe their mood..." : "Describe your current mental state..."} value={data.sentimentNotes} onChange={e => setData({...data, sentimentNotes: e.target.value})} />
                        </div>
                      </div>
                    </div>

                    <div className="mb-16">
                      <label className="text-[10px] font-black text-[#B8860B] uppercase tracking-widest mb-8 block">Quantifiables</label>
                      <div className="grid grid-cols-1 gap-6">
                        {data.metrics.map((m, idx) => (
                          <div key={idx} className="bg-white/50 border border-white rounded-[2rem] p-8 flex items-center gap-10 shadow-sm">
                            <div className="flex-1"><input className="w-full bg-transparent border-none text-sm font-black text-slate-800" value={m.label} onChange={e => updateMetric(idx, 'label', e.target.value)} /></div>
                            <div className="flex items-center gap-4">
                               <input type="number" className="w-20 bg-slate-50 border border-slate-100 rounded-xl px-2 py-2 text-center text-xs font-bold" value={m.value} onChange={e => updateMetric(idx, 'value', Number(e.target.value))} />
                               <span className="text-slate-300">/</span>
                               <input type="number" className="w-20 bg-slate-50 border border-slate-100 rounded-xl px-2 py-2 text-center text-xs font-bold" value={m.target} onChange={e => updateMetric(idx, 'target', Number(e.target.value))} />
                               <span className="text-[10px] font-bold text-slate-400">{m.unit}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button onClick={handleGenerateReport} disabled={isLoading || !data.employeeName} className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-[#B8860B] flex items-center justify-center gap-6 group disabled:opacity-50">
                      {isLoading ? 'Synthesizing Insight...' : (mode === 'Self' ? 'Self-Reflect' : 'Analyze Performance')}
                    </button>
                  </section>
                </div>
              )}

              {activeTab === 'report' && activeReport && (
                <div className="space-y-16 pb-40">
                  <header className="space-y-3">
                    <h2 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter leading-none">{activeReport.metricSnapshot?.employeeName}</h2>
                    <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-sm">{activeReport.metricSnapshot?.role}</p>
                  </header>

                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
                    <div className="xl:col-span-8 space-y-12">
                      <section className="bg-slate-900 rounded-[4rem] p-12 lg:p-20 text-white relative overflow-hidden shadow-3xl group">
                        <h3 className="text-[10px] font-black text-[#B8860B] uppercase tracking-[0.4em] mb-10">{mode === 'Self' ? 'Self-Reflection Deep Dive' : 'Strategic Assessment'}</h3>
                        <p className="text-4xl lg:text-5xl font-black leading-[1.1] tracking-tight relative z-10">"{activeReport.sentimentInsight}"</p>
                      </section>
                      <div className="glass-surface rounded-[4rem] p-12 lg:p-20 space-y-20">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
                          <div>
                             <h4 className="text-[10px] font-black text-[#B8860B] uppercase tracking-[0.3em] mb-6">{mode === 'Self' ? 'Internal Landscape' : 'Performance Gaps'}</h4>
                             <p className="text-lg font-bold text-slate-700 leading-relaxed italic">{activeReport.overallAssessment}</p>
                          </div>
                          <div>
                             <h4 className="text-[10px] font-black text-[#B8860B] uppercase tracking-[0.3em] mb-6">Strategic Pivot</h4>
                             <p className="text-lg font-bold text-slate-700">{activeReport.performanceGapAnalysis}</p>
                          </div>
                        </div>
                        <div className="pt-20 border-t border-slate-100">
                          <MetricChart metrics={activeReport.metricSnapshot?.metrics || []} />
                        </div>
                      </div>
                    </div>

                    <div className="xl:col-span-4 space-y-12 xl:sticky xl:top-32 transition-all">
                      <div className="bg-[#B8860B]/5 border border-[#B8860B]/10 rounded-[3rem] p-12 text-center">
                         <h4 className="text-[9px] font-black text-[#B8860B] uppercase tracking-[0.3em] mb-4">{mode === 'Self' ? 'Self-Compassion Check' : 'Empathy Insight'}</h4>
                         <p className="text-base font-bold text-slate-700/60 italic leading-relaxed">"{activeReport.empathyNote}"</p>
                      </div>
                      <div className="bg-white border border-slate-100 rounded-[3.5rem] p-12">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-10 text-center">{mode === 'Self' ? 'Introspection Prompts' : 'Conversation Architecture'}</h4>
                        <div className="space-y-6">
                          {activeReport.coachingConversationStarters.map((s, i) => (
                            <div key={i} className="p-8 bg-slate-50/50 border border-slate-100 rounded-[2rem] text-sm font-bold text-slate-600 italic">"{s}"</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <ActionPlan actions={activeReport.actionPlan} n8nPayload={activeReport.n8nPayload} />
                </div>
              )}

              {activeTab === 'chat' && (
                <div className="bg-white rounded-[4rem] h-[80vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden relative">
                  <div className="bg-slate-900 p-12 text-white shrink-0">
                    <h3 className="font-black text-xl tracking-tight">{mode === 'Self' ? 'Inner Growth Advisory' : 'Leadership Counsel'}</h3>
                    <p className="text-[10px] font-black text-[#B8860B] uppercase tracking-[0.4em] mt-1">{persona} Mode</p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-12 space-y-10 bg-slate-50/10 custom-scrollbar">
                    {messages.map((m, i) => (
                      <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] p-10 rounded-[3rem] text-sm leading-relaxed font-bold ${m.role === 'user' ? 'bg-slate-900 text-white' : 'bg-white text-slate-800 border border-slate-100'}`}>{m.text}</div>
                      </div>
                    ))}
                  </div>
                  <div className="p-10 bg-white border-t border-slate-100 flex gap-6">
                    <input className="flex-1 bg-slate-50/50 border-2 border-slate-100 rounded-[2.5rem] px-10 py-7 text-sm font-bold text-slate-700" placeholder="Discuss the strategy..." value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && (async () => {
                      if (!inputValue.trim() || isLoading) return;
                      const msg = inputValue; setInputValue('');
                      setMessages(prev => [...prev, { role: 'user', text: msg, timestamp: new Date() }]);
                      setIsLoading(true);
                      try {
                        const res = await gemini.chatWithLeader([], msg, persona, language, mode);
                        setMessages(prev => [...prev, { role: 'model', text: res, timestamp: new Date() }]);
                      } catch (err) { }
                      setIsLoading(false);
                    })()} />
                    <button className="bg-slate-900 text-white w-24 rounded-[2.5rem] flex items-center justify-center hover:bg-[#B8860B] transition-all"><svg className="w-7 h-7 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg></button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} data={data} report={activeReport} persona={persona} />
    </div>
  );
};

export default App;
