"use client";

import { useState } from "react";
import { Castle, CircleHelp, GitCommitHorizontal, ScrollText, Shield, Skull, X } from "lucide-react";
import type { QuestData, RegionData } from "@/types/dashboard";

const statusNames: Record<RegionData["status"], string> = { healthy: "Stabil", damaged: "Beschädigt", cursed: "Verflucht", boss: "Bossgebiet" };

export function WorldMap({ regions, quests }: { regions: RegionData[]; quests: QuestData[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const region = regions.find((item) => item.key === selected);
  const matches = quests.filter((quest) => quest.regionKey === selected && quest.state === "open");
  return (
    <div className="map-stage">
      <div className="map-topline"><span className="mono"><span className="accent-dot" /> WELTKARTE / LIVE-TOPOLOGIE</span><span className="map-coordinate mono">SEKTOR 01 — {regions.length} REGIONEN</span></div>
      <div className="map-plane" aria-label="Interaktive Repository-Weltkarte">
        <div className="map-orbit orbit-one"/><div className="map-orbit orbit-two"/><div className="map-grid"/>
        <svg className="map-connections" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <defs><linearGradient id="mapLine" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#a987f6" stopOpacity=".65"/><stop offset="1" stopColor="#36c9bd" stopOpacity=".15"/></linearGradient></defs>
          {regions.filter((r) => r.key !== "root").map((item) => <line key={item.key} x1="50" y1="50" x2={item.x} y2={item.y} stroke="url(#mapLine)" strokeDasharray="1.2 1" strokeWidth=".32"/>)}
          {regions.map((item) => <circle key={item.key} cx={item.x} cy={item.y} r="4.5" fill="#9275de" fillOpacity=".06" stroke="#a58aee" strokeOpacity=".16" strokeWidth=".3"/>)}
        </svg>
        <div className="map-label northwest mono">34.5° N<br/>CODE-REICH</div>
        <div className="map-label southeast mono">PFADKNOTEN<br/>AUTO-KARTIERT</div>
        {regions.map((item) => (
          <button key={item.key} type="button" aria-label={`${item.name}, ${statusNames[item.status]}, Gesundheit ${item.health}`} aria-pressed={selected === item.key} onClick={() => setSelected(selected === item.key ? null : item.key)}
            className={`region-node ${item.status} ${item.key === "root" ? "root-node" : ""} ${selected === item.key ? "active" : ""}`}
            style={{ left: `${item.x}%`, top: `${item.y}%` }}>
            <span className="node-icon">{item.status === "boss" ? <Skull size={19}/> : item.key === "root" ? <Castle size={22}/> : item.health < 55 ? <Shield size={18}/> : <span className="node-diamond"/>}</span>
            <span className="node-name mono">{item.name}</span>
            <span className="node-health"><span style={{ width: `${item.health}%` }}/></span>
          </button>
        ))}
      </div>
      <div className="map-footer"><span><i className="legend-circle green"/>Stabil</span><span><i className="legend-circle amber"/>Beschädigt</span><span><i className="legend-circle purple"/>Verflucht</span><span><i className="legend-circle red"/>Boss</span><span className="map-hint mono">REGION ANKLICKEN →</span></div>
      {region && <div className="region-detail" role="dialog" aria-label={`Region ${region.name}`}>
        <div className="region-detail-head"><div><div className="eyebrow">REGION ERKUNDEN</div><h3>{region.name}</h3></div><button className="icon-button" onClick={() => setSelected(null)} aria-label="Region schließen"><X size={17}/></button></div>
        <div className="region-metrics"><div><span>Gesundheit</span><strong>{region.health}%</strong></div><div><span>Komplexität</span><strong>{region.complexity}/100</strong></div><div><span>Quests</span><strong>{matches.length}</strong></div></div>
        <div className="detail-caption"><ScrollText size={14}/> OFFENE QUESTS</div>
        {matches.length ? matches.slice(0, 4).map((q) => <a className="detail-link" key={q.number} href={q.url} target="_blank" rel="noreferrer">#{q.number} {q.title}<span>↗</span></a>) : <p className="empty-detail">Keine offenen Quests in dieser Region.</p>}
        <div className="detail-caption"><GitCommitHorizontal size={14}/> LETZTE COMMITS</div>
        {region.commits.length ? region.commits.slice(0, 3).map((c) => <a key={c.sha} className="detail-link" href={c.url} target="_blank" rel="noreferrer">{c.message.split("\n")[0].slice(0, 52)}<span>↗</span></a>) : <p className="empty-detail">Keine Pfad-Commits im Importfenster.</p>}
        <p className="detail-note"><CircleHelp size={13}/> Region-Werte sind Schätzwerte aus Issues, CI und Änderungsaktivität.</p>
      </div>}
    </div>
  );
}
