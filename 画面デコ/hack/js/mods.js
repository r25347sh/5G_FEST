/** Register optional modules with ShadowCMD */
(function (global) {
  "use strict";
  function reg() {
    if (!global.ShadowCMD || typeof global.ShadowCMD.register !== "function") return;
    global.ShadowCMD.register("xfer", {
      desc: "Transfer / process progress bars",
      activate: function () {
        if (global.ShadowXfer) { global.ShadowXfer.start(); global.ShadowCMD.toast("XFER", "bars online"); return true; }
        global.ShadowCMD.toast("XFER", "module offline", true); return false;
      },
      deactivate: function () {
        if (global.ShadowXfer) { global.ShadowXfer.stop(); global.ShadowCMD.toast("XFER", "bars offline"); return true; }
        return false;
      }
    });
    global.ShadowCMD.register("bars", {
      desc: "Alias for xfer",
      activate: function () { return global.ShadowCMD.exec("activate xfer"); },
      deactivate: function () { return global.ShadowCMD.exec("deactivate xfer"); }
    });
    global.ShadowCMD.register("roulette", {
      desc: "European roulette (5G-staff wheel)",
      activate: function () {
        if (global.ShadowRoulette) { global.ShadowRoulette.show(); global.ShadowCMD.toast("ROULETTE", "wheel online"); return true; }
        global.ShadowCMD.toast("ROULETTE", "module offline", true); return false;
      },
      deactivate: function () {
        if (global.ShadowRoulette) { global.ShadowRoulette.hide(); global.ShadowCMD.toast("ROULETTE", "wheel closed"); return true; }
        return false;
      }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", reg);
  else reg();
})(typeof window !== "undefined" ? window : this);
