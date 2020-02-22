const QiniuManager = require('./src/utils/QiniuManager')
const path = require('path')
// generate mac
const accessKey = 'YKyN-ihoR615wpUWgXPS5Fg-Oby8ND8QnXdswWFq'
const secretKey = 'LKoc8TIdcYmvf0xqDhBRjpwna_Ye_rEayGxOrDyI'
const localFile = '/Users/vectorwings/Documents/文件一.md'
const key = '文件一.md'
const downloadPath = path.join(__dirname, key)

const manager = new QiniuManager(accessKey, secretKey, 'clouddocx')
// 上传并删除文件测试
// manager.uploadFile(key, localFile)
// .then((data) => {
//     console.info('data:', data)
//     // return manager.deleteFile(key)
// })
// .then((data) => {
//     console.info('data:', data)
// })

// 删除文件测试
// manager.deleteFile(key)

// const publicDownloadUrl = bucketManager.publicDownloadUrl(publicBucketDomain, key)
// console.log(publicDownloadUrl)

// 获取下载链接
// manager.generateDownloadLink(key)
// .then(data => {
//     console.info('data:', data)
//     return manager.generateDownloadLink('文件二.md')
// })
// .then(data => {
//     console.info('data:', data)
// })

// 下载文件
manager.downloadFile(key, downloadPath)
.then(data => {
    console.info('下载写入文件完毕')
})
.catch(err => {
    console.info(err)
})