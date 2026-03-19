import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';

export interface MetallicPositionFieldOption {
  label: string;
  value: string;
}

type FieldRole =
  | 'GOALKEEPER'
  | 'DEFENDER'
  | 'MIDFIELDER'
  | 'WINGER'
  | 'ATTACKER'
  | 'COACH'
  | 'UNKNOWN';

interface FieldPoint {
  x: number;
  y: number;
}

interface FieldPositionNode extends MetallicPositionFieldOption {
  role: FieldRole;
  x: number;
  y: number;
}

@Component({
  selector: 'app-metallic-position-field-picker',
  standalone: true,
  imports: [CommonModule, IonIcon],
  templateUrl: './metallic-position-field-picker.component.html',
  styleUrls: ['./metallic-position-field-picker.component.scss'],
})
export class MetallicPositionFieldPickerComponent {
  @Input() options: ReadonlyArray<MetallicPositionFieldOption> = [];
  @Input() selectedValue = '';
  @Input() selectedValues: ReadonlyArray<string> = [];
  @Input() maxSelections = 1;
  @Input() disabled = false;

  @Output() selectedValueChange = new EventEmitter<string>();
  @Output() selectedValuesChange = new EventEmitter<string[]>();

  readonly selectedIconAsset = 'assets/icons/atleta/ic_status_confirmed_24.svg';
  readonly defaultIconAsset = 'assets/icons/atleta/ic_comp_level_24.svg';

  get nodes(): FieldPositionNode[] {
    const usedByRole = new Map<FieldRole, number>();

    return this.options.map((option) => {
      const role = this.resolveRole(option.label);
      const used = usedByRole.get(role) ?? 0;
      const point = this.pickPoint(role, used);
      usedByRole.set(role, used + 1);

      return {
        ...option,
        role,
        x: point.x,
        y: point.y,
      };
    });
  }

  get pitchNodes(): FieldPositionNode[] {
    return this.nodes.filter((node) => node.role !== 'COACH');
  }

  get specialRoleNodes(): FieldPositionNode[] {
    return this.nodes.filter((node) => node.role === 'COACH');
  }

  get selectedLabel(): string {
    return this.nodes.find((node) => node.value === this.selectedValue)?.label ?? '';
  }

  get isMultiSelectMode(): boolean {
    return this.maxSelections > 1;
  }

  get effectiveSelectedValues(): string[] {
    if (this.isMultiSelectMode) {
      const unique = new Set<string>();
      for (const value of this.selectedValues) {
        if (!value) {
          continue;
        }
        unique.add(value);
        if (unique.size >= this.maxSelections) {
          break;
        }
      }
      return Array.from(unique);
    }

    return this.selectedValue ? [this.selectedValue] : [];
  }

  get selectedLabels(): string[] {
    const selected = new Set(this.effectiveSelectedValues);
    return this.nodes.filter((node) => selected.has(node.value)).map((node) => node.label);
  }

  onSelect(value: string): void {
    if (this.disabled) {
      return;
    }

    if (!this.isMultiSelectMode) {
      this.selectedValueChange.emit(value);
      return;
    }

    const values = [...this.effectiveSelectedValues];
    const existingIndex = values.indexOf(value);

    if (existingIndex >= 0) {
      values.splice(existingIndex, 1);
      this.selectedValuesChange.emit(values);
      return;
    }

    if (values.length >= this.maxSelections) {
      return;
    }

    values.push(value);
    this.selectedValuesChange.emit(values);
  }

  isSelected(value: string): boolean {
    return this.effectiveSelectedValues.includes(value);
  }

  selectedOrder(value: string): number | null {
    const index = this.effectiveSelectedValues.indexOf(value);
    return index >= 0 ? index + 1 : null;
  }

  shortLabel(label: string): string {
    const words = label.trim().split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return label.slice(0, 3).toUpperCase();
  }

  roleDescription(role: FieldRole): string {
    if (role === 'COACH') {
      return 'Rol estrategico fuera del campo';
    }

    return 'Posicion disponible dentro del campo';
  }

  private resolveRole(label: string): FieldRole {
    const normalized = this.normalize(label);

    if (this.containsAny(normalized, ['arquero', 'portero', 'goalkeeper'])) {
      return 'GOALKEEPER';
    }

    if (this.containsAny(normalized, ['defensa', 'zaguero', 'central', 'back'])) {
      return 'DEFENDER';
    }

    if (this.containsAny(normalized, ['mediocampo', 'medio', 'volante', 'pivote', 'contencion'])) {
      return 'MIDFIELDER';
    }

    if (this.containsAny(normalized, ['extremo', 'wing', 'carrilero', 'lateral'])) {
      return 'WINGER';
    }

    if (this.containsAny(normalized, ['delantero', 'ataque', 'atacante', 'punta', 'forward'])) {
      return 'ATTACKER';
    }

    if (this.containsAny(normalized, ['dt', 'director tecnico', 'entrenador', 'coach'])) {
      return 'COACH';
    }

    return 'UNKNOWN';
  }

  private pickPoint(role: FieldRole, index: number): FieldPoint {
    const points: Record<FieldRole, FieldPoint[]> = {
      GOALKEEPER: [{ x: 50, y: 91 }],
      DEFENDER: [
        { x: 50, y: 72 },
        { x: 46, y: 76 },
        { x: 54, y: 76 },
      ],
      MIDFIELDER: [
        { x: 50, y: 50 },
        { x: 46, y: 46 },
        { x: 54, y: 46 },
        { x: 50, y: 56 },
      ],
      WINGER: [
        { x: 22, y: 48 },
        { x: 78, y: 48 },
      ],
      ATTACKER: [
        { x: 50, y: 22 },
      ],
      COACH: [{ x: 50, y: 50 }],
      UNKNOWN: [
        { x: 12, y: 12 },
        { x: 88, y: 12 },
        { x: 50, y: 50 },
        { x: 88, y: 88 },
      ],
    };

    const available = points[role];
    return available[index % available.length];
  }

  private containsAny(source: string, tokens: string[]): boolean {
    return tokens.some((token) => source.includes(token));
  }

  private normalize(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
}
