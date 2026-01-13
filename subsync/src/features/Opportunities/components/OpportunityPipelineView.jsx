import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    PointerSensor,
    useSensor,
    useSensors,
    useDroppable
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'react-toastify';
import { Plus } from 'lucide-react';
import OpportunityCard from './OpportunityCard.jsx';
import opportunityService from '../services/opportunityService.js';
import { cn } from '@/lib/utils';

// Sortable Card Wrapper
function SortableCard({ opportunity, onView, onEdit, onDelete }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: opportunity.opportunity_id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        scale: isDragging ? 1.02 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="z-10 relative">
            <OpportunityCard
                opportunity={opportunity}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
            />
        </div>
    );
}

// Droppable Column Wrapper
function DroppableColumn({ statusId, children, isOver }) {
    const { setNodeRef } = useDroppable({
        id: `column-${statusId}`,
    });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "space-y-4 min-h-[500px] transition-all duration-300 p-2 rounded-[2rem]",
                isOver ? "bg-blue-50/50 dark:bg-blue-900/10 ring-2 ring-blue-500/20 ring-dashed" : ""
            )}
        >
            {children}
        </div>
    );
}

export default function OpportunityPipelineView({
    opportunities,
    statuses,
    loading,
    onRefresh,
    onDeleteClick
}) {
    const navigate = useNavigate();
    const { username } = useParams();
    const baseUrl = `/${username}/dashboard`;

    const [activeId, setActiveId] = useState(null);
    const [overId, setOverId] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    // Group opportunities by status
    const groupedOpportunities = statuses.reduce((acc, status) => {
        acc[status.id] = opportunities.filter(
            (opp) => opp.status_id === status.id
        );
        return acc;
    }, {});

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragOver = (event) => {
        setOverId(event.over?.id || null);
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        setActiveId(null);
        setOverId(null);

        if (!over) {
            return;
        }

        const activeOpp = opportunities.find((o) => o.opportunity_id === active.id);
        if (!activeOpp) return;

        let targetStatusId;

        if (over.id.toString().startsWith('column-')) {
            targetStatusId = parseInt(over.id.toString().replace('column-', ''));
        } else {
            const targetOpp = opportunities.find((o) => o.opportunity_id === over.id);
            if (targetOpp) {
                targetStatusId = targetOpp.status_id;
            }
        }

        if (!targetStatusId || activeOpp.status_id === targetStatusId) {
            return;
        }

        try {
            await opportunityService.updateOpportunity(active.id, {
                status_id: targetStatusId
            });
            onRefresh();
        } catch (error) {
            console.error('Update error:', error);
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    const handleView = (id) => navigate(`${baseUrl}/opportunities/view/${id}`);
    const handleEdit = (id) => navigate(`${baseUrl}/opportunities/edit/${id}`);

    if (loading) {
        return (
            <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex-shrink-0 w-80">
                        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-6 animate-pulse">
                            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded-full mb-6"></div>
                            <div className="space-y-4">
                                <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-[2rem]"></div>
                                <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-[2rem]"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    const activeOpportunity = activeId
        ? opportunities.find((o) => o.opportunity_id === activeId)
        : null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-6 overflow-x-auto pb-12 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 min-h-[700px]">
                {statuses.map((status) => {
                    const isColumnOver = overId === `column-${status.id}`;
                    return (
                        <div
                            key={status.id}
                            className="flex-shrink-0 w-[340px] bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 rounded-[2.5rem] p-5 flex flex-col shadow-sm"
                        >
                            {/* Column Header */}
                            <div className="flex items-center justify-between mb-6 px-3">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-2.5 h-2.5 rounded-full shadow-lg"
                                        style={{ backgroundColor: status.status_color, boxShadow: `0 0 10px ${status.status_color}` }}
                                    />
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                        {status.status_name}
                                    </h3>
                                </div>
                                <div className="h-6 px-2.5 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full text-[10px] font-black text-slate-400">
                                    {groupedOpportunities[status.id]?.length || 0}
                                </div>
                            </div>

                            {/* Drop Zone */}
                            <div className="flex-1">
                                <SortableContext
                                    id={`status-${status.id}`}
                                    items={groupedOpportunities[status.id]?.map((o) => o.opportunity_id) || []}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <DroppableColumn statusId={status.id} isOver={isColumnOver}>
                                        {groupedOpportunities[status.id]?.length > 0 ? (
                                            groupedOpportunities[status.id].map((opportunity) => (
                                                <SortableCard
                                                    key={opportunity.opportunity_id}
                                                    opportunity={opportunity}
                                                    onView={handleView}
                                                    onEdit={handleEdit}
                                                    onDelete={onDeleteClick}
                                                />
                                            ))
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] opacity-40 hover:opacity-100 transition-opacity bg-white/50 dark:bg-slate-900/50">
                                                <Plus className="h-6 w-6 text-slate-300 mb-2" />
                                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                    Empty Stage
                                                </p>
                                            </div>
                                        )}
                                    </DroppableColumn>
                                </SortableContext>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Drag Overlay */}
            <DragOverlay dropAnimation={{
                duration: 250,
                easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
            }}>
                {activeOpportunity ? (
                    <div className="rotate-3 scale-105 shadow-2xl shadow-blue-500/20 rounded-[2rem]">
                        <OpportunityCard
                            opportunity={activeOpportunity}
                            onView={() => { }}
                            onEdit={() => { }}
                            onDelete={() => { }}
                        />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
