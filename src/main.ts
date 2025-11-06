/**
 * Main application entry point
 * Initializes all features and utilities
 */

import { initThemeToggle } from './utils/theme';
import { highlightActiveNav, initSmoothScroll } from './utils/navigation';
import { initLazyLoading } from './utils/lazyload';
import './styles/main.css';

/**
 * Initialize the application
 */
function init(): void {
  console.log('🚀 Initializing Christufur Portfolio...');

  // Initialize theme management
  initThemeToggle();

  // Initialize navigation features
  highlightActiveNav();
  initSmoothScroll();

  // Initialize lazy loading for images
  initLazyLoading();

  // Add entrance animations
  addEntranceAnimations();

  // Initialize any page-specific features
  initPageSpecificFeatures();

  console.log('✅ Portfolio initialized successfully!');
}

/**
 * Add entrance animations to elements
 */
function addEntranceAnimations(): void {
  const animatedElements = document.querySelectorAll('.content-section, .card, .project-card');
  
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  animatedElements.forEach((el) => observer.observe(el));
}

/**
 * Initialize features specific to certain pages
 */
function initPageSpecificFeatures(): void {
  const path = window.location.pathname;

  // Projects page features
  if (path.includes('projects')) {
    initProjectsPage();
  }

  // Music page features
  if (path.includes('music')) {
    initMusicPage();
  }

  // Reading page features
  if (path.includes('reading')) {
    initReadingPage();
  }

  // Contact page features
  if (path.includes('contact')) {
    initContactPage();
  }
}

/**
 * Initialize projects page features
 */
function initProjectsPage(): void {
  console.log('📁 Initializing projects page...');
  
  // Add filter/sort functionality if needed
  const projectCards = document.querySelectorAll('.project-card');
  
  projectCards.forEach((card, index) => {
    // Stagger animation delay
    (card as HTMLElement).style.animationDelay = `${index * 0.1}s`;
  });
}

/**
 * Initialize music page features
 */
function initMusicPage(): void {
  console.log('🎵 Initializing music page...');
  
  // Handle Last.fm widget loading
  const lastfmWidget = document.querySelector('img[src*="lastfm"]');
  if (lastfmWidget) {
    lastfmWidget.addEventListener('error', () => {
      console.warn('Last.fm widget failed to load');
      // Could show a fallback message
    });
  }
}

/**
 * Initialize reading page features
 */
function initReadingPage(): void {
  console.log('📚 Initializing reading page...');
  
  // Add any Goodreads widget enhancements
  const bookCards = document.querySelectorAll('.book-card');
  
  bookCards.forEach((card, index) => {
    (card as HTMLElement).style.animationDelay = `${index * 0.1}s`;
  });
}

/**
 * Initialize contact page features
 */
function initContactPage(): void {
  console.log('📧 Initializing contact page...');
  
  // Add hover effects or tooltips for contact links
  const contactLinks = document.querySelectorAll('.contact-link');
  
  contactLinks.forEach((link) => {
    link.addEventListener('mouseenter', () => {
      // Could add additional hover effects
    });
  });
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Handle page visibility changes (for analytics, pausing animations, etc.)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    console.log('👋 Page hidden');
  } else {
    console.log('👁️ Page visible');
  }
});

// Export for testing or external use
export { init };