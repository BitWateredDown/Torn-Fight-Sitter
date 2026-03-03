// ==UserScript==
// @name         Torn Fight Sitter
// @namespace    http://tampermonkey.net/
// @version      1.95
// @description  30s countdown fight dialog timer, refresh button if fight unavailable, changes Join Fight to save fight attacking an attacker
// @author       Copilot mostly
// @match        https://www.torn.com/loader.php?sid=attack&user2ID=*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/BitWateredDown/Torn-Fight-Sitter/refs/heads/main/Fight_sitter.js
// @downloadURL  https://raw.githubusercontent.com/BitWateredDown/Torn-Fight-Sitter/refs/heads/main/Fight_sitter.js
// ==/UserScript==

(function() {
    'use strict';

    function findFightButton() {
        return (
            document.querySelector('button[data-action="start"]') ||
            [...document.querySelectorAll("button")].find(b =>
                /start fight|join fight/i.test(b.textContent)
            )
        );
    }

    function findGreenDialog() {
        const btn = findFightButton();
        if (!btn) return null;
        return btn.closest("div[class*='dialog']");
    }

    function findRedDialog() {
        return [...document.querySelectorAll("div[class*='dialog']")]
            .find(d => /red/i.test(d.className));
    }

    // --- NEW: Move Join Fight button down one row ---
    function moveJoinFightButtonDown(btn) {
        if (!btn || btn.dataset.movedDown) return;

        const row = btn.closest(".row, .clearfix, div");
        if (!row) return;

        const nextRow = row.nextElementSibling;
        if (!nextRow) return;

        nextRow.after(row); // Move the whole row down one position
        btn.dataset.movedDown = "1";
    }

    function updateJoinFightButton(btn) {
        if (!btn) return;

        // Find the participants list
        const list = document.querySelector("ul.participants___cw7GQ");
        if (!list) return;

        const hasPlayers = list.querySelectorAll("li").length > 0;
        const isJoin = /join fight/i.test(btn.textContent);

        if (!isJoin) return; // Only modify Join Fight buttons

        if (hasPlayers) {
            // Someone is already in the fight → red Join fight
            btn.dataset.movedDown = "1"
            btn.textContent = "Join fight";
            btn.style.color = "#cc0000";
        } else {
            // No participants → green Save fight
            btn.textContent = "Save fight";
            btn.style.color = "#00cc00";
        }
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
                countdown.textContent = "FREE TARGET!";
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
                // moveJoinFightButtonDown(fightBtn); // <-- NEW BEHAVIOUR
                //updateJoinFightButton(fightBtn); // <--- NEW
                if (fightBtn) updateJoinFightButton(fightBtn);
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
            // moveJoinFightButtonDown(fightBtn); // <-- NEW BEHAVIOUR
            updateJoinFightButton(fightBtn); // <--- NEW
            const greenDialog = findGreenDialog();
            if (greenDialog) addCountdown(greenDialog);
        } else {
            const redDialog = findRedDialog();
            if (redDialog) addRefresh(redDialog);
        }
    }

    init();
})();


