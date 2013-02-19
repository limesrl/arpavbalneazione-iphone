/*
 * Arpav - Balneazione 
 * App controller
 * 2012-07-11
 * Stefano Manzoni @Archimedia
 */

 
var fullURL = window.document.URL;
//var srvPath = 'http://89.96.234.243/dati/xml/balneazione/BALNEAZIONE.xml';  // feed origine
var srvPath = 'http://apps.info-way.com/arpav/balneazione/android/';

var dbAggiornato = false;

var deviceLat = '';
var deviceLon = '';

 /* Database sqlite3 */
var dbName = 'org.archimedia.arpavdb';
var dbVers = '1.1';
var dbsName = 'Arpav database';
var dbSize = 1*1024*1024; // 1 Mb 
var db = openDatabase(dbName, dbVers, dbsName, dbSize);

var sqlDB = '';
var isPresente = false;


//var drop=true;
var drop=false;

if(drop){
	var createSQLpreferiti = 'DROP TABLE IF EXISTS ARPAV_FAVORITES;';
	var createSQLluoghi = 'DROP TABLE IF EXISTS ARPAV_LUOGHI;';
	//var createSQLindex = 'DROP TABLE IF EXISTS ARPAV_LUOGHI;';
}
else{
	var createSQLpreferiti = 'CREATE TABLE IF NOT EXISTS ARPAV_FAVORITES (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,id_luogo INTEGER NULL, luogo_nome TEXT NULL, showorder INTEGER NULL);';
	var createSQLluoghi = 'CREATE TABLE IF NOT EXISTS ARPAV_LUOGHI (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,acqua_nome TEXT NULL,comune_nome TEXT NULL,luogo_nome TEXT NULL,data_stato TEXT NULL,stato TEXT NULL,latitude TEXT NULL,longitude TEXT NULL);';
	//var createSQLindex = 'CREATE UNIQUE INDEX IF NOT EXISTS acqua_nome_idx ON ARPAV_LUOGHI(acqua_nome,comune_nome,luogo_nome);';
}


// apertura connessione al DB
function openDbLiveConnection(){
	db.transaction(function(tx){
		tx.executeSql(createSQLpreferiti);
		var dropluoghi = 'DROP TABLE IF EXISTS ARPAV_LUOGHI;';
		tx.executeSql(dropluoghi,[],function(tx,results){},errorCB);
		//tx.executeSql(createSQLluoghi,[],function(tx,results){},errorCB);
		//tx.executeSql(createSQLindex);
	});

	$.ajax({
		type:'get',
		url:'http://89.96.234.243/dati/xml/balneazione/BALNEAZIONE.xml',
		beforeSend:function(){
			db.transaction(function(tx){
				tx.executeSql(createSQLluoghi,[],function(tx,results){},errorCB);
				//tx.executeSql(createSQLindex);
			});
			/*if(drop)
				ExitFromApp();*/
		},
        async:false,
		timeout:10000,		//sets timeout for the request (10 seconds)
		error:function(xhr,status,error){
			//alert('Error: '+xhr.status+' - '+error);
			notifica('Attenzione!', 'E\'necessaria la connessione ad internet.\n\nConnettiti e riavvia l\'app.', 'Ok', ExitFromApp);
		},	//alert a message in case of error
		dataType:'xml',
		success:function(response){
			db.transaction(function(tx){
				$(response).find('row').each(function(){
                    var data_unformat = $(this).find('DATA_VALIDAZIONE').text().trim().slice(0,10).split("-");
                    var data_val=data_unformat[2]+"/"+data_unformat[1]+"/"+data_unformat[0];
					tx.executeSql(
						'INSERT OR REPLACE INTO ARPAV_LUOGHI (acqua_nome,comune_nome,luogo_nome,data_stato,stato,latitude,longitude) VALUES (?,?,?,?,?,?,?)',
						[$(this).find('CORPO_IDRICO').text().trim(),$(this).find('COMUNE').text().trim(),$(this).find('DESCR').text().trim(),data_val,$(this).find('STATOATT').text().trim(),$(this).find('Y_WGS').text().trim(),$(this).find('X_WGS').text().trim()],
						function(tx,results){
							//console.log("[PIPPINFO] "+"inserito corpo idrico");
							//console.log(results.insertId);
							tx.executeSql(
								'UPDATE ARPAV_FAVORITES SET id_luogo=? WHERE luogo_nome=(SELECT luogo_nome FROM ARPAV_LUOGHI WHERE id=?)',
								[results.insertId,results.insertId],
								function(tx,results){
									//console.log("[PIPPINFO] "+"inserito corpo idrico");
								},
								errorCB
							);
						},
						errorCB
					);
				});
				tx.executeSql(
					'DELETE FROM ARPAV_FAVORITES WHERE luogo_nome NOT IN (SELECT luogo_nome FROM ARPAV_LUOGHI)',
					[],
					function(tx,results){
						//console.log("[PIPPINFO] "+"inserito corpo idrico");
					},
					errorCB
				);

			});
           hideSplash();
		}
	});
}

//in caso di errore SQL
function errorCB(tx, err){
	alert('Error processing SQL: \n' + err.message);
}

function ShowLoader(section){
	$.mobile.showPageLoadingMsg();
	//$.mobile.showPageLoadingMsg('a', section, true);
}

function HideLoader(){
	$.mobile.hidePageLoadingMsg();
	//$.mobile.loading('hide');
}

function vrVibra(time){
	// 1000:1secondo | 2000:2secondi....
	navigator.notification.vibrate(time);
}

function vrBeep(time){
	// 1:beep | 2:beep-beep....
	navigator.notification.beep(time);
}

function openExternalURL(url){

	var result = confirm('Stai per collegarti ad un sito web, esterno all\'App.\n Continuare?');
	if (result) {
		window.open(url, '_blank');
	}
}

//funzione addetta a verificare se il device e' connesso alla rete
function DeviceIsOnLine(){

	//var networkState = navigator.network.connection.type;
	var networkState = navigator.connection.type;
	//alert(networkState);
	var states = {};
	
	states[Connection.UNKNOWN] = 'WIFI';
	states[Connection.ETHERNET] = 'ETHE';
	states[Connection.WIFI] = 'WIFI';
	states[Connection.CELL_2G] = 'GSM';
	states[Connection.CELL_3G] = 'GSM3G';
	states[Connection.CELL_4G] = 'GSM4G';
	states[Connection.NONE] = 'NO';
	
	switch (states[networkState]) {
		case 'NO':
			return false;
			break;
		case 'GSM':
			return true;
			break;
		case 'GSM3G':
			return true;
			break;
		case 'GSM4G':
			return true;
			break;
		case 'WIFI':
			return true;
			break;
		case 'ETHE':
			return true;
			break;
	}
	//alert('Connection type: ' + states[networkState]);
}

// Funzione addetta a visualizzare una notifica tipo alert
function notifica(titolo, testo, buttontxt, funzione){
	navigator.notification.alert(testo, funzione, titolo, buttontxt);
}

//Funzione addetta a forzare l'uscita dell'app
function ExitFromApp(){
	navigator.app.exitApp();
}

//funzione addetta a reperire l'hash dall'url
function getUrlVars(){
	var vars = [], hash;
	var hashes = window.location.href.slice(window.location.href.lastIndexOf('?') + 1).split('&');
	for (var i = 0; i < hashes.length; i++) {
		hash = hashes[i].split('=');
		vars.push(hash[0]);
		vars[hash[0]] = hash[1];
	}	
	return vars;
}
