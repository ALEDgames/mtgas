// Card list editor
function card_list_edit_n_bottom(zone, dest) {
	var n = prompt_int('How many cards to look ?', 3) ;
	if ( isn(n) && ( n != 0 ) ) {
		n = - n ;
		return card_list_edit(zone, dest, n) ;
	} else
		return n ;
}
function card_list_edit_n(zone, dest, bottom) {
	var n = prompt_int('How many cards to look ?', 3) ;
	if ( isn(n) && ( n != 0 ) )
		return card_list_edit(zone, dest, n) ;
	else
		return n ;
}
function card_list_edit(zone, dest, n) {
	// Unicity
	if ( zone.editor_window != null ) {
		game.infobulle.set('Already open : '+zone.get_name()) ;
		return false ;
	}
	// Dest
	if ( ( ! dest ) || ( dest == null ) )
		if ( zone.type == 'battlefield' )
			dest = zone.player.graveyard ;
		else
			dest = zone.player.battlefield ;
	// Message + first displayed card
	zone.editor_window = document.createElement('div') ;
	var m = 'looks at ' ;
	if ( isn(n) ) { // If user wants to watch only top N cards
		if ( n == 0 ) {
			zone.editor_window.close() ;
			return false ;
		} else {
			if ( n > 0 ) {
				m += ' top '+n+' cards of ' ;
				zone.editor_window.firstcard = zone.cards[zone.cards.length-n-1] ; // Remember the first card the list shouldn't display
			} else {
				m += ' bottom '+(-n)+' cards of ' ;
				zone.editor_window.firstcard = zone.cards[-n] ; // Remember the first card the list shouldn't display
			}
		}
	}
	m += zone.player.name+'\'s '+zone.type ;
	if ( spectactor )
		message(game.spectactors[spectactor_id].name+' '+m) ;
	else
		message_send(m) ;
	// Display
	var ol = game.player.lists_opened() + game.opponent.lists_opened() ;
	zone.editor_window.style.right = (300 * ol ) + 'px' ;
	zone.editor_window.classList.add('cardlist') ;
	zone.editor_window.zone = zone.toString() ;
	zone.editor_window.dest = dest.toString() ;
	zone.editor_window.n = n ;
	zone.editor_window.close = function() {
		var div = this ;
		var zone = eval(div.zone) ;
		zone.editor_window = null ;
		div.parentNode.removeChild(div) ;
		m = 'stops looking at '+zone.player.name+'\'s '+zone.type ;
		if ( spectactor )
			message(game.spectactors[spectactor_id].name+' '+m) ;
		else
			message_send(m) ;
		for ( var i = 0 ; i < zone.cards.length ; i++ ) {
			zone.cards[i].watching = false ; // Reinit watching for all cards in watched zone
			zone.cards[i].load_image() ;
		}
		if ( tmp.checked )
			zone.shuffle() ;
		zone.refresh() ;
	}
		// Header
	var listtool = document.createElement('div') ;
	listtool.classList.add('listtool') ;
	zone.editor_window.appendChild(listtool) ;
			// Button close
	var but_close = create_button('X', function(ev) {
		ev.target.parentNode.parentNode.close() ;
	}, 'Close list', 'but_close') ;
	zone.editor_window.appendChild(but_close) ;
	listtool.appendChild(but_close) ;
			// Title
	var wintitle = zone.get_name() ;
	if ( isn(zone.editor_window.n) ) // If user wants to watch only top N cards
		if ( zone.editor_window.n > 0 )
			wintitle = 'Top '+zone.editor_window.n+' cards of ' + wintitle ;
		else
			wintitle = 'Bottom '+(zone.editor_window-zone.editor_window.n)+' cards of ' + wintitle ;
	var title = create_div(wintitle) ;
	title.title = wintitle+' (drag to move)' ;
	listtool.appendChild(title) ;
	title.draggable = true ;
	function draglist(ev) {
		var offset = parseInt(ev.dataTransfer.getData('offset')) ;
		var left = ev.clientX - offset ;
		ev.dataTransfer.mozSourceNode.parentNode.parentNode.style.left = left + 'px' ;
		return eventStop(ev) ;
	}
	title.addEventListener('dragstart', function(ev) {
		window.addEventListener('dragover', draglist, false) ;
		var c = ev.currentTarget.parentNode.parentNode.getBoundingClientRect() ;
		var offset = ev.clientX - c.left ;
		ev.dataTransfer.clearData() ; // Remove all data auto-generated by browser
		ev.dataTransfer.setData('offset', offset) ;
		return false ;
	}, false) ;
	title.addEventListener('dragend', function(ev) {
		window.removeEventListener('dragover', draglist, false) ;
	}, false) ;
			// Shuffle checkbox
	var checked = ( ( zone.type == 'library' ) && ( ! zone.editor_window.firstcard ) ) ;
	var tmp = create_checkbox('shuffle', checked, 'shuffle', '') ;
	var check_shuffle = create_label(tmp.id, tmp, document.createTextNode('Shuffle')) ;
	check_shuffle.title = 'Shuffle '+zone.type+' when closing this list' ;
	listtool.appendChild(check_shuffle) ;
	if ( ! isn(zone.editor_window.n) ) {
		zone.editor_window.initial_sorting = zone.cards.join(',') ;
		var b_sort_cur = create_button('Current', function(ev) {
			var zone = eval(ev.target.parentNode.parentNode.zone) ;
			var sel = new Selection(zone.editor_window.initial_sorting) ;
			zone.cards = sel.cards ;
			refresh_list(zone, zone.cards) ;
		}, 'Sort list like zone is currently sorted') ;
		listtool.appendChild(b_sort_cur) ;
		var b_sort_deck = create_button('Deck', function(ev) {
			var zone = eval(ev.target.parentNode.parentNode.zone) ;
			zone.cards.sort(sort_deck) ;
			refresh_list(zone, zone.cards) ;
		}, 'Sort list like decklist') ;
		listtool.appendChild(b_sort_deck) ;
		var b_sort_alpha = create_button('Alphabet', function(ev) {
			var zone = eval(ev.target.parentNode.parentNode.zone) ;
			zone.cards.sort(sort_alphabet) ;
			refresh_list(zone, zone.cards) ;
		}, 'Sort list alphabetically') ;
		listtool.appendChild(b_sort_alpha) ;
	}
		// List
	var ul = document.createElement('ul') ;
	ul.id = 'cards' ;
	zone.editor_window.cardlist = ul ;
	zone.editor_window.appendChild(ul) ;
	// List filling
	zone.refresh() ; //refresh_list(zone) ;
	// Add to document
	document.body.appendChild(zone.editor_window) ;
	ul.style.height = (zone.editor_window.clientHeight-listtool.offsetHeight)+'px' ;
	return zone.editor_window ;
}
// Main function : fill list
function refresh_list(zone) {
	var editor_window = zone.editor_window ;
	var dest = eval(editor_window.dest) ;
	var myul = zone.editor_window.cardlist ;
	node_empty(myul) ;
	var cards = zone.cards ;
	// "All" element
	var myli = create_li('Uninitialized', 'all') ;
	myli.title = 'Select an action to apply to every displayed cards in list' ;
	myli.addEventListener('contextmenu', allContextMenu, false) ;
	myli.addEventListener('click', allContextMenu, false) ;
	myli.addEventListener('select', eventLog, false) ;
	var firstli = myli ;
	myul.appendChild(myli) ;
	// List
	if ( isn(editor_window.n) && ( editor_window.n < 0 ) ) // From bottom : don't display top cards until first card encountered
		var disp = false ;
	else
		var disp = true ;
	for ( var i = cards.length - 1 ; i >= 0 ; i-- ) { // From topdeck to bottomdeck
		if ( editor_window.firstcard ) // Watching top/bottom cards
			if ( editor_window.firstcard == cards[i] ) // Next display is the first not-to-display
				if ( editor_window.n < 0 ) { // From bottom
					disp = true ; // Display next cards
					continue ; // But not that one
				} else // From top
					break ; // Stop listing
		if ( ! disp )
			continue ;
		var iv = cards[i].is_visible() ; // Store value before making it visible by watching
		cards[i].watching = true ;
		if ( ! iso(cards[i].li) ) { // No cache, create element
			var myli = create_li(cards[i].get_name(), 'card') ;
			myli.thing = cards[i] ;
			if ( myli.thing.img != null && iv ) { // Use image cache
				myli.removeChild(myli.firstChild) ;
				myli.style.backgroundImage = 'url(\"'+myli.thing.img.src+'\")' ;
			} else // Load image
				myli.thing.load_image(function(img, myli) {
					myli.removeChild(myli.firstChild) ;
					myli.style.backgroundImage = 'url(\"'+img.src+'\")' ;
				}, myli) ;
			myli.addEventListener('mousedown', listMouseDown, false) ;
			myli.addEventListener('mouseup', listMouseUp, false) ;
			myli.addEventListener('mouseenter', listMouseEnter, false) ;
			myli.addEventListener('mouseleave', listMouseLeave, false) ;
			myli.addEventListener('click', eventStop, false) ;
			myli.addEventListener('dblclick', listDblClick, false) ;
			myli.addEventListener('contextmenu', listContextMenu, false) ;
			myli.title = "Double click "+cards[i].name+" to send it to "+dest.type ;
			myli.thing.li = myli ; // Cache it
		} else { // Cache exists
			myli = cards[i].li ; // Use it
			myli.className = 'card' ; // Reinit its class (dragged, draggedover status)
			myli.thing.load_image() ;
		}
		myul.appendChild(myli) ;
	}
	if ( isn(editor_window.n) ) {
		if ( editor_window.n < 0 ) // From bottom
			var nb = - editor_window.n ;
		else
			var nb = cards.length - i - 1 ;
	} else
		var nb = cards.length ;
	firstli.textContent = 'On displayed '+nb+' cards ...' ;
}
// Events functions
function listMouseDown(ev) {
	var li = ev.target ;
	var card = li.thing ;
	switch ( ev.button ) {
		case 0 : // Left click
			game.selected.set(card) ;
			drag_init(card) ;
			drag_start() ;
			li.classList.add('dragged') ;
			return eventStop(ev) ; // In div/ul/li, default mousedown action is start text selection, don't want that
			break ;
		case 1 : // Middle button click
			break ;
		case 2 : // Right click
			break ;
	}
}
function listMouseUp(ev) {
	switch ( ev.button ) {
		case 0 : // Left click
			if ( game.drag != null ) {
				var from = game.drag ; // Dragged card
				var to = ev.target.thing ; // Dropped on
				var idx = to.IndexInZone() ;
				if ( from.zone == to.zone )
					from.moveinzone(idx) ;
				else if ( game.drag != null ) {
					idx++ ;
					game.selected.changezone(to.zone, null, idx) ;
				}
				if ( game.drag.li )
					game.drag.li.classList.remove('dragged') ;
				ev.target.classList.remove('draggedover') ;
				drag_stop() ;
			}
			break ;
		case 1 : // Middle button click
			break ;
		case 2 : // Right click
			break ;
	}
}
function listMouseEnter(ev) { // MouseEnter : update "zoom"
	var card = ev.target.thing ;
	card.zoom() ;
	if ( game.drag != null )
		ev.target.classList.add('draggedover') ;
}
function listMouseLeave(ev) { // MouseLeave : cleanup
	ev.target.classList.remove('draggedover') ;
	return eventStop(ev) ;
}
function listDblClick(ev) { // Double click : send to BF
	game.selected.set(ev.target.thing) ;
	var dest = eval(ev.target.parentNode.parentNode.dest) ;
	var visible = null ; // Set to default visibility (not forced true) in order not to sync in default case
	if ( ev.ctrlKey || ev.altKey || ev.shiftKey )
		visible = false ;
	game.selected.changezone(dest, visible) ;
	draw() ;
}
function listContextMenu(ev) {
	var card = ev.target.thing ;
	var menu = new menu_init(card) ;
	card.changezone_menu(menu, card) ;
	menu.addline('Shuffle and put on top', function(card) {
		card.zone.editor_window.close() ;
		card.moveinzone(card.zone.cards.length) ;
	}, card) ;
	menu.addline() ;
	if ( card.is_visible() ) {
		menu.addline('Informations (offsite)', card.info) ;
		menu.addline('Internals (debug)', function(card) {
			log2(this) ;
			log2(this.attrs) ;
		}) ;
	} else
		menu.addline('No information aviable from hidden card') ;
	return menu.start(ev) ;
}
function allContextMenu(ev) {
	var mycard = ev.target.nextSibling.thing ; // All is based on first card
	var menu = new menu_init(mycard) ;
	if ( ! mycard )
		menu.addline('No cards in list') ;
	else {
		if ( mycard.zone != mycard.owner.hand )
			menu.addline('To hand',		allContextAction,	mycard.owner.hand, ev) ;
		if ( mycard.zone != mycard.owner.battlefield )
			menu.addline('To battlefield',	allContextAction,	mycard.owner.battlefield, ev) ;
		if ( mycard.zone != mycard.owner.library ) {
			menu.addline('To top deck',	allContextAction,	mycard.owner.library, ev) ;
			menu.addline('To bottom deck',	allContextAction,	mycard.owner.library, ev, 0) ;
		} else { // If we are in a deck edit, it's full or only top, the only interesting action is bottom
			menu.addline('To bottom deck',	allContextAction,	mycard.owner.library, ev, 0) ;
		}
		if ( mycard.zone != mycard.owner.graveyard )
			menu.addline('To graveyard',	allContextAction,	mycard.owner.graveyard, ev) ;
		if ( mycard.zone != mycard.owner.exile )
			menu.addline('To exile',	allContextAction,	mycard.owner.exile, ev) ;
	}
	return menu.start(ev) ;
}
function allContextAction(zone, ev, index) {
	// Get all displayed cards
	var li = ev.target ;
	var arr = new Array() ;
	while ( ( li.nextSibling != null ) && ( li.nextSibling.className == 'card' ) ) {
		li = li.nextSibling ;
		arr.push(li.thing) ;
	}
	// Apply action
	var sel = new Selection(arr) ;
	if ( sel.zone == zone )
		sel.moveinzone(index) ;
	else
		sel.changezone(zone, null, index) ;
}
