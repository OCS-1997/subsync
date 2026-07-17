/* eslint-disable react/prop-types */
import {
  Home,
  Users,
  Zap,
  Target,
  Settings,
  Folder,
  FolderOpen,
  Clock,
  Phone,
  BookOpen,
  Cake,
  Contact,
  Briefcase,
  Globe,
  ShoppingBag,
  Building2,
  Repeat,
  Monitor,
  UserRound,
  TrendingUp,
  CalendarCheck,
  ClipboardList,
  Shield,
  Accessibility,
} from 'lucide-react';
import { cn } from '@/lib/utils.js';

const MATERIAL_TO_LUCIDE = {
  home: Home,
  person: UserRound,
  language: Globe,
  shop: ShoppingBag,
  business: Building2,
  subscriptions: Repeat,
  devices: Monitor,
  contacts: Contact,
  finance: TrendingUp,
  schedule: Clock,
  phone: Phone,
  contact_phone: Phone,
  cake: Cake,
  book: BookOpen,
  event_available: CalendarCheck,
  assignment: ClipboardList,
  admin_panel_settings: Shield,
  settings_accessibility: Accessibility,
  settings: Settings,
};

const FOLDER_ICONS = {
  users: Users,
  zap: Zap,
  target: Target,
  settings: Settings,
};

export default function SidebarIcon({
  node,
  active = false,
  expanded = true,
  size = 18,
  className,
}) {
  if (node?.type === 'folder') {
    const FolderIcon = FOLDER_ICONS[node.icon] || (expanded ? FolderOpen : Folder);
    return (
      <FolderIcon
        size={size}
        className={cn(
          'shrink-0 transition-colors duration-200',
          active ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground',
          className
        )}
        aria-hidden="true"
      />
    );
  }

  const LucideIcon = MATERIAL_TO_LUCIDE[node?.icon] || Home;

  if (node?.icon_type === 'material' && !MATERIAL_TO_LUCIDE[node?.icon]) {
    return (
      <span
        className={cn(
          'material-symbols-outlined shrink-0 transition-colors duration-200 leading-none',
          active ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground',
          className
        )}
        style={{ fontSize: size }}
        aria-hidden="true"
      >
        {node.icon}
      </span>
    );
  }

  return (
    <LucideIcon
      size={size}
      className={cn(
        'shrink-0 transition-colors duration-200',
        active ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground',
        className
      )}
      aria-hidden="true"
    />
  );
}
