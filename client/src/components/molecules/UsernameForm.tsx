import React from "react";
import { Button, Input } from "../atoms";
import { UsernameFormState } from "../../hooks/useUsernameForm";

const UsernameForm: React.FC<{ form: UsernameFormState }> = ({ form }) => (
  <form onSubmit={form.submit}>
    <Input
      type="text"
      value={form.username}
      onChange={(e) => form.setUsername(e.target.value)}
      placeholder="Choose a username"
      required
      error={form.error}
    />
    <Button type="submit" className="w-full mt-4" disabled={form.isSubmitting}>
      {form.isSubmitting ? "Saving…" : "Set username"}
    </Button>
  </form>
);

export default UsernameForm;
