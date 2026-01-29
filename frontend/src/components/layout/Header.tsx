'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Menu,
  Search,
  Bell,
  User,
  Moon,
  Sun,
  LogOut,
  Settings,
} from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="h-16 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] px-6 flex items-center justify-between sticky top-0 z-10">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-white transition-colors lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search cases, studies..."
            className="input pl-10 w-64 lg:w-80 bg-[var(--color-bg-tertiary)]"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs bg-[var(--color-bg-secondary)] rounded text-[var(--color-text-muted)]">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-white transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--color-accent-danger)] rounded-full" />
          </button>

          {showNotifications && (
            <NotificationDropdown onClose={() => setShowNotifications(false)} />
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 pr-3 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
              DR
            </div>
            <span className="text-sm text-[var(--color-text-secondary)] hidden sm:block">
              Dr. Rajesh
            </span>
          </button>

          {showUserMenu && (
            <UserDropdown onClose={() => setShowUserMenu(false)} />
          )}
        </div>
      </div>
    </header>
  );
}

function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const notifications = [
    {
      id: 1,
      title: 'New study uploaded',
      message: 'CT Chest scan ready for analysis',
      time: '2 min ago',
      unread: true,
    },
    {
      id: 2,
      title: 'Analysis complete',
      message: 'AI detected findings in Study #2847',
      time: '15 min ago',
      unread: true,
    },
    {
      id: 3,
      title: 'Report signed',
      message: 'Report for Patient MRN-45821 finalized',
      time: '1 hour ago',
      unread: false,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute right-0 top-full mt-2 w-80 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg shadow-lg overflow-hidden z-50"
    >
      <div className="p-3 border-b border-[var(--color-border)] flex items-center justify-between">
        <h3 className="font-semibold">Notifications</h3>
        <button className="text-sm text-[var(--color-accent-primary)] hover:underline">
          Mark all read
        </button>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`p-3 border-b border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)] cursor-pointer ${
              notif.unread ? 'bg-[var(--color-accent-primary)]/5' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              {notif.unread && (
                <span className="w-2 h-2 mt-2 rounded-full bg-[var(--color-accent-primary)]" />
              )}
              <div className="flex-1">
                <p className="font-medium text-sm">{notif.title}</p>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {notif.message}
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  {notif.time}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="p-2 border-t border-[var(--color-border)]">
        <button className="w-full py-2 text-sm text-center text-[var(--color-accent-primary)] hover:bg-[var(--color-bg-tertiary)] rounded">
          View all notifications
        </button>
      </div>
    </motion.div>
  );
}

function UserDropdown({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute right-0 top-full mt-2 w-56 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg shadow-lg overflow-hidden z-50"
    >
      <div className="p-3 border-b border-[var(--color-border)]">
        <p className="font-medium">Dr. Rajesh Kumar</p>
        <p className="text-sm text-[var(--color-text-secondary)]">
          radiologist@hospital.com
        </p>
      </div>
      <div className="p-2">
        <button className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded hover:bg-[var(--color-bg-tertiary)] text-left">
          <User className="w-4 h-4" />
          Profile
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded hover:bg-[var(--color-bg-tertiary)] text-left">
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>
      <div className="p-2 border-t border-[var(--color-border)]">
        <button className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded hover:bg-[var(--color-accent-danger)]/10 text-[var(--color-accent-danger)] text-left">
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </motion.div>
  );
}
