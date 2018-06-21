import React from 'react';
import styles from './Thead.css'
import fontawesome from '@fortawesome/fontawesome'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import { faBuilding, faEnvelopeOpen, faPhone, faUser } from '@fortawesome/fontawesome-free-solid'
fontawesome.library.add(faBuilding);
fontawesome.library.add(faEnvelopeOpen);
fontawesome.library.add(faPhone);
fontawesome.library.add(faUser);


export default class Thead extends React.Component {
    render() {
      return (
        <div style={styles.row_title}>
            
            <div style={styles.rtl}>
                <h4 style={styles.heading_hb}>טלפון<br/>رقم الهاتف</h4>
                
            </div>
            <div style={styles.rtl}>
                <h4 style={styles.heading_hb}>עיר<br/>البلد</h4>
                
            </div>
            <div style={styles.rtl}>
                <h4 style={styles.heading_hb}>שם משפחה<br/>اسم العائلة</h4>
                
            </div>
            <div style={styles.rtl}>
                <h4 style={styles.heading_hb}>שם פרטי<br/>الاسم الشخصي</h4>
                {/*<div style={styles.awsome_hb_low}><FontAwesomeIcon icon="user"></FontAwesomeIcon></div>*/}
            </div>
      </div>
      );
    }
  }
  