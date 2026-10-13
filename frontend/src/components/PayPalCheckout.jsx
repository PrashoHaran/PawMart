import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { loadPayPalSdk } from '../lib/paypal';

// Renders PayPal's Smart Payment Buttons. The callbacks are read through a
// ref so the buttons don't need re-rendering when the parent's state changes.
//   onCreate()          -> Promise<paypalOrderId>   (throw to stop checkout)
//   onApprove(orderId)  -> Promise<void>            (throw { restart: true } to let the buyer pick another method)
//   onCancel(orderId), onError(error)
export default function PayPalCheckout({ config, onCreate, onApprove, onCancel, onError }) {
  const containerRef = useRef(null);
  const handlers = useRef({ onCreate, onApprove, onCancel, onError });
  useLayoutEffect(() => {
    handlers.current = { onCreate, onApprove, onCancel, onError };
  });
  const [status, setStatus] = useState('loading'); // loading | ready | failed

  useEffect(() => {
    let buttons;
    let active = true;
    loadPayPalSdk(config)
      .then((paypal) => {
        if (!active || !containerRef.current) return;
        buttons = paypal.Buttons({
          style: { layout: 'vertical', shape: 'rect', label: 'pay', height: 45 },
          createOrder: () => handlers.current.onCreate(),
          onApprove: async (data, actions) => {
            try {
              await handlers.current.onApprove(data.orderID);
            } catch (err) {
              if (err?.restart) return actions.restart();
              handlers.current.onError(err);
            }
          },
          onCancel: (data) => handlers.current.onCancel(data.orderID),
          onError: (err) => handlers.current.onError(err),
        });
        return buttons.render(containerRef.current).then(() => active && setStatus('ready'));
      })
      .catch((err) => {
        if (!active) return;
        setStatus('failed');
        handlers.current.onError(err);
      });
    return () => {
      active = false;
      buttons?.close?.().catch(() => {});
    };
  }, [config]);

  return (
    <div>
      {status === 'loading' && <p className="text-sm text-gray-500 text-center py-3">Loading PayPal...</p>}
      {status === 'failed' && <p className="text-sm text-red-600 text-center py-3" role="alert">PayPal could not be loaded.</p>}
      <div ref={containerRef} />
    </div>
  );
}
