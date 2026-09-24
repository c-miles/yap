import { User } from "./userTypes";
import type { RoomActions } from "../hooks/useRoomActions";
import type { UsernameFormState } from "../hooks/useUsernameForm";

export interface DashboardProps extends RoomActions {
  usernameForm: UsernameFormState;
  userInfo: User | null;
  userExists: boolean | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  onLogin: () => void;
  profileError: boolean;
  onRetryProfile: () => void;
}
