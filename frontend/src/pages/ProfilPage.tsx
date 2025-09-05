import { useProfileQuery } from "../hooks/useUserProfile";

const ProfilePage = () => {
  const { data: user, isLoading, isError, error } = useProfileQuery();

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Failed to load profile: {(error as Error).message}</p>;

  return (
    <div>
      <h2>{user?.username}</h2>
      <p>{user?.description}</p>
      {/* <small>Created at: {new Date(user!.createdAt).toLocaleString()}</small> */}
    </div>
  );
};

export default ProfilePage;
