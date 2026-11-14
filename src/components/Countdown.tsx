import { urgency } from "../lib/birthdays";

/** The days left, coloured by how soon: red under 7 days, amber under 30. */
export function Countdown({ days, className = "" }: { days: number; className?: string }) {
  const tone = `count count-${urgency(days)} ${className}`;
  if (days === 0) {
    return (
      <div className={tone}>
        <span className="count-num count-word">Today</span>
      </div>
    );
  }
  return (
    <div className={tone} aria-label={`${days} ${days === 1 ? "day" : "days"} to go`}>
      <span className="count-num">{days}</span>
      <span className="count-unit">{days === 1 ? "day" : "days"}</span>
    </div>
  );
}
