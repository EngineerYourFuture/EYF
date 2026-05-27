import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../components/Icon';
import { ApiError, apiRequest } from '../lib/api';
import { getSession } from '../lib/session';
import { useUser } from '../contexts/UserContext';

// ─── Design tokens ────────────────────────────────────────────────────────────

const GLASS = {
  background: 'rgba(10,10,10,0.7)',
  border: '1px solid rgba(255,255,255,0.07)',
  backdropFilter: 'blur(16px)',
} as const;

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
      if (a[j] > a[j+1]) {
        [a[j], a[j+1]] = [a[j+1], a[j]];
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
    const pivot = a[hi];
    steps.push({ step: steps.length, description: `Pivot = ${pivot} at index ${hi}`, state: { array: [...a] }, highlight: [hi] });
    let i = lo - 1;
    for (let j = lo; j < hi; j++) {
      steps.push({ step: steps.length, description: `Compare a[${j}]=${a[j]} with pivot ${pivot}`, state: { array: [...a] }, highlight: [j, hi] });
      if (a[j] <= pivot) {
        i++;
        [a[i], a[j]] = [a[j], a[i]];
        if (i !== j) steps.push({ step: steps.length, description: `Swap a[${i}] and a[${j}] → [${a.join(', ')}]`, state: { array: [...a] }, highlight: [i, j] });
      }
    }
    [a[i+1], a[hi]] = [a[hi], a[i+1]];
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
    } else if (a[mid] < target) {
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
  if (algorithm === 'Binary Search') return binarySearchTrace(arr, arr[0] + 1);
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
  userReply: string;
}

const STAGES: { key: Stage; label: string; icon: string; color: string; desc: string }[] = [
  { key: 'understand',  label: 'Understand',  icon: 'visibility',     color: '#38bdf8', desc: 'What does the problem ask?' },
  { key: 'constraints', label: 'Constraints', icon: 'rule',           color: '#a78bfa', desc: 'Input size & complexity'     },
  { key: 'brute_force', label: 'Brute Force', icon: 'fitness_center', color: '#fbbf24', desc: 'Simplest possible solution'  },
  { key: 'pattern',     label: 'Pattern',     icon: 'pattern',        color: '#f472b6', desc: 'Recognise the structure'     },
  { key: 'approach',    label: 'Approach',    icon: 'route',          color: '#34d399', desc: 'Design the strategy'         },
  { key: 'code',        label: 'Code',        icon: 'code',           color: '#E82127', desc: 'Write it yourself'           },
];

type Tab = 'trace' | 'guide';

function buildGuideMessages(allTurns: Turn[]): { role: 'user' | 'assistant'; content: string }[] {
  const msgs: { role: 'user' | 'assistant'; content: string }[] = [];
  for (const t of allTurns) {
    if (t.question) msgs.push({ role: 'assistant', content: JSON.stringify({ stage: t.stage, question: t.question, insight: t.insight, codeHint: t.codeHint }) });
    if (t.userReply) msgs.push({ role: 'user', content: t.userReply });
  }
  return msgs;
}

async function performTrace(token: string, algorithm: string, input: string): Promise<TraceStep[]> {
  const res = await apiRequest<TraceResponse>('/visualizer/trace', {
    method: 'POST',
    token,
    body: { algorithm, input },
  });
  return res.steps ?? [];
}

async function performGuideCall(token: string, problem: string, messages: { role: 'user' | 'assistant'; content: string }[]): Promise<GuideResponse> {
  return apiRequest<GuideResponse>('/visualizer/guide', {
    method: 'POST',
    token,
    body: { problem, messages },
  });
}

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

  const trace = async () => {
    setTraceLoading(true);
    setTraceError(null);
    setSteps([]);
    setCurrentStep(0);
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
      const traceSteps = await performTrace(session.accessToken, algorithm, code);
      setSteps(traceSteps);
      fireXP(10, `${algorithm} trace generated!`);
    } catch {
      setTraceError('Failed to generate trace. Check your input.');
    } finally {
      setTraceLoading(false);
    }
  };

  const buildMessages = buildGuideMessages;

  const callGuide = async (messages: { role: 'user' | 'assistant'; content: string }[]) => {
    if (!session?.accessToken) return null;
    return performGuideCall(session.accessToken, problem, messages);
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
  const latestTurn = turns.at(-1);
  const step = steps[currentStep];

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#fff' }}>

      {/* Navbar */}
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, height: 64, background: 'rgba(8,8,8,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/app/dashboard" style={{ display: 'flex', alignItems: 'center', color: 'var(--t3)', transition: 'color 0.2s' }}>
            <Icon name="arrow_back" size={20} />
          </Link>
          <span style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.04em', color: '#E82127' }}>EYF</span>
          <span style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.15em', fontSize: '0.625rem', fontWeight: 700, color: 'rgba(255,255,255,0.25)', marginLeft: 16, textTransform: 'uppercase' }}>
            Algorithm Visualizer
          </span>
        </div>

        {/* Tab toggle */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 9999, padding: 4 }}>
          {(['trace', 'guide'] as const).map((v) => (
            <button key={v} type="button" onClick={() => setTab(v)}
              style={{
                padding: '6px 20px', borderRadius: 9999, fontSize: '0.6875rem', fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s', border: 'none',
                background: tab === v ? '#E82127' : 'transparent',
                color: tab === v ? '#fff' : 'rgba(255,255,255,0.3)',
                boxShadow: tab === v ? '0 0 16px rgba(232,33,39,0.35)' : 'none',
              }}>
              {v === 'trace' ? 'Trace' : 'Guide Me'}
            </button>
          ))}
        </div>

        {/* Trace controls */}
        {tab === 'trace' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <select value={algorithm} onChange={(e) => setAlgorithm(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9999, padding: '8px 16px', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', outline: 'none', cursor: 'pointer' }}>
              {ALGORITHMS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <motion.button type="button" onClick={() => void trace()} disabled={traceLoading}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              style={{
                background: 'linear-gradient(135deg,#E82127,#ff6b35)', color: '#fff', fontWeight: 700,
                padding: '8px 24px', borderRadius: 9999, fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase',
                display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 0 20px rgba(232,33,39,0.35)',
                cursor: traceLoading ? 'default' : 'pointer', opacity: traceLoading ? 0.6 : 1,
              }}>
              {traceLoading ? 'Tracing...' : 'Run Trace'}
              <Icon name="play_arrow" size={18} />
            </motion.button>
          </div>
        )}
        {tab === 'guide' && sessionStarted && (
          <button type="button" onClick={resetGuide}
            style={{ color: 'var(--t3)', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', background: 'transparent', border: 'none', transition: 'color 0.2s' }}>
            <Icon name="restart_alt" size={16} />
            New Problem
          </button>
        )}
        {tab === 'guide' && !sessionStarted && <div />}
      </header>

      {/* ── TRACE TAB ── */}
      {tab === 'trace' && (
        <div style={{ paddingTop: 64, display: 'flex', height: '100vh' }}>
          {/* Left: input */}
          <div style={{ width: '50%', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.12em', fontSize: '0.625rem', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>Input Data</p>
            </div>
            <textarea value={code} onChange={(e) => setCode(e.target.value)}
              style={{ flex: 1, background: 'rgba(0,0,0,0.3)', color: 'var(--t1)', fontFamily: 'monospace', fontSize: '0.875rem', padding: 24, resize: 'none', outline: 'none', border: 'none' }}
              placeholder="Enter input data (array, graph, etc.)" />
            {traceError && (
              <div style={{ padding: 16, color: '#f87171', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <Icon name="error_outline" size={18} />{traceError}
              </div>
            )}
          </div>

          {/* Right: steps */}
          <div style={{ width: '50%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.12em', fontSize: '0.625rem', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>
                Step {steps.length > 0 ? currentStep + 1 : 0} of {steps.length}
              </p>
              {steps.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button type="button" onClick={() => setCurrentStep((s) => Math.max(0, s - 1))} disabled={currentStep === 0}
                    style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)', border: 'none', cursor: currentStep === 0 ? 'default' : 'pointer', opacity: currentStep === 0 ? 0.3 : 1 }}>
                    <Icon name="navigate_before" size={20} />
                  </button>
                  <button type="button" onClick={() => setCurrentStep((s) => Math.min(steps.length - 1, s + 1))} disabled={currentStep === steps.length - 1}
                    style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)', border: 'none', cursor: currentStep === steps.length - 1 ? 'default' : 'pointer', opacity: currentStep === steps.length - 1 ? 0.3 : 1 }}>
                    <Icon name="navigate_next" size={20} />
                  </button>
                </div>
              )}
            </div>

            {steps.length === 0 && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <Icon name="play_circle" size={64} style={{ color: 'rgba(255,255,255,0.1)', display: 'block', margin: '0 auto 16px' }} />
                  <p style={{ color: 'var(--t3)', fontSize: '0.875rem' }}>Run a trace to see step-by-step visualization</p>
                </div>
              </div>
            )}

            {steps.length > 0 && step && (
              <AnimatePresence mode="wait">
                <motion.div key={currentStep}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ flex: 1, overflowY: 'auto', padding: 32 }}
                >
                  <div style={{ marginBottom: 24 }}>
                    <span style={{ padding: '4px 12px', background: 'rgba(232,33,39,0.1)', color: '#E82127', borderRadius: 9999, fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      Step {step.step}
                    </span>
                    <p style={{ color: '#fff', marginTop: 16, fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.5 }}>{step.description}</p>
                  </div>
                  <div style={{ ...GLASS, borderRadius: 16, padding: 24 }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.12em', fontSize: '0.625rem', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', marginBottom: 16 }}>State</p>
                    <pre style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', overflowX: 'auto', lineHeight: 1.7 }}>{JSON.stringify(step.state, null, 2)}</pre>
                  </div>
                  <div style={{ marginTop: 24 }}>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 999 }}>
                      <motion.div
                        style={{ height: '100%', background: 'linear-gradient(90deg,#E82127,#ff6b35)', borderRadius: 999 }}
                        animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                        transition={{ duration: 0.4 }}
                      />
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      )}

      {/* ── GUIDE TAB ── */}
      {tab === 'guide' && (
        <div style={{ paddingTop: 64, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

          {/* Stage roadmap */}
          {sessionStarted && (
            <div style={{ flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(8,8,8,0.7)', backdropFilter: 'blur(16px)', padding: '16px 32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, maxWidth: 768, margin: '0 auto' }}>
                {STAGES.map((s, i) => {
                  const done = i < stageIndex;
                  const active = i === stageIndex;
                  let stageOpacity: number;
                  if (active) { stageOpacity = 1; } else if (done) { stageOpacity = 0.7; } else { stageOpacity = 0.3; }
                  let stageBg: string;
                  if (active) { stageBg = `${s.color}22`; }
                  else if (done) { stageBg = 'rgba(255,255,255,0.08)'; }
                  else { stageBg = 'rgba(255,255,255,0.04)'; }
                  let stageBorder: string;
                  if (active) { stageBorder = `2px solid ${s.color}`; }
                  else if (done) { stageBorder = '2px solid rgba(255,255,255,0.15)'; }
                  else { stageBorder = '2px solid rgba(255,255,255,0.06)'; }
                  let stageColor: string;
                  if (active) { stageColor = s.color; } else if (done) { stageColor = 'rgba(255,255,255,0.5)'; } else { stageColor = 'rgba(255,255,255,0.2)'; }
                  return (
                    <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0, opacity: stageOpacity, transition: 'opacity 0.3s' }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s',
                          background: stageBg,
                          border: stageBorder,
                          color: stageColor,
                          boxShadow: active ? `0 0 12px ${s.color}44` : 'none',
                        }}>
                          {done ? <Icon name="check" size={14} /> : <Icon name={s.icon} size={14} />}
                        </div>
                        <span style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: active ? s.color : 'rgba(255,255,255,0.3)' }}>{s.label}</span>
                      </div>
                      {i < STAGES.length - 1 && (
                        <div style={{ flex: 1, height: 1, margin: '0 4px', marginBottom: 16, background: done ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)', transition: 'background 0.3s' }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Main content */}
          <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

            {/* Left: Problem + Insights */}
            <div style={{ width: '40%', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.12em', fontSize: '0.625rem', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>Problem</p>
                {!sessionStarted && problem.trim() && (
                  <motion.button type="button" onClick={() => void startSession()}
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontWeight: 700, padding: '6px 16px', borderRadius: 9999, fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', boxShadow: '0 0 16px rgba(99,102,241,0.3)' }}>
                    <Icon name="psychology" size={14} />
                    Guide Me
                  </motion.button>
                )}
              </div>

              {sessionStarted ? (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                  <div style={{ padding: 20, borderBottom: '1px solid rgba(255,255,255,0.05)', overflowY: 'auto', maxHeight: 192, flexShrink: 0 }}>
                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{problem}</p>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.1em', fontSize: '0.5625rem', fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', marginBottom: 12 }}>Insights Unlocked</p>
                    {insights.length === 0 ? (
                      <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem' }}>Nothing yet — answer the first question to start building your understanding.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {insights.map((insight) => (
                          <div key={insight} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.12)', borderRadius: 10, padding: '8px 12px' }}>
                            <span style={{ color: '#34d399', flexShrink: 0, fontSize: '0.75rem', marginTop: 1 }}>✓</span>
                            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>{insight}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {(currentStage === 'approach' || currentStage === 'code') && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
                      <div style={{ padding: '12px 20px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <p style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.1em', fontSize: '0.5625rem', fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>Your Code</p>
                        <span style={{ fontSize: '0.5625rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Write it yourself</span>
                      </div>
                      <textarea value={studentCode} onChange={(e) => setStudentCode(e.target.value)}
                        rows={8} placeholder="// Start writing your solution here…"
                        style={{ width: '100%', background: 'rgba(0,0,0,0.3)', color: 'var(--t1)', fontFamily: 'monospace', fontSize: '0.75rem', padding: 16, resize: 'none', outline: 'none', border: 'none', boxSizing: 'border-box' }}
                        spellCheck={false} />
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <textarea value={problem} onChange={(e) => setProblem(e.target.value)}
                    style={{ flex: 1, background: 'rgba(0,0,0,0.3)', color: 'var(--t1)', fontFamily: 'monospace', fontSize: '0.875rem', padding: 20, resize: 'none', outline: 'none', border: 'none' }}
                    placeholder={`Paste any DSA problem here…\n\nExample:\n"Given an integer array nums and an integer target, return indices of the two numbers such that they add up to target."`} />
                  {!problem.trim() && (
                    <div style={{ padding: 20, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {['Paste any DSA problem above', 'AI asks you guiding questions — not answers', 'Discover the logic yourself, then write the code'].map((tip) => (
                        <div key={tip} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.6875rem', color: 'var(--t3)' }}>
                          <span style={{ color: '#818cf8', flexShrink: 0, marginTop: 1 }}>→</span>{tip}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Right: Guidance */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              {sessionStarted ? (
                <>
                  <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20, background: 'rgba(4,4,4,0.8)' }}>
                    {turns.slice(0, -1).map((turn) => (
                      <PastTurnCard key={turn.question.slice(0, 40)} turn={turn} />
                    ))}
                    {guideLoading && turns.length === 0 && <ThinkingCard />}
                    {latestTurn && (
                      <ActiveGuidanceCard
                        turn={latestTurn}
                        stageMeta={STAGES.find((s) => s.key === latestTurn.stage) ?? STAGES[0]}
                      />
                    )}
                    {guideLoading && turns.length > 0 && <ThinkingCard />}
                    {guideError && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f87171', fontSize: '0.875rem', padding: 12, background: 'rgba(248,113,113,0.08)', borderRadius: 12 }}>
                        <Icon name="error_outline" size={16} />{guideError}
                      </div>
                    )}
                    <div ref={guidanceRef} />
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: 16, flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '12px 16px' }}>
                      <textarea value={userInput} onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendReply(); } }}
                        rows={2} disabled={guideLoading}
                        placeholder="Share your thinking… (Enter to send)"
                        style={{ flex: 1, background: 'transparent', fontSize: '0.875rem', color: '#fff', resize: 'none', outline: 'none', border: 'none', lineHeight: 1.6 }} />
                      <motion.button type="button" onClick={() => void sendReply()} disabled={!userInput.trim() || guideLoading}
                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        style={{ width: 36, height: 36, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (!userInput.trim() || guideLoading) ? 'default' : 'pointer', opacity: (!userInput.trim() || guideLoading) ? 0.3 : 1, flexShrink: 0, border: 'none', boxShadow: '0 0 12px rgba(99,102,241,0.4)' }}>
                        <Icon name="send" size={16} style={{ color: '#fff' }} />
                      </motion.button>
                    </div>
                    <p style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.2)', marginTop: 8, paddingLeft: 4 }}>The AI will never write your code — only guide your thinking.</p>
                  </div>
                </>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ textAlign: 'center', maxWidth: 400 }}>
                    <div style={{ width: 64, height: 64, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                      <Icon name="psychology" size={32} style={{ color: '#818cf8' }} />
                    </div>
                    <p style={{ color: 'var(--t2)', fontSize: '0.875rem', lineHeight: 1.8 }}>
                      Paste a problem on the left, then hit{' '}
                      <span style={{ color: '#818cf8', fontWeight: 700 }}>Guide Me</span>.
                      <br /><br />
                      The AI walks you through 6 thinking stages — from understanding the problem to writing the code — asking questions instead of giving answers.
                    </p>
                    <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      {STAGES.map((s) => (
                        <div key={s.key} style={{ ...GLASS, borderRadius: 14, padding: 12, textAlign: 'center' }}>
                          <Icon name={s.icon} size={16} style={{ color: s.color, display: 'block', margin: '0 auto 6px' }} />
                          <p style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: s.color }}>{s.label}</p>
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
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      style={{ borderRadius: 20, overflow: 'hidden', border: `1px solid ${stageMeta.color}25`, background: 'rgba(12,12,12,0.8)' }}>
      {/* Stage badge */}
      <div style={{ padding: '16px 20px 12px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${stageMeta.color}15` }}>
        <div style={{ width: 36, height: 36, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${stageMeta.color}15`, border: `1px solid ${stageMeta.color}30`, color: stageMeta.color, boxShadow: `0 0 12px ${stageMeta.color}30` }}>
          <Icon name={stageMeta.icon} size={16} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', color: stageMeta.color }}>{stageMeta.label}</p>
          <p style={{ fontSize: '0.625rem', color: 'var(--t3)', marginTop: 2 }}>{stageMeta.desc}</p>
        </div>
        <span style={{ padding: '3px 10px', borderRadius: 9999, fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: `${stageMeta.color}15`, color: stageMeta.color }}>
          Stage {STAGES.findIndex(s => s.key === stageMeta.key) + 1} / {STAGES.length}
        </span>
      </div>

      <div style={{ padding: '20px 20px 16px' }}>
        <p style={{ color: '#fff', fontSize: '1rem', fontWeight: 500, lineHeight: 1.7 }}>{turn.question}</p>
      </div>

      {turn.codeHint && (
        <div style={{ margin: '0 20px 20px', borderRadius: 14, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          <div style={{ padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="code" size={12} style={{ color: 'rgba(255,255,255,0.2)' }} />
            <p style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)' }}>Scaffold — you fill in the logic</p>
          </div>
          <pre style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', padding: '12px 16px', lineHeight: 1.7, overflowX: 'auto' }}>{turn.codeHint}</pre>
        </div>
      )}

      {turn.userReply && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', padding: '12px 20px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
            <Icon name="person" size={11} style={{ color: '#818cf8' }} />
          </div>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{turn.userReply}</p>
        </div>
      )}
    </motion.div>
  );
}

function PastTurnCard({ turn }: Readonly<{ turn: Turn }>) {
  const meta = STAGES.find((s) => s.key === turn.stage) ?? STAGES[0];
  return (
    <div style={{ borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '12px 16px', opacity: 0.55 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Icon name={meta.icon} size={12} style={{ color: meta.color }} />
        <p style={{ fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: meta.color }}>{meta.label}</p>
        <Icon name="check_circle" size={12} style={{ color: '#34d399', marginLeft: 'auto' }} />
      </div>
      <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{turn.question}</p>
      {turn.userReply && (
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)', marginTop: 6, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>You: {turn.userReply}</p>
      )}
    </div>
  );
}

function ThinkingCard() {
  return (
    <div style={{ borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name="psychology" size={14} style={{ color: '#818cf8' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {[0, 150, 300].map((delay) => (
          <span key={delay} style={{ width: 6, height: 6, background: 'rgba(255,255,255,0.3)', borderRadius: '50%', display: 'inline-block', animationDuration: '1s', animationIterationCount: 'infinite', animationName: 'bounce', animationDelay: `${delay}ms` }} className="animate-bounce" />
        ))}
      </div>
    </div>
  );
}
