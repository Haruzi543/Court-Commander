"use client";

import { useState, useEffect } from "react";
import type { Court, CourtRate } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  courts: Court[];
  courtRates: CourtRate;
  onSave: (rates: CourtRate) => void;
}

export function SettingsDialog({ isOpen, onClose, courts, courtRates, onSave }: SettingsDialogProps) {
  const [localRates, setLocalRates] = useState<CourtRate>(courtRates);
  const { toast } = useToast();

  useEffect(() => {
    setLocalRates(courtRates);
  }, [courtRates, isOpen]);

  const handleRateChange = (courtId: number, value: string) => {
    const newRate = Number(value);
    if (!isNaN(newRate)) {
      setLocalRates((prev) => ({ ...prev, [courtId]: newRate }));
    }
  };
  
  const handleSave = () => {
    onSave(localRates);
    toast({
      title: "Settings Saved",
      description: "Court rates have been updated.",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage court settings and hourly rates.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {courts.map((court) => (
            <div key={court.id} className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={`rate-${court.id}`} className="text-right">
                {court.name}
              </Label>
              <div className="col-span-3 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id={`rate-${court.id}`}
                  type="number"
                  value={localRates[court.id] || ''}
                  onChange={(e) => handleRateChange(court.id, e.target.value)}
                  className="pl-6"
                />
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
