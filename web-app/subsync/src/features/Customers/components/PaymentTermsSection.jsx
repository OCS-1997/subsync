import { Settings2 } from "lucide-react";
import { toast } from 'react-toastify';
import { useState, useEffect, useMemo } from 'react';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import api from '@/lib/axiosInstance.js';

const PaymentTermsSection = ({ selectedTerm, onTermChange, isEditing }) => {
  const [paymentTerms, setPaymentTerms] = useState([]);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [newTerm, setNewTerm] = useState({ term_name: '', days: '' });
  const [editingTerm, setEditingTerm] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  useEffect(() => {
    fetchPaymentTerms();
  }, []);

  // Prevent overriding selected term when editing
  useEffect(() => {
    if (isEditing && selectedTerm && paymentTerms.length > 0) {
      // Ensure the selected term is in the payment terms list
      const termExists = paymentTerms.some(t => t.term_id === selectedTerm.term_id);
      if (!termExists && selectedTerm.term_id) {
        // If the selected term is not in the list, add it temporarily
        setPaymentTerms(prev => [...prev, selectedTerm]);
      }
    }
  }, [isEditing, selectedTerm, paymentTerms]);

  const fetchPaymentTerms = async () => {
    try {
      const response = await api.get('/payment-terms');
      const terms = response.data;
      if (Array.isArray(terms)) {
        setPaymentTerms(terms);
        // Only set default if not editing and no selectedTerm
        if (!isEditing && !selectedTerm && terms.length > 0) {
          const defaultTerm = terms.find(term => term.is_default) || terms[0];
          console.log('PaymentTermsSection: Setting default term:', defaultTerm);
          onTermChange(defaultTerm);
        }
      }
    } catch (error) {
      console.error('Error fetching payment terms:', error);
      toast.error('Failed to load payment terms');
    }
  };

  const handleAddTerm = async () => {
    try {
      if (!newTerm.term_name) {
        toast.error('Please enter a term name');
        return;
      }

      const daysValue = newTerm.term_name.toLowerCase() === 'due on receipt' ? 0 : newTerm.days;

      if (daysValue === '' && newTerm.term_name.toLowerCase() !== 'due on receipt') {
        toast.error('Please enter the number of days');
        return;
      }

      const termData = {
        termName: newTerm.term_name,
        days: daysValue
      };

      const response = await api.post('/payment-terms', termData);
      await fetchPaymentTerms();
      setNewTerm({ term_name: '', days: '' });
      setIsAddingNew(false);
      toast.success('Payment term added successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add payment term');
    }
  };

  const handleUpdateTerm = async (termId) => {
    try {
      if (!editingTerm.term_name) {
        toast.error('Please enter a term name');
        return;
      }

      const daysValue = editingTerm.term_name.toLowerCase() === 'due on receipt' ? 0 : editingTerm.days;

      if (daysValue === '' && editingTerm.term_name.toLowerCase() !== 'due on receipt') {
        toast.error('Please enter the number of days');
        return;
      }

      const termData = {
        termName: editingTerm.term_name,
        days: daysValue
      };

      const response = await api.put(`/payment-terms/${termId}`, termData);
      await fetchPaymentTerms();
      setEditingTerm(null);
      toast.success('Payment term updated successfully');
    } catch (error) {
      toast.error('Failed to update payment term');
    }
  };


  const handleDeleteTerm = async (termId) => {
    try {
      await api.delete(`/payment-terms/${termId}`);
      await fetchPaymentTerms();
      toast.success('Payment term deleted successfully');
    } catch (error) {
      toast.error('Failed to delete payment term');
    }
  };

  const handleSetDefault = async (termId) => {
    try {
      await api.put(`/payment-terms/${termId}/default`);
      await fetchPaymentTerms();
      const newDefaultTerm = paymentTerms.find(t => t.term_id === termId);
      if (newDefaultTerm){
        onTermChange(newDefaultTerm);
      }
      toast.success('Default payment term updated');
    } catch (error) {
      toast.error('Failed to set default payment term');
    }
  };

  // Add selectedTerm to dropdown if not present (for edit mode)
  const mergedTerms = useMemo(() => {
    if (!selectedTerm || !selectedTerm.term_id) {
      return paymentTerms;
    }
    
    const termExists = paymentTerms.some(t => t.term_id === selectedTerm.term_id);
    if (termExists) {
      return paymentTerms;
    }
    
    // If selected term is not in the list, add it
    return [...paymentTerms, selectedTerm];
  }, [paymentTerms, selectedTerm]);

  // Use term_id for value and selection
  const handleTermSelection = (value) => {
    const term = mergedTerms.find(t => String(t.term_id) === String(value));
    if (term) {
      console.log('PaymentTermsSection: Selected term:', term);
      onTermChange({
        term_id: term.term_id,
        term_name: term.term_name,
        days: term.term_name.toLowerCase() === 'due on receipt' ? 0 : term.days,
        is_default: term.is_default
      });
    }
  };

  // Debug logging
  useEffect(() => {
    console.log('PaymentTermsSection: isEditing:', isEditing, 'selectedTerm:', selectedTerm, 'paymentTerms count:', paymentTerms.length);
  }, [isEditing, selectedTerm, paymentTerms.length]);

  return (
    <div className="container my-4 mx-2">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Label htmlFor="payment-terms">Payment Terms</Label>
          <div className="flex gap-2 mt-1">
            <Select
              value={selectedTerm?.term_id ? String(selectedTerm.term_id) : ''}
              onValueChange={handleTermSelection}
              className="flex-1"
            >
              <SelectTrigger className="w-60">
                <SelectValue placeholder="Select payment term" />
              </SelectTrigger>
              <SelectContent>
                {mergedTerms.map((term) => (
                  <SelectItem key={term.term_id} value={String(term.term_id)}>
                    {term.term_name} ({term.days || 0} days)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Dialog open={isManageModalOpen} onOpenChange={setIsManageModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Manage Payment Terms</DialogTitle>
                  <DialogDescription>
                    Configure your payment terms and set defaults.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Button
                    variant="outline"
                    className="w-full bg-blue-500 text-white hover:bg-blue-600"
                    onClick={() => setIsAddingNew(true)}
                  >
                    + Add New Payment Term
                  </Button>

                  {isAddingNew && (
                    <div className="flex items-center gap-4 p-4 border rounded-lg">
                      <Input
                        value={newTerm.term_name}
                        onChange={(e) => setNewTerm({ ...newTerm, term_name: e.target.value })}
                        placeholder="Term name"
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={newTerm.days}
                        onChange={(e) => setNewTerm({ ...newTerm, days: e.target.value })}
                        placeholder="Days"
                        className="w-24"
                      />
                      <Button onClick={handleAddTerm}>Save</Button>
                      <Button variant="outline" onClick={() => {
                        setIsAddingNew(false);
                        setNewTerm({ term_name: '', days: '' });
                      }}>Cancel</Button>
                    </div>
                  )}

                  <div className="max-h-[400px] overflow-y-auto space-y-4">
                    {paymentTerms.map((term) => (
                      <div key={term.term_id} className="flex items-center gap-4 p-4 border rounded-lg">
                        {editingTerm?.term_id === term.term_id ? (
                          <>
                            <Input
                              value={editingTerm.term_name}
                              onChange={(e) => setEditingTerm({ ...editingTerm, term_name: e.target.value })}
                              className="flex-1"
                            />
                            <Input
                              type="number"
                              value={editingTerm.days}
                              onChange={(e) => setEditingTerm({ ...editingTerm, days: e.target.value })}
                              className="w-24"
                            />
                            <Button onClick={() => handleUpdateTerm(term.term_id)}>Save</Button>
                            <Button variant="outline" onClick={() => setEditingTerm(null)}>Cancel</Button>
                          </>
                        ) : (
                          <>
                            <span className="flex-1">{term.term_name}</span>
                            <span className="w-24 text-gray-500">{term.days} days</span>
                            <Button
                              variant={term.is_default ? "default" : "outline"}
                              onClick={() => handleSetDefault(term.term_id)}
                            >
                              {term.is_default ? "Default" : "Set Default"}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setEditingTerm(term)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleDeleteTerm(term.term_id)}
                              disabled={term.is_default}
                            >
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentTermsSection;
