
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
  status: "booked" | "arrived" | "completed" | "cancellation_requested" | "cancelled";
}

export interface CourtRate {
  [courtId: number]: number;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: "admin" | "user";
}

export type NewUser = Omit<User, 'id'>;
