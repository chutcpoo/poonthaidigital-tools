const json=(res,status,body)=>{res.statusCode=status;res.setHeader("content-type","application/json");res.end(JSON.stringify(body));};
export default async function handler(req,res){
  const writes=process.env.YOUTUBE_WRITES_ENABLED==="true";
  const configured=Boolean(process.env.YOUTUBE_CLIENT_ID&&process.env.YOUTUBE_CLIENT_SECRET&&process.env.YOUTUBE_REFRESH_TOKEN);
  if(req.method==="GET") return json(res,200,{service:"poonthai-youtube-executor",mode:writes?"WRITE_ENABLED":"DRY_RUN_ONLY",configured,writesEnabled:writes,allowedPrivacy:["private"],youtubeWriteCount:0});
  if(req.method!=="POST") return json(res,405,{error:"METHOD_NOT_ALLOWED"});
  const b=req.body||{};
  if(b.operation!=="private_upload") return json(res,400,{error:"OPERATION_NOT_ALLOWED"});
  if(b.privacyStatus!=="private") return json(res,400,{error:"PRIVATE_ONLY"});
  const required=["title","description","videoFileId","thumbnailFileId"];
  const missing=required.filter(k=>!b[k]);
  if(missing.length) return json(res,400,{error:"MISSING_FIELDS",missing});
  const candidate={operation:"private_upload",privacyStatus:"private",title:b.title,videoFileId:b.videoFileId,thumbnailFileId:b.thumbnailFileId,channelKey:b.channelKey||"POONTHAI_FOCUS"};
  if(!writes) return json(res,200,{status:"DRY_RUN_PASS",candidate,youtubeWriteCount:0});
  if(!configured) return json(res,503,{error:"YOUTUBE_OAUTH_NOT_CONFIGURED",youtubeWriteCount:0});
  return json(res,501,{error:"WRITE_EXECUTOR_NOT_ACTIVATED_R01",youtubeWriteCount:0});
}
