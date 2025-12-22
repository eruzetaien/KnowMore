import { useEffect, useState } from "react";
import { useProfileQuery, useUpdateProfile } from "../hooks/useUserProfile";

const ProfilePage = () => {
  const { data: user, isLoading, isError, error } = useProfileQuery();
  const { mutate: updateProfile, data: updatedUser, isPending} = useUpdateProfile();
  
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(user?.username || "");

  const handleUpdate = () => {
    if (!username.trim()) return;
      updateProfile({ username: username });
  };

  useEffect(() => {
    if (user?.username) {
      setUsername(user.username);
    }
  }, [user]);

  useEffect(() => {
    if (updatedUser?.username)
      setUsername(updatedUser.username);
  }, [updatedUser]);

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Failed to load profile: {(error as Error).message}</p>;

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center">
      <div className="w-1/3 min-w-[400px] border-profile">
        <div className="bg-platinum p-4">
          <div className="flex flex-col gap-y-1 items-center">
            {isEditing ? (
              <input
                className="text-3xl border-2 rounded-xl p-2 border-heathered-grey text-center focus:outline-none"
                value={username}
                autoFocus
                onChange={(e) => setUsername(e.target.value)}
                onBlur={() => setIsEditing(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleUpdate();
                    setIsEditing(false);
                  }
                }}
                disabled={isPending}
              />
              ) : (
                <h2
                  className="text-3xl cursor-pointer"
                  onClick={() => setIsEditing(true)}
                >
                  {username}
                </h2>
              )}

            <p className="text-l">{user?.description}</p>
          </div>
        </div>
      </div>
    </div>
    
  );
};

export default ProfilePage;
