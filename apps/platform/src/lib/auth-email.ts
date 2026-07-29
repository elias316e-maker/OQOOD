import "server-only";

export async function sendAuthenticationEmail(input: { to: string; subject: string; text: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_FROM_EMAIL;
  if (!apiKey || !from) {
    console.warn("Authentication email is pending because the email provider is not configured.");
    return;
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [input.to], subject: input.subject, text: input.text }),
  });
  if (!response.ok) throw new Error(`Authentication email delivery failed (${response.status}).`);
}
