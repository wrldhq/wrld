/* Validation item #13 from the debug brief: "Three rapid auth-state
 * events do not create three navigations." Fires INITIAL_SESSION plus two
 * more quick TOKEN_REFRESHED-style events (all carrying the same valid
 * session) against this repository's actual shipped supabase-client.js
 * and counts navigations. Run from this directory: `node harness4.js`.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const REPO = path.join(__dirname, '..');
const AUTHJS = path.join(__dirname, '..', 'auth.js');

function makeStorage(){
  const store = new Map();
  return { getItem: (k)=>store.has(k)?store.get(k):null, setItem:(k,v)=>store.set(k,String(v)), removeItem:(k)=>store.delete(k) };
}

async function run(){
  const navLog = [];
  const localStorage = makeStorage(), sessionStorage = makeStorage();
  const t0 = Date.now();
  let hrefValue = 'https://ourwrld.org/welcome.html';
  const locationObj = {
    get href(){ return hrefValue; },
    set href(v){ navLog.push({t:Date.now()-t0, to:v}); hrefValue = v; },
    get pathname(){ return '/welcome.html'; }, get search(){ return ''; },
    get origin(){ return 'https://ourwrld.org'; }, get hostname(){ return 'ourwrld.org'; },
  };
  const sandbox = { console:{debug(){},error(){},log(){},info(){}}, location:locationObj, sessionStorage, localStorage, setTimeout, clearTimeout, Promise, Date, window:{} };
  sandbox.window.location = locationObj;
  vm.createContext(sandbox);

  const session = { user: { id: 'user-123' } };
  const profile = { id: 'user-123', name: 'Test User', first_name: 'Test', role: 'explorer' };
  let authCb = null;
  const mockClient = {
    auth: {
      getSession: () => new Promise((resolve) => setTimeout(() => resolve({ data: { session } }), 8)),
      onAuthStateChange: (cb) => { authCb = cb; setTimeout(() => cb('INITIAL_SESSION', session), 12); return { data:{subscription:{unsubscribe(){}}} }; },
      refreshSession: () => Promise.resolve({ data: { session }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
    },
    from: () => ({ select: () => ({ eq: () => ({ single: () => new Promise((resolve) => setTimeout(() => resolve({ data:{...profile}, error:null }), 25)) }) }) }),
  };
  sandbox.supabase = { createClient: () => mockClient };
  sandbox.WRLD_SUPABASE_URL='x'; sandbox.WRLD_SUPABASE_PUBLISHABLE_KEY='x';

  vm.runInContext(fs.readFileSync(path.join(REPO,'supabase-client.js'),'utf8'), sandbox, {filename:'supabase-client.js'});
  vm.runInContext(fs.readFileSync(AUTHJS,'utf8'), sandbox, {filename:'auth.js'});

  const welcomeScript = `
    let wrldWelcomeInitDone = false;
    globalThis.__wrldWelcomeResult = new Promise((resolveOuter) => {
      const watchdog = setTimeout(() => { if(wrldWelcomeInitDone) return; resolveOuter('WATCHDOG_TIMEOUT_RECOVERY'); }, 10000);
      (async () => {
        try{
          await window.wrldAuthReady;
          if(!requireAuth()){
            resolveOuter((typeof isAuthenticated==='function' && !isAuthenticated()) ? 'RENDER_RECOVERY_UNAUTHENTICATED' : 'SILENT_RETURN_NO_RENDER');
            wrldWelcomeInitDone = true; clearTimeout(watchdog); return;
          }
          const user = getCurrentUser();
          resolveOuter('RENDER_GREETING:' + (user ? user.name : 'NULL_USER'));
          wrldWelcomeInitDone = true; clearTimeout(watchdog);
        }catch(e){ wrldWelcomeInitDone = true; clearTimeout(watchdog); resolveOuter('CATCH_RECOVERY:' + (e&&e.message)); }
      })();
    });
  `;
  vm.runInContext(welcomeScript, sandbox, { filename: 'welcome.html-inline' });

  // Fire two extra rapid TOKEN_REFRESHED-style events shortly after the
  // initial one, same valid session — simulates the exact "three rapid
  // auth-state events" the debug brief's validation item #13 calls for.
  setTimeout(() => { if(authCb) authCb('TOKEN_REFRESHED', session); }, 20);
  setTimeout(() => { if(authCb) authCb('TOKEN_REFRESHED', session); }, 24);

  const result = await sandbox.__wrldWelcomeResult;
  console.log('RESULT:', result);
  console.log('Total location.href writes:', navLog.length, JSON.stringify(navLog));
  console.log(navLog.length === 0 ? 'PASS — zero navigations for a genuinely authenticated visitor across 3 rapid auth events.' : 'FAIL — unexpected navigation(s).');
}
run();
