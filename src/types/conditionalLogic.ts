export type LogicActionType = "GO_TO_QUESTION" | "SUBMIT_FORM" | "CLOSE_FORM";

export interface LogicAction {
  type: LogicActionType;
  // exactly one of these is used per type:
  nextQuestionId?: string;       // for GO_TO_QUESTION
  endPageId?: string;            // for SUBMIT_FORM
  // CLOSE_FORM has no target
}

export interface MCAnswer {
  id: string;
  label: string;
  order: number;
  logic?: LogicAction;       // present only when conditional logic enabled
}

export interface ConditionalLogicSettings {
  enabled: boolean;        // master toggle for this question
}

export interface EndPage {
  id: string;
  name: string;              // "End page for leads"
  headline?: string;
  body?: string;
  ctaLabel?: string;         // "View website"
  ctaUrl?: string;
}

export interface FormGraph {
  questions: any[];  // Will use existing Question types
  endPages: EndPage[];
  startQuestionId: string;
}

// Sample questions presets
export const SAMPLE_QUESTIONS = {
  budget: {
    label: "What's your budget?",
    answers: [
      "Under $1,000",
      "$1,000 - $5,000",
      "$5,000 - $10,000",
      "Over $10,000",
      "I'm not sure yet"
    ]
  },
  timeline: {
    label: "When do you need this completed?",
    answers: [
      "Right away",
      "Within a week",
      "Within a month",
      "Within 3 months",
      "No rush"
    ]
  },
  needs: {
    label: "What do you need help with?",
    answers: [
      "Product information",
      "Pricing details",
      "Technical support",
      "Schedule consultation",
      "Other"
    ]
  },
  habits: {
    label: "How often do you shop for insurance?",
    answers: [
      "Every 6 months",
      "Once a year",
      "Every few years",
      "Only when I need a new plan"
    ]
  },
  education: {
    label: "What's your highest level of education?",
    answers: [
      "High school",
      "Some college",
      "Bachelor's degree",
      "Graduate degree",
      "Prefer not to say"
    ]
  }
};