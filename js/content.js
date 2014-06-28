var _playerOriginalWidth = 0;
var _playerOriginalHeight = 0;
var _port = chrome.runtime.connect({ name: 'fullscreen-messaging' });
var visibleElements = [];
var treeToPlayer = [];
var treeStyles = [];
var playerContainerCss = {};
var isFullscreen = false;

_port.onMessage.addListener(function(message, sender) {
	if(message.event == 'fullscreen-request') {
		var $fullscreenContainer = $('.tv2-play-fullscreen-extension');
		var $playerContainer = $('.r7-video-player');
		var canGoFullscreen = $fullscreenContainer.length == 0 && $playerContainer.length > 0;
		_port.postMessage({ response: canGoFullscreen, event: 'fullscreen-request' });
		$(window).on('resize', updatePlayerSize);
	} else if(message.event == 'fullscreen-on') {
		isFullscreen = true;
		enterFullscreen();
		$(window).on('resize', postCheckFullscreen);
	} else if(message.event == 'fullscreen-off') {
		$(window).off('resize', postCheckFullscreen);
		$(window).off('resize', updatePlayerSize);
		exitFullscreen();
		isFullscreen = false;
	}
});

key('esc', function() {
	if(isFullscreen) {
		_port.postMessage({event: 'fullscreen-off'});
	};
});

function enterFullscreen() {
	if($('.tv2-play-fullscreen-extension').length > 0) {
		updatePlayerSize();
		return;
	}
	
	visibleElements = [];
	treeToPlayer = [];
	treeStyles = [];

    hideNonPlayerNodes($('body'), treeToPlayer, visibleElements);
	var $supportBadge = $('a[href="http://kundeservice.tv2.dk"]');
	visibleElements.push($supportBadge);
	$supportBadge.hide();
    for(var i = 0; i < treeToPlayer.length; i++) {
        var $node = $(treeToPlayer[i]);

        treeStyles.push(getStyles($node));
        $node.css({
            'margin': '0',
            'padding': '0',
            'width': 'auto',
            'height': 'auto',
            'position': 'static'
        });
    };
	
	var $playerContainer = $('.r7-video-player');
	$playerContainer.addClass('tv2-play-fullscreen-extension');
	playerContainerCss = getStyles($playerContainer);
	$playerContainer.css({
		'position': 'absolute',
		'top': '0',
		'bottom': '0',
		'right': '0',
		'left': '0',
		'margin': '0',
		'padding': '0'
	});
	
	updatePlayerSize();
}

function exitFullscreen() {
	var $container = $('.tv2-play-fullscreen-extension');
	if($container.length == 0) {
		return;
	}
	
	var $player = $('.tv2-play-fullscreen-extension > object');
	$player.attr('width', _playerOriginalWidth);
	$player.attr('height', _playerOriginalHeight);
	var $playerContainer = $('.r7-video-player');
	$playerContainer.removeClass('tv2-play-fullscreen-extension');
	playerContainerCss += ' z-index: 9999';
    addStyles($playerContainer, playerContainerCss);
    for(var i = 0; i < treeToPlayer.length; i++) {
        var $node = treeToPlayer[i];
        if($node.attr('style').length > 0) {
			$node.removeAttr('style');
		}
        addStyles($node, treeStyles[i]);
    };

    for(var j = 0; j < visibleElements.length; j++) {
        var $elm = $(visibleElements[j]);
        $elm.show();
    };
}

function updatePlayerSize() {
	var $win = $(window);
	var w = $win.outerWidth();
	var h = $win.outerHeight() - 4;
	
	var $container = $('.tv2-play-fullscreen-extension');
	if($container.length === 0) {
		return;
	}
	
	$container.css({
		'width': w + 'px',
		'height': h + 'px'
	});
	var $player = $container.find('object');
	if(_playerOriginalWidth === 0 && _playerOriginalHeight === 0) {
		_playerOriginalWidth = $player.attr('width');
		_playerOriginalHeight = $player.attr('height');
	}
	
	$player.attr('height', h);
	$player.attr('width', w);
}

function postCheckFullscreen() {
	_port.postMessage({event: 'check-window-state'});
}

function hideNonPlayerNodes($node, playerStack, visualStack) {
	var $children = $node.children();
    $children.each(function(idx, child) {
		var $child = $(child);
		if($child.length > 0) {
			var $player = $child.find('.r7-video-player');
			if($player.length > 0) {
                playerStack.push($child);
				hideNonPlayerNodes($child, playerStack, visualStack);
			} else if(!$child.hasClass('r7-video-player') && $player.length === 0) {
				if($child.is(':visible')) {
					visualStack.push($child);
					$child.hide();
				}
			}
		}
    });
}

function getStyles($node) {
    var html = 
		$node
		.clone()
		.children()
			.remove()
			.end()
		.wrap('<p>')
		.parent()
		.html()
		.toLowerCase();

    var m = html.match(/ style="([^"]*)"/);
    return m && m[1] || '';
}

function addStyles($node, styleString) {
	if(styleString.length > 0) {
		$node.css(parseRules(styleString));
	}
}

function parseRules(rules){
    var parsed_rules= {};
    rules.split(';').map(function(rule){
        return rule.split(':').map(function(rule,index){
            return rule.trim();
        })
    }).filter( function(rule){
		return rule.length == 2 && ( (rule[0]!="") || (rule[1]!="") )
	}).forEach(function(rule){
		parsed_rules[rule[0]] = rule[1]
	});

    return parsed_rules
}