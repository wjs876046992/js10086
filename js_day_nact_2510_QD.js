/*
江苏移动_每日签到
cron:25 15 10 * * *
*/
const Env = require('./function/01Env')
const { options, getMobieCK } = require('./function/01js10086_common')
const { nactFunc } = require('./function/01js10086_nact')

const $ = new Env('江苏移动_每日签到')

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
    
    const resultObj = await initIndexPage()
    if (resultObj && !resultObj.isSignToday) {
      await doSign()
    }

    //每个月的补签卡只能领5个
    if (resultObj && !resultObj.isGetFreeChance && resultObj.totalFreeChance < 5) {
      console.log(`${$.phone}开始获取免费补签卡......`)
      await getFreeSupplySignChance()
      if (resultObj.today - resultObj.monthSignCnt > 1) {
        await doSignSupply()
      } else {
        $.msg += `1无需补签monthSignCnt=${resultObj.monthSignCnt}，today=${resultObj.today}\n`
        console.log(`1无需补签monthSignCnt=${resultObj.monthSignCnt}，today=${resultObj.today}`)
      }
    } else {
      $.msg += `无法领取补签卡isGetFreeChance=${resultObj.isGetFreeChance}，totalFreeChance=${resultObj.totalFreeChance}\n`
      console.log(`${$.phone}无法领取补签卡isGetFreeChance=${resultObj.isGetFreeChance}，totalFreeChance=${resultObj.totalFreeChance}`)
    }

    // 补签
    // 今日未补签 && 存在补签卡 && 当前签到天数小于今日
    if (!resultObj.isSignSupplu && resultObj.currentFreeChance > 0 && resultObj.today - resultObj.monthSignCnt > 1) {
      await doSignSupply()
    } else {
      $.msg += `无需补签isSignSupplu=${resultObj.isSignSupplu}，currentFreeChance=${resultObj.currentFreeChance}，monthSignCnt=${resultObj.monthSignCnt}，today=${resultObj.today}\n`
      console.log(`${$.phone}无需补签isSignSupplu=${resultObj.isSignSupplu}，currentFreeChance=${resultObj.currentFreeChance}，monthSignCnt=${resultObj.monthSignCnt}，today=${resultObj.today}`)
    }

    await $.wait(10000)
    console.log()
    $.msg += `\n`
  }
  console.log(`通知内容：\n\n`, $.msg)
  await $.sendNotify($.name, $.msg)
})().catch(async (e) => {
  $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
  await $.sendNotify($.name, "签到失败，手动检查...")
}).finally(() => {
  $.done()
})

/**
 * 查询签到信息
 */
async function initIndexPage () {
  await $.wait(2000)
  console.log(`${$.phone}获取签到信息......`)
  
  const params = `reqUrl=act2510&method=initIndexPage&operType=1&actCode=2510&extendParams=&ywcheckcode=&mywaytoopen=`
  const resultObj = await nactFunc($, params)
  // console.log('签到信息', JSON.stringify(resultObj))

  if (resultObj) {
    if (resultObj.isSignToday) {
      const prize = resultObj.prize
      console.log(`${$.phone}今日已签到，获得的奖励: ${prize.awardName}`)
      $.msg += `今日已签到，获得的奖励: ${prize.awardName};\n`
    } else {
      if (resultObj.isHasMulti) {
        console.log(`${$.phone}签到成功，需要再次领取奖励: ${prize.awardName}`)
        $.msg += `已签到，需要再次领取奖励: ${prize.awardName}\n`
        await doSignMulti()
      }
    }
    return {
      isGetFreeChance: resultObj.isGetFreeChance,
      totalFreeChance: resultObj.freeChance.totalChance || 0,
      currentFreeChance: resultObj.freeChance.currentChance || 0,
      isSignToday: resultObj.isSignToday,
      isSignSupplu: resultObj.isSignSupplu,
      monthSignCnt: resultObj.monthSignCnt,
      today: resultObj.today.substring(6),
      indexHasFullSign: resultObj.indexHasFullSign
    }
  }
  return false
}

/**
 * 签到
 */
async function doSign () {
  await $.wait(2000)
  console.log(`${$.phone}开始签到......`)

  const params = 'reqUrl=act2510&method=doSign&operType=1&actCode=2510&extendParams=&ywcheckcode=&mywaytoopen='
  const resultObj = await nactFunc($, params)
  if (!resultObj) {
    return false
  }
  // 成功签到，需要根据返回结果决定是否需要继续调用
  const prize = resultObj.prize
  if (prize && prize.awardNum) {
    // 直接下发奖励
    console.log(`${$.phone}签到成功，奖励: ${prize.awardName}`)
    $.msg += `签到成功，奖励: ${prize.awardName}\n`
  } else {
    // 需要进行抽奖
    if (resultObj.isHasMulti) {
      console.log(`${$.phone}已签到，需要再次领取奖励: ${prize.awardName}`)
      $.msg += `已签到，需要再次领取奖励: ${prize.awardName}\n`
      await doSignMulti()
    }
  }
}

/**
 * 抽奖
 */
async function doSignMulti () {
  await $.wait(1000)
  console.log(`${$.phone}开始抽奖......`)
  const params = 'reqUrl=act2510&method=doSignMulti&operType=1&actCode=2510&extendParams=&ywcheckcode=&mywaytoopen='
  const resultObj = await nactFunc($, params)
  console.log(`doSignMulti: `, resultObj)
  if (!resultObj) {
    return false
  }
  // 成功签到，需要根据返回结果决定是否需要继续调用
  const prize = resultObj.prize
  const supplyPrize = resultObj.supplyPrize
  if (prize && prize.awardNum) {
    // 直接下发奖励
    $.msg += `签到抽奖成功，奖励: ${prize.awardName}\n`
    console.log(`${$.phone}签到抽奖成功，奖励: ${prize.awardName}\n`)
  } else if (supplyPrize && supplyPrize.awardNum) {
    // 直接下发奖励
    $.msg += `补签抽奖成功，奖励: ${prize.awardName}\n`
    console.log(`${$.phone}补签抽奖成功，奖励: ${prize.awardName}\n`)
  } else {
    $.msg += '领奖貌似没成功，手动检查吧\n'
    console.log(`${$.phone}领奖貌似没成功，手动检查吧\n`)
  }
}


/**
 * 获取免费补签卡
 */
async function getFreeSupplySignChance () {
  await $.wait(2000)
  const params = 'reqUrl=act2510&method=getFreeSupplySignChance&operType=1&actCode=2510&hasGetMax=&extendParams=&ywcheckcode=&mywaytoopen='
  const resultObj = await nactFunc($, params)
  if (resultObj && resultObj.isGetFreeChance) {
    $.msg += '获取免费补签卡成功~\n'
    console.log(`${$.phone}获取免费补签卡成功~`)
    // const today = resultObj.today.substring(6)
    // await doSignSupply()
  }
}

/**
 * 补签
 */
async function doSignSupply() {
  await $.wait(2000)
  const params = 'reqUrl=act2510&method=doSignSupply&operType=1&actCode=2510&extendParams=&ywcheckcode=&mywaytoopen='
  const resultObj = await nactFunc($, params)
  // console.log(`doSignSupply: ${JSON.stringify(resultObj)}`)

  // 成功签到，需要根据返回结果决定是否需要继续调用
  const prize = resultObj.supplyPrize
  if (prize && prize.awardNum) {
    // 直接下发奖励
    console.log(`${$.phone}补签成功，奖励: ${prize.awardName}`)
    $.msg += `补签成功，奖励: ${prize.awardName}\n`
  } else {
    // 需要进行抽奖
    if (resultObj.isHasMulti) {
      console.log(`${$.phone}已补签，需要再次领取奖励: ${prize.awardName}`)
      $.msg += `已补签，需要再次领取奖励: ${prize.awardName}\n`
      await doSignMulti()
    }
  }
}
