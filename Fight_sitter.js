// ==UserScript==
// @name         Jim Torn Fight Countdown + Refresh (Stable)
// @namespace    http://tampermonkey.net/
// @version      1.7
// @description  Shows a 30s countdown in the green fight dialog and a refresh button when fight is unavailable
// @match        https://www.torn.com/loader.php?sid=attack&user2ID=*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Finds the fight button reliably
    function findFightButton() {
        return (
            document.querySelector('button[data-action="start"]') ||
            [...document.querySelectorAll("button")].find(b =>
                /start fight|join fight/i.test(b.textContent)
            )
        );
    }

    // Finds ANY dialog container that wraps the fight button
    function findGreenDialog() {
        const btn = findFightButton();
        if (!btn) return null;
        return btn.closest("div[class*='dialog']");
    }

    // Finds ANY red dialog (hospital / unavailable)
    function findRedDialog() {
        return [...document.querySelectorAll("div[class*='dialog']")]
            .find(d => /red/i.test(d.className));
    }

    function createRefreshButton() {
        const btn = document.createElement("button");
        btn.textContent = "Refresh";
        btn.className = "torn-btn silver";
        btn.style.marginTop = "12px";
        btn.style.display = "block";
        btn.style.marginLeft = "auto";
        btn.style.marginRight = "auto";
        btn.onclick = () => location.reload();
        return btn;
    }

    function addCountdown(dialog) {
        if (!dialog || dialog.dataset.countdownAdded) return;
        dialog.dataset.countdownAdded = "1";

        let timeLeft = 30;

        const countdown = document.createElement("div");
        countdown.style.textAlign = "center";
        countdown.style.fontWeight = "bold";
        countdown.style.marginBottom = "6px";
        countdown.style.fontSize = "16px";
        countdown.style.color = "#0a0";
        countdown.textContent = `(${timeLeft})`;

        dialog.prepend(countdown);

        const timer = setInterval(() => {
            timeLeft--;
            countdown.textContent = `(${timeLeft})`;

            if (timeLeft <= 0) {
                clearInterval(timer);
                // ❌ removed: location.reload();
                countdown.textContent = "HIT 'EM!";
            }
        }, 1000);
    }

    function addRefresh(dialog) {
        if (!dialog || dialog.dataset.refreshAdded) return;
        dialog.dataset.refreshAdded = "1";

        dialog.appendChild(createRefreshButton());
    }

    function init() {
        const observer = new MutationObserver(() => {
            const fightBtn = findFightButton();

            if (fightBtn) {
                const greenDialog = findGreenDialog();
                if (greenDialog) addCountdown(greenDialog);
            } else {
                const redDialog = findRedDialog();
                if (redDialog) addRefresh(redDialog);
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        // Run immediately on load
        const fightBtn = findFightButton();
        if (fightBtn) {
            const greenDialog = findGreenDialog();
            if (greenDialog) addCountdown(greenDialog);
        } else {
            const redDialog = findRedDialog();
            if (redDialog) addRefresh(redDialog);
        }
    }

    init();
})();
