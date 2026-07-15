(function() {
  'use strict';
  window.ET = window.ET || {};
  var _h = React.createElement;

  var ROLE_LABELS = { user:'Użytkownik', admin:'Administrator', trainer:'Trener' };
  var ROLE_COLORS = { user:'var(--t3)', admin:'var(--purple)', trainer:'var(--teal)' };
  var ROLES = ['user','admin','trainer'];

  // Panel kont (widoczny tylko dla admina) — lista wszystkich kont z Supabase
  // (tabela profiles, czytelna dla każdego wg RLS) + zmiana roli przez RPC
  // admin_set_role (bezpieczne po stronie bazy — sprawdza rolę wywołującego).
  function AdminPanel() {
    var auth = ET.useAuth ? ET.useAuth() : null;
    var toast = ET.useToast();
    var ls = React.useState(true); var loading = ls[0], setLoading = ls[1];
    var pr = React.useState([]); var profiles = pr[0], setProfiles = pr[1];
    var busy = React.useState(null); var busyId = busy[0], setBusyId = busy[1];

    function load() {
      if (!ET.supabase) return;
      setLoading(true);
      ET.supabase.from('profiles').select('*').order('created_at', { ascending:true }).then(function(res) {
        setLoading(false);
        if (res.error) { toast('Błąd wczytywania kont: '+res.error.message, 'error'); return; }
        setProfiles(res.data || []);
      });
    }
    React.useEffect(function(){ load(); }, []);

    function changeRole(row, newRole) {
      if (newRole === row.role) return;
      var myId = auth && auth.session && auth.session.user && auth.session.user.id;
      if (row.id === myId && newRole !== 'admin') {
        if (!confirm('Odbierasz sobie rolę Administratora. Może być trudno ją odzyskać bez SQL. Kontynuować?')) return;
      }
      setBusyId(row.id);
      ET.supabase.rpc('admin_set_role', { target_user_id: row.id, new_role: newRole }).then(function(res) {
        setBusyId(null);
        if (res.error) { toast('Błąd: '+res.error.message, 'error'); return; }
        toast(row.email+' → '+ROLE_LABELS[newRole], 'success');
        setProfiles(function(prev){ return prev.map(function(p){ return p.id===row.id ? Object.assign({},p,{role:newRole}) : p; }); });
      });
    }

    if (!ET.supabase) return null;

    return _h('div', { className:'card', style:{ marginBottom:10 } },
      _h('div', { style:{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 } },
        _h('div', { style:{ fontWeight:700, fontSize:'.85rem' } }, '👥 Konta użytkowników'),
        _h('button', { className:'btn btn-ghost btn-sm btn-icon', onClick:load, title:'Odśwież' }, '🔄')
      ),
      _h('p', { style:{ fontSize:'.7rem', color:'var(--t3)', marginBottom:10 } },
        profiles.length + ' ' + (profiles.length===1?'konto':'kont') + ' · zmiana roli działa natychmiast'),
      loading && _h('div', { style:{ fontSize:'.78rem', color:'var(--t3)', padding:'10px 0', textAlign:'center' } }, 'Ładowanie…'),
      !loading && profiles.map(function(row) {
        var isBusy = busyId === row.id;
        return _h('div', { key:row.id, style:{ padding:'8px 0', borderBottom:'1px solid var(--b1)' } },
          _h('div', { style:{ display:'flex', alignItems:'center', gap:8, marginBottom:6 } },
            _h('div', { style:{ flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:'.8rem', fontWeight:600 } }, row.email),
            _h('span', { style:{ fontSize:'.62rem', fontWeight:700, color:ROLE_COLORS[row.role]||'var(--t3)' } }, ROLE_LABELS[row.role]||row.role)
          ),
          _h('div', { style:{ display:'flex', gap:4 } },
            ROLES.map(function(r) {
              var active = row.role === r;
              return _h('button', { key:r, disabled:isBusy, className:'tag-btn'+(active?' active':''), style:{ fontSize:'.66rem', opacity:isBusy?0.5:1 },
                onClick:function(){ changeRole(row, r); } }, ROLE_LABELS[r]);
            })
          )
        );
      }),
      !loading && profiles.length===0 && _h('div', { style:{ fontSize:'.78rem', color:'var(--t3)', textAlign:'center', padding:'10px 0' } }, 'Brak kont.')
    );
  }

  ET.AdminPanel = AdminPanel;
})();
