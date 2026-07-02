import { z } from "zod";
import { loanInputToFormFields } from "../loan/loanFormFields";
import {
  parsePrepaySource,
  SCENARIO_ID_TO_VIEW,
  type PrepaySource,
  type ScenarioView,
} from "../loan/scenarioViews";
import {
  stagedPrepaysFromEvents,
  type StagedPrepayEntry,
} from "../loan/stagedPrepays";
import { loanInputSchema, type LoanInput } from "../schemas/index";

const stagedPrepayEventSchema = z.object({
  month: z.number().int().positive(),
  amount_inr: z.number().positive(),
});

const scenarioImportSchema = z.object({
  scenario_id: z.string().min(1),
  inputs: z.record(z.unknown()),
  staged_prepayments: z.array(stagedPrepayEventSchema).optional(),
});

export type ScenarioImportResult = {
  inputs: Record<keyof LoanInput, string>;
  scenarioView: ScenarioView;
  prepaySource: PrepaySource;
  stagedPrepays: StagedPrepayEntry[];
};

export type ScenarioImportError = {
  success: false;
  message: string;
};

export type ScenarioImportOutcome =
  | ({ success: true } & ScenarioImportResult)
  | ScenarioImportError;

function extractLoanInputs(
  raw: Record<string, unknown>,
): z.SafeParseReturnType<unknown, LoanInput> {
  const {
    prepay_source: _prepaySource,
    staged_prepayments: _staged,
    monthly_401k_with_match_inr: _match,
    ...rest
  } = raw;
  return loanInputSchema.safeParse(rest);
}

export function parseScenarioImportJson(json: string): ScenarioImportOutcome {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { success: false, message: "Invalid JSON file." };
  }

  const envelope = scenarioImportSchema.safeParse(parsed);
  if (!envelope.success) {
    return {
      success: false,
      message: "File is not a recognised loan scenario export.",
    };
  }

  const loanParse = extractLoanInputs(envelope.data.inputs);
  if (!loanParse.success) {
    const first = loanParse.error.issues[0];
    return {
      success: false,
      message: first?.message ?? "Scenario inputs failed validation.",
    };
  }

  const scenarioView = SCENARIO_ID_TO_VIEW[envelope.data.scenario_id] ?? "BASE";
  const prepaySource = parsePrepaySource(envelope.data.inputs.prepay_source);
  const stagedEvents =
    envelope.data.staged_prepayments ??
    (Array.isArray(envelope.data.inputs.staged_prepayments)
      ? envelope.data.inputs.staged_prepayments
      : []);

  const stagedParse = z.array(stagedPrepayEventSchema).safeParse(stagedEvents);
  const stagedPrepays = stagedParse.success
    ? stagedPrepaysFromEvents(stagedParse.data)
    : [];

  return {
    success: true,
    inputs: loanInputToFormFields(loanParse.data),
    scenarioView,
    prepaySource,
    stagedPrepays,
  };
}
