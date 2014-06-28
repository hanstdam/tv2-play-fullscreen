var _tabId;
var _windowId;
var _port;
var _windowState;

chrome.browserAction.onClicked.addListener(function() {
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		_tabId = tabs[0].id;
		_windowId = tabs[0].windowId;
		
		_port.postMessage({ event: 'fullscreen-request' });
	});
});

chrome.runtime.onConnect.addListener(function(port) {
	console.log('connected!', port);
	if(port.name !== 'fullscreen-messaging') {
		return;
	}
	_port = port;
	_tabId = _port.sender.tab.id;
	_windowId = _port.sender.tab.windowId;
	
	_port.onMessage.addListener(function(message, sender, sendResponse) {
		if(message.event == 'check-window-state') {
			chrome.windows.get(_windowId, {}, function(window) {
				if(window.state !== 'fullscreen') {
					_port.postMessage({ event: 'fullscreen-off' });
				}
			});
		} else if(message.event == 'fullscreen-request') {
			if(message.response === true) {
				chrome.windows.get(_windowId, {}, function(window) {
					_windowState = window.state;
					chrome.windows.update(_windowId, { state: 'fullscreen' }, function() {
						_port.postMessage({ event: 'fullscreen-on' });
					});
				});
			}
		} else if(message.event == 'fullscreen-off') {
			chrome.windows.get(_windowId, {}, function(window) {
				if(window.state === 'fullscreen') {
					chrome.windows.update(_windowId, { state: _windowState || 'normal' });
				}
			});
		}
	});
});