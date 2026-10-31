# Para Cona ♥

Guía personal de cuentacuentos en Vitacura y alrededores, revisada el 31 de octubre de 2026. Incluye 19 opciones (cursos y talleres, funciones, alternativas online, afines y una referencia histórica) y 12 instituciones como pistas secundarias. Tiene vistas de tarjetas, agenda y calendario, y favoritos.

## Ver la web
Abre `index.html` en tu navegador y conserva la carpeta `assets` junto al archivo. No requiere instalación ni compilación.

Para enviar un solo archivo, genera la copia independiente con `python3 tools/build_standalone.py`. El resultado es `dist/Para-Cona.html`, con todo embebido.

Los favoritos se guardan en el mismo navegador, sin sincronización ni cuenta, con la clave `cona-favorites-v2` (la misma de las versiones anteriores). Las interacciones requieren JavaScript; sin él se pueden leer las opciones, sus fechas y sus enlaces.

## Cómo está organizada
- `index.html`: contenido. Cada tarjeta guarda sus datos en atributos: `data-id`, `data-kind`, `data-keywords`, `data-price`, `data-price-status`, `data-price-unit`, `data-pending` y `data-recurrence`. Sus fechas van en `<li data-session-id data-start data-end>`. Es la única fuente de datos para la agenda, el calendario y el orden.
- `assets/app.js`: búsqueda, filtros, favoritos, orden, agenda, calendario, detalle, copiar, compartir e impresión.
- `assets/styles.css`: presentación, móvil e impresión.
- `INVESTIGACION.md`, `INVESTIGACION_OPORTUNIDADES_2026-10-31.md` y `data/research-*.json`: evidencia.
- `REVISION.md`: comprobaciones y límites. `CHANGELOG.md`: cambios.

### Añadir o actualizar una actividad
1. Copia una tarjeta parecida y ponle un `data-id` nuevo y estable. Nunca cambies los identificadores existentes: son los favoritos de Cona.
2. Elige el `data-kind`: `curso`, `funcion`, `online`, `afin` o `historica`.
3. En `data-keywords`, escribe solo palabras positivas y comprobadas: tipo, modalidad, comuna, público, personas y temas. Nunca escribas «gratis» sin fuente vigente.
4. Por cada fecha concreta, agrega un `<li data-session-id="<id>-AAAA-MM-DD" data-start="AAAA-MM-DDTHH:MM">`, con `data-end` si se conoce. Si no hay fecha concreta, usa `data-pending` o, para actividades habituales, `data-recurrence`.
5. El precio va en número y es la tarifa de público general. Agrega `data-price-status="vigente"` o `"historico"` y la unidad (entrada, clase, curso completo). Si no hay precio, omite `data-price`.
6. Añade la línea `Fuente: … · consultada el DD/MM/AAAA`.

## Comprobaciones
```sh
node --check assets/app.js
python3 tools/build_standalone.py
python3 tests/smoke.py        # requiere: python3 -m pip install playwright && python3 -m playwright install chromium
```

Vista previa local opcional:
```sh
python3 -m http.server 8775 --bind 127.0.0.1
```

## GitHub Pages
La publicación la hace el usuario. Sube el contenido de esta carpeta con `index.html` en la raíz y sin `dist/`. En Settings → Pages, elige Deploy from a branch → main → /(root). `.nojekyll` evita procesamiento adicional. Las rutas son relativas y funcionan bajo `/cuentacuentos/`.

GitHub Pages publica un sitio accesible en Internet. `noindex` no da acceso privado, y `robots.txt` no tiene efecto en una subcarpeta como `/cuentacuentos/`. Documentación oficial: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site

## Alcance
Esta versión no incorpora cuentas, votos, comentarios, fotos compartidas ni backend: son una etapa posterior. Tampoco envía correos ni hace inscripciones; los botones de contacto abren el servicio correspondiente para que la persona decida.

## Fuentes
No se confirmaron cupos ni una matrícula presencial introductoria abierta para adultos en las fuentes revisadas. Los precios de ediciones terminadas se muestran como históricos. La web no añade analíticas; el alojamiento puede registrar datos técnicos de las visitas.
