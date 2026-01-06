'use client';

import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, RefObject } from 'react';
import { useDebounce } from 'use-debounce';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Command, CommandInput } from '@/components/ui/command';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useOnClickOutside } from '@/hooks/use-on-click-outside';

interface SearchInputProps {
  className?: string;
  variant?: 'default' | 'dialog';
}

export function SearchInput({ className, variant = 'default' }: SearchInputProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 300);
  const inputRef = useRef<HTMLInputElement>(null);
  const commandRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(commandRef as RefObject<HTMLElement>, () => {
    setOpen(false);
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    router.push(`/search?q=${encodeURIComponent(query)}`);
    setOpen(false);
  };

  const content = (
    <form onSubmit={handleSearch} className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        ref={inputRef}
        type="search"
        placeholder="Search users, projects, or collections..."
        className={`pl-10 w-full ${variant === 'dialog' ? 'bg-background' : 'bg-muted'}`}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
      />
      {variant === 'default' && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      )}
    </form>
  );

  if (variant === 'dialog') {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className={`relative h-9 w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64 ${className}`}
          >
            <Search className="mr-2 h-4 w-4" />
            <span>Search...</span>
            <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        </DialogTrigger>
        <DialogContent className="p-0 overflow-hidden">
          <Command ref={commandRef} className="rounded-lg border shadow-md">
            <CommandInput
              placeholder="Search users, projects, or collections..."
              value={query}
              onValueChange={setQuery}
              className="h-12"
            />
            <div className="p-2">
              {/* Search results would go here */}
              <div className="py-6 text-center text-sm">
                <p>Type to search for users, projects, or collections</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Press Enter to view all results
                </p>
              </div>
            </div>
          </Command>
        </DialogContent>
      </Dialog>
    );
  }

  return content;
}
