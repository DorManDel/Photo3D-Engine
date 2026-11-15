import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { milestones, testSuites } from "../src/workspace-data.js";
import { makeTestRecord } from "../src/workspace-lab.js";

test("all workspace sections and accessible tab hooks exist", async () => {
  const html = await readFile(new URL("../index.html",import.meta.url),"utf8");
  for(const page of ["portrait-lab","avatar-studio","experiment-lab","roadmap"]){
    assert.match(html,new RegExp('id="tab-'+page+'"'));
    assert.match(html,new RegExp('id="'+page+'"'));
    assert.match(html,new RegExp('aria-controls="'+page+'"'));
  }
  for(const id of ["lab-suite-tabs","lab-case","lab-result","lab-save","lab-export","milestone-list"]){
    assert.match(html,new RegExp('id="'+id+'"'));
  }
  assert.match(html,/role="tablist"/);
  assert.match(html,/role="tabpanel"/);
  assert.match(html,/id="portrait"/);
  assert.match(html,/id="cloud"/);
});
test("milestone definitions are complete, ordered and honest", () => {
  assert.deepEqual(milestones.map(m=>m.id),["M0","M1","M2","M3","M4","M5","M6"]);
  assert.equal(milestones[0].state,"shipped");
  assert.ok(milestones.slice(1).every(m=>["next","planned"].includes(m.state)));
  assert.ok(milestones.every(m=>m.acceptance.length > 0));
});
test("test categories and IDs remain unique", () => {
  assert.deepEqual(testSuites.map(s=>s.id),["tracking","reconstruction","animation","export"]);
  const ids=testSuites.flatMap(s=>s.cases.map(c=>c.id));
  assert.equal(new Set(ids).size,ids.length);
  assert.ok(testSuites.every(s=>s.cases.length));
});
test("manual journal records do not claim measured metrics", () => {
  const date = new Date("2026-11-15T12:00:00.000Z");
  const item=makeTestRecord("tracking","mobile-orbit","blocked","Device not available",date);
  assert.deepEqual(item,{schema:"photo3d.manual-test.v1",suiteId:"tracking",caseId:"mobile-orbit",outcome:"blocked",notes:"Device not available",recordedAt:date.toISOString()});
  assert.throws(()=>makeTestRecord("tracking","made-up-test","pass"),/Unknown/);
  assert.throws(()=>makeTestRecord("tracking","mobile-orbit","perfect"),/Invalid/);
  assert.equal(makeTestRecord("tracking","mobile-orbit","pass","a".repeat(3000)).notes.length,2000);
});
