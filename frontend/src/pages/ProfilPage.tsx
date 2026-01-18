import { useEffect, useState } from "react";
import { useProfileQuery, useUpdateProfile } from "../hooks/useUserProfile";

const ProfilePage = () => {
  const { data: fetchResponse, isLoading, isError, error } = useProfileQuery();
  const user = fetchResponse?.data;
  const { mutate: updateProfile, data: updateResponse, isPending } = useUpdateProfile();
  const updatedUser = updateResponse?.data;

  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);

  const [username, setUsername] = useState("");
  const [description, setDescription] = useState("");

  const handleUsernameUpdate = () => {
    if (!username.trim()) return;
    updateProfile({ username });
  };

  const handleDescriptionUpdate = () => {
    updateProfile({ description });
  };

  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setDescription(user.description || "");
    }
  }, [user]);

  useEffect(() => {
    if (updatedUser) {
      setUsername(updatedUser.username || "");
      setDescription(updatedUser.description || "");
    }
  }, [updatedUser]);

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Failed to load profile: {(error as Error).message}</p>;

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center">
      <div className="w-1/3 min-w-[400px] border-profile">
        <div className="bg-platinum p-4">
          <div className="flex flex-col items-center">
            {/* Username */}
            {isEditingUsername ? (
              <input
                className="text-3xl border-2 rounded-xl p-2 border-heathered-grey text-center focus:outline-none w-full"
                value={username}
                autoFocus
                onChange={(e) => setUsername(e.target.value)}
                onBlur={() => setIsEditingUsername(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleUsernameUpdate();
                    setIsEditingUsername(false);
                  }
                }}
                disabled={isPending}
              />
            ) : (
              <h2
                className="text-3xl cursor-pointer"
                onClick={() => setIsEditingUsername(true)}
              >
                {username}
              </h2>
            )}

            <hr className="w-4/5 border-t border-heathered-grey my-2" />

            {/* Description */}
            {isEditingDescription ? (
              <textarea
                className="text-l border-2 rounded-xl p-2 border-heathered-grey text-center focus:outline-none resize-none w-full"
                value={description}
                autoFocus
                rows={3}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => {setIsEditingDescription(false);}}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleDescriptionUpdate();
                    setIsEditingDescription(false);
                  }
                }}
                disabled={isPending}
              />
            ) : (
              <p
                className="text-l cursor-pointer text-center"
                onClick={() => setIsEditingDescription(true)}
              >
                {description || "Click to add a description"}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
