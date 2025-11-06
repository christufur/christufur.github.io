/**
 * Theme management utility
 * Handles dark/light mode with local storage persistence
 */

type Theme = 'light' | 'dark';

const THEME_KEY = 'christufur-theme';
const DARK_CLASS = 'dark';

export class ThemeManager {
  private currentTheme: Theme;

  constructor() {
    this.currentTheme = this.getInitialTheme();
    this.applyTheme(this.currentTheme);
  }

  /**
   * Get the initial theme from localStorage or system preference
   */
  private getInitialTheme(): Theme {
    // Check localStorage first
    const stored = localStorage.getItem(THEME_KEY) as Theme | null;
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }

    // Fall back to system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  }

  /**
   * Apply the theme to the document
   */
  private applyTheme(theme: Theme): void {
    if (theme === 'dark') {
      document.body.classList.add(DARK_CLASS);
    } else {
      document.body.classList.remove(DARK_CLASS);
    }
    
    // Store preference
    localStorage.setItem(THEME_KEY, theme);
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#000000' : '#414868');
    }
  }

  /**
   * Toggle between light and dark themes
   */
  public toggle(): Theme {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(this.currentTheme);
    return this.currentTheme;
  }

  /**
   * Get the current theme
   */
  public getTheme(): Theme {
    return this.currentTheme;
  }

  /**
   * Set a specific theme
   */
  public setTheme(theme: Theme): void {
    this.currentTheme = theme;
    this.applyTheme(theme);
  }
}

/**
 * Initialize theme toggle button
 */
export function initThemeToggle(): ThemeManager {
  const themeManager = new ThemeManager();
  const button = document.querySelector('.theme-toggle') as HTMLButtonElement;

  if (button) {
    // Update button text based on current theme
    const updateButtonText = (theme: Theme) => {
      button.innerHTML = `
        <span class="theme-icon">${theme === 'light' ? '🌙' : '☀️'}</span>
        <span>${theme === 'light' ? 'Dark' : 'Light'} Mode</span>
      `;
    };

    updateButtonText(themeManager.getTheme());

    button.addEventListener('click', () => {
      const newTheme = themeManager.toggle();
      updateButtonText(newTheme);
    });
  }

  return themeManager;
}