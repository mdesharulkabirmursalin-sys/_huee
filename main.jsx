import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowDownRight, ArrowRight, BadgeCheck, Check, ChevronDown, CircleUserRound,
  Instagram, Menu, Minus, Package, Plus, Search, ShieldCheck, ShoppingBag,
  Sparkles, Trash2, X, LogOut, Settings, ImagePlus, ExternalLink, LockKeyhole
} from 'lucide-react';
import { supabase, hasSupabase } from './supabase';
import './styles.css';

const BDT = new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 });
const money = n => BDT.format(Number(n || 0));
const waNumber = (import.meta.env.VITE_WHATSAPP_NUMBER || '').replace(/\D/g, '');
const instagramUrl = import.meta.env.VITE_INSTAGRAM_URL || 'https://www.instagram.com/__huee_/';
const demoProducts = [
  { id:'huee-01', name:'Chromaphobia Heavy Hoodie', category:'hoodies', price:4800, color:'Cyber Purple / Pink', sizes:['S','M','L','XL'], stock:{S:4,M:8,L:6,XL:2}, description:'Heavyweight fleece hoodie with a bold gradient chest graphic.', tag:'Bestseller', image:'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=85', active:true },
  { id:'huee-02', name:'Spectrum Oversized Tee', category:'tees', price:1800, color:'Neon Cyan', sizes:['S','M','L','XL'], stock:{S:8,M:12,L:10,XL:5}, description:'Boxy, drop-shoulder tee made for everyday rotation.', tag:'New drop', image:'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85', active:true },
  { id:'huee-03', name:'Translucent Cyber Shell Jacket', category:'outerwear', price:6900, color:'Frosted Smoke', sizes:['M','L','XL'], stock:{M:3,L:4,XL:2}, description:'Lightweight shell with a futuristic silhouette.', tag:'Limited', image:'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=85', active:true },
  { id:'huee-04', name:'Aura Relaxed Sweatpants', category:'hoodies', price:3200, color:'Vibrant Magenta', sizes:['S','M','L'], stock:{S:4,M:7,L:4}, description:'Relaxed fleece joggers with a clean, easy fit.', tag:'Popular', image:'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=900&q=85', active:true },
  { id:'huee-05', name:'Prism Crossbody Bag', category:'accessories', price:2200, color:'Iridescent Clear', sizes:['One Size'], stock:{'One Size':10}, description:'Compact crossbody bag for daily essentials.', tag:'Accessory', image:'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85', active:true },
  { id:'huee-06', name:'Prismatic Acid Wash Tee', category:'tees', price:1950, color:'Acid Grey / Violet', sizes:['S','M','L','XL'], stock:{S:5,M:8,L:6,XL:3}, description:'Vintage-wash tee with a statement streetwear finish.', tag:'Limited', image:'https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=900&q=85', active:true }
];
const categories = [
  ['all','All drops'], ['hoodies','Hoodies & sweats'], ['tees','Tees & tops'],
  ['outerwear','Outerwear'], ['accessories','Accessories']
];

function readCart() {
  try { return JSON.parse(localStorage.getItem('huee-cart') || '[]'); } catch { return []; }
}
function App() {
  const [products, setProducts] = useState(demoProducts);
  const [cart, setCart] = useState(readCart);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [size, setSize] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [session, setSession] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState({ name:'', phone:'', address:'', method:'whatsapp' });
  const [newsletter, setNewsletter] = useState('');
  const [newsletterMessage, setNewsletterMessage] = useState('');

  useEffect(() => { localStorage.setItem('huee-cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => {
    if (!hasSupabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => listener.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!hasSupabase) return;
    let alive = true;
    supabase.from('products').select('*').eq('active', true).order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (alive && !error && data?.length) setProducts(data.map(p => ({
          ...p, sizes: Array.isArray(p.sizes) ? p.sizes : ['S','M','L','XL'],
          stock: p.stock && typeof p.stock === 'object' ? p.stock : {}
        })));
      });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(''), 2800);
    return () => clearTimeout(id);
  }, [toast]);

  const visibleProducts = useMemo(() => products.filter(p => {
    const q = search.toLowerCase().trim();
    return (category === 'all' || p.category === category) &&
      (!q || `${p.name} ${p.color} ${p.description}`.toLowerCase().includes(q));
  }), [products, category, search]);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  function available(product, selectedSize) {
    const n = Number(product.stock?.[selectedSize] ?? 0);
    return n;
  }
  function addToCart(product, chosenSize) {
    if (!chosenSize) { setToast('Choose a size first'); return; }
    const already = cart.find(i => i.id === product.id && i.size === chosenSize)?.qty || 0;
    if (already >= available(product, chosenSize)) { setToast('That size is out of stock'); return; }
    setCart(prev => {
      const index = prev.findIndex(i => i.id === product.id && i.size === chosenSize);
      if (index >= 0) return prev.map((i, j) => j === index ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { id:product.id, name:product.name, price:Number(product.price), image:product.image, size:chosenSize, qty:1 }];
    });
    setToast('Added to your bag');
  }
  function changeQty(index, delta) {
    setCart(prev => prev.map((item, i) => i === index ? { ...item, qty: item.qty + delta } : item)
      .filter(item => item.qty > 0)
      .map(item => {
        const product = products.find(p => p.id === item.id);
        return product ? { ...item, qty: Math.min(item.qty, Math.max(1, available(product, item.size))) } : item;
      }));
  }
  function openProduct(product) { setSelected(product); setSize(product.sizes?.[0] || 'One Size'); }
  async function signIn(e) {
    e.preventDefault(); setBusy(true); setAuthMessage('');
    if (!hasSupabase) {
      setAuthMessage('Login needs Supabase setup. Add your project URL and anon key to .env.local.');
      setBusy(false); return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email:authEmail, password:authPassword });
    setAuthMessage(error ? error.message : 'Signed in successfully.');
    setBusy(false);
  }
  async function signUp(e) {
    e.preventDefault(); setBusy(true); setAuthMessage('');
    if (!hasSupabase) {
      setAuthMessage('Account creation needs Supabase setup. Add your project URL and anon key to .env.local.');
      setBusy(false); return;
    }
    const { error } = await supabase.auth.signUp({ email:authEmail, password:authPassword });
    setAuthMessage(error ? error.message : 'Check your email to confirm your account.');
    setBusy(false);
  }
  async function signOut() { if (hasSupabase) await supabase.auth.signOut(); setSession(null); setToast('Signed out'); }
  async function submitOrder(e) {
    e.preventDefault();
    if (!cart.length) return;
    setBusy(true);
    const payload = { ...order, items:cart, total:subtotal, currency:'BDT' };
    // Payment/order records should be created by a trusted server function in production.
    // Do not accept a browser-submitted total as authoritative for online payments.
    if (order.method === 'payment') {
      setBusy(false);
      setToast('Online payments need server-side gateway setup');
      return;
    }
    const lines = [
      '__huee_ ORDER REQUEST',
      `Name: ${order.name}`, `Phone: ${order.phone}`, `Address: ${order.address}`, '',
      ...cart.map(i => `• ${i.name} | Size ${i.size} | Qty ${i.qty} | ${money(i.price * i.qty)}`),
      '', `TOTAL: ${money(subtotal)}`, 'Currency: BDT'
    ].join('\n');
    if (hasSupabase) {
      const { error } = await supabase.from('order_requests').insert({
        customer_name:order.name, phone:order.phone, address:order.address,
        items:cart, total:subtotal, currency:'BDT', channel:order.method
      });
      if (error) setToast('Could not save order request; opening message app');
    }
    setBusy(false);
    setCheckoutOpen(false);
    if (order.method === 'whatsapp') {
      const url = waNumber && !waNumber.includes('XXXXXXXXX')
        ? `https://wa.me/${waNumber}?text=${encodeURIComponent(lines)}`
        : `https://wa.me/?text=${encodeURIComponent(lines)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      try { await navigator.clipboard.writeText(lines); setToast('Order copied — paste it in Instagram DM'); }
      catch { setToast('Please copy your order details from the cart'); }
      window.open(instagramUrl, '_blank', 'noopener,noreferrer');
    }
    setCart([]);
  }
  async function saveProduct(e) {
    e.preventDefault();
    const formElement = e.currentTarget;
    if (!hasSupabase || !session) { setToast('Admin requires a signed-in Supabase admin account'); return; }
    const form = new FormData(formElement);
    const stock = Object.fromEntries(['S','M','L','XL','One Size'].map(s => [s, Math.max(0, Number(form.get(`stock-${s}`) || 0))]));
    const record = {
      name:String(form.get('name')), category:String(form.get('category')),
      price:Math.max(0, Number(form.get('price'))), color:String(form.get('color')),
      description:String(form.get('description')), tag:String(form.get('tag') || ''),
      image:String(form.get('image')), sizes:['S','M','L','XL','One Size'].filter(s => stock[s] > 0),
      stock, active:form.get('active') === 'on'
    };
    const id = String(form.get('id') || '').trim();
    const query = id ? supabase.from('products').update(record).eq('id', id) : supabase.from('products').insert(record);
    const { error } = await query;
    if (error) { setToast(`Save failed: ${error.message}`); return; }
    const { data } = await supabase.from('products').select('*').eq('active', true);
    if (data) setProducts(data);
    setToast('Product saved');
    formElement.reset();
  }
  async function deleteProduct(id) {
    if (!hasSupabase || !session || !confirm('Delete this product?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { setToast(error.message); return; }
    setProducts(prev => prev.filter(p => p.id !== id));
    setToast('Product deleted');
  }

  return <div className="app-shell">
    <div className="ambient ambient-pink" /><div className="ambient ambient-purple" /><div className="ambient ambient-cyan" />
    <header className="site-header">
      <div className="nav-wrap">
        <a className="brand" href="#home" aria-label="__huee_ home">
          <span className="brand-mark">h</span><span><b className="gradient-text">__huee_</b><small>WEAR YOUR AURA</small></span>
        </a>
        <nav className="desktop-nav"><a href="#home">Home</a><a href="#collection">Collection</a><a href="#about">Our ethos</a><a href={instagramUrl} target="_blank" rel="noreferrer"><Instagram size={16}/> Instagram</a></nav>
        <div className="nav-actions">
          <button className="icon-btn" aria-label="Account" onClick={() => setAuthOpen(true)}><CircleUserRound size={19}/></button>
          {session && <button className="icon-btn admin-shortcut" title="Admin dashboard" onClick={() => setAdminOpen(true)}><Settings size={18}/></button>}
          <button className="bag-btn" onClick={() => setCartOpen(true)}><ShoppingBag size={17}/><span>Bag</span><b>{cartCount}</b></button>
          <button className="icon-btn mobile-menu-btn" aria-label="Open menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X/> : <Menu/>}</button>
        </div>
      </div>
      {menuOpen && <nav className="mobile-nav"><a href="#home" onClick={() => setMenuOpen(false)}>Home</a><a href="#collection" onClick={() => setMenuOpen(false)}>Collection</a><a href="#about" onClick={() => setMenuOpen(false)}>Our ethos</a><a href={instagramUrl}>Instagram</a></nav>}
    </header>

    <main>
      <section id="home" className="hero section-wrap">
        <div className="hero-copy">
          <div className="eyebrow"><span className="live-dot"/> THE NEW WAVE OF STREETWEAR</div>
          <h1>Express your<br/><span className="gradient-text">true hue.</span></h1>
          <p>Unapologetic streetwear for those who refuse to blend in. Considered silhouettes, statement colour, and everyday comfort.</p>
          <div className="hero-actions"><a className="btn primary" href="#collection">Explore the drop <ArrowRight size={16}/></a><a className="btn secondary" href={instagramUrl} target="_blank" rel="noreferrer"><Instagram size={17}/> Follow @__huee_</a></div>
          <div className="hero-stats"><div><b>Expressive</b><span>Design-led pieces</span></div><div><b>Small drops</b><span>Limited releases</span></div><div><b>Bangladesh</b><span>BDT pricing</span></div></div>
        </div>
        <div className="hero-art">
          <div className="hero-glow"/>
          <div className="hero-photo"><img src="https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1200&q=90" alt="Streetwear collection editorial" fetchPriority="high"/><div className="photo-overlay"/><div className="hero-label"><span>THE FIRST EDIT</span><b>Colour outside<br/>the lines.</b><a href="#collection">Shop the collection <ArrowDownRight size={16}/></a></div><span className="floating-stamp"><Sparkles size={15}/> FIND YOUR HUE</span></div>
        </div>
      </section>

      <section className="ticker" aria-label="Brand message"><div>WEAR YOUR AURA <span>✳</span> MAKE YOUR OWN RULES <span>✳</span> COLOUR OUTSIDE THE LINES <span>✳</span> WEAR YOUR AURA <span>✳</span></div></section>

      <section id="collection" className="section-wrap collection-section">
        <div className="section-heading"><div><span className="kicker">THE DROP / 001</span><h2>Find your <span className="gradient-text">frequency.</span></h2><p>Everyday staples, turned up a notch.</p></div><div className="search-box"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search the collection…" aria-label="Search products"/></div></div>
        <div className="filter-row">{categories.map(([key,label]) => <button key={key} className={`filter-chip ${category===key?'selected':''}`} onClick={() => setCategory(key)}>{label}</button>)}</div>
        <div className="product-grid">
          {visibleProducts.map((p, idx) => <article className="product-card" key={p.id}>
            <button className="product-image" onClick={() => openProduct(p)} aria-label={`View ${p.name}`}><img src={p.image || demoProducts[idx % demoProducts.length].image} alt={p.name} loading="lazy"/><span className="product-tag">{p.tag || 'THE DROP'}</span><span className="quick-view">Quick view <ArrowRight size={15}/></span></button>
            <div className="product-meta"><div><span className="product-category">{p.category} · {p.color}</span><h3>{p.name}</h3></div><b className="product-price">{money(p.price)}</b></div>
            <button className="add-btn" onClick={() => openProduct(p)}>Choose size <Plus size={15}/></button>
          </article>)}
        </div>
        {!visibleProducts.length && <div className="empty-state"><Package size={30}/><h3>No pieces found</h3><p>Try another search or category.</p></div>}
      </section>

      <section id="about" className="about-section section-wrap">
        <div className="about-image"><img src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1100&q=85" alt="Streetwear editorial style" loading="lazy"/><span>INDEPENDENT BY DESIGN</span></div>
        <div className="about-copy"><span className="kicker">THE __HUEE_ ETHOS</span><h2>Made to be<br/><span className="gradient-text">noticed.</span></h2><p>Style is a language. __huee_ is for people who use it to say something of their own. We pair wearable shapes with a little more colour, a little more confidence, and a lot less ordinary.</p><div className="ethos-points"><div><BadgeCheck/><span><b>Thoughtful drops</b><small>Curated collections, not endless noise.</small></span></div><div><ShieldCheck/><span><b>Clear product details</b><small>Sizes, prices, and stock shown before checkout.</small></span></div></div><a className="text-link" href={instagramUrl} target="_blank" rel="noreferrer">Meet us on Instagram <ArrowRight size={16}/></a></div>
      </section>

      <section className="newsletter-section section-wrap"><div><span className="kicker">FIRST TO THE DROP</span><h2>A little hue in your inbox.</h2><p>Get new-release updates and first looks.</p></div><form onSubmit={e => { e.preventDefault(); setNewsletterMessage('Thanks — newsletter signup needs an email service connection before it can be saved.'); }} className="newsletter-form"><input type="email" value={newsletter} onChange={e => setNewsletter(e.target.value)} placeholder="Your email address" required/><button className="btn primary">Keep me posted <ArrowRight size={16}/></button>{newsletterMessage && <small>{newsletterMessage}</small>}</form></section>
    </main>

    <footer className="site-footer"><div className="footer-top"><div><a className="footer-brand gradient-text" href="#home">__huee_</a><p>Wear your aura. Make your own rules.</p></div><div className="footer-links"><a href="#collection">Collection</a><a href="#about">Our ethos</a><a href={instagramUrl} target="_blank" rel="noreferrer">Instagram <ExternalLink size={13}/></a><button onClick={() => setAuthOpen(true)}>Your account</button></div><div className="footer-note"><LockKeyhole size={16}/><span>Checkout requests are shared only through your selected order channel.</span></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} __huee_. All rights reserved.</span><span>Designed with intention in Bangladesh.</span></div></footer>

    {cartOpen && <div className="overlay" onMouseDown={e => e.target === e.currentTarget && setCartOpen(false)}><aside className="drawer"><div className="drawer-header"><div><span className="kicker">YOUR EDIT</span><h2>Shopping bag <span>({cartCount})</span></h2></div><button className="icon-btn" onClick={() => setCartOpen(false)} aria-label="Close bag"><X/></button></div>
      <div className="cart-list">{cart.map((item, i) => <div className="cart-line" key={`${item.id}-${item.size}`}><img src={item.image} alt=""/><div className="cart-line-info"><b>{item.name}</b><span>Size {item.size}</span><strong>{money(item.price * item.qty)}</strong><div className="qty-control"><button onClick={() => changeQty(i,-1)} aria-label="Decrease quantity"><Minus size={13}/></button><span>{item.qty}</span><button onClick={() => changeQty(i,1)} aria-label="Increase quantity"><Plus size={13}/></button></div></div><button className="remove-btn" onClick={() => setCart(prev => prev.filter((_,j) => i!==j))} aria-label="Remove item"><Trash2 size={16}/></button></div>)}{!cart.length && <div className="empty-state"><ShoppingBag size={30}/><h3>Your bag is waiting.</h3><p>Pick something that feels like you.</p></div>}</div>
      <div className="drawer-bottom"><div className="subtotal"><span>Subtotal</span><b>{money(subtotal)}</b></div><p>Delivery charges, if any, are confirmed with your order.</p><button className="btn primary full" disabled={!cart.length} onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}>Continue to order <ArrowRight size={16}/></button><button className="continue-link" onClick={() => setCartOpen(false)}>Keep exploring</button></div>
    </aside></div>}

    {selected && <div className="overlay modal-overlay" onMouseDown={e => e.target === e.currentTarget && setSelected(null)}><section className="product-modal"><button className="modal-close icon-btn" onClick={() => setSelected(null)} aria-label="Close product details"><X/></button><div className="modal-image"><img src={selected.image} alt={selected.name}/></div><div className="modal-info"><span className="kicker">{selected.category} / __HUEE_</span><h2>{selected.name}</h2><b className="modal-price">{money(selected.price)}</b><p>{selected.description}</p><label className="field-label" htmlFor="size-select">Choose your size</label><div className="size-row">{(selected.sizes || ['One Size']).map(s => <button key={s} className={`size-btn ${size===s?'active':''} ${available(selected,s)<=0?'out':''}`} disabled={available(selected,s)<=0} onClick={() => setSize(s)}>{s}</button>)}</div><p className="stock-note">{available(selected,size)>0 ? `${available(selected,size)} available in ${size}` : 'Out of stock in this size'}</p><button className="btn primary full" disabled={available(selected,size)<=0} onClick={() => { addToCart(selected,size); setSelected(null); }}>Add to bag · {money(selected.price)} <Plus size={16}/></button><div className="secure-note"><ShieldCheck size={15}/> Clear pricing in Bangladeshi Taka</div></div></section></div>}

    {checkoutOpen && <div className="overlay modal-overlay"><section className="checkout-modal"><button className="modal-close icon-btn" onClick={() => setCheckoutOpen(false)} aria-label="Close checkout"><X/></button><span className="kicker">ALMOST YOURS</span><h2>Where should we send it?</h2><p className="muted">Submit your details, then send the order request via your chosen channel.</p><form className="checkout-form" onSubmit={submitOrder}><label>Full name<input value={order.name} onChange={e => setOrder({...order,name:e.target.value})} required autoComplete="name" placeholder="Your name"/></label><label>Phone / WhatsApp<input value={order.phone} onChange={e => setOrder({...order,phone:e.target.value})} required autoComplete="tel" placeholder="01XXXXXXXXX"/></label><label>Delivery address<textarea value={order.address} onChange={e => setOrder({...order,address:e.target.value})} required autoComplete="street-address" placeholder="House, road, area, city" rows="3"/></label><fieldset><legend>Order channel</legend><label className="radio-choice"><input type="radio" value="whatsapp" checked={order.method==='whatsapp'} onChange={e => setOrder({...order,method:e.target.value})}/> WhatsApp</label><label className="radio-choice"><input type="radio" value="instagram" checked={order.method==='instagram'} onChange={e => setOrder({...order,method:e.target.value})}/> Instagram DM</label></fieldset><div className="checkout-total"><span>Order subtotal</span><b>{money(subtotal)}</b></div><button className="btn primary full" type="submit" disabled={busy}>{busy?'Preparing order…':'Send order request'} <ArrowRight size={16}/></button><small className="muted">Your order is not confirmed until the store replies.</small></form></section></div>}

    {authOpen && <div className="overlay modal-overlay"><section className="auth-modal"><button className="modal-close icon-btn" onClick={() => setAuthOpen(false)} aria-label="Close account"><X/></button>{session ? <><span className="kicker">YOUR ACCOUNT</span><h2>You’re signed in.</h2><p className="muted">{session.user.email}</p><div className="auth-actions"><button className="btn secondary full" onClick={() => { setAuthOpen(false); setAdminOpen(true); }}>Open admin dashboard</button><button className="btn primary full" onClick={signOut}><LogOut size={16}/> Sign out</button></div></> : <><span className="kicker">THE __HUEE_ COMMUNITY</span><h2>Welcome back.</h2><p className="muted">{hasSupabase?'Sign in or create an account.':'Account login becomes active after Supabase setup.'}</p><form className="checkout-form" onSubmit={signIn}><label>Email<input type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} required autoComplete="email"/></label><label>Password<input type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} required minLength="6" autoComplete="current-password"/></label><button className="btn primary full" disabled={busy}>{busy?'Please wait…':'Sign in'}</button><button type="button" className="btn secondary full" disabled={busy} onClick={signUp}>Create account</button>{authMessage && <p className="form-message">{authMessage}</p>}</form></>}</section></div>}

    {adminOpen && <div className="overlay modal-overlay"><section className="admin-modal"><button className="modal-close icon-btn" onClick={() => setAdminOpen(false)} aria-label="Close admin"><X/></button><span className="kicker">STORE CONTROL</span><h2>Product dashboard</h2><p className="muted">Only use this with a Supabase account explicitly granted admin access by database policy. Sign-in alone must not grant admin permissions.</p>{!hasSupabase && <div className="notice">Connect Supabase to create and manage products. Demo products are read-only.</div>}<form className="admin-form" onSubmit={saveProduct}><input name="id" placeholder="Product ID to update (leave blank to create)"/><div className="admin-grid"><label>Product name<input name="name" required/></label><label>Category<select name="category"><option value="hoodies">Hoodies & sweats</option><option value="tees">Tees & tops</option><option value="outerwear">Outerwear</option><option value="accessories">Accessories</option></select></label><label>Price (BDT)<input name="price" type="number" min="0" required/></label><label>Color<input name="color" required/></label></div><label>Description<textarea name="description" required rows="2"/></label><label>Image URL<input name="image" type="url" placeholder="https://…" required/></label><label>Tag<input name="tag" placeholder="New drop, Bestseller…"/></label><div className="stock-editor"><b>Stock by size</b><div className="admin-grid">{['S','M','L','XL','One Size'].map(s => <label key={s}>{s}<input name={`stock-${s}`} type="number" min="0" defaultValue="0"/></label>)}</div></div><label className="radio-choice"><input name="active" type="checkbox" defaultChecked/> Active and visible in collection</label><button className="btn primary full" type="submit"><Settings size={16}/> Save product</button></form><div className="admin-list"><h3>Current products</h3>{products.map(p => <div key={p.id} className="admin-product"><span><b>{p.name}</b><small>{money(p.price)} · {p.id}</small></span><button className="remove-btn" onClick={() => deleteProduct(p.id)} aria-label={`Delete ${p.name}`}><Trash2 size={16}/></button></div>)}</div></section></div>}

    {toast && <div className="toast" role="status"><Check size={17}/>{toast}</div>}
  </div>;
}
createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
