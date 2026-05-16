import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setSession } from '../lib/session';

export function OAuthCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get('token');
    const email = params.get('email');
    const error = params.get('error');

    if (error || !token || !email) {
      navigate('/login?error=oauth_failed', { replace: true });
      return;
    }

    const isNew = params.get('isNew') === 'true';
    setSession({ accessToken: token, role: 'user', zone: 'public', email });
    navigate(isNew ? '/onboarding' : '/app/dashboard', { replace: true });
  }, [navigate, params]);

  return (
    <div className="dark bg-surface-dim min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-primary-container border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-400 text-sm">Signing you in…</p>
      </div>
    </div>
  );
}
