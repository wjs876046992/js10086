/*
江苏移动_专区页面
cron:0 50 8 * * *
*/
const Env = require('./function/01Env')
const { options, getMobieCK } = require('./function/01js10086_common')
const { mbactFunc } = require('./function/01js10086_mbnact')

const $ = new Env('江苏移动_专区页面')

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
    
    let resultObj = await queryTaskMain()
    if (!resultObj) {
      continue
    }

    // "doneCount": 2,
    // "limitCount": 3,
    if (resultObj.entitleCount > 0) {
      entitleCount = resultObj.entitleCount
      for (var j = 0; j < entitleCount; j++) {
        await lotteryStrengthen()
        await $.wait(2000)
      }
    } else {
      const subTaskList = resultObj.taskSubList.filter(e => e.currentDoneCount == 0).slice(0, 6)
      if (subTaskList.length > 0) {
        $.msg += `查询可完成任务数：${subTaskList.length}\n`
        console.log(`${$.phone}查询可完成任务数：${subTaskList.length}\n`)
        for (let j = 0; j < subTaskList.length; j++) {
          const task = subTaskList[j]
          if (task.taskType == 'BROWSE') {
            const billNo = await doTask(task)
            await $.wait(1000)
            const billNo2 = await doneBrowseTask(task, billNo)
            $.msg += `\n`
            await $.wait(2000)

            if (j % 2 == 1) {
              // 每两次可抽奖一次
              await lotteryStrengthen()
              await $.wait(2000)
            }
          }
        }
      } else {
        $.msg += `今日已完成，无任务可做\n`
        console.log(`${$.phone}今日已完成，无任务可做`)
      }
    } 
    
    console.log()
    $.msg += `\n\n`
  }
  console.log(`通知内容：\n\n`, $.msg)
  await $.sendNotify($.name, $.msg)
})().catch((e) => {
  $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
}).finally(() => {
  $.done()
})

/**
 * 查询活动信息
 */
async function queryTaskMain () {
  console.log(`${$.phone}查询任务信息......`)
  return await mbactFunc($, 'queryTaskMain', 'RWCJ00000080')
}

/**
 * 执行任务
 */
async function doTask (task) {
  console.log(`${$.phone}执行任务${task.taskName}......`)
  const actNum = `RWCJ00000080&configNum=${task.configNum}&taskType=${task.taskType}`
  const body = `actNum=RWCJ00000080&configNum=${task.configNum}&taskType=${task.taskType}`
  return await mbactFunc($, 'doTask', actNum, body)
}

/**
 * 完成任务
 */
async function doneBrowseTask (task, billNo) {
  console.log(`${$.phone}成功执行任务: ${task.taskName}......`)
  const actNum = `RWCJ00000080&billNum=${billNo}`
  const body = `actNum=RWCJ00000080&billNum=${billNo}`
  $.msg += `成功执行任务: ${task.taskName}\n`
  return await mbactFunc($, 'doneBrowseTask', actNum, body)
}

/**
 * 抽奖
 */
async function lotteryStrengthen () {
  const resultObj = await mbactFunc($, 'lotteryStrengthen', 'RWCJ00000080&sourcesNum=H5&featureCode=')
  if (resultObj && resultObj.prize_name) {
    $.msg += `赢得${resultObj.prize_name}\n`
    console.log(`${$.phone}赢得${resultObj.prize_name}`)
  }
}