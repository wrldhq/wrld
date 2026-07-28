/* Local simulation harness for WRLD V20.6.3 — loads the REAL
 * supabase-client.js and auth.js (unmodified, straight from the shipped
 * project) inside a sandboxed VM with a fake Supabase client + fake
 * localStorage, and drives each required test scenario against the
 * ACTUAL retry/ownership/state-machine code, not a re-implementation.
 * This is static/local simulation, NOT a connected-Supabase or hosted-
 * browser test — see V20.6.3-LIVE-SESSION-TESTING.md for that
 * distinction.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

function makeFakeLocalStorage(){
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => { store.set(k, String(v)); },
    removeItem: (k) => { store.delete(k); },
    _dump: () => Object.fromEntries(store),
  };
}

function makeFakeProfilesTable(script){
  // script: array of {error?, data?} consumed in order per call; last entry repeats.
  let calls = [];
  const state = { script: script.slice(), calls };
  return {
    from(table){
      return {
        select(){ return this; },
        eq(col, val){ this._id = val; return this; },
        maybeSingle: async function(){ return { data: null, error: null }; },
        single: async function(){
          calls.push(this._id);
          const step = state.script.length > 1 ? state.script.shift() : state.script[0];
          return step;
        },
      };
    },
    _calls: calls,
  };
}

function buildSandbox({ profileScript, sessionUserId = 'user-aaaaaa111111', refreshBehavior = 'ok' }){
  const fakeLocalStorage = makeFakeLocalStorage();
  const fakeSessionStorage = makeFakeLocalStorage();
  const fakeProfiles = makeFakeProfilesTable(profileScript);

  let currentSession = null; // set by test driver via sandbox.__setSession
  const authStateListeners = [];

  const fakeSbClient = {
    auth: {
      getSession: async () => ({ data: { session: currentSession } }),
      onAuthStateChange: (cb) => { authStateListeners.push(cb); return { data: { subscription: { unsubscribe(){} } } }; },
      refreshSession: async () => {
        if(refreshBehavior === 'fail') return { data: { session: null }, error: { message: 'refresh failed' } };
        if(refreshBehavior === 'switch-user'){
          currentSession = { user: { id: 'someone-else-999999' }, access_token: 'tok2' };
          return { data: { session: currentSession }, error: null };
        }
        // ok: same session, pretend token got a fresh iat
        return { data: { session: currentSession }, error: null };
      },
      signOut: async () => ({ error: null }),
      signInWithPassword: async () => ({ data: { session: currentSession }, error: null }),
      signUp: async () => ({ data: { session: currentSession, user: currentSession && currentSession.user }, error: null }),
    },
    from(table){
      if(table === 'profiles') return fakeProfiles.from(table);
      // learner_state / volunteer_entries — no-op reads so
      // pullLearnerStateFromSupabase()/pullVolunteerEntriesFromSupabase()
      // (app.js) don't throw; app.js itself is not loaded in this
      // sandbox (out of scope — untouched this release), so these are
      // simply never called (guarded by `typeof fn === 'function'`).
      return { select(){ return this; }, eq(){ return this; }, maybeSingle: async()=>({data:null,error:null}) };
    },
  };

  const sandbox = {
    console,
    setTimeout, clearTimeout,
    location: { hostname: 'ourwrld.org' },
    localStorage: fakeLocalStorage,
    sessionStorage: fakeSessionStorage,
    supabase: { createClient: () => fakeSbClient },
    WRLD_SUPABASE_URL: 'https://fake.supabase.co',
    WRLD_SUPABASE_PUBLISHABLE_KEY: 'fake-key',
    window: {},
    // test-driver hooks
    __setSession: (s) => { currentSession = s; },
    __fireAuthEvent: (event, session) => { currentSession = session; authStateListeners.forEach(cb => cb(event, session)); },
    __fakeProfiles: fakeProfiles,
  };
  sandbox.window = sandbox; // so `window.wrldAuthReady = ...` and reads of window.* resolve in this same context
  vm.createContext(sandbox);

  const code = fs.readFileSync(path.join(ROOT, 'supabase-client.js'), 'utf8');
  vm.runInContext(code, sandbox, { filename: 'supabase-client.js' });

  return sandbox;
}

async function flush(sandbox){
  // let any pending microtasks/timers this VM scheduled resolve
  await sandbox.wrldAuthReady;
}

(async () => {
  const results = [];
  function check(name, cond, extra){
    results.push({ name, pass: !!cond, extra });
  }

  // ---------------------------------------------------------------
  // Scenario A — Test 1/2 combined: first profile attempt fails with
  // exactly the live "JWT issued in future" 401, second attempt (after
  // the bounded retry + one forced refresh) succeeds.
  //
  // Timing note: real pages resolve the initial bootstrap
  // (sbClient.auth.getSession(), no session yet) fully BEFORE a human
  // fills in and submits the signup form seconds later — there is no
  // realistic race between that bootstrap and the eventual signup. This
  // is modeled by awaiting window.wrldAuthReady (bootstrap settles,
  // correctly, to unauthenticated/no session) BEFORE simulating the
  // signup moment. The signup moment itself IS modeled as a genuine
  // race: sbClient.auth.signUp() firing a SIGNED_IN event through the
  // onAuthStateChange listener AT THE SAME TIME auth.js's signUp()
  // explicitly awaits wrldRefreshSessionCache(data.session) for that
  // exact same session — both fired via Promise.all below.
  // ---------------------------------------------------------------
  {
    const sandbox = buildSandbox({
      profileScript: [
        { data: null, error: { message: 'JWT issued in future', status: 401 } },
        { data: { id: 'user-aaaaaa111111', name: 'Jordan Rivera', role: 'explorer' }, error: null },
      ],
    });
    await flush(sandbox); // let the page-load bootstrap (no session yet) settle first
    const session = { user: { id: 'user-aaaaaa111111' }, access_token: 'tok1' };
    sandbox.__fireAuthEvent('SIGNED_IN', session); // triggers the listener's own wrldRefreshSessionCache() call, tracked via window.wrldAuthReady
    await Promise.all([
      sandbox.window.wrldAuthReady,              // the listener's call
      sandbox.wrldRefreshSessionCache(session),  // auth.js signUp()'s explicit call — the real dual-call race
    ]);

    check('A1: auth state is authenticated despite first profile failure',
      sandbox.wrldGetAuthState() === 'authenticated');
    check('A2: profile state ends loaded after bounded retry',
      sandbox.wrldGetProfileState() === 'loaded');
    check('A3: profile cache actually populated (not discarded)',
      !!sandbox.wrldGetSession() && sandbox.wrldGetAuthState()==='authenticated');
  }

  // ---------------------------------------------------------------
  // Scenario B — permanent profile failure (never recovers within the
  // bounded retry budget): must NOT be reported as authenticated=false;
  // auth state stays authenticated, profile state becomes permanent_error,
  // and no more than WRLD_PROFILE_MAX_ATTEMPTS calls are made (no retry
  // storm).
  // ---------------------------------------------------------------
  {
    const sandbox = buildSandbox({
      profileScript: [
        { data: null, error: { message: 'JWT issued in future', status: 401 } },
        { data: null, error: { message: 'JWT issued in future', status: 401 } },
        { data: null, error: { message: 'JWT issued in future', status: 401 } },
      ],
    });
    await flush(sandbox);
    const session = { user: { id: 'user-aaaaaa111111' }, access_token: 'tok1' };
    await sandbox.wrldRefreshSessionCache(session);

    check('B1: auth state STILL authenticated after permanent profile failure (never treated as logged out)',
      sandbox.wrldGetAuthState() === 'authenticated');
    check('B2: profile state is permanent_error',
      sandbox.wrldGetProfileState() === 'permanent_error');
    check('B3: bounded — exactly 3 attempts, no retry storm',
      sandbox.__fakeProfiles._calls.length === 3, sandbox.__fakeProfiles._calls.length);
  }

  // ---------------------------------------------------------------
  // Scenario C — profile row not yet visible (PGRST116 "0 rows") twice,
  // then found — the "profile creation/retrieval race" case.
  // ---------------------------------------------------------------
  {
    const sandbox = buildSandbox({
      profileScript: [
        { data: null, error: { message: '0 rows returned', code: 'PGRST116' } },
        { data: { id: 'user-aaaaaa111111', name: 'New Explorer', role: 'explorer' }, error: null },
      ],
    });
    await flush(sandbox);
    const session = { user: { id: 'user-aaaaaa111111' }, access_token: 'tok1' };
    await sandbox.wrldRefreshSessionCache(session);
    check('C1: recovers once the profile row lands', sandbox.wrldGetProfileState() === 'loaded');
  }

  // ---------------------------------------------------------------
  // Scenario D — genuinely no session at all: must be the ONLY case
  // that reports 'unauthenticated'.
  // ---------------------------------------------------------------
  {
    const sandbox = buildSandbox({ profileScript: [{ data: null, error: null }] });
    await flush(sandbox);
    await sandbox.wrldRefreshSessionCache(null);
    check('D1: no session -> auth state unauthenticated', sandbox.wrldGetAuthState() === 'unauthenticated');
    check('D2: no session -> profile state not_requested', sandbox.wrldGetProfileState() === 'not_requested');
  }

  // ---------------------------------------------------------------
  // Scenario E — same-browser account switch (Test 4): account A's
  // session/profile resolved, then account B's session comes in while
  // nothing of A's should leak into B's cache.
  // ---------------------------------------------------------------
  {
    const sandbox = buildSandbox({
      profileScript: [
        { data: { id: 'user-AAAAAA', name: 'Account A', role: 'explorer' }, error: null },
      ],
    });
    await flush(sandbox);
    const sessionA = { user: { id: 'user-AAAAAA' }, access_token: 'tokA' };
    sandbox.__setSession(sessionA);
    await sandbox.wrldRefreshSessionCache(sessionA);
    check('E1: account A profile loaded', sandbox.wrldGetProfileState() === 'loaded');

    // log out A
    await sandbox.wrldRefreshSessionCache(null);
    check('E2: logout -> unauthenticated, no stale profile', sandbox.wrldGetAuthState() === 'unauthenticated');

    // account B signs up fresh
    sandbox.__fakeProfiles.script = [{ data: { id: 'user-BBBBBB', name: 'Account B', role: 'explorer' }, error: null }];
    const sessionB = { user: { id: 'user-BBBBBB' }, access_token: 'tokB' };
    sandbox.__setSession(sessionB);
    await sandbox.wrldRefreshSessionCache(sessionB);
    check('E3: account B gets its OWN profile, not A\'s (ownership check honored)',
      sandbox.__fakeProfiles._calls[sandbox.__fakeProfiles._calls.length-1] === 'user-BBBBBB');
  }

  // ---------------------------------------------------------------
  // Scenario F — duplicate concurrent calls for the SAME session (the
  // real signup.html race: the onAuthStateChange listener firing AND
  // auth.js's signUp() explicitly awaiting wrldRefreshSessionCache() for
  // the same brand-new session) must not double-fetch.
  // ---------------------------------------------------------------
  {
    const sandbox = buildSandbox({
      profileScript: [
        { data: { id: 'user-DUPDUP', name: 'Dup Test', role: 'explorer' }, error: null },
      ],
    });
    await flush(sandbox);
    const session = { user: { id: 'user-DUPDUP' }, access_token: 'tokD' };
    sandbox.__setSession(session);
    const [r1, r2] = await Promise.all([
      sandbox.wrldRefreshSessionCache(session),
      sandbox.wrldRefreshSessionCache(session),
    ]);
    check('F1: concurrent same-session calls result in exactly one profile fetch',
      sandbox.__fakeProfiles._calls.length === 1, sandbox.__fakeProfiles._calls.length);
  }

  const failed = results.filter(r => !r.pass);
  results.forEach(r => console.log((r.pass ? 'PASS' : 'FAIL') + ' — ' + r.name + (r.extra!==undefined ? ' ('+JSON.stringify(r.extra)+')' : '')));
  console.log('\n' + (results.length-failed.length) + '/' + results.length + ' checks passed');
  if(failed.length) process.exit(1);
})();
