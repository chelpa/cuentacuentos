# Registro de cambios

## v3 — 31/10/2026 (candidata, no publicada)

Basada en la candidata v2 de 14 tarjetas. Se conservan la portada, la dedicatoria y la arquitectura estática (HTML + CSS + JS sin dependencias de ejecución).

### Favoritos protegidos
- Se mantiene la clave `cona-favorites-v2` y su formato (arreglo de identificadores), igual que en las versiones de 8 y 14 tarjetas.
- Se conservan los 14 identificadores anteriores, incluidos los 8 de la versión publicada.
- Los identificadores que no estén hoy en el catálogo ya no se descartan al guardar (antes se perdían).
- Si el valor guardado no se puede leer, se copia en `cona-favorites-v2-respaldo` antes de escribir.
- Se acepta el formato `{activities: [...]}` por si apareciera en el futuro, y se migra a arreglo al guardar.
- Las sesiones y ediciones tienen identificadores propios (`<actividad>-AAAA-MM-DD[-sufijo]`) y siguen ligadas a su actividad. Los favoritos siguen siendo por actividad.
- La vista elegida se guarda aparte (`cona-vista-v1`) y nunca toca los favoritos.

### Correcciones de la auditoría (P1 y P2)
- **Búsqueda:** recorre solo el título, la comuna y las palabras clave positivas (`data-keywords`), no los textos con negaciones. Admite varias palabras (todas deben coincidir como comienzo de palabra) y no distingue tildes ni mayúsculas. El ejemplo del buscador ya no sugiere «curso».
- **Casa Contada:** rotulada como online en la insignia, las etiquetas, el tipo y el filtro.
- **Impresión:** el desplegable «Más lugares» se abre antes de imprimir y vuelve a su estado al terminar. Se ocultan el botón Imprimir, las notas de favoritos y los controles. Se imprimen siempre las 19 tarjetas.
- **320 px:** se corrigió el desborde del desplegable (correos largos y cuadrícula sin `min-width:0`).
- **Favoritos sin guardar:** el estado vacío dice «Todavía no guardas favoritos» y ofrece volver a Todas. Hay otro mensaje cuando los favoritos no coinciden con la búsqueda.
- **Compartir:** solo comparte o copia el enlace cuando la guía está publicada (https). Desde el archivo, dice «reenvía el mismo archivo que recibiste», sin jerga técnica.
- **Contraste y avisos:** el borde del buscador y del selector sube a 3,52:1, y los puntos del calendario cumplen 3:1.
  - La región de avisos existe siempre (no usa `hidden`).
  - El botón de favorito mantiene una etiqueta fija y comunica el estado con `aria-pressed`.
  - Los grupos de botones usan `role="group"`.
  - Los corazones decorativos de las fuentes se reemplazaron por la etiqueta «Enlace original».
  - Los enlaces del menú tienen un área táctil mayor.
- **Textos que caducan:** el paso 03 (función de Pep Bruno) se reemplaza automáticamente después del 7/11/2026.
  - Las sesiones con hora de término pasan a «pasado» al terminar; las demás, al final del día.
  - Las insignias y los precios ligados a fechas pasadas se tratan como pasados.
- **Gratuidad:** «gratis» y «gratuito» quedan solo en la función de Pep Bruno, que tiene respaldo vigente. Se retiraron de Biblioteca de Santiago, Mustakis, Biblioteca de Vitacura y Mindbuilder; en estas dos últimas el precio queda como «no verificado».
- **Copiar:** si la API del portapapeles falla, se intenta el método clásico.
- **Sin JavaScript:** se ocultan los controles que no funcionarían; el contenido y las fechas siguen visibles.

### Comprobaciones aportadas por Codex (31/10/2026)
Documentadas en las tarjetas y en `INVESTIGACION.md`:
- Mindbuilder: `contacto@mindbuilder.cl` y Luis Pasteur 5515, segundo piso. Se mantiene la advertencia de horarios contradictorios.
- Biblioteca de Vitacura: cuentacuentos los miércoles a las 17:00.
- Colina Cultura: `contacto@colinacultura.cl` y +56 9 9221 1453.

### Investigación incorporada
- **Centro Lector:** segunda edición 2026 (jueves 17:30–19:30, 23/07–10/09, cupos agotados) y las 16 sesiones documentadas. El voluntariado no es requisito.
- **Nuevas tarjetas:** Teatristas (clase presencial de 3 h, $25.000), Encuentro Regional de Narración Oral 2026 (taller de iniciación, terminado), Laboratorio de Oralidad del CCE (terminado), Primavera de los Cuentos de CINOCH (2024 y 2025) y Domestika (curso grabado de Andrés Montero).
- **ChileCuentos:** se añade la función adulta de Claudia Stella (30/10/2026, ya realizada).
- **Cuenteros Chile:** la fecha 5/11/2026 resuelve la contradicción anterior.
- **Más lugares:** se suman cinco pistas secundarias (Fundación Apalabrar, La Casa Cuento, Amanuta, Fundación Piñera Morel y La Escuela de Cuentacuentos de Madrid).
- **Por tarjeta:** cada una indica su tipo (curso, función, online, afín o histórica), su estado, la fuente y la fecha de consulta.
- No se recibieron hallazgos de Gemini, así que no se incorporó ninguno.

### Nuevas vistas y orden
- Vistas **Tarjetas · Agenda · Calendario**, que comparten la búsqueda, el filtro de tipo y el selector **Todas / Mis favoritos**.
- **Agenda:** próximas fechas agrupadas por día, Por confirmar, Recurrentes sin fechas verificadas y Fechas pasadas (de la más reciente a la más antigua).
- **Calendario mensual:** meses anteriores y siguientes y botón Hoy. En el móvil muestra puntos en la cuadrícula y la lista del mes debajo.
  - Solo muestra fechas concretas documentadas, en hora de Santiago, y diferencia las pasadas.
- **Detalle accesible:** un diálogo modal muestra fecha, hora, lugar, estado, precio y fuente. Desde ahí se puede guardar en favoritos o ir a la ficha, y Esc devuelve el foco.
- **Orden:** recomendado, fecha próxima, precio ascendente y descendente. Primero van los precios vigentes, luego los históricos y al final los desconocidos (nunca como cero), siempre con tarifa de público general y unidad.

### Herramientas
- `tests/smoke.py`: nueva prueba de humo que reemplaza la de la versión de 8 tarjetas (31 comprobaciones).
- `tools/build_standalone.py`: genera `dist/Para-Cona.html` con todo embebido. `dist/` queda fuera de git.
