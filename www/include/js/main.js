/*
 * Arpav - Balneazione 
 * App controller
 * 2012-07-11
 * Stefano Manzoni @Archimedia
 */
$(function(){
    document.addEventListener('deviceready', makeInit, false);
	document.addEventListener('menubutton', ExitFromApp, false);
	document.addEventListener('startcallbutton', ExitFromApp, false);
	document.addEventListener('batterycritical', ExitFromApp, false);
	document.addEventListener('backbutton', ExitFromApp, false);
  
	$('#bindPreferiti,#btn_corpi_fav').attr('onclick', 'setTimeout(function(){loadFavoritesAdmin();}, 300);');
	
	$('#btn_preferiti_new').attr('onclick', 'setTimeout(function(){caricaCorpi();}, 300);');
});
 
function makeInit(){
	// viene verificato se il device e' connesso
	if (!DeviceIsOnLine()) {
		// Avvisa ed esci
		vrVibra(1000);
		vrBeep(1);
		notifica('Attenzione!', 'E\'necessaria la connessione ad internet.\n\nConnettiti e riavvia l\'app.', 'Ok', ExitFromApp);
	}
	else{
		openDbLiveConnection();
	}
}

function hideSplash(){
	sqlDB = 'SELECT id_luogo FROM ARPAV_FAVORITES';
	db.transaction(function (tx) {  
		tx.executeSql(sqlDB,[], function (tx, results) {
			var len = results.rows.length, i;
			if (len > 0) {
				// yes preferiti
				setTimeout(function(){
					loadFavorites();
				}, 300);
			}
			else {
				// no preferiti
				setTimeout(function(){
					caricaCorpi();
				}, 300);
			}
		});
	});
}

function changeMypage(page){
	$('.page').hide();
	$('#' + page).show();
}

function changeMySwipeItem(page){
	$('.swipeactive').hide();
	$('#' + page).show();
}


function loadFavorites(){
	changeMypage('geo_luoghi_dettaglio_fav');
	setTimeout(function(){
		caricaPreferitiDettaglio();
	}, 300);
}

function loadFavoritesAdmin(){
	changeMypage('preferiti_page');
	setTimeout(function(){
		caricaTuttiPreferiti();	
	}, 300);
}

function caricaCorpi(){

	changeMypage('geo_corpi');
	$('#list_corpi li').remove();
	
	sqlDB = "SELECT DISTINCT(acqua_nome) AS acqua_nome FROM ARPAV_LUOGHI WHERE (acqua_nome LIKE '%garda%') OR (acqua_nome LIKE '%adriat%') union all select distinct('ALTRO') where not exists (select 1 from ARPAV_LUOGHI where acqua_nome = 'something')";
	db.transaction(function (tx) {  
		tx.executeSql(sqlDB,[], function (tx, results) {
			var len = results.rows.length, i;
			for(i=0;i<len;i++){
				var classebordi = '';
				if(i == 0){classebordi = ' class="first"'}
				if(i == len-1){classebordi = ' class="last"'}
				if(1 == len){classebordi = ' class="first last"'}
				
				var Lista = '<li' + classebordi + '>';
				Lista += '<a href="#" onclick="caricaComune(\'' + results.rows.item(i).acqua_nome + '\')">';
				Lista += '<h3>' + results.rows.item(i).acqua_nome + '</h3>';
				Lista += '</a></li>';
				$('#list_corpi').append(Lista);
			}
		});
	});
}

function caricaComune(corpo){

	$('#list_comuni li').remove();
	$('#nomecorpo').html('');
	
	changeMypage('geo_comuni');

	if(corpo=="ALTRO")
		sqlDB = "SELECT DISTINCT(acqua_nome) AS comune_nome FROM ARPAV_LUOGHI WHERE (acqua_nome NOT LIKE '%garda%') AND (acqua_nome NOT LIKE '%adriat%') ORDER BY latitude desc";
	else
		sqlDB = "SELECT DISTINCT(comune_nome) AS comune_nome FROM ARPAV_LUOGHI WHERE (acqua_nome LIKE '%"+corpo+"%') ORDER BY latitude desc";
	db.transaction(function (tx) {  
		tx.executeSql(sqlDB,[], function (tx, results) {
			var len = results.rows.length, i;
			for(i=0;i<len;i++){
				$('#nomecorpo').html(corpo);
				
				var classebordi = '';
				if(i == 0){classebordi = ' class="first"'}
				if(i == len-1){classebordi = ' class="last"'}
				if(1 == len){classebordi = ' class="first last"'}
				
				var Lista = '<li' + classebordi + '>';
				Lista += '<a href="#" onclick="caricaLuogo(\'' + results.rows.item(i).comune_nome + '\',\'' + corpo + '\')">';
				Lista += '<h3>' + results.rows.item(i).comune_nome + '</h3>';
				Lista += '</a></li>';
				$('#list_comuni').append(Lista);
			}
		});
	});

}

function caricaLuogo(comune, corpo){
	
	$('#nomeluogo').html('');
	$('#list_luoghi li').remove();
	
	changeMypage('geo_luoghi');
	
	// viene creato il link dinamico per il bottone torna
	$('#btn_geo_luoghi_torna').attr('onclick', 'caricaComune(\'' + corpo + '\');');
	
	if(corpo=="ALTRO")
		sqlDB = "SELECT * FROM ARPAV_LUOGHI WHERE (acqua_nome LIKE '%"+comune+"%')";
	else
		sqlDB = "SELECT * FROM ARPAV_LUOGHI WHERE (comune_nome LIKE '%"+comune+"%') AND (acqua_nome LIKE '%"+corpo+"%') ORDER BY latitude desc";
	db.transaction(function (tx) {  
		tx.executeSql(sqlDB,[], function (tx, results) {
			var len = results.rows.length, i;
			for(i=0;i<len;i++){
				$('#nomeluogo').html(comune);
				
				var classebordi = '';
				if(i == 0){classebordi = ' class="first"'}
				if(i == len-1){classebordi = ' class="last"'}
				if(1 == len){classebordi = ' class="first last"'}
				
				var Lista = '<li' + classebordi + '>';
				
				Lista += '<a href="#" onclick="caricaLuogoDetail(' + results.rows.item(i).id + ',\'' + comune + '\',\'' + corpo + '\');">';
				//Lista += '<img src="include/icons/bandiera_' + item.stato + '.png" style="margin-top:-3px;"/>';
				Lista += '<h3 class="flag_' + results.rows.item(i).stato + '">' + results.rows.item(i).luogo_nome + '</h3>';
				Lista += '</a>';
				Lista += '<div class="nosee" latitude="' + results.rows.item(i).latitude + '" longitude="' + results.rows.item(i).longitude + '" title="<em>' + comune + '</em><br/><strong>' + results.rows.item(i).luogo_nome + '</strong>" stato="' + results.rows.item(i).stato + '"></div>';
				Lista += '</li>';
				$('#list_luoghi').append(Lista);
				//$('#list_comuni').append(Lista);
			}
		});
	});
	$('#bindPlacesToMap').attr('onclick', 'AprimappaMultiLuogo(\'' + corpo + '\',\'' + comune + '\');');
}

function AprimappaMultiLuogo(corpo, comune){
	changeMypage('mappa_luoghi');
	
	setTimeout(function(){
		renderGmapMuchPlace('ul#list_luoghi div.nosee', 'map_luoghiall', corpo, comune, '', '', '', '');
	}, 300);
}

function caricaLuogoDetail(id_luogo, comune, corpo){
	
	// viene creato il link dinamico per il bottone torna
	$('#btn_geo_luoghi_dettaglio').attr('onclick', 'caricaLuogo(\'' + comune + '\',\'' + corpo + '\');');
	$('#detailLuogo').html('');
	
	changeMypage('geo_luoghi_dettaglio');
	
	sqlDB = "SELECT * FROM ARPAV_LUOGHI WHERE (id="+id_luogo+")";
	db.transaction(function (tx) {  
		tx.executeSql(sqlDB,[], function (tx, results) {
			var tpl = '';
			tpl += '<h5 style="margin-bottom: 5px;">' + results.rows.item(0).comune_nome + '</h5>';
			tpl += '<div style="background:rgba(125, 125, 125,0.2);border-bottom-left-radius: 0.3em;border-bottom-right-radius: 0.3em;border-top-left-radius: 0.3em;border-top-right-radius: 0.3em;">';
			tpl += '<div class="box-content">';
			tpl += '<img src="include/icons/flag_' + results.rows.item(0).stato + '.png" style="float:left;" />';
			tpl += '<h4 style="margin:0 0 0 50px;">' + results.rows.item(0).luogo_nome + '</h4>';
			switch(results.rows.item(0).stato){
				case "ROSSA":
					tpl += '<p class="ui-li-desc" style="margin:0 0 8px 50px;"><strong>Zona permanentemente non idonea</strong></p>';
					tpl += '<p class="ui-li-desc" style="margin:3px 0 0 50px;">si intende una zona permanentemente non balneabile le cui acque sono considerate di qualitˆ scarsa per cinque anni consecutivi.</p>';
					break;
				case "ARANCIO":
					tpl += '<p class="ui-li-desc" style="margin:0 0 8px 50px;"><strong>Zona temporaneamente non idonea</strong></p>';
					tpl += '<p class="ui-li-desc" style="margin:3px 0 0 50px;">si intende una zona temporaneamente non balneabile le cui acque presentano valori dei parametri oltre i limiti di legge.</p>';
					break;
				case "BLU":
					tpl += '<p class="ui-li-desc" style="margin:0 0 8px 50px;"><strong>Zona idonea</strong></p>';
					tpl += '<p class="ui-li-desc" style="margin:3px 0 0 50px;">si intende una zona balneabile le cui acque presentano valori dei parametri nei limiti di legge.</p>';
					break;
			}
			if (results.rows.item(0).data_stato != '') {
				tpl += '<p class="ui-li-desc" style="margin:8px 0 0 50px;">Data ultimo controllo: ' + results.rows.item(0).data_stato + '</p>';
			}
			
			tpl += '<div class="nosee" latitude="' + results.rows.item(0).latitude + '" longitude="' + results.rows.item(0).longitude + '" title="<em>' + results.rows.item(0).comune_nome + '</em><br /><strong>' + results.rows.item(0).luogo_nome + '</strong>" stato="' + results.rows.item(0).stato + '"></div>';
			tpl += '</div></div>';
					
			$('#detailLuogo').html(tpl);
			
			var bottone = '<a href="#" id="btn_mappa_luogo_fav" class="bottoniright aggiungifav" onclick="onFavoritesInsert(' + results.rows.item(0).id + ');">+ Preferiti</a>';
	
			$('.aggiungifav').remove();
			$('#geo_luoghi_dettaglio .footer').append(bottone);
			$('#mappa_luogo .ns_header').append(bottone);
	
			// su click del bottone mappa, viene attivata la mappa dell ITEM selezionato
			$('#bindPlacesToMap_det').unbind('click', function(e){});
			
			$('#bindPlacesToMap_det').bind('click', function(e){
				
				e.preventDefault();
				
				var bloccoDatiMappa = $('#detailLuogo .nosee');
				var lat = bloccoDatiMappa.attr('latitude');
				var lon = bloccoDatiMappa.attr('longitude');
				var title = bloccoDatiMappa.attr('title');
				var stato = bloccoDatiMappa.attr('stato');
				//console.log(bloccoDatiMappa + ' ' + lat + ' ' + lon + ' ' + title + ' ' + stato);
				
				changeMypage('mappa_luogo');
				
				$('#btn_mappa_luogo_torna').attr('onclick', 'caricaLuogoDetail(' + id_luogo + ',\'' + comune + '\',\'' + corpo + '\');');
				
				setTimeout(function(){
					renderGmap(lat, lon, title, stato, 'map_luogo_fav');
				}, 300);
				
			});
		});
	});
}

function onFavoritesInsert(id_luogo){

	addFav(id_luogo);
			
	setTimeout(function(){
		//console.log('2- carica preferiti');
		loadFavoritesAdmin();
	}, 400);

}


function caricaTuttiPreferiti(){
	
	$('#list_preferiti li').remove();
	
	sqlDB = 'SELECT id_luogo,luogo_nome FROM ARPAV_FAVORITES ORDER BY showorder';
	html5sql.process([sqlDB], function(transaction, results, rowsArray){
		//alert(rowsArray.length);
		if (rowsArray.length > 0) {
			
			for (var i = 0; i < rowsArray.length; i++) {
				var lw_id = rowsArray[i].id_luogo;
				var lw_na = rowsArray[i].luogo_nome;
				
				var classebordi = '';
				if(i == 0){classebordi = ' first'}
				if(i == rowsArray.length-1){classebordi = ' last'}
				if(1 == rowsArray.length){classebordi = ' first last'}
				
				var Lista = '<li class="elimina' + classebordi + '">';	
				Lista += '<a class="bottone_attivo"';
				Lista += ' href="#" onclick="preDeleteFav(' + lw_id + ');">';
				Lista += '<h3 style="font-size:1em;">' + lw_na + '</h3>';
				Lista += '</a>';
				Lista += '</li>';
				$('#list_preferiti').append(Lista);
			}
		}
		else {
			//non ci sono preferiti.
			$('#emptymsg').html('Non ci sono preferiti.');
			$('#list_preferiti li').remove();		
		}
	}, errorCB);
}


function preDeleteFav(id_luogo){
    html5sql.openDatabase(dbName, dbsName, dbSize);
    var luogo='';
    sqlDB = 'SELECT * FROM ARPAV_LUOGHI WHERE id = ' + id_luogo;
    html5sql.process([sqlDB], function(transaction, results, rowsArray){
        luogo=rowsArray[0].luogo_nome;
        navigator.notification.confirm(
            'Eliminare ' + luogo + '?',
            function (buttonIndex){
    			if (buttonIndex == 1) {
    				setTimeout(function(){
    					delFavSql(id_luogo);
    				}, 300);
    			}
    			else {
    				return false;
    			}
    		},              
            'Attenzione',
            'Ok,Annulla'
        );
    }, errorCB);
}


// funzione di callback di delFav()
function delFavSql(id_luogo){

	//VIENE VERIFICATO SE il luogo e' PRESENTE
	html5sql.openDatabase(dbName, dbsName, dbSize);
    
    var luogo='';
    sqlDB = 'SELECT * FROM ARPAV_LUOGHI WHERE id = ' + id_luogo;
    html5sql.process([sqlDB], function(transaction, results, rowsArray){
        luogo=rowsArray[0].luogo_nome
    }, errorCB);

	sqlDB = 'SELECT id_luogo FROM ARPAV_FAVORITES WHERE id_luogo = ' + id_luogo;
	html5sql.process([sqlDB], function(transaction, results, rowsArray){
		if (rowsArray.length >= 0) {	
			html5sql.process([{
				'sql': 'DELETE FROM ARPAV_FAVORITES WHERE id_luogo = ' + id_luogo,
				'success': function(transaction, results){
					$('#emptymsg').html(luogo + ' eliminato!')
					.fadeIn(500, function() {
						$(this).fadeOut(2000);
						caricaTuttiPreferiti();
					});
				}
			}]);
		}
	}, errorCB);
	
};

// funzione di aggiunta di un singolo record preferiti al DB
function addFav(id_luogo){
    html5sql.openDatabase(dbName, dbsName, dbSize);
    var nome_luogo='';
    sqlDB = 'SELECT * FROM ARPAV_LUOGHI WHERE id = ' + id_luogo;
    html5sql.process([sqlDB], function(transaction, results, rowsArray){
        nome_luogo=rowsArray[0].luogo_nome
    }, errorCB);
	
	//console.log('DB SELECT (' + id_luogo + ')');
	
	//VIENE VERIFICATO SE il luogo e' PRESENTE
	var isPresente = false;
	sqlDB = 'SELECT id_luogo FROM ARPAV_FAVORITES WHERE id_luogo = ' + id_luogo + ' ORDER BY showorder';
	
	html5sql.process([sqlDB], function(transaction, results, rowsArray){
		
		if (rowsArray.length > 0) {
			isPresente = true;
			
			//console.log('DB isPresente (' + isPresente + ')');
			
			//alert(nome_luogo + ' gi&agrave; presente!');
			$('#emptymsg')
			.html(nome_luogo + ' gi&agrave; presente!')
			.fadeIn(500, function() {
				$(this).fadeOut(3000);
			});
		}
		else {
			html5sql.process(['SELECT id_luogo FROM ARPAV_FAVORITES ORDER BY showorder'], function(transaction, results, rowsArrTot){
				
				if (rowsArrTot.length < 10) {
						
					//console.log('DB INSERT (' + id_luogo + ',' +  nome_luogo + ')');
					
					html5sql.process([{
						'sql': 'INSERT INTO ARPAV_FAVORITES (id_luogo,luogo_nome)VALUES(?,?)',
						'data': [id_luogo, nome_luogo],
						'success': function(transaction, results){
							//alert(nome_luogo + ' aggiunto correttamente.');
							$('#emptymsg')
							.html(nome_luogo + '<br />aggiunto correttamente.')
							.fadeIn(500, function() {
								$(this).fadeOut(3000);
							});
						}
					}]);
					
				}else{
					//console.log('DB Limite massimo di preferiti Raggiunto');
					//alert('Limite massimo di preferiti (10).');
					$('#emptymsg')
					.html('Limite massimo di preferiti (10).')
					.fadeIn(500, function() {
						$(this).fadeOut(3000);
					});
				}
				
			}, errorCB);
		}
	}, errorCB);
}

// vengono reperiti i preferiti dal db interno
function caricaPreferitiDettaglio(){
		
	html5sql.openDatabase(dbName, dbsName, dbSize);
	
	var sqlDB = 'SELECT id,id_luogo,luogo_nome FROM ARPAV_FAVORITES ORDER BY showorder';
	
	html5sql.process([sqlDB], function(transaction, results, rowsArray){
				
		if (rowsArray.length > 0) {
		
			var listId = "";
			// viene generata la lista di id da inviare al server
			for (var i = 0; i < rowsArray.length; i++) {
				listId += rowsArray[i].id_luogo
				if (i + 1 != rowsArray.length) {
					listId += ",";
				}
			}
			listId+="";
			
			sqlDBx = "SELECT * FROM ARPAV_LUOGHI WHERE id in ("+listId+")";
			//console.log(sqlDBx);
			var data = new Array();
			db.transaction(function (tx) {  
				tx.executeSql(sqlDBx,[], function (tx, resultsx) {
					for(var i=0;i<resultsx.rows.length;i++){
						//console.log(resultsx.rows.item(i).id+" "+resultsx.rows.item(i).luogo_nome);
						switch(resultsx.rows.item(i).stato){
							case "ROSSA":
								statodesc='Zona permanentemente non idonea';
								legenda='si intende una zona permanentemente non balneabile le cui acque sono considerate di qualitˆ scarsa per cinque anni consecutivi.';
								break;
							case "ARANCIO":
								statodesc='Zona temporaneamente non idonea';
								legenda='si intende una zona temporaneamente non balneabile le cui acque presentano valori dei parametri oltre i limiti di legge.';
								break;
							case "BLU":
								statodesc='Zona idonea';
								legenda='si intende una zona balneabile le cui acque presentano valori dei parametri nei limiti di legge.';
								break;
						}
						data.push({"comune":resultsx.rows.item(i).id,"comunenome":resultsx.rows.item(i).comune_nome,"data_stato":resultsx.rows.item(i).data_stato,"descrizione":resultsx.rows.item(i).luogo_nome,"id":resultsx.rows.item(i).id,"corpo":resultsx.rows.item(i).acqua_nome,"latitude":resultsx.rows.item(i).latitude,"legenda":legenda,"longitude":resultsx.rows.item(i).longitude,"stato":resultsx.rows.item(i).stato,"statodesc":statodesc});
					}
					
					var tpl = '\
					<div class="swipe_item" id="{{id}}">\
						<h5 style="color:#017862;margin:5px;">{{comunenome}}</h5>\
						<div class="box-content-container">\
							<div class="box-content">\
								<img src="include/icons/flag_{{stato}}.png" style="float:left;" />\
								<h4 style="margin:0 0 0 50px;">{{descrizione}}</h4>\
								<p class="ui-li-desc" style="margin:0 0 8px 50px;"><strong>{{statodesc}}</strong></p>\
								<p class="ui-li-desc" style="margin:3px 0 0 50px;">{{legenda}}</p>\
								<p class="ui-li-desc" style="margin:8px 0 0 50px;">Data ultimo controllo: {{data_stato}}</p>\
							</div>\
						</div>\
						<div class="nosee" latitude="{{latitude}}" longitude="{{longitude}}" title="<em>{{comunenome}}</em><br/><strong>{{descrizione}}</strong>" stato="{{stato}}" corpo="{{corpo}}"></div>\
					</div>';
					
					$('#swipeItems').html('');
					
					$('.swipeicons').html('');
					$.each(data, function(index, value){
						var html = Mustache.to_html(tpl, this);
						//console.log(value.id_corpo);
						$('#swipeItems').append(html);
					});
					
					$('.swipe_item').hide();
					$('.swipe_item:first').addClass('swipeactive').show();

					// viene generato il navigator dello swipe
					var navSwipe = '';
					var items = 0;
					$.each(data, function(index, item){
						var selezionato = '';
						if (index == 0) {
							selezionato = 'selected';
						}
						navSwipe += '<li class="' + selezionato + '">' + index + '</li>';
						items++;
					});
					
					$('.swipeicons').html(navSwipe);
					
					// viene attivato l'evento swipe
					$("#swipeItems").swipe({swipe:swipe,threshold:0});
						
					function swipe(event, direction){
						
						switch(direction){
							case 'right':
								var prevpage = $('.swipeactive').prev();
								if(prevpage.length > 0){
									changeMySwipeItem(prevpage.attr('id'));
									
									$('.swipeactive').removeClass('swipeactive');
									$('#' + prevpage.attr('id')).addClass('swipeactive');
									
									// gestione dei bullet nei footer
									var precedente = $('.swipeicons li.selected').prev();
									$('.swipeicons li').removeClass('selected');
									precedente.addClass('selected');
								}
								//console.log(prevpage);
							break;
							
							case 'left':
								var nextpage = $('.swipeactive').next();
								if(nextpage.length > 0){
									changeMySwipeItem(nextpage.attr('id'));
									$('.swipeactive').removeClass('swipeactive');
									$('#' + nextpage.attr('id')).addClass('swipeactive');
									// gestione dei bullet nei footer
									var prossimo = $('.swipeicons li.selected').next();
									$('.swipeicons li').removeClass('selected');
									prossimo.addClass('selected');
								}
								//console.log(nextpage);
							break;
						}
						
					}
						
					$('#bindPlaceToMap').bind('click', function(e){
						
						e.preventDefault();
						
						var bloccoDatiMappa = $('.swipeactive .nosee');
						
						var lat = bloccoDatiMappa.attr('latitude');
						var lon = bloccoDatiMappa.attr('longitude');
						var title = bloccoDatiMappa.attr('title');
						var stato = bloccoDatiMappa.attr('stato');
						
						var corpo = bloccoDatiMappa.attr('corpo');
						
						//console.log(id_corpo);
						bindButtonAndGetAllPointofCorpoIdrico(corpo, lat, lon, title, stato);
						
						//bindButtonAndgetMap(lat, lon, title, stato);
					});
				}, errorCB);
			});
		}	
		
	}, errorCB);
	
}

function bindButtonAndgetMap(lat, lon, title, stato){

	changeMypage('mappa_luogo');
				
	var id_luogo = $('.swipeactive').attr('id');
	$('#btn_mappa_luogo_torna').attr('onclick', 'loadFavorites();');
	
	// viene rimosso il bottone preferiti
	$('#btn_mappa_luogo_fav').remove();
	
	setTimeout(function(){
		renderGmap(lat, lon, title, stato, 'map_luogo_fav');
	}, 300);
}

function bindButtonAndGetAllPointofCorpoIdrico(corpo, lat, lon, title, stato){
	//console.log(lat+" "+lon);
	$('#loader').css('display', 'block');
	
	sqlDB = "SELECT * FROM ARPAV_LUOGHI WHERE (acqua_nome LIKE '%"+corpo+"%')";
	//console.log(sqlDB);
	db.transaction(function (tx) {  
		tx.executeSql(sqlDB,[], function (tx, results) {
			$('#renderPMaps').html('');
			var punti = '';
			for(var i=0;i<results.rows.length;i++){
				punti += '<div class="pointdata" latitude="' + results.rows.item(i).latitude + '" longitude="' + results.rows.item(i).longitude;
				punti += '"  title="<em>' + results.rows.item(i).comune_nome + '</em><br/><strong>';
				punti += results.rows.item(i).luogo_nome + '</strong>" stato="' + results.rows.item(i).stato + '"></div>';	
			}
			$('#renderPMaps').append(punti);
			//console.log($('#renderPMaps').html());
		});
	});
	
	setTimeout(function(){
		renderGmapMuchPlace('#renderPMaps .pointdata', 'map_luoghiall', corpo, '', lat, lon, title, stato);
		
		$('#loader').css('display', 'none');
		changeMypage('mappa_luoghi');
		
	}, 3000);
}

function renderGmapMuchPlace(elemento, idmappa, corpo, comune, lat, lon, title, stato){
	
	var punti = $(elemento); // blocco div contententi le info
	var infoWindowList = [];
	var map;
	var arrMarkers = [];
	var zoomCoord = 8;
	var activeMarker;
	// base config Map
    
    document.getElementById(idmappa).style.height=(window.innerHeight-91)+"px";
		
	var centerCoord = new google.maps.LatLng(45.512302, 11.564698); // centro su padova
	var mapOptions = {
		zoom: zoomCoord,
		mapTypeId: google.maps.MapTypeId.ROADMAP,
		navigationControlOptions: {
			style: google.maps.NavigationControlStyle.SMALL
		}
	};
	
	// Map init
	map = new google.maps.Map(document.getElementById(idmappa), mapOptions);
	
	// viene creato l'oggetto infowindow e resettato il suo contenuto
	var infowindow = new google.maps.InfoWindow({
		content: ''
	});
	
	var myOptions = {
		content: ''
		,disableAutoPan: false
		,maxWidth: 0
		,pixelOffset: new google.maps.Size(-140, 0)
		,zIndex: null
		,boxStyle: { 
			background: "url('include/icons/tipbox.gif') no-repeat"
			,opacity: 0.9
			,width: "250px"
		}
		,closeBoxMargin: "28px 10px 2px 2px"
		,closeBoxURL: "http://www.google.com/intl/en_us/mapfiles/close.gif"
		,infoBoxClearance: new google.maps.Size(1, 1)
		,isHidden: false
		,pane: "floatPane"
		,enableEventPropagation: false
	};
	
	var ib = new InfoBox(myOptions);
	//console.log(punti.length);
	$.each(punti, function(i, item){
		//console.log($(item).attr('title'));
		var thislat = $(item).attr('latitude');
		var thislon = $(item).attr('longitude');
		var thistitle = $(item).attr('title');
		var thisStato = $(item).attr('stato');
		
		var boxText = document.createElement("div");
		boxText.style.cssText = "text-align:center;font-size:0.8em;border: 1px solid #333; margin-top: 8px; background: #fff; padding: 10px;";
		boxText.innerHTML = thistitle;
		
		var marker = new google.maps.Marker({
			position: new google.maps.LatLng(thislat, thislon),
			map: map,
			visible: true,
			animation: google.maps.Animation.DROP,
			icon: 'include/icons/bandiera_' + thisStato + '.png',
			title: thistitle,
			zIndex: (lat == thislat && lon == thislon) ? i + 9000 : i,//Math.round(thislat * -100000) << 5,
			html: boxText
		});
		
		arrMarkers.push(marker);
		
		google.maps.event.addListener(marker, "click", function (e) {
			ib.setContent(marker.html);
			ib.open(map,this);  
		});
		
		//console.log(thislat + ':' + lat + ' --- ' + thislon + ':' + lon);
		
		// viene aperta la popup sul punto scelto
		//console.log(lat+" "+lon+" "+thislat+" "+thislon);
		if(lat == thislat && lon == thislon){
			//console.log('qua');
			centerCoord = new google.maps.LatLng(thislat, thislon);
			activeMarker = marker;
		}
		
	});

	map.setCenter(centerCoord);
	google.maps.event.trigger(map, 'resize');
	map.setOptions(mapOptions);
	map.setZoom(14);
	if(lat!=''&&lon!="")
		setTimeout(function(){apriInfowindow();}, 900);
	
	function apriInfowindow(){
		ib.setContent(activeMarker.html);
		ib.open(map,activeMarker);
	}
	
	if(comune == ''){
		// viene creato il link per il bottone torna
		$('#btn_mappa_luoghi_torna').attr('onclick', 'hideSplash();');
		
		// viene diversificato il centromappa per i diversi corpi idrici
		switch(corpo){
		
			case 'LAGO DI GARDA':  // lago di garda
				// zoom 9 centro su brenzone 45.676909,10.739549
				centerCoord = new google.maps.LatLng(45.676909,10.739549);
				map.setZoom(9);
				
			break;
			
			case 'MARE ADRIATICO':  // mare adriatico
				// zoom 8 centro su VENEZIA LIDO ALBERONI
				centerCoord = new google.maps.LatLng(45.35333,12.33167);
				map.setZoom(8);
				
				//console.log('qui');
			break;
			
			default:  // altro
				// zoom 8 centro su castelfranco veneto
				centerCoord = new google.maps.LatLng(45.674643,11.928234);
				map.setZoom(8);	
			break;
		}
		
		//console.log(map.getZoom());
		map.setCenter(centerCoord);
	}
	else{
		// viene creato il link dinamico per il bottone torna
		$('#btn_mappa_luoghi_torna').attr('onclick', 'caricaLuogo(\'' + comune + '\',\'' + corpo + '\');');
		
		// viene identificato il punto per centrare la mappa
		// prendendo quello a meta'
		$.each(punti, function(i, item){
			if(punti.length==1){
	            centerCoord = new google.maps.LatLng($(item).attr('latitude'), $(item).attr('longitude'));
	            map.setCenter(centerCoord);
			}
			if (i + 1 == parseInt(punti.length / 2)) {
				centerCoord = new google.maps.LatLng($(item).attr('latitude'), $(item).attr('longitude'));
				map.setCenter(centerCoord);
			}
		});
		map.setZoom(11);	
	}
}

function clearMarkers(){ 
	for(var i=0; i<arrMarkers.length; i++){ 
		arrMarkers[i].set_map(null); 
	} 
	arrMarkers.length = 0; 
}; 

function renderGmap(lat, lon, title, stato, elemento){

	var map2;
	var arrMarkers2 = [];
	var arrInfoWindows2 = [];
    
    document.getElementById(elemento).style.height=(window.innerHeight-91)+"px";
	
	// base config Map
	var centerCoord2 = new google.maps.LatLng(45.401463, 11.890297); // centro su padova
	var mapOptions2 = {
		zoom: 14,
		center: centerCoord2,
		mapTypeId: google.maps.MapTypeId.ROADMAP, //SATELLITE,
		navigationControlOptions: {
			style: google.maps.NavigationControlStyle.SMALL
		}/*,
		mapTypeControlOptions: {
			style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
		}*/
	};
	// Map init
	map2 = new google.maps.Map(document.getElementById(elemento), mapOptions2);
	
	var marker2 = new google.maps.Marker({
		position: new google.maps.LatLng(lat, lon),
		map: map2,
		draggable: false,
		visible: true,
		animation: google.maps.Animation.DROP,
		icon: 'include/icons/bandiera_' + stato + '.png',
		title: title
	});
	map2.setCenter(marker2.position);
	
	var boxText2 = document.createElement("div");
	boxText2.style.cssText = "text-align:center;font-size:0.8em;border: 1px solid #333; margin-top: 8px; background: #fff; padding: 10px;";
	boxText2.innerHTML = title;
	
	var myOptions = {
		content: boxText2
		,disableAutoPan: false
		,maxWidth: 0
		,pixelOffset: new google.maps.Size(-140, 0)
		,zIndex: null
		,boxStyle: { 
			background: "url('include/icons/tipbox.gif') no-repeat"
			,opacity: 0.9
			,width: "250px"
		}
		,closeBoxMargin: "28px 10px 2px 2px"
		,closeBoxURL: "http://www.google.com/intl/en_us/mapfiles/close.gif"
		,infoBoxClearance: new google.maps.Size(1, 1)
		,isHidden: false
		,pane: "floatPane"
		,enableEventPropagation: false
	};
	
	var ib = new InfoBox(myOptions);
	
	google.maps.event.addListener(marker2, "click", function (e) {
		ib.open(map2, this);
	});
	
	map2.setCenter(marker2.position);
	ib.open(map2, marker2);
}
