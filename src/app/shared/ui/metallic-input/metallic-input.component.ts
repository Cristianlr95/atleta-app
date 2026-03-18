import { Component, Input, booleanAttribute, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular/standalone';

@Component({
  selector: 'app-metallic-input',
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon],
  templateUrl: './metallic-input.component.html',
  styleUrls: ['./metallic-input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MetallicInputComponent),
      multi: true
    }
  ]
})
export class MetallicInputComponent implements ControlValueAccessor {

  @Input() label?: string;
  @Input() placeholder: string = '';
  @Input() type: string = 'text';
  @Input() disabled: boolean = false;
  @Input({ transform: booleanAttribute }) allowPasswordToggle: boolean = false;

  value: string = '';
  isPasswordVisible: boolean = false;
  private readonly iconBase = 'assets/icons/atleta';
  private readonly eyeIconAsset = `${this.iconBase}/ic_action_view_24.svg`;
  private readonly eyeOffIconAsset = `${this.iconBase}/ic_action_hide_24.svg`;

  onChange = (value: string) => {};
  onTouched = () => {};

  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChange(this.value);
  }

  get resolvedType(): string {
    if (this.allowPasswordToggle && this.type === 'password') {
      return this.isPasswordVisible ? 'text' : 'password';
    }
    return this.type;
  }

  get passwordToggleIconAsset(): string {
    return this.isPasswordVisible ? this.eyeOffIconAsset : this.eyeIconAsset;
  }

  togglePasswordVisibility(): void {
    if (this.disabled || !this.allowPasswordToggle || this.type !== 'password') {
      return;
    }
    this.isPasswordVisible = !this.isPasswordVisible;
  }

}
