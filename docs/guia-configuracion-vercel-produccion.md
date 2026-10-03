# Guía Oficial de Configuración en Producción para Clientum CRM
## Dominio Real: `clientum.com.ar` | Plataforma de Despliegue: Vercel

Esta guía detalla los pasos requeridos para poner en marcha **Clientum CRM & ERP** en el dominio real `clientum.com.ar` alojado en Vercel, asegurando que **Firebase (Persistencia & Auth)**, **Resend (Correos Transaccionales)** y **Mercado Pago (Suscripciones & Webhooks)** funcionen de manera fluida y segura.

---

## 📋 Resumen de Variables de Entorno Necesarias

Todas las variables de producción deben agregarse en el panel de **Vercel** (*Project Settings > Environment Variables*) para los entornos **Production**, **Preview** y **Development**.

| Servicio | Variable de Entorno | Tipo | Ejemplo / Descripción |
| :--- | :--- | :--- | :--- |
| **General** | `APP_URL` | Servidor / Cliente | `https://clientum.com.ar` |
| **General** | `NODE_ENV` | Servidor | `production` |
| **Seguridad** | `WORKFLOW_ENCRYPTION_KEY` | Servidor | Clave Hex de 64 caracteres (`openssl rand -hex 32`) |
| **Seguridad** | `API_KEY_PEPPER` | Servidor | Pepper Hex de 64 caracteres (`openssl rand -hex 32`) |
| **Seguridad** | `SESSION_SECRET` | Servidor | Secreto Express de 64 caracteres |
| **Firebase Admin** | `FIREBASE_PROJECT_ID` | Servidor | ID de tu proyecto Firebase (ej. `clientum-prod`) |
| **Firebase Admin** | `FIREBASE_CLIENT_EMAIL` | Servidor | Email Service Account (`firebase-adminsdk-...@...gserviceaccount.com`) |
| **Firebase Admin** | `FIREBASE_PRIVATE_KEY` | Servidor | Clave privada RSA (`"-----BEGIN PRIVATE KEY-----\n..."`) |
| **Firebase Admin** | `FIREBASE_SERVICE_ACCOUNT_JSON` | Servidor | (Opcional) JSON completo exportado de Service Account |
| **Firebase Client** | `VITE_FIREBASE_API_KEY` | Navegador (Público) | API Key Web (`AIzaSy...`) |
| **Firebase Client** | `VITE_FIREBASE_AUTH_DOMAIN` | Navegador (Público) | `clientum-prod.firebaseapp.com` o `clientum.com.ar` |
| **Firebase Client** | `VITE_FIREBASE_PROJECT_ID` | Navegador (Público) | `clientum-prod` |
| **Firebase Client** | `VITE_FIREBASE_STORAGE_BUCKET` | Navegador (Público) | `clientum-prod.firebasestorage.app` |
| **Firebase Client** | `VITE_FIREBASE_MESSAGING_SENDER_ID` | Navegador (Público) | Sender ID (`1234567890`) |
| **Firebase Client** | `VITE_FIREBASE_APP_ID` | Navegador (Público) | App ID (`1:1234567890:web:...`) |
| **Resend Mail** | `RESEND_API_KEY` | Servidor | API Key de Resend (empieza con `re_...`) |
| **Resend Mail** | `RESEND_FROM_EMAIL` | Servidor | `"Clientum CRM <contacto@clientum.com.ar>"` |
| **Mercado Pago** | `PLATFORM_MERCADOPAGO_ACCESS_TOKEN` | Servidor | Token de Producción (`APP_USR-...`) |
| **Mercado Pago** | `PLATFORM_MERCADOPAGO_WEBHOOK_SECRET` | Servidor | Secret de validación Webhook |
| **Mercado Pago** | `PLATFORM_MP_PLAN_ID_STARTER_MONTHLY` | Servidor | Plan ID generado por `setup:mp-plans` |
| **Mercado Pago** | `PLATFORM_MP_PLAN_ID_STARTER_ANNUAL` | Servidor | Plan ID generado por `setup:mp-plans` |
| **Mercado Pago** | `PLATFORM_MP_PLAN_ID_GROWTH_MONTHLY` | Servidor | Plan ID generado por `setup:mp-plans` |
| **Mercado Pago** | `PLATFORM_MP_PLAN_ID_GROWTH_ANNUAL` | Servidor | Plan ID generado por `setup:mp-plans` |
| **Mercado Pago** | `PLATFORM_MP_PLAN_ID_SCALE_MONTHLY` | Servidor | Plan ID generado por `setup:mp-plans` |
| **Mercado Pago** | `PLATFORM_MP_PLAN_ID_SCALE_ANNUAL` | Servidor | Plan ID generado por `setup:mp-plans` |

---

## 🌐 Paso 1: Configurar el Dominio `clientum.com.ar` en Vercel y DNS

1. **Agregar el Dominio en Vercel**:
   - Ingresa al proyecto en Vercel > **Settings > Domains**.
   - Ingresa `clientum.com.ar` y haz clic en **Add**. Agrega también `www.clientum.com.ar`.

2. **Configuración DNS (Cloudflare o NIC Argentina / DonWeb)**:
   - Configura los siguientes registros DNS en tu proveedor:
     - **Registro A**:
       - Nombre / Host: `@`
       - Valor / IP: `76.76.21.21`
     - **Registro CNAME**:
       - Nombre / Host: `www`
       - Valor / Target: `cname.vercel-dns.com`

3. **Verificación de SSL**:
   - Vercel emitirá automáticamente un certificado SSL gratuito Let's Encrypt para `clientum.com.ar` una vez que el DNS propague.

---

## 🔥 Paso 2: Configuración de Firebase (Firestore & Authentication)

### 2.1 Autorizar el Dominio Real en Firebase Auth
1. Ingresa a la [Consola de Firebase](https://console.firebase.google.com/).
2. Selecciona tu proyecto de producción.
3. Ve a **Authentication > Configuración (Settings) > Dominios Autorizados**.
4. Haz clic en **Agregar dominio** e introduce `clientum.com.ar`. Agrega también `www.clientum.com.ar`.
   *(Sin este paso, los inicios de sesión con Google o Email rebotarán con `auth/unauthorized-domain`).*

### 2.2 Habilitar Métodos de Autenticación
1. En **Authentication > Método de acceso**:
   - Habilita **Correo electrónico/Contraseña**.
   - Habilita **Google** (agrega la dirección de soporte e.g. `contacto@clientum.com.ar`).

### 2.3 Obtener Credenciales del SDK Web (Frontend)
1. En **Configuración del proyecto > General**, desplázate hasta **Tus aplicaciones**.
2. Copia las variables correspondientes a `VITE_FIREBASE_*`.

### 2.4 Obtener Credenciales del SDK Admin (Servidor Backend)
1. En **Configuración del proyecto > Cuentas de servicio (Service accounts)**.
2. Haz clic en **Generar nueva clave privada**. Se descargará un archivo `.json`.
3. Abre el archivo descargado y extrae:
   - `FIREBASE_PROJECT_ID` = `project_id`
   - `FIREBASE_CLIENT_EMAIL` = `client_email`
   - `FIREBASE_PRIVATE_KEY` = `private_key` (asegúrate de conservar los saltos de línea `\n`).

---

## 📧 Paso 3: Configuración de Resend (Correos Transaccionales)

Resend procesa el envío de cotizaciones comerciales, facturas AFIP y alertas de seguridad desde `contacto@clientum.com.ar`.

### 3.1 Verificar el Dominio `clientum.com.ar` en Resend
1. Ingresa a [Resend](https://resend.com) y ve a **Domains**.
2. Haz clic en **Add Domain** e ingresa `clientum.com.ar`.
3. Copia los registros DNS provistos por Resend (DKIM, SPF y DMARC) y agrégalos en tu panel de DNS (Cloudflare / NIC.ar).
4. Haz clic en **Verify Domain**.

### 3.2 Crear la API Key
1. Ve a **API Keys > Create API Key**.
2. Asigna el nombre `Clientum-Production`.
3. Copia la clave generada (empieza con `re_...`).
4. Asigna las variables:
   ```env
   RESEND_API_KEY=re_tu_clave_aqui
   RESEND_FROM_EMAIL="Clientum CRM <contacto@clientum.com.ar>"
   ```

---

## 💳 Paso 4: Configuración de Mercado Pago (Cobros y Suscripciones)

### 4.1 Obtener Credenciales de Producción
1. Ingresa a [Mercado Pago Developers](https://www.mercadopago.com.ar/developers/).
2. Ve a **Tus Integraciones > [Tu Aplicación] > Credenciales de producción**.
3. Copia el **Access Token** de producción (empieza con `APP_USR-...`).
   ```env
   PLATFORM_MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxxxxxx
   ```

### 4.2 Configurar Webhook de Notificaciones
1. En Mercado Pago Developers, ve a **Webhooks (Notificaciones Web)**.
2. Ingresa la URL pública de producción de tu servidor:
   ```text
   https://clientum.com.ar/api/webhooks/mercadopago
   ```
3. Selecciona los eventos:
   - **Pagos (`payment`)**
   - **Suscripciones (`subscription` / `preapproval`)**
4. Copia la clave de firma (Secret) de Webhooks de Mercado Pago:
   ```env
   PLATFORM_MERCADOPAGO_WEBHOOK_SECRET=tu_secreto_webhook_aqui
   ```

### 4.3 Generar Automáticamente los Planes de Suscripción en Mercado Pago
Ejecuta el script automatizado para crear los 6 planes recurrentes (Starter, Growth, Scale en modalidades Mensual y Anual):

```bash
PLATFORM_MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxx APP_URL=https://clientum.com.ar npm run setup:mp-plans
```

El script imprimirá en pantalla las IDs de los planes. Copia estos valores en tus variables de entorno.

---

## ⚡ Paso 5: Sincronización Automatizada de Variables hacia Vercel

Hemos incluido un script de automatización que valida la integridad de tus credenciales y crea el archivo listo para desplegar.

### 5.1 Ejecutar la Auditoría y Generación de Configuración Local
```bash
npm run setup:vercel-env
```
Este comando:
- Formatea y valida las variables requeridas en `.env.production`.
- Genera automáticamente claves seguras de encriptación (`WORKFLOW_ENCRYPTION_KEY`, `API_KEY_PEPPER`, `SESSION_SECRET`).
- Crea el script de empuje para la Vercel CLI en `scripts/sync-vercel-env.sh`.

### 5.2 Sincronizar las Variables con Vercel

**Opción A — Mediante Vercel CLI (Recomendado)**:
```bash
npm run sync:vercel-env
```

**Opción B — Mediante API de Vercel**:
```bash
node scripts/setup-vercel-env.mjs --sync --project tu-nombre-de-proyecto-en-vercel
```

**Opción C — Carga Manual en el Dashboard**:
Abre `.env.production`, copia las líneas clave y pégalas directamente en el panel de **Vercel > Project Settings > Environment Variables**.

---

## 🔍 Paso 6: Verificación y Pruebas en Producción

Una vez completado el redespliegue en Vercel, verifica el estado del sistema en tu navegador o terminal:

1. **Estado de Salud de la API**:
   ```bash
   curl -s https://clientum.com.ar/api/health
   curl -s https://clientum.com.ar/api/ready
   ```
   Ambos endpoints deben retornar `{"status":"ok", ...}` y confirmar la conexión activa con Firebase Admin y los servicios de pago.

2. **Verificación de Autenticación de Usuarios**:
   - Ingresa a `https://clientum.com.ar/app`.
   - Inicia sesión con Google o crea una cuenta con email.

3. **Verificación de Facturación y Suscripción**:
   - Ve al panel de planes de la plataforma (`/app?billing=subscription`).
   - Selecciona un plan y confirma que redirija al Checkout Oficial de Mercado Pago con el dominio `https://clientum.com.ar`.

¡Felicitaciones! Tu instancia de **Clientum CRM** en `clientum.com.ar` está 100% operativa, segura y lista para producción.
