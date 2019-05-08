import React from 'react';
import Meta from '../lib/meta';
import server from '../services/server';
import TopNavBar from '../UIComponents/TopNavBar/TopNavBar'
import TypedActivistsTable from './typer/TypedActivistsTable'
import ContactScanDisplay from './typer/ContactScanDisplay'
import FieldValidation from '../services/FieldValidation'
import Popup from '../UIComponents/Popup/Popup';
import style from './typer/Typer.css'
import fontawesome from '@fortawesome/fontawesome'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import { faCloudUploadAlt } from '@fortawesome/fontawesome-free-solid'
import ScanForm from "./scanContacts/ScanForm";
fontawesome.library.add(faCloudUploadAlt);




export default class Typer extends React.Component {
	//constants
	scanPingIntervalDuration = 10000;

	constructor(props) {
		super(props);
		this.state = {
			activists:[],
			profileFields: [
				{
					name: "firstName", type: "text", ar: "الاسم الشخصي", he: "שם פרטי",
					validation: /^.{2,}$/,
					required: true
				},
				{
					name: "lastName", type: "text", ar: "اسم العائلة", he: "שם משפחה",
					validation: /^.{2,}$/,
					required: true
				},
				{
					name: "phone", type: "tel", ar: "رقم الهاتف", he: "טלפון",
					validation: /^[+]*[(]?[0-9]{1,4}[)]?[-\s./0-9]{5,}$/
				},
				{
					name: "residency", type: "select", ar: "البلد", he: "עיר",
					validation: /^.{2,}$/,
					required: true
				},
				{
					name: "email", type: "email", ar: "البريد الإلكتروني", he: "אימייל", postOnTab: true,
					validation: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
				},
				{
					name: "comments", type: "text", ar: "הערות", he: "הערות", margin: "true", postOnTab: true,
				},
			],
			profileDataLists: [
				{field:"residency", data:[]}
			],
			eventData: {},
			selectedRowIndex: 0,
			scanId: props.url.query.contactScan ? props.url.query.contactScan: "",
			displayTyperForm: false,
			displayScanUploadForm: false,
			displayLoadingMessage: true,
			scanUrl: null,
			fullyTyped: false,
			displayFullyTypedPopup: false,
			postAttempted: false, //toggled once the "post" button is pressed. If true, invalid fields will be highlighted
			postInProcess: false,
			unsaved: false
		};
	};
	refreshHandler = function() {
		if(this.state.unsaved)
			return "You Have Unsaved Data - Are You Sure You Want To Quit?";
	}.bind(this);
	componentDidMount() {
		this.fetchCities();
		this.setState({activists:[this.generateRow()]}, ()=>{this.getContactsScan();});
		this.ActivistFieldsValidation = new FieldValidation();
		this.ActivistFieldsValidation.setFields(this.state.profileFields.slice());
		//confirm exit without saving
		window.onbeforeunload = this.refreshHandler;
	}
	fetchCities(){
		server.get('cities/', {})
			.then(json => {
				let dataLists = this.state.profileDataLists.slice();
				for(let i=0; i<dataLists.length; i++){
					if(dataLists[i].field === "residency")
						dataLists[i].data = json.map((city)=>{
							return city.name;
						});
				}
				this.setState({profileDataLists: dataLists})
			});
	}
	getContactsScan() {
		this.setState({displayLoadingMessage: true});
		server.get('contactScan?scanId='+this.state.scanId, {})
		.then(json => {
			this.setState({displayLoadingMessage: false});
			if(json.error)
			{
				if(json.error === "no pending scans are available")
					//request that the typer uploads a contact scan
					this.setState({displayScanUploadForm: true});
				return;
			}
			if(json.scanData)
			{
				const scanData = json.scanData;
				let eventData = json.eventData;
				const eventDate = new Date(eventData.eventDetails.date);
				eventData.eventDetails.date = eventDate.getFullYear()+"-"+eventDate.getMonth()+1+"-"+eventDate.getDate();
				this.setState({
					"scanUrl": scanData.scanUrl,
					"scanId": scanData._id,
					"eventData": eventData.eventDetails,
					"displayScanUploadForm": false,
					"displayTyperForm": true,
				});
				const callPingInterval = setInterval(this.pingScan.bind(this), this.scanPingIntervalDuration);
				// store interval promise in the state so it can be cancelled later:
				this.setState({callPingInterval: callPingInterval});
			}
			if(json.activists && json.activists.length)
			{
				const activists = json.activists.map((activist)=>{
					return this.generateRow(activist, true, true);
				});
				this.setState({"activists":activists}, ()=>{
					this.addRow();
				});
			}
		});
	}
	pingScan(){
		if(!this.state.scanId)
			return;
		server.post('contactScan/pingScan', {
			'scanId': this.state.scanId
		})
		.then(json => {
		});
	}

	handleScanUpload = function(scanId){
		this.setState({scanId: scanId}, ()=>{
			this.getContactsScan();
		})
	}.bind(this);

	//this function generates a new row template
	generateRow = function(data = {}, locked = false, saved = false){
		let row = data;
		const fields = this.state.profileFields;
		for(let i = 0; i<fields.length; i++){
			row[fields[i].name] = data[fields[i].name] || "";
			row[fields[i].name + "Valid"] = saved || !fields[i].validation;
		}
		row.scanRow = data["scanRow"] || 0;
		row.locked = locked;
		row.saved = saved;
		return row;
	}.bind(this);

	addRow = function() {
		let activists = this.state.activists.slice();
		const rows = activists.map(activist => activist.scanRow);
		//generally, the new row should correspond to the n[th] line of the scan, if there are already n-1 rows
		let nextScanRow = rows.length;
		for(let i=0; i < rows.length; i++){
			//however, if we skipped some scanned line, which can happen if we delete a row, we should add it in instead
			if(i < rows[i]){
				nextScanRow = i;
				break;
			}
		}
		activists.push(this.generateRow({scanRow: nextScanRow}));
		//if a row was added in the middle, sort it into position
		activists.sort((a, b)=>(a.scanRow - b.scanRow));
		//assignment into state is done in two explicit stages, in order to keep the focus on the correct row
		//it still doesn't work most of the time
		//not important enough to find a fix, though
		this.setState({activists: activists}, ()=>{this.setState({selectedRowIndex: nextScanRow})});
	}.bind(this);
	
	handleRowFocus = function(rowIndex) {
		this.setState({selectedRowIndex: rowIndex});
	}.bind(this);
	
	handleTypedInput = function (name, value, rowIndex){
		let activists = this.state.activists.slice();
		activists[rowIndex][name] = value;
		activists[rowIndex][name + "Valid"] = this.ActivistFieldsValidation.validate(value, name);
		this.setState({activists: activists, unsaved: true});
	}.bind(this);
	
	selectScanRow = function(index){
		if(index>=this.state.activists.length){
			this.addRow();
		}
		else{
			this.setState({selectedRowIndex: index});
		}
	}.bind(this);
	
	handleRowPost = function(rowIndex){
		let activists = this.state.activists.slice();
		if(rowIndex === activists.length-1)
			this.addRow();
		else
		{
			this.setState({selectedRowIndex:rowIndex+1});
		}
	}.bind(this);

	handleRowDeletion = function(index){
		let activists = this.state.activists.slice();
		//remove the appropriate row from the activists array
		activists.splice(Number(index), 1);
		//decrease selected row index if necessary
		let selectedRowIndex = this.state.selectedRowIndex;
		if(selectedRowIndex >= index){
			selectedRowIndex = selectedRowIndex === 0 ? selectedRowIndex : (selectedRowIndex-1);
		}
		//if no rows are left, create a new one
		if(!activists.length) {
			activists = [this.state.generateRow()];
		}
		//commit to state
		this.setState({activists: activists, selectedRowIndex:selectedRowIndex});
	}.bind(this);

	handleRowEditToggle = function(index){
		let activists = this.state.activists.slice();
		activists[index].locked = !activists[index].locked;
		this.setState({activists: activists});
	}.bind(this);

	handlePost = function(){
		const activists = this.state.activists.slice();
		if(!this.ActivistFieldsValidation.validateAll(activists)){
			this.setState({postAttempted: true});
			return;
		}
		this.checkFullyTyped();
	}.bind(this);

	checkFullyTyped = function(){
		const checkNeeded = this.state.scanId;
		if(checkNeeded){
			this.setState({displayFullyTypedPopup: true});
		}
		else{
			this.postData();
		}
	}.bind(this);

	setFullyTyped = function(isFullyTyped){
		this.setState({fullyTyped: isFullyTyped}, () => {
			this.postData();
		})
	}.bind(this);

	postData = function(){
		//safety measure to prevent the same data getting posted multiple times when the post button is repeatedly pressed
		if(this.state.postInProcess)
			return;
		this.setState({postInProcess: true});
		const activists = this.state.activists.slice();
		if(!this.ActivistFieldsValidation.validateAll(activists)){
			this.setState({postAttempted: true});
			return;
		}
		const data ={
			"activists": activists,
			"scanId": this.state.scanId,
			"markedDone": this.state.fullyTyped
		};
		server.post('activists/uploadTyped', data)
		.then(() => {
			this.setState({
				activists: [this.generateRow()],
				selectedRowIndex: 0,
				scanId: null,
				scanUrl: null,
				fullyTyped: false,
				displayFullyTypedPopup: false,
				postAttempted: false,
				postInProcess: false,
				unsaved: false
			});
			alert("the details have been stored in the system");
			this.getContactsScan();
		});
	}.bind(this);
	
	render() {
		const scanUrl = this.state.scanUrl;
		const selectedRowIndex = this.state.selectedRowIndex;
		const activists = this.state.activists;
		const eventData = this.state.eventData;
		const selectedScanRow = activists.length?activists[selectedRowIndex].scanRow:0;
		const typerFormTopBar = <React.Fragment>
			<div className={"event-details"}>
				<div>תאריך</div>
				<div>{eventData.date}</div>
			</div>
			<div className={"event-details"}>
				<div>ארוע ההחתמה</div>
				<div>{eventData.name}</div>
			</div>
			<div onClick={this.handlePost} className={"post-button"}>
				<div className={"post-button-label"}>
					<div>שלח</div>
					<div>ارسل</div>
				</div>
				<div className={"cloud-icon"}>
					<FontAwesomeIcon icon="cloud-upload-alt"/>
				</div>
			</div>
		</React.Fragment>;
		const scanUploaderFormTopBar = <div className={"event-details"}>
			העלאת תמונה
		</div>;
		const loadingTopBar = <div className={"event-details"}>
			טעינה...
		</div>;
		const topBar = <div dir="ltr">
			<TopNavBar justification={"space-between"}>
				{this.state.displayLoadingMessage?loadingTopBar:this.state.displayTyperForm?typerFormTopBar:scanUploaderFormTopBar}
			</TopNavBar>
		</div>;
		const scanDisplay = <ContactScanDisplay
			scanUrl={scanUrl}
			selectedRow={selectedScanRow}
			selectScanRow={this.selectScanRow}/>;
		const toggleFullyTypedPopup =
				<Popup visibility={this.state.displayFullyTypedPopup} toggleVisibility={()=>{this.setState({displayFullyTypedPopup: !this.state.displayFullyTypedPopup})}}>
					<div className="fully-typed-popup-label">
						<div>האם סיימת להקליד את כל הרשומות בדף?</div>
						<div>האם סיימת להקליד את כל הרשומות בדף?</div>
					</div>
					<div className="confirm-fully-typed-wrap">
						<button className="confirm-fully-typed" onClick={()=>{this.setFullyTyped(true)}}>סיימתי</button>
						<button className="confirm-fully-typed" onClick={()=>{this.setFullyTyped(false)}}>נותרו רשומות להקלדה</button>
					</div>
				</Popup>;
		const loadingMessage = <div>
			<h2>אנחנו מחפשים דפי קשר להקלדה...</h2>
			<h2>אנחנו מחפשים דפי קשר להקלדה...</h2>
		</div>;
		const typerForm = <div>
			{scanDisplay}
			<content>
				<TypedActivistsTable
					fields={this.state.profileFields}
					dataLists={this.state.profileDataLists}
					handleChange={this.handleTypedInput}
					handleRowPost={this.handleRowPost}
					handleRowFocus={this.handleRowFocus}
					handleRowDeletion={this.handleRowDeletion}
					handleRowEditToggle={this.handleRowEditToggle}
					activists={activists}
					selectedRow={selectedRowIndex}
					highlightInvalidFields={this.state.postAttempted}/>
			</content>
			{toggleFullyTypedPopup}
		</div>;
		const scanUploadForm = <div className={"scan-uploader-form-wrap"}>
			<div className={"scan-uploader-message"}>
				<h2>לא מצאנו דפי קשר במערכת - תוכלו להעלות סריקה או תמונה של דף קשר</h2>
				<h2>לא מצאנו דפי קשר במערכת - תוכלו להעלות סריקה או תמונה של דף קשר</h2>
			</div>
			<ScanForm onPublish={this.handleScanUpload}/>
		</div>;
		return (
			<div dir="rtl">
				<Meta/>
				<style jsx global>{style}</style>
				{topBar}
				<section className="section">
					<div className="main-panel">
						{this.state.displayScanUploadForm?scanUploadForm:null}
						{this.state.displayTyperForm?typerForm:null}
						{this.state.displayLoadingMessage?loadingMessage:null}
					</div>
				</section>
			</div>
		)
	}
}

