!function(){"use strict";self.CACHE_BUSTER="1580230087099|0.07220238164093051",self.addEventListener("install",(function(n){return self.skipWaiting()})),self.addEventListener("activate",(function(n){return self.clients.claim()})),self.addEventListener("push",(function(n){n.waitUntil(self.clients.matchAll().then((function(t){var e;if(!t.some((function(n){return n.focused}))){try{e=n.data?n.data.json():"no payload",console.log("Push payload:",e)}catch(n){return void console.log("No payload received, or not valid JSON format")}var i="Highlighted message from ".concat(e.author," in ").concat(e.channel),o=e.message;return self.registration.showNotification(i,{body:o})}})))})),self.addEventListener("notificationclick",(function(n){n.waitUntil(self.clients.matchAll().then((function(n){return n.length>0?n[0].focus():self.clients.openWindow("/")})))}))}();
//# sourceMappingURL=sw.map