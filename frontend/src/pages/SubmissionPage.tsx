import { useEffect, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { Icon } from '../components/Icon';
import { apiRequest } from '../lib/api';
import { getSession } from '../lib/session';

interface Submission {
  id: string;
  problemTitle?: string;
  problemId?: string;
  verdict: string;
  language: string;
  runtime?: string;
  memory?: string;
  createdAt: string;
}
interface SubmissionsResponse {
  items: Submission[];
}

const verdictColor = (v: string) => {
  if (v === 'accepted') return 'text-green-400 bg-green-400/10';
  if (v === 'wrong_answer') return 'text-red-400 bg-red-400/10';
  if (v === 'time_limit_exceeded') return 'text-yellow-400 bg-yellow-400/10';
  return 'text-zinc-400 bg-zinc-400/10';
};

export function SubmissionPage() {
  const session = getSession();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.accessToken) return;
    apiRequest<SubmissionsResponse>('/submissions', { token: session.accessToken })
      .then((d) => setSubmissions(d.items ?? []))
      .catch(() => setSubmissions([]))
      .finally(() => setLoading(false));
  }, [session?.accessToken]);

  return (
    <AppShell>
      <div className="pt-8">
        <div className="mb-12">
          <h1 className="text-5xl font-black tracking-tighter mb-3">Submissions <span className="text-primary-container">Log.</span></h1>
          <p className="text-on-surface-variant">Your complete submission history and verdicts.</p>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-12 gap-4 px-8 py-4 font-['Inter'] uppercase tracking-widest text-[10px] font-black text-zinc-500 mb-2">
          <div className="col-span-4">Problem</div>
          <div className="col-span-2 text-center">Verdict</div>
          <div className="col-span-2 text-center">Language</div>
          <div className="col-span-2 text-center">Runtime</div>
          <div className="col-span-2 text-center">Date</div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-zinc-500">Loading submissions...</div>
        ) : (submissions.length === 0 ? (
          <div className="text-center py-20">
            <Icon name="inbox" size={48} className="text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">No submissions yet. Start solving problems!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {submissions.map((s) => (
              <div key={s.id} className="grid grid-cols-12 gap-4 bg-surface-container rounded-xl px-8 py-5 hover:bg-surface-container-high transition-colors items-center">
                <div className="col-span-4">
                  <span className="font-semibold text-on-surface">{s.problemTitle ?? `Problem ${s.problemId}`}</span>
                </div>
                <div className="col-span-2 flex justify-center">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${verdictColor(s.verdict)}`}>
                    {s.verdict.replaceAll('_', ' ')}
                  </span>
                </div>
                <div className="col-span-2 text-center">
                  <span className="px-3 py-1 bg-surface-container-highest rounded-full text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    {s.language}
                  </span>
                </div>
                <div className="col-span-2 text-center text-zinc-400 text-sm">{s.runtime ?? '—'}</div>
                <div className="col-span-2 text-center text-zinc-500 text-xs">
                  {new Date(s.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </AppShell>
  );
}
