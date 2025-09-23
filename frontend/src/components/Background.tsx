export default function Background({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-dvw h-dvh bg-gradient-to-br from-[#B5AFB9] to-[#E5D6CF]">
      {children}
    </div>
  );
}
