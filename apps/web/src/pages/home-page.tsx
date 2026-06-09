import { useQuery } from "@tanstack/react-query";
import type { DepartmentRow } from "@tadhealth/shared";
import { api } from "@/lib/api";
import { Hero } from "@/components/home/hero";
import { DepartmentList } from "@/components/home/department-list";
import { UpcomingWidget } from "@/components/home/upcoming-widget";
import { OnboardingChecklist } from "@/components/home/onboarding-checklist";
import { ActionItems } from "@/components/home/action-items";
import { QuickLinks } from "@/components/home/quick-links";
import { CoworkersWidget } from "@/components/home/coworkers-widget";
import { Spinner } from "@/components/ui/spinner";

export function HomePage() {
  const { data, isLoading } = useQuery<{ departments: DepartmentRow[] }>({
    queryKey: ["departments"],
    queryFn: () => api("/api/v1/departments"),
  });

  return (
    <>
      <Hero />
      <OnboardingChecklist />
      <ActionItems />
      <QuickLinks />

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <UpcomingWidget inline />
          <CoworkersWidget />
        </div>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-24">
          <Spinner />
        </div>
      ) : (
        <DepartmentList departments={data?.departments ?? []} />
      )}
    </>
  );
}
