/**
 * Splashdeals Embed Widget v1.0
 *
 * Automatically finds all #splashdeals-widget elements on the page and
 * enhances them with live ticket data from Splashdeals API.
 *
 * Usage:
 *   <div id="splashdeals-widget" data-facility="some-facility-slug">
 *     <script src="https://splashdeals.rs/embed.js"></script>
 *   </div>
 *
 * The script renders a "Kupi kartu" button with the lowest ticket price
 * when live data is available, or falls back to the static button.
 */

(function () {
  "use strict";

  var BASE_URL =
    window.SPLASHDEALS_BASE_URL ||
    (function () {
      var scripts = document.getElementsByTagName("script");
      for (var i = 0; i < scripts.length; i++) {
        var src = scripts[i].src || "";
        if (src.indexOf("embed.js") !== -1) {
          return src.replace("/embed.js", "");
        }
      }
      return "https://splashdeals.rs";
    })();

  /**
   * Fetch ticket data for a facility from the Splashdeals internal API.
   * @param {string} slug
   * @return {Promise<{minPrice: number|null, name: string, city: string, slug: string}>}
   */
  function fetchTicketData(slug) {
    var url = BASE_URL + "/api/tickets/" + encodeURIComponent(slug);
    return fetch(url, { method: "GET", mode: "cors" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        return {
          minPrice: data.minPrice != null ? data.minPrice : null,
          name: data.name || slug,
          city: data.city || "",
          slug: slug,
        };
      })
      .catch(function () {
        // Fallback: return null data — widget still renders static button
        return { minPrice: null, name: null, city: null, slug: slug };
      });
  }

  /**
   * Enhance a single widget container with live ticket data.
   * @param {HTMLElement} widget
   */
  function enhanceWidget(widget) {
    var slug = widget.getAttribute("data-facility");
    if (!slug) return;

    var link = widget.querySelector('a[href*="' + slug + '"]');
    if (!link) return;

    // Show loading state
    var originalText = link.textContent || "Kupi kartu";

    fetchTicketData(slug).then(function (data) {
      if (data.minPrice !== null) {
        link.textContent = "Kupi kartu od " + data.minPrice + " RSD";
      } else {
        link.textContent = originalText;
      }

      // Update subtitle with facility name
      var subtitle = widget.querySelector("p:first-of-type");
      if (subtitle && data.name) {
        subtitle.textContent = data.name + (data.city ? " — " + data.city : "");
      }

      // Mark as loaded
      widget.setAttribute("data-loaded", "true");
    });
  }

  /**
   * Initialize all splashdeals widgets on the page.
   */
  function init() {
    var widgets = document.querySelectorAll("#splashdeals-widget");
    for (var i = 0; i < widgets.length; i++) {
      enhanceWidget(widgets[i]);
    }
  }

  // Run on DOMContentLoaded, or immediately if already loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Also support dynamic insertion via MutationObserver
  if (typeof MutationObserver !== "undefined") {
    var observer = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var addedNodes = mutations[i].addedNodes;
        for (var j = 0; j < addedNodes.length; j++) {
          var node = addedNodes[j];
          if (node.nodeType === 1) {
            var widget =
              node.matches && node.matches("#splashdeals-widget")
                ? node
                : node.querySelector && node.querySelector("#splashdeals-widget");
            if (widget && !widget.getAttribute("data-loaded")) {
              enhanceWidget(widget);
            }
          }
        }
      }
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }
})();
