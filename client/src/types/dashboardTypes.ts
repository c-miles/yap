import { User } from "./userTypes";

export interface DashboardProps {
  createRoom: () => void;
  handleJoinRoom: (roomName: string) => void;
  handleUsernameSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  isSubmitting: boolean;
  newUsername: string;
  setNewUsername: React.Dispatch<React.SetStateAction<string>>;
  userInfo: User | null;
  userExists: boolean | null;
  usernameError: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  onLogin: () => void;
  profileError: boolean;
  onRetryProfile: () => void;
}
