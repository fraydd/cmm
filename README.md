## Flujo de funcionamiento de autenticación
App inicia → Verifica admin en .env → Lo crea si no existe

Admin accede → Panel de administración

Admin envía invitación → Email con token único

Usuario recibe email → Hace clic en enlace

Usuario se registra → Con token válido

Usuario accede → Con rol asignado

## Sistema de Temas y Paleta de Colores

El dashboard cuenta con un **sistema de temas dinámicos** que permite cambiar entre diferentes paletas de colores en tiempo real. Todos los componentes se adaptan automáticamente al tema seleccionado.

### Temas Disponibles

#### **Light Theme** (Tema Claro)
El tema por defecto con una paleta elegante de azules y grises.

#### **Dark Theme** (Tema Oscuro)
Un tema monocromático exclusivamente en escala de grises, negros y blancos para una experiencia visual minimalista y elegante.

#### **Blue Theme** (Tema Azul)
Una variación con tonos azules más intensos para un look más vibrante.

### Paleta de Colores Primarios

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin: 20px 0;">

<div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; text-align: center;">
  <div style="width: 40px; height: 40px; background: #f8fafc; border: 2px solid #cbd5e1; border-radius: 6px; margin: 0 auto 6px;"></div>
  <strong style="font-size: 14px;">Primary 50</strong><br>
  <code style="font-size: 12px;">#f8fafc</code><br>
  <small style="font-size: 11px;">Fondo principal muy claro</small>
</div>

<div style="background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; text-align: center;">
  <div style="width: 40px; height: 40px; background: #f1f5f9; border: 2px solid #cbd5e1; border-radius: 6px; margin: 0 auto 6px;"></div>
  <strong style="font-size: 14px;">Primary 100</strong><br>
  <code style="font-size: 12px;">#f1f5f9</code><br>
  <small style="font-size: 11px;">Fondo secundario</small>
</div>

<div style="background: #e2e8f0; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; text-align: center;">
  <div style="width: 40px; height: 40px; background: #e2e8f0; border: 2px solid #cbd5e1; border-radius: 6px; margin: 0 auto 6px;"></div>
  <strong style="font-size: 14px;">Primary 200</strong><br>
  <code style="font-size: 12px;">#e2e8f0</code><br>
  <small style="font-size: 11px;">Bordes y separadores</small>
</div>

<div style="background: #cbd5e1; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; text-align: center;">
  <div style="width: 40px; height: 40px; background: #cbd5e1; border: 2px solid #cbd5e1; border-radius: 6px; margin: 0 auto 6px;"></div>
  <strong style="font-size: 14px;">Primary 300</strong><br>
  <code style="font-size: 12px;">#cbd5e1</code><br>
  <small style="font-size: 11px;">Separadores secundarios</small>
</div>

<div style="background: #94B4C1; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; text-align: center;">
  <div style="width: 40px; height: 40px; background: #94B4C1; border: 2px solid #cbd5e1; border-radius: 6px; margin: 0 auto 6px;"></div>
  <strong style="font-size: 14px;">Primary 400</strong><br>
  <code style="font-size: 12px;">#94B4C1</code><br>
  <small style="font-size: 11px;">Textos terciarios</small>
</div>

<div style="background: #547792; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; text-align: center; color: white;">
  <div style="width: 40px; height: 40px; background: #547792; border: 2px solid #cbd5e1; border-radius: 6px; margin: 0 auto 6px;"></div>
  <strong style="font-size: 14px;">Primary 500</strong><br>
  <code style="font-size: 12px;">#547792</code><br>
  <small style="font-size: 11px;">Color principal</small>
</div>

<div style="background: #3d5a7a; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; text-align: center; color: white;">
  <div style="width: 40px; height: 40px; background: #3d5a7a; border: 2px solid #cbd5e1; border-radius: 6px; margin: 0 auto 6px;"></div>
  <strong style="font-size: 14px;">Primary 600</strong><br>
  <code style="font-size: 12px;">#3d5a7a</code><br>
  <small style="font-size: 11px;">Hover de botones</small>
</div>

<div style="background: #2d4a6a; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; text-align: center; color: white;">
  <div style="width: 40px; height: 40px; background: #2d4a6a; border: 2px solid #cbd5e1; border-radius: 6px; margin: 0 auto 6px;"></div>
  <strong style="font-size: 14px;">Primary 700</strong><br>
  <code style="font-size: 12px;">#2d4a6a</code><br>
  <small style="font-size: 11px;">Estados activos</small>
</div>

<div style="background: #213448; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; text-align: center; color: white;">
  <div style="width: 40px; height: 40px; background: #213448; border: 2px solid #cbd5e1; border-radius: 6px; margin: 0 auto 6px;"></div>
  <strong style="font-size: 14px;">Primary 800</strong><br>
  <code style="font-size: 12px;">#213448</code><br>
  <small style="font-size: 11px;">Textos principales</small>
</div>

<div style="background: #1a2a3a; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; text-align: center; color: white;">
  <div style="width: 40px; height: 40px; background: #1a2a3a; border: 2px solid #cbd5e1; border-radius: 6px; margin: 0 auto 6px;"></div>
  <strong style="font-size: 14px;">Primary 900</strong><br>
  <code style="font-size: 12px;">#1a2a3a</code><br>
  <small style="font-size: 11px;">Sidebar muy oscuro</small>
</div>

</div>

### 🌟 Colores de Acento y Estado

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin: 20px 0;">

<div style="background: #ECEFCA; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; text-align: center;">
  <div style="width: 40px; height: 40px; background: #ECEFCA; border: 2px solid #cbd5e1; border-radius: 6px; margin: 0 auto 6px;"></div>
  <strong style="font-size: 14px;">Accent</strong><br>
  <code style="font-size: 12px;">#ECEFCA</code><br>
  <small style="font-size: 11px;">Textos en sidebar</small>
</div>

<div style="background: #16a34a; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; text-align: center; color: white;">
  <div style="width: 40px; height: 40px; background: #16a34a; border: 2px solid #cbd5e1; border-radius: 6px; margin: 0 auto 6px;"></div>
  <strong style="font-size: 14px;">Success</strong><br>
  <code style="font-size: 12px;">#16a34a</code><br>
  <small style="font-size: 11px;">Confirmaciones</small>
</div>

<div style="background: #d97706; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; text-align: center; color: white;">
  <div style="width: 40px; height: 40px; background: #d97706; border: 2px solid #cbd5e1; border-radius: 6px; margin: 0 auto 6px;"></div>
  <strong style="font-size: 14px;">Warning</strong><br>
  <code style="font-size: 12px;">#d97706</code><br>
  <small style="font-size: 11px;">Alertas</small>
</div>

<div style="background: #dc2626; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; text-align: center; color: white;">
  <div style="width: 40px; height: 40px; background: #dc2626; border: 2px solid #cbd5e1; border-radius: 6px; margin: 0 auto 6px;"></div>
  <strong style="font-size: 14px;">Error</strong><br>
  <code style="font-size: 12px;">#dc2626</code><br>
  <small style="font-size: 11px;">Errores</small>
</div>

</div>

### 🎯 Uso en Componentes
- **Sidebar**: Primary 900 (fondo) + Accent (texto)
- **Header**: Blanco (fondo) + Primary 800 (texto)
- **Botones**: Primary 500 + Primary 600 (hover)
- **Textos**: Primary 800 (principal), Primary 500 (secundario)
- **Bordes**: Primary 200 (claros), Primary 100 (muy claros)
- **Tooltips**: Primary 800 (fondo) + Blanco (texto)
- **Cards**: Blanco (fondo) + Primary 200 (bordes)
- **Tablas**: Blanco (fondo) + Primary 50 (filas alternas)
