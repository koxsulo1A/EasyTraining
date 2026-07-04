(function() {
  'use strict';
  window.ET = window.ET || {};

  var NAV_GROUPS = [
    { s: null, items: [{ id:'dashboard', icon:'🏠', label:'Dashboard' }] },
    { s: 'Treningi', items: [
      { id:'strength', icon:'💪', label:'Trening siłowy' },
      { id:'planner', icon:'🧩', label:'Kreator planu' },
      { id:'acwr', icon:'📈', label:'ACWR' },
      { id:'running', icon:'🏃', label:'Bieganie' },
      { id:'sauna', icon:'🔥', label:'Sauna' },
      { id:'intervals', icon:'⏱', label:'Interwały' },
    ]},
    { s: 'Zdrowie', items: [
      { id:'sleep', icon:'😴', label:'Sen' },
      { id:'measurements', icon:'📏', label:'Pomiary' },
      { id:'diet', icon:'🥗', label:'Dieta' },
      { id:'supplements', icon:'💊', label:'Suplementy' },
      { id:'wellbeing', icon:'🌡', label:'Samopoczucie' },
      { id:'pain', icon:'🩹', label:'Ból' },
      { id:'physio', icon:'🩺', label:'Dolegliwości' },
    ]},
    { s: 'Planowanie', items: [
      { id:'calendar', icon:'📅', label:'Kalendarz' },
      { id:'competitions', icon:'🏆', label:'Zawody' },
      { id:'goals', icon:'🎯', label:'Cele' },
    ]},
    { s: 'Analizy', items: [
      { id:'statistics', icon:'📊', label:'Statystyki' },
      { id:'assessment', icon:'🧪', label:'Testy i ocena' },
      { id:'photos', icon:'📸', label:'Zdjęcia' },
      { id:'history', icon:'📜', label:'Historia' },
    ]},
    { s: 'Narzędzia', items: [
      { id:'library', icon:'📚', label:'Biblioteka ćwiczeń' },
      { id:'backup', icon:'💾', label:'Kopia i eksport' },
      { id:'journal', icon:'📓', label:'Dziennik' },
      { id:'habits', icon:'✅', label:'Nawyki' },
    ]},
    { s: null, items: [{ id:'profile', icon:'👤', label:'Profil' }] },
  ];

  var MOBILE_TABS = [
    { id:'dashboard', icon:'🏠', label:'Dom' },
    { id:'strength', icon:'💪', label:'Trening' },
    { id:'calendar', icon:'📅', label:'Planer' },
    { id:'goals', icon:'🎯', label:'Cele' },
    { id:'profile', icon:'👤', label:'Profil' },
  ];

  var NavCtx = React.createContext(null);

  function NavProvider(props) {
    var s = React.useState('dashboard');
    var current = s[0], setCurrent = s[1];
    var p = React.useState({});
    var params = p[0], setParams = p[1];
    var navigate = React.useCallback(function(route, prms) {
      setCurrent(route);
      setParams(prms || {});
      window.scrollTo && window.scrollTo(0, 0);
    }, []);
    return React.createElement(NavCtx.Provider, { value: { current: current, params: params, navigate: navigate } }, props.children);
  }

  function useNav() { return React.useContext(NavCtx); }

  Object.assign(window.ET, { NAV_GROUPS: NAV_GROUPS, MOBILE_TABS: MOBILE_TABS, NavCtx: NavCtx, NavProvider: NavProvider, useNav: useNav });
})();
