// --- DATABASE AND CONFIGURATION ---
const DEFAULT_MENU = [
    { id: 'c1', name: 'Signature Gold Latte', category: 'coffee', price: 6.50, description: 'Smooth espresso, steamed organic milk, and edible 24k gold flakes.', image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=600', isPopular: true, prepTime: 3 },
    { id: 'c2', name: 'Cold Brew Amber Nitro', category: 'coffee', price: 5.75, description: 'Nitrogen-infused cold brew with notes of dark chocolate and honey.', image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&q=80&w=600', isPopular: false, prepTime: 2 },
    { id: 'c3', name: 'Velvet Flat White', category: 'coffee', price: 5.25, description: 'Perfect ristretto espresso shots topped with micro-foamed milk.', image: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?auto=format&fit=crop&q=80&w=600', isPopular: true, prepTime: 3 },
    { id: 't1', name: 'Ceremonial Matcha Latte', category: 'tea', price: 6.00, description: 'Japanese ceremonial grade matcha whisked with oat milk and agave.', image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&q=80&w=600', isPopular: true, prepTime: 4 },
    { id: 't2', name: 'Crimson Hibiscus Punch', category: 'tea', price: 5.00, description: 'Sweet-tart iced hibiscus tea infused with citrus juices and fresh mint.', image: 'https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&q=80&w=600', isPopular: false, prepTime: 2 },
    { id: 's1', name: 'Truffle Grilled Cheese', category: 'snacks', price: 11.50, description: 'Artisanal sourdough with fontina, white cheddar, and black truffle oil.', image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=600', isPopular: true, prepTime: 6 },
    { id: 's2', name: 'Warm Butter Croissant', category: 'snacks', price: 4.50, description: 'Flaky, buttery French pastry served warm with house-made jam.', image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=600', isPopular: true, prepTime: 2 },
    { id: 'd1', name: 'Espresso Tiramisu', category: 'desserts', price: 8.50, description: 'Mascarpone cream, espresso-soaked ladyfingers, and cocoa dust.', image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&q=80&w=600', isPopular: true, prepTime: 4 },
    { id: 'd2', name: 'Warm Chocolate Lava Cake', category: 'desserts', price: 9.00, description: 'Rich chocolate cake with a molten center, served with vanilla bean gelato.', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=600', isPopular: false, prepTime: 5 }
];

const DEFAULT_INVENTORY = {
    'c1': 50,
    'c2': 40,
    'c3': 60,
    't1': 30,
    't2': 45,
    's1': 15,
    's2': 25,
    'd1': 20,
    'd2': 18
};

// --- INITIALIZE STORAGE ---
function initDatabase() {
    if (!localStorage.getItem('smart_cafe_db')) {
        const initialDB = {
            menu: DEFAULT_MENU,
            inventory: DEFAULT_INVENTORY,
            cart: [],
            currentOrder: null,
            ordersHistory: [
                { id: '1001', table: '4', items: [{ id: 'c1', name: 'Signature Gold Latte', price: 6.50, qty: 2 }], discount: 0, subtotal: 13.00, tax: 2.34, total: 15.34, status: 'Delivered', timestamp: Date.now() - 3600000 * 3 },
                { id: '1002', table: '7', items: [{ id: 's1', name: 'Truffle Grilled Cheese', price: 11.50, qty: 1 }, { id: 't1', name: 'Ceremonial Matcha Latte', price: 6.00, qty: 1 }], discount: 1.75, subtotal: 17.50, tax: 2.84, total: 18.59, status: 'Delivered', timestamp: Date.now() - 3600000 * 2.5 },
                { id: '1003', table: '2', items: [{ id: 'c3', name: 'Velvet Flat White', price: 5.25, qty: 1 }, { id: 'd2', name: 'Warm Chocolate Lava Cake', price: 9.00, qty: 1 }], discount: 0, subtotal: 14.25, tax: 2.57, total: 16.82, status: 'Delivered', timestamp: Date.now() - 3600000 * 1.2 }
            ],
            rewards: {
                points: 150,
                level: 'Silver',
                history: [
                    { desc: 'Initial Signup Bonus', points: 100, date: new Date().toLocaleDateString() },
                    { desc: 'Order #1001 Earned Points', points: 15, date: new Date().toLocaleDateString() },
                    { desc: 'Order #1002 Earned Points', points: 18, date: new Date().toLocaleDateString() },
                    { desc: 'Order #1003 Earned Points', points: 17, date: new Date().toLocaleDateString() }
                ]
            },
            reviews: [
                { rating: 5, comment: 'Absolutely amazing coffee! The gold flake garnish feels so premium.', sentiment: 'positive', satisfaction: 100, date: new Date().toLocaleDateString() },
                { rating: 4, comment: 'Lava cake was brilliant, service was clean and fast.', sentiment: 'positive', satisfaction: 80, date: new Date().toLocaleDateString() }
            ],
            settings: {
                activeStaff: 3,
                avgPrepTimeMinutes: 4,
                kitchenQueueSize: 2
            },
            theme: 'dark'
        };
        localStorage.setItem('smart_cafe_db', JSON.stringify(initialDB));
    }
}

initDatabase();

// --- DB ACCESSOR UTILITIES ---
const AppDB = {
    get() {
        return JSON.parse(localStorage.getItem('smart_cafe_db'));
    },
    save(data) {
        localStorage.setItem('smart_cafe_db', JSON.stringify(data));
    },
    updateKey(key, value) {
        const db = this.get();
        db[key] = value;
        this.save(db);
    }
};

// --- DYNAMIC NAVIGATION AND COMMON TEMPLATES ---
document.addEventListener('DOMContentLoaded', () => {
    injectHeader();
    injectFooter();
    setupTheme();
    updateCartCount();
    setupMobileMenu();
});

function injectHeader() {
    const header = document.querySelector('header');
    if (!header) return;

    const db = AppDB.get();
    const activePage = window.location.pathname.split('/').pop() || 'index.html';
    
    header.innerHTML = `
        <div class="container nav-container">
            <a href="index.html" class="logo">
                <i class="logo-icon" data-lucide="coffee"></i>
                <span>SmartCafé</span>
            </a>
            <ul class="nav-links">
                <li><a href="index.html" class="${activePage === 'index.html' ? 'active' : ''}">Home</a></li>
                <li><a href="menu.html" class="${activePage === 'menu.html' ? 'active' : ''}">Menu</a></li>
                <li><a href="cart.html" class="${activePage === 'cart.html' ? 'active' : ''}">Cart</a></li>
                <li><a href="tracking.html" class="${activePage === 'tracking.html' ? 'active' : ''}">Track</a></li>
                <li><a href="billing.html" class="${activePage === 'billing.html' ? 'active' : ''}">Billing</a></li>
                <li><a href="rewards.html" class="${activePage === 'rewards.html' ? 'active' : ''}">Rewards</a></li>
                <li><a href="feedback.html" class="${activePage === 'feedback.html' ? 'active' : ''}">Feedback</a></li>
                <li><a href="admin.html" class="${activePage === 'admin.html' ? 'active' : ''}">Admin</a></li>
            </ul>
            <div class="nav-actions">
                <button class="theme-switch" id="theme-btn" title="Toggle Light/Dark Mode">
                    <i data-lucide="${db.theme === 'light' ? 'moon' : 'sun'}"></i>
                </button>
                <a href="cart.html" class="cart-trigger btn btn-secondary btn-icon" title="View Cart">
                    <i data-lucide="shopping-cart"></i>
                    <span class="cart-badge" id="cart-count">0</span>
                </a>
                <button class="menu-toggle" id="menu-toggle-btn">
                    <i data-lucide="menu"></i>
                </button>
            </div>
        </div>
    `;
    
    if (window.lucide) {
        lucide.createIcons();
    }
}

function injectFooter() {
    const footer = document.querySelector('footer');
    if (!footer) return;

    footer.innerHTML = `
        <div class="container">
            <div class="footer-grid">
                <div class="footer-brand">
                    <a href="index.html" class="logo">
                        <i class="logo-icon" data-lucide="coffee"></i>
                        <span>SmartCafé</span>
                    </a>
                    <p>Elevating your daily coffee ritual through artisan flavors and cutting-edge waiting intelligence.</p>
                    <div class="footer-socials">
                        <a href="#"><i data-lucide="instagram"></i></a>
                        <a href="#"><i data-lucide="facebook"></i></a>
                        <a href="#"><i data-lucide="twitter"></i></a>
                    </div>
                </div>
                <div class="footer-links">
                    <h4>Quick Links</h4>
                    <ul>
                        <li><a href="index.html">Home</a></li>
                        <li><a href="menu.html">Smart Menu</a></li>
                        <li><a href="cart.html">Shopping Cart</a></li>
                        <li><a href="tracking.html">Live Tracking</a></li>
                    </ul>
                </div>
                <div class="footer-links">
                    <h4>Experience</h4>
                    <ul>
                        <li><a href="rewards.html">Loyalty Program</a></li>
                        <li><a href="feedback.html">Share Feedback</a></li>
                        <li><a href="admin.html">Admin Portal</a></li>
                    </ul>
                </div>
                <div class="footer-contact">
                    <h4>Location & Hours</h4>
                    <p><i data-lucide="map-pin"></i> 100 Premium Way, Coffee District</p>
                    <p><i data-lucide="clock"></i> Mon - Sun: 7:00 AM - 10:00 PM</p>
                    <p><i data-lucide="phone"></i> +1 (555) 762-7822</p>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; ${new Date().getFullYear()} SmartCafé Technologies Inc. All rights reserved.</p>
                <p>Luxury Dining. Zero Waiting.</p>
            </div>
        </div>
    `;
    
    if (window.lucide) {
        lucide.createIcons();
    }
}

// --- THEME MANAGEMENT ---
function setupTheme() {
    const db = AppDB.get();
    const theme = db.theme || 'dark';
    document.body.setAttribute('data-theme', theme);

    const btn = document.getElementById('theme-btn');
    if (btn) {
        btn.addEventListener('click', () => {
            const currentTheme = document.body.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            document.body.setAttribute('data-theme', newTheme);
            AppDB.updateKey('theme', newTheme);
            
            // Update icon
            const icon = btn.querySelector('svg');
            if (icon && window.lucide) {
                btn.innerHTML = `<i data-lucide="${newTheme === 'light' ? 'moon' : 'sun'}"></i>`;
                lucide.createIcons();
            }
        });
    }
}

// --- CART COUNTER ---
function updateCartCount() {
    const db = AppDB.get();
    const countEl = document.getElementById('cart-count');
    if (countEl) {
        const totalItems = db.cart.reduce((sum, item) => sum + item.qty, 0);
        countEl.textContent = totalItems;
        countEl.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

// --- MOBILE MENU ---
function setupMobileMenu() {
    const toggleBtn = document.getElementById('menu-toggle-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (toggleBtn && navLinks) {
        toggleBtn.addEventListener('click', () => {
            navLinks.classList.toggle('mobile-open');
            const isOpen = navLinks.classList.contains('mobile-open');
            toggleBtn.innerHTML = `<i data-lucide="${isOpen ? 'x' : 'menu'}"></i>`;
            if (window.lucide) lucide.createIcons();
        });
    }
}

// --- GLOBAL NOTIFICATION SYSTEM ---
const NotificationSystem = {
    show(message, type = 'info', duration = 3500) {
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            document.body.appendChild(container);
        }

        const notification = document.createElement('div');
        notification.className = `notification glass-card ${type}`;
        
        let iconName = 'info';
        if (type === 'success') iconName = 'check-circle';
        if (type === 'error') iconName = 'alert-triangle';
        
        notification.innerHTML = `
            <i data-lucide="${iconName}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(notification);
        if (window.lucide) lucide.createIcons();

        // Slide in animation completed, schedule exit
        setTimeout(() => {
            notification.style.animation = 'slideInRight 0.3s ease reverse forwards';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, duration);
    }
};
