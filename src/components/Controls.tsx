import { useId, type ReactNode } from "react";
import { RotateCcw, ChevronDown } from "lucide-react";
export function Slider({
  label,
  value,
  onChange,
  min = -100,
  max = 100,
  step = 1,
  reset = 0,
  hint,
  disabled = false,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  reset?: number;
  hint?: string;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="control">
      <div>
        <label htmlFor={id} title={hint}>
          {label}
        </label>
        <output>{step < 1 ? value.toFixed(2) : Math.round(value)}</output>
        <button
          title={`Reset ${label}`}
          aria-label={`Reset ${label}`}
          onClick={() => onChange(reset)}
          disabled={disabled || value === reset}
        >
          <RotateCcw size={11} />
        </button>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(+e.target.value)}
        onDoubleClick={() => onChange(reset)}
      />
      {hint && <small>{hint}</small>}
    </div>
  );
}
export function Group({
  title,
  children,
  open = false,
  onReset,
}: {
  title: string;
  children: ReactNode;
  open?: boolean;
  onReset?: () => void;
}) {
  return (
    <details className="tool-group" open={open || undefined}>
      <summary>
        {title}
        <ChevronDown size={14} />
      </summary>
      <div className="group-content">
        {onReset && (
          <button className="subtle group-reset" onClick={onReset}>
            Reset group
          </button>
        )}
        {children}
      </div>
    </details>
  );
}
