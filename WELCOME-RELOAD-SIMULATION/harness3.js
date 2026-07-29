/* Runs the race scenarios that proved (case E) and disproved (A/B/C/F/G)
 * the welcome.html reload-loop defect against THIS repository's actual
 * shipped supabase-client.js and auth.js (the fixed V22.6 versions) —
 * confirms the fix removes the dual-authority race without changing any
 * other observable behavior. Run from this directory: `node harness3.js`.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const REPO = path.join(__dirname, '..');
const AUTHJS = path.join(__dirname, '..', 'auth.js');

function makeStorage(){
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => { store.set(k, String(v)); },
    removeItem: (k) => { store.delete(k); },
  };
}

function runScenario(name, opts){
  const navLog = [];
  const localStorage = makeStorage();
  const sessionStorage = makeStorage();
  const FAKE_USER_ID = 'user-123';
  const fakeProfile = { id: FAKE_USER_ID, name: 'Test User', first_name: 'Test', role: 'explorer' };

  const t0 = Date.now();
  let hrefValue = 'https://ourwrld.org/welcome.html';
  const locationObj = {
    get href(){ return hrefValue; },
    set href(v){ navLog.push({ t: Date.now() - t0, to: v }); hrefValue = v; },
    get pathname(){ return '/welcome.html'; },
    get search(){ return ''; },
    get origin(){ return 'https://ourwrld.org'; },
    get hostname(){ return 'ourwrld.org'; },
  };

  const sandbox = {
    console: { debug(){}, error(){}, log(){}, info(){} },
    location: locationObj, sessionStorage, localStorage,
    setTimeout, clearTimeout, Promise, Date, window: {},
  };
  sandbox.window.location = locationObj;
  vm.createContext(sandbox);

  const mockClient = {
    auth: {
      getSession: () => new Promise((resolve) => {
        setTimeout(() => resolve({ data: { session: opts.getSessionSession } }), opts.getSessionDelay);
      }),
      onAuthStateChange: (cb) => {
        setTimeout(() => cb('INITIAL_SESSION', opts.initialEventSession), opts.initialEventDelay);
        return { data: { subscription: { unsubscribe(){} } } };
      },
      refreshSession: () => Promise.resolve({ data: { session: opts.initialEventSession }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
    },
    from: () => ({ select: () => ({ eq: () => ({ single: () => new Promise((resolve) => {
      setTimeout(() => resolve({ data: { ...fakeProfile }, error: null }), opts.profileFetchDelay);
    }) }) }) }),
  };
  sandbox.supabase = { createClient: () => mockClient };
  sandbox.WRLD_SUPABASE_URL = 'x'; sandbox.WRLD_SUPABASE_PUBLISHABLE_KEY = 'x';

  vm.runInContext(fs.readFileSync(path.join(REPO, 'supabase-client.js'), 'utf8'), sandbox, { filename: 'supabase-client.js' });
  vm.runInContext(fs.readFileSync(AUTHJS, 'utf8'), sandbox, { filename: 'auth.js' });

  const welcomeScript = `
    let wrldWelcomeInitDone = false;
    globalThis.__wrldWelcomeResult = new Promise((resolveOuter) => {
      const watchdog = setTimeout(() => { if(wrldWelcomeInitDone) return; resolveOuter('WATCHDOG_TIMEOUT_RECOVERY'); }, 10000);
      (async () => {
        try{
          await window.wrldAuthReady;
          if(!requireAuth()){
            if(typeof isAuthenticated === 'function' && !isAuthenticated()){
              resolveOuter('RENDER_RECOVERY_UNAUTHENTICATED');
            } else {
              resolveOuter('SILENT_RETURN_NO_RENDER');
            }
            wrldWelcomeInitDone = true; clearTimeout(watchdog); return;
          }
          const profileState = typeof wrldGetProfileState === 'function' ? wrldGetProfileState() : 'loaded';
          if(profileState === 'permanent_error' || profileState === 'not_found'){
            resolveOuter('RENDER_RECOVERY_PROFILE_STATE:' + profileState);
            wrldWelcomeInitDone = true; clearTimeout(watchdog); return;
          }
          const user = getCurrentUser();
          resolveOuter('RENDER_GREETING:' + (user ? user.name : 'NULL_USER'));
          wrldWelcomeInitDone = true; clearTimeout(watchdog);
        }catch(e){
          wrldWelcomeInitDone = true; clearTimeout(watchdog);
          resolveOuter('CATCH_RECOVERY:' + (e && e.message));
        }
      })();
    });
  `;
  vm.runInContext(welcomeScript, sandbox, { filename: 'welcome.html-inline' });
  return sandbox.__wrldWelcomeResult.then((result) => ({ name, result, navLog }));
}

async function main(){
  const scenarios = [
    { label: 'A: getSession fast, INITIAL_SESSION slower, profile fast',
      opts: { getSessionSession: {user:{id:'user-123'}}, getSessionDelay: 5, initialEventSession: {user:{id:'user-123'}}, initialEventDelay: 15, profileFetchDelay: 30 } },
    { label: 'B: INITIAL_SESSION fires first, getSession resolves later',
      opts: { getSessionSession: {user:{id:'user-123'}}, getSessionDelay: 40, initialEventSession: {user:{id:'user-123'}}, initialEventDelay: 2, profileFetchDelay: 60 } },
    { label: 'C: near-simultaneous, slow profile',
      opts: { getSessionSession: {user:{id:'user-123'}}, getSessionDelay: 1, initialEventSession: {user:{id:'user-123'}}, initialEventDelay: 1, profileFetchDelay: 200 } },
    { label: 'E: getSession()=null (glitch), INITIAL_SESSION=valid (later)  <-- the proven bug case',
      opts: { getSessionSession: null, getSessionDelay: 5, initialEventSession: { user: { id: 'user-123' } }, initialEventDelay: 40, profileFetchDelay: 30 } },
    { label: 'F: INITIAL_SESSION=null fires FIRST, getSession()=valid resolves later',
      opts: { getSessionSession: { user: { id: 'user-123' } }, getSessionDelay: 60, initialEventSession: null, initialEventDelay: 2, profileFetchDelay: 30 } },
    { label: 'G: genuinely logged out (both null) — must still redirect to login',
      opts: { getSessionSession: null, getSessionDelay: 10, initialEventSession: null, initialEventDelay: 20, profileFetchDelay: 30 } },
  ];
  let anyNav = false;
  for(const s of scenarios){
    const r = await runScenario(s.label, s.opts);
    console.log('='.repeat(70));
    console.log('SCENARIO:', r.name);
    console.log('RESULT:', r.result);
    console.log('location.href writes:', r.navLog.length === 0 ? '(none)' : JSON.stringify(r.navLog));
    if(r.navLog.length) anyNav = true;
  }
  console.log('\\n' + '='.repeat(70));
  console.log(anyNav ? 'Some scenarios navigated (check which — G should be the only one).' : 'No scenario navigated.');
}
main();
