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
});
