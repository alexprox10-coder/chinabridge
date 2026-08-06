export type CheckStatus = "OK" | "WARNING" | "ERROR" | "SKIP";

export interface CheckResult {
  name:     string;
  status:   CheckStatus;
  message:  string;
  details?: string;
  ms?:      number;
}

export interface CheckSection {
  id:     string;
  name:   string;
  icon:   string;
  checks: CheckResult[];
  score:  number;
  status: CheckStatus;
}

export interface CtoReport {
  id?:          number;
  runAt:        string;
  durationMs:   number;
  healthScore:  number;
  systemStatus: "GREEN" | "YELLOW" | "RED";
  sections:     CheckSection[];
  issues: {
    critical: CheckResult[];
    warning:  CheckResult[];
    minor:    CheckResult[];
  };
  recommendations: string[];
  autoFixed:       string[];
  telegramSent:    boolean;
  ceoNotified:     boolean;
}
