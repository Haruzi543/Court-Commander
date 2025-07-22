
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
import { Trash2, PlusCircle, Clock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  courts: Court[];
  timeSlots: string[];
  courtRates: CourtRate;
  onSave: (settings: {courts: Court[], timeSlots: string[], rates: CourtRate}) => void;
}

const generateTimeOptions = () => {
    const options = [];
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 30) {
            const hour = String(h).padStart(2, '0');
            const minute = String(m).padStart(2, '0');
            options.push(`${hour}:${minute}`);
        }
    }
    return options;
}

const timeOptions = generateTimeOptions();

export function SettingsDialog({ isOpen, onClose, courts, timeSlots, courtRates, onSave }: SettingsDialogProps) {
  const [localCourts, setLocalCourts] = useState<Court[]>([]);
  const [localRates, setLocalRates] = useState<CourtRate>({});
  const [openingTime, setOpeningTime] = useState("09:00");
  const [closingTime, setClosingTime] = useState("21:00");
  const [slotDuration, setSlotDuration] = useState(60);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setLocalCourts(JSON.parse(JSON.stringify(courts)));
      setLocalRates(JSON.parse(JSON.stringify(courtRates)));
      if (timeSlots.length > 0) {
          setOpeningTime(timeSlots[0].split(' - ')[0]);
          setClosingTime(timeSlots[timeSlots.length - 1].split(' - ')[1]);
      }
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
    setLocalRates(prev => ({...prev, [60000]: 20})); // Default rate
  }
  
  const handleRemoveCourt = (courtId: number) => {
    setLocalCourts(prev => prev.filter(c => c.id !== courtId));
    const newRates = {...localRates};
    delete newRates[courtId];
    setLocalRates(newRates);
  }

  const generateTimeSlots = () => {
    const slots = [];
    const [startH, startM] = openingTime.split(':').map(Number);
    const [endH, endM] = closingTime.split(':').map(Number);
    
    let current = new Date();
    current.setHours(startH, startM, 0, 0);

    const end = new Date();
    end.setHours(endH, endM, 0, 0);

    while (current < end) {
        const slotStart = current.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit'});
        current.setMinutes(current.getMinutes() + slotDuration);
        const slotEnd = current.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit'});
        if (current > end) break;
        slots.push(`${slotStart} - ${slotEnd}`);
    }
    return slots;
  }

  const handleSave = () => {
    if (localCourts.length === 0) {
      toast({ variant: "destructive", title: "Cannot save without any courts." });
      return;
    }
    
    const newTimeSlots = generateTimeSlots();
    if (newTimeSlots.length === 0) {
        toast({
            variant: "destructive",
            title: "Invalid Time Settings",
            description: "Closing time must be after opening time. No time slots were generated."
        });
        return;
    }

    onSave({
      courts: localCourts,
      timeSlots: newTimeSlots,
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
      <DialogContent className="sm:max-w-4xl">
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
                    <div className="relative w-32">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₭</span>
                      <Input
                        type="number"
                        value={localRates[court.id] || ''}
                        onChange={(e) => handleRateChange(court.id, e.target.value)}
                        className="pl-8"
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
              <p className="text-sm text-muted-foreground mb-4">
                Set the opening hours and slot duration to automatically generate the schedule.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label>Opening Time</Label>
                    <Select value={openingTime} onValueChange={setOpeningTime}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                            {timeOptions.map(time => <SelectItem key={`open-${time}`} value={time}>{time}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label>Closing Time</Label>
                    <Select value={closingTime} onValueChange={setClosingTime}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                            {timeOptions.map(time => <SelectItem key={`close-${time}`} value={time}>{time}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label>Slot Duration</Label>
                    <Select value={String(slotDuration)} onValueChange={(val) => setSlotDuration(Number(val))}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="60">60 minutes</SelectItem>
                            <SelectItem value="90">90 minutes</SelectItem>
                            <SelectItem value="120">120 minutes</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
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
