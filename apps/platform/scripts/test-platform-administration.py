"""Run administrative security tests against disposable local databases."""
from pathlib import Path
import os
import secrets
import signal
import subprocess
import time

APP = Path(__file__).resolve().parent.parent
TESTS = "src/features/platform-administration/__tests__/"
VARIABLES = (
    "ADMIN_TEST_DATABASE_URL",
    "ADMIN_BOOTSTRAP_TEST_DATABASE_URL",
    "ADMIN_AUTH_TEST_DATABASE_URL",
    "ADMIN_STAFF_TEST_DATABASE_URL",
)
GROUPS = (
    (
        "oqood_admin_test",
        VARIABLES[0],
        [
            "verification-store.integration.test.ts",
            "session-assurance.integration.test.ts",
        ],
    ),
    (
        "oqood_admin_bootstrap_test",
        VARIABLES[1],
        ["bootstrap-platform-administrator.integration.test.ts"],
    ),
    (
        "oqood_admin_auth_test",
        VARIABLES[2],
        ["better-auth-session.integration.test.ts"],
    ),
    (
        "oqood_admin_staff_test",
        VARIABLES[3],
        ["update-platform-staff.integration.test.ts"],
    ),
)


def run(args, env=None, quiet=False):
    result = subprocess.run(
        args,
        cwd=APP,
        env=env,
        stdout=subprocess.DEVNULL if quiet else None,
    )
    if result.returncode != 0:
        raise RuntimeError(f"{args[0]} failed with exit code {result.returncode}")


def interrupted(_signum, _frame):
    raise KeyboardInterrupt("Administrative tests interrupted.")


def main():
    signal.signal(signal.SIGTERM, interrupted)
    env = os.environ.copy()
    for key in VARIABLES:
        env.pop(key, None)

    # Test-only values; inherited application credentials are not used.
    env.update({
        "BETTER_AUTH_URL": "http://localhost:3000",
        "NEXT_PUBLIC_BETTER_AUTH_URL": "http://localhost:3000",
        "BETTER_AUTH_SECRET": secrets.token_hex(32),
        "APP_ALLOWED_ORIGINS": "http://localhost:3000",
        "PLATFORM_ADMIN_PORTAL_ENABLED": "false",
    })
    env.pop("DATABASE_URL", None)
    env.pop("DIRECT_DATABASE_URL", None)

    print("Running administrative policy and action tests.", flush=True)
    run([
        "pnpm", "exec", "vitest", "run",
        TESTS + "access-policy.test.ts",
        TESTS + "platform-permissions.test.ts",
        TESTS + "better-auth-totp.test.ts",
        TESTS + "staff-actions.test.ts",
        "src/lib/auth-return-path.test.ts",
    ], env=env)

    name = "oqood-admin-suite-" + secrets.token_hex(6)
    password = secrets.token_hex(24)
    created = False

    try:
        run([
            "docker", "run", "--detach", "--rm",
            "--name", name,
            "--publish", "127.0.0.1::5432",
            "--env", "POSTGRES_USER=oqood",
            "--env", f"POSTGRES_PASSWORD={password}",
            "--env", "POSTGRES_DB=oqood_admin_test",
            "postgres:17-alpine",
        ], quiet=True)
        created = True

        for _ in range(45):
            ready = subprocess.run(
                ["docker", "exec", name, "pg_isready",
                 "-U", "oqood", "-d", "oqood_admin_test"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            if ready.returncode == 0:
                break
            time.sleep(1)
        else:
            raise RuntimeError("Temporary PostgreSQL did not become ready.")

        binding = subprocess.check_output(
            ["docker", "port", name, "5432/tcp"], text=True,
        ).strip()
        if not binding.startswith("127.0.0.1:"):
            raise RuntimeError("Unexpected database binding.")
        port = int(binding.rsplit(":", 1)[1])

        for index, (database, variable, files) in enumerate(GROUPS):
            if index:
                # Database names are fixed constants, never user input.
                run([
                    "docker", "exec", name,
                    "psql", "-U", "oqood", "-d", "oqood_admin_test",
                    "-v", "ON_ERROR_STOP=1",
                    "-c", f'CREATE DATABASE "{database}"',
                ], quiet=True)

            url = (
                f"postgresql://oqood:{password}@127.0.0.1:"
                f"{port}/{database}"
            )
            group_env = env.copy()
            group_env.update({
                "DATABASE_URL": url,
                "DIRECT_DATABASE_URL": url,
                variable: url,
            })

            print(f"Running isolated group: {database}", flush=True)
            run(
                ["pnpm", "exec", "prisma", "migrate", "deploy"],
                env=group_env,
            )
            run(
                ["pnpm", "exec", "vitest", "run"] +
                [TESTS + filename for filename in files],
                env=group_env,
            )

        print("All administrative security test groups passed.", flush=True)
    finally:
        if created:
            result = subprocess.run(
                ["docker", "rm", "--force", name],
                stdout=subprocess.DEVNULL,
            )
            if result.returncode != 0:
                raise RuntimeError("Could not remove the temporary test container.")
            print("Temporary administrative databases removed.", flush=True)


if __name__ == "__main__":
    main()
