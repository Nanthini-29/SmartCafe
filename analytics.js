// --- ADMIN ANALYTICS AND CHART CONFIGURATIONS ---

const Analytics = {
    charts: {},

    init() {
        if (typeof Chart === 'undefined') {
            console.error('Chart.js CDN is not loaded. Skipping chart rendering.');
            return;
        }

        // Apply global chart styling defaults for dark/light themes
        this.applyChartDefaults();

        // Render dashboard statistics and analytics charts
        this.renderStats();
        this.renderSalesChart();
        this.renderPopularItemsChart();
        this.renderRushHourChart();
        this.renderSatisfactionChart();
    },

    applyChartDefaults() {
        const isLight = document.body.getAttribute('data-theme') === 'light';
        const gridColor = isLight ? 'rgba(139, 115, 85, 0.08)' : 'rgba(255, 255, 255, 0.05)';
        const textColor = isLight ? '#74675b' : '#c2b5a7';

        Chart.defaults.color = textColor;
        Chart.defaults.scale.grid.color = gridColor;
        Chart.defaults.responsive = true;
        Chart.defaults.maintainAspectRatio = false;
    },

    renderStats() {
        const db = AppDB.get();
        const orders = db.ordersHistory || [];
        
        // 1. Total Orders
        const totalOrders = orders.length;
        document.getElementById('stat-total-orders').textContent = totalOrders;

        // 2. Revenue Calculation
        const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
        document.getElementById('stat-revenue').textContent = `$${totalRevenue.toFixed(2)}`;

        // 3. Active Customers (simulated based on queue + takeaway)
        const activeCustomers = db.settings.kitchenQueueSize + Math.round(Math.random() * 2);
        document.getElementById('stat-active-customers').textContent = activeCustomers;

        // 4. Popular Items Text
        const itemCounts = {};
        orders.forEach(o => {
            o.items.forEach(i => {
                itemCounts[i.name] = (itemCounts[i.name] || 0) + i.qty;
            });
        });
        
        let popularItemName = "Signature Gold Latte";
        let maxCount = 0;
        for (const [name, count] of Object.entries(itemCounts)) {
            if (count > maxCount) {
                maxCount = count;
                popularItemName = name;
            }
        }
        document.getElementById('stat-popular-item').textContent = popularItemName;
    },

    renderSalesChart() {
        const ctx = document.getElementById('salesChart');
        if (!ctx) return;

        if (this.charts.sales) this.charts.sales.destroy();

        const db = AppDB.get();
        const orders = db.ordersHistory || [];
        
        // Daily revenue for last 5 orders/days
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const revenue = [45.20, 78.50, 62.10, 94.80, 110.30, 145.60, 168.20]; // default fallback values

        // Seed some live revenue based on orders history
        if (orders.length > 0) {
            // Put current day sales on Sunday/today
            revenue[revenue.length - 1] = orders.reduce((sum, o) => sum + o.total, 0);
        }

        const isLight = document.body.getAttribute('data-theme') === 'light';
        const goldColor = isLight ? '#a67c1e' : '#d4af37';
        const amberColor = isLight ? '#c6741d' : '#e59837';

        this.charts.sales = new Chart(ctx, {
            type: 'line',
            data: {
                labels: days,
                datasets: [
                    {
                        label: 'Revenue ($)',
                        data: revenue,
                        borderColor: goldColor,
                        backgroundColor: 'rgba(212, 175, 55, 0.15)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    },

    renderPopularItemsChart() {
        const ctx = document.getElementById('popularChart');
        if (!ctx) return;

        if (this.charts.popular) this.charts.popular.destroy();

        const db = AppDB.get();
        const orders = db.ordersHistory || [];
        
        const itemCounts = {
            'Signature Gold Latte': 12,
            'Warm Butter Croissant': 10,
            'Truffle Grilled Cheese': 8,
            'Ceremonial Matcha Latte': 6,
            'Espresso Tiramisu': 5
        };

        // Recalculate with real order history
        orders.forEach(o => {
            o.items.forEach(item => {
                itemCounts[item.name] = (itemCounts[item.name] || 0) + item.qty;
            });
        });

        // Get top 5 sorted
        const sortedItems = Object.entries(itemCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        const labels = sortedItems.map(item => item[0]);
        const data = sortedItems.map(item => item[1]);

        const isLight = document.body.getAttribute('data-theme') === 'light';
        const barColor = isLight ? 'rgba(166, 124, 30, 0.8)' : 'rgba(212, 175, 55, 0.8)';
        const hoverColor = isLight ? 'rgba(198, 116, 29, 0.9)' : 'rgba(229, 152, 55, 0.9)';

        this.charts.popular = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Orders Count',
                    data: data,
                    backgroundColor: barColor,
                    hoverBackgroundColor: hoverColor,
                    borderRadius: 6,
                    borderWidth: 0
                }]
            },
            options: {
                indexAxis: 'y',
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { beginAtZero: true }
                }
            }
        });
    },

    renderRushHourChart() {
        const ctx = document.getElementById('rushHourChart');
        if (!ctx) return;

        if (this.charts.rushHour) this.charts.rushHour.destroy();

        const rushData = AI.predictRushHours();
        const labels = rushData.map(r => r.hour);
        const loads = rushData.map(r => r.load);

        const isLight = document.body.getAttribute('data-theme') === 'light';
        const goldColor = isLight ? 'rgba(166, 124, 30, 0.65)' : 'rgba(212, 175, 55, 0.65)';

        this.charts.rushHour = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Store Busy Level (%)',
                    data: loads,
                    backgroundColor: loads.map(load => {
                        if (load >= 80) return isLight ? '#af3e2c' : '#d44c37'; // High Load (Red)
                        if (load >= 50) return isLight ? '#c6741d' : '#e59837'; // Moderate Load (Amber)
                        return goldColor; // Low Load
                    }),
                    borderRadius: 4
                }]
            },
            options: {
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { max: 100, beginAtZero: true }
                }
            }
        });
    },

    renderSatisfactionChart() {
        const ctx = document.getElementById('satisfactionChart');
        if (!ctx) return;

        if (this.charts.satisfaction) this.charts.satisfaction.destroy();

        const db = AppDB.get();
        const reviews = db.reviews || [];

        // Count sentiments
        let positive = 3;
        let neutral = 1;
        let negative = 0;

        reviews.forEach(r => {
            if (r.sentiment === 'positive') positive++;
            else if (r.sentiment === 'negative') negative++;
            else neutral++;
        });

        const totalReviews = positive + neutral + negative;
        const score = Math.round((positive / totalReviews) * 100);
        
        // Update satisfaction text gauge
        const scoreEl = document.getElementById('satisfaction-pct-value');
        if (scoreEl) {
            scoreEl.textContent = `${score}%`;
        }

        this.charts.satisfaction = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Delighted 😊', 'Neutral 😐', 'Disappointed 😠'],
                datasets: [{
                    data: [positive, neutral, negative],
                    backgroundColor: [
                        '#37d4a4', // Green
                        '#e59837', // Amber
                        '#d44c37'  // Red
                    ],
                    borderWidth: 2,
                    borderColor: document.body.getAttribute('data-theme') === 'light' ? '#fff' : '#14100e'
                }]
            },
            options: {
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { boxWidth: 12 }
                    }
                },
                cutout: '60%'
            }
        });
    }
};

// Listen for custom theme updates to redraw charts appropriately
document.addEventListener('click', (e) => {
    if (e.target.closest('#theme-btn')) {
        setTimeout(() => {
            Analytics.applyChartDefaults();
            Analytics.renderSalesChart();
            Analytics.renderPopularItemsChart();
            Analytics.renderRushHourChart();
            Analytics.renderSatisfactionChart();
        }, 50);
    }
});
