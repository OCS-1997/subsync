import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Gift, Loader2, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge.jsx';
import api from '@/lib/axiosInstance.js';
import { toast } from 'react-toastify';

function BirthdayNavWidget() {
  const [birthdays, setBirthdays] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Fetch birthdays on mount to show badge count
    fetchBirthdays();
  }, []);

  useEffect(() => {
    // Refresh when popover opens to get latest data
    if (open) {
      fetchBirthdays();
    }
  }, [open]);

  const fetchBirthdays = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard/birthdays');
      setBirthdays(response.data);
    } catch (error) {
      console.error('Error fetching birthdays:', error);
      toast.error('Failed to load birthdays');
    } finally {
      setLoading(false);
    }
  };

  const { today = [], upcoming = [] } = birthdays || {};
  const allBirthdays = [
    ...(today || []).map(b => ({ ...b, isToday: true })),
    ...(upcoming || []).map(b => ({ ...b, isToday: false }))
  ];

  const totalCount = allBirthdays.length;
  const todayCount = today?.length || 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full hover:bg-pink-100 hover:text-pink-600 transition-colors relative"
          title="Birthday Alerts"
        >
          <Gift className="h-5 w-5" />
          {todayCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-yellow-500 text-white text-xs flex items-center justify-center font-bold">
              {todayCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[380px] p-0 shadow-xl border-pink-200 dark:border-pink-800 max-h-[500px] flex flex-col"
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-pink-100 dark:border-pink-900 bg-gradient-to-r from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-pink-600 dark:bg-pink-500">
                <Gift className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Birthday Alerts</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {totalCount > 0 
                    ? `${totalCount} ${totalCount === 1 ? 'birthday' : 'birthdays'} in the next 7 days`
                    : 'No upcoming birthdays'}
                </p>
              </div>
            </div>
            {totalCount > 0 && (
              <Badge variant="default" className="bg-pink-600">
                {totalCount}
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading birthdays...</p>
            </div>
          ) : allBirthdays.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="mx-auto w-14 h-14 rounded-full bg-pink-50 dark:bg-pink-950/30 flex items-center justify-center">
                <Calendar className="h-7 w-7 text-pink-300 dark:text-pink-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">No birthdays</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">No birthdays in the next 7 days</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {allBirthdays.map((person, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border ${
                    person.isToday
                      ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800'
                      : 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {person.name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {person.type === 'user' ? 'Team Member' : 'Customer'}
                      </div>
                    </div>
                    <div className="ml-3 flex-shrink-0">
                      {person.isToday ? (
                        <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
                          Today!
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-blue-300 dark:border-blue-700">
                          {person.days_until === 0
                            ? 'Tomorrow'
                            : `${person.days_until} ${person.days_until === 1 ? 'day' : 'days'}`}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default BirthdayNavWidget;

