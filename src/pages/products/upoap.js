// UPOAP - User Pattern Observation and Prediction
// Advanced behavioral analytics and conversion optimization
// By WolfTech Innovations

class PredictionEngine {
  constructor() {
    this.sessionStart = Date.now();
    this.features = {
      scrollDepth: 0,
      timeOnPage: 0,
      hoverCount: 0,
      hoverDuration: 0,
      returnVisitor: false,
      dayOfWeek: new Date().getDay(),
      hourOfDay: new Date().getHours(),
      mouseVelocity: [],
      clickCount: 0,
      priceViews: 0
    };

    this.hoverStart = null;
    this.lastMousePos = { x: 0, y: 0, time: Date.now() };
    this.purchaseProbability = 0;

    // Load historical data and model weights
    this.loadModel();
    this.initTracking();
    this.startPredictionLoop();
  }

  // ============================================
  // DATA PERSISTENCE
  // ============================================

  loadModel() {
    // Load training data from localStorage
    const stored = localStorage.getItem('predictionData');
    this.trainingData = stored ? JSON.parse(stored) : {
      sessions: [],
      conversions: [],
      weights: this.initializeWeights()
    };

    // Check if returning visitor
    const lastVisit = localStorage.getItem('lastVisit');
    if (lastVisit) {
      this.features.returnVisitor = true;
      const visits = parseInt(localStorage.getItem('visitCount') || '0');
      localStorage.setItem('visitCount', (visits + 1).toString());
    } else {
      localStorage.setItem('visitCount', '1');
    }
    localStorage.setItem('lastVisit', Date.now().toString());
  }

  saveModel() {
    localStorage.setItem('predictionData', JSON.stringify(this.trainingData));
  }

  initializeWeights() {
    // Initial weights for logistic regression
    return {
      bias: -2.0,
      scrollDepth: 1.5,
      timeOnPage: 0.8,
      hoverCount: 0.6,
      hoverDuration: 0.9,
      returnVisitor: 1.2,
      mouseVelocity: -0.3, // High velocity = less engaged
      clickCount: 0.7,
      priceViews: 1.1,
      // Time-based weights
      hourWeight: [0.3, 0.2, 0.1, 0.1, 0.2, 0.3, 0.5, 0.7, 0.9, 0.8, 0.7, 0.8,
                   0.9, 0.7, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.0, 0.8, 0.6, 0.4],
      dayWeight: [0.6, 0.8, 0.9, 0.9, 0.9, 0.7, 0.5] // Sun-Sat
    };
  }

  // ============================================
  // BEHAVIOR TRACKING
  // ============================================

  initTracking() {
    // Scroll depth tracking
    window.addEventListener('scroll', () => {
      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      this.features.scrollDepth = Math.max(this.features.scrollDepth, scrollPercent);
    });

    // Mouse movement velocity
    document.addEventListener('mousemove', (e) => {
      const now = Date.now();
      const timeDiff = now - this.lastMousePos.time;
      if (timeDiff > 0) {
        const distance = Math.sqrt(
          Math.pow(e.clientX - this.lastMousePos.x, 2) +
          Math.pow(e.clientY - this.lastMousePos.y, 2)
        );
        const velocity = distance / timeDiff;
        this.features.mouseVelocity.push(velocity);
        // Keep only last 20 measurements
        if (this.features.mouseVelocity.length > 20) {
          this.features.mouseVelocity.shift();
        }
      }
      this.lastMousePos = { x: e.clientX, y: e.clientY, time: now };
    });

    // Track clicks
    document.addEventListener('click', () => {
      this.features.clickCount++;
    });

    // Track button hovers (attach to your buy button)
    const buyButton = document.querySelector('[data-buy-button]') || 
                      document.querySelector('button[type="submit"]') ||
                      document.querySelector('.buy-button');

    if (buyButton) {
      buyButton.addEventListener('mouseenter', () => {
        this.hoverStart = Date.now();
        this.features.hoverCount++;
      });

      buyButton.addEventListener('mouseleave', () => {
        if (this.hoverStart) {
          this.features.hoverDuration += Date.now() - this.hoverStart;
          this.hoverStart = null;
        }
      });
    }

    // Track price views (attach to your price element)
    const priceElement = document.querySelector('[data-price]') ||
                         document.querySelector('.price');

    if (priceElement) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.features.priceViews++;
          }
        });
      }, { threshold: 0.5 });

      observer.observe(priceElement);
    }

    // Track page visibility for accurate time on page
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.features.timeOnPage += (Date.now() - this.sessionStart) / 1000;
      } else {
        this.sessionStart = Date.now();
      }
    });
  }

  // ============================================
  // PREDICTION MODEL
  // ============================================

  normalizeFeatures() {
    const avgVelocity = this.features.mouseVelocity.length > 0
      ? this.features.mouseVelocity.reduce((a, b) => a + b, 0) / this.features.mouseVelocity.length
      : 0;

    return {
      scrollDepth: this.features.scrollDepth / 100,
      timeOnPage: Math.min(this.features.timeOnPage / 300, 1), // Cap at 5 minutes
      hoverCount: Math.min(this.features.hoverCount / 10, 1),
      hoverDuration: Math.min(this.features.hoverDuration / 5000, 1), // Cap at 5 seconds
      returnVisitor: this.features.returnVisitor ? 1 : 0,
      mouseVelocity: Math.min(avgVelocity, 1),
      clickCount: Math.min(this.features.clickCount / 20, 1),
      priceViews: Math.min(this.features.priceViews / 5, 1)
    };
  }

  sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
  }

  predict() {
    const w = this.trainingData.weights;
    const f = this.normalizeFeatures();

    // Logistic regression
    let logit = w.bias;
    logit += f.scrollDepth * w.scrollDepth;
    logit += f.timeOnPage * w.timeOnPage;
    logit += f.hoverCount * w.hoverCount;
    logit += f.hoverDuration * w.hoverDuration;
    logit += f.returnVisitor * w.returnVisitor;
    logit += f.mouseVelocity * w.mouseVelocity;
    logit += f.clickCount * w.clickCount;
    logit += f.priceViews * w.priceViews;

    // Time-based adjustments
    logit += w.hourWeight[this.features.hourOfDay] * 0.5;
    logit += w.dayWeight[this.features.dayOfWeek] * 0.5;

    return this.sigmoid(logit);
  }

  startPredictionLoop() {
    setInterval(() => {
      this.features.timeOnPage = (Date.now() - this.sessionStart) / 1000;
      this.purchaseProbability = this.predict();

      // Emit custom event with prediction
      window.dispatchEvent(new CustomEvent('predictionUpdate', {
        detail: {
          probability: this.purchaseProbability,
          features: this.features,
          confidence: this.getConfidence()
        }
      }));

      // Auto-optimize UI based on prediction
      this.optimizeUI();
    }, 2000); // Update every 2 seconds
  }

  getConfidence() {
    // Confidence based on amount of data collected
    const dataPoints = this.trainingData.sessions.length;
    if (dataPoints < 10) return 'low';
    if (dataPoints < 50) return 'medium';
    return 'high';
  }

  // ============================================
  // UI OPTIMIZATION
  // ============================================

  optimizeUI() {
    const prob = this.purchaseProbability;

    // Low probability (< 30%) - Show urgency
    if (prob < 0.3 && this.features.timeOnPage > 10) {
      this.showUrgency();
    }

    // Medium probability (30-60%) - Encourage action
    else if (prob >= 0.3 && prob < 0.6) {
      this.encourageAction();
    }

    // High probability (> 60%) - Remove friction
    else if (prob >= 0.6) {
      this.removeFriction();
    }
  }

  showUrgency() {
    // Add urgency messaging (customize selectors for your HTML)
    const container = document.querySelector('[data-urgency]');
    if (container && !container.classList.contains('active')) {
      container.classList.add('active');
      container.innerHTML = '⚡ Limited stock - Order now!';
    }
  }

  encourageAction() {
    // Highlight the buy button
    const button = document.querySelector('[data-buy-button]');
    if (button && !button.classList.contains('highlighted')) {
      button.classList.add('highlighted');
      button.style.transform = 'scale(1.02)';
      button.style.transition = 'transform 0.3s ease';
    }
  }

  removeFriction() {
    // Simplify checkout flow, remove distractions
    const distractions = document.querySelectorAll('[data-hide-on-intent]');
    distractions.forEach(el => {
      el.style.opacity = '0.3';
      el.style.pointerEvents = 'none';
    });
  }

  // ============================================
  // LEARNING & TRAINING
  // ============================================

  recordConversion(purchased = true) {
    // Record this session for training
    this.trainingData.sessions.push({
      features: this.normalizeFeatures(),
      rawFeatures: { ...this.features },
      purchased: purchased,
      timestamp: Date.now()
    });

    // Train the model if we have enough data
    if (this.trainingData.sessions.length >= 5) {
      this.trainModel();
    }

    this.saveModel();
  }

  trainModel() {
    // Simple gradient descent for logistic regression
    const learningRate = 0.01;
    const epochs = 50;

    for (let epoch = 0; epoch < epochs; epoch++) {
      this.trainingData.sessions.forEach(session => {
        const prediction = this.predictFromFeatures(session.features);
        const error = (session.purchased ? 1 : 0) - prediction;

        // Update weights
        const w = this.trainingData.weights;
        w.bias += learningRate * error;
        w.scrollDepth += learningRate * error * session.features.scrollDepth;
        w.timeOnPage += learningRate * error * session.features.timeOnPage;
        w.hoverCount += learningRate * error * session.features.hoverCount;
        w.hoverDuration += learningRate * error * session.features.hoverDuration;
        w.returnVisitor += learningRate * error * session.features.returnVisitor;
        w.mouseVelocity += learningRate * error * session.features.mouseVelocity;
        w.clickCount += learningRate * error * session.features.clickCount;
        w.priceViews += learningRate * error * session.features.priceViews;
      });
    }
  }

  predictFromFeatures(features) {
    const w = this.trainingData.weights;
    let logit = w.bias;
    logit += features.scrollDepth * w.scrollDepth;
    logit += features.timeOnPage * w.timeOnPage;
    logit += features.hoverCount * w.hoverCount;
    logit += features.hoverDuration * w.hoverDuration;
    logit += features.returnVisitor * w.returnVisitor;
    logit += features.mouseVelocity * w.mouseVelocity;
    logit += features.clickCount * w.clickCount;
    logit += features.priceViews * w.priceViews;
    return this.sigmoid(logit);
  }

  // ============================================
  // PUBLIC API
  // ============================================

  getPrediction() {
    return {
      probability: this.purchaseProbability,
      confidence: this.getConfidence(),
      features: this.features,
      recommendation: this.getRecommendation()
    };
  }

  getRecommendation() {
    const prob = this.purchaseProbability;
    if (prob < 0.3) return 'Show urgency or offer';
    if (prob < 0.6) return 'Encourage with social proof';
    return 'User is ready - minimize friction';
  }

  reset() {
    // Clear all stored data
    localStorage.removeItem('predictionData');
    localStorage.removeItem('lastVisit');
    localStorage.removeItem('visitCount');
    this.trainingData = {
      sessions: [],
      conversions: [],
      weights: this.initializeWeights()
    };
  }
}

// ============================================
// INITIALIZATION & USAGE
// ============================================

// Initialize the engine
const predictor = new PredictionEngine();

// Listen for prediction updates
window.addEventListener('predictionUpdate', (e) => {
  console.log('Purchase Probability:', (e.detail.probability * 100).toFixed(1) + '%');
  console.log('Confidence:', e.detail.confidence);

  // Update a debug display if you have one
  const debugDisplay = document.querySelector('[data-prediction-debug]');
  if (debugDisplay) {
    debugDisplay.innerHTML = `
      <div>Probability: ${(e.detail.probability * 100).toFixed(1)}%</div>
      <div>Confidence: ${e.detail.confidence}</div>
      <div>Time on page: ${e.detail.features.timeOnPage.toFixed(0)}s</div>
      <div>Scroll depth: ${e.detail.features.scrollDepth.toFixed(0)}%</div>
    `;
  }
});

// Hook into Stripe checkout success
// Call this when payment succeeds
window.recordPurchase = function() {
  predictor.recordConversion(true);
  console.log('Purchase recorded! Model will learn from this session.');
};

// Call this when user leaves without purchasing (optional)
window.addEventListener('beforeunload', () => {
  if (predictor.features.timeOnPage > 5) { // Only record if they spent time
    predictor.recordConversion(false);
  }
});

// Expose predictor globally for debugging
window.predictor = predictor;

// Get current prediction anytime
console.log('Prediction Engine Active');
console.log('Use predictor.getPrediction() to see current analysis');
console.log('Use predictor.reset() to clear training data');// 
