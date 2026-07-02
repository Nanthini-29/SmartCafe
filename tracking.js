// --- LIVE ORDER TRACKING AND QUEUE SIMULATION ---

const Tracking = {
    // Map order statuses to progress percentages and descriptions
    statusWorkflow: [
        { status: 'Received', pct: 10, desc: 'We have received your order and sent it to the kitchen.' },
        { status: 'Preparing', pct: 35, desc: 'Our baristas/chefs are gathering premium ingredients.' },
        { status: 'Cooking', pct: 65, desc: 'Your beverages and food are being brewed and cooked.' },
        { status: 'Ready for Pickup', pct: 90, desc: 'Order is fresh and ready at the pickup counter!' },
        { status: 'Delivered', pct: 100, desc: 'Thank you for dining with SmartCafé!' }
    ],

    init() {
        this.updateTrackerUI();
        
        // Start live simulator that ticks status progress forward
        if (this.simulatorInterval) clearInterval(this.simulatorInterval);
        this.simulatorInterval = setInterval(() => {
            this.tickOrderSimulation();
        }, 12000); // Progresses state every 12 seconds for interactive demo purposes
    },

    updateTrackerUI() {
        const db = AppDB.get();
        const order = db.currentOrder;
        
        const noOrderSection = document.getElementById('no-order-section');
        const activeOrderSection = document.getElementById('active-order-section');
        
        if (!order) {
            if (noOrderSection) noOrderSection.style.display = 'block';
            if (activeOrderSection) activeOrderSection.style.display = 'none';
            return;
        }

        if (noOrderSection) noOrderSection.style.display = 'none';
        if (activeOrderSection) activeOrderSection.style.display = 'block';

        // Update Text Elements
        document.getElementById('track-order-id').textContent = order.id;
        document.getElementById('track-table-num').textContent = order.table;
        document.getElementById('track-pos-val').textContent = order.queuePosition > 0 ? `#${order.queuePosition}` : '0';
        document.getElementById('track-wait-val').textContent = order.estimatedWaitTime > 0 ? `${order.estimatedWaitTime} min` : 'Ready';
        
        // Active Staff Count Influence
        const staffEl = document.getElementById('track-staff-val');
        if (staffEl) {
            staffEl.textContent = db.settings.activeStaff || '3';
        }

        // Render Tracking Steps
        const stepsContainer = document.getElementById('tracking-steps-container');
        if (stepsContainer) {
            stepsContainer.innerHTML = '';
            
            const currentWorkflowIndex = this.statusWorkflow.findIndex(w => w.status === order.status);
            
            this.statusWorkflow.forEach((wf, index) => {
                let statusClass = '';
                if (index < currentWorkflowIndex) {
                    statusClass = 'completed';
                } else if (index === currentWorkflowIndex) {
                    statusClass = 'active';
                }
                
                const stepEl = document.createElement('div');
                stepEl.className = `tracking-step ${statusClass}`;
                stepEl.innerHTML = `
                    <div class="tracking-step-content">
                        <h3>${wf.status}</h3>
                        <p>${wf.desc}</p>
                    </div>
                `;
                stepsContainer.appendChild(stepEl);
            });
        }

        // Render Progress Bar
        const fillEl = document.getElementById('progress-bar-fill');
        const labelEl = document.getElementById('progress-pct-label');
        if (fillEl && labelEl) {
            const workflow = this.statusWorkflow.find(w => w.status === order.status);
            const progressPct = workflow ? workflow.pct : 0;
            fillEl.style.width = `${progressPct}%`;
            labelEl.textContent = `${progressPct}% Complete`;
        }
    },

    tickOrderSimulation() {
        const db = AppDB.get();
        const order = db.currentOrder;
        if (!order || order.status === 'Delivered') return;

        const currentIdx = this.statusWorkflow.findIndex(w => w.status === order.status);
        if (currentIdx > -1 && currentIdx < this.statusWorkflow.length - 1) {
            const nextWorkflow = this.statusWorkflow[currentIdx + 1];
            order.status = nextWorkflow.status;

            // Reduce Queue Position & Wait time as order nears completion
            if (order.queuePosition > 1) {
                order.queuePosition -= 1;
            } else {
                order.queuePosition = 0;
            }

            // Estimate time reduction
            if (order.estimatedWaitTime > 2) {
                order.estimatedWaitTime = Math.max(1, order.estimatedWaitTime - 2);
            } else {
                order.estimatedWaitTime = 0;
            }

            // Save in current order
            db.currentOrder = order;

            // Sync with history
            const histIdx = db.ordersHistory.findIndex(h => h.id === order.id);
            if (histIdx > -1) {
                db.ordersHistory[histIdx].status = order.status;
                db.ordersHistory[histIdx].queuePosition = order.queuePosition;
                db.ordersHistory[histIdx].estimatedWaitTime = order.estimatedWaitTime;
            }

            // Adjust kitchen queue settings
            if (order.status === 'Ready for Pickup') {
                db.settings.kitchenQueueSize = Math.max(0, db.settings.kitchenQueueSize - 1);
                NotificationSystem.show(`Order #${order.id} is ready for pickup!`, 'success');
            }

            AppDB.save(db);
            this.updateTrackerUI();
        }
    }
};

// Start tracker if on the tracking page
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('active-order-section') || document.getElementById('no-order-section')) {
        Tracking.init();
    }
});
