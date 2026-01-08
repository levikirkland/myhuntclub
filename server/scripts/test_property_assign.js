const axios = require('axios');
(async ()=>{
  try{
    const base = 'http://localhost:4000';
    const login = await axios.post(`${base}/api/login`, { email: 'joe@test.com', password: 'password' });
    const token = login.data.token;
    console.log('token:', token);
    const me = await axios.get(`${base}/api/me`, { headers: { Authorization: `Bearer ${token}` } });
    const accountId = me.data.account.id;
    console.log('accountId:', accountId);
    const propId = 2; // West Chaucer Road as per db
    const res = await axios.get(`${base}/api/accounts/${accountId}/properties/${propId}`, { headers: { Authorization: `Bearer ${token}` } });
    console.log('response:', JSON.stringify(res.data, null, 2));
  }catch(err){
    console.error('ERROR', err.response && err.response.data ? err.response.data : err.message);
  }
})();