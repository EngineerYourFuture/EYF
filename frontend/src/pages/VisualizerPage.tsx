import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { ApiError, apiRequest } from '../lib/api';
import { getSession } from '../lib/session';
import { useUser } from '../contexts/UserContext';

// ─── Trace types ─────────────────────────────────────────────────────────────

const ALGORITHMS = [
  'Bubble Sort', 'Merge Sort', 'Quick Sort', 'Binary Search',
  'BFS', 'DFS', 'Dijkstra', 'Floyd Warshall',
];

// ─── Client-side algorithm traces ────────────────────────────────────────────

function parseIntArray(s: string): number[] {
  try { return JSON.parse(s); } catch { return [64, 34, 25, 12, 22, 11, 90]; }
}

function bubbleSortTrace(arr: number[]): TraceStep[] {
  const a = [...arr]; const steps: TraceStep[] = [];
  steps.push({ step: 0, description: `Initial array: [${a.join(', ')}]`, state: { array: [...a] }, highlight: [] });
  for (let i = 0; i < a.length - 1; i++) {
    for (let j = 0; j < a.length - i - 1; j++) {
      steps.push({ step: steps.length, description: `Compare a[${j}]=${a[j]} and a[${j+1}]=${a[j+1]}`, state: { array: [...a] }, highlight: [j, j+1] });
      if (a[j]! > a[j+1]!) {
        [a[j], a[j+1]] = [a[j+1]!, a[j]!];
        steps.push({ step: steps.length, description: `Swap → [${a.join(', ')}]`, state: { array: [...a] }, highlight: [j, j+1] });
      }
    }
    steps.push({ step: steps.length, description: `Pass ${i+1} done — a[${a.length-1-i}]=${a[a.length-1-i]} is in place`, state: { array: [...a] }, highlight: Array.from({length: i+1}, (_, k) => a.length-1-k) });
  }
  steps.push({ step: steps.length, description: `Sorted: [${a.join(', ')}]`, state: { array: [...a] }, highlight: a.map((_, i) => i) });
  return steps;
}

function quickSortTrace(arr: number[]): TraceStep[] {
  const a = [...arr]; const steps: TraceStep[] = [];
  steps.push({ step: 0, description: `Initial: [${a.join(', ')}]`, state: { array: [...a] }, highlight: [] });
  function partition(lo: number, hi: number) {
    const pivot = a[hi]!;
    steps.push({ step: steps.length, description: `Pivot = ${pivot} at index ${hi}`, state: { array: [...a] }, highlight: [hi] });
    let i = lo - 1;
    for (let j = lo; j < hi; j++) {
      steps.push({ step: steps.length, description: `Compare a[${j}]=${a[j]} with pivot ${pivot}`, state: { array: [...a] }, highlight: [j, hi] });
      if (a[j]! <= pivot) {
        i++;
        [a[i], a[j]] = [a[j]!, a[i]!];
        if (i !== j) steps.push({ step: steps.length, description: `Swap a[${i}] and a[${j}] → [${a.join(', ')}]`, state: { array: [...a] }, highlight: [i, j] });
      }
    }
    [a[i+1], a[hi]] = [a[hi]!, a[i+1]!];
    steps.push({ step: steps.length, description: `Pivot ${pivot} placed at index ${i+1}`, state: { array: [...a] }, highlight: [i+1] });
    return i + 1;
  }
  function qs(lo: number, hi: number) {
    if (lo >= hi) return;
    const pi = partition(lo, hi);
    qs(lo, pi - 1);
    qs(pi + 1, hi);
  }
  qs(0, a.length - 1);
  steps.push({ step: steps.length, description: `Sorted: [${a.join(', ')}]`, state: { array: [...a] }, highlight: a.map((_, i) => i) });
  return steps;
}

function binarySearchTrace(arr: number[], target: number): TraceStep[] {
  const a = [...arr].sort((x, y) => x - y); const steps: TraceStep[] = [];
  steps.push({ step: 0, description: `Sorted array: [${a.join(', ')}], searching for ${target}`, state: { array: [...a] }, highlight: [] });
  let lo = 0, hi = a.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    steps.push({ step: steps.length, description: `left=${lo}, right=${hi}, mid=${mid}, a[mid]=${a[mid]}`, state: { array: [...a], lo, hi, mid }, highlight: [lo, mid, hi] });
    if (a[mid] === target) {
      steps.push({ step: steps.length, description: `Found ${target} at index ${mid}!`, state: { array: [...a], result: mid }, highlight: [mid] });
      return steps;
    } else if (a[mid]! < target) {
      steps.push({ step: steps.length, description: `${a[mid]} < ${target} → search right half`, state: { array: [...a] }, highlight: [] });
      lo = mid + 1;
    } else {
      steps.push({ step: steps.length, description: `${a[mid]} > ${target} → search left half`, state: { array: [...a] }, highlight: [] });
      hi = mid - 1;
    }
  }
  steps.push({ step: steps.length, description: `${target} not found in array`, state: { array: [...a] }, highlight: [] });
  return steps;
}

function localTrace(algorithm: string, input: string): TraceStep[] | null {
  const arr = parseIntArray(input);
  if (algorithm === 'Bubble Sort') return bubbleSortTrace(arr);
  if (algorithm === 'Quick Sort')  return quickSortTrace(arr);
  if (algorithm === 'Binary Search') return binarySearchTrace(arr, arr[0]! + 1); // search for a number close to first
  return null;
}

interface TraceStep {
  step: number;
  description: string;
  state: Record<string, unknown>;
  highlight?: number[];
}
interface TraceResponse {
  steps: TraceStep[];
}

// ─── Guide types ─────────────────────────────────────────────────────────────

type Stage = 'understand' | 'constraints' | 'brute_force' | 'pattern' | 'approach' | 'code';

interface GuideResponse {
  stage: Stage;
  question: string;
  insight: string;
  codeHint: string;
}

interface Turn {
  stage: Stage;
  question: string;
  insight: string;
  codeHint: string;
  userReply: string; // filled in after student replies
}

const STAGES: { key: Stage; label: string; icon: string; color: string; desc: string }[] = [
  { key: 'understand',   label: 'Understand',  icon: 'visibility',     color: 'text-sky-400',     desc: 'What does the problem ask?' },
  { key: 'constraints',  label: 'Constraints', icon: 'rule',           color: 'text-violet-400',  desc: 'Input size & complexity' },
  { key: 'brute_force',  label: 'Brute Force', icon: 'fitness_center', color: 'text-amber-400',   desc: 'Simplest possible solution' },
  { key: 'pattern',      label: 'Pattern',     icon: 'pattern',        color: 'text-pink-400',    desc: 'Recognise the structure' },
  { key: 'approach',     label: 'Approach',    icon: 'route',          color: 'text-emerald-400', desc: 'Design the strategy' },
  { key: 'code',         label: 'Code',        icon: 'code',           color: 'text-primary-container', desc: 'Write it yourself' },
];

type Tab = 'trace' | 'guide';

// ─── Component ───────────────────────────────────────────────────────────────

export function VisualizerPage() {
  const session = getSession();
  const { fireXP } = useUser();
  const [tab, setTab] = useState<Tab>('trace');

  // Trace state
  const [algorithm, setAlgorithm] = useState('Bubble Sort');
  const [code, setCode] = useState('[64, 34, 25, 12, 22, 11, 90]');
  const [steps, setSteps] = useState<TraceStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [traceLoading, setTraceLoading] = useState(false);
  const [traceError, setTraceError] = useState<string | null>(null);

  // Guide state
  const [problem, setProblem] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [currentStage, setCurrentStage] = useState<Stage>('understand');
  const [insights, setInsights] = useState<string[]>([]);
  const [userInput, setUserInput] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [guideLoading, setGuideLoading] = useState(false);
  const [guideError, setGuideError] = useState<string | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const guidanceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    guidanceRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns]);

  // ─── Trace ────────────────────────────────────────────────────────────────

  const trace = async () => {
    setTraceLoading(true);
    setTraceError(null);
    setSteps([]);
    setCurrentStep(0);
    // Try local trace first (instant, no backend needed)
    const local = localTrace(algorithm, code);
    if (local) {
      setSteps(local);
      fireXP(10, `${algorithm} trace generated!`);
      setTraceLoading(false);
      return;
    }
    if (!session?.accessToken) {
      setTraceError('Sign in to trace Dijkstra, BFS, DFS, and Floyd-Warshall via AI.');
      setTraceLoading(false);
      return;
    }
    try {
      const res = await apiRequest<TraceResponse>('/visualizer/trace', {
        method: 'POST',
        token: session.accessToken,
        body: { algorithm, input: code },
      });
      setSteps(res.steps ?? []);
      fireXP(10, `${algorithm} trace generated!`);
    } catch {
      setTraceError('Failed to generate trace. Check your input.');
    } finally {
      setTraceLoading(false);
    }
  };

  // ─── Guide ────────────────────────────────────────────────────────────────

  // Build message history from turns for the backend
  const buildMessages = (allTurns: Turn[]) => {
    const msgs: { role: 'user' | 'assistant'; content: string }[] = [];
    for (const t of allTurns) {
      if (t.question) msgs.push({ role: 'assistant', content: JSON.stringify({ stage: t.stage, question: t.question, insight: t.insight, codeHint: t.codeHint }) });
      if (t.userReply) msgs.push({ role: 'user', content: t.userReply });
    }
    return msgs;
  };

  const callGuide = async (messages: { role: 'user' | 'assistant'; content: string }[]) => {
    if (!session?.accessToken) return null;
    const res = await apiRequest<GuideResponse>('/visualizer/guide', {
      method: 'POST',
      token: session.accessToken,
      body: { problem, messages },
    });
    return res;
  };

  const startSession = async () => {
    if (!problem.trim()) return;
    setSessionStarted(true);
    setTurns([]);
    setInsights([]);
    setCurrentStage('understand');
    setGuideLoading(true);
    setGuideError(null);
    try {
      const res = await callGuide([]);
      if (!res) return;
      setCurrentStage(res.stage);
      setTurns([{ stage: res.stage, question: res.question, insight: res.insight, codeHint: res.codeHint, userReply: '' }]);
      if (res.insight) setInsights([res.insight]);
    } catch (err) {
      setGuideError(err instanceof ApiError ? err.message : 'AI guide is unavailable right now.');
    } finally {
      setGuideLoading(false);
    }
  };

  const sendReply = async () => {
    const reply = userInput.trim();
    if (!reply || guideLoading) return;
    setUserInput('');
    setGuideLoading(true);
    setGuideError(null);

    const updatedTurns = turns.map((t, i) =>
      i === turns.length - 1 ? { ...t, userReply: reply } : t
    );
    setTurns(updatedTurns);

    try {
      const messages = buildMessages(updatedTurns);
      const res = await callGuide(messages);
      if (!res) return;
      setCurrentStage(res.stage);
      setTurns([...updatedTurns, { stage: res.stage, question: res.question, insight: res.insight, codeHint: res.codeHint, userReply: '' }]);
      if (res.insight) setInsights((prev) => [...prev.filter((i) => i !== res.insight), res.insight]);
      if (res.codeHint && !studentCode) setStudentCode(res.codeHint);
      if (res.stage === 'code') fireXP(30, 'Algorithm solved with AI guide!');
    } catch (err) {
      setGuideError(err instanceof ApiError ? err.message : 'AI guide is unavailable right now.');
    } finally {
      setGuideLoading(false);
    }
  };

  const resetGuide = () => {
    setSessionStarted(false);
    setTurns([]);
    setInsights([]);
    setCurrentStage('understand');
    setProblem('');
    setUserInput('');
    setStudentCode('');
    setGuideError(null);
  };

  const stageIndex = STAGES.findIndex((s) => s.key === currentStage);
  const latestTurn = turns[turns.length - 1];
  const step = steps[currentStep];

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="dark min-h-screen bg-surface text-on-surface">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#131313]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-8">
        <div className="flex items-center gap-4">
          <Link to="/app/dashboard" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
            <Icon name="arrow_back" size={20} />
          </Link>
          <span className="text-2xl font-black tracking-tighter text-[#E82127]">EYF</span>
          <span className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500 ml-4">Algorithm Visualizer</span>
        </div>

        <div className="flex items-center gap-1 bg-surface-container-low rounded-full p-1">
          <button type="button" onClick={() => setTab('trace')}
            className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${tab === 'trace' ? 'bg-primary-container text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
            Trace
          </button>
          <button type="button" onClick={() => setTab('guide')}
            className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${tab === 'guide' ? 'bg-primary-container text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
            Guide Me
          </button>
        </div>

        {tab === 'trace' && (
          <div className="flex items-center gap-3">
            <select value={algorithm} onChange={(e) => setAlgorithm(e.target.value)}
              className="bg-surface-container-low rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-zinc-300 border-none focus:outline-none">
              {ALGORITHMS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <button type="button" onClick={() => void trace()} disabled={traceLoading}
              className="bg-primary-container text-white font-bold px-6 py-2 rounded-full text-[11px] uppercase tracking-widest hover:brightness-110 transition-all active:scale-95 disabled:opacity-60 flex items-center gap-2">
              {traceLoading ? 'Tracing...' : 'Run Trace'}
              <Icon name="play_arrow" size={18} />
            </button>
          </div>
        )}
        {tab === 'guide' && sessionStarted && (
          <button type="button" onClick={resetGuide}
            className="text-zinc-500 hover:text-zinc-300 text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 transition-colors">
            <Icon name="restart_alt" size={16} />
            New Problem
          </button>
        )}
        {tab === 'guide' && !sessionStarted && <div />}
      </header>

      {/* ── TRACE TAB ── */}
      {tab === 'trace' && (
        <div className="pt-16 flex h-screen">
          <div className="w-1/2 border-r border-white/5 flex flex-col">
            <div className="p-6 border-b border-white/5">
              <p className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500">Input Data</p>
            </div>
            <textarea value={code} onChange={(e) => setCode(e.target.value)}
              className="flex-1 bg-surface-container-lowest text-on-surface font-mono text-sm p-6 resize-none focus:outline-none border-none"
              placeholder="Enter input data (array, graph, etc.)" />
            {traceError && (
              <div className="p-4 text-error text-sm flex items-center gap-2 border-t border-white/5">
                <Icon name="error_outline" size={18} />{traceError}
              </div>
            )}
          </div>
          <div className="w-1/2 flex flex-col">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <p className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500">
                Step {steps.length > 0 ? currentStep + 1 : 0} of {steps.length}
              </p>
              {steps.length > 0 && (
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setCurrentStep((s) => Math.max(0, s - 1))} disabled={currentStep === 0}
                    className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-30">
                    <Icon name="navigate_before" size={20} />
                  </button>
                  <button type="button" onClick={() => setCurrentStep((s) => Math.min(steps.length - 1, s + 1))} disabled={currentStep === steps.length - 1}
                    className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-30">
                    <Icon name="navigate_next" size={20} />
                  </button>
                </div>
              )}
            </div>
            {steps.length === 0 && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Icon name="play_circle" size={64} className="text-zinc-700 mx-auto mb-4" />
                  <p className="text-zinc-500">Run a trace to see step-by-step visualization</p>
                </div>
              </div>
            )}
            {steps.length > 0 && step && (
              <div className="flex-1 overflow-y-auto p-8">
                <div className="mb-6">
                  <span className="px-3 py-1 bg-primary-container/20 text-primary-container rounded-full text-[10px] font-bold uppercase tracking-widest">Step {step.step}</span>
                  <p className="text-on-surface mt-4 text-lg font-semibold">{step.description}</p>
                </div>
                <div className="bg-surface-container rounded-xl p-6">
                  <p className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500 mb-4">State</p>
                  <pre className="font-mono text-sm text-on-surface-variant overflow-x-auto">{JSON.stringify(step.state, null, 2)}</pre>
                </div>
                <div className="mt-6">
                  <div className="h-1.5 bg-surface-container-highest rounded-full">
                    <div className="h-full bg-primary-container rounded-full transition-all" style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── GUIDE TAB ── */}
      {tab === 'guide' && (
        <div className="pt-16 flex flex-col h-screen overflow-hidden">

          {/* Stage roadmap */}
          {sessionStarted && (
            <div className="flex-shrink-0 border-b border-white/5 bg-[#131313]/60 backdrop-blur px-8 py-4">
              <div className="flex items-center gap-0 max-w-4xl mx-auto">
                {STAGES.map((s, i) => {
                  const done = i < stageIndex;
                  const active = i === stageIndex;
                  let stageOpacity: string;
                  if (active) { stageOpacity = 'opacity-100'; }
                  else if (done) { stageOpacity = 'opacity-70'; }
                  else { stageOpacity = 'opacity-30'; }
                  let stageBg: string;
                  if (active) {
                    stageBg = `bg-primary-container/20 ring-2 ring-primary-container ${s.color}`;
                  } else if (done) {
                    stageBg = 'bg-surface-container-high text-zinc-400';
                  } else {
                    stageBg = 'bg-surface-container text-zinc-600';
                  }
                  return (
                    <div key={s.key} className="flex items-center flex-1">
                      <div className={`flex flex-col items-center gap-1 flex-shrink-0 transition-all ${stageOpacity}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${stageBg}`}>
                          {done
                            ? <Icon name="check" size={14} />
                            : <Icon name={s.icon} size={14} />}
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-widest ${active ? s.color : 'text-zinc-500'}`}>{s.label}</span>
                      </div>
                      {i < STAGES.length - 1 && (
                        <div className={`flex-1 h-px mx-1 transition-all ${done ? 'bg-primary-container/40' : 'bg-white/5'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Main content */}
          <div className="flex flex-1 min-h-0">

            {/* ── Left: Problem + Insights ── */}
            <div className="w-2/5 border-r border-white/5 flex flex-col">
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <p className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500">Problem</p>
                {!sessionStarted && problem.trim() && (
                  <button type="button" onClick={() => void startSession()}
                    className="bg-primary-container text-white font-bold px-4 py-1.5 rounded-full text-[11px] uppercase tracking-widest hover:brightness-110 transition-all active:scale-95 flex items-center gap-1.5">
                    <Icon name="psychology" size={14} />
                    Guide Me
                  </button>
                )}
              </div>

              {sessionStarted ? (
                <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                  {/* Problem text */}
                  <div className="p-5 border-b border-white/5 overflow-y-auto max-h-48 flex-shrink-0">
                    <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap font-mono">{problem}</p>
                  </div>

                  {/* Insights unlocked */}
                  <div className="flex-1 overflow-y-auto p-5">
                    <p className="font-['Inter'] uppercase tracking-widest text-[9px] font-bold text-zinc-600 mb-3">Insights Unlocked</p>
                    {insights.length === 0 ? (
                      <p className="text-zinc-600 text-xs">Nothing yet — answer the first question to start building your understanding.</p>
                    ) : (
                      <div className="space-y-2">
                        {insights.map((insight) => (
                          <div key={insight} className="flex items-start gap-2 bg-surface-container rounded-lg px-3 py-2">
                            <span className="text-emerald-400 mt-0.5 flex-shrink-0 text-xs">✓</span>
                            <p className="text-xs text-zinc-300 leading-relaxed">{insight}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Code scratchpad — appears at approach/code stage */}
                  {(currentStage === 'approach' || currentStage === 'code') && (
                    <div className="border-t border-white/5 flex-shrink-0">
                      <div className="px-5 pt-4 pb-1 flex items-center justify-between">
                        <p className="font-['Inter'] uppercase tracking-widest text-[9px] font-bold text-zinc-600">Your Code</p>
                        <span className="text-[9px] text-zinc-600 uppercase tracking-widest">Write it yourself</span>
                      </div>
                      <textarea
                        value={studentCode}
                        onChange={(e) => setStudentCode(e.target.value)}
                        rows={8}
                        placeholder="// Start writing your solution here…"
                        className="w-full bg-surface-container-lowest text-on-surface font-mono text-xs p-4 resize-none focus:outline-none border-none"
                        spellCheck={false}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <textarea value={problem} onChange={(e) => setProblem(e.target.value)}
                    className="flex-1 bg-surface-container-lowest text-on-surface font-mono text-sm p-5 resize-none focus:outline-none border-none"
                    placeholder={`Paste any DSA problem here…\n\nExample:\n"Given an integer array nums and an integer target, return indices of the two numbers such that they add up to target."`} />
                  {!problem.trim() && (
                    <div className="p-5 border-t border-white/5 space-y-2">
                      {['Paste any DSA problem above', 'AI asks you guiding questions — not answers', 'Discover the logic yourself, then write the code'].map((tip) => (
                        <div key={tip} className="flex items-start gap-2 text-[11px] text-zinc-500">
                          <span className="text-primary-container mt-0.5 flex-shrink-0">→</span>{tip}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ── Right: Guidance ── */}
            <div className="flex-1 flex flex-col min-h-0">
              {sessionStarted ? (
                <>
                  {/* Guidance scroll area */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#111111]">

                    {/* Previous turns (compact) */}
                    {turns.slice(0, -1).map((turn) => (
                      <PastTurnCard key={turn.question.slice(0, 40)} turn={turn} />
                    ))}

                    {/* Current guidance card */}
                    {guideLoading && turns.length === 0 && <ThinkingCard />}
                    {latestTurn && (
                      <ActiveGuidanceCard
                        turn={latestTurn}
                        stageMeta={STAGES.find((s) => s.key === latestTurn.stage) ?? STAGES[0]}
                      />
                    )}
                    {guideLoading && turns.length > 0 && <ThinkingCard />}

                    {guideError && (
                      <div className="flex items-center gap-2 text-error text-sm px-2 py-3 bg-error/10 rounded-xl">
                        <Icon name="error_outline" size={16} />
                        {guideError}
                      </div>
                    )}

                    <div ref={guidanceRef} />
                  </div>

                  {/* Reply input */}
                  <div className="border-t border-white/5 p-4 flex-shrink-0">
                    <div className="flex items-end gap-3 bg-surface-container rounded-xl px-4 py-3">
                      <textarea
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendReply(); } }}
                        rows={2}
                        disabled={guideLoading}
                        placeholder="Share your thinking… (Enter to send)"
                        className="flex-1 bg-transparent text-sm text-on-surface placeholder-zinc-600 resize-none focus:outline-none"
                      />
                      <button type="button" onClick={() => void sendReply()} disabled={!userInput.trim() || guideLoading}
                        className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center hover:brightness-110 transition-all active:scale-95 disabled:opacity-30 flex-shrink-0">
                        <Icon name="send" size={16} className="text-white" />
                      </button>
                    </div>
                    <p className="text-[10px] text-zinc-600 mt-2 px-1">The AI will never write your code — only guide your thinking.</p>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center max-w-sm">
                    <div className="w-16 h-16 bg-primary-container/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                      <Icon name="psychology" size={32} className="text-primary-container" />
                    </div>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      Paste a problem on the left, then hit{' '}
                      <span className="text-primary-container font-bold">Guide Me</span>.
                      <br /><br />
                      The AI walks you through 6 thinking stages — from understanding the problem to writing the code — asking questions instead of giving answers.
                    </p>
                    <div className="mt-6 grid grid-cols-3 gap-2">
                      {STAGES.map((s) => (
                        <div key={s.key} className="bg-surface-container rounded-xl p-3 text-center">
                          <Icon name={s.icon} size={16} className={`mx-auto mb-1 ${s.color}`} />
                          <p className={`text-[9px] font-bold uppercase tracking-widest ${s.color}`}>{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ActiveGuidanceCard({ turn, stageMeta }: Readonly<{
  turn: Turn;
  stageMeta: typeof STAGES[0];
}>) {
  return (
    <div className="rounded-2xl overflow-hidden border border-zinc-700/60 bg-zinc-900">
      {/* Stage badge */}
      <div className="px-5 pt-4 pb-3 flex items-center gap-3 border-b border-zinc-700/40">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-zinc-800 ${stageMeta.color}`}>
          <Icon name={stageMeta.icon} size={16} />
        </div>
        <div>
          <p className={`text-xs font-black uppercase tracking-widest ${stageMeta.color}`}>{stageMeta.label}</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">{stageMeta.desc}</p>
        </div>
        <div className="ml-auto">
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-zinc-800 ${stageMeta.color}`}>
            Stage {STAGES.findIndex(s => s.key === stageMeta.key) + 1} / {STAGES.length}
          </span>
        </div>
      </div>

      {/* Question — the core content */}
      <div className="px-5 py-5">
        <p className="text-white text-base font-medium leading-relaxed">{turn.question}</p>
      </div>

      {/* Code scaffold — code stage only */}
      {turn.codeHint && (
        <div className="mx-5 mb-5 rounded-xl bg-zinc-950 border border-zinc-700/40 overflow-hidden">
          <div className="px-4 py-2 border-b border-zinc-700/40 flex items-center gap-2">
            <Icon name="code" size={12} className="text-zinc-500" />
            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Scaffold — you fill in the logic</p>
          </div>
          <pre className="font-mono text-sm text-zinc-300 px-4 py-3 leading-relaxed overflow-x-auto">{turn.codeHint}</pre>
        </div>
      )}

      {/* Student reply */}
      {turn.userReply && (
        <div className="border-t border-zinc-700/40 bg-zinc-800/50 px-5 py-3 flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-primary-container/30 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Icon name="person" size={11} className="text-primary-container" />
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">{turn.userReply}</p>
        </div>
      )}
    </div>
  );
}

function PastTurnCard({ turn }: Readonly<{ turn: Turn }>) {
  const meta = STAGES.find((s) => s.key === turn.stage) ?? STAGES[0];
  return (
    <div className="rounded-xl bg-zinc-800/60 border border-zinc-700/40 px-4 py-3 opacity-60">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon name={meta.icon} size={12} className={meta.color} />
        <p className={`text-[9px] font-bold uppercase tracking-widest ${meta.color}`}>{meta.label}</p>
        <Icon name="check_circle" size={12} className="text-emerald-400 ml-auto" />
      </div>
      <p className="text-xs text-zinc-300 line-clamp-2">{turn.question}</p>
      {turn.userReply && (
        <p className="text-xs text-zinc-500 mt-1 line-clamp-1 border-t border-zinc-700/40 pt-1">You: {turn.userReply}</p>
      )}
    </div>
  );
}

function ThinkingCard() {
  return (
    <div className="rounded-2xl bg-surface-container border border-white/5 px-5 py-4 flex items-center gap-3">
      <div className="w-7 h-7 rounded-full bg-primary-container/20 flex items-center justify-center flex-shrink-0">
        <Icon name="psychology" size={14} className="text-primary-container" />
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}
