import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';

const ALGORITHMS = [
  'Bubble Sort', 'Merge Sort', 'Quick Sort', 'Binary Search',
  'BFS', 'DFS', 'Dijkstra', 'Floyd Warshall',
];

interface TraceStep {
  step: number;
  description: string;
  state: Record<string, unknown>;
  highlight?: number[];
}
interface TraceResponse {
  id?: string;
  steps: TraceStep[];
  algorithm?: string;
}

export function VisualizerPage() {
  const session = getSession();
  const [algorithm, setAlgorithm] = useState('Bubble Sort');
  const [code, setCode] = useState('[64, 34, 25, 12, 22, 11, 90]');
  const [steps, setSteps] = useState<TraceStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trace = async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    setError(null);
    setSteps([]);
    setCurrentStep(0);
    try {
      const res = await apiRequest<TraceResponse>('/visualizer/trace', {
        method: 'POST',
        token: session.accessToken,
        body: { algorithm, input: code },
      });
      setSteps(res.steps ?? []);
    } catch {
      setError('Failed to generate trace. Check your input.');
    } finally {
      setLoading(false);
    }
  };

  const step = steps[currentStep];

  return (
    <div className="dark min-h-screen bg-surface text-on-surface">
      {/* Top nav */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#131313]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-8">
        <div className="flex items-center gap-4">
          <Link to="/app/dashboard" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
            <Icon name="arrow_back" size={20} />
          </Link>
          <span className="text-2xl font-black tracking-tighter text-[#E82127]">EYF</span>
          <span className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500 ml-4">Algorithm Visualizer</span>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value)}
            className="bg-surface-container-low rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-zinc-300 border-none focus:outline-none"
          >
            {ALGORITHMS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <button
            onClick={trace}
            disabled={loading}
            className="bg-primary-container text-white font-bold px-6 py-2 rounded-full text-[11px] uppercase tracking-widest hover:brightness-110 transition-all active:scale-95 disabled:opacity-60 flex items-center gap-2"
          >
            {loading ? 'Tracing...' : 'Run Trace'}
            <Icon name="play_arrow" size={18} />
          </button>
        </div>
      </header>

      <div className="pt-16 flex h-screen">
        {/* Input panel */}
        <div className="w-1/2 border-r border-white/5 flex flex-col">
          <div className="p-6 border-b border-white/5">
            <p className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500 mb-2">Input Data</p>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 bg-surface-container-lowest text-on-surface font-mono text-sm p-6 resize-none focus:outline-none border-none"
            placeholder="Enter input data (array, graph, etc.)"
          />
          {error && (
            <div className="p-4 text-error text-sm flex items-center gap-2 border-t border-white/5">
              <Icon name="error_outline" size={18} />
              {error}
            </div>
          )}
        </div>

        {/* Trace panel */}
        <div className="w-1/2 flex flex-col">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <p className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500">
              Step {steps.length > 0 ? currentStep + 1 : 0} of {steps.length}
            </p>
            {steps.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                  disabled={currentStep === 0}
                  className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-30"
                >
                  <Icon name="navigate_before" size={20} />
                </button>
                <button
                  onClick={() => setCurrentStep((s) => Math.min(steps.length - 1, s + 1))}
                  disabled={currentStep === steps.length - 1}
                  className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-30"
                >
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
                <span className="px-3 py-1 bg-primary-container/20 text-primary-container rounded-full text-[10px] font-bold uppercase tracking-widest">
                  Step {step.step}
                </span>
                <p className="text-on-surface mt-4 text-lg font-semibold">{step.description}</p>
              </div>
              <div className="bg-surface-container rounded-xl p-6">
                <p className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500 mb-4">State</p>
                <pre className="font-mono text-sm text-on-surface-variant overflow-x-auto">
                  {JSON.stringify(step.state, null, 2)}
                </pre>
              </div>
              {/* Progress bar */}
              <div className="mt-6">
                <div className="h-1.5 bg-surface-container-highest rounded-full">
                  <div
                    className="h-full bg-primary-container rounded-full transition-all"
                    style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
