(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Configuración
  // ---------------------------------------------------------------------------
  var TZ = 'America/Santiago';
  // Clave compartida con las versiones publicadas (8 y 14 tarjetas). No cambiarla.
  var FAV_KEY = 'cona-favorites-v2';
  // Copia del valor anterior si alguna vez no se puede leer (nunca se borra).
  var FAV_BACKUP_KEY = 'cona-favorites-v2-respaldo';
  // Preferencia de vista: comodidad por navegador, no datos importantes.
  var VIEW_KEY = 'cona-vista-v1';
  var KIND_LABELS = { curso: 'Curso o taller', funcion: 'Función', online: 'Online', afin: 'Afín', historica: 'Referencia histórica' };

  var $ = function (selector, root) { return (root || document).querySelector(selector); };
  var $$ = function (selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); };
  var normalize = function (value) { return (value || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); };
  var escapeHTML = function (value) {
    return String(value).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  };

  // ---------------------------------------------------------------------------
  // Fechas: todo se compara como hora local de Santiago ("YYYY-MM-DDTHH:MM")
  // ---------------------------------------------------------------------------
  function santiagoNow() {
    var parts = {};
    new Intl.DateTimeFormat('en-CA', {
      timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
    var hour = parts.hour === '24' ? '00' : parts.hour;
    return { date: parts.year + '-' + parts.month + '-' + parts.day, stamp: parts.year + '-' + parts.month + '-' + parts.day + 'T' + hour + ':' + parts.minute, year: Number(parts.year), month: Number(parts.month) - 1 };
  }
  var NOW = santiagoNow();

  function utcNoon(dateStr) {
    var p = dateStr.slice(0, 10).split('-').map(Number);
    return new Date(Date.UTC(p[0], p[1] - 1, p[2], 12));
  }
  var fmtLong = new Intl.DateTimeFormat('es-CL', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  var fmtShortDay = new Intl.DateTimeFormat('es-CL', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' });
  var fmtMonth = new Intl.DateTimeFormat('es-CL', { timeZone: 'UTC', month: 'long', year: 'numeric' });
  var longDate = function (d) { return fmtLong.format(utcNoon(d)); };
  var capFirst = function (text) { return text.charAt(0).toUpperCase() + text.slice(1); };
  var shortDay = function (d) { return fmtShortDay.format(utcNoon(d)).replace(/\.$/, ''); };
  function timeText(session) {
    var start = session.start.slice(11, 16);
    var end = session.end ? session.end.slice(11, 16) : '';
    if (!start) return 'Hora no publicada';
    return end ? start + '–' + end : start;
  }
  // Una sesión es pasada cuando terminó (si se conoce el término) o cuando terminó su día.
  function sessionEndStamp(session) {
    if (session.end) return session.end;
    return session.start.slice(0, 10) + 'T23:59';
  }
  var isPast = function (session) { return sessionEndStamp(session) < NOW.stamp; };

  // ---------------------------------------------------------------------------
  // Modelo: las tarjetas del HTML son la única fuente de datos
  // ---------------------------------------------------------------------------
  var cardsBox = $('#cards');
  var activities = $$('.card', cardsBox).map(function (el, index) {
    var title = $('h3', el).textContent.trim();
    var priceAttr = el.getAttribute('data-price');
    var activity = {
      id: el.dataset.id,
      el: el,
      index: index,
      title: title,
      kind: el.dataset.kind || 'afin',
      words: normalize([title, el.dataset.comuna, el.dataset.keywords].join(' ')).split(/[^a-z0-9]+/).filter(Boolean),
      price: priceAttr === null || priceAttr === '' ? null : Number(priceAttr),
      priceStatus: el.dataset.priceStatus || '',
      priceUnit: el.dataset.priceUnit || '',
      pending: el.dataset.pending || '',
      recurrence: el.dataset.recurrence || '',
      place: el.dataset.place || '',
      sessions: []
    };
    activity.sessions = $$('[data-session-id]', el).map(function (li) {
      return {
        id: li.dataset.sessionId,
        activity: activity,
        start: li.dataset.start,
        end: li.dataset.end || '',
        label: li.dataset.label || title,
        place: li.dataset.place || activity.place,
        el: li
      };
    }).sort(function (a, b) { return a.start < b.start ? -1 : a.start > b.start ? 1 : 0; });
    return activity;
  });
  var byId = {};
  activities.forEach(function (a) { byId[a.id] = a; });
  var sessionsById = {};
  activities.forEach(function (a) { a.sessions.forEach(function (s) { sessionsById[s.id] = s; }); });
  var nextSession = function (a) {
    for (var i = 0; i < a.sessions.length; i++) if (!isPast(a.sessions[i])) return a.sessions[i];
    return null;
  };

  // ---------------------------------------------------------------------------
  // Favoritos: se conservan todos los identificadores guardados, aunque una
  // actividad no esté hoy en el catálogo. Formato: arreglo de textos (igual que
  // las versiones anteriores). Se acepta también {activities: [...]} y se
  // migra a arreglo al guardar.
  // ---------------------------------------------------------------------------
  var pendingBackup = null;
  function cleanIds(list) {
    var out = [];
    list.forEach(function (v) {
      if (typeof v !== 'string') return;
      var id = v.trim();
      if (id && id.length <= 120 && out.indexOf(id) === -1) out.push(id);
    });
    return out;
  }
  function parseStored(raw) {
    if (raw === null || raw === undefined) return { ids: [], ok: true };
    try {
      var value = JSON.parse(raw);
      if (Array.isArray(value)) return { ids: cleanIds(value), ok: true };
      if (value && typeof value === 'object' && Array.isArray(value.activities)) return { ids: cleanIds(value.activities), ok: true, migrated: true };
    } catch (_) { /* valor ilegible */ }
    return { ids: [], ok: false };
  }
  function loadFavorites() {
    var raw = null;
    try { raw = window.localStorage.getItem(FAV_KEY); } catch (_) { return []; }
    var result = parseStored(raw);
    if (!result.ok) pendingBackup = raw;
    return result.ids;
  }
  var favorites = loadFavorites();
  function persistFavorites() {
    try {
      var ls = window.localStorage;
      if (pendingBackup !== null) {
        if (ls.getItem(FAV_BACKUP_KEY) === null) ls.setItem(FAV_BACKUP_KEY, pendingBackup);
        pendingBackup = null;
      }
      ls.setItem(FAV_KEY, JSON.stringify(favorites));
      return true;
    } catch (_) { return false; }
  }
  var isFav = function (id) { return favorites.indexOf(id) !== -1; };
  var knownFavCount = function () { return activities.filter(function (a) { return isFav(a.id); }).length; };
  function toggleFavorite(id) {
    var removing = isFav(id);
    favorites = removing ? favorites.filter(function (x) { return x !== id; }) : favorites.concat(id);
    var saved = persistFavorites();
    notify(saved
      ? (removing ? 'Quitado de favoritos' : '♥ Guardado en este navegador')
      : 'El navegador no permite guardar cambios. Este favorito solo cambiará durante esta visita.');
    return removing;
  }

  // ---------------------------------------------------------------------------
  // Estado de la interfaz
  // ---------------------------------------------------------------------------
  var state = { query: '', kind: 'all', scope: 'all', sort: 'recommended', view: 'cards', calYear: NOW.year, calMonth: NOW.month, selectedDay: null };
  var input = $('#query');
  var counter = $('#result-count');
  var sortNote = $('#sort-note');
  var toast = $('#toast');

  function matches(a) {
    if (state.kind !== 'all' && a.kind !== state.kind) return false;
    if (state.scope === 'favorites' && !isFav(a.id)) return false;
    // Cada palabra buscada debe ser el comienzo de alguna palabra clave positiva
    // (título, comuna o data-keywords). No se busca en textos con negaciones.
    var terms = normalize(state.query).split(/[^a-z0-9]+/).filter(Boolean);
    return terms.every(function (term) {
      return a.words.some(function (word) { return word.indexOf(term) === 0; });
    });
  }

  function notify(message) {
    window.clearTimeout(notify.timer);
    toast.textContent = '';
    // Pequeña pausa para que los lectores de pantalla perciban el cambio.
    window.setTimeout(function () { toast.textContent = message; }, 60);
    notify.timer = window.setTimeout(function () { toast.textContent = ''; }, 6000);
  }

  // ---------------------------------------------------------------------------
  // Ordenación
  // ---------------------------------------------------------------------------
  // Un precio "vigente" ligado a fechas que ya pasaron se trata como histórico.
  function effectivePriceStatus(a) {
    if (a.priceStatus === 'vigente' && a.sessions.length && !nextSession(a)) return 'historico';
    return a.priceStatus;
  }
  function priceGroup(a) {
    if (a.price === null || isNaN(a.price)) return 2;       // desconocido: siempre al final
    return effectivePriceStatus(a) === 'historico' ? 1 : 0; // vigentes antes que históricos
  }
  function sortActivities(list) {
    var copy = list.slice();
    if (state.sort === 'date') {
      copy.sort(function (x, y) {
        var nx = nextSession(x), ny = nextSession(y);
        if (nx && ny) return nx.start < ny.start ? -1 : nx.start > ny.start ? 1 : x.index - y.index;
        if (nx) return -1;
        if (ny) return 1;
        return x.index - y.index;
      });
    } else if (state.sort === 'price-asc' || state.sort === 'price-desc') {
      var dir = state.sort === 'price-asc' ? 1 : -1;
      copy.sort(function (x, y) {
        var gx = priceGroup(x), gy = priceGroup(y);
        if (gx !== gy) return gx - gy;
        if (gx < 2 && x.price !== y.price) return dir * (x.price - y.price);
        return x.index - y.index;
      });
    } else {
      copy.sort(function (x, y) { return x.index - y.index; });
    }
    return copy;
  }
  var SORT_NOTES = {
    date: 'Primero lo que tiene fechas futuras, de la más cercana a la más lejana; luego lo que está por confirmar.',
    'price-asc': 'Primero precios publicados vigentes, luego precios históricos de ediciones pasadas y al final lo que no tiene precio. Las tarifas son de público general y pueden ser por entrada, clase o curso completo: revisa cada tarjeta.',
    'price-desc': 'Primero precios publicados vigentes, luego precios históricos de ediciones pasadas y al final lo que no tiene precio. Las tarifas son de público general y pueden ser por entrada, clase o curso completo: revisa cada tarjeta.'
  };

  // ---------------------------------------------------------------------------
  // Estados vacíos
  // ---------------------------------------------------------------------------
  function emptyInfo() {
    if (state.scope === 'favorites' && knownFavCount() === 0) {
      return { title: 'Todavía no guardas favoritos.', text: 'Toca ♡ en una actividad para tenerla aquí. Se guardan solo en este navegador.', action: 'Ver todas las actividades', run: function () { setScope('all'); } };
    }
    if (state.scope === 'favorites') {
      return { title: 'Ninguno de tus favoritos coincide.', text: 'Prueba otra palabra o quita el filtro de tipo; tus favoritos siguen guardados.', action: 'Quitar búsqueda y filtro', run: function () { clearQueryAndKind(); } };
    }
    return { title: 'No hay coincidencias.', text: 'Prueba otra palabra o vuelve a «Todas».', action: 'Mostrar todas', run: function () { resetAll(); } };
  }
  function emptyHTML(info) {
    return '<div class="empty"><strong>' + escapeHTML(info.title) + '</strong><p>' + escapeHTML(info.text) + '</p><button type="button" class="btn secondary" data-empty-action>' + escapeHTML(info.action) + '</button></div>';
  }

  // ---------------------------------------------------------------------------
  // Tarjetas
  // ---------------------------------------------------------------------------
  function renderFavButtons() {
    activities.forEach(function (a) {
      var button = $('.fav', a.el);
      var saved = isFav(a.id);
      button.setAttribute('aria-pressed', String(saved));
      button.textContent = saved ? '♥' : '♡';
      button.setAttribute('aria-label', 'Guardar en favoritos: ' + a.title);
    });
    var count = knownFavCount();
    $$('[data-fav-count]').forEach(function (el) { el.textContent = count ? '(' + count + ')' : ''; });
  }

  function renderCards() {
    var visible = activities.filter(matches);
    var ordered = sortActivities(visible).concat(activities.filter(function (a) { return visible.indexOf(a) === -1; }));
    var current = $$('.card', cardsBox);
    var changed = ordered.some(function (a, i) { return current[i] !== a.el; });
    if (changed) ordered.forEach(function (a) { cardsBox.appendChild(a.el); });
    activities.forEach(function (a) { a.el.hidden = visible.indexOf(a) === -1; });

    var empty = $('#empty');
    if (visible.length === 0) {
      var info = emptyInfo();
      $('#empty-title').textContent = info.title;
      $('#empty-text').textContent = info.text;
      $('#empty-action').textContent = info.action;
      empty.hidden = false;
    } else {
      empty.hidden = true;
    }
    return visible.length;
  }

  // Insignias y marcas de fechas según la hora de Santiago.
  function refreshDateStates() {
    activities.forEach(function (a) {
      a.sessions.forEach(function (s) {
        var past = isPast(s);
        s.el.classList.toggle('is-past', past);
        var tag = $('.session-state', s.el);
        if (past && !tag) {
          tag = document.createElement('span');
          tag.className = 'session-state';
          tag.textContent = ' · ya pasó';
          s.el.appendChild(tag);
        } else if (!past && tag) {
          tag.remove();
        }
      });
      var badge = $('[data-status-auto]', a.el);
      if (badge && a.sessions.length && !nextSession(a)) {
        badge.className = 'badge past';
        badge.textContent = badge.getAttribute('data-past-label') || 'Fecha pasada';
      }
    });
    $$('[data-valid-until]').forEach(function (el) { el.hidden = NOW.stamp > el.getAttribute('data-valid-until'); });
    $$('[data-valid-from]').forEach(function (el) { el.hidden = NOW.stamp < el.getAttribute('data-valid-from'); });
  }

  // ---------------------------------------------------------------------------
  // Agenda
  // ---------------------------------------------------------------------------
  function visibleSessions() {
    var list = [];
    activities.filter(matches).forEach(function (a) { a.sessions.forEach(function (s) { list.push(s); }); });
    return list;
  }
  function groupByDay(sessions) {
    var groups = [];
    sessions.forEach(function (s) {
      var day = s.start.slice(0, 10);
      var last = groups[groups.length - 1];
      if (!last || last.day !== day) groups.push({ day: day, items: [s] });
      else last.items.push(s);
    });
    return groups;
  }
  function sessionButton(s) {
    var a = s.activity;
    var past = isPast(s);
    var sub = a.title === s.label ? s.place : a.title + ' · ' + s.place;
    return '<li><button type="button" class="agenda-item' + (past ? ' is-past' : '') + '" data-open-session="' + escapeHTML(s.id) + '">' +
      '<span class="ai-time">' + escapeHTML(timeText(s)) + '</span>' +
      '<span class="ai-main"><span class="ai-title">' + escapeHTML(s.label) + '</span>' +
      '<span class="ai-sub">' + escapeHTML(sub) + '</span>' +
      '<span class="ai-tags"><span class="ai-kind">' + escapeHTML(KIND_LABELS[a.kind] || '') + '</span>' +
      (past ? '<span class="ai-past">Ya pasó</span>' : '') +
      (isFav(a.id) ? '<span class="ai-fav">♥ Favorito</span>' : '') + '</span></span></button></li>';
  }
  function dayGroupsHTML(groups, headingLevel) {
    return groups.map(function (g) {
      var today = g.day === NOW.date ? ' <span class="today-tag">hoy</span>' : '';
      return '<div class="agenda-day"><h' + headingLevel + ' class="agenda-date">' + escapeHTML(capFirst(longDate(g.day))) + today + '</h' + headingLevel + '><ul class="agenda-list">' + g.items.map(sessionButton).join('') + '</ul></div>';
    }).join('');
  }
  function pendingItem(a, reason) {
    return '<li><button type="button" class="agenda-item pending" data-open-activity="' + escapeHTML(a.id) + '">' +
      '<span class="ai-main"><span class="ai-title">' + escapeHTML(a.title) + '</span>' +
      '<span class="ai-sub">' + escapeHTML(reason) + '</span>' +
      '<span class="ai-tags"><span class="ai-kind">' + escapeHTML(KIND_LABELS[a.kind] || '') + '</span>' +
      (isFav(a.id) ? '<span class="ai-fav">♥ Favorito</span>' : '') + '</span></span></button></li>';
  }
  function renderAgenda() {
    var body = $('#agenda-body');
    var visibleActs = activities.filter(matches);
    if (!visibleActs.length) { body.innerHTML = emptyHTML(emptyInfo()); return { upcoming: 0, pending: 0 }; }
    var all = visibleSessions();
    var upcoming = all.filter(function (s) { return !isPast(s); }).sort(function (a, b) { return a.start < b.start ? -1 : a.start > b.start ? 1 : 0; });
    var past = all.filter(isPast).sort(function (a, b) { return a.start > b.start ? -1 : a.start < b.start ? 1 : 0; });
    var withoutUpcoming = visibleActs.filter(function (a) { return a.kind !== 'historica' && !nextSession(a); });
    var recurrent = withoutUpcoming.filter(function (a) { return a.recurrence; });
    var pending = withoutUpcoming.filter(function (a) { return !a.recurrence; });

    var html = '<section class="agenda-group" aria-labelledby="ag-next"><h4 id="ag-next">Próximas fechas</h4>' +
      (upcoming.length ? dayGroupsHTML(groupByDay(upcoming), 5) : '<p class="small-note">No hay fechas próximas con la búsqueda y los filtros actuales.</p>') + '</section>';
    html += '<section class="agenda-group" aria-labelledby="ag-pending"><h4 id="ag-pending">Por confirmar</h4>' +
      (pending.length ? '<p class="small-note">Sin fecha concreta próxima: conviene consultar.</p><ul class="agenda-list">' + pending.map(function (a) { return pendingItem(a, a.pending || 'Fecha por confirmar'); }).join('') + '</ul>' : '<p class="small-note">Nada por confirmar con los filtros actuales.</p>') + '</section>';
    if (recurrent.length) {
      html += '<section class="agenda-group" aria-labelledby="ag-recurrent"><h4 id="ag-recurrent">Recurrentes sin fechas verificadas</h4><p class="small-note">Se publican como actividad habitual, pero sin fechas concretas: confirma antes de ir.</p><ul class="agenda-list">' +
        recurrent.map(function (a) { return pendingItem(a, a.recurrence); }).join('') + '</ul></section>';
    }
    if (past.length) {
      html += '<details class="agenda-group agenda-past"><summary>Fechas pasadas (' + past.length + ')</summary>' + dayGroupsHTML(groupByDay(past), 5) + '</details>';
    }
    body.innerHTML = html;
    return { upcoming: upcoming.length, pending: pending.length + recurrent.length };
  }

  // ---------------------------------------------------------------------------
  // Calendario mensual
  // ---------------------------------------------------------------------------
  var WEEKDAYS = [['lun', 'lunes'], ['mar', 'martes'], ['mié', 'miércoles'], ['jue', 'jueves'], ['vie', 'viernes'], ['sáb', 'sábado'], ['dom', 'domingo']];
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function monthKey() { return state.calYear + '-' + pad(state.calMonth + 1); }
  function renderCalendar() {
    var y = state.calYear, m = state.calMonth;
    var title = fmtMonth.format(new Date(Date.UTC(y, m, 1, 12)));
    $('#cal-title').textContent = title.charAt(0).toUpperCase() + title.slice(1);
    var key = monthKey();
    var monthSessions = visibleSessions().filter(function (s) { return s.start.slice(0, 7) === key; })
      .sort(function (a, b) { return a.start < b.start ? -1 : a.start > b.start ? 1 : 0; });
    var byDay = {};
    monthSessions.forEach(function (s) { (byDay[s.start.slice(0, 10)] = byDay[s.start.slice(0, 10)] || []).push(s); });
    if (state.selectedDay && state.selectedDay.slice(0, 7) !== key) state.selectedDay = null;
    if (state.selectedDay && !byDay[state.selectedDay]) state.selectedDay = null;

    var first = (new Date(Date.UTC(y, m, 1)).getUTCDay() + 6) % 7;
    var days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    var html = '<table class="cal"><caption class="visually-hidden">Calendario de ' + escapeHTML(title) + '</caption><thead><tr>' +
      WEEKDAYS.map(function (w) { return '<th scope="col"><abbr title="' + w[1] + '">' + w[0] + '</abbr></th>'; }).join('') + '</tr></thead><tbody><tr>';
    for (var i = 0; i < first; i++) html += '<td class="cal-empty"></td>';
    for (var d = 1; d <= days; d++) {
      var date = y + '-' + pad(m + 1) + '-' + pad(d);
      var col = (first + d - 1) % 7;
      if (col === 0 && d !== 1) html += '</tr><tr>';
      var items = byDay[date] || [];
      var isToday = date === NOW.date;
      var cls = 'cal-cell' + (isToday ? ' is-today' : '');
      if (items.length) {
        var allPast = items.every(isPast);
        var label = longDate(date) + ': ' + items.length + (items.length === 1 ? ' actividad' : ' actividades') + (allPast ? ', ya pasó' : '') + (isToday ? ', hoy' : '');
        var labels = items.slice(0, 2).map(function (s) {
          return '<span class="cal-label' + (isPast(s) ? ' is-past' : '') + '">' + escapeHTML((s.start.slice(11, 16) ? s.start.slice(11, 16) + ' ' : '') + s.activity.title) + '</span>';
        }).join('') + (items.length > 2 ? '<span class="cal-label more">+' + (items.length - 2) + '</span>' : '');
        html += '<td class="' + cls + '"' + (isToday ? ' aria-current="date"' : '') + '><button type="button" class="cal-day' + (allPast ? ' is-past' : '') + '" data-day="' + date + '" aria-pressed="' + String(state.selectedDay === date) + '" aria-label="' + escapeHTML(label) + '">' +
          '<span class="cal-num" aria-hidden="true">' + d + '</span><span class="cal-dots" aria-hidden="true">' + items.map(function (s) { return '<span class="dot' + (isPast(s) ? ' is-past' : '') + '"></span>'; }).join('') + '</span>' +
          '<span class="cal-labels" aria-hidden="true">' + labels + '</span></button></td>';
      } else {
        html += '<td class="' + cls + '"' + (isToday ? ' aria-current="date"' : '') + '><span class="cal-num">' + d + '</span></td>';
      }
    }
    var trailing = (7 - ((first + days) % 7)) % 7;
    for (var t = 0; t < trailing; t++) html += '<td class="cal-empty"></td>';
    html += '</tr></tbody></table>';
    $('#cal-grid').innerHTML = html;

    var list = $('#cal-list');
    var anyVisible = activities.some(matches);
    if (!anyVisible) {
      list.innerHTML = emptyHTML(emptyInfo());
    } else if (state.selectedDay) {
      list.innerHTML = '<h4 class="cal-list-title">Seleccionado</h4>' + dayGroupsHTML(groupByDay(byDay[state.selectedDay]), 5) +
        '<button type="button" class="btn small ghost" data-clear-day>Ver todo el mes</button>';
    } else if (monthSessions.length) {
      list.innerHTML = '<h4 class="cal-list-title">Fechas de este mes</h4>' + dayGroupsHTML(groupByDay(monthSessions), 5);
    } else {
      list.innerHTML = '<p class="small-note">No hay fechas concretas este mes con la búsqueda y los filtros actuales. Revisa «Por confirmar» en la Agenda o cambia de mes.</p>';
    }
    return { title: title, count: monthSessions.length };
  }

  // ---------------------------------------------------------------------------
  // Detalle accesible (dialog)
  // ---------------------------------------------------------------------------
  var dialog = $('#detail');
  var detailContext = null;
  var detailOpener = null;
  var detailOpenerSelector = '';
  // El contenido de agenda y calendario se vuelve a dibujar: si el botón que
  // abrió el detalle fue reemplazado, se busca su equivalente visible.
  function openerSelector(el) {
    if (!el || !el.getAttribute) return '';
    var attrs = ['data-open-session', 'data-open-activity', 'data-day'];
    for (var i = 0; i < attrs.length; i++) {
      var v = el.getAttribute(attrs[i]);
      if (v) return '[' + attrs[i] + '="' + v.replace(/"/g, '') + '"]';
    }
    return '';
  }
  function restoreFocus() {
    var el = detailOpener;
    if ((!el || !document.contains(el) || !el.offsetParent) && detailOpenerSelector) {
      el = $$(detailOpenerSelector).filter(function (x) { return x.offsetParent !== null; })[0] || null;
    }
    if (el && el.focus) el.focus();
  }
  function factText(a, selector) {
    var el = $(selector, a.el);
    return el ? el.textContent.trim() : '';
  }
  function openDetail(activity, session, opener) {
    detailContext = { activity: activity, session: session };
    detailOpener = opener || document.activeElement;
    detailOpenerSelector = openerSelector(detailOpener);
    $('#detail-kind').textContent = KIND_LABELS[activity.kind] || '';
    $('#detail-title').textContent = session ? session.label : activity.title;
    var rows = [];
    if (session) {
      rows.push(['Fecha', longDate(session.start) + (isPast(session) ? ' (ya pasó)' : '')]);
      rows.push(['Hora', timeText(session) + (session.start.slice(11, 16) ? ' (hora de Chile continental)' : '')]);
      rows.push(['Lugar', session.place]);
      if (session.label !== activity.title) rows.push(['Actividad', activity.title]);
    } else {
      var next = nextSession(activity);
      rows.push(['Fecha', next ? longDate(next.start) + ', ' + timeText(next) : (activity.recurrence || activity.pending || 'Por confirmar')]);
      if (activity.place) rows.push(['Lugar', activity.place]);
    }
    var badge = $('.badge', activity.el);
    if (badge) rows.push(['Estado', badge.textContent.trim()]);
    var price = factText(activity, '.price');
    if (price) rows.push(['Precio', capFirst(price.replace(/^[^:]+:\s*/, ''))]);
    var html = '<dl class="detail-list">' + rows.map(function (r) { return '<dt>' + escapeHTML(r[0]) + '</dt><dd>' + escapeHTML(r[1]) + '</dd>'; }).join('') + '</dl>';
    var desc = factText(activity, '.desc');
    if (desc) html += '<p>' + escapeHTML(desc) + '</p>';
    var caution = factText(activity, '.caution');
    if (caution) html += '<p class="caution">' + escapeHTML(caution) + '</p>';
    var link = $('.actions a[href^="http"]', activity.el);
    if (link) html += '<p><a href="' + escapeHTML(link.href) + '" target="_blank" rel="noopener noreferrer">' + escapeHTML(link.textContent.trim()) + '</a></p>';
    var source = $('.source', activity.el);
    if (source) html += '<p class="source">' + source.innerHTML + '</p>';
    $('#detail-body').innerHTML = html;
    updateDetailFav();
    if (typeof dialog.showModal === 'function') {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
    $('.detail-inner', dialog).scrollTop = 0;
    $('#detail-title').focus();
  }
  function updateDetailFav() {
    if (!detailContext) return;
    var saved = isFav(detailContext.activity.id);
    var b = $('#detail-fav');
    b.setAttribute('aria-pressed', String(saved));
    b.textContent = saved ? '♥ En favoritos' : '♡ Guardar en favoritos';
  }
  function closeDetail(returnFocus) {
    if (typeof dialog.close === 'function' && dialog.open) dialog.close();
    else dialog.removeAttribute('open');
    if (returnFocus !== false) restoreFocus();
  }
  dialog.addEventListener('close', function () {
    var active = document.activeElement;
    if (!skipFocusOnClose && (!active || active === document.body || dialog.contains(active))) restoreFocus();
    skipFocusOnClose = false;
  });
  var skipFocusOnClose = false;
  dialog.addEventListener('click', function (event) { if (event.target === dialog) closeDetail(); });
  $('#detail-close').addEventListener('click', function () { closeDetail(); });
  $('#detail-fav').addEventListener('click', function () {
    if (!detailContext) return;
    toggleFavorite(detailContext.activity.id);
    updateDetailFav();
    render();
  });
  $('#detail-card').addEventListener('click', function () {
    var a = detailContext && detailContext.activity;
    skipFocusOnClose = true;
    closeDetail(false);
    if (!a) return;
    setView('cards');
    if (a.el.hidden) { clearQueryAndKind(); if (a.el.hidden) setScope('all'); }
    var heading = $('h3', a.el);
    heading.setAttribute('tabindex', '-1');
    a.el.scrollIntoView({ block: 'start' });
    heading.focus();
  });

  // ---------------------------------------------------------------------------
  // Render general
  // ---------------------------------------------------------------------------
  function render() {
    renderFavButtons();
    var visibleCount = renderCards();
    var text;
    if (state.view === 'agenda') {
      var ag = renderAgenda();
      text = ag.upcoming + (ag.upcoming === 1 ? ' fecha próxima' : ' fechas próximas') + ' · ' + ag.pending + ' por confirmar';
    } else if (state.view === 'calendar') {
      var cal = renderCalendar();
      text = cal.title + ': ' + cal.count + (cal.count === 1 ? ' fecha' : ' fechas');
    } else {
      text = visibleCount + ' ' + (visibleCount === 1 ? 'opción visible' : 'opciones visibles');
    }
    if (state.scope === 'favorites') text += ' en tus favoritos';
    counter.textContent = text;
    var note = state.view === 'cards' ? SORT_NOTES[state.sort] : '';
    sortNote.hidden = !note;
    sortNote.textContent = note || '';
  }

  function setScope(scope) {
    state.scope = scope;
    $$('[data-scope]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-scope') === scope)); });
    render();
  }
  function setKind(kind) {
    state.kind = kind;
    $$('[data-kind-filter]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-kind-filter') === kind)); });
    render();
  }
  function clearQueryAndKind() {
    state.query = '';
    input.value = '';
    setKind('all');
  }
  function resetAll() {
    state.query = '';
    input.value = '';
    state.scope = 'all';
    $$('[data-scope]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-scope') === 'all')); });
    setKind('all');
    input.focus();
  }
  function setView(view, persist) {
    state.view = view;
    $$('[data-view]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-view') === view)); });
    $('#view-cards').hidden = view !== 'cards';
    $('#view-agenda').hidden = view !== 'agenda';
    $('#view-calendar').hidden = view !== 'calendar';
    $('#sort-box').hidden = view !== 'cards';
    if (persist) { try { window.localStorage.setItem(VIEW_KEY, view); } catch (_) { /* opcional */ } }
    render();
  }

  // ---------------------------------------------------------------------------
  // Eventos
  // ---------------------------------------------------------------------------
  input.addEventListener('input', function () { state.query = input.value; render(); });
  $$('[data-kind-filter]').forEach(function (b) { b.addEventListener('click', function () { setKind(b.getAttribute('data-kind-filter')); }); });
  $$('[data-scope]').forEach(function (b) { b.addEventListener('click', function () { setScope(b.getAttribute('data-scope')); }); });
  $$('[data-view]').forEach(function (b) { b.addEventListener('click', function () { setView(b.getAttribute('data-view'), true); }); });
  $('#sort').addEventListener('change', function (e) { state.sort = e.target.value; render(); });
  $('#empty-action').addEventListener('click', function () { emptyInfo().run(); });

  activities.forEach(function (a) {
    $('.fav', a.el).addEventListener('click', function () {
      var removing = toggleFavorite(a.id);
      render();
      if (removing && state.scope === 'favorites') {
        var next = activities.filter(function (x) { return !x.el.hidden; }).sort(function (x, y) {
          return Array.prototype.indexOf.call(cardsBox.children, x.el) - Array.prototype.indexOf.call(cardsBox.children, y.el);
        })[0];
        (next ? $('.fav', next.el) : $('#empty-action')).focus();
      }
    });
  });

  // Delegación para contenido generado (agenda, calendario, vacíos).
  document.addEventListener('click', function (event) {
    var target = event.target.closest('[data-open-session],[data-open-activity],[data-day],[data-clear-day],[data-empty-action]');
    if (!target) return;
    if (target.hasAttribute('data-open-session')) {
      var s = sessionsById[target.getAttribute('data-open-session')];
      if (s) openDetail(s.activity, s, target);
    } else if (target.hasAttribute('data-open-activity')) {
      var a = byId[target.getAttribute('data-open-activity')];
      if (a) openDetail(a, null, target);
    } else if (target.hasAttribute('data-day')) {
      var day = target.getAttribute('data-day');
      state.selectedDay = state.selectedDay === day ? null : day;
      render();
      var again = $('[data-day="' + day + '"]');
      if (again) again.focus();
      if (state.selectedDay && window.matchMedia('(max-width: 650px)').matches) $('#cal-list').scrollIntoView({ block: 'nearest' });
    } else if (target.hasAttribute('data-clear-day')) {
      var previous = state.selectedDay;
      state.selectedDay = null;
      render();
      var dayButton = previous && $('[data-day="' + previous + '"]');
      if (dayButton) dayButton.focus();
    } else if (target.hasAttribute('data-empty-action')) {
      emptyInfo().run();
    }
  });

  function shiftMonth(delta) {
    var d = new Date(Date.UTC(state.calYear, state.calMonth + delta, 1));
    state.calYear = d.getUTCFullYear();
    state.calMonth = d.getUTCMonth();
    state.selectedDay = null;
    render();
  }
  $('#cal-prev').addEventListener('click', function () { shiftMonth(-1); });
  $('#cal-next').addEventListener('click', function () { shiftMonth(1); });
  $('#cal-today').addEventListener('click', function () {
    state.calYear = NOW.year;
    state.calMonth = NOW.month;
    state.selectedDay = null;
    render();
    var todayHasEvents = $('[data-day="' + NOW.date + '"]');
    if (todayHasEvents) { state.selectedDay = NOW.date; render(); }
    notify('Calendario en ' + $('#cal-title').textContent);
  });

  window.addEventListener('storage', function (event) {
    if (event.key === FAV_KEY || event.key === null) {
      favorites = loadFavorites();
      render();
      updateDetailFav();
    }
  });

  // Copiar mensaje: Clipboard API y, si falla, método clásico.
  function legacyCopy(text) {
    var previous = document.activeElement;
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (_) { ok = false; }
    area.remove();
    if (previous && previous.focus) previous.focus();
    return ok;
  }
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () {
        if (!legacyCopy(text)) throw new Error('copy failed');
      });
    }
    return legacyCopy(text) ? Promise.resolve() : Promise.reject(new Error('copy failed'));
  }
  $('#copy').addEventListener('click', function () {
    copyText($('#mensaje').innerText).then(function () { notify('¡Mensaje copiado! ♥'); })
      .catch(function () { notify('No se pudo copiar. Mantén presionado el mensaje para seleccionarlo.'); });
  });

  // Compartir: solo se comparte un enlace cuando la guía está publicada.
  $('#share').addEventListener('click', function () {
    var local = ['localhost', '127.0.0.1', '[::1]'].indexOf(location.hostname) !== -1;
    var published = location.protocol === 'https:' || (location.protocol === 'http:' && !local);
    if (!published) {
      notify(local
        ? 'Estás viendo una vista previa en este computador. Cuando la guía esté publicada, podrás compartir su enlace.'
        : 'Esta guía está guardada como archivo en este dispositivo. Para compartirla, reenvía el mismo archivo que recibiste ♥');
      return;
    }
    var url = location.href.split('#')[0];
    var fallback = function () {
      copyText(url).then(function () { notify('Enlace copiado ♥ Pégalo donde quieras compartirlo.'); })
        .catch(function () { notify('No se pudo copiar el enlace. Puedes copiarlo desde la barra del navegador.'); });
    };
    if (navigator.share) {
      navigator.share({ title: 'Para Cona ♥', text: 'Una guía de cuentacuentos hecha con cariño ♥', url: url })
        .catch(function (error) { if (!error || error.name !== 'AbortError') fallback(); });
    } else {
      fallback();
    }
  });

  // Impresión: guía completa en tarjetas, con el desplegable de lugares abierto.
  var printSnapshot = null;
  window.addEventListener('beforeprint', function () {
    if (printSnapshot) return; // algunos navegadores lo disparan dos veces
    printSnapshot = $$('details[data-print-open]').map(function (d) { return { el: d, open: d.open }; });
    printSnapshot.forEach(function (item) { item.el.open = true; });
  });
  window.addEventListener('afterprint', function () {
    if (printSnapshot) printSnapshot.forEach(function (item) { item.el.open = item.open; });
    printSnapshot = null;
  });
  $('#print').addEventListener('click', function () { window.print(); });

  // ---------------------------------------------------------------------------
  // Inicio
  // ---------------------------------------------------------------------------
  refreshDateStates();
  var storedView = null;
  try { storedView = window.localStorage.getItem(VIEW_KEY); } catch (_) { storedView = null; }
  setView(['cards', 'agenda', 'calendar'].indexOf(storedView) !== -1 ? storedView : 'cards', false);
})();
