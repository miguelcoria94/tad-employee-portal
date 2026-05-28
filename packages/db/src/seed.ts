import "./load-env.js";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import {
  companyEvents,
  departmentResources,
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

// Per Claire's roster (May 2026). `managerEmail` is used in a 2nd pass to
// set managerId after every row exists; it isn't a real column.
type SeedEmployee = NewEmployee & { managerEmail?: string };

const seedEmployees: SeedEmployee[] = [
  // Executive
  { firstName: "Ben",     lastName: "Greiner",   title: "CEO & Founder",                                 department: "Executive",           location: "Newport Beach",         email: "ben@tadhealth.com" },
  { firstName: "Tiffany", lastName: "Lee",       title: "Chief Financial Officer",                       department: "Executive",           location: "San Diego",             email: "tiffany@tadhealth.com",        managerEmail: "ben@tadhealth.com" },
  { firstName: "Haley",   lastName: "Engstrom",  title: "Chief of Staff",                                department: "Executive",           location: "Newport Beach, CA",     email: "haley@tadhealth.com",          managerEmail: "ben@tadhealth.com" },

  // Customer Experience leadership + team
  { firstName: "Mario",    lastName: "Joy",        title: "Chief Customer Officer",                department: "Customer Experience", location: "North Carolina",     email: "mario@tadhealth.com",      managerEmail: "ben@tadhealth.com" },
  { firstName: "Nick",     lastName: "Bingaman",   title: "Vice President, Client Success",        department: "Customer Experience", location: "New York",           email: "nick@tadhealth.com",       managerEmail: "mario@tadhealth.com" },
  { firstName: "Santi",    lastName: "Dewa Ayu",   title: "VP, Strategic Initiatives",             department: "Customer Experience", location: "Venice, CA",         email: "santi@tadhealth.com",      managerEmail: "mario@tadhealth.com" },
  { firstName: "Jennifer", lastName: "Athanacio",  title: "Head of Product Education & Partnerships", department: "Customer Experience", location: "Bay Area",        email: "jen@tadhealth.com",        managerEmail: "mario@tadhealth.com" },
  { firstName: "Heather",  lastName: "Belthoff",   title: "Customer Success Manager",              department: "Customer Experience", location: "San Diego",          email: "heather@tadhealth.com",    managerEmail: "mario@tadhealth.com" },
  { firstName: "Jareena",  lastName: "Silva",      title: "Client Experience Manager",             department: "Customer Experience", location: "Azusa, CA",          email: "jareena@tadhealth.com",    managerEmail: "mario@tadhealth.com" },
  { firstName: "Jade",     lastName: "Godoy",      title: "Client Experience Specialist",          department: "Customer Experience", location: "Oxnard, CA",         email: "jade@tadhealth.com",       managerEmail: "jareena@tadhealth.com" },
  { firstName: "Ella",     lastName: "Green",      title: "Customer Experience Specialist",        department: "Customer Experience", location: "San Diego, CA",      email: "ella@tadhealth.com",       managerEmail: "jessica@tadhealth.com" },
  { firstName: "Camille",  lastName: "Duale",      title: "Customer Experience Specialist",        department: "Customer Experience", location: "Cypress, CA",        email: "camille@tadhealth.com",    managerEmail: "jessica@tadhealth.com" },
  { firstName: "Alyssa",   lastName: "Sollitt",    title: "Customer Success Manager",              department: "Customer Experience", location: "San Francisco",      email: "alyssa@tadhealth.com",     managerEmail: "mario@tadhealth.com" },
  { firstName: "Autumn",   lastName: "Webb",       title: "Customer Success Manager",              department: "Customer Experience", location: "San Diego",          email: "autumn@tadhealth.com",     managerEmail: "heather@tadhealth.com" },
  { firstName: "Jordan",   lastName: "Gonzales",   title: "Customer Success Manager",              department: "Customer Experience", location: "Rancho Santa Margarita, CA", email: "jordan.gonzales@tadhealth.com", managerEmail: "mario@tadhealth.com" },
  { firstName: "Leigh",    lastName: "Sarnicola-Smith", title: "Client Success Manager",           department: "Customer Experience", location: "Los Angeles, CA",    email: "leigh@tadhealth.com",      managerEmail: "mario@tadhealth.com" },
  { firstName: "Mary",     lastName: "Vinzon",     title: "Client Success Manager",                department: "Customer Experience", location: "Los Angeles, CA",    email: "mary@tadhealth.com",       managerEmail: "mario@tadhealth.com" },
  { firstName: "Sandi",    lastName: "Seel",       title: "Customer Success Manager",              department: "Customer Experience", location: "Thousand Oaks",      email: "sandi@tadhealth.com",      managerEmail: "mario@tadhealth.com" },
  { firstName: "Gavril",   lastName: "Moreno",     title: "Data Integration Engineer",             department: "Customer Experience", location: "San Diego",          email: "gav@tadhealth.com",        managerEmail: "santi@tadhealth.com" },
  { firstName: "Jessica",  lastName: "Williams",   title: "Technical Project Manager",             department: "Customer Experience", location: "Los Angeles, CA",    email: "jessica.williams@tadhealth.com", managerEmail: "santi@tadhealth.com" },
  { firstName: "Chloe",    lastName: "Geissler",   title: "Training Support Specialist",           department: "Customer Experience", location: "Venice, CA",         email: "chloe@tadhealth.com",      managerEmail: "jen@tadhealth.com" },
  { firstName: "Katie",    lastName: "Dascomb",    title: "Training Logistics Coordinator",        department: "Customer Experience", location: "Union City, CA",     email: "katie.dascomb@tadhealth.com", managerEmail: "jen@tadhealth.com" },
  { firstName: "Tammy",    lastName: "Holen",      title: "Head of Provider Solutions",            department: "Customer Experience", location: "O Fallon, MO",       email: "tammy@tadhealth.com",      managerEmail: "ben@tadhealth.com" },

  // Sales
  { firstName: "Scott",     lastName: "Harvey",       title: "Chief Business Officer",                department: "Sales",   location: "San Clemente",   email: "scott@tadhealth.com",     managerEmail: "ben@tadhealth.com" },
  { firstName: "Brent",     lastName: "Layton",       title: "Chief of Healthcare Sales & Strategy",  department: "Sales",   location: "Atlanta, GA",    email: "brent@tadhealth.com",     managerEmail: "ben@tadhealth.com" },
  { firstName: "Matt",      lastName: "Pizzo",        title: "VP of Growth",                          department: "Sales",   location: "Buffalo, NY",    email: "matt@tadhealth.com",      managerEmail: "scott@tadhealth.com" },
  { firstName: "Megan",     lastName: "Anderson",     title: "Regional Sales Director",               department: "Sales",   location: "Acampo, CA",     email: "megan@tadhealth.com",     managerEmail: "matt@tadhealth.com" },
  { firstName: "Ron",       lastName: "Williams",     title: "Regional Sales Director",               department: "Sales",   location: "San Diego",      email: "ron@tadhealth.com",       managerEmail: "mario@tadhealth.com" },
  { firstName: "Gabriella", lastName: "Serrato",      title: "Regional Director of Partnerships",     department: "Sales",   location: "Los Angeles, CA",email: "gabriella@tadhealth.com", managerEmail: "matt@tadhealth.com" },

  // Marketing
  { firstName: "Brian",    lastName: "Mckenzie",   title: "Head of Marketing",          department: "Marketing", location: "Orange",        email: "brian@tadhealth.com",    managerEmail: "ben@tadhealth.com" },
  { firstName: "Victoria", lastName: "Vega",       title: "Marketing Manager",          department: "Marketing", location: "Long Beach",    email: "victoria@tadhealth.com", managerEmail: "brian@tadhealth.com" },
  { firstName: "Jill",     lastName: "Sanders",    title: "Marketing Associate",        department: "Marketing", location: "El Cajon, CA",  email: "jill@tadhealth.com",     managerEmail: "brian@tadhealth.com" },
  { firstName: "Alix",     lastName: "Webster",    title: "Demand Gen / Marketing Ops", department: "Marketing", location: "Garden Grove, CA", email: "alix@tadhealth.com",   managerEmail: "brian@tadhealth.com" },

  // Policy & TA
  { firstName: "Alex",     lastName: "Briscoe",    title: "Chief of Healthcare Policy & Medicaid",            department: "Policy & TA", location: "Bay Area",         email: "alex@tadhealth.com",     managerEmail: "ben@tadhealth.com" },
  { firstName: "Marcella", lastName: "Rodriguez",  title: "Director of Mental Health Programs and Policy",    department: "Policy & TA", location: "Sacramento, CA",   email: "marcella@tadhealth.com", managerEmail: "mario@tadhealth.com" },
  { firstName: "Mikevia",  lastName: "Kiles",      title: "Program Analyst, Policy & Technical Assistance",   department: "Policy & TA", location: "West Sacramento",  email: "mikevia@tadhealth.com",  managerEmail: "marcella@tadhealth.com" },

  // Engineering / Product & Engineering
  { firstName: "Zoltan",   lastName: "Kurczveil",  title: "Chief Technology Officer",            department: "Engineering",     subDepartment: "Product & Engineering", location: "Northern CA",   email: "zoltan@tadhealth.com",    managerEmail: "ben@tadhealth.com" },
  { firstName: "Alon",     lastName: "Hartuv",     title: "VP of Product",                       department: "Engineering",     subDepartment: "Product & Engineering", location: "Malibu, CA",    email: "alon@tadhealth.com",      managerEmail: "zoltan@tadhealth.com" },
  { firstName: "Helen",    lastName: "Conroe",     title: "Senior Engineering Project Manager", department: "Engineering",     subDepartment: "Product & Engineering", location: "Palo Alto, CA", email: "helen@tadhealth.com",     managerEmail: "zoltan@tadhealth.com" },
  { firstName: "Dimitri",  lastName: "Byrulin",    title: "Senior Software Engineer",            department: "Engineering",     subDepartment: "Product & Engineering", location: "Laguna Hills",  email: "dmitriy@tadhealth.com",   managerEmail: "zoltan@tadhealth.com" },
  { firstName: "Josh",     lastName: "Frankamp",   title: "Senior Software Engineer",            department: "Engineering",     subDepartment: "Product & Engineering", location: "Newberg, OR",   email: "josh.frankamp@tadhealth.com", managerEmail: "zoltan@tadhealth.com" },
  { firstName: "Nat",      lastName: "Laughlin",   title: "Senior Software Engineer",            department: "Engineering",     subDepartment: "Product & Engineering", location: "Bay Area",      email: "nat@tadhealth.com",       managerEmail: "zoltan@tadhealth.com" },
  { firstName: "Shea",     lastName: "Ivey",       title: "Senior Software Engineer",            department: "Engineering",     subDepartment: "Product & Engineering", location: "Portland, OR",  email: "shea@tadhealth.com",      managerEmail: "zoltan@tadhealth.com" },
  { firstName: "Seth",     lastName: "Gonzales",   title: "Software Engineer",                   department: "Engineering",     subDepartment: "Product & Engineering", location: "Portland, OR",  email: "seth@tadhealth.com",      managerEmail: "zoltan@tadhealth.com" },
  { firstName: "Melissa",  lastName: "Salazar",    title: "Associate Software Engineer",         department: "Engineering",     subDepartment: "Product & Engineering", location: "Inglewood, CA", email: "melissa@tadhealth.com",   managerEmail: "zoltan@tadhealth.com" },
  { firstName: "Josh",     lastName: "Scheel",     title: "Senior Dev Ops Engineer",             department: "Engineering",     subDepartment: "Product & Engineering", location: "Colusa, CA",    email: "josh@tadhealth.com",      managerEmail: "zoltan@tadhealth.com" },
  { firstName: "Dani",     lastName: "Michael",    title: "Analytics Engineer",                  department: "Engineering",     subDepartment: "Product & Engineering", location: "Seattle, WA",   email: "dani@tadhealth.com",      managerEmail: "brendan@tadhealth.com" },
  { firstName: "Miguel",   lastName: "Coria",      title: "Software Engineer",                   department: "Engineering",     subDepartment: "Product & Engineering", location: "San Francisco, CA", email: "miguel@tadhealth.com", managerEmail: "zoltan@tadhealth.com" },

  // Product & Design
  { firstName: "Cam",      lastName: "Wilcox",     title: "Head of Product",  department: "Product & Design", subDepartment: "Product & Engineering", location: "San Diego", email: "cam@tadhealth.com",  managerEmail: "zoltan@tadhealth.com" },
  { firstName: "Anna",     lastName: "Mars",       title: "UX/UI Designer",   department: "Product & Design", subDepartment: "Product & Engineering", location: "Bay Area",  email: "anna@tadhealth.com", managerEmail: "cam@tadhealth.com" },

  // Operations
  { firstName: "Brendan",  lastName: "Duncan",     title: "VP of Operations",          department: "Operations", location: "North Carolina", email: "brendan@tadhealth.com", managerEmail: "ben@tadhealth.com" },
  { firstName: "Claire",   lastName: "Farmer",     title: "EA & Operations Manager",   department: "Operations", subDepartment: "Careers & HR", location: "Newport Beach", email: "claire@tadhealth.com", managerEmail: "ben@tadhealth.com" },

  // Carried over from the prior seed but not in Claire's May roster — kept so
  // existing accounts / survey responses don't break. Title/department untouched.
  { firstName: "Jess",     title: "Manager Customer Experience and Support", department: "Customer Experience", email: "jessica@tadhealth.com" },
  { firstName: "Pia",      title: "Senior Advisor",                          department: "Policy & TA",         email: "pia@tadhealth.com" },
  { firstName: "Chinedu",  title: "Strategic Partnerships Associate",        department: "Sales",               email: "chinedu@tadhealth.com" },
  { firstName: "Brandon",  lastName: "Settje", title: "Data Integration Engineer", department: "Customer Experience", email: "brandon.settje@tadhealth.com" },
  { firstName: "Clarinne", title: "UX Designer",                             department: "Product & Design",    subDepartment: "Product & Engineering", email: "clarinne@tadhealth.com" },
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
  {
    title: "Engineering: Developer Experience Pulse",
    description:
      "<p>How's the day-to-day of building at TadHealth? Anonymous so you can call out what's actually slowing you down — results are visible to the whole engineering team so we can act on them together.</p>",
    isAnonymous: true,
    showResultsToAll: true,
    targetDepartments: ["Engineering"],
    opensAt: new Date("2026-05-19T00:00:00Z"),
    closesAt: new Date("2026-06-02T00:00:00Z"),
    questions: [
      {
        prompt: "How is your day-to-day dev experience right now?",
        type: "rating",
        isRequired: true,
      },
      {
        prompt:
          "Which area is slowing you down the most?",
        type: "single_choice",
        options: [
          "Local dev environment",
          "Build / CI speed",
          "Test infrastructure",
          "Code review throughput",
          "Documentation",
          "On-call / observability tooling",
          "Cross-team coordination",
        ],
        isRequired: true,
      },
      {
        prompt:
          "Where should we invest engineering time this quarter? (pick all that apply)",
        type: "multi_choice",
        options: [
          "Test infrastructure",
          "Performance / scaling",
          "Refactoring / tech debt",
          "New features",
          "Developer tooling",
          "Documentation",
          "Mentoring / career growth",
        ],
      },
      {
        prompt: "What's your favorite recent improvement to how we work?",
        type: "long_text",
      },
      {
        prompt: "What's the one thing you wish we'd fix?",
        type: "long_text",
      },
      {
        prompt:
          "How likely are you to recommend our codebase to a new engineering hire?",
        type: "rating",
      },
    ],
  },
];

async function seedDepartmentSurveys() {
  for (const spec of departmentSurveys) {
    await ensureSurveyByTitle(spec);
  }
}

type SeedResource = {
  kind: "tool" | "document";
  title: string;
  url: string | null;
  linkLabel: string;
  category?: string | null;
  documentDate?: string | null;
};

const policyTAResources: SeedResource[] = [
  {
    kind: "tool",
    title: "Policy & Practice Branded Assets",
    url: "https://docs.google.com/spreadsheets/d/1El92Nv0oZ4vrI3Q4gnnAL-j9i_3dfbJ0mNwvcgwEceA/edit?gid=0#gid=0",
    linkLabel: "Link",
    category: "Other",
  },
  {
    kind: "document",
    title: "Weekly Policy & TA Email — 4/6/2026",
    url: "https://drive.google.com/file/d/1KFryLTy3M4z4XwIUxDjxwFuOSBPdgWN8/view",
    linkLabel: "Link",
    documentDate: "2026-04-06",
  },
  {
    kind: "document",
    title: "Weekly Policy & TA Email — 3/30/2026",
    url: "https://drive.google.com/file/d/1F9RwXmbj8Pvw-lEF_QovSVFBbwcFYIRy/view",
    linkLabel: "Link",
    documentDate: "2026-03-30",
  },
  {
    kind: "document",
    title: "Weekly Policy & TA Email — 3/23/2026",
    url: null,
    linkLabel: "Link",
    documentDate: "2026-03-23",
  },
  {
    kind: "document",
    title: "Weekly Policy & TA Email — 3/16/2026",
    url: null,
    linkLabel: "Link",
    documentDate: "2026-03-16",
  },
  {
    kind: "document",
    title: "Weekly Policy & TA Email — 3/2/2026",
    url: null,
    linkLabel: "Link",
    documentDate: "2026-03-02",
  },
  {
    kind: "document",
    title: "Weekly Policy & TA Email — 2/23/2026",
    url: null,
    linkLabel: "Link",
    documentDate: "2026-02-23",
  },
  {
    kind: "document",
    title: "How TA works with CX",
    url: null,
    linkLabel: "PDF",
    documentDate: "2026-03-26",
  },
];

const marketingResources: SeedResource[] = [
  {
    kind: "tool",
    title: "Marketing Request Form",
    url: "https://tadhealth-hub-5hsi.vercel.app/request.html",
    linkLabel: "Form",
    category: "Forms",
  },
  {
    kind: "tool",
    title: "Brand Assets",
    url: "https://drive.google.com/drive/folders/1ZNKYAIu9f9LFAjsUe2JgmP1yoSrz73lo?usp=drive_link",
    linkLabel: "Drive",
    category: "Brand",
  },
  {
    kind: "tool",
    title: "TadTalks",
    url: "https://drive.google.com/drive/folders/16qwwfMfkrFE1fq6ppbpKaibqe74XroVp?usp=drive_link",
    linkLabel: "Drive",
    category: "Media",
  },
  {
    kind: "tool",
    title: "TadHealth Webinars",
    url: "https://drive.google.com/drive/folders/1hYVJvHFlE0ISIvCE9kbo3dwiwZsV_AbT?usp=drive_link",
    linkLabel: "Drive",
    category: "Media",
  },
  {
    kind: "tool",
    title: "DHCS Fee Schedule Resource Library",
    url: "https://www.dhcs.ca.gov/CYBHI/Pages/Fee-Schedule-Resource-Library.aspx",
    linkLabel: "Link",
    category: "External",
  },
];

const careersHrResources: SeedResource[] = [
  {
    kind: "document",
    title: "Employee Handbook",
    url: "https://docs.google.com/document/d/1Hw2g1gOKzztSu75DlWxQxcV2cK_rJYI4MukxfLnpl4w/edit?tab=t.0",
    linkLabel: "Doc",
  },
  {
    kind: "document",
    title: "Benefits 1-Pager",
    url: "https://drive.google.com/file/d/19_vhj6vZ25Z3fD5m0WD5f39r6QQmWkej/view?usp=drive_link",
    linkLabel: "PDF",
  },
  {
    kind: "document",
    title: "Expense Policy",
    url: "https://drive.google.com/file/d/1OOQSss1cSbvu0xHHsn7jW7TfQH5JmnEy/view?usp=drive_link",
    linkLabel: "PDF",
  },
  {
    kind: "document",
    title: "Communication Guide",
    url: "https://drive.google.com/file/d/1r6atk9y9foHgZI12zN0X-VqTKBlFDnrU/view?usp=drive_link",
    linkLabel: "PDF",
  },
  {
    kind: "document",
    title: "Holiday Schedule",
    url: "https://drive.google.com/file/d/1sSQPG0QHx-hXnddmEhQwWs8mNRSX5rVh/view?usp=drive_link",
    linkLabel: "PDF",
  },
];

const departmentResourceSeeds: Record<string, SeedResource[]> = {
  "Policy & TA": policyTAResources,
  Marketing: marketingResources,
  "Careers & HR": careersHrResources,
};

async function seedDepartmentResources() {
  for (const [deptName, seeds] of Object.entries(departmentResourceSeeds)) {
    const existing = await db
      .select({ id: departmentResources.id })
      .from(departmentResources)
      .where(eq(departmentResources.departmentName, deptName))
      .limit(1);
    if (existing.length > 0) {
      console.log(`Skipping ${deptName} resources — already seeded.`);
      continue;
    }
    console.log(`Seeding ${seeds.length} ${deptName} resources…`);
    await db.insert(departmentResources).values(
      seeds.map((r, i) => ({
        departmentName: deptName,
        kind: r.kind,
        title: r.title,
        url: r.url,
        linkLabel: r.linkLabel,
        category: r.category ?? null,
        documentDate: r.documentDate ?? null,
        sortOrder: i,
      })),
    );
  }
}

async function run() {
  console.log(`Seeding ${seedDepartments.length} departments…`);
  await db
    .insert(departments)
    .values(seedDepartments)
    .onConflictDoNothing({ target: departments.name });

  console.log(`Seeding ${seedEmployees.length} employees…`);
  // Pass 1: upsert every employee row from Claire's roster. Refresh the
  // columns the seed owns (name/title/dept/location) so re-running the seed
  // applies title/location updates; leave bio/phone (admin-edited) alone.
  for (let i = 0; i < seedEmployees.length; i++) {
    const { managerEmail: _drop, ...row } = seedEmployees[i]!;
    void _drop;
    await db
      .insert(employees)
      .values({ ...row, sortOrder: i })
      .onConflictDoUpdate({
        target: employees.email,
        set: {
          firstName: row.firstName,
          lastName: row.lastName ?? null,
          title: row.title,
          department: row.department,
          subDepartment: row.subDepartment ?? null,
          location: row.location ?? null,
          sortOrder: i,
          updatedAt: new Date(),
        },
      });
  }

  // Pass 2: wire managerId. Build email -> id map, then patch each row whose
  // seed entry declared a managerEmail. Self-references are ignored.
  console.log("Linking managers…");
  const allEmployees = await db
    .select({ id: employees.id, email: employees.email })
    .from(employees);
  const idByEmail = new Map(allEmployees.map((e) => [e.email, e.id]));
  for (const seed of seedEmployees) {
    if (!seed.managerEmail) continue;
    if (seed.managerEmail === seed.email) continue;
    const employeeId = idByEmail.get(seed.email);
    const managerId = idByEmail.get(seed.managerEmail);
    if (!employeeId || !managerId) continue;
    await db
      .update(employees)
      .set({ managerId, updatedAt: new Date() })
      .where(eq(employees.id, employeeId));
  }

  await seedEventsIfEmpty();
  await seedSurveysIfEmpty();
  await seedDepartmentSurveys();
  await seedDepartmentResources();

  console.log("Seed complete.");
  await sql.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});