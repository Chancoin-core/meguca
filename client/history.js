/*
 * Inter board/page/thread navigation with HTML5 history
 */

var $ = require('jquery'),
	Extract = require('./extract'),
	main = require('./main'),
	scroll = require('./scroll'),
	state = require('./state');

// Click handler for post/thread/board links
main.$doc.on ('click', 'a.history', function(event) {
	readingSteiner(this.href, event, true);
});

// Navigate to the URL
function readingSteiner(url, event, needPush) {
	var nextState = state.read(url);
	// Does the link point to the same page as this one?
	if (JSON.stringify(nextState) == JSON.stringify(state.page.attributes))
		return;
	if (event)
		event.preventDefault();

	// Deal with hashes and query strings
	var split = url.split('#'),
		address = split[0] + (/\?/.test(split[0]) ? '&' : '?') + 'minimal=true';
	if (split.length !== 1)
		address += '#' + split[1];

	/*
	 * Fetch new DOM from the server
	 *
	 * Decided to go with a non-caching approach and instead relly on etags and
	 * CDN for HTML-only caching. This solution is already very fast on threads
	 * that are not several thousand posts large.
	 */
	var $loading = $('#loadingImage').show();
	$.get(address, function(data) {
		if (!data)
			return alert('Fetch failed: ' + url);

		// Apply new state and DOM
		state.replace(nextState, function() {
			main.$threads.html(data);
			new Extract();
		});
		if (needPush){
			history.pushState(null, null, url);
			// Scroll to top on new pages with no hashes
			if (!location.hash)
				window.scrollTo(0, 0);
			else
				scroll.aboveBanner();
		}
		$loading.hide();
	});
}

// For back and forward history events
window.onpopstate = function(event) {
	readingSteiner(event.target.location.href);
	scroll.aboveBanner();
};