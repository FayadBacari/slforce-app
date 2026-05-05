import { create } from 'zustand';
import type { UserRole } from '@shared/types/user.types';

// Holds account credentials between the RegisterScreen (step 0)
// and the onboarding screens (steps 1-N).
// Stored in-memory only — cleared after successful registration.
interface PendingAccountData {
  firstName: string;
  lastName:  string;
  email:     string;
  password:  string;
  role:      UserRole;
}

interface PendingRegistrationStore {
  pendingAccount: PendingAccountData | null;
  savePendingAccountData:  (data: PendingAccountData) => void;
  clearPendingAccountData: () => void;
}

export const usePendingRegistrationStore = create<PendingRegistrationStore>((set) => ({
  pendingAccount: null,
  savePendingAccountData:  (data) => set({ pendingAccount: data }),
  clearPendingAccountData: () => set({ pendingAccount: null }),
}));
