import css from 'styled-jsx/css'
export default css`
    .input-fields-container{
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: space-between;
    }
    @media only screen and (max-device-width: 480px){
        .input-wrap{
            width: 100% !important;
        }   
    }
    .input-wrap{
        margin: 0.25%;
        width: 100%;
    }
    input.input-field{
        width: 100%;
        box-shadow: 0px 3px 10px 1px rgba(0,0,0,0.12);
        transition: box-shadow 0.3s;
        border-radius: 4px;
        font: normal normal normal 15px/1.4em arial,'ｍｓ ｐゴシック','ms pgothic','돋움',dotum,helvetica,sans-serif;
        -webkit-appearance: none;
        -moz-appearance: none;
        border-width: 0;
        background-color: rgba(255, 255, 255, 1);
        box-sizing: border-box !important;
        color: #000000;
        border-style: solid;
        border-color: rgba(232, 232, 232, 1);
        outline: none;
        padding: 3px 10px;
        margin: 0.75em 0.5em;
        padding: 0.7em 0.5em;
        max-width: 100%;
        -webkit-box-flex: 1;
        -webkit-flex: 1;
        flex: 1;
        text-overflow: ellipsis;
    }
    input.input-field:focus{
        box-shadow: 0px 3.5px 12px 1px rgba(0,0,0,0.25);
    }
	.highlight-invalid-fields .invalid .input-field{
        background-color: rgb(255, 150, 160);
    }
`