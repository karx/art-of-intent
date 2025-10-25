/**
 * Side Navigation Functionality
 * Cognitive design-optimized navigation system
 */

class SideNavigation {
    constructor() {
        this.nav = document.getElementById('sideNav');
        this.toggleBtn = document.getElementById('navToggle');
        this.storageKey = 'sideNavExpanded';
        this.expandTimeout = null;
        
        this.init();
    }
    
    init() {
        if (!this.nav || !this.toggleBtn) {
            console.warn('Side navigation elements not found');
            return;
        }
        
        console.log('Side navigation initialized');
        
        // Load saved state from localStorage
        const savedState = localStorage.getItem(this.storageKey);
        if (savedState === 'true') {
            this.expand(false);
        }
        
        // Click to toggle (pin/unpin)
        this.toggleBtn.addEventListener('click', () => this.toggle());
        
        // Hover to expand (temporary)
        this.nav.addEventListener('mouseenter', () => {
            if (!this.nav.classList.contains('expanded')) {
                this.expandTimeout = setTimeout(() => {
                    this.expand(false);
                }, 100);
            }
        });
        
        this.nav.addEventListener('mouseleave', () => {
            clearTimeout(this.expandTimeout);
            // Only collapse if not pinned
            if (!this.isPinned()) {
                this.collapse(false);
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+B: Toggle sidebar
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault();
                this.toggle();
            }
            
            // F1: Help
            if (e.key === 'F1') {
                e.preventDefault();
                document.getElementById('helpBtn')?.click();
            }
            
            // Ctrl+L: Leaderboard
            if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
                e.preventDefault();
                document.getElementById('leaderboardBtn')?.click();
            }
            
            // Ctrl+P: Profile
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                document.getElementById('profileBtn')?.click();
            }
            
            // Ctrl+M: Mute/Unmute
            if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
                e.preventDefault();
                document.getElementById('soundToggleBtn')?.click();
            }
        });
        
        // Update ARIA attributes
        this.updateAria();
    }
    
    toggle() {
        if (this.nav.classList.contains('expanded')) {
            this.collapse(true);
        } else {
            this.expand(true);
        }
    }
    
    expand(pin = false) {
        this.nav.classList.add('expanded');
        document.body.classList.add('nav-expanded');
        if (pin) {
            localStorage.setItem(this.storageKey, 'true');
        }
        this.updateAria();
    }
    
    collapse(pin = false) {
        this.nav.classList.remove('expanded');
        document.body.classList.remove('nav-expanded');
        if (pin) {
            localStorage.setItem(this.storageKey, 'false');
        }
        this.updateAria();
    }
    
    isPinned() {
        return localStorage.getItem(this.storageKey) === 'true';
    }
    
    updateAria() {
        const isExpanded = this.nav.classList.contains('expanded');
        this.toggleBtn?.setAttribute('aria-expanded', isExpanded.toString());
    }
}

// Scroll handler for auto-hide top bar and mobile nav
class ScrollHandler {
    constructor() {
        this.lastScroll = 0;
        this.topBar = document.getElementById('topBar');
        this.sideNav = document.getElementById('sideNav');
        this.scrollThreshold = 10;
        
        this.init();
    }
    
    init() {
        // Set initial state
        document.body.classList.add('scrolled-top');
        
        // Throttled scroll handler
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    this.handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        });
    }
    
    handleScroll() {
        const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
        const isMobile = window.innerWidth <= 767;
        
        if (currentScroll <= this.scrollThreshold) {
            // At top - show bars
            document.body.classList.add('scrolled-top');
            if (this.topBar) this.topBar.classList.remove('hidden');
            if (this.sideNav) this.sideNav.classList.remove('hidden');
        } else {
            // Scrolled down - hide bars
            document.body.classList.remove('scrolled-top');
            
            if (!isMobile && this.topBar) {
                // Desktop: hide top bar
                this.topBar.classList.add('hidden');
            }
            
            if (isMobile && this.sideNav) {
                // Mobile: hide nav bar
                this.sideNav.classList.add('hidden');
            }
        }
        
        this.lastScroll = currentScroll;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new SideNavigation();
        new ScrollHandler();
    });
} else {
    new SideNavigation();
    new ScrollHandler();
}

export default SideNavigation;
