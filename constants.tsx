
import { User } from './types';

export const DEFAULT_PASSWORD = '@iqc6368';

// Official Branding Palette
export const COLORS = {
  samsungBlue: '#0047BB',
  samsungNavy: '#00205B',
  samsungLightBlue: '#E6EEFF',
  white: '#FFFFFF',
  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate300: '#CBD5E1',
  slate700: '#334155',
  slate900: '#0F172A',
  success: '#00B140',
  danger: '#DA291C',
  warning: '#FFB81C'
};

export const INITIAL_USERS: User[] = [
  {
    name: "System Administrator",
    id: "16041988",
    part: "IQC Management",
    group: "ADMIN",
    role: "admin",
    password: "@nhd16488",
    company: "sev"
  }
];

export const PARTS = [
  "IQC G",
  "IQC 1P",
  "IQC 2P",
  "IQC 3P",
  "Injection Innovation Support T/F",
  "Other"
];
