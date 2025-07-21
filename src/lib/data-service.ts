
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import type { Booking, Court, CourtRate, User, NewUser } from './types';
import { DEFAULT_COURTS, DEFAULT_TIME_SLOTS, DEFAULT_HOURLY_RATE } from './constants';

const dataFilePath = path.join(process.cwd(), 'data/db.json');

interface DbData {
  bookings: Booking[];
  courts: Court[];
  timeSlots: string[];
  courtRates: CourtRate;
  users: User[];
}

async function readData(): Promise<DbData> {
  try {
    await fs.access(dataFilePath);
    const fileContent = await fs.readFile(dataFilePath, 'utf-8');
    const data = JSON.parse(fileContent) as DbData;
    if (!data.courts || !data.timeSlots || !data.courtRates || !data.bookings || !data.users) {
        return await initializeDefaultData(data.bookings || [], data.users || []);
    }
    return data;
  } catch (error) {
    return await initializeDefaultData([], []);
  }
}

async function initializeDefaultData(existingBookings: Booking[], existingUsers: User[]): Promise<DbData> {
    const defaultRates = DEFAULT_COURTS.reduce((acc, court) => {
        acc[court.id] = DEFAULT_HOURLY_RATE;
        return acc;
    }, {} as CourtRate);
    
    const adminUser: User = { id: "admin-user", email: "aekky@example.com", phone: "12345678", password: "55526477", role: "admin" };
    
    const users = [adminUser, ...existingUsers.filter(u => u.email !== 'aekky@example.com')];

    const defaultData: DbData = {
      bookings: existingBookings,
      courts: DEFAULT_COURTS,
      timeSlots: DEFAULT_TIME_SLOTS,
      courtRates: defaultRates,
      users: users,
    };
    await writeData(defaultData);
    return defaultData;
}


async function writeData(data: DbData): Promise<void> {
  try {
    const dir = path.dirname(dataFilePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error("Failed to write to data file", error);
    throw new Error("Could not write to data file.");
  }
}

export async function getData() {
  return await readData();
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
    const data = await readData();
    return data.users.find(u => u.email === email);
}

export async function addUser(newUserData: NewUser): Promise<User> {
    const data = await readData();
    if (data.users.some(u => u.email === newUserData.email)) {
        throw new Error("Email already exists.");
    }
    const newUser: User = {
        ...newUserData,
        id: new Date().toISOString() + Math.random(),
    };
    data.users.push(newUser);
    await writeData(data);
    return newUser;
}

export async function addBooking(newBookingData: Omit<Booking, 'id' | 'status'>): Promise<Booking> {
  const data = await readData();
  const newBooking: Booking = {
    ...newBookingData,
    id: new Date().toISOString() + Math.random(),
    status: 'booked',
  };
  data.bookings.push(newBooking);
  await writeData(data);
  return newBooking;
}

export async function updateBookingStatus(bookingId: string, status: "booked" | "arrived"): Promise<Booking> {
  const data = await readData();
  const bookingIndex = data.bookings.findIndex(b => b.id === bookingId);
  if (bookingIndex === -1) {
    throw new Error("Booking not found");
  }
  data.bookings[bookingIndex].status = status;
  await writeData(data);
  return data.bookings[bookingIndex];
}

export async function completeBooking(bookingId: string): Promise<Booking> {
    const data = await readData();
    const bookingIndex = data.bookings.findIndex(b => b.id === bookingId);
    if (bookingIndex === -1) {
      throw new Error("Booking not found");
    }
    data.bookings[bookingIndex].status = 'completed';
    await writeData(data);
    return data.bookings[bookingIndex];
}

export async function updateCourtSettings(settings: {courts: Court[], timeSlots: string[], rates: CourtRate}): Promise<DbData> {
  const data = await readData();
  const updatedData = {
    ...data,
    courts: settings.courts,
    timeSlots: settings.timeSlots,
    courtRates: settings.rates,
  };
  await writeData(updatedData);
  return updatedData;
}
