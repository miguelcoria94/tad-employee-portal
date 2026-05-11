import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-brand-100 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-brand-500 md:flex-row">
        <div className="inline-flex items-center gap-2">
          <Heart className="h-4 w-4 text-accent-400" fill="currentColor" />
          <span className="font-semibold text-brand-700">TadHealth</span>
          <span className="text-brand-300">·</span>
          <span>Empowering those who care</span>
        </div>
        <p>
          © {new Date().getFullYear()} TadHealth Inc. All rights reserved. ·
          <span className="ml-1 font-medium">Internal Use Only</span>
        </p>
      </div>
    </footer>
  );
}