/* ReadPlanner PWA service worker — build 104 */
const BUILD = '104';
const CACHE_PREFIX = 'readplanner-shell-';
const CACHE_NAME = CACHE_PREFIX + 'v' + BUILD;
const scopeUrl = path => new URL(path, self.registration.scope).href;
const INDEX_URL = scopeUrl('./index.html');

const SHARED_CACHE = 'readplanner-shared-import-v1';
const SHARED_URL = scopeUrl('./__readplanner_shared_book__');
async function receiveSharedBook(request){
  try{
    const form=await request.formData();
    const files=[];for(const value of form.values())if(value instanceof File&&value.size)files.push(value);
    const file=files[0];
    if(!file)return Response.redirect(scopeUrl('./?share-error=1'),303);
    const name=String(file.name||'shared-book.epub');
    if(!/\.(?:epub|pdf|txt)$/i.test(name))return Response.redirect(scopeUrl('./?share-error=unsupported'),303);
    const cache=await caches.open(SHARED_CACHE);
    await cache.put(SHARED_URL,new Response(file,{headers:{'Content-Type':file.type||'application/octet-stream','X-ReadPlanner-File-Name':encodeURIComponent(name)}}));
    return Response.redirect(scopeUrl('./?shared-import=1'),303);
  }catch(_){return Response.redirect(scopeUrl('./?share-error=1'),303);}
}

const CRITICAL_SHELL = ['./index.html'];
const OPTIONAL_SHELL = [
  './',
  './manifest.json',
  './vendor/jszip.min.js',
  './apple-touch-icon.png',
  './apple-touch-icon-precomposed.png',
  './favicon.png',
  './favicon.ico',
  './icons/apple-touch-icon-v80.png',
  './icons/icon-192-v80.png',
  './icons/icon-512-v80.png',
  './icons/icon-192-maskable-v80.png',
  './icons/icon-512-maskable-v80.png'
];

async function fetchAndCache(cache, path){
  const url=scopeUrl(path);
  const response=await fetch(url,{cache:'reload'});
  if(!response||!response.ok)throw new Error('Could not cache '+path+' ('+(response&&response.status||'no response')+')');
  await cache.put(url,response.clone());
}

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    // The worker should not install without a usable offline document. Icons and
    // other metadata are optional so one missing decorative file cannot block it.
    await Promise.all(CRITICAL_SHELL.map(path=>fetchAndCache(cache,path)));
    await Promise.allSettled(OPTIONAL_SHELL.map(path=>fetchAndCache(cache,path)));
    // Do not skipWaiting: an update must never replace the controller and reload
    // the app while the person is reading, selecting text, or listening.
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    // GitHub Pages repositories share an origin. Delete only caches owned by this
    // app; never erase caches belonging to another project on the same account.
    await Promise.all(keys
      .filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE_NAME)
      .map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

async function safeCachePut(cache,request,response){
  try{if(response&&response.ok&&response.type!=='opaque')await cache.put(request,response.clone());}catch(_){}
}

async function networkFirstNavigation(request){
  const cache=await caches.open(CACHE_NAME);
  try{
    const response=await fetch(request,{cache:'no-store'});
    // Normalize all navigation/query variants to one shell entry; this avoids an
    // ever-growing cache for shortcut URLs and future query parameters.
    await safeCachePut(cache,INDEX_URL,response);
    return response;
  }catch(_){
    return (await cache.match(INDEX_URL)) || (await cache.match(scopeUrl('./'))) || Response.error();
  }
}

async function staleWhileRevalidate(request,event){
  const cache=await caches.open(CACHE_NAME);
  const cached=await cache.match(request);
  const network=fetch(request).then(async response=>{
    await safeCachePut(cache,request,response);
    return response;
  }).catch(()=>null);
  if(cached){
    event.waitUntil(network.then(()=>undefined));
    return cached;
  }
  return (await network)||Response.error();
}

self.addEventListener('fetch',event=>{
  const request=event.request;
  const url=new URL(request.url);
  const scope=new URL(self.registration.scope);
  if(url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
  if(request.method==='POST'&&url.searchParams.get('share-target')==='1'){
    event.respondWith(receiveSharedBook(request));return;
  }
  if(request.method!=='GET'||request.headers.has('range'))return;
  if(url.href===SHARED_URL){event.respondWith(caches.open(SHARED_CACHE).then(cache=>cache.match(SHARED_URL)).then(response=>response||new Response('',{status:404})));return;}
  if(request.mode==='navigate'){
    event.respondWith(networkFirstNavigation(request));
    return;
  }
  event.respondWith(staleWhileRevalidate(request,event));
});
