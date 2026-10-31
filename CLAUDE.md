# Para Cona — instrucciones para auditoría independiente con Claude Code

## Estado y alcance
Proyecto: guía estática, personal, en español de Chile, para compartir con Cona. Estado `RELEASE CANDIDATE / NOT PUBLISHED / NOT CLAUDE-AUDITED`.

No modificar código ni fuentes antes de entregar un informe de hallazgos. No solicitar ni enviar datos privados, ni publicar archivos, ni habilitar servicios externos sin autorización. La portada está autorizada para uso en esta guía; no reutilizarla como fotografía de identidad.

La fuente de verdad de la implementación es `index.html` + `assets/portada-cona.webp`; el HTML autosuficiente se entrega por separado. Fechas de consulta: 31-10-2026. Fichas históricas NO equivalen a inscripciones abiertas.

## Auditoría solicitada (APODE/RADO)
1. **AUDIT**: leer `index.html`, `AUDITORIA_APODE_RADO.md` y ejecutar smoke tests si el entorno lo permite. Revisar semántica, accesibilidad WCAG 2.2 AA, navegación por teclado, móvil 320–430px, UX, contraste, seguridad, privacidad, enlaces y precisión de estados de las actividades.
2. **PLAN**: proponer issues priorizados `P0 / P1 / P2`, con evidencia reproducible, impacto y criterio de aceptación. Sin inventar hallazgos.
3. **ORGANIZE**: separar problemas del regalo personal de ideas futuras de producto público (votos, recomendaciones y verificación de usuarios).
4. **DIRECT**: mantener la política de fuente: a) fuente oficial confirma existencia/histórico; b) estado actual y cupos solo si comprobados; c) una opinión de usuario nunca es verificación oficial.
5. **EXECUTE**: después de entregar informe y autorización explícita, aplicar correcciones mínimas, ejecutar tests, reportar diff y riesgos remanentes. Nunca desplegar automáticamente.

## No negociables
- Conservar los 4 enlaces originales: Lo Barnechea; Fundación Mustakis; Casa Contada; chilecuentos.cl.
- No afirmar cupos disponibles si no hay verificación temporal específica.
- No agregar rastreadores, cookies de terceros, formularios de datos personales, dashboards de votos falsos ni testimonios fabricados.
- No promover el proyecto futuro de actividades a `CANON / ADOPTED`: mantenerlo `CANDIDATE`.
- Preservar la intención personal: romántica, bonita, sencilla y fácil de usar en Android.
- Mantener los controles funcionales: búsqueda, filtros, favoritos, compartir, copiar y accesibilidad del teclado.

## Entrega esperada de Claude Code
Un documento `CLAUDE_AUDIT_RESULTS.md` con: fecha, entorno usado, pruebas realmente ejecutadas, P0/P1/P2, capturas o pasos de reproducción, cambios sugeridos, fuentes verificadas y `GO / NO-GO` condicionado. Si no pudo ejecutar una prueba, indicar `NOT TESTED`, nunca `PASS`.
