import test from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdir } from "node:fs/promises";
import { chromium } from "playwright";

// Browser end-to-end test against the user's already-public portfolio portrait.
// Fixture downloaded at CI runtime, never committed or uploaded as an artifact.
test("MediaPipe analyzes a real portrait and both panels share source output", { timeout: 180_000 }, async () => {
  await mkdir("test-results", { recursive: true });
  const browser = await chromium.launch({ headless: true, args: ["--disable-dev-shm-usage", "--enable-webgl", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
    page.setDefaultTimeout(120_000);
    const browserErrors = [], failedRequests = [];
    page.on("pageerror", error => browserErrors.push(error.message));
    page.on("console", message => {if(message.type()==="error" && !/^INFO: Created TensorFlow Lite XNNPACK delegate/.test(message.text())) browserErrors.push("console: "+message.text());});
    page.on("requestfailed", request => failedRequests.push(request.url()+" :: "+(request.failure()?.errorText||"failed")));
    page.on("response", response => {if(response.status()>=400)failedRequests.push(response.status()+" "+response.url());});
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
      assert.match(await page.locator("#meshStats").textContent(),/official (edges|triangles)/);
      assert.equal(await page.locator("#zoomValue").textContent(),"1.7×");
      await page.locator("#resetView").click();
      assert.equal(await page.locator("#zoomValue").textContent(),"1.0×");
    }

    // The deployed-site PR check may still point to an earlier published revision.
    // Local PR tests always require the v0.4 feature. Once merged, hosted checks do too.
    if (!process.env.PHOTO3D_BASE_URL || await page.locator("#exportPng").count()) {
      const dataTopology=output.topology;
      assert.ok(dataTopology.triangles.length > 700,"Official ordered edge triplets must produce real faces");
      await page.locator("#inspectorMode").selectOption("texture");
      try{
        await page.waitForFunction(() => {
          const stats=document.querySelector("#meshStats")?.textContent || "";
          const button=document.querySelector("#exportPng");
          const message=document.querySelector("#status")?.textContent || "";
          return /Textured mode unavailable/.test(message) ||
            (!!document.querySelector("#mesh3d canvas") && /textured triangles/.test(stats) && button && !button.disabled);
        },null,{timeout:18000});
      }catch(error){
        const state=await page.evaluate(()=>({
          mode:document.querySelector("#inspectorMode")?.value,
          status:document.querySelector("#status")?.textContent,
          stats:document.querySelector("#meshStats")?.textContent,
          canvasCount:document.querySelectorAll("#mesh3d canvas").length,
          runtime:window.photo3dStatus?.(),
          urls:performance.getEntriesByType("resource").filter(e=>e.name.includes("three")).map(e=>e.name)
        }));
        console.log("TEXTURE_INIT_DIAGNOSTIC",JSON.stringify({state,failedRequests,browserErrors}));
        throw error;
      }
      const textureStatus=await page.locator("#status").textContent();
      assert.doesNotMatch(textureStatus,/Textured mode unavailable/,textureStatus);
      assert.equal(await page.locator("#exportPng").isEnabled(),true,
        "Textured mesh not active; status="+textureStatus+" stats="+await page.locator("#meshStats").textContent());
      assert.equal(await page.locator("#cloud").isVisible(),false);
      assert.equal(await page.locator("#referenceCompare").isVisible(),true);
      const triangles=Number((await page.locator("#meshStats").textContent()).match(/([0-9]+) textured triangles/)?.[1]);
      assert.ok(triangles > 700,"No fake geometry fallback");
      // Actual GPU canvas must hold real rendered pixels, not just an empty canvas.
      const pixels=await page.locator("#mesh3d canvas").evaluate(canvas=>{
        const copy=document.createElement("canvas");copy.width=canvas.width;copy.height=canvas.height;
        const ctx=copy.getContext("2d");
        ctx.drawImage(canvas,0,0);
        const data=ctx.getImageData(0,0,copy.width,copy.height).data;
        let lit=0;
        for(let i=3;i<data.length;i+=4)if(data[i]>0)lit++;
        return {lit,total:data.length/4};
      });
      assert.ok(pixels.lit > pixels.total*.01,"Textured mesh should occupy >1% of the GPU canvas");
      if(!process.env.PHOTO3D_BASE_URL) {
        assert.ok(output.topology.regions.leftEye.length>0,"Real left eye edges");
        assert.ok(output.topology.regions.rightEye.length>0,"Real right eye edges");
        assert.ok(output.topology.regions.lips.length>0,"Real mouth edges");
        await page.locator("#featureRegions").check();
        assert.match(await page.locator("#surfaceAudit").textContent(),/[0-9]+ open edges/);
        const initial=await page.evaluate(()=>window.photo3dStatus().render);
        assert.ok(initial.report.boundaryEdges>0,"Real open mesh boundaries");
        assert.equal(initial.report.nonManifoldEdges,0);
      }
      await page.locator("#inspectorMode").selectOption("texture-wireframe");
      if(!process.env.PHOTO3D_BASE_URL){
        await page.locator("#wireStyle").selectOption("xray");
        assert.equal(await page.evaluate(()=>window.photo3dStatus().render.wireDepthTest),false);
        await page.locator("#wireStyle").selectOption("borders");
        assert.equal(await page.evaluate(()=>window.photo3dStatus().render.bordersVisible),true);
        await page.locator("#wireStyle").selectOption("surface");
        assert.equal(await page.evaluate(()=>window.photo3dStatus().render.wireDepthTest),true);
        await page.getByRole("button",{name:"Compare 0°"}).click();
        assert.equal(await page.locator("#depthValue").textContent(),"0.0×");
        assert.equal(await page.locator("#yawValue").textContent(),"0°");
        assert.equal(await page.locator("#referenceCompare").evaluate(el=>el.classList.contains("is-expanded")),true);
        await page.locator("#inspectorMode").selectOption("texture-wireframe");
      }
      await page.locator("#depth").evaluate(el=>{el.value="0";el.dispatchEvent(new Event("input",{bubbles:true}));});
      assert.equal(await page.locator("#depthValue").textContent(),"0.0×");
      await page.locator("#yaw").evaluate(el=>{el.value="30";el.dispatchEvent(new Event("input",{bubbles:true}));});
      await page.locator("#mesh3d canvas").screenshot({path:"test-results/textured-face.png"});
      await page.locator("#resetView").click();
      assert.equal(await page.locator("#depthValue").textContent(),"1.0×");
      const pngPromise=page.waitForEvent("download");
      await page.getByRole("button",{name:"Save mesh PNG"}).click();
      const png=await pngPromise;
      const saved=await readFile(await png.path());
      assert.ok(saved.byteLength>3000,"PNG should contain a nonempty textured preview");
      assert.ok(saved.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),"PNG signature");
      await page.locator("#inspectorMode").selectOption("wireframe");
      assert.equal(await page.locator("#mesh3d").isVisible(),false);
      await page.locator("#inspectorMode").selectOption("texture");
      assert.equal(await page.locator("#exportPng").isEnabled(),true);
    }

    assert.deepEqual(browserErrors, []);
    
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), "No horizontal overflow on phone width");
    await page.screenshot({ path: "test-results/mobile-viewport.png", fullPage: true });
  } finally { await browser.close(); }
});
