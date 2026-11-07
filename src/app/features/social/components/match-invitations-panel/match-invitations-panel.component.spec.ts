import { MatchInvitationsPanelComponent } from './match-invitations-panel.component';

describe('MatchInvitationsPanelComponent', () => {
  let component: MatchInvitationsPanelComponent;

  beforeEach(() => {
    component = new MatchInvitationsPanelComponent();
  });

  it('falls back when match dates are missing or invalid', () => {
    expect(component.getCountdownLabel()).toBe('Fecha por definir');
    expect(component.getCountdownLabel('not-a-date')).toBe('Fecha por definir');
  });

  it('shows confirmed matches starting soon without NaN labels', () => {
    const soon = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    expect(component.getCountdownLabel(soon)).toBe('Comienza pronto');
  });
});
