import type { LucideIcon } from 'lucide-react';
import {
  LayoutGrid,
  ListChecks,
  Wallet,
  BadgeCheck,
  MessageSquare,
  Truck,
  LifeBuoy,
  FileText,
  Settings,
  User,
  Handshake,
  Users,
} from 'lucide-react';

export type NavItem = {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  /** 1 = заказчик, 2 = исполнитель, 3 = диспетчер; undefined = все */
  roles?: number[];
  /** Пусто — пункт виден в обоих тарифах */
  plans?: Array<'basic' | 'pro'>;
  footer?: boolean;
  alert?: boolean;
  stub?: boolean;
};

export const MAIN_NAV: NavItem[] = [
  { id: 'home', label: 'Главная', path: '/', icon: LayoutGrid },
  { id: 'feed', label: 'Лента заказов', path: '/feed', icon: ListChecks },
  { id: 'finance', label: 'Финансы', path: '/finance', icon: Wallet, plans: ['pro'] },
  { id: 'tariff', label: 'Тариф', path: '/finance', icon: BadgeCheck, plans: ['basic'] },
  { id: 'chats', label: 'Чат', path: '/chats', icon: MessageSquare },
  { id: 'vehicles', label: 'Мои машины', path: '/vehicles', icon: Truck, roles: [2, 3] },
  { id: 'drivers', label: 'Водители', path: '/drivers', icon: Users, roles: [3] },
  { id: 'support', label: 'Поддержка', path: '/support', icon: LifeBuoy, stub: true },
  { id: 'documents', label: 'Документы', path: '/documents', icon: FileText, stub: true },
  { id: 'settings', label: 'Настройки', path: '/settings', icon: Settings },
  { id: 'profile', label: 'Профиль', path: '/profile', icon: User },
];

export const FOOTER_NAV: NavItem[] = [
  { id: 'partners', label: 'Партнёрам', path: '/partners', icon: Handshake, footer: true },
];

export const MOBILE_TABS: NavItem[] = [
  { id: 'home', label: 'Главная', path: '/', icon: LayoutGrid },
  { id: 'feed', label: 'Лента', path: '/feed', icon: ListChecks },
  { id: 'chats', label: 'Чат', path: '/chats', icon: MessageSquare },
  { id: 'profile', label: 'Профиль', path: '/profile', icon: User },
];

export function filterNavByRole(items: NavItem[], userType: number, plan: 'basic' | 'pro' = 'pro'): NavItem[] {
  return items.filter((item) => {
    if (item.roles && !item.roles.includes(userType)) return false;
    if (item.plans && !item.plans.includes(plan)) return false;
    return true;
  });
}

export function isNavActive(pathname: string, path: string): boolean {
  if (path === '/') return pathname === '/' || pathname === '';
  return pathname === path || pathname.startsWith(`${path}/`);
}
