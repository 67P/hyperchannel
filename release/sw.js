!function(){"use strict";self.CACHE_BUSTER="1625848410068|0.5319964745987633",self.addEventListener("install",(function(e){return self.skipWaiting()})),self.addEventListener("activate",(function(e){return self.clients.claim()})),self.addEventListener("push",(function(e){e.waitUntil(self.clients.matchAll().then(t=>{let n;if(t.some(e=>e.focused))return;try{n=e.data?e.data.json():"no payload",console.log("Push payload:",n)}catch(e){return void console.log("No payload received, or not valid JSON format")}let i=`Highlighted message from ${n.author} in ${n.channel}`,l=n.message;return self.registration.showNotification(i,{body:l})}))})),self.addEventListener("notificationclick",(function(e){e.waitUntil(self.clients.matchAll().then((function(e){return e.length>0?e[0].focus():self.clients.openWindow("/")})))}))}();
//# sourceMappingURL=sw.map