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

const VendorPaymentTermsSections = ({ selectedTerm, onTermChange, isEditing }) => {
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
          // console.log('PaymentTermsSection: Setting default term:', defaultTerm);
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
      if (newDefaultTerm) {
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
      // console.log('PaymentTermsSection: Selected term:', term);
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
    // console.log('PaymentTermsSection: isEditing:', isEditing, 'selectedTerm:', selectedTerm, 'paymentTerms count:', paymentTerms.length);
  }, [isEditing, selectedTerm, paymentTerms.length]);

  return (
    <div className="mt-8 mb-4">
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-sm">
          <Label htmlFor="payment-terms" className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-500 mb-2 block">Payment Terms<span className="text-red-500 font-bold ml-1">*</span></Label>
          <div className="flex gap-2">
            <Select
              value={selectedTerm?.term_id ? String(selectedTerm.term_id) : ''}
              onValueChange={handleTermSelection}
            >
              <SelectTrigger className="flex-1 h-11 rounded-xl px-4 text-sm font-bold bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white">
                <SelectValue placeholder="Select payment term" />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                {mergedTerms.map((term) => (
                  <SelectItem key={term.term_id} value={String(term.term_id)} className="font-bold text-xs">
                    {term.term_name} ({term.days || 0} days)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Dialog open={isManageModalOpen} onOpenChange={setIsManageModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-gray-200 dark:border-slate-800 text-gray-500 hover:text-blue-600 transition-all">
                  <Settings2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl dark:bg-slate-900 dark:border-slate-800">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black tracking-tight text-gray-900 dark:text-white">Manage Payment Terms</DialogTitle>
                  <DialogDescription className="text-sm font-medium text-gray-400">
                    Configure your payment terms and set defaults.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-6">
                  <Button
                    variant="outline"
                    className="w-full h-11 rounded-xl font-black uppercase tracking-widest text-[10px] border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                    onClick={() => setIsAddingNew(true)}
                  >
                    + Add New Payment Term
                  </Button>

                  {isAddingNew && (
                    <div className="flex items-center gap-3 p-4 bg-blue-50/30 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20 rounded-2xl shadow-sm">
                      <Input
                        value={newTerm.term_name}
                        onChange={(e) => setNewTerm({ ...newTerm, term_name: e.target.value })}
                        placeholder="Term name (e.g. Net 30)"
                        className="flex-1 h-10 rounded-lg text-xs font-bold border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                      />
                      <Input
                        type="number"
                        value={newTerm.days}
                        onChange={(e) => setNewTerm({ ...newTerm, days: e.target.value })}
                        placeholder="Days"
                        className="w-20 h-10 rounded-lg text-xs font-bold border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleAddTerm} className="bg-blue-600 hover:bg-blue-700 h-10 px-4 rounded-lg font-bold text-xs">Save</Button>
                        <Button size="sm" variant="outline" className="h-10 px-4 rounded-lg font-bold text-xs" onClick={() => {
                          setIsAddingNew(false);
                          setNewTerm({ term_name: '', days: '' });
                        }}>Cancel</Button>
                      </div>
                    </div>
                  )}

                  <div className="max-h-[350px] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-800">
                    {paymentTerms.map((term) => (
                      <div key={term.term_id} className="group flex items-center gap-4 p-4 border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 rounded-2xl hover:shadow-md transition-all">
                        {editingTerm?.term_id === term.term_id ? (
                          <>
                            <Input
                              value={editingTerm.term_name}
                              onChange={(e) => setEditingTerm({ ...editingTerm, term_name: e.target.value })}
                              className="flex-1 h-10 rounded-lg text-xs font-bold"
                            />
                            <Input
                              type="number"
                              value={editingTerm.days}
                              onChange={(e) => setEditingTerm({ ...editingTerm, days: e.target.value })}
                              className="w-20 h-10 rounded-lg text-xs font-bold"
                            />
                            <Button size="sm" onClick={() => handleUpdateTerm(term.term_id)} className="bg-blue-600 hover:bg-blue-700 h-10 px-4 rounded-lg font-bold text-xs">Save</Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingTerm(null)} className="h-10 px-4 rounded-lg font-bold text-xs">Cancel</Button>
                          </>
                        ) : (
                          <>
                            <div className="flex-1">
                              <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{term.term_name}</p>
                              <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">{term.days} days duration</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {term.is_default ? (
                                <span className="bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-500 text-[10px] font-black px-3 py-1.5 rounded-full border border-green-200 dark:border-green-500/20 uppercase tracking-widest shadow-sm">
                                  Default
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleSetDefault(term.term_id)}
                                  className="text-[10px] font-black px-3 py-1.5 rounded-full border border-gray-200 dark:border-slate-800 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10 transition-all uppercase tracking-widest"
                                >
                                  Set Default
                                </button>
                              )}
                              <button
                                onClick={() => setEditingTerm(term)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                              </button>
                              <button
                                onClick={() => handleDeleteTerm(term.term_id)}
                                disabled={term.is_default}
                                className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all disabled:opacity-30 disabled:pointer-events-none"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                              </button>
                            </div>
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

export default VendorPaymentTermsSections;
