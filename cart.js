// --- SHOPPING CART MANAGEMENT AND ACTIONS ---

const GST_RATE = 0.18; // 18% GST

const Cart = {
    add(itemId, qty = 1) {
        const db = AppDB.get();
        const menu = db.menu || [];
        const item = menu.find(m => m.id === itemId);
        
        if (!item) {
            NotificationSystem.show('Item not found!', 'error');
            return;
        }

        // Check Inventory
        const currentStock = db.inventory[itemId] !== undefined ? db.inventory[itemId] : 10;
        if (currentStock <= 0) {
            NotificationSystem.show('Item is currently out of stock!', 'error');
            return;
        }

        const cartItemIndex = db.cart.findIndex(i => i.id === itemId);
        if (cartItemIndex > -1) {
            db.cart[cartItemIndex].qty += qty;
        } else {
            db.cart.push({
                id: item.id,
                name: item.name,
                price: item.price,
                category: item.category,
                image: item.image,
                qty: qty
            });
        }

        AppDB.updateKey('cart', db.cart);
        updateCartCount();
        NotificationSystem.show(`Added ${item.name} to cart!`, 'success');
    },

    updateQty(itemId, newQty) {
        const db = AppDB.get();
        const cartItemIndex = db.cart.findIndex(i => i.id === itemId);
        
        if (cartItemIndex > -1) {
            if (newQty <= 0) {
                this.remove(itemId);
                return;
            }
            db.cart[cartItemIndex].qty = newQty;
            AppDB.updateKey('cart', db.cart);
            updateCartCount();
            if (typeof renderCartPage === 'function') renderCartPage();
        }
    },

    remove(itemId) {
        const db = AppDB.get();
        const updatedCart = db.cart.filter(i => i.id !== itemId);
        AppDB.updateKey('cart', updatedCart);
        updateCartCount();
        NotificationSystem.show('Item removed from cart.', 'info');
        if (typeof renderCartPage === 'function') renderCartPage();
    },

    calculateTotals(appliedCoupon = null) {
        const db = AppDB.get();
        const subtotal = db.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        
        let discount = 0;
        let couponMessage = '';

        if (appliedCoupon) {
            const code = appliedCoupon.toUpperCase().trim();
            if (code === 'COFFEE10') {
                discount = subtotal * 0.10;
                couponMessage = '10% coupon applied!';
            } else if (code === 'WELCOME20') {
                discount = subtotal * 0.20;
                couponMessage = '20% coupon applied!';
            } else if (code === 'FREECOFFEE') {
                // Find highest priced coffee item in cart and make one quantity free
                const coffeeItem = db.cart.filter(i => i.category === 'coffee')
                                         .sort((a, b) => b.price - a.price)[0];
                if (coffeeItem) {
                    discount = coffeeItem.price;
                    couponMessage = `Free ${coffeeItem.name} coupon applied!`;
                } else {
                    couponMessage = 'Coupon valid only for coffee items.';
                }
            } else {
                couponMessage = 'Invalid coupon code.';
            }
        }

        const subtotalAfterDiscount = Math.max(0, subtotal - discount);
        const gst = subtotalAfterDiscount * GST_RATE;
        const total = subtotalAfterDiscount + gst;

        return {
            subtotal: parseFloat(subtotal.toFixed(2)),
            discount: parseFloat(discount.toFixed(2)),
            gst: parseFloat(gst.toFixed(2)),
            total: parseFloat(total.toFixed(2)),
            couponMessage
        };
    },

    checkout(tableNumber, couponCode = null) {
        const db = AppDB.get();
        if (db.cart.length === 0) {
            NotificationSystem.show('Your cart is empty!', 'error');
            return false;
        }

        const totals = this.calculateTotals(couponCode);
        const orderId = (1000 + db.ordersHistory.length + 1).toString();
        
        // Decrease Inventory & Verify
        for (const item of db.cart) {
            if (db.inventory[item.id] !== undefined) {
                db.inventory[item.id] = Math.max(0, db.inventory[item.id] - item.qty);
            }
        }
        AppDB.updateKey('inventory', db.inventory);

        // Create Order Object
        const newOrder = {
            id: orderId,
            table: tableNumber || 'Takeaway',
            items: db.cart,
            discount: totals.discount,
            subtotal: totals.subtotal,
            tax: totals.gst,
            total: totals.total,
            status: 'Received', // Initial State
            timestamp: Date.now(),
            queuePosition: db.settings.kitchenQueueSize + 1,
            estimatedWaitTime: AI.predictWaitTime(db.settings.kitchenQueueSize, db.settings.kitchenQueueSize + 1, db.settings.activeStaff).estimatedWaitTime
        };

        // Add to active queue settings
        db.settings.kitchenQueueSize += 1;
        AppDB.updateKey('settings', db.settings);

        // Add to orders history
        db.ordersHistory.push(newOrder);
        AppDB.updateKey('ordersHistory', db.ordersHistory);
        
        // Set current tracking order
        AppDB.updateKey('currentOrder', newOrder);

        // Loyalty points: 10 points per dollar spent
        const pointsEarned = Math.round(totals.total * 10);
        db.rewards.points += pointsEarned;
        db.rewards.history.unshift({
            desc: `Order #${orderId} purchase`,
            points: pointsEarned,
            date: new Date().toLocaleDateString()
        });

        // Evaluate Membership Level
        if (db.rewards.points >= 500) {
            db.rewards.level = 'Gold';
        } else if (db.rewards.points >= 250) {
            db.rewards.level = 'Silver';
        } else {
            db.rewards.level = 'Bronze';
        }
        AppDB.updateKey('rewards', db.rewards);

        // Clear Cart
        AppDB.updateKey('cart', []);
        updateCartCount();

        NotificationSystem.show(`Checkout successful! Table: ${newOrder.table}. Order #${newOrder.id}`, 'success');
        return true;
    }
};
