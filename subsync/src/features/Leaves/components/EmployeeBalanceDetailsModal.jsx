import React from 'react';
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserCheck, Palmtree, Clock, Plus, X } from 'lucide-react';
import LeaveBalanceCard from './LeaveBalanceCard';
import PermissionQuotaCard from './PermissionQuotaCard';

const EmployeeBalanceDetailsModal = ({ isOpen, onClose, employee, settings, onAdjustClick }) => {
    if (!isOpen || !employee) return null;

    const { user_name, user_email, user_id, leaves = [], permission } = employee;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl rounded-[2rem] p-0 overflow-hidden border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col">
                {/* Modal Header */}
                <DialogHeader className="p-6 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex-row items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                            {user_name ? user_name.substring(0, 2).toUpperCase() : '??'}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                                    {user_name}
                                </DialogTitle>
                                <Badge variant="outline" className="text-[10px] font-bold">
                                    Employee Balances
                                </Badge>
                            </div>
                            <DialogDescription className="text-xs text-slate-500 font-medium mt-0.5">
                                {user_email || user_id}
                            </DialogDescription>
                        </div>
                    </div>

                    <Button 
                        onClick={() => { onClose(); onAdjustClick(user_id); }}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold px-4 h-9 shadow-sm mr-6"
                    >
                        <Plus className="w-4 h-4 mr-1.5" />
                        Adjust Balance
                    </Button>
                </DialogHeader>

                {/* Modal Scrollable Body */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1">
                    {/* Permission Quota Card Section */}
                    {permission && (
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-violet-600" />
                                Workday Permission Quota (Hours)
                            </h4>
                            <PermissionQuotaCard 
                                balance={permission}
                                settings={settings}
                            />
                        </div>
                    )}

                    {/* Day-based Leave Balances Cards Grid */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Palmtree className="w-4 h-4 text-blue-600" />
                            Leave Entitlements (Days)
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {leaves.map(balance => (
                                <LeaveBalanceCard key={balance.id || balance.leave_type_id} balance={balance} />
                            ))}
                        </div>
                        {leaves.length === 0 && (
                            <p className="text-xs text-slate-400 font-medium py-4">No day-based leave types assigned to this employee.</p>
                        )}
                    </div>
                </div>

                <DialogFooter className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 shrink-0">
                    <Button variant="outline" onClick={onClose} className="rounded-xl text-xs font-bold">
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default EmployeeBalanceDetailsModal;
