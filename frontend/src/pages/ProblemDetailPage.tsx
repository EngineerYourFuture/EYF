import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';

interface Problem {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  examples?: Array<{ input: string; output: string; explanation?: string }>;
  constraints?: string[];
  category?: string;
}
interface SubmitResponse {
  verdict: string;
  message?: string;
  submissionId?: string;
}

const diffColor = (d: string) => {
  if (d === 'easy') return 'text-green-400 bg-green-400/10';
  if (d === 'medium') return 'text-yellow-400 bg-yellow-400/10';
  return 'text-red-400 bg-red-400/10';
};

export function ProblemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const session = getSession();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('// Write your solution here\n\nfunction solution() {\n  \n}');
  const [language, setLanguage] = useState('javascript');
  const [submitting, setSubmitting] = useState(false);
  const [verdict, setVerdict] = useState<SubmitResponse | null>(null);

  useEffect(() => {
    if (!id || !session?.accessToken) return;
    setLoading(true);
    apiRequest<Problem>(`/problems/${id}`, { token: session.accessToken })
      .then(setProblem)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, session?.accessToken]);

  const onSubmit = async () => {
    if (!id || !session?.accessToken) return;
    setSubmitting(true);
    setVerdict(null);
    try {
      const res = await apiRequest<SubmitResponse>(`/problems/${id}/submit`, {
        method: 'POST',
        token: session.accessToken,
        body: { code, language },
      });
      setVerdict(res);
    } catch {
      setVerdict({ verdict: 'error', message: 'Submission failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const verdictColor = (v: string) => {
    if (v === 'accepted') return 'text-green-400 bg-green-400/10 border-green-400/30';
    if (v === 'wrong_answer') return 'text-red-400 bg-red-400/10 border-red-400/30';
    return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
  };

  return (
    <div className="dark min-h-screen bg-surface text-on-surface flex flex-col">
      {/* Top nav */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#131313]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-8">
        <div className="flex items-center gap-4">
          <Link to="/app/problems" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
            <Icon name="arrow_back" size={20} />
            <span className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold">Problems</span>
          </Link>
          <span className="text-zinc-700">/</span>
          {problem && (
            <span className="text-on-surface text-sm font-semibold truncate max-w-xs">{problem.title}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-surface-container-low rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-zinc-300 border-none focus:outline-none"
          >
            {['javascript', 'python', 'java', 'cpp', 'c'].map((l) => (
              <option key={l} value={l}>{l.toUpperCase()}</option>
            ))}
          </select>
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="bg-primary-container text-white font-bold px-6 py-2 rounded-full text-[11px] uppercase tracking-widest hover:brightness-110 transition-all active:scale-95 disabled:opacity-60 flex items-center gap-2"
          >
            {submitting ? 'Submitting...' : 'Submit'}
            <Icon name="send" size={16} />
          </button>
        </div>
      </header>

      {/* Two-panel layout */}
      <div className="flex pt-16 h-screen">
        {/* Left: problem */}
        <div className="w-1/2 overflow-y-auto p-8 border-r border-white/5">
          {loading ? (
            <div className="text-zinc-500 mt-8">Loading problem...</div>
          ) : problem ? (
            <div>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-black tracking-tighter mb-3">{problem.title}</h1>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${diffColor(problem.difficulty)}`}>
                      {problem.difficulty}
                    </span>
                    {problem.category && (
                      <span className="px-3 py-1 bg-surface-container-highest rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        {problem.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="prose prose-invert max-w-none">
                <div className="text-on-surface-variant leading-relaxed whitespace-pre-wrap text-sm mb-8">
                  {problem.description}
                </div>
              </div>

              {problem.examples && problem.examples.length > 0 && (
                <div className="space-y-4 mb-8">
                  <h3 className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500">Examples</h3>
                  {problem.examples.map((ex, i) => (
                    <div key={i} className="bg-surface-container rounded-xl p-6">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Example {i + 1}</p>
                      <div className="font-mono text-sm">
                        <p className="text-zinc-300"><span className="text-zinc-500">Input: </span>{ex.input}</p>
                        <p className="text-zinc-300"><span className="text-zinc-500">Output: </span>{ex.output}</p>
                        {ex.explanation && (
                          <p className="text-zinc-400 text-xs mt-2">{ex.explanation}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {problem.constraints && problem.constraints.length > 0 && (
                <div>
                  <h3 className="font-['Inter'] uppercase tracking-widest text-[10px] font-bold text-zinc-500 mb-3">Constraints</h3>
                  <ul className="space-y-1">
                    {problem.constraints.map((c, i) => (
                      <li key={i} className="text-zinc-400 text-sm font-mono">{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-zinc-500 mt-8">Problem not found.</div>
          )}
        </div>

        {/* Right: editor */}
        <div className="w-1/2 flex flex-col">
          <div className="flex-1 relative">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-full bg-surface-container-lowest text-on-surface font-mono text-sm p-6 resize-none focus:outline-none border-none leading-relaxed"
              spellCheck={false}
            />
          </div>
          {verdict && (
            <div className={`p-6 border-t border-white/5 flex items-center gap-4 ${verdictColor(verdict.verdict)}`}>
              <Icon name={verdict.verdict === 'accepted' ? 'check_circle' : 'cancel'} size={24} filled />
              <div>
                <p className="font-bold uppercase tracking-widest text-[11px]">{verdict.verdict.replace('_', ' ')}</p>
                {verdict.message && <p className="text-xs opacity-70 mt-0.5">{verdict.message}</p>}
              </div>
              {verdict.submissionId && (
                <Link
                  to={`/app/submissions`}
                  className="ml-auto text-[10px] font-bold uppercase tracking-widest hover:underline"
                >
                  View Submission →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
