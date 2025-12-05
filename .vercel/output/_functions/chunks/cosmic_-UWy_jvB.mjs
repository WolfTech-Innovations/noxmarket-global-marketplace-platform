import ie from 'form-data';
import F from 'axios';

var Q=Object.defineProperty,V=Object.defineProperties;var X=Object.getOwnPropertyDescriptors;var G=Object.getOwnPropertySymbols;var Y=Object.prototype.hasOwnProperty,Z=Object.prototype.propertyIsEnumerable;var I=(n,t,e)=>t in n?Q(n,t,{enumerable:true,configurable:true,writable:true,value:e}):n[t]=e,h=(n,t)=>{for(var e in t||(t={}))Y.call(t,e)&&I(n,e,t[e]);if(G)for(var e of G(t))Z.call(t,e)&&I(n,e,t[e]);return n},M=(n,t)=>V(n,X(t));var ee={production:{v3:{apiUrl:"https://api.cosmicjs.com/v3",uploadUrl:"https://workers.cosmicjs.com/v3"}},staging:{v3:{apiUrl:"https://api.cosmic-staging.com/v3",uploadUrl:"https://workers.cosmic-staging.com/v3"}}},U=ee;function H(n){if(n.custom){if(!n.custom.apiUrl||!n.custom.uploadUrl)throw new Error("apiUrl or uploadUrl is missing from 'custom' option");return {apiUrl:n.custom.apiUrl,uploadUrl:n.custom.uploadUrl}}if(!n.apiVersion||!["v3"].includes(n.apiVersion))throw new Error("apiVersion value can only be from 'v1', 'v2' & 'v3'");if(!n.apiEnvironment||!["production","staging"].includes(n.apiEnvironment))throw new Error("apiEnvironment value can only be from 'production' & 'staging'");return U[n.apiEnvironment][n.apiVersion]}var te={POST:"post",GET:"get",PATCH:"patch",DELETE:"delete"},m=te;var c=(n,t,e,r,i)=>{let o={method:n,url:t,data:e,headers:r,responseType:i?"stream":"json"};return i?F(o).then(s=>s.data).catch(s=>{throw s.response?s.response.data:s.response}):F(o).then(s=>s.data).catch(s=>{throw s.response?s.response.data:s.response})};function d(n){if(n&&n.trim())return {Authorization:`Bearer ${n}`};throw new Error("'writeKey' should be a valid string")}var K=(n,t,e,r)=>F({method:n,url:t,data:e,headers:r});var ne=n=>new Promise((t,e)=>{K(m.GET,n).then(r=>t(r.data)).catch(r=>e(r.response?r.response.data:r.response));}),u=async(n,t,e)=>{try{let r=await ne(n);e(r);}catch(r){if(t&&typeof t=="function")t(r);else throw r}};var l=class{constructor(t){this.endpoint="";this.endpoint=t;}props(t){let e;if(typeof t=="string")e=t.startsWith("{")&&t.endsWith("}")?this.parseGraphQLProps(t.slice(1,-1)):t;else if(Array.isArray(t))e=t.filter(r=>typeof r=="string").map(r=>r.trim()).filter(Boolean).join(",");else throw new Error("Invalid props type");return this.endpoint+=`&props=${encodeURIComponent(e)}`,this}parseGraphQLProps(t){let e=t.split(`
`).map(o=>o.trim()).filter(Boolean),r=[],i=[];for(let o of e)if(o.includes("{")){let[s]=o.split("{");s!==void 0&&i.push(s.trim());}else o==="}"?i.pop():r.push([...i,o].join("."));return r.join(",")}sort(t){return this.endpoint+=`&sort=${t}`,this}skip(t){return this.endpoint+=`&skip=${t}`,this}useCache(){return this.endpoint+="&use_cache=true",this}};var $=class extends l{limit(t){return this.endpoint+=`&limit=${t}`,this}async then(t,e){await u(this.endpoint,e,r=>t==null?void 0:t(r));}};var v=class extends l{async then(t,e){await u(this.endpoint,e,r=>{let i=r.media&&r.media.length?r.media[0]:null;t==null||t({media:i});});}};var T=n=>n?`&query=${encodeURIComponent(JSON.stringify(n))}`:"";var se=typeof window=="undefined",B,D=(n,t)=>({find(e){let r=`${t.apiUrl}/buckets/${n.bucketSlug}/media?read_key=${n.readKey}${T(e)}`;return new $(r)},findOne(e){let r=`${t.apiUrl}/buckets/${n.bucketSlug}/media?read_key=${n.readKey}&limit=1${T(e)}`;return new v(r)},async insertOne(e){let r=`${t.uploadUrl}/buckets/${n.bucketSlug}/media`;if(se){let s=new ie;if(Buffer.isBuffer(e.media))s.append("media",e.media,{filename:e.filename||"file",contentType:e.contentType||"application/octet-stream"});else if(typeof e.media=="object"&&"buffer"in e.media&&Buffer.isBuffer(e.media.buffer))s.append("media",e.media.buffer,e.media.originalname);else throw new Error("In Node.js environment, media must be a Buffer or { buffer: Buffer, originalname: string }");return n.writeKey&&s.append("write_key",n.writeKey),e.folder&&s.append("folder",e.folder),e.metadata&&s.append("metadata",JSON.stringify(e.metadata)),e.trigger_webhook&&s.append("trigger_webhook",e.trigger_webhook.toString()),new Promise((a,p)=>{s.getLength((E,J)=>{if(E){p(E);return}let C=h({"Content-Length":J},s.getHeaders());n.writeKey&&(C.Authorization=`Bearer ${n.writeKey}`),c(m.POST,r,s,C).then(a).catch(_=>{var A;p(((A=_.response)==null?void 0:A.data)||_);});});})}let i=new FormData;if(e.media instanceof File||e.media instanceof Blob){let s=e.media instanceof File?e.media.name:"file";i.append("media",e.media,s);}else throw new Error("In browser environment, media must be a File or Blob");n.writeKey&&i.append("write_key",n.writeKey),e.folder&&i.append("folder",e.folder),e.metadata&&i.append("metadata",JSON.stringify(e.metadata)),e.trigger_webhook&&i.append("trigger_webhook",e.trigger_webhook.toString());let o={};return n.writeKey&&(o.Authorization=`Bearer ${n.writeKey}`),c(m.POST,r,i,o).catch(s=>{var a;throw ((a=s.response)==null?void 0:a.data)||s})},async updateOne(e,r){let i=`${t.apiUrl}/buckets/${n.bucketSlug}/media/${e}`;return B=d(n.writeKey),c(m.PATCH,i,r,B)},async deleteOne(e,r=false){let i=`${t.apiUrl}/buckets/${n.bucketSlug}/media/${e}${r?"?trigger_webhook=true":""}`;return B=d(n.writeKey),c(m.DELETE,i,null,B)}});var y=class extends l{depth(t){return this.endpoint+=`&depth=${t}`,this}status(t){return this.endpoint+=`&status=${t}`,this}after(t){return this.endpoint+=`&after=${t}`,this}options(t){return t&&(this.opts=t),this}};var oe=async(n,t,e)=>{let r={name:{$in:t}},{media:i}=await n.media.find(r).props(!e||e==="all"?"":`name,url,imgix_url,${e}`);return i},ae=n=>{let t=[];return JSON.stringify(n,(e,r)=>{if(r&&typeof r=="object"){let i=r.imgix_url||r.url;i&&t.push(i.split("/").pop().split("?")[0]);}return r}),[...new Set(t)]},pe=(n,t,e)=>{let r=new Map(t.map(o=>[o.name,o])),i=o=>{o&&typeof o=="object"&&Object.keys(o).forEach(s=>{if(o[s]&&typeof o[s]=="object"){let a=o[s].imgix_url||o[s].url;if(a){let p=a.split("/").pop().split("?")[0];if(r.has(p)){e.includes("name")||delete r.get(p).name;let E=h({},r.get(p));Object.assign(o[s],E);}}i(o[s]);}});};i(n);},g=async(n,t,e)=>{let r=async i=>{let o=ae(i);if(o.length>0){let s=await oe(t,o,e);pe(i,s,e);}return i};return Array.isArray(n)?Promise.all(n.map(i=>r(i))):r(n)};var O=class extends y{constructor(e,r){super(e);this.bucketConfig=r;}limit(e){return this.endpoint+=`&limit=${e}`,this}async then(e,r){await u(this.endpoint,r,async i=>{this.opts&&this.opts.media&&i.objects&&(i.objects=await g(i.objects,f(this.bucketConfig),this.opts.media.props)),e==null||e(i);});}};var j=class extends y{constructor(e,r){super(e);this.bucketConfig=r;}async then(e,r){await u(this.endpoint,r,async i=>{let o=i.objects&&i.objects.length?i.objects[0]:null;this.opts&&this.opts.media&&o&&(o=await g(o,f(this.bucketConfig),this.opts.media.props)),e==null||e({object:o});});}};var x,W=(n,t)=>({find(e){let r=`${t.apiUrl}/buckets/${n.bucketSlug}/objects?read_key=${n.readKey}${T(e)}`;return new O(r,n)},findOne(e){let r=`${t.apiUrl}/buckets/${n.bucketSlug}/objects?read_key=${n.readKey}&limit=1${T(e)}`;return new j(r,n)},async insertOne(e){let r=`${t.apiUrl}/buckets/${n.bucketSlug}/objects`;return x=d(n.writeKey),c(m.POST,r,e,x)},async updateOne(e,r){let i=`${t.apiUrl}/buckets/${n.bucketSlug}/objects/${e}`;return x=d(n.writeKey),c(m.PATCH,i,r,x)},async deleteOne(e,r=false){let i=`${t.apiUrl}/buckets/${n.bucketSlug}/objects/${e}${r?"?trigger_webhook=true":""}`;return x=d(n.writeKey),c(m.DELETE,i,null,x)}});var w,L=(n,t)=>({find(){let e=`${t.apiUrl}/buckets/${n.bucketSlug}/object-types?read_key=${n.readKey}`;return c(m.GET,e)},findOne(e){let r=`${t.apiUrl}/buckets/${n.bucketSlug}/object-types/${e}?read_key=${n.readKey}`;return c(m.GET,r)},async insertOne(e){let r=`${t.apiUrl}/buckets/${n.bucketSlug}/object-types`;return w=d(n.writeKey),c(m.POST,r,e,w)},async updateOne(e,r){let i=`${t.apiUrl}/buckets/${n.bucketSlug}/object-types/${e}`;return w=d(n.writeKey),c(m.PATCH,i,r,w)},async deleteOne(e){let r=`${t.apiUrl}/buckets/${n.bucketSlug}/object-types/${e}`;return w=d(n.writeKey),c(m.DELETE,r,null,w)}});var b=class extends l{depth(t){return this.endpoint+=`&depth=${t}`,this}status(t){return this.endpoint+=`&status=${t}`,this}after(t){return this.endpoint+=`&after=${t}`,this}options(t){return t&&(this.opts=t),this}};var k=class extends b{constructor(e,r){super(e);this.bucketConfig=r;}async then(e,r){await u(this.endpoint,r,async i=>{let{revision:o}=i;this.opts&&this.opts.media&&o&&(o=await g(o,f(this.bucketConfig),this.opts.media.props)),e==null||e({revision:o});});}};var P=class extends b{constructor(e,r){super(e);this.bucketConfig=r;}limit(e){return this.endpoint+=`&limit=${e}`,this}async then(e,r){await u(this.endpoint,r,async i=>{this.opts&&this.opts.media&&i.revisions&&(i.revisions=await g(i.revisions,f(this.bucketConfig),this.opts.media.props)),e==null||e(i);});}};var q,N=(n,t)=>({find(e){let r=`${t.apiUrl}/buckets/${n.bucketSlug}/objects/${e}/revisions?read_key=${n.readKey}`;return new P(r,n)},findOne({objectId:e,revisionId:r}){let i=`${t.apiUrl}/buckets/${n.bucketSlug}/objects/${e}/revisions/${r}?read_key=${n.readKey}`;return new k(i,n)},async insertOne(e,r){let i=`${t.apiUrl}/buckets/${n.bucketSlug}/objects/${e}/revisions`;return q=d(n.writeKey),c(m.POST,i,r,q)}});var S=class{constructor(){this.events={};}on(t,e){return this.events[t]||(this.events[t]=[]),this.events[t].push(e),this}emit(t,...e){let r=this.events[t];return !r||r.length===0?false:(r.forEach(i=>{try{i.apply(this,e);}catch(o){console.error("Error in event listener:",o);}}),true)}off(t,e){if(!e)return delete this.events[t],this;let r=this.events[t];if(r){let i=r.indexOf(e);i>-1&&r.splice(i,1),r.length===0&&delete this.events[t];}return this}removeListener(t,e){return this.off(t,e)}removeAllListeners(t){return t?delete this.events[t]:this.events={},this}listeners(t){let e=this.events[t];return e?[...e]:[]}listenerCount(t){let e=this.events[t];return e?e.length:0}once(t,e){let r=(...i)=>{this.off(t,r),e.apply(this,i);};return this.on(t,r)}};var R=class extends S{constructor(e){super();this.stream=e;this.usageInfo=null;this.text="";this.setupListeners();}setupListeners(){let e="";this.stream.on("data",r=>{e+=r.toString();let i=e.split(`

`);e=i.pop()||"";for(let o of i)if(o.trim()){let s=o.split(`
`).filter(a=>a.startsWith("data: ")).map(a=>a.replace(/^data: /,""));for(let a of s)try{let p=JSON.parse(a);p.error?this.emit("error",new Error(p.error.message||"An error occurred")):(p.text&&(this.text+=p.text,this.emit("text",p.text)),p.token_count&&(this.usageInfo=p.token_count,this.emit("usage",p.token_count)),p.event==="end"&&this.emit("end",p.data));}catch(p){a.includes("error")&&this.emit("error",new Error(a));}}}),this.stream.on("error",r=>{this.emit("error",r);}),this.stream.on("end",()=>{if(e.trim()){let r=e.split(`
`).filter(i=>i.startsWith("data: ")).map(i=>i.replace(/^data: /,""));for(let i of r)try{let o=JSON.parse(i);o.text&&(this.text+=o.text,this.emit("text",o.text)),o.event==="end"&&this.emit("end",o.data);}catch(o){}}this.emit("end",{usage:this.usageInfo});});}get usage(){return this.usageInfo}[Symbol.asyncIterator](){let e=[],r=null,i=false,o=false;return this.on("text",s=>{r?(r({value:{text:s},done:false}),r=null):e.push({text:s});}),this.on("usage",s=>{r?(r({value:{usage:s},done:false}),r=null):e.push({usage:s});}),this.on("end",()=>{i=true,r&&(r({value:void 0,done:true}),r=null);}),this.on("error",s=>{o=true,r?(r({value:{error:s},done:false}),r=null):e.push({error:s});}),{next:async()=>{if(e.length>0){let s=e.shift();if(s.error)throw s.error;return {value:s,done:false}}if(i)return {value:void 0,done:true};if(o)throw new Error("Stream encountered an error");return new Promise(s=>{r=s;})}}}},z=(n,t)=>{let{uploadUrl:e}=t,{bucketSlug:r,writeKey:i}=n,o={"Content-Type":"application/json"};return i&&(o.Authorization=`Bearer ${i}`),{generateText:async s=>{if(!s.prompt&&!s.messages)throw new Error("Either prompt or messages must be provided");let a=`${e}/buckets/${r}/ai/text`;if(s.stream){let p=await c("POST",a,s,o,true);return new R(p)}return c("POST",a,s,o)},stream:async s=>{if(!s.prompt&&!s.messages)throw new Error("Either prompt or messages must be provided");let a=`${e}/buckets/${r}/ai/text`,p=await c("POST",a,M(h({},s),{stream:true}),o,true);return new R(p)},generateImage:async s=>{let a=`${e}/buckets/${r}/ai/image`;return c("POST",a,s,o)}}};var f=n=>{let t=h({apiVersion:"v3",apiEnvironment:"production"},n),e=H(t);return {objects:W(t,e),objectTypes:L(t,e),objectRevisions:N(t,e),media:D(t,e),ai:z(t,e)}},ce=f;

const cosmic = ce({
  bucketSlug: undefined                                  ,
  readKey: undefined                               ,
  writeKey: undefined                                
});
function hasStatus(error) {
  return typeof error === "object" && error !== null && "status" in error;
}
async function getProducts() {
  try {
    const response = await cosmic.objects.find({ type: "products" }).props(["id", "title", "slug", "metadata"]).depth(1);
    return response.objects;
  } catch (error) {
    if (hasStatus(error) && error.status === 404) {
      return [];
    }
    throw new Error("Failed to fetch products");
  }
}
async function getProduct(slug) {
  try {
    const response = await cosmic.objects.findOne({ type: "products", slug }).props(["id", "title", "slug", "metadata"]).depth(1);
    return response.object;
  } catch (error) {
    if (hasStatus(error) && error.status === 404) {
      return null;
    }
    throw new Error("Failed to fetch product");
  }
}
async function getCategories() {
  try {
    const response = await cosmic.objects.find({ type: "categories" }).props(["id", "title", "slug", "metadata"]);
    return response.objects;
  } catch (error) {
    if (hasStatus(error) && error.status === 404) {
      return [];
    }
    throw new Error("Failed to fetch categories");
  }
}
async function getSeller(id) {
  try {
    const response = await cosmic.objects.findOne({ type: "sellers", id }).props(["id", "title", "slug", "metadata"]);
    return response.object;
  } catch (error) {
    if (hasStatus(error) && error.status === 404) {
      return null;
    }
    throw new Error("Failed to fetch seller");
  }
}
async function getSellerOrders(sellerId) {
  try {
    const response = await cosmic.objects.find({ type: "orders", "metadata.seller": sellerId }).props(["id", "title", "metadata"]).depth(1);
    return response.objects;
  } catch (error) {
    if (hasStatus(error) && error.status === 404) {
      return [];
    }
    throw new Error("Failed to fetch orders");
  }
}
async function getUserByEmail(email) {
  try {
    const usersResult = await cosmic.objects.find({
      type: "users",
      "metadata.email": email
    }).props("id,slug,title,metadata").limit(1);
    if (usersResult.objects && usersResult.objects.length > 0) {
      return usersResult.objects[0];
    }
    const sellersResult = await cosmic.objects.find({
      type: "sellers",
      "metadata.email": email
    }).props("id,slug,title,metadata").limit(1);
    if (sellersResult.objects && sellersResult.objects.length > 0) {
      return sellersResult.objects[0];
    }
    return null;
  } catch (error) {
    console.error("Error fetching user by email:", error);
    return null;
  }
}
async function createUser(userData) {
  try {
    console.log("Creating user in Cosmic:", {
      type: userData.type,
      title: userData.title,
      email: userData.metadata?.email,
      slug: userData.slug
    });
    const response = await cosmic.objects.insertOne(userData);
    console.log("User created successfully:", response.object.id);
    return response.object;
  } catch (error) {
    console.error("Cosmic insertOne error:", error);
    console.error("Failed userData:", JSON.stringify(userData, null, 2));
    if (error) {
      console.error("Error details:", {
        message: error.message,
        status: error.status,
        statusText: error.statusText,
        response: error.response,
        data: error.data,
        stack: error.stack
      });
    }
    const errorMsg = error.message || error.toString();
    throw new Error(`Failed to create user: ${errorMsg}`);
  }
}

export { createUser as a, getProduct as b, cosmic as c, getSeller as d, getSellerOrders as e, getProducts as f, getUserByEmail as g, getCategories as h };
