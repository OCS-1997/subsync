import { useBirthdayExperience } from '../hooks/useBirthdayExperience';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Sparkles, Zap, Cake } from 'lucide-react';
import { toast } from 'react-toastify';

const BirthdayProfileSettings = () => {
  const { userPreference, setUserPreference } = useBirthdayExperience();

  const handlePreferenceChange = (val) => {
    setUserPreference(val);
    toast.success('Birthday celebration preference saved!');
  };

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
            <Cake className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base font-bold">Birthday Celebration</CardTitle>
            <CardDescription className="text-xs">
              Customize how OCS365 celebrates your birthday on your special day.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <RadioGroup
          value={userPreference}
          onValueChange={handlePreferenceChange}
          className="space-y-3"
        >
          {/* Full Experience */}
          <div className="flex items-start space-x-3 rounded-xl border border-border p-3 transition-colors hover:bg-accent/50">
            <RadioGroupItem value="full" id="pref-full" className="mt-1" />
            <div className="flex-1 cursor-pointer" onClick={() => handlePreferenceChange('full')}>
              <Label htmlFor="pref-full" className="font-semibold text-sm cursor-pointer flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-500" /> Full Experience (Recommended)
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Enjoy cinematic GSAP intro animation, festive app theme, interactive dashboard hero, and confetti.
              </p>
            </div>
          </div>

          {/* Reduced Animation */}
          <div className="flex items-start space-x-3 rounded-xl border border-border p-3 transition-colors hover:bg-accent/50">
            <RadioGroupItem value="reduced" id="pref-reduced" className="mt-1" />
            <div className="flex-1 cursor-pointer" onClick={() => handlePreferenceChange('reduced')}>
              <Label htmlFor="pref-reduced" className="font-semibold text-sm cursor-pointer flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-blue-500" /> Reduced Animation
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Skip motion-heavy intro overlay while keeping festive theme colors and dashboard greeting hero.
              </p>
            </div>
          </div>

          {/* Disable Birthday Experience */}
          <div className="flex items-start space-x-3 rounded-xl border border-border p-3 transition-colors hover:bg-accent/50">
            <RadioGroupItem value="disabled" id="pref-disabled" className="mt-1" />
            <div className="flex-1 cursor-pointer" onClick={() => handlePreferenceChange('disabled')}>
              <Label htmlFor="pref-disabled" className="font-semibold text-sm cursor-pointer flex items-center gap-1.5">
                Disable Birthday Experience
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Turn off birthday intro animation, festive theme, and hero section completely.
              </p>
            </div>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
};

export default BirthdayProfileSettings;
