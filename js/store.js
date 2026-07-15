(function() {
  'use strict';
  window.ET = window.ET || {};

  var STORE_KEY = 'et_v1';
  var emptyStore = {
    profile: { name:'', age:null, weight:null, height:null, activityLevel:'moderate', gender:'male', sport:'' },
    workouts: [], runs: [], sleepSessions: [], saunaSessions: [],
    competitions: [], photos: [], measurements: [], dietEntries: [],
    supplements: [], wellbeingEntries: [], painEntries: [], goals: [],
    supplementChecks: {},
    intervals: [], journalEntries: [],
    habits: [], habitLogs: {},
    ailments: [], physioBlock: null,
    importedPlans: [], customPlans: [],
    acwrSettings: { method:'external', threshold:1.3, notifications:false },
    fitnessTests: [], postureAssessments: [], checkins: [],
    trainingPlans: [],
    dashboardWidgets: {},
    menuSettings: {},   // { sidebar:{hidden:[],order:[]}, mobile:{hidden:[],order:[]} }
    quickTiles: [],     // dodatkowe kafelki na Dashboardzie (id tras)
  };

  function loadStore() {
    try {
      var r = localStorage.getItem(STORE_KEY);
      if (!r) return JSON.parse(JSON.stringify(emptyStore));
      var parsed = JSON.parse(r);
      return Object.assign(JSON.parse(JSON.stringify(emptyStore)), parsed);
    } catch(e) {
      return JSON.parse(JSON.stringify(emptyStore));
    }
  }

  function saveStore(d) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(d)); } catch(e) {}
  }

  var StoreCtx = React.createContext(null);

  function StoreProvider(props) {
    var s = React.useState(function() { return loadStore(); });
    var store = s[0], setStore = s[1];
    var update = React.useCallback(function(fn) {
      setStore(function(prev) {
        var next = typeof fn === 'function' ? fn(prev) : Object.assign({}, prev, fn);
        saveStore(next);
        return next;
      });
    }, []);
    return React.createElement(StoreCtx.Provider, { value: { store: store, update: update } }, props.children);
  }

  function useStore() { return React.useContext(StoreCtx); }

  // Świeża kopia pustego store'u — używana przy wylogowaniu, żeby dane jednego
  // konta nie "przeciekały" do gościa/innego konta na tym samym urządzeniu.
  function emptyStoreSnapshot() { return JSON.parse(JSON.stringify(emptyStore)); }

  Object.assign(window.ET, { StoreCtx: StoreCtx, StoreProvider: StoreProvider, useStore: useStore, emptyStoreSnapshot: emptyStoreSnapshot });
})();
