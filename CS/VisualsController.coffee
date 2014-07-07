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

$ ->

	leftFX = new window.HorizontalLinesUp leftCtx, w, h
	rightFX = new window.ScrollTextParagraph rightDiv, w, h

	setInterval ->
			leftFX.onBeat()
			rightFX.onBeat()
	, 500
