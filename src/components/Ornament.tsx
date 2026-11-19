import { Icon } from "./Icon";

/** The flyer's divider: a fine gold line either side of a small sprig. */
export function Ornament({ className = "" }: { className?: string }) {
  return (
    <div className={`orn justify-center ${className}`} aria-hidden>
      <Icon name="leaf" size={18} weight="light" />
    </div>
  );
}
