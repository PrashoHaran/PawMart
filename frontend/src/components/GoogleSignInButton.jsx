import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { loadGoogleIdentity } from '../lib/googleAuth';

// Google's official "Sign in with Google" button. Calls onCredential with the
// ID token (a signed JWT) for the backend to verify.
export default function GoogleSignInButton({ clientId, mode = 'signin', onCredential, onError }) {
  const containerRef = useRef(null);
  const handlers = useRef({ onCredential, onError });
  useLayoutEffect(() => {
    handlers.current = { onCredential, onError };
  });
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    loadGoogleIdentity()
      .then((gis) => {
        if (!active || !containerRef.current) return;
        gis.initialize({
          client_id: clientId,
          callback: (response) => handlers.current.onCredential(response.credential),
        });
        containerRef.current.innerHTML = '';
        gis.renderButton(containerRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'rectangular',
          text: mode === 'signup' ? 'signup_with' : 'continue_with',
          logo_alignment: 'center',
          width: Math.min(400, Math.max(200, containerRef.current.offsetWidth)),
        });
      })
      .catch((err) => {
        if (!active) return;
        setFailed(true);
        handlers.current.onError?.(err);
      });
    return () => {
      active = false;
    };
  }, [clientId, mode]);

  if (failed) {
    return <p className="text-sm text-gray-500 text-center">Google sign-in is unavailable right now.</p>;
  }
  return <div ref={containerRef} className="flex justify-center min-h-[44px]" />;
}
