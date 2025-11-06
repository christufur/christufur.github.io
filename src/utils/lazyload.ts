/**
 * Image lazy loading utility
 * Improves performance by loading images only when they're about to enter the viewport
 */

interface LazyImageOptions {
    rootMargin?: string;
    threshold?: number;
  }
  
  export class LazyImageLoader {
    private observer: IntersectionObserver | null = null;
  
    constructor(options: LazyImageOptions = {}) {
      if ('IntersectionObserver' in window) {
        this.observer = new IntersectionObserver(
          this.handleIntersection.bind(this),
          {
            rootMargin: options.rootMargin || '50px',
            threshold: options.threshold || 0.01
          }
        );
      }
    }
  
    /**
     * Handle intersection of lazy images
     */
    private handleIntersection(entries: IntersectionObserverEntry[]): void {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          this.loadImage(img);
          this.observer?.unobserve(img);
        }
      });
    }
  
    /**
     * Load a single image
     */
    private loadImage(img: HTMLImageElement): void {
      const src = img.dataset.src;
      const srcset = img.dataset.srcset;
  
      if (!src) return;
  
      // Create a temporary image to check if loading is successful
      const tempImg = new Image();
      
      tempImg.onload = () => {
        img.src = src;
        if (srcset) {
          img.srcset = srcset;
        }
        img.classList.add('loaded');
        img.removeAttribute('data-src');
        img.removeAttribute('data-srcset');
      };
  
      tempImg.onerror = () => {
        console.error(`Failed to load image: ${src}`);
        img.classList.add('error');
      };
  
      tempImg.src = src;
    }
  
    /**
     * Observe all lazy images on the page
     */
    public observeAll(): void {
      const images = document.querySelectorAll('img[data-src]');
      
      if (this.observer) {
        images.forEach((img) => this.observer!.observe(img));
      } else {
        // Fallback for browsers without IntersectionObserver
        images.forEach((img) => this.loadImage(img as HTMLImageElement));
      }
    }
  
    /**
     * Disconnect the observer
     */
    public disconnect(): void {
      this.observer?.disconnect();
    }
  }
  
  /**
   * Initialize lazy loading for images
   */
  export function initLazyLoading(): LazyImageLoader {
    const loader = new LazyImageLoader({
      rootMargin: '100px',
      threshold: 0.01
    });
    
    loader.observeAll();
    return loader;
  }