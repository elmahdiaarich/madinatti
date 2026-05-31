import Logo from "../shared/logos/Logo";

export default function AuthLayout({ title, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md p-8 rounded-xl">

        <div className="flex justify-center mb-6">
          <Logo />
        </div>

        <h1 className="text-2xl font-bold text-center text-primary-dark mb-6">
          {title}
        </h1>

        {children}
      </div>
    </div>
  );
}