import { FriendsPanelComponent } from './friends-panel.component';

describe('FriendsPanelComponent', () => {
  let component: FriendsPanelComponent;

  beforeEach(() => {
    component = new FriendsPanelComponent();
  });

  it('opens the other player profile when current user requested the friendship', () => {
    component.currentPlayerUuid = 'me';

    const profileUuid = component.getFriendProfileUuid({
      id: 1,
      type: 'FRIENDSHIP',
      status: 'ACEPTADA',
      requesterUuid: 'me',
      requesterAlias: 'Yo',
      targetUuid: 'friend',
      targetAlias: 'Amigo',
    });

    expect(profileUuid).toBe('friend');
  });

  it('opens requester profile when current user received the friendship', () => {
    component.currentPlayerUuid = 'me';

    const profileUuid = component.getFriendProfileUuid({
      id: 1,
      type: 'FRIENDSHIP',
      status: 'ACEPTADA',
      requesterUuid: 'friend',
      requesterAlias: 'Amigo',
      targetUuid: 'me',
      targetAlias: 'Yo',
    });

    expect(profileUuid).toBe('friend');
  });
});
