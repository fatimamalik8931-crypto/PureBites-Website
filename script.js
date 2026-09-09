/* =========================================================
   PURE BITES — script.js
   Sections:
     1. Menu data
     2. Helpers
     3. Menu rendering + category filter
     4. Cart (add / quantity / remove / totals)
     5. Reservation form
     6. Contact form
     7. Navigation, scroll reveal, misc
   ========================================================= */

'use strict';

/* =========================================================
   1. MENU DATA
   One array is the single source of truth. Add an item here
   and it appears on the site automatically — no HTML editing.
   ========================================================= */
const FALLBACK_MENU_ITEMS = [
  // ---------- BURGERS ----------
  { id: 'b1', cat: 'burgers', name: 'Pure Signature Burger', price: 750, tag: 'Chef’s Pick',
    desc: 'Double smashed beef, aged cheddar, house sauce, brioche bun.',
    img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80' },

  { id: 'b2', cat: 'burgers', name: 'Classic Beef Burger', price: 550, tag: '',
    desc: 'Hand-pressed patty, lettuce, tomato, pickles, mayo.',
    img: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=600&q=80' },

  { id: 'b3', cat: 'burgers', name: 'Crispy Chicken Burger', price: 520, tag: '',
    desc: 'Buttermilk-marinated fillet, slaw, garlic aioli.',
    img: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=600&q=80' },

  { id: 'b4', cat: 'burgers', name: 'Double Cheese Smash', price: 850, tag: 'Bestseller',
    desc: 'Two patties, four slices of cheese. Bring an appetite.',
    img: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80' },

  { id: 'b5', cat: 'burgers', name: 'Zinger Tower', price: 690, tag: 'Spicy',
    desc: 'Spicy fillet, hash brown, cheese, chipotle mayo.',
    img: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=600&q=80' },

  // ---------- SANDWICHES ----------
  { id: 's1', cat: 'sandwiches', name: 'Grilled Chicken Sandwich', price: 450, tag: '',
    desc: 'Char-grilled chicken, lettuce, herb mayo, toasted sourdough.',
    img: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80' },

  { id: 's2', cat: 'sandwiches', name: 'Triple-Decker Club', price: 520, tag: '',
    desc: 'Chicken, egg, cheese and salad stacked three layers high.',
    img: 'https://images.unsplash.com/photo-1567234669003-dce7a7a88821?auto=format&fit=crop&w=600&q=80' },

  { id: 's3', cat: 'sandwiches', name: 'Beef Steak Sandwich', price: 620, tag: 'Popular',
    desc: 'Seared beef strips, caramelised onion, melted mozzarella.',
    img: 'https://images.unsplash.com/photo-1539252554453-80ab65ce3586?auto=format&fit=crop&w=600&q=80' },

  { id: 's4', cat: 'sandwiches', name: 'Veggie Melt', price: 380, tag: '',
    desc: 'Grilled peppers, mushroom, olives and cheese on rye.',
    img: 'https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&w=600&q=80' },

  // ---------- SIDES ----------
  { id: 'f1', cat: 'sides', name: 'Loaded Fries', price: 350, tag: 'Bestseller',
    desc: 'Crispy fries under cheese sauce, jalapeños and herbs.',
    img: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80' },

  { id: 'f2', cat: 'sides', name: 'Masala Fries', price: 250, tag: '',
    desc: 'Golden fries tossed in our own chaat masala blend.',
    img: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=600&q=80' },

  { id: 'f3', cat: 'sides', name: 'Crispy Wings (6 pcs)', price: 480, tag: 'Spicy',
    desc: 'Double-fried wings glazed in hot honey or BBQ.',
    img: 'https://images.unsplash.com/photo-1608039755401-742074f0548d?auto=format&fit=crop&w=600&q=80' },

  { id: 'f4', cat: 'sides', name: 'Onion Rings', price: 280, tag: '',
    desc: 'Thick-cut rings in a light, crunchy batter.',
    img: 'https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&w=600&q=80' },

  // ---------- DRINKS ----------
  { id: 'd1', cat: 'drinks', name: 'Fresh Lemonade', price: 200, tag: '',
    desc: 'Chilled, lightly sweet, squeezed to order.',
    img: 'https://images.unsplash.com/photo-1523677011781-c91d1bbe2f9e?auto=format&fit=crop&w=600&q=80' },

  { id: 'd2', cat: 'drinks', name: 'Mint Margarita', price: 250, tag: 'Popular',
    desc: 'Fresh mint, lemon and crushed ice. Non-alcoholic.',
    img: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=600&q=80' },

  { id: 'd3', cat: 'drinks', name: 'Cold Coffee', price: 300, tag: '',
    desc: 'Double-shot espresso blended with milk and ice.',
    img: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=600&q=80' }
];

// The menu the page actually renders. It starts as the built-in fallback
// list above, then initMenu() (section 3) swaps in live data from the
// backend: GET /api/menu. If that request fails, the fallback stays —
// the site is never left without a menu.
let MENU_ITEMS = FALLBACK_MENU_ITEMS;

const DELIVERY_FREE_OVER = 0; // delivery is free — change this to charge above/below a threshold

/* =========================================================
   2. HELPERS
   ========================================================= */

// Short alias for querySelector. Returns null safely if missing.
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// Format a number as Pakistani rupees with thousands separators.
const rs = (n) => 'Rs. ' + n.toLocaleString('en-PK');

// Escape user/data text before putting it into innerHTML.
// Prevents broken markup and XSS if menu data ever comes from an API.
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Toast notification — small message that slides up from the bottom.
let toastTimer;
function toast(message) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

/* =========================================================
   3. MENU RENDERING + FILTER
   ========================================================= */
const menuGrid  = $('#menuGrid');
const menuEmpty = $('#menuEmpty');

// Remembers which category tab is active, so a re-render triggered by
// the menu finishing loading keeps the user's current filter.
let activeFilter = 'all';

function renderMenu(filter = 'all') {
  if (!menuGrid) return;

  const items = filter === 'all'
    ? MENU_ITEMS
    : MENU_ITEMS.filter(item => item.cat === filter);

  if (items.length === 0) {
    menuGrid.innerHTML = '';
    if (menuEmpty) {
      // Distinguish "this category is empty" from "the whole menu is empty".
      menuEmpty.textContent = MENU_ITEMS.length === 0
        ? 'Our menu is being updated — please check back shortly.'
        : 'No items in this category yet.';
      menuEmpty.hidden = false;
    }
    return;
  }
  if (menuEmpty) menuEmpty.hidden = true;

  menuGrid.innerHTML = items.map((item, i) => `
    <article class="menu-card" style="animation-delay:${i * 45}ms">
      <div class="menu-thumb">
        <img src="${esc(item.img)}" alt="${esc(item.name)}" loading="lazy"
             onerror="this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22400%22%3E%3Crect width=%22600%22 height=%22400%22 fill=%22%23F3EEE6%22/%3E%3Ctext x=%22300%22 y=%22215%22 font-size=%2260%22 text-anchor=%22middle%22%3E%F0%9F%8D%BD%EF%B8%8F%3C/text%3E%3C/svg%3E'">
        ${item.tag ? `<span class="menu-tag ${/spicy|bestseller/i.test(item.tag) ? 'hot' : ''}">${esc(item.tag)}</span>` : ''}
      </div>
      <div class="menu-body">
        <div class="menu-title-row">
          <h3>${esc(item.name)}</h3>
          <span class="menu-price">${rs(item.price)}</span>
        </div>
        <p class="menu-desc">${esc(item.desc)}</p>
        <button class="add-btn" data-id="${esc(item.id)}">Add to Order</button>
      </div>
    </article>
  `).join('');
}

// Category tabs
const filterTabs = $('#filterTabs');
if (filterTabs) {
  filterTabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.tab');
    if (!tab) return;

    $$('.tab', filterTabs).forEach(t => {
      const active = t === tab;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', String(active));
    });

    activeFilter = tab.dataset.filter;
    renderMenu(activeFilter);
  });
}

/* ---------------------------------------------------------
   Menu loading — fetch the live menu from the API on page load.
   While the request is in flight we show skeleton cards; if it
   fails we fall back to FALLBACK_MENU_ITEMS and show a small note.
   The design is unchanged — these are just states of the same
   menu section.
   --------------------------------------------------------- */
function renderMenuSkeleton(count = 6) {
  if (!menuGrid) return;
  if (menuEmpty) menuEmpty.hidden = true;
  menuGrid.innerHTML = Array.from({ length: count }).map(() => `
    <article class="menu-card menu-card--skeleton" aria-hidden="true">
      <div class="menu-thumb sk"></div>
      <div class="menu-body">
        <span class="sk sk-line" style="width:70%"></span>
        <span class="sk sk-line" style="width:45%"></span>
        <span class="sk sk-btn"></span>
      </div>
    </article>
  `).join('');
}

// Shows / hides the small line above the grid. Pass an onRetry callback
// to append a "Try again" button (reuses the existing .link-btn style).
function setMenuNote(message, onRetry) {
  if (!menuGrid) return;
  let note = $('#menuNote');

  if (!message) {
    if (note) { note.hidden = true; note.textContent = ''; }
    return;
  }

  if (!note) {
    note = document.createElement('p');
    note.id = 'menuNote';
    note.className = 'menu-note';
    note.setAttribute('role', 'status');
    menuGrid.before(note);
  }

  note.textContent = message;

  if (typeof onRetry === 'function') {
    note.append(' ');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'link-btn';
    btn.textContent = 'Try again';
    btn.addEventListener('click', () => { setMenuNote(''); onRetry(); });
    note.append(btn);
  }

  note.hidden = false;
}

async function initMenu() {
  renderMenuSkeleton();

  try {
    const res = await fetch('/api/menu', { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    if (!data || !Array.isArray(data.items)) throw new Error('Malformed menu response');

    // A genuinely empty list is a valid response, not an error — let
    // renderMenu() show the "menu is being updated" empty state.
    MENU_ITEMS = data.items;
    setMenuNote('');
  } catch (err) {
    console.warn('[menu] Live menu unavailable, using built-in list:', err.message);
    MENU_ITEMS = FALLBACK_MENU_ITEMS;
    setMenuNote('Showing our standard menu — live prices could not be loaded just now.', initMenu);
  } finally {
    renderMenu(activeFilter);
  }
}

/* =========================================================
   4. CART
   Stored as objects with a quantity, so adding the same item
   twice increases qty instead of creating a duplicate row.
   ========================================================= */
let cart = []; // [{ id, name, price, img, qty }]

const orderList     = $('#orderList');
const orderSummary  = $('#orderSummary');
const orderSubtotal = $('#orderSubtotal');
const orderTotalEl  = $('#orderTotal');
const orderMessage  = $('#orderMessage');
const placeOrderBtn = $('#placeOrder');
const clearOrderBtn = $('#clearOrder');
const payChoice     = $('#payChoice');
const orderFields   = $('#orderFields');
const cartCount     = $('#cartCount');

function cartQty()   { return cart.reduce((sum, i) => sum + i.qty, 0); }
function cartTotal() { return cart.reduce((sum, i) => sum + i.price * i.qty, 0); }

function addToCart(id) {
  const item = MENU_ITEMS.find(m => m.id === id);
  if (!item) return;

  const existing = cart.find(c => c.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id: item.id, name: item.name, price: item.price, img: item.img, qty: 1 });
  }

  if (orderMessage) { orderMessage.textContent = ''; orderMessage.classList.remove('error'); }
  renderCart();
  toast(`${item.name} added to your order`);
}

function changeQty(id, delta) {
  const line = cart.find(c => c.id === id);
  if (!line) return;

  line.qty += delta;
  if (line.qty <= 0) cart = cart.filter(c => c.id !== id);
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter(c => c.id !== id);
  renderCart();
}

function renderCart() {
  if (!orderList) return;

  // --- Badge in the header ---
  if (cartCount) {
    const qty = cartQty();
    cartCount.textContent = qty;
    cartCount.classList.toggle('visible', qty > 0);
    if (qty > 0) {
      cartCount.classList.remove('bump');
      void cartCount.offsetWidth;      // force reflow so the animation replays
      cartCount.classList.add('bump');
    }
  }

  // --- Empty state ---
  if (cart.length === 0) {
    orderList.innerHTML =
      '<li class="order-empty">Nothing here yet — add something from the menu.</li>';
    if (orderSummary)  orderSummary.hidden  = true;
    if (orderFields)   orderFields.hidden   = true;
    if (payChoice)     payChoice.hidden     = true;
    if (clearOrderBtn) clearOrderBtn.hidden = true;
    return;
  }

  if (orderSummary)  orderSummary.hidden  = false;
  if (orderFields)   orderFields.hidden   = false;
  if (payChoice)     payChoice.hidden     = false;
  if (clearOrderBtn) clearOrderBtn.hidden = false;

  // --- Line items ---
  orderList.innerHTML = cart.map(item => `
    <li>
      <img class="oi-thumb" src="${esc(item.img)}" alt="" loading="lazy">
      <span class="oi-info">
        <span class="oi-name">${esc(item.name)}</span>
        <span class="oi-unit">${rs(item.price)} each</span>
      </span>
      <span class="qty">
        <button data-action="dec" data-id="${esc(item.id)}" aria-label="Decrease quantity of ${esc(item.name)}">−</button>
        <span>${item.qty}</span>
        <button data-action="inc" data-id="${esc(item.id)}" aria-label="Increase quantity of ${esc(item.name)}">+</button>
      </span>
      <span class="oi-line">${rs(item.price * item.qty)}</span>
      <button class="remove-btn" data-action="remove" data-id="${esc(item.id)}" aria-label="Remove ${esc(item.name)}">×</button>
    </li>
  `).join('');

  // --- Totals ---
  const subtotal = cartTotal();
  if (orderSubtotal) orderSubtotal.textContent = rs(subtotal);
  if (orderTotalEl)  orderTotalEl.textContent  = rs(subtotal + DELIVERY_FREE_OVER);
}

// Event delegation: one listener on the menu grid handles every Add button,
// including cards that don't exist yet when this line runs.
if (menuGrid) {
  menuGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.add-btn');
    if (!btn) return;

    addToCart(btn.dataset.id);

    // Brief visual confirmation on the button itself
    const original = btn.textContent;
    btn.textContent = '✓ Added';
    btn.classList.add('added');
    setTimeout(() => { btn.textContent = original; btn.classList.remove('added'); }, 1100);
  });
}

// One listener handles +, −, and remove for every row.
if (orderList) {
  orderList.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const { action, id } = btn.dataset;
    if (action === 'inc')    changeQty(id, 1);
    if (action === 'dec')    changeQty(id, -1);
    if (action === 'remove') removeFromCart(id);
  });
}

if (clearOrderBtn) {
  clearOrderBtn.addEventListener('click', () => {
    cart = [];
    renderCart();
    toast('Order cleared');
  });
}

// Maps an API field name back to its form control, so server-side
// validation errors land under the right field.
function orderFieldInput(field) {
  return {
    customerName: $('#ordName'),
    phone:        $('#ordPhone'),
    address:      $('#ordAddress'),
    note:         $('#ordNote'),
  }[field] || null;
}

function validateOrderDetails() {
  let ok = true;
  const name    = $('#ordName');
  const phone   = $('#ordPhone');
  const address = $('#ordAddress');

  if (name && name.value.trim().length < 3) {
    setError(name, 'Please enter your full name.'); ok = false;
  } else if (name) setError(name, '');

  const digits = phone ? phone.value.replace(/[\s-]/g, '') : '';
  if (!/^(\+92|0)3\d{9}$/.test(digits)) {
    setError(phone, 'Enter a valid Pakistani mobile number.'); ok = false;
  } else setError(phone, '');

  if (address && address.value.trim().length < 10) {
    setError(address, 'Please enter a complete delivery address.'); ok = false;
  } else if (address) setError(address, '');

  return ok;
}

if (placeOrderBtn) {
  placeOrderBtn.addEventListener('click', async () => {
    if (!orderMessage) return;

    if (cart.length === 0) {
      orderMessage.textContent = 'Please add at least one item before ordering.';
      orderMessage.classList.add('error');
      return;
    }

    if (!validateOrderDetails()) {
      orderMessage.textContent = 'Please fill in your delivery details above.';
      orderMessage.classList.add('error');
      return;
    }

    const method = $('input[name="pay"]:checked');
    const payment = method && method.value === 'online' ? 'online' : 'cod';
    const label = payment === 'online' ? 'Online payment' : 'Cash on delivery';

    // The server re-prices everything from the database — we send only
    // which items and how many.
    const payload = {
      customerName: $('#ordName').value.trim(),
      phone:        $('#ordPhone').value.trim(),
      address:      $('#ordAddress').value.trim(),
      note:         ($('#ordNote') && $('#ordNote').value.trim()) || '',
      payment,
      items: cart.map(line => ({ code: line.id, quantity: line.qty })),
      website: ($('#ordWebsite') && $('#ordWebsite').value) || '', // honeypot
    };

    const originalLabel = placeOrderBtn.textContent;
    placeOrderBtn.disabled = true;
    placeOrderBtn.textContent = 'Placing…';
    orderMessage.classList.remove('error');
    orderMessage.textContent = '';

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const fieldErrors = data && data.error && data.error.details;
        if (fieldErrors && typeof fieldErrors === 'object' && !Array.isArray(fieldErrors)) {
          Object.keys(fieldErrors).forEach(field => {
            const input = orderFieldInput(field);
            const messages = fieldErrors[field];
            if (input && messages && messages.length) setError(input, messages[0]);
          });
        }
        // "Some items no longer available" comes back with details.items as a list.
        const itemMsgs = fieldErrors && Array.isArray(fieldErrors.items) ? fieldErrors.items : null;
        throw new Error(
          (itemMsgs && itemMsgs.join(' ')) ||
          (data && data.error && data.error.message) ||
          `Request failed (${res.status})`,
        );
      }

      const total = typeof data.total === 'number' ? rs(data.total) : rs(cartTotal());
      orderMessage.classList.remove('error');
      orderMessage.textContent =
        `Order placed — ${total} · ${label}. Reference ${data.reference || ''}. We'll call you to confirm.`.replace(' .', '.');

      cart = [];
      renderCart();
      const orderForm = $('#orderFields');
      if (orderForm) $$('input, textarea', orderForm).forEach(el => { el.value = ''; });
      toast('Order placed. Thank you!');
    } catch (err) {
      console.warn('[order] submit failed:', err.message);
      orderMessage.textContent = err.message && err.message.startsWith('"')
        ? err.message
        : 'Sorry — your order could not be placed. Please try again, or call us.';
      orderMessage.classList.add('error');
    } finally {
      placeOrderBtn.disabled = false;
      placeOrderBtn.textContent = originalLabel;
    }
  });

  // Clear a field's error as soon as the user starts fixing it.
  if (orderFields) {
    $$('input, textarea', orderFields).forEach(input => {
      input.addEventListener('input', () => setError(input, ''));
    });
  }
}

/* =========================================================
   5. RESERVATION FORM
   ========================================================= */
const reserveForm = $('#reserveForm');
const reserveMsg  = $('#reserveMessage');

// Show / clear an inline error under a field
function setError(input, message) {
  const box = $(`[data-error-for="${input.id}"]`);
  if (box) box.textContent = message || '';
  input.classList.toggle('invalid', Boolean(message));
}

function validateReservation() {
  let ok = true;

  const name  = $('#resName');
  const phone = $('#resPhone');
  const date  = $('#resDate');
  const time  = $('#resTime');

  if (name.value.trim().length < 3) {
    setError(name, 'Please enter your full name.'); ok = false;
  } else setError(name, '');

  // Accepts 03XXXXXXXXX or +923XXXXXXXXX
  const digits = phone.value.replace(/[\s-]/g, '');
  if (!/^(\+92|0)3\d{9}$/.test(digits)) {
    setError(phone, 'Enter a valid Pakistani mobile number.'); ok = false;
  } else setError(phone, '');

  if (!date.value) {
    setError(date, 'Pick a date.'); ok = false;
  } else {
    // Compare date-only strings to avoid timezone surprises
    const todayStr = new Date().toISOString().slice(0, 10);
    if (date.value < todayStr) {
      setError(date, 'Please choose today or a future date.'); ok = false;
    } else setError(date, '');
  }

  if (!time.value) {
    setError(time, 'Pick a time.'); ok = false;
  } else setError(time, '');

  return ok;
}

// Maps an API field name back to its form control, so server-side
// validation errors land under the right field.
function reserveFieldInput(field) {
  return {
    name:    $('#resName'),
    phone:   $('#resPhone'),
    date:    $('#resDate'),
    time:    $('#resTime'),
    guests:  $('#resGuests'),
    seating: $('#resSeat'),
    note:    $('#resNote'),
  }[field] || null;
}

if (reserveForm) {
  // Don't allow past dates in the picker itself
  const resDate = $('#resDate');
  if (resDate) resDate.min = new Date().toISOString().slice(0, 10);

  const reserveSubmitBtn = $('button[type="submit"]', reserveForm);

  reserveForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateReservation()) {
      if (reserveMsg) {
        reserveMsg.textContent = 'Please fix the highlighted fields.';
        reserveMsg.classList.add('error');
      }
      return;
    }

    const name        = $('#resName').value.trim();
    const guestsLabel  = $('#resGuests').selectedOptions[0].textContent;
    const date         = $('#resDate').value;
    const time         = $('#resTime').value;

    // --- Send to the backend: POST /api/reservations ---
    const payload = {
      name,
      phone:   $('#resPhone').value.trim(),
      date,
      time,
      guests:  Number($('#resGuests').value),
      seating: $('#resSeat').value,
      note:    $('#resNote').value.trim(),
      website: ($('#resWebsite') && $('#resWebsite').value) || '', // honeypot
    };

    const originalLabel = reserveSubmitBtn ? reserveSubmitBtn.textContent : '';
    if (reserveSubmitBtn) { reserveSubmitBtn.disabled = true; reserveSubmitBtn.textContent = 'Sending…'; }
    if (reserveMsg) { reserveMsg.classList.remove('error'); reserveMsg.textContent = ''; }

    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const fieldErrors = data && data.error && data.error.details;
        if (fieldErrors && typeof fieldErrors === 'object') {
          Object.keys(fieldErrors).forEach(field => {
            const input = reserveFieldInput(field);
            const messages = fieldErrors[field];
            if (input && messages && messages.length) setError(input, messages[0]);
          });
        }
        throw new Error((data && data.error && data.error.message) || `Request failed (${res.status})`);
      }

      if (reserveMsg) {
        reserveMsg.classList.remove('error');
        reserveMsg.textContent =
          `Thanks ${name} — table for ${guestsLabel} held for ${date} at ${time}. We'll confirm by phone shortly.`;
      }

      reserveForm.reset();
      if (resDate) resDate.min = new Date().toISOString().slice(0, 10);
      toast('Reservation request sent');
    } catch (err) {
      console.warn('[reserve] submit failed:', err.message);
      if (reserveMsg) {
        reserveMsg.textContent = 'Sorry — your reservation could not be sent. Please try again, or call us.';
        reserveMsg.classList.add('error');
      }
    } finally {
      if (reserveSubmitBtn) { reserveSubmitBtn.disabled = false; reserveSubmitBtn.textContent = originalLabel; }
    }
  });

  // Clear a field's error as soon as the user starts fixing it
  $$('input, select, textarea', reserveForm).forEach(input => {
    input.addEventListener('input', () => setError(input, ''));
  });
}

/* =========================================================
   6. CONTACT FORM
   ========================================================= */
const contactForm = $('#contactForm');
const formMessage = $('#formMessage');

// Maps an API field name back to its <input> so server-side validation
// errors can be shown under the right field.
function contactFieldInput(field) {
  return { name: $('#cName'), email: $('#cEmail'), message: $('#cMsg') }[field] || null;
}

if (contactForm) {
  const contactSubmitBtn = $('button[type="submit"]', contactForm);

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name  = $('#cName');
    const email = $('#cEmail');
    const msg   = $('#cMsg');
    let ok = true;

    if (name.value.trim().length < 2) { setError(name, 'Please enter your name.'); ok = false; }
    else setError(name, '');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
      setError(email, 'Enter a valid email address.'); ok = false;
    } else setError(email, '');

    if (msg.value.trim().length < 10) {
      setError(msg, 'Message should be at least 10 characters.'); ok = false;
    } else setError(msg, '');

    if (!ok) {
      if (formMessage) {
        formMessage.textContent = 'Please fix the highlighted fields.';
        formMessage.classList.add('error');
      }
      return;
    }

    // --- Send to the backend: POST /api/contact ---
    const payload = {
      name:    name.value.trim(),
      email:   email.value.trim(),
      message: msg.value.trim(),
      website: ($('#cWebsite') && $('#cWebsite').value) || '', // honeypot — empty for real users
    };

    const originalLabel = contactSubmitBtn ? contactSubmitBtn.textContent : '';
    if (contactSubmitBtn) { contactSubmitBtn.disabled = true; contactSubmitBtn.textContent = 'Sending…'; }
    if (formMessage) { formMessage.classList.remove('error'); formMessage.textContent = ''; }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Surface per-field messages from the API, if any.
        const fieldErrors = data && data.error && data.error.details;
        if (fieldErrors && typeof fieldErrors === 'object') {
          Object.keys(fieldErrors).forEach(field => {
            const input = contactFieldInput(field);
            const messages = fieldErrors[field];
            if (input && messages && messages.length) setError(input, messages[0]);
          });
        }
        throw new Error((data && data.error && data.error.message) || `Request failed (${res.status})`);
      }

      if (formMessage) {
        formMessage.classList.remove('error');
        formMessage.textContent = data.message || 'Thank you! Your message has been received.';
      }
      contactForm.reset();
      toast('Message sent');
    } catch (err) {
      console.warn('[contact] submit failed:', err.message);
      if (formMessage) {
        formMessage.textContent = 'Sorry — your message could not be sent. Please try again, or call us.';
        formMessage.classList.add('error');
      }
    } finally {
      if (contactSubmitBtn) { contactSubmitBtn.disabled = false; contactSubmitBtn.textContent = originalLabel; }
    }
  });

  $$('input, textarea', contactForm).forEach(input => {
    input.addEventListener('input', () => setError(input, ''));
  });
}

/* =========================================================
   7. NAVIGATION, SCROLL REVEAL, MISC
   ========================================================= */

// --- Mobile drawer ---
const hamburger = $('#hamburger');
const navLinks  = $('#navLinks');

function closeNav() {
  if (!hamburger || !navLinks) return;
  hamburger.classList.remove('open');
  navLinks.classList.remove('open');
  hamburger.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('nav-open');
}

if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    hamburger.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('nav-open', open);
  });

  // Close the drawer after tapping a link
  navLinks.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') closeNav();
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeNav();
  });
}

// --- Header shadow after scrolling ---
const siteHeader = $('#siteHeader');
if (siteHeader) {
  const onScroll = () => siteHeader.classList.toggle('scrolled', window.scrollY > 12);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// --- Scroll reveal using IntersectionObserver ---
// Elements with class "reveal" fade in once, when they enter the viewport.
const revealEls = $$('.reveal');
if ('IntersectionObserver' in window && revealEls.length) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // animate once, then stop watching
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  revealEls.forEach(el => observer.observe(el));
} else {
  revealEls.forEach(el => el.classList.add('visible')); // fallback: just show them
}

// --- Footer year ---
const yearEl = $('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* --- Boot --- */
initMenu();   // fetches the live menu, then renders (falls back to the built-in list)
renderCart();
