sap.ui.define([ 
        "sap/ui/model/odata/v2/ODataModel", 
        "sap/ui/model/Filter",
		"sap/ui/model/FilterOperator",
		"crystal/rtinv/controller/BaseController",
		"crystal/rtinv/model/formatter",
		"sap/m/MessageBox"
], function(ODataModel, Filter, FilterOperator, BaseController, formatter, MessageBox) {
	
	"use strict";
	var inputWhsNum = 'CC1';
	
	return BaseController.extend("crystal.rtinv.controller.TransferOrderLst", {
		formatter : formatter,

		onInit : function() {
			this.setModuleHeader("module2");
			
			var oView = this.getView();
			oView.byId("navBack").setVisible(false);
			var oSU = oView.byId("storageUnit");
			
			var oModel = new sap.ui.model.json.JSONModel("model/transOrdType.json");
			oView.byId("comboBox").setModel(oModel, "comboModel");
//			oView.byId("comboBox").setSelectedKey(["All"]);
			oSU.setValue("");
			
			this.showTableBySU(false);
			var oTable = oView.byId("resultTable").setVisible(false);
		    oView.byId("btnConfirm").setText("Confirm");

			oView.addEventDelegate({
			    onBeforeShow: function(){
			    	jQuery.sap.delayedCall(500, this, function() {					    
//					    if (window.location.hostname == 'localhost'){
//							oSU.setValue("1000000");
//						}
					    oSU.focus(); 
					 });
			    }
			});
		},

		onSelectionChanged : function(oEvent) {
			this.onSearch();
		},
		
		onChangeSU: function(oEvent) {
			var suNo = oEvent.getParameter("value");
			if (suNo.length == 10 ){
				this.onSearch();
//				this.NavToConfirmPage();
				var oView = this.getView();
				oView.byId("btnConfirm").setText("Confirm");
				var oTable = oView.byId("resultTableBySU");
				var oBindings = oTable.getBinding("items");
				var oModel = oBindings.getModel("rtInvModel");
				var sPath = oBindings.sPath;
				var aFilters = oBindings.aFilters;
				
				var that = this;

				oModel.setUseBatch(false);
				oModel.read(sPath,{
					filters: aFilters,
					success: function(oData) {
//						console.log(oData);
						var alreadyChecked = false;
						
						if (oData.length == 0){
							oView.byId("storageUnit").focus();
						}
						else {
							for (var index in oData.results) {
							   if (oData.results.hasOwnProperty(index)) {
//								   console.log(oData.results[index].MixInd);
								   var mixedInd = oData.results[index].MixInd;
								   var moveType = oData.results[index].MoveType;
								   
								   
								   if (alreadyChecked == false){
									   alreadyChecked = true;
									   if (moveType == "101" || moveType == "103" || moveType == "312" || 
											   moveType == "651" || moveType == "999" || moveType == "932" || 
											   moveType == "934" ){	
										   that.getView().byId("actualTargetBin").setEditable(true);
										   that.getView().byId("actualTargetBin").setVisible(true);	
									   } else {
										   that.getView().byId("actualTargetBin").setEditable(false);
										   that.getView().byId("actualTargetBin").setVisible(false);
									   }
									   
									   if (mixedInd == true){
										   oView.byId("btnConfirm").setText("Split is Done and Confirm");
										   //auto focus - for scanning purpose
										   oView.byId("actualTargetBin").focus();
										   MessageBox.alert(that.getI18nModel().getText("wmsg_PalletSplit"), {
											   
											   icon: sap.m.MessageBox.Icon.WARNING,
											   title: "WARNING",
											   onClose : function(oAction) {
												   oView.byId("btnConfirm").setText("Split is Done and Confirm");
												   //auto focus - for scanning purpose
												   oView.byId("actualTargetBin").focus();
											   }
										   });
									   }
									   
								   }
								   
							   }
							}
						}
						
						
					},
					error: function(oError){
						
						var errorType, errorMsg;
						
						var httpErrorType = oError.statusCode;
						var httpErrorMsg = oError.message;
						var httpErrorTxt = oError.statusText;
						
						if (oError.responseText.startsWith("<?xml")){
							//Parse XML format
							var parser = new DOMParser();
							var xmlDoc = parser.parseFromString(oError.responseText, "text/xml");
							errorType = xmlDoc.getElementsByTagName("statusCode");
							errorMsg = xmlDoc.getElementsByTagName("message")[0].textContent;
						}else {
							//Parse JSON format
							var errorJson = JSON.parse(oError.responseText);
							var errorDetail = errorJson.error.innererror.errordetails;
							if (errorDetail == undefined || errorDetail.length == 0){
								errorType = errorJson.error.code;
								errorMsg = errorJson.error.message.value;
							}
							else {
								errorType = errorJson.error.innererror.errordetails[0].severity;
								errorMsg = errorJson.error.innererror.errordetails[0].message;
							}
							
						}
						that.showTableBySU(false);
						MessageBox.alert(errorType +" : "+errorMsg, {
							icon: sap.m.MessageBox.Icon.ERROR,
							title: "ERROR"
						});
						
					}
				});
				
				jQuery.sap.delayedCall(500, this, function() {
					this.getView().byId("actualTargetBin").focus();
				});
				this.showTableBySU(true);
				
			}
		},
		
		confirmTOBySU: function(){
			//get all actual qty from input, and put them in an array.
			var actlQty = [];
			$(".sapMListTblCell .sapMInputBaseInner").each(function(index) {
				actlQty[index] = $(this).val();
			});			
			if (actlQty.length==0){
				
				MessageBox.alert(this.getI18nModel().getText("emsg_NoTO"), {
					icon: sap.m.MessageBox.Icon.ERROR,
					title: "ERROR"
				});
				return ; 
			}
			//get Actual target bin
			var actualTgtb = this.getView().byId("actualTargetBin").getValue();
			
			var oTable = this.getView().byId("resultTableBySU");
			var oBindings = oTable.getBinding("items");
			var oModel = oBindings.getModel("rtInvModel");
			var oData = [];
			var oPaths = oBindings.aKeys;
			if (oPaths!= null && oPaths.length != 0 ){
				for (var i = 0; i < oPaths.length; ++i){
					var item = oModel.getData("/"+oPaths[i]);
					//set the operation to be update
					item.Operate = 'C';
					//set actual target bin
					if (actualTgtb.trim()==""){
						item.ActualTgtb = item.TargetBin;
					}else {
						item.ActualTgtb = actualTgtb;
					}
					//set actual quantity
					if (actlQty[i] == null || actlQty[i].trim() == ""){
						item.ActualQty = item.Quantity;
					}else {
						if (Number(actlQty[i]) > Number(item.AvailableQty) || Number(actlQty[i]) < 0){
							
							MessageBox.alert(this.getI18nModel().getText("emsg_WrongQty"), {
								icon: sap.m.MessageBox.Icon.ERROR,
								title: "ERROR"
							});
							return;
						} else {
							item.ActualQty = actlQty[i];
						}
					}
					oData.push(item);
				}
			}
						
			var oParams = { batchGroupId: "ConfirmTOBySU"};
			var rtInvModel = this.getRtInvModel();
			this.updateTOByBatch(rtInvModel, oPaths, oData, oParams);
						
			this.getView().byId("actualTargetBin").setValue("");
			
			jQuery.sap.delayedCall(500, this, function() {
				oModel.setUseBatch(false);
				this.getView().byId("storageUnit").focus();
			});
			
		},
		
		updateTOByBatch: function(oModel, oPaths, oData, oParams){
			oModel.setUseBatch(true);
			oModel.setDeferredBatchGroups(["ConfirmTOBySU"]);
			
						
			var batchChanges = [];
			for (var i = 0; i < oData.length; ++i){
				oModel.update("/"+oPaths[i], oData[i], oParams);
			}
			var that = this;
			var oView = this.getView();
			oModel.submitChanges({
                batchGroupId: oParams.batchGroupId,
                success: function (oResponse) {
                	oModel.setUseBatch(false);
                    console.log(oResponse);
                	var oError = oResponse.__batchResponses[0].response;
                	if (oError != null){
                		var errorJson = JSON.parse(oError.body);
                		var errorCode = errorJson.error.code;
                		var errorMsg = errorJson.error.message.value;
                		
                		MessageBox.alert(errorCode +" : "+errorMsg, {
    						icon: sap.m.MessageBox.Icon.ERROR,
    						title: "ERROR"
    					});
                	}else {
    					sap.m.MessageToast.show("Success");
    					that.showTableBySU(false);
                	}
                },
                error: function (oError) {
                	oModel.setUseBatch(false);
                	var errorCode, errorMsg;
										
					if (oError.responseText.startsWith("<?xml")){
						//Parse XML format
						var parser = new DOMParser();
						var xmlDoc = parser.parseFromString(oError.responseText, "text/xml");
						errorCode = xmlDoc.getElementsByTagName("code")[0].textContent;
						errorMsg = xmlDoc.getElementsByTagName("message")[0].textContent;
					}
                	
					MessageBox.alert(errorCode +" : "+errorMsg, {
						icon: sap.m.MessageBox.Icon.ERROR,
						title: "ERROR"
					});

                	that.showTableBySU(false);
                }
            });
		},
		
		updateTO: function( oModel, oPath, oEntry){
			oModel.setUseBatch(false);
			var oView = this.getView();
			oModel.update("/"+oPath, oEntry, {
				success : function(oData, oResponse) {
					sap.m.MessageToast.show("Success");
					oView.byId("actualQty").setEditable(false);
					oView.byId("actualTargetBin").setEditable(false);
					oView.byId("btnConfirm").setEnabled(false);
				},
				error : function(oError) {
					
					var errorType, errorMsg;
					
					var httpErrorType = oError.statusCode;
					var httpErrorMsg = oError.message;
					var httpErrorTxt = oError.statusText;
					
					if (oError.responseText.startsWith("<?xml")){
						//Parse XML format
						var parser = new DOMParser();
						var xmlDoc = parser.parseFromString(oError.responseText, "text/xml");
						errorType = xmlDoc.getElementsByTagName("statusCode");
						errorMsg = xmlDoc.getElementsByTagName("message")[0].textContent;
					}else {
						//Parse JSON format
						var errorJson = JSON.parse(oError.responseText);
						var errorDetail = errorJson.error.innererror.errordetails;
						if (errorDetail == undefined || errorDetail.length == 0){
							errorType = errorJson.error.code;
							errorMsg = errorJson.error.message.value;
						}
						else {
							errorType = errorJson.error.innererror.errordetails[0].severity;
							errorMsg = errorJson.error.innererror.errordetails[0].message;
						}
						
					}
					
					MessageBox.alert(errorType +" : "+errorMsg, {
						icon: sap.m.MessageBox.Icon.ERROR,
						title: "ERROR"
					});
					
				}
			});
		},
		
		showTableBySU: function(boolean){
			this.getView().byId("resultTable").setVisible(!boolean);
			this.getView().byId("resultTableBySU").setVisible(boolean);
			this.getView().byId("actualTargetBin").setValue("");
		},
		
		enableConfirmButton: function(oEvent) {
			var binLoc = oEvent.getParameter("value");
			if (binLoc.length == 10 ){
			}
		},

		onSearch : function() {
			var oTable = this.getView().byId("resultTable");
			var oTableBySU = this.getView().byId("resultTableBySU");
			oTable.setVisible(false);
			oTableBySU.setVisible(false);
			// get input values
			var oComboBox = this.getView().byId("comboBox");
			var inputStorageUnit = this.getView().byId("storageUnit").getValue();
			var inputTONo = this.getView().byId("TONo").getValue();
			
			var mTypeCode = oComboBox.getSelectedItem().getKey();
			var mTypeValue = oComboBox.getSelectedItem().getText();
			var mIMTypeCode = oComboBox.getSelectedItem().getAdditionalText();
			var tableTitle = this.getView().byId("transferOrder");
			var tableTitleBySU = this.getView().byId("transferOrderBySU");
			var oSU = this.getView().byId("storageUnit");

			
			
			// filter binding data
			var aFilter = [];
			aFilter.push(new Filter("WhseNumber", FilterOperator.EQ, inputWhsNum));
			tableTitle.setText("Transfer Order List: " +mTypeValue);
				
			if (mTypeCode != "All"){				
				aFilter.push(new Filter("MoveType", FilterOperator.EQ, mTypeCode));		
			}
			if (mIMTypeCode != ""){
				aFilter.push(new Filter("IMMoveType", FilterOperator.EQ, mIMTypeCode));
			}
			if (inputStorageUnit.trim() != ""){
				aFilter.push(new Filter("StorageUnit", FilterOperator.EQ, inputStorageUnit));
			}
			if (inputTONo.trim() != ""){
				aFilter.push(new Filter("TransOrd", FilterOperator.EQ, inputTONo));
			}
			if (aFilter.length != 0){
				oTable.getBinding("items").filter(aFilter);
				oTableBySU.getBinding("items").filter(aFilter);
				this.showTableBySU(false);
				oSU.setValue("");
				oSU.focus();
			}
		},
		
		NavToConfirmPage: function(){
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("trnsfOrdConfirm");
			
		},
		
		onNav : function(oEvent) {
			// /TransferOrderSet(WhseNumber='CC1',TransOrd='0000000941',ToItem='0001')
			var oSource = oEvent.getSource();
			var oContext = oSource.getBindingContext("rtInvModel");
			var oModel = oContext.getModel();
			var oPath = oContext.getPath();
			var toItem = oModel.getData(oPath);
						
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("trnsfOrdDtl");
			
			var eventBus = sap.ui.getCore().getEventBus();
			eventBus.publish("TOChannel", "onNavigateEvent", {
				toItem: toItem,
				oPath: oPath
			});	
		}

	});
});