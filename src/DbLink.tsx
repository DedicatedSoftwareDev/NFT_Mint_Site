import axios from "axios"
axios.defaults.baseURL = process.env.REACT_APP_BACKEND_HOSTURL;

// const instance = axios.create({
//   baseURL: process.env.BACKEND_HOSTURL
// });

export const getDataByMint = async (mint: any) => {
  try {
    const result = await axios.get(`mint/${mint}`);
    return {ok: true, data: result.data.data}

  } catch(err) {
    console.log(err);
    return {ok: false, data: null}
  }
}

export const getDataByStatus = async (status: any) => {
  try {
    const result = await axios.get(`status/${status}`);
    return {ok: true, data: result.data.data}
  } catch(err) {
    console.log(err);
    return {ok: false, data: null}
  }
}

export const getDataByOwner = async (owner: any) => {
  try {
    const result = await axios.get(`owner/${owner}`);
    return {ok: true, data: result.data.data}
  } catch(err) {
    console.log(err);
    return {ok: false, data: null}
  }
}

export const getOrInsertData = async (mint: any) => {
  try {
    console.log("owner", mint)
    const result = await axios.get(`getOrInsertData/${mint}`);
    if(!result) return {ok: false, data: null} 
    return {ok: true, data: result?.data}
  } catch(err) {
    console.log(err);
    return {ok: false, data: null}
  }
}

export const getOrInsertNftData = async (mint: any, owner: any) => {
  try {
    const result = await axios.post("getorinsertnft", {
      mint, owner
    });
    if(!result) return {ok: false, data: null} 
    return {ok: true, data: result?.data}
  } catch(err) {
    console.log(err);
    return {ok: false, data: null}
  }
}

export const insertData = async (mint: any, owner: any, status: any) => {
  try {
    await axios.post("insert",{
      mint, owner, status
    })
    return true;
  } catch (error) {
    console.log(error)
    return false;
  }
}

export const updateData = async (owner: any, prestatus: any, status: any) => {
  try {
    await axios.put("update", {
      owner,
      prevStatus: prestatus,
      status
    });
    return true;
  } catch (error) {
    console.log(error)
    return false;
  }
}

