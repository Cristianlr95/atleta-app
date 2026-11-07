import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { NavigationService } from 'src/app/core/services/navigation.service';
import { VenueService } from '../../services/venue.service';
import { VenueSearchComponent } from './venue-search.component';

describe('VenueSearchComponent', () => {
  let fixture: ComponentFixture<VenueSearchComponent>;
  let venues: jasmine.SpyObj<VenueService>;

  beforeEach(async () => {
    venues = jasmine.createSpyObj('VenueService', ['getActiveVenues', 'searchVenues']);
    venues.getActiveVenues.and.resolveTo([{ id: 1, name: 'Cancha', address: 'Calle', city: 'Ciudad' }]);
    await TestBed.configureTestingModule({ imports: [VenueSearchComponent], providers: [
      { provide: VenueService, useValue: venues },
      { provide: NavigationService, useValue: {} },
      { provide: ActivatedRoute, useValue: { queryParamMap: of({ get: () => null }) } },
    ] }).compileComponents();
    fixture = TestBed.createComponent(VenueSearchComponent);
    fixture.detectChanges();
  });

  it('shows loading immediately and then displays the available venue', fakeAsync(() => {
    fixture.componentInstance.onOpenList();
    fixture.detectChanges();
    expect(fixture.componentInstance.isLoading).toBeTrue();
    expect(fixture.nativeElement.textContent).not.toContain('No hay canchas');
    tick(280); flushMicrotasks(); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Cancha');
  }));

  it('ignora resultados anteriores mientras se escribe una nueva búsqueda', fakeAsync(() => {
    let resolveFirst!: (value: any[]) => void;
    venues.getActiveVenues.and.returnValue(new Promise(resolve => { resolveFirst = resolve; }));
    venues.searchVenues.and.resolveTo([{ id: 2, name: 'Nueva', address: 'Otra calle', city: 'Ciudad' }]);
    fixture.componentInstance.onOpenList();
    tick(280);
    fixture.componentInstance.queryForm.controls.query.setValue('Nueva');
    resolveFirst([{ id: 1, name: 'Anterior', address: 'Calle', city: 'Ciudad' }]);
    flushMicrotasks(); fixture.detectChanges();
    expect(fixture.componentInstance.isLoading).toBeTrue();
    expect(fixture.nativeElement.textContent).not.toContain('Anterior');
    tick(280); flushMicrotasks(); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Nueva');
  }));
  it('cancela una búsqueda pendiente al salir', fakeAsync(() => {
    fixture.componentInstance.onOpenList();
    fixture.destroy();
    tick(280); flushMicrotasks();
    expect(venues.getActiveVenues).not.toHaveBeenCalled();
  }));
  it('deja de buscar al destruir el selector', fakeAsync(() => {
    fixture.destroy();
    fixture.componentInstance.queryForm.controls.query.setValue('Cancha');
    tick(280); flushMicrotasks();
    expect(venues.searchVenues).not.toHaveBeenCalled();
  }));
  it('shows an error and allows retrying the same search', fakeAsync(() => {
    venues.getActiveVenues.and.rejectWith(new Error('offline'));
    fixture.componentInstance.onOpenList();
    tick(280); flushMicrotasks(); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No se pudo buscar canchas');
    venues.getActiveVenues.and.resolveTo([{ id: 1, name: 'Cancha', address: 'Calle', city: 'Ciudad' }]);
    fixture.componentInstance.onRetry();
    tick(280); flushMicrotasks(); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Cancha');
    expect(fixture.nativeElement.textContent).not.toContain('No se pudo buscar canchas');
  }));
});
