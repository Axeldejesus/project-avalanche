"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  size?: ModalSize;
  description?: string;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-[calc(100vw-1.5rem)] sm:max-w-sm',
  md: 'max-w-[calc(100vw-1.5rem)] sm:max-w-md',
  lg: 'max-w-[calc(100vw-1.5rem)] sm:max-w-lg',
  xl: 'max-w-[calc(100vw-1.5rem)] sm:max-w-2xl',
  xxl: 'max-w-[calc(100vw-1.5rem)] sm:max-w-5xl',
};

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className,
  size = 'md',
  description,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          'border-border bg-card text-foreground',
          sizeClasses[size],
          className
        )}
      >
        <DialogHeader>
          <DialogTitle className="font-oxanium text-lg font-semibold tracking-wide">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-muted-foreground text-sm">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
};

export default Modal;
