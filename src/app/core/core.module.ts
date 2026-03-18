import { ModuleWithProviders, NgModule, inject } from '@angular/core';

@NgModule()
export class CoreModule {
  constructor() {
    const parentModule = inject(CoreModule, { optional: true, skipSelf: true });

    if (parentModule) {
      throw new Error('CoreModule should only be imported once.');
    }
  }

  static forRoot(): ModuleWithProviders<CoreModule> {
    return {
      ngModule: CoreModule,
      providers: [],
    };
  }
}
