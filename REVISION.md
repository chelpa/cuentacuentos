# Revisión de la versión v3

**Fecha:** 31/10/2026 · **Entorno:** contenedor en la nube con Chromium (Playwright 1.63, Python), Node 22 y axe-core 4.10.2. La web se sirvió en `https://chelpa.github.io/cuentacuentos/` mediante interceptación local, sin red. Así se simulan la ruta de GitHub Pages y un contexto seguro. La redirección sin barra final se probó con un servidor local.

**Hora fija de las pruebas:** 31/10/2026 18:30 (America/Santiago), salvo las pruebas de fechas, que usan otras horas a propósito.

Esta revisión no hereda resultados de `AUDITORIA_APODE_RADO.md` ni de la revisión de la v2: todo lo marcado PASS se ejecutó sobre esta versión.

## Resultado

| Área | Resultado | Evidencia |
|---|---|---|
| Sintaxis JS | PASS | `node --check assets/app.js`, salida 0 |
| Estructura de datos | PASS | Parser: 19 tarjetas, 30 sesiones con ID único y prefijo de su actividad. Fechas y horas visibles coinciden con `datetime` (día de semana incluido). 97 enlaces externos con `noopener`. Los 4 enlaces originales están presentes. Sin IDs duplicados. |
| Favoritos de la versión publicada (8 tarjetas) | PASS | Se cargó el `index.html` real del repositorio, se marcaron 3 favoritos con su interfaz y luego se cargó la v3 en el mismo origen. Los 3 aparecen marcados y funcionan en tarjetas, filtros, búsqueda, agenda y calendario. Siguen tras recargar. Al volver a la v1 siguen marcados. |
| IDs desconocidos, valor dañado, formato objeto, favoritos de la v2 | PASS | Los IDs desconocidos se conservan al editar. El valor dañado se respalda en `cona-favorites-v2-respaldo`. `{activities:[…]}` se lee y se migra a arreglo. Se reconocen los 11 IDs de la v2. |
| Almacenamiento bloqueado o lleno | PASS | Aviso visible; el favorito funciona durante la visita; sin errores. |
| Búsqueda | PASS | «curso» devuelve solo cursos o talleres. «presencial» excluye online y modalidad pendiente. «online» devuelve 3. «gratis» y «gratuito» solo Pep Bruno. Varias palabras, sin tildes y sin coincidencias por textos negativos. |
| Casa Contada online | PASS | Tipo, insignia, etiquetas y filtro Online. |
| Estados vacíos | PASS | Mensajes distintos sin favoritos y cuando los favoritos no coinciden, en tarjetas y agenda. |
| Orden | PASS | Fecha próxima. Precio ascendente y descendente: vigentes, luego históricos, luego desconocidos al final (nunca como cero). Combinado con filtro. La tabulación sigue el orden visual. Tras su fecha, un precio vigente pasa a histórico. |
| Agenda | PASS | Próximas por día (1, 4, 5 y 7 nov), Por confirmar, Recurrentes sin fechas (Vitacura, Mindbuilder) y Pasadas de la más reciente a la más antigua. |
| Calendario | PASS | Mes actual en hora de Santiago, aunque el visitante esté en otra zona horaria y en UTC ya sea otro día. Navegación de meses, botón Hoy, solo fechas concretas, pasadas diferenciadas, selección de día con teclado. |
| Detalle | PASS | Diálogo modal con foco en el título; guarda favorito; Esc y Cerrar devuelven el foco aunque la lista se haya redibujado; «Ver ficha completa» enfoca la tarjeta. |
| Coherencia entre vistas | PASS | 40 combinaciones de tipo, búsqueda y favoritos: agenda y calendario muestran exactamente las sesiones de las tarjetas visibles. |
| Textos e insignias que caducan | PASS | Al 8/11: paso 03 reemplazado e insignias en «Fecha pasada». Al 4/11 17:30: la actividad con término 17:00 ya figura como pasada. |
| Copiar | PASS | Clipboard API en https y en archivo local; respaldo clásico si la API falla. |
| Compartir | PASS (parcial) | En https copia el enlace sin `#`. Desde archivo y localhost muestra mensajes comprensibles. El menú nativo de compartir: NOT TESTED. |
| Impresión | PASS | Al imprimir, el desplegable se abre y vuelve a su estado; salen las 19 tarjetas aunque haya filtro o vista; sin botones ni notas. El PDF A4 de Chromium (14 páginas) incluye «Más lugares». |
| Responsive | PASS | Sin desborde en 320, 360, 390, 414, 768, 1024 y 1440 px, en tarjetas, agenda, calendario y detalle. Capturas revisadas a 320, 390 y 1440 px. |
| Teclado | PASS | Recorrido con Tab a 390 y 1440 px en las tres vistas (142, 51 y 38 paradas): todas con contorno visible y ningún elemento oculto con foco. |
| Accesibilidad automática | PASS (parcial) | axe-core (WCAG 2.0/2.1/2.2 A-AA y buenas prácticas): 0 infracciones en tarjetas, agenda, calendario y detalle, a 390 y 1440 px. Los fondos con degradado quedaron «incompletos» y se calcularon a mano: texto ≥ 5,5:1, borde del buscador 3,52:1, puntos del calendario ≥ 3,7:1. |
| Sin JavaScript | PASS | 19 tarjetas, 30 fechas y enlaces visibles; controles inertes ocultos; aviso `noscript`. |
| HTML independiente | PASS | `dist/Para-Cona.html` es idéntico al proyecto con CSS, JS e imagen embebidos. Abierto como archivo: favoritos tras recarga, calendario y copiar. |
| Errores y red | PASS | Sin errores de consola ni peticiones externas automáticas. |
| Prueba del proyecto | PASS | `python3 tests/smoke.py`: 31/31. |

### Fallos encontrados durante el trabajo (corregidos y vueltos a probar)
- Tras guardar un favorito desde el detalle, Esc dejaba el foco en el cuerpo de la página: el botón de origen se había redibujado.
- El detalle se abría desplazado hacia abajo en el móvil.
- Las fechas aparecían como «7 De Noviembre De» por un `text-transform`.
- Si el navegador disparaba dos veces `beforeprint`, el desplegable quedaba abierto después de imprimir.
- La búsqueda por subcadenas hacía coincidir palabras cortas en cualquier posición (por ejemplo, «no» dentro de «Normal»).

## NOT TESTED / límites
- Teléfonos reales Android o iOS, Safari y Firefox. Todo se probó en Chromium.
- Lectores de pantalla reales (TalkBack, VoiceOver, NVDA). La región de avisos ahora existe siempre, pero su anuncio no se verificó con un lector.
- Menú nativo de compartir, y el comportamiento del HTML independiente abierto como `content://` en Android.
- Diálogo de impresión real y papel. Se verificó con PDF de Chromium.
- La v3 publicada en GitHub Pages, porque no se publicó.
- Vigencia de datos externos. Las comprobaciones de Codex se documentan como aportadas, no reproducidas. No se verificaron cupos ni se contactó a instituciones.
- Gemini: no se recibieron hallazgos.

## Decisiones conscientes
- La búsqueda usa título, comuna y palabras clave curadas, no todo el texto. Lo que no esté en `data-keywords` no se encuentra; a cambio, las negaciones no generan coincidencias falsas.
- La comparación por precio mezcla unidades (entrada, clase, curso completo). La interfaz lo advierte y cada tarjeta indica la unidad.
- Las sesiones sin hora de término cuentan como próximas hasta el final de su día.
- El año del segundo semestre de Centro Lector es deducido, y la ficha lo explica.
