import { Check } from 'lucide-react';
import { FULFILMENT_FLOW, ORDER_STATUS } from './orderStatus';

// Step indicator: Confirmed → Processing → Shipped → Delivered.
export default function OrderProgress({ status }) {
  if (status === 'cancelled') return null;
  const current = FULFILMENT_FLOW.indexOf(status);

  return (
    <ol className="flex items-center w-full" aria-label={`Order status: ${ORDER_STATUS[status]?.label}`}>
      {FULFILMENT_FLOW.map((step, index) => {
        const done = index <= current;
        return (
          <li key={step} className={`flex items-center ${index < FULFILMENT_FLOW.length - 1 ? 'flex-1' : ''}`}>
            <div className="flex flex-col items-center gap-1">
              <span
                className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  done ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
                }`}
                aria-hidden="true"
              >
                {done ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <span className={`text-xs ${done ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                {ORDER_STATUS[step].label}
                {index === current && <span className="sr-only"> (current)</span>}
              </span>
            </div>
            {index < FULFILMENT_FLOW.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-5 ${index < current ? 'bg-primary' : 'bg-gray-200'}`} aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
