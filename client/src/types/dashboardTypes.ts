import { User } from "./userTypes";
import type { RoomActions } from "../hooks/useRoomActions";
import type { UsernameFormState } from "../hooks/useUsernameForm";

export interface DashboardProps extends RoomActions {
  usernameForm: UsernameFormState;
  userInfo: User | null;
  userExists: boolean | null;
  isLoading: boolean;
  profileError: boolean;
  onRetryProfile: () => void;
}
