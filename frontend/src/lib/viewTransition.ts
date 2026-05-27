import type { NavigateFunction } from 'react-router-dom';

/**
 * Wraps a React Router navigate call in document.startViewTransition.
 * Falls back to an instant navigate in browsers that don't support the API.
 */
export function vtNavigate(navigate: NavigateFunction, path: string) {
  if (!document.startViewTransition) {
    navigate(path);
    return;
  }
  document.startViewTransition(() => { navigate(path); });
}
