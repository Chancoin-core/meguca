// Selects and loads the client files and polyfills, if any

(function () {
	// Check if the client is an automated crawler
	var isBot,
		botStrings = [
			"bot", "googlebot", "crawler", "spider", "robot", "crawling"
		]
	for (var i = 0; i < botStrings.length; i++) {
		if (navigator.userAgent.indexOf(botStrings[i]) !== -1) {
			isBot = true
			break
		}
	}

	// Display mature content warning
	if (!isBot && config.mature && !localStorage.getItem("termsAccepted")) {
		var confirmText =
			"To access this website you understand and agree to the following:\n\n"
			+ "1. The content of this website is for mature audiences only and may not be suitable for minors. If you are a minor or it is illegal for you to access mature images and language, do not proceed.\n\n"
			+ "2. This website is presented to you AS IS, with no warranty, express or implied. By proceeding you agree not to hold the owner(s) of the website responsible for any damages from your use of the website, and you understand that the content posted is not owned or generated by the website, but rather by the website's users."
		if (!confirm(confirmText)) {
			location.href = "http://www.gaiaonline.com/"
			return
		}

		localStorage.setItem("termsAccepted", "true")
	}

	// Tests that can not be compensated by polyfills
	var strictTests = [
		// Arrow functions
		'return (()=>5)()===5;',

		// Block scoped const
		'"use strict";  const bar = 123; {const bar = 456;} return bar===123;',

		// Block-scoped let
		'"use strict"; let bar = 123;{ let bar = 456; }return bar === 123;',

		// Computed object properties
		"var x='y';return ({ [x]: 1 }).y === 1;",

		// Shorthand object properties
		"var a=7,b=8,c={a,b};return c.a===7 && c.b===8;",

		// Template strings
		'var a = "ba"; return `foo bar${a + "z"}` === "foo barbaz";',

		// for...of
		'var arr = [5]; for (var item of arr) return item === 5;',

		// Spread operator
		'return Math.max(...[1, 2, 3]) === 3',

		// Class statement
		'"use strict"; class C {}; return typeof C === "function"',

		// Super call
		'"use strict"; var passed = false;'
		+ 'class B {constructor(a) {  passed = (a === "barbaz")}};'
		+ 'class C extends B {constructor(a) {super("bar" + a)}};'
		+ 'new C("baz"); return passed;',

		// Default parameters
		'return (function (a = 1, b = 2) { return a === 3 && b === 2; }(3));',

		// Destructuring declaration
		'var [a,,[b],c] = [5,null,[6]];return a===5 && b===6 && c===undefined',

		// Parameter destructuring
		'return function([a,,[b],c]){return a===5 && b===6 && c===undefined;}'
		+ '([5,null,[6]])',

		// Generators
		'function * generator(){yield 5; yield 6};'
		+ 'var iterator = generator();'
		+ 'var item = iterator.next();'
		+ 'var passed = item.value === 5 && item.done === false;'
		+ 'item = iterator.next();'
		+ 'passed &= item.value === 6 && item.done === false;'
		+ 'item = iterator.next();'
		+ 'passed &= item.value === undefined && item.done === true;'
		+ 'return passed;'
	]

	var legacy,
		scriptCount = 0,
		polyfills = []
	var kys = "Please consider installing the latest stable version of "
		+ "one these alternatives: "
		+ "Google Chrome, Chromium, Mozilla Firefox, Opera, "
		+ "Microsoft Edge or Safari."
	var kysMobile = "Please install the latest version of Chrome for Android or"
		+ "upgrade your iOS or Windows Mobile operating system."

	for (var i = 0; i < strictTests.length; i++) {
		if (!check(strictTests[i])) {
			var text = "Your browser is too outdated. "
				+ (isMobile ? kysMobile : kys)
			alert(text)
			return
		}
	}

	// Fetch API
	if (!checkFunction("window.fetch")) {
		polyfills.push('vendor/fetch')
	}

	var DOMMethods = [
		// DOM level 4 methods
		'Element.prototype.remove',

		// DOM 3 query methods
		'Element.prototype.querySelector',
		'Element.prototype.querySelectorAll'
	]
	var DOMUpToDate = true
	for (var i = 0; i < DOMMethods.length; i++) {
		if (!checkFunction(DOMMethods[i])) {
			polyfills.push('vendor/dom4')
			DOMUpToDate = false
			break
		}
	}

	// Iterable NodeList
	if (!checkFunction('NodeList.prototype[Symbol.iterator]')) {
		NodeList.prototype[Symbol.iterator] = Array.prototype[Symbol.iterator]
	}

	// Minimalistic DOM polyfill for modern browsers
	if (DOMUpToDate) {
		polyfills.push('scripts/polyfill')
	}

	// Stdlib functions and methods
	var stdlibTests = [
		"Set",
		"Map",
		'Promise',
		'Proxy',
		"Array.from",
		'Array.prototype.includes',
		"String.prototype.includes"
	]
	for (var i = 0; i < stdlibTests.length; i++) {
		if (!checkFunction(stdlibTests[i])) {
			polyfills.push("vendor/core.min")
			break
		}
	}

	var head = document.getElementsByTagName('head')[0]

	// Load appropriate language pack
	scriptCount++
	var xhr = new XMLHttpRequest()
	var langPath = '/assets/lang/'
		+ (localStorage.lang || config.defaultLang)
		+ '/main.json'
	xhr.open('GET', langPath)
	xhr.responseType = 'json'
	xhr.onload = function () {
		if (this.status !== 200) {
			throw new Error("Error fetching language pack: " + this.status)
		}
		window.lang = this.response
		checkAllLoaded()
	}
	xhr.send()

	for (var i = 0; i < polyfills.length; i++) {
		scriptCount++
		var script = document.createElement('script')
		script.type = 'text/javascript'
		script.src = '/assets/js/' + polyfills[i] + '.js'
		script.onload = checkAllLoaded
		head.appendChild(script)
	}

	// Check for browser compatibility by trying to detect some ES6 features
	function check(func) {
		try {
			return eval('(function(){' + func + '})()')
		}
		catch (e) {
			return false
		}
	}

	// Check if a browser API function is defined
	function checkFunction(func) {
		try {
			return typeof eval(func) === 'function'
		}
		catch (e) {
			return false
		}
	}

	function checkAllLoaded() {
		// This function might be called multiple times. Only load the client,
		// when all polyfills are loaded.
		if (--scriptCount === 0) {
			loadClient()
		}
	}

	function loadClient() {
		System.config({
			baseURL: '/assets/js',
			defaultJSExtensions: true,
			meta: {
				"es6/*": {
					format: "register"
				}
			}
		})

		System.import('es6/main').catch(function (err) {
			alert(err)
			throw err
		})

		// Web Crypto API polyfill
		if (!checkFunction("window.crypto.subtle.digest")) {
			System.import("es6/sha1")
		}

		if ('serviceWorker' in navigator) {
			navigator.serviceWorker
				.register("/worker.js")
				.catch(function (err) {
					throw err
				})
		}
	}
})()
