Signal = signals.Signal


window.events = {
	micAccepted: new Signal()
	automatic: new Signal()
	peak: new Signal()
	bass: new Signal()
	break: new Signal()
	BPM: new Signal()
	BPMDrop: new Signal()
	BPMJump: new Signal()
	changeFreqVar: new Signal()
	volume: new Signal()
	frequency: new Signal()
	inverseCols: new Signal()
	makeSpecial: new Signal()
	makeShape: new Signal()
	showText: new Signal()
	showIllustration: new Signal()
	filter: new Signal()
	transform: new Signal()
	angela: new Signal()
	squishy: new Signal()
}



w = document.getElementById('leftMagic').clientWidth
h = document.getElementById('leftMagic').clientHeight

leftCv = document.getElementById 'leftMagic'
leftCv.width = w
leftCv.height = h
leftCtx = leftCv.getContext '2d'

rightCv = document.getElementById 'rightMagic'
rightCv.width = w
rightCv.height = h
rightCtx = rightCv.getContext '2d'

leftDiv = document.getElementById 'leftDiv'
rightDiv = document.getElementById 'rightDiv'

leftFX = null
rightFX = null

beatCount = 0

window.audioAnalysisEngine = new window.AudioAnalysisEngine()

$('body').click ->
	console.log '???'
	document.getElementById('fullscreen').webkitRequestFullScreen()

setupMic = (stream) ->
	console.log 'accepted mic'

onError = (err) ->
	console.log 'error setting up mic'

switchFX = =>
	console.log 'switch'

	leftOrRight = null
	FX = null
	ctxOrDiv = null

	rand = Math.ceil Math.random()*2

	if rand is 1
		leftOrRight = 'left'
	else
		leftOrRight = 'right'

	rand = Math.ceil Math.random()*7
	console.log rand, 'rand'

	switch rand
		when 1
			FX = window.HorizontalLinesUp
			if leftOrRight is 'left'
				ctxOrDiv = leftCtx
			else
				ctxOrDiv = rightCtx
		when 2
			FX = window.HorizontalLinesDown
			if leftOrRight is 'left'
				ctxOrDiv = leftCtx
			else
				ctxOrDiv = rightCtx
		when 3
			FX = window.ScrollTextParagraph
			if leftOrRight is 'left'
				ctxOrDiv = leftDiv
			else
				ctxOrDiv = rightDiv
		when 4
			FX = window.ScrollTextLarge
			if leftOrRight is 'left'
				ctxOrDiv = leftDiv
			else
				ctxOrDiv = rightDiv
		when 5
			FX = window.Noise
			if leftOrRight is 'left'
				ctxOrDiv = leftCtx
			else
				ctxOrDiv = rightCtx
		when 6
			FX = window.Counter
			if leftOrRight is 'left'
				ctxOrDiv = leftDiv
			else
				ctxOrDiv = rightDiv
		when 7
			FX = window.WhiteRedFlash
			if leftOrRight is 'left'
				ctxOrDiv = leftDiv
			else
				ctxOrDiv = rightDiv
		when 8
			FX = window.SpinningCube
			if leftOrRight is 'left'
				ctxOrDiv = leftCv
			else
				ctxOrDiv = rightCv

	if leftOrRight is 'left'
		leftFX.remove()
		leftFX = null
		leftFX = new FX ctxOrDiv, w, h
	else
		rightFX.remove()
		rightFX = null
		rightFX = new FX ctxOrDiv, w, h

onPeak = (type) ->
	if type isnt 'hard'
		return

	beatCount += 1
	leftFX.onBeat()
	rightFX.onBeat()
	if beatCount % 10 is 0
		switchFX()



$ ->
	window.events.peak.add onPeak

	navigator.webkitGetUserMedia
			audio: true
		,window.audioAnalysisEngine.setupMic, onError

	leftFX = new window.SpinningCube leftCv, w, h
	rightFX = new window.ScrollTextParagraph rightDiv, w, h
