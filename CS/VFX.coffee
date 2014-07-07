class VisualEffect
	_el: null
	_w: null
	_h: null
	_step: 0
	_speed: 5 #set this with the BPM event eventually, normalize to 1...10
	_ticker: undefined
	
	constructor: (el, w, h) ->
		@_el = el
		@_w = w
		@_h = h
		@render()

	render: ->

	onBeat: ->
		@_step += 1

	remove: ->
		if @_el.canvas
			@_el.clearRect 0,0,@_w,@_h
		if @_ticker
			clearInterval @_ticker
		while @_el.firstChild
			@_el.removeChild @_el.firstChild
		delete this



class window.Noise extends VisualEffect

	constructor: ->
		super
		@_ticker = setInterval =>
			@render()
		,77

	render: ->
		image = @_el.createImageData @_w, @_h
		buffer32 = new Uint32Array image.data.buffer
		length = buffer32.length

		for i in [0...length]
			buffer32[i] = ((255 * Math.random()) | 0) << 24

		@_el.putImageData image, 0, 0

class window.HorizontalLines extends VisualEffect
	_stripes: []

	constructor: ->
		super
		for i in [0...@_h]
			if Math.random() > 0.5 then col = 'white' else col = 'black'
			if Math.random() > 0.99 then col = 'red'
			@_stripes.push col
		@_ticker = setInterval =>
			@render()
		,50

	render: ->
		@_el.save()
		@_el.translate 0.5, 0.5

		for i in [0...@_h]
			@_el.beginPath()
			@_el.strokeStyle = @_stripes[i]
			@_el.moveTo 0, i
			@_el.lineTo @_w, i
			@_el.stroke()

		@_el.restore()
		@shiftStripes()

class window.HorizontalLinesDown extends window.HorizontalLines
	shiftStripes: ->
		if Math.random() > 0.5 then col = 'white' else col = 'black'
		if Math.random() > 0.99 then col = 'red'
		@_stripes.pop()
		@_stripes.unshift col

class window.HorizontalLinesUp extends window.HorizontalLines
	shiftStripes: ->
		if Math.random() > 0.5 then col = 'white' else col = 'black'
		if Math.random() > 0.99 then col = 'red'
		@_stripes.shift()
		@_stripes.push col

class window.Counter extends VisualEffect
	constructor: ->
		super
		wrapper = document.createElement 'div'
		wrapper.className = 'counter'
		@_el.appendChild wrapper
		@_el.classList.add 'blackBg'
		for i in [0...15]
			pixel = document.createElement 'div'
			pixel.className = 'pixel p' + i
			wrapper.appendChild pixel
		$('.p0, .p1, .p2, .p3, .p5, .p6, .p8, .p9, .p11, .p12, .p13, .p14').addClass 'on'

	onBeat: ->
		super
		@_el.classList.remove 'blackBg'
		@_flashTimer = setTimeout =>
			@_el.classList.add 'blackBg'
		,30
		$('.pixel').removeClass 'on'
		$('.pixel').removeClass 'red'
		switch @_step % 10
			when 0
				$('.p0, .p1, .p2, .p3, .p5, .p6, .p8, .p9, .p11, .p12, .p13, .p14').addClass 'on'
			when 1
				$('.p0, .p1, .p4, .p7, .p10, .p12, .p13, .p14').addClass 'on'
			when 2
				$('.p0, .p1, .p2, .p5, .p7, .p9, .p12, .p13, .p14').addClass 'on'
			when 3
				$('.p0, .p1, .p2, .p5, .p7, .p8, .p11, .p12, .p13, .p14').addClass 'on'
			when 4
				$('.p0, .p2, .p3, .p5, .p6, .p7, .p8, .p11, .p14').addClass 'on'
			when 5
				$('.p0, .p1, .p2, .p3, .p6, .p7, .p8, .p11, .p12, .p13, .p14').addClass 'on'
			when 6
				$('.p0, .p1, .p2, .p3, .p6, .p7, .p8, .p9, .p11, .p12, .p13, .p14').addClass 'on'
			when 7
				$('.p0, .p1, .p2, .p5, .p8, .p11, .p14').addClass 'on'
			when 8
				$('.p0, .p1, .p2, .p3, .p5, .p6, .p7, .p8, .p9, .p11, .p12, .p13, .p14').addClass 'on'
			when 9
				$('.p0, .p1, .p2, .p3, .p5, .p6, .p7, .p8, .p11, .p12, .p13, .p14').addClass 'on'
		
		if Math.random() > 0.5
			redPixel = Math.ceil Math.random()*14
			redPixel = ".p"+redPixel
			if $(redPixel).hasClass 'on'
				$(redPixel).addClass 'red'

	remove: ->
		super
		clearTimeout @_flashTimer
		@_el.classList.remove 'blackBg'

class window.WhiteRedFlash extends VisualEffect
	constructor: ->
		super
		@_el.classList.add 'whiteRedFlash'

	onBeat: ->
		super
		@_el.classList.remove 'fadeOut'
		@_el.classList.add 'redBg'
		@_flashTimeout = setTimeout =>
			@_el.classList.add 'fadeOut'
			@_el.classList.remove 'redBg'
		,25

	remove: =>
		super
		clearTimeout @_flashTimeout
		@_el.classList.remove 'whiteRedFlash'

class window.ScrollText extends VisualEffect
	_ledPadding: 1
	_displayWidth: null
	_message: new Array()

	onOff: (led, onOff) ->
		div = document.getElementById(led)
		if onOff is 'on'
			div.classList.add 'on'
		else if onOff is 'off'
			div.classList.remove 'on'

	setMessage: (msg) ->
		msg = msg.toUpperCase()
		for i in [0...msg.length]
			char = msg.substr i, 1
			if char is '0' or char is '1' or char is '2' or char is '3' or char is '4' or char is '5' or char is '6' or char is '7' or char is '8' or char is '9'
				char = 'n'+char
			@addChar char

	addChar: (char) =>
		if window.msg[char]
			for x in [0...window.msg[char].length]
				@_message.push window.msg[window.msg[char][x]]
			@_message.push window.msg[0]

	onBeat: ->
		super
		if @_step > @_message.length
			@_step = 0

		partialMessage = @_message.slice @_step, @_step+@_displayWidth
		for x in [0...partialMessage.length]
			for y in [0...partialMessage[x].length]
				if partialMessage[x][y] is 1
					@onOff 'c'+x+'p'+y+'', 'on'
				else
					@onOff 'c'+x+'p'+y+'', 'off'

class window.ScrollTextLarge extends window.ScrollText
	constructor: ->
		super
		@_displayWidth = Math.ceil @_w / (@_h/6) + 1
		wrapper = document.createElement 'div'
		wrapper.className = 'ScrollTextLarge'
		@_el.appendChild wrapper
		for i in [0...@_displayWidth]
			col = document.createElement 'div'
			col.className = 'col c' + i
			col.style.width = @_h / 6
			wrapper.appendChild col
			for x in [0...6]
				pixel = document.createElement 'div'
				pixel.id = 'c' + i + 'p' + x
				pixel.className = 'pixel'
				col.appendChild pixel
		#would be cool if it was a random sentence from the article
		@setMessage ' Endorphins ("endogenous morphine") are endogenous opioid inhibitory neuropeptides. They are produced by the central nervous system and pituitary gland.'

class window.ScrollTextParagraph extends window.ScrollText
	_numRows: 10

	constructor: ->
		super
		@_displayWidth = Math.ceil @_w / (@_h / @_numRows / 6 )
		#will need to * displaywidth by numrows for the splice stuff
		wrapper = document.createElement 'div'
		wrapper.className = 'ScrollTextParagraph'
		@_el.appendChild wrapper
		colNum = 0
		for i in [0...@_numRows]
			row = document.createElement 'div'
			row.className = 'row r' + i
			row.style.height = @_h / @_numRows
			wrapper.appendChild row
			for x in [0...@_displayWidth]
				col = document.createElement 'div'
				col.className = 'col c' + colNum
				col.style.width = (@_h / 6) / @_numRows
				row.appendChild col
				for y in [0...6]
					pixel = document.createElement 'div'
					pixel.id = 'c' + colNum + 'p' + y
					pixel.className = 'pixel'
					col.appendChild pixel
				colNum += 1
		@setMessage ' Endorphins ("endogenous morphine") are endogenous opioid inhibitory neuropeptides. They are produced by the central nervous system and pituitary gland. Endorphins ("endogenous morphine") are endogenous opioid inhibitory neuropeptides. They are produced by the central nervous system and pituitary gland. Endorphins ("endogenous morphine") are endogenous opioid inhibitory neuropeptides. They are produced by the central nervous system and pituitary gland.'

	onBeat: ->
		# super
		@_step += 1
		if @_step > @_message.length
			@_step = 0

		partialMessage = @_message.slice @_step, @_step+(@_displayWidth * 10)
		console.log @_message.length, partialMessage.length
		console.log partialMessage
		for x in [0...partialMessage.length]
			if partialMessage[x] #find out the problem here... maybe some hidden character not recognised. 
				for y in [0...partialMessage[x].length]
					if partialMessage[x][y] is 1
						@onOff 'c'+x+'p'+y+'', 'on'
					else
						@onOff 'c'+x+'p'+y+'', 'off'









