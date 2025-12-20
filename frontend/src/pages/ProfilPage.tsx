import { useProfileQuery } from "../hooks/useUserProfile";

const ProfilePage = () => {
  const { data: user, isLoading, isError, error } = useProfileQuery();

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Failed to load profile: {(error as Error).message}</p>;

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center">
            <div className="w-1/3 min-w-[400px] border-profile">
              <div className="bg-platinum p-4">
                <div className="flex flex-col gap-y-1">
                  <h2 className="text-3xl">{user?.username}</h2>
                  <p className="text-l">{user?.description}</p>
                </div>
              </div>
            </div>
    </div>
    
  );
};

export default ProfilePage;
