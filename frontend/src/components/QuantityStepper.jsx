export default function QuantityStepper({ value, onChange, min = 1, size = 'md' }) {
  const sizeClasses = size === 'lg' ? 'px-4 py-3 text-base' : 'px-3 py-1 text-sm';

  return (
    <div className="flex items-center border border-gray-300 rounded-xl bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className={`${sizeClasses} text-gray-600 hover:bg-gray-100 transition-colors`}
        aria-label="Decrease quantity"
      >
        -
      </button>
      <span className="px-3 font-semibold text-gray-900 min-w-[2.5rem] text-center" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className={`${sizeClasses} text-gray-600 hover:bg-gray-100 transition-colors`}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
