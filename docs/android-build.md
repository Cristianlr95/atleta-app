# Android build

## Requisitos

- Android Studio instalado.
- Android SDK configurado desde Android Studio.
- Java 21 disponible.
- Backend Atleta corriendo y accesible desde el dispositivo.

## Primer setup en Android Studio

1. Abrir Android Studio.
2. Completar el Setup Wizard con instalacion Standard.
3. En SDK Manager validar que esten instalados:
   - Android SDK Platform
   - Android SDK Build-Tools
   - Android SDK Platform-Tools
   - Android Emulator, si se usara emulador
4. Crear un dispositivo virtual desde Device Manager o conectar un telefono con USB debugging.

## Configurar API para telefono real

En un APK instalado en telefono, `localhost` apunta al telefono, no al computador.
Crear un archivo local no versionado:

```powershell
Copy-Item .env.example .env.development.local
```

Editar `ATLETA_API_BASE_URL` usando la IP local del computador:

```text
ATLETA_API_BASE_URL=http://192.168.1.37:8080/api/v1
```

El backend debe estar escuchando en una direccion accesible desde la red local y el telefono debe estar en la misma red Wi-Fi.

## Comandos

Sincronizar web + Android:

```powershell
npm run android:sync
```

Abrir proyecto Android:

```powershell
npm run android:open
```

Generar APK debug:

```powershell
npm run android:apk
```

APK generado:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## Telefono fisico

1. Activar Opciones de desarrollador.
2. Activar Depuracion USB.
3. Conectar por USB y aceptar la autorizacion RSA en el telefono.
4. En Android Studio seleccionar el telefono como target y ejecutar Run.
