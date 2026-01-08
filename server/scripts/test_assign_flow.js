const axios = require('axios');
(async ()=>{
  try{
    const base = 'http://localhost:4000';
    const login = await axios.post(`${base}/api/login`, { email: 'joe@test.com', password: 'password' });
    const token = login.data.token;
    console.log('token:', token);
    const accountId = '3581a46e-0950-467c-b0ff-a6828ed8fdab';
    // assign user 2 to property 2 then to stand 1
    await axios.post(`${base}/api/accounts/${accountId}/properties/2/assign`, { userId: 2 }, { headers: { Authorization: `Bearer ${token}` } });
    console.log('property assigned to user 2');
    await axios.post(`${base}/api/accounts/${accountId}/stands/1/assign`, { userId: 2 }, { headers: { Authorization: `Bearer ${token}` } });
    console.log('stand assigned to user 2');
    const res = await axios.get(`${base}/api/accounts/${accountId}/properties/2`, { headers: { Authorization: `Bearer ${token}` } });
    console.log(JSON.stringify(res.data, null, 2));
  }catch(err){
    console.error('ERROR', err.response && err.response.data ? err.response.data : err.message);
  }
})();