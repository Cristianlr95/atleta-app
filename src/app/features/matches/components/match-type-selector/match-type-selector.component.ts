import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatchType } from '../../models/progressive-match.models';

interface MatchTypeOption {
  type: MatchType;
  title: string;
  description: string;
}

@Component({
  selector: 'app-match-type-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './match-type-selector.component.html',
  styleUrls: ['./match-type-selector.component.scss'],
})
export class MatchTypeSelectorComponent {
  @Input() selectedType: MatchType | null = null;
  @Output() selectedTypeChange = new EventEmitter<MatchType>();

  readonly options: ReadonlyArray<MatchTypeOption> = [
    {
      type: MatchType.INTERNAL,
      title: 'Enfrentamiento Interno',
      description: 'Partido dentro del mismo equipo con confirmacion progresiva.',
    },
    {
      type: MatchType.FRIENDLY,
      title: 'Partido Amistoso',
      description: 'Organiza un amistoso con tu red de jugadores.',
    },
    {
      type: MatchType.POINTS,
      title: 'Por los Puntos',
      description: 'Partido competitivo con foco en rendimiento.',
    },
  ];

  onSelect(type: MatchType): void {
    this.selectedTypeChange.emit(type);
  }
}

