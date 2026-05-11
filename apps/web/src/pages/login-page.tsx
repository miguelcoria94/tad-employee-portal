import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Heart } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Logo } from "@/components/brand/logo";

type Mode = "signin" | "signup";

export function LoginPage() {
  const { session, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner />
      </div>
    );
  }

  if (session) {
    const from = (location.state as { from?: Location } | null)?.from?.pathname ?? "/";
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        navigate("/", { replace: true });
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      if (error) {
        setError(error.message);
      } else {
        setInfo("Check your inbox for a confirmation link.");
      }
    }

    setSubmitting(false);
  }

  async function handleGoogle() {
    setError(null);
    setInfo(null);
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (error) {
      setError(error.message);
      setSubmitting(false);
    }
    // On success the browser is redirected to Google — no further state changes here.
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Hero panel */}
      <aside className="bg-brand-mesh relative hidden flex-col justify-between overflow-hidden bg-brand-900 p-12 text-white lg:flex">
        <div
          aria-hidden
          className="absolute -top-32 -right-24 h-96 w-96 rounded-full bg-highlight-400/30 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-accent-400/20 blur-3xl"
        />
        <div className="relative">
          <Logo variant="light" size="h-9" />
        </div>
        <div className="relative space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-highlight-200 ring-1 ring-inset ring-white/15">
            <Heart className="h-3 w-3 text-accent-400" fill="currentColor" />
            Empowering those who care
          </p>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
            The TadHealth Employee Portal.
          </h1>
          <p className="max-w-md text-lg text-highlight-100/90">
            Your command center for everything TadHealth — directory, daily
            updates, and the tools that move the mission forward.
          </p>
        </div>
        <p className="relative text-xs text-highlight-200/70">
          © {new Date().getFullYear()} TadHealth Inc. · Internal Use Only
        </p>
      </aside>

      {/* Form panel */}
      <section className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <Logo />
          </div>

          <h2 className="mt-8 text-2xl font-bold tracking-tight text-brand-900">
            {mode === "signin" ? "Sign in to your portal" : "Create your account"}
          </h2>
          <p className="mt-2 text-sm text-brand-500">
            {mode === "signin"
              ? "Use your TadHealth email to continue."
              : "We'll send a confirmation link to verify your email."}
          </p>

          <div className="mt-8 space-y-3">
            <button
              type="button"
              onClick={handleGoogle}
              disabled={submitting}
              className="inline-flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-brand-100 bg-white text-sm font-semibold text-brand-900 shadow-sm transition-colors hover:border-brand-200 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <i className="fa-brands fa-google text-base text-brand-700" aria-hidden="true" />
              Continue with Google
            </button>
          </div>

          <div className="relative my-5">
            <div aria-hidden className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-brand-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-400">
                or with email
              </span>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-700">
                Email
              </label>
              <Input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@tadhealth.com"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-700">
                Password
              </label>
              <Input
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            {info && (
              <div className="rounded-lg border border-highlight-200 bg-highlight-50 px-3 py-2 text-sm text-highlight-800">
                {info}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? (
                <Spinner className="border-white/40 border-t-white" />
              ) : (
                <>
                  {mode === "signin" ? "Sign in" : "Create account"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-brand-500">
            {mode === "signin" ? (
              <>
                Don't have an account?{" "}
                <button
                  type="button"
                  className="font-semibold text-brand-900 hover:text-brand-700"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                    setInfo(null);
                  }}
                >
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="font-semibold text-brand-900 hover:text-brand-700"
                  onClick={() => {
                    setMode("signin");
                    setError(null);
                    setInfo(null);
                  }}
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}