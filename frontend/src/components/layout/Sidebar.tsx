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
  Activity,
  Shield,
  LogOut,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '@/context/AuthContext';

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
      animate={{ width: isOpen ? 280 : 80 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="h-screen flex flex-col sticky top-0 z-50 flex-shrink-0"
      style={{
        background: 'linear-gradient(180deg, #111a2e 0%, #0c1222 100%)',
        borderRight: '1px solid rgba(148, 163, 184, 0.1)',
      }}
    >
      {/* Logo Section */}
      <div className="h-20 flex items-center px-5 border-b border-[rgba(148,163,184,0.1)]">
        <div className="flex items-center gap-4">
          {/* Premium Logo */}
          <div className="relative">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center animate-breathe"
              style={{
                background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #14b8a6 100%)',
                boxShadow: '0 0 30px rgba(13, 148, 136, 0.4), 0 4px 12px rgba(0,0,0,0.3)',
              }}
            >
              <Activity className="w-6 h-6 text-white" />
            </div>
            {/* Pulse indicator */}
            <div 
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#10b981] animate-pulse"
              style={{ boxShadow: '0 0 8px #10b981' }}
            />
          </div>
          
          <AnimatePresence mode="wait">
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex flex-col"
              >
                <span 
                  className="font-bold text-xl"
                  style={{
                    background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 50%, #3b82f6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  MediVision AI
                </span>
                <span className="text-xs text-[#64748b] font-medium">
                  Medical Imaging Platform
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* AI Status Indicator */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-4 mt-4"
          >
            <div 
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
              }}
            >
              <div className="relative">
                <Shield className="w-5 h-5 text-[#10b981]" />
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#f1f5f9]">AI System Active</p>
                <p className="text-xs text-[#64748b]">Ready for analysis</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 overflow-y-auto">
        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs font-semibold text-[#64748b] uppercase tracking-wider px-4 mb-3"
            >
              Main Menu
            </motion.p>
          )}
        </AnimatePresence>
        
        <ul className="space-y-1">
          {navItems.map((item, index) => (
            <motion.li 
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <NavItem
                {...item}
                isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
                isExpanded={isOpen}
              />
            </motion.li>
          ))}
        </ul>
      </nav>

      {/* Bottom Navigation */}
      <div className="border-t border-[rgba(148,163,184,0.1)] py-4 px-3">
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

      {/* User Profile & Logout */}
      <div className="border-t border-[rgba(148,163,184,0.1)] p-3">
        <UserProfile isOpen={isOpen} />
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-24 w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110"
        style={{
          background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
          boxShadow: '0 2px 8px rgba(13, 148, 136, 0.4)',
          border: 'none',
        }}
      >
        {isOpen ? (
          <ChevronLeft className="w-4 h-4 text-white" />
        ) : (
          <ChevronRight className="w-4 h-4 text-white" />
        )}
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
        'flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative group',
        isActive
          ? 'text-white'
          : 'text-[#94a3b8] hover:text-[#f1f5f9]'
      )}
      style={{
        background: isActive 
          ? 'linear-gradient(135deg, rgba(13, 148, 136, 0.2), rgba(6, 182, 212, 0.1))'
          : 'transparent',
        border: isActive ? '1px solid rgba(13, 148, 136, 0.3)' : '1px solid transparent',
        boxShadow: isActive ? '0 0 20px rgba(13, 148, 136, 0.15)' : 'none',
      }}
    >
      {isActive && (
        <motion.div
          layoutId="activeNav"
          className="absolute left-0 w-1 h-8 rounded-r-full"
          style={{
            background: 'linear-gradient(180deg, #0d9488, #06b6d4)',
            boxShadow: '0 0 10px #0d9488',
          }}
        />
      )}
      
      <div 
        className={clsx(
          'w-9 h-9 rounded-lg flex items-center justify-center transition-all',
          isActive ? '' : 'group-hover:bg-[rgba(148,163,184,0.1)]'
        )}
        style={{
          background: isActive 
            ? 'linear-gradient(135deg, #0d9488, #14b8a6)' 
            : 'transparent',
          boxShadow: isActive ? '0 2px 8px rgba(13, 148, 136, 0.3)' : 'none',
        }}
      >
        <Icon className={clsx('w-5 h-5', isActive ? 'text-white' : '')} />
      </div>
      
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
        <div 
          className="absolute left-full ml-3 px-3 py-2 rounded-lg text-sm font-medium opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50"
          style={{
            background: 'rgba(17, 26, 46, 0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(148, 163, 184, 0.15)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            color: '#f1f5f9',
          }}
        >
          {name}
        </div>
      )}
    </Link>
  );
}

function UserProfile({ isOpen }: { isOpen: boolean }) {
  const { user, logout } = useAuth();

  return (
    <div className={`flex items-center gap-3 px-2 transition-all ${!isOpen ? 'justify-center' : ''}`}>
      <div className="relative">
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-teal-500 to-blue-500 flex items-center justify-center text-white font-bold shadow-lg shadow-teal-500/20">
          {user?.name?.[0] || 'U'}
        </div>
        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#0c1222] rounded-full"></div>
      </div>
      
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="flex-1 min-w-0"
          >
            <p className="text-sm font-medium text-white truncate">{user?.name || 'Doctor'}</p>
            <button 
              onClick={logout}
              className="group flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 transition-colors mt-0.5"
            >
              <LogOut className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
              Sign Out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
