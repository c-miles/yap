import React, { useEffect, useRef } from "react";
import { Edit } from "lucide-react";
import { ProfileProps } from "../../types/profileTypes";
import { Button, Input, Card, Avatar, Heading, Text, Icon } from "../atoms";
import useDocumentTitle from "../../hooks/useDocumentTitle";

const Profile: React.FC<ProfileProps> = ({
  username,
  setUsername,
  handleSubmit,
  error,
  userInfo,
  isEditing,
  setIsEditing,
}) => {
  useDocumentTitle("Profile");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setIsEditing(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setIsEditing]);

  const formatDate = (date?: Date): string => {
    if (!date) return "Date not available";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const joinedDate = formatDate(userInfo?.createdAt);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-8">
      <Card padding="lg" className="w-full max-w-md">
        <div className="flex flex-col items-center">
          <Avatar src={userInfo?.picture} name={userInfo?.username || "User"} size="xl" className="mb-6" />

          <Heading level={1} size="lg" className="mb-2">
            {userInfo?.username}
          </Heading>

          <Text variant="muted" className="mb-6">
            Joined Yap: {joinedDate}
          </Text>

          {!isEditing && (
            <Button
              variant="secondary"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2"
            >
              <Icon icon={Edit} size="sm" />
              Edit profile
            </Button>
          )}
        </div>

        {isEditing && (
          <form ref={formRef} onSubmit={handleSubmit} className="mt-8">
            <Text as="label" className="block text-sm font-medium text-text mb-2">
              Username
            </Text>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              error={error}
              placeholder="Enter new username"
              className="mb-4"
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
            >
              Update Username
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
};

export default Profile;
