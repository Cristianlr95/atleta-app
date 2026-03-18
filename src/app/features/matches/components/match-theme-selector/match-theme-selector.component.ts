import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatchTheme } from '../../models/progressive-match.models';

@Component({
  selector: 'app-match-theme-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './match-theme-selector.component.html',
  styleUrls: ['./match-theme-selector.component.scss'],
})
export class MatchThemeSelectorComponent {
  @Input() themes: MatchTheme[] = [];
  @Input() selectedThemeId = '';
  @Output() selectTheme = new EventEmitter<string>();
}
