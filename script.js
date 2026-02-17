/**
 * Intel Sustainability Milestones - Main JavaScript
 * Handles modal interactions, animations, and form submissions
 * @version 1.0.0
 */

// =========================
// Configuration Constants
// =========================
const CONFIG = {
  ANIMATION_DELAY: 100,
  RTL_LANGUAGES: ['ar', 'arc', 'dv', 'fa', 'ha', 'he', 'iw', 'ji', 'ps', 'ur', 'yi'],
  RTL_CHECK_INTERVAL: 3000,
  DEBOUNCE_DELAY: 150
};

// =========================
// Utility Functions
// =========================

/**
 * Debounces a function call
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait
 * @returns {Function} Debounced function
 */
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

/**
 * Checks if the current language is Right-to-Left
 * @param {string} lang - Language code
 * @returns {boolean} True if RTL language
 */
const isRTLLanguage = (lang) => {
  if (!lang) return false;
  const baseLang = lang.toLowerCase().split('-')[0];
  return CONFIG.RTL_LANGUAGES.includes(baseLang);
};

/**
 * Safely focuses an element after a delay
 * @param {HTMLElement} element - Element to focus
 * @param {number} delay - Delay in milliseconds
 */
const safeFocus = (element, delay = CONFIG.ANIMATION_DELAY) => {
  if (!element) return;
  setTimeout(() => {
    try {
      element.focus();
    } catch (error) {
      console.warn('Focus failed:', error);
    }
  }, delay);
};

// =========================
// Modal Management Module
// =========================

/**
 * Generic modal controller
 * @class ModalController
 */
class ModalController {
  /**
   * @param {Object} config - Modal configuration
   * @param {string} config.modalId - ID of the modal element
   * @param {string[]} config.triggerIds - Array of button IDs that trigger the modal
   * @param {string} config.closeId - ID of the close button
   * @param {Function} [config.onOpen] - Callback when modal opens
   * @param {Function} [config.onClose] - Callback when modal closes
   */
  constructor({ modalId, triggerIds, closeId, onOpen, onClose }) {
    this.modal = document.getElementById(modalId);
    this.triggers = triggerIds.map(id => document.getElementById(id)).filter(Boolean);
    this.closeBtn = document.getElementById(closeId);
    this.overlay = this.modal?.querySelector('.modal-overlay');
    this.onOpen = onOpen;
    this.onClose = onClose;
    
    if (this.modal) {
      this.init();
    }
  }

  /**
   * Initialize modal event listeners
   */
  init() {
    // Attach open handlers to all triggers
    this.triggers.forEach(trigger => {
      trigger.addEventListener('click', () => this.open(), { passive: true });
    });

    // Attach close handlers
    this.closeBtn?.addEventListener('click', () => this.close(), { passive: true });
    this.overlay?.addEventListener('click', () => this.close(), { passive: true });

    // Handle escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    }, { passive: true });
  }

  /**
   * Opens the modal
   */
  open() {
    if (!this.modal) return;
    
    this.modal.classList.add('active');
    this.modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    
    // Focus first interactive element
    const firstFocusable = this.modal.querySelector('button, input, textarea, select');
    safeFocus(firstFocusable || this.closeBtn);
    
    if (this.onOpen) this.onOpen();
  }

  /**
   * Closes the modal
   */
  close() {
    if (!this.modal) return;
    
    this.modal.classList.remove('active');
    this.modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    
    // Return focus to trigger
    const activeTrigger = this.triggers.find(t => document.activeElement !== t);
    safeFocus(activeTrigger);
    
    if (this.onClose) this.onClose();
  }

  /**
   * Checks if modal is currently open
   * @returns {boolean} True if modal is open
   */
  isOpen() {
    return this.modal?.classList.contains('active') || false;
  }
}

// =========================
// Subscription Form Module
// =========================

/**
 * Handles subscription form logic
 * @class SubscriptionForm
 */
class SubscriptionForm {
  /**
   * @param {string} formId - ID of the form element
   */
  constructor(formId) {
    this.form = document.getElementById(formId);
    this.emailInput = this.form?.querySelector('#email');
    this.nameInput = this.form?.querySelector('#name');
    this.consentCheckbox = this.form?.querySelector('#consent');
    
    if (this.form) {
      this.init();
    }
  }

  /**
   * Initialize form event listeners
   */
  init() {
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  /**
   * Validates email input
   * @returns {boolean} True if valid
   */
  validateEmail() {
    if (!this.emailInput.validity.valid) {
      this.emailInput.focus();
      this.emailInput.setAttribute('aria-invalid', 'true');
      return false;
    }
    this.emailInput.removeAttribute('aria-invalid');
    return true;
  }

  /**
   * Validates consent checkbox
   * @returns {boolean} True if valid
   */
  validateConsent() {
    if (!this.consentCheckbox.checked) {
      this.consentCheckbox.focus();
      this.consentCheckbox.setAttribute('aria-invalid', 'true');
      return false;
    }
    this.consentCheckbox.removeAttribute('aria-invalid');
    return true;
  }

  /**
   * Handles form submission
   * @param {Event} e - Submit event
   */
  handleSubmit(e) {
    e.preventDefault();
    
    // Validate inputs
    if (!this.validateEmail() || !this.validateConsent()) {
      return;
    }
    
    // Get form values
    const email = this.emailInput.value;
    const name = this.nameInput.value || 'friend';
    
    // Show success message (in production, this would be an API call)
    alert(`Thank you for subscribing, ${name}! Check your email for confirmation.`);
    
    // Reset form
    this.form.reset();
    
    // Close modal if available
    if (window.subscriptionModal) {
      window.subscriptionModal.close();
    }
  }
}

// =========================
// Animation & Layout Module
// =========================

/**
 * Manages hero animations and performance
 * @class AnimationManager
 */
class AnimationManager {
  constructor() {
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.init();
  }

  /**
   * Initialize animations
   */
  init() {
    // Only restart hero animations if user hasn't opted out
    if (!this.prefersReducedMotion.matches) {
      window.addEventListener('load', () => this.restartHeroAnimation(), { 
        once: true, 
        passive: true 
      });
    }
  }

  /**
   * Restarts hero letter animations
   */
  restartHeroAnimation() {
    const heroLetters = document.querySelectorAll('.hero-letter');
    if (heroLetters.length === 0) return;

    heroLetters.forEach((letter) => {
      // Force reflow to restart animation
      letter.style.animation = 'none';
      void letter.offsetHeight; // Trigger reflow
      letter.style.animation = '';
    });
  }
}

// =========================
// RTL Language Support Module
// =========================

/**
 * Handles Right-to-Left language support and Google Translate
 * @class RTLManager
 */
class RTLManager {
  constructor() {
    this.htmlElement = document.documentElement;
    this.bodyElement = document.body;
    this.observer = null;
    this.init();
  }

  /**
   * Initialize RTL detection and monitoring
   */
  init() {
    // Initial detection
    this.detectAndApplyDirection();
    
    // Set up mutation observer with debouncing
    this.setupObserver();
    
    // Handle page load
    window.addEventListener('load', () => {
      this.preserveLayoutIntegrity();
      this.handleTranslationState();
    }, { once: true, passive: true });
  }

  /**
   * Applies RTL or LTR direction to the page
   * @param {boolean} enable - True to enable RTL mode
   */
  applyRTLMode(enable) {
    this.htmlElement.setAttribute('dir', enable ? 'rtl' : 'ltr');
    this.bodyElement.classList.toggle('rtl-mode', enable);
  }

  /**
   * Fixes Google Translate layout issues
   */
  preserveLayoutIntegrity() {
    // Remove unwanted top spacing from Google Translate
    if (this.bodyElement.style.top && this.bodyElement.style.top !== '0px') {
      this.bodyElement.style.top = '0';
    }

    // Hide Google Translate banners
    const gtBanners = document.querySelectorAll('.goog-te-banner-frame');
    gtBanners.forEach(banner => banner.style.display = 'none');
  }

  /**
   * Detects current language and applies appropriate direction
   */
  detectAndApplyDirection() {
    const bodyClasses = this.bodyElement.className;
    
    // Check for Google Translate classes
    if (bodyClasses.includes('translated-rtl')) {
      this.applyRTLMode(true);
    } else if (bodyClasses.includes('translated-ltr')) {
      this.applyRTLMode(false);
    } else {
      // Check language attribute
      const currentLang = this.bodyElement.getAttribute('lang') || 
                         this.htmlElement.getAttribute('lang');
      this.applyRTLMode(isRTLLanguage(currentLang));
    }
    
    this.preserveLayoutIntegrity();
  }

  /**
   * Sets up mutation observer for language changes
   */
  setupObserver() {
    const debouncedDetect = debounce(
      () => this.detectAndApplyDirection(), 
      CONFIG.DEBOUNCE_DELAY
    );

    this.observer = new MutationObserver(debouncedDetect);

    // Observe html element
    this.observer.observe(this.htmlElement, {
      attributes: true,
      attributeFilter: ['lang', 'class', 'dir'],
      subtree: false
    });

    // Observe body element
    this.observer.observe(this.bodyElement, {
      attributes: true,
      attributeFilter: ['lang', 'class'],
      subtree: false
    });
  }

  /**
   * Handles ongoing translation state
   */
  handleTranslationState() {
    if (!this.bodyElement.className.includes('translated-')) return;

    const interval = setInterval(() => {
      if (!this.bodyElement.className.includes('translated-')) {
        clearInterval(interval);
      } else {
        this.detectAndApplyDirection();
        this.preserveLayoutIntegrity();
      }
    }, CONFIG.RTL_CHECK_INTERVAL);
  }
}

// =========================
// Application Initialization
// =========================

/**
 * Initializes the entire application
 * @class App
 */
class App {
  constructor() {
    this.init();
  }

  /**
   * Initialize all modules
   */
  init() {
    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  /**
   * Set up all application components
   */
  setup() {
    // Initialize subscription modal and form
    window.subscriptionModal = new ModalController({
      modalId: 'subscription-modal',
      triggerIds: ['subscribe-btn'],
      closeId: 'modal-close',
      onOpen: () => {
        const emailInput = document.getElementById('email');
        safeFocus(emailInput);
      }
    });

    new SubscriptionForm('subscription-form');

    // Initialize sustainability milestones modal
    new ModalController({
      modalId: 'sustainabilityModal',
      triggerIds: ['learnMoreBtn'],
      closeId: 'modalClose'
    });

    // Initialize "Why It Matters" modal
    new ModalController({
      modalId: 'whyItMattersModal',
      triggerIds: ['learnMoreBtnRight'],
      closeId: 'whyItMattersClose'
    });

    // Initialize animation manager
    new AnimationManager();

    // Initialize RTL support
    new RTLManager();

    console.log('✓ Intel Sustainability App initialized successfully');
  }
}

// =========================
// Start Application
// =========================

// Initialize app when script loads
new App();

// Expose RTL functions globally for legacy compatibility
window.detectAndApplyDirection = () => {
  const rtlManager = new RTLManager();
  rtlManager.detectAndApplyDirection();
};

window.preserveLayoutIntegrity = () => {
  const rtlManager = new RTLManager();
  rtlManager.preserveLayoutIntegrity();
};
