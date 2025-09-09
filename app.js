// WanderNext SPA - Frontend-only prototype using localStorage
// Features: Auth (mock), Profile, Search/Trending, Listings + Details, Community, Destination Utilities, Bookmarks/Itinerary

// ------------------------------ Utilities & Store ------------------------------
const Store = {
    key: 'wandernext_v1',
    read() {
        const raw = localStorage.getItem(this.key);
        if (!raw) return this.defaults();
        try { return JSON.parse(raw); } catch { return this.defaults(); }
    },
    write(data) { localStorage.setItem(this.key, JSON.stringify(data)); },
    defaults() {
        return {
            auth: { user: null },
            users: {},
            profiles: {},
            bookmarks: {},
            itinerary: {},
            forum: {
                posts: [],
                pending: [],
                lastId: 0,
                comments: {},
                likes: {},
            },
            data: seedData(),
        };
    },
};

function getState() { return Store.read(); }
function setState(mutator) { const s = getState(); mutator(s); Store.write(s); }

function uid(prefix = 'id') { return `${prefix}_${Math.random().toString(36).slice(2,10)}`; }
function toast(message) {
    const tpl = document.getElementById('tpl-toast');
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.textContent = message;
    document.body.appendChild(node);
    setTimeout(() => node.remove(), 2500);
}

function setYear() { document.getElementById('year').textContent = new Date().getFullYear(); }

// ------------------------------ Seed Data ------------------------------
function seedData() {
    const demoListings = [
        {
            id: 'lst_1', type: 'accommodation', name: 'Azure Bay Hotel', price: 120, rating: 4.5,
            location: 'Goa, India', travelerTypes: ['couple','family'],
            images: ['https://images.unsplash.com/photo-1502920917128-1aa500764ce7?q=80&w=1200&auto=format&fit=crop'],
            description: 'Seaside hotel with infinity pool and private beach access.',
            address: '123 Beach Rd, Goa', contact: '+91 00000 00000', map: 'https://maps.google.com'
        },
        {
            id: 'lst_2', type: 'cafe', name: 'Roast & Coast Cafe', price: 8, rating: 4.3,
            location: 'Lisbon, Portugal', travelerTypes: ['solo','couple'],
            images: ['https://images.unsplash.com/photo-1453614512568-c4024d13c247?q=80&w=1200&auto=format&fit=crop'],
            description: 'Specialty coffee with ocean views and pastel de nata.',
            address: 'Alfama, Lisbon', contact: '+351 000 000 000', map: 'https://maps.google.com'
        },
        {
            id: 'lst_3', type: 'attraction', name: 'Skyline Gardens', price: 25, rating: 4.7,
            location: 'Singapore', travelerTypes: ['family','couple'],
            images: ['https://images.unsplash.com/photo-1549877452-9c387954fbc0?q=80&w=1200&auto=format&fit=crop'],
            description: 'Iconic supertree grove with light shows and skywalks.',
            address: '18 Marina Gardens Dr', contact: '+65 0000 0000', map: 'https://maps.google.com'
        },
    ];

    const trending = [
        { id: 'tr_1', title: "Santorini Sunsets", image: 'https://images.unsplash.com/photo-1509126522513-167c06e22a0f?q=80&w=1200&auto=format&fit=crop' },
        { id: 'tr_2', title: "Kyoto Temples", image: 'https://images.unsplash.com/photo-1500315331616-db1a23f40e96?q=80&w=1200&auto=format&fit=crop' },
        { id: 'tr_3', title: "Iceland Ring Road", image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1200&auto=format&fit=crop' },
    ];

    return { listings: demoListings, trending };
}

// ------------------------------ Auth (Mock) ------------------------------
const Auth = {
    current() { return getState().auth.user; },
    loginEmail(email, password) {
        setState(s => {
            const existing = s.users[email] || { email, id: uid('usr'), password };
            s.users[email] = existing;
            if (!s.profiles[existing.id]) {
                s.profiles[existing.id] = { username: email.split('@')[0], picture: '', travelType: 'solo', interests: ['nature'], budget: [0, 1000] };
            }
            s.auth.user = { id: existing.id, email };
        });
        toast('Logged in');
        Router.go('#/');
    },
    loginGoogle() {
        const email = `user${Math.floor(Math.random()*1000)}@gmail.com`;
        this.loginEmail(email, 'google-oauth-mock');
    },
    logout() { setState(s => { s.auth.user = null; }); toast('Logged out'); Router.go('#/'); },
    resetPassword(email) { toast(`Password reset link sent to ${email}`); },
    profile() {
        const user = this.current(); if (!user) return null; return getState().profiles[user.id];
    },
    saveProfile(profileUpdates) {
        const user = this.current(); if (!user) return;
        setState(s => { s.profiles[user.id] = { ...s.profiles[user.id], ...profileUpdates }; });
        toast('Profile updated');
    }
};

// ------------------------------ Router ------------------------------
const routes = {};
const Router = {
    register(path, render) { routes[path] = render; },
    go(hash) { location.hash = hash; },
    start() {
        window.addEventListener('hashchange', this.render.bind(this));
        if (!location.hash) location.hash = '#/';
        this.render();
    },
    render() {
        const view = document.getElementById('view');
        const path = location.hash.split('?')[0];
        const handler = routes[path] || routes['#/404'];
        view.innerHTML = handler();
        enhance(view);
        renderAuthArea();
    }
};

function enhance(root) {
    root.querySelectorAll('[data-action]')?.forEach(el => {
        el.addEventListener('click', e => {
            const action = el.dataset.action;
            Actions[action]?.(el, e);
        });
    });
}

function renderAuthArea() {
    const area = document.getElementById('authArea');
    const user = Auth.current();
    if (user) {
        const p = Auth.profile();
        area.innerHTML = `
            <span class="pill">Hi, ${p?.username || user.email}</span>
            <a href="#/community" class="btn ghost" data-link>Community</a>
            <button class="btn ghost" data-action="openProfile">Profile</button>
            <button class="btn" data-action="gotoDashboard">Dashboard</button>
            <button class="btn danger" data-action="logout">Logout</button>
        `;
    } else {
        area.innerHTML = `
            <a href="#/community" class="btn ghost" data-link>Community</a>
            <button class="btn ghost" data-action="openLogin">Login</button>
            <button class="btn primary" data-action="openRegister">Sign up</button>
        `;
    }
    enhance(area);
}

// ------------------------------ Actions ------------------------------
const Actions = {
    openLogin() { Router.go('#/auth?mode=login'); },
    openRegister() { Router.go('#/auth?mode=register'); },
    openProfile() { Router.go('#/profile'); },
    gotoDashboard() { Router.go('#/dashboard'); },
    logout() { Auth.logout(); },
    saveProfile(btn) {
        const form = btn.closest('form');
        const data = Object.fromEntries(new FormData(form).entries());
        const interests = data.interests?.split(',').map(s => s.trim()).filter(Boolean) || [];
        const budget = [Number(data.minBudget||0), Number(data.maxBudget||1000)];
        Auth.saveProfile({ username: data.username, picture: data.picture, travelType: data.travelType, interests, budget });
    },
    authSubmit(btn) {
        const form = btn.closest('form');
        const data = Object.fromEntries(new FormData(form).entries());
        const mode = new URLSearchParams(location.hash.split('?')[1]||'').get('mode') || 'login';
        if (mode === 'login') {
            Auth.loginEmail(data.email, data.password);
        } else {
            const validation = validatePassword(data.password);
            if (!validation.valid) { 
                toast(validation.message); 
                return; 
            }
            Auth.loginEmail(data.email, data.password);
        }
    },
    authGoogle() { Auth.loginGoogle(); },
    authFacebook() { Auth.loginGoogle(); }, // Mock Facebook login
    resetPassword(btn) {
        const email = btn.closest('form').querySelector('input[name=email]')?.value || '';
        if (!email) return toast('Enter your email first');
        Auth.resetPassword(email);
    },
    searchDestinations(btn) {
        const q = btn.closest('form').querySelector('input[name=q]')?.value || '';
        if (!q.trim()) return toast('Please enter a destination to search');
        showSearchResults(q);
    },
    applyListingFilters() { renderListings(); },
    openListing(el) { const id = el.dataset.id; Router.go('#/listing'); setTimeout(()=>renderListingDetail(id),0); },
    toggleBookmark(el) {
        const id = el.dataset.id;
        const user = Auth.current(); if (!user) { toast('Login to bookmark'); return; }
        setState(s => {
            const set = s.bookmarks[user.id] || new Set();
            const arr = Array.isArray(set) ? set : Array.from(set);
            const idx = arr.indexOf(id);
            if (idx>=0) arr.splice(idx,1); else arr.push(id);
            s.bookmarks[user.id] = arr;
        });
        renderListings();
        toast('Updated bookmarks');
    },
    addToItinerary(el) {
        const id = el.dataset.id;
        const user = Auth.current(); if (!user) { toast('Login to save'); return; }
        setState(s => {
            const dest = el.dataset.dest || 'General';
            const items = s.itinerary[user.id] || [];
            items.push({ id, dest, date: new Date().toISOString() });
            s.itinerary[user.id] = items;
        });
        toast('Added to itinerary');
    },
    createPost(btn) {
        const user = Auth.current(); if (!user) { toast('Login to post'); return; }
        const form = btn.closest('form');
        const data = Object.fromEntries(new FormData(form).entries());
        setState(s => {
            const id = ++s.forum.lastId;
            const post = { id, author: user.id, title: data.title, body: data.body, category: data.category, tags: data.tags.split(',').map(t=>t.trim()).filter(Boolean), createdAt: Date.now() };
            // Requires admin approval
            s.forum.pending.push(post);
        });
        toast('Post submitted for review');
        Router.go('#/community');
    },
    likePost(el) {
        const user = Auth.current(); if (!user) { toast('Login to react'); return; }
        const id = Number(el.dataset.id);
        setState(s => {
            const key = `${id}`;
            const arr = s.forum.likes[key] || [];
            const i = arr.indexOf(user.id);
            if (i>=0) arr.splice(i,1); else arr.push(user.id);
            s.forum.likes[key] = arr;
        });
        renderCommunity();
    },
    commentPost(el) {
        const user = Auth.current(); if (!user) { toast('Login to comment'); return; }
        const id = Number(el.dataset.id);
        const input = el.closest('.post').querySelector('input[name=comment]');
        const text = input.value.trim(); if (!text) return;
        setState(s => {
            const key = `${id}`;
            const arr = s.forum.comments[key] || [];
            arr.push({ id: uid('c'), user: user.id, text, ts: Date.now() });
            s.forum.comments[key] = arr;
        });
        input.value = '';
        renderCommunity();
    },
    // Admin actions (mocked as current user with email ending admin@)
    adminApprove(el) {
        const id = Number(el.dataset.id);
        setState(s => {
            const idx = s.forum.pending.findIndex(p => p.id===id);
            if (idx>=0) {
                const [p] = s.forum.pending.splice(idx,1);
                s.forum.posts.unshift(p);
            }
        });
        renderCommunity();
    },
    adminRemove(el) {
        const id = Number(el.dataset.id);
        setState(s => {
            s.forum.posts = s.forum.posts.filter(p => p.id!==id);
            delete s.forum.comments[`${id}`];
            delete s.forum.likes[`${id}`];
        });
        renderCommunity();
    },
    openFilters(el) {
        const type = el.dataset.type;
        const options = getFilterOptions(type);
        showFilterModal(type, options);
    },
    openSort(el) {
        const type = el.dataset.type;
        const options = getSortOptions(type);
        showSortModal(type, options);
    },
    getWeather(el) {
        const dest = el.dataset.destination;
        toast(`Getting weather for ${dest}...`);
        // Would integrate with weather API
    },
    getVisaInfo(el) {
        const dest = el.dataset.destination;
        toast(`Checking visa requirements for ${dest}...`);
    },
    getTransport(el) {
        const dest = el.dataset.destination;
        toast(`Getting transport info for ${dest}...`);
    },
    getCultureTips(el) {
        const dest = el.dataset.destination;
        toast(`Getting cultural tips for ${dest}...`);
    }
};

// ------------------------------ Views ------------------------------
Router.register('#/', () => {
    const user = Auth.current();
    const trending = getState().data.trending;
    return `
    <section class="hero">
        <div class="card panel">
            <h1>Plan smarter, travel better.</h1>
            <p class="muted">Discover destinations, find stays and cafes, and build your perfect itinerary.</p>
            <form class="row" onsubmit="return false">
                <input class="input" placeholder="Search destinations..." name="q" />
                <button class="btn primary" data-action="searchDestinations">Search</button>
            </form>
            <div class="spacer"></div>
            ${user? `<div class="badge">Personalized for ${Auth.profile()?.username || user.email}</div>`: '<div class="badge">Welcome explorer</div>'}
        </div>
        <div class="card panel">
            <div class="section-title"><h2>What's Trending</h2></div>
            <div class="grid cols-2">
                ${trending.map(t => `
                    <div class="card">
                        <img class="img" src="${t.image}" alt="${t.title}" />
                        <div class="content"><strong>${t.title}</strong></div>
                    </div>`).join('')}
            </div>
        </div>
    </section>

    <div id="searchResults" class="spacer"></div>
    ${user ? `
    <div class="spacer"></div>
    <section class="card">
        <div class="content">
            <div class="section-title"><h2>Recommendations for you</h2></div>
            <div class="grid cols-3">
                ${getRecommendations().map(cardListing).join('')}
            </div>
        </div>
    </section>
    ` : ''}
    `;
});

Router.register('#/auth', () => {
    const params = new URLSearchParams(location.hash.split('?')[1]||'');
    const mode = params.get('mode') || 'login';
    const isLogin = mode === 'login';
    
    return `
    <div class="auth-container">
        <div class="auth-form">
            <h1 class="auth-title">${isLogin ? 'Log In' : 'Sign Up'}</h1>
            <p class="auth-subtitle">${isLogin ? 'Welcome back! Please enter your details' : 'Create your account to start exploring'}</p>
            
            <form onsubmit="return false">
                <div class="auth-field">
                    <label>Email</label>
                    <input class="auth-input" name="email" type="email" required />
                </div>
                
                <div class="auth-field">
                    <label>Password</label>
                    <div class="auth-input-group">
                        <input class="auth-input" name="password" type="password" required ${!isLogin ? 'oninput="validatePasswordRealTime(this)"' : ''} />
                        <span class="eye-icon" onclick="togglePassword(this)">👁️</span>
                    </div>
                    ${!isLogin ? '<div id="passwordFeedback" class="password-feedback"></div>' : ''}
                    ${isLogin ? '<a href="#" class="auth-forgot" data-action="resetPassword">Forgot password?</a>' : ''}
                </div>
                
                <button class="auth-btn" data-action="authSubmit">${isLogin ? 'Log in' : 'Sign up'}</button>
                
                <div class="auth-divider">
                    <span>Or Continue With</span>
                </div>
                
                <div class="auth-social">
                    <button class="auth-social-btn" data-action="authGoogle">
                        <span>🔍</span> Google
                    </button>
                    <button class="auth-social-btn" data-action="authFacebook">
                        <span>📘</span> Facebook
                    </button>
                </div>
                
                <div class="auth-signup">
                    ${isLogin ? 
                        'Don\'t have an account? <a href="#/auth?mode=register">Sign up</a>' : 
                        'Already have an account? <a href="#/auth?mode=login">Log in</a>'
                    }
                </div>
                
                ${!isLogin ? '<div class="muted" style="margin-top:16px;font-size:12px;">Password must be 8+ chars with letters, numbers, and a symbol.</div>' : ''}
            </form>
        </div>
        
        <div class="auth-visual">
            <img class="auth-visual-image" src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1000&auto=format&fit=crop" alt="Travel destination" />
        </div>
    </div>
    `;
});

Router.register('#/profile', () => {
    const u = Auth.current(); if (!u) return `<div class="empty">Please login first.</div>`;
    const p = Auth.profile();
    return `
    <section class="card">
        <div class="content">
            <div class="section-title"><h2>Your Profile</h2></div>
            <form onsubmit="return false" class="grid cols-2">
                <div>
                    <label>Username</label>
                    <input class="input" name="username" value="${p.username||''}" />
                </div>
                <div>
                    <label>Profile picture URL</label>
                    <input class="input" name="picture" value="${p.picture||''}" />
                </div>
                <div>
                    <label>Travel type</label>
                    <select class="input" name="travelType">
                        ${['solo','family','couple'].map(t=>`<option ${p.travelType===t?'selected':''}>${t}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label>Interests (comma separated)</label>
                    <input class="input" name="interests" value="${(p.interests||[]).join(', ')}" />
                </div>
                <div>
                    <label>Budget min</label>
                    <input class="input" name="minBudget" type="number" value="${p.budget?.[0]||0}" />
                </div>
                <div>
                    <label>Budget max</label>
                    <input class="input" name="maxBudget" type="number" value="${p.budget?.[1]||2000}" />
                </div>
            </form>
            <div class="row"><button class="btn primary" data-action="saveProfile">Save</button></div>
        </div>
    </section>
    `;
});

// Removed destinations route - now integrated into home page search

function showSearchResults(query) {
    const container = document.getElementById('searchResults');
    if (!container) return;
    
    let items = getState().data.listings.filter(l => l.location.toLowerCase().includes(query.toLowerCase()));
    
    if (items.length === 0) {
        container.innerHTML = `<div class="empty">No results found for "${query}"</div>`;
        return;
    }

    const groups = {
        accommodation: items.filter(i=>i.type==='accommodation'),
        attraction: items.filter(i=>i.type==='attraction'),
        restaurant: items.filter(i=>i.type==='cafe'), // Treating cafes as restaurants
    };

    container.innerHTML = `
        <section class="card">
            <div class="content">
                <div class="section-title">
                    <h2>Results for "${query}"</h2>
                    <span class="badge">${items.length} listings found</span>
                </div>
                
                <div class="tabs">
                    <div class="tab active" data-tab="accommodation">Accommodations (${groups.accommodation.length})</div>
                    <div class="tab" data-tab="attraction">Attractions (${groups.attraction.length})</div>
                    <div class="tab" data-tab="restaurant">Restaurants (${groups.restaurant.length})</div>
                    <div class="tab" data-tab="utilities">Things to Know</div>
                </div>
                
                <div class="tab-content">
                    <div id="tab-accommodation" class="tab-panel active">
                        <div class="filter-bar">
                            <button class="btn ghost" data-action="openFilters" data-type="accommodation">Filter</button>
                            <button class="btn ghost" data-action="openSort" data-type="accommodation">Sort</button>
                        </div>
                        <div class="grid cols-3">${groups.accommodation.map(cardListing).join('')}</div>
                    </div>
                    
                    <div id="tab-attraction" class="tab-panel">
                        <div class="filter-bar">
                            <button class="btn ghost" data-action="openFilters" data-type="attraction">Filter</button>
                            <button class="btn ghost" data-action="openSort" data-type="attraction">Sort</button>
                        </div>
                        <div class="grid cols-3">${groups.attraction.map(cardListing).join('')}</div>
                    </div>
                    
                    <div id="tab-restaurant" class="tab-panel">
                        <div class="filter-bar">
                            <button class="btn ghost" data-action="openFilters" data-type="restaurant">Filter</button>
                            <button class="btn ghost" data-action="openSort" data-type="restaurant">Sort</button>
                        </div>
                        <div class="grid cols-3">${groups.restaurant.map(cardListing).join('')}</div>
                    </div>
                    
                    <div id="tab-utilities" class="tab-panel">
                        <div class="card">
                            <div class="content">
                                <h3>Weather & Climate</h3>
                                <p>Check current weather conditions and seasonal recommendations.</p>
                                <button class="btn" data-action="getWeather" data-destination="${query}">Get Weather</button>
                            </div>
                        </div>
                        <div class="card">
                            <div class="content">
                                <h3>Visa Requirements</h3>
                                <p>Find visa requirements based on your nationality.</p>
                                <button class="btn" data-action="getVisaInfo" data-destination="${query}">Check Visa</button>
                            </div>
                        </div>
                        <div class="card">
                            <div class="content">
                                <h3>Transportation</h3>
                                <p>Local transport options and costs.</p>
                                <button class="btn" data-action="getTransport" data-destination="${query}">Transport Info</button>
                            </div>
                        </div>
                        <div class="card">
                            <div class="content">
                                <h3>Cultural Tips</h3>
                                <p>Local customs, dress codes, and safety tips.</p>
                                <button class="btn" data-action="getCultureTips" data-destination="${query}">Cultural Guide</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    `;
    
    enhance(container);
    wireTabSwitching();
}

// Removed separate Listings route. Listings now render inside Destinations search results.

function cardListing(l) {
    return `
    <div class="card">
        <img class="img" src="${l.images?.[0]||''}" alt="${l.name}" />
        <div class="content">
            <div class="row" style="justify-content:space-between">
                <strong>${l.name}</strong>
                <span class="rating">★ ${l.rating}</span>
            </div>
            <div class="muted">${l.location} · ${l.type}</div>
            <div class="row">
                <button class="btn" data-action="openListing" data-id="${l.id}">Details</button>
                <button class="btn ghost" data-action="toggleBookmark" data-id="${l.id}">Bookmark</button>
                <button class="btn" data-action="addToItinerary" data-id="${l.id}" data-dest="${l.location}">Add to Itinerary</button>
            </div>
        </div>
    </div>`;
}

function renderListings() {
    const s = getState();
    const type = document.getElementById('fltType')?.value || '';
    const traveler = document.getElementById('fltTraveler')?.value || '';
    const sort = document.getElementById('fltSort')?.value || '';
    let items = s.data.listings.slice();
    if (type) items = items.filter(i => i.type===type);
    if (traveler) items = items.filter(i => i.travelerTypes.includes(traveler));
    if (sort==='price') items.sort((a,b)=>a.price-b.price);
    if (sort==='rating') items.sort((a,b)=>b.rating-a.rating);
    if (sort==='popularity') items.sort((a,b)=> (b.rating*100 + b.price) - (a.rating*100 + a.price));
    const container = document.getElementById('listingResults');
    if (!container) return;
    container.innerHTML = `<div class="grid cols-3">${items.map(cardListing).join('')}</div>`;
    enhance(container);
}

Router.register('#/listing', () => `<div id="detailMount" class="grid cols-2"></div>`);

function renderListingDetail(id) {
    const l = getState().data.listings.find(x=>x.id===id) || getState().data.listings[0];
    const mount = document.getElementById('detailMount'); if (!mount) return;
    mount.innerHTML = `
        <div class="card">
            <img class="img" src="${l.images?.[0]||''}" alt="${l.name}" />
            <div class="content">
                <h2>${l.name}</h2>
                <div class="muted">${l.location} · ${l.type}</div>
                <div class="row"><span class="rating">★ ${l.rating}</span><span class="pill">$${l.price}</span></div>
                <p>${l.description}</p>
                <div class="row wrap">
                    <span class="tag">Address: ${l.address}</span>
                    <span class="tag">Contact: ${l.contact}</span>
                    <a class="tag" href="${l.map}" target="_blank">Open map</a>
                </div>
                <div class="row">
                    <button class="btn ghost" data-action="toggleBookmark" data-id="${l.id}">Bookmark</button>
                    <button class="btn" data-action="addToItinerary" data-id="${l.id}" data-dest="${l.location}">Add to Itinerary</button>
                </div>
            </div>
        </div>
        <div class="card">
            <div class="content">
                <div class="section-title"><h2>Ratings & Reviews</h2></div>
                <div class="comment">“Loved the vibe and location.” — Guest</div>
                <div class="comment">“Great value and friendly staff.” — Traveller</div>
            </div>
        </div>
    `;
    enhance(mount);
}

Router.register('#/community', () => {
    return `
    <section class="grid cols-2">
        <div class="card">
            <div class="content">
                <div class="section-title"><h2>Create a Post</h2></div>
                <form onsubmit="return false" class="grid cols-2">
                    <input class="input" name="title" placeholder="Title" />
                    <select class="input" name="category">
                        <option>General</option>
                        <option>Tips</option>
                        <option>Visas</option>
                        <option>Itineraries</option>
                    </select>
                    <input class="input" name="tags" placeholder="Tags (comma separated)" />
                    <input class="input" name="body" placeholder="Ask or share something..." />
                </form>
                <button class="btn" data-action="createPost">Submit for Review</button>
            </div>
        </div>
        <div class="card">
            <div class="content">
                <div class="section-title"><h2>Community</h2></div>
                <div id="communityFeed"></div>
            </div>
        </div>
    </section>
    `;
});

function renderCommunity() {
    const mount = document.getElementById('communityFeed'); if (!mount) return;
    const s = getState();
    const isAdmin = s.auth.user?.email?.includes('admin@');
    const posts = s.forum.posts;
    mount.innerHTML = posts.length? posts.map(p => `
        <div class="post card">
            <div class="content">
                <div class="row" style="justify-content:space-between">
                    <strong>${p.title}</strong>
                    <span class="pill">${p.category}</span>
                </div>
                <div class="muted">Tags: ${p.tags.join(', ')||'-'}</div>
                <p>${p.body}</p>
                <div class="row">
                    <button class="btn" data-action="likePost" data-id="${p.id}">Like (${(s.forum.likes[`${p.id}`]||[]).length})</button>
                    <input class="input" name="comment" placeholder="Write a comment" />
                    <button class="btn" data-action="commentPost" data-id="${p.id}">Comment</button>
                    ${isAdmin? `<button class="btn danger" data-action="adminRemove" data-id="${p.id}">Remove</button>`:''}
                </div>
                <div>
                    ${(s.forum.comments[`${p.id}`]||[]).map(c=>`<div class="comment"><strong>${usernameById(c.user)}:</strong> ${c.text}</div>`).join('')}
                </div>
            </div>
        </div>
    `).join('') : `<div class="empty">No posts yet.</div>`;

    const pendingMount = document.createElement('div');
    if (s.forum.pending.length) {
        pendingMount.innerHTML = `
            <div class="spacer"></div>
            <div class="badge">Pending approval (${s.forum.pending.length})</div>
            ${isAdmin? s.forum.pending.map(p=>`<div class="post card"><div class="content"><strong>${p.title}</strong><div class="row"><button class="btn" data-action="adminApprove" data-id="${p.id}">Approve</button></div></div></div>`).join(''):''}
        `;
        mount.appendChild(pendingMount);
        enhance(pendingMount);
    }
    enhance(mount);
}

Router.register('#/destination', () => {
    return `
    <section class="grid cols-2">
        <div class="card"><div class="content">
            <div class="section-title"><h2>Destination Utilities</h2></div>
            <form class="row" onsubmit="return false">
                <input class="input" name="city" placeholder="City (e.g., Paris)" />
                <input class="input" name="country" placeholder="Country code (e.g., FR)" />
                <select class="input" name="nationality">
                    <option value="IN">Indian</option>
                    <option value="US">American</option>
                    <option value="GB">British</option>
                    <option value="AU">Australian</option>
                </select>
                <button class="btn" id="btnWeather">Get info</button>
            </form>
            <div id="destInfo" class="spacer"></div>
        </div></div>
        <div class="card"><div class="content">
            <div class="section-title"><h2>Local Guides & Tours</h2></div>
            <div class="grid cols-2">
                ${getState().data.listings.map(l=>`<div class="card"><div class="content"><strong>${l.name} Guide</strong><div class="muted">${l.location}</div><button class="btn">Contact</button></div></div>`).join('')}
            </div>
        </div></div>
    </section>
    `;
});

async function fetchWeather(city) {
    // Using Open-Meteo geocoding + forecast
    try {
        const g = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`).then(r=>r.json());
        const loc = g.results?.[0];
        if (!loc) return null;
        const fc = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current_weather=true`).then(r=>r.json());
        return { city: loc.name, country: loc.country_code, temp: fc.current_weather?.temperature, wind: fc.current_weather?.windspeed };
    } catch(e) { return null; }
}

function visaText(countryFrom, countryTo) {
    // Mock rules; in real app this would query an API/database
    if (countryFrom==='IN' && countryTo==='FR') return 'Schengen visa required for Indian nationals.';
    if (countryFrom==='US' && countryTo==='GB') return 'Visa-free up to 6 months for US passport holders.';
    return 'Check official embassy website for the latest visa requirements.';
}

function transportTips(city) {
    return [
        { mode: 'Metro', cost: '$2-4', tip: 'Buy a day pass for savings.' },
        { mode: 'Taxi', cost: '$10-20', tip: 'Use licensed cabs or apps.' },
        { mode: 'Bike', cost: '$5/day', tip: 'Great for short distances and scenic routes.' },
    ];
}

function cultureSafety(city, country) {
    return [
        'Respect local customs and dress codes in religious sites.',
        'Keep emergency numbers handy; avoid isolated areas late night.',
        'Carry a copy of your ID and travel insurance.',
    ];
}

async function wireDestinationUtilities() {
    const btn = document.getElementById('btnWeather');
    if (!btn) return;
    btn.addEventListener('click', async () => {
        const form = btn.closest('form');
        const city = form.querySelector('input[name=city]').value || 'Paris';
        const country = form.querySelector('input[name=country]').value || 'FR';
        const nationality = form.querySelector('select[name=nationality]').value || 'IN';
        const info = document.getElementById('destInfo');
        info.innerHTML = '<div class="muted">Loading...</div>';
        const w = await fetchWeather(city);
        const tips = transportTips(city);
        const cs = cultureSafety(city, country);
        info.innerHTML = `
            <div class="card"><div class="content">
                <div class="section-title"><h2>Weather</h2></div>
                ${w? `<div>${w.city}, ${w.country} · ${w.temp}°C · Wind ${w.wind} km/h</div>`: '<div class="muted">Not available</div>'}
            </div></div>
            <div class="spacer"></div>
            <div class="card"><div class="content">
                <div class="section-title"><h2>Visa Guidelines</h2></div>
                <div>${visaText(nationality, country)}</div>
            </div></div>
            <div class="spacer"></div>
            <div class="card"><div class="content">
                <div class="section-title"><h2>Local Transport</h2></div>
                ${tips.map(t=>`<div class="row"><span class="pill">${t.mode}</span><span class="muted">${t.cost}</span><span>${t.tip}</span></div>`).join('')}
            </div></div>
            <div class="spacer"></div>
            <div class="card"><div class="content">
                <div class="section-title"><h2>Cultural & Safety Tips</h2></div>
                <ul>${cs.map(x=>`<li>${x}</li>`).join('')}</ul>
            </div></div>
        `;
    });
}

Router.register('#/dashboard', () => {
    const u = Auth.current(); if (!u) return `<div class="empty">Login to view your dashboard.</div>`;
    const s = getState();
    const bookmarks = (s.bookmarks[u.id]||[]).map(id => s.data.listings.find(l=>l.id===id)).filter(Boolean);
    const itinerary = s.itinerary[u.id]||[];
    return `
    <section class="grid cols-2">
        <div class="card"><div class="content">
            <div class="section-title"><h2>Bookmarks</h2></div>
            ${bookmarks.length? `<div class="grid cols-2">${bookmarks.map(cardListing).join('')}</div>`: '<div class="empty">No bookmarks yet.</div>'}
        </div></div>
        <div class="card"><div class="content">
            <div class="section-title"><h2>Itinerary</h2></div>
            ${itinerary.length? itinerary.map(i=>{
                const l = s.data.listings.find(x=>x.id===i.id);
                return `<div class="list-item card"><img class="img" style="height:100px" src="${l.images?.[0]}"/><div class="content"><strong>${l.name}</strong><div class="muted">${i.dest}</div><div class="muted">Saved: ${new Date(i.date).toLocaleString()}</div></div></div>`;
            }).join('') : '<div class="empty">No items in itinerary.</div>'}
        </div></div>
    </section>
    `;
});

Router.register('#/404', () => `<div class="empty">Page not found.</div>`);

function usernameById(id){
    const entries = Object.values(getState().users);
    const u = entries.find(u=>u.id===id);
    const p = u? getState().profiles[u.id] : null;
    return p?.username || u?.email || 'User';
}

function getRecommendations() {
    const user = Auth.current();
    const s = getState();
    let items = s.data.listings.slice();
    if (!user) return items.slice(0,3);
    const p = s.profiles[user.id];
    items = items.filter(i => i.travelerTypes.includes(p.travelType));
    items = items.sort((a,b)=> (score(b,p) - score(a,p)));
    return items.slice(0,3);

    function score(item, prof){
        let sc = 0;
        if (item.price>=prof.budget[0] && item.price<=prof.budget[1]) sc+=2;
        sc += (item.travelerTypes.includes(prof.travelType)?3:0);
        sc += Math.min(item.rating,5);
        return sc;
    }
}

function validatePassword(pw){
    if (!pw || pw.length < 8) return { valid: false, message: 'Password must be at least 8 characters long' };
    
    const hasLetter = /[A-Za-z]/.test(pw);
    const hasNumber = /\d/.test(pw);
    const hasSymbol = /[^A-Za-z0-9]/.test(pw);
    
    if (!hasLetter) return { valid: false, message: 'Password must contain at least one letter' };
    if (!hasNumber) return { valid: false, message: 'Password must contain at least one number' };
    if (!hasSymbol) return { valid: false, message: 'Password must contain at least one symbol (!@#$%^&*)' };
    
    // Check for invalid characters (only allow alphanumeric and common symbols)
    const validChars = /^[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]+$/;
    if (!validChars.test(pw)) return { valid: false, message: 'Password contains invalid characters' };
    
    return { valid: true, message: 'Password is strong' };
}

function togglePassword(eyeIcon) {
    const input = eyeIcon.previousElementSibling;
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    eyeIcon.textContent = isPassword ? '🙈' : '👁️';
}

function validatePasswordRealTime(input) {
    const feedback = document.getElementById('passwordFeedback');
    if (!feedback) return;
    
    const password = input.value;
    const validation = validatePassword(password);
    
    if (password.length === 0) {
        feedback.innerHTML = '';
        feedback.className = 'password-feedback';
        return;
    }
    
    feedback.textContent = validation.message;
    feedback.className = `password-feedback ${validation.valid ? 'valid' : 'invalid'}`;
    
    // Visual feedback on input
    input.style.borderColor = validation.valid ? '#22c55e' : '#ef4444';
}

function wireTabSwitching() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            // Update active tab
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update active panel
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            document.getElementById(`tab-${targetTab}`).classList.add('active');
        });
    });
}

function getFilterOptions(type) {
    const baseOptions = ['Price Range', 'Rating', 'Traveler Type'];
    const specificOptions = {
        accommodation: [...baseOptions, 'Amenities', 'Room Type', 'Location'],
        attraction: [...baseOptions, 'Category', 'Duration', 'Accessibility'],
        restaurant: [...baseOptions, 'Cuisine Type', 'Price Level', 'Dietary Options']
    };
    return specificOptions[type] || baseOptions;
}

function getSortOptions(type) {
    const baseOptions = ['Price: Low to High', 'Price: High to Low', 'Rating: High to Low', 'Popularity'];
    const specificOptions = {
        accommodation: [...baseOptions, 'Distance from Center', 'Check-in Time'],
        attraction: [...baseOptions, 'Opening Hours', 'Duration'],
        restaurant: [...baseOptions, 'Distance', 'Opening Hours']
    };
    return specificOptions[type] || baseOptions;
}

function showFilterModal(type, options) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Filter ${type}</h3>
            <div class="filter-options">
                ${options.map(opt => `<label><input type="checkbox" value="${opt}"> ${opt}</label>`).join('')}
            </div>
            <div class="modal-actions">
                <button class="btn" onclick="this.closest('.modal').remove()">Apply</button>
                <button class="btn ghost" onclick="this.closest('.modal').remove()">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function showSortModal(type, options) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Sort ${type}</h3>
            <div class="sort-options">
                ${options.map(opt => `<label><input type="radio" name="sort" value="${opt}"> ${opt}</label>`).join('')}
            </div>
            <div class="modal-actions">
                <button class="btn" onclick="this.closest('.modal').remove()">Apply</button>
                <button class="btn ghost" onclick="this.closest('.modal').remove()">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// ------------------------------ Init ------------------------------
window.addEventListener('DOMContentLoaded', () => {
    setYear();
    // initialize storage if empty
    Store.write(getState());
    Router.start();
    // initial renders for dynamic sections
    // listings integrated in destinations
    if (location.hash==="#/community") renderCommunity();
    if (location.hash==="#/destination") wireDestinationUtilities();
});

window.addEventListener('hashchange', () => {
    // listings integrated in destinations
    if (location.hash==="#/community") renderCommunity();
    if (location.hash==="#/destination") wireDestinationUtilities();
});


