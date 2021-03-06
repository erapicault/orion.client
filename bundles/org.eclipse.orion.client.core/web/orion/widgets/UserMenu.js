/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/

/*global define window document localStorage*/

define(['i18n!orion/widgets/nls/messages', 'require', 'orion/webui/littlelib'], function(messages, require, lib) {
	
	function UserMenu(options) {
		this._init(options);		
	}
	UserMenu.prototype = /** @lends orion.widgets.UserMenu.UserMenu.prototype */ {
			
		_init: function(options) {
			this._dropdownNode = lib.node(options.dropdownNode);
			if (!this._dropdownNode) { throw "no dom node for dropdown found"; } //$NON-NLS-0$
			this._dropdown = options.dropdown;
			this.authenticatedServices = {};
			this.unauthenticatedServices = {};
		},
		
		isSingleService : function(){
			return this.length(this.unauthenticatedServices) + this.length(this.authenticatedServices) === 1;
		},
		hasServices: function(){
			return this.length(this.unauthenticatedServices) + this.length(this.authenticatedServices) > 0;
		},
		length: function(obj) {
			var length = 0;
			for(var prop in obj) {
				if(obj.hasOwnProperty(prop)) {
					length++;
				}
			}
			return length;
		},
		
		_makeMenuItem: function(name, click) {
			var element = document.createElement("span"); //$NON-NLS-0$
			element.role = "menuitem";  //$NON-NLS-0$
			element.tabIndex = 0; //$NON-NLS-0$
			var text = document.createTextNode(name);
			element.appendChild(text);
			element.classList.add("dropdownMenuItem"); //$NON-NLS-0$
			element.addEventListener("click", click, false); //$NON-NLS-0$
			// onClick events do not register for spans when using the keyboard
			element.addEventListener("keydown", this, function(e) { //$NON-NLS-0$
				if (e.keyCode === lib.key.ENTER || e.charCode === lib.key.SPACE) {	
					click();
				}
			}, false);
			return element;
		},
		
		_renderAuthenticatedService: function(key, startIndex){
			var _self = this;
			var authService = this.authenticatedServices[key].authService;
			if (authService && authService.logout){
				var item = document.createElement("li");//$NON-NLS-0$
				var element = this._makeMenuItem(messages["Sign Out"], function() {
					authService.logout().then(function(){
						_self.addUserItem(key, authService, _self.authenticatedServices[key].label);
						localStorage.removeItem(key);
						localStorage.removeItem("lastLogin"); //$NON-NLS-0$
						//TODO: Bug 368481 - Re-examine localStorage caching and lifecycle
						for (var i = localStorage.length - 1; i >= 0; i--) {
							var name = localStorage.key(i);
							if (name && name.indexOf("/orion/preferences/user") === 0) { //$NON-NLS-0$
								localStorage.removeItem(name);
							}
						}
						authService.getAuthForm(window.location.href).then(function(formURL) {
							window.location = formURL;
						});
					});
				});
				item.appendChild(element);
				this._dropdownNode.appendChild(item);
			}
		},
		

		renderServices: function(){
			this._dropdown.empty();
						 
			var item = document.createElement("li");//$NON-NLS-0$
			var link = document.createElement("a"); //$NON-NLS-0$
			link.role = "menuitem"; //$NON-NLS-0$
			link.classList.add("dropdownMenuItem"); //$NON-NLS-0$
			link.href = require.toUrl("help/index.jsp"); //$NON-NLS-0$
			var text = document.createTextNode(messages["Help"]);//$NON-NLS-0$
			link.appendChild(text);
			item.appendChild(link);
			this._dropdownNode.appendChild(item);
			
			var element;
			if(this.keyAssistFunction){
				item = document.createElement("li");//$NON-NLS-0$
				element = this._makeMenuItem(messages["Keyboard Shortcuts"], this.keyAssistFunction);
				item.appendChild(element);
				this._dropdownNode.appendChild(item);
			}
			
			// separator
			item = document.createElement("li"); //$NON-NLS-0$
			item.classList.add("dropdownSeparator"); //$NON-NLS-0$
			element = document.createElement("span"); //$NON-NLS-0$
			element.classList.add("dropdownSeparator"); //$NON-NLS-0$
			item.appendChild(element);
			this._dropdownNode.appendChild(item);
	
			item = document.createElement("li");//$NON-NLS-0$
			link = document.createElement("a"); //$NON-NLS-0$
			link.role = "menuitem";  //$NON-NLS-0$
			link.classList.add("dropdownMenuItem");  //$NON-NLS-0$
			link.href = require.toUrl("settings/settings.html"); //$NON-NLS-0$
			text = document.createTextNode(messages["Settings"]);//$NON-NLS-0$
			link.appendChild(text);
			item.appendChild(link);
			this._dropdownNode.appendChild(item);

			if(this.isSingleService()){
				//add sign out only for single service.
				for(var i in this.authenticatedServices){
					if (this.authenticatedServices.hasOwnProperty(i)) {
						this._renderAuthenticatedService(i, 0);
					}
				}
			}
			
		},
		
		setKeyAssist: function(keyAssistFunction){
			this.keyAssistFunction = keyAssistFunction;
			this.renderServices();
		},
	
		addUserItem: function(key, authService, label, jsonData){
			if(jsonData){
				if(this.unauthenticatedServices[key]){
					delete this.unauthenticatedServices[key];
				}
				this.authenticatedServices[key] = {authService: authService, label: label, data: jsonData};
			}else{
				if(this.authenticatedServices[key]){
					delete this.authenticatedServices[key];
				}
				if(this.unauthenticatedServices[key]){
					this.unauthenticatedServices[key] = {authService: authService, label: label, pending: this.unauthenticatedServices[key].pending};
				}else{
					this.unauthenticatedServices[key] = {authService: authService, label: label};
				}
			}
			this.renderServices();
		}
	};
	UserMenu.prototype.constructor = UserMenu;
	//return the module exports
	return {UserMenu: UserMenu};

});
