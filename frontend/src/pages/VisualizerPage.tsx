import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';

// ─── Trace types ────────────────────────────────────────────────────────────

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

// ─── Guide types ─────────────────────────────────────────────────────────────

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

type Tab = 'trace' | 'guide';

export function VisualizerPage() {
  const session = getSession();
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [guideLoading, setGuideLoading] = useState(false);
  const [guideError, setGuideError] = useState<string | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Trace logic ──────────────────────────────────────────────────────────

  const trace = async () => {
    if (!session?.accessToken) return;
    setTraceLoading(true);
    setTraceError(null);
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
      setTraceError('Failed to generate trace. Check your input.');
    } finally {
      setTraceLoading(false);
    }
  };

  // ─── Guide logic ──────────────────────────────────────────────────────────

  const sendToGuide = async (nextMessages: ChatMessage[]) => {
    if (!session?.accessToken) return;
    setGuideLoading(true);
    setGuideError(null);
    try {
      const res = await apiRequest<{ message: string }>('/visualizer/guide', {
        method: 'POST',
        token: session.accessToken,
        body: { problem, messages: nextMessages },
      });
      setMessages([...nextMessages, { role: 'assistant', content: res.message }]);
    } catch {
      setGuideError('AI guide is unavailable right now.');
    } finally {
      setGuideLoading(false);
    }
  };

  const startGuideSession = () => {
    if (!problem.trim()) return;
    setSessionStarted(true);
    setMessages([]);
    void sendToGuide([]);
  };

  const sendUserMessage = () => {
    const text = userInput.trim();
    if (!text || guideLoading) return;
    const next: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setUserInput('');
    void sendToGuide(next);
  };

  const resetGuide = () => {
    setSessionStarted(false);
    setMessages([]);
    setGuideError(null);
    setProblem('');
    setUserInput('');
  };

  const step = steps[currentStep];

  // ─── Render ───────────────────────────────────────────────────────────────

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

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-surface-container-low rounded-full p-1">
          <button
            type="button"
            onClick={() => setTab('trace')}
            className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${
              tab === 'trace'
                ? 'bg-primary-container text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Trace
          </button>
          <button
            type="button"
            onClick={() => setTab('guide')}
            className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${
              tab === 'guide'
                ? 'bg-primary-container text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Guide Me
          </button>
        </div>

        {/* Trace controls */}
        {tab === 'trace' && (
          <div className="flex items-center gap-3">
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              className="bg-surface-container-low rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-zinc-300 border-none focus:outline-none"
            >
              {ALGORITHMS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <button
              type="button"
              onClick={() => void trace()}
              disabled={traceLoading}
              className="bg-primary-container text-white font-bold px-6 py-2 rounded-full text-[11px] uppercase tracking-widest hover:brightness-110 transition-all active:scale-95 disabled:opacity-60 flex items-center gap-2"
            >
              {traceLoading ? 'Tracing...' : 'Run Trace'}
              <Icon name="play_arrow" size={18} />
            </button>
          </div>
        )}

        {/* Guide controls */}
        {tab === 'guide' && sessionStarted && (
          <button
            type="button"
            onClick={resetGuide}
            className="text-zinc-500 hover:text-zinc-300 text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 transition-colors"
          >
            <Icon name="restart_alt" size={16} />
            New Problem
          </button>
        )}
        {tab === 'guide' && !sessionStarted && <div />}
      </header>

      {/* ── TRACE TAB ── */}
      {tab === 'trace' && (
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
            {traceError && (
              <div className="p-4 text-error text-sm flex items-center gap-2 border-t border-white/5">
                <Icon name="error_outline" size={18} />
                {traceError}
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
                    type="button"
                    onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                    disabled={currentStep === 0}
                    className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-30"
                  >
                    <Icon name="navigate_before" size={20} />
                  </button>
                  <button
                    type="button"
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
      )}

      {/* ── GUIDE TAB ── */}
      {tab === 'guide' && (
        <div className="pt-16 flex h-screen">
          {/* Problem panel */}
          <div className="w-2/5 border-r border-white/5 flex flex-col">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <p className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500">Problem Statement</p>
                {sessionStarted && (
                  <p className="text-[10px] text-zinc-600 mt-1">Read-only during session</p>
                )}
              </div>
              {!sessionStarted && problem.trim() && (
                <button
                  type="button"
                  onClick={startGuideSession}
                  className="bg-primary-container text-white font-bold px-5 py-2 rounded-full text-[11px] uppercase tracking-widest hover:brightness-110 transition-all active:scale-95 flex items-center gap-2"
                >
                  <Icon name="psychology" size={16} />
                  Guide Me
                </button>
              )}
            </div>

            {!sessionStarted ? (
              <textarea
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                className="flex-1 bg-surface-container-lowest text-on-surface font-mono text-sm p-6 resize-none focus:outline-none border-none"
                placeholder={`Paste your DSA problem here…\n\nExample:\n"Given an array of integers, find two numbers such that they add up to a specific target. Return the indices of the two numbers."`}
              />
            ) : (
              <div className="flex-1 overflow-y-auto p-6">
                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap font-mono">{problem}</p>
              </div>
            )}

            {!sessionStarted && !problem.trim() && (
              <div className="p-6 border-t border-white/5">
                <div className="bg-surface-container rounded-xl p-4 space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary-container">How Guide Me works</p>
                  <ul className="space-y-2">
                    {[
                      "Paste any DSA problem above",
                      "The AI asks you guiding questions — not answers",
                      "You think, answer, and discover the logic yourself",
                      "Code comes from your own understanding, not copy-paste",
                    ].map((tip) => (
                      <li key={tip} className="flex items-start gap-2 text-[11px] text-zinc-400">
                        <span className="text-primary-container mt-0.5">→</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Chat panel */}
          <div className="flex-1 flex flex-col">
            {!sessionStarted ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-sm">
                  <div className="w-16 h-16 bg-primary-container/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon name="psychology" size={32} className="text-primary-container" />
                  </div>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Paste a problem on the left, then hit{' '}
                    <span className="text-primary-container font-bold">Guide Me</span>.
                    <br /><br />
                    The AI won't give you the answer — it'll ask questions that lead you to find it yourself.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.length === 0 && guideLoading && (
                    <ThinkingBubble />
                  )}
                  {messages.map((msg, i) => (
                    <ChatBubble key={i} msg={msg} />
                  ))}
                  {guideLoading && messages.length > 0 && <ThinkingBubble />}
                  {guideError && (
                    <div className="flex items-center gap-2 text-error text-sm px-2">
                      <Icon name="error_outline" size={16} />
                      {guideError}
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-white/5 p-4">
                  <div className="flex items-end gap-3 bg-surface-container rounded-xl px-4 py-3">
                    <textarea
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendUserMessage();
                        }
                      }}
                      rows={2}
                      disabled={guideLoading}
                      placeholder="Type your thoughts… (Enter to send, Shift+Enter for newline)"
                      className="flex-1 bg-transparent text-sm text-on-surface placeholder-zinc-600 resize-none focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={sendUserMessage}
                      disabled={!userInput.trim() || guideLoading}
                      className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center hover:brightness-110 transition-all active:scale-95 disabled:opacity-30 flex-shrink-0"
                    >
                      <Icon name="send" size={16} className="text-white" />
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-600 mt-2 px-1">
                    The AI will never write code or give the answer — only guide your thinking.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChatBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center flex-shrink-0 mt-1">
          <Icon name="psychology" size={16} className="text-primary-container" />
        </div>
      )}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-surface-container-high text-on-surface rounded-tr-sm'
            : 'bg-surface-container border-l-2 border-primary-container/40 text-on-surface-variant rounded-tl-sm'
        }`}
      >
        <p className="whitespace-pre-wrap">{msg.content}</p>
      </div>
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center flex-shrink-0 mt-1">
        <Icon name="psychology" size={16} className="text-primary-container" />
      </div>
      <div className="bg-surface-container border-l-2 border-primary-container/40 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}
