// ==UserScript==
// @name         Don't forget your Xanax
// @namespace    http://tampermonkey.net/
// @version      2024-06-26
// @description  Reminds you to take your xanax when you have no drug cooldown
// @author       Chips
// @match        https://www.torn.com/*
// @grant        none
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // -----------------------------------------
    // Wildcard exclusion list
    // -----------------------------------------
    const excludePatterns = [
        "https://www.torn.com/loader.php?sid=attack*",
        "https://www.torn.com/pc.php*",
        "https://www.torn.com/level2.php*",
        "https://www.torn.com/some/other/page*"
    ];

    // Simple wildcard matcher (* only)
    function wildcardMatch(pattern, url) {
        const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
        return regex.test(url);
    }

    // Check if current URL should be excluded
    const currentURL = window.location.href;
    const isExcluded = excludePatterns.some(pattern => wildcardMatch(pattern, currentURL));

    if (isExcluded) return; // Stop script entirely

    // -----------------------------------------
    // Main script
    // -----------------------------------------
    $(document).ready(function() {
        setTimeout(function() {
            const drugcd = document.querySelector("[aria-label^='Drug Cooldown:']");
            if (drugcd == null) {
                $("body").append(
                    '<div style="background-color: red; position:fixed; top:0; width:100%; z-index:99999; padding: 12px; text-align: center; color: white;">Take your damn Xanax</div>'
                );
            }
        }, 5000);
    });
})();
