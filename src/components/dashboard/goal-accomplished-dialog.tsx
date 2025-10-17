'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { type SavingsGoal, WithId } from '@/lib/types';
import { PartyPopper } from 'lucide-react';

type GoalAccomplishedDialogProps = {
  goal: WithId<SavingsGoal> | undefined | null;
  message: string | undefined | null;
  onOpenChange: (isOpen: boolean) => void;
};

export function GoalAccomplishedDialog({ goal, message, onOpenChange }: GoalAccomplishedDialogProps) {
  const isOpen = !!(goal && message);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
              <PartyPopper className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-2xl">Congratulations!</DialogTitle>
        </DialogHeader>
        <div className="my-4">
            <p className="text-lg font-semibold text-primary">{goal?.name}</p>
            <p className="text-muted-foreground mt-2">{message}</p>
        </div>
        <DialogFooter className="sm:justify-center">
          <Button type="button" onClick={() => onOpenChange(false)}>
            Awesome!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
