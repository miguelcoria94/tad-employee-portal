import "./load-env.js";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import {
  companyEvents,
  departments,
  employees,
  surveyAnswers,
  surveyQuestions,
  surveyResponses,
  surveys,
} from "./schema.js";
import type {
  NewCompanyEvent,
  NewDepartment,
  NewEmployee,
} from "./schema.js";

type QType =
  | "short_text"
  | "long_text"
  | "single_choice"
  | "multi_choice"
  | "rating";

type SeedQuestion = {
  prompt: string;
  type: QType;
  options?: string[] | null;
  isRequired?: boolean;
};

type SeedAnswer = {
  prompt: string;
  textValue?: string;
  ratingValue?: number;
  choiceValues?: string[];
};

type SeedAnonResponse = {
  submittedAt: Date;
  answers: SeedAnswer[];
};

type SeedSurveySpec = {
  title: string;
  description: string;
  isAnonymous: boolean;
  showResultsToAll: boolean;
  targetDepartments: string[] | null;
  opensAt: Date | null;
  closesAt: Date | null;
  questions: SeedQuestion[];
  anonymousResponses?: SeedAnonResponse[];
};

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error("DIRECT_URL (or DATABASE_URL) is required");

const sql = postgres(url, { max: 1, prepare: false });
const db = drizzle(sql);

const seedEmployees: NewEmployee[] = [
  { firstName: "Megan", title: "Regional Director of Partnerships, Northern California", department: "Sales", email: "megan@tadhealth.com" },
  { firstName: "Jen", title: "Head of Product Education & Partnerships", department: "Customer Experience", email: "jen@tadhealth.com" },
  { firstName: "Heather", title: "Director of Client Success", department: "Customer Experience", email: "heather@tadhealth.com" },
  { firstName: "Nick", title: "VP Client Success", department: "Customer Experience", email: "nick@tadhealth.com" },
  { firstName: "Alex", title: "Chief of Healthcare Policy & Medicaid", department: "Policy & TA", email: "alex@tadhealth.com" },
  { firstName: "Dimitri", title: "Senior Software Engineer", department: "Engineering", subDepartment: "Product & Engineering", email: "dmitriy@tadhealth.com" },
  { firstName: "Katie", lastName: "Dascomb", title: "Client Experience Specialist", department: "Customer Experience", email: "katie.dascomb@tadhealth.com" },
  { firstName: "Santi", title: "VP Strategic Initiatives", department: "Customer Experience", email: "santi@tadhealth.com" },
  { firstName: "Camille", title: "Client Experience Specialist", department: "Customer Experience", email: "camille@tadhealth.com" },
  { firstName: "Brendan", title: "VP of Operations", department: "Operations", email: "brendan@tadhealth.com" },
  { firstName: "Pia", title: "Senior Advisor", department: "Policy & TA", email: "pia@tadhealth.com" },
  { firstName: "Claire", title: "EA & Operations Manager", department: "Operations", subDepartment: "Careers & HR", email: "claire@tadhealth.com" },
  { firstName: "Josh", lastName: "Frankamp", title: "Senior Software Engineer", department: "Engineering", subDepartment: "Product & Engineering", email: "josh.frankamp@tadhealth.com" },
  { firstName: "Jordan", lastName: "Gonzales", title: "Client Success Manager", department: "Customer Experience", email: "jordan.gonzales@tadhealth.com" },
  { firstName: "Seth", title: "Software Engineer", department: "Engineering", subDepartment: "Product & Engineering", email: "seth@tadhealth.com" },
  { firstName: "Ella", title: "Client Experience Specialist", department: "Customer Experience", email: "ella@tadhealth.com" },
  { firstName: "Ben", title: "CEO & Founder", department: "Executive", email: "ben@tadhealth.com" },
  { firstName: "Alon", title: "VP of Product", department: "Engineering", email: "alon@tadhealth.com" },
  { firstName: "Scott", title: "Chief Business Officer", department: "Sales", email: "scott@tadhealth.com" },
  { firstName: "Shea", title: "Senior Software Engineer", department: "Engineering", subDepartment: "Product & Engineering", email: "shea@tadhealth.com" },
  { firstName: "Mario", title: "Chief Customer Officer", department: "Customer Experience", email: "mario@tadhealth.com" },
  { firstName: "Zoltan", title: "Chief Technology Officer", department: "Engineering", subDepartment: "Product & Engineering", email: "zoltan@tadhealth.com" },
  { firstName: "Nat", title: "Senior Software Engineer", department: "Engineering", subDepartment: "Product & Engineering", email: "nat@tadhealth.com" },
  { firstName: "Anna", title: "UX Designer", department: "Product & Design", subDepartment: "Product & Engineering", email: "anna@tadhealth.com" },
  { firstName: "Brian", title: "Head of Marketing", department: "Marketing", email: "brian@tadhealth.com" },
  { firstName: "Gav", title: "Data Integration Engineer", department: "Customer Experience", email: "gav@tadhealth.com" },
  { firstName: "Chinedu", title: "Strategic Partnerships Associate", department: "Sales", email: "chinedu@tadhealth.com" },
  { firstName: "Matt", title: "SVP of Growth", department: "Sales", email: "matt@tadhealth.com" },
  { firstName: "Marcella", title: "Head of Mental Health Programs and Policy", department: "Policy & TA", email: "marcella@tadhealth.com" },
  { firstName: "Melissa", title: "Associate Software Engineer", department: "Engineering", subDepartment: "Product & Engineering", email: "melissa@tadhealth.com" },
  { firstName: "Jill", title: "Marketing Associate", department: "Marketing", email: "jill@tadhealth.com" },
  { firstName: "Leigh", title: "Client Success Manager", department: "Customer Experience", email: "leigh@tadhealth.com" },
  { firstName: "Josh", title: "Senior Dev Ops Engineer", department: "Engineering", subDepartment: "Product & Engineering", email: "josh@tadhealth.com" },
  { firstName: "Sandi", title: "Client Success Manager", department: "Customer Experience", email: "sandi@tadhealth.com" },
  { firstName: "Gabriella", title: "Regional Director of Partnerships, Central California", department: "Sales", email: "gabriella@tadhealth.com" },
  { firstName: "Brandon", lastName: "Settje", title: "Data Integration Engineer", department: "Customer Experience", email: "brandon.settje@tadhealth.com" },
  { firstName: "Alyssa", title: "Client Success Manager", department: "Customer Experience", email: "alyssa@tadhealth.com" },
  { firstName: "Clarinne", title: "UX Designer", department: "Product & Design", subDepartment: "Product & Engineering", email: "clarinne@tadhealth.com" },
  { firstName: "Victoria", title: "Marketing Manager", department: "Marketing", email: "victoria@tadhealth.com" },
  { firstName: "Mary", title: "Client Success Manager", department: "Customer Experience", email: "mary@tadhealth.com" },
  { firstName: "Autumn", title: "Client Success Manager", department: "Customer Experience", email: "autumn@tadhealth.com" },
  { firstName: "Alix", title: "Demand Gen / Marketing Ops", department: "Marketing", email: "alix@tadhealth.com" },
  { firstName: "Cam", title: "Head of Product Experience", department: "Product & Design", subDepartment: "Product & Engineering", email: "cam@tadhealth.com" },
  { firstName: "Jess", title: "Manager Customer Experience and Support", department: "Customer Experience", email: "jessica@tadhealth.com" },
  { firstName: "Ron", title: "Regional Director of Partnerships, Southern California", department: "Sales", email: "ron@tadhealth.com" },
  { firstName: "Miguel", lastName: "Coria", title: "Software Engineer", department: "Engineering", subDepartment: "Product & Engineering", email: "miguel@tadhealth.com" },
];

const seedDepartments: NewDepartment[] = [
  {
    name: "Executive",
    description:
      "Leadership setting vision, strategy, and culture across the company.",
  },
  {
    name: "Policy & TA",
    description:
      "Healthcare policy, compliance, and technical assistance for partners and providers.",
  },
  {
    name: "Customer Experience",
    description:
      "Client success, onboarding, and support — making sure schools and providers thrive on TadHealth.",
  },
  {
    name: "Sales",
    description:
      "Strategic partnerships, regional growth, and revenue across the country.",
  },
  {
    name: "Marketing",
    description:
      "Brand, demand generation, campaigns, and external communications.",
  },
  {
    name: "Product & Design",
    description:
      "Product strategy, UX research, and visual design driving the customer experience.",
  },
  {
    name: "Engineering & IT",
    description:
      "Engineers and IT keeping the TadHealth platform fast, reliable, and secure.",
  },
  {
    name: "Operations",
    description:
      "Cross-functional ops keeping the business running smoothly day to day.",
  },
  {
    name: "Careers & HR",
    description:
      "People operations, recruiting, benefits, and team development.",
  },
];

const seedEventsList: NewCompanyEvent[] = [
  {
    title: "All Hands Monday",
    description:
      "<p>Weekly company kickoff. Wins from last week, focus for this week, open Q&A.</p><ul><li>Wins & shoutouts</li><li>Roadmap update</li><li>Open Q&A</li></ul>",
    location: "Zoom",
    url: "https://zoom.us/j/all-hands",
    startsAt: new Date("2026-05-11T16:00:00Z"),
    endsAt: new Date("2026-05-11T16:30:00Z"),
  },
  {
    title: "Engineering Demo Day",
    description:
      "<p>Quarterly demo of what the engineering team has shipped. All teams welcome — bring questions.</p><p><strong>Topics:</strong> new portal, billing pipeline rewrite, mobile experiments.</p>",
    location: "HQ Conference Room A + Zoom",
    url: null,
    startsAt: new Date("2026-05-12T20:00:00Z"),
    endsAt: new Date("2026-05-12T21:30:00Z"),
  },
  {
    title: "Coffee with the Marketing Team",
    description:
      "<p>Casual conversation, no agenda. Drop into Slack <code>#coffee</code> at the start time and we'll spin up a room.</p>",
    location: "Slack #coffee",
    url: null,
    startsAt: new Date("2026-05-13T17:00:00Z"),
    endsAt: new Date("2026-05-13T17:30:00Z"),
  },
  {
    title: "May All-Company Town Hall",
    description:
      "<p>Monthly all-hands. Strategy update from Ben, financial snapshot, departmental highlights, and an open Q&A.</p><p>Recording posted same day in <code>#announcements</code>.</p>",
    location: "HQ Auditorium + Zoom",
    url: "https://zoom.us/j/town-hall-may",
    startsAt: new Date("2026-05-14T20:00:00Z"),
    endsAt: new Date("2026-05-14T21:00:00Z"),
  },
];

async function seedEventsIfEmpty() {
  const existing = await db.select({ id: companyEvents.id }).from(companyEvents).limit(1);
  if (existing.length > 0) {
    console.log("Skipping events — already seeded.");
    return;
  }
  console.log(`Seeding ${seedEventsList.length} company events…`);
  await db.insert(companyEvents).values(seedEventsList);
}

const pulseResponses = [
  { date: "2026-05-11T15:00:00Z", rating: 4, working: "Loving the team energy and the new portal", improve: "Inbox overload on Mondays", area: "Communication", recommend: 5 },
  { date: "2026-05-11T17:30:00Z", rating: 3, working: "Cross-team collaboration has improved", improve: "More transparency on the roadmap would help", area: "Process", recommend: 4 },
  { date: "2026-05-11T22:00:00Z", rating: 5, working: "Great onboarding experience for new hires", improve: "", area: "Career growth", recommend: 5 },
  { date: "2026-05-12T14:00:00Z", rating: 4, working: "Tools have gotten much better this quarter", improve: "Meeting load is heavy on Tuesdays and Thursdays", area: "Workload", recommend: 5 },
  { date: "2026-05-12T16:45:00Z", rating: 3, working: "Customer wins keep us motivated", improve: "We need clearer ownership boundaries between teams", area: "Process", recommend: 4 },
  { date: "2026-05-12T19:20:00Z", rating: 4, working: "Engineering velocity is up", improve: "A larger learning & development budget would go a long way", area: "Career growth", recommend: 4 },
  { date: "2026-05-12T23:00:00Z", rating: 2, working: "Mission alignment is strong", improve: "Burned out — lots of context switching this month", area: "Workload", recommend: 3 },
  { date: "2026-05-13T13:15:00Z", rating: 5, working: "My manager is excellent and supportive", improve: "More casual cross-team interaction", area: "Communication", recommend: 5 },
  { date: "2026-05-13T18:00:00Z", rating: 4, working: "Good work-life balance recently", improve: "Documentation has gaps in a few key areas", area: "Tools & Resources", recommend: 4 },
  { date: "2026-05-13T21:30:00Z", rating: 4, working: "I trust leadership decisions", improve: "Some quarterly goals feel disconnected from day-to-day work", area: "Process", recommend: 4 },
  { date: "2026-05-14T14:30:00Z", rating: 5, working: "Best team I've worked on in my career", improve: "", area: "Tools & Resources", recommend: 5 },
  { date: "2026-05-14T19:00:00Z", rating: 3, working: "Customer impact is real", improve: "Backlog feels endless and prioritization is unclear", area: "Workload", recommend: 4 },
];

async function seedSurveysIfEmpty() {
  const existing = await db.select({ id: surveys.id }).from(surveys).limit(1);
  if (existing.length > 0) {
    console.log("Skipping surveys — already seeded.");
    return;
  }

  console.log("Seeding 2 surveys…");

  // ── Survey 1: Spring Pulse Check — anonymous, public results ────────────
  const [pulse] = await db
    .insert(surveys)
    .values({
      title: "Spring Pulse Check",
      description:
        "<p>A quick read on how things are going this week. Anonymous — answers can't be tied back to you.</p>",
      isAnonymous: true,
      showResultsToAll: true,
      isPublished: true,
      opensAt: new Date("2026-05-11T00:00:00Z"),
      closesAt: new Date("2026-05-18T00:00:00Z"),
    })
    .returning();
  if (!pulse) throw new Error("Failed to insert pulse survey");

  const pulseQs = await db
    .insert(surveyQuestions)
    .values([
      {
        surveyId: pulse.id,
        prompt: "How are you feeling about work this week?",
        type: "rating",
        options: null,
        isRequired: true,
        sortOrder: 0,
      },
      {
        surveyId: pulse.id,
        prompt: "What's working well?",
        type: "long_text",
        options: null,
        isRequired: false,
        sortOrder: 1,
      },
      {
        surveyId: pulse.id,
        prompt: "What could be improved?",
        type: "long_text",
        options: null,
        isRequired: false,
        sortOrder: 2,
      },
      {
        surveyId: pulse.id,
        prompt: "Which area needs the most attention right now?",
        type: "single_choice",
        options: [
          "Process",
          "Communication",
          "Tools & Resources",
          "Workload",
          "Career growth",
        ],
        isRequired: true,
        sortOrder: 3,
      },
      {
        surveyId: pulse.id,
        prompt:
          "How likely are you to recommend TadHealth as a place to work?",
        type: "rating",
        options: null,
        isRequired: false,
        sortOrder: 4,
      },
    ])
    .returning();

  const qByPrompt = new Map(pulseQs.map((q) => [q.prompt, q]));
  const feelingQ = qByPrompt.get("How are you feeling about work this week?")!;
  const workingQ = qByPrompt.get("What's working well?")!;
  const improveQ = qByPrompt.get("What could be improved?")!;
  const areaQ = qByPrompt.get("Which area needs the most attention right now?")!;
  const recommendQ = qByPrompt.get(
    "How likely are you to recommend TadHealth as a place to work?",
  )!;

  for (const r of pulseResponses) {
    const [resp] = await db
      .insert(surveyResponses)
      .values({
        surveyId: pulse.id,
        responderId: null,
        submittedAt: new Date(r.date),
      })
      .returning();
    if (!resp) continue;

    const rows: {
      responseId: string;
      questionId: string;
      textValue?: string | null;
      ratingValue?: number | null;
      choiceValues?: string[] | null;
    }[] = [
      { responseId: resp.id, questionId: feelingQ.id, ratingValue: r.rating },
      { responseId: resp.id, questionId: areaQ.id, textValue: r.area },
      { responseId: resp.id, questionId: recommendQ.id, ratingValue: r.recommend },
    ];
    if (r.working) rows.push({ responseId: resp.id, questionId: workingQ.id, textValue: r.working });
    if (r.improve) rows.push({ responseId: resp.id, questionId: improveQ.id, textValue: r.improve });

    await db.insert(surveyAnswers).values(rows);
  }

  // ── Survey 2: Q2 Goals Check-In — non-anon, admin-only results ──────────
  const [goals] = await db
    .insert(surveys)
    .values({
      title: "Q2 Goals Check-In",
      description:
        "<p>How are your Q2 goals tracking? Feeds the May leadership review. Responses are attributed (not anonymous).</p>",
      isAnonymous: false,
      showResultsToAll: false,
      isPublished: true,
      opensAt: new Date("2026-05-12T00:00:00Z"),
      closesAt: new Date("2026-05-23T00:00:00Z"),
    })
    .returning();
  if (!goals) throw new Error("Failed to insert goals survey");

  await db.insert(surveyQuestions).values([
    {
      surveyId: goals.id,
      prompt: "Are you on track for your Q2 OKRs?",
      type: "single_choice",
      options: [
        "Ahead of schedule",
        "On track",
        "Slightly behind",
        "Significantly behind",
      ],
      isRequired: true,
      sortOrder: 0,
    },
    {
      surveyId: goals.id,
      prompt: "What's the biggest blocker right now?",
      type: "long_text",
      options: null,
      isRequired: false,
      sortOrder: 1,
    },
    {
      surveyId: goals.id,
      prompt: "Which support areas would help you most?",
      type: "multi_choice",
      options: [
        "Mentoring",
        "Tools / vendor budget",
        "Cross-team coordination",
        "Time / scope reduction",
        "Hiring / headcount",
        "Training",
      ],
      isRequired: false,
      sortOrder: 2,
    },
  ]);

  console.log(`Seeded pulse survey with ${pulseResponses.length} responses.`);
}

async function ensureSurveyByTitle(spec: SeedSurveySpec) {
  const existing = await db
    .select({ id: surveys.id })
    .from(surveys)
    .where(eq(surveys.title, spec.title))
    .limit(1);
  if (existing.length > 0) {
    console.log(`Skipping survey "${spec.title}" — already exists.`);
    return;
  }

  console.log(`Seeding survey: ${spec.title}`);
  const [s] = await db
    .insert(surveys)
    .values({
      title: spec.title,
      description: spec.description,
      isAnonymous: spec.isAnonymous,
      showResultsToAll: spec.showResultsToAll,
      isPublished: true,
      targetDepartments: spec.targetDepartments,
      opensAt: spec.opensAt,
      closesAt: spec.closesAt,
    })
    .returning();
  if (!s) throw new Error(`Failed to insert survey: ${spec.title}`);

  const qs = await db
    .insert(surveyQuestions)
    .values(
      spec.questions.map((q, i) => ({
        surveyId: s.id,
        prompt: q.prompt,
        type: q.type,
        options: q.options ?? null,
        isRequired: q.isRequired ?? false,
        sortOrder: i,
      })),
    )
    .returning();

  const byPrompt = new Map(qs.map((q) => [q.prompt, q]));

  if (spec.anonymousResponses && spec.isAnonymous) {
    for (const r of spec.anonymousResponses) {
      const [resp] = await db
        .insert(surveyResponses)
        .values({
          surveyId: s.id,
          responderId: null,
          submittedAt: r.submittedAt,
        })
        .returning();
      if (!resp) continue;

      const rows: {
        responseId: string;
        questionId: string;
        textValue?: string | null;
        ratingValue?: number | null;
        choiceValues?: string[] | null;
      }[] = [];
      for (const a of r.answers) {
        const q = byPrompt.get(a.prompt);
        if (!q) continue;
        rows.push({
          responseId: resp.id,
          questionId: q.id,
          textValue: a.textValue ?? null,
          ratingValue: a.ratingValue ?? null,
          choiceValues: a.choiceValues ?? null,
        });
      }

      if (rows.length > 0) {
        await db.insert(surveyAnswers).values(rows);
      }
    }
  }
}

const departmentSurveys: SeedSurveySpec[] = [
  {
    title: "Engineering Sprint Pulse",
    description:
      "<p>Quick read on how the current sprint feels. Non-anonymous — used to help leads remove blockers.</p>",
    isAnonymous: false,
    showResultsToAll: false,
    targetDepartments: ["Engineering"],
    opensAt: new Date("2026-05-11T00:00:00Z"),
    closesAt: new Date("2026-05-21T00:00:00Z"),
    questions: [
      {
        prompt: "How was this sprint, overall?",
        type: "rating",
        isRequired: true,
      },
      {
        prompt: "What's the biggest blocker right now?",
        type: "long_text",
      },
      {
        prompt: "Where do we need investment?",
        type: "multi_choice",
        options: [
          "Test infrastructure",
          "CI / build speed",
          "Documentation",
          "Code review throughput",
          "On-call tooling",
          "Cross-team coordination",
        ],
      },
      {
        prompt: "Anything else worth flagging?",
        type: "long_text",
      },
    ],
  },
  {
    title: "Customer Experience: Voice of the Team",
    description:
      "<p>Anonymous pulse on how supported the CX team feels. Results visible to everyone on CX so we can act on patterns together.</p>",
    isAnonymous: true,
    showResultsToAll: true,
    targetDepartments: ["Customer Experience"],
    opensAt: new Date("2026-05-11T00:00:00Z"),
    closesAt: new Date("2026-05-18T00:00:00Z"),
    questions: [
      {
        prompt: "How well are our tools supporting your day-to-day work?",
        type: "rating",
        isRequired: true,
      },
      {
        prompt: "What's working well right now?",
        type: "long_text",
      },
      {
        prompt: "Which area is most painful when supporting clients?",
        type: "single_choice",
        options: [
          "Onboarding",
          "Billing",
          "Reporting",
          "Integrations",
          "Internal communication",
          "Documentation",
        ],
        isRequired: true,
      },
      {
        prompt: "How empowered do you feel to delight clients today?",
        type: "rating",
      },
    ],
    anonymousResponses: [
      {
        submittedAt: new Date("2026-05-11T15:30:00Z"),
        answers: [
          { prompt: "How well are our tools supporting your day-to-day work?", ratingValue: 4 },
          { prompt: "What's working well right now?", textValue: "The new onboarding playbook has made first calls so much smoother." },
          { prompt: "Which area is most painful when supporting clients?", textValue: "Billing" },
          { prompt: "How empowered do you feel to delight clients today?", ratingValue: 4 },
        ],
      },
      {
        submittedAt: new Date("2026-05-11T19:10:00Z"),
        answers: [
          { prompt: "How well are our tools supporting your day-to-day work?", ratingValue: 3 },
          { prompt: "What's working well right now?", textValue: "Cross-team collaboration with Engineering is genuinely better than last quarter." },
          { prompt: "Which area is most painful when supporting clients?", textValue: "Reporting" },
          { prompt: "How empowered do you feel to delight clients today?", ratingValue: 4 },
        ],
      },
      {
        submittedAt: new Date("2026-05-12T14:45:00Z"),
        answers: [
          { prompt: "How well are our tools supporting your day-to-day work?", ratingValue: 2 },
          { prompt: "What's working well right now?", textValue: "Team morale is high; managers are supportive." },
          { prompt: "Which area is most painful when supporting clients?", textValue: "Integrations" },
          { prompt: "How empowered do you feel to delight clients today?", ratingValue: 3 },
        ],
      },
      {
        submittedAt: new Date("2026-05-12T18:00:00Z"),
        answers: [
          { prompt: "How well are our tools supporting your day-to-day work?", ratingValue: 5 },
          { prompt: "What's working well right now?", textValue: "Clear escalation paths — I always know who to ping." },
          { prompt: "Which area is most painful when supporting clients?", textValue: "Documentation" },
          { prompt: "How empowered do you feel to delight clients today?", ratingValue: 5 },
        ],
      },
      {
        submittedAt: new Date("2026-05-13T13:20:00Z"),
        answers: [
          { prompt: "How well are our tools supporting your day-to-day work?", ratingValue: 4 },
          { prompt: "What's working well right now?", textValue: "" },
          { prompt: "Which area is most painful when supporting clients?", textValue: "Billing" },
          { prompt: "How empowered do you feel to delight clients today?", ratingValue: 4 },
        ],
      },
      {
        submittedAt: new Date("2026-05-13T20:45:00Z"),
        answers: [
          { prompt: "How well are our tools supporting your day-to-day work?", ratingValue: 3 },
          { prompt: "What's working well right now?", textValue: "Internal escalations to Engineering get fast turnarounds." },
          { prompt: "Which area is most painful when supporting clients?", textValue: "Reporting" },
          { prompt: "How empowered do you feel to delight clients today?", ratingValue: 3 },
        ],
      },
      {
        submittedAt: new Date("2026-05-14T15:10:00Z"),
        answers: [
          { prompt: "How well are our tools supporting your day-to-day work?", ratingValue: 4 },
          { prompt: "What's working well right now?", textValue: "Client wins keep us motivated." },
          { prompt: "Which area is most painful when supporting clients?", textValue: "Onboarding" },
          { prompt: "How empowered do you feel to delight clients today?", ratingValue: 4 },
        ],
      },
      {
        submittedAt: new Date("2026-05-14T22:00:00Z"),
        answers: [
          { prompt: "How well are our tools supporting your day-to-day work?", ratingValue: 5 },
          { prompt: "What's working well right now?", textValue: "Manager 1:1s have been incredibly useful this quarter." },
          { prompt: "Which area is most painful when supporting clients?", textValue: "Internal communication" },
          { prompt: "How empowered do you feel to delight clients today?", ratingValue: 5 },
        ],
      },
    ],
  },
  {
    title: "Sales Enablement Check",
    description:
      "<p>What do you need to close the deals on your plate? Results go to leadership for the next enablement planning cycle.</p>",
    isAnonymous: false,
    showResultsToAll: false,
    targetDepartments: ["Sales"],
    opensAt: new Date("2026-05-12T00:00:00Z"),
    closesAt: new Date("2026-05-23T00:00:00Z"),
    questions: [
      {
        prompt: "Do you have what you need to close deals this quarter?",
        type: "single_choice",
        options: ["Yes", "Mostly", "Some gaps", "Significant gaps"],
        isRequired: true,
      },
      {
        prompt: "Which enablement materials would help most?",
        type: "multi_choice",
        options: [
          "Battle cards",
          "Case studies",
          "ROI calculator",
          "Demo scripts",
          "Competitive intel",
          "Product training",
        ],
      },
      {
        prompt: "Anything else leadership should know?",
        type: "long_text",
      },
    ],
  },
];

async function seedDepartmentSurveys() {
  for (const spec of departmentSurveys) {
    await ensureSurveyByTitle(spec);
  }
}

async function run() {
  console.log(`Seeding ${seedDepartments.length} departments…`);
  await db
    .insert(departments)
    .values(seedDepartments)
    .onConflictDoNothing({ target: departments.name });

  console.log(`Seeding ${seedEmployees.length} employees…`);
  await db
    .insert(employees)
    .values(seedEmployees.map((e, i) => ({ ...e, sortOrder: i })))
    .onConflictDoNothing({ target: employees.email });

  await seedEventsIfEmpty();
  await seedSurveysIfEmpty();
  await seedDepartmentSurveys();

  console.log("Seed complete.");
  await sql.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});