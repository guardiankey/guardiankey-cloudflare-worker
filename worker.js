//  https://workers.cloudflare.com/playground

// Information below can be found at https://panel.guardiankey.io
// In Settings>AuthGroup, edit an authgroup, and go to tab "Deploy information"
const organization_id = ""
const authgroup_id = ""
const key = ""
const iv = ""

// Information below depends on your system.
// This is the name of the input field of the login page of your system.
const username_field= "Username"

// This is a URL of your system that logs the user out when accessed.
// If you don't have it, the worker will send events to GuardianKey
// But attempts will never be blocked!
// Something like  "https://mydomain.com/logout"
const logout_url ="/auth/logout"


// A string that appears in the HTML of your system when
// the user fails the password. It should be exactly the same.
// Something like "wrong password" or "invalid pass"
//const login_failed_string ="senha inválido"
const login_failed_string ="usuário ou senha inválidos"


// Set the login path of your site, example: /auth/login
// If it is blank, all POSTs with the username_field will be processed
// In doubt, you can leave it blank
const login_post_path ="/auth/login"
//const login_post_path ="/auth/login"


// Use true if the username is the user's email address. Put false otherwise.
const username_is_email = false

// Use 'https://api.guardiankey.io/checkaccess' for GuardianKey in cloud
// If you don't know, just keep as is.
const api_url = 'https://api.guardiankey.io/checkaccess'

class AttributeRewriter {
  constructor(attributeName) {
    this.attributeName = attributeName
  }
  element(element) {
    const attribute = element.getAttribute(this.attributeName)
    if (attribute) {
      element.setAttribute(
        this.attributeName,
        attribute.replace("/static/", "/gk/static/"),
      )
    }
  }
}

const rewriter = new HTMLRewriter()
  .on("a", new AttributeRewriter("href"))
  .on("img", new AttributeRewriter("src"))
  .on("link", new AttributeRewriter("href"))
  .on("script", new AttributeRewriter("src"))


async function forwardGK(request) {
  const url = new URL(request.url)
  let gkUrl = "https://panel.guardiankey.io/"+url.pathname.replace('/gk/','/')
    request = await new Request(gkUrl, request)
    request.headers.set("Origin", request.url)
    let response = await fetch(request)
    response = new Response(response.body, response)
    response.headers.set("Access-Control-Allow-Origin", url.origin)
    response.headers.append("Vary", "Origin")
    return rewriter.transform(response)
}

async function patchLinks(response){
  let nresponsebody = (await response.text()).replaceAll('src="i','src="https://www.domainxpto.com.br/i')
                                             .replaceAll('href="i','href="https://www.domainxpto.com.br/i')

  return new Response( nresponsebody ,response)
}

async function handleRequest(request) {
 //request = await new Request(request)
 //request.headers.set("referer", "https://www.domainxpto.com.br/")



  return await fetch(request)


//   return new Response("teste", {
// 	headers: {
// 		"content-type": "text/html",
//	},
//});

  // return patchLinks((await fetch(request)))
  // USE TO TEST THE WORKER WHEN YOU HAVE POST IN FULL DOMAIN
  //let response = await fetch(request)
  //return new Response( (await response.text()).replace('action="https://DOMAIN/','action="/') ,response)
}

async function handlePostRequest(request) {
	//console.log(request)

  //return await fetch(request)

  let reqBody = await readRequestPost(request.clone())
  let response =  await fetch(request)


 try{
  //console.log(response)
  if(reqBody !=null && username_field in reqBody){
   let username = reqBody[username_field]
   let useremail = (username_is_email)? username : ""
   let resBody = await readRequestBody(response.clone())
   let login_failed="0"
   if(typeof resBody !== 'string'){
    resBody=JSON.stringify(resBody)
   }
   //console.log(resBody)
   if(resBody.includes(login_failed_string)){
     login_failed = "1"
   }
   let gk_return = await check_access(request,username,useremail,login_failed)
    if('response' in gk_return && gk_return['response'] == 'BLOCK' ){
      return await fetch(logout_url)
    }
  }

} catch (error) {
	console.error("Error in handlePost:");
}


  return response
  // USE TO TEST THE WORKER WHEN YOU HAVE POST IN FULL DOMAIN
  // return new Response( (await response.text()).replace('action="https://DOMAIN/','action="/') ,response)

}


async function check_access(request,username,useremail,login_failed) {
 try{

	let event = await create_event(request,username,useremail,login_failed)
	let event_str = JSON.stringify(event)
  	let keybuff = str2ab8(atob(key))
    const baseKey  = await crypto.subtle.importKey('raw', keybuff, { name: 'AES-CBC' },false, ['encrypt'], );

  let encoded = str2ab8(event_str)
  let iv1 =  str2ab8(atob(iv))
  let cipher = await crypto.subtle.encrypt({name: "AES-CBC", iv: iv1 }, baseKey, encoded )	
                           .catch(function(err){ console.error(err);	});

  let cipher_message = btoa(ab2str8(cipher))
  let jsonmsg = {"id": authgroup_id, "message":cipher_message }
  let content = JSON.stringify(jsonmsg)
  let headers = {'Content-type': 'application/json', 'Accept': 'text/plain'}

  const init = { method: 'POST', headers: headers, body: content }
  const response = await fetch(api_url, init)
  const body = await response.json()
   return body
} catch (error) {
	console.error("Error in checkAccess:");
	return {};
}
}

async function create_event(request,username,useremail,login_failed) {
	
	let event = {   "generatedTime": Math.trunc(Date.now()/1000),
					"agentId": "CloudFlare",
					"organizationId": organization_id,
					"authGroupId": authgroup_id,
					"service": "CloudFlare",
					"clientIP": request.headers.get('cf-connecting-ip'),
					"clientReverse": "",
					"userName": username,
					"authMethod": "",
					"loginFailed": login_failed,
					"userAgent": request.headers.get('user-agent'),
					"psychometricTyped": "",
					"psychometricImage": "",
					"event_type": "Authentication",
					"userEmail": useremail
					}
	return event
}


export default {
	async fetch(request, env, ctx) {


		 const targetUrl = "https://guardiankey.io/"; // + request.url.pathname;

		const url = new URL(targetUrl);


  if(url.pathname.replaceAll("//","/").startsWith("/gk/events/viewresolve/") ||
     url.pathname.replaceAll("//","/").startsWith("/gk/static/"))
  {
    return forwardGK(request)
// }else if (request.method === 'POST' && ( url.pathname === login_post_path ) ) {
}else if (request.method === 'POST' ) {
    return handlePostRequest(request)
  }else if (request.method === 'GET') {
    return handleRequest(request)
  }

	},
};


async function readRequestBody(request) {
  const { headers } = request
  const contentType = headers.get('content-type')

  if (contentType == null) {
    return ""
  }

  if (contentType.includes('application/json')) {
    const body = await request.json()
    return body; //JSON.stringify(body)
  } else if (contentType.includes('application/text')) {
    const body = await request.text()
    return body
  } else if (contentType.includes('text/html')) {
    const body = await request.text()
    return body
  } else if (contentType.includes('form')) {
    const formData = await request.formData()
    let body = {}
    for (let entry of formData.entries()) {
      body[entry[0]] = entry[1]
    }
    return JSON.stringify(body)
  } else {
       return ""

	            // Para blobs ou arquivos binários, convertemos para Base64 manualmente
				const blob = await request.blob();
				const arrayBuffer = await blob.arrayBuffer();
				const uint8Array = new Uint8Array(arrayBuffer);
	
				let binaryString = "";
				for (let i = 0; i < uint8Array.length; i++) {
					binaryString += String.fromCharCode(uint8Array[i]);
				}
	
				return btoa(binaryString); // Retorna a string Base64 do Blob

    // let myBlob = await request.blob()
    // var objectURL = URL.createObjectURL(myBlob)
    // return objectURL
  }
}


async function readRequestPost(request) {
  const { headers } = request
  const contentType = headers.get('content-type')

  if (contentType == null) {
    return {}
  }


  if (contentType.includes('form')) {
    const formData = await request.formData()
    let body = {}
    for (let entry of formData.entries()) {
      body[entry[0]] = entry[1]
    }
    return body
  }else if (contentType!=null && contentType.includes('json')) {
    const jsondata = await readRequestBody(request)
    return jsondata
  } else {
    return {}
  }
}

function str2ab(str) {
  var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
  var bufView = new Uint16Array(buf);
  for (var i=0, strLen=str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint16Array(buf));
}

function str2ab8(str) {
  var buf = new ArrayBuffer(str.length); // 1 bytes for each char
  var bufView = new Uint8Array(buf);
  for (var i=0, strLen=str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}
function ab2str8(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}

