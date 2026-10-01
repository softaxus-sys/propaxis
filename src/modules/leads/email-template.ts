/** All fields here can contain arbitrary user input (a customer's name/message) — every
 * value must be escaped before going into the HTML body. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function leadNotificationEmail(input: {
  subject: string; // listing title / project name
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  message?: string;
  listingUrl?: string;
}): { subject: string; html: string; text: string } {
  const { subject, customerName, customerEmail, customerPhone, message, listingUrl } = input;

  const rows = [
    ["Enquiry about", subject],
    ["Name", customerName],
    ["Email", customerEmail],
    ...(customerPhone ? [["Phone", customerPhone]] : []),
  ];

  const html = `
    <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 480px;">
      <h2 style="margin: 0 0 4px; color: #0a0f1f;">New enquiry on Qasro</h2>
      <p style="margin: 0 0 16px; color: #667085; font-size: 14px;">
        This agency isn't connected to VRODUX yet, so this enquiry is being emailed directly.
      </p>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        ${rows
          .map(
            ([label, value]) => `
          <tr>
            <td style="padding: 6px 12px 6px 0; color: #667085; white-space: nowrap; vertical-align: top;">${escapeHtml(label)}</td>
            <td style="padding: 6px 0; color: #0a0f1f;">${escapeHtml(value)}</td>
          </tr>`,
          )
          .join("")}
      </table>
      ${
        message
          ? `<p style="margin: 16px 0 0; color: #0a0f1f; font-size: 14px; white-space: pre-wrap;">${escapeHtml(message)}</p>`
          : ""
      }
      ${
        listingUrl
          ? `<p style="margin: 20px 0 0;"><a href="${listingUrl}" style="color: #a97142;">View the listing on Qasro →</a></p>`
          : ""
      }
      <p style="margin: 24px 0 0; color: #98a2b3; font-size: 12px;">
        Reply directly to this email, or reach the customer at ${escapeHtml(customerEmail)}.
      </p>
    </div>
  `.trim();

  const text = [
    "New enquiry on Qasro",
    "This agency isn't connected to VRODUX yet, so this enquiry is being emailed directly.",
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    message ? `\n${message}` : "",
    listingUrl ? `\nListing: ${listingUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return { subject: `New enquiry: ${subject}`, html, text };
}
