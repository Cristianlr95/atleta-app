# Graph Report - h0-h3-profile  (2026-11-16)

## Corpus Check
- Corpus is ~5,200 words - fits in a single context window. You may not need a graph.

## Summary
- 201 nodes · 358 edges · 10 communities (2 shown, 8 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Navegación 0
- Navegación 1
- Navegación 2
- Navegación 3
- Navegación 4
- Navegación 5
- Navegación 6
- Navegación 7
- Navegación 8
- Navegación 9

## God Nodes (most connected - your core abstractions)
1. `PlayerProfilePage` - 44 edges
2. `StatsPage` - 18 edges
3. `NavigationService` - 15 edges
4. `TeamDetailPage` - 12 edges
5. `HomePage` - 11 edges
6. `buildMainBottomNav()` - 9 edges
7. `ProfileTeamsComponent` - 9 edges
8. `PageNavComponent` - 6 edges
9. `OutcomeSummary` - 2 edges
10. `CompetitionSummary` - 2 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (10 total, 8 thin omitted)

### Community 0 - "Navegación 0"
Cohesion: 0.07
Nodes (4): TeamRosterMember, CompetitionSummary, OutcomeSummary, TeamMemberView

### Community 2 - "Navegación 2"
Cohesion: 0.08
Nodes (3): RecentMatchView, RoleStatView, MainBottomSection

## Knowledge Gaps
- **6 isolated node(s):** `routes`, `MainBottomSection`, `RoleStatView`, `RecentMatchView`, `TeamMemberView` (+1 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 84 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `PlayerProfilePage` connect `Navegación 1` to `Navegación 4`?**
  _High betweenness centrality (0.002) - this node is a cross-community bridge._
- **What connects `routes`, `MainBottomSection`, `RoleStatView` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Navegación 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06755260243632337 - nodes in this community are weakly interconnected._
- **Why does `StatsPage` connect `Navegación 3` to `Navegación 4`?**
  _High betweenness centrality (0.001) - this node is a cross-community bridge._
- **Should `Navegación 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07751937984496124 - nodes in this community are weakly interconnected._
- **Should `Navegación 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08067226890756303 - nodes in this community are weakly interconnected._