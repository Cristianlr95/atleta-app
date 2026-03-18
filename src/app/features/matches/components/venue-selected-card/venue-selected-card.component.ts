import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MetallicButtonComponent } from 'src/app/shared/ui/metallic-button/metallic-button.component';
import { Venue } from '../../models/progressive-match.models';

@Component({
  selector: 'app-venue-selected-card',
  standalone: true,
  imports: [CommonModule, MetallicButtonComponent],
  templateUrl: './venue-selected-card.component.html',
  styleUrls: ['./venue-selected-card.component.scss'],
})
export class VenueSelectedCardComponent {
  @Input() venue: Venue | null = null;

  onOpenMaps(): void {
    if (!this.venue) {
      return;
    }

    const query = this.venue.address || this.venue.name;
    const hasCoordinates = !!this.venue.coordinates;
    const url = hasCoordinates
      ? `https://www.google.com/maps/search/?api=1&query=${this.venue.coordinates?.lat},${this.venue.coordinates?.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

    window.open(url, '_blank', 'noopener');
  }
}
