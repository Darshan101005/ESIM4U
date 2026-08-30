/** Ticket problem categories shown in the customer create form + admin filters. */
export const TICKET_CATEGORIES = [
  "eSIM activation",
  "Data / connectivity",
  "Billing & payments",
  "Refund request",
  "Order / delivery",
  "Top-up / recharge",
  "Account & login",
  "Referrals & credit",
  "Other",
] as const;

/** Departments a ticket can be routed to. */
export const TICKET_DEPARTMENTS = ["Technical Support", "Billing", "Sales", "General Enquiry"] as const;
