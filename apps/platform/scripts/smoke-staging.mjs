const baseUrl = (process.env.STAGING_BASE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);

async function request(path, expectedStatuses) {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: "manual",
    signal: AbortSignal.timeout(10_000),
  });

  if (!expectedStatuses.includes(response.status)) {
    throw new Error(
      `${path} returned ${response.status}; expected ${expectedStatuses.join(", ")}`,
    );
  }

  return response;
}

function requireHeader(response, name, expected) {
  const value = response.headers.get(name);
  if (!value || (expected && value !== expected)) {
    throw new Error(
      `${response.url} is missing ${name}${expected ? `=${expected}` : ""}`,
    );
  }
}

const health = await request("/api/health", [200]);
const healthBody = await health.json();
if (
  healthBody.status !== "ready" ||
  healthBody.checks?.database !== "up"
) {
  throw new Error("Health endpoint did not report a ready database.");
}

const login = await request("/login", [200]);
requireHeader(login, "x-content-type-options", "nosniff");
requireHeader(login, "x-frame-options", "DENY");
requireHeader(login, "referrer-policy", "strict-origin-when-cross-origin");
requireHeader(login, "strict-transport-security");

await request("/", [200, 302, 307, 308]);

console.log(
  JSON.stringify({
    status: "passed",
    baseUrl,
    checks: ["database", "login", "root-route", "security-headers"],
  }),
);
