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
import OpportunityCard from './OpportunityCard.jsx';
import opportunityService from '../services/opportunityService.js';

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
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
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
function DroppableColumn({ statusId, children }) {
    const { setNodeRef, isOver } = useDroppable({
        id: `column-${statusId}`,
    });

    return (
        <div
            ref={setNodeRef}
            className={`space-y-3 min-h-[400px] transition-colors ${isOver ? 'bg-blue-50 dark:bg-blue-900/10 rounded-lg p-2' : ''
                }`}
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

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) {
            return;
        }

        const activeOpp = opportunities.find((o) => o.opportunity_id === active.id);
        if (!activeOpp) return;

        // Extract status ID from column ID or from the card being hovered over
        let targetStatusId;

        if (over.id.toString().startsWith('column-')) {
            // Dropped on empty column area
            targetStatusId = parseInt(over.id.toString().replace('column-', ''));
        } else {
            // Dropped on another card - find which column it belongs to
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
            // toast.success('Opportunity status updated');
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
            <div className="flex gap-4 overflow-x-auto pb-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex-shrink-0 w-80">
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 animate-pulse">
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                            <div className="space-y-3">
                                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-4 overflow-x-auto pb-4 min-h-[600px]">
                {statuses.map((status) => (
                    <div
                        key={status.id}
                        className="flex-shrink-0 w-80 bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4"
                    >
                        {/* Column Header */}
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: status.status_color }}
                                />
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                    {status.status_name}
                                </h3>
                            </div>
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                                {groupedOpportunities[status.id]?.length || 0}
                            </span>
                        </div>

                        {/* Drop Zone */}
                        <SortableContext
                            id={`status-${status.id}`}
                            items={groupedOpportunities[status.id]?.map((o) => o.opportunity_id) || []}
                            strategy={verticalListSortingStrategy}
                        >
                            <DroppableColumn statusId={status.id}>
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
                                    <div className="flex items-center justify-center h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                                        <p className="text-sm text-gray-400 dark:text-gray-500">
                                            Drop here
                                        </p>
                                    </div>
                                )}
                            </DroppableColumn>
                        </SortableContext>
                    </div>
                ))}
            </div>

            {/* Drag Overlay */}
            <DragOverlay>
                {activeOpportunity ? (
                    <OpportunityCard
                        opportunity={activeOpportunity}
                        onView={() => { }}
                        onEdit={() => { }}
                        onDelete={() => { }}
                    />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
