export interface LoginFormProps {
  userRole: string;
  email: string;
  password: string;
  status: "idle" | "loading" | "success" | "error";
  message: string | null;
  handleSetEmail: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSetPassword: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSignIn: (e: React.FormEvent) => void;
  handleGoogleSignIn: () => void;
}