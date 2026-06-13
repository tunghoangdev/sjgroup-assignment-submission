'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  MapPin,
  Calendar,
  Home,
  Plus,
  ArrowRight,
  Command,
} from 'lucide-react';
import { useHotkey } from '@/hooks/use-hotkeys';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  action?: () => void;
  shortcut?: string;
}

const COMMANDS: CommandItem[] = [
  {
    id: 'dashboard',
    label: 'Go to Dashboard',
    description: 'View dashboard overview',
    icon: Home,
    href: '/',
    shortcut: 'g d',
  },
  {
    id: 'locations',
    label: 'View Locations',
    description: 'Browse location hierarchy',
    icon: MapPin,
    href: '/locations',
    shortcut: 'g l',
  },
  {
    id: 'new-location',
    label: 'Create Location',
    description: 'Add a new location',
    icon: Plus,
    href: '/locations/new',
    shortcut: 'n l',
  },
  {
    id: 'bookings',
    label: 'View Bookings',
    description: 'Browse all bookings',
    icon: Calendar,
    href: '/bookings',
    shortcut: 'g b',
  },
  {
    id: 'new-booking',
    label: 'Create Booking',
    description: 'Add a new booking',
    icon: Plus,
    href: '/bookings/new',
    shortcut: 'n b',
  },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // CMD+K / Ctrl+K to open
  useHotkey({
    key: 'k',
    metaKey: true,
    preventDefault: true,
    callback: () => setOpen((open) => !open),
  });

  // Filter commands
  const filtered = COMMANDS.filter((cmd) => {
    const q = query.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(q) ||
      cmd.description?.toLowerCase().includes(q)
    );
  });

  const handleSelect = useCallback(
    (item: CommandItem) => {
      setOpen(false);
      setQuery('');
      if (item.href) {
        router.push(item.href);
      } else if (item.action) {
        item.action();
      }
    },
    [router]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          handleSelect(filtered[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    },
    [filtered, selectedIndex, handleSelect]
  );

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) {
    return <CommandKHint />;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-background/80 backdrop-blur-sm pt-[20vh]"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-lg border bg-popover shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input */}
        <div className="flex items-center border-b px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search commands..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd className="ml-auto inline-flex h-5 items-center rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[300px] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No commands found.
            </div>
          ) : (
            <div className="px-2">
              {filtered.map((item, index) => {
                const Icon = item.icon;
                const isSelected = index === selectedIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={
                      "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors cursor-pointer " +
                      (isSelected
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50")
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{item.label}</p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <ArrowRight
                      className={
                        "h-3.5 w-3.5 shrink-0 transition-opacity " +
                        (isSelected ? "opacity-100" : "opacity-0")
                      }
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <kbd className="rounded border bg-muted px-1">↑↓</kbd>
            <span>Navigate</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="rounded border bg-muted px-1">Enter</kbd>
            <span>Select</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommandKHint() {
  return (
    <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
      <span className="sr-only">Press</span>
      <kbd className="inline-flex h-5 items-center rounded border bg-muted px-1.5 text-[10px] font-medium">
        CMD
      </kbd>
      <kbd className="inline-flex h-5 items-center rounded border bg-muted px-1.5 text-[10px] font-medium">
        K
      </kbd>
    </div>
  );
}
