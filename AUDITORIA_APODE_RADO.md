# APODE / RADO — Auditoría de guía «Para Cona ♥»

**Fecha de revisión:** 31 de octubre de 2026  
**Estado:** RELEASE CANDIDATE · NO PUBLICADA · NO AUDITADA AÚN POR CLAUDE CODE  
**Propósito:** regalo personal para Cona y directorio informativo de cuentacuentos en Vitacura y cercanos.

## A — AUDIT

### Alcance revisado en esta sesión
- Código fuente: HTML + CSS + JavaScript sin frameworks ni cargas externas automáticas.
- Imagen: portada nueva convertida a WebP y guardada localmente; HTML autosuficiente la contiene como datos embebidos.
- Navegación y UX: diseño responsive, tarjetas separadas por estado, búsqueda por texto, categorías, favoritos locales, mensaje copiable, botones de compartir/impresión.
- Proveniencia: cuatro URLs originales conservadas exactamente, sin `utm_source`; precios históricos y horarios tienen advertencia.

### Pruebas realizadas aquí (no por Claude Code)
| Comprobación | Resultado | Evidencia |
|---|---|---|
| Portada carga completa a ancho móvil y escritorio | PASS | Playwright Chromium, capturas locales |
| 8 tarjetas iniciales | PASS | `tests/smoke.py` |
| Filtro Aprender (1 tarjeta), búsqueda (1 tarjeta), favoritos y reset | PASS | `tests/smoke.py` |
| Sin desbordamiento horizontal a 390px y 1365px | PASS | `tests/smoke.py` |
| Sin excepciones JS al usar controles probados | PASS | `tests/smoke.py` |
| Existen los cuatro enlaces originales | PASS | Inspección de DOM |
| Imagen con texto alternativo y anclas internas resueltas | PASS | Inspección HTML |
| Enlaces externos `target=_blank` con `rel=noopener` | PASS | Inspección HTML |
| Cupos e inscripciones activos en todas las fuentes | NOT VERIFIED | Ninguna fuente confirma disponibilidad universal |
| Accesibilidad WCAG 2.2 AA exhaustiva, lectores de pantalla | NOT TESTED | Requiere auditoría manual/herramientas adicionales |
| Auditoría de Claude Code | NOT RUN | CLI Claude Code no disponible en este entorno |
| Página publicada con enlace público | NOT DONE | Pendiente decisión y publicación |

### Fuentes oficiales importantes
1. Centro Lector 1.er semestre 2026: https://corporacionculturaldelobarnechea.cl/actividades/talleres/talleres-centro-lector-primer-semestre-2026/ — programa con fechas y tarifas históricas; edición terminó.
2. Fundación Mustakis: https://plandelectura.cultura.gob.cl/iniciativas/escuela-de-cuentacuentos-fundacion-mustakis-2/ — descripción histórica, no inscripción actual.
3. Casa Contada: https://plandelectura.cultura.gob.cl/iniciativas/casa-contada-escuela-de-oralidad-y-literatura/ — ficha descriptiva, no aval de presencialidad actual.
4. ChileCuentos: https://chilecuentos.cl/ — festival 23/10–7/11/2026 y función para adultos en Montecarmelo el 7/11 a las 17:30, gratuita, con inscripción y cupos limitados; **no se comprobaron cupos libres**.
5. Biblioteca de Vitacura: https://vitacuracultura.cl/evento/cuentacuentos-en-la-biblioteca/ — eventos familiares, no curso de adultos confirmado.
6. Mindbuilder: https://libreriamindbuilder.cl/pages/contacto — la misma página menciona 11:30 y 12:00 para sábados; confirmar.

## P — PLAN

**P0 (bloqueo actual):** ninguno observado en las pruebas locales. Esto **no** equivale a una auditoría exhaustiva.

**P1 — riesgos antes de publicar o promocionar:**
- La carta amorosa es personal. Un GitHub Pages público puede ser visto por cualquiera con el enlace (o por terceros). `noindex` no es control de acceso.
- Las fechas, horarios, cupos y programas pueden caducar. Mantener fecha de revisión y revalidar antes de cualquier uso como agenda vigente.

**P2 — mejoras posteriores:**
- Revisión de accesibilidad con lector de pantalla real y Lighthouse/axe si disponibles.
- Mejorar listado para lectores que prefieren ordenar por comuna, distancia, precio o fecha.
- Añadir más cómics propios reales solo después de recuperar los archivos originales y confirmar derechos/uso.
- Evaluar el guardado de favoritos en navegadores con almacenamiento restringido; hoy funciona en sesión aunque la persistencia puede fallar.

## O — ORGANIZE

**Paquete:** `index.html` + `assets/portada-cona.webp` + `tests/smoke.py` + instrucciones Claude + informe. El HTML único `Para_Cona_Interactivas_2026.html` sirve para enviar como archivo; el paquete sirve para GitHub Pages y auditoría.

Separar la idea del **portal de actividades de Santiago** del regalo personal. El portal futuro no debe mostrar votos simulados ni etiquetas «verificado por usuarios» sin proceso auditable.

## D — DIRECT / Decisiones

- Fuente oficial publicada ≠ inscripción disponible hoy.
- Calificación de usuarios ≠ verificación de que el evento ocurrió o de que el usuario asistió.
- El regalo sigue como web estática sin perfiles, backend ni analytics.
- Estado del portal futuro de valoraciones: `CANDIDATE / DESIGN ONLY / NOT ADOPTED`.

## E — EXECUTE / Resultado

Entregado MVP v2 listo para probar como **archivo local** y preparar publicación. Pruebas automáticas locales `PASS` sobre 390px y 1365px; pendiente auditoría independiente con Claude Code y eventual despliegue público autorizado. Sin acceso real a Claude Code en esta sesión, no atribuirle ningún veredicto.
