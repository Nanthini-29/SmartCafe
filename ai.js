// --- AI PREDICTION AND RECOMMENDATION MODULE ---

const AI = {
    // 1. Wait-Time Prediction Engine
    // Calculates wait time using queue status, user position, staff count, and prep difficulty
    predictWaitTime(activeOrdersInQueue, relativePosition, staffCount = 3, avgPrepTime = 4) {
        if (staffCount <= 0) staffCount = 1;
        
        // Wait Time Formula: T_wait = ((Q_size + Position) * T_prep) / Staff
        // We add 1 to relativePosition to account for preparing the customer's own order
        const rawTime = ((activeOrdersInQueue + (relativePosition || 1)) * avgPrepTime) / staffCount;
        const finalMinutes = Math.max(2, Math.round(rawTime));
        
        return {
            queueSize: activeOrdersInQueue,
            position: relativePosition || (activeOrdersInQueue + 1),
            estimatedWaitTime: finalMinutes,
            workloadLevel: this.getWorkloadLevel(activeOrdersInQueue, staffCount)
        };
    },

    getWorkloadLevel(queueSize, staffCount) {
        const ratio = queueSize / staffCount;
        if (ratio <= 0.5) return 'Light';
        if (ratio <= 1.2) return 'Optimal';
        if (ratio <= 2.0) return 'Heavy';
        return 'Critical';
    },

    // 2. Menu Recommendation Engine
    // Suggests products based on time of day, popular tags, and current cart context
    getMenuRecommendations(cartItems = []) {
        const db = AppDB.get();
        const menu = db.menu || [];
        const recommendations = [];

        // Context A: Time of Day
        const hour = new Date().getHours();
        let timeOfDayGroup = 'afternoon';
        if (hour >= 6 && hour < 11.5) {
            timeOfDayGroup = 'morning';
        } else if (hour >= 17) {
            timeOfDayGroup = 'evening';
        }

        // Recommend items based on time of day
        const timeRecommendations = {
            'morning': ['c1', 's2'],      // Signature Latte & Croissant
            'afternoon': ['c2', 's1'],    // Nitro Cold Brew & Truffle Cheese
            'evening': ['t1', 'd1']       // Matcha Latte & Tiramisu
        };

        const targetIds = timeRecommendations[timeOfDayGroup] || [];
        targetIds.forEach(id => {
            const item = menu.find(m => m.id === id);
            if (item) {
                recommendations.push({ ...item, aiReason: `Ideal for a cozy ${timeOfDayGroup} boost` });
            }
        });

        // Context B: Complementary Pairing (Cross-selling)
        const hasCoffee = cartItems.some(i => i.category === 'coffee');
        const hasTea = cartItems.some(i => i.category === 'tea');
        const hasSnacks = cartItems.some(i => i.category === 'snacks');
        const hasDesserts = cartItems.some(i => i.category === 'desserts');

        if ((hasCoffee || hasTea) && !hasSnacks && !hasDesserts) {
            // User bought beverages, suggest pastries/dessert
            const dessert = menu.find(m => m.id === 'd1');
            if (dessert && !recommendations.some(r => r.id === dessert.id)) {
                recommendations.push({ ...dessert, aiReason: 'Pairs perfectly with your hot beverage' });
            }
        } else if ((hasSnacks || hasDesserts) && !hasCoffee && !hasTea) {
            // User bought food/dessert, suggest a popular coffee
            const coffee = menu.find(m => m.id === 'c3');
            if (coffee && !recommendations.some(r => r.id === coffee.id)) {
                recommendations.push({ ...coffee, aiReason: 'Complimentary drink option for your food' });
            }
        }

        // Context C: Add popular item if we need more recommendations
        if (recommendations.length < 3) {
            const popular = menu.find(m => m.isPopular && !recommendations.some(r => r.id === m.id));
            if (popular) {
                recommendations.push({ ...popular, aiReason: 'Highly rated trending choice' });
            }
        }

        return recommendations.slice(0, 3); // Return top 3
    },

    // 3. Rush Hour Prediction Engine
    // Predicts busy periods based on simulated analytics data
    predictRushHours() {
        // Return load percentages for 8:00 to 21:00
        return [
            { hour: '7 AM', load: 30, level: 'Low', staffNeeded: 2 },
            { hour: '8 AM', load: 85, level: 'High', staffNeeded: 4 },
            { hour: '9 AM', load: 90, level: 'High', staffNeeded: 4 },
            { hour: '10 AM', load: 60, level: 'Moderate', staffNeeded: 3 },
            { hour: '11 AM', load: 45, level: 'Moderate', staffNeeded: 3 },
            { hour: '12 PM', load: 75, level: 'High', staffNeeded: 4 },
            { hour: '1 PM', load: 80, level: 'High', staffNeeded: 4 },
            { hour: '2 PM', load: 50, level: 'Moderate', staffNeeded: 3 },
            { hour: '3 PM', load: 40, level: 'Low', staffNeeded: 2 },
            { hour: '4 PM', load: 55, level: 'Moderate', staffNeeded: 3 },
            { hour: '5 PM', load: 70, level: 'High', staffNeeded: 4 },
            { hour: '6 PM', load: 85, level: 'High', staffNeeded: 4 },
            { hour: '7 PM', load: 65, level: 'Moderate', staffNeeded: 3 },
            { hour: '8 PM', load: 40, level: 'Low', staffNeeded: 2 },
            { hour: '9 PM', load: 25, level: 'Low', staffNeeded: 2 }
        ];
    },

    // 4. Staff Allocation Recommendation System
    recommendStaffAllocation(activeOrdersCount, currentStaff) {
        const optimalRatio = 1.5; // Optimal ratio of orders per staff member
        const requiredStaff = Math.max(2, Math.ceil(activeOrdersCount / optimalRatio));
        
        let recommendationText = "";
        let alertType = "info";

        if (requiredStaff > currentStaff) {
            recommendationText = `Queue backlogs rising! Recommend deploying ${requiredStaff - currentStaff} more staff to restore queue times to normal.`;
            alertType = "warning";
        } else if (requiredStaff < currentStaff && currentStaff > 2) {
            recommendationText = `Quiet kitchen. Recommend shifting ${currentStaff - requiredStaff} staff member(s) to inventory/cleaning duties.`;
            alertType = "success";
        } else {
            recommendationText = `Staff levels are optimal. Kitchen is operating at max efficiency.`;
            alertType = "success";
        }

        return {
            requiredStaff,
            recommendationText,
            alertType,
            workloadPct: Math.min(100, Math.round((activeOrdersCount / (currentStaff * 2)) * 100))
        };
    },

    // 5. Review Sentiment Analysis Engine
    // Scans review comments for keywords and calculates sentiment class
    analyzeSentiment(commentText) {
        if (!commentText || commentText.trim() === '') {
            return { sentiment: 'neutral', score: 50, emoji: '😐' };
        }

        const positiveKeywords = ['great', 'good', 'excellent', 'amazing', 'delicious', 'perfect', 'love', 'friendly', 'fast', 'premium', 'tasty'];
        const negativeKeywords = ['slow', 'bad', 'poor', 'expensive', 'cold', 'wrong', 'dirty', 'rude', 'disappointed', 'wait', 'worse'];

        const text = commentText.toLowerCase();
        let positiveCount = 0;
        let negativeCount = 0;

        positiveKeywords.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'g');
            const matches = text.match(regex);
            if (matches) positiveCount += matches.length;
        });

        negativeKeywords.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'g');
            const matches = text.match(regex);
            if (matches) negativeCount += matches.length;
        });

        const total = positiveCount + negativeCount;
        let score = 50;
        if (total > 0) {
            score = Math.round((positiveCount / total) * 100);
        }

        let sentiment = 'neutral';
        let emoji = '😐';

        if (score > 60 || (positiveCount > 0 && negativeCount === 0)) {
            sentiment = 'positive';
            emoji = '😊';
            if (score <= 60) score = 75; // baseline positive score
        } else if (score < 40 || (negativeCount > 0 && positiveCount === 0)) {
            sentiment = 'negative';
            emoji = '😠';
            if (score >= 40) score = 25; // baseline negative score
        }

        return { sentiment, score, emoji };
    }
};
