import { useState, useEffect } from 'react';
import router from '@/routes/Index';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/axiosInstance';
import { toast } from 'react-toastify';
import { Phone, Clock, User, UserPlus, Building2, Tag } from 'lucide-react';

/**
 * PostCallDialog — shown by CallDetectorManager after every call ends.
 *
 * Uses the /api/resolve-number endpoint to look up the caller
 * (pre-resolved by useCallDetector hook and passed via lastCall.resolved).
 * Logs the call as a DCR entry via /api/log-call (call_source = 'phone').
 */
const PostCallDialog = ({ lastCall }) => {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (lastCall) {
      setOpen(true);
      setNotes('');
    }
  }, [lastCall]);

  if (!lastCall) return null;

  const { phoneNumber, duration, callType, resolved } = lastCall;

  const formatDuration = (seconds) => {
    const mins = Math.floor((seconds || 0) / 60);
    const secs = (seconds || 0) % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const entityColors = {
    customer:      '#8b5cf6',
    vendor:        '#f59e0b',
    contact:       '#06b6d4',
    other_contact: '#06b6d4',
    unknown:       '#6b7280',
  };
  const entityColor = entityColors[resolved?.type] || '#6b7280';
  const entityLabel = (resolved?.type || 'unknown').replace('_', ' ');

  const handleSubmit = async () => {
    if (!lastCall) return;

    setSubmitting(true);
    try {
      await api.post('/log-call', {
        phone:       resolved?.phone || phoneNumber,
        name:        resolved?.name  || 'Unknown Number',
        entity_type: resolved?.type  || 'unknown',
        entity_id:   resolved?.id    || null,
        company:     resolved?.company || null,
        call_type:   callType || 'incoming',
        duration:    duration || 0,
        description: notes.trim() || '',
      });

      toast.success('Call logged as DCR entry!');
      setOpen(false);
    } catch (error) {
      console.error('Failed to log call:', error);
      toast.error('Failed to log call. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateContact = () => {
    setOpen(false);
    const username = localStorage.getItem('subsync_user') || '';
    router.navigate(`/${username}/dashboard/contacts/new?prefill_phone=${encodeURIComponent(phoneNumber || '')}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-violet-500" />
            Log Call to DCR
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Call Metadata */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-muted/50 rounded-xl">
            <div className="space-y-1">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                Phone
              </Label>
              <p className="text-sm font-bold break-all">{phoneNumber || 'Unknown'}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                Duration
              </Label>
              <p className="text-sm font-bold flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-violet-500" />
                {formatDuration(duration)}
              </p>
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                Type
              </Label>
              <p className="text-sm font-bold capitalize">{callType || 'unknown'}</p>
            </div>
          </div>

          {/* Resolved Entity */}
          {resolved && resolved.type !== 'unknown' ? (
            <div className="p-3 border rounded-xl bg-violet-50/50 dark:bg-violet-900/10 border-violet-200 dark:border-violet-500/20 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-violet-500" />
                  <span className="text-sm font-bold">{resolved.name}</span>
                </div>
                <span
                  className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                  style={{ background: `${entityColor}20`, color: entityColor, border: `1px solid ${entityColor}40` }}
                >
                  {entityLabel}
                </span>
              </div>
              {resolved.company && (
                <div className="flex items-center gap-1 pl-6">
                  <Building2 className="h-3 w-3 text-slate-400" />
                  <span className="text-xs text-slate-500">{resolved.company}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 border border-dashed rounded-xl space-y-2">
              <p className="text-sm text-muted-foreground">No match found for this number</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateContact}
                className="w-full"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Create New Contact
              </Button>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="post-call-notes">Call Notes (optional)</Label>
            <Textarea
              id="post-call-notes"
              placeholder="What was discussed during this call?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={submitting}
          >
            Skip
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {submitting ? 'Logging...' : 'Log Call'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PostCallDialog;
