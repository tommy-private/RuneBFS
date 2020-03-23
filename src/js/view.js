import $ from "jquery";
import _ from 'underscore';
import Ui from './ui.js';
import { Data } from './data.js'
import NProgress from 'nprogress'
import LZString from 'lz-string'
import domtoimage from 'dom-to-image';
import Backbone from 'backbone';
import * as sigma from 'sigma';
import 'sigma/plugins/sigma.renderers.customShapes/shape-library';
import 'sigma/plugins/sigma.renderers.customShapes/sigma.renderers.customShapes';

// icon & color setting
import IMG_RUNE_OFF_1 from '../img/Rune_Off_1.png';
import IMG_RUNE_OFF_2 from '../img/Rune_Off_2.png';
import IMG_RUNE_OFF_3 from '../img/Rune_Off_3.png';
import IMG_RUNE_OFF_4 from '../img/Rune_Off_4.png';
import IMG_RUNE_OFF_5 from '../img/Rune_Off_5.png';
import IMG_RUNE_OFF_6 from '../img/Rune_Off_6.png';
import IMG_RUNE_SEL_1 from '../img/Rune_SEL_1.png';
import IMG_RUNE_SEL_2 from '../img/Rune_SEL_2.png';
import IMG_RUNE_SEL_3 from '../img/Rune_SEL_3.png';
import IMG_RUNE_SEL_4 from '../img/Rune_SEL_4.png';
import IMG_RUNE_SEL_5 from '../img/Rune_SEL_5.png';
import IMG_RUNE_SEL_6 from '../img/Rune_SEL_6.png';
import IMG_RUNE_ON_1 from '../img/Rune_On_1.png';
import IMG_RUNE_ON_2 from '../img/Rune_On_2.png';
import IMG_RUNE_ON_3 from '../img/Rune_On_3.png';
import IMG_RUNE_ON_4 from '../img/Rune_On_4.png';
import IMG_RUNE_ON_5 from '../img/Rune_On_5.png';
import IMG_RUNE_ON_6 from '../img/Rune_On_6.png';

var ua = navigator.userAgent;
var IS_MOBILE; 
var displayImage;
// IMG_RUNE[status][type]
var IMG_RUNE = [["", IMG_RUNE_OFF_1, IMG_RUNE_OFF_2, IMG_RUNE_OFF_3, IMG_RUNE_OFF_4, IMG_RUNE_OFF_5, IMG_RUNE_OFF_6],
                ["", IMG_RUNE_SEL_1, IMG_RUNE_SEL_2, IMG_RUNE_SEL_3, IMG_RUNE_SEL_4, IMG_RUNE_SEL_5, IMG_RUNE_SEL_6],
                ["", IMG_RUNE_ON_1, IMG_RUNE_ON_2, IMG_RUNE_ON_3, IMG_RUNE_ON_4, IMG_RUNE_ON_5, IMG_RUNE_ON_6]];
var NODE_COLOR = [["#666666","#333333","#333333","#333333","#333333","#666666","#666666"], 
				  ["#0ed9d6", "#0ed9d6", "#0ed9d6", "#0ed9d6", "#0ed9d6", "#0ed9d6", "#0ed9d6"],
				  ["#d08349", "#e36956", "#3a85ed", "#c6a701", "#379f1e", "#d08349", "#ae56ed"]];

var activeMenu = "";
var runeList = [];
var runeCheckList = [];
var typeBranch = 0;
var maxevo = 99999;
var pathAlgorithm = "nogold";
var inited = false;
var runeSize;
var labelThreshold;
var labelSizeRatio;
var defaultTypeBranch = {
    1: 11,
    2: 21,
    3: 31,
    4: 41,
    5: 51,
    6: 61,
};
// sigma.js 
var s, g;

var initUiLanguage = function () {
    $('[data-lang]').each(function () {
        var $this = $(this);
        var key = $this.data("lang");
        var value = Ui.getText(key);
        $this.text(value);
    });
};
var getActiveMenu = function () {
    return activeMenu;
}
var setActiveMenu = function (id) {
    activeMenu = id;
    $("nav.navbar [data-type-branch-id].active").removeClass('active');
    //$("body>div[data-tab]").hide();
    var current = $("nav.navbar [data-type-branch-id=" + id + "]");
    current.addClass('active');
    current.parents('li').addClass('active');
    $('#class').text(current.text());
};
var initByClass = function (id, savedata, server) {
    if (defaultTypeBranch[id]) {
        id = defaultTypeBranch[id];
    }
    init(id, savedata, server);
};
var init = function (id, savedata, server) {
    if (server && server != Data.getCurrentServer().id) {
        Data.setCurrentServer(server);
        location.reload();
    }
    
    if(ua.indexOf('iPhone') > 0 || ua.indexOf('iPod') > 0 || ua.indexOf('Android') > 0 && ua.indexOf('Mobile') > 0){ // smartphone
	    IS_MOBILE = 1;
	}else if(ua.indexOf('iPad') > 0 || ua.indexOf('Android') > 0){ // tablet
	    IS_MOBILE = 1;
	}else{
	    IS_MOBILE = 0;
	}
	displayImage = (IS_MOBILE)? 0 : 1;
	runeSize = (IS_MOBILE)? 2 : 5; 
	labelThreshold = (IS_MOBILE)? 4 : 8;
	labelSizeRatio = (IS_MOBILE)? 2 : 1;
    
    clear();
    initControl();
    initGraph(id);
    
    if (savedata) {
        runeList = parseCondition(savedata);
    }
    _.each(runeList, function (o, i) {
        checkRune(s.graph.nodes("rune" + o), true, true);
    });
    _.each(runeCheckList, function (o, i) {
        checkRune(s.graph.nodes("rune" + o)	, true, false);
    });
    renderCost();
    updateGraph();
    initEventListener();
    initTxtSearch(id);
};
var clear = function () {
    runeList = [];
    runeCheckList = [];
};
var initControl = function () {
    if (inited) { return; }
    var server = Data.getCurrentServer();
    $('#server').text(server.name);
    $('#version').text(server.version);
    if (server.isTest) {
        $('.alert').show();
    }
    else {
        $('.alert').remove();
    }
    _.each(Data.getAllServers(), function (o, i) {
        if (!o.version) {
            return;
        }
        $('#serverDivider').before('<a class="dropdown-item ' + ((o.id == server.id) ? ' active ' : '') + (o.version ? '' : ' disabled ') + '" href="#server/' + o.id + '">' + o.name + '<div class="m-0" style="font-size:0.75rem;line-height:0.75rem;">' + o.version + '</div></a>');
    });

    $('#btnSearch').click(function () {
        var text = $('#txtSearch').val();
        _.each(s.graph.nodes(), function(o, i){
			if(o.status != 3 && o.label && o.label.startsWith(text)){
				o.color = "#ff0f4b";
			}
        });
        s.refresh();
    });
    $('#btnClear').click(function () {
        _.each(s.graph.nodes(), function(o, i){
			o.color =  NODE_COLOR[o.status][o.runetype];
        });
        s.refresh();
    });

    $('#btnSelectAll').click(function () {
        var astrolabe = Data.getAstrolabe();
        _.each(astrolabe, function (o, i) {
            checkRune(o.Id, true, false);
        });
		updateGraph();
    });

    $('#btnSaveImage').click(function () {
        var w = window.open('about:blank;', '_blank');
        $(w.document.body).append(Ui.getText('generating'));
        domtoimage.toPng($('.astrolabe-container')[0], { bgcolor: '#fff' })
            .then(function (dataUrl) {
                $(w.document.body).empty();
                $(w.document.body).append($('<textarea style="width:100%;height:100px;">').val(window.location));
                $(w.document.body).append($('<img>').attr('src', dataUrl));
            })
            .catch(function (error) {
                console.error(Ui.getText('generateerror'), error);
            });
    });
    $('#btnReset').click(function () {
        if (confirm(Ui.getText('confirmreset'))) {
            _.each(runeCheckList, function (o, i) {
                var rune = s.graph.nodes("rune" + o);
                rune.status = 0;
            });
            runeCheckList = [];
			updateGraph();
        }
    });
    $('#btnSave').click(function () {
        save();
    });
    $('input[name="evo"]').change(function () {
        maxevo = parseInt(this.value);
        initGraph(typeBranch);
    });
    $('input[name="pathAlgorithm"]').change(function () {
        pathAlgorithm = this.value;
        if (pathAlgorithm == "custom") {
            $('#algorithmWeight').show();
        }
        else {
            $('#algorithmWeight').hide();
        }
    });
    $('.rune-panel-switch').click(function () {
        $('.rune-panel-main').toggle();
    });
    inited = true;
};

var initTxtSearch = function(typeBranch){
	var category = [];
    $('#txtSearch').empty();
    _.each(Data.getAllRuneDescNameByTypeBranch(typeBranch), function (o, i) {
    	var str = o.replace(/[Ⅰ-Ⅸ]/g, '');
    	category = _.union(category, [str]);
	});
	console.log(category);
	_.each(category, function(o, i){
        $('#txtSearch').append($('<option>').text(o));
    });
    $('.selectpicker').selectpicker('refresh');
}

var updateGraph = function(){
	if(displayImage){
		_.each(s.graph.nodes(), function(rune, i) {
	        rune.color = NODE_COLOR[rune.status][rune.runetype];
		    rune.image = {
				            url: IMG_RUNE[rune.status][rune.runetype], 
				            scale: 1.5
				         }; 
		});
	}else{
		_.each(s.graph.nodes(), function(rune, i) {
			rune.image = null;
	        rune.color = NODE_COLOR[rune.status][rune.runetype];
		});
	}
	renderCost();
	s.refresh();
};

var updateByZoom = function(delta){
	// delta > 0 でZoom In, delta < 0 でZoom Out
	// camera.ratioは小さいほど拡大
	if(!IS_MOBILE){
		if(s.cameras[0].ratio <= 0.25 && delta > 0){
			displayImage = 1;
			updateGraph();
		}else if(s.cameras[0].ratio >= 0.13 && delta < 0){
			displayImage = 0;
			updateGraph();
		}
	}
};

var initGraph = function (id) {
    console.log("initGraph", id);
    if(s) s.kill();
    var self = this;
    if (id == 0) {
        return;
    }
    typeBranch = id;
    setActiveMenu(typeBranch);

    //get data
    var astrolabe = Data.getAstrolabe();

	// generate nodes and edges
	var nodes = [];
	var edges = []
    _.each(astrolabe, function (o, i) {
        // nodes: 
        var cost = Data.getRuneCost(o.Id);
        var resetCost = Data.getRuneResetCost(o.Id);
        var desc = Data.getRuneDesc(o.Id, typeBranch);
        var rune = {
            id: "rune" + o.Id,
            x: o.X * 5,
            y: -1 * o.Y * 5,
            size: runeSize,
            image: {
	            url: IMG_RUNE[0][desc.Type],
	            scale: 1.5
	        },
            dataid: o.Id,
            rune: o,
            cost: cost,
            resetCost: resetCost, 
            desc: desc, 
            label: desc.Name, //desc.Desc,
            runetype: desc.Type,
            status: 0,   //0:unchecked,1:checked,2:saved,3:disabled
        };
        if (o.Id == 10000) {
            //set default rune as saved
            rune.status = 2;
            runeCheckList.push(o.Id);
        }
        if (o.Evo > maxevo) {  // evo はルーン盤の解放範囲
            rune.status = 3;
        }
        nodes.push(rune);
        
        // edges 
        _.each(o.Link, function (oo, i) {
        	var target = Data.getRuneDataById(oo)
            if (target) {
				var edge = {
		    		id: 'edge'+ o.Id +'-'+ target.Id,
	    			source: 'rune' + o.Id,
	    			target: 'rune' + target.Id 
	    		};
		    	edges.push(edge);
	    	}
	    });
    });
	g = { nodes: nodes, edges : edges };
    s = new sigma({ graph: g,
					renderer: {
						container: document.getElementById('astrolabe-viewer'),
						type: 'canvas'
    				},
					settings: {
				        autoRescale: ["nodePosition", "nodeSize"],
				        adjustSizes: true,
				        immutable: true, 
				        fixed: true,
				        defaultNodeType: 'circle', 
				        maxNodeSize: runeSize,
				        minEdgeSize: 3,
				        maxEdgeSize: 3,
				        edgeColor : 'target',
				        labelColor: 'node',
						nodeHoverColor : 'defalut',
						defaultNodeHoverColor : '#f5ff70',
						hoverFontStyle : 'font-size: 200%;',
				        defaultLabelAlignment : 'inside',
				        labelSize : "proportional", 
				        labelSizeRatio: labelSizeRatio, 
				        labelThreshold: labelThreshold,
				}
			});
    CustomShapes.init(s);
    s.cameras[0].goTo({ x: 0, y: 50, angle: 0, ratio: 0.25 });
};

var initEventListener = function(){
	s.bind("clickNode", function(e){
		switch(e.data.node.status) {
            case 0:
			    console.log("case 0 : checkRune");
                checkRune(e.data.node);
                break;	
            case 1:
                uncheckRune(e.data.node);
                break;
            case 2:
                uncheckRuneWithConfirm(e.data.node);
                break;
            default:
                break;
         }
		updateGraph();
	});
	$('.sigma-mouse')
    // I destroy and create new Sigma instances on the same page on the go, so I unbind events first
    .unbind('mousewheel DOMMouseScroll')

    // Rebind events
    // Note: use jQuery $.throttle plugin to prevent excessing firing
    .bind('mousewheel DOMMouseScroll', function(e){  // # $.throttle(500, function(e) {
        // Example callback
        // updateByZoom()の後でデフォルトのマウスホイール処理が走るので、実際のズーム値変更はupdateByZoom()の後になる。
        // よってマウス移動の上下をとって、基準値からどちらに動いたかで処理する必要がある
        var delta = e.originalEvent.deltaY ? -(e.originalEvent.deltaY) : e.originalEvent.wheelDelta ? e.originalEvent.wheelDelta : -(e.originalEvent.detail);
        updateByZoom(delta);
    });   // );
};

var renderCost = function () {
    var runeCost = [];
    var runeCheckCost = [];
    var runeResetCost = [];
    var runeCheckResetCost = [];

    var runeTotalAttr = [];
    var runeCheckTotalAttr = [];
    _.each(s.graph.nodes(), function(rune, i) {
        // var runeData = $rune.data("rune");
        switch (rune.status) {
            case 0:
                break;
            case 1: {
                runeCheckCost.push(rune.cost);
                runeCheckResetCost.push(rune.resetCost);
                runeCheckTotalAttr.push(rune.desc);
                break;
            }
            case 2: {
                runeCost.push(rune.cost);
                runeResetCost.push(rune.resetCost);
                runeTotalAttr.push(rune.desc);
                break;
            }
            default:
                break;
        }
    });
    runeCheckCost = _.reduce(runeCheckCost, function (memo, item) {
        _.each(item, function (o, i) {
            memo[o.Name] = (memo[o.Name] || 0) + o.Count;
        })
        return memo;
    }, {});
    runeCost = _.reduce(runeCost, function (memo, item) {
        _.each(item, function (o, i) {
            memo[o.Name] = (memo[o.Name] || 0) + o.Count;
        })
        return memo;
    }, {});
    var runeCheckCostText = "";
    _.each(runeCheckCost, function (o, i) {
        runeCheckCostText += i + "*" + o + " ";
    })
    var runeCostText = "";
    _.each(runeCost, function (o, i) {
        runeCostText += i + "*" + o + " ";
    })
    runeCheckResetCost = _.reduce(runeCheckResetCost, function (memo, item) {
        _.each(item, function (o, i) {
            memo[o.Name] = (memo[o.Name] || 0) + o.Count;
        })
        return memo;
    }, {});
    runeResetCost = _.reduce(runeResetCost, function (memo, item) {
        _.each(item, function (o, i) {
            memo[o.Name] = (memo[o.Name] || 0) + o.Count;
        })
        return memo;
    }, {});
    var runeCheckResetCostText = "";
    _.each(runeCheckResetCost, function (o, i) {
        runeCheckResetCostText += i + "*" + o + " ";
    })
    var runeResetCostText = "";
    _.each(runeResetCost, function (o, i) {
        runeResetCostText += i + "*" + o + " ";
    })
    runeCheckTotalAttr = _.reduce(runeCheckTotalAttr, function (memo, o) {
        if (!o || !o.Key) { return memo; }
        memo[o.Key] = (memo[o.Key] || 0) + o.Value;
        return memo;
    }, {});
    runeTotalAttr = _.reduce(runeTotalAttr, function (memo, o) {
        if (!o || !o.Key) { return memo; }
        memo[o.Key] = (memo[o.Key] || 0) + o.Value;
        return memo;
    }, {});

    var runeCheckTotalAttrText = "";
    var index = 0;
    _.each(runeCheckTotalAttr, function (o, i) {
        index++;
        runeCheckTotalAttrText += Ui.getEquipEffect(i) + "+" + Math.round(o * 100) / 100 + " ";
        if (index % 4 == 0) { runeCheckTotalAttrText += "<br/>"; }
    })
    var runeTotalAttrText = "";
    index = 0;
    _.each(runeTotalAttr, function (o, i) {
        index++;
        runeTotalAttrText += Ui.getEquipEffect(i) + "+" + Math.round(o * 100) / 100 + " ";
        if (index % 4 == 0) { runeTotalAttrText += "<br/>"; }
    })
    $('#runeCheckCost').empty()
        .append(runeCheckCostText.trim() +
            "(" + runeCheckResetCostText.trim() + ")" +
            '<br/>' + runeCheckTotalAttrText.trim());
    $('#runeCheckCost').data('cost', runeCheckCostText.trim() + "(" + runeCheckResetCostText.trim() + ")");
    $('#runeCost').empty()
        .append(runeCostText.trim() +
            "(" + runeResetCostText.trim() + ")" +
            '<br/>' + runeTotalAttrText.trim());
    $('#runeCost').data('cost', runeCostText.trim() + "(" + runeResetCostText.trim() + ")");
};

var checkRune = function (rune, noRecursion, isSaved) {
	var runeId = rune.dataid;
    if (runeId == 10000) {
        return;
    }
    if (rune.Evo > maxevo) {
        return;
    }
    if (!noRecursion) {
        //var path = Data.getPath(runeList.concat(runeCheckList), runeId);
        var path = [];
        switch (pathAlgorithm) {
            case "simple":
                path = Data.getPath(runeList.concat(runeCheckList), runeId, maxevo);
                break;
            case "nogold":
                path = Data.getPathWithWeight(runeList.concat(runeCheckList), runeId, maxevo);
                break;
            case "custom": {
                var param = [{ id: 140, weight: parseFloat($('#weight140').val()) || 0 }, { id: 5261, weight: parseFloat($('#weight5261').val()) || 0 }];
                path = Data.getPathWithWeight(runeList.concat(runeCheckList), runeId, maxevo, param);
                break;
            }
        }
        console.log("getPath", pathAlgorithm, path);
        if (!path.length) {
            alert(Ui.getText("nopath"))
            return;
        }
        _.each(path, function (o, i) {
            checkRune(s.graph.nodes('rune'+ o), true);
        });
    }
    else {
        if (isSaved) {
            if (rune.status >= 2) {
                return;
            }
            rune.status = 2;
        }
        else {
            if (rune.status >= 1) {
                return;
            }
            rune.status = 1;
            runeCheckList.push(runeId);
        }
    }
    renderCost();
};

var uncheckRuneWithConfirm = function (rune) {
    if (confirm(Ui.getText("confirmuncheck"))) {
        uncheckRune(rune);
    }
};
var uncheckRune = function (rune, noRecursion) {
    var runeId = rune.dataid;
    if (rune.Evo > maxevo) {
        return;
    }
    rune.status = 0;

    runeList = _.without(runeList, runeId);
    runeCheckList = _.without(runeCheckList, runeId);
    if (!noRecursion) {
        var components = Data.getConnectedComponent(runeList.concat(runeCheckList));
        _.each(components, function (o, i) {
            if (_.contains(o, 10000) == false) {
                _.each(o, function (p, j) {
                    uncheckRune(s.graph.nodes('rune'+ p), true);
                });
            }
        });
    }
    runeList = _.union(runeList, [10000]);
    renderCost();
};

var save = function () {
    runeList = _.unique(runeList.concat(runeCheckList));
    runeCheckList = [];
    _.each(runeList, function (o, i) {
        var rune = s.graph.nodes("rune" + o);
        rune.status = 2;
    });
    updateGraph();

    var data = stringifyCondition(runeList);
    Backbone.history.navigate("typeBranch/" + typeBranch + "/share/" + data + '/server/' + Data.getCurrentServer().id, { trigger: false });
};

function stringifyCondition(condition) {
    return LZString.compressToEncodedURIComponent(JSON.stringify(condition));
}

function parseCondition(conditionJson) {
    return JSON.parse(LZString.decompressFromEncodedURIComponent(conditionJson));
}

export {
    initUiLanguage,
    getActiveMenu,
    setActiveMenu,
    init,
    initByClass,
};
export default {
    initUiLanguage,
    getActiveMenu,
    setActiveMenu,
    init,
    initByClass,
};