// A watered down version of https://github.com/WebReflection/dom4, so we don't
// have to load the entire thing for up to date Chrome and Firefox.

(function () {
"use strict"

const nodeExtends = {
	before(...nodes) {
		if (this.parentNode) {
			this.parentNode.insertBefore(mutationMacro(...nodes), this)
		}
	},

	after(...nodes) {
		this.parentNode.insertBefore(mutationMacro(...nodes), this.nextSibling)
	},

	replaceWith(...nodes) {
		if (this.parentNode) {
			this.parentNode.replaceChild(mutationMacro(...nodes), this)
		}
	},

	append(...nodes) {
		this.appendChild(mutationMacro(...nodes))
	},

	prepend(...nodes) {
		const firstChild = this.firstChild,
			newNode = mutationMacro(...nodes)
		if (firstChild) {
			this.insertBefore(newNode, firstChild)
		} else {
			this.appendChild(newNode)
		}
	}
}

for (let method in nodeExtends) {
	if (Node.prototype[method] === undefined) {
		Node.prototype[method] = nodeExtends[method]
	}
}

function mutationMacro(...nodes) {
	if (nodes.length === 1) {
		return textNodeIfString(nodes[0])
	}

	const fragment = document.createDocumentFragment()
	for (let node of nodes) {
		fragment.appendChild(textNodeIfString(node))
	}
	return fragment
}

function textNodeIfString(node) {
	if (typeof node === 'string') {
		return document.createTextNode(node)
	}
	return node
}

})()
