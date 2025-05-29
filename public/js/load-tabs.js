document.addEventListener('DOMContentLoaded', () => {
  const tabButtons = document.querySelectorAll('#emissionTabs button[data-tab], .card button[data-tab]');
  const tabContentContainer = document.getElementById('tabContent');
  const loader = createLoader(); // Create loading indicator

  // Create loading indicator element
  function createLoader() {
    const loader = document.createElement('div');
    loader.className = 'tab-loader';
    loader.innerHTML = `
      <div class="d-flex justify-content-center align-items-center" style="height: 200px;">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Nalaganje...</span>
        </div>
      </div>
    `;
    return loader;
  }

  // Function to update browser history
  function updateHistory(tabName) {
    const url = new URL(window.location);
    url.searchParams.set('tab', tabName);
    history.pushState({ tab: tabName }, '', url);
  }

  // Function to load tab content by filename
  async function loadTabContent(filename, pushState = true) {
    try {
      // Show loading indicator
      tabContentContainer.innerHTML = '';
      tabContentContainer.appendChild(loader);
      
      const response = await fetch('/tabs/' + filename);
      if (!response.ok) throw new Error(`Failed to load ${filename}`);
      const html = await response.text();
      
      // Inject HTML content into the container
      tabContentContainer.innerHTML = html;
      
      // Update active state
      tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === filename);
      });

      // Update browser history
      if (pushState) {
        updateHistory(filename);
      }

      // Dispatch event that content is loaded
      const event = new CustomEvent('tabContentLoaded', { detail: { tab: filename } });
      tabContentContainer.dispatchEvent(event);

      // Process any scripts in the loaded content
      processScripts(tabContentContainer);

    } catch (error) {
      console.error(`Error loading tab ${filename}:`, error);
      tabContentContainer.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-triangle me-2"></i>
          Napaka pri nalaganju vsebine. Prosimo, poskusite znova.
        </div>
      `;
    }
  }

  // Process script tags in loaded content
  function processScripts(container) {
    const scripts = container.querySelectorAll('script');
    
    scripts.forEach(oldScript => {
      const newScript = document.createElement('script');
      
      if (oldScript.src) {
        // External script
        newScript.src = oldScript.src;
        newScript.async = false;
      } else {
        // Inline script
        newScript.textContent = oldScript.textContent;
      }
      
      // Copy attributes
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      
      // Replace old script with new one
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });
  }

  // Handle back/forward navigation
  window.addEventListener('popstate', (event) => {
    if (event.state && event.state.tab) {
      loadTabContent(event.state.tab, false);
    }
  });

  // Check URL for initial tab
  function getInitialTab() {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    return tabParam || document.querySelector('#emissionTabs button.active')?.getAttribute('data-tab') || 'overview.html';
  }

  // Load initial tab
  loadTabContent(getInitialTab());

  // Add click event listeners to all tab buttons (both navbar and cards)
  tabButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const tabName = button.getAttribute('data-tab');
      loadTabContent(tabName);
    });
  });
});