import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/axiosInstance';
import { toast } from 'react-toastify';
import { Phone, Clock, User, UserPlus } from 'lucide-react';

const PostCallDialog = ({ lastCall }) => {
  const [open, setOpen] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (lastCall) {
      setOpen(true);
      setNotes('');
      fetchCustomer(lastCall.phoneNumber);
    }
  }, [lastCall]);

  const fetchCustomer = async (phoneNumber) => {
    if (!phoneNumber) {
      setCustomer(null);
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(`/api/customers`, {
        params: { phone: phoneNumber },
      });

      if (response.data && response.data.length > 0) {
        setCustomer(response.data[0]);
      } else {
        setCustomer(null);
      }
    } catch (error) {
      console.error('Failed to fetch customer:', error);
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!lastCall) return;

    setSubmitting(true);
    try {
      const payload = {
        customer_id: customer?.customer_id || null,
        status: 'completed',
        notes: notes || `${lastCall.callType} call`,
        callDuration: lastCall.duration,
        phoneNumber: lastCall.phoneNumber,
        callType: lastCall.callType,
      };

      await api.post('/api/daily-call-register', payload);
      toast.success('Call logged successfully!');
      setOpen(false);
    } catch (error) {
      console.error('Failed to log call:', error);
      toast.error('Failed to log call. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCreateCustomer = () => {
    // Navigate to create contact page with phone number pre-filled
    window.location.href = `/contacts/new?phone=${lastCall.phoneNumber}`;
  };

  if (!lastCall) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Call Ended
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Call Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Phone Number</Label>
              <p className="font-medium">{lastCall.phoneNumber || 'Unknown'}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Duration</Label>
              <p className="font-medium flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatDuration(lastCall.duration)}
              </p>
            </div>
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Type</Label>
              <p className="font-medium capitalize">{lastCall.callType}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Time</Label>
              <p className="font-medium">
                {new Date(lastCall.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>

          {/* Customer Information */}
          {loading ? (
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Looking up customer...</p>
            </div>
          ) : customer ? (
            <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <Label className="text-sm font-semibold">Customer Found</Label>
              </div>
              <p className="font-medium">{customer.customer_name}</p>
              {customer.email && (
                <p className="text-sm text-muted-foreground">{customer.email}</p>
              )}
            </div>
          ) : (
            <div className="p-4 border rounded-lg border-dashed space-y-3">
              <p className="text-sm text-muted-foreground">
                No customer found for this number
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateCustomer}
                className="w-full"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Create New Contact
              </Button>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add notes about this call..."
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
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Logging...' : 'Log Call'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PostCallDialog;
