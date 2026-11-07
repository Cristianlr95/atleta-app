import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MetallicBottomNavComponent } from './metallic-bottom-nav.component';

describe('MetallicBottomNavComponent', () => {
  let component: MetallicBottomNavComponent;
  let fixture: ComponentFixture<MetallicBottomNavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetallicBottomNavComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MetallicBottomNavComponent);
    component = fixture.componentInstance;
    component.items = [
      { id: 'profile', label: 'Perfil', icon: '' },
      { id: 'create-session', label: 'Crear sesión', icon: '', variant: 'cta' },
    ];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('activates a destination through the native button click', () => {
    let selected = '';
    component.itemSelected.subscribe((id) => selected = id);
    fixture.nativeElement.querySelector('button').click();
    expect(selected).toBe('profile');
  });

  it('marks the active item as the current page', () => {
    component.items = [
      { id: 'home', label: 'Inicio', icon: '', active: true },
      { id: 'matches', label: 'Partidos', icon: '' },
    ];
    fixture.detectChanges();

    const activeButton: HTMLButtonElement | null = fixture.nativeElement.querySelector(
      '.metallic-bottom-nav__item--active',
    );

    expect(activeButton?.getAttribute('aria-current')).toBe('page');
  });

  it('allows the active section to open its root from a detail page', () => {
    spyOn(component.itemSelected, 'emit');
    component.items = [
      { id: 'home', label: 'Inicio', icon: '', active: true },
      { id: 'matches', label: 'Partidos', icon: '' },
    ];

    component.onSelect('home');

    expect(component.itemSelected.emit).toHaveBeenCalledOnceWith('home');
  });

  it('renders pending badge with an accessible label', () => {
    component.items = [
      { id: 'matches', label: 'Partidos', icon: '', badgeCount: 3 },
    ];
    fixture.detectChanges();

    const badge: HTMLElement | null = fixture.nativeElement.querySelector('.metallic-bottom-nav__badge');

    expect(badge?.textContent?.trim()).toBe('3');
    expect(badge?.getAttribute('aria-label')).toBe('3 invitaciones pendientes de respuesta');
  });

  it('keeps large badge counts compact', () => {
    component.items = [
      { id: 'matches', label: 'Partidos', icon: '', badgeCount: 13 },
    ];
    fixture.detectChanges();

    const badge: HTMLElement | null = fixture.nativeElement.querySelector('.metallic-bottom-nav__badge');

    expect(badge?.textContent?.trim()).toBe('9+');
    expect(badge?.getAttribute('aria-label')).toBe('13 invitaciones pendientes de respuesta');
  });
});
