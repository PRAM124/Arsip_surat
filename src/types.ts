export enum UserRole {
  ADMIN = "ADMIN",
  STAFF = "STAFF",
  PIMPINAN = "PIMPINAN",
}

export enum LetterType {
  INCOMING = "INCOMING",
  OUTGOING = "OUTGOING",
}

export enum LetterStatus {
  PENDING = "PENDING",
  PROCESSED = "PROCESSED",
  COMPLETED = "COMPLETED",
}

export interface User {
  id: number;
  username: string;
  full_name: string;
  role: UserRole;
}

export interface Letter {
  id: number;
  type: LetterType;
  letter_number: string;
  subject: string;
  sender: string;
  recipient: string;
  date: string;
  category: string;
  status: LetterStatus;
  file_path: string | null;
  created_at: string;
}

export interface Disposition {
  id: number;
  letter_id: number;
  from_user_id: number;
  to_user_id: number;
  from_name: string;
  to_name: string;
  notes: string;
  created_at: string;
}

export interface DashboardStats {
  incoming: number;
  outgoing: number;
  pending: number;
  processed: number;
}
