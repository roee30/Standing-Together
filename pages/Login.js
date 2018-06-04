import React from 'react';
import Router from 'next/router';
import Meta from '../lib/meta';

import ItemService from '../services/ItemService';
import server from '../services/server';
import cookie from '../services/cookieManager';
import IdentificationField from './login/IdentificationField';
import CodeInput from './login/CodeInput';
import stylesheet from './login/Login.css';

export default class Login extends React.Component {

state = {
	lang: "he",
	phone: "",
	email: "",
	codeSent: false
};

validatePhone=function(phone){
	var length = phone.length>9;
	//strips the input string of all hyphens, parentheses, and white spaces
	var num = phone.replace(/([-()\+\s])/g, '');
	//checks that the result is composed entirely of digits, and is between 9 and 11 chars long.
	var digitsOnly = /^[0-9]{9,15}$/g.test(num);
	return length&&digitsOnly;
}
validateEmail(email){
	//checks for example@example.example, such that [example] doesn't contain a '@'
	var pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	return pattern;
}
identifyByPhone(phone){
	server.post('identify/phone', {'phone':phone})
	.then(json => {
		this.setState({codeSent: true, indetificationMethod: "SMS", phone: phone});
	});
}
identifyByEmail(email){
	server.post('identify/email', {'email':email})
	.then(json => {
		this.setState({codeSent: true, indetificationMethod: "Email", email: email});
	});
}

verifyLoginCode(code)
{
	var method = this.state.indetificationMethod=="Email"?"login/email":"login/phone";
	var data ={'phone':this.state.phone, 'email':this.state.email, 'code':code};
	server.post(method, data)
	.then(json => {
		if(json.error)
		{
			alert(json.error);
		}
		if(json.token)
		{
			cookie.setCookie('token', json.token, 150);
			Router.push({pathname: '/Organizer'});
		}
		else
		{
			this.setState({codeSent: false, indetificationMethod: ""});
		}
	});
}

render() {
	const dictionary = {
		"he":{
			"smsAuthentication":"אימות באמצעות SMS",
			"emailAuthentication":"אימות באמצעות Email",
			"inputCode":"הזינו את הקוד שנשלח אליכם ב-"
		},
		"ar":{
			"smsAuthentication":"authenticate via SMS",
			"emailAuthentication":"authenticate via Email"
		}
	};
	const vocabulary = dictionary[this.state.lang];
	/**Stage 1 - Verification Method Selection**/
	const identification = 
		<div>
			<IdentificationField
				dir="ltr" inputType="tel" minLength="9" maxLength="15"
				placeholder={vocabulary["smsAuthentication"]}
				validationFunction={this.validatePhone}
				identificationFunction={this.identifyByPhone.bind(this)}
			/>
			<IdentificationField
				dir="ltr" inputType="email" minLength="5" maxLength="100"
				placeholder={vocabulary["emailAuthentication"]}
				validationFunction={this.validateEmail}
				identificationFunction={this.identifyByEmail.bind(this)}
			/>
		</div>;
	/**Stage 2 - Login Code Input**/
	const loginCode =
		<div>
			<br/>
			<div className='code-input-title'>
				{vocabulary.inputCode+" "+this.state.indetificationMethod}
			</div>
			<br/>
			<CodeInput verificationFunction={this.verifyLoginCode.bind(this)}/>
		</div>;
	return (
		<div className='login-page-wrap' dir="rtl">
			<Meta/>
			<style jsx global>{stylesheet}</style>
			<img src="../static/Logo.svg" className='logo'></img>
			{this.state.codeSent?loginCode:identification}
		</div>
	)
}

}

