(function attachRoomCalendar(global) {
  const normalizeDate = (value) => String(value || '').slice(0, 10);

  const parseDate = (value) => {
    const normalized = normalizeDate(value);
    if (!normalized) return null;
    return new Date(`${normalized}T00:00:00`);
  };

  const formatDate = (date) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
  };

  const addDays = (value, days) => {
    const date = parseDate(value);
    if (!date) return '';
    date.setDate(date.getDate() + days);
    return formatDate(date);
  };

  const getMonthStart = (value) => {
    const date = value instanceof Date ? new Date(value) : parseDate(value) || new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  };

  const buildWeekdayNames = (locale) => {
    const baseSunday = new Date('2026-01-04T00:00:00');
    const formatter = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(baseSunday);
      date.setDate(baseSunday.getDate() + index);
      return formatter.format(date);
    });
  };

  const isDateWithinBlock = (dateValue, block) => (
    dateValue >= normalizeDate(block?.start_date)
    && dateValue <= normalizeDate(block?.end_date)
  );

  const isDateWithinOccupied = (dateValue, reservation) => (
    dateValue >= normalizeDate(reservation?.checkin)
    && dateValue < normalizeDate(reservation?.checkout)
  );

  const isDateWithinSelection = (dateValue, selectedStart, selectedEnd) => {
    if (!selectedStart || !selectedEnd) return false;
    return dateValue >= selectedStart && dateValue <= selectedEnd;
  };

  const create = ({
    container,
    locale = 'es-MX',
    labels = {},
    interactive = false,
    minDate = '',
    onSelect = null
  }) => {
    if (!container) return null;

    const text = {
      previousMonth: labels.previousMonth || 'Mes anterior',
      nextMonth: labels.nextMonth || 'Mes siguiente',
      available: labels.available || 'Disponible',
      occupied: labels.occupied || 'Ocupado',
      blocked: labels.blocked || 'Bloqueado',
      selected: labels.selected || 'Seleccionado',
      legendTitle: labels.legendTitle || 'Leyenda',
      empty: labels.empty || 'Sin datos'
    };

    const state = {
      blocked: [],
      occupied: [],
      selectedStart: '',
      selectedEnd: '',
      currentMonth: getMonthStart(minDate || new Date()),
      minDate: normalizeDate(minDate),
      interactive: Boolean(interactive)
    };

    const monthFormatter = new Intl.DateTimeFormat(locale, {
      month: 'long',
      year: 'numeric'
    });
    const dayFormatter = new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    const weekdayNames = buildWeekdayNames(locale);

    const getDateState = (dateValue) => {
      if (!dateValue) return 'empty';
      const occupiedMatch = state.occupied.find((item) => isDateWithinOccupied(dateValue, item));
      if (occupiedMatch) return 'occupied';

      const blockedMatch = state.blocked.find((item) => isDateWithinBlock(dateValue, item));
      if (blockedMatch) return 'blocked';

      if (state.minDate && dateValue < state.minDate) return 'past';
      return 'available';
    };

    const buildLegend = () => `
      <div class="room-calendar__legend" aria-label="${text.legendTitle}">
        <span><i class="is-available"></i>${text.available}</span>
        <span><i class="is-occupied"></i>${text.occupied}</span>
        <span><i class="is-blocked"></i>${text.blocked}</span>
        <span><i class="is-selected"></i>${text.selected}</span>
      </div>
    `;

    const render = () => {
      const monthStart = getMonthStart(state.currentMonth);
      const monthIndex = monthStart.getMonth();
      const firstGridDay = new Date(monthStart);
      firstGridDay.setDate(monthStart.getDate() - monthStart.getDay());

      let daysHtml = '';
      for (let index = 0; index < 42; index += 1) {
        const date = new Date(firstGridDay);
        date.setDate(firstGridDay.getDate() + index);
        const dateValue = formatDate(date);
        const isCurrentMonth = date.getMonth() === monthIndex;
        const dateState = getDateState(dateValue);
        const isSelected = isDateWithinSelection(dateValue, state.selectedStart, state.selectedEnd);
        const isStart = state.selectedStart && dateValue === state.selectedStart;
        const isEnd = state.selectedEnd && dateValue === state.selectedEnd;
        const disabled = !isCurrentMonth || dateState === 'occupied' || dateState === 'blocked' || dateState === 'past';
        const classes = [
          'room-calendar__day',
          isCurrentMonth ? '' : 'room-calendar__day--muted',
          dateState ? `room-calendar__day--${dateState}` : '',
          isSelected ? 'room-calendar__day--selected' : '',
          isStart ? 'room-calendar__day--range-start' : '',
          isEnd ? 'room-calendar__day--range-end' : ''
        ].filter(Boolean).join(' ');

        const statusLabel = dateState === 'occupied'
          ? text.occupied
          : dateState === 'blocked'
            ? text.blocked
            : text.available;

        daysHtml += `
          <button
            class="${classes}"
            type="button"
            data-date="${dateValue}"
            ${disabled && state.interactive ? 'disabled' : ''}
            aria-label="${dayFormatter.format(date)} · ${statusLabel}"
          >
            <span>${date.getDate()}</span>
          </button>
        `;
      }

      container.innerHTML = `
        <div class="room-calendar">
          <div class="room-calendar__header">
            <button class="room-calendar__nav" type="button" data-nav="-1" aria-label="${text.previousMonth}">‹</button>
            <strong>${monthFormatter.format(monthStart)}</strong>
            <button class="room-calendar__nav" type="button" data-nav="1" aria-label="${text.nextMonth}">›</button>
          </div>
          ${buildLegend()}
          <div class="room-calendar__weekdays">
            ${weekdayNames.map((name) => `<span>${name}</span>`).join('')}
          </div>
          <div class="room-calendar__grid">
            ${daysHtml}
          </div>
        </div>
      `;

      container.querySelectorAll('[data-nav]').forEach((button) => {
        button.addEventListener('click', () => {
          const direction = Number(button.getAttribute('data-nav') || 0);
          const nextMonth = new Date(monthStart);
          nextMonth.setMonth(monthStart.getMonth() + direction);
          state.currentMonth = getMonthStart(nextMonth);
          render();
        });
      });

      container.querySelectorAll('[data-date]').forEach((button) => {
        button.addEventListener('click', () => {
          if (!state.interactive) return;

          const dateValue = button.getAttribute('data-date') || '';
          const dateState = getDateState(dateValue);
          if (!dateValue || dateState === 'occupied' || dateState === 'blocked' || dateState === 'past') {
            return;
          }

          if (!state.selectedStart || (state.selectedStart && state.selectedEnd && state.selectedStart !== state.selectedEnd)) {
            state.selectedStart = dateValue;
            state.selectedEnd = dateValue;
          } else if (dateValue < state.selectedStart) {
            state.selectedStart = dateValue;
            state.selectedEnd = dateValue;
          } else {
            state.selectedEnd = dateValue;
          }

          render();
          if (typeof onSelect === 'function') {
            onSelect({
              start: state.selectedStart,
              end: state.selectedEnd
            });
          }
        });
      });
    };

    const api = {
      setData({ blocked = [], occupied = [] } = {}) {
        state.blocked = Array.isArray(blocked) ? blocked : [];
        state.occupied = Array.isArray(occupied) ? occupied : [];
        render();
      },
      setSelection({ start = '', end = '' } = {}) {
        state.selectedStart = normalizeDate(start);
        state.selectedEnd = normalizeDate(end || start);
        render();
      },
      setMonth(value) {
        state.currentMonth = getMonthStart(value);
        render();
      },
      setMinDate(value) {
        state.minDate = normalizeDate(value);
        render();
      },
      clearSelection() {
        state.selectedStart = '';
        state.selectedEnd = '';
        render();
      },
      addDays
    };

    render();
    return api;
  };

  global.RoomCalendar = {
    create,
    addDays
  };
})(window);
