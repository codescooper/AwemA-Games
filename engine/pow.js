/* AwemA — client Proof-of-Work anti-bot. Résout le défi Hashcash dans un Web Worker
   (UI jamais figée), puis renvoie { c, n } à joindre à la requête protégée.
   NO-OP transparent : si le serveur a le PoW désactivé, /api/pow renvoie {enabled:false}
   → powToken() renvoie null, aucun calcul. Fail-open : toute erreur réseau → null (ne bloque
   pas un user légitime). Voir docs/antibot-pow.md. */
(function () {
  var API = window.POW_API || "https://awema-games-production.up.railway.app";
  // SHA-256 synchrone, ASCII (Geraint Luff, domaine public). Assez rapide pour la force brute ;
  // crypto.subtle.digest serait asynchrone → trop lent pour des millions d'essais.
  var SHA256_SRC = 'function sha256(ascii){function rrot(n,x){return (x>>>n)|(x<<(32-n));}var mathPow=Math.pow,maxWord=mathPow(2,32),result="";var words=[],asciiBitLength=ascii.length*8;var hash=sha256.h=sha256.h||[],k=sha256.k=sha256.k||[],primeCounter=k.length;var isComposite={};for(var candidate=2;primeCounter<64;candidate++){if(!isComposite[candidate]){for(var i=0;i<313;i+=candidate)isComposite[i]=candidate;hash[primeCounter]=(mathPow(candidate,.5)*maxWord)|0;k[primeCounter++]=(mathPow(candidate,1/3)*maxWord)|0;}}ascii+=String.fromCharCode(128);while(ascii.length%64-56)ascii+=String.fromCharCode(0);for(var i=0;i<ascii.length;i++){var j=ascii.charCodeAt(i);if(j>>8)return;words[i>>2]|=j<<((3-i)%4)*8;}words[words.length]=((asciiBitLength/maxWord)|0);words[words.length]=(asciiBitLength);for(var j=0;j<words.length;){var w=words.slice(j,j+=16),oldHash=hash;hash=hash.slice(0,8);for(var i=0;i<64;i++){var w15=w[i-15],w2=w[i-2];var a=hash[0],e=hash[4];var temp1=hash[7]+(rrot(6,e)^rrot(11,e)^rrot(25,e))+((e&hash[5])^((~e)&hash[6]))+k[i]+(w[i]=(i<16)?w[i]:(w[i-16]+(rrot(7,w15)^rrot(18,w15)^(w15>>>3))+w[i-7]+(rrot(17,w2)^rrot(19,w2)^(w2>>>10)))|0);var temp2=(rrot(2,a)^rrot(13,a)^rrot(22,a))+((a&hash[1])^(a&hash[2])^(hash[1]&hash[2]));hash=[(temp1+temp2)|0].concat(hash);hash[4]=(hash[4]+temp1)|0;}for(var i=0;i<8;i++)hash[i]=(hash[i]+oldHash[i])|0;}for(var i=0;i<8;i++)for(var j=3;j+1;j--){var b=(hash[i]>>(j*8))&255;result+=((b<16)?0:"")+b.toString(16);}return result;}';
  var WORKER_SRC = SHA256_SRC +
    ';var CLZ4=[4,3,2,2,1,1,1,1,0,0,0,0,0,0,0,0];' +
    'function lz(h){var b=0;for(var i=0;i<h.length;i++){var v=parseInt(h[i],16);b+=CLZ4[v];if(v!==0)break;}return b;}' +
    'self.onmessage=function(e){var ch=e.data.c,d=e.data.d,n=0;for(;;){if(lz(sha256(ch+":"+n))>=d){self.postMessage({nonce:n});return;}n++;if((n&8191)===0)self.postMessage({progress:n});}};';

  function solve(challenge, difficulty, onProgress) {
    return new Promise(function (resolve, reject) {
      var url, w;
      try { url = URL.createObjectURL(new Blob([WORKER_SRC], { type: "text/javascript" })); w = new Worker(url); }
      catch (e) { reject(e); return; }
      var fin = function (v, err) { try { w.terminate(); URL.revokeObjectURL(url); } catch (e) { } err ? reject(err) : resolve(v); };
      w.onmessage = function (ev) { if (ev.data && ev.data.progress !== undefined) { onProgress && onProgress(ev.data.progress); return; } fin(ev.data.nonce); };
      w.onerror = function (e) { fin(null, e); };
      w.postMessage({ c: challenge, d: difficulty });
    });
  }

  // Récupère un défi et le résout. Renvoie {c,n} ou null (PoW désactivé / erreur).
  window.powToken = function (onProgress) {
    return fetch(API + "/api/pow").then(function (r) { return r.json(); }).then(function (ch) {
      if (!ch || !ch.enabled) return null;                       // serveur : PoW OFF → no-op
      return solve(ch.challenge, ch.difficulty, onProgress).then(function (n) { return { c: ch.challenge, n: n }; });
    }).catch(function () { return null; });                       // fail-open
  };
})();
