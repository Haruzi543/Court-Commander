export interface Court {
  id: number;
  name: string;
}

export interface Booking {
  id: string;
  courtId: number;
  date: string; // YYYY-MM-DD format
  timeSlot: string;
  customerName: string;
  customerPhone: string;
  status: "booked" | "arrived" | "completed";
}

export interface CourtRate {
  [courtId: number]: number;
}
