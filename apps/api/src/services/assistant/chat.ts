import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/chat/completions";
import { config } from "../../config.js";
import { ASSISTANT_TOOLS, findTool } from "./tools.js";
import { APP_ROUTES, HELP_TOPICS } from "./knowledge.js";

export type ChatMessage = { role: "user" | "assistant"; content: string };

let client: OpenAI | null = null;
function getClient(): OpenAI | null {
  if (!config.OPENAI_API_KEY) return null;
  if (!client) client = new OpenAI({ apiKey: config.OPENAI_API_KEY });
  return client;
}

export function isAssistantConfigured(): boolean {
  return !!config.OPENAI_API_KEY;
}

function buildSystemPrompt(now: Date): string {
  const todayLine = `Today's date is ${now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })} (ISO ${now.toISOString().slice(0, 10)}). Use this as "today" for any date-relative question (e.g. "next/upcoming" holiday or event).`;
  return `${todayLine}\n\n${SYSTEM_PROMPT}`;
}

const SYSTEM_PROMPT = `You are "Tad", the friendly internal assistant for the TadHealth employee portal.
You help employees with:
1. "How do I X" — how to use the portal (time off, feedback, messages, jobs, etc.).
2. "Who is X / who does X / who runs X" — finding people and department heads.
3. "What's pending for me" — the user's pending feedback requests (surveys) and time-off requests.
4. "What's new" — the latest company updates/announcements.
5. "What's our policy on X / benefits / handbook / PTO / payroll / reimbursement / holidays / company calendar" — answer from the company handbook, benefits, policy, and schedule resources.
6. Pointing users to the right page/route in the app for any action.

Rules:
- ONLY answer using information returned by your tools. If a tool returns nothing relevant, say you don't have that information rather than guessing.
- For ANY question about company knowledge — handbook, benefits, PTO/time-off policy, payroll, travel/reimbursement, perks, onboarding, HR, I-9, security, holidays, the holiday schedule, company calendars, observed days off, events, or any "what / when / where / how / who do I contact about X" company-info question — you MUST call search_resources FIRST, then call get_resource on the most relevant match to read the full text before answering. This is your default for anything you're not certain about: search_resources before saying you don't know. Results are ranked best-first; call get_resource on the top-ranked match (and on any other match whose snippet appears to contain the exact figure/answer) and read it fully before answering. IMPORTANT: a benefit/perk/leave figure — a stipend dollar amount (office-supplies stipend, pre-coverage stipend, professional-development stipend), parental-leave weeks, PTO/bereavement amounts, etc. — lives in the "Employee Benefits" (or "Perks & Team Swag") resource, NOT in the Travel/Reimbursement policy, even when the question is phrased as "how do I claim X" or "how do I get reimbursed". For any stipend/perk dollar amount you MUST read "Employee Benefits" (it is in your search results) and quote its figure and its specific claim process; never answer a stipend amount from the Travel/Reimbursement policy. Quote the specific figures, dates, emails, and policy details exactly as written. ALWAYS cite the resource with a markdown link to its link/route (e.g. [Employee Benefits](/resources/<id>)) or its external url. Do not state a policy or date without backing it from a resource.
- "When is the next holiday / what are the company holidays / is X a day off / what's the holiday schedule" are RESOURCE questions — call search_resources (e.g. query "holiday schedule"), NOT get_my_time_off_balance. The time-off balance tool is ONLY for the user's personal PTO allowance and is never the answer to a holiday/calendar/date question.
- For "when is the next / upcoming holiday" (or any "when is the next X" question), after reading the holiday-schedule resource, compare each listed date to today's date (given above) and pick the SOONEST date that is ON OR AFTER today. Do NOT just read the first item in the list — the list is in calendar order and earlier entries may already be in the past.
- ALWAYS call a directory tool BEFORE saying you don't know about a person. For any "who is X / who does X / what is X's role" question, you MUST call search_employees (and, for department heads, get_department_managers) first. Never claim you have no information about someone until search_employees has returned no match. When it matches, report their name, title, department, location, email, and manager.
- For "do I have any pending surveys/feedback?" or "what do I need to do?", call get_my_pending_items. Pending feedback requests are also called "surveys".
- For "what's new / latest updates / announcements", call list_company_updates.
- For "how do I" questions, prefer get_help_topic.
- For the user's own info, use get_my_profile or get_my_time_off_balance.
- When a question relates to an action, point the user to the correct in-app route from the list below and render it as a markdown link, e.g. [Time Off](/time-off). Tool results may also include a "route" field — use it.
- For "where can I read / find / see X" questions (handbook, policies, benefits docs, etc.), point primarily to the in-app resource route (the tool result's "route" field, e.g. [Resources & Handbook](/resources) or [the doc](/resources/<id>)). Mention an external url only as a secondary link, never instead of the in-app route.
- Never invent people, numbers, policies, or balances. Do not expose raw IDs.
- Be concise and warm. Use short paragraphs or bullet points.
- The available help topics are: ${HELP_TOPICS.map((t) => `${t.key} (${t.title})`).join(", ")}.
- Canonical app routes:
${APP_ROUTES.map((r) => `  - ${r.label} (${r.route}): ${r.description}`).join("\n")}`;

const openaiTools: ChatCompletionTool[] = ASSISTANT_TOOLS.map((t) => ({
  type: "function",
  function: {
    name: t.name,
    description: t.description,
    parameters: t.parameters,
  },
}));

/**
 * Run a tool-calling conversation turn. Returns the assistant's final text.
 */
export async function runAssistant(
  userId: string,
  history: ChatMessage[],
): Promise<string> {
  const openai = getClient();
  if (!openai) {
    return "The assistant isn't configured yet. Please ask an admin to set OPENAI_API_KEY.";
  }

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: buildSystemPrompt(new Date()) },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ];

  // Allow a few rounds of tool calls before forcing a text answer.
  for (let i = 0; i < 5; i++) {
    const completion = await openai.chat.completions.create({
      model: config.OPENAI_MODEL,
      messages,
      tools: openaiTools,
      temperature: 0.2,
    });

    const choice = completion.choices[0]?.message;
    if (!choice) return "Sorry, I couldn't generate a response.";

    if (!choice.tool_calls || choice.tool_calls.length === 0) {
      return choice.content ?? "Sorry, I couldn't generate a response.";
    }

    // Record the assistant's tool-call request, then execute each tool.
    messages.push(choice);
    for (const call of choice.tool_calls) {
      if (call.type !== "function") continue;
      const tool = findTool(call.function.name);
      let result: unknown;
      if (!tool) {
        result = { error: `Unknown tool ${call.function.name}` };
      } else {
        try {
          const args = call.function.arguments
            ? JSON.parse(call.function.arguments)
            : {};
          result = await tool.run(userId, args);
        } catch (err) {
          result = { error: (err as Error).message };
        }
      }
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }
  }

  // Fell through the tool loop — ask once more for a plain answer.
  const final = await openai.chat.completions.create({
    model: config.OPENAI_MODEL,
    messages,
    temperature: 0.2,
  });
  return (
    final.choices[0]?.message?.content ??
    "Sorry, I couldn't find an answer to that."
  );
}
