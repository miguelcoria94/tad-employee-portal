// Curated "how do I X" knowledge base for the Tad assistant. Keeping this as
// hand-written content (rather than scraping the Help page) keeps answers
// accurate and avoids hallucination. Update here when features change.

export type HelpTopic = {
  key: string;
  title: string;
  content: string;
};

export const HELP_TOPICS: HelpTopic[] = [
  {
    key: "time_off",
    title: "Requesting time off",
    content:
      "Go to Time Off in the top nav. Click 'Request time off', pick the type (vacation, sick, etc.), choose start/end dates, add an optional note, and submit. Your manager/admin reviews it and you'll get a notification when it's approved or denied. Your remaining balances are shown on the same page.",
  },
  {
    key: "feedback_self",
    title: "Requesting feedback about yourself",
    content:
      "Open Feedback and click 'Request Feedback'. As a regular employee the subject is locked to you. Pick the colleagues who should respond, optionally make their responses anonymous, and submit. Responses show up under the 'Received' tab.",
  },
  {
    key: "feedback_others",
    title: "Requesting feedback about other people (admins & department heads)",
    content:
      "Admins and department heads can request feedback about anyone. In the Request Feedback page choose the subject, customize the questions (or load/save a template), pick respondents, and submit. Respondents answer with a rich-text editor.",
  },
  {
    key: "give_feedback",
    title: "Giving feedback",
    content:
      "When someone requests your feedback you'll see it under Feedback > 'Give Feedback'. Open it, answer each question in the rich-text editor, and submit. You can also decline a request.",
  },
  {
    key: "directory",
    title: "Finding people and the org directory",
    content:
      "Use Directory to browse all employees, or the global search (top-right, Cmd/Ctrl+K) to jump to a person, department, update, or resource. Each person's card shows their title, department, and manager.",
  },
  {
    key: "departments",
    title: "Departments and who runs them",
    content:
      "Departments lists each team with its description and members. Some departments are private and only visible to members and admins. Each department has one or more department heads who manage it.",
  },
  {
    key: "messages",
    title: "Direct messages",
    content:
      "Use Messages to chat 1:1 with colleagues. Click the compose icon to start a new conversation, search the conversation list by name, and use the search icon inside a conversation to find past messages.",
  },
  {
    key: "internal_jobs",
    title: "Internal jobs and referrals",
    content:
      "Jobs lists open internal roles. Open a role to see details and submit a referral (you can attach a resume). Track your referrals from the same area.",
  },
  {
    key: "training",
    title: "Training courses",
    content:
      "Training lists published courses. Open a course to work through its lessons and quizzes; your completion is tracked per course.",
  },
  {
    key: "surveys",
    title: "Surveys",
    content:
      "Surveys lists available surveys (some anonymous). Open one to respond. Admins can view aggregated results.",
  },
  {
    key: "profile",
    title: "Updating your profile",
    content:
      "Click your avatar (top-right) to open your profile, where you can update your photo, phone, location, and bio. Title, department, and manager are managed by admins.",
  },
];

// Canonical in-app routes the assistant can point users to. The model renders
// markdown, so it can turn these into links/route references. Keep in sync with
// apps/web/src/App.tsx.
export const APP_ROUTES: { route: string; label: string; description: string }[] = [
  { route: "/", label: "Home", description: "Dashboard with your action items, upcoming events, and company updates." },
  { route: "/directory", label: "Directory", description: "Browse all employees and their profiles." },
  { route: "/departments", label: "Departments", description: "Browse teams, descriptions, members, and department heads." },
  { route: "/company-updates", label: "Company Updates", description: "Latest company announcements and news." },
  { route: "/surveys", label: "Surveys", description: "Available surveys to respond to." },
  { route: "/time-off", label: "Time Off", description: "Request time off and view your balances and request status." },
  { route: "/feedback", label: "Feedback", description: "Give feedback, request feedback, and view feedback received. Pending feedback requests (surveys) appear here." },
  { route: "/feedback/request", label: "Request Feedback", description: "Start a new feedback request." },
  { route: "/resources", label: "Resources & Handbook", description: "Company-wide handbook, benefits, and policy documents available to every employee." },
  { route: "/internal-jobs", label: "Internal Jobs", description: "Open internal roles; open a posting to submit a referral." },
  { route: "/dms", label: "Messages", description: "Direct-message colleagues 1:1." },
  { route: "/me", label: "My Profile", description: "Update your photo, phone, location, and bio." },
  { route: "/notifications", label: "Notifications", description: "Your notifications." },
  { route: "/help", label: "Help", description: "How-to help for using the portal." },
];

export function helpTopicList() {
  return HELP_TOPICS.map((t) => ({ key: t.key, title: t.title }));
}

export function getHelpTopic(key: string) {
  return HELP_TOPICS.find((t) => t.key === key) ?? null;
}
