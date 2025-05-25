document.addEventListener('DOMContentLoaded', () => {
  const tabButtons = document.querySelectorAll('#emissionTabs button[data-tab]');
  const tabContentContainer = document.getElementById('tabContent');

  // Function to load tab content by filename
  function loadTabContent(filename) {
    fetch('/tabs/' + filename)
      .then(response => {
        if (!response.ok) throw new Error(`Failed to load ${filename}`);
        return response.text();
      })
      .then(html => {
        // Inject HTML content into the container
        tabContentContainer.innerHTML = html;

        // Parse the HTML and extract any <script> tags
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = html;

        const scripts = tempDiv.querySelectorAll("script");
        scripts.forEach(oldScript => {
          const newScript = document.createElement("script");
          if (oldScript.src) {
            newScript.src = oldScript.src;
            newScript.async = false;
          } else {
            newScript.textContent = oldScript.textContent;
          }
          document.body.appendChild(newScript);
        });
      })
      .catch(error => {
        tabContentContainer.innerHTML = `<p class="text-danger">Napaka pri nalaganju vsebine.</p>`;
        console.error(error);
      });
  }

  // Load default active tab content
  const defaultTab = document.querySelector('#emissionTabs button.active');
  if (defaultTab) {
    loadTabContent(defaultTab.getAttribute('data-tab'));
  }

  // Add click event listeners to all tab buttons
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons
      tabButtons.forEach(btn => btn.classList.remove('active'));

      // Set clicked button as active
      button.classList.add('active');

      // Load corresponding content
      loadTabContent(button.getAttribute('data-tab'));
    });
  });
});
