import { ArrowRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/auth/auth-context";
import { formatDateLong } from "@/lib/utils";

export function Hero() {
  const { me } = useAuth();
  const firstName = me?.employee?.firstName;

  return (
    <section className="bg-brand-mesh relative overflow-hidden border-b border-brand-100">
      <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3 text-sm text-brand-600">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/80 px-3 py-1 font-medium shadow-sm backdrop-blur">
              <Calendar className="h-3.5 w-3.5 text-highlight-600" />
              {formatDateLong()}
            </span>
            <span className="hidden text-xs uppercase tracking-[0.2em] text-brand-400 md:inline">
              · Internal Use Only
            </span>
          </div>

          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-brand-900 md:text-6xl">
            {firstName ? `Welcome back, ${firstName}.` : "Empowering those who care."}
          </h1>

          <p className="max-w-2xl text-lg text-brand-600 md:text-xl">
            Your command center. Access the tools, resources, and updates you
            need to support our mission of accessible mental health care in
            schools.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg">
              View Daily Updates
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg">
              Browse Team Directory
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}