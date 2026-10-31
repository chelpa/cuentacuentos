# Para Cona ♥ — contexto e instrucciones

## Producto
Regalo personal: guía de talleres presenciales de cuentacuentos para adultos por interés recreativo, con prioridad en Vitacura, Lo Barnechea, Las Condes, Providencia y La Reina. Cona disfrutó un curso en Puerto Varas. Conservar la ilustración, la dedicatoria y el tono cálido.

## Arquitectura actual
- HTML estático, CSS y JavaScript sin frameworks ni dependencias de ejecución.
- `index.html` es la única fuente de datos. Cada `article.card` lleva atributos estructurados (ver README) y sus fechas en `li[data-session-id]`. Funciona sin JavaScript para leer las opciones y sus fechas.
- `assets/app.js`: modelo leído del DOM, búsqueda por palabras clave positivas, filtros, Todas/Mis favoritos, orden, vistas Tarjetas/Agenda/Calendario, diálogo de detalle, copiar, compartir e impresión.
- `assets/styles.css`: presentación, móvil (desde 320 px) e impresión.
- `tests/smoke.py`: prueba de humo con Playwright, con la hora fija en 31/10/2026 (Santiago).
- `tools/build_standalone.py`: genera `dist/Para-Cona.html` (no versionado).
- `INVESTIGACION.md`, `INVESTIGACION_OPORTUNIDADES_2026-10-31.md` y `data/research-*.json`: evidencia.
- `REVISION.md`: comprobaciones ejecutadas y pendientes. No heredar sus resultados sin reproducirlos.

## Favoritos: no romper
- La clave `cona-favorites-v2` y su formato (arreglo de identificadores) son compartidos con las versiones publicadas.
- Nunca renombrar ni reutilizar un `data-id` existente. Las ediciones o sesiones nuevas llevan un identificador propio `<actividad>-AAAA-MM-DD[-sufijo]`.
- No filtrar ni borrar al guardar los identificadores que no estén en el catálogo.
- Si cambias el formato, lee el anterior, migra y conserva un respaldo. Prueba con favoritos reales de la versión anterior.

## Alcance
Mantener esta guía estática. Las cuentas, votaciones, reseñas, fotos compartidas y una plataforma pública de actividades son un proyecto futuro. No añadir backend, autenticación, pagos, analíticas ni dependencias de ejecución sin una necesidad autorizada.

## Datos y fuentes
- Una publicación oficial no acredita cupos disponibles. Una función infantil no equivale a formación para adultos.
- Distinguir cursos, funciones, afines, online, ediciones pasadas, ofertas sin fecha y recurrencias.
- En el calendario, solo fechas concretas documentadas.
- No inventar horarios, precios, opiniones, instituciones ni contactos.
- Conservar el año original de cada fuente; si se deduce, decir cómo.
- La fecha de rastreo del buscador no prueba vigencia.
- `data-keywords` solo lleva términos positivos y comprobados. «Gratis» solo con fuente vigente.
- Los precios son de público general, en número, con estado (vigente o histórico) y unidad. Si no hay precio, se omite: nunca es cero.
- Los hallazgos de otras herramientas (Codex, Gemini u otras) se documentan con su alcance. Si no se pudieron contrastar, se tratan como candidatos.

Las fechas se revisaron al 31 de octubre de 2026, zona America/Santiago. Si trabajas después, revalida antes de recomendarlas como próximas. Mustakis terminó su programa en 2024; Cuentanietos Vitacura es de 2024. Casa Contada usa contacto@casacontada.com y dicta online.

## Método de trabajo
1. Lee README.md, INVESTIGACION.md, REVISION.md y CHANGELOG.md.
2. Si la tarea es auditar, mantén los archivos intactos y entrega hallazgos con evidencia y prioridad. Si la tarea autoriza correcciones, impleméntalas sin confirmaciones rutinarias.
3. Respeta el diseño existente y los cambios ajenos. Prefiere correcciones pequeñas y mantenibles.
4. Después de modificar, ejecuta `node --check assets/app.js`, `python3 tools/build_standalone.py` y `python3 tests/smoke.py`.
5. Revisa móvil y escritorio si tienes navegador. Si no, informa esa limitación. No atribuyas pruebas a una herramienta que no ejecutaste.
6. No publiques, no hagas push ni crees commits salvo instrucción expresa: el usuario se encarga de GitHub.

## Desarrollo local
Puedes abrir index.html directamente: no usa fetch para cargar contenido. Para un servidor local, si está autorizado en tu entorno:

```sh
python3 -m http.server 8775 --bind 127.0.0.1
```

La web usa rutas relativas para funcionar bajo un subdirectorio de GitHub Pages. No sustituirlas por rutas absolutas desde `/`.

## Entrega
Resume cambios y hallazgos, comprobaciones realmente ejecutadas, límites y pendientes. Usa PASS / FAIL / NOT TESTED con evidencia. No declares cumplimiento exhaustivo de accesibilidad o seguridad por una inspección parcial.
