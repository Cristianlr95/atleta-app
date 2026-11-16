# Graph Report - h0-h3-profile  (2026-11-16)

## Corpus Check
- Corpus is ~4,602 words - fits in a single context window. You may not need a graph.

## Summary
- 179 nodes · 302 edges · 8 communities (2 shown, 6 thin omitted)
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

## God Nodes (most connected - your core abstractions)
1. `PlayerProfilePage` - 42 edges
2. `StatsPage` - 18 edges
3. `NavigationService` - 14 edges
4. `HomePage` - 13 edges
5. `buildMainBottomNav()` - 7 edges
6. `PageNavComponent` - 6 edges
7. `OutcomeSummary` - 2 edges
8. `CompetitionSummary` - 2 edges
9. `routes` - 1 edges
10. `MainBottomSection` - 1 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (8 total, 6 thin omitted)

### Community 0 - "Navegación 0"
Cohesion: 0.06
Nodes (3): RecentMatchView, RoleStatView, MainBottomSection

### Community 2 - "Navegación 2"
Cohesion: 0.06
Nodes (3): CompetitionSummary, OutcomeSummary, TeamMemberView

## Knowledge Gaps
- **5 isolated node(s):** `routes`, `MainBottomSection`, `RoleStatView`, `RecentMatchView`, `TeamMemberView`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 77 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `PlayerProfilePage` connect `Navegación 1` to `Navegación 4`?**
  _High betweenness centrality (0.003) - this node is a cross-community bridge._
- **What connects `routes`, `MainBottomSection`, `RoleStatView` to the rest of the system?**
  _5 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Navegación 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06448202959830866 - nodes in this community are weakly interconnected._
- **Why does `StatsPage` connect `Navegación 3` to `Navegación 4`?**
  _High betweenness centrality (0.001) - this node is a cross-community bridge._
- **Should `Navegación 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08292682926829269 - nodes in this community are weakly interconnected._
- **Should `Navegación 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._