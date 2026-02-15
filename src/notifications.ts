export enum NotificationEvent {
  DEAL_FUNDED = "DEAL_FUNDED",
  MILESTONE_SUBMITTED = "MILESTONE_SUBMITTED",
  DISPUTE_OPENED = "DISPUTE_OPENED"
}

interface TemplateVariables {
  userName: string;
  dealTitle: string;
  actionUrl: string;
  amount?: string;
}

export const TEMPLATES: Record<NotificationEvent, (vars: TemplateVariables) => string> = {
  [NotificationEvent.DEAL_FUNDED]: (v) => 
    `Great news, ${v.userName}! The deal "${v.dealTitle}" has been fully funded with ${v.amount}. You can now begin work.`,
  
  [NotificationEvent.MILESTONE_SUBMITTED]: (v) => 
    `Action Required: Work for "${v.dealTitle}" has been submitted. Please review it here: ${v.actionUrl}`,
  
  [NotificationEvent.DISPUTE_OPENED]: (v) => 
    `URGENT: A dispute has been opened on "${v.dealTitle}". Your funds are frozen until resolved.`
};

/**
 * Generates the secure message content.
 * logic: sanitizes inputs to prevent HTML injection in emails.
 */
export function generateMessage(
  event: NotificationEvent, 
  vars: TemplateVariables
): { subject: string, body: string } {
  // Simple sanitizer
  const clean = (str: string) => str.replace(/[<>]/g, "");
  
  const safeVars = {
    userName: clean(vars.userName),
    dealTitle: clean(vars.dealTitle),
    actionUrl: vars.actionUrl, // URLs usually need different validation
    amount: vars.amount ? clean(vars.amount) : ""
  };

  return {
    subject: `Update regarding ${safeVars.dealTitle}`,
    body: TEMPLATES[event](safeVars)
  };
}
