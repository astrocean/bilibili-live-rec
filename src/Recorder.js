const fs = require('fs')
const request = require('request')
const config = require('./_config.js')
const Logger = new (require('./Logger.js'))('Recorder')
const { format } = require('../lib/public.js')
const { getPlayUrl } = require('./bilibili-api.js')

class Recorder {
  constructor({roomid,nickname,httpResCallback,recEndCallback}){
    this.roomid = roomid
    this.nickname = nickname
    this.isFix = false
    this.isHttpEnd = false
    this.isFinish = false
    this.httpResCallback = httpResCallback
    this.recEndCallback = recEndCallback
    this.retry = true //主动stop时设为false
    this.tmpFilename = `${format(new Date(),'yyyy-MM-dd_HH_mm_ss')}-${this.nickname}-${(new Date()).valueOf()}.flv`
    this.recEndCallbackResult = {
      tmpFilename: this.tmpFilename,
      nickname: this.nickname,
      time: format(new Date(),'yyyy-MM-dd_HH_mm_ss')
    }
    this.start()
  }

  async start(){
    // this.url = await Recorder.getPlayUrl(this.roomid)
    Logger.notice(`获取播放地址`)
    this.url = await getPlayUrl(this.roomid)
    this.rec()
  }

  rec(){
    this.tmpFilePath = `${config.tmp}${this.tmpFilename}`
    let stream = fs.createWriteStream(this.tmpFilePath)
    let Host=this.url.match(/https?:\/\/([^/]*)\//)[1];
    this.req = request({
      method: 'GET',
      url: this.url,
      headers:{
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        Host,
        'Cache-Control': 'no-cache',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.103 Safari/537.36 Vivaldi/2.1.1337.47'
      }
    })
    this.req.on('end',()=>{
      // Logger.debug('http end')
      if(this.statusCode !== 200){
        // Logger.debug('请求状态错误：' + this.statusCode)
        // Logger.debug('检查文件大小')
        fs.stat(this.tmpFilePath,(err,stats)=>{
          if(err) return
          if(stats.size === 0){
            fs.unlink(this.tmpFilePath,(err)=>{
              if(err){
                // Logger.debug('删除空文件失败')
              }else{
                // Logger.debug('删除空文件成功')
              }
            })
          }
        })
      }else{
        this.isHttpEnd = true
        this.tryFix()
      }
    })
    this.req.on('abort',()=>{
      // Logger.debug('abort')
    })
    this.req.on('response',(response)=>{
      // Logger.debug('response')
      if(typeof this.httpResCallback === 'function'){
        this.httpResCallback(response.statusCode, this.retry)
      }
      this.statusCode = response.statusCode
    })
    stream.on('finish',()=>{
      // Logger.debug('finish')
      this.isFinish = true
      this.tryFix()
    })
    this.req.pipe(stream)
  }

  tryFix(){
    if(this.isFinish && this.isHttpEnd){
      this.recEndCallbackResult.retry = this.retry
      this.recEndCallback(this.recEndCallbackResult)
    }else{
      Logger.debug('未满足修复条件')
      Logger.debug(`isFinish: ${this.isFinish}`)
      Logger.debug(`isHttpEnd: ${this.isHttpEnd}`)
    }

  }

  stop(){
    this.retry = false
    this.req.abort()
  }
}

module.exports = Recorder
