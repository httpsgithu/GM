// ==UserScript==
// @name						Text To link
// @description					把文字链接转换为可点击链接, Make text links clickable
// @author						lkytal
// @namespace					Lkytal
// @homepage					http://lkytal.github.io/
// @include						*
// @exclude						*pan.baidu.com/*
// @exclude						*renren.com/*
// @exclude						*exhentai.org/*
// @version						2.6.2
// @icon						http://lkytal.qiniudn.com/ic.ico
// @grant						unsafeWindow
// @homepageURL					https://git.oschina.net/coldfire/GM
// @updateURL					https://git.oschina.net/coldfire/GM/raw/master/meta/linkMix.meta.js
// @downloadURL					https://git.oschina.net/coldfire/GM/raw/master/linkMix.user.js
// ==/UserScript==

"use strict";
var excludedTags, filter, linkMixInit, linkPack, linkify, observePage, observer, setHttp, setLink, url_regexp, xpath;

url_regexp = /((https?:\/\/|www\.)[\x21-\x7e]+\w|(\w[\w._-]+\.(com|cn|org|net|info|tv|cc))(\/[\x21-\x7e]*\w)?|ed2k:\/\/[\x21-\x7e]+\|\/|thunder:\/\/[\x21-\x7e]+=)/gi;

setHttp = function(event) {
  var url;
  url = event.target.getAttribute("href");
  if (url.indexOf("http") !== 0 && url.indexOf("ed2k://") !== 0 && url.indexOf("thunder://") !== 0) {
    return event.target.setAttribute("href", "http://" + url);
  }
};

if (typeof exportFunction !== "undefined" && exportFunction !== null) {
  exportFunction(setHttp, unsafeWindow, {
    defineAs: "setHttp"
  });
} else {
  unsafeWindow.setHttp = setHttp;
}

setLink = function(candidate) {
  var span, text;
  if ((candidate == null) || candidate.nodeName === "#cdata-section") {
    return;
  }
  text = candidate.textContent.replace(url_regexp, '<a href="$1" target="_blank" onmouseover="setHttp(event);">$1</a>');
  if (candidate.textContent.length === text.length) {
    return;
  }
  span = document.createElement("span");
  span.innerHTML = text;
  return candidate.parentNode.replaceChild(span, candidate);
};

excludedTags = "a,svg,canvas,applet,input,button,area,pre,embed,frame,frameset,head,iframe,img,map,meta,noscript,object,option,param,script,select,style,textarea,code".split(",");

xpath = "//text()[not(ancestor::" + (excludedTags.join(') and not(ancestor::')) + ")]";

filter = new RegExp("^(" + (excludedTags.join('|')) + ")$", "i");

linkPack = function(result, start) {
  var i, _i, _j, _ref, _ref1;
  if (start + 10000 < result.snapshotLength) {
    for (i = _i = start, _ref = start + 10000; start <= _ref ? _i <= _ref : _i >= _ref; i = start <= _ref ? ++_i : --_i) {
      setLink(result.snapshotItem(i));
    }
    setTimeout(function() {
      return linkPack(result, start + 10000);
    }, 10);
  } else {
    for (i = _j = start, _ref1 = result.snapshotLength; start <= _ref1 ? _j <= _ref1 : _j >= _ref1; i = start <= _ref1 ? ++_j : --_j) {
      setLink(result.snapshotItem(i));
    }
  }
};

linkify = function(doc) {
  var result;
  result = document.evaluate(xpath, doc, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
  return linkPack(result, 0);
};

observePage = function(root) {
  var tW;
  tW = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: function(a) {
      if (!filter.test(a.parentNode.localName)) {
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  }, false);
  while (tW.nextNode()) {
    setLink(tW.currentNode);
  }
};

observer = new window.MutationObserver(function(mutations) {
  var Node, mutation, _i, _j, _len, _len1, _ref;
  for (_i = 0, _len = mutations.length; _i < _len; _i++) {
    mutation = mutations[_i];
    if (mutation.type === "childList") {
      _ref = mutation.addedNodes;
      for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
        Node = _ref[_j];
        observePage(Node);
      }
    }
  }
});

linkMixInit = function() {
  if (window !== window.top || window.document.title === "") {
    return;
  }
  linkify(document.body);
  return observer.observe(document.body, {
    childList: true,
    subtree: true
  });
};

setTimeout(linkMixInit, 100);
