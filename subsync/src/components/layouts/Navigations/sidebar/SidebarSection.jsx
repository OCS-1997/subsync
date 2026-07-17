/* eslint-disable react/prop-types */
import { cn } from '@/lib/utils.js';

/** Thin visual section divider used between root-level blocks */
export default function SidebarSection({ className, children }) {
  return <div className={cn('space-y-0.5', className)}>{children}</div>;
}
