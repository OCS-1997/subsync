import { useState } from 'react';
import { useBirthdayExperience } from '../hooks/useBirthdayExperience';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Cake, Sparkles, Save } from 'lucide-react';
import { toast } from 'react-toastify';

const BirthdayAdminSettings = () => {
  const { adminSettings, updateAdminSettings } = useBirthdayExperience();
  const [formData, setFormData] = useState({ ...adminSettings });
  const [saving, setSaving] = useState(false);

  const handleChange = (key, val) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await updateAdminSettings(formData);
    setSaving(false);

    if (res?.success) {
      toast.success('Birthday Experience admin settings saved successfully!');
    } else {
      toast.error('Failed to save settings: ' + (res?.error || 'Unknown error'));
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Cake className="h-6 w-6 text-amber-500" /> Birthday Experience Engine Configuration
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Global administrative control panel for OCS365 employee birthday celebrations.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" /> Module Controls & Feature Toggles
            </CardTitle>
            <CardDescription className="text-xs">
              Enable or disable specific celebration features across the entire organization.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Global Enable Toggle */}
            <div className="flex items-center justify-between rounded-xl border border-border p-4">
              <div>
                <Label className="font-bold text-sm">Enable Birthday Experience Module</Label>
                <p className="text-xs text-muted-foreground">Master switch for birthday celebrations.</p>
              </div>
              <Switch
                checked={formData.enabled}
                onCheckedChange={(val) => handleChange('enabled', val)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Enable Theme */}
              <div className="flex items-center justify-between rounded-xl border border-border p-3.5">
                <div>
                  <Label className="font-semibold text-xs">Festive App Theme</Label>
                  <p className="text-[11px] text-muted-foreground">Temporary visual glows on cards & header.</p>
                </div>
                <Switch
                  checked={formData.enable_theme}
                  onCheckedChange={(val) => handleChange('enable_theme', val)}
                />
              </div>

              {/* Enable Confetti */}
              <div className="flex items-center justify-between rounded-xl border border-border p-3.5">
                <div>
                  <Label className="font-semibold text-xs">Confetti Explosions</Label>
                  <p className="text-[11px] text-muted-foreground">GPU accelerated confetti bursts.</p>
                </div>
                <Switch
                  checked={formData.enable_confetti}
                  onCheckedChange={(val) => handleChange('enable_confetti', val)}
                />
              </div>

              {/* Enable Dashboard Hero */}
              <div className="flex items-center justify-between rounded-xl border border-border p-3.5">
                <div>
                  <Label className="font-semibold text-xs">Interactive Dashboard Hero</Label>
                  <p className="text-[11px] text-muted-foreground">Celebration header with interactive balloons/cake.</p>
                </div>
                <Switch
                  checked={formData.enable_dashboard_hero}
                  onCheckedChange={(val) => handleChange('enable_dashboard_hero', val)}
                />
              </div>

              {/* Enable Birthday Badge */}
              <div className="flex items-center justify-between rounded-xl border border-border p-3.5">
                <div>
                  <Label className="font-semibold text-xs">Birthday Avatar Badge</Label>
                  <p className="text-[11px] text-muted-foreground">Golden festive ring & tag on user avatars.</p>
                </div>
                <Switch
                  checked={formData.enable_birthday_badge}
                  onCheckedChange={(val) => handleChange('enable_birthday_badge', val)}
                />
              </div>

              {/* Enable Team Notification */}
              <div className="flex items-center justify-between rounded-xl border border-border p-3.5">
                <div>
                  <Label className="font-semibold text-xs">Team Birthday Notification</Label>
                  <p className="text-[11px] text-muted-foreground">Dashboard alert for colleagues on their birthday.</p>
                </div>
                <Switch
                  checked={formData.enable_team_notification}
                  onCheckedChange={(val) => handleChange('enable_team_notification', val)}
                />
              </div>

              {/* Intro Duration */}
              <div className="flex flex-col justify-center rounded-xl border border-border p-3.5">
                <Label className="font-semibold text-xs mb-1">Intro Animation Duration (Seconds)</Label>
                <Input
                  type="number"
                  min={3}
                  max={15}
                  value={formData.animation_duration}
                  onChange={(e) => handleChange('animation_duration', parseInt(e.target.value) || 6)}
                  className="h-9"
                />
              </div>
            </div>

            {/* Company Greeting */}
            <div className="space-y-2">
              <Label className="font-bold text-sm">Company Personalized Greeting</Label>
              <Textarea
                rows={3}
                value={formData.company_greeting}
                onChange={(e) => handleChange('company_greeting', e.target.value)}
                placeholder="Enter greeting message shown during the birthday intro modal..."
                className="text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                This message will be dynamically tailored with the employee&apos;s first name during playback.
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end border-t border-border pt-4">
            <Button
              type="submit"
              disabled={saving}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold"
            >
              <Save className="mr-1.5 h-4 w-4" /> {saving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default BirthdayAdminSettings;
