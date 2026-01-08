const axios = require('axios');
(async()=>{
  try{
    const base='http://localhost:4000';
    const login = await axios.post(`${base}/api/login`, { email: 'joe@test.com', password: 'password' });
    const token = login.data.token;
    const accountId='3581a46e-0950-467c-b0ff-a6828ed8fdab';
    const res = await axios.get(`${base}/api/accounts/${accountId}/properties/2`, { headers: { Authorization: `Bearer ${token}` } });
    const members = res.data.members || [];
    const property_assignments = res.data.property_assignments || [];
    console.log('members:', members.map(m=>m.id + ':' + (m.first_name||m.email)).join(', '));
    console.log('prop assignments:', property_assignments.map(p => p.user_id).join(', '));
    const ids = new Set(property_assignments.map(p=>p.user_id));
    const filtered = ids.size ? members.filter(m => ids.has(m.id)) : members;
    console.log('filtered members:', filtered.map(m=>m.id + ':' + (m.first_name||m.email)).join(', '));
  }catch(err){ console.error('ERROR', err.response && err.response.data ? err.response.data : err.message) }
})();