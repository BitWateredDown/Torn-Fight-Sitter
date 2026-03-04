// ==UserScript==
// @name         Torn Fight Sitter
// @namespace    http://tampermonkey.net/
// @version      3.2
// @description  30s countdown fight dialog timer, refresh button if fight unavailable, changes Join Fight to save fight attacking an attacker
// @author       Copilot mostly and Mr_Chips
// @match        https://www.torn.com/loader.php?sid=attack&user2ID=*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/BitWateredDown/Torn-Fight-Sitter/refs/heads/main/Fight_sitter.js
// @downloadURL  https://raw.githubusercontent.com/BitWateredDown/Torn-Fight-Sitter/refs/heads/main/Fight_sitter.js
// ==/UserScript==

(function () {
    'use strict';

    let observer = null;
    let stopped = false;

    const scriptIntervals = new Set();

    function setScriptInterval(fn, ms) {
        const id = setInterval(fn, ms);
        scriptIntervals.add(id);
        return id;
    }

    function clearScriptInterval(id) {
        clearInterval(id);
        scriptIntervals.delete(id);
    }

    function stopScript() {
        if (stopped) return;
        stopped = true;

        if (observer) {
            observer.disconnect();
            observer = null;
        }

        scriptIntervals.forEach(id => clearInterval(id));
        scriptIntervals.clear();

        console.log('[Fight Sitter] Stopped.');
    }

    // ---------- DOM helpers ----------

    function findFightButton() {
        // Primary selector Torn uses
        let btn = document.querySelector('button[data-action="start"]');
        if (btn) return btn;

        // Fallback: any button with relevant text
        return [...document.querySelectorAll('button')].find(b =>
            /start fight|join fight|save fight/i.test(b.textContent)
        ) || null;
    }

    function findGreenDialog() {
        const btn = findFightButton();
        if (!btn) return null;

        const dialog = btn.closest("div[class*='dialog']");
        if (!dialog) return null;

        // Heuristic: not a red dialog
        if (/red/i.test(dialog.className)) return null;

        return dialog;
    }

    function findRedDialog() {
        // Red dialog by class name
        const byClass = [...document.querySelectorAll("div[class*='dialog']")]
            .find(d => /red/i.test(d.className));
        if (byClass) return byClass;

        // Fallback: dialog containing typical "already in a fight" text
        return [...document.querySelectorAll("div[class*='dialog']")]
            .find(d => /already in a fight|in a fight with someone else/i.test(d.textContent)) || null;
    }

    // ---------- Button state logic ----------

   function updateJoinFightButton(btn) {
    if (!btn) return;

    const rawText = btn.textContent.trim();
    const text = rawText.toLowerCase();

    const list = document.querySelector("ul.participants___cw7GQ");
    if (!list) return;

    const hasPlayers = list.querySelectorAll("li").length > 0;

    // --- RULE 1: Never modify "Start Fight" ---
    if (text === "start fight") {
        btn.style.color = ""; // reset any styling
        delete btn.dataset.joinMoved;
        return;
    }


    // --- RED state: players present ---
    if (hasPlayers) {
        btn.style.color = "#cc0000";
    
        // Two-click confirmation system
        if (!btn.dataset.confirm) {
            // First click: require confirmation
            btn.dataset.confirm = "1";
            btn.textContent = "Are you sure?";
            btn.addEventListener("click", (e) => {
                if (!e.isTrusted) return;
                // Second click: allow real action
                delete btn.dataset.confirm;
            }, { once: true });
    
            // Prevent the first click from triggering the fight
            btn.addEventListener("click", (e) => {
                if (btn.dataset.confirm === "1") {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                }
            }, { capture: true, once: true });
    
            return;
        }
    
        // If already confirmed, show normal red Join Fight
        btn.textContent = "Join fight";
        return;
    }


    // --- GREEN state: no players, but only modify if it was originally a join button ---
    if (text === "join fight") {
        btn.textContent = "Save fight";
        btn.style.color = "#00cc00";
        delete btn.dataset.joinMoved;
    }
}


    function attachStopOnUserClick(btn) {
        if (!btn || btn.dataset.stopAttached) return;

        btn.dataset.stopAttached = '1';

        btn.addEventListener('click', (e) => {
            // Only stop on real user clicks, not synthetic/programmatic ones
            if (!e.isTrusted) return;
            stopScript();
        }, { once: true });
    }

    // ---------- UI extras: countdown + refresh ----------

function addCountdown(dialog, fightBtn) {
    if (!dialog || dialog.dataset.countdownAdded) return;

    const text = fightBtn.textContent.trim().toLowerCase();
    if (text !== "start fight") return;  // Only show countdown for Start Fight

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

    const timerId = setScriptInterval(() => {
        timeLeft--;
        if (timeLeft > 0) {
            countdown.textContent = `(${timeLeft})`;
        } else {
            clearScriptInterval(timerId);
            countdown.textContent = "FREE TARGET!";
        }
    }, 1000);
}


    function createRefreshButton() {
        const btn = document.createElement('button');
        btn.textContent = 'Refresh';
        btn.className = 'torn-btn silver';
        btn.style.marginTop = '12px';
        btn.style.display = 'block';
        btn.style.marginLeft = 'auto';
        btn.style.marginRight = 'auto';
        btn.addEventListener('click', () => {
            location.reload();
        });
        return btn;
    }

    function addRefresh(dialog) {
        if (!dialog || dialog.dataset.refreshAdded) return;
        dialog.dataset.refreshAdded = '1';

        dialog.appendChild(createRefreshButton());
    }

    // ---------- Core observer logic ----------

    function handleDomChange() {
        if (stopped) return;

        const fightBtn = findFightButton();

        if (fightBtn) {
            attachStopOnUserClick(fightBtn);
            updateJoinFightButton(fightBtn);

            const greenDialog = findGreenDialog();
            if (greenDialog) {
                addCountdown(greenDialog, fightBtn);
            }
        }

        const redDialog = findRedDialog();
        if (redDialog) {
            addRefresh(redDialog);
        }
    }

    function initObserver() {
        if (observer) return;

        observer = new MutationObserver(() => {
            handleDomChange();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // ---------- Init ----------

    function init() {
        if (stopped) return;

        handleDomChange();
        initObserver();

        console.log('[Fight Sitter] Initialized.');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();



