import { useMemo } from 'react';
import { useBirthdayExperience } from '../hooks/useBirthdayExperience';
import { Button } from '@/components/ui/button';
import { PartyPopper, Heart } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '@/lib/axiosInstance';

const TeamBirthdayNotification = () => {
  const { todayTeamBirthdays, adminSettings, user } = useBirthdayExperience();

  // Filter out the logged-in employee so team alerts are only shown for colleagues
  const colleagueBirthdays = useMemo(() => {
    if (!todayTeamBirthdays || !Array.isArray(todayTeamBirthdays)) return [];
    return todayTeamBirthdays.filter(
      (person) =>
        person.username !== user?.username &&
        person.email !== user?.email
    );
  }, [todayTeamBirthdays, user?.username, user?.email]);

  if (
    !adminSettings.enabled ||
    !adminSettings.enable_team_notification ||
    !colleagueBirthdays ||
    colleagueBirthdays.length === 0
  ) {
    return null;
  }

  const handleSendWish = async (birthdayPerson) => {
    try {
      await api.post(`/birthdays/${birthdayPerson.username}/wish`);
      toast.success(`Birthday wish sent to ${birthdayPerson.name}! 🎉`);
    } catch {
      toast.info(`Sent warm wishes to ${birthdayPerson.name}! 🎉`);
    }
  };

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-amber-400/40 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-purple-500/10 p-4 backdrop-blur dark:border-amber-400/20 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-400 to-rose-500 text-white shadow-md">
          <PartyPopper className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-amber-200">
            Team Birthday Alert
          </h4>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
            🎉 Today is{' '}
            <span className="font-bold text-rose-600 dark:text-rose-400">
              {colleagueBirthdays.map((b) => b.name).join(', ')}
            </span>
            &apos;s birthday! Take a moment to wish them a wonderful year ahead.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {colleagueBirthdays.map((person) => (
          <Button
            key={person.username}
            size="sm"
            onClick={() => handleSendWish(person)}
            className="h-8 rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 text-xs font-bold text-white shadow hover:opacity-90"
          >
            <Heart className="mr-1 h-3.5 w-3.5 fill-current" /> Wish {person.name.split(' ')[0]}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default TeamBirthdayNotification;
