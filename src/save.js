const { format } = require('../lib/public.js')
const fs=require('fs');
let initSave=(roomid)=>{
  let orginTexts=[];
let texts=[];
let hasLogDir=false;
const save=(info={},data)=>{
    // console.log(info,data);
    try{
        if(info&&info.cmd&&![
                // 'SEND_GIFT',
                // 'COMBO_END',
                // 'USER_TOAST_MSG',
                // 'SPECIAL_GIFT',
                // 'WELCOME',
                // 'WELCOME_GUARD',
                // 'ENTRY_EFFECT',
                // # 直播状态相关 [开播，下播，警告，被切直播，房间被封]
                "LIVE", "PREPARING", "WARNING", "CUT_OFF", "ROOM_LOCK",
                'DANMU_MSG',
                'SYS_GIFT'
            ].includes(info.cmd)){
            return;
        }
        
        let {msg='',popularity,uname,sendTime,uid}=info||{};
        let now=Date.now();
        orginTexts.push(JSON.stringify(data));
        
        if(info){
          let sendTimeStr=format(sendTime||now,'yyyy-MM-dd HH:mm:ss');
          if(popularity){
              msg=`人气：${popularity}`;
          }
          texts.push(`${sendTimeStr} ${uname||'-'} ${uid||'-'}:${msg}`);
        }
    }catch(e){
        console.log(e.message);
    }
 
}


let saveTimer;
let saveExecute={
    save,
    startSave:(isSync)=>{
       clearTimeout(saveTimer);
       let save2File=()=>{
        try{
            let logDir=`${__dirname}/../log`;
            if(!hasLogDir&&!fs.existsSync(logDir)){
                fs.mkdirSync(logDir);
                hasLogDir=true;
            }
            // console.log(orginTexts,texts);
            let now=Date.now();
            let today=format(now,'yyyy-MM-dd');
            if(orginTexts.length>0){
                let _orginTexts=orginTexts.join('\n,');
                orginTexts=[];
                fs.appendFileSync(`${logDir}/${today}-${roomid}-danmu-origin.txt`, '\n,'+_orginTexts);
            }
            if(texts.length>0){
                let _texts=texts.join('\n,');
                texts=[];
                fs.appendFileSync(`${logDir}/${today}-${roomid}-danmu.txt`, '\n,'+_texts);
            }
        }catch(e){
            console.log(e);
        }
       }
       if(isSync){
        save2File(roomid);
       }
       saveTimer=setTimeout(()=>{
        saveExecute.startSave();
        save2File();
       },10*1000);
     }
};
return saveExecute;
}

module.exports=initSave;