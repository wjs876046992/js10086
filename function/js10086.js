//此处填写京东账号cookie。
let CookieJDs = [
]
// 判断环境变量里面是否有京东ck
if (process.env.JS10086_OPT) {
  if (process.env.JS10086_OPT.indexOf('&') > -1) {
    CookieJDs = process.env.JS10086_OPT.split('&');
  } else if (process.env.JS10086_OPT.indexOf('\n') > -1) {
    CookieJDs = process.env.JS10086_OPT.split('\n');
  } else {
    CookieJDs = [process.env.JS10086_OPT];
  }
}
if (JSON.stringify(process.env).indexOf('GITHUB')>-1) {
  console.log(`请勿使用github action运行此脚本,无论你是从你自己的私库还是其他哪里拉取的源代码，都会导致我被封号\n`);
  !(async () => {
    await require('./sendNotify').sendNotify('提醒', `请勿使用github action、滥用github资源会封我仓库以及账号`)
    await process.exit(0);
  })()
}
CookieJDs = [...new Set(CookieJDs.filter(item => !!item))]
console.log(`\n====================共${CookieJDs.length}个移动账号Cookie=========\n`);
console.log(`==================脚本执行- 北京时间(UTC+8)：${new Date(new Date().getTime() + new Date().getTimezoneOffset()*60*1000 + 8*60*60*1000).toLocaleString('zh', {hour12: false}).replace(' 24:',' 00:')}=====================\n`)
if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
for (let i = 0; i < CookieJDs.length; i++) {
  if (!CookieJDs[i].match(/phone=(.+?);/) || !CookieJDs[i].match(/body=(.+?);/)) console.log(`\n提示:环境变量 【${CookieJDs[i]}】填写不规范,可能会影响部分脚本正常使用。正确格式为: phone=xxx;body=xxx;（分号;不可少）\n`);
  const index = (i + 1 === 1) ? '' : (i + 1);
  exports['CookieJD' + index] = CookieJDs[i].trim();
}