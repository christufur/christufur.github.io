/**
 * Navigation utilities
 * Handles active page highlighting and smooth scrolling
 */

/**
 * Highlight the active navigation link based on current page
 */
export function highlightActiveNav(): void {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('nav a');
  
    navLinks.forEach((link) => {
      const anchor = link as HTMLAnchorElement;
      const href = anchor.getAttribute('href');
      
      if (!href) return;
  
      // Check if this link matches the current page
      const isActive = 
        currentPath === '/' && href.includes('index.html') ||
        currentPath.includes(href.replace('.html', '').replace('/', ''));
  
      if (isActive) {
        anchor.classList.add('active');
        anchor.setAttribute('aria-current', 'page');
      } else {
        anchor.classList.remove('active');
        anchor.removeAttribute('aria-current');
      }
    });
  }
  
  /**
   * Initialize smooth scroll for anchor links
   */
  export function initSmoothScroll(): void {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const href = (this as HTMLAnchorElement).getAttribute('href');
        if (!href) return;
  
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }
  
  /**
   * Create a mobile-friendly hamburger menu
   */
  export function initMobileMenu(): void {
    const nav = document.querySelector('nav');
    const navUl = document.querySelector('nav ul');
    
    if (!nav || !navUl) return;
  
    // Create hamburger button
    const hamburger = document.createElement('button');
    hamburger.className = 'hamburger';
    hamburger.setAttribute('aria-label', 'Toggle navigation menu');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.innerHTML = `
      <span></span>
      <span></span>
      <span></span>
    `;
  
    // Insert hamburger before nav ul
    nav.insertBefore(hamburger, navUl);
  
    // Toggle menu
    hamburger.addEventListener('click', () => {
      const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
      hamburger.setAttribute('aria-expanded', (!isExpanded).toString());
      navUl.classList.toggle('active');
    });
  
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (!nav.contains(target)) {
        navUl.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });
  
    // Close menu when clicking a link
    navUl.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navUl.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
  }