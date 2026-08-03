import { useBirthdayExperience } from '../hooks/useBirthdayExperience';

/**
 * BirthdayBadge wraps an avatar or displays a birthday badge if the user is celebrating today.
 *
 * @param {Object} props
 * @param {boolean} [props.isBirthday] - Explicit flag override for any user (e.g. colleagues)
 * @param {boolean} [props.showBadgeLabel] - Show '🎂 Birthday' text badge alongside avatar
 * @param {React.ReactNode} [props.children] - Target Avatar element to wrap
 * @param {string} [props.className] - Additional class names
 */
const BirthdayBadge = ({ isBirthday, showBadgeLabel = true, children, className = '' }) => {
  const { isBirthdayToday, adminSettings } = useBirthdayExperience();

  const isCelebrating =
    typeof isBirthday === 'boolean'
      ? isBirthday
      : isBirthdayToday && adminSettings.enabled && adminSettings.enable_birthday_badge;

  if (!isCelebrating) {
    return <>{children}</>;
  }

  return (
    <div className={`relative inline-flex items-center gap-1.5 ${className}`}>
      {/* Festive Ring around wrapped Avatar */}
      <div className="relative rounded-full p-[2px] bg-gradient-to-tr from-amber-400 via-rose-500 to-yellow-300 shadow-md shadow-amber-500/30 animate-pulse">
        {children}
        <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] shadow-sm">
          🎂
        </span>
      </div>

      {showBadgeLabel && (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-gradient-to-r from-amber-500/20 to-rose-500/20 px-2 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-300">
          🎂 Birthday
        </span>
      )}
    </div>
  );
};

export default BirthdayBadge;
