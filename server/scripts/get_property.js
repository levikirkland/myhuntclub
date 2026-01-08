const axios = require('axios');
(async()=>{
  try{
    const base='http://localhost:4000';
    const login=await axios.post(`${base}/api/login`,{email:'joe@test.com',password:'password'});
    const token=login.data.token;
    const accountId='3581a46e-0950-467c-b0ff-a6828ed8fdab';
    const res = await axios.get(`${base}/api/accounts/${accountId}/properties/3`, { headers: { Authorization: `Bearer ${token}` } });
    console.log(JSON.stringify(res.data, null, 2));
  }catch(err){ console.error('ERROR', err.response && err.response.data ? err.response.data : err.message) }
})();