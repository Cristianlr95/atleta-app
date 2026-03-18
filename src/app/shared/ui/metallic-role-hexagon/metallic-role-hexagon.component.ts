import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { IonIcon } from '@ionic/angular/standalone';

export type HexagonRole = 'ATAQUE' | 'MEDIOCAMPO' | 'CARRILERO' | 'DEFENSA' | 'ARQUERO' | 'DT';

export interface HexagonRoleStat {
  role: HexagonRole;
  rating: number;
}

interface RolePoint {
  role: HexagonRole;
  rating: number;
  x: number;
  y: number;
  labelX: number;
  labelY: number;
}

@Component({
  selector: 'app-metallic-role-hexagon',
  standalone: true,
  imports: [CommonModule, IonIcon],
  templateUrl: './metallic-role-hexagon.component.html',
  styleUrls: ['./metallic-role-hexagon.component.scss'],
})
export class MetallicRoleHexagonComponent {
  private static readonly ORDER: HexagonRole[] = [
    'ATAQUE',
    'MEDIOCAMPO',
    'CARRILERO',
    'DEFENSA',
    'ARQUERO',
    'DT',
  ];

  private readonly iconBase = 'assets/icons/atleta';
  readonly trophyIconAsset = `${this.iconBase}/ic_comp_trophy_24.svg`;
  readonly medalIconAsset = `${this.iconBase}/ic_comp_level_24.svg`;
  readonly starIconAsset = `${this.iconBase}/ic_comp_stats_24.svg`;

  @Input() title = 'Hexagono de habilidades';
  @Input() subtitle = 'Perfil por rol (0-100)';
  @Input() compact = false;
  @Input() overallValue: number | null = null;
  @Input() overallClassificationLabel: string | null = null;
  @Input() versatilityValue: number | null = null;
  @Input() bestRoleOverride: HexagonRole | null = null;
  @Input() bestRoleRatingOverride: number | null = null;
  @Input() set stats(value: HexagonRoleStat[]) {
    this.internalStats = value ?? [];
  }

  private internalStats: HexagonRoleStat[] = [];

  constructor(private readonly alertController: AlertController) {}

  get size(): number {
    return this.compact ? 212 : 280;
  }

  get center(): number {
    return this.size / 2;
  }

  get radius(): number {
    return this.compact ? 66 : 92;
  }

  get labelOffset(): number {
    return this.compact ? 17 : 24;
  }

  readonly gridLevels = [20, 40, 60, 80, 100];

  get points(): RolePoint[] {
    return MetallicRoleHexagonComponent.ORDER.map((role, index) => {
      const angle = this.angleFor(index);
      const rating = this.roleRating(role);
      const normalized = rating / 100;
      const pointRadius = this.radius * normalized;
      const labelRadius = this.radius + this.labelOffset;

      return {
        role,
        rating,
        x: this.center + pointRadius * Math.cos(angle),
        y: this.center + pointRadius * Math.sin(angle),
        labelX: this.center + labelRadius * Math.cos(angle),
        labelY: this.center + labelRadius * Math.sin(angle),
      };
    });
  }

  get axisPoints(): Array<{ x: number; y: number }> {
    return MetallicRoleHexagonComponent.ORDER.map((_, index) => {
      const angle = this.angleFor(index);
      return {
        x: this.center + this.radius * Math.cos(angle),
        y: this.center + this.radius * Math.sin(angle),
      };
    });
  }

  get shapePoints(): string {
    return this.points.map((point) => `${point.x},${point.y}`).join(' ');
  }

  get average(): number {
    const sum = this.points.reduce((acc, point) => acc + point.rating, 0);
    return Math.round((sum / this.points.length) * 10) / 10;
  }

  get displayOverall(): number {
    const value = this.overallValue ?? this.average;
    return Math.round(value * 10) / 10;
  }

  get bestRole(): RolePoint {
    return this.points.reduce((best, current) =>
      current.rating > best.rating ? current : best,
    );
  }

  get displayBestRole(): { role: HexagonRole; rating: number } {
    if (this.bestRoleOverride) {
      return {
        role: this.bestRoleOverride,
        rating: this.bestRoleRatingOverride ?? this.bestRole.rating,
      };
    }

    return this.bestRole;
  }

  get versatility(): number {
    const over65 = this.points.filter((point) => point.rating >= 65).length;
    return Math.round((over65 / this.points.length) * 100);
  }

  get displayVersatility(): number {
    if (this.versatilityValue === null || this.versatilityValue === undefined) {
      return this.versatility;
    }

    return Math.round(this.versatilityValue);
  }

  get overallClassification(): string {
    if (this.overallClassificationLabel && this.overallClassificationLabel.trim().length > 0) {
      return this.formatClassification(this.overallClassificationLabel);
    }

    return this.classificationFor(this.bestRole.rating);
  }

  classificationFor(value: number): string {
    if (value >= 95) {
      return 'Leyenda';
    }
    if (value >= 85) {
      return 'Elite';
    }
    if (value >= 75) {
      return 'Experto';
    }
    if (value >= 65) {
      return 'Avanzado';
    }
    if (value >= 55) {
      return 'Intermedio';
    }
    if (value >= 50) {
      return 'Principiante';
    }
    return 'Novato';
  }

  classificationClass(value: number): string {
    const classification = this.classificationFor(value).toLowerCase();
    return `metallic-role-hexagon__classification--${classification}`;
  }

  get classificationClassName(): string {
    if (this.overallClassificationLabel && this.overallClassificationLabel.trim().length > 0) {
      return `metallic-role-hexagon__classification--${this.normalizeClassification(this.overallClassificationLabel)}`;
    }

    return this.classificationClass(this.displayBestRole.rating);
  }

  roleLabel(role: HexagonRole): string {
    switch (role) {
      case 'ATAQUE':
        return 'Ataque';
      case 'MEDIOCAMPO':
        return 'Mediocampo';
      case 'CARRILERO':
        return 'Carrilero';
      case 'DEFENSA':
        return 'Defensa';
      case 'ARQUERO':
        return 'Arquero';
      case 'DT':
        return 'DT';
    }
  }

  levelPolygonPoints(level: number): string {
    const ratio = level / 100;
    return this.axisPoints
      .map((point) => {
        const x = this.center + (point.x - this.center) * ratio;
        const y = this.center + (point.y - this.center) * ratio;
        return `${x},${y}`;
      })
      .join(' ');
  }

  async showSummaryInfo(topic: 'overall' | 'bestRole' | 'versatility'): Promise<void> {
    const content = this.summaryInfo(topic);
    const alert = await this.alertController.create({
      header: content.title,
      message: content.message,
      buttons: ['Seguir subiendo'],
    });
    await alert.present();
  }

  private roleRating(role: HexagonRole): number {
    const roleStat = this.internalStats.find((item) => item.role === role);
    const raw = roleStat?.rating ?? 0;
    return Math.max(0, Math.min(100, raw));
  }

  private angleFor(index: number): number {
    const start = -Math.PI / 2;
    return start + (index * Math.PI) / 3;
  }

  private normalizeClassification(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  private formatClassification(value: string): string {
    const normalized = this.normalizeClassification(value);

    if (normalized === 'elite') {
      return 'Elite';
    }

    if (normalized === 'leyenda') {
      return 'Leyenda';
    }

    if (normalized === 'experto') {
      return 'Experto';
    }

    if (normalized === 'avanzado') {
      return 'Avanzado';
    }

    if (normalized === 'intermedio') {
      return 'Intermedio';
    }

    if (normalized === 'principiante') {
      return 'Principiante';
    }

    if (normalized === 'novato') {
      return 'Novato';
    }

    return value;
  }

  private summaryInfo(topic: 'overall' | 'bestRole' | 'versatility'): {
    title: string;
    message: string;
  } {
    if (topic === 'overall') {
      return {
        title: 'Nivel general',
        message:
          'Es tu OVR promedio competitivo. Se calcula combinando tus mejores valores por rol y evoluciona con cada partido.',
      };
    }

    if (topic === 'bestRole') {
      return {
        title: 'Rol destacado',
        message:
          'Es la posicion donde hoy rendis mejor. Mejorarlo te acerca a niveles mas altos y a mejores decisiones de armado.',
      };
    }

    return {
      title: 'Indice de versatilidad',
      message:
        'Mide cuantas posiciones dominas por sobre el umbral competitivo. Mas versatilidad = mas impacto en el equipo.',
    };
  }
}
