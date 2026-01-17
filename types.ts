
export type UserRole = 'admin' | 'user';
export type CompanyType = 'sev' | 'vendor' | 'target';

export interface Notification {
  id: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: 'new_course' | 'reminder';
}

export interface User {
  name: string;
  id: string; // 8 digits
  part: string;
  group: string;
  role: UserRole;
  password: string;
  company: 'sev' | 'vendor';
  notifications?: Notification[];
}

export type CourseStatus = 'Plan' | 'Opening' | 'Closed' | 'Pending' | 'Finished';

export interface Completion {
  userId: string;
  timestamp: string;
  signature: string; // Base64 image
}

export interface CourseException {
  userId: string;
  reason: string;
}

export interface Course {
  id: string;
  name: string;
  start: string; // yyyy-MM-dd
  end: string;   // yyyy-MM-dd
  content: string;
  target: CompanyType;
  assignedUserIds?: string[]; // Only for 'target' type
  isActive: boolean;
  completions: Completion[];
  exceptions?: CourseException[];
}

export interface AppState {
  currentUser: User | null;
  courses: Course[];
  users: User[];
}
