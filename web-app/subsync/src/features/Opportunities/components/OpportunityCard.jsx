import { Eye, Edit, Trash2, User, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';

export default function OpportunityCard({ opportunity, onView, onEdit, onDelete }) {
    return (
        <Card
            className="group cursor-move hover:shadow-lg transition-all duration-200 border-l-4"
            style={{ borderLeftColor: opportunity.status_color || '#3b82f6' }}
        >
            <CardContent className="p-4 space-y-3">
                {/* Customer Info */}
                <div>
                    <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 line-clamp-1">
                        {opportunity.customer_name}
                    </h3>
                    {opportunity.company_name && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                            {opportunity.company_name}
                        </p>
                    )}
                </div>

                {/* Key Metrics */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-semibold text-green-600 dark:text-green-500">
                            {new Intl.NumberFormat('en-IN', {
                                style: 'currency',
                                currency: 'INR',
                                maximumFractionDigits: 0
                            }).format(opportunity.opportunity_value)}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <User className="h-4 w-4" />
                        <span className="line-clamp-1">{opportunity.owner_name || opportunity.owner}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="h-4 w-4" />
                        <span>
                            {new Date(opportunity.opportunity_date).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                            })}
                        </span>
                    </div>
                </div>

                {/* Action Buttons - Show on hover */}
                <div className="flex gap-1 pt-2 border-t border-gray-100 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 flex-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={(e) => {
                            e.stopPropagation();
                            onView(opportunity.opportunity_id);
                        }}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 flex-1 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(opportunity.opportunity_id);
                        }}
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(opportunity.opportunity_id);
                        }}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
