'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange?.(false)}
      />

      {/* Content */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div
          className="bg-background rounded-lg shadow-lg max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

const DialogContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <div className={cn('p-6', className)}>{children}</div>;

const DialogHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <div className={cn('mb-4', className)}>{children}</div>;

const DialogTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <h2 className={cn('text-lg font-semibold', className)}>{children}</h2>;

const DialogFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <div className={cn('flex justify-end gap-2 mt-4', className)}>{children}</div>;

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter };
