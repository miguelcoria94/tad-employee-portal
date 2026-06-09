import { getEmployee, listEmployees } from "../employees.js";
import { listDepartmentsForUser } from "../departments.js";
import { listManagersForDepartment } from "../department-managers.js";
import { getProfileWithEmployee } from "../profiles.js";
import { getMyBalances, listMine } from "../time-off.js";
import { listOpenJobs } from "../internal-jobs.js";
import { listMyPendingFeedback } from "../feedback.js";
import { listCompanyUpdates } from "../company-updates.js";
import {
  getResourceById,
  listAllResources,
} from "../department-resources.js";
import { COMPANY_RESOURCE_SCOPE } from "@tadhealth/shared";
import { htmlToText } from "../../lib/sanitize.js";
import { getHelpTopic, helpTopicList } from "./knowledge.js";

type ResourceRow = Awaited<ReturnType<typeof listAllResources>>[number];

/** The in-app route (rich document) or external URL the user should open. */
function resourceLink(r: ResourceRow): string | null {
  if (r.content && r.content.trim()) return `/resources/${r.id}`;
  return r.url ?? null;
}

/**
 * Build a ~280-char snippet centered on the first matched term so the model
 * sees the relevant passage (e.g. the "$150 office supplies stipend" line)
 * rather than always the top of the document.
 */
function snippetAround(text: string, terms: string[]): string | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  let idx = -1;
  for (const t of terms) {
    const i = lower.indexOf(t);
    if (i >= 0 && (idx < 0 || i < idx)) idx = i;
  }
  if (idx < 0) idx = 0;
  const start = Math.max(0, idx - 80);
  const slice = text.slice(start, start + 280);
  return `${start > 0 ? "…" : ""}${slice}${start + 280 < text.length ? "…" : ""}`;
}

function resourceScope(r: ResourceRow): string {
  return r.departmentName === COMPANY_RESOURCE_SCOPE
    ? "Company-wide"
    : r.departmentName;
}

function fullName(first: string, last?: string | null): string {
  return `${first} ${last ?? ""}`.trim();
}

/** Resolve manager display names for a set of managerIds (deduped). */
async function resolveManagerNames(
  managerIds: Array<string | null | undefined>,
): Promise<Map<string, string>> {
  const unique = [...new Set(managerIds.filter((id): id is string => !!id))];
  const out = new Map<string, string>();
  await Promise.all(
    unique.map(async (id) => {
      const m = await getEmployee(id);
      if (m) out.set(id, fullName(m.firstName, m.lastName));
    }),
  );
  return out;
}

// Each tool is read-only and scoped to the asking user so the model can only
// ever see data that user is already allowed to see.
export type AssistantTool = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  run: (userId: string, args: Record<string, unknown>) => Promise<unknown>;
};

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

// Common words that carry no directory-search signal. Dropped before scoring so
// a natural-language query like "everyone in Customer Experience based in San
// Diego" reduces to its meaningful terms (customer, experience, san, diego).
const DIRECTORY_STOPWORDS = new Set([
  "the", "a", "an", "of", "in", "on", "at", "to", "and", "or", "is", "are",
  "who", "whom", "whose", "do", "does", "did", "for", "from", "by", "with",
  "based", "everyone", "everybody", "all", "anybody", "anyone", "find", "list",
  "show", "me", "my", "our", "us", "please", "department", "dept", "team",
  "people", "person", "someone", "works", "working", "work", "located",
  "location", "reach", "contact", "runs", "run", "lead", "leads", "manages",
]);

/** Acronym formed from the initials of each word in a title (e.g. "Chief Technology Officer" -> "cto"). */
function titleAcronym(title: string | null | undefined): string {
  return (title ?? "")
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .join("")
    .toLowerCase();
}

/** Leadership titles that indicate someone heads/leads a department. */
function isLeadershipTitle(title: string | null | undefined): boolean {
  return /\b(chief|head|vp|vice president|president|director|lead)\b/i.test(
    title ?? "",
  );
}

export const ASSISTANT_TOOLS: AssistantTool[] = [
  {
    name: "search_employees",
    description:
      "Search the employee directory by name (full or partial), title, department, or LOCATION. ALWAYS use this for any 'who is X', 'who does X', 'what is X's role/title', 'who works in <city>', or 'how do I reach X' question BEFORE answering. Multi-word queries (e.g. 'Customer Experience San Diego') match on ALL the terms, so you can combine a department and a city in one query. Title acronyms work too (e.g. 'CTO', 'CFO', 'COO'). Returns each match with title, department, location, email, and manager.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Name (e.g. 'Nick Bingaman'), title (or its acronym like 'CTO'), department, and/or city to search for. You may combine them, e.g. 'Customer Experience San Diego'.",
        },
      },
      required: ["query"],
    },
    run: async (_userId, args) => {
      const all = await listEmployees({ includeInactive: false });
      const terms = str(args.query)
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((t) => t.length > 1 && !DIRECTORY_STOPWORDS.has(t));

      let rows = all;
      if (terms.length) {
        const scoreOf = (e: (typeof all)[number]): number => {
          const dept = [e.department, e.subDepartment]
            .filter(Boolean)
            .join(" ");
          const haystack =
            `${e.firstName} ${e.lastName ?? ""} ${e.title ?? ""} ${dept} ${e.location ?? ""} ${e.email ?? ""}`.toLowerCase();
          const acronym = titleAcronym(e.title);
          let score = 0;
          for (const t of terms) {
            if (haystack.includes(t)) score += 1;
            else if (acronym && acronym === t) score += 2;
          }
          return score;
        };
        const scored = all
          .map((e) => ({ e, score: scoreOf(e) }))
          .filter((x) => x.score > 0);
        // Keep only the best matches: rows that hit the most query terms. This
        // turns "Customer Experience San Diego" into exactly the people in that
        // department AND that city, rather than everyone matching either word.
        const top = scored.reduce((m, x) => Math.max(m, x.score), 0);
        rows = scored.filter((x) => x.score === top).map((x) => x.e);
      }
      rows = rows.slice(0, 25);

      const managerNames = await resolveManagerNames(
        rows.map((e) => e.managerId),
      );
      return rows.map((e) => ({
        name: fullName(e.firstName, e.lastName),
        title: e.title,
        department: e.subDepartment
          ? `${e.department} (${e.subDepartment})`
          : e.department,
        location: e.location,
        email: e.email,
        manager: e.managerId ? (managerNames.get(e.managerId) ?? null) : null,
      }));
    },
  },
  {
    name: "list_departments",
    description:
      "List the departments the current user can see, with descriptions.",
    parameters: { type: "object", properties: {} },
    run: async (userId) => {
      const rows = await listDepartmentsForUser(userId);
      return rows.map((d) => ({
        name: d.name,
        description: d.description,
        isPrivate: d.isPrivate,
      }));
    },
  },
  {
    name: "get_department_managers",
    description:
      "Get the heads/managers of a specific department by name. Use for 'who runs/leads/manages X department'.",
    parameters: {
      type: "object",
      properties: {
        departmentName: {
          type: "string",
          description: "Exact or close department name.",
        },
      },
      required: ["departmentName"],
    },
    run: async (userId, args) => {
      const wanted = str(args.departmentName).toLowerCase().trim();
      const depts = await listDepartmentsForUser(userId);
      const dept =
        depts.find((d) => d.name.toLowerCase() === wanted) ??
        depts.find((d) => d.name.toLowerCase().includes(wanted)) ??
        depts.find((d) => wanted.includes(d.name.toLowerCase()));

      // Explicitly-assigned department heads take priority when present.
      if (dept) {
        const managers = await listManagersForDepartment(dept.id);
        if (managers.length) {
          return {
            department: dept.name,
            managers: managers.map((m) => ({
              name: `${m.firstName} ${m.lastName ?? ""}`.trim(),
              title: m.title,
              email: m.email,
            })),
          };
        }
      }

      // Fallback: derive the head(s) from the directory. No explicit
      // department-manager assignments exist for the seeded org, so infer the
      // leaders as the people in the department who report OUTSIDE it (i.e. up
      // to the exec team), preferring leadership titles.
      const deptTerms = (dept?.name ?? wanted)
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((t) => t.length > 1 && t !== "it");
      if (deptTerms.length === 0) {
        return { error: "No matching department you can access." };
      }
      const all = await listEmployees({ includeInactive: false });
      const inDept = all.filter((e) => {
        const haystack = `${e.department ?? ""} ${e.subDepartment ?? ""}`.toLowerCase();
        return deptTerms.some((t) => haystack.includes(t));
      });
      if (inDept.length === 0) {
        return { error: "No matching department you can access." };
      }
      const idsInDept = new Set(inDept.map((e) => e.id));
      let heads = inDept.filter(
        (e) => !e.managerId || !idsInDept.has(e.managerId),
      );
      const leaders = heads.filter((e) => isLeadershipTitle(e.title));
      if (leaders.length) heads = leaders;
      if (heads.length === 0) {
        heads = inDept.filter((e) => isLeadershipTitle(e.title));
      }
      return {
        department: dept?.name ?? str(args.departmentName),
        managers: heads.map((e) => ({
          name: fullName(e.firstName, e.lastName),
          title: e.title,
          email: e.email,
        })),
        note: "Derived from the directory (no explicit department-head assignments).",
      };
    },
  },
  {
    name: "get_my_profile",
    description:
      "Get the current user's own profile: name, title, department, and manager.",
    parameters: { type: "object", properties: {} },
    run: async (userId) => {
      const me = await getProfileWithEmployee(userId);
      if (!me?.employee) return { error: "No linked employee profile." };
      return {
        name: `${me.employee.firstName} ${me.employee.lastName ?? ""}`.trim(),
        title: me.employee.title,
        department: me.employee.department,
        manager: me.manager
          ? `${me.manager.firstName} ${me.manager.lastName ?? ""}`.trim()
          : null,
      };
    },
  },
  {
    name: "get_my_time_off_balance",
    description:
      "Get the current user's time-off balances for this year (total, used, remaining).",
    parameters: { type: "object", properties: {} },
    run: async (userId) => {
      const balances = await getMyBalances(userId);
      return balances.map((b) => ({
        kind: b.kind,
        totalDays: b.totalDays,
        usedDays: b.usedDays,
        remainingDays: b.totalDays - b.usedDays,
        year: b.year,
      }));
    },
  },
  {
    name: "list_open_jobs",
    description: "List currently open internal job postings.",
    parameters: { type: "object", properties: {} },
    run: async () => {
      const jobs = await listOpenJobs();
      return jobs.map((j) => ({
        id: j.id,
        title: j.title,
        department: j.department,
        location: j.location,
      }));
    },
  },
  {
    name: "get_my_pending_items",
    description:
      "Get the current user's pending action items: pending feedback requests (a.k.a. surveys) they need to respond to, and their pending time-off requests awaiting a decision. Use for 'do I have any pending surveys/feedback?', 'what do I need to do?', or 'what's pending for me?'.",
    parameters: { type: "object", properties: {} },
    run: async (userId) => {
      const [feedback, timeOff] = await Promise.all([
        listMyPendingFeedback(userId),
        listMine(userId),
      ]);
      const pendingFeedback = feedback.map((f) => ({
        id: f.id,
        type: f.requestType === "self" ? "self-feedback" : "feedback-about-other",
        about: fullName(
          f.subjectEmployee.firstName ?? "",
          f.subjectEmployee.lastName,
        ),
        requestedBy: f.requesterName,
        questionCount: f.questions.length,
        isAnonymous: f.isAnonymous,
        requestedAt: f.createdAt,
        route: `/feedback/${f.id}/give`,
      }));
      const pendingTimeOff = timeOff
        .filter((t) => t.status === "pending")
        .map((t) => ({
          id: t.id,
          kind: t.kind,
          startsOn: t.startsOn,
          endsOn: t.endsOn,
          status: t.status,
          note: t.note,
          route: "/time-off",
        }));
      return {
        pendingFeedbackRequests: pendingFeedback,
        pendingTimeOffRequests: pendingTimeOff,
        summary: {
          pendingSurveys: pendingFeedback.length,
          pendingTimeOff: pendingTimeOff.length,
        },
      };
    },
  },
  {
    name: "list_company_updates",
    description:
      "List the latest company updates / announcements (most recent first). Use for 'what's new', 'any company news/updates?', or 'latest announcements'.",
    parameters: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Max number of updates to return (default 5).",
        },
      },
    },
    run: async (_userId, args) => {
      const limit =
        typeof args.limit === "number" && args.limit > 0
          ? Math.min(args.limit, 15)
          : 5;
      const updates = await listCompanyUpdates();
      return updates.slice(0, limit).map((u) => ({
        id: u.id,
        title: u.title,
        body: u.body.length > 600 ? `${u.body.slice(0, 600)}…` : u.body,
        publishedAt: u.publishedAt,
        route: `/company-updates/${u.id}`,
      }));
    },
  },
  {
    name: "search_resources",
    description:
      "Search ALL in-platform resources (company-wide handbook/benefits/policy documents AND department tools & documents) by keyword. ALWAYS use this for handbook, benefits, PTO/time-off policy, payroll, reimbursement/travel, onboarding, perks, I-9, HR, 'what's our policy on X', or 'where do I find X' questions BEFORE answering. Returns each match with title, category, scope (Company-wide or department), a text snippet, and a link/route to open it. Use get_resource for the full text.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Keywords to search for, e.g. 'PTO policy', 'health insurance plans', 'travel reimbursement', 'I-9'.",
        },
      },
      required: ["query"],
    },
    run: async (_userId, args) => {
      const query = str(args.query).toLowerCase().trim();
      const terms = query.split(/\s+/).filter(Boolean);
      const phrase = terms.join(" ");
      const all = await listAllResources();
      const scored = all
        .map((r) => {
          const text = r.content ? htmlToText(r.content) : "";
          const title = r.title.toLowerCase();
          const body =
            `${r.category ?? ""} ${r.departmentName} ${text}`.toLowerCase();
          // The strongest relevance signal is how many DISTINCT query terms a
          // doc contains (the doc covering office+supplies+stipend, or
          // parental+leave, is the one that actually answers the question), so
          // coverage dominates. Title hits and term frequency are softer
          // tiebreakers; an exact-phrase match gets a small bonus.
          let coverage = 0;
          let freq = 0;
          let titleScore = 0;
          for (const t of terms) {
            const titleHits = title.split(t).length - 1;
            const bodyHits = body.split(t).length - 1;
            if (titleHits + bodyHits > 0) coverage += 1;
            titleScore += titleHits * 3;
            freq += Math.min(bodyHits, 5);
          }
          let score = coverage * 10 + titleScore + freq;
          if (phrase && `${title} ${body}`.includes(phrase)) score += 4;
          return { r, text, score };
        })
        .filter((x) => (terms.length === 0 ? true : x.score > 0))
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);
      return scored.map(({ r, text }) => ({
        id: r.id,
        title: r.title,
        category: r.category,
        scope: resourceScope(r),
        snippet: snippetAround(text, terms),
        hasFullContent: !!(r.content && r.content.trim()),
        link: resourceLink(r),
      }));
    },
  },
  {
    name: "get_resource",
    description:
      "Get the full plain-text content of a resource by id (from search_resources). Use this to read a handbook/benefits/policy document in full before answering a detailed question, then cite the resource link.",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string", description: "The resource id from search_resources." },
      },
      required: ["id"],
    },
    run: async (_userId, args) => {
      const r = await getResourceById(str(args.id));
      if (!r) return { error: "No resource with that id." };
      return {
        id: r.id,
        title: r.title,
        category: r.category,
        scope: resourceScope(r),
        text: r.content ? htmlToText(r.content) : null,
        url: r.url,
        link: resourceLink(r),
      };
    },
  },
  {
    name: "list_help_topics",
    description:
      "List the available how-to help topics about using the portal.",
    parameters: { type: "object", properties: {} },
    run: async () => helpTopicList(),
  },
  {
    name: "get_help_topic",
    description:
      "Get the full how-to content for a help topic key (from list_help_topics). Use for 'how do I X' questions.",
    parameters: {
      type: "object",
      properties: {
        key: { type: "string", description: "The topic key." },
      },
      required: ["key"],
    },
    run: async (_userId, args) => {
      const topic = getHelpTopic(str(args.key));
      return topic ?? { error: "Unknown topic key." };
    },
  },
];

export function findTool(name: string): AssistantTool | undefined {
  return ASSISTANT_TOOLS.find((t) => t.name === name);
}
