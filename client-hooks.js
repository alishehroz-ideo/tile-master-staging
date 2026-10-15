// GameBull hooks into the client's page. A classic script loaded right AFTER the client's own scripts in
// app.html, so the client's files stay exactly as delivered: their top-level functions (start, pick, overlay,
// render, totalScore...) are globals that this file can wrap, and their top-level `let`s (lives, cleared,
// removedTiles, remaining, deadline, roundActive, paused, game) are shared with every classic script.
// The GameBull shell (main.tsx, a module) only talks to window.TMClient below.
(function () {
  "use strict";
  var hooks = { onEnd: null };          // set by the shell: (facts, showClientEnd) => void
  var ending = false;                   // the run has ended; scoring is locked
  var target = 0;                       // Score Challenge target (early finish), 0 = none

  // The client's own shared scoring (their game/scoring.js, TileScoring.calculate, through their scoreDetails()):
  // the board shows its breakdown and GameBull receives its `score` (already floored at 0 by the client).
  function facts(reason) {
    var s = scoreDetails();
    return { reason: reason, tiles: removedTiles, cleared: cleared, lives: lives, lost: 3 - lives,
      tilePoints: s.tilePoints, clearPoints: s.clearPoints, lifePenalty: s.lifePenalty, rawScore: s.rawScore,
      total: s.score, scoringVersion: s.scoringVersion };
  }

  // The client's result screen is replaced by the GameBull board. Their overlay() still runs (it fills their
  // hidden result screen, and un-hiding it is what makes their audio.js stop the music and effects.js stop the
  // bubbles, as in their design), but it is invisible (gamebull.css) and the shell shows the board instead.
  var clientOverlay = overlay;
  var ended = false;                    // the end has been handed to the shell (once per run)
  overlay = function (title, text, label, fn) {
    if (ended) return;
    var f = facts(game.state);
    ending = true; ended = true;
    console.log("[TM-GB] Client run end '" + f.reason + "': tiles " + f.tiles + ", stages " + f.cleared + ", lives lost " + f.lost + ", client score " + f.total + " (raw " + f.rawScore + ", scoring " + f.scoringVersion + ").");
    if (hooks.onEnd) hooks.onEnd(f, function () { clientOverlay(title, text, label, fn); });
    else clientOverlay(title, text, label, fn);
  };

  // Score Challenge early finish (playbook section 12): when the HUD total reaches the target, freeze input,
  // wait one beat so the match that did it lands on screen, then end the run through the client's own finish.
  var clientPick = pick;
  pick = function (id) {
    if (ending) return;
    clientPick(id);
    if (target > 0 && roundActive && !ending && totalScore() >= target) {
      ending = true; paused = true; render();
      console.log("[TM-GB] Challenge target " + target + " reached at " + totalScore() + "; ending in 0.9 s.");
      // If the clock ran out during the beat, the client's own timeout already ended the run.
      setTimeout(function () { if (roundActive && !ended) finishRound("target"); }, 900);
    }
  };

  window.TMClient = {
    hooks: hooks,
    // Park the page under the lobby in the state of the client's own result screen: their music stays off and
    // their bubbles pause until a run starts (start() hides the result screen again, which resumes both).
    park: function () { document.getElementById("overlay").hidden = false; },
    // A run = the client's own PLAY (their design.js + audio.js handlers), then the GameBull run length.
    // hold = Score Challenge: the board is dealt but frozen under the 5..1 GO intro.
    start: function (runMs, challengeTarget, hold) {
      ending = false; ended = false; target = challengeTarget || 0;
      document.getElementById("playButton").onclick();
      deadline = Date.now() + runMs; remaining = runMs / 1000;
      if (hold) { roundActive = false; paused = true; }
      render();
    },
    go: function (runMs) {
      deadline = Date.now() + runMs; remaining = runMs / 1000;
      roundActive = true; paused = false; render();
    },
    totalScore: function () { return totalScore(); },
    remaining: function () { return remaining; },
    deadline: function () { return deadline; },
    isRunning: function () { return roundActive && !ending; },
    // Localhost autoplay only (gamebull/ui/DevAuto.tsx).
    game: function () { return game; },
    pick: function (id) { pick(id); },
  };
})();
