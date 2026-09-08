// =========================================================
//  Seed data — the 16 menu items.
//  These are copied verbatim from the frontend's MENU_ITEMS
//  array (script.js) so the site looks identical after we
//  switch the menu over to the API.
//
//  `code`     == the old `id` in script.js (stable public id).
//  `featured` == highlighted item. Not shown differently on the
//               public site yet; the admin dashboard will manage it.
//               Seeded true for the signature + bestseller items.
// =========================================================

/** @type {Array<{code:string,category:string,name:string,price:number,tag:string,featured:boolean,description:string,imageUrl:string}>} */
export const MENU_SEED = [
  // ---------- BURGERS ----------
  {
    code: 'b1', category: 'burgers', name: 'Pure Signature Burger', price: 750, tag: 'Chef’s Pick', featured: true,
    description: 'Double smashed beef, aged cheddar, house sauce, brioche bun.',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
  },
  {
    code: 'b2', category: 'burgers', name: 'Classic Beef Burger', price: 550, tag: '', featured: false,
    description: 'Hand-pressed patty, lettuce, tomato, pickles, mayo.',
    imageUrl: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=600&q=80',
  },
  {
    code: 'b3', category: 'burgers', name: 'Crispy Chicken Burger', price: 520, tag: '', featured: false,
    description: 'Buttermilk-marinated fillet, slaw, garlic aioli.',
    imageUrl: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=600&q=80',
  },
  {
    code: 'b4', category: 'burgers', name: 'Double Cheese Smash', price: 850, tag: 'Bestseller', featured: true,
    description: 'Two patties, four slices of cheese. Bring an appetite.',
    imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80',
  },
  {
    code: 'b5', category: 'burgers', name: 'Zinger Tower', price: 690, tag: 'Spicy', featured: false,
    description: 'Spicy fillet, hash brown, cheese, chipotle mayo.',
    imageUrl: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=600&q=80',
  },

  // ---------- SANDWICHES ----------
  {
    code: 's1', category: 'sandwiches', name: 'Grilled Chicken Sandwich', price: 450, tag: '', featured: false,
    description: 'Char-grilled chicken, lettuce, herb mayo, toasted sourdough.',
    imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80',
  },
  {
    code: 's2', category: 'sandwiches', name: 'Triple-Decker Club', price: 520, tag: '', featured: false,
    description: 'Chicken, egg, cheese and salad stacked three layers high.',
    imageUrl: 'https://images.unsplash.com/photo-1567234669003-dce7a7a88821?auto=format&fit=crop&w=600&q=80',
  },
  {
    code: 's3', category: 'sandwiches', name: 'Beef Steak Sandwich', price: 620, tag: 'Popular', featured: false,
    description: 'Seared beef strips, caramelised onion, melted mozzarella.',
    imageUrl: 'https://images.unsplash.com/photo-1539252554453-80ab65ce3586?auto=format&fit=crop&w=600&q=80',
  },
  {
    code: 's4', category: 'sandwiches', name: 'Veggie Melt', price: 380, tag: '', featured: false,
    description: 'Grilled peppers, mushroom, olives and cheese on rye.',
    imageUrl: 'https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&w=600&q=80',
  },

  // ---------- SIDES ----------
  {
    code: 'f1', category: 'sides', name: 'Loaded Fries', price: 350, tag: 'Bestseller', featured: true,
    description: 'Crispy fries under cheese sauce, jalapeños and herbs.',
    imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80',
  },
  {
    code: 'f2', category: 'sides', name: 'Masala Fries', price: 250, tag: '', featured: false,
    description: 'Golden fries tossed in our own chaat masala blend.',
    imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=600&q=80',
  },
  {
    code: 'f3', category: 'sides', name: 'Crispy Wings (6 pcs)', price: 480, tag: 'Spicy', featured: false,
    description: 'Double-fried wings glazed in hot honey or BBQ.',
    imageUrl: 'https://images.unsplash.com/photo-1608039755401-742074f0548d?auto=format&fit=crop&w=600&q=80',
  },
  {
    code: 'f4', category: 'sides', name: 'Onion Rings', price: 280, tag: '', featured: false,
    description: 'Thick-cut rings in a light, crunchy batter.',
    imageUrl: 'https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&w=600&q=80',
  },

  // ---------- DRINKS ----------
  {
    code: 'd1', category: 'drinks', name: 'Fresh Lemonade', price: 200, tag: '', featured: false,
    description: 'Chilled, lightly sweet, squeezed to order.',
    imageUrl: 'https://images.unsplash.com/photo-1523677011781-c91d1bbe2f9e?auto=format&fit=crop&w=600&q=80',
  },
  {
    code: 'd2', category: 'drinks', name: 'Mint Margarita', price: 250, tag: 'Popular', featured: false,
    description: 'Fresh mint, lemon and crushed ice. Non-alcoholic.',
    imageUrl: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=600&q=80',
  },
  {
    code: 'd3', category: 'drinks', name: 'Cold Coffee', price: 300, tag: '', featured: false,
    description: 'Double-shot espresso blended with milk and ice.',
    imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=600&q=80',
  },
];
