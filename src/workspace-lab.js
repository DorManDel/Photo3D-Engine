import { milestones, testSuites } from "./workspace-data.js";

const STORAGE_KEY = "photo3d.manual-tests.v1";
const OUTCOMES = new Set(["pass", "fail", "blocked", "not-run"]);

export function makeTestRecord(suiteId, caseId, outcome, notes = "", now = new Date()) {
  if (!testSuites.some(s => s.id === suiteId && s.cases.some(c => c.id === caseId))) throw new Error("Unknown test scenario.");
  if (!OUTCOMES.has(outcome)) throw new Error("Invalid test outcome.");
  return {schema:"photo3d.manual-test.v1",suiteId,caseId,outcome,notes:String(notes).slice(0,2000),recordedAt:now.toISOString()};
}

function readRecords(storage) {
  try {
    const records = JSON.parse(storage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(records) ? records.filter(r => r?.schema === "photo3d.manual-test.v1" && OUTCOMES.has(r.outcome)).slice(-100) : [];
  } catch { return []; }
}
function node(tag, className, value) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (value !== undefined) element.textContent = value;
  return element;
}
function downloadJournal(records) {
  const blob = new Blob([JSON.stringify({schema:"photo3d.manual-journal.v1",exportedAt:new Date().toISOString(),records},null,2)],{type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href=url; a.download="photo3d-test-journal.json";a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function initWorkspaceLab(doc = document, storage = window.localStorage) {
  const roadmap = doc.getElementById("milestone-list");
  const tabs = doc.getElementById("lab-suite-tabs");
  if (!roadmap || !tabs) return;
  milestones.forEach(m => {
    const article = node("article","milestone-card");
    const heading = node("div","milestone-heading");
    heading.append(node("span","milestone-id",m.id),node("h3","",m.title),node("span","module-state "+m.state,m.state === "shipped" ? "SHIPPED · BROWSER VERIFIED" : m.state.toUpperCase()));
    article.append(heading,node("p","",m.summary));
    const ul = node("ul","criteria");
    m.acceptance.forEach(c => ul.append(node("li","",c)));
    article.append(node("h4","","Acceptance criteria"),ul,node("p","milestone-limits",m.limitations));
    roadmap.append(article);
  });
  const casePicker = doc.getElementById("lab-case");
  const details = doc.getElementById("lab-case-details");
  const form = doc.getElementById("lab-form");
  const result = doc.getElementById("lab-result");
  const notes = doc.getElementById("lab-notes");
  const feedback = doc.getElementById("lab-feedback");
  const history = doc.getElementById("lab-history");
  let active = testSuites[0];
  let records = readRecords(storage);
  const refreshHistory = () => {
    history.replaceChildren(node("h4","",`Local results (${records.length})`));
    for (const r of records.slice(-5).reverse()) {
      const test = testSuites.flatMap(s=>s.cases).find(c => c.id === r.caseId);
      const item = node("div","journal-entry");
      item.append(node("strong","",`${test?.title || r.caseId}: ${r.outcome}`),node("small","",r.recordedAt));
      if (r.notes) item.append(node("p","",r.notes));
      history.append(item);
    }
  };
  const renderCase = () => {
    const chosen = active.cases.find(c=>c.id===casePicker.value) || active.cases[0];
    details.replaceChildren(node("h4","",chosen.title),node("p","",chosen.details),node("p","criteria-note","Acceptance: "+chosen.criteria),node("span","module-state "+(chosen.readiness==="available"?"shipped":"planned"),chosen.readiness==="available"?"TESTABLE NOW":"FUTURE MILESTONE"));
  };
  const selectSuite = (id) => {
    active = testSuites.find(s=>s.id===id)||testSuites[0];
    for (const tab of tabs.querySelectorAll("button")) {
      const selected=tab.dataset.suite===active.id;
      tab.setAttribute("aria-selected",String(selected));tab.tabIndex=selected?0:-1;
    }
    casePicker.replaceChildren();
    active.cases.forEach(c => {const option=node("option","",c.title);option.value=c.id;casePicker.append(option);});
    renderCase();
  };
  testSuites.forEach((s,index) => {
    const button = node("button","lab-suite-tab",s.title);
    button.type="button";button.dataset.suite=s.id;button.setAttribute("role","tab");
    button.setAttribute("aria-selected",String(index===0));button.tabIndex=index===0?0:-1;
    button.addEventListener("click",()=>selectSuite(s.id));
    button.addEventListener("keydown",event=>{
      const dir=event.key==="ArrowRight"?1:event.key==="ArrowLeft"?-1:0;
      if(!dir&&!["Home","End"].includes(event.key))return;
      event.preventDefault();
      const i=event.key==="Home"?0:event.key==="End"?testSuites.length-1:(index+dir+testSuites.length)%testSuites.length;
      const next=tabs.querySelectorAll("button")[i]; next.focus();selectSuite(testSuites[i].id);
    });
    tabs.append(button);
  });
  casePicker.addEventListener("change",renderCase);
  form.addEventListener("submit",event=>{
    event.preventDefault();
    try{
      const record=makeTestRecord(active.id,casePicker.value,result.value,notes.value);
      const next=[...records,record].slice(-100);
      storage.setItem(STORAGE_KEY,JSON.stringify(next));
      records=next;notes.value="";feedback.textContent="Saved locally. Export JSON to keep a project checkpoint.";refreshHistory();
    }catch(error){feedback.textContent="Could not save: "+error.message;}
  });
  doc.getElementById("lab-export").addEventListener("click",()=>{
    downloadJournal(records);
    feedback.textContent=records.length ? "Test journal exported." : "Exported an empty journal (no manual results yet).";
  });
  selectSuite(active.id);refreshHistory();
}
