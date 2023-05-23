async function post(route, body, error_cb = undefined) {
  try{
    let response = await axios.post("/" + route, body);
    return response.data;
  }catch(error) {
    console.error(error);
    if(error_cb) {
      error_cb(error.response.status);
    }
    if(error.response.status === 401) {
      window.location.reload();
    }
    return undefined;
  }
}

async function get(route, param = "") {
  try{
    let response = await axios.get("/" + route + param);
    return response.data;
  }catch(error){
    console.error(error);
    return undefined;
  }
}

async function call(route) {
  try{
      await axios.get("/" + route);
  }catch(error){
    console.error(error);
  }
}

function uploadFile(route,file,progress,done) {
  let req = new XMLHttpRequest();
  let formData = new FormData();
  formData.append("backup", file);
  req.upload.addEventListener("progress", function(event) {
      progress(event);
  }, false);
  req.open("POST", '/'+route);
  req.onreadystatechange = function (aEvt) {
    if (req.readyState == 4) {
      if (req.status == 200) {
        done(JSON.parse(req.response));
      }
    }
  };
  req.send(formData);
}

function uploadFile2(route,file,progress,done) {
  let req = new XMLHttpRequest();
  let formData = new FormData();
  formData.append("update", file);
  req.upload.addEventListener("progress", function(event) {
      progress(event);
  }, false);
  req.open("POST", '/'+route);
  req.onreadystatechange = function (aEvt) {
    if (req.readyState == 4) {
      if (req.status == 200) {
        done(JSON.parse(req.response));
      }
    }
  };
  req.send(formData);
}