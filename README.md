# Para Cona ♥ — Web v2

Regalo personal y guía de actividades de cuentacuentos en Vitacura y cercanos, compilada el 31/10/2026.

## Qué contiene
- `index.html`: web para publicar, carga la imagen local `assets/portada-cona.webp`.
- `assets/portada-cona.webp`: ilustración original realizada para la guía.
- `tests/smoke.py`: test local Playwright de 390px y 1365px.
- `CLAUDE.md`: contrato de auditoría con Claude Code; NO hay resultados de Claude todavía.
- `AUDITORIA_APODE_RADO.md`: registro de controles efectivamente realizados y limitaciones.
- `PRODUCTO_FUTURO_CANDIDATE.md`: idea de portal de actividades verificadas y votos, separada del regalo.

## Abrir / probar
Haz doble clic en `index.html` manteniendo el directorio `assets/` al lado, o sirve la carpeta:

```bash
python3 -m http.server 8080
```
Luego abre `http://localhost:8080`.

En teléfonos es más práctico usar el archivo único `Para_Cona_Interactivas_2026.html` entregado por separado (imagen embebida), o publicar esta carpeta en un hosting estático.

## Auditar con Claude Code en tu Mac
Instala o abre Claude Code según su documentación oficial. Luego, dentro de este directorio:

```bash
claude
```

Pega esta instrucción:

> Lee `CLAUDE.md` y `AUDITORIA_APODE_RADO.md`. Audita el proyecto **sin editar ni publicar**. Revisa accesibilidad WCAG 2.2 AA, responsive 320–430px y desktop, funcionalidad de filtros/favoritos/compartir, seguridad, privacidad, validez de enlaces y fechas. Ejecuta tests si dispones de Playwright. Reporta hallazgos P0/P1/P2 con pasos de reproducción, estados PASS/FAIL/NOT TESTED, plan mínimo y veredicto GO/NO-GO condicionado. No inventes verificación externa ni promociones de estado.

Cuando se apruebe un plan de corrección, se puede abrir una segunda sesión para ejecutar cambios y reevaluar.

## Publicación opcional
Crea un repositorio separado en GitHub (mejor uno dedicado al regalo), sube `index.html` y `assets/`, y habilita GitHub Pages para `main / root`. Debe comprobarse la URL publicada antes de compartir. **Importante:** una página GitHub Pages puede quedar accesible públicamente; `noindex` NO garantiza privacidad. No se ha publicado desde esta sesión.

## Privacidad y funcionamiento
No usa fonts externas, APIs externas automáticas, cookies de publicidad ni analítica. Sólo contacta sitios de terceros cuando la persona pulsa enlaces. Los favoritos se guardan en el navegador local si éste permite almacenamiento. No hay votos reales ni reseñas de usuarios.
