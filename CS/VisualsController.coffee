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
leftDiv = document.getElementById 'rightDiv'

leftFX = null
rightFX = null

$ ->

	leftFX = new window.Noise leftCtx, w, h
	rightFX = new window.HorizontalLinesDown rightCtx, w, h

	setInterval ->
			leftFX.remove()
			rightFX.onBeat()
	, 2000