import { useQuery } from "@tanstack/react-query";
import type { DepartmentRow } from "@tadhealth/shared";
import { api } from "@/lib/api";
import { Hero } from "@/components/home/hero";
import { DepartmentList } from "@/components/home/department-list";
import { UpcomingWidget } from "@/components/home/upcoming-widget";
import { Testimonial } from "@/components/home/testimonial";
import { Spinner } from "@/components/ui/spinner";

export function HomePage() {
  const { data, isLoading } = useQuery<{ departments: DepartmentRow[] }>({
    queryKey: ["departments"],
    queryFn: () => api("/api/v1/departments"),
  });

  return (
    <>
      <Hero />
      <UpcomingWidget />
      {isLoading ? (
        <div className="grid place-items-center py-24">
          <Spinner />
        </div>
      ) : (
        <DepartmentList departments={data?.departments ?? []} />
      )}
      <Testimonial />
    </>
  );
}