import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import bcrypt from "bcrypt";
import { chromium } from "playwright-core";

// A separate local production server; never reads or prints personal credentials.
const port = process.env.ORBIT_TEST_PORT ?? "3120";
const origin = `http://localhost:${port}`;
const password = randomBytes(24).toString("hex");
const artifacts = path.join(os.tmpdir(), "orbit-auth-qa");
mkdirSync(artifacts, { recursive: true });

function browserExecutable() {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  if (existsSync(chromium.executablePath())) return chromium.executablePath();
  const cache = path.join(os.homedir(), "Library/Caches/ms-playwright");
  if (existsSync(cache)) {
    for (const name of readdirSync(cache).filter((name) => /^chromium-\d+$/.test(name)).sort().reverse()) {
      const executable = path.join(cache, name, "chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing");
      if (existsSync(executable)) return executable;
    }
  }
  throw new Error("Set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH to an installed Chromium executable.");
}

const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "localhost", "--port", port], {
  env: { ...process.env, NODE_ENV: "production", ORBIT_PASSWORD_HASH: Buffer.from(await bcrypt.hash(password, 12)).toString("base64"), ORBIT_SESSION_SECRET: randomBytes(32).toString("base64") },
  stdio: ["ignore", "pipe", "pipe"],
});
let output = "";
server.stdout.on("data", (data) => { output += data; });
server.stderr.on("data", (data) => { output += data; });
let browser;
let activePage;
try {
  for (let attempt = 0; ; attempt++) {
    if (server.exitCode !== null) throw new Error(`Test server exited: ${output}`);
    if (output.includes("Ready in")) break;
    if (attempt > 100) throw new Error(`Test server did not start: ${output}`);
    await delay(200);
  }
  for (const route of ["/", "/projects", "/inbox", "/ideas", "/library", "/opportunities", "/cv-studio", "/settings"]) {
    const response = await fetch(`${origin}${route}`, { redirect: "manual" });
    assert.equal(response.status, 307, route);
    assert.match(response.headers.get("cache-control"), /no-store/);
    assert.equal(new URL(response.headers.get("location"), origin).pathname, "/login");
  }
  const csrf = await fetch(`${origin}/api/auth/login`, {
    method: "POST", headers: { origin: "https://untrusted.test", "content-type": "application/json" }, body: JSON.stringify({ password }),
  });
  assert.equal(csrf.status, 403);
  const invalidBody = await fetch(`${origin}/api/auth/login`, { method: "POST", body: "{}" });
  assert.equal(invalidBody.status, 415);
  const secure = await fetch(`${origin}/api/auth/login`, {
    method: "POST", headers: { "content-type": "application/json", "x-forwarded-proto": "https" }, body: JSON.stringify({ password }),
  });
  assert.equal(secure.status, 200, `HTTPS login failed: ${output}`);
  assert.match(secure.headers.get("set-cookie"), /; Secure/i);
  assert.match(secure.headers.get("set-cookie"), /; HttpOnly/i);
  assert.match(secure.headers.get("set-cookie"), /SameSite=lax/i);
  console.log("PASS: private routes, cross-origin rejection, JSON validation, HTTPS cookie flags");

  browser = await chromium.launch({ executablePath: browserExecutable(), headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  context.setDefaultTimeout(10000);
  const page = await context.newPage();
  activePage = page;
  if (process.env.ORBIT_PROFILE) {
    const cdp = await context.newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await context.addInitScript(() => {
      const metrics = { start: 0, end: 0, frames: [], tasks: [], contexts: [] };
      window.orbitMotionMetrics = metrics;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) metrics.tasks.push({ start: entry.startTime, duration: entry.duration });
      }).observe({ type: "longtask", buffered: true });
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
        const start = performance.now();
        const result = getContext.call(this, kind, ...args);
        if (kind.startsWith("webgl")) metrics.contexts.push({ start, duration: performance.now() - start, available: !!result });
        return result;
      };
      let previous = 0;
      const frame = (now) => {
        const visible = !!document.querySelector('[aria-label="Welcome to Orbit workspace"]');
        if (visible && !metrics.start) metrics.start = now;
        if (metrics.start && !metrics.end) {
          if (previous) metrics.frames.push(now - previous);
          previous = now;
          if (!visible) metrics.end = now;
        }
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
  }
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${origin}/projects`);
  assert.equal(new URL(page.url()).pathname, "/login");
  await page.getByLabel("Password", { exact: true }).fill("incorrect-test-password");
  await page.getByRole("button", { name: "Enter Workspace" }).click();
  await page.getByText("Incorrect password.", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Show password" }).click();
  assert.equal(await page.getByLabel("Password", { exact: true }).getAttribute("type"), "text");
  await page.getByRole("button", { name: "Hide password" }).click();
  await page.waitForFunction(() => getComputedStyle(document.querySelector("form")).opacity === "1");
  await page.screenshot({ path: path.join(artifacts, "login-desktop.png") });

  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Password", { exact: true }).press("Enter");
  await page.waitForURL(`${origin}/projects`);
  const welcome = page.getByRole("dialog", { name: "Welcome to Orbit workspace" });
  await welcome.waitFor();
  if (!process.env.ORBIT_PROFILE) await page.getByRole("button", { name: "Skip / Continue" }).click();
  await welcome.waitFor({ state: "detached" });
  if (process.env.ORBIT_PROFILE) {
    const metrics = await page.evaluate(() => window.orbitMotionMetrics);
    const tasks = metrics.tasks.filter((task) => task.start >= metrics.start && task.start <= metrics.end);
    const summary = { duration: metrics.end - metrics.start, frames: metrics.frames.length, maxFrameGap: Math.max(...metrics.frames), gapsOver50ms: metrics.frames.filter((gap) => gap > 50).length, longTasks: tasks, contexts: metrics.contexts };
    writeFileSync(path.join(artifacts, `motion-${process.env.ORBIT_PROFILE}.json`), JSON.stringify(summary, null, 2));
    console.log("MOTION PROFILE", JSON.stringify(summary));
    if (process.env.ORBIT_PROFILE !== "before") {
      assert.equal(metrics.contexts.filter((entry) => entry.start >= metrics.start && entry.start <= metrics.end).length, 0, "The short welcome must not initialize WebGL during its animation");
    }
  }
  await page.reload();
  await page.locator("main").waitFor();
  assert.equal(await welcome.count(), 0);
  await page.goto(`${origin}/settings`);
  await page.getByRole("button", { name: "Replay Welcome" }).click();
  await welcome.waitFor();
  await page.keyboard.press("Tab");
  assert.equal(await page.getByRole("button", { name: "Skip / Continue" }).evaluate((el) => el === document.activeElement), true);
  await page.keyboard.press("Escape");
  await welcome.waitFor({ state: "detached" });
  await page.goto(`${origin}/settings`);

  // An unsuccessful logout must leave a visible error and the workspace usable.
  await page.getByRole("button", { name: "Log Out", exact: true }).click({ trial: true });
  await context.setOffline(true);
  await page.getByRole("button", { name: "Log Out", exact: true }).click();
  await page.getByText("Could not sign out. Check your connection and try again.").waitFor();
  assert.equal(new URL(page.url()).pathname, "/settings");
  await context.setOffline(false);
  await page.getByRole("button", { name: "Never", exact: true }).click();
  await page.getByRole("button", { name: "Log Out", exact: true }).click();
  await page.waitForURL(`${origin}/login`);
  assert.deepEqual(await (await context.request.get(`${origin}/api/auth/session`)).json(), { authenticated: false });
  console.log("PASS: password feedback, show/hide, Enter login, redirect, welcome, replay, focus, logout errors and cookie removal");

  // A backslash redirect used to become an external navigation in the browser.
  await page.goto(`${origin}/login?redirect=${encodeURIComponent("/\\untrusted.test")}`);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Enter Workspace" }).click();
  await page.waitForURL(`${origin}/`);
  await page.locator("main h1").waitFor();
  assert.equal(await welcome.count(), 0);
  await page.waitForFunction(() => [...document.querySelectorAll(".orbit-page-section, .orbit-page-title-inner, .shell-coord-group")].every((el) => Number(getComputedStyle(el).opacity) >= 0.99));
  await page.screenshot({ path: path.join(artifacts, "dashboard-desktop.png") });
  await page.evaluate(() => navigator.serviceWorker.ready);
  const cachePaths = await page.evaluate(async () => {
    const keys = await caches.keys();
    const requests = await Promise.all(keys.map(async (key) => (await caches.open(key)).keys()));
    return requests.flat().map((request) => new URL(request.url).pathname);
  });
  assert.ok(cachePaths.every((pathname) => pathname.startsWith("/icons/") || pathname === "/manifest.webmanifest"));
  console.log("PASS: Never preference, malicious redirect fallback, service-worker asset-only cache");

  for (const width of [320, 768, 1024]) {
    await page.setViewportSize({ width, height: 850 });
    await page.goto(`${origin}/login`);
    await page.getByLabel("Password", { exact: true }).waitFor();
    await page.waitForFunction(() => getComputedStyle(document.querySelector("form")).opacity === "1");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({ path: path.join(artifacts, `login-${width}.png`) });
  }
  const reduced = await browser.newContext({ reducedMotion: "reduce" });
  const reducedPage = await reduced.newPage();
  await reducedPage.goto(`${origin}/login`);
  assert.equal(await reducedPage.locator(".orbit-access-mark").evaluate((el) => getComputedStyle(el).animationName), "none");
  await reduced.close();

  const attempts = await Promise.all(Array.from({ length: 10 }, () => fetch(`${origin}/api/auth/login`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password: "incorrect-test-password" }),
  })));
  assert.equal(attempts.filter((response) => response.status === 401).length, 5);
  assert.equal(attempts.filter((response) => response.status === 429).length, 5);
  assert.ok(Number(attempts.find((response) => response.status === 429).headers.get("retry-after")) > 0);
  assert.deepEqual(errors, []);
  console.log(`PASS: responsive login, reduced motion, concurrent throttling, no page errors. Screenshots: ${artifacts}`);
  await context.close();
} catch (error) {
  if (activePage) {
    console.error("Observed page:", activePage.url(), await activePage.locator("body").ariaSnapshot());
    await activePage.screenshot({ path: path.join(artifacts, "failure.png") });
  }
  throw error;
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
