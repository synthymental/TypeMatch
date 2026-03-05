import { CavalryPlayer } from './CavalryPlayer.js'

async function loadFont() {

	const font = new FontFace(
		"ES Rebond Grotesque",
		"url(./ESRebondGrotesque-Medium.ttf)"
	)

	await font.load()
	document.fonts.add(font)
	await document.fonts.ready

	console.log("Font loaded")

}

async function initialise() {

	const container = document.getElementById('player')

	try {

		if (!container) {
			throw new Error('Missing div element with id "player"')
		}

		await loadFont()

		const player = new CavalryPlayer(container)

		const response = await fetch('./Celebration.cv')

		if (!response.ok) {
			throw new Error(`Failed to load scene "${response.statusText}"`)
		}

		const scene = await response.arrayBuffer()

		await player.loadScene(new Uint8Array(scene), 'Celebration.cv')

		document.getElementById('loading')?.remove()

		console.log('Cavalry Player ready')

	} catch (error) {

		console.error(error)

		const loading = document.getElementById('loading')
		if (loading) {
			loading.innerText = 'Ошибка. Проверь консоль.'
		}

	}

}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initialise)
} else {
	initialise()
}