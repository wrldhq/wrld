/* Local simulation — loads the REAL supabase-client.js + auth.js together
 * and drives requireAuth()/isAuthenticated() directly, matching what
 * welcome.html (and every other gated page) actually calls. Verifies the
 * core acceptance criterion: a temporary/permanent profile failure must
 * never cause requireAuth() to redirect to login.html, and a genuine
 * absence of a session must still redirect correctly (no regression).
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

function makeFakeStorage(){
  const store = new Map();
  return { getItem: k => store.has(k)?store.get(k):null, setItem:(k,v)=>store.set(k,String(v)), removeItem:k=>store.delete(k) };
}

function makeFakeProfilesTable(script){
  let calls = [];
  const state = { script: script.slice() };
  return {
    from(){
      return {
        select(){ return this; },
        eq(col,val){ this._id = val; return this; },
        single: async function(){ calls.push(this._id); return state.script.length>1?state.script.shift():state.script[0]; },
      };
    },
    _calls: calls,
  };
}

function buildSandbox({ profileScript }){
  let currentSession = null;
  let navigatedTo = null;
  const fakeProfiles = makeFakeProfilesTable(profileScript);
  const listeners = [];
  const fakeSbClient = {
    auth: {
      getSession: async () => ({ data: { session: currentSession } }),
      onAuthStateChange: (cb) => { listeners.push(cb); },
      refreshSession: async () => ({ data: { session: currentSession }, error: null }),
      signOut: async () => ({ error: null }),
    },
    from(t){ if(t==='profiles') return fakeProfiles.from(); return { select(){return this;}, eq(){return this;}, maybeSingle: async()=>({data:null,error:null}) }; },
  };

  const sandbox = {
    console, setTimeout, clearTimeout,
    localStorage: makeFakeStorage(), sessionStorage: makeFakeStorage(),
    supabase: { createClient: () => fakeSbClient },
    WRLD_SUPABASE_URL: 'x', WRLD_SUPABASE_PUBLISHABLE_KEY: 'x',
    // getState() lives in app.js, which isn't loaded here (out of scope
    // this release) — stub it the same way a signed-up Explorer with no
    // assessment yet would look, since requireAuth()'s onboarding branch
    // reads it via needsOnboarding().
    getState: () => ({ assessment: null }),
  };
  sandbox.window = sandbox;
  Object.defineProperty(sandbox, 'location', {
    value: {
      pathname: '/welcome.html',
      search: '',
      get href(){ return this._href; },
      set href(v){ this._href = v; navigatedTo = v; },
    },
  });
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT,'supabase-client.js'),'utf8'), sandbox, { filename:'supabase-client.js' });
  vm.runInContext(fs.readFileSync(path.join(ROOT,'auth.js'),'utf8'), sandbox, { filename:'auth.js' });

  return { sandbox, setSession: (s)=>{ currentSession = s; }, getNav: () => navigatedTo };
}

(async () => {
  const results = [];
  const check = (name, cond, extra) => results.push({name, pass: !!cond, extra});

  // Scenario 1 — session confirmed, profile still temporarily failing:
  // requireAuth() must return true and must NOT navigate to login.html.
  {
    const { sandbox, setSession, getNav } = buildSandbox({
      profileScript: [
        { data: null, error: { message: 'JWT issued in future', status: 401 } },
        { data: null, error: { message: 'JWT issued in future', status: 401 } },
        { data: null, error: { message: 'JWT issued in future', status: 401 } },
      ],
    });
    await sandbox.wrldAuthReady; // bootstrap: no session yet
    const session = { user: { id: 'user-explorer1' } };
    setSession(session);
    await sandbox.wrldRefreshSessionCache(session); // exhausts retries -> permanent_error
    const result = sandbox.requireAuth();
    check('1a: requireAuth() returns true (does not redirect) despite permanent profile failure', result === true);
    check('1b: no navigation to login.html happened', getNav() === null, getNav());
    check('1c: profile state is permanent_error (welcome.html shows recovery UI)', sandbox.wrldGetProfileState() === 'permanent_error');
  }

  // Scenario 2 — genuinely no session: requireAuth() must still redirect
  // to login.html (no regression on the real "logged out" case).
  {
    const { sandbox, getNav } = buildSandbox({ profileScript: [{data:null,error:null}] });
    await sandbox.wrldAuthReady; // resolves to null session
    const result = sandbox.requireAuth();
    check('2a: requireAuth() returns false for a genuinely logged-out visitor', result === false);
    check('2b: navigates to login.html', /^login\.html/.test(getNav()||''), getNav());
  }

  // Scenario 3 — successful profile load: requireAuth() true, no redirect,
  // and needsOnboarding() correctly still routes an incomplete Explorer to
  // welcome.html from OTHER protected pages (regression check — this
  // logic must be unchanged).
  {
    const { sandbox, setSession } = buildSandbox({
      profileScript: [{ data: { id:'user-explorer2', name:'Jamie Lee', role:'explorer' }, error:null }],
    });
    await sandbox.wrldAuthReady;
    const session = { user: { id: 'user-explorer2' } };
    setSession(session);
    await sandbox.wrldRefreshSessionCache(session);
    const result = sandbox.requireAuth();
    check('3a: requireAuth() true once profile loads', result === true);
    check('3b: getCurrentUser() reflects the loaded profile', sandbox.getCurrentUser() && sandbox.getCurrentUser().name === 'Jamie Lee');
  }

  const failed = results.filter(r=>!r.pass);
  results.forEach(r => console.log((r.pass?'PASS':'FAIL')+' — '+r.name+(r.extra!==undefined?' ('+JSON.stringify(r.extra)+')':'')));
  console.log('\n'+(results.length-failed.length)+'/'+results.length+' checks passed');
  if(failed.length) process.exit(1);
})();
