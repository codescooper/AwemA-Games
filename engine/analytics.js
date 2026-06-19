/* AwemA — analytics produit (PostHog). Chargé en asynchrone et FAIL-SAFE :
   - ne fait RIEN tant que la clé projet n'est pas renseignée (placeholder ci-dessous) ;
   - ne fait RIEN en double-clic local (file://) → l'offline-first reste intact ;
   - n'altère JAMAIS le jeu : toute erreur est avalée, et window.track() existe toujours.
   Région : EU. Profils standard. Pas d'enregistrement de session (replay désactivé).
   Pour activer : remplacer PH_PROJECT_KEY par la vraie clé projet PostHog (phc_...). */
(function () {
  var KEY = "PH_PROJECT_KEY";                 // <-- clé projet PostHog (phc_...) — placeholder
  var HOST = "https://eu.i.posthog.com";
  window.track = function () {};              // no-op par défaut (remplacé si PostHog se charge)
  try {
    if (typeof KEY !== "string" || KEY.indexOf("phc_") !== 0) return;   // garde : clé non configurée
    if (location.protocol === "file:") return;                          // pas de tracking hors-ligne local
    !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
    posthog.init(KEY, { api_host: HOST, defaults: "2026-01-30", disable_session_recording: true, autocapture: true, capture_pageview: true, capture_pageleave: true });
    var page = (location.pathname.split("/").pop() || "index.html").replace(".html", "") || "index";
    try { posthog.register({ app: "awema", page: page }); } catch (e) {}   // chaque event porte le nom de la page/jeu
    window.track = function (name, props) { try { if (window.posthog && posthog.capture) posthog.capture(name, props || {}); } catch (e) {} };
    window.trackId = function (id, props) { try { if (window.posthog && id && posthog.identify) posthog.identify(String(id), props || {}); } catch (e) {} };
  } catch (e) { /* l'analytics ne doit jamais casser la page */ }
})();
