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

  it('does not emit when tapping the active item', () => {
    spyOn(component.itemSelected, 'emit');
    component.items = [
      { id: 'home', label: 'Inicio', icon: '', active: true },
      { id: 'matches', label: 'Partidos', icon: '' },
    ];

    component.onSelect('home');

    expect(component.itemSelected.emit).not.toHaveBeenCalled();
  });

  it('renders pending badge with an accessible label', () => {
    component.items = [
      { id: 'matches', label: 'Partidos', icon: '', badgeCount: 3 },
    ];
    fixture.detectChanges();

    const badge: HTMLElement | null = fixture.nativeElement.querySelector('.metallic-bottom-nav__badge');

    expect(badge?.textContent?.trim()).toBe('3');
    expect(badge?.getAttribute('aria-label')).toBe('3 pendientes');
  });
});
