document.addEventListener('DOMContentLoaded', () => {
  const tabButtons = document.querySelectorAll('#dashboardTabs button[data-tab], .submenu a[data-tab]');
  const tabContentContainer = document.getElementById('tabContent');
  const loader = createLoader();

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

  function updateHistory(tabName) {
    const url = new URL(window.location);
    url.searchParams.set('tab', tabName);
    history.pushState({ tab: tabName }, '', url);
  }

  async function loadTabContent(filename, pushState = true) {
    try {
      tabContentContainer.innerHTML = '';
      tabContentContainer.appendChild(loader);
      const response = await fetch('/tabs/' + filename);
      if (!response.ok) throw new Error(`Failed to load ${filename}`);
      const html = await response.text();
      tabContentContainer.innerHTML = html;
      tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === filename);
      });
      if (pushState) {
        updateHistory(filename);
      }
      // Process scripts and trigger reinitialization
      processScripts(tabContentContainer);
      const event = new CustomEvent('tabContentLoaded', { detail: { tab: filename } });
      tabContentContainer.dispatchEvent(event);
      // Call tab-specific initialization
      initializeTab(filename);
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

  function processScripts(container) {
    const scripts = container.querySelectorAll('script');
    scripts.forEach(oldScript => {
      const newScript = document.createElement('script');
      if (oldScript.src) {
        newScript.src = oldScript.src;
        newScript.async = false;
      } else {
        newScript.textContent = oldScript.textContent;
      }
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });
  }

  function initializeTab(tabName) {
    // Tab-specific initialization
    switch (tabName) {
      case 'overview.html':
      case 'comparison.html':
        if (typeof initDashboard === 'function') {
          initDashboard();
        }
        break;
      case 'sectors.html':
        if (typeof initSectorsTab === 'function') {
          initSectorsTab();
        }
        break;
      case 'map.html':
        if (typeof initMap === 'function') {
          initMap();
        }
        break;
    }
  }

  window.addEventListener('popstate', (event) => {
    if (event.state && event.state.tab) {
      loadTabContent(event.state.tab, false);
    }
  });

  function getInitialTab() {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    return tabParam || document.querySelector('#dashboardTabs button.active')?.getAttribute('data-tab') || 'overview.html';
  }

  loadTabContent(getInitialTab());

  tabButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const tabName = button.getAttribute('data-tab');
      loadTabContent(tabName);
    });
  });
});