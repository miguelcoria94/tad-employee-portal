import { useAuth } from "@/auth/auth-context";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function todayString() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function Hero() {
  const { me } = useAuth();
  const firstName = me?.employee?.firstName;

  return (
    <section className="border-b border-brand-100 bg-gradient-to-r from-brand-900 to-brand-800">
      <div className="mx-auto max-w-7xl px-6 py-8 md:py-10">
        <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
          {greeting()}
          {firstName ? `, ${firstName}` : ""}.
        </h1>
        <p className="mt-1 text-sm text-brand-200 md:text-base">
          It's {todayString()}
        </p>
      </div>
    </section>
  );
}
