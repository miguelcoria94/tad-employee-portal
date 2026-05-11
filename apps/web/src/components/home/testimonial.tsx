import { Quote } from "lucide-react";

export function Testimonial() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-20">
      <div className="relative overflow-hidden rounded-3xl bg-brand-900 px-8 py-12 text-white shadow-soft md:px-16 md:py-16">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-highlight-400/30 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-accent-400/20 blur-3xl"
          aria-hidden
        />

        <Quote className="h-10 w-10 text-highlight-400" />
        <blockquote className="relative mt-6 max-w-3xl text-xl font-medium leading-relaxed text-white md:text-2xl">
          “The TadHealth platform has proven intuitive and user-friendly,
          enabling our team to navigate the billing process confidently and
          efficiently. The training and onboarding process has been seamless,
          and the ongoing support from TadHealth's staff has been truly
          exceptional.”
        </blockquote>
        <div className="relative mt-8 flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-highlight-400 text-base font-bold text-brand-950">
            SD
          </div>
          <div>
            <p className="font-semibold">Shirley Diaz</p>
            <p className="text-sm text-highlight-200">
              Program Specialist, Special Services · Anaheim Elementary School
              District
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}