import React from "react";
import style from "./voting/Voting.css";
import Meta from "../lib/meta";
import server from "../services/server";
import Modal from "react-modal";

const MAX_VOTES = 1;

export default class Voting extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            candidates: [],
            selected: [],
            finishedSelecting: false,
            code: "",
            openPopup: false
        };

        server.get("candidates/fetchCandidates", {}).then(candidates => {
            if (candidates.length) this.setState({candidates});
        });

        // this.selectCandidate = this.selectCandidate.bind(this);
        this.generateCandidate = this.generateCandidate.bind(this);
        this.validateCode = this.validateCode.bind(this);
    }

    selectCandidate(id) {
        let selected = this.state.selected;
        let finishedSelecting = selected.length === MAX_VOTES;
        if (selected.includes(id)) {
            selected = selected.filter(index => index !== id);
        } else if (!finishedSelecting) {
            selected.push(id);
        }
        finishedSelecting = selected.length === MAX_VOTES;
        this.setState({selected, finishedSelecting});
    }

    validateCode() {
        server
            .post("candidates/validateCode", {
                code: this.state.code
            })
            .then(isValid => {
                if (isValid) {
                    alert("כן! אפשר להצביע");
                } else {
                    alert("המון תודה על ההתלהבות, אבל כבר הצבעת");
                }
            });
    }

    handleSubmitVote() {
        this.setState({openPopup: true});
    }

    handleEventPopupToggle() {
        let openPopup = this.state.openPopup;
        this.setState({openPopup: !openPopup});
    }

    sendVote() {
        server
            .post("candidates/placeVote", {
                votes: this.state.selected,
                code: this.state.code
            })
            .then(res => {
                if (res) {
                    alert("תודה רבה על ההצבעה!");
                } else {
                    alert("הקוד שלך כבר לא תקף. ההצבעה לא נקלטה");
                }
                this.setState({
                    selected: [],
                    finishedSelecting: false,
                    code: "",
                    openPopup: false
                });
            });
    }

    generateCandidate(candidate) {
        const isSelected = this.state.selected.includes(candidate._id);
        const selectedClass = isSelected ? "selected" : "";
        const finishedSelecting = this.state.finishedSelecting;
        const isDisabled = finishedSelecting && !isSelected;
        const disabledClass = isDisabled ? "disabled" : "";

        return (
            <div className={"candidate " + selectedClass + disabledClass}
                key={candidate._id}>
                <div className="candidate_picture" style={{backgroundImage: `url(${candidate.photo})`}}/>
                <div className={"candidate_details " + selectedClass + disabledClass}>
                    <div className="candidate_name">
                        <span className="candidate_name_lang">{candidate.firstName + " " + candidate.lastName}</span>
                        <span className="candidate_name_lang">{candidate.firstNameAr + " " + candidate.lastNameAr}</span>
                    </div>
                    <div className="candidate_circle">{candidate.circle}</div>
                </div>
                <div className={"candidate-selection-wrap"}>
                    <label htmlFor={"select-candidate-" + candidate._id} className="candidate-selection-label">
                        בחירה
                    </label>
                    <input
                        type="button"
                        className={"candidate-selection-button " + selectedClass + disabledClass}
                        id={"select-candidate-" + candidate._id}
                        value = {isSelected ? "✔" : ""}
                        onClick={this.selectCandidate.bind(this, candidate._id)}
                    >
                    </input>
                </div>
                {/**<div>
                    <div className="p-4 bg-white p-relative">
                        <div className="line-height-15 mb-0">
                            <div className="candidate_description">
                                <p>{candidate.text1}</p>
                                <p>{candidate.text2}</p>
                            </div>
                        </div>
                    </div>
                </div>**/}
            </div>
        );
    }

    render() {
        return (
            <div className="page">
                <Meta/>
                <style jsx global>
                    {style}
                </style>
                <img src={"./static/logo_purple.svg"} width={250} className={"voting-logo"}/>
                <h1 className="voting-title">
                    {"בחירות לצוות התיאום הארצי של תנועת עומדים ביחד"}
                </h1>
                <h1 className="voting-title">
                    {"انتخابات لطاقم التنسيق القطريّ لحراك نقف معًا"}
                </h1>
                <h3 className="introduction-paragraph">
                    {"ההנהגה הארצית מורכבת משני גופים: צוות התיאום הארצי והמזכירות. צוות התיאום הארצי הוא גוף רחב, הנפגש אחת לחודשיים ומורכב מנציגים מהמעגלים המקומיים של התנועה וכן מ-25 נציגים שנבחרים בבחירות ישירות וחשאיות באסיפה הארצית. תפקידו לייצג את החברים והחברות בתנועה במהלך השנה, להתוות אסטרטגיה ארוכת טווח לתנועה, הכוללת קביעת סדרי עדיפויות והחלטה על קמפיינים יזומים ארוכי-טווח, ולבקר את עבודת המזכירות. מזכירות התנועה הוא גוף מצומצם אשר נבחר מתוך צוות התיאום הארצי, במטרה להוציא אל הפועל את האסטרטגיה התנועתית ולנהל את התנועה ברמה היומיומית. "}
                </h3>
                <h3 className="introduction-paragraph">
                    {"تتكون القيادة القطرية من جسمين: طاقم التنسيق القطري والسكرتارية. طاقم التنسيق القطري هو جسم واسع يلتقي أعضاؤه كل شهرين ويتألف من ممثلين وممثلات عن الحلقات المحلية للحراك، بالإضافة إلى ٢٥ ممثلاً وممثلة منتخبون ومنتخبات بانتخابات مباشرة وسرية في الاجتماع القطري. يهدف طاقم التنسيق القطري لتمثيل أعضاء الحراك خلال العام، بناء استراتيجية طويلة الأمد للحراك - تشمل تحديد وترتيب الأولويات واتخاذ القرارات بشأن الحملات طويلة الأمد التي يبادر لها الحراك - والإشراف على عمل السكرتارية. سكرتارية الحراك هي جسم مصغّر منتخَب من طاقم التنسيق القطري، من أجل تنفيذ استراتيجية الحراك وإدارته على أساس يومي."}
                </h3>
                <div className="code_validation">
                    <form className="form">
                        <div className="code-input-wrap">
                        <label htmlFor="code-input" className="code-input-label">
                            קוד הצבעה إلينا:
                        </label>
                        <input
                            type="text"
                            name="code"
                            placeholder={"123456"}
                            className="code_input"
                            id="code-input"
                            maxLength="6"
                            size="8"
                            value = {this.state.code}
                            onChange={e => this.setState({code: e.target.value})}
                        />
                        </div>
                        <input
                            type="button"
                            id=""
                            value="האם הקוד שלי תקף? انضموا إلينا?"
                            className="code_button"
                            onClick={this.validateCode}
                        />
                    </form>
                </div>
                <div className="candidates">
                    {this.state.candidates.map(this.generateCandidate)}
                </div>
                <div className="center-content">
                    <input
                        className="vote_button"
                        type="submit"
                        value="סיימתי! انضموا إلينا"
                        onClick={this.handleSubmitVote.bind(this)}
                    />
                </div>
                <Modal
                    isOpen={this.state.openPopup}
                    onRequestClose={this.handleEventPopupToggle.bind(this)}
                    ariaHideApp={false}
                    style={{
                        overlay: {
                            backgroundColor: "rgba(60,60,60,0.8)"
                        },
                        content: {
                            height: "max-content"
                        }
                    }}
                >
                    <div>
                        <button onClick={this.handleEventPopupToggle.bind(this)} className={"close-popup-button"}>
                            ⬅
                        </button>
                        <h3 className="hebrew">
                            {
                                "אני פופ אפ חברותי שמוודא שהלחיצה הייתה בכוונה. פשוט אי אפשר לתקן לאחר האישור"
                            }
                        </h3>
                        <button className="code_button" onClick={this.sendVote.bind(this)}>
                            {"כן כן, זו ההצבעה שאני רוצה"}
                        </button>
                    </div>
                </Modal>
            </div>
        );
    }
}