import test from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdir } from "node:fs/promises";
import { chromium } from "playwright";

// Browser end-to-end test against the user's already-public portfolio portrait.
// Fixture downloaded at CI runtime, never committed or uploaded as an artifact.
test("MediaPipe analyzes a real portrait and both panels share source output", { timeout: 180_000 }, async () => {
  await mkdir("test-results", { recursive: true });
  const browser = await chromium.launch({ headless: true, args: ["--disable-dev-shm-usage"] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
    page.setDefaultTimeout(120_000);
    const browserErrors = [];
    page.on("pageerror", error => browserErrors.push(error.message));
    await page.goto(process.env.PHOTO3D_BASE_URL || "http://127.0.0.1:4173/", { waitUntil: "domcontentloaded" });
    assert.match(await page.title(), /Photo3D Lab/);
    const buffer = await readFile("/tmp/photo3d-reference.jpg");
    const sample = page.locator("#sample");
    // Remote PR tests may run against the currently deployed earlier revision.
    if (await sample.count()) {
      await sample.click();
      await page.waitForFunction(() => /Portrait loaded/.test(document.querySelector("#status")?.textContent || ""));
      assert.equal(await page.locator("#portrait-empty").isVisible(), false);
    } else {
      assert.ok(process.env.PHOTO3D_BASE_URL, "Sample button must be present in local dev branch");
    }
    // Also verify the local upload route independent of the sample-fetch route.
    await page.locator("#upload").setInputFiles({ name: "profile.jpg", mimeType: "image/jpeg", buffer });
    await page.getByRole("button", { name: "Analyze face" }).click();
    await page.waitForFunction(() => /Detected [0-9]+ real landmarks/.test(document.querySelector("#status")?.textContent || ""));
    assert.equal(await page.locator("#provenance").textContent(), "MEDIAPIPE · REAL OUTPUT");
    assert.equal(await page.locator("#portrait-empty").isVisible(), false);
    assert.equal(await page.locator("#cloud-empty").isVisible(), false);
    await page.locator("#yaw").evaluate(el => { el.value = "45"; el.dispatchEvent(new Event("input", { bubbles: true })); });
    await page.screenshot({ path: "test-results/desktop.png", fullPage: true });

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export landmarks JSON" }).click();
    const download = await downloadPromise;
    const exportPath = await download.path();
    const output = JSON.parse(await readFile(exportPath, "utf8"));
    assert.equal(output.schema, "photo3d.landmarks.v1");
    assert.ok(output.landmarks.length >= 468, "Expected model-produced facial landmarks");
    assert.ok(output.landmarks.every(p => Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z)));
    assert.equal(output.provenance.inference, "on-device");
    if(!process.env.PHOTO3D_BASE_URL){
      assert.equal(output.topology.source,"mediapipe-face-landmarker@0.10.35");
      assert.ok(output.topology.tessellation.length > 1000,"Official MediaPipe mesh edges must be included");
      assert.ok(output.topology.contours.length > 0,"Official contour edges must be included");
      await page.locator("#inspectorMode").selectOption("contours");
      await page.locator("#zoom").evaluate(el=>{el.value="1.7";el.dispatchEvent(new Event("input",{bubbles:true}));});
      await page.locator("#portraitMesh").check();
      assert.match(await page.locator("#meshStats").textContent(),/official edges/);
      assert.equal(await page.locator("#zoomValue").textContent(),"1.7×");
      await page.locator("#resetView").click();
      assert.equal(await page.locator("#zoomValue").textContent(),"1.0×");
      // Newly added workspace must remain separate from the working portrait analyzer.
      await page.getByRole("tab", { name: "Experiment Lab" }).click();
      assert.equal(await page.locator("#experiment-lab").isVisible(), true);
      assert.equal(await page.locator("#portrait-lab").isVisible(), false);
      await page.locator("#lab-case").selectOption("mobile-orbit");
      await page.locator("#lab-result").selectOption("blocked");
      await page.locator("#lab-notes").fill("Automated UI test only; no physical-phone claim.");
      await page.locator("#lab-save").click();
      assert.match(await page.locator("#lab-feedback").textContent(), /Saved locally/);
      await page.reload();
      await page.getByRole("tab", { name: "Experiment Lab" }).click();
      assert.match(await page.locator("#lab-history").textContent(), /Automated UI test only/);
      await page.getByRole("tab", { name: "Roadmap" }).click();
      assert.equal(await page.locator(".milestone-card").count(), 7);
      await page.getByRole("tab", { name: "Portrait Lab" }).click();
      assert.equal(await page.locator("#portrait-lab").isVisible(), true);
    }

    assert.deepEqual(browserErrors, []);
    
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), "No horizontal overflow on phone width");
    await page.screenshot({ path: "test-results/mobile-viewport.png", fullPage: true });
  } finally { await browser.close(); }
});
