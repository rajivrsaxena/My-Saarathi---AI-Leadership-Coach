
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

  const deleteRecord = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Remove this profile from the pool?")) {
      const filtered = records.filter(r => r.id !== id);
      setRecords(filtered);
      if (activeId === id) {
        setActiveId(null);
        setData({ employeeName: '', role: '', metrics: INITIAL_METRICS, observations: [], context: '', sentiment: 'Eager', sentimentNotes: '' });
      }
    }
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
              <h2 className="text-[10px] font-bold text-[#B8860B] uppercase tracking-[0.35em] font-sans opacity-70">
                {mode === 'Manager' ? 'My Huddle' : 'Growth Sanctuary'}
              </h2>
              <p className="text-2xl font-bold text-slate-900 tracking-tight font-serif">
                {mode === 'Manager' ? 'Colleague Pool' : 'Personal Journey'}
              </p>
            </div>
            <button onClick={createNewEmployee} className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center hover:bg-[#B8860B] shadow-lg active:scale-95 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
            {records.map(record => (
              <button key={record.id} onClick={() => loadEmployee(record)} className={`w-full text-left p-5 rounded-[2.25rem] transition-all border group relative ${activeId === record.id ? 'bg-white border-white shadow-2xl ring-1 ring-slate-100' : 'bg-transparent border-transparent hover:bg-white/40'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center font-bold text-sm font-sans ${activeId === record.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}>{record.data.employeeName.charAt(0)}</div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-800 text-sm truncate font-serif">{record.data.employeeName}</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate font-sans opacity-70">{record.data.role || 'Strategic Focus'}</p>
                  </div>
                  <button onClick={(e) => deleteRecord(record.id, e)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen relative z-10 overflow-hidden">
        <header className="px-8 py-8 lg:px-14 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-6">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl text-slate-400 border border-slate-100 shadow-sm transition-all hover:text-[#B8860B] hover:shadow-md active:scale-95">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <Logo size="md" showText={true} variant="ornate" />
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 bg-white/70 backdrop-blur-md px-5 py-3 rounded-[1.5rem] border border-white shadow-sm">
              <span className="text-[9px] font-bold text-[#B8860B] uppercase tracking-[0.2em] font-sans">Perspective</span>
              <select value={mode} onChange={(e) => setMode(e.target.value as CoachingMode)} className="bg-transparent border-none text-[11px] font-bold focus:ring-0 cursor-pointer text-slate-800 font-sans">
                <option value="Manager">Manager Mode</option>
                <option value="Self">Self-Coach Mode</option>
              </select>
            </div>
            <div className="hidden md:flex items-center gap-3 bg-white/70 backdrop-blur-md px-5 py-3 rounded-[1.5rem] border border-white shadow-sm">
              <span className="text-[9px] font-bold text-[#B8860B] uppercase tracking-[0.2em] font-sans">Coach Tone</span>
              <select value={persona} onChange={(e) => setPersona(e.target.value as LeadershipPersona)} className="bg-transparent border-none text-[11px] font-bold focus:ring-0 cursor-pointer text-slate-800 font-sans">
                {PERSONAS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </header>

        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
          <nav className="flex bg-white/90 backdrop-blur-2xl rounded-full p-2 border border-white shadow-2xl">
            {(['input', 'report', 'chat'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-10 py-3.5 rounded-full text-[10px] font-bold transition-all uppercase tracking-[0.25em] font-sans ${activeTab === tab ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
                {tab === 'input' ? (mode === 'Self' ? 'Reflect' : 'Pulse') : tab}
              </button>
            ))}
          </nav>
        </div>

        <main className="flex-1 overflow-y-auto px-6 lg:px-14 pb-48 custom-scrollbar relative z-20">
          {!activeId ? (
            <div className="h-full flex items-center justify-center text-center">
              <div className="max-w-lg">
                 <h2 className="text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight mb-8 leading-[1.1] font-serif">
                    {mode === 'Manager' ? 'Lead with Vision.' : 'Grow with Clarity.'}
                 </h2>
                 <p className="text-slate-400 font-medium text-lg mb-12 px-10 font-sans leading-relaxed">Select a profile from the pool or initiate a new strategic cycle.</p>
                 <button onClick={createNewEmployee} className="px-14 py-7 bg-slate-900 text-white rounded-[2rem] font-bold text-xs uppercase tracking-[0.35em] shadow-2xl hover:bg-[#B8860B] transition-all font-sans active:scale-95">Start Journey</button>
              </div>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto animate-in slide-in-from-bottom-8 duration-700">
              {activeTab === 'input' && (
                <div className="space-y-12">
                  <div className="space-y-2">
                    <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight font-serif">{mode === 'Manager' ? 'Diagnostic Phase' : 'Self-Audit'}</h2>
                    <p className="text-slate-400 font-medium font-sans text-lg">{mode === 'Manager' ? `Evaluating the strategic impact of ${data.employeeName}.` : 'Capturing current internal and external output state.'}</p>
                  </div>

                  <section className="glass rounded-[4rem] p-10 lg:p-20 shadow-2xl shadow-indigo-100/20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
                      <div className="space-y-4">
                        <label className="text-[10px] font-bold text-[#B8860B] uppercase tracking-[0.3em] px-1 font-sans opacity-70">{mode === 'Manager' ? 'Subject Identity' : 'My Public Identity'}</label>
                        <input className="w-full bg-white border border-slate-100 rounded-[1.75rem] px-10 py-7 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-[#B8860B]/15 outline-none font-sans shadow-sm transition-all" value={data.employeeName} onChange={e => setData({...data, employeeName: e.target.value})} placeholder="Name" />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-bold text-[#B8860B] uppercase tracking-[0.3em] px-1 font-sans opacity-70">{mode === 'Manager' ? 'Strategic Role' : 'Primary Domain'}</label>
                        <input className="w-full bg-white border border-slate-100 rounded-[1.75rem] px-10 py-7 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-[#B8860B]/15 outline-none font-sans shadow-sm transition-all" value={data.role} onChange={e => setData({...data, role: e.target.value})} placeholder="e.g. Executive Director" />
                      </div>
                    </div>

                    <div className="mb-16 space-y-6">
                      <label className="text-[10px] font-bold text-[#B8860B] uppercase tracking-[0.3em] px-1 font-sans opacity-70">Behavioral Sentiment</label>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <select value={data.sentiment} onChange={(e) => setData({...data, sentiment: e.target.value as SentimentType})} className="w-full bg-white border border-slate-100 rounded-[1.75rem] px-10 py-7 text-sm font-semibold text-slate-800 appearance-none shadow-sm cursor-pointer font-sans focus:ring-2 focus:ring-[#B8860B]/15 outline-none transition-all">
                          {(Object.keys(SENTIMENT_MAP) as SentimentType[]).map(s => <option key={s} value={s}>{SENTIMENT_MAP[s].emoji} {s}</option>)}
                        </select>
                        <div className="lg:col-span-2">
                          <input className="w-full bg-white border border-slate-100 rounded-[1.75rem] px-10 py-7 text-sm font-semibold text-slate-600 shadow-sm focus:ring-2 focus:ring-[#B8860B]/15 outline-none font-sans transition-all" placeholder={mode === 'Manager' ? "Narrative on current energy..." : "Direct reflection on headspace..."} value={data.sentimentNotes} onChange={e => setData({...data, sentimentNotes: e.target.value})} />
                        </div>
                      </div>
                    </div>

                    <div className="mb-16">
                      <label className="text-[10px] font-bold text-[#B8860B] uppercase tracking-[0.3em] mb-8 block font-sans opacity-70">Quantitative Performance</label>
                      <div className="grid grid-cols-1 gap-6">
                        {data.metrics.map((m, idx) => (
                          <div key={idx} className="bg-white/60 border border-white rounded-[2.25rem] p-8 flex items-center gap-10 shadow-sm transition-all hover:bg-white">
                            <div className="flex-1"><input className="w-full bg-transparent border-none text-sm font-bold text-slate-800 focus:ring-0 font-sans" value={m.label} onChange={e => updateMetric(idx, 'label', e.target.value)} /></div>
                            <div className="flex items-center gap-5">
                               <input type="number" className="w-20 bg-slate-50 border border-slate-100 rounded-xl px-2 py-2.5 text-center text-xs font-bold font-sans" value={m.value} onChange={e => updateMetric(idx, 'value', Number(e.target.value))} />
                               <span className="text-slate-300 font-light">/</span>
                               <input type="number" className="w-20 bg-slate-50 border border-slate-100 rounded-xl px-2 py-2.5 text-center text-xs font-bold font-sans" value={m.target} onChange={e => updateMetric(idx, 'target', Number(e.target.value))} />
                               <span className="text-[10px] font-bold text-slate-400 font-sans tracking-widest">{m.unit}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button onClick={handleGenerateReport} disabled={isLoading || !data.employeeName} className="w-full py-9 bg-slate-900 text-white rounded-[2.75rem] font-bold text-xs uppercase tracking-[0.45em] shadow-2xl hover:bg-[#B8860B] flex items-center justify-center gap-6 group disabled:opacity-50 transition-all font-sans active:scale-[0.99]">
                      {isLoading ? (
                        <>
                          <div className="w-6 h-6 border-2 border-white/20 border-t-white animate-spin rounded-full"></div>
                          <span className="font-serif italic capitalize tracking-normal text-lg">Thinking deeply...</span>
                        </>
                      ) : (mode === 'Self' ? 'Synthesize Reflection' : 'Synthesize Report')}
                    </button>
                  </section>
                </div>
              )}

              {activeTab === 'report' && activeReport && (
                <div className="space-y-16 pb-40">
                  <header className="space-y-4">
                    <h2 className="text-6xl lg:text-8xl font-bold text-slate-900 tracking-tight leading-none font-serif">{activeReport.metricSnapshot?.employeeName}</h2>
                    <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-sm font-sans opacity-70">{activeReport.metricSnapshot?.role}</p>
                  </header>

                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
                    <div className="xl:col-span-8 space-y-12">
                      <section className="bg-slate-900 rounded-[4.5rem] p-12 lg:p-24 text-white relative overflow-hidden shadow-3xl">
                        <h3 className="text-[10px] font-bold text-[#B8860B] uppercase tracking-[0.4em] mb-12 font-sans opacity-80">{mode === 'Self' ? 'The Inner Brief' : 'Strategic Overview'}</h3>
                        <p className="text-4xl lg:text-6xl font-medium leading-[1.25] tracking-tight relative z-10 font-serif italic">"{activeReport.sentimentInsight}"</p>
                      </section>
                      <div className="glass rounded-[4.5rem] p-12 lg:p-24 space-y-24">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-24">
                          <div className="fade-in-wisdom">
                             <h4 className="text-[10px] font-bold text-[#B8860B] uppercase tracking-[0.35em] mb-8 font-sans opacity-70">{mode === 'Self' ? 'Internal Landscape' : 'Performance Context'}</h4>
                             <p className="text-2xl font-medium text-slate-700 leading-relaxed italic font-serif opacity-90">{activeReport.overallAssessment}</p>
                          </div>
                          <div>
                             <h4 className="text-[10px] font-bold text-[#B8860B] uppercase tracking-[0.35em] mb-8 font-sans opacity-70">Strategic Evolution</h4>
                             <p className="text-xl font-medium text-slate-700 leading-relaxed font-sans">{activeReport.performanceGapAnalysis}</p>
                          </div>
                        </div>
                        <div className="pt-24 border-t border-slate-100">
                          <MetricChart metrics={activeReport.metricSnapshot?.metrics || []} />
                        </div>

                        {activeReport.groundingSources && activeReport.groundingSources.length > 0 && (
                          <div className="pt-24 border-t border-slate-100">
                             <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.35em] mb-10 font-sans">Research Foundations</h4>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                               {activeReport.groundingSources.map((source, i) => (
                                 <a key={i} href={source.uri} target="_blank" rel="noopener noreferrer" className="p-7 bg-white border border-slate-100 rounded-3xl hover:border-[#B8860B]/40 transition-all flex items-center justify-between group shadow-sm hover:shadow-lg">
                                   <div className="min-w-0 pr-4">
                                     <span className="block text-sm font-bold text-slate-800 truncate font-sans">{source.title}</span>
                                     <span className="block text-[11px] text-slate-400 truncate mt-1.5 font-sans font-medium">{new URL(source.uri).hostname}</span>
                                   </div>
                                   <div className="shrink-0 w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-[#B8860B] group-hover:bg-[#B8860B]/5 transition-all">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                                   </div>
                                 </a>
                               ))}
                             </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="xl:col-span-4 space-y-12 xl:sticky xl:top-36">
                      <div className="bg-[#B8860B]/5 border border-[#B8860B]/15 rounded-[3.5rem] p-14 text-center">
                         <h4 className="text-[10px] font-bold text-[#B8860B] uppercase tracking-[0.35em] mb-6 font-sans opacity-70">{mode === 'Self' ? 'Compassion Anchor' : 'Empathy Diagnostic'}</h4>
                         <p className="text-lg font-medium text-slate-700/80 italic leading-relaxed font-serif">"{activeReport.empathyNote}"</p>
                      </div>
                      <div className="bg-white border border-slate-100 rounded-[4rem] p-14 shadow-sm border-white shadow-xl shadow-slate-200/40">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.35em] mb-12 text-center font-sans opacity-70">{mode === 'Self' ? 'Internal Inquiry' : 'Strategic Dialogue'}</h4>
                        <div className="space-y-8">
                          {activeReport.coachingConversationStarters.map((s, i) => (
                            <div key={i} className="p-9 bg-slate-50/70 border border-slate-100 rounded-[2.5rem] text-sm font-medium text-slate-600 italic font-serif leading-relaxed">"{s}"</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <ActionPlan actions={activeReport.actionPlan} n8nPayload={activeReport.n8nPayload} />
                </div>
              )}

              {activeTab === 'chat' && (
                <div className="bg-white rounded-[4.5rem] h-[85vh] flex flex-col shadow-3xl border border-white overflow-hidden relative">
                  <div className="bg-slate-900 p-14 text-white shrink-0 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-3xl tracking-tight font-serif">{mode === 'Self' ? 'Growth Counsel' : 'Leadership Counsel'}</h3>
                      <p className="text-[10px] font-bold text-[#B8860B] uppercase tracking-[0.45em] mt-2 font-sans opacity-80">{persona} Mode</p>
                    </div>
                    <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                       <Logo size="sm" variant="neural" className="opacity-80" />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-14 space-y-12 bg-slate-50/30 custom-scrollbar font-sans">
                    {messages.map((m, i) => (
                      <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-10 rounded-[3.5rem] text-base leading-relaxed font-medium shadow-sm ${m.role === 'user' ? 'bg-slate-900 text-white shadow-2xl' : 'bg-white text-slate-800 border border-slate-100'}`}>{m.text}</div>
                      </div>
                    ))}
                    {isLoading && (
                       <div className="flex justify-start">
                         <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] flex gap-2.5 shadow-sm">
                           <div className="w-2 h-2 bg-[#B8860B] rounded-full animate-bounce"></div>
                           <div className="w-2 h-2 bg-[#B8860B] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                           <div className="w-2 h-2 bg-[#B8860B] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                         </div>
                       </div>
                    )}
                  </div>
                  <div className="p-12 bg-white border-t border-slate-100 flex gap-6 font-sans items-center">
                    <input className="flex-1 bg-slate-50/80 border-2 border-transparent rounded-[3rem] px-10 py-8 text-base font-semibold text-slate-800 outline-none focus:border-[#B8860B]/15 focus:bg-white transition-all shadow-inner" placeholder="Evolve the strategy..." value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && (async () => {
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
                    <button className="bg-slate-900 text-white w-24 h-24 rounded-full flex items-center justify-center hover:bg-[#B8860B] transition-all shadow-2xl active:scale-90 group">
                      <svg className="w-8 h-8 rotate-90 group-hover:translate-y-[-2px] transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                    </button>
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
