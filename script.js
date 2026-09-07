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
const MENU_ITEMS = [
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

function renderMenu(filter = 'all') {
  if (!menuGrid) return;

  const items = filter === 'all'
    ? MENU_ITEMS
    : MENU_ITEMS.filter(item => item.cat === filter);

  if (items.length === 0) {
    menuGrid.innerHTML = '';
    if (menuEmpty) menuEmpty.hidden = false;
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

    renderMenu(tab.dataset.filter);
  });
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
    if (payChoice)     payChoice.hidden     = true;
    if (clearOrderBtn) clearOrderBtn.hidden = true;
    return;
  }

  if (orderSummary)  orderSummary.hidden  = false;
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

if (placeOrderBtn) {
  placeOrderBtn.addEventListener('click', () => {
    if (!orderMessage) return;

    if (cart.length === 0) {
      orderMessage.textContent = 'Please add at least one item before ordering.';
      orderMessage.classList.add('error');
      return;
    }

    const method = $('input[name="pay"]:checked');
    const label = method && method.value === 'online' ? 'Online payment' : 'Cash on delivery';
    const total = rs(cartTotal());

    orderMessage.classList.remove('error');
    orderMessage.textContent =
      `Order confirmed — ${total} · ${label}. We'll call you on the number you provide. (Demo: no real payment)`;

    cart = [];
    renderCart();
    toast('Order placed. Thank you!');
  });
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

if (reserveForm) {
  // Don't allow past dates in the picker itself
  const resDate = $('#resDate');
  if (resDate) resDate.min = new Date().toISOString().slice(0, 10);

  reserveForm.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!validateReservation()) {
      if (reserveMsg) {
        reserveMsg.textContent = 'Please fix the highlighted fields.';
        reserveMsg.classList.add('error');
      }
      return;
    }

    const name   = $('#resName').value.trim();
    const guests = $('#resGuests').selectedOptions[0].textContent;
    const date   = $('#resDate').value;
    const time   = $('#resTime').value;

    if (reserveMsg) {
      reserveMsg.classList.remove('error');
      reserveMsg.textContent =
        `Thanks ${name} — table for ${guests} held for ${date} at ${time}. We'll confirm by phone shortly.`;
    }

    reserveForm.reset();
    if (resDate) resDate.min = new Date().toISOString().slice(0, 10);
    toast('Reservation request sent');
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

if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
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

    if (formMessage) {
      formMessage.classList.remove('error');
      formMessage.textContent = 'Thank you! Your message has been received.';
    }
    contactForm.reset();
    toast('Message sent');
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
renderMenu('all');
renderCart();
