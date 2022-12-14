/*
江苏移动_幸运扭蛋机
cron:45 45 9 5 * *
*/
const Env = require('./function/01Env')
const { getMobieCK } = require('./function/01js10086_common')

const $ = new Env('江苏移动_幸运扭蛋机')

const js10086 = require('./function/js10086')
const cookiesArr = []
Object.keys(js10086).forEach((item) => {
  cookiesArr.push(js10086[item])
})

!(async () => {
  $.msg = ''
  for (let i = 0; i < cookiesArr.length; i++) {
    const cookie = cookiesArr[i]
    $.phone = decodeURIComponent(cookie.match(/phone=([^; ]+)(?=;?)/) && cookie.match(/phone=([^; ]+)(?=;?)/)[1])
    const bodyParam = decodeURIComponent(cookie.match(/body=([^; ]+)(?=;?)/) && cookie.match(/body=([^; ]+)(?=;?)/)[1])
    
    $.msg += `<font size="5">${$.phone}</font>\n`
    // console.log(`env: ${$.phone}, ${bodyParam}`)
    if (!$.phone || !bodyParam) {
      $.msg += `登陆参数配置不正确\n`
      continue
    }

    console.log(`${$.phone}获取Cookie：`)
    $.setCookie = await getMobieCK($.phone, bodyParam)
    
    await $.wait(10000)
    let r = await dispatch()
    await $.wait(10000)

    $.msg += '\n'
  }
  console.log(`通知内容：\n\n`, $.msg)
  await $.sendNotify($.name, $.msg)
})().catch((e) => {
  $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
}).finally(() => {
  $.done()
})

function dispatch() {
    return new Promise((resolve) => {
        const url = `http://wap.js.10086.cn/actionDispatcher.do`
        const headers = {
            'Host':'wap.js.10086.cn',
            'Accept':'application/json, text/javascript, */*; q=0.01',
            'X-Requested-With':'XMLHttpRequest',
            'Accept-Language':'en-us',
            'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8',
            'Origin':'http://wap.js.10086.cn',
            'Referer':'http://wap.js.10086.cn/LuckyEgg.thtml',
            'Cookie': $.setCookie,
            'User-Agent': ua[$.index]
        }
        const body = 'reqUrl=LuckyEggQuery&busiNum=LuckyEgg&funName=clickCheck'

        const options = {
            url, headers, body
        }

        $.post(options, async (err, resp, data) => {
            if (err) throw Error(err)
            // console.log(`活动返回结果: ${data}\n\n\n\n`)
            if (data) data = JSON.parse(data)

            if (data.success && data.resultCode == '0') {
                console.log(`抽奖成功, 获得${data.resultObj.luckyEggPojoTemp.bigTitle}: ${data.resultObj.luckyEggPojoTemp.smallTitle}`)
                $.msg += `抽奖成功, 获得${data.resultObj.luckyEggPojoTemp.bigTitle}: ${data.resultObj.luckyEggPojoTemp.smallTitle}\n`
                resolve(true)
            } else {
                console.log(`抽奖失败, 返回结果: ${JSON.stringify(data)}`)
                $.msg += `抽奖失败, 返回结果: ${JSON.stringify(data)}\n`
                resolve(false)
            }
        })
    })


}