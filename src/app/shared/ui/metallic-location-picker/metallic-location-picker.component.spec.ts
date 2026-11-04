import { MetallicLocationPickerComponent } from './metallic-location-picker.component';

describe('MetallicLocationPickerComponent coordinates', () => {
  it('selects valid coordinates without a map interaction', () => {
    const component = new MetallicLocationPickerComponent();
    spyOn(component.coordinatesChange, 'emit');
    component.onSetCoordinates('-36.82', '-73.05');
    expect(component.coordinatesChange.emit).toHaveBeenCalledOnceWith({ lat: -36.82, lng: -73.05 });
  });

  it('rejects blank or out-of-range coordinates without changing selection', () => {
    const component = new MetallicLocationPickerComponent();
    spyOn(component.coordinatesChange, 'emit');
    for (const [lat, lng] of [['', '1'], ['91', '0'], ['0', '-181']]) component.onSetCoordinates(lat, lng);
    expect(component.coordinatesChange.emit).not.toHaveBeenCalled();
    expect(component.helperMessage).toContain('latitud entre -90 y 90');
  });
});
