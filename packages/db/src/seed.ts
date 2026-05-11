import "./load-env.js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { departments, employees } from "./schema.js";
import type { NewDepartment, NewEmployee } from "./schema.js";

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

  console.log("Seed complete.");
  await sql.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});