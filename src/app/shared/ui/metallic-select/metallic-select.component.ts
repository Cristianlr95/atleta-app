import { CommonModule } from '@angular/common';
import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface MetallicSelectOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-metallic-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './metallic-select.component.html',
  styleUrls: ['./metallic-select.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MetallicSelectComponent),
      multi: true,
    },
  ],
})
export class MetallicSelectComponent implements ControlValueAccessor {
  @Input() label?: string;
  @Input() placeholder = 'Selecciona una opción';
  @Input() options: readonly MetallicSelectOption[] = [];
  @Input() disabled = false;

  value = '';

  onChange = (value: string) => {};
  onTouched = () => {};

  writeValue(value: string | null): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onValueChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.value = target.value;
    this.onChange(this.value);
  }
}
