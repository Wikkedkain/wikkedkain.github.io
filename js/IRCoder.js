var ircoder = (function() {
	/* Variables */
	var siteBranch;
	var localdevURL = 'http://localhost:1716/IRCoderDev/Login.aspx';
	var names = ["Johnny", "Testpatient"];
	
	/* Helpers */
	String.prototype.format = function(format) { var args = arguments; return this.replace(/{(\d+)}/g, function(match, number){ return typeof args[number] != 'undefined' ? args[number] : match;}); }
	String.prototype.contains = function(val){ return this.toString().indexOf(val) > -1; }
	Date.prototype.getTimeStamp = function(){ return this.getHours() + ":" + ('0' + this.getMinutes()).slice(-2); }
	
	/* Util Functions */
	function buildUserSelection(params) {
		var credentials = params.credentials;
		var userSelection = "<div id='divUserSelection' style='display:none;overflow:hidden;text-align:center;height:{0}'>".format(credentials.length * 30);
		for(var i = 0; i < credentials.length; i++) {
			userSelection += "<button data-index='{0}' style='height:{1}%;width:150px;'>{2}</button><br />".format(i, ((1/credentials.length)*100).toFixed(0), credentials[i].name);
		}
		userSelection += "</div>";
		
		return userSelection;
	}
	
	function performLogin(params, index) {
		var credentials = params.credentials;
		var index = index == undefined ? 0 : index; // default to first
		$("[id*='txt_email']").val(credentials[index].email);
		$("[id*='txt_password']").val(credentials[index].pass);
		$("[id*='btn_submit']").click();
	}
	
	function setBranch() {
		siteBranch = '';
		var parts = location.pathname.slice(1).split('/');
		if(parts.length > 1)
			siteBranch = '/' + parts[0];
		console.log('Branch: "' + siteBranch + '"');
	}
	
	function redirectToLogin() {
		if(location.pathname.contains('Login') || isLoggedIn()) {
			redirectTo('main', 'welcome');
			return;
		}
		redirectToMainPage('Login.aspx')
	}
	
	function redirectToMainPage(aspxPage) {
		redirectTo('', '', aspxPage);
	}
	
	function redirectTo(module, control, aspxPage) {
		if(aspxPage == undefined || aspxPage == ''){aspxPage = 'default.aspx';}
		var url = "{0}{1}{2}/{3}".format(location.host, siteBranch, module == '' ? '' : '/app', aspxPage);
		var search = ((control != undefined && control != '') ? '?t={0}&a={1}' : module != undefined && module != '' ? '?t={0}' : '').format(module, control);
		console.log('Redirecting... ', url, search);
		location.href = location.protocol + '//' + url + search;
	}
	
	function isInIRCoder() {
		return location.href.contains('localhost') || location.href.contains('ircoder.com');
	}
	
	function isLoggedIn() {
		return !!$("#LoginInfo").length; // if login info is displayed, we are logged in
	}
	
	/* Page handlers */
	var pageHandlers = {
		"Login.aspx": function (params) {
			if($("#divUserSelection").length > 0) {// login as first credential on 2nd click
				$("#divUserSelection").hide();
				performLogin(params);
			}
				
			$("body").append(buildUserSelection(params));
			$("#divUserSelection").dialog({
				autoOpen: false,
				//title: "User Selection",
				//modal: true,
				width: 200,
				height: 40 * params.credentials.length,
				resizable: false,
				appendTo: jQuery("form:first")
			}).dialog('option', 'position', [5,5]);
			$("#divUserSelection button").button();
			$("#divUserSelection button").click(function(e){
				e.preventDefault();
				$("#divUserSelection").dialog('close');
				performLogin(params, +$(this).data('index'));
				return false;
			});
			$(".ui-dialog-titlebar").hide();
			$("#divUserSelection").dialog('open');
		},
		"welcome": function () {
			redirectTo('main', 'modules');
		},
		"create": function() {
			if($("[id*='txtPatientLastName']").val() === '' || $("[id*='txtAccountNumber_txtInput']").val === '') {
				var date = new Date();
				var randomAccountNumber = 'TestAcc_' + date.getTimeStamp(),
				randomRecordNumber = 'TestMRN_' + date.getTimeStamp();
				randomAccessionNumber = 'TestAcs_' + date.getTimeStamp();
				
				$("[id*='txtMedicalRecordNumber_txtInput']").val(randomRecordNumber);
				$("[id*='txtAccountNumber_txtInput']").val(randomAccountNumber);
				$("[id*='txtAccessionNumber_txtInput']").val(randomAccessionNumber);
				
				$("[id*='txtPatientLastName']").val(names[1]);
				$("[id*='txtPatientFirstName']").val(names[0]);
				
				$("[id*='txtPatientDateOfBirth']").val('05/01/1989');
				$("[id*='rblPatientGender_0']").click();
				$("[id*='rblIsMedicarePatient_0']").click();
				$("[id*='rblOutpatientStatus_0']").click();
			}
			
			$("[id*='btn_save'], [id*='btn_confirm']").click();
		},
		"modules": function() {
			if($("[id*='ddl_location']").is(":visible")) { // if location is available
				var main = $("[id*='ddl_location']").find('option:contains("Main Location")').val();
				if(main != null) {
					$("[id*='ddl_location']").val(main);
				}
				else {
					$("[id*='ddl_location']").prop('selectedIndex', 1); // select 1st
				}
			}
			if($("[id*='ddl_department']").is(":visible")) { // if department is available
				if($("[id*='ddl_department']").prop('selectedIndex') === 0) {
					$("[id*='ddl_department']").prop('selectedIndex', 1);//val($("[id*='ddl_department']").find('option:contains("Cardiac Cath Lab")').val());
					setTimeout(function(){$("#RoomSelect").prop('selectedIndex', 1);}, 500);
				}
				else {
					$("[id*='ddl_department']").prop('selectedIndex', 2);//val($("[id*='ddl_department']").find('option:contains("Cardiology")').val());
					setTimeout(function(){$("#RoomSelect").prop('selectedIndex', 2);}, 500);		
				}
				$("[id*='ddl_department']").change();
				
			}
			
			// select vascular module
			$("#" + $('label:contains("Vascular Module")').prop('for')).click();
		},
		"recover": function() {
			$("[id*='btnSkipUpper']").click();
		},
		"PickList": function () {		
			$("[id*='btnSkipTop']").click();
		},
		"app": function(){console.log('do nothing');},
		"": redirectToLogin
	};
	
	
	/* Public API */
	var my = {};
	
	my.handlePage = function(params) {
		if(isInIRCoder()) {
			setBranch();
			for(key in pageHandlers) {
				if(location.href.contains(key)) {
					console.log('Calling handler for: "' + key + '"');
					pageHandlers[key](params);
					break;
				}
			}
		}
		else {
			location.href = localdevURL;
		}
	}
	
	return my;
}());