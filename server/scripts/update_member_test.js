const axios = require('axios');
(async()=>{
  try{
    const base='http://localhost:4000';
    const login=await axios.post(`${base}/api/login`, { email:'joe@test.com', password:'password' });
    const token = login.data.token;
    const accountId='3581a46e-0950-467c-b0ff-a6828ed8fdab';
    await axios.put(`${base}/api/accounts/${accountId}/members/2`, { first_name:'Tim', last_name:'Smith', age:30, hunter_safety_completed:true, hunt_club_bylaws_signed:true }, { headers: { Authorization: `Bearer ${token}` } });
    console.log('updated');
    const res = await axios.get(`${base}/api/accounts/${accountId}/properties/2`, { headers: { Authorization: `Bearer ${token}` } });
    console.log(JSON.stringify(res.data.members.find(m=>m.id==2), null, 2));
  }catch(err){ 
    console.error('ERROR', err.response && err.response.data ? err.response.data : err.message)
    if(err.stack) console.error(err.stack)
  }
})();