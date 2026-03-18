export interface PlayerPosition {
  id: number;
  nombre: string;
}

export type PositionPriorityLevel = 1 | 2 | 3;

export interface AssignPlayerPositionRequest {
  playerUuid: string;
  positionId: number;
  prioridad: PositionPriorityLevel;
}

export interface PlayerAssignedPosition {
  playerUuid: string;
  positionId: number;
  positionName: string;
  prioridad: PositionPriorityLevel;
  assignedAt: string;
}
