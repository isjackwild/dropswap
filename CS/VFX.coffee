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
			if @_ticker
				clearInterval @_ticker
			@_el.clearRect 0,0,@_w,@_h
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
		@_stripes.pop
		@_stripes.unshift col

class window.HorizontalLinesUp extends window.HorizontalLines
	shiftStripes: ->
		col = (Math.random() > 0.49) ? "white" : "black"
		@_stripes.shift
		@_stripes.push col

class window.Counter extends VisualEffect
	constructor: ->
		super
		span = document.createElement('span')
		span.className = 'counter'
		@_el.appendChild span
		@_el.children[0].innerHTML = @_step
		@_el.classList.add 'blackBg'

	onBeat: ->
		super
		$('.counter')
		@_el.classList.remove 'blackBg'
		setTimeout =>
			@_el.classList.add 'blackBg'
		,30
		@_el.children[0].innerHTML = @_step % 10
