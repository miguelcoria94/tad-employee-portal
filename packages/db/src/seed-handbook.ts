// Company-wide handbook / benefits / policy content, seeded as rich-document
// resources under the sentinel "Company" department so every employee can read
// them and the Tad assistant can answer benefits/PTO/policy questions.
//
// Keep the figures, emails, and dates accurate — the AI quotes these verbatim.

export type CompanyResourceSeed = {
  title: string;
  category: string;
  content: string; // sanitized-safe HTML (headings, lists, bold, links)
};

export const companyResourceSeeds: CompanyResourceSeed[] = [
  {
    title: "Employee Benefits",
    category: "Benefits",
    content: `
<h2>Employee Benefits</h2>

<h3>Health Insurance</h3>
<p>TadHealth offers medical coverage through <strong>Blue Shield</strong>, with <strong>10 plans</strong> to choose from. Enrollment is handled in <strong>Gusto</strong>.</p>
<ul>
  <li><strong>Waiting period:</strong> Coverage becomes effective the <strong>1st of the month following your hire date</strong>.</li>
  <li>The company covers <strong>100% of the base plan</strong>. You may buy up to a higher plan at your own cost.</li>
  <li>Available account and coverage types: <strong>HSA</strong>, <strong>FSA</strong>, <strong>DCFSA</strong> (Dependent Care FSA), <strong>Dental</strong>, <strong>Vision</strong>, <strong>Life</strong>, and <strong>Long-Term Disability (LTD)</strong>.</li>
  <li><strong>Qualifying life events</strong> (marriage, birth/adoption, loss of other coverage, etc.) allow you to change elections outside of open enrollment.</li>
</ul>

<h3>Pre-Coverage Stipend</h3>
<p>If you start before your benefits are effective, TadHealth provides a <strong>$400/month stipend</strong> to help cover insurance until your company coverage becomes effective. This stipend runs until coverage is effective on <strong>May 1, 2026</strong>.</p>

<h3>401(k) Retirement</h3>
<p>Retirement savings are offered through <strong>Guideline</strong>.</p>

<h3>Office Supplies Stipend</h3>
<p>New employees receive a <strong>one-time $150 office supplies stipend</strong>. Submit <strong>itemized receipts</strong> to <strong>hr@tadhealth.com</strong> within <strong>30 days</strong> to be reimbursed.</p>

<h3>Paid Time Off</h3>
<ul>
  <li><strong>Unlimited PTO</strong>, subject to manager approval.</li>
  <li><strong>Parental leave:</strong> <strong>12 weeks maternity</strong> / <strong>8 weeks paternity</strong>.</li>
  <li><strong>Sick leave:</strong> log it in <strong>Gusto</strong>. Absences of <strong>more than 5 consecutive days</strong> require additional approval.</li>
  <li><strong>Bereavement:</strong> up to <strong>60 days within a 12-month period</strong> for employees who have been with the company for <strong>30+ days</strong>.</li>
</ul>

<h3>Reviews</h3>
<ul>
  <li><strong>Performance reviews:</strong> conducted <strong>semi-annually</strong>.</li>
  <li><strong>Compensation reviews:</strong> conducted <strong>annually</strong>.</li>
</ul>
`,
  },
  {
    title: "Perks & Team Swag",
    category: "Benefits",
    content: `
<h2>Perks &amp; Team Swag</h2>
<ul>
  <li><strong>Company credit cards</strong> for frequent travelers.</li>
  <li><strong>MacBook + branded swag</strong> for full-time employees on their start date.</li>
  <li><strong>Refresh Days:</strong> <strong>2 mental health days per year</strong>.</li>
  <li><strong>Birthday Time Off:</strong> one day off during your birthday month, plus a <strong>reimbursed morning coffee</strong>.</li>
  <li><strong>Professional Development Stipend</strong> to invest in your growth.</li>
  <li><strong>Virtual Team Events:</strong> <strong>2 per team per year</strong>.</li>
  <li><strong>Annual In-Person:</strong> the company flies the team to <strong>Newport Beach</strong>.</li>
  <li><strong>In-Person Meet Ups:</strong> the company reimburses co-working space for local meet ups.</li>
</ul>
`,
  },
  {
    title: "Employee Handbook — Welcome & Company Background",
    category: "Handbook",
    content: `
<h2>Welcome to TadHealth</h2>
<p>A warm welcome from <strong>Ben Greiner, Founder &amp; CEO</strong>. We're thrilled to have you on the team. This handbook is your guide to how we work, the tools we use, and what you can expect as part of TadHealth.</p>

<h3>Our Mission</h3>
<p>TadHealth is focused on <strong>student mental health</strong>. We support the <strong>Children and Youth Behavioral Health Initiative (CYBHI)</strong> in California, handling <strong>billing, compliance, reimbursements, and care coordination</strong> so providers and schools can focus on students.</p>

<h3>Company Background</h3>
<p>TadHealth was founded to close the gap in access to mental health support for students. What began as an effort to make care more reachable has grown into a platform that streamlines the operational and financial side of behavioral health — making it easier for schools, providers, and families to connect students with the care they need.</p>
`,
  },
  {
    title: "Tools & Platforms",
    category: "Handbook",
    content: `
<h2>Tools &amp; Platforms</h2>
<p>Please make sure you have access to each of these within your <strong>first week</strong>.</p>
<ul>
  <li><strong>Google Workspace / Email:</strong> your primary email and document collaboration suite.</li>
  <li><strong>Gusto:</strong> employee info, time off, documents, payroll, and trainings. <strong>Only HR can see your personal information.</strong></li>
  <li><strong>Slack:</strong> team communication. <strong>#General</strong> is used for company-wide announcements.</li>
  <li><strong>Zoom:</strong> video meetings — keep your <strong>camera on</strong> and use a <strong>professional background</strong>.</li>
  <li><strong>Granola AI:</strong> AI-assisted meeting notes.</li>
</ul>
`,
  },
  {
    title: "Expectations & Professional Communication",
    category: "Handbook",
    content: `
<h2>Expectations &amp; Professional Communication</h2>
<ul>
  <li>Be <strong>collaborative and respectful</strong> in all interactions.</li>
  <li><strong>Video communication:</strong> ensure a strong wifi connection, be presentable, and be mindful of your background.</li>
  <li><strong>In-person retreats:</strong> maintain professionalism throughout.</li>
  <li><strong>Assume visibility at all times</strong> — what you say and do may be seen by others.</li>
  <li>Use <strong>good judgment in written communication.</strong></li>
  <li>Be <strong>aware of screen sharing</strong> — close anything you wouldn't want others to see.</li>
  <li>Always <strong>represent the company professionally.</strong></li>
  <li><strong>When in doubt, don't send it.</strong></li>
</ul>
`,
  },
  {
    title: "Payroll",
    category: "Handbook",
    content: `
<h2>Payroll</h2>
<ul>
  <li>Pay is issued <strong>semi-monthly</strong> on a <strong>salary basis</strong>.</li>
  <li>When a payday falls on a <strong>weekend or holiday</strong>, you'll be paid on the <strong>prior business day</strong>.</li>
  <li>Pay is based on a <strong>40-hour work week</strong>.</li>
  <li>Positions are <strong>exempt</strong> — there is <strong>no overtime</strong>.</li>
  <li>Keep your information <strong>current in Gusto</strong> (address, direct deposit, tax withholding, etc.).</li>
</ul>
`,
  },
  {
    title: "Policy Guidelines & HR",
    category: "Policy",
    content: `
<h2>Policy Guidelines &amp; HR</h2>

<h3>Contacting HR — hr@tadhealth.com</h3>
<p>Email <strong>hr@tadhealth.com</strong> for:</p>
<ul>
  <li>Equipment requests</li>
  <li>Benefits and employment inquiries</li>
  <li>Tools access</li>
  <li>Document requests</li>
  <li>Complaints or reports of misconduct</li>
</ul>

<h3>Performance & Complaint Process</h3>
<p>The process generally follows: a <strong>15-minute HR meeting</strong> → a possible <strong>Performance Improvement Plan (PIP)</strong> → a <strong>30-day</strong> period → further action if needed.</p>

<h3>Onboarding Paperwork</h3>
<ul>
  <li>The <strong>Employee Agreement</strong> is signed on your start date.</li>
  <li>Your <strong>I-9</strong> is completed on your <strong>first day</strong> — send a photo of your documents to <strong>claire@tadhealth.com</strong>.</li>
  <li><strong>Personnel records</strong> are kept in <strong>Gusto</strong> and are accessible to <strong>HR only</strong>.</li>
</ul>

<h3>Discrimination & Harassment</h3>
<p>TadHealth has a <strong>zero-tolerance</strong> policy toward discrimination and harassment based on <strong>race, age, color, religion, sexual orientation, or disability</strong>. Violations may result in <strong>termination</strong>.</p>

<h3>Termination</h3>
<ul>
  <li>Provide <strong>written notice to your manager</strong>.</li>
  <li>A <strong>two-week notice</strong> is required.</li>
  <li><strong>Offboarding and laptop return</strong> are coordinated through <strong>Claire</strong>.</li>
</ul>

<h3>Employment Relationship</h3>
<p>No <strong>conflicting outside employment</strong> is permitted.</p>

<h3>Security</h3>
<ul>
  <li>Enable <strong>2FA on all tools</strong>.</li>
  <li><strong>Beware of phishing</strong> attempts.</li>
</ul>

<h3>Remote / Hybrid Work</h3>
<ul>
  <li>TadHealth is <strong>primarily remote</strong>; a <strong>suitable workspace</strong> is required.</li>
  <li><strong>In-office core days are Tuesdays &amp; Thursdays</strong> (LA / San Diego) — please give <strong>Claire</strong> a heads up.</li>
</ul>
`,
  },
  {
    title: "Time Off & Leave",
    category: "Policy",
    content: `
<h2>Time Off &amp; Leave</h2>
<ul>
  <li><strong>Unlimited PTO</strong> with <strong>advance manager approval</strong>.</li>
  <li>Submit time-off requests in <strong>Gusto</strong> at least <strong>2 weeks in advance</strong>.</li>
  <li>Send a <strong>handover document</strong> at least <strong>3 days before</strong> your departure.</li>
  <li>Set an <strong>out-of-office</strong> message with your <strong>return date</strong> and a <strong>backup contact</strong>.</li>
  <li><strong>Sick leave</strong> is logged in <strong>Gusto</strong>.</li>
  <li><strong>Public holidays</strong> are shared with you at the start.</li>
</ul>
`,
  },
  {
    title: "Company Calendars",
    category: "Resources",
    content: `
<h2>Company Calendars</h2>
<p>TadHealth maintains shared calendars to keep everyone aligned:</p>
<ul>
  <li><strong>Holiday Calendar</strong> — company-observed holidays.</li>
  <li><strong>TadHealth Master Calendar</strong> — product updates, releases, deadlines, initiatives, onboarding, closings, and birthdays.</li>
  <li><strong>PTO Calendar</strong> — team time off at a glance.</li>
</ul>
<p>The shareable Google Calendar links for each calendar are posted in Slack <strong>#General</strong> and available from HR. Add them to your own Google Calendar using the "From URL" steps below.</p>

<h3>Adding a Calendar "From URL"</h3>
<ol>
  <li>Open <strong>Google Calendar</strong> on the web.</li>
  <li>On the left, next to <strong>"Other calendars,"</strong> click the <strong>+</strong> button.</li>
  <li>Choose <strong>"From URL."</strong></li>
  <li>Paste the calendar's <strong>URL</strong>.</li>
  <li>Click <strong>"Add calendar."</strong> It will appear under "Other calendars."</li>
</ol>
`,
  },
  {
    title: "Travel & Reimbursement Policy",
    category: "Policy",
    content: `
<h2>Travel &amp; Reimbursement Policy</h2>
<p>Always <strong>act in the company's best interest</strong> and <strong>book travel early</strong> to secure the best rates.</p>

<h3>Accountable-Plan Criteria</h3>
<p>To be reimbursed tax-free, expenses must meet all of the following:</p>
<ul>
  <li><strong>Business connection</strong> — the expense serves a legitimate business purpose.</li>
  <li><strong>Substantiation within 15 days</strong> — submit documentation/receipts within 15 days.</li>
  <li><strong>Return of excess within 15 days</strong> — return any unused advance within 15 days.</li>
</ul>
<p>Amounts that don't meet these criteria may be treated as <strong>taxable income</strong>.</p>

<h3>Eligible Expenses</h3>
<ul>
  <li>Travel</li>
  <li>Mileage (reimbursed at the <strong>IRS standard rate</strong>)</li>
  <li>Business meals &amp; entertainment</li>
  <li>Office supplies &amp; equipment</li>
  <li>Client-related expenses</li>
  <li>Training &amp; conference fees</li>
</ul>

<h3>Reimbursement Process</h3>
<ol>
  <li>Get <strong>pre-approval from your manager</strong>.</li>
  <li>Keep <strong>receipts</strong> and submit them <strong>within 15 days</strong>.</li>
  <li>Submit your expenses to <strong>claire@tadhealth.com</strong>.</li>
  <li>Your <strong>supervisor approves</strong> the request.</li>
  <li>You'll be <strong>reimbursed within 15 business days</strong>.</li>
</ol>
`,
  },
  {
    title: "TadHealth 2026 Holiday Schedule",
    category: "Resources",
    content: `
<h2>TadHealth 2026 Holiday Schedule</h2>
<p>The company observes the following paid holidays and Refresh Days in <strong>2026</strong>:</p>
<ul>
  <li><strong>Martin Luther King Jr. Day</strong> — Monday, January 19</li>
  <li><strong>President's Day</strong> — Monday, February 19</li>
  <li><strong>Refresh Day #1</strong> — Friday, May 22</li>
  <li><strong>Memorial Day</strong> — Monday, May 25</li>
  <li><strong>Juneteenth</strong> — Friday, June 19</li>
  <li><strong>Independence Day</strong> — Friday, July 3</li>
  <li><strong>Refresh Day #2</strong> — Friday, September 4</li>
  <li><strong>Labor Day</strong> — Monday, September 7</li>
  <li><strong>Thanksgiving Break</strong> — Thursday, November 26 &amp; Friday, November 27</li>
  <li><strong>Holiday Break</strong> — starting Thursday, December 24, returning to the office on Monday, January 4, 2027</li>
</ul>
`,
  },
  {
    title: "Travel Expense Policy (Brex, Per Diem & Mileage)",
    category: "Policy",
    content: `
<h2>TadHealth Travel Expense Policy</h2>
<p>A quick reminder and a few updates to our travel and expense policy to keep everything running smoothly and in compliance.</p>

<h3>Flights &amp; Hotels</h3>
<ul>
  <li>All <strong>flights and hotel bookings must be coordinated through Claire</strong>. Reach out as soon as you're aware of any upcoming travel.</li>
</ul>

<h3>Hotel Eligibility</h3>
<ul>
  <li>You're eligible for hotel reimbursement if the <strong>one-way driving distance exceeds 50 miles</strong>.</li>
  <li>For shorter drives, overnight stays are <strong>generally not approved</strong> unless justified by business needs and <strong>pre-approved by your manager and Claire</strong>.</li>
</ul>

<h3>Uber / Lyft / Mileage</h3>
<ul>
  <li>Rides should be <strong>economical and business-related</strong>.</li>
  <li>Personal vehicle use is reimbursed at the <strong>current IRS rate of 72.5 cents per mile</strong>.</li>
  <li>Send <strong>Claire your mileage at the end of each month</strong>.</li>
  <li><strong>Commuting</strong> to and from the office is <strong>not</strong> eligible for reimbursement.</li>
</ul>

<h3>Brex Card Expenses</h3>
<p>If you have a company Brex card:</p>
<ul>
  <li><strong>Keep all receipts.</strong></li>
  <li><strong>Upload receipts to Brex</strong> upon purchase, or at the latest <strong>within 15 days</strong> of the transaction.</li>
  <li>Add a short, clear description in the <strong>"Memo"</strong> section.</li>
  <li>If you charge <strong>more than the per diem</strong> amount per IRS guidelines, you'll need to <strong>pay the company back</strong> — in some cases we will issue a <strong>1099</strong>.</li>
</ul>

<h3>Meal Per Diem</h3>
<ul>
  <li><strong>Daily limit: $86</strong> while traveling, per 2026 IRS legal deductions.</li>
  <li><strong>Exceptions</strong> (e.g., client or team dinner): message <strong>Claire and your manager ahead of time</strong> for approval. If you don't message your manager ahead of a team dinner, <strong>the company will not pay for it</strong> per IRS guidelines.</li>
  <li>If approved for a <strong>client dinner</strong>, specify <strong>who the client is</strong> in the Brex Memo.</li>
</ul>

<h3>Non-Brex Expenses (1099s only)</h3>
<ul>
  <li>For any approved business expense you pay yourself, submit receipts to <strong>Claire within 15 days</strong> of the transaction for quick reimbursement.</li>
  <li>For <strong>company-wide in-person events</strong>, expense reimbursement details will be communicated ahead of time.</li>
</ul>

<h3>Compliance</h3>
<p>For Brex cardholders, <strong>failure to follow the policy results in a strike</strong>. After <strong>three strikes</strong>, Brex card privileges may be revoked. Please reach out with any questions — thanks for helping keep this process tight!</p>
`,
  },
];
