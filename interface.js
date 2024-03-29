// Let's just barf out some proof of concept code...

const ipc = require('electron').ipcRenderer
const spawn = require('child_process').spawn
const path = require('path')

const source = document.getElementById('vid-source')
const previewPlayer = document.getElementById('video-preview')
const inButton = document.getElementById('setin')
const outButton = document.getElementById('setout')

// Fields
let inPoint = 0.0
let outPoint = 0.0

// Select File
const selectFileButton = document.getElementById('btn-select-file')
selectFileButton.addEventListener('click', (event) => {
  ipc.send('open-file-dialog')
})

// Load a file selected from an open file dialogue
ipc.on('selected-directory', (event, filePath) => {
  source.setAttribute('src', filePath)
  previewPlayer.load()
  document.getElementById('current-file').innerHTML = path.basename(String(filePath))
  localStorage.setItem('videoPath', filePath)
})

// load last used file
if (localStorage.getItem('videoPath')) {
  source.setAttribute('src', localStorage.getItem('videoPath'))
  previewPlayer.load()
  document.getElementById('current-file').innerHTML = path.basename(localStorage.getItem('videoPath'))
}

// Player Timer
previewPlayer.addEventListener('timeupdate', (event) => {
  document.getElementById('playtime').innerHTML = Math.round(previewPlayer.currentTime * 1000) / 1000
})

// Set in point
inButton.addEventListener('click', (event) => {
  inPoint = Math.round(previewPlayer.currentTime * 1000) / 1000
  document.getElementById('current-in-point').innerHTML = inPoint
  if (inPoint > outPoint) {
    outPoint = inPoint
    document.getElementById('current-out-point').innerHTML = outPoint
  }
})

// Set out point
outButton.addEventListener('click', (event) => {
  outPoint = Math.round(previewPlayer.currentTime * 1000) / 1000
  document.getElementById('current-out-point').innerHTML = outPoint
  if (outPoint < inPoint) {
    inPoint = outPoint
    document.getElementById('current-in-point').innerHTML = inPoint
  }
})

// Shorten video test
const shortenButton = document.getElementById('shorten-video')

shortenButton.addEventListener('click', (event) => {
  let duration = Math.round((outPoint - inPoint) * 1000) / 1000
  let output = __dirname + '\\tmp\\shortened.mp4'
  //let input = localStorage.getItem('videoPath').replace(/\s/g, "^ ")
  // let ffmpegArguments = `ffmpeg.exe -i ${localStorage.getItem('videoPath')} -ss ${inPoint} -c copy -t ${duration} ${output}`
  let args = [
    '-i', localStorage.getItem('videoPath'),
    '-y', // forces overwite
    '-ss', inPoint,
    '-c', 'copy',
    '-t', duration,
    output
  ]

  const proc = spawn('ffmpeg', args)
  proc.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`)
  })

  proc.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`)
  })

  proc.on('close', (code) => {
    console.log(`child process exited with code ${code}`)
  })
})

// Create gif test
const gifButton = document.getElementById('create-gif')

gifButton.addEventListener('click', (event) => {
  // Shorten Video
  let duration = Math.round((outPoint - inPoint) * 1000) / 1000
  let output = __dirname + '\\tmp\\shortened.mp4'
  let args = [
    '-i', localStorage.getItem('videoPath'),
    '-y', // forces overwite
    '-ss', inPoint,
    '-c', 'copy',
    '-t', duration,
    output
  ]

  const shortenProc = spawn('ffmpeg', args)
  shortenProc.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`)
  })

  shortenProc.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`)
  })

  shortenProc.on('close', (code) => {
    console.log(`child process exited with code ${code}`)
    createPalette()
  })
})

function createPalette () {
  console.log('Creating palette...')
  let input = __dirname + '\\tmp\\shortened.mp4'
  let palletOut = __dirname + '\\tmp\\palette.png'
  let filters = 'fps=30,scale=720:-1:flags=lanczos'
  let args = [
    '-v', 'warning',
    '-i', input,
    '-vf', `${filters},palettegen`,
    '-y',
    palletOut
  ]
  const paletteProc = spawn('ffmpeg', args)

  paletteProc.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`)
  })

  paletteProc.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`)
  })

  paletteProc.on('close', (code) => {
    console.log(`child process exited with code ${code}`)
    createGif()
  })
}

function createGif () {
  console.log('Creating gif...')
  let input = __dirname + '\\tmp\\shortened.mp4'
  let palletOut = __dirname + '\\tmp\\palette.png'
  let gifOut = __dirname + '\\tmp\\whatagif.gif'
  let filters = 'fps=30,scale=720:-1:flags=lanczos'
  let args = [
    '-v', 'warning',
    '-i', input,
    '-i', palletOut,
    '-lavfi', `${filters} [x]; [x][1:v] paletteuse`,
    '-y',
    gifOut
  ]
  const gifProc = spawn('ffmpeg', args)

  gifProc.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`)
  })

  gifProc.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`)
  })

  gifProc.on('close', (code) => {
    console.log(`child process exited with code ${code}`)
  })
}
