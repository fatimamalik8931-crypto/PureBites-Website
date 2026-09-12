// =========================================================
//  Pure Bites — admin dashboard (Phase 6)
//
//  A small single-page app on top of /api/admin/*. Plain JS, no
//  build step. Views: Overview, Orders, Reservations, Messages,
//  Menu, Account — switched by the URL hash (#orders, #menu…).
//
//  Security note: everything customers type (names, notes,
//  messages) is shown with textContent via the h() helper below —
//  never innerHTML — so submitted text can't inject markup/scripts.
// =========================================================

'use strict';

(() => {
  const API = '/api/admin';
  const TZ = 'Asia/Karachi';
  const $app = document.getElementById('app');
  const $toast = document.getElementById('toast');

  const state = { admin: null, meta: null };
  let routeToken = 0;

  // -------------------------------------------------------
  //  Helpers
  // -------------------------------------------------------

  /** Create an element. Strings become text nodes (safe); `on*` props become listeners. */
  function h(tag, props, ...children) {
    const el = document.createElement(tag);
    const p = props || {};
    for (const [key, val] of Object.entries(p)) {
      if (val == null || val === false || key === 'value') continue;
      if (key === 'class') el.className = val;
      else if (key.startsWith('on')) el.addEventListener(key.slice(2).toLowerCase(), val);
      else if (['checked', 'disabled', 'hidden', 'selected', 'required'].includes(key)) el[key] = true;
      else el.setAttribute(key, val === true ? '' : String(val));
    }
    for (const child of children.flat(Infinity)) {
      if (child == null || child === false) continue;
      el.append(child instanceof Node ? child : document.createTextNode(String(child)));
    }
    // Set value last, so a <select> already has its options.
    if (p.value != null) el.value = p.value;
    return el;
  }

  class ApiFailure extends Error {
    constructor(status, body) {
      super(body?.error?.message || 'Something went wrong. Please try again.');
      this.status = status;
      this.code = body?.error?.code;
      this.details = body?.error?.details;
      this.handled = false;
    }
  }

  /**
   * Call the admin API. Throws ApiFailure on any non-2xx.
   * A 401 (session expired) sends the user back to the login screen.
   */
  async function api(path, { method = 'GET', body, raw, contentType, allow401 = false } = {}) {
    const opts = { method, credentials: 'same-origin', headers: { Accept: 'application/json' } };
    if (raw) {
      opts.body = raw;
      opts.headers['Content-Type'] = contentType;
    } else if (body !== undefined) {
      opts.body = JSON.stringify(body);
      opts.headers['Content-Type'] = 'application/json';
    }

    let res;
    try {
      res = await fetch(API + path, opts);
    } catch {
      throw new ApiFailure(0, { error: { message: 'Could not reach the server. Check your connection.' } });
    }
    const data = await res.json().catch(() => ({}));

    if (res.status === 401 && !allow401) {
      state.admin = null;
      renderLogin('Your session has ended. Please sign in again.');
      const err = new ApiFailure(401, data);
      err.handled = true;
      throw err;
    }
    if (!res.ok) throw new ApiFailure(res.status, data);
    return data;
  }

  let toastTimer;
  function toast(message, kind = 'ok') {
    $toast.textContent = message;
    $toast.className = `toast ${kind === 'error' ? 'error' : ''}`;
    $toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => ($toast.hidden = true), 3500);
  }

  const reportError = (err) => {
    if (!err.handled) toast(err.message, 'error');
  };

  const fmtDateTime = (iso) =>
    new Intl.DateTimeFormat('en-PK', { timeZone: TZ, dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
  const fmtRs = (n) => `Rs. ${Number(n).toLocaleString('en-PK')}`;
  const label = (s) => String(s).replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
  const badge = (status, text) => h('span', { class: `badge s-${status}` }, text || label(status));

  function errorBox(message, retry) {
    return h(
      'div',
      { class: 'card error-box' },
      h('p', {}, message),
      retry && h('button', { class: 'btn', type: 'button', onclick: retry }, 'Try again'),
    );
  }

  /** A labelled form control with a slot for its server-side error message. */
  function field(text, name, control) {
    return h('label', { class: 'field', 'data-name': name }, h('span', { class: 'field-label' }, text), control, h('small', { class: 'err' }));
  }

  /** Put the API's per-field messages (error.details) under the matching fields. */
  function showFieldErrors(form, err, fallbackEl) {
    form.querySelectorAll('.field .err').forEach((el) => (el.textContent = ''));
    let shown = false;
    if (err.details && typeof err.details === 'object') {
      for (const [name, msgs] of Object.entries(err.details)) {
        const slot = form.querySelector(`.field[data-name="${CSS.escape(name)}"] .err`);
        if (slot) {
          slot.textContent = [].concat(msgs).join(' ');
          shown = true;
        }
      }
    }
    if (!shown) {
      if (fallbackEl) fallbackEl.textContent = err.message;
      else reportError(err);
    } else if (fallbackEl) {
      fallbackEl.textContent = '';
    }
  }

  // -------------------------------------------------------
  //  Auth
  // -------------------------------------------------------

  function renderLogin(notice = '', kind = 'error') {
    const message = h('p', { class: kind === 'error' ? 'form-error' : 'form-info', role: 'alert' }, notice);
    const button = h('button', { class: 'btn primary', type: 'submit' }, 'Sign in');
    const form = h(
      'form',
      {
        class: 'card login',
        onsubmit: async (e) => {
          e.preventDefault();
          const fd = new FormData(form);
          button.disabled = true;
          button.textContent = 'Signing in…';
          message.className = 'form-error';
          message.textContent = '';
          try {
            await api('/login', {
              method: 'POST',
              body: { email: fd.get('email'), password: fd.get('password') },
              allow401: true,
            });
            await boot();
          } catch (err) {
            message.textContent = err.message;
            button.disabled = false;
            button.textContent = 'Sign in';
          }
        },
      },
      h('h1', {}, 'Pure Bites ', h('span', {}, 'Admin')),
      field('Email', 'email', h('input', { name: 'email', type: 'email', autocomplete: 'username', required: true })),
      field('Password', 'password', h('input', { name: 'password', type: 'password', autocomplete: 'current-password', required: true })),
      message,
      button,
    );
    document.title = 'Sign in · Pure Bites Admin';
    $app.replaceChildren(h('main', { class: 'login-wrap' }, form));
    form.querySelector('input').focus();
  }

  async function logout() {
    try {
      await api('/logout', { method: 'POST', body: {}, allow401: true });
    } catch {
      /* the cookie is cleared server-side either way */
    }
    state.admin = null;
    renderLogin('You have been signed out.', 'info');
  }

  async function boot() {
    try {
      const { admin } = await api('/me', { allow401: true });
      state.admin = admin;
      state.meta = await api('/meta');
    } catch (err) {
      state.admin = null;
      renderLogin(err.status === 401 ? '' : err.message);
      return;
    }
    renderShell();
    route();
  }

  // -------------------------------------------------------
  //  Shell + routing
  // -------------------------------------------------------

  const VIEWS = {
    overview: ['Overview', viewOverview],
    orders: ['Orders', viewOrders],
    reservations: ['Reservations', viewReservations],
    messages: ['Messages', viewMessages],
    menu: ['Menu', viewMenu],
    account: ['Account', viewAccount],
  };

  function renderShell() {
    $app.replaceChildren(
      h(
        'header',
        { class: 'topbar' },
        h('a', { class: 'brand', href: '#overview' }, 'Pure Bites ', h('span', {}, 'Admin')),
        h(
          'div',
          { class: 'who' },
          h('span', { class: 'who-name muted' }, state.admin.name),
          h('a', { href: '/', target: '_blank', rel: 'noopener' }, 'View site'),
          h('button', { class: 'btn ghost small', type: 'button', onclick: logout }, 'Sign out'),
        ),
      ),
      h('nav', { class: 'nav' }, Object.entries(VIEWS).map(([key, [title]]) => h('a', { href: `#${key}`, 'data-view': key }, title))),
      h('main', { class: 'content', id: 'view' }),
    );
  }

  async function route() {
    const main = document.getElementById('view');
    if (!state.admin || !main) return;

    const key = location.hash.slice(1);
    const view = VIEWS[key] ? key : 'overview';
    document.querySelectorAll('.nav a').forEach((a) => a.classList.toggle('active', a.dataset.view === view));
    document.title = `${VIEWS[view][0]} · Pure Bites Admin`;
    main.replaceChildren(h('p', { class: 'muted' }, 'Loading…'));

    const token = ++routeToken;
    try {
      const node = await VIEWS[view][1]();
      if (token === routeToken) main.replaceChildren(node);
    } catch (err) {
      if (token === routeToken && !err.handled) main.replaceChildren(errorBox(err.message, route));
    }
  }

  window.addEventListener('hashchange', route);

  // -------------------------------------------------------
  //  Shared list view (filters + pagination)
  // -------------------------------------------------------

  /**
   * @param {object} cfg
   * @param {string} cfg.title
   * @param {string} cfg.path        API path, e.g. "/orders"
   * @param {object} cfg.defaults    initial query params
   * @param {(params, apply) => Node[]} cfg.filters
   * @param {(item, reload) => Node} cfg.renderItem
   * @param {string} cfg.empty
   */
  function listView({ title, path, defaults = {}, filters, renderItem, empty }) {
    const params = { page: 1, pageSize: 20, ...defaults };
    const box = h('div', { class: 'list' });
    const pager = h('div', { class: 'pager' });

    const apply = () => {
      params.page = 1;
      reload();
    };

    async function reload() {
      box.replaceChildren(h('p', { class: 'muted' }, 'Loading…'));
      pager.replaceChildren();
      try {
        const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null));
        const data = await api(`${path}?${qs}`);

        // Page emptied (e.g. last item on a page was deleted) → step back.
        if (data.items.length === 0 && data.page > 1) {
          params.page = data.totalPages;
          return reload();
        }

        box.replaceChildren(
          ...(data.items.length ? data.items.map((item) => renderItem(item, reload)) : [h('p', { class: 'card muted empty' }, empty)]),
        );
        if (data.totalPages > 1) {
          pager.replaceChildren(
            h('button', { class: 'btn ghost small', type: 'button', disabled: data.page <= 1, onclick: () => { params.page -= 1; reload(); } }, '← Previous'),
            h('span', {}, `Page ${data.page} of ${data.totalPages} · ${data.total} total`),
            h('button', { class: 'btn ghost small', type: 'button', disabled: data.page >= data.totalPages, onclick: () => { params.page += 1; reload(); } }, 'Next →'),
          );
        } else if (data.total > 0) {
          pager.replaceChildren(h('span', {}, `${data.total} total`));
        }
      } catch (err) {
        if (!err.handled) box.replaceChildren(errorBox(err.message, reload));
      }
    }

    const controls = h(
      'form',
      { class: 'filters', onsubmit: (e) => { e.preventDefault(); apply(); } },
      filters(params, apply),
    );

    reload();
    return h('section', {}, h('h2', {}, title), controls, box, pager);
  }

  function selectFilter(params, key, options, apply, ariaLabel) {
    return h(
      'select',
      { 'aria-label': ariaLabel, value: params[key] ?? '', onchange: (e) => { params[key] = e.target.value; apply(); } },
      options.map(([value, text]) => h('option', { value }, text)),
    );
  }

  function searchFilter(params, placeholder) {
    return [
      h('input', { type: 'search', placeholder, 'aria-label': 'Search', value: params.q ?? '', oninput: (e) => (params.q = e.target.value.trim()) }),
      h('button', { class: 'btn', type: 'submit' }, 'Search'),
    ];
  }

  const ACTION_LABELS = {
    confirmed: 'Confirm',
    preparing: 'Start preparing',
    out_for_delivery: 'Out for delivery',
    delivered: 'Mark delivered',
    cancelled: 'Cancel',
  };

  /** One button per allowed next status (the server tells us which moves are allowed). */
  function statusActions(nextStatuses, noun, send, onDone) {
    if (!nextStatuses?.length) return null;
    const wrap = h('div', { class: 'actions' });
    const setBusy = (busy) => wrap.querySelectorAll('button').forEach((b) => (b.disabled = busy));

    for (const status of nextStatuses) {
      const isCancel = status === 'cancelled';
      wrap.append(
        h(
          'button',
          {
            type: 'button',
            class: `btn ${isCancel ? 'ghost danger' : 'primary'}`,
            onclick: async () => {
              if (isCancel && !confirm(`Cancel this ${noun}? This can't be undone.`)) return;
              setBusy(true);
              try {
                await send(status);
                toast(`${label(noun)} marked ${label(status).toLowerCase()}.`);
                onDone();
              } catch (err) {
                reportError(err);
                if (err.code === 'INVALID_TRANSITION' || err.code === 'STALE') onDone();
                else setBusy(false);
              }
            },
          },
          ACTION_LABELS[status] || label(status),
        ),
      );
    }
    return wrap;
  }

  // -------------------------------------------------------
  //  Overview
  // -------------------------------------------------------

  function stat(title, value, href, alert = false) {
    return h(href ? 'a' : 'div', { class: `card stat${alert ? ' alert' : ''}`, href }, h('div', { class: 'label' }, title), h('div', { class: 'value' }, value));
  }

  async function viewOverview() {
    const [{ stats: s }, pending] = await Promise.all([api('/stats'), api('/orders?status=pending&pageSize=5')]);

    return h(
      'section',
      {},
      h('h2', {}, 'Overview'),
      h(
        'div',
        { class: 'stats' },
        stat('Orders today', s.orders.today, '#orders'),
        stat('Revenue today', fmtRs(s.orders.revenueToday)),
        stat('Pending orders', s.orders.pending, '#orders', s.orders.pending > 0),
        stat('Orders in progress', s.orders.inProgress, '#orders'),
        stat('Pending bookings', s.reservations.pending, '#reservations', s.reservations.pending > 0),
        stat('Upcoming bookings', s.reservations.upcoming, '#reservations'),
        stat('Unread messages', s.messages.unhandled, '#messages', s.messages.unhandled > 0),
        stat('Menu items', s.menu.hidden ? `${s.menu.total} (${s.menu.hidden} hidden)` : s.menu.total, '#menu'),
      ),
      h('h3', {}, 'Orders waiting for confirmation'),
      pending.items.length
        ? h('div', { class: 'list' }, pending.items.map((o) => orderCard(o, route)))
        : h('p', { class: 'card muted empty' }, 'No pending orders right now.'),
      pending.total > pending.items.length && h('p', {}, h('a', { href: '#orders' }, `See all ${pending.total} pending orders →`)),
    );
  }

  // -------------------------------------------------------
  //  Orders
  // -------------------------------------------------------

  function orderCard(o, onChange) {
    const count = o.items.reduce((n, l) => n + l.quantity, 0);
    const summary = o.items.map((l) => `${l.quantity}× ${l.name}`).join(', ');

    return h(
      'article',
      { class: 'card' },
      h(
        'div',
        { class: 'row-head' },
        h(
          'div',
          {},
          h('strong', { class: 'mono' }, o.reference),
          badge(o.status),
          h('span', { class: 'pill' }, o.paymentMethod === 'online' ? 'Online payment requested' : 'Cash on delivery'),
        ),
        h('div', { class: 'amount' }, fmtRs(o.total)),
      ),
      h('div', { class: 'meta' }, `Placed ${fmtDateTime(o.createdAt)}`),
      h(
        'div',
        { class: 'grid2' },
        h('div', {}, h('div', { class: 'label' }, 'Customer'), h('div', {}, o.customerName), h('a', { href: `tel:${o.phone}` }, o.phone)),
        h('div', {}, h('div', { class: 'label' }, 'Deliver to'), h('div', {}, o.address)),
      ),
      o.note && h('p', { class: 'note' }, h('strong', {}, 'Note: '), o.note),
      h(
        'details',
        {},
        h('summary', {}, `${count} item${count === 1 ? '' : 's'} — ${summary}`),
        h(
          'div',
          { class: 'table-wrap' },
          h(
            'table',
            { class: 'lines' },
            h(
              'tbody',
              {},
              o.items.map((l) =>
                h(
                  'tr',
                  {},
                  h('td', {}, `${l.quantity} ×`),
                  h('td', {}, l.name, ' ', h('span', { class: 'muted mono' }, l.menuItemCode)),
                  h('td', { class: 'num' }, fmtRs(l.unitPrice)),
                  h('td', { class: 'num' }, fmtRs(l.lineTotal)),
                ),
              ),
            ),
            h(
              'tfoot',
              {},
              h('tr', {}, h('td', { colspan: 3 }, 'Subtotal'), h('td', { class: 'num' }, fmtRs(o.subtotal))),
              h('tr', {}, h('td', { colspan: 3 }, 'Delivery'), h('td', { class: 'num' }, fmtRs(o.deliveryFee))),
              h('tr', { class: 'total' }, h('td', { colspan: 3 }, 'Total'), h('td', { class: 'num' }, fmtRs(o.total))),
            ),
          ),
        ),
      ),
      statusActions(o.nextStatuses, 'order', (status) => api(`/orders/${o.id}/status`, { method: 'PATCH', body: { status } }), onChange),
    );
  }

  function viewOrders() {
    return listView({
      title: 'Orders',
      path: '/orders',
      filters: (params, apply) => [
        selectFilter(params, 'status', [['', 'All statuses'], ...state.meta.orderStatuses.map((s) => [s, label(s)])], apply, 'Status'),
        searchFilter(params, 'Reference, name or phone'),
      ],
      renderItem: orderCard,
      empty: 'No orders match.',
    });
  }

  // -------------------------------------------------------
  //  Reservations
  // -------------------------------------------------------

  function reservationCard(r, onChange) {
    return h(
      'article',
      { class: 'card' },
      h(
        'div',
        { class: 'row-head' },
        h('div', {}, h('strong', {}, `${r.date} at ${r.time}`), badge(r.status), new Date(r.reservedAt) < new Date() && h('span', { class: 'pill' }, 'Past')),
        h('div', { class: 'amount' }, `${r.guests} guest${r.guests === 1 ? '' : 's'}`),
      ),
      h('div', { class: 'meta' }, `Requested ${fmtDateTime(r.createdAt)}`),
      h(
        'div',
        { class: 'grid2' },
        h('div', {}, h('div', { class: 'label' }, 'Guest'), h('div', {}, r.name), h('a', { href: `tel:${r.phone}` }, r.phone)),
        h('div', {}, h('div', { class: 'label' }, 'Seating'), h('div', {}, r.seating)),
      ),
      r.note && h('p', { class: 'note' }, h('strong', {}, 'Note: '), r.note),
      statusActions(r.nextStatuses, 'reservation', (status) => api(`/reservations/${r.id}/status`, { method: 'PATCH', body: { status } }), onChange),
    );
  }

  function viewReservations() {
    return listView({
      title: 'Reservations',
      path: '/reservations',
      defaults: { when: 'upcoming' },
      filters: (params, apply) => [
        selectFilter(params, 'when', [['upcoming', 'Upcoming'], ['past', 'Past'], ['all', 'All dates']], apply, 'When'),
        selectFilter(params, 'status', [['', 'All statuses'], ...state.meta.reservationStatuses.map((s) => [s, label(s)])], apply, 'Status'),
        searchFilter(params, 'Name or phone'),
      ],
      renderItem: reservationCard,
      empty: 'No reservations match.',
    });
  }

  // -------------------------------------------------------
  //  Messages
  // -------------------------------------------------------

  function messageCard(m, onChange) {
    const buttons = h('div', { class: 'actions' });
    const busy = (b) => buttons.querySelectorAll('button').forEach((x) => (x.disabled = b));

    buttons.append(
      h(
        'button',
        {
          type: 'button',
          class: `btn ${m.isHandled ? 'ghost' : 'primary'}`,
          onclick: async () => {
            busy(true);
            try {
              await api(`/messages/${m.id}`, { method: 'PATCH', body: { isHandled: !m.isHandled } });
              toast(m.isHandled ? 'Marked as new.' : 'Marked as handled.');
              onChange();
            } catch (err) {
              reportError(err);
              busy(false);
            }
          },
        },
        m.isHandled ? 'Mark as new' : 'Mark handled',
      ),
      h('a', { class: 'btn ghost', href: `mailto:${m.email}?subject=${encodeURIComponent('Re: your message to Pure Bites')}` }, 'Reply by email'),
      h(
        'button',
        {
          type: 'button',
          class: 'btn ghost danger',
          onclick: async () => {
            if (!confirm(`Delete this message from ${m.name}? This can't be undone.`)) return;
            busy(true);
            try {
              await api(`/messages/${m.id}`, { method: 'DELETE' });
              toast('Message deleted.');
              onChange();
            } catch (err) {
              reportError(err);
              busy(false);
            }
          },
        },
        'Delete',
      ),
    );

    return h(
      'article',
      { class: 'card' },
      h(
        'div',
        { class: 'row-head' },
        h('div', {}, h('strong', {}, m.name), badge(m.isHandled ? 'handled' : 'new', m.isHandled ? 'Handled' : 'New')),
        h('div', { class: 'meta' }, fmtDateTime(m.createdAt)),
      ),
      h('a', { href: `mailto:${m.email}` }, m.email),
      h('p', { class: 'message-body' }, m.message),
      buttons,
    );
  }

  function viewMessages() {
    return listView({
      title: 'Messages',
      path: '/messages',
      defaults: { handled: 'false' },
      filters: (params, apply) => [
        selectFilter(params, 'handled', [['false', 'New'], ['true', 'Handled'], ['', 'All']], apply, 'Show'),
        searchFilter(params, 'Name, email or text'),
      ],
      renderItem: messageCard,
      empty: 'No messages here.',
    });
  }

  // -------------------------------------------------------
  //  Menu
  // -------------------------------------------------------

  function viewMenu() {
    const body = h('div', {}, h('p', { class: 'muted' }, 'Loading…'));
    let categories = state.meta.menuCategories;

    async function reload() {
      try {
        const data = await api('/menu');
        categories = data.categories;
        body.replaceChildren(menuTable(data.items));
      } catch (err) {
        if (!err.handled) body.replaceChildren(errorBox(err.message, reload));
      }
    }

    function toggle(item, key, input) {
      return async () => {
        input.disabled = true;
        try {
          await api(`/menu/${encodeURIComponent(item.code)}`, { method: 'PATCH', body: { [key]: input.checked } });
          item[key] = input.checked;
          toast(`${item.name}: ${key === 'isAvailable' ? (input.checked ? 'shown on the site' : 'hidden from the site') : input.checked ? 'featured' : 'no longer featured'}.`);
          input.closest('tr')?.classList.toggle('is-hidden', !item.isAvailable);
        } catch (err) {
          input.checked = !input.checked;
          reportError(err);
        } finally {
          input.disabled = false;
        }
      };
    }

    function menuTable(items) {
      if (!items.length) return h('p', { class: 'card muted empty' }, 'The menu is empty. Add your first item.');

      return h(
        'div',
        { class: 'card table-wrap' },
        h(
          'table',
          {},
          h(
            'thead',
            {},
            h('tr', {}, h('th', {}, ''), h('th', {}, 'Item'), h('th', {}, 'Category'), h('th', { class: 'num' }, 'Price'), h('th', {}, 'On site'), h('th', {}, 'Featured'), h('th', { class: 'num' }, 'Order'), h('th', {}, '')),
          ),
          h(
            'tbody',
            {},
            items.map((item) => {
              const available = h('input', { type: 'checkbox', checked: item.isAvailable, 'aria-label': `Show ${item.name} on the site` });
              const featured = h('input', { type: 'checkbox', checked: item.isFeatured, 'aria-label': `Feature ${item.name}` });
              available.addEventListener('change', toggle(item, 'isAvailable', available));
              featured.addEventListener('change', toggle(item, 'isFeatured', featured));

              return h(
                'tr',
                { class: item.isAvailable ? '' : 'is-hidden' },
                h('td', {}, h('img', { class: 'thumb', src: item.imageUrl, alt: '', loading: 'lazy' })),
                h('td', {}, h('strong', {}, item.name), ' ', item.tag && badge('new', item.tag), h('div', { class: 'muted mono' }, item.code)),
                h('td', {}, label(item.category)),
                h('td', { class: 'num' }, fmtRs(item.price)),
                h('td', {}, available),
                h('td', {}, featured),
                h('td', { class: 'num' }, item.sortOrder),
                h(
                  'td',
                  { class: 'num' },
                  h('button', { class: 'btn small', type: 'button', onclick: () => openMenuEditor(item, categories, reload) }, 'Edit'),
                  ' ',
                  h(
                    'button',
                    {
                      class: 'btn small ghost danger',
                      type: 'button',
                      onclick: async () => {
                        const ok = confirm(
                          `Delete "${item.name}" permanently?\n\nPast orders keep their own copy of it. ` +
                            'To take it off the site for now, untick "On site" instead.',
                        );
                        if (!ok) return;
                        try {
                          await api(`/menu/${encodeURIComponent(item.code)}`, { method: 'DELETE' });
                          toast(`Deleted "${item.name}".`);
                          reload();
                        } catch (err) {
                          reportError(err);
                        }
                      },
                    },
                    'Delete',
                  ),
                ),
              );
            }),
          ),
        ),
      );
    }

    reload();
    return h(
      'section',
      {},
      h(
        'div',
        { class: 'toolbar' },
        h('h2', {}, 'Menu'),
        h('button', { class: 'btn primary', type: 'button', onclick: () => openMenuEditor(null, categories, reload) }, '+ Add item'),
      ),
      h('p', { class: 'muted' }, 'Changes appear on the public site the next time a visitor loads the page. Lower "Order" numbers show first.'),
      body,
    );
  }

  function openMenuEditor(item, categories, onSaved) {
    const isNew = !item;
    const v = item || { code: '', category: categories[0], name: '', description: '', price: '', tag: '', imageUrl: '', isAvailable: true, isFeatured: false, sortOrder: '' };

    const preview = h('img', { class: 'preview', alt: 'Image preview', src: v.imageUrl || null });
    const imageUrl = h('input', { name: 'imageUrl', value: v.imageUrl, placeholder: 'Upload a photo, or paste an images.unsplash.com link' });
    imageUrl.addEventListener('input', () => preview.setAttribute('src', imageUrl.value.trim()));

    const fileInput = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp' });
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        toast('That image is over 2 MB — please pick a smaller one.', 'error');
        fileInput.value = '';
        return;
      }
      fileInput.disabled = true;
      try {
        const { url } = await api('/uploads', { method: 'POST', raw: file, contentType: file.type });
        imageUrl.value = url;
        preview.setAttribute('src', url);
        toast('Image uploaded.');
      } catch (err) {
        reportError(err);
      } finally {
        fileInput.disabled = false;
        fileInput.value = '';
      }
    });

    const formError = h('p', { class: 'form-error', role: 'alert' });
    const save = h('button', { class: 'btn primary', type: 'submit' }, isNew ? 'Add item' : 'Save changes');
    const dialog = h('dialog', {});

    const form = h(
      'form',
      {
        class: 'editor',
        onsubmit: async (e) => {
          e.preventDefault();
          const fd = new FormData(form);
          const body = {
            category: fd.get('category'),
            name: fd.get('name'),
            description: fd.get('description'),
            price: fd.get('price') === '' ? '' : Number(fd.get('price')),
            tag: fd.get('tag'),
            imageUrl: imageUrl.value.trim(),
            isAvailable: form.elements.isAvailable.checked,
            isFeatured: form.elements.isFeatured.checked,
          };
          if (fd.get('sortOrder') !== '') body.sortOrder = Number(fd.get('sortOrder'));
          if (isNew) body.code = fd.get('code');

          save.disabled = true;
          try {
            const path = isNew ? '/menu' : `/menu/${encodeURIComponent(item.code)}`;
            await api(path, { method: isNew ? 'POST' : 'PATCH', body });
            dialog.close();
            toast(isNew ? `Added "${body.name}".` : `Saved "${body.name}".`);
            onSaved();
          } catch (err) {
            if (!err.handled) showFieldErrors(form, err, formError);
            save.disabled = false;
          }
        },
      },
      h('h3', {}, isNew ? 'Add menu item' : `Edit ${item.name}`),
      h(
        'div',
        { class: 'row' },
        isNew
          ? field('Code (short, unique)', 'code', h('input', { name: 'code', required: true, maxlength: 20, placeholder: 'e.g. b7' }))
          : field('Code', 'code', h('input', { value: item.code, disabled: true })),
        field('Category', 'category', h('select', { name: 'category', value: v.category }, categories.map((c) => h('option', { value: c }, label(c))))),
      ),
      field('Name', 'name', h('input', { name: 'name', value: v.name, required: true, maxlength: 80 })),
      field('Description', 'description', h('textarea', { name: 'description', value: v.description, required: true, maxlength: 300, rows: 3 })),
      h(
        'div',
        { class: 'row' },
        field('Price (Rs.)', 'price', h('input', { name: 'price', type: 'number', min: 1, step: 1, value: v.price, required: true })),
        field('Badge (optional)', 'tag', h('input', { name: 'tag', value: v.tag, maxlength: 30, placeholder: 'e.g. Bestseller' })),
        field('Order', 'sortOrder', h('input', { name: 'sortOrder', type: 'number', min: 0, step: 1, value: v.sortOrder, placeholder: isNew ? 'End of menu' : '' })),
      ),
      h('div', { class: 'image-row' }, preview, h('div', { class: 'field', 'data-name': 'imageUrl' }, h('span', { class: 'field-label' }, 'Photo (JPEG, PNG or WebP, max 2 MB)'), fileInput, imageUrl, h('small', { class: 'err' }))),
      h(
        'div',
        { class: 'row' },
        h('label', { class: 'check' }, h('input', { type: 'checkbox', name: 'isAvailable', checked: v.isAvailable }), 'Show on the site'),
        h('label', { class: 'check' }, h('input', { type: 'checkbox', name: 'isFeatured', checked: v.isFeatured }), 'Featured'),
      ),
      formError,
      h('div', { class: 'editor-actions' }, h('button', { class: 'btn ghost', type: 'button', onclick: () => dialog.close() }, 'Cancel'), save),
    );

    dialog.append(form);
    dialog.addEventListener('close', () => dialog.remove());
    document.body.append(dialog);
    dialog.showModal();
  }

  // -------------------------------------------------------
  //  Account
  // -------------------------------------------------------

  function viewAccount() {
    const info = h('p', { class: 'form-info', role: 'status' });
    const formError = h('p', { class: 'form-error', role: 'alert' });
    const save = h('button', { class: 'btn primary', type: 'submit' }, 'Change password');

    const form = h(
      'form',
      {
        class: 'card editor',
        onsubmit: async (e) => {
          e.preventDefault();
          const fd = new FormData(form);
          info.textContent = '';
          form.querySelectorAll('.field .err').forEach((el) => (el.textContent = ''));
          if (fd.get('newPassword') !== fd.get('confirmPassword')) {
            form.querySelector('[data-name="confirmPassword"] .err').textContent = 'The two new passwords don’t match.';
            return;
          }
          save.disabled = true;
          try {
            await api('/password', { method: 'PATCH', body: { currentPassword: fd.get('currentPassword'), newPassword: fd.get('newPassword') } });
            form.reset();
            formError.textContent = '';
            info.textContent = 'Password changed.';
          } catch (err) {
            if (!err.handled) showFieldErrors(form, err, formError);
          } finally {
            save.disabled = false;
          }
        },
      },
      h('h3', {}, 'Change password'),
      field('Current password', 'currentPassword', h('input', { name: 'currentPassword', type: 'password', autocomplete: 'current-password', required: true })),
      field('New password (at least 10 characters)', 'newPassword', h('input', { name: 'newPassword', type: 'password', autocomplete: 'new-password', minlength: 10, required: true })),
      field('Repeat new password', 'confirmPassword', h('input', { name: 'confirmPassword', type: 'password', autocomplete: 'new-password', required: true })),
      formError,
      info,
      h('div', {}, save),
    );

    return h(
      'section',
      {},
      h('h2', {}, 'Account'),
      h('div', { class: 'card', style: 'margin-bottom:16px' }, h('div', { class: 'label' }, 'Signed in as'), h('div', {}, h('strong', {}, state.admin.name), ' · ', state.admin.email)),
      form,
    );
  }

  boot();
})();
