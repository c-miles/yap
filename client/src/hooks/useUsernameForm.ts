import { FormEvent, useState } from "react";

export interface UsernameFormState {
  username: string;
  setUsername: (username: string) => void;
  error: string;
  isSubmitting: boolean;
  submit: (e: FormEvent<HTMLFormElement>) => Promise<void>;
}

// save resolves to an error message, or "" when the name was saved
export default function useUsernameForm(save: (username: string) => Promise<string>): UsernameFormState {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    const saveError = await save(username);
    setError(saveError);
    setIsSubmitting(false);
    if (!saveError) {
      setUsername("");
    }
  };

  return { username, setUsername, error, isSubmitting, submit };
}
