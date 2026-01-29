'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Upload,
  FolderOpen,
  FileImage,
  Brain,
  FileText,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
} from 'lucide-react';
import clsx from 'clsx';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Upload', href: '/upload', icon: Upload },
  { name: 'Cases', href: '/cases', icon: FolderOpen },
  { name: 'Studies', href: '/studies', icon: FileImage },
  { name: 'AI Analysis', href: '/analyze', icon: Brain },
  { name: 'Reports', href: '/reports', icon: FileText },
];

const bottomNavItems = [
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Help', href: '/help', icon: HelpCircle },
];

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? 260 : 80 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="h-screen bg-[var(--color-bg-secondary)] border-r border-[var(--color-border)] flex flex-col sticky top-0"
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <AnimatePresence mode="wait">
            {isOpen && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-bold text-lg gradient-text whitespace-nowrap"
              >
                MediVision AI
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.name}>
              <NavItem
                {...item}
                isActive={pathname === item.href}
                isExpanded={isOpen}
              />
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Navigation */}
      <div className="border-t border-[var(--color-border)] py-4 px-3">
        <ul className="space-y-1">
          {bottomNavItems.map((item) => (
            <li key={item.name}>
              <NavItem
                {...item}
                isActive={pathname === item.href}
                isExpanded={isOpen}
              />
            </li>
          ))}
        </ul>
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-white transition-colors"
      >
        {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
    </motion.aside>
  );
}

interface NavItemProps {
  name: string;
  href: string;
  icon: React.ElementType;
  isActive: boolean;
  isExpanded: boolean;
}

function NavItem({ name, href, icon: Icon, isActive, isExpanded }: NavItemProps) {
  return (
    <Link
      href={href}
      className={clsx(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative group',
        isActive
          ? 'bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)]'
          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-white'
      )}
    >
      {isActive && (
        <motion.div
          layoutId="activeNav"
          className="absolute left-0 w-1 h-6 bg-[var(--color-accent-primary)] rounded-r-full"
        />
      )}
      <Icon className="w-5 h-5 flex-shrink-0" />
      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="font-medium whitespace-nowrap"
          >
            {name}
          </motion.span>
        )}
      </AnimatePresence>
      
      {/* Tooltip for collapsed state */}
      {!isExpanded && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-[var(--color-bg-tertiary)] rounded text-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
          {name}
        </div>
      )}
    </Link>
  );
}
