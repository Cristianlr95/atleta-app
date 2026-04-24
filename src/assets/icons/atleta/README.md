# Iconos Atleta

## Proposito
Pack SVG propio para la identidad visual de Atleta. Los iconos se usan en navegacion, acciones y componentes del sistema visual `metallic`.

## Uso en Ionic/Angular

### Como imagen
```html
<img src="assets/icons/atleta/ic_nav_home_24.svg" class="at-icon at-icon--default" alt="Inicio" />
```

### Como mascara CSS
Permite cambiar color por estado usando `currentColor`.

```html
<span class="at-icon-mask at-icon--active" style="--icon-url: url('assets/icons/atleta/ic_nav_home_24.svg');"></span>
```

```css
.at-icon {
  width: 24px;
  height: 24px;
  color: var(--icon-default);
}

.at-icon-mask {
  width: 24px;
  height: 24px;
  display: inline-block;
  background-color: currentColor;
  -webkit-mask: var(--icon-url) center / contain no-repeat;
  mask: var(--icon-url) center / contain no-repeat;
}
```

## Estados recomendados
```css
:root {
  --icon-default: #c6e7ff;
  --icon-accent: #63c6ff;
  --icon-success: #7ce9a8;
  --icon-danger: #ff8a8a;
  --icon-disabled: rgba(198, 231, 255, 0.45);
}

.at-icon--default { color: var(--icon-default); }
.at-icon--active { color: var(--icon-accent); filter: drop-shadow(0 0 6px rgba(99, 198, 255, 0.35)); }
.at-icon--success { color: var(--icon-success); }
.at-icon--error { color: var(--icon-danger); }
.at-icon--disabled { color: var(--icon-disabled); }
```

## Estado
Recurso visual implementado. Mantener nombres consistentes, tamanos predecibles y `alt` descriptivo cuando se rendericen como imagen.
