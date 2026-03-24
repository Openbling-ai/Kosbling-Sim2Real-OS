import type { Scenario } from "../domain.js";
import type { CEOAgent } from "../agent_runtime/ceo.js";

export async function buildScenarioFromIdea(params: {
  ceo: CEOAgent;
  idea: string;
  askUser: (question: string) => Promise<string>;
}): Promise<Scenario> {
  const qaHistory: Array<{ question: string; answer: string }> = [];

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const result = await params.ceo.intakeIdea({
      idea: params.idea,
      qaHistory,
    });

    if (result.kind === "scenario") {
      return result.scenario;
    }

    const answer = await params.askUser(result.question);
    qaHistory.push({
      question: result.question,
      answer,
    });
  }

  throw new Error("Unable to form a scenario within the clarification limit.");
}
