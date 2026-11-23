const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

// Compile the real source with the project's existing TypeScript dependency.
require.extensions[".ts"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8").replace(
    /from "@\/([^\"]+)"/g,
    (_, target) => `from ${JSON.stringify(path.resolve(__dirname, "../src", `${target}.ts`))}`
  );
  module._compile(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, filename);
};

const { SEED_WORKSPACE } = require("../src/data/seed.ts");
const { loadWorkspace, getTimeAwareGreeting } = require("../src/lib/storage.ts");
const { middleware } = require("../src/middleware.ts");
const { NextRequest } = require("next/server");

test("upgrades the previous workspace without discarding user data", () => {
  const saved = structuredClone(SEED_WORKSPACE);
  delete saved.preferences.welcomePreference;
  saved.tasks[0].title = "My saved work";
  global.window = { localStorage: { getItem: () => JSON.stringify(saved) } };
  const loaded = loadWorkspace();
  assert.equal(loaded.recoveredFromCorrupt, false);
  assert.equal(loaded.state.tasks[0].title, "My saved work");
  assert.equal(loaded.state.preferences.welcomePreference, "once");
  delete global.window;
});

test("malformed preferences recover without crashing", () => {
  global.window = { localStorage: { getItem: () => JSON.stringify({ ...SEED_WORKSPACE, preferences: null }) } };
  assert.equal(loadWorkspace().recoveredFromCorrupt, true);
  delete global.window;
});

test("the night greeting starts at 21:00 in the configured timezone", () => {
  for (const [time, period] of [["04:59", "night"], ["05:00", "morning"], ["12:00", "afternoon"], ["17:00", "evening"], ["20:59", "evening"], ["21:00", "night"]]) {
    assert.equal(getTimeAwareGreeting("", "UTC", new Date(`2026-11-23T${time}:00Z`)).period, period);
  }
  assert.equal(getTimeAwareGreeting("", "Asia/Kolkata", new Date("2026-11-23T15:30:00Z")).greeting, "Welcome back, sir.");
});

test("private APIs cannot bypass authentication with extensions or asset prefixes", async () => {
  for (const route of ["/api/private.json", "/api/auth/session/private", "/api/auth/login/private", "/icons-private", "/manifest-private", "/projects/export.json"]) {
    const response = await middleware(new NextRequest(`https://orbit.test${route}`));
    assert.equal(response.status, route.startsWith("/api/") ? 401 : 307, route);
    assert.match(response.headers.get("Cache-Control"), /no-store/);
  }
});

test("only explicit branding assets are public", async () => {
  for (const route of ["/login", "/api/auth/session", "/icons/icon-192.png", "/manifest.webmanifest", "/sw.js"]) {
    assert.equal((await middleware(new NextRequest(`https://orbit.test${route}`))).status, 200);
  }
});

test("cross-origin state changes are rejected", async () => {
  for (const route of ["/api/auth/login", "/api/auth/logout"]) {
    const response = await middleware(new NextRequest(`https://orbit.test${route}`, {
      method: "POST", headers: { origin: "https://untrusted.test" },
    }));
    assert.equal(response.status, 403);
  }
});

test("sessions require the expected algorithm and an expiry", async () => {
  const { SignJWT } = await import("jose");
  process.env.ORBIT_SESSION_SECRET = "test-only-session-secret-with-at-least-32-characters";
  const secret = new TextEncoder().encode(process.env.ORBIT_SESSION_SECRET);
  for (const [algorithm, expiry, valid] of [["HS256", "1h", true], ["HS256", null, false], ["HS384", "1h", false], ["HS256", "-1h", false]]) {
    let jwt = new SignJWT({ authenticated: true }).setProtectedHeader({ alg: algorithm });
    if (expiry) jwt = jwt.setExpirationTime(expiry);
    const token = await jwt.sign(secret);
    const response = await middleware(new NextRequest("https://orbit.test/projects", { headers: { cookie: `orbit_session=${token}` } }));
    assert.equal(response.status, valid ? 200 : 307, `${algorithm} ${expiry}`);
  }
});

test("the worker never intercepts private RSC, API, or arbitrary file responses", () => {
  const handlers = {};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../public/sw.js"), "utf8"), {
    URL,
    self: { location: { origin: "https://orbit.test" }, addEventListener: (name, handler) => { handlers[name] = handler; } },
  });
  for (const pathname of ["/projects?_rsc=private", "/settings", "/api/private.json", "/export.json"]) {
    handlers.fetch({
      request: { url: `https://orbit.test${pathname}`, method: "GET", mode: "cors" },
      respondWith: () => assert.fail(`Worker intercepted ${pathname}`),
    });
  }
});
