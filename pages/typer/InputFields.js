import React from 'react';
import styles from './InputFields.css'
import Title from './Title'


export default class InputFields extends React.Component {
    render() {
      return (
        <div>
        <div style={styles.input_fields}>
            <div style={styles.row_copy}>
                 <Title title={"עיר"} icon={"building"}></Title>
                 <input style={styles.table_copy} id="city">
                 </input>   
            </div>
                  
            <div style={styles.row_copy}>
                 <Title title={"שם משפחה"} icon={"user"}></Title>  
                 <input style={styles.table_copy} id="lastName">
                 </input>
            </div>
            <div style={styles.row_copy}>
                 <Title title={"שם"} icon={"user"}></Title>
                 <input style={styles.table_copy} id="firstName">
                 </input>
            </div>
          </div>
          <div style={styles.input_fields}>
          <div style={styles.row_copy}>
                 <Title title={"מייל"} icon={"envelope-open"}></Title>
                  <input style={styles.table_copy} id="mail">
                  </input>
            </div>
            <div style={styles.row_copy}>
                    <Title title={"טלפון"} icon={"phone"}></Title>
                    <input style={styles.table_copy} id="phNo" onKeyPress={this._handleKeyPress}>
                    </input>
            </div>
                </div>
                </div>
            
   
      );
    }
  }
  