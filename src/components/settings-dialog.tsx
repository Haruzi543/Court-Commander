
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
import { Trash2, PlusCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  courts: Court[];
  timeSlots: string[];
  courtRates: CourtRate;
  onSave: (settings: {courts: Court[], timeSlots: string[], rates: CourtRate}) => void;
}

export function SettingsDialog({ isOpen, onClose, courts, timeSlots, courtRates, onSave }: SettingsDialogProps) {
  const [localCourts, setLocalCourts] = useState<Court[]>([]);
  const [localTimeSlots, setLocalTimeSlots] = useState<string[]>([]);
  const [localRates, setLocalRates] = useState<CourtRate>({});
  const [newTimeSlot, setNewTimeSlot] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setLocalCourts(JSON.parse(JSON.stringify(courts)));
      setLocalTimeSlots([...timeSlots]);
      setLocalRates(JSON.parse(JSON.stringify(courtRates)));
    }
  }, [courts, timeSlots, courtRates, isOpen]);

  const handleRateChange = (courtId: number, value: string) => {
    const newRate = Number(value);
    if (!isNaN(newRate)) {
      setLocalRates((prev) => ({ ...prev, [courtId]: newRate }));
    }
  };

  const handleCourtNameChange = (courtId: number, name: string) => {
    setLocalCourts((prev) => prev.map(c => c.id === courtId ? {...c, name} : c));
  }
  
  const handleAddNewCourt = () => {
    const newId = localCourts.length > 0 ? Math.max(...localCourts.map(c => c.id)) + 1 : 1;
    setLocalCourts(prev => [...prev, {id: newId, name: `Court ${newId}`}]);
    setLocalRates(prev => ({...prev, [newId]: 20})); // Default rate
  }
  
  const handleRemoveCourt = (courtId: number) => {
    setLocalCourts(prev => prev.filter(c => c.id !== courtId));
    const newRates = {...localRates};
    delete newRates[courtId];
    setLocalRates(newRates);
  }
  
  const handleAddNewTimeSlot = () => {
    // Basic validation: HH:MM - HH:MM
    if (/^\d{2}:\d{2} - \d{2}:\d{2}$/.test(newTimeSlot) && !localTimeSlots.includes(newTimeSlot)) {
      const sortedSlots = [...localTimeSlots, newTimeSlot].sort();
      setLocalTimeSlots(sortedSlots);
      setNewTimeSlot("");
    } else {
      toast({
        variant: "destructive",
        title: "Invalid Time Slot",
        description: "Format must be HH:MM - HH:MM and must be unique.",
      });
    }
  }

  const handleRemoveTimeSlot = (slot: string) => {
    setLocalTimeSlots(prev => prev.filter(s => s !== slot));
  }

  const handleSave = () => {
    // Prevent saving with no courts or time slots
    if (localCourts.length === 0) {
      toast({ variant: "destructive", title: "Cannot save without any courts." });
      return;
    }
    if (localTimeSlots.length === 0) {
      toast({ variant: "destructive", title: "Cannot save without any time slots." });
      return;
    }

    onSave({
      courts: localCourts,
      timeSlots: localTimeSlots,
      rates: localRates
    });
    toast({
      title: "Settings Saved",
      description: "Courts, time slots, and rates have been updated.",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage courts, time slots, and hourly rates.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-6">
          <div className="space-y-6 py-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Manage Courts</h3>
              <div className="space-y-4">
                {localCourts.map((court) => (
                  <div key={court.id} className="flex items-center gap-2">
                    <Input
                      value={court.name}
                      onChange={(e) => handleCourtNameChange(court.id, e.target.value)}
                      className="flex-grow"
                    />
                    <div className="relative w-24">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        type="number"
                        value={localRates[court.id] || ''}
                        onChange={(e) => handleRateChange(court.id, e.target.value)}
                        className="pl-6"
                      />
                    </div>
                     <Button variant="ghost" size="icon" onClick={() => handleRemoveCourt(court.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="mt-4" onClick={handleAddNewCourt}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Court
              </Button>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-medium mb-2">Manage Time Slots</h3>
              <div className="space-y-2">
                {localTimeSlots.map((slot) => (
                  <div key={slot} className="flex items-center gap-2">
                    <Input value={slot} readOnly className="flex-grow bg-muted" />
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveTimeSlot(slot)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
               <div className="flex items-center gap-2 mt-4">
                  <Input 
                    placeholder="HH:MM - HH:MM" 
                    value={newTimeSlot}
                    onChange={(e) => setNewTimeSlot(e.target.value)}
                  />
                  <Button variant="outline" size="sm" onClick={handleAddNewTimeSlot}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Slot
                  </Button>
               </div>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
