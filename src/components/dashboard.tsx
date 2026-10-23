"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowRight, BookOpen, Bug, Check, CheckCircle2,
  ChevronDown, CircleDot, Clock3, Coins, Compass, ExternalLink, GitCommitHorizontal,
  Github, Heart, Layers3, LayoutDashboard, LoaderCircle, Menu, RefreshCcw, ScrollText,
  ShieldCheck, Sparkles, Swords, TerminalSquare, TestTube2, Trophy, X, Zap,
} from "lucide-react";
import type { ChronicleEventData, DashboardData, QuestData, QuestKind } from "@/types/dashboard";
import { demoDashboard } from "@/lib/game/demo";
import { repositoryInputSchema } from "@/lib/github/validation";
import { WorldMap } from "./world-map";

const questNames: Record<QuestKind, string> = { monster: "Monsterjagd", build: "Bauauftrag", research: "Forschungsquest", tutorial: "Tutorial-Quest", explore: "Erkundung" };
const eventLabels = { all: "Alle", issue: "Quests", victory: "Siege", ci: "CI", deployment: "Deploys", commit: "Commits" } as const;
type EventFilter = keyof typeof eventLabels;

function dateLabel(value: string): string {
  return new Date(value).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
}
function ageInDays(value: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86400000));
}
function QuestIcon({ kind, size = 18 }: { kind: QuestKind; size?: number }) {
  return kind === "monster" ? <Bug size={size}/> : kind === "build" ? <Layers3 size={size}/> : kind === "research" ? <BookOpen size={size}/> : kind === "tutorial" ? <Sparkles size={size}/> : <Compass size={size}/>;
}
function EventIcon({ kind }: { kind: ChronicleEventData["kind"] }) {
  return kind === "victory" ? <Trophy size={16}/> : kind === "issue" ? <Bug size={16}/> : kind === "ci" ? <TestTube2 size={16}/> : kind === "deployment" ? <Zap size={16}/> : <GitCommitHorizontal size={16}/>;
}

function Sidebar({ mobileOpen, setMobileOpen }: { mobileOpen: boolean; setMobileOpen: (value: boolean) => void }) {
  return <>
    {mobileOpen && <button className="sidebar-backdrop" aria-label="Menü schließen" onClick={() => setMobileOpen(false)}/>}
    <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
      <a className="brand" href="#start" onClick={() => setMobileOpen(false)}><span className="brand-emblem"><Swords size={24} strokeWidth={1.9}/></span><span><strong>REPO<span>QUEST</span></strong><small>DAS CODE-ABENTEUER</small></span></a>
      <div className="sidebar-group-label mono">KOMMANDOZENTRALE</div>
      <nav aria-label="Hauptnavigation" className="nav-stack">
        <a href="#start" className="nav-item selected" onClick={() => setMobileOpen(false)}><LayoutDashboard size={17}/> Übersicht <span className="nav-shortcut">01</span></a>
        <a href="#weltkarte" className="nav-item" onClick={() => setMobileOpen(false)}><Compass size={17}/> Weltkarte <span className="nav-shortcut">02</span></a>
        <a href="#quests" className="nav-item" onClick={() => setMobileOpen(false)}><ScrollText size={17}/> Quest-Log <span className="nav-shortcut">03</span></a>
        <a href="#chronik" className="nav-item" onClick={() => setMobileOpen(false)}><BookOpen size={17}/> Chronik <span className="nav-shortcut">04</span></a>
        <a href="#ci" className="nav-item" onClick={() => setMobileOpen(false)}><Activity size={17}/> CI-Wächter <span className="nav-shortcut">05</span></a>
      </nav>
      <div className="sidebar-group-label mono">SYSTEM</div>
      <div className="side-system"><span className="status-pulse"/> GITHUB REST API <span className="side-online">NUR LESEN</span></div>
      <div className="sidebar-spacer"/>
      <div className="sidebar-bottom"><div className="sidebar-bottom-icon"><ShieldCheck size={19}/></div><div><strong>Sicherer Beobachter</strong><p>Keine Schreibzugriffe auf GitHub.</p></div></div>
      <div className="sidebar-version mono">REPOQUEST <span>V1.0.0</span> <span>© 2026</span></div>
    </aside>
  </>;
}

function AgentCard({ agent }: { agent: DashboardData["agent"] }) {
  const xpPercent = agent.xp % 100;
  return <div className="panel agent-panel"><div className="panel-title-row"><div><span className="eyebrow">DEIN CODING-AGENT</span><h2>Heldenprofil</h2></div><span className="pill purple"><Sparkles size={12}/> AKTIV</span></div>
    <div className="agent-main"><div className="avatar-scene"><div className="avatar-halo"/><div className="agent-avatar"><svg viewBox="0 0 140 140" aria-label="Stilisierter Held mit violetter Kapuze" role="img"><path d="M19 135c3-31 17-52 39-58h24c22 6 36 27 39 58" fill="#342f64" stroke="#7f73cd" strokeWidth="2"/><path d="M36 69c-6-39 9-55 34-55s40 16 34 55l-10 22H47Z" fill="#261e4e" stroke="#9f80df" strokeWidth="2"/><path d="M50 52c0-15 7-24 20-24s20 9 20 24v22L70 92 50 74Z" fill="#cfacb8"/><path d="M51 54Q70 66 89 54L88 35Q70 11 51 35Z" fill="#1c183a"/><path d="M52 62h11l-5 3h-6m25-3h11l-5 3h-6" fill="#72ffe1"/><path d="M62 79Q70 83 78 79" fill="none" stroke="#895d83" strokeWidth="2"/><path d="M30 120 54 92 70 111 87 92l23 28" stroke="#b49fff" strokeWidth="3" fill="none"/><path d="m64 114 6 6 6-6-6-7Z" fill="#64ead0"/></svg></div><div className="avatar-level">LVL {agent.level}</div></div>
      <div className="agent-description"><div className="mono agent-class">✦ {agent.className}</div><h3>{agent.name}</h3><p>Hüterin des Repositories</p><div className="agent-tags"><span><Heart size={13} fill="currentColor"/> {agent.hp} HP</span><span><Coins size={13}/> {agent.gold} Gold</span></div></div></div>
    <div className="progress-title"><span>ERFAHRUNG</span><span className="mono">{xpPercent} / 100 XP</span></div><div className="xp-track"><div style={{ width: `${xpPercent}%` }}/></div><div className="progress-footer"><span>Gesamt: {agent.xp} XP</span><span>Nächstes Level: {(agent.level) * 100} XP</span></div>
    <div className="skills-heading mono">FÄHIGKEITEN <span>FÄHIGKEITSSTUFE</span></div>
    {([ ["Debugging", agent.skills.debugging, "violet"], ["Refactoring", agent.skills.refactoring, "teal"], ["Testing", agent.skills.testing, "blue"], ["Deployment", agent.skills.deployment, "gold"] ] as const).map(([name, value, color]) => <div className="skill-row" key={name}><span>{name}</span><div className="skill-track"><div className={color} style={{ width: `${value}%` }}/></div><span className="mono">{value}</span></div>)}
    <div className="ability-row"><span className="ability-star">✦</span><div><strong>{agent.abilities.at(-1) ?? "Erste Fähigkeit freischalten"}</strong><small>{agent.abilities.length ? `${agent.abilities.length} Fähigkeiten freigeschaltet` : "Erreiche Level 2 für die erste Fähigkeit"}</small></div></div>
  </div>;
}

function QuestList({ quests }: { quests: QuestData[] }) {
  const [showCompleted, setShowCompleted] = useState(false);
  const filtered = quests.filter((q) => showCompleted ? q.state === "closed" : q.state === "open");
  return <section id="quests" className="panel quest-panel"><div className="panel-title-row"><div><span className="eyebrow">DEINE MISSIONEN</span><h2>Aktive Quests <span className="title-count">{quests.filter((q) => q.state === "open").length}</span></h2></div><button className="text-button" onClick={() => setShowCompleted(!showCompleted)}>{showCompleted ? "Aktive anzeigen" : "Abgeschlossene"} <ArrowRight size={15}/></button></div>
    <div className="quest-list">{filtered.length ? filtered.slice(0, 7).map((quest) => <a key={quest.number} className="quest-item" href={quest.url} target="_blank" rel="noreferrer"><span className={`quest-icon ${quest.kind}`}><QuestIcon kind={quest.kind}/></span><span className="quest-copy"><strong>{quest.title}</strong><span className="quest-sub">#{quest.number} <span className="bullet"/> {questNames[quest.kind]} <span className="bullet"/> {quest.regionKey}/</span></span><span className="quest-right"><span className="quest-reward"><Zap size={12}/> {quest.reward} XP</span><span className="quest-age">{quest.state === "closed" ? quest.completedByPr ? `PR #${quest.completedByPr} · erledigt` : "Geschlossen" : `${ageInDays(quest.createdAt)} Tage alt · Stufe ${quest.difficulty}`}</span></span><ArrowRight size={15} className="quest-arrow"/></a>) : <p className="empty-list">{showCompleted ? "Noch keine abgeschlossenen Quests importiert." : "Alle Quests erledigt! Zeit für ein neues Abenteuer."}</p>}</div>
    <div className="quest-footer"><span><span className="status-pulse"/> {filtered.length} {showCompleted ? "abgeschlossene" : "offene"} Quests</span><span className="mono">SORTIERT NACH AKTUALITÄT</span></div>
  </section>;
}

function Chronicle({ entries }: { entries: ChronicleEventData[] }) {
  const [filter, setFilter] = useState<EventFilter>("all");
  const filtered = entries.filter((e) => filter === "all" || e.kind === filter);
  return <section id="chronik" className="panel chronicle-panel"><div className="panel-title-row"><div><span className="eyebrow">GESCHICHTE DES CODES</span><h2>Chronik</h2></div><BookOpen size={18} className="muted-icon"/></div>
    <div className="filter-row" aria-label="Chronik filtern">{(Object.keys(eventLabels) as EventFilter[]).map((key) => <button type="button" onClick={() => setFilter(key)} className={`filter-chip ${filter === key ? "active" : ""}`} key={key}>{eventLabels[key]}</button>)}</div>
    <div className="timeline">{filtered.slice(0, 10).map((entry) => <div className="timeline-item" key={entry.key}><div className={`event-icon ${entry.kind}`}><EventIcon kind={entry.kind}/></div><div className="event-copy"><p>{entry.url ? <a href={entry.url} target="_blank" rel="noreferrer">{entry.text}</a> : entry.text}</p><span className="mono">{dateLabel(entry.occurredAt)}</span></div></div>)}{!filtered.length && <p className="empty-list">Keine Ereignisse für diesen Filter.</p>}</div>
  </section>;
}

function CiPanel({ workflows }: { workflows: DashboardData["workflows"] }) {
  const successes = workflows.filter((run) => run.conclusion === "success").length;
  return <section id="ci" className="panel ci-panel"><div className="panel-title-row"><div><span className="eyebrow">WÄCHTER DER QUALITÄT</span><h2>CI-Aktivität</h2></div><span className="mono ci-rate">{workflows.length ? `${Math.round(100 * successes / workflows.length)}%` : "—"} <small>ERFOLG</small></span></div>
    <div className="ci-runs">{workflows.slice(0, 4).map((run) => <a href={run.url} target="_blank" rel="noreferrer" className="ci-run" key={run.id}><span className={`ci-symbol ${run.conclusion === "success" ? "success" : run.conclusion === "failure" ? "failure" : "pending"}`}>{run.conclusion === "success" ? <Check size={17}/> : run.conclusion === "failure" ? <X size={17}/> : <Clock3 size={16}/>}</span><span><strong>{run.name}</strong><small>{dateLabel(run.createdAt)} · {run.conclusion === "success" ? "Erfolgreich" : run.conclusion === "failure" ? "Fehlgeschlagen" : "In Bearbeitung"}</small></span><ExternalLink size={13} className="ci-link"/></a>)}{!workflows.length && <p className="empty-list">Keine zugänglichen Workflow-Läufe gefunden.</p>}</div>
  </section>;
}

export function Dashboard({ initialData }: { initialData: DashboardData | null }) {
  const [data, setData] = useState(initialData ?? demoDashboard);
  const [isDemo, setIsDemo] = useState(!initialData);
  const [owner, setOwner] = useState(initialData?.repository.owner ?? "lavender1510");
  const [repo, setRepo] = useState(initialData?.repository.name ?? "repoquest");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [levelUp, setLevelUp] = useState<string | null>(null);
  useEffect(() => { if (!levelUp) return; const timeout = setTimeout(() => setLevelUp(null), 4500); return () => clearTimeout(timeout); }, [levelUp]);

  async function handleImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validated = repositoryInputSchema.safeParse({ owner, repo });
    if (!validated.success) { setError("Bitte einen gültigen GitHub-Owner und Repository-Namen eingeben."); return; }
    setLoading(true); setError(null); setSuccess(null);
    try {
      const response = await fetch("/api/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(validated.data) });
      const body: { dashboard?: DashboardData; error?: string; levelUp?: boolean; newAbility?: string | null } = await response.json();
      if (!response.ok || !body.dashboard) throw new Error(body.error ?? "Import fehlgeschlagen.");
      setData(body.dashboard); setIsDemo(false);
      setSuccess(`${body.dashboard.repository.fullName} wurde erfolgreich synchronisiert.`);
      if (body.levelUp) setLevelUp(body.newAbility ?? "Neue Fähigkeit freigeschaltet!");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unbekannter Fehler beim Import."); }
    finally { setLoading(false); }
  }
  const activeQuests = data.quests.filter((q) => q.state === "open");
  const completedQuests = data.quests.filter((q) => q.state === "closed").length;
  const merged = data.pulls.filter((pr) => pr.mergedAt).length;
  const passed = data.workflows.filter((run) => run.conclusion === "success").length;
  return <div className="app-shell" id="start">
    <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen}/>
    <main className="main-area">
      <header className="topbar"><div className="topbar-left"><button aria-label="Menü öffnen" onClick={() => setMobileOpen(true)} className="mobile-menu"><Menu size={20}/></button><span className="topbar-breadcrumb mono">KONTROLLZENTRUM <span>/</span> ÜBERSICHT</span></div><div className="topbar-right"><span className="topbar-readonly"><CircleDot size={12}/> LESEMODUS</span><a className="github-top" href="https://github.com/lavender1510" target="_blank" rel="noreferrer" aria-label="GitHub Profil öffnen"><Github size={20}/></a></div></header>
      <div className="content-area"><div className="hero-heading"><div><div className="eyebrow pretitle"><span className="sparkle">✦</span> DEIN REPOSITORY. DEINE LEGENDE.</div><h1>Willkommen in <span>RepoQuest.</span></h1><p>Jeder Commit schreibt Geschichte. Jeder Bug ist ein Gegner. Dein Code ist die Welt.</p></div><div className="hero-chapter mono"><span>KAPITEL I</span><strong>DIE ERSTE QUEST</strong><i>✧ ✧ ✧</i></div></div>
      <form className="repo-connector" onSubmit={handleImport}><div className="repo-icon"><Github size={23}/></div><div className="connector-text"><label htmlFor="owner">GITHUB-REPOSITORY VERBINDEN</label><span className="mono">Öffentliche Repos oder freigegebene private Repos</span></div><div className="connector-fields"><input id="owner" aria-label="GitHub-Owner" maxLength={39} required placeholder="Owner" value={owner} onChange={(e) => setOwner(e.target.value)}/><span className="slash">/</span><input aria-label="Repository-Name" maxLength={100} required placeholder="Repository" value={repo} onChange={(e) => setRepo(e.target.value)}/></div><button className="primary-button" type="submit" disabled={loading}>{loading ? <LoaderCircle size={16} className="spin"/> : <RefreshCcw size={16}/>} {loading ? "Synchronisiere…" : "Synchronisieren"}</button></form>
      {(error || success || isDemo || data.warnings.length > 0) && <div className={`notice ${error ? "error-notice" : ""}`} role="status">{error ? <AlertTriangle size={16}/> : success ? <CheckCircle2 size={16}/> : <Sparkles size={16}/> }<div>{error ?? success ?? (isDemo ? "Vorschaumodus: Die angezeigten Werte sind Beispieldaten. Verbinde oben ein GitHub-Repository für echte Daten." : "")}{!isDemo && !error && data.warnings.length > 0 && <div className="warning-copy">Eingeschränkte Daten: {data.warnings.slice(0, 3).join(" · ")}</div>}</div></div>}
      <div className="section-intro"><div><span className="eyebrow">REPOSITORY-STATUS</span><h2>Deine Abenteuerübersicht</h2></div><div className="synced-indicator mono"><span className="status-pulse"/> {isDemo ? "VORSCHAU" : `LETZTER IMPORT: ${dateLabel(data.syncedAt)}`} <ChevronDown size={13}/></div></div>
      <div className="stat-grid">
        <div className="stat-card"><span className="stat-label">AKTIVE QUESTS <ScrollText size={17}/></span><div><strong>{activeQuests.length}</strong><span className="stat-tag violet"><ArrowDownRight size={13}/> NOCH OFFEN</span></div><p>{completedQuests} abgeschlossene Quests</p></div>
        <div className="stat-card"><span className="stat-label">BESIEGTE BOSSE <Swords size={17}/></span><div><strong>{merged}</strong><span className="stat-tag teal"><CheckCircle2 size={13}/> GEMERGTE PRS</span></div><p>Pull Requests erfolgreich vereint</p></div>
        <div className="stat-card"><span className="stat-label">GESAMTE XP <Zap size={17}/></span><div><strong>{data.agent.xp.toLocaleString("de-DE")}</strong><span className="stat-tag gold">LEVEL {data.agent.level}</span></div><p>Noch {100 - (data.agent.xp % 100)} XP bis zum Level-Up</p></div>
        <div className="stat-card"><span className="stat-label">CI-ERFOLGE <ShieldCheck size={17}/></span><div><strong>{passed}<span className="stat-unit">/{data.workflows.length}</span></strong><span className="stat-tag teal"><Activity size={13}/> TEST-WACHE</span></div><p>{data.workflows.length ? Math.round(passed / data.workflows.length * 100) : 0}% erfolgreiche Workflow-Läufe</p></div>
      </div>
      <div className="dashboard-grid"><div className="main-column"><section id="weltkarte" className="panel map-panel"><div className="panel-title-row"><div><span className="eyebrow">ERKUNDE DEINE CODEBASIS</span><h2>Die Weltkarte <span className="title-count">{data.regions.length}</span></h2></div><span className="map-live mono"><span className="status-pulse"/> {isDemo ? "DEMO" : "SNAPSHOT"}</span></div><WorldMap key={data.repository.fullName} regions={data.regions} quests={data.quests}/></section><QuestList quests={data.quests}/></div><div className="side-column"><AgentCard agent={data.agent}/><CiPanel workflows={data.workflows}/><Chronicle entries={data.chronicle}/></div></div>
      <footer className="site-footer"><span className="mono">REPOQUEST © 2026 · MIT OPEN SOURCE</span><span><TerminalSquare size={14}/> GEBAUT FÜR ENTWICKLER <span className="footer-star">✦</span></span></footer></div>
    </main>
    {levelUp && <div className="level-overlay" role="alert"><div className="level-card"><div className="level-rays">✧</div><Trophy size={46}/><span className="mono">LEVELAUFSTIEG!</span><h2>Level {data.agent.level} erreicht!</h2><p>Neue Fähigkeit: <strong>{levelUp}</strong></p><button className="primary-button" onClick={() => setLevelUp(null)}>Weiterabenteuern <ArrowRight size={15}/></button></div></div>}
  </div>;
}
